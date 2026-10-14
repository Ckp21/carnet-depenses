import asyncio, json, subprocess, time
from playwright.async_api import async_playwright
import os, sys
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..')); T=HERE; FAKE=os.path.join(HERE,'fake-supabase.js'); FIX=os.path.join(HERE,'fixtures')
OUT=os.environ.get('TEST_OUT','/tmp/carnet-tests'); os.makedirs(OUT,exist_ok=True)
SNOOZE = '''try{localStorage.setItem('cd2-onb-snooze','"2999-01-01"')}catch(e){}'''
srv=subprocess.Popen(['python3','-m','http.server','8774','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
seed=open(os.path.join(HERE,'seed.json')).read()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},service_workers='allow',accept_downloads=True)
    await ctx.add_init_script(f"if(!sessionStorage.getItem('srv'))sessionStorage.setItem('srv',{json.dumps(seed)});")
    await ctx.add_init_script(SNOOZE)
    page=await ctx.new_page(); msgs=[]
    page.on('console',lambda m:msgs.append(m.text) if 'Content Security' in m.text or 'Refused' in m.text else None)
    await page.route('**/lib/supabase.js',lambda r:r.fulfill(path=FAKE,content_type='application/javascript'))
    await page.route('**/config.js',lambda r:r.fulfill(body='window.CARNET_CONFIG={SUPABASE_URL:"https://btadceaowokrvubaaiui.supabase.co",SUPABASE_ANON_KEY:"k"}',content_type='application/javascript'))
    await page.goto('http://127.0.0.1:8774/index.html'); await page.wait_for_timeout(1500)
    for t in ['list','accounts','plan','analyse','settings']: await page.click(f'[data-tab={t}]'); await page.wait_for_timeout(200)
    await page.click('#fab'); await page.click('#smsToggle'); await page.fill('#smsText','Vous avez envoye 500 FCFA a MARC NGOMA le 2026-10-10'); await page.click('[data-act=smsParse]'); await page.click('#closeBtn')
    async with page.expect_download() as dl: await page.evaluate("exportCSV('all')")
    sw=await page.evaluate("navigator.serviceWorker.getRegistrations().then(r=>r.length)")
    print('app visible:',await page.is_visible('#app'),'| service worker:',sw,'| violations CSP:',[m[:140] for m in msgs])
    await b.close()
asyncio.run(main()); srv.terminate()
