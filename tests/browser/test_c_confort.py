"""2.6 bloc C : accueil allégé et horizon, vérification de solde, saisies rapides, perso/pro,
démarrage guidé, rappel du soir, conseils personnels, vocabulaire."""
import asyncio, json, os, re, sys
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

def ms(y, m, d, h=10): return int(datetime(y, m, d, h, 0).timestamp() * 1000)
def tweak(fn):
    s = json.loads(seed); fn(s); return json.dumps(s)
def dg(t): return int(re.sub(r'\D', '', t) or 0)
async def srv(page, t): return await page.evaluate(f'window.__srv.{t}')
NOW = ms(2026, 10, 14)
SEED_RICH = None
TZ = 'Africa/Brazzaville'

def rich(s):
    # soldes de départ élevés : tous les portefeuilles restent positifs malgré les dépenses de la graine
    s['settings'][0]['opening'].update({'especes': 3000000, 'mtn': 1000000, 'airtel': 500000, 'banque': 5000000, 'epargne': 150000})
def with_cycle(s): rich(s); s['settings'][0]['opening']['__cycle'] = {'day': 25}

def with_pro(s):
    rich(s); op = s['settings'][0]['opening']
    op['__wallets'] = [{'id': 'pro1', 'label': 'MTN Pro', 'color': '#F5C04A', 'kind': 'momo', 'archived': False, 'pro': True}]
    op['pro1'] = 100000
    s['incomes'].append({'id': 'ipro', 'amount': 50000, 'source': 'mission', 'wallet': 'pro1', 'date': '2026-10-06', 'note': 'Mission', 'user_id': 'u1'})
    s['expenses'].append({'id': 'epro', 'amount': 7000, 'fee': 0, 'category': 'transport', 'method': 'pro1', 'date': '2026-10-10', 'note': 'Course client', 'nature': None, 'user_id': 'u1'})

