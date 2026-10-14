"""2.7 : accueil repensé (budget du jour, dépensé aujourd'hui, prochaine sortie prévue) et date du jour dans l'en-tête."""
import asyncio, json, os, re, sys
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

def ms(y, m, d, h=10): return int(datetime(y, m, d, h, 0).timestamp() * 1000)
def dg(t): return int(re.sub(r'\D', '', t) or 0)
def sp(t): return re.sub(r'\s+', '', t)
NOW = ms(2026, 10, 14); TZ = 'Africa/Brazzaville'

def rich(s):
    s['settings'][0]['opening'].update({'especes': 3000000, 'mtn': 1000000, 'airtel': 500000, 'banque': 5000000, 'epargne': 150000})
    s['settings'][0]['opening']['__cycle'] = {'day': 5}
def poor(s):
    s['settings'][0]['opening'].update({'especes': 0, 'mtn': 0, 'airtel': 0, 'banque': 0, 'epargne': 0})
    s['settings'][0]['opening']['__cycle'] = {'day': 5}
def tweak(fn):
    s = json.loads(seed); fn(s); return json.dumps(s)
def expense(i, amount, rec=None):
    return {'id': i, 'amount': amount, 'fee': 0, 'category': 'transport', 'method': 'especes', 'date': '2026-10-14', 'note': 'Taxi', 'recurring_id': rec, 'nature': None, 'user_id': 'u1'}

