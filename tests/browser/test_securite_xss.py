import asyncio, json, subprocess, time, re
from playwright.async_api import async_playwright
import os, sys
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..')); T=HERE; FAKE=os.path.join(HERE,'fake-supabase.js'); FIX=os.path.join(HERE,'fixtures')
OUT=os.environ.get('TEST_OUT','/tmp/carnet-tests'); os.makedirs(OUT,exist_ok=True)
SNOOZE = '''try{localStorage.setItem('cd2-onb-snooze','"2999-01-01"')}catch(e){}'''
srv=subprocess.Popen(['python3','-m','http.server','8776','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
seed=open(os.path.join(HERE,'seed.json')).read()
empty=json.dumps({k:[] for k in ['expenses','incomes','recurring','moves','plans']}|{'budgets':[],'settings':[]})
ok=[];bad=[]
def check(n,c): (ok if c else bad).append(n)
async def boot(b,seedtxt):
    ctx=await b.new_context(viewport={'width':390,'height':844},service_workers='block',accept_downloads=True)
    await ctx.add_init_script(f"if(!sessionStorage.getItem('srv'))sessionStorage.setItem('srv',{json.dumps(seedtxt)});")
    await ctx.add_init_script(SNOOZE)
    page=await ctx.new_page(); page.errs=[]
    page.on('pageerror',lambda e:page.errs.append(str(e))); page.on('dialog',lambda d:(page.errs.append('DIALOG'),asyncio.ensure_future(d.dismiss())))
    await page.route('**/supabase.js',lambda r:r.fulfill(path=FAKE,content_type='application/javascript'))
    await page.route('**/config.js',lambda r:r.fulfill(body='window.CARNET_CONFIG={SUPABASE_URL:"https://x.supabase.co",SUPABASE_ANON_KEY:"k"}',content_type='application/javascript'))
    await page.goto('http://127.0.0.1:8776/index.html'); await page.wait_for_timeout(900)
    return ctx,page
async def geo(page):
    return await page.evaluate("""()=>{const r=s=>document.querySelector(s).getBoundingClientRect();const n=r('nav.tabs'),h=r('header.top'),f=r('#fab'),m=r('main');
      return {navBottom:Math.round(n.bottom),navTop:Math.round(n.top),hTop:Math.round(h.top),hBottom:Math.round(h.bottom),fabBottom:Math.round(f.bottom),vh:innerHeight,docScroll:document.scrollingElement.scrollHeight>innerHeight+1}}""")
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    # ---- structure fixe, jeu de données riche puis vide
    for label,sd in [('riche',seed),('vide',empty)]:
      ctx,page=await boot(b,sd); ref=None; same=True
      for t in ['dash','list','accounts','plan','analyse','settings']:
        await page.click(f'[data-tab={t}]'); await page.wait_for_timeout(250)
        g=await geo(page)
        if ref is None: ref=g
        same=same and g['navBottom']==g['vh'] and g['hTop']==0 and g['navTop']==ref['navTop'] and g['hBottom']==ref['hBottom'] and not g['docScroll']
        if t=='analyse': await page.screenshot(path=f'{OUT}/shell-{label}-analyse.png')
        if t=='accounts': await page.screenshot(path=f'{OUT}/shell-{label}-accounts.png')
      check(f'barre et en-tête fixes ({label})',same); print(label,ref)
      # défilement interne
      await page.click('[data-tab=list]'); await page.evaluate("document.getElementById('main').scrollTop=500"); await page.wait_for_timeout(150)
      g2=await geo(page); check(f'barre immobile après défilement ({label})',g2['navTop']==ref['navTop'] and g2['hTop']==0)
      await ctx.close()
    # ---- mode discret
    ctx,page=await boot(b,seed)
    await page.click('[data-act=toggleDiscreet]') if await page.is_visible('[data-act=toggleDiscreet]') else None
    for t in ['dash','list','accounts','analyse']:
      await page.click(f'[data-tab={t}]'); await page.wait_for_timeout(250)
      txt=await page.inner_text('main')
      leaks=re.findall(r'\d[\d\s  ]*\s?(?:FCFA|k\b|M\b)',txt)
      check(f'discret {t} sans montant',not leaks and ('****' in txt or '***' in txt or t=='plan'))
      if leaks: print('FUITE',t,leaks[:5])
    await page.screenshot(path=f'{OUT}/discret.png')
    await page.click('#fab'); await page.fill('#f-amount','1500'); amt=await page.input_value('#f-amount'); check('saisie visible en discret',amt=='1 500' or amt=='1500')
    await page.click('#closeBtn')
    await page.evaluate("LS.set('cd2-discreet',false);applyDiscreet();render()")
    txt=await page.inner_text('main'); check('montants revenus',bool(re.search(r'\d[\d\s  ]*FCFA',txt)))
    # ---- portefeuilles
    await page.click('[data-tab=accounts]'); await page.wait_for_timeout(200)
    await page.click('summary:has-text("Gérer mes portefeuilles")'); await page.click('[data-act=newWallet]'); await page.wait_for_timeout(150)
    await page.fill('#wf-name','Ecobank'); await page.click('input[name=wf-color][value="#7C3AED"] + span'); await page.select_option('#wf-kind','bank'); await page.fill('#wf-open','50000')
    await page.click('[data-act=saveWallet]'); await page.wait_for_timeout(300)
    wid=await page.evaluate("Object.keys(WAL).find(k=>WAL[k].label==='Ecobank')"); check('portefeuille créé',bool(wid))
    check('solde de départ',await page.evaluate(f"balance('{wid}')")==50000)
    check('dans les moyens',await page.evaluate(f"METHODS.some(m=>m[0]==='{wid}')"))
    await page.screenshot(path=f'{OUT}/wallets.png',full_page=False)
    # dépense avec ce portefeuille
    await page.click('#fab'); await page.fill('#f-amount','2000'); await page.click('input[name=cat] + span >> nth=0')
    await page.click(f'input[name=met][value="{wid}"] + span'); await page.click('#f-save'); await page.wait_for_timeout(300)
    check('solde après dépense',await page.evaluate(f"balance('{wid}')")==48000)
    # doublon refusé
    await page.click('[data-tab=accounts]'); await page.click('summary:has-text("Gérer mes portefeuilles")') if not await page.is_visible('[data-act=newWallet]') else None
    await page.click('[data-act=newWallet]'); await page.fill('#wf-name','ecobank'); await page.click('[data-act=saveWallet]'); await page.wait_for_timeout(150)
    check('doublon refusé',await page.is_visible('#wf-err'))
    await page.click('[data-act=cancelWallet]')
    # renommer Espèces
    await page.click('[data-wedit=especes]'); await page.fill('#wf-name','Cash poche'); await page.click('[data-act=saveWallet]'); await page.wait_for_timeout(250)
    check('renommage de base',await page.evaluate("WAL.especes.label")=='Cash poche')
    check('chips mises à jour',await page.evaluate("document.querySelector('#f-methods').innerText.includes('Cash poche')"))
    # archivage : refusé si solde
    await page.click(f'[data-wedit={wid}]'); await page.click('[data-act=archiveWallet]'); await page.wait_for_timeout(150)
    check('archivage refusé si solde',await page.evaluate(f"!WAL['{wid}'].archived"))
    await page.click('[data-act=cancelWallet]')
    # nouveau portefeuille vide -> archivage avec confirmation puis restauration
    await page.click('[data-act=newWallet]'); await page.fill('#wf-name','Tontine cash'); await page.click('[data-act=saveWallet]'); await page.wait_for_timeout(250)
    w2=await page.evaluate("Object.keys(WAL).find(k=>WAL[k].label==='Tontine cash')")
    await page.click(f'[data-wedit={w2}]'); await page.click('[data-act=archiveWallet]'); await page.wait_for_timeout(120)
    check('1er clic = confirmation',await page.evaluate(f"!WAL['{w2}'].archived"))
    await page.click('[data-act=archiveWallet]'); await page.wait_for_timeout(250)
    check('archivé',await page.evaluate(f"WAL['{w2}'].archived===true and !METHODS.some(m=>m[0]==='{w2}')".replace('and','&&')))
    await page.click(f'[data-wedit={w2}]'); await page.click('[data-act=archiveWallet]'); await page.wait_for_timeout(250)
    check('restauré',await page.evaluate(f"WAL['{w2}'].archived===false"))
    # soldes de départ conservent la config
    await page.click('summary:has-text("Soldes de départ")') if not await page.is_visible('[data-act=saveOpening]') else None
    await page.click('[data-act=saveOpening]'); await page.wait_for_timeout(250)
    check('config conservée après soldes',await page.evaluate("cfgWallets().length")>=3)
    # persistance côté serveur factice
    srv_state=await page.evaluate("window.__srv.settings[0].opening")
    check('enregistré en base',isinstance(srv_state.get('__wallets'),list) and any(w['label']=='Ecobank' for w in srv_state['__wallets']))
    # CSV
    async with page.expect_download() as dl: await page.evaluate("exportCSV('all')")
    d=await dl.value; await d.save_as(OUT+'/o.csv'); check('CSV avec libellé',('Ecobank' in open(OUT+'/o.csv',encoding='utf-8-sig').read()))
    # ---- import hostile avec portefeuilles piégés
    X='<img src=x onerror=window.__x=1>'
    bk={"app":"carnet-depenses","version":2,"expenses":[{"id":"z1","amount":100,"category":"autres","method":"w-evil","date":"2026-10-10","note":"n"}],
        "settings":{"savings_goal":0,"opening":{"__wallets":[{"id":"w-evil","label":X,"color":"red;background:url(x)","kind":"zzz"},{"id":"__proto__","label":"p","color":"#7C3AED"}],"w-evil":100},"opening_date":"2026-10-01"}}
    json.dump(bk,open(FIX+'/bk2.json','w'))
    await page.click('[data-tab=settings]'); await page.set_input_files('#importFile',FIX+'/bk2.json'); await page.wait_for_timeout(300)
    await page.click('[data-act=doImport]'); await page.wait_for_timeout(500)
    for t in ['dash','list','accounts','analyse','settings']: await page.click(f'[data-tab={t}]'); await page.wait_for_timeout(250)
    st=await page.evaluate("({x:window.__x||0,col:WAL['w-evil']&&WAL['w-evil'].color,kind:WAL['w-evil']&&WAL['w-evil'].kind,proto:('__proto__' in WAL)&&Object.keys(WAL).includes('__proto__')})")
    print('import hostile',st); check('étiquette piégée inerte',st['x']==0 and st['col']=='#64748B' and st['kind']=='other' and not st['proto'])
    check('aucune erreur JS',not page.errs); print('erreurs',page.errs[:3])
    await b.close()
asyncio.run(main()); srv.terminate()
print(len(ok),'réussis,',len(bad),'échecs')
for x in bad: print('  -',x)
sys.exit(1 if bad else 0)
