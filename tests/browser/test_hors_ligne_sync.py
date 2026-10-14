import asyncio, json, os, re, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
boot = boot_frozen
import copy
async def wait_for(page,expr,ms=9000,step=300):
    t=0
    while t<ms:
        if await page.evaluate(expr): return True
        await page.wait_for_timeout(step); t+=step
    return False
async def main():
  srv=start_server()
  try:
   async with async_playwright() as p:
    b=await p.chromium.launch()
    # ---------- Synchronisation à la reconnexion
    ctx,page=await boot(b,seed)
    n0=await page.evaluate("window.__srv.expenses.length")
    await ctx.set_offline(True); await page.wait_for_timeout(200)
    for i in range(3):
        await page.click('#fab'); await page.fill('#f-amount',str(1000*(i+1))); await page.fill('#f-note',f'hors ligne {i}'); await page.check('input[name=cat][value=autres]',force=True); await page.click('#f-save'); await page.wait_for_timeout(200)
    check('3 envois en attente hors ligne',await page.evaluate("outbox.length")==3)
    check('indicateur hors ligne',('hors ligne' in await page.inner_text('#syncTxt')) and '3' in await page.inner_text('#syncTxt'),await page.inner_text('#syncTxt'))
    check('rien envoyé au serveur',await page.evaluate("window.__srv.expenses.length")==n0)
    check('saisies visibles localement',await page.evaluate("Object.values(D.expenses).filter(e=>/^hors ligne/.test(e.note)).length")==3)
    # rechargement de l'app hors ligne : la file survit
    await ctx.add_init_script("if(sessionStorage.getItem('failnet'))window.__fail={net:true,log:[]};")
    await page.evaluate("sessionStorage.setItem('failnet','1');window.__fail.net=true"); await ctx.set_offline(False); await page.wait_for_timeout(300)
    await page.reload(); await page.wait_for_timeout(1500)
    check('file conservée après rechargement',await page.evaluate("outbox.length")==3)
    await page.evaluate("sessionStorage.removeItem('failnet');window.__fail.net=false")
    ok=await wait_for(page,"outbox.length===0",8000)
    check('reconnexion : envoi automatique',ok)
    check('3 dépenses reçues par le serveur',await page.evaluate("window.__srv.expenses.length")==n0+3)
    check('indicateur synchronisé',('synchronisé' in await page.inner_text('#syncTxt')),await page.inner_text('#syncTxt'))
    # réseau capricieux : en ligne mais le serveur échoue, nouvel essai automatique
    await page.evaluate("window.__fail.net=true")
    await page.click('#fab'); await page.fill('#f-amount','7777'); await page.fill('#f-note','serveur en panne'); await page.check('input[name=cat][value=autres]',force=True); await page.click('#f-save'); await page.wait_for_timeout(500)
    check('échec : envoi conservé',await page.evaluate("outbox.length")==1)
    check('indicateur : nouvel essai annoncé',('nouvel essai' in await page.inner_text('#syncTxt')),await page.inner_text('#syncTxt'))
    check('incident mémorisé',bool(await page.evaluate("lastErr")))
    check('journal : échec enregistré',await page.evaluate("LS.get(K.synclog,[])[0].ok")==False)
    check('retryAt programmé',await page.evaluate("retryAt>Date.now()"))
    await page.evaluate("window.__fail.net=false")
    ok=await wait_for(page,"outbox.length===0",9000)
    check('nouvel essai automatique réussi (≈5 s)',ok)
    check('serveur à jour',await page.evaluate("window.__srv.expenses.some(e=>e.note==='serveur en panne')"))
    check('compteur de tentatives remis à zéro',await page.evaluate("retryN")==0)
    check('journal : succès enregistré',await page.evaluate("LS.get(K.synclog,[])[0].ok")==True)
    # appui sur l'indicateur
    await page.evaluate("window.__fail.net=true"); await page.click('#fab'); await page.fill('#f-amount','888'); await page.check('input[name=cat][value=autres]',force=True); await page.click('#f-save'); await page.wait_for_timeout(400)
    await page.evaluate("window.__fail.net=false"); await page.click('#sync'); await page.wait_for_timeout(900)
    check('appui sur l\'indicateur : relance immédiate',await page.evaluate("outbox.length")==0)
    # réglages : détail et journal
    await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
    txt=await page.inner_text('main'); check('réglages : version et dernière synchro',APP_VERSION in txt and 'Dernière synchronisation' in txt)
    check('réglages : journal visible',await page.locator('summary:has-text("Journal des synchronisations")').count()==1)
    # idempotence : un envoi rejoué ne crée pas de doublon
    n=await page.evaluate("window.__srv.expenses.length"); await page.evaluate("outbox.push({t:'expenses',op:'upsert',row:Object.assign({},D.expenses[Object.keys(D.expenses)[0]])});flush()"); await page.wait_for_timeout(500)
    check('envoi rejoué sans doublon',await page.evaluate("window.__srv.expenses.length")==n)
    # refus fatal : ne bloque pas la file
    await page.evaluate("outbox.push({t:'expenses',op:'upsert',row:{id:'x-bad'}});")
    check('aucune erreur (sync)',[e for e in page.errs if 'TUNNEL' not in e]==[],page.errs)
    await ctx.close()

    # ---------- Sauvegardes automatiques
    ctx,page=await boot(b,seed)
    ok=await wait_for(page,"window.__srv.backups.length>=1",5000); check('première copie automatique',ok)
    bk=await page.evaluate("window.__srv.backups[0]")
    check('copie complète et typée',bk['kind']=='auto' and bk['counts']['expenses']==298 and bk['payload']['app']=='carnet-depenses' and len(bk['payload']['expenses'])==298 and bk['payload']['version']==APP_VERSION,{k:v for k,v in bk.items() if k!='payload'})
    await page.evaluate("sync(true)"); await page.wait_for_timeout(800)
    check('pas de doublon sans changement',await page.evaluate("window.__srv.backups.length")==1)
    # changement + délai écoulé -> nouvelle copie
    await page.click('#fab'); await page.fill('#f-amount','4321'); await page.fill('#f-note','nouvelle dépense'); await page.check('input[name=cat][value=autres]',force=True); await page.click('#f-save'); await page.wait_for_timeout(700)
    check('délai de 20 h : pas de copie immédiate',await page.evaluate("window.__srv.backups.length")==1)
    await page.evaluate("LS.set(K.bkAt,Date.now()-21*3600e3);sync(true)"); await page.wait_for_timeout(1200)
    check('nouvelle copie après 20 h et changement',await page.evaluate("window.__srv.backups.length")==2)
    # copie seulement quand la file est vide
    await page.evaluate("LS.set(K.bkAt,0);window.__fail.net=true"); await page.click('#fab'); await page.fill('#f-amount','55'); await page.check('input[name=cat][value=autres]',force=True); await page.click('#f-save'); await page.wait_for_timeout(300); await page.evaluate("window.__fail.net=false")
    check('copie refusée tant que des envois attendent',await page.evaluate("autoBackup(false)")==False or await page.evaluate("outbox.length")==0)
    await wait_for(page,"outbox.length===0",9000)
    # liste dans Réglages
    await page.click('[data-tab=settings]'); await page.wait_for_timeout(900)
    rows=await page.locator('#bk-list [data-restore]').count(); check('liste des copies affichée',rows>=2,rows)
    # restauration : un élément supprimé revient, un élément récent reste
    victim=await page.evaluate("Object.values(D.expenses).find(e=>e.note==='nouvelle dépense'&&!e.recurring_id)?.id")
    first=await page.evaluate("window.__srv.backups.slice().sort((a,b)=>a.created_at<b.created_at?-1:1)[0].id")
    old_victim=await page.evaluate("Object.keys(D.expenses)[5]")
    await page.evaluate(f"mutate([{{t:'expenses',op:'delete',id:'{old_victim}'}}])"); await page.wait_for_timeout(500)
    check('suppression effective',await page.evaluate(f"!D.expenses['{old_victim}']"))
    await page.click('[data-tab=settings]'); await page.wait_for_timeout(500)
    await page.evaluate(f"restoreBackup('{first}')"); await page.wait_for_timeout(500)
    check('aperçu de restauration affiché',await page.is_visible('[data-act=doImport]') and 'aperçu de la restauration' in (await page.inner_text('main')).lower())
    before=await page.evaluate("Object.keys(D.expenses).length")
    await page.click('[data-act=doImport]'); await page.wait_for_timeout(1200)
    check('élément supprimé restauré',await page.evaluate(f"!!D.expenses['{old_victim}']"))
    check('rien n\'est supprimé par la restauration',await page.evaluate("Object.keys(D.expenses).length")>=before and await page.evaluate("Object.values(D.expenses).some(e=>e.note==='nouvelle dépense')"))
    check('serveur à jour après restauration',await page.evaluate(f"window.__srv.expenses.some(e=>e.id==='{old_victim}')"))
    # sauvegarde manuelle
    await page.click('[data-tab=settings]'); await page.wait_for_timeout(400)
    await page.click('[data-act=backupNow]'); await page.wait_for_timeout(1500)
    check('copie manuelle créée',await page.evaluate("window.__srv.backups.some(b=>b.kind==='manuel')"))
    check('aucune erreur (copies)',[e for e in page.errs if 'TUNNEL' not in e]==[],page.errs)
    # fichier téléchargé
    async with page.expect_download() as dl:
        await page.click('[data-act=exportJson]')
    d=await dl.value; path=await d.path(); data=json.load(open(path))
    check('fichier JSON : nom, version, contenu',d.suggested_filename.startswith('carnet-depenses-sauvegarde-') and data['version']==APP_VERSION and len(data['expenses'])>=298,d.suggested_filename)
    check('date du dernier fichier mémorisée',await page.evaluate("LS.get(K.fileBk,0)>0"))
    await ctx.close()

    # ---------- migration non exécutée : message, pas de plantage
    ctx,page=await boot(b,seed,extra_init="window.__fail={net:false,log:[],missing:['backups']};")
    await page.wait_for_timeout(800); await page.click('[data-tab=settings]'); await page.wait_for_timeout(700)
    txt=await page.inner_text('main'); check('copie auto : migration 2.5 demandée','migration-2.5' in txt,txt[:200])
    check('l\'app reste utilisable',await page.evaluate("Object.keys(D.expenses).length")>=298 and not page.errs)
    await ctx.close()

    # ---------- rappel de sauvegarde sur fichier
    ctx,page=await boot(b,seed,extra_init="localStorage.setItem('cd2-first-use',String(Date.now()-20*864e5));")
    await page.wait_for_timeout(400)
    check('rappel de sauvegarde sur fichier visible',await page.locator('section:has-text("Sauvegarde sur fichier")').count()==1)
    await page.click('[data-act=nudgeLater]'); await page.wait_for_timeout(200)
    check('« Plus tard » masque 14 jours',await page.locator('section:has-text("Sauvegarde sur fichier")').count()==0)
    await ctx.close()
    ctx,page=await boot(b,seed,extra_init="localStorage.setItem('cd2-first-use',String(Date.now()-3*864e5));")
    check('pas de rappel les premiers jours',await page.locator('section:has-text("Sauvegarde sur fichier")').count()==0)
    await ctx.close()
    await b.close()
  finally: srv.terminate()
  report()
asyncio.run(main())
sys.exit(1 if bad else 0)
