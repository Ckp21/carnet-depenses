"""2.7 : abonnements (périodicité, devise, carte prépayée, recharge, essai, changement de prix, détection) et reprise des récurrentes."""
import asyncio, json, os, re, sys
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

def ms(y, m, d, h=10): return int(datetime(y, m, d, h, 0).timestamp() * 1000)
NOW = ms(2026, 10, 14); TZ = 'Africa/Brazzaville'
def dg(t): return int(re.sub(r'\D', '', t) or 0)
def sp(t): return re.sub(r'\s+', '', t)
def rec(i, label, amount, method, day, last, cat='loisirs'):
    return {'id': i, 'label': label, 'amount': amount, 'fee': 0, 'category': cat, 'method': method, 'day': day, 'last_month': last, 'active': True, 'user_id': 'u1'}

def subs(s):
    op = s['settings'][0]['opening']
    op['__wallets'] = [{'id': 'carte1', 'label': 'Carte Dorcas', 'color': '#7C3AED', 'kind': 'card', 'archived': False, 'pro': False}]
    op['carte1'] = 10000
    op['__subs'] = {'fx': {'USD': 600}, 'rf': 2, 'ig': [], 'm': {'spot': {'c': 'USD', 'x': 9.99}, 'claude': {'c': 'USD', 'x': 20}, 'heberg': {'p': 12, 'a': '2027-01'}, 'assur': {'p': 3, 'a': '2026-11'}}}
    s['recurring'] += [rec('netflix', 'Netflix', 7500, 'carte1', 20, '2026-09'), rec('spot', 'Spotify', 5994, 'carte1', 25, '2026-09'), rec('claude', 'Claude', 12000, 'carte1', 28, '2026-09', 'factures'),
                       rec('heberg', 'Hébergement web', 60000, 'carte1', 10, '2026-12', 'factures'), rec('assur', 'Assurance', 30000, 'banque', 5, '2026-08', 'sante')]
def tweak(fn):
    s = json.loads(seed); fn(s); return json.dumps(s)
async def srv(page, t): return await page.evaluate(f'window.__srv.{t}')
async def opts(page): return (await srv(page, 'settings'))[0]['opening']
async def goto_subs(page):
    await page.evaluate("S.tab='plan';S.planView='subs';render()"); await page.wait_for_timeout(200)

