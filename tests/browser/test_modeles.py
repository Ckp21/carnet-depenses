import asyncio, json, os, re, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
boot = boot_frozen
norm=lambda s:s.replace('\u202f',' ').replace('\u00a0',' ')
async def main():
  srv=start_server()
  try:
   async with async_playwright() as p:
    b=await p.chromium.launch()
    ctx,page=await boot(b,seed)
    await page.click('[data-tab=plan]'); await page.wait_for_timeout(200)
    await page.click('summary:has-text("Partir d\'un modèle local")')
    check('6 modèles proposés',await page.locator('[data-tpl]').count()==6)
    # terrain
    await page.click('[data-tpl=terrain]'); await page.wait_for_timeout(100)
    await page.fill('#tp-price','1 800 000'); await page.fill('#tp-n','12'); await page.wait_for_timeout(100)
    prev=norm(await page.inner_text('#tp-prev')); print(prev)
    check('aperçu tranche',('150 000' in prev) and '12 tranches' in prev,prev)
    check('espaces de milliers appliqués',await page.input_value('#tp-price')=='1 800 000')
    await page.click('[data-act=createTpl]'); await page.wait_for_timeout(300)
    pr=await page.evaluate("Object.values(D.plans).find(p=>p.data&&p.data.tpl==='terrain')")
    check('projet terrain créé',bool(pr) and pr['amount']==1800000 and pr['data']['tranches']==12 and pr['name']=='Terrain par tranches',pr)
    check('échéance dans 12 mois',pr['data']['due']=='2027-10-13',pr['data'])
    txt=norm(await page.inner_text('main')); check('tranche affichée dans la fiche','Tranche prévue' in txt and '150 000' in txt)
    check('effort mensuel calculé',await page.evaluate("planStats(Object.values(D.plans).find(p=>p.data&&p.data.tpl==='terrain')).monthly")>0)
    # rentrée scolaire : date par défaut = 1er octobre prochain
    await page.click('summary:has-text("Partir d\'un modèle local")') if not await page.evaluate("document.querySelector('details[data-keep=topen]').open") else None
    await page.click('[data-tpl=ecole]'); await page.wait_for_timeout(100)
    check('date par défaut 2027-10-01',await page.input_value('#tp-due')=='2027-10-01')
    await page.fill('#tp-per','120000'); await page.fill('#tp-kids','3'); await page.wait_for_timeout(100)
    prev=norm(await page.inner_text('#tp-prev')); check('aperçu rentrée = 360 000',('360 000' in prev),prev)
    await page.click('[data-act=createTpl]'); await page.wait_for_timeout(300)
    e=await page.evaluate("Object.values(D.plans).find(p=>p.data&&p.data.tpl==='ecole')"); check('rentrée créée 360 000',bool(e) and e['amount']==360000 and e['name']=='Rentrée scolaire 2027',e)
    # caution : 3 mois
    await page.click('summary:has-text("Partir d\'un modèle local")') if not await page.evaluate("document.querySelector('details[data-keep=topen]').open") else None
    await page.click('[data-tpl=caution]'); await page.fill('#tp-rent','150000'); await page.click('[data-act=createTpl]'); await page.wait_for_timeout(300)
    c=await page.evaluate("Object.values(D.plans).find(p=>p.data&&p.data.tpl==='caution')"); check('caution = 3 × loyer',bool(c) and c['amount']==450000 and 'due' not in c['data'],c)
    # validations
    await page.click('summary:has-text("Partir d\'un modèle local")') if not await page.evaluate("document.querySelector('details[data-keep=topen]').open") else None
    await page.click('[data-tpl=fetes]'); await page.click('[data-act=createTpl]'); check('montant obligatoire',await page.is_visible('#tp-err'))
    await page.fill('#tp-amount','100000'); await page.fill('#tp-due','2020-01-01'); await page.click('[data-act=createTpl]'); check('date passée refusée',await page.is_visible('#tp-err') and 'à venir' in await page.inner_text('#tp-err'))
    await page.fill('#tp-due','2026-12-20'); await page.click('[data-act=createTpl]'); await page.wait_for_timeout(300)
    check('fêtes créées',await page.evaluate("Object.values(D.plans).some(p=>p.data&&p.data.tpl==='fetes'&&p.data.due==='2026-12-20')"))
    # synchro et reprise du jeu
    await page.wait_for_timeout(400)
    check('envoyés au serveur',await page.evaluate("window.__srv.plans.filter(p=>p.data&&p.data.tpl).length")==4)
    # versement sur un projet issu d'un modèle
    check('modèle utilisable dans Verser',await page.evaluate("plans('project').some(p=>p.data&&p.data.tpl==='terrain')"))
    check('aucune erreur',not page.errs,page.errs)
    await page.screenshot(path=OUT+'/modeles.png')
    await b.close()
  finally: srv.terminate()
  report()
asyncio.run(main())
sys.exit(1 if bad else 0)