async def main():
    srvp = start_server()
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx, page = await boot(b, tweak(rich), tz=TZ, now=NOW)
        # ---------- en-tête : la date du jour ----------
        lab = await page.inner_text('#monthLabel')
        check('H1 date du jour en toutes lettres', lab == 'Mercredi 14 octobre 2026', lab)
        await page.click('#prevM'); await page.wait_for_timeout(250)
        lab = await page.inner_text('#monthLabel')
        check('H2 autre mois : mois et année seulement', lab == 'Septembre 2026', lab)
        check('H2 invite à revenir à aujourd\'hui', await page.evaluate("$('monthLabel').classList.contains('back')"))
        await page.click('#monthLabel'); await page.wait_for_timeout(250)
        check('H3 toucher la date revient au mois en cours', await page.inner_text('#monthLabel') == 'Mercredi 14 octobre 2026')
        await page.click('#nextM'); await page.wait_for_timeout(250)
        check('H3 mois suivant : mois et année', await page.inner_text('#monthLabel') == 'Novembre 2026')
        await page.click('#monthLabel'); await page.wait_for_timeout(250)

        # ---------- bloc principal ----------
        hero = (await page.inner_text('#hero')).lower()
        check('B1 trois informations : argent, budget du jour, prochaine sortie', 'argent disponible' in hero and 'budget du jour' in hero and 'prochaine sortie prévue' in hero, hero[:300])
        check('B1 plus de jargon : ni « utilisable » ni « horizon » ni formule', 'utilisable' not in hero and 'horizon' not in hero and '÷' not in hero and '(' in hero, hero[:300])
        check('B1 rien dépensé aujourd\'hui', "rien dépensé aujourd'hui" in hero)
        check('B1 phrase claire sur la période', "à ne pas dépasser pour tenir jusqu'à ta prochaine paie, le 1 nov" in hero or "à ne pas dépasser pour tenir jusqu'à ta prochaine paie, le 5 nov" in hero, hero[:400])
        check('B1 plus de bascule de période sur l\'accueil', await page.locator('#hero .hzseg, #hero [data-hz]').count() == 0)
        base_day = dg(await page.inner_text('#hero-day'))
        check('B1 budget du jour positif', base_day > 0, base_day)
        check('B1 pas de barre sans dépense du jour', await page.locator('#hero .bar').count() == 0)

        # une dépense du jour : le budget ne bouge pas, le reste diminue
        await page.evaluate("mutate([{t:'expenses',op:'upsert',row:%s}])" % json.dumps(expense('t1', 2500)))
        await page.wait_for_timeout(300)
        d1 = dg(await page.inner_text('#hero-day')); today = await page.inner_text('#hero-today')
        check('B2 budget du jour stable après une dépense', abs(d1 - base_day) <= 1, (d1, base_day))
        check('B2 dépensé aujourd\'hui et reste affichés', '2500FCFA' in sp(today) and 'ilreste' in sp(today) and str(d1 - 2500) in sp(today), today)
        check('B2 barre de progression présente', await page.locator('#hero .bar').count() == 1)
        # une charge récurrente payée aujourd'hui ne compte pas comme dépense du jour
        await page.evaluate("mutate([{t:'expenses',op:'upsert',row:%s}])" % json.dumps(expense('t2', 90000, 'loyer-x')))
        await page.wait_for_timeout(300)
        today2 = await page.inner_text('#hero-today')
        check('B3 récurrente payée : pas comptée dans la dépense du jour', '2500FCFA' in sp(today2) and '92500' not in sp(today2), today2)
        # dépassement
        await page.evaluate("mutate([{t:'expenses',op:'upsert',row:%s}])" % json.dumps(expense('t3', base_day + 50000)))
        await page.wait_for_timeout(300)
        today3 = (await page.inner_text('#hero-today')).lower()
        check('B4 dépassement annoncé clairement', 'de plus que ton budget' in today3, today3)
        # calcul expliqué
        await page.click('.hero details.calc summary'); await page.wait_for_timeout(200)
        calc = await page.inner_text('#hero-calc')
        check('B5 calcul en trois lignes lisibles', 'Argent disponible ce matin' in calc and 'Sorties déjà prévues' in calc and 'À répartir sur' in calc, calc)
        # le détail reste ouvert après un nouveau rendu
        await page.evaluate("render()"); await page.wait_for_timeout(200)
        check('B5 détail toujours ouvert après rendu', await page.is_visible('#hero-calc'))
        # mode discret
        await page.evaluate("LS.set('cd2-discreet',true);applyDiscreet();render()"); await page.wait_for_timeout(200)
        hd = await page.inner_text('#hero')
        check('B6 mode discret : montants masqués', '****' in hd and not re.search(r'\d{3} \d{3}', hd.replace('\xa0', ' ')), hd[:200])
        check('B7 aucune erreur JS', not page.errs, page.errs)
        await ctx.close()

        # ---------- aucun argent : message clair, pas de budget absurde ----------
        ctx, page = await boot(b, tweak(poor), tz=TZ, now=NOW)
        hero = (await page.inner_text('#hero')).lower()
        check('E1 solde nul ou négatif expliqué', 'nul ou négatif' in hero and 'budget du jour' in hero, hero[:300])
        check('E1 pas de « 0 par jour » trompeur', await page.locator('#hero-day').count() == 0)
        check('E1 accès direct à Comptes', await page.locator('#hero [data-tab=accounts]').count() == 1)
        await page.click('#hero [data-tab=accounts]'); await page.wait_for_timeout(250)
        check('E1 le bouton ouvre Comptes', await page.evaluate("S.tab") == 'accounts')
        check('E2 aucune erreur JS', not page.errs, page.errs)
        await ctx.close()

        # ---------- téléphone étroit : l'en-tête ne déborde pas ----------
        ctx, page = await boot(b, tweak(rich), tz=TZ, now=NOW, viewport={'width': 320, 'height': 700})
        ov = await page.evaluate("(()=>{const r=document.querySelector('.month').getBoundingClientRect();return {w:document.documentElement.scrollWidth,vw:window.innerWidth,r:r.right}})()")
        check('V1 pas de défilement horizontal à 320 px', ov['w'] <= ov['vw'] and ov['r'] <= ov['vw'], ov)
        await ctx.close()
        await b.close()
    srvp.terminate()
    return report()

sys.exit(asyncio.run(main()))
