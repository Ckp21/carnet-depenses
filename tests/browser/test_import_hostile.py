import asyncio, json, os, re, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
boot = boot_frozen
import json, copy, datetime, re
NOW=int(datetime.datetime(2026,10,13,10,0,0,tzinfo=datetime.timezone.utc).timestamp()*1000)
P='"><img src=x onerror=window.__pwn=1><b onmouseover=window.__pwn=1 x="'
S2='<script>window.__pwn=2</script>'
HOSTILE_CATS=[
 {'id':'ok1','label':P,'color':'red;background:url(javascript:alert(1))','need':True,'words':['(a+)+$','.*.*.*x','<img>','a'*500]+['mot%d'%i for i in range(200)],'archived':False},
 {'id':'__proto__','label':'proto','color':'#067C3A'},
 {'id':'constructor','label':'ctor','color':'#067C3A'},
 {'id':'toString','label':'ts','color':'#067C3A'},
 {'id':'a b<c>','label':'espace','color':'#067C3A'},
 {'id':'x'*300,'label':'long','color':'#067C3A'},
 {'id':'frais','label':'usurpation','color':'#067C3A'},
 {'id':'alimentation','label':S2,'color':'#067C3A'},
 {'id':'ok2','label':'=cmd|\' /C calc\'!A0','color':'#DB2777','need':False,'words':'pas une liste'},
 'chaine',None,42,[1,2],
 {'id':{'a':1},'label':'objet'},
]+[{'id':'bulk%d'%i,'label':'B%d'%i} for i in range(80)]
HOSTILE_OPENING={'especes':1000,'banque':50000,'__cats':HOSTILE_CATS,'__cycle':{'day':'<img src=x onerror=window.__pwn=3>'},'__rem':{'lead':'<b>','hour':99999,'amounts':{'a':1}},'__biens':[{'id':'b1','name':P,'value':1000}],'__proto__':{'polluted':1}}
async def visit(page,tabs=('dash','list','accounts','plan','analyse','settings')):
    for t in tabs:
        await page.click(f'[data-tab={t}]'); await page.wait_for_timeout(250)
