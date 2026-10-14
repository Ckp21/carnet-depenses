import asyncio, json, subprocess, time, re, copy
from playwright.async_api import async_playwright
import os, sys
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..')); T=HERE; FAKE=os.path.join(HERE,'fake-supabase.js'); FIX=os.path.join(HERE,'fixtures')
OUT=os.environ.get('TEST_OUT','/tmp/carnet-tests'); os.makedirs(OUT,exist_ok=True)
SNOOZE = '''try{localStorage.setItem('cd2-onb-snooze','"2999-01-01"')}catch(e){}'''
srv=subprocess.Popen(['python3','-m','http.server','8777','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
base=json.load(open(os.path.join(HERE,'seed.json')))
P='"><img src=x onerror=window.__x=1><b onmouseover=window.__x=1 x="'
def poison(seed,keep_dates):
    s=copy.deepcopy(seed)
    def pz(v,k):
        if isinstance(v,str):
            if k in('user_id',): return v
            if keep_dates and (k in('date','created_at','updated_at','last_month','opening_date') ): return v
            return P
        if isinstance(v,dict): return {kk:pz(vv,kk) for kk,vv in v.items()} | ({P:5} if k=='opening' else {})
        if isinstance(v,list): return [pz(x,k) for x in v]
        return v
    for t,rows in s.items():
        for r in rows:
            for k in list(r.keys()):
                if k=='id': 
                    r[k]=P+r[k] if not keep_dates else r[k]
                else: r[k]=pz(r[k],k)
    # un identifiant et des clés spéciales
    s['expenses'][0]['category']='constructor'; s['expenses'][1]['method']='__proto__'; s['moves'][0]['kind']='constructor'
    return s
res={}
async def run(b,name,seed):
    ctx=await b.new_context(viewport={'width':390,'height':844},service_workers='block')
    await ctx.add_init_script(f"if(!sessionStorage.getItem('srv'))sessionStorage.setItem('srv',{json.dumps(json.dumps(seed))});")
    await ctx.add_init_script(SNOOZE)
    page=await ctx.new_page(); errs=[]
    page.on('pageerror',lambda e:errs.append(str(e)[:90])); page.on('dialog',lambda d:(errs.append('DIALOG'),asyncio.ensure_future(d.dismiss())))
    await page.route('**/supabase.js',lambda r:r.fulfill(path=FAKE,content_type='application/javascript'))
    await page.route('**/config.js',lambda r:r.fulfill(body='window.CARNET_CONFIG={SUPABASE_URL:"https://x.supabase.co",SUPABASE_ANON_KEY:"k"}',content_type='application/javascript'))
    await page.goto('http://127.0.0.1:8777/index.html'); await page.wait_for_timeout(1200)
    for t in ['dash','list','accounts','plan','analyse','settings']:
        await page.click(f'[data-tab={t}]'); await page.wait_for_timeout(300)
    await page.click('[data-tab=list]'); await page.wait_for_timeout(200)
    n=0
    for sel in ['[data-edit]','[data-income]','[data-move]']:
        els=await page.query_selector_all(sel)
        for e in els[:4]:
            try: await e.click(timeout=1200); n+=1; await page.wait_for_timeout(100); await page.evaluate("document.getElementById('closeBtn')&&document.getElementById('closeBtn').click()")
            except Exception as ex: pass
    # SMS et export
    await page.evaluate("try{exportCSV('all')}catch(e){}"); 
    x=await page.evaluate("window.__x||0"); dom=await page.evaluate("document.querySelectorAll('img[src=x],[onmouseover],[onerror]').length")
    print(f"{name}: exécution={x} injections_DOM={dom} lignes_ouvertes={n} erreurs_JS={len(errs)}", errs[:3])
    res[name]=(x,dom,errs)
    await ctx.close()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    await run(b,'base empoisonnée (dates valides)',poison(base,True))
    await run(b,'base empoisonnée (tout)',poison(base,False))
    await b.close()
asyncio.run(main()); srv.terminate()
