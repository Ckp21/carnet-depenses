"""Sécurité 2.6 : les nouveaux écrans affichent des données hostiles comme du texte, sans jamais exécuter de code.
Surfaces visées : favoris, « À payer » et confirmation, ajustements et vérification de solde, « À corriger »,
démarrage guidé, filtre perso et pro, portefeuilles et catégories personnalisés, configuration piégée."""
import asyncio, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

P = '"><img src=x onerror=window.__x=1><b onmouseover=window.__x=1 x="'

def hostile(s):
    for i in range(4):   # 4 dépenses identiques : candidate aux saisies rapides
        s['expenses'].append({'id': f'h{i}', 'amount': 1500, 'fee': 0, 'category': 'alimentation', 'method': 'mtn', 'date': f'2026-10-0{i+1}', 'note': P, 'recurring_id': None, 'nature': None, 'user_id': 'u1'})
    s['recurring'] = [{'id': 'hr', 'label': P, 'amount': 50000, 'fee': 0, 'category': 'logement', 'method': 'banque', 'day': 5, 'last_month': '2026-09', 'active': True, 'user_id': 'u1'}]
    s['moves'].append({'id': 'adj1', 'kind': 'adjust', 'amount': 1500, 'fee': 0, 'date': '2026-10-10', 'from_wallet': None, 'to_wallet': 'especes', 'ref_id': None, 'note': 'Ajustement : ' + P, 'user_id': 'u1'})
    op = (s['settings'][0] if s['settings'] else {'user_id': 'u1', 'opening': {}, 'savings_goal': 0})
    o = op.setdefault('opening', {})
    o.update({'__chk': {'especes': P, 'mtn': '2026-10-10'}, '__hz': P, '__start': P, '__skip': [P, 'hr|2026-08'], '__rem': {'evening': P, 'lead': P, 'hour': P},
              '__wallets': [{'id': 'cartep', 'label': P, 'color': P, 'kind': P, 'archived': False, 'pro': True}],
              '__cats': [{'id': 'custom1', 'label': P, 'color': P, 'need': True, 'words': [P, P], 'archived': False, 'pro': True}]})
    if not s['settings']: s['settings'] = [op]

REJ = json.dumps([
    {'op': {'t': 'expenses', 'op': 'upsert', 'row': {'id': 'x1', 'amount': P, 'date': P, 'note': P, 'category': P, 'method': P}}, 'code': P, 'msg': P, 'at': 1},
    {'op': {'t': 'recurring', 'op': 'upsert', 'row': {'id': 'x2', 'label': P}}, 'code': '23505', 'msg': P, 'at': 2},
    {'op': {'t': 'budgets', 'op': 'upsert', 'row': {'category': P, 'amount': P}}, 'code': '22P02', 'msg': P, 'at': 3},
    {'op': {'t': P, 'op': 'delete', 'row': {'id': P}}, 'code': '42501', 'msg': P, 'at': 4}])
ERRQ = json.dumps([{'kind': 'erreur', 'message': P, 'context': {'v': P, 'tab': P}}, {'kind': 'retour', 'message': P, 'context': {'v': P, 'diag': P}}])

async def state(page):
    return await page.evaluate("({x:window.__x||0,img:document.querySelectorAll('img[src=x]').length,on:document.querySelectorAll('[onerror],[onmouseover],[onclick]').length})")

