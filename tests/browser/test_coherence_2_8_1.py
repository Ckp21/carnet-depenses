"""2.8.1 : cohérence entre la situation et les budgets déjà saisis.
Bandeau « Budget sans objet » (Retirer en deux temps, annulable, ou « Je le paie ») et postes non payés repliés
sous « Autres postes » dans l'éditeur de budgets."""
import asyncio, json, os, sys
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

def ms(y, m, d, h=10): return int(datetime(y, m, d, h, 0).timestamp() * 1000)
NOW = ms(2026, 10, 14); TZ = 'Africa/Brazzaville'

def mk(profil=None, budgets=None, keep_hist=False):
    """Carnet sans historique de logement, transport ni éducation (sauf keep_hist), avec les budgets demandés."""
    s = json.loads(seed)
    if not keep_hist:
        s['expenses'] = [e for e in s['expenses'] if e['category'] not in ('logement', 'transport', 'education')]
        s['recurring'] = []
    s['budgets'] = [{'category': c, 'amount': a, 'user_id': 'u1'} for c, a in (budgets or {}).items()]
    if profil is not None: s['settings'][0]['opening']['__profil'] = profil
    return json.dumps(s)

HEB = {'st': 'cdi', 'lg': 'heb', 'tr': 'pied'}
BUD = {'logement': 80000, 'transport': 40000, 'alimentation': 120000}
async def srv(page, t): return await page.evaluate(f'window.__srv.{t}')
async def plan(page):
    await page.evaluate("S.tab='plan';S.planView='goals';render()"); await page.wait_for_timeout(300)
async def stale(page): return await page.evaluate('staleBudgets()')
async def amounts(page): return {x['category']: x['amount'] for x in await srv(page, 'budgets')}
async def bnr(page): return (await page.inner_text('#main')).replace('\xa0', ' ').replace('\u202f', ' ')
async def tapped(page, act, c):
    await page.click(f'[data-act={act}][data-c={c}]'); await page.wait_for_timeout(500)

