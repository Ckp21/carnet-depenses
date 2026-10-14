import asyncio, json, os, re, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
boot = boot_frozen
import copy
PUSH_INIT="""(()=>{
 const subs={cur:null};const B=x=>{const p='='.repeat((4-x.length%4)%4);return Uint8Array.from(atob((x+p).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))};
 window.__vapid='__VK__';
 const mk=()=>({endpoint:'https://push.example/'+Math.random().toString(36).slice(2),options:{applicationServerKey:B(window.__vapid).buffer},toJSON(){return {endpoint:this.endpoint,keys:{p256dh:'BPkey',auth:'authkey'}}},async unsubscribe(){subs.cur=null;window.__unsub=(window.__unsub||0)+1;return true}});
 const reg={pushManager:{async getSubscription(){return subs.cur},async subscribe(o){subs.cur=mk();window.__subOpts=o;return subs.cur}},async showNotification(t,o){(window.__notifs=window.__notifs||[]).push([t,o])}};
 Object.defineProperty(navigator.serviceWorker,'ready',{get:()=>Promise.resolve(reg)});
 let perm=sessionStorage.getItem('perm')||'default';Object.defineProperty(Notification,'permission',{get:()=>perm,configurable:true});Notification.requestPermission=async()=>{if(perm==='denied')return 'denied';perm='granted';sessionStorage.setItem('perm','granted');return 'granted'};
})();"""
VK='BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DTY'
async def main():
  srv=start_server()
  try:
   async with async_playwright() as p:
    b=await p.chromium.launch()
    base=json.loads(seed); base['settings'][0]['opening']['__cycle']={'day':1}
    ctx,page=await boot(b,json.dumps(base),extra_init=PUSH_INIT.replace('__VK__',VK))
    await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
    txt=await page.inner_text('main')
    check('bouton Activer proposé',await page.is_visible('[data-act=enablePush]'),txt[-300:])
    await page.click('[data-act=enablePush]'); await page.wait_for_timeout(900)
    check('activé localement',await page.evaluate("LS.get(K.push,false)")==True)
    check('abonnement envoyé au serveur',await page.evaluate("window.__srv.push_subscriptions.length")==1)
    sub=await page.evaluate("window.__srv.push_subscriptions[0]"); check('clés de l\'abonnement',sub['p256dh']=='BPkey' and sub['auth']=='authkey' and sub['endpoint'].startswith('https://push.example/'),sub)
    check('clé VAPID transmise à subscribe',await page.evaluate("window.__subOpts.userVisibleOnly===true && window.__subOpts.applicationServerKey.length===65"))
    check('notification locale de confirmation',await page.evaluate("(window.__notifs||[]).some(n=>n[0]==='Rappels activés')"))
    rem=await page.evaluate("window.__srv.reminders")
    ids=[r['id'] for r in rem]; print(ids)
    check('rappel loyer du 1er novembre',any(i.startswith('r-rec-loyer-2026-11-01') for i in ids),ids)
    check('rappel créance du 17 octobre',any(i=='r-plan-l1-2026-10-17' for i in ids),ids)
    check('rappel cotisation tontine',any(i.startswith('r-ton-ton1-2026-11-05') for i in ids),ids)
    check('rappel réception tontine',any(i.startswith('r-tonr-ton1-') for i in ids),ids)
    check('rappel jour de paie',any(i=='r-sal-2026-11-01' for i in ids),ids)
    check('rappel salaire non noté (+3 jours)',any(i=='r-salretard-2026-11-04' for i in ids),ids)
    check('bilan du mois le 1er novembre',any(i=='r-bilan-2026-11-2026-11-01' or i.startswith('r-bilan-2026-11') for i in ids),ids)
    loy=[r for r in rem if r['id'].startswith('r-rec-loyer-2026-11-01')][0]
    check('heure par défaut : veille à 8 h de Brazzaville = 07:00 UTC',loy['fire_at']=='2026-10-31T07:00:00.000Z',loy)
    check('aucun montant par défaut',not re.search(r'\d{3}',loy['body']) and 'FCFA' not in loy['body'],loy)
    check('titre et corps courts',all(len(r['title'])<=80 and len(r['body'])<=200 for r in rem))
    check('aucun rappel dans le passé',all(r['fire_at']>__import__('datetime').datetime.fromtimestamp(FROZEN/1000,__import__('datetime').timezone.utc).strftime('%Y-%m-%dT%H:%M:%S') for r in rem))
    # options : montants et heure
    await page.select_option('#rem-lead','0'); await page.select_option('#rem-hour','12'); await page.check('#rem-amounts') if False else await page.click('#rem-amounts + span')
    await page.click('[data-act=saveRem]'); await page.wait_for_timeout(900)
    rem=await page.evaluate("window.__srv.reminders"); loy=[r for r in rem if r['id'].startswith('r-rec-loyer-2026-11-01')][0]
    check('le jour même à 12 h = 11:00 UTC',loy['fire_at']=='2026-11-01T11:00:00.000Z',loy)
    check('montants affichés sur option',re.search(r'80.000 FCFA',loy['body'].replace(' ',' ').replace(' ',' ')) is not None and 'aujourd' in loy['body'],loy)
    check('anciens rappels de la veille retirés',not any(r['fire_at']=='2026-10-31T07:00:00.000Z' for r in rem))
    # un rappel déjà envoyé n'est jamais renvoyé
    await page.evaluate("window.__srv.reminders.find(r=>r.id.startsWith('r-rec-loyer-2026-11-01')).sent_at='2026-11-01T11:00:05Z'")
    await page.evaluate("syncReminders(true)"); await page.wait_for_timeout(500)
    check('sent_at préservé après nouvelle synchro',await page.evaluate("!!window.__srv.reminders.find(r=>r.id.startsWith('r-rec-loyer-2026-11-01')).sent_at"))
    # retrait d'un plan : son rappel disparaît
    await page.evaluate("mutate([{t:'plans',op:'upsert',row:Object.assign({},D.plans.l1,{active:false,updated_at:nowISO()})}])"); await page.wait_for_timeout(400); await page.evaluate("syncReminders()"); await page.wait_for_timeout(600)
    check('rappel obsolète supprimé',not await page.evaluate("window.__srv.reminders.some(r=>r.id.startsWith('r-plan-l1'))"))
    # test de bout en bout
    await page.click('[data-act=pushTest]'); await page.wait_for_timeout(500)
    tid=await page.evaluate("LS.get(K.testId,'')"); check('test programmé',tid.startswith('test-') and await page.evaluate("window.__srv.reminders.some(r=>r.id===%s)"%json.dumps(tid)))
    await page.evaluate("syncReminders(true)"); await page.wait_for_timeout(500)
    check('le test survit à la synchro',await page.evaluate("window.__srv.reminders.some(r=>r.id===%s)"%json.dumps(tid)))
    await page.click('[data-act=pushTestCheck]'); await page.wait_for_timeout(300)
    check('vérification : pas encore envoyé',('Pas encore envoyée' in await page.inner_text('#toast')),await page.inner_text('#toast'))
    await page.evaluate("window.__srv.reminders.find(r=>r.id.startsWith('test-')).sent_at=new Date().toISOString()")
    await page.click('[data-act=pushTestCheck]'); await page.wait_for_timeout(300); check('vérification : envoyé',('envoyée' in await page.inner_text('#toast')),await page.inner_text('#toast'))
    await page.evaluate("window.__srv.reminders.find(r=>r.id.startsWith('test-')).note='non envoyé : 403 forbidden'")
    await page.click('[data-act=pushTestCheck]'); await page.wait_for_timeout(300); check('vérification : erreur du serveur affichée',('échec' in await page.inner_text('#toast')) and '403' in await page.inner_text('#toast'),await page.inner_text('#toast'))
    # désactivation
    await page.click('[data-act=disablePush]'); await page.wait_for_timeout(600)
    check('abonnement supprimé du serveur',await page.evaluate("window.__srv.push_subscriptions.length")==0)
    check('rappels non envoyés supprimés',await page.evaluate("window.__srv.reminders.every(r=>r.sent_at)"))
    check('drapeau local retiré',await page.evaluate("LS.get(K.push,false)")==False and await page.evaluate("window.__unsub")==1)
    check('aucune erreur (activation)',[e for e in page.errs if 'TUNNEL' not in e]==[],page.errs)
    # réactivation puis déconnexion : l'appareil est désabonné
    await page.click('[data-act=enablePush]'); await page.wait_for_timeout(800)
    check('réactivation',await page.evaluate("window.__srv.push_subscriptions.length")==1)
    await page.click('[data-act=logout]'); await page.click('[data-act=logout]'); await page.wait_for_timeout(700)
    check('déconnexion retire l\'abonnement et les rappels',await page.evaluate("window.__srv.push_subscriptions.length")==0 and await page.evaluate("LS.get(K.push,false)")==False)
    await ctx.close()
    # autorisation refusée
    ctx,page=await boot(b,seed,extra_init="sessionStorage.setItem('perm','denied');"+PUSH_INIT.replace('__VK__',VK))
    await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
    check('refus : message et pas de bouton',not await page.is_visible('[data-act=enablePush]') and 'refusées' in await page.inner_text('main'))
    await ctx.close()
    # clé absente
    ctx,page=await boot(b,seed,extra_init=PUSH_INIT.replace('__VK__',VK)+"window.__novapid=1;")
    await page.evaluate("window.CARNET_CONFIG.VAPID_PUBLIC_KEY=''"); await page.click('[data-tab=settings]'); await page.wait_for_timeout(300)
    check('clé absente : explication',('config.js' in await page.inner_text('main')) and not await page.is_visible('[data-act=enablePush]'))
    await ctx.close()
    # migration non exécutée : message clair
    ctx,page=await boot(b,seed,extra_init=PUSH_INIT.replace('__VK__',VK)+"window.__fail={net:false,log:[],missing:['push_subscriptions','reminders','backups']};")
    await page.click('[data-tab=settings]'); await page.wait_for_timeout(300); await page.click('[data-act=enablePush]'); await page.wait_for_timeout(600)
    check('migration manquante : message clair',('migration-2.5' in await page.inner_text('#toast')),await page.inner_text('#toast'))
    check('pas d\'activation fantôme',await page.evaluate("LS.get(K.push,false)")==False)
    await ctx.close()
    await b.close()
  finally: srv.terminate()
  report()
asyncio.run(main())
sys.exit(1 if bad else 0)
