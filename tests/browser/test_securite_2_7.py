"""Sécurité 2.7 : les abonnements affichent des données hostiles comme du texte, sans jamais exécuter de code ni polluer les objets.
Surfaces visées : fiches __subs piégées (clés dangereuses, nombres absurdes, dates piégées), libellés et notes piégés dans l'écran
Abonnements, la détection, les formulaires (abonnement, taux, carte prépayée), l'import, le rappel et l'agenda."""
import asyncio, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

P = '"><img src=x onerror=window.__x=1><b onmouseover=window.__x=1 x="'

def hostile(s):
    op = s['settings'][0]; o = op['opening']
    o['__wallets'] = [{'id': 'carte1', 'label': P, 'color': P, 'kind': 'card', 'archived': False, 'pro': False}]
    o['carte1'] = 5000
    m = json.loads('{"__proto__":{"p":3,"a":"2026-11","polluted":1},"constructor":{"p":3,"a":"2026-11"},"prototype":{"p":6,"a":"2026-11"},'
                   '"hr":{"p":"3","a":"%s","c":"%s","x":"%s","t":"%s","n":{"d":"%s","x":"%s"}},'
                   '"big":{"p":12,"a":"2026-11","c":"USD","x":1e308,"n":{"d":"2026-12-01","x":-5}},'
                   '"bad":{"p":7,"a":"2026-13","c":"BTC","x":-1,"t":"2026-02-31"},'
                   '"ok":{"p":3,"a":"2026-11","c":"EUR","x":12.5,"t":"2026-10-20","n":{"d":"2026-11-25","x":15}}}' % (P.replace('"', '\\"'), P.replace('"', '\\"'), P.replace('"', '\\"'), P.replace('"', '\\"'), P.replace('"', '\\"'), P.replace('"', '\\"')))
    o['__subs'] = {'fx': {'USD': 'abc', 'EUR': 1e12, '__proto__': 5, 'GBP': 800}, 'rf': P, 'm': m, 'ig': [P, 123, None, {'a': 1}, 'ab', 'x' * 500, 'canva pro']}
    s['recurring'] += [
        {'id': 'hr', 'label': P, 'amount': 5000, 'fee': 0, 'category': 'loisirs', 'method': 'carte1', 'day': 12, 'last_month': '2026-09', 'active': True, 'user_id': 'u1'},
        {'id': 'big', 'label': 'Gros', 'amount': 1000000, 'fee': 0, 'category': 'loisirs', 'method': 'carte1', 'day': 12, 'last_month': '2026-09', 'active': True, 'user_id': 'u1'},
        {'id': 'ok', 'label': 'Cloud', 'amount': 8200, 'fee': 0, 'category': 'factures', 'method': 'carte1', 'day': 20, 'last_month': '2026-08', 'active': True, 'user_id': 'u1'}]
    # historique piégé qui revient chaque mois : proposé à la détection sous un libellé piégé
    for i, d in enumerate(['2026-08-09', '2026-09-09', '2026-10-09']):
        s['expenses'].append({'id': f'd{i}', 'amount': 4000, 'fee': 0, 'category': 'loisirs', 'method': 'carte1', 'date': d, 'note': 'Canva Pro ' + P, 'recurring_id': None, 'nature': None, 'user_id': 'u1'})
        s['expenses'].append({'id': f'e{i}', 'amount': 2500, 'fee': 0, 'category': 'loisirs', 'method': 'mtn', 'date': d, 'note': 'Ligue ' + P[:40] + ' sport', 'recurring_id': None, 'nature': None, 'user_id': 'u1'})

async def state(page):
    return await page.evaluate("({x:window.__x||0,img:document.querySelectorAll('img[src=x]').length,on:document.querySelectorAll('[onerror],[onmouseover],[onclick]').length,pp:({}).polluted||Object.prototype.polluted||null,pp2:({}).p||null})")

