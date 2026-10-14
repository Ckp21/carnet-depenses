"""2.6 : charges récurrentes « À payer » / « Payé », prévisions, rappels."""
import asyncio, json, os, sys
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

def ms(y, m, d, h=10): return int(datetime(y, m, d, h, 0).timestamp() * 1000)
def tweak(fn):
    s = json.loads(seed); fn(s); return json.dumps(s)

def base(s):
    # loyer le 5, réglé jusqu'en septembre ; aucune dépense générée pour octobre
    s['recurring'] = [{'id': 'loyer', 'label': 'Loyer', 'amount': 80000, 'fee': 0, 'category': 'logement', 'method': 'banque', 'day': 5, 'last_month': '2026-09', 'active': True, 'user_id': 'u1'}]
    s['expenses'] = [e for e in s['expenses'] if not e['id'].startswith('rec-loyer-2026-10')]

async def srv(page, t): return await page.evaluate(f'window.__srv.{t}')

async def main():
    srvp = start_server()
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx, page = await boot(b, tweak(base), tz='Africa/Brazzaville', now=ms(2026, 10, 14))
        n_exp = len(await srv(page, 'expenses'))
        check('R1 aucune dépense créée automatiquement', not any(e['id'] == 'rec-loyer-2026-10' for e in await srv(page, 'expenses')))
        pend = await page.evaluate("recPending().map(p=>[p.r.id,p.m,p.date,p.late,p.amount])")
        check('R1 loyer d\'octobre à payer, en retard de 9 jours', pend == [['loyer', '2026-10', '2026-10-05', 9, 80000]], pend)
        t = (await page.inner_text('#main')).lower()
        check('R1 bloc À payer sur l\'accueil', 'à payer' in t and 'en retard de 9 j' in t and 'payer' in t and 'pas ce mois-ci' in t)
        bank0 = await page.evaluate("balance('banque')"); esp0 = await page.evaluate("balance('especes')")
        check('R1 solde réel inchangé tant que non payé', True)
        c30 = await page.evaluate("committed(30)")
        check('R1 prévisions : loyer réservé', c30 >= 80000, c30)
        check('R1 prévisions : réservé même sur 1 jour (en retard)', await page.evaluate("committed(1)") >= 80000)
        fl = await page.evaluate("recPending().filter(p=>p.m<='2026-10').reduce((a,p)=>a+p.amount,0)")
        check('R1 reste à vivre tient compte du loyer à payer', fl == 80000)
        # confirmation avec montant réel et autre portefeuille
        await page.click('[data-rec-pay=loyer]'); await page.wait_for_timeout(300)
        title = await page.inner_text('#sheetTitle')
        check('R2 titre de confirmation', 'Confirmer le paiement' in title and 'Loyer' in title, title)
        check('R2 montant prérempli', (await page.input_value('#f-amount')).replace(' ', '').replace(' ', '').replace('\xa0', '') == '80000')
        check('R2 portefeuille prérempli', await page.evaluate("document.querySelector('input[name=met]:checked').value") == 'banque')
        check('R2 bouton explicite', (await page.inner_text('#f-save')) == 'Confirmer le paiement')
        check('R2 pas de choix de type d\'opération', await page.evaluate("$('kindSeg').hidden"))
        await page.fill('#f-amount', '82000'); await page.check('input[name=met][value=especes]', force=True); await page.fill('#f-date', '2026-10-12')
        await page.click('#f-save'); await page.wait_for_timeout(800)
        ex = [e for e in await srv(page, 'expenses') if e['id'] == 'rec-loyer-2026-10']
        check('R2 dépense créée avec le montant réel', len(ex) == 1 and ex[0]['amount'] == 82000 and ex[0]['method'] == 'especes' and ex[0]['date'] == '2026-10-12' and ex[0]['recurring_id'] == 'loyer', ex)
        check('R2 portefeuille payé débité', abs((esp0 - await page.evaluate("balance('especes')")) - 82000) < 1)
        check('R2 autre portefeuille intact', await page.evaluate("balance('banque')") == bank0)
        check('R2 plus rien à payer', await page.evaluate("recPending().length") == 0)
        rec = [r for r in await srv(page, 'recurring')][0]
        check('R2 dernier mois réglé avancé', rec['last_month'] == '2026-10', rec)
        check('R2 bloc À payer disparu', 'pas ce mois-ci' not in (await page.inner_text('#main')).lower())
        check('R2 prévisions libérées', await page.evaluate("committed(1)") < 80000)
        # supprimer le paiement : repasse à payer
        await page.evaluate("S.tab='list';render()")
        await page.click('[data-edit=rec-loyer-2026-10]'); await page.wait_for_timeout(300)
        await page.click('#f-del'); await page.click('#f-del'); await page.wait_for_timeout(800)
        check('R3 paiement supprimé repasse à payer', await page.evaluate("recPending().length") == 1 and (await srv(page, 'recurring'))[0]['last_month'] == '2026-09')
        # ignorer ce mois-ci avec confirmation
        await page.evaluate("S.tab='dash';render()")
        await page.click('[data-rec-skip=loyer]'); await page.wait_for_timeout(200)
        check('R4 ignorer demande confirmation', 'confirmer : pas ce mois-ci' in (await page.inner_text('#main')).lower() and await page.evaluate("recPending().length") == 1)
        await page.click('[data-rec-skip=loyer]'); await page.wait_for_timeout(800)
        st = (await srv(page, 'settings'))[0]
        check('R4 mois ignoré mémorisé', 'loyer|2026-10' in st['opening'].get('__skip', []), st['opening'])
        check('R4 plus à payer et plus réservé', await page.evaluate("recPending().length") == 0)
        check('R4 aucune dépense créée', not any(e['id'] == 'rec-loyer-2026-10' for e in await srv(page, 'expenses')))
        # nouvelle charge : à payer dès ce mois-ci
        await page.evaluate("S.tab='settings';render()")
        await page.click('summary:has-text("Ajouter une dépense récurrente")'); await page.wait_for_timeout(200)
        await page.fill('#r-label', 'Internet'); await page.fill('#r-amount', '15000'); await page.fill('#r-day', '20'); await page.click('[data-act=addRec]'); await page.wait_for_timeout(700)
        pd = await page.evaluate("recPending().map(p=>[p.r.label,p.m,p.late])")
        check('R5 nouvelle charge à payer ce mois-ci (non en retard)', pd == [['Internet', '2026-10', 0]], pd)
        check('R5 aucune dépense créée toute seule', not any(e.get('recurring_id') and e['date'] >= '2026-10-20' for e in await srv(page, 'expenses')))
        # pause et reprise
        await page.evaluate("mutate([{t:'recurring',op:'upsert',row:Object.assign({},D.recurring['loyer'],{active:false,last_month:'2026-03'})}])"); await page.wait_for_timeout(300)
        await page.evaluate("toggleRec('loyer')"); await page.wait_for_timeout(300)
        lm = await page.evaluate("D.recurring['loyer'].last_month")
        check('R6 reprise après pause : pas de retard accumulé', lm == '2026-09', lm)
        check('R6 aucune dépense créée', not any(e['id'].startswith('rec-loyer-2026-0') and e['id'] > 'rec-loyer-2026-09' and e['id'] < 'rec-loyer-2026-10' for e in await srv(page, 'expenses')))
        check('R7 aucune erreur JS', not page.errs, page.errs)
        await ctx.close()

        # retard cumulé plafonné à 3 mois
        ctx, page = await boot(b, tweak(lambda s: (base(s), s['recurring'][0].update(last_month='2026-05'), s.update(expenses=[e for e in s['expenses'] if not e['id'].startswith('rec-loyer-')]))), tz='Africa/Brazzaville', now=ms(2026, 10, 14))
        pend = await page.evaluate("recPending().map(p=>p.m)")
        check('R8 retard limité aux 3 derniers mois', pend == ['2026-08', '2026-09', '2026-10'], pend)
        await ctx.close()

        # mois suivant : nouvelle échéance, non en retard
        def nov(s):
            base(s); s['recurring'][0]['last_month'] = '2026-10'
            s['expenses'].append({'id': 'rec-loyer-2026-10', 'amount': 80000, 'fee': 0, 'category': 'logement', 'method': 'banque', 'date': '2026-10-05', 'note': 'Loyer', 'recurring_id': 'loyer', 'nature': None, 'user_id': 'u1'})
        ctx, page = await boot(b, tweak(nov), tz='Africa/Brazzaville', now=ms(2026, 11, 2))
        pend = await page.evaluate("recPending().map(p=>[p.m,p.date,p.late])")
        check('R9 mois suivant : échéance du 5, pas en retard', pend == [['2026-11', '2026-11-05', 0]], pend)
        check('R9 rappel programmé « À payer »', await page.evaluate("buildReminders().some(r=>r.id==='r-rec-loyer-2026-11-05'&&r.body.includes('À payer'))"))
        await ctx.close()
        # payé : plus de rappel
        def nov_paid(s):
            nov(s); s['recurring'][0]['last_month'] = '2026-11'
            s['expenses'].append({'id': 'rec-loyer-2026-11', 'amount': 80000, 'fee': 0, 'category': 'logement', 'method': 'banque', 'date': '2026-11-02', 'note': 'Loyer', 'recurring_id': 'loyer', 'nature': None, 'user_id': 'u1'})
        ctx, page = await boot(b, tweak(nov_paid), tz='Africa/Brazzaville', now=ms(2026, 11, 2))
        check('R9 payé : plus de rappel ni d\'échéance', await page.evaluate("recPending().length===0&&!buildReminders().some(r=>r.id.startsWith('r-rec-loyer-2026-11'))"))
        await ctx.close()
        # donnée héritée 2.5 : dépense déjà générée = payée
        ctx, page = await boot(b, seed, tz='Africa/Brazzaville', now=ms(2026, 10, 14))
        check('R10 donnée 2.5 : mois déjà généré reste payé', await page.evaluate("recPending().length") == 0)
        await ctx.close()
        await b.close()
    srvp.terminate()
    return report()

sys.exit(asyncio.run(main()))
