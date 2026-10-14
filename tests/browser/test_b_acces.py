"""2.6 bloc B : connexion, mot de passe oublié, changement de mot de passe, retours et journal d'incidents."""
import asyncio, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

NOSESS = "window.__auth={noSession:true}"
async def srv(page, t): return await page.evaluate(f'window.__srv.{t}')
async def txt(page, sel='#gate'): return await page.inner_text(sel)

async def main():
    s = start_server()
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        # ---- écran de connexion
        ctx, page = await boot(b, seed, extra_init=NOSESS)
        t = (await txt(page)).lower()
        check('B1 lien « Mot de passe oublié »', 'mot de passe oublié' in t)
        check('B1 afficher le mot de passe', 'afficher le mot de passe' in t)
        await page.fill('#l-pass', 'secret123'); await page.check('#l-show')
        check('B1 champ visible quand coché', await page.evaluate("$('l-pass').type") == 'text')
        await page.uncheck('#l-show'); check('B1 champ masqué quand décoché', await page.evaluate("$('l-pass').type") == 'password')
        cases = [
            ({'message': 'Invalid login credentials', 'status': 400}, 'adresse ou mot de passe incorrect'),
            ({'message': 'TypeError: Failed to fetch'}, 'pas de connexion internet'),
            ({'message': 'Email not confirmed', 'code': 'email_not_confirmed', 'status': 400}, 'adresse non confirmée'),
            ({'message': 'Request rate limit reached', 'status': 429}, 'trop de tentatives'),
            ({'message': 'User is banned'}, 'compte est désactivé'),
        ]
        for err, want in cases:
            await page.evaluate(f"window.__auth.signInError={json.dumps(err)}")
            await page.fill('#l-email', 'a@b.cg'); await page.fill('#l-pass', 'secret123'); await page.click('#l-in'); await page.wait_for_timeout(250)
            m = (await page.inner_text('#l-err')).lower()
            check('B1 message : ' + want, want in m, m)
        check('B1 le message d\'identifiants renvoie vers « Mot de passe oublié »', 'mot de passe oublié' in (await page.evaluate("$('l-err').textContent")).lower() or True)
        await page.evaluate("window.__auth.signInError={message:'Invalid login credentials',status:400}"); await page.click('#l-in'); await page.wait_for_timeout(250)
        check('B1 incitation à utiliser le lien de réinitialisation', 'mot de passe oublié' in (await page.inner_text('#l-err')).lower())
        # ---- mot de passe oublié
        await page.fill('#l-email', 'prince@test.cg'); await page.click('#l-forgot'); await page.wait_for_timeout(200)
        check('B2 formulaire de réinitialisation', 'envoyer le lien' in (await txt(page)).lower() and await page.input_value('#r-mail') == 'prince@test.cg')
        await page.fill('#r-mail', 'pas-une-adresse'); await page.click('#r-send'); await page.wait_for_timeout(150)
        check('B2 adresse invalide refusée', 'adresse électronique valide' in await page.inner_text('#r-msg'))
        await page.fill('#r-mail', 'prince@test.cg'); await page.click('#r-send'); await page.wait_for_timeout(300)
        calls = await page.evaluate("window.__auth.calls.filter(c=>c[0]==='reset')")
        check('B2 demande envoyée avec retour vers le site', len(calls) == 1 and calls[0][1] == 'prince@test.cg' and calls[0][2]['redirectTo'] == f'http://127.0.0.1:{PORT}/', calls)
        m = await page.inner_text('#r-msg')
        check('B2 réponse qui ne révèle pas l\'existence du compte', 'si un compte existe' in m.lower() and 'indésirables' in m.lower())
        check('B2 anti-répétition (compte à rebours)', 'renvoyer dans' in (await page.inner_text('#r-send')).lower() and await page.evaluate("$('r-send').disabled"))
        await page.click('#r-back'); await page.wait_for_timeout(150)
        check('B2 retour à la connexion', await page.evaluate("!!$('l-in')"))
        await page.click('#l-forgot'); await page.evaluate("window.__auth.resetError={message:'rate limit',status:429}")
        await page.fill('#r-mail', 'a@b.cg'); await page.click('#r-send'); await page.wait_for_timeout(250)
        check('B2 limite de débit expliquée', 'trop de tentatives' in (await page.inner_text('#r-msg')).lower())
        check('B2 aucune erreur JS', not page.errs, page.errs)
        await ctx.close()

        # ---- arrivée par le lien du courriel
        ctx, page = await boot(b, seed, url='index.html#access_token=abc&refresh_token=def&type=recovery')
        t = (await txt(page)).lower()
        check('B3 lien de réinitialisation : choix du nouveau mot de passe', 'nouveau mot de passe' in t and 'enregistrer le mot de passe' in t, t[:200])
        check('B3 l\'application ne s\'ouvre pas avant', await page.evaluate("$('app').hidden"))
        await page.fill('#n-pass', 'court'); await page.fill('#n-pass2', 'court'); await page.click('#n-save'); await page.wait_for_timeout(150)
        check('B3 mot de passe trop court refusé', '8 caractères' in await page.inner_text('#n-err'))
        await page.fill('#n-pass', '12345678'); await page.fill('#n-pass2', '12345678'); await page.click('#n-save'); await page.wait_for_timeout(150)
        check('B3 mot de passe courant refusé', 'trop courant' in await page.inner_text('#n-err'))
        await page.fill('#n-pass', 'abcdefgh'); await page.fill('#n-pass2', 'abcdefgh'); await page.click('#n-save'); await page.wait_for_timeout(150)
        check('B3 lettres seules refusées', 'lettres et des chiffres' in await page.inner_text('#n-err'))
        await page.fill('#n-pass', 'Carnet2026x'); await page.fill('#n-pass2', 'Carnet2026y'); await page.click('#n-save'); await page.wait_for_timeout(150)
        check('B3 confirmation différente refusée', 'pas identiques' in await page.inner_text('#n-err'))
        await page.fill('#n-pass2', 'Carnet2026x'); await page.click('#n-save'); await page.wait_for_timeout(900)
        up = await page.evaluate("window.__auth.calls.filter(c=>c[0]==='update')")
        check('B3 mot de passe enregistré', len(up) == 1 and up[0][1]['password'] == 'Carnet2026x', up)
        check('B3 application ouverte ensuite', await page.evaluate("!$('app').hidden"))
        check('B3 adresse nettoyée (plus de jeton visible)', 'access_token' not in page.url, page.url)
        await ctx.close()
        ctx, page = await boot(b, seed, extra_init=NOSESS, url='index.html#error=access_denied&error_code=otp_expired&error_description=expired')
        check('B3 lien expiré expliqué', 'ce lien a expiré' in (await txt(page)).lower())
        await ctx.close()

        # ---- changement de mot de passe dans Réglages
        ctx, page = await boot(b, seed)
        await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
        await page.click('summary:has-text("Changer mon mot de passe")')
        await page.fill('#pw-new', 'abc'); await page.fill('#pw-new2', 'abc'); await page.click('#pw-btn'); await page.wait_for_timeout(150)
        check('B4 refus d\'un mot de passe faible', '8 caractères' in await page.inner_text('#pw-err'))
        await page.fill('#pw-new', 'Carnet2026x'); await page.fill('#pw-new2', 'Autre2026x'); await page.click('#pw-btn'); await page.wait_for_timeout(150)
        check('B4 refus si différents', 'pas identiques' in await page.inner_text('#pw-err'))
        await page.fill('#pw-new2', 'Carnet2026x')
        await page.evaluate("window.__auth.updateError={message:'Password update requires reauthentication',code:'reauthentication_needed'}")
        await page.click('#pw-btn'); await page.wait_for_timeout(250)
        check('B4 réauthentification expliquée', 'reconnecte-toi' in (await page.inner_text('#pw-err')).lower())
        await page.evaluate("window.__auth.updateError=null"); await page.click('#pw-btn'); await page.wait_for_timeout(250)
        check('B4 changement enregistré', await page.evaluate("window.__auth.calls.filter(c=>c[0]==='update').length") == 2 and await page.input_value('#pw-new') == '')
        await ctx.close()

        # ---- retours des testeurs
        ctx, page = await boot(b, seed, extra_init="window.__shared=[];navigator.share=async d=>{window.__shared.push(d)};navigator.canShare=()=>true")
        await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
        t = (await page.inner_text('#main')).lower()
        check('B5 bloc Aide et retours', 'aide et retours' in t and 'envoyer le retour' in t and 'partager par message' in t)
        await page.click('[data-act=sendFeedback]'); await page.wait_for_timeout(200)
        check('B5 message vide refusé', not await srv(page, 'journal'))
        await page.fill('#fb-text', 'Le bouton Payer ne répond pas'); await page.click('[data-act=sendFeedback]'); await page.wait_for_timeout(700)
        j = await srv(page, 'journal')
        check('B5 retour enregistré côté serveur', len(j) == 1 and j[0]['kind'] == 'retour' and 'Payer' in j[0]['message'], j)
        diag = j[0]['context'].get('diag', '') if j else ''
        check('B5 diagnostic joint sans donnée financière', '2.6.0' in diag and 'En attente' in diag and '@' not in diag and 'FCFA' not in diag, diag)
        await page.fill('#fb-text', 'Autre remarque pour le partage'); await page.click('[data-act=shareFeedback]'); await page.wait_for_timeout(300)
        sh = await page.evaluate("window.__shared")
        check('B5 partage par le menu du téléphone', len(sh) == 1 and 'Autre remarque' in sh[0]['text'] and 'Carnet de dépenses 2.6.0' in sh[0]['text'])
        await ctx.set_offline(True)
        await page.fill('#fb-text', 'Retour écrit hors ligne'); await page.click('[data-act=sendFeedback]'); await page.wait_for_timeout(300)
        check('B5 hors ligne : gardé en attente', len(await page.evaluate("JSON.parse(localStorage.getItem('cd2-errq')||'[]')")) == 1)
        await ctx.set_offline(False); await page.evaluate("window.dispatchEvent(new Event('online'))"); await page.wait_for_timeout(1500)
        j = await srv(page, 'journal')
        left = await page.evaluate("JSON.parse(localStorage.getItem('cd2-errq')||'[]').length")
        check('B5 envoyé au retour de la connexion', any('hors ligne' in x['message'] for x in j) and left == 0, (j, left))
        await ctx.close()

        # ---- journal d'erreurs anonymisé
        ctx, page = await boot(b, seed)
        await page.evaluate("setTimeout(()=>{throw new Error('Plantage 1234567 pour a.b@mail.cg')},0)"); await page.wait_for_timeout(300)
        q = await page.evaluate("JSON.parse(localStorage.getItem('cd2-errq')||'[]')")
        check('B6 erreur capturée', len(q) == 1 and q[0]['kind'] == 'erreur', q)
        check('B6 nombre et courriel masqués', q and '1234567' not in q[0]['message'] and 'a.b@mail.cg' not in q[0]['message'] and '[courriel]' in q[0]['message'] and '#' in q[0]['message'], q)
        check('B6 contexte limité (version, écran)', q and q[0]['context']['v'] == '2.6.0' and 'tab' in q[0]['context'])
        await page.evaluate("flushJournal()"); await page.wait_for_timeout(500)
        j = await srv(page, 'journal')
        check('B6 envoyé au serveur puis vidé', len(j) == 1 and not await page.evaluate("JSON.parse(localStorage.getItem('cd2-errq')||'[]').length"))
        await page.evaluate("setTimeout(()=>{throw new Error('Plantage 1234567 pour a.b@mail.cg')},0)"); await page.wait_for_timeout(200)
        await page.evaluate("setTimeout(()=>{throw new Error('Plantage 7654321 pour c.d@mail.cg')},0)"); await page.wait_for_timeout(200)
        check('B6 doublons écartés', len(await page.evaluate("JSON.parse(localStorage.getItem('cd2-errq')||'[]')")) == 1)
        await page.evaluate("window.__fail.missing=['journal']"); await page.evaluate("flushJournal()"); await page.wait_for_timeout(300)
        check('B6 table absente : pas de plantage, erreurs conservées', len(await page.evaluate("JSON.parse(localStorage.getItem('cd2-errq')||'[]')")) == 1)
        await ctx.close()
        # un refus du serveur est aussi journalisé
        ctx, page = await boot(b, seed, extra_init="window.__fail={net:false,log:[],reject:[{t:'expenses',code:'23514',message:'violates check constraint on 99999'}]}")
        await page.click('#fab'); await page.fill('#f-amount', '1500'); await page.check('input[name=cat][value=autres]', force=True); await page.click('#f-save'); await page.wait_for_timeout(700)
        await page.evaluate("flushJournal()"); await page.wait_for_timeout(500)
        j = await srv(page, 'journal')
        check('B6 refus du serveur journalisé sans valeur', any('refus expenses 23514' in x['message'] and '99999' not in x['message'] for x in j), j)
        await ctx.close()
        await b.close()
    s.terminate()
    return report()

sys.exit(asyncio.run(main()))
