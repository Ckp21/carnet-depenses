"""2.8 : situation de la personne (statut, logement, transport, charges), budgets proposés limités aux postes payés,
démarrage guidé adapté, types d'entrées par familles, nouvelles catégories (soins, sport, abonnements)."""
import asyncio, json, os, re, sys
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

def ms(y, m, d, h=10): return int(datetime(y, m, d, h, 0).timestamp() * 1000)
NOW = ms(2026, 10, 14); TZ = 'Africa/Brazzaville'
LEGACY = ['alimentation', 'logement', 'factures', 'transport', 'communication', 'sante', 'famille', 'loisirs', 'vetements', 'education', 'autres']

def tweak(fn):
    s = json.loads(seed); fn(s); return json.dumps(s)
def no_rent(s):   # un carnet sans loyer ni transport notés : la situation décide seule
    s['expenses'] = [e for e in s['expenses'] if e['category'] not in ('logement', 'transport')]
    s['recurring'] = []
def prof(p):
    def f(s):
        no_rent(s); s['settings'][0]['opening']['__profil'] = p
    return f
async def srv(page, t): return await page.evaluate(f'window.__srv.{t}')
async def opts(page): return (await srv(page, 'settings'))[0]['opening']
async def prop(page): return await page.evaluate("(()=>{const R=incomeIn(curM())||400000;const P=proposal(R);return {R,amt:P.amt,off:P.off,idle:P.idle,save:P.saveAmt,known:P.known}})()")