async def main():
    srvp = start_server()
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        s = json.loads(seed); hostile(s)
        init = f"try{{localStorage.setItem('cd2-rejected',{json.dumps(REJ)});localStorage.setItem('cd2-errq',{json.dumps(ERRQ)})}}catch(e){{}}"
        ctx, page = await boot_frozen(b, json.dumps(s), extra_init=init)
        # La base hostile est lue au démarrage : l'application doit rester utilisable
        check('S1 application démarrée', await page.is_visible('#app'))
        async def sweep(label):
            st = await state(page)
            check(f'S1 {label} : aucun script exécuté', st['x'] == 0, st)
            check(f'S1 {label} : aucune balise injectée', st['img'] == 0 and st['on'] == 0, st)
        await sweep('accueil')
        if await page.is_visible('#moreBtn'): await page.click('#moreBtn'); await page.wait_for_timeout(200)
        await sweep('détails')
        check('S2 bloc « À corriger » affiché', 'à corriger' in (await page.inner_text('#main')).lower())
        check('S2 saisies rapides affichées', await page.locator('#favchips .fav, .favs .fav').count() > 0)
        # chaque onglet, tous les volets ouverts
        for t in ['dash', 'list', 'accounts', 'plan', 'analyse', 'settings']:
            await page.click(f'[data-tab={t}]'); await page.wait_for_timeout(250)
            await page.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await page.wait_for_timeout(150)
            await sweep('onglet ' + t)
        # vérification de solde sur chaque portefeuille
        await page.click('[data-tab=accounts]'); await page.wait_for_timeout(250)
        n = await page.locator('[data-check]').count()
        check('S3 portefeuilles vérifiables', n >= 4, n)
        for i in range(min(n, 8)):
            await page.locator('[data-check]').nth(i).click(); await page.wait_for_timeout(200)
            await page.keyboard.press('Escape'); await page.wait_for_timeout(100)
        await sweep('vérifier mon solde')
        # confirmation de paiement d'une récurrente
        await page.click('[data-tab=dash]'); await page.wait_for_timeout(250)
        if await page.locator('[data-rec-pay]').count():
            await page.locator('[data-rec-pay]').first.click(); await page.wait_for_timeout(300)
            check('S4 confirmation ouverte', await page.is_visible('#f-save'))
            await sweep('confirmation de paiement'); await page.click('#closeBtn'); await page.wait_for_timeout(150)
        else:
            check('S4 échéance à payer présente', False)
        # filtre perso et pro
        for sc in ['pro', 'perso', 'all']:
            if await page.locator(f'[data-scope={sc}]').count(): await page.click(f'[data-scope={sc}]'); await page.wait_for_timeout(200)
        await sweep('filtre perso et pro')
        # saisie rapide touchée puis annulée
        if await page.locator('.fav').count():
            await page.locator('.fav').first.click(); await page.wait_for_timeout(300)
            if await page.locator('.toast-undo, [data-act=toastUndo]').count(): await page.locator('.toast-undo, [data-act=toastUndo]').first.click(); await page.wait_for_timeout(200)
        await sweep('saisie rapide')
        # démarrage guidé : charge piégée tapée par l'utilisateur dans chaque champ, aller-retour entre les étapes
        await page.evaluate("startOnb()"); await page.wait_for_timeout(300)
        check('S5 guide ouvert', await page.is_visible('#onb'))
        # le carnet de test a déjà des soldes de départ : le guide commence à l'étape 2
        await page.fill('#ob-day', '5')
        await page.click('[data-act=onbNext]'); await page.wait_for_timeout(200)
        for i in range(3):
            if await page.locator(f'#ob-rl-{i}').count(): await page.fill(f'#ob-rl-{i}', P)
        await page.click('[data-act=onbBack]'); await page.wait_for_timeout(150)
        await page.click('[data-act=onbNext]'); await page.wait_for_timeout(200)
        check('S5 libellé piégé conservé comme texte (borné à 60 caractères)', await page.evaluate("document.querySelector('#ob-rl-0')?.value") == P[:60])
        await sweep('démarrage guidé')
        await page.click('[data-act=onbSkip]'); await page.wait_for_timeout(200)
        # retour piégé envoyé : stocké tel quel côté serveur, jamais interprété à l'écran
        await page.click('[data-tab=settings]'); await page.wait_for_timeout(250)
        if await page.locator('#fb-text').count():
            await page.fill('#fb-text', P); await page.click('[data-act=sendFeedback]'); await page.wait_for_timeout(600)
        await sweep('retour envoyé')
        check('S6 aucune erreur JS', not page.errs, page.errs[:3])
        await ctx.close(); await b.close()
    srvp.terminate()
    return report()

sys.exit(asyncio.run(main()))