async def main():
    srvp = start_server()
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx, page = await boot(b, tweak(subs), tz=TZ, now=NOW)
        n_rec0 = len(await srv(page, 'recurring')); st0 = json.dumps((await srv(page, 'recurring'))[0], sort_keys=True)
        # ---------- reprise des récurrentes existantes ----------
        check('M1 une charge sans fiche reste mensuelle en FCFA', await page.evaluate("subPer(D.recurring['loyer'])===1&&subM('loyer')===null&&recAmt(D.recurring['loyer'])===80000"))
        check('M1 aucune écriture au démarrage (rien modifié sans demande)', json.dumps((await srv(page, 'recurring'))[0], sort_keys=True) == st0 and len(await srv(page, 'recurring')) == n_rec0)
        await page.click('[data-tab=plan]'); await page.wait_for_timeout(250)
        check('M2 vue Objectifs par défaut', await page.evaluate("S.planView")  == 'goals' and 'tontines' in (await page.inner_text('#main')).lower())
        await page.click('[data-planview=subs]'); await page.wait_for_timeout(250)
        t = await page.inner_text('#main')
        check('M2 le loyer apparaît dans les abonnements', 'Loyer' in t and 'Netflix' in t and 'Spotify' in t and 'Hébergement web' in t)
        # ---------- totaux ----------
        monthly = 80000 + 7500 + 5994 + 12000 + 60000 / 12 + 30000 / 3
        got = await page.evaluate("sumBy(Object.values(D.recurring).filter(r=>r.active),subMonthly)")
        check('T1 coût mensuel équivalent', abs(got - monthly) < 1, (got, monthly))
        check('T1 total mensuel et annuel affichés', sp(f'{round(monthly):,}'.replace(',', '')) in sp(t) and sp(f'{round(monthly*12):,}'.replace(',', '')) in sp(t), t[:400])
        check('T1 une périodicité lisible', 'annuel' in t.lower() and 'trimestriel' in t.lower())
        check('T1 prix en devise visible', '9,99 USD' in t and '20 USD' in t, t[:800])
        # ---------- échéances par période ----------
        d = await page.evaluate("['loyer','assur','heberg','spot'].map(i=>{const n=subNext(D.recurring[i]);return [i,n&&n.date]})")
        check('P1 prochaines échéances : mensuelle, trimestrielle, annuelle', d == [['loyer', '2026-11-01'], ['assur', '2026-11-05'], ['heberg', '2027-01-10'], ['spot', '2026-10-25']], d)
        check('P1 trimestrielle : rien à payer en octobre', await page.evaluate("!recPending().some(p=>p.r.id==='assur'||p.r.id==='heberg')"))
        check('P1 mois non alignés ignorés', await page.evaluate("[recIsDue(D.recurring.assur,'2026-10'),recIsDue(D.recurring.assur,'2026-11'),recIsDue(D.recurring.assur,'2027-02'),recIsDue(D.recurring.heberg,'2027-01'),recIsDue(D.recurring.heberg,'2027-07')]") == [False, True, True, True, False])
        # ---------- carte prépayée : alerte de recharge ----------
        a = await page.evaluate("(()=>{const x=cardAlerts(30)[0];return {w:x.w,bal:x.bal,total:x.total,need:x.need,by:x.by,n:x.short.map(d=>d.r.id)}})()")
        check('K1 solde, besoin et date limite', a == {'w': 'carte1', 'bal': 10000, 'total': 25494, 'need': 15494, 'by': '2026-10-25', 'n': ['spot', 'claude']}, a)
        t = (await page.inner_text('#main')).replace('\xa0', ' ')
        check('K1 message de recharge sur l\'écran', 'Recharge la carte avant le 25 octobre 2026' in t and sp('Il faut 15 494') in sp(t) and 'pour 2 abonnements' in t and 'Spotify, Claude' in t, t[:700])
        check('K1 frais de recharge estimés', sp('environ 15 804') in sp(t) and '2 % de frais' in t, t[:900])
        await page.evaluate("S.tab='dash';render()"); await page.wait_for_timeout(200)
        dash = (await page.inner_text('#main')).replace('\xa0', ' ')
        check('K2 alerte sur l\'accueil', 'Recharge la carte avant le 25 octobre 2026' in dash and 'Carte Dorcas' in dash and await page.locator('#main [data-recharge=carte1]').count() == 1, dash[:600])
        # ---------- recharge depuis MoMo ----------
        mtn0 = await page.evaluate("balance('mtn')"); car0 = await page.evaluate("balance('carte1')")
        await page.click('#main [data-recharge=carte1]'); await page.wait_for_timeout(300)
        st = await page.evaluate("({kind:S.kind,mk:$('f-mkind').value,from:document.querySelector('input[name=from]:checked')?.value,to:document.querySelector('input[name=to]:checked')?.value,amt:$('f-amount').value,fee:$('f-fee').value,feeVis:!$('fs-fee').hidden,lg:$('fee-lg').textContent})")
        check('K3 recharge préremplie : transfert MoMo vers la carte', st['kind'] == 'move' and st['mk'] == 'transfer' and st['from'] == 'mtn' and st['to'] == 'carte1', st)
        check('K3 montant manquant et frais proposés', dg(st['amt']) == 15494 and dg(st['fee']) == 310, st)
        check('K3 champ de frais affiché pour une carte', st['feeVis'] and 'recharge' in st['lg'], st)
        await page.click('#f-save'); await page.wait_for_timeout(800)
        mv = [m for m in await srv(page, 'moves') if m.get('to_wallet') == 'carte1']
        check('K3 mouvement enregistré avec frais', len(mv) == 1 and mv[0]['amount'] == 15494 and mv[0]['fee'] == 310 and mv[0]['from_wallet'] == 'mtn' and mv[0]['kind'] == 'transfer', mv)
        check('K3 soldes : MoMo débité du montant et des frais, carte créditée', abs((mtn0 - await page.evaluate("balance('mtn')")) - 15804) < 1 and abs((await page.evaluate("balance('carte1')")) - car0 - 15494) < 1)
        check('K3 alerte disparue', await page.evaluate("cardAlerts(30)[0].need") == 0 and 'recharge la carte' not in (await page.inner_text('#main')).lower())
        await goto_subs(page)
        check('K3 « Solde suffisant » sur l\'écran', 'Solde suffisant' in await page.inner_text('#main'))
        # une charge à frais Mobile Money : le champ reste proposé sur un transfert depuis MoMo vers un portefeuille ordinaire
        await page.evaluate("openSheet(null,'move',{kind:'transfer',from:'mtn',to:'especes'})"); await page.wait_for_timeout(200)
        lg = await page.evaluate("$('fee-lg').textContent")
        check('K4 libellé des frais : Mobile Money pour un retrait', 'Mobile Money' in lg and await page.evaluate("!$('fs-fee').hidden"), lg)
        await page.click('#closeBtn')

        # ---------- ajout d'un abonnement en euros, annuel ----------
        await goto_subs(page)
        await page.click('[data-sub-new]'); await page.wait_for_timeout(250)
        await page.fill('#sb-label', 'Canva'); await page.fill('#sb-amt', '12,5'); await page.select_option('#sb-cur', 'EUR'); await page.wait_for_timeout(100)
        check('D1 taux euro prérempli (parité fixe)', await page.input_value('#sb-fx') == '656')
        check('D1 conversion annoncée', '8 200' in (await page.inner_text('#sb-conv')).replace(' ', ' ').replace('\xa0', ' '), await page.inner_text('#sb-conv'))
        await page.select_option('#sb-per', '12'); await page.fill('#sb-date', '2027-03-10')
        check('D1 carte prépayée proposée par défaut', await page.input_value('#sb-met') == 'carte1')
        await page.click('[data-act=saveSub]'); await page.wait_for_timeout(800)
        r = next(x for x in await srv(page, 'recurring') if x['label'] == 'Canva')
        m = (await opts(page))['__subs']['m'][r['id']]
        check('D1 charge enregistrée : montant FCFA, jour, mois de départ', r['amount'] == 8200 and r['day'] == 10 and r['last_month'] == '2027-02' and r['method'] == 'carte1' and r['active'], r)
        check('D1 fiche : période, ancrage, devise, prix', m == {'p': 12, 'a': '2027-03', 'c': 'EUR', 'x': 12.5}, m)
        check('D1 taux enregistré', (await opts(page))['__subs']['fx']['EUR'] == 656)
        check('D1 prochaine échéance en 2027', await page.evaluate(f"subNext(D.recurring['{r['id']}']).date") == '2027-03-10')
        # ---------- changement de taux : recalcul des abonnements en dollars ----------
        await page.click('summary:has-text("Taux de change")'); await page.fill('#sx-USD', '620'); await page.fill('#sx-rf', '1,5'); await page.click('[data-act=saveFx]'); await page.wait_for_timeout(800)
        amts = {x['id']: x['amount'] for x in await srv(page, 'recurring')}
        check('F1 abonnements en USD recalculés', amts['spot'] == 6194 and amts['claude'] == 12400 and amts['netflix'] == 7500, amts)
        check('F1 taux et frais enregistrés', (await opts(page))['__subs']['fx']['USD'] == 620 and (await opts(page))['__subs']['rf'] == 1.5)
        await page.fill('#sx-USD', '0'); await page.click('[data-act=saveFx]'); await page.wait_for_timeout(300)
        check('F2 taux invalide refusé', 'incorrect' in await page.inner_text('#sx-err') and (await opts(page))['__subs']['fx']['USD'] == 620)
        await page.fill('#sx-USD', '600'); await page.click('[data-act=saveFx]'); await page.wait_for_timeout(800)
        check('F2 retour à 600', {x['id']: x['amount'] for x in await srv(page, 'recurring')}['spot'] == 5994)

        # ---------- paiement : le montant débité réellement apprend le taux ----------
        await page.click('[data-rec-pay=spot]'); await page.wait_for_timeout(300)
        await page.fill('#f-amount', '6300'); await page.wait_for_timeout(150)
        keep = await page.evaluate("({vis:!$('fs-keep').hidden,t:$('keep-t').textContent})")
        check('L1 proposition de retenir le taux', keep['vis'] and '630,63' in keep['t'] and '1 USD' in keep['t'], keep)
        await page.fill('#f-amount', '5994'); await page.wait_for_timeout(100)
        check('L1 montant conforme : rien à retenir', await page.evaluate("$('fs-keep').hidden"))
        await page.fill('#f-amount', '6300'); await page.uncheck('#f-keep'); await page.click('#f-save'); await page.wait_for_timeout(800)
        check('L2 décoché : le taux ne change pas', (await opts(page))['__subs']['fx']['USD'] == 600 and {x['id']: x['amount'] for x in await srv(page, 'recurring')}['spot'] == 5994)
        check('L2 dépense réelle enregistrée', any(e['id'] == 'rec-spot-2026-10' and e['amount'] == 6300 for e in await srv(page, 'expenses')))
        await page.click('[data-rec-pay=claude]'); await page.wait_for_timeout(300)
        await page.fill('#f-amount', '12600'); await page.wait_for_timeout(150)
        check('L3 coché par défaut', await page.is_checked('#f-keep'))
        await page.click('#f-save'); await page.wait_for_timeout(900)
        fx = (await opts(page))['__subs']['fx']['USD']; am = {x['id']: x['amount'] for x in await srv(page, 'recurring')}
        check('L3 taux appris = montant débité / prix', fx == 630, fx)
        check('L3 tous les abonnements en USD suivent le nouveau taux', am['claude'] == 12600 and am['spot'] == round(9.99 * 630), am)
        check('L3 mois réglé : dernier mois avancé', next(x for x in await srv(page, 'recurring') if x['id'] == 'claude')['last_month'] == '2026-10')
        await page.click('[data-rec-pay=netflix]'); await page.wait_for_timeout(300)
        await page.fill('#f-amount', '8000'); await page.wait_for_timeout(150)
        check('L4 abonnement en FCFA : nouveau prix proposé', 'Retenir ce montant' in await page.inner_text('#keep-t'))
        await page.click('#f-save'); await page.wait_for_timeout(900)
        check('L4 prix retenu pour les prochains mois', {x['id']: x['amount'] for x in await srv(page, 'recurring')}['netflix'] == 8000)

        # ---------- essai gratuit et changement de prix ----------
        await goto_subs(page)
        neg = await page.evaluate("(()=>{const a=cardAlerts(30)[0];return {bal:a.bal,need:a.need,by:a.by,n:a.dues.length}})()")
        check('K5 solde de carte négatif sans prélèvement : aucun besoin inventé, pas d\'erreur', neg['bal'] < 0 and neg['need'] == 0 and neg['by'] is None and neg['n'] == 0 and 'solde négatif' in (await page.inner_text('#main')).lower() and not page.errs, (neg, page.errs))
        await page.click('[data-sub-new]'); await page.wait_for_timeout(250)
        await page.fill('#sb-label', 'Disney'); await page.fill('#sb-amt', '4000'); await page.fill('#sb-date', '2026-10-17'); await page.check('#sb-trial')
        await page.click('summary:has-text("Le prix va changer")'); await page.fill('#sb-npd', '2026-11-20'); await page.fill('#sb-npx', '5000')
        await page.click('[data-act=saveSub]'); await page.wait_for_timeout(800)
        dis = next(x for x in await srv(page, 'recurring') if x['label'] == 'Disney'); dm = (await opts(page))['__subs']['m'][dis['id']]
        check('E1 essai et changement de prix mémorisés', dm.get('t') == '2026-10-17' and dm.get('n') == {'d': '2026-11-20', 'x': 5000}, dm)
        check('E1 prix avant et après la date', await page.evaluate(f"[recAmt(D.recurring['{dis['id']}'],'2026-11-19'),recAmt(D.recurring['{dis['id']}'],'2026-11-20')]") == [4000, 5000])
        await page.evaluate("S.tab='dash';render()"); await page.wait_for_timeout(200)
        dash = (await page.inner_text('#main')).replace('\xa0', ' ')
        check('E2 alerte fin d\'essai sur l\'accueil', 'Essai gratuit : Disney' in dash and 'Annule avant' in dash, dash[:500])
        rem = await page.evaluate("buildReminders().map(r=>[r.id,r.title,r.body,r.fire_at])")
        es = [r for r in rem if r[0].startswith('r-essai-')]; px = [r for r in rem if r[0].startswith('r-prix-')]
        check('E3 rappel de fin d\'essai la veille', len(es) == 1 and 'Disney' in es[0][1] and es[0][3].startswith('2026-10-16'), es)
        check('E3 rappel de changement de prix trois jours avant', len(px) == 1 and px[0][3].startswith('2026-11-17') and 'nouveau prix' in px[0][2], px)
        check('E3 rappel annuel une semaine avant (hébergement)', any(r[0].startswith('r-renouv-heberg-') for r in rem) is False)  # hors fenêtre de 45 jours : janvier 2027
        # ---------- renouvellement annuel proche ----------
        await page.evaluate("mutate([{t:'recurring',op:'upsert',row:Object.assign({},D.recurring.heberg,{last_month:'2026-12'})}])")
        rem2 = await page.evaluate("buildReminders().filter(r=>r.id.startsWith('r-renouv-')).length")
        check('E3 pas de rappel annuel hors fenêtre', rem2 == 0)
        # ---------- modification : jamais de retour en arrière ----------
        await goto_subs(page)
        await page.click('[data-sub-edit=assur]'); await page.wait_for_timeout(250)
        check('U1 formulaire prérempli', await page.input_value('#sb-label') == 'Assurance' and await page.input_value('#sb-amt') == '30000' and await page.input_value('#sb-per') == '3' and await page.input_value('#sb-date') == '2026-11-05')
        await page.fill('#sb-amt', '32000'); await page.click('[data-act=saveSub]'); await page.wait_for_timeout(800)
        r = next(x for x in await srv(page, 'recurring') if x['id'] == 'assur')
        check('U1 prix modifié, échéance inchangée', r['amount'] == 32000 and r['last_month'] == '2026-08' and r['day'] == 5, r)
        check('U1 période conservée', (await opts(page))['__subs']['m']['assur'] == {'p': 3, 'a': '2026-11'})
        await page.click('[data-sub-edit=assur]'); await page.wait_for_timeout(250)
        await page.select_option('#sb-per', '1'); await page.click('[data-act=saveSub]'); await page.wait_for_timeout(800)
        check('U2 passage en mensuel : fiche allégée', 'assur' not in (await opts(page))['__subs']['m'])
        # pause et reprise depuis la fenêtre
        await page.click('[data-sub-edit=netflix]'); await page.wait_for_timeout(250)
        await page.click('[data-sub-pause=netflix]'); await page.wait_for_timeout(700)
        check('U3 mise en pause', next(x for x in await srv(page, 'recurring') if x['id'] == 'netflix')['active'] is False and 'en pause' in (await page.inner_text('#main')).lower())
        # retrait avec confirmation : la fiche disparaît aussi
        await page.click('[data-sub-edit=spot]'); await page.wait_for_timeout(250)
        await page.click('[data-sub-del=spot]'); await page.wait_for_timeout(150)
        check('U4 retrait demande confirmation', 'Confirmer' in await page.inner_text('[data-sub-del=spot]') and any(x['id'] == 'spot' for x in await srv(page, 'recurring')))
        await page.click('[data-sub-del=spot]'); await page.wait_for_timeout(800)
        check('U4 charge et fiche retirées, dépenses conservées', not any(x['id'] == 'spot' for x in await srv(page, 'recurring')) and 'spot' not in (await opts(page))['__subs']['m'] and any(e['id'] == 'rec-spot-2026-10' for e in await srv(page, 'expenses')))
        # ---------- nouvelle carte prépayée ----------
        await page.evaluate("mutate([settingsRow({opening:Object.assign({},D.settings.opening,{__wallets:cfgWallets().map(w=>Object.assign({},w,{archived:true}))})})])"); await page.wait_for_timeout(300)
        await goto_subs(page)
        check('W1 sans carte : invitation à en ajouter', await page.locator('[data-act=subNewCard]').count() == 1)
        await page.click('[data-act=subNewCard]'); await page.wait_for_timeout(300)
        wf = await page.evaluate("({tab:S.tab,kind:$('wf-kind').value,name:$('wf-name').value})")
        check('W1 formulaire de portefeuille prérempli en carte prépayée', wf == {'tab': 'accounts', 'kind': 'card', 'name': 'Carte prépayée'}, wf)
        check('Z1 aucune erreur JS', not page.errs, page.errs)
        await ctx.close()

        # ---------- détection dans l'historique ----------
        def hist(s):
            subs(s)
            add = lambda i, d, n, a: s['expenses'].append({'id': i, 'amount': a, 'fee': 0, 'category': 'loisirs', 'method': 'carte1', 'date': d, 'note': n, 'recurring_id': None, 'nature': None, 'user_id': 'u1'})
            add('n1', '2026-09-28', 'Canva Pro', 7500)
            for i, d in enumerate(['2026-08-05', '2026-09-05', '2026-10-05']): add(f's{i}', d, 'Salle de sport', 15000)
            for i, d in enumerate(['2026-08-01', '2026-09-20', '2026-10-09']): add(f'x{i}', d, 'Divers', 3000 + i * 1000)   # intervalles irréguliers : pas un abonnement
        ctx, page = await boot(b, tweak(hist), tz=TZ, now=NOW)
        det = await page.evaluate("subDetect().map(d=>[d.key,d.p,d.amount,d.known,d.date])")
        keys = [d[0] for d in det]
        check('X1 service connu vu une fois', 'canva pro' in keys and [d for d in det if d[0] == 'canva pro'][0][1] == 1, det)
        check('X1 paiement mensuel régulier', 'salle de sport' in keys and [d for d in det if d[0] == 'salle de sport'][0][1:3] == [1, 15000], det)
        check('X1 prochaine date proposée', [d for d in det if d[0] == 'salle de sport'][0][4] == '2026-11-05', det)
        check('X1 intervalles irréguliers écartés', 'divers' not in keys, det)
        check('X1 charges déjà suivies écartées', not any('loyer' in k for k in keys), keys)
        await goto_subs(page)
        check('X2 bloc « Abonnements détectés »', 'abonnements détectés' in (await page.inner_text('#main')).lower())
        await page.click('[data-sub-add="salle de sport"]'); await page.wait_for_timeout(300)
        pre = await page.evaluate("({l:$('sb-label').value,a:$('sb-amt').value,m:$('sb-met').value,d:$('sb-date').value,p:$('sb-per').value})")
        check('X2 formulaire prérempli depuis l\'historique', pre['l'] == 'Salle de sport' and dg(pre['a']) == 15000 and pre['m'] == 'carte1' and pre['d'] == '2026-11-05' and pre['p'] == '1', pre)
        await page.click('[data-act=saveSub]'); await page.wait_for_timeout(800)
        check('X2 ajouté puis plus proposé', 'salle de sport' not in await page.evaluate("subDetect().map(d=>d.key)") and any(x['label'] == 'Salle de sport' for x in await srv(page, 'recurring')))
        await page.click('[data-sub-ignore="canva pro"]'); await page.wait_for_timeout(800)
        check('X3 ignoré : mémorisé et plus proposé', 'canva pro' in (await opts(page))['__subs']['ig'] and 'canva pro' not in await page.evaluate("subDetect().map(d=>d.key)"))
        await page.reload(); await page.wait_for_timeout(900)
        check('X3 reste ignoré après rechargement', 'canva pro' not in await page.evaluate("subDetect().map(d=>d.key)"))
        check('X4 aucune erreur JS', not page.errs, page.errs)
        # ---------- agenda : abonnement annuel ----------
        ics = await page.evaluate("buildICS()")
        check('X5 agenda : annuel avec intervalle de 12 mois', 'FREQ=MONTHLY;INTERVAL=12;BYMONTHDAY=10' in ics and 'Hébergement web' in ics, ics[:200])
        # ---------- mémorisation de la vue ----------
        await page.evaluate("S.tab='plan';S.planView='subs';LS.set(K.planView,'subs');render()"); await page.reload(); await page.wait_for_timeout(900)
        check('X6 vue Abonnements retenue après rechargement', await page.evaluate("S.planView") == 'subs')
        await ctx.close()
        await b.close()
    srvp.terminate()
    return report()

sys.exit(asyncio.run(main()))