async def main():
    srvp = start_server()
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        s = json.loads(seed); hostile(s)
        ctx, page = await boot_frozen(b, json.dumps(s))
        check('S1 application démarrée avec des fiches piégées', await page.is_visible('#app'))
        async def sweep(label):
            st = await state(page)
            check(f'S1 {label} : aucun script exécuté', st['x'] == 0, st)
            check(f'S1 {label} : aucune balise injectée', st['img'] == 0 and st['on'] == 0, st)
            check(f'S1 {label} : aucune pollution d\'objet', st['pp'] is None and st['pp2'] is None, st)
        await sweep('accueil')
        # lecture assainie
        c = await page.evaluate("(()=>{const c=subCfg();return {fx:c.fx,rf:c.rf||0,ig:c.ig,m:Object.fromEntries(Object.entries(c.m)),proto:Object.getPrototypeOf(c.m)}})()")
        check('S2 taux piégés écartés (repli sur les taux par défaut)', c['fx'] == {} and c['rf'] == 0, c)
        check('S2 clés dangereuses refusées', not any(k in c['m'] for k in ['__proto__', 'constructor', 'prototype']) and c['proto'] is None, c)
        check('S2 fiche piégée entièrement écartée', 'hr' not in c['m'] and 'bad' not in c['m'], c['m'])
        check('S2 prix en devise absurde écarté', 'big' not in c['m'] or 'x' not in c['m']['big'], c['m'].get('big'))
        check('S2 fiche saine conservée', c['m'].get('ok') == {'p': 3, 'a': '2026-11', 'c': 'EUR', 'x': 12.5, 't': '2026-10-20', 'n': {'d': '2026-11-25', 'x': 15}}, c['m'].get('ok'))
        check('S2 liste d\'oubli bornée et nettoyée', c['ig'] == ['canva pro'] or all(isinstance(x, str) and 3 <= len(x) <= 40 for x in c['ig']), c['ig'])
        amts = await page.evaluate("[recAmt(D.recurring.hr),recAmt(D.recurring.big),subMonthly(D.recurring.big),subPer(D.recurring.hr),subPer(D.recurring.ok)]")
        check('S2 montants et périodes toujours finis', all(isinstance(x, (int, float)) and abs(x) < 1e12 for x in amts) and amts[3] == 1 and amts[4] == 3, amts)
        # chaque vue, tous les volets ouverts
        for t, extra in [('plan', "S.planView='subs'"), ('dash', ''), ('accounts', ''), ('settings', ''), ('analyse', ''), ('list', '')]:
            await page.evaluate(f"S.tab='{t}';{extra};render()"); await page.wait_for_timeout(250)
            await page.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await page.wait_for_timeout(150)
            await sweep('onglet ' + t + (' (abonnements)' if extra else ''))
        await page.evaluate("S.tab='plan';S.planView='subs';render()"); await page.wait_for_timeout(250)
        t = await page.inner_text('#main')
        check('S3 libellé piégé affiché comme texte', '<img src=x' in t, t[:300])
        check('S3 détection : libellé issu d\'une note piégée affiché comme texte', 'Canva Pro' in t or 'Ligue' in t, t[:600])
        await sweep('détection')
        # ajouter depuis la détection, avec une note piégée, puis ignorer
        if await page.locator('[data-sub-add]').count():
            await page.locator('[data-sub-add]').first.click(); await page.wait_for_timeout(300)
            v = await page.input_value('#sb-label')
            check('S3 formulaire prérempli : texte brut et borné à 60 caractères', len(v) <= 60, v)
            await sweep('formulaire prérempli')
            await page.click('[data-act=saveSub]'); await page.wait_for_timeout(700)
            await sweep('abonnement ajouté depuis la détection')
        if await page.locator('[data-sub-ignore]').count():
            await page.locator('[data-sub-ignore]').first.click(); await page.wait_for_timeout(500)
            ig = (await srv_opts(page)).get('__subs', {}).get('ig', [])
            check('S3 mémoire d\'oubli : textes courts uniquement', all(isinstance(x, str) and len(x) <= 40 for x in ig), ig)
        await sweep('après oubli')

        # ---------- formulaires ----------
        await page.evaluate("S.tab='plan';S.planView='subs';render()"); await page.wait_for_timeout(200)
        await page.click('[data-sub-new]'); await page.wait_for_timeout(250)
        await page.fill('#sb-label', P + P)
        for bad in ['1e308', 'Infinity', '-5', '0', 'NaN', '0x10', '1e9999', '99999999999']:
            await page.fill('#sb-amt', bad); await page.click('[data-act=saveSub]'); await page.wait_for_timeout(200)
            n = await page.evaluate("Object.values(D.recurring).filter(r=>r.label.includes('<img')&&r.label.length>=100).length")
            check(f'F1 prix « {bad} » refusé', n == 0, (bad, await page.inner_text('#sb-err')))
        await page.fill('#sb-amt', '9,99'); await page.select_option('#sb-cur', 'USD')
        for bad in ['1e308', '0', '-3', 'abc', '100001']:
            await page.fill('#sb-fx', bad); await page.click('[data-act=saveSub]'); await page.wait_for_timeout(200)
            check(f'F2 taux « {bad} » refusé', 'taux' in (await page.inner_text('#sb-err')).lower(), await page.inner_text('#sb-err'))
        await page.fill('#sb-fx', '600'); await page.click('summary:has-text("Le prix va changer")')
        await page.evaluate("$('sb-npd').value='2026-02-31'"); await page.fill('#sb-npx', '5000')   # le champ date refuse une date impossible : valeur vide
        await page.click('[data-act=saveSub]'); await page.wait_for_timeout(200)
        check('F3 changement de prix sans date valide refusé', 'changement de prix' in (await page.inner_text('#sb-err')).lower())
        await page.fill('#sb-npd', ''); await page.fill('#sb-npx', '')
        await page.click('[data-act=saveSub]'); await page.wait_for_timeout(800)
        rows = await page.evaluate("Object.values(D.recurring).filter(r=>r.label.includes('<img')&&r.id!=='hr').map(r=>({l:r.label,a:r.amount}))")
        check('F4 libellé piégé enregistré comme texte, borné à 60 caractères, montant converti', len(rows) == 1 and len(rows[0]['l']) <= 60 and rows[0]['a'] == 5994, rows)
        await sweep('après enregistrement')
        # taux et frais de recharge
        await page.evaluate("S.tab='plan';S.planView='subs';render()"); await page.wait_for_timeout(200)
        await page.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
        before = json.dumps((await srv_opts(page)).get('__subs'), sort_keys=True)
        for fld, bad in [('sx-USD', P), ('sx-USD', '1e308'), ('sx-EUR', '-1'), ('sx-EUR', 'NaN'), ('sx-rf', '99'), ('sx-rf', P), ('sx-rf', '-2')]:
            await page.fill('#sx-USD', '600'); await page.fill('#sx-EUR', '656'); await page.fill('#sx-rf', '')
            await page.fill('#' + fld, bad); await page.click('[data-act=saveFx]'); await page.wait_for_timeout(250)
            err = await page.inner_text('#sx-err')
            check(f'F5 {fld} « {bad[:12]} » refusé avec un message', 'incorrect' in err or 'pourcentage' in err, err)
        check('F5 rien n\'est enregistré sur un refus', json.dumps((await srv_opts(page)).get('__subs'), sort_keys=True) == before)
        await sweep('taux piégés')
        # carte prépayée : recharge préremplie, libellé de portefeuille piégé
        await page.evaluate("S.tab='plan';S.planView='subs';render()"); await page.wait_for_timeout(200)
        if await page.locator('[data-recharge]').count():
            await page.locator('[data-recharge]').first.click(); await page.wait_for_timeout(350)
            await sweep('recharge de la carte')
            await page.click('#closeBtn'); await page.wait_for_timeout(200)
        # paiement d'une échéance piégée + apprentissage du taux avec des valeurs absurdes
        await page.evaluate("S.tab='dash';render()"); await page.wait_for_timeout(250)
        if await page.locator('[data-rec-pay]').count():
            await page.locator('[data-rec-pay]').first.click(); await page.wait_for_timeout(300)
            await page.fill('#f-amount', '99999999999'); await page.wait_for_timeout(150)
            await sweep('confirmation avec montant absurde')
            await page.click('#f-save'); await page.wait_for_timeout(500)
            c2 = await page.evaluate("JSON.stringify(subCfg())")
            check('F6 montant absurde : taux et prix inchangés ou valides', '1e+' not in c2 and 'Infinity' not in c2 and 'null' not in c2, c2[:300])
            if await page.is_visible('#f-save'): await page.click('#closeBtn'); await page.wait_for_timeout(150)
        await sweep('confirmation de paiement')

        # ---------- rappels et agenda ----------
        rem = await page.evaluate("buildReminders().map(r=>[r.id,r.title,r.body,r.fire_at])")
        check('R1 rappels : identifiants sûrs et textes bornés', all(len(r[1]) <= 80 and len(r[2]) <= 200 and all(c.isalnum() or c in '-_:.' for c in r[0]) for r in rem), [r[0] for r in rem][:6])
        ics = await page.evaluate("buildICS()")
        lines = [l for l in ics.replace('\r', '').split('\n') if l.startswith('SUMMARY')]
        check('R2 agenda : un libellé par ligne', all('\n' not in l for l in lines) and all(len(l) < 400 for l in lines), lines[:3])

        # ---------- import piégé ----------
        hostile_imp = {'app': 'carnet', 'version': 3, 'expenses': [], 'incomes': [], 'moves': [], 'budgets': [], 'recurring': [],
                       'settings': [{'user_id': 'u1', 'savings_goal': 0, 'opening': {'__subs': json.loads('{"fx":{"USD":"1e400","EUR":-4},"rf":"<b>","m":{"__proto__":{"p":3,"a":"2026-11"},"hr":{"p":3,"a":"2026-11","c":"USD","x":"<img src=x>"},"fine":{"p":6,"a":"2026-12"}},"ig":["<img src=x onerror=1>",5]}')}}]}
        res = await page.evaluate("""(o)=>{try{const c=cleanOpening(o.settings[0].opening);return JSON.stringify(c.__subs||null)}catch(e){return 'ERR '+e.message}}""", hostile_imp)
        rj = json.loads(res) if not res.startswith('ERR') else {}
        check('I1 import : valeurs piégées écartées, champs valides gardés', rj.get('fx') == {} and 'rf' not in rj and rj.get('m') == {'hr': {'p': 3, 'a': '2026-11'}, 'fine': {'p': 6, 'a': '2026-12'}}, res)
        await page.evaluate("S.tab='plan';S.planView='subs';render()"); await sweep('après import simulé')
        check('I2 aucune erreur JS', not page.errs, page.errs[:3])
        await ctx.close(); await b.close()
    srvp.terminate()
    return report()

async def srv_opts(page): return (await page.evaluate('window.__srv.settings'))[0]['opening']

sys.exit(asyncio.run(main()))
