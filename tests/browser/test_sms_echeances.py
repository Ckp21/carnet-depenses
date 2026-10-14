import asyncio, json, subprocess, time
from playwright.async_api import async_playwright
import os, sys
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.abspath(os.path.join(HERE,'..','..')); T=HERE; FAKE=os.path.join(HERE,'fake-supabase.js'); FIX=os.path.join(HERE,'fixtures')
OUT=os.environ.get('TEST_OUT','/tmp/carnet-tests'); os.makedirs(OUT,exist_ok=True)
SNOOZE = '''try{localStorage.setItem('cd2-onb-snooze','"2999-01-01"')}catch(e){}'''
srv=subprocess.Popen(['python3','-m','http.server','8769','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
seed=open(os.path.join(HERE,'seed.json')).read()
ok=[];bad=[]
def check(name,cond): (ok if cond else bad).append(name)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    ctx=await b.new_context(viewport={'width':390,'height':844},service_workers='block',accept_downloads=True)
    await ctx.add_init_script(f"if(!sessionStorage.getItem('srv'))sessionStorage.setItem('srv',{json.dumps(seed)});")
    await ctx.add_init_script(SNOOZE)
    page=await ctx.new_page(); errs=[]; page.on('pageerror',lambda e:errs.append(str(e)))
    await page.route('**/supabase.js',lambda r:r.fulfill(path=FAKE,content_type='application/javascript'))
    await page.route('**/config.js',lambda r:r.fulfill(body='window.CARNET_CONFIG={SUPABASE_URL:"https://x.supabase.co",SUPABASE_ANON_KEY:"k"}',content_type='application/javascript'))
    await page.goto('http://127.0.0.1:8769/index.html'); await page.wait_for_timeout(900)
    await page.screenshot(path=OUT+'/v23-dash.png',full_page=True)
    txt=await page.inner_text('main')
    check('à venir',('À venir' in txt) or ('À VENIR' in txt.upper()))
    # SMS
    await page.click('#fab'); await page.click('#smsToggle')
    await page.fill('#smsText','Vous avez envoye 10000 FCFA a JEAN MBEMBA le 12/10/2026 14:22. Frais: 100 FCFA. Nouveau solde: 45000 FCFA. MTN MoMo')
    await page.click('[data-act=smsParse]'); await page.wait_for_timeout(200)
    check('sms montant',await page.input_value('#f-amount')=='10 000')
    check('sms frais',await page.input_value('#f-fee')=='100')
    check('sms date',await page.input_value('#f-date')=='2026-10-12')
    check('sms moyen',await page.evaluate("document.querySelector('input[name=met]:checked')?.value")=='mtn')
    await page.screenshot(path=OUT+'/v23-sms.png'); await page.click('#closeBtn')
    # retrait par SMS
    await page.click('#fab'); await page.click('#smsToggle')
    await page.fill('#smsText',"Vous avez retire 11000 XAF de votre compte 20237959 chez l'agent le 2026-10-04 14:20:48. Solde: 813 XAF. Frais: 385XAF. ID: 8353569446")
    await page.click('[data-act=smsParse]'); await page.wait_for_timeout(200)
    check('retrait -> mouvement',await page.evaluate("S.kind")=='move' and await page.evaluate("document.querySelector('input[name=from]:checked')?.value")=='mtn' and await page.input_value('#f-fee')=='385')
    await page.click('#closeBtn')
    # catégorie devinée
    await page.click('#fab'); await page.fill('#f-amount','1500'); await page.fill('#f-note','taxi bacongo'); await page.wait_for_timeout(400)
    check('catégorie devinée',await page.evaluate("document.querySelector('input[name=cat]:checked')?.value")=='transport')
    await page.click('#f-save'); await page.wait_for_timeout(300)
    # mode discret
    await page.click('[data-tab=dash]'); await page.click('[data-act=toggleDiscreet]'); await page.wait_for_timeout(200)
    check('mode discret',await page.evaluate("document.documentElement.classList.contains('discreet')"))
    await page.screenshot(path=OUT+'/v23-discreet.png'); await page.click('[data-act=toggleDiscreet]')
    # biens et patrimoine
    await page.click('[data-tab=accounts]'); await page.click('section:has(.over:text("Biens")) summary')
    await page.fill('#as-name','Parcelle Kintélé'); await page.fill('#as-value','3000000'); await page.click('[data-act=addAsset]'); await page.wait_for_timeout(300)
    check('bien ajouté',await page.evaluate("assets().length")==1)
    await page.screenshot(path=OUT+'/v23-accounts.png',full_page=True)
    # soldes de départ conservent les biens
    await page.click('section:has(.over:text("Portefeuilles")) summary') if not await page.is_visible('#op-date') else None
    await page.click('[data-act=saveOpening]'); await page.wait_for_timeout(200)
    check('biens conservés',await page.evaluate("assets().length")==1)
    # reste à affecter
    await page.click('[data-tab=plan]'); await page.wait_for_timeout(200)
    t=await page.inner_text('main'); check('reste à affecter',"mission" in t.lower())
    if await page.is_visible('[data-act=restToSavings]'):
      before=await page.evaluate("savingsGoal(S.month)"); await page.click('[data-act=restToSavings]'); await page.wait_for_timeout(200)
      check('reste vers épargne',await page.evaluate("toAllocate(S.month).rest")==0)
    await page.screenshot(path=OUT+'/v23-plan.png',full_page=True)
    # calendrier
    await page.click('[data-tab=dash]')
    async with page.expect_download() as d: await page.click('[data-act=ics]')
    dl=await d.value; await dl.save_as(OUT+'/e.ics'); ics=open(OUT+'/e.ics').read()
    check('ics valide','BEGIN:VCALENDAR' in ics and 'RRULE:FREQ=MONTHLY;BYMONTHDAY=1' in ics)
    # autres onglets sans erreur
    for tab in ['list','analyse','settings']:
      await page.click(f'[data-tab={tab}]'); await page.wait_for_timeout(200)
      sw=await page.evaluate('document.documentElement.scrollWidth'); check('largeur '+tab,sw<=390)
    srv_=await page.evaluate('window.__srv'); check('synchro serveur',len(srv_['expenses'])==299 and srv_['settings'][0]['opening'].get('__biens'))
    check('aucune erreur JS',not errs)
    print('OK',ok);print('ÉCHECS',bad);print('ERR',errs[:3])
    await b.close()
asyncio.run(main()); srv.terminate()