async def main():
    global SEED_RICH
    SEED_RICH = tweak(rich)
    srvp = start_server()
    async with async_playwright() as pw:
        b = await pw.chromium.launch()

        # ---------- C1 : accueil allégé, un seul budget quotidien avec horizon ----------
        ctx, page = await boot(b, tweak(with_cycle), tz=TZ, now=NOW)
        h = (await page.inner_text('#hero')).lower()
        check('C1 argent disponible', 'argent disponible' in h)
        check('C1 budget du jour avec horizon', 'budget du jour' in h and "jusqu'à ta prochaine paie" in h, h[:300])
        check('C1 prochaine sortie prévue', 'prochaine sortie prévue' in h and 'loyer' in h, h)
        info = await page.evaluate("(()=>{const H=horizon();return {n:H.cur.n,kind:H.cur.kind,cash:liquid(),c:committed(H.cur.n),pay:H.pay&&H.pay.n,month:H.month.n}})()")
        check('C1 horizon par défaut : prochaine paie (11 jours)', info['kind'] == 'pay' and info['n'] == 11 and info['month'] == 18, info)
        cash_txt = dg(await page.inner_text('#hero-cash'))
        day_txt = dg(await page.inner_text('#hero-day'))
        exp_day = max(0, int(round((info['cash'] - info['c']) / info['n']))) if info['cash'] > info['c'] else 0
        check('C1 argent disponible = soldes hors épargne', cash_txt == round(info['cash']), (cash_txt, info))
        check('C1 utilisable par jour = (argent - sorties prévues) / jours', abs(day_txt - exp_day) <= 1, (day_txt, exp_day))
        check('C1 calcul replié par défaut', not await page.is_visible('#hero-calc'))
        await page.click('.hero details.calc summary'); await page.wait_for_timeout(200)
        check('C1 explication du calcul visible', 'À répartir sur 11 jours' in await page.inner_text('#hero-calc'))
        mn = (await page.inner_text('#main')).lower()
        check('C1 accueil léger : pas de cycle de paie ni indicateurs par défaut', 'cycle de paie' not in mn and 'fonds d\'urgence' not in mn and 'top 5' not in mn, mn[:200])
        check('C1 bouton détails', 'voir les détails du mois' in mn)
        # plus de bascule sur l'accueil : le choix de la période est dans Réglages
        check('C1 aucune bascule de période sur l\'accueil', await page.locator('#hero .hzseg, #hero [data-hz]').count() == 0)
        check('C1 renvoi vers Réglages dans l\'explication', 'changer dans réglages' in (await page.inner_text('#hero-calc')).lower() + (await page.inner_text('#hero details.calc')).lower())
        await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
        seg = await page.evaluate("[...document.querySelectorAll('.hzseg.set [data-hz]')].map(b=>[b.dataset.hz,b.getAttribute('aria-pressed'),b.textContent.replace(/\\s+/g,' ').trim()])")
        check('C1 réglages : choix de la période (prochaine paie sélectionnée)', seg == [['pay', 'true', "Jusqu'à la prochaine paie11 j"], ['month', 'false', "Jusqu'à la fin du mois18 j"]], seg)
        await page.click('.hzseg.set [data-hz=month]'); await page.wait_for_timeout(500)
        check('C1 réglages : choix pris en compte', await page.evaluate("document.querySelector('.hzseg.set [data-hz=month]').getAttribute('aria-pressed')") == 'true')
        await page.click('[data-tab=dash]'); await page.wait_for_timeout(300)
        st = await srv(page, 'settings[0].opening.__hz')
        check('C1 horizon enregistré sur le serveur', st == 'month', st)
        h2 = (await page.inner_text('#hero')).lower()
        check('C1 horizon fin du mois affiché', "jusqu'à la fin du mois" in h2 and '(18 jours)' in h2, h2[:250])
        d2 = dg(await page.inner_text('#hero-day'))
        c18 = await page.evaluate("committed(18)")
        e2 = max(0, round((info['cash'] - c18) / 18))
        check('C1 nouveau montant par jour cohérent', abs(d2 - e2) <= 1, (d2, e2))
        await page.reload(); await page.wait_for_timeout(900)
        check('C1 horizon conservé après rechargement', "jusqu'à la fin du mois" in (await page.inner_text('#hero')).lower())
        # détails
        await page.click('#moreBtn'); await page.wait_for_timeout(300)
        mn = (await page.inner_text('#main')).lower()
        check('C1 détails : cycle de paie, excédent, épargne mise de côté', 'cycle de paie' in mn and 'excédent du mois' in mn and 'épargne mise de côté' in mn, mn[:300])
        check('C3 anciens mots absents', "taux d'épargne" not in mn and 'solde du mois' not in mn)
        check('C1 reste à vivre distinct du budget par jour', 'reste à vivre du mois' in mn and 'diffère du montant utilisable par jour' in mn)
        await page.click('#moreBtn'); await page.wait_for_timeout(200)
        check('C1 détails repliables', 'cycle de paie' not in (await page.inner_text('#main')).lower())
        check('C1 aucune erreur', not page.errs, page.errs)
        await ctx.close()

        # sans jour de paie : un seul horizon et invitation à le renseigner
        ctx, page = await boot(b, SEED_RICH, tz=TZ, now=NOW)
        check('C1 sans jour de paie : pas de bascule', await page.locator('.hzseg').count() == 0)
        await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
        check('C1 réglages sans jour de paie : calcul jusqu\'à la fin du mois, pas de bascule', await page.locator('.hzseg').count() == 0 and 'jusqu\'à la fin du mois' in (await page.inner_text('#main')).lower())
        await page.click('[data-tab=dash]'); await page.wait_for_timeout(300)
        check('C1 invitation à indiquer le jour de paie', 'jour de paie' in (await page.inner_text('#hero')).lower())
        # mois passé : bilan sans accordéon
        await page.click('#prevM'); await page.wait_for_timeout(300)
        mn = (await page.inner_text('#main')).lower()
        check('C1 mois passé : excédent et détails visibles', 'excédent de septembre' in mn and 'épargne mise de côté' in mn, mn[:200])
        check('C1 mois passé : pas de bouton détails', await page.locator('#moreBtn').count() == 0)
        await ctx.close()

        # ---------- C3 : épargne mise de côté et vocabulaire ----------
        ctx, page = await boot(b, SEED_RICH, tz=TZ, now=NOW)
        sa = await page.evaluate("savedAside('2026-10')")
        exp_sa = await page.evaluate("monthMoves('2026-10').filter(x=>(x.kind==='transfer'||x.kind==='project')&&x.to_wallet==='epargne').reduce((a,x)=>a+x.amount,0)-monthMoves('2026-10').filter(x=>(x.kind==='transfer'||x.kind==='project')&&x.from_wallet==='epargne').reduce((a,x)=>a+x.amount+(x.fee||0),0)")
        check('C3 épargne mise de côté = virements vers Épargne', sa == exp_sa, (sa, exp_sa))
        rap = await page.evaluate("reportHTML('2026-10')")
        check('C3 rapport : excédent et mis de côté', 'Excédent du mois' in rap and 'Mis de côté' in rap and "Taux d'épargne" not in rap)
        smr = await page.evaluate("summaryText('2026-10')")
        check('C3 résumé : excédent et mis de côté', 'Excédent du mois' in smr and 'Mis de côté' in smr, smr)
        await page.evaluate("S.tab='settings';render()")
        st = (await page.inner_text('#main')).lower()
        check('C3 réglages : mots du carnet', 'les mots du carnet' in st and 'excédent cumulé' in st)
        await page.evaluate("S.tab='analyse';render()")
        an = (await page.inner_text('#main')).lower()
        check('C3 analyse : part moyenne non dépensée', 'part moyenne non dépensée' in an and "taux d'épargne" not in an)
        await ctx.close()

        # ---------- C5 : Vérifier mon solde ----------
        ctx, page = await boot(b, SEED_RICH, tz=TZ, now=NOW)
        await page.click('[data-tab=accounts]'); await page.wait_for_timeout(300)
        check('C5 bouton Vérifier par portefeuille', await page.locator('[data-check]').count() >= 4)
        bal = await page.evaluate("balance('especes')"); spent0 = await page.evaluate("spentIn('2026-10')")
        await page.click('[data-check=especes]'); await page.wait_for_timeout(300)
        check('C5 fenêtre de vérification', 'vérifier mon solde' in (await page.inner_text('#dlg')).lower() and 'le carnet indique' in (await page.inner_text('#dlg')).lower())
        await page.fill('#ck-real', str(bal + 2500)); await page.wait_for_timeout(200)
        check('C5 écart affiché (+)', '+ 2 500' in (await page.inner_text('#ck-diff')).replace(' ', ' ').replace('\xa0', ' ') and await page.is_visible('#ck-why'))
        await page.click('#ck-save'); await page.wait_for_timeout(300)
        check('C5 motif obligatoire en cas d\'écart', 'motif' in (await page.inner_text('#ck-err')).lower() and not await page.is_hidden('#dlgWrap'))
        await page.check('input[name=ckwhy][value=entree]', force=True)
        await page.fill('#ck-note', 'remboursement ami')
        await page.click('#ck-save'); await page.wait_for_timeout(900)
        mv = [m for m in await srv(page, 'moves') if m['kind'] == 'adjust']
        check('C5 ajustement enregistré (entrant, daté, motivé)', len(mv) == 1 and mv[0]['to_wallet'] == 'especes' and mv[0]['from_wallet'] is None and mv[0]['amount'] == 2500 and mv[0]['date'] == '2026-10-14' and 'entrée non notée' in mv[0]['note'] and 'remboursement ami' in mv[0]['note'], mv)
        check('C5 solde calé sur la réalité', await page.evaluate("balance('especes')") == bal + 2500)
        check('C5 ajustement non compté comme dépense', await page.evaluate("spentIn('2026-10')") == spent0)
        chk = await srv(page, 'settings[0].opening.__chk')
        check('C5 date de vérification gardée', chk and chk.get('especes') == '2026-10-14', chk)
        check('C5 Annuler proposé', await page.locator('#toast .toast-undo').count() == 1)
        await page.click('#toast .toast-undo'); await page.wait_for_timeout(700)
        check('C5 annulation : ajustement supprimé', not [m for m in await srv(page, 'moves') if m['kind'] == 'adjust'] and await page.evaluate("balance('especes')") == bal)
        # écart négatif : motif + possibilité de noter une vraie dépense
        await page.click('[data-check=especes]'); await page.wait_for_timeout(300)
        await page.fill('#ck-real', str(bal - 1000)); await page.wait_for_timeout(200)
        check('C5 écart négatif : option dépense', await page.is_visible('#ck-exp'))
        await page.click('#ck-exp'); await page.wait_for_timeout(400)
        check('C5 dépense préremplie depuis l\'écart', dg(await page.input_value('#f-amount')) == 1000 and await page.evaluate("document.querySelector('input[name=met]:checked').value") == 'especes' and await page.input_value('#f-note') == 'Écart constaté')
        await page.click('#closeBtn'); await page.wait_for_timeout(200)
        # écart négatif enregistré en ajustement
        await page.click('[data-check=especes]'); await page.wait_for_timeout(300)
        await page.fill('#ck-real', str(bal - 1000)); await page.check('input[name=ckwhy][value=frais]', force=True); await page.click('#ck-save'); await page.wait_for_timeout(900)
        mv = [m for m in await srv(page, 'moves') if m['kind'] == 'adjust']
        check('C5 ajustement sortant', len(mv) == 1 and mv[0]['from_wallet'] == 'especes' and mv[0]['to_wallet'] is None and mv[0]['amount'] == 1000, mv)
        await page.evaluate("S.tab='accounts';render()")
        row = (await page.inner_text('#main')).replace(' ', ' ').replace('\xa0', ' ')
        check('C5 ajustement visible dans les mouvements', 'Ajustement de solde' in row and 'frais non notés' in row.lower() and '− 1 000' in row, row[-700:])
        # suppression avec confirmation
        await page.click(f'[data-move="{mv[0]["id"]}"]'); await page.wait_for_timeout(300)
        check('C5 détail de l\'ajustement', 'ajustement de solde' in (await page.inner_text('#dlg')).lower())
        await page.click('[data-act=adjDel]'); await page.wait_for_timeout(300)
        check('C5 première touche : rien n\'est supprimé', len([m for m in await srv(page, 'moves') if m['kind'] == 'adjust']) == 1 and 'confirmer' in (await page.inner_text('#dlg')).lower())
        await page.click('[data-act=adjDel]'); await page.wait_for_timeout(700)
        check('C5 confirmation : ajustement supprimé', not [m for m in await srv(page, 'moves') if m['kind'] == 'adjust'] and await page.evaluate("balance('especes')") == bal)
        # solde juste
        await page.click('[data-check=mtn]'); await page.wait_for_timeout(300)
        bm = await page.evaluate("balance('mtn')"); nmv = len(await srv(page, 'moves'))
        await page.fill('#ck-real', str(bm)); await page.wait_for_timeout(200)
        check('C5 solde juste : pas de motif demandé', await page.is_hidden('#ck-why') and 'juste' in (await page.inner_text('#ck-save')).lower())
        await page.click('#ck-save'); await page.wait_for_timeout(800)
        check('C5 solde juste : aucun mouvement créé, date enregistrée', len(await srv(page, 'moves')) == nmv and (await srv(page, 'settings[0].opening.__chk')).get('mtn') == '2026-10-14')
        check('C5 « vérifié le » affiché', 'vérifié le 14/10/2026' in await page.inner_text('#main'))
        # sauvegarde / restauration d'un ajustement
        ok_imp = await page.evaluate("(()=>{try{const j=parseBackup(JSON.stringify({app:'carnet-depenses',expenses:[],incomes:[],moves:[{id:'adj1',kind:'adjust',amount:500,fee:0,date:'2026-10-01',from_wallet:null,to_wallet:'especes',note:'Ajustement : test'}]}));return (j.moves||[]).length}catch(e){return 'ERR '+e.message}})()")
        check('C5 un ajustement se restaure depuis une sauvegarde', ok_imp == 1, ok_imp)
        check('C5 aucune erreur', not page.errs, page.errs)
        await ctx.close()

        # ---------- C6 : saisies rapides, Annuler ----------
        ctx, page = await boot(b, SEED_RICH, tz=TZ, now=NOW)
        fav = await page.evaluate("favorites().map(f=>({key:f.key,label:f.label,amount:f.amount,category:f.category,method:f.method,count:f.count}))")
        check('C6 favoris détectés (au moins 3 répétitions)', len(fav) >= 2 and all(f['count'] >= 3 for f in fav) and len(fav) <= 5, fav)
        check('C6 favoris affichés sur l\'accueil', await page.locator('#favs .fav').count() == len(fav))
        f0 = fav[0]; n0 = len(await srv(page, 'expenses'))
        await page.click(f'[data-fav="{f0["key"]}"]'); await page.wait_for_timeout(800)
        ex = await srv(page, 'expenses')
        new = [e for e in ex if e['date'] == '2026-10-14' and e['amount'] == f0['amount'] and e['category'] == f0['category'] and e['method'] == f0['method']]
        check('C6 une touche = une dépense avec catégorie et moyen préremplis', len(ex) == n0 + 1 and new, (len(ex), n0, f0))
        tt = await page.inner_text('#toast')
        check('C6 Annuler proposé après la saisie', 'annuler' in tt.lower() and await page.locator('#toast .toast-undo').count() == 1, tt)
        await page.click('#toast .toast-undo'); await page.wait_for_timeout(800)
        check('C6 Annuler supprime la saisie', len(await srv(page, 'expenses')) == n0)
        # feuille : habitudes préremplissent sans enregistrer
        await page.click('#fab'); await page.wait_for_timeout(300)
        check('C6 habitudes dans la feuille de saisie', await page.locator('#favchips [data-favfill]').count() == len(fav))
        await page.click(f'#favchips [data-favfill="{f0["key"]}"]'); await page.wait_for_timeout(200)
        check('C6 habitude préremplit montant, catégorie et moyen', dg(await page.input_value('#f-amount')) == f0['amount'] and await page.evaluate("document.querySelector('input[name=cat]:checked').value") == f0['category'] and await page.evaluate("document.querySelector('input[name=met]:checked').value") == f0['method'])
        check('C6 rien n\'est enregistré avant validation', len(await srv(page, 'expenses')) == n0)
        # Annuler après une saisie normale
        await page.click('#f-save'); await page.wait_for_timeout(800)
        check('C6 saisie normale enregistrée', len(await srv(page, 'expenses')) == n0 + 1)
        check('C6 Annuler après saisie normale', await page.locator('#toast .toast-undo').count() == 1)
        await page.click('#toast .toast-undo'); await page.wait_for_timeout(800)
        check('C6 saisie normale annulée', len(await srv(page, 'expenses')) == n0)
        # une modification n'offre pas Annuler
        eid = [e for e in await srv(page, 'expenses') if e['date'].startswith('2026-10') and not e['id'].startswith('rec-')][2]['id']
        await page.evaluate(f"S.tab='list';render()"); await page.click(f'[data-edit="{eid}"]'); await page.wait_for_timeout(300)
        await page.fill('#f-note', 'modifié'); await page.click('#f-save'); await page.wait_for_timeout(600)
        check('C6 pas d\'Annuler après une modification', await page.locator('#toast .toast-undo').count() == 0)
        # masquer un favori
        await page.evaluate("S.tab='settings';render()")
        check('C6 réglages : liste des saisies rapides', 'saisies rapides' in (await page.inner_text('#main')).lower())
        await page.click(f'[data-fav-off="{f0["key"]}"]'); await page.wait_for_timeout(300)
        await page.evaluate("S.tab='dash';render()")
        check('C6 favori masqué disparaît de l\'accueil', await page.locator(f'#favs [data-fav="{f0["key"]}"]').count() == 0)
        await page.reload(); await page.wait_for_timeout(900)
        check('C6 choix conservé après rechargement', await page.locator(f'#favs [data-fav="{f0["key"]}"]').count() == 0)
        check('C6 aucune erreur', not page.errs, page.errs)
        await ctx.close()

        # ---------- C8 : perso / pro ----------
        ctx, page = await boot(b, SEED_RICH, tz=TZ, now=NOW)
        check('C8 pas de barre perso/pro sans élément pro', await page.is_hidden('#scopeBar'))
        await ctx.close()
        ctx, page = await boot(b, tweak(with_pro), tz=TZ, now=NOW)
        check('C8 barre perso/pro visible', await page.is_visible('#scopeBar') and await page.locator('#scopeBar button').count() == 3)
        liq_all = await page.evaluate("liquid()"); sp_all = await page.evaluate("spentIn('2026-10')"); inc_all = await page.evaluate("incomeIn('2026-10')")
        await page.click('[data-scope=pro]'); await page.wait_for_timeout(300)
        liq_pro = await page.evaluate("liquid()"); sp_pro = await page.evaluate("spentIn('2026-10')"); inc_pro = await page.evaluate("incomeIn('2026-10')")
        check('C8 vue Pro : seules les opérations Pro', sp_pro == 7000 and inc_pro == 50000, (sp_pro, inc_pro))
        check('C8 vue Pro : argent disponible = portefeuilles Pro', liq_pro == 100000 + 50000 - 7000, liq_pro)
        check('C8 vue Pro annoncée', 'vue pro' in (await page.inner_text('#scope-note')).lower() and 'pro' in (await page.inner_text('#hero')).lower())
        await page.click('[data-scope=perso]'); await page.wait_for_timeout(300)
        check('C8 vue Perso : sans le Pro', await page.evaluate("spentIn('2026-10')") == sp_all - 7000 and await page.evaluate("incomeIn('2026-10')") == inc_all - 50000 and abs(await page.evaluate("liquid()") - (liq_all - liq_pro)) < 1)
        await page.click('[data-scope=all]'); await page.wait_for_timeout(300)
        check('C8 vue Tout : totaux inchangés', await page.evaluate("spentIn('2026-10')") == sp_all and abs(await page.evaluate("liquid()") - liq_all) < 1)
        bal_pro = await page.evaluate("balance('pro1')")
        await page.click('[data-scope=pro]'); await page.wait_for_timeout(200)
        check('C8 soldes réels jamais modifiés par le filtre', await page.evaluate("balance('pro1')") == bal_pro == 143000)
        await page.reload(); await page.wait_for_timeout(900)
        check('C8 vue conservée après rechargement', await page.evaluate("S.scope") == 'pro')
        await page.evaluate("S.tab='list';render()")
        async def csv(scope_btn):
            async with page.expect_download() as dl:
                await page.click(f'[data-export={scope_btn}]')
            d = await dl.value; path = await d.path()
            return open(path, encoding='utf-8-sig').read()
        c = await csv('month')
        check('C8 CSV : colonne Usage, seulement le Pro en vue Pro', c.splitlines()[0].endswith(';Usage') and 'Course client' in c and len(c.splitlines()) == 3, c[:300])
        await page.click('[data-scope=all]'); await page.wait_for_timeout(200)
        c = await csv('all')
        check('C8 CSV tout : Pro et Perso distingués', ';Pro' in c and ';Perso' in c)
        # rapport en vue Pro
        await page.click('[data-scope=pro]'); await page.wait_for_timeout(200)
        check('C8 rapport annonce la vue', 'Vue Pro uniquement' in await page.evaluate("reportHTML('2026-10')"))
        check('C8 aucune erreur', not page.errs, page.errs)
        await ctx.close()

        # ---------- C9 : rappel du soir ----------
        def evening(s): s['settings'][0]['opening']['__rem'] = {'lead': 1, 'hour': 8, 'amounts': False, 'evening': True}
        ctx, page = await boot(b, tweak(evening), tz=TZ, now=NOW)
        soir = await page.evaluate("buildReminders().filter(r=>r.id.startsWith('r-soir-')).map(r=>[r.id,r.fire_at,r.tag,r.title,r.body])")
        ids = [x[0] for x in soir]
        check('C9 rappels du soir pour aujourd\'hui et les 3 jours suivants', ids == ['r-soir-2026-10-14', 'r-soir-2026-10-15', 'r-soir-2026-10-16', 'r-soir-2026-10-17'], ids)
        check('C9 20 h à Brazzaville (19 h UTC), tag soir', all(x[1].endswith('T19:00:00.000Z') and x[2] == 'soir' for x in soir) and 'noté tes dépenses' in soir[0][4], soir[:1])
        check('C9 jamais de montant dans le rappel du soir', all(not re.search(r'\d{3}', x[4]) for x in soir))
        await ctx.close()
        def evening_done(s):
            evening(s); s['expenses'].append({'id': 'today1', 'amount': 1000, 'fee': 0, 'category': 'transport', 'method': 'especes', 'date': '2026-10-14', 'note': '', 'nature': None, 'user_id': 'u1'})
        ctx, page = await boot(b, tweak(evening_done), tz=TZ, now=NOW)
        ids = await page.evaluate("buildReminders().filter(r=>r.id.startsWith('r-soir-')).map(r=>r.id)")
        check('C9 pas de rappel du soir si une dépense est déjà notée aujourd\'hui', 'r-soir-2026-10-14' not in ids and 'r-soir-2026-10-15' in ids, ids)
        await ctx.close()
        ctx, page = await boot(b, SEED_RICH, tz=TZ, now=NOW)
        check('C9 désactivé par défaut', not await page.evaluate("buildReminders().some(r=>r.id.startsWith('r-soir-'))"))
        await page.evaluate("LS.set(K.push,true);S.tab='settings';render()")
        check('C9 réglage visible', await page.locator('#rem-evening').count() == 1)
        await page.click('label.switch:has(#rem-evening)'); await page.click('[data-act=saveRem]'); await page.wait_for_timeout(700)
        rem = await srv(page, 'settings[0].opening.__rem')
        check('C9 réglage enregistré sur le serveur', rem and rem.get('evening') is True, rem)
        check('C9 aucune erreur', not page.errs, page.errs)
        await ctx.close()

        # ---------- C10 : conseils partant de tes chiffres, repères datés, budgets réels ----------
        ctx, page = await boot(b, SEED_RICH, tz=TZ, now=NOW)
        await page.evaluate("S.tab='plan';render()")
        pl = (await page.inner_text('#main')).replace('\xa0', ' ').replace(' ', ' ')
        low = pl.lower()
        check('C10 section « ce que disent tes chiffres » en premier', 'ce que disent tes chiffres' in low and low.index('ce que disent tes chiffres') < low.index('budgets proposés'))
        check('C10 charges fixes et épargne mise de côté', 'charges fixes' in low and 'mis de côté' in low)
        check('C10 références datées', 'enquête 2011' in low and 'ancien' in low and 'chaque repère porte sa date' in low and 'juillet 2024' in low)
        check('C10 moyenne propre dans les budgets proposés', 'ta moyenne' in low)
        check('C10 aucun budget au départ', await page.evaluate("hasBudgets()") is False)
        await page.click('[data-act=applyOwn]'); await page.wait_for_timeout(800)
        bud = await srv(page, 'budgets')
        check('C10 budgets calés sur les dépenses réelles', len(bud) >= 5 and all(x['amount'] >= 500 and x['amount'] % 500 == 0 for x in bud), bud[:3])
        ex_alim = [x for x in bud if x['category'] == 'alimentation']
        avg = await page.evaluate("ownAvg('alimentation')")
        check('C10 alimentation = moyenne des 3 derniers mois arrondie', ex_alim and abs(ex_alim[0]['amount'] - round(avg / 500) * 500) <= 500, (ex_alim, avg))
        before = json.dumps(sorted((x['category'], x['amount']) for x in bud))
        await page.click('[data-act=applyOwn]'); await page.wait_for_timeout(400)
        check('C10 remplacement des budgets : confirmation demandée', 'confirmer le remplacement' in (await page.inner_text('[data-act=applyOwn]')).lower() and json.dumps(sorted((x['category'], x['amount']) for x in await srv(page, 'budgets'))) == before)
        check('C10 aucune erreur', not page.errs, page.errs)
        await ctx.close()

        # ---------- C2 : démarrage guidé ----------
        ctx, page = await boot(b, empty, tz=TZ, now=NOW, onb=True)
        check('C2 le guide s\'ouvre sur un compte vide', await page.is_visible('#onb') and 'étape 1 sur 3' in (await page.inner_text('#onb')).lower())
        check('C2 étape 1 : un champ par portefeuille', await page.locator('#onb input[id^=ob-w-]').count() >= 4)
        await page.fill('#ob-w-especes', '20000'); await page.fill('#ob-w-mtn', '5000'); await page.fill('#ob-w-banque', '150000')
        await page.click('[data-act=onbNext]'); await page.wait_for_timeout(700)
        st = (await srv(page, 'settings'))[0]
        check('C2 soldes de départ enregistrés avec la date du jour', st['opening']['especes'] == 20000 and st['opening']['mtn'] == 5000 and st['opening']['banque'] == 150000 and st['opening_date'] == '2026-10-14', st)
        check('C2 étape 2 : revenu', 'étape 2 sur 3' in (await page.inner_text('#onb')).lower())
        await page.click('[data-act=onbBack]'); await page.wait_for_timeout(200)
        check('C2 retour possible', 'étape 1 sur 3' in (await page.inner_text('#onb')).lower() and await page.input_value('#ob-w-banque') == '150 000'.replace(' ', ' ') or dg(await page.input_value('#ob-w-banque')) == 150000)
        await page.click('[data-act=onbNext]'); await page.wait_for_timeout(500)
        await page.fill('#ob-day', '30'); await page.click('[data-act=onbNext]'); await page.wait_for_timeout(200)
        check('C2 jour de paie hors 1 à 28 refusé', 'entre 1 et 28' in await page.inner_text('#ob-err'))
        await page.fill('#ob-day', '25'); await page.fill('#ob-sal', '300000'); await page.click('[data-act=onbNext]'); await page.wait_for_timeout(200)
        check('C2 salaire sans date refusé', 'date' in (await page.inner_text('#ob-err')).lower())
        await page.fill('#ob-sal-d', '2026-10-14'); await page.click('[data-act=onbNext]'); await page.wait_for_timeout(200)
        check('C2 salaire du jour refusé (double compte)', 'deux fois' in await page.inner_text('#ob-err'))
        await page.fill('#ob-sal-d', '2026-10-05'); await page.select_option('#ob-sal-w', 'banque'); await page.click('[data-act=onbNext]'); await page.wait_for_timeout(800)
        inc = await srv(page, 'incomes'); st = (await srv(page, 'settings'))[0]
        check('C2 salaire et jour de paie enregistrés', len(inc) == 1 and inc[0]['amount'] == 300000 and inc[0]['date'] == '2026-10-05' and inc[0]['source'] == 'salaire' and st['opening']['__cycle']['day'] == 25, (inc, st))
        check('C2 salaire antérieur non compté deux fois', await page.evaluate("balance('banque')") == 150000)
        check('C2 étape 3 : charges fixes', 'étape 3 sur 3' in (await page.inner_text('#onb')).lower())
        await page.fill('#ob-rl-0', 'Loyer'); await page.click('[data-act=onbNext]'); await page.wait_for_timeout(200)
        check('C2 charge incomplète refusée', 'libellé, un montant et un jour' in await page.inner_text('#ob-err'))
        await page.fill('#ob-ra-0', '80000'); await page.fill('#ob-rd-0', '5')
        await page.fill('#ob-rl-1', 'Électricité'); await page.fill('#ob-ra-1', '20000'); await page.fill('#ob-rd-1', '10'); await page.check('#ob-rp-1')
        await page.click('[data-act=onbNext]'); await page.wait_for_timeout(800)
        rec = {r['label']: r for r in await srv(page, 'recurring')}
        check('C2 charges fixes créées', len(rec) == 2 and rec['Loyer']['amount'] == 80000 and rec['Loyer']['day'] == 5 and rec['Électricité']['day'] == 10, rec)
        check('C2 loyer à payer, électricité déjà payée', rec['Loyer']['last_month'] == '2026-09' and rec['Électricité']['last_month'] == '2026-10', rec)
        check('C2 dernière étape : première dépense', 'première dépense' in (await page.inner_text('#onb')).lower())
        await page.click('[data-act=onbFirst]'); await page.wait_for_timeout(500)
        check('C2 la feuille de saisie s\'ouvre avec un accompagnement', await page.is_hidden('#onb') and await page.is_visible('#sheetWrap') and await page.is_visible('#coach'))
        st = (await srv(page, 'settings'))[0]
        check('C2 guide marqué terminé sur le serveur', st['opening']['__start'] == {'done': True}, st['opening'])
        await page.fill('#f-amount', '1500'); await page.check('input[name=cat][value=alimentation]', force=True); await page.check('input[name=met][value=especes]', force=True); await page.click('#f-save'); await page.wait_for_timeout(800)
        check('C2 première dépense enregistrée', len(await srv(page, 'expenses')) == 1)
        check('C2 le guide ne revient pas', await page.evaluate("needsOnb()") is False)
        check('C2 accueil : argent disponible calculé', dg(await page.inner_text('#hero-cash')) == 20000 + 5000 + 150000 - 1500)
        check('C2 aucune erreur', not page.errs, page.errs)
        await page.reload(); await page.wait_for_timeout(900)
        check('C2 pas de guide après rechargement', await page.is_hidden('#onb'))
        await ctx.close()

        # Plus tard / Passer
        ctx, page = await boot(b, empty, tz=TZ, now=NOW, onb=True)
        await page.click('[data-act=onbLater]'); await page.wait_for_timeout(300)
        check('C2 « plus tard » ferme le guide', await page.is_hidden('#onb') and (await srv(page, 'settings')) == [])
        await page.reload(); await page.wait_for_timeout(900)
        check('C2 « plus tard » : pas de nouvelle ouverture le même jour', await page.is_hidden('#onb'))
        check('C2 invitation sur l\'accueil', 'renseigner mes soldes' in (await page.inner_text('#hero')).lower())
        await page.click('[data-act=startOnb]'); await page.wait_for_timeout(300)
        check('C2 lancement manuel', await page.is_visible('#onb'))
        await page.click('[data-act=onbSkip]'); await page.wait_for_timeout(800)
        st = await srv(page, 'settings')
        check('C2 « passer » : marqué terminé, rien d\'autre créé', st and st[0]['opening'].get('__start') == {'done': True} and not await srv(page, 'expenses') and not await srv(page, 'incomes') and not await srv(page, 'recurring'), st)
        await ctx.close()
        # compte existant : jamais de guide
        ctx, page = await boot(b, seed, tz=TZ, now=NOW, onb=True)
        check('C2 compte existant : pas de guide', await page.is_hidden('#onb'))
        await ctx.close()
        # jamais destructif : démarrage manuel avec soldes existants conserve tout
        ctx, page = await boot(b, seed, tz=TZ, now=NOW, onb=True)
        n_exp, n_inc = len(await srv(page, 'expenses')), len(await srv(page, 'incomes'))
        await page.evaluate("startOnb()"); await page.wait_for_timeout(300)
        check('C2 soldes existants : démarrage à l\'étape 2, sans écraser', 'étape 2 sur 3' in (await page.inner_text('#onb')).lower())
        await page.click('[data-act=onbSkip]'); await page.wait_for_timeout(600)
        st = (await srv(page, 'settings'))[0]
        check('C2 données existantes intactes', len(await srv(page, 'expenses')) == n_exp and len(await srv(page, 'incomes')) == n_inc and st['opening']['banque'] == 250000 and st['opening_date'] == '2026-07-01', st)
        await ctx.close()

        await b.close()
    srvp.terminate()
    return report()

sys.exit(asyncio.run(main()))
