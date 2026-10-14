import asyncio, json, os, re, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
boot = boot_frozen
async def opencats(page):
    if not await page.evaluate("document.querySelector('details[data-keep=copen]').open"): await page.click('summary:has-text("Gérer mes catégories")')
async def main():
  srv=start_server()
  try:
   async with async_playwright() as p:
    b=await p.chromium.launch()
    ctx,page=await boot(b,seed)
    await page.click('[data-tab=settings]'); await page.wait_for_timeout(200)
    await opencats(page)
    check('suggestions visibles',await page.is_visible('[data-cpreset="0"]'))
    await page.click('[data-cpreset="0"]'); await page.wait_for_timeout(250)
    dime=await page.evaluate("Object.keys(CAT).find(k=>CAT[k].label==='Dîme et offrandes')")
    check('préréglage ajouté',bool(dime))
    check('envie par défaut',await page.evaluate(f"!NEED.has('{dime}')"))
    check('suggestion disparue',not await page.is_visible('[data-cpreset="0"]'))
    # catégorie personnalisée
    await page.click('[data-act=newCat]'); await page.fill('#cf-name','Scolarité Enzo'); await page.fill('#cf-words','enzo, ecole, cahiers')
    await page.click('input[name=cf-nat][value=besoin] + span'); await page.click('input[name=cf-color][value="#0891B2"] + span'); await page.click('[data-act=saveCat]'); await page.wait_for_timeout(250)
    sc=await page.evaluate("Object.keys(CAT).find(k=>CAT[k].label==='Scolarité Enzo')")
    check('catégorie créée',bool(sc))
    check('besoin enregistré',await page.evaluate(f"NEED.has('{sc}')"))
    check('couleur',await page.evaluate(f"CAT['{sc}'].color")=='#0891B2')
    # doublon refusé
    await page.click('[data-act=newCat]'); await page.fill('#cf-name','scolarité enzo'); await page.click('[data-act=saveCat]')
    check('doublon refusé',await page.is_visible('#cf-err')); await page.click('[data-act=cancelCat]')
    # synchro vers le serveur
    await page.wait_for_timeout(500)
    srv_cfg=await page.evaluate("(window.__srv.settings[0].opening.__cats||[]).map(c=>c.label)")
    check('envoyé au serveur',set(srv_cfg)>={'Dîme et offrandes','Scolarité Enzo'},srv_cfg)
    # saisie : proposition automatique
    await page.click('#fab'); await page.fill('#f-note','Dîme du dimanche'); await page.wait_for_timeout(500)
    check('chips contiennent les nouvelles catégories',await page.locator(f'input[name=cat][value="{dime}"]').count()==1)
    check('proposée à la saisie',await page.evaluate("document.querySelector('input[name=cat]:checked')?.value")==dime)
    await page.fill('#f-note','cahiers pour enzo'); await page.wait_for_timeout(500)
    check('mot-clé perso',await page.evaluate("document.querySelector('input[name=cat]:checked')?.value")==sc)
    check('nature suivie (besoin)',await page.evaluate("document.querySelector('input[name=nat]:checked')?.value")=='besoin')
    await page.fill('#f-amount','12000'); await page.click('#f-save'); await page.wait_for_timeout(300)
    check('dépense enregistrée dans la catégorie',await page.evaluate(f"Object.values(D.expenses).some(e=>e.category==='{sc}'&&e.amount===12000)"))
    # budget sur la catégorie puis archivage bloqué
    await page.click('[data-tab=plan]'); await page.wait_for_timeout(200)
    check('budget possible',await page.locator(f'#b-{sc}').count()==1)
    await page.fill(f'#b-{sc}','30000'); await page.click('[data-act=saveBud]'); await page.wait_for_timeout(250)
    await page.click('[data-tab=settings]'); await opencats(page); await page.click(f'[data-cedit="{sc}"]'); await page.click('[data-act=archiveCat]'); await page.wait_for_timeout(200)
    check('archivage refusé avec budget',await page.evaluate(f"!CAT['{sc}'].archived"))
    await page.click('[data-act=cancelCat]'); await page.click('[data-tab=plan]'); await page.fill(f'#b-{sc}',''); await page.click('[data-act=saveBud]'); await page.wait_for_timeout(250)
    await page.click('[data-tab=settings]'); await opencats(page); await page.click(f'[data-cedit="{sc}"]')
    await page.click('[data-act=archiveCat]'); await page.wait_for_timeout(150)
    check('confirmation demandée',await page.evaluate(f"!CAT['{sc}'].archived") and 'Confirmer' in await page.inner_text('[data-act=archiveCat]'))
    await page.click('[data-act=archiveCat]'); await page.wait_for_timeout(250)
    check('archivée',await page.evaluate(f"CAT['{sc}'].archived===true"))
    check('retirée des budgets',await page.evaluate(f"!CATS.some(c=>c[0]==='{sc}')"))
    # une dépense existante garde sa catégorie, étiquette archivée à l'édition
    eid=await page.evaluate(f"Object.values(D.expenses).find(e=>e.category==='{sc}').id")
    await page.click('[data-tab=list]'); await page.wait_for_timeout(200)
    txt=await page.inner_text('main'); check('filtre garde la catégorie archivée','Scolarité Enzo (archivée)' in txt)
    await page.evaluate(f"openSheet(D.expenses['{eid}'],'expense')"); await page.wait_for_timeout(150)
    check('puce archivée à l\'édition',await page.locator(f'input[name=cat][value="{sc}"]').count()==1 and await page.evaluate("document.querySelector('input[name=cat]:checked')?.value")==sc)
    await page.click('#closeBtn')
    await page.evaluate("openSheet(null,'expense')"); await page.wait_for_timeout(100)
    check('absente d\'une nouvelle saisie',await page.locator(f'input[name=cat][value="{sc}"]').count()==0)
    await page.click('#closeBtn')
    # renommer une catégorie de base
    await page.click('[data-tab=settings]'); await opencats(page); await page.click('[data-cedit=transport]')
    check('nature masquée pour les bases',await page.locator('input[name=cf-nat]').count()==0)
    await page.fill('#cf-name','Déplacements'); await page.click('[data-act=saveCat]'); await page.wait_for_timeout(250)
    check('renommée',await page.evaluate("CAT.transport.label")=='Déplacements')
    await page.click('[data-tab=plan]'); check('budgets affichent le nouveau nom','Déplacements' in await page.inner_text('main'))
    # archivage interdit pour une base : pas de bouton
    await page.click('[data-tab=settings]'); await opencats(page); await page.click('[data-cedit=alimentation]')
    check('pas d\'archivage pour une base',await page.locator('[data-act=archiveCat]').count()==0); await page.click('[data-act=cancelCat]')
    # export / import aller-retour
    r=await page.evaluate("""()=>{const data={app:'carnet-depenses',version:'2.1',expenses:Object.values(D.expenses),incomes:[],moves:[],plans:[],budgets:{},recurring:[],settings:D.settings};
      const out=parseBackup(JSON.stringify(data));const n=out.expenses.filter(e=>!CAT[e.category]).length;return {sc:out.expenses.filter(e=>e.category===%s).length,autres:out.expenses.filter(e=>e.category==='autres').length,cats:(out.settings.opening.__cats||[]).length}}"""%json.dumps(sc))
    check('import conserve les catégories perso',r['sc']>=1 and r['cats']>=2,r)
    # import vers une installation vierge : catégories inconnues retombent sur « Autres », sauf si fournies dans le fichier
    ctx2,page2=await boot(b,empty)
    r2=await page2.evaluate("""(txt)=>{const j=JSON.parse(txt);const a=parseBackup(txt);const nb=JSON.parse(txt);delete nb.settings.opening.__cats;const c=parseBackup(JSON.stringify(nb));return {avec:a.expenses.filter(e=>e.category.startsWith('c-')).length,sans:c.expenses.filter(e=>e.category.startsWith('c-')).length}}""",json.dumps({'app':'carnet-depenses','expenses':[{'id':'x1','amount':1000,'date':'2026-10-01','category':sc,'method':'especes'}],'settings':{'opening':{'__cats':[{'id':sc,'label':'Scolarité Enzo','color':'#0891B2','need':True,'words':['enzo']}]}}}))
    check('import neuf : catégorie fournie par le fichier',r2['avec']==1,r2)
    check('import neuf : sans définition → Autres',r2['sans']==0,r2)
    # fusion des réglages à l'import
    await page2.evaluate("D.settings.opening={__cats:[{id:'c-keep',label:'Gardée',color:'#7C3AED',need:false,words:[]}]}")
    m=await page2.evaluate("""()=>{const cur=D.settings.opening||{};const inc={__cats:[{id:'c-new',label:'Neuve',color:'#7C3AED',need:false,words:[]}]};return mergeById(cur.__cats,inc.__cats).map(c=>c.id)}""")
    check('fusion conserve l\'existant',m==['c-keep','c-new'],m)
    await ctx2.close()
    # erreurs JS
    check('aucune erreur de page',not page.errs,page.errs)
    await page.screenshot(path=OUT+'/cats.png')
    await b.close()
  finally: srv.terminate()
  report()
asyncio.run(main())
sys.exit(1 if bad else 0)
