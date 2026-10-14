import asyncio, json, os, re, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
boot = boot_frozen
async def main():
  srv=start_server()
  try:
   async with async_playwright() as p:
    b=await p.chromium.launch()
    hosts=set()
    ctx,page=None,None
    kw={'viewport':{'width':390,'height':844},'service_workers':'block'}
    ctx=await b.new_context(**kw); page=await ctx.new_page(); errs=[]
    page.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    page.on('request',lambda r:hosts.add(r.url.split('/')[2]))
    await page.route('**/supabase.js',lambda r:r.fulfill(path=FAKE,content_type='application/javascript'))
    await page.route('**/config.js',lambda r:r.fulfill(body='window.CARNET_CONFIG={SUPABASE_URL:"https://x.supabase.co",SUPABASE_ANON_KEY:"k"}',content_type='application/javascript'))
    await page.add_init_script(f"sessionStorage.setItem('srv',{json.dumps(seed)})")
    await page.goto(f'http://127.0.0.1:{PORT}/index.html'); await page.wait_for_timeout(1200)
    st=await page.evaluate("""async()=>{await document.fonts.ready;return {faces:[...document.fonts].map(f=>f.family+':'+f.status),ok:document.fonts.check('700 16px Montserrat'),fam:getComputedStyle(document.body).fontFamily}}""")
    print(st,hosts)
    check('Montserrat chargée en local',any('Montserrat:loaded' in f for f in st['faces']),st)
    check('aucun hôte externe',hosts=={'127.0.0.1:%d'%PORT},hosts)
    check('aucune erreur console',not errs,errs)
    csp=await page.evaluate("document.querySelector('meta[http-equiv=Content-Security-Policy]').content")
    check('CSP sans Google',('google' not in csp and "font-src 'self';" in csp),csp)
    # accents et signes utilisés par l'application
    glyph=await page.evaluate("""()=>{const c=document.createElement('canvas').getContext('2d');c.font='700 20px Montserrat';const w=s=>c.measureText(s).width;return ['é','è','à','ç','ô','œ','−','→','↑','€','’','·'].map(x=>[x,w(x)>0])}""")
    check('glyphes français présents',all(x[1] for x in glyph),glyph)
    await page.screenshot(path=OUT+'/fonts.png')
    await b.close()
  finally: srv.terminate()
  report()
asyncio.run(main())
sys.exit(1 if bad else 0)
