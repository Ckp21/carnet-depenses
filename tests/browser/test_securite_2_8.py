"""2.8 : réponses « Ma situation » (settings.opening.__profil) piégées : types, clés dangereuses, dates, nombre de clés,
import hostile, formulaire altéré, types d'entrées inconnus. Rien ne doit casser, rien d'invalide ne doit être enregistré."""
import asyncio, json, os, sys
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

def ms(y, m, d, h=10): return int(datetime(y, m, d, h, 0).timestamp() * 1000)
NOW = ms(2026, 10, 14); TZ = 'Africa/Brazzaville'
def tweak(fn):
    s = json.loads(seed); fn(s); return json.dumps(s)
def with_prof(v):
    def f(s): s['settings'][0]['opening']['__profil'] = v
    return f
async def srv(page, t): return await page.evaluate(f'window.__srv.{t}')
async def opts(page): return (await srv(page, 'settings'))[0]['opening']
async def prof(page): return await page.evaluate("profNow()")
async def walk(page):
    for t in ['dash', 'list', 'accounts', 'plan', 'analyse', 'settings']:
        await page.evaluate(f"S.tab='{t}';render()"); await page.wait_for_timeout(120)
    await page.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")

async def main():
    srvp = start_server()
    async with async_playwright() as pw:
        b = await pw.chromium.launch()

        # ---------- H : __profil piégé déjà présent dans les données ----------
        hostile = {'st': '<img src=x onerror=window.__pwn=1>', 'lg': ['loc'], 'tr': '__proto__', 'ch': '3', 'fin': '2026-13-45',
                   'pay': {'__proto__': True, 'constructor': False, 'logement': 'oui', 'transport': False, 'a b<c>': True, 'x' * 150: True}}
        ctx, page = await boot(b, tweak(with_prof(hostile)), tz=TZ, now=NOW)
        p = await prof(page)
        check('H1 seules les valeurs valides survivent', p == {'pay': {'transport': False}}, p)
        await walk(page)
        check('H2 tous les écrans s\'affichent sans erreur', not page.errs, page.errs)
        check('H3 aucun code exécuté, prototype intact', await page.evaluate("window.__pwn===undefined && ({}).polluted===undefined && Object.prototype.transport===undefined && Object.prototype.logement===undefined"))
        check('H4 la case transport reflète le seul choix valide', await page.evaluate("document.querySelector('[data-paycat=transport]').checked") is False)
        await ctx.close()

        for name, v in [('chaîne', 'oui'), ('liste', ['cdi']), ('nombre', 42), ('nul', None), ('booléen', True)]:
            ctx, page = await boot(b, tweak(with_prof(v)), tz=TZ, now=NOW)
            p = await prof(page); await walk(page)
            check(f'H5 __profil de type {name} : ignoré', p == {} and not page.errs, (p, page.errs))
            await ctx.close()

        many = {'pay': {f'c{i}': (i % 2 == 0) for i in range(120)}}
        ctx, page = await boot(b, tweak(with_prof(many)), tz=TZ, now=NOW)
        p = await prof(page)
        check('H6 au plus 40 choix de postes conservés', len(p.get('pay', {})) == 40, len(p.get('pay', {})))
        await ctx.close()

        # valeurs acceptées : toutes les réponses autorisées
        ok = {'st': 'cdd', 'lg': 'prop', 'tr': 'voiture', 'ch': 1, 'fin': '2027-01-31', 'pay': {'sport': True}}
        ctx, page = await boot(b, tweak(with_prof(ok)), tz=TZ, now=NOW)
        check('H7 réponses valides conservées telles quelles', await prof(page) == ok, await prof(page))
        await ctx.close()

        # ---------- I : import hostile ----------
        ctx, page = await boot(b, seed, tz=TZ, now=NOW)
        res = await page.evaluate("""(h)=>JSON.stringify(cleanOpening({__profil:h,especes:5000,__proto__:{polluted:1}}))""", hostile)
        o = json.loads(res)
        check('I1 import : seules les valeurs valides sont reprises', o.get('__profil') == {'pay': {'transport': False}} and o.get('especes') == 5000, o)
        res = await page.evaluate("""()=>JSON.stringify(cleanOpening({__profil:{st:'zzz',ch:7,fin:'hier'}}))""")
        check('I2 import : profil entièrement invalide supprimé', '__profil' not in json.loads(res), res)
        check('I3 aucun effet sur le prototype', await page.evaluate("({}).polluted===undefined"))
        await ctx.close()

        # ---------- F : formulaire altéré dans le navigateur ----------
        ctx, page = await boot(b, seed, tz=TZ, now=NOW)
        await page.evaluate("S.tab='settings';render()"); await page.wait_for_timeout(300)
        await page.evaluate("""()=>{const s=document.getElementById('pf-st');const o=document.createElement('option');o.value='<b>pirate</b>';o.textContent='x';s.appendChild(o);s.value=o.value;
          const l=document.getElementById('pf-lg');const q=document.createElement('option');q.value='loc';l.appendChild(q);l.value='loc';
          const c=document.getElementById('pf-ch');const r=document.createElement('option');r.value='99';c.appendChild(r);c.value='99';
          const t=document.querySelector('[data-paycat]');t.dataset.paycat='__proto__';}""")
        await page.click('[data-act=saveProfil]'); await page.wait_for_timeout(700)
        o = await opts(page)
        check('F1 formulaire altéré : seule la valeur valide est enregistrée', o.get('__profil') == {'lg': 'loc'}, o.get('__profil'))
        check('F2 aucune erreur', not page.errs, page.errs)
        await ctx.close()

        # ---------- S : types d'entrées inconnus ----------
        def bad_src(s):
            s['incomes'].append({'id': 'hx1', 'amount': 1000, 'date': '2026-10-02', 'note': '<img src=x onerror=window.__pwn=1>', 'source': '<img src=x onerror=window.__pwn=2>', 'wallet': 'banque', 'user_id': 'u1'})
            s['incomes'].append({'id': 'hx2', 'amount': 2000, 'date': '2026-10-03', 'note': 'Cadeau', 'source': 'don', 'wallet': 'banque', 'user_id': 'u1'})
            s['incomes'].append({'id': 'hx3', 'amount': 3000, 'date': '2026-10-04', 'note': '', 'source': '__proto__', 'wallet': 'banque', 'user_id': 'u1'})
        ctx, page = await boot(b, tweak(bad_src), tz=TZ, now=NOW)
        await walk(page)
        src = await page.evaluate("[D.incomes.hx1.source,D.incomes.hx2.source,D.incomes.hx3.source]")
        check('S1 type inconnu ramené à « Autre », type valide conservé', src == ['autre', 'don', 'autre'], src)
        await page.evaluate("S.tab='accounts';render()"); await page.wait_for_timeout(250)
        check('S2 aucun code exécuté', await page.evaluate("window.__pwn===undefined") and not page.errs, page.errs)
        await ctx.close()
        await b.close()
    srvp.terminate()
    return report()

sys.exit(asyncio.run(main()))
