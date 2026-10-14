"""2.6 bloc A : opérations refusées, empreinte de contenu, aperçu de restauration, copies."""
import asyncio, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

async def add_expense(page, amount, note='essai'):
    await page.click('#fab'); await page.wait_for_timeout(150)
    await page.fill('#f-amount', str(amount)); await page.fill('#f-note', note)
    await page.check('input[name=cat][value=autres]', force=True)
    await page.click('#f-save'); await page.wait_for_timeout(500)

async def srv(page, t): return await page.evaluate(f'window.__srv.{t}')

async def main():
    s = start_server()
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        # ---- A1 : refus conservés
        ctx, page = await boot(b, seed)
        await page.evaluate("window.__fail.reject=[{t:'expenses',code:'23514',message:'new row for relation \"expenses\" violates check constraint'}]")
        n0 = len(await srv(page, 'expenses'))
        await add_expense(page, 4321, 'refusée')
        rj = await page.evaluate("JSON.parse(localStorage.getItem('cd2-rejected')||'[]')")
        check('A1 refus conservé en local', len(rj) == 1 and rj[0]['op']['row']['amount'] == 4321, rj)
        check('A1 absent du serveur', len(await srv(page, 'expenses')) == n0)
        check('A1 file d\'envoi vidée', await page.evaluate("outbox.length") == 0)
        txt = (await page.inner_text('#main')).lower()
        check('A1 bloc À corriger visible', 'à corriger' in txt and 'réessayer' in txt and 'abandonner' in txt)
        check('A1 statut non rassurant', 'à corriger' in (await page.inner_text('#syncTxt')) and 'synchronisé' not in (await page.inner_text('#syncTxt')))
        check('A1 ligne toujours visible localement', await page.evaluate("expenses().some(e=>e.amount===4321)"))
        await page.click('[data-tab=settings]'); await page.wait_for_timeout(200)
        check('A1 bloc visible aussi dans Réglages', 'à corriger' in (await page.inner_text('#main')).lower())
        await page.click('[data-tab=dash]'); await page.wait_for_timeout(200)
        # rechargement : le refus survit et la ligne reste
        await page.reload(); await page.wait_for_timeout(1200)
        check('A1 refus survit au rechargement', await page.evaluate("rejected.length") == 1 and await page.evaluate("expenses().some(e=>e.amount===4321)"))
        # réessai tant que la cause persiste : revient dans À corriger
        await page.evaluate("window.__fail.reject=[{t:'expenses',code:'23514',message:'boom'}]")
        await page.click('[data-rej-retry="0"]'); await page.wait_for_timeout(600)
        check('A1 réessai refusé de nouveau reste visible', await page.evaluate("rejected.length") == 1)
        # cause corrigée : le réessai passe
        await page.evaluate("window.__fail.reject=[]")
        await page.click('[data-rej-retry="0"]'); await page.wait_for_timeout(700)
        check('A1 réessai réussi : serveur à jour', len(await srv(page, 'expenses')) == n0 + 1)
        check('A1 réessai réussi : plus de refus', await page.evaluate("rejected.length") == 0 and 'à corriger' not in (await page.inner_text('#main')).lower())
        # modifier
        await page.evaluate("window.__fail.reject=[{t:'expenses',code:'23514',message:'boom'}]")
        await add_expense(page, 7777, 'à modifier')
        check('A1 second refus', await page.evaluate("rejected.length") == 1)
        await page.click('[data-rej-edit="0"]'); await page.wait_for_timeout(300)
        check('A1 modifier ouvre la saisie préremplie', (await page.input_value('#f-amount')).replace(' ', '').replace(' ', '') == '7777')
        await page.evaluate("window.__fail.reject=[]")
        await page.fill('#f-amount', '7000'); await page.click('#f-save'); await page.wait_for_timeout(700)
        ex = await srv(page, 'expenses')
        check('A1 modification corrigée envoyée et refus effacé', any(e['amount'] == 7000 for e in ex) and not any(e['amount'] == 7777 for e in ex) and await page.evaluate("rejected.length") == 0)
        # abandonner avec confirmation
        await page.evaluate("window.__fail.reject=[{t:'expenses',code:'23514',message:'boom'}]")
        await add_expense(page, 5555, 'à abandonner')
        await page.click('[data-rej-drop="0"]'); await page.wait_for_timeout(200)
        check('A1 abandon demande confirmation', 'confirmer l\'abandon' in (await page.inner_text('#main')).lower() and await page.evaluate("rejected.length") == 1)
        await page.evaluate("window.__fail.reject=[]")
        await page.click('[data-rej-drop="0"]'); await page.wait_for_timeout(900)
        check('A1 abandon confirmé : plus de refus et ligne retirée', await page.evaluate("rejected.length") == 0 and not await page.evaluate("expenses().some(e=>e.amount===5555)"))
        # refus d'un réglage (budgets) : pas modifiable mais visible
        await page.evaluate("window.__fail.reject=[{t:'budgets',code:'42501',message:'new row violates row-level security policy'}]")
        await page.evaluate("mutate([{t:'budgets',op:'upsert',row:{category:'transport',amount:12345,updated_at:nowISO()}}])"); await page.wait_for_timeout(500)
        t = await page.inner_text('#main')
        check('A1 refus de budget visible avec cause', 'Budget' in t and 'sécurité' in t and 'Modifier' not in t.split('CORRIGER')[1][:700], t[:600])
        check('A1 aucune erreur JS', not page.errs, page.errs)
        await ctx.close()

        # ---- A2 : empreinte de contenu
        ctx, page = await boot(b, seed)
        sig0 = await page.evaluate("dataSig()")
        await page.evaluate("mutate([{t:'budgets',op:'upsert',row:{category:'transport',amount:10000,updated_at:nowISO()}}])"); await page.wait_for_timeout(300)
        s1 = await page.evaluate("dataSig()")
        await page.evaluate("mutate([{t:'budgets',op:'upsert',row:{category:'transport',amount:20000,updated_at:nowISO()}}])"); await page.wait_for_timeout(300)
        s2 = await page.evaluate("dataSig()")
        check('A2 budget de même longueur détecté', s1 != s2 and s1 != sig0)
        await page.evaluate("mutate([settingsRow({savings_goal:60000})])"); await page.wait_for_timeout(200)
        a = await page.evaluate("dataSig()")
        await page.evaluate("mutate([settingsRow({savings_goal:70000})])"); await page.wait_for_timeout(200)
        c = await page.evaluate("dataSig()")
        check('A2 réglage de même longueur détecté', a != c)
        await page.evaluate("mutate([settingsRow({savings_goal:70000})])"); await page.wait_for_timeout(200)
        check('A2 réécriture identique sans effet', await page.evaluate("dataSig()") == c)
        r1 = await page.evaluate("(()=>{const x=D.expenses;const k=Object.keys(x)[0];const old=x[k].updated_at;x[k].updated_at='2030-01-01T00:00:00Z';const s=dataSig();x[k].updated_at=old;return s})()")
        check('A2 date technique ignorée', r1 == c)
        r2 = await page.evaluate("(()=>{const k=Object.keys(D.expenses)[0];const o=D.expenses[k].amount;D.expenses[k].amount=o+1;const s=dataSig();D.expenses[k].amount=o;return s})()")
        check('A2 montant modifié détecté', r2 != c)
        r3 = await page.evaluate("(()=>{const keys=Object.keys(D.expenses);const o=D.expenses;const rev={};for(const k of keys.reverse())rev[k]=o[k];D.expenses=rev;const s=dataSig();D.expenses=o;return s})()")
        check('A2 ordre sans effet', r3 == c)
        await ctx.close()

        # ---- A3 : aperçu de restauration
        ctx, page = await boot(b, seed)
        bk = await page.evaluate("JSON.parse(JSON.stringify(backupObject()))")
        e0 = bk['expenses'][0]; old_amt = e0['amount']; e0['amount'] = old_amt + 1000
        bk['expenses'].append({'id': 'nouveau-1', 'amount': 2500, 'fee': 0, 'category': 'transport', 'method': 'especes', 'date': '2026-10-05', 'note': 'taxi', 'recurring_id': None, 'nature': None})
        bk['expenses'] = bk['expenses'][:-3] if False else bk['expenses']
        n_loc = len(bk['expenses']) - 1
        bk['budgets'] = {'transport': 9000}
        path = os.path.join(OUT, 'bk-a3.json'); json.dump(bk, open(path, 'w'))
        # un élément local absent de la copie : on retire une dépense de la copie
        removed = bk['expenses'].pop(5); json.dump(bk, open(path, 'w'))
        nb_before = len(await srv(page, 'backups'))
        await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
        await page.set_input_files('#importFile', path); await page.wait_for_timeout(600)
        t = await page.inner_text('#main'); tl = t.lower()
        check('A3 aperçu affiché', 'aperçu de la restauration' in tl and 'ajoutés' in tl and 'remplacés' in tl and 'conservés' in tl)
        row = await page.evaluate("(()=>{const P=importPlan(pendingImport);return P.rows.find(r=>r.label==='Dépenses')})()")
        check('A3 dépenses : 1 ajoutée', row['add'] == 1, row)
        check('A3 dépenses : 1 remplacée', row['rep'] == 1, row)
        check('A3 dépenses : 1 conservée (absente de la copie)', row['keep'] == 1, row)
        brow = await page.evaluate("importPlan(pendingImport).rows.find(r=>r.label==='Budgets')")
        check('A3 budgets comptés', brow['add'] == 1, brow)
        check('A3 exemple de remplacement lisible', 'montant' in tl and '→' in t)
        check('A3 dit que rien n\'est supprimé mais peut être modifié', 'rien n\'est supprimé' in tl and 'peuvent être modifiés' in tl)
        # annuler ne change rien
        await page.click('[data-act=cancelImport]'); await page.wait_for_timeout(300)
        check('A3 annuler : aucun changement', not await page.evaluate("expenses().some(e=>e.id==='nouveau-1')"))
        await page.set_input_files('#importFile', path); await page.wait_for_timeout(500)
        await page.click('[data-act=doImport]'); await page.wait_for_timeout(1200)
        check('A3 restauration appliquée (ajout)', any(e['id'] == 'nouveau-1' for e in await srv(page, 'expenses')))
        check('A3 restauration appliquée (remplacement)', any(e['id'] == e0['id'] and e['amount'] == old_amt + 1000 for e in await srv(page, 'expenses')))
        check('A3 élément conservé toujours présent', any(e['id'] == removed['id'] for e in await srv(page, 'expenses')))
        check('A3 copie de sécurité avant restauration', len(await srv(page, 'backups')) > nb_before)
        await ctx.close()

        # ---- A4 : informations de copie
        ctx, page = await boot(b, seed)
        await page.click('[data-tab=settings]'); await page.wait_for_timeout(500)
        t = await page.inner_text('#main')
        tl = t.lower()
        check('A4 date de la dernière copie réussie', 'dernière copie réussie' in tl and ('il y a' in tl or 'à l\'instant' in tl), tl[:300])
        check('A4 fonctionnement décrit', 'quand tu l\'ouvres' in tl and 'si tu n\'ouvres pas le carnet' in tl and 'chaque nuit' in tl)
        check('A4 copie serveur non détectée signalée', 'non détectée' in tl)
        await ctx.close()
        seed_srv = json.loads(seed)
        from datetime import datetime, timezone
        seed_srv['backups'] = [{'id': 'b1', 'user_id': 'u1', 'kind': 'serveur', 'counts': {'expenses': 5, 'incomes': 1, 'plans': 0}, 'created_at': datetime.now(timezone.utc).isoformat(), 'payload': {}}]
        ctx, page = await boot(b, json.dumps(seed_srv))
        await page.click('[data-tab=settings]'); await page.wait_for_timeout(500)
        t = await page.inner_text('#main')
        check('A4 copie serveur détectée', 'serveur (nuit)' in t.lower() and 'non détectée pour l\'instant' not in t.lower())
        await ctx.close()
        # panne d'insertion : avertissement « aucune copie »
        ctx, page = await boot(b, seed, extra_init="window.__fail={net:false,log:[],reject:[{t:'backups',code:'XX000',message:'boom'}]}")
        await page.click('[data-tab=settings]'); await page.wait_for_timeout(500)
        t = await page.inner_text('#main')
        check('A4 alerte si aucune copie récente', 'aucune copie récente' in t.lower() or 'dernière tentative en échec' in t.lower(), t[:300])
        await ctx.close()
        # ---- A5 : une copie serveur (produite par test-sql.sh) se restaure depuis l'application
        snap = os.path.join(OUT, 'snapshot-serveur.json')
        if os.path.exists(snap):
            ctx, page = await boot(b, empty)
            await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
            await page.set_input_files('#importFile', snap); await page.wait_for_timeout(600)
            tl = (await page.inner_text('#main')).lower()
            plan = await page.evaluate("importPlan(pendingImport).rows.map(r=>r.label+':'+r.add)")
            check('A5 copie serveur lue par l\'application', 'aperçu de la restauration' in tl and 'Dépenses:2' in plan and 'Entrées:1' in plan, plan)
            await page.click('[data-act=doImport]'); await page.wait_for_timeout(900)
            check('A5 copie serveur restaurée', len(await srv(page, 'expenses')) == 2 and len(await srv(page, 'moves')) == 2)
            await ctx.close()
        else:
            print('A5 ignoré (lance tests/serveur/test-sql.sh avant)')
        await b.close()
    s.terminate()
    return report()

sys.exit(asyncio.run(main()))