async def main():
    srvp = start_server()
    async with async_playwright() as pw:
        b = await pw.chromium.launch()

        # ---------- P : budgets proposés ----------
        ctx, page = await boot(b, tweak(no_rent), tz=TZ, now=NOW)
        base = await prop(page)
        check('P1 sans réponse : les 11 postes habituels sont proposés', sorted(base['amt']) == sorted(LEGACY) and base['off'] == [], base)
        tot = sum(base['amt'].values()) + base['save']
        check('P1 la somme proposée reste égale aux entrées (à l\'arrondi près)', abs(tot - base['R']) <= 4000, (tot, base['R']))
        check('P1 soins, sport, abonnements : pas de repère national, donc rien sans dépenses', base['idle'] == ['soins', 'sport', 'abonnements'], base['idle'])
        await ctx.close()

        ctx, page = await boot(b, tweak(prof({'st': 'cdi', 'lg': 'heb', 'tr': 'pied', 'ch': 0})), tz=TZ, now=NOW)
        p2 = await prop(page)
        check('P2 hébergé et à pied : ni logement ni transport ni éducation', p2['off'] == ['logement', 'transport', 'education'] and not any(k in p2['amt'] for k in ['logement', 'transport', 'education']), p2)
        tot2 = sum(p2['amt'].values()) + p2['save']
        check('P2 la part des postes écartés est répartie, le total reste cohérent', abs(tot2 - p2['R']) <= 4000, (tot2, p2['R']))
        check('P2 les autres postes augmentent', p2['amt']['loisirs'] > base['amt']['loisirs'] and p2['amt']['sante'] >= base['amt']['sante'], (p2['amt'], base['amt']))
        await page.evaluate("S.tab='plan';render()"); await page.wait_for_timeout(250)
        t = (await page.inner_text('#main')).replace('\xa0', ' ')
        check('P2 l\'écran Budgets proposés explique ce qui est écarté', 'Adapté à ta situation' in t and 'Logement, Transport, Éducation' in t, t[t.find('Budgets proposés'):][:500])
        rows = await page.evaluate("[...document.querySelectorAll('.prop-row .lab')].map(x=>x.textContent.trim())")
        check('P2 aucune ligne Logement ni Transport dans la liste', not any(r.startswith(('Logement', 'Transport')) for r in rows), rows)
        n_bud = len(await srv(page, 'budgets'))
        await page.click('[data-act=applyProp]'); await page.wait_for_timeout(700)
        bud = {x['category'] for x in await srv(page, 'budgets')}
        check('P2 appliquer n\'écrit que les postes concernés', 'logement' not in bud and 'transport' not in bud and 'alimentation' in bud and n_bud == 0, bud)
        await ctx.close()

        # les dépenses réelles passent avant les réponses
        ctx, page = await boot(b, tweak(lambda s: s['settings'][0]['opening'].update({'__profil': {'lg': 'heb', 'tr': 'pied'}})), tz=TZ, now=NOW)
        p3 = await prop(page)
        check('P3 des dépenses de logement et de transport existent : elles restent proposées', 'logement' in p3['amt'] and 'transport' in p3['amt'] and p3['off'] == [], p3)
        await ctx.close()
        ctx, page = await boot(b, tweak(lambda s: s['settings'][0]['opening'].update({'__profil': {'pay': {'logement': False}}})), tz=TZ, now=NOW)
        p4 = await prop(page)
        check('P4 un choix explicite « je ne paie pas » l\'emporte', 'logement' not in p4['amt'] and p4['off'] == ['logement'], p4)
        await ctx.close()

        # lignes sans repère national : montants réels
        def with_new(s):
            no_rent(s)
            for m in ['2026-07', '2026-08', '2026-09']:
                s['expenses'].append({'id': 'sn' + m, 'amount': 12000, 'fee': 0, 'category': 'soins', 'method': 'especes', 'date': m + '-12', 'note': 'Coiffure', 'recurring_id': None, 'nature': None, 'user_id': 'u1'})
            s['recurring'].append({'id': 'nf', 'label': 'Netflix', 'amount': 6000, 'fee': 0, 'category': 'abonnements', 'method': 'banque', 'day': 8, 'last_month': '2026-09', 'active': True, 'user_id': 'u1'})
        ctx, page = await boot(b, tweak(with_new), tz=TZ, now=NOW)
        p5 = await prop(page)
        check('P5 soins : budget proposé d\'après la moyenne réelle', p5['amt'].get('soins') == 12000 and 'soins' in p5['known'], p5)
        check('P5 abonnements : budget proposé d\'après les charges régulières', p5['amt'].get('abonnements') == 6000, p5)
        check('P5 sport : rien sans dépense', 'sport' not in p5['amt'] and p5['idle'] == ['sport'], p5)
        check('P5 le total reste cohérent avec les lignes ajoutées', abs(sum(p5['amt'].values()) + p5['save'] - p5['R']) <= 5000, (p5, ))
        await page.evaluate("S.tab='plan';render()"); await page.wait_for_timeout(250)
        t = (await page.inner_text('#main')).replace('\xa0', ' ')
        check('P5 libellé : d\'après tes dépenses réelles', t.count('d\'après tes dépenses réelles') >= 2 and 'Soins du corps' in t, t[t.find('Budgets proposés'):][:700])
        await ctx.close()

        # ---------- R : Réglages > Ma situation ----------
        ctx, page = await boot(b, tweak(no_rent), tz=TZ, now=NOW)
        await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
        check('R1 bloc « Ma situation » en tête de Réglages', 'ma situation' in (await page.inner_text('#main')).lower()[:400])
        await page.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
        st0 = await page.evaluate("[...document.querySelectorAll('[data-paycat]')].map(b=>[b.dataset.paycat,b.checked])")
        check('R1 tous les postes habituels cochés au départ, nouveaux postes décochés', dict(st0)['logement'] and dict(st0)['transport'] and not dict(st0)['soins'] and not dict(st0)['sport'] and len(st0) == 13, st0)
        await page.select_option('#pf-lg', 'heb'); await page.select_option('#pf-tr', 'pied'); await page.wait_for_timeout(150)
        st1 = dict(await page.evaluate("[...document.querySelectorAll('[data-paycat]')].map(b=>[b.dataset.paycat,b.checked])"))
        check('R2 les cases suivent les réponses', st1['logement'] is False and st1['transport'] is False and st1['alimentation'] is True, st1)
        check('R2 phrase de synthèse mise à jour', 'Logement, Transport' in (await page.inner_text('#pf-note')))
        await page.check('[data-paycat=logement]'); await page.select_option('#pf-ch', '0'); await page.wait_for_timeout(150)
        st2 = dict(await page.evaluate("[...document.querySelectorAll('[data-paycat]')].map(b=>[b.dataset.paycat,b.checked])"))
        check('R2 une case cochée à la main n\'est pas écrasée', st2['logement'] is True and st2['education'] is False, st2)
        check('R2 date de fin masquée hors stage et CDD', await page.is_hidden('#pf-fin-row'))
        await page.select_option('#pf-st', 'cdd'); await page.wait_for_timeout(150)
        check('R2 date de fin proposée pour un CDD', await page.is_visible('#pf-fin-row') and 'contrat' in await page.inner_text('#pf-fin-lg'))
        await page.fill('#pf-fin', '2026-10-01'); await page.click('[data-act=saveProfil]'); await page.wait_for_timeout(400)
        check('R4 date de fin passée refusée', '__profil' not in await opts(page), await opts(page))
        await page.fill('#pf-fin', '2026-11-20'); await page.click('[data-act=saveProfil]'); await page.wait_for_timeout(800)
        o = await opts(page)
        check('R4 situation enregistrée, seules les cases modifiées à la main sont mémorisées', o.get('__profil') == {'st': 'cdd', 'lg': 'heb', 'tr': 'pied', 'ch': 0, 'fin': '2026-11-20', 'pay': {'logement': True}}, o.get('__profil'))
        await page.reload(); await page.wait_for_timeout(900)
        pr = await prop(page)
        check('R4 après rechargement : transport écarté, logement conservé par choix', 'transport' not in pr['amt'] and 'logement' in pr['amt'], pr)
        await page.evaluate("S.tab='dash';render()"); await page.wait_for_timeout(250)
        dash = (await page.inner_text('#main')).replace('\xa0', ' ')
        check('R5 alerte de fin de contrat sur l\'accueil', 'Fin de contrat proche' in dash and 'Dans 37 jours' in dash, dash[:600])
        await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
        await page.click('[data-act=emSix]'); await page.wait_for_timeout(700)
        check('R5 fonds d\'urgence réglé à 6 mois en un geste', (await srv(page, 'settings'))[0]['emergency_months'] == 6 and 'Régler à 6 mois' not in await page.inner_text('#main'))
        # supprimer la situation : tout revient aux réglages d'origine
        await page.select_option('#pf-st', ''); await page.select_option('#pf-lg', ''); await page.select_option('#pf-tr', ''); await page.select_option('#pf-ch', '')
        await page.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
        await page.check('[data-paycat=transport]'); await page.uncheck('[data-paycat=logement]'); await page.check('[data-paycat=logement]')
        await page.click('[data-act=saveProfil]'); await page.wait_for_timeout(800)
        check('R6 tout vider supprime la clé', '__profil' not in await opts(page), await opts(page))
        check('R6 aucune erreur JS', not page.errs, page.errs)
        await ctx.close()

        # ---------- O : démarrage guidé adapté ----------
        ctx, page = await boot(b, empty, tz=TZ, now=NOW, onb=True)
        check('O1 le guide commence par la situation', 'étape 1 sur 4' in (await page.inner_text('#onb')).lower() and await page.is_visible('#ob-st'))
        await page.select_option('#ob-st', 'stagiaire'); await page.select_option('#ob-lg', 'heb'); await page.select_option('#ob-tr', 'pied'); await page.select_option('#ob-ch', '0'); await page.wait_for_timeout(150)
        check('O1 date de fin de stage proposée', await page.is_visible('#ob-fin-row') and 'stage' in await page.inner_text('#ob-fin-lg'))
        check('O1 aperçu de ce qui sera écarté', 'Logement, Transport' in await page.inner_text('#ob-note'))
        await page.fill('#ob-fin', '2026-12-01'); await page.click('[data-act=onbNext]'); await page.wait_for_timeout(700)
        o = (await srv(page, 'settings'))[0]['opening']
        check('O2 situation enregistrée', o['__profil'] == {'st': 'stagiaire', 'lg': 'heb', 'tr': 'pied', 'ch': 0, 'fin': '2026-12-01'}, o)
        await page.fill('#ob-w-especes', '20000'); await page.click('[data-act=onbNext]'); await page.wait_for_timeout(700)
        t = await page.inner_text('#onb')
        check('O3 le revenu s\'adapte : indemnité de stage', 'Ton indemnité ou ton allocation' in t and 'dernier versement reçu' in t.lower(), t[:300])
        await page.fill('#ob-day', '5'); await page.fill('#ob-sal', '90000'); await page.fill('#ob-sal-d', '2026-10-05'); await page.click('[data-act=onbNext]'); await page.wait_for_timeout(800)
        inc = await srv(page, 'incomes')
        check('O3 le versement est rangé en « Indemnité de stage »', len(inc) == 1 and inc[0]['source'] == 'stage' and inc[0]['note'] == 'Indemnité de stage', inc)
        ph = await page.evaluate("[0,1,2].map(i=>$('ob-rl-'+i).placeholder)")
        check('O4 hébergé : pas de loyer suggéré', ph == ['Électricité', 'Internet', 'Eau'], ph)
        await page.click('[data-act=onbNext]'); await page.wait_for_timeout(600)
        await page.click('[data-act=onbSkip]'); await page.wait_for_timeout(500)
        await page.evaluate("S.tab='dash';render()"); await page.wait_for_timeout(250)
        dash = (await page.inner_text('#main')).replace('\xa0', ' ')
        check('O5 accueil : fin de stage annoncée', 'Fin de stage proche' in dash and 'Dans 48 jours' in dash, dash[:500])
        check('O5 la date de paie du stagiaire rythme le cycle', await page.evaluate("payInfo().last&&payInfo().last.source")  == 'stage')
        await ctx.close()

        ctx, page = await boot(b, empty, tz=TZ, now=NOW, onb=True)
        await page.select_option('#ob-st', 'indep'); await page.click('[data-act=onbNext]'); await page.wait_for_timeout(500)
        await page.fill('#ob-w-banque', '100000'); await page.click('[data-act=onbNext]'); await page.wait_for_timeout(500)
        t = await page.inner_text('#onb')
        check('O6 indépendant : revenus irréguliers', 'Tes revenus' in t and 'varient' in t, t[:250])
        await page.fill('#ob-sal', '60000'); await page.fill('#ob-sal-d', '2026-10-10'); await page.click('[data-act=onbNext]'); await page.wait_for_timeout(700)
        check('O6 encaissement rangé en « Honoraires et missions »', (await srv(page, 'incomes'))[0]['source'] == 'mission')
        await page.click('[data-act=onbSkip]'); await page.wait_for_timeout(600)
        hero = (await page.inner_text('#hero')).lower()
        check('O6 pas de rappel insistant pour un jour de paie', 'irréguliers' in hero and 'indique ton jour de paie' not in hero, hero[:500])
        await ctx.close()

        # ---------- E : types d'entrées ----------
        ctx, page = await boot(b, seed, tz=TZ, now=NOW)
        await page.evaluate("openSheet(null,'income')"); await page.wait_for_timeout(300)
        fam = await page.evaluate("[...document.querySelectorAll('#f-srcs .fam')].map(x=>x.textContent)")
        n = await page.locator('#f-srcs input[name=src]').count()
        check('E1 trois familles plus « Autre »', fam == ['Revenus de travail', 'Revenus de capital', 'Prestations et dons', 'Autre'] and n == 13, (fam, n))
        labels = await page.evaluate("[...document.querySelectorAll('#f-srcs .chip span')].map(x=>x.textContent.trim())")
        want = ['Salaire', 'Primes et commissions', 'Honoraires et missions', 'Pourboires', 'Revenus locatifs', 'Dividendes', 'Intérêts', 'Pension', 'Allocations et aides', 'Dons et cadeaux']
        check('E1 les types demandés sont présents', all(w in labels for w in want), labels)
        await page.click('#f-srcs input[value=pourboire]', force=True); await page.fill('#f-amount', '5000')
        await page.click('#f-save'); await page.wait_for_timeout(800)
        check('E2 un nouveau type est enregistré', any(i['source'] == 'pourboire' and i['amount'] == 5000 for i in await srv(page, 'incomes')))
        await page.evaluate("S.tab='accounts';render()"); await page.wait_for_timeout(250)
        check('E2 il s\'affiche dans Comptes avec son libellé', 'Pourboires' in await page.inner_text('#main'))
        lab = await page.evaluate("[SRC.prime.label,SRC.mission.label,SRC.locatif.label,SRC.inconnu===undefined]")
        check('E3 anciens types conservés, libellés précisés', lab == ['Primes et commissions', 'Honoraires et missions', 'Revenus locatifs', True], lab)
        await ctx.close()

        # ---------- C : nouvelles catégories ----------
        ctx, page = await boot(b, seed, tz=TZ, now=NOW)
        cats = await page.evaluate("CATS.map(c=>c[0])")
        check('C1 14 catégories de base, « Autres » en dernier', len(cats) == 14 and cats[-1] == 'autres' and all(c in cats for c in ['soins', 'sport', 'abonnements']), cats)
        g = await page.evaluate("['Parfum et pommade','Coiffure tresses','Salle de sport mensuelle','Foot en salle','Tennis','Abonnement Netflix','Spotify','Abonnement CanalBox','Course taxi transport','Besoin urgent','Cloud iCloud'].map(guessCategory)")
        check('C2 mots reconnus', g == ['soins', 'soins', 'sport', 'sport', 'sport', 'abonnements', 'abonnements', 'factures', 'transport', None, 'abonnements'], g)
        await page.evaluate("S.tab='plan';S.planView='subs';render()"); await page.wait_for_timeout(250)
        await page.click('[data-sub-new]'); await page.wait_for_timeout(300)
        check('C3 un nouvel abonnement est rangé en « Abonnements en ligne »', await page.input_value('#sb-cat') == 'abonnements')
        await page.evaluate('closeDlg()'); await page.wait_for_timeout(200)
        await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
        await page.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
        t = await page.inner_text('#main')
        check('C4 catégories listées dans Réglages, plus de suggestion « Coiffure et beauté » en double', 'Soins du corps' in t and 'Sport et activités' in t and 'Abonnements en ligne' in t and 'Coiffure et beauté' not in t and '14 catégories de base' in t)
        check('C5 aucune erreur JS', not page.errs, page.errs)
        await ctx.close()
        await b.close()
    srvp.terminate()
    return report()

sys.exit(asyncio.run(main()))