async def main():
  srv=start_server()
  try:
   async with async_playwright() as p:
    b=await p.chromium.launch()
    sd=json.loads(seed)
    # ---- A. base de données empoisonnée (config, copies automatiques)
    sd['settings'][0]['opening']=json.loads(json.dumps(HOSTILE_OPENING).replace('"__proto__": {"polluted": 1}','"zz":1'))
    sd['settings'][0]['opening']['__proto__x']=1
    sd['expenses'].append({'id':'h1','amount':5000,'fee':0,'category':'ok1','method':'banque','date':'2026-10-06','note':P,'nature':None,'user_id':'u1'})
    sd['expenses'].append({'id':'h2','amount':5000,'fee':0,'category':'ok2','method':'banque','date':'2026-10-06','note':'=1+1','nature':None,'user_id':'u1'})
    sd['backups']=[{'id':P,'user_id':'u1','created_at':'2026-10-12T10:00:00Z','kind':P,'counts':{'expenses':'<b>9</b>','incomes':{'x':1},'plans':P},'payload':{'app':'carnet-depenses','version':'2.5.0','expenses':[{'id':'bx','amount':100,'category':'__proto__','method':'__proto__','date':'2026-10-01','note':P}],'incomes':[],'moves':[],'plans':[],'budgets':{},'recurring':[],'settings':{'opening':HOSTILE_OPENING,'savings_goal':'<x>'}}},
                   {'id':'bk-ok','user_id':'u1','created_at':'2026-10-11T10:00:00Z','kind':'auto','counts':{'expenses':3,'incomes':1,'plans':0},'payload':{'app':'carnet-depenses','version':'2.5.0','expenses':[{'id':'bx2','amount':100,'category':'__proto__','method':'__proto__','date':'2026-10-01','note':P}],'incomes':[],'moves':[],'plans':[],'budgets':{},'recurring':[],'settings':{'opening':HOSTILE_OPENING}}}]
    ctx,page=await boot(b,json.dumps(sd),now=NOW)
    await visit(page)
    pwn=lambda: page.evaluate("window.__pwn||0")
    dom=lambda: page.evaluate("document.querySelectorAll('img[src=x],[onmouseover],[onerror],script:not([src])').length")
    check('A. aucun code exécuté après visite des onglets',await pwn()==0)
    check('A. aucune balise injectée',await dom()==0)
    check('A. prototype intact',await page.evaluate("({}).polluted===undefined && Object.prototype.polluted===undefined"))
    cats=await page.evaluate("CATS.map(c=>c[0])")
    check('A. identifiants dangereux rejetés',not any(i in cats for i in ['__proto__','constructor','toString','a b<c>']) and all(len(i)<=100 for i in cats),cats)
    check('A. « frais » non usurpable',await page.evaluate("CAT.frais.label")=='Frais financiers')
    check('A. catégories limitées',await page.evaluate("CATS.length")<=11+20+1,await page.evaluate("CATS.length"))
    check('A. couleur piégée remplacée',await page.evaluate("CATS.every(c=>/^#[0-9A-Fa-f]{6}$/.test(c[2]))"))
    check('A. mots-clés bornés',await page.evaluate("Object.values(CUSTOM_WORDS).every(w=>w.length<=12&&w.every(x=>x.length<=24))"))
    # saisie avec devinette de catégorie sur un texte long (pas de blocage)
    await page.click('#fab'); t0=await page.evaluate("performance.now()")
    await page.fill('#f-note','a'*5000+' mot1 (a+)+$'); await page.wait_for_timeout(300)
    t1=await page.evaluate("performance.now()")
    check('A. devinette de catégorie rapide sur texte long',t1-t0<2500,t1-t0)
    await page.click('#closeBtn')
    # gestion des catégories
    await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
    if not await page.evaluate("S.copen"): await page.evaluate("S.copen=true;render()")
    await page.wait_for_timeout(300)
    n=await page.locator('[data-cedit]').count()
    for i in range(min(n,6)):
        try: await page.locator('[data-cedit]').nth(i).click(timeout=1500); await page.wait_for_timeout(120)
        except Exception: pass
    check('A. gestion des catégories sans exécution',await pwn()==0 and await dom()==0)
    await page.evaluate("S.cedit=null;render()")
    # modèles d'objectifs, rappels, cycle
    await page.click('[data-tab=plan]'); await page.wait_for_timeout(300)
    for sel in ['[data-tpl]']:
        for i in range(min(await page.locator(sel).count(),4)):
            try: await page.locator(sel).nth(i).click(timeout=1500); await page.wait_for_timeout(120)
            except Exception: pass
    check('A. modèles sans exécution',await pwn()==0 and await dom()==0)
    cfg=await page.evaluate("[cfgRem(),cfgCycle(),payInfo&&typeof payInfo]")
    check('A. rappels : valeurs de repli',cfg[0]=={'lead':1,'hour':8,'amounts':True} or cfg[0]['lead']==1 and cfg[0]['hour']==8,cfg)
    rem=await page.evaluate("buildReminders().map(r=>[r.id,r.title,r.body,r.fire_at])")
    check('A. rappels construits sans erreur',isinstance(rem,list))
    check('A. rappels : horaires valides',all(isinstance(r[3],str) and r[3][:4].isdigit() for r in rem),rem[:2])
    check('A. rappels : identifiants sûrs',all(__import__('re').match(r'^r-[A-Za-z0-9_.:-]{1,200}$',r[0]) for r in rem),[r[0] for r in rem][:3])
    # rapport avec données piégées
    await page.evaluate("openReport(curM())"); await page.wait_for_timeout(300)
    check('A. rapport sans exécution',await pwn()==0 and await dom()==0)
    rt=await page.inner_text('#report')
    check('A. rapport : libellé piégé en texte',('<img src=x' in rt) or ('<script>' in rt))
    await page.evaluate("closeReport()")
    # export CSV : formules neutralisées
    async with page.expect_download() as dl: await page.evaluate("exportCSV('all')")
    d=await dl.value; path=await d.path(); csv=open(path,encoding='utf-8-sig').read()
    bad=[l for l in csv.split('\r\n') if any(c.startswith(('"=','"+','"@','"-')) for c in l.split(';'))]
    check('A. CSV : aucune cellule ne commence par = + - @',not bad,bad[:2])
    check('A. CSV : formule neutralisée',"\"'=1+1\"" in csv or "\"'=cmd" in csv)
    # liste des copies et aperçu de restauration piégés
    await page.evaluate("bkList=null"); await page.click('[data-tab=dash]'); await page.click('[data-tab=settings]'); await page.wait_for_timeout(900)
    check('A. liste des copies sans exécution',await pwn()==0 and await dom()==0)
    rows=await page.locator('#bk-list [data-restore]').count()
    check('A. copies listées',rows>=2,rows)
    await page.locator('#bk-list [data-restore]').nth(1).click(); await page.wait_for_timeout(500)
    check('A. aperçu de restauration sans exécution',await pwn()==0 and await dom()==0)
    pend=await page.evaluate("pendingImport?{n:pendingImport.expenses.map(e=>[e.category,e.method]),op:Object.keys(pendingImport.settings&&pendingImport.settings.opening||{})}:null")
    check('A. restauration : catégorie et moyen ramenés à une valeur sûre',pend and all(c in ('autres',) or c in cats for c,m in pend['n']) and all(m!='__proto__' for c,m in pend['n']),pend)
    await page.evaluate("doImport()"); await page.wait_for_timeout(1200)
    check('A. restauration hostile : aucune exécution',await pwn()==0 and await dom()==0)
    srv_op=await page.evaluate("JSON.stringify((window.__srv.settings[0]||{}).opening||{})")
    o=json.loads(srv_op)
    ids=[c.get('id') for c in o.get('__cats',[])]
    check('A. restauration : identifiants de catégories sûrs côté serveur',all(isinstance(i,str) and re.match(r'^[A-Za-z0-9_.:-]{1,100}$',i) and i not in ('__proto__','constructor','toString') for i in ids),ids[:8])
    check('A. restauration : cycle de paie nettoyé',('__cycle' not in o) or isinstance(o['__cycle'].get('day'),int),o.get('__cycle'))
    check('A. restauration : rappels nettoyés',o.get('__rem',{}).get('amounts') in (True,False,None))
    check('A. restauration : clés inconnues retirées',not any(k in o for k in ('zz','__proto__x')),list(o.keys()))
    check('A. prototype intact après restauration',await page.evaluate("({}).polluted===undefined"))
    check('A. aucune erreur JS (poison)',[e for e in page.errs if 'TUNNEL' not in e]==[],page.errs[:3])
    await ctx.close()
    # ---- B. fichier de restauration hostile
    ctx,page=await boot(b,seed,now=NOW)
    hostile={'app':'carnet-depenses','version':'2.5.0','exportedAt':'2026-10-01T00:00:00Z',
             'expenses':[{'id':P,'amount':'<b>1</b>','category':'__proto__','method':'constructor','date':'2026-10-01','note':P},{'id':'okx','amount':1234,'category':'ok1','method':'banque','date':'2026-10-02','note':'x'},{'id':'neg','amount':-5,'category':'autres','method':'banque','date':'2026-10-02'},{'id':'baddate','amount':5,'category':'autres','method':'banque','date':'<script>'},{'id':'huge','amount':1e18,'category':'autres','method':'banque','date':'2026-10-02'}],
             'incomes':[],'moves':[{'id':'m1','kind':'constructor','amount':5,'date':'2026-10-01'}],'plans':[{'id':'p1','type':'<x>','name':P,'data':{'__proto__':{'polluted':1}}}],'budgets':{'__proto__':5,'alimentation':'<x>'},'recurring':[],
             'settings':{'opening':HOSTILE_OPENING,'savings_goal':'<x>'}}
    open(OUT+'/hostile.json','w').write(json.dumps(hostile))
    await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
    await page.set_input_files('#importFile',OUT+'/hostile.json'); await page.wait_for_timeout(600)
    prev=await page.evaluate("pendingImport?pendingImport.expenses.map(e=>({id:e.id,a:e.amount,c:e.category,m:e.method,d:e.date})):null")
    check('B. lignes invalides écartées',prev is not None and all(isinstance(e['a'],(int,float)) and 0<e['a']<=1e10 and __import__('re').match(r'^\d{4}-\d{2}-\d{2}$',e['d']) for e in prev),prev)
    check('B. identifiant piégé refusé',prev is not None and all(__import__('re').match(r'^[A-Za-z0-9_.:-]{1,100}$',e['id']) for e in prev),prev)
    check('B. aucune exécution (aperçu)',await pwn()==0 and await dom()==0)
    if await page.evaluate("!!pendingImport"):
        await page.evaluate("doImport()"); await page.wait_for_timeout(1200)
    check('B. aucune exécution (après import)',await pwn()==0 and await dom()==0)
    check('B. prototype intact',await page.evaluate("({}).polluted===undefined && Object.prototype.polluted===undefined"))
    await visit(page); await page.evaluate("openReport(curM())"); await page.wait_for_timeout(300)
    check('B. navigation après import sans exécution',await pwn()==0 and await dom()==0)
    # l'import ne supprime rien
    n=await page.evaluate("window.__srv.expenses.length")
    check('B. import : aucune suppression',n>=298,n)
    check('B. aucune erreur JS (fichier)',[e for e in page.errs if 'TUNNEL' not in e]==[],page.errs[:3])
    await ctx.close(); await b.close()
  finally:
    srv.terminate()
  report()
asyncio.run(main())
sys.exit(1 if bad else 0)