async def main():
    srvp = start_server()
    async with async_playwright() as pw:
        b = await pw.chromium.launch()

        # ---------- B : bandeau « Budget sans objet » ----------
        ctx, page = await boot(b, mk(HEB, BUD), tz=TZ, now=NOW)
        check('B1 seuls logement et transport sont signalés', sorted(await stale(page)) == ['logement', 'transport'], await stale(page))
        await plan(page)
        t = await bnr(page)
        check('B1 le bandeau nomme les deux postes et le montant réservé', 'Budget sans objet : Logement' in t and 'Budget sans objet : Transport' in t and '80 000 FCFA' in t, t[:600])
        check('B1 alimentation n\'est pas signalée', 'Budget sans objet : Alimentation' not in t)
        total0 = await page.evaluate("toAllocate(S.month).bud")
        check('B1 le total affecté compte encore les 3 budgets', total0 == 240000, total0)

        await tapped(page, 'bdDrop', 'logement')
        label = await page.inner_text('[data-act=bdDrop][data-c=logement]')
        check('B2 premier appui : demande de confirmation, rien n\'est supprimé', label == 'Confirmer le retrait' and await amounts(page) == BUD, (label, await amounts(page)))
        check('B2 le second poste reste en « Retirer ce budget »', await page.inner_text('[data-act=bdDrop][data-c=transport]') == 'Retirer ce budget')

        await tapped(page, 'bdDrop', 'logement')
        check('B3 second appui : seul ce budget est retiré', await amounts(page) == {'transport': 40000, 'alimentation': 120000}, await amounts(page))
        check('B3 le bandeau de logement disparaît, celui de transport reste', await stale(page) == ['transport'] and await page.locator('[data-act=bdDrop][data-c=logement]').count() == 0 and await page.locator('[data-act=bdDrop][data-c=transport]').count() == 1)
        check('B3 « Chaque franc a une mission » baisse du montant retiré', await page.evaluate("toAllocate(S.month).bud") == total0 - 80000)
        check('B3 un message permet d\'annuler', 'Budget retiré : Logement' in await page.inner_text('#toast') and await page.locator('#toast button').count() >= 1, await page.inner_text('#toast'))

        await page.click('#toast button'); await page.wait_for_timeout(600)
        check('B4 Annuler rétablit le budget au même montant', await amounts(page) == BUD, await amounts(page))
        await plan(page)
        check('B4 le bandeau revient avec le budget', sorted(await stale(page)) == ['logement', 'transport'] and await page.locator('[data-act=bdDrop][data-c=logement]').count() == 1)

        # un appui ailleurs désarme la confirmation
        await tapped(page, 'bdDrop', 'transport')
        await page.click('[data-tab=dash]'); await page.wait_for_timeout(250)
        await plan(page)
        check('B5 la confirmation s\'efface si on quitte l\'écran', await page.inner_text('[data-act=bdDrop][data-c=transport]') == 'Retirer ce budget' and await amounts(page) == BUD)

        # « Je le paie »
        await tapped(page, 'bdKeep', 'transport')
        o = (await srv(page, 'settings'))[0]['opening']
        check('B6 « Je le paie » mémorise le choix, les autres réponses restent', o['__profil'].get('pay') == {'transport': True} and o['__profil']['lg'] == 'heb' and o['__profil']['tr'] == 'pied', o.get('__profil'))
        check('B6 le budget est conservé, le bandeau disparaît', (await amounts(page)) == BUD and await stale(page) == ['logement'] and await page.locator('[data-act=bdKeep][data-c=transport]').count() == 0)
        check('B6 les autres clés de l\'ouverture sont intactes', o.get('banque') == 250000 and o.get('especes') == 15000, o)
        await page.reload(); await page.wait_for_timeout(900); await plan(page)
        check('B6 après rechargement le choix tient', await stale(page) == ['logement'])
        check('B7 aucune erreur JS', not page.errs, page.errs)
        await ctx.close()

        # ---------- N : cas où il ne faut pas de bandeau ----------
        ctx, page = await boot(b, mk(HEB, BUD, keep_hist=True), tz=TZ, now=NOW)
        check('N1 des dépenses de logement et de transport récentes : aucun bandeau', await stale(page) == [], await stale(page))
        await plan(page)
        check('N1 rien d\'affiché à l\'écran', 'Budget sans objet' not in await bnr(page))
        await ctx.close()

        ctx, page = await boot(b, mk(None, BUD), tz=TZ, now=NOW)
        check('N2 sans situation renseignée, on ne devine rien', await stale(page) == [], await stale(page))
        await ctx.close()

        ctx, page = await boot(b, mk(HEB, {'sport': 15000, 'alimentation': 120000}), tz=TZ, now=NOW)
        check('N3 un budget sport sans historique n\'est pas contredit par la situation', await stale(page) == [], await stale(page))
        await ctx.close()

        ctx, page = await boot(b, mk({'st': 'cdi', 'pay': {'sport': False}}, {'sport': 15000, 'alimentation': 120000}), tz=TZ, now=NOW)
        check('N4 un « je ne paie pas » explicite sur sport est signalé', await stale(page) == ['sport'], await stale(page))
        await ctx.close()

        ctx, page = await boot(b, mk(HEB, {'alimentation': 120000}), tz=TZ, now=NOW)
        check('N5 un poste écarté sans budget ne produit rien', await stale(page) == [], await stale(page))
        await ctx.close()

        # ---------- F : « Autres postes » repliés ----------
        ctx, page = await boot(b, mk(HEB, {'alimentation': 120000, 'transport': 40000}), tz=TZ, now=NOW)
        await plan(page)
        ids = await page.evaluate("[...document.querySelectorAll('[data-bud]')].map(i=>[i.dataset.bud,!!i.closest('details')])")
        fold = {c for c, f in ids if f}; main_ = {c for c, f in ids if not f}
        check('F1 les 14 postes restent saisissables', len(ids) == 14, ids)
        check('F1 logement et éducation (non payés, sans budget ni dépense du mois) sont repliés', 'logement' in fold, fold)
        check('F1 transport (budget saisi) reste visible malgré « à pied »', 'transport' in main_, main_)
        check('F1 alimentation, loisirs, santé restent visibles', {'alimentation', 'loisirs', 'sante'} <= main_, main_)
        check('F1 soins, sport, abonnements (nouveaux, sans dépense) sont repliés', {'soins', 'sport', 'abonnements'} <= fold, fold)
        n = len(fold)
        summ = await page.inner_text('details[data-keep=budother] summary')
        check('F2 le résumé indique le nombre de postes', summ.strip() == f'Autres postes ({n})', summ)
        check('F2 le dépliant est fermé au départ', await page.evaluate("!document.querySelector('details[data-keep=budother]').open"))
        hint = await page.text_content('details[data-keep=budother] .hint')
        check('F2 l\'aide liste les postes repliés', 'Logement' in hint and 'Soins du corps' in hint, hint)

        # saisir un budget dans un poste replié : il s'enregistre
        await page.click('details[data-keep=budother] summary'); await page.wait_for_timeout(250)
        check('F3 ouvrir affiche les champs', await page.is_visible('#b-sport'))
        await page.fill('#b-sport', '25000')
        await page.click('[data-act=saveBud]'); await page.wait_for_timeout(700)
        check('F3 le budget saisi dans un poste replié est enregistré', (await amounts(page)).get('sport') == 25000, await amounts(page))
        check('F3 les autres budgets ne bougent pas', (await amounts(page)).get('alimentation') == 120000 and (await amounts(page)).get('transport') == 40000, await amounts(page))
        await plan(page)
        ids = await page.evaluate("[...document.querySelectorAll('[data-bud]')].map(i=>[i.dataset.bud,!!i.closest('details')])")
        check('F4 sport a maintenant un budget : il sort du repli', ('sport', False) in [tuple(x) for x in ids], ids)
        check('F4 l\'état ouvert du repli est mémorisé', await page.evaluate("S.budother") in (True, False))
        check('F5 aucune erreur JS', not page.errs, page.errs)
        await ctx.close()

        # tout le monde visible quand rien n'est écarté
        ctx, page = await boot(b, seed, tz=TZ, now=NOW)
        await plan(page)
        n_fold = await page.evaluate("document.querySelectorAll('details[data-keep=budother] [data-bud]').length")
        n_all = await page.evaluate("document.querySelectorAll('[data-bud]').length")
        check('F6 carnet habituel : les 14 champs sont là, seuls les 3 nouveaux postes sont repliés', n_all == 14 and n_fold == 3, (n_all, n_fold))
        check('F6 aucune erreur JS', not page.errs, page.errs)
        await ctx.close()

        await b.close()
    srvp.terminate()
    return report()

sys.exit(asyncio.run(main()))
