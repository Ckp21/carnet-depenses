import asyncio, json, os, re, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
boot = boot_frozen
import copy
async def main():
  srv=start_server()
  try:
   async with async_playwright() as p:
    b=await p.chromium.launch()
    base=json.loads(seed)
    # A : salaire reçu le 1er octobre, paie le 1er → prochain 1er novembre
    A=copy.deepcopy(base); A['settings'][0]['opening']['__cycle']={'day':1}; A['settings'][0]['opening']['banque']=2500000
    ctx,page=await boot(b,json.dumps(A))
    hero=(await page.inner_text('#hero')).lower()
    check('A accueil léger : horizon jusqu\'à la paie, 19 jours',"jusqu'à ta prochaine paie" in hero and '19 j' in hero and 'cycle de paie' not in (await page.inner_text('main')).lower(),hero[:300])
    await page.click('#moreBtn'); await page.wait_for_timeout(200)
    txt=await page.inner_text('main')
    check('A carte cycle visible (dans les détails)','cycle de paie' in txt.lower() and 'Salaire dans 19 jours' in txt,txt[:300])
    r=await page.evaluate("""()=>{const P=payInfo(),cash=liquid(),rate=dailyRate(),sc=payScenarios(P,cash,rate);return {P,cash,rate,hold:holdDays(cash,rate),n:sc.map(x=>x.n),per0:sc[0].per,exp0:(cash-committed(19))/19,c5:committed(5),c19:committed(19)}}""")
    print('A',r)
    check('A prochain salaire 2026-11-01',r['P']['next']=='2026-11-01' and r['P']['late']==0 and r['P']['wait']==19)
    check('A 4 scénarios 19/26/33/40',r['n']==[19,26,33,40],r['n'])
    check('A calcul par jour cohérent',abs(r['per0']-r['exp0'])<1)
    check('A loyer du 1er novembre compté sous 19 jours',r['c19']-r['c5']>=80000,(r['c5'],r['c19']))
    check('A jours tenables plausibles',r['hold'] is None or 0<=r['hold']<=90)
    check('A lignes de scénario affichées',await page.locator('section:has-text("Cycle de paie") .scn').count()==4)
    # discret
    await page.evaluate("LS.set('cd2-discreet',true);applyDiscreet();render()")
    t2=await page.inner_text('section:has-text("Cycle de paie")')
    check('A mode discret : aucun montant dans la carte',not re.search(r'\d[\d\s  ]*FCFA',t2),t2)
    await page.evaluate("LS.set('cd2-discreet',false);applyDiscreet();render()")
    # réglages
    await page.click('[data-tab=settings]'); await page.wait_for_timeout(150)
    await page.fill('#cy-day','31'); await page.click('[data-act=saveCycle]'); await page.wait_for_timeout(200)
    check('jour 31 refusé',await page.evaluate("payDay()")==1)
    await page.fill('#cy-day','25'); await page.click('[data-act=saveCycle]'); await page.wait_for_timeout(400)
    check('jour 25 enregistré',await page.evaluate("payDay()")==25 and await page.evaluate("window.__srv.settings[0].opening.__cycle.day")==25)
    check('config voisine intacte (soldes)',await page.evaluate("D.settings.opening.especes")==15000)
    await page.fill('#cy-day',''); await page.click('[data-act=saveCycle]'); await page.wait_for_timeout(300)
    check('cycle retiré',await page.evaluate("payDay()")==0)
    await page.click('[data-tab=dash]'); check('carte absente sans jour de paie','Cycle de paie' not in await page.inner_text('main'))
    check('A aucune erreur',[e for e in page.errs if 'TUNNEL' not in e]==[],page.errs); await ctx.close()
    # B : salaire d'octobre jamais arrivé
    B=copy.deepcopy(base); B['incomes']=[i for i in B['incomes'] if i['date']!='2026-10-01']; B['settings'][0]['opening']['__cycle']={'day':1}; B['settings'][0]['opening']['banque']=2500000
    ctx,page=await boot(b,json.dumps(B))
    check('B accueil : salaire en retard, calcul jusqu\'à la fin du mois',"salaire est en retard" in (await page.inner_text('#hero')).lower() and "jusqu'à la fin du mois" in (await page.inner_text('#hero')).lower())
    await page.click('#moreBtn'); await page.wait_for_timeout(200)
    txt=await page.inner_text('main')
    check('B retard détecté','Salaire en retard de 12 jours' in txt,txt[:200])
    r=await page.evaluate("""()=>{const P=payInfo(),cash=liquid(),rate=dailyRate(),sc=payScenarios(P,cash,rate);return {P,sc:sc.map(x=>[x.n,Math.round(x.per),x.state]),hold:holdDays(cash,rate),cash:Math.round(cash),rate:Math.round(rate)}}""")
    print('B',r)
    check('B scénarios 7/14/21/30',[x[0] for x in r['sc']]==[7,14,21,30])
    pers=[x[1] for x in r['sc']]; check('B montant par jour décroissant',all(pers[i]>=pers[i+1] for i in range(3)),pers)
    check('B conseil affiché','Pour tenir 14 jours' in txt or r['sc'][1][1]<=0,txt[-400:])
    await page.screenshot(path=OUT+'/cycle-retard.png')
    # le salaire arrive : l'alerte disparaît
    await page.click('#fab'); await page.click('#kindSeg [data-kind=income]'); await page.fill('#f-amount','400000'); await page.click('#f-save'); await page.wait_for_timeout(300)
    await page.click('[data-tab=dash]')
    check('B retard levé après saisie du salaire','en retard' not in await page.inner_text('main') and await page.evaluate("payInfo().next")=='2026-11-01')
    check('B aucune erreur',[e for e in page.errs if 'TUNNEL' not in e]==[],page.errs); await ctx.close()
    # C : pas de salaire du tout, jour de paie déjà passé ce mois → pas d'alerte de retard inventée
    C=copy.deepcopy(base); C['incomes']=[]; C['settings'][0]['opening']['__cycle']={'day':5}
    ctx,page=await boot(b,json.dumps(C))
    check('C sans salaire noté : pas de retard',await page.evaluate("payInfo().late")==0 and await page.evaluate("payInfo().next")=='2026-11-05')
    await ctx.close()
    # D : dernier salaire très ancien (oubli de saisie) → pas de retard absurde
    Dd=copy.deepcopy(base); Dd['incomes']=[i for i in Dd['incomes'] if i['date']=='2026-07-01']; Dd['settings'][0]['opening']['__cycle']={'day':1}
    ctx,page=await boot(b,json.dumps(Dd))
    check('D salaire ancien : repli sans retard énorme',await page.evaluate("payInfo().late")==0,await page.evaluate("JSON.stringify(payInfo())"))
    await ctx.close()
    await b.close()
  finally: srv.terminate()
  report()
asyncio.run(main())
sys.exit(1 if bad else 0)
