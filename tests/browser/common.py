"""Outils communs aux tests navigateur : serveur local, faux Supabase, vérifications."""
import asyncio, json, os, subprocess, time
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.environ.get('TEST_OUT', '/tmp/carnet-tests')
os.makedirs(OUT, exist_ok=True)
PORT = int(os.environ.get('TEST_PORT', '8781'))
FAKE = os.path.join(HERE, 'fake-supabase.js')
VAPID = 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DTY'

import re
APP_VERSION = re.search(r"APP_VERSION='([^']+)'", open(os.path.join(ROOT, 'app.js'), encoding='utf-8').read()).group(1)

def start_server():
    s = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    return s

seed = open(os.path.join(HERE, 'seed.json')).read()
EMPTYKEYS = ['expenses', 'incomes', 'recurring', 'moves', 'plans', 'reminders', 'push_subscriptions', 'backups', 'journal']
empty = json.dumps({k: [] for k in EMPTYKEYS} | {'budgets': [], 'settings': []})
ok = []; bad = []

def check(n, c, extra=''):
    (ok if c else bad).append(n)
    if not c:
        print('ECHEC', n, extra)

async def boot(b, seedtxt, tz=None, now=None, extra_init='', sw='block', url='index.html', viewport=None, onb=False):
    kw = {'viewport': viewport or {'width': 390, 'height': 844}, 'service_workers': sw, 'accept_downloads': True}
    if tz: kw['timezone_id'] = tz
    ctx = await b.new_context(**kw)
    await ctx.add_init_script(f"if(!sessionStorage.getItem('srv'))sessionStorage.setItem('srv',{json.dumps(seedtxt)});")
    if now:
        await ctx.add_init_script(f"(()=>{{const R=Date,off={now}-R.now();class D2 extends R{{constructor(...a){{if(a.length)super(...a);else super(R.now()+off)}}static now(){{return R.now()+off}}}}window.Date=D2}})();")
    # Le démarrage guidé s'ouvre sur un compte vide : on le repousse sauf dans les tests qui le vérifient
    if not onb: await ctx.add_init_script("try{localStorage.setItem('cd2-onb-snooze','\"2999-01-01\"')}catch(e){}")
    if extra_init: await ctx.add_init_script(extra_init)
    page = await ctx.new_page(); page.errs = []
    page.on('pageerror', lambda e: page.errs.append(str(e)))
    page.on('dialog', lambda d: (page.errs.append('DIALOG'), asyncio.ensure_future(d.dismiss())))
    page.on('console', lambda m: page.errs.append('CONSOLE:' + m.text) if m.type == 'error' and 'favicon' not in m.text else None)
    await page.route('**/supabase.js', lambda r: r.fulfill(path=FAKE, content_type='application/javascript'))
    await page.route('**/config.js', lambda r: r.fulfill(body='window.CARNET_CONFIG={SUPABASE_URL:"https://x.supabase.co",SUPABASE_ANON_KEY:"k",VAPID_PUBLIC_KEY:"%s"}' % VAPID, content_type='application/javascript'))
    await page.goto(f'http://127.0.0.1:{PORT}/{url}'); await page.wait_for_timeout(900)
    return ctx, page

# Horloge figée pour les tests hérités : 13 octobre 2026, 10 h à Brazzaville (les chiffres attendus en dépendent)
FROZEN = 1791882000000
async def boot_frozen(b, seedtxt, **k):
    k.setdefault('now', FROZEN); k.setdefault('tz', 'Africa/Brazzaville')
    return await boot(b, seedtxt, **k)

def report():
    print(f'{len(ok)} réussis, {len(bad)} échecs')
    for b in bad: print('  -', b)
    return 1 if bad else 0
