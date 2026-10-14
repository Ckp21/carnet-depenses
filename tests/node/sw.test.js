// Test du service worker : push et clic sur notification, dans un contexte Node simulé
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT=path.join(__dirname,'..','..');
const src=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8');
const appSrc=fs.readFileSync(path.join(ROOT,'app.js'),'utf8');
let ok=0,bad=[];
const check=(n,c,x)=>{c?ok++:(bad.push(n),console.log('ECHEC',n,x||''))};
function mk(clients){
  const L={}, shown=[], closed=[], opened=[], focused=[];
  const self={location:{href:'https://ckp21.github.io/carnet/sw.js'},addEventListener:(t,f)=>{L[t]=f},
    registration:{showNotification:(t,o)=>{shown.push([t,o]);return Promise.resolve()}},
    clients:{matchAll:async()=>clients.map(c=>({focus:()=>{focused.push(c);return Promise.resolve(c)}})),openWindow:async u=>{opened.push(u)},claim:()=>Promise.resolve()},
    skipWaiting:()=>Promise.resolve()};
  const ctx={self,caches:{open:async()=>({addAll:async()=>{},put:async()=>{}}),keys:async()=>[],delete:async()=>{},match:async()=>null},URL,fetch:async()=>{throw new Error('off')},Promise,JSON,String,console};
  vm.createContext(ctx); vm.runInContext(src,ctx);
  return {L,shown,closed,opened,focused};
}
const ev=(data)=>{let p;return {data,waitUntil:q=>{p=q},get p(){return p}}};
(async()=>{
  // La version du cache doit suivre celle de l'application, sinon les mises à jour ne vident pas l'ancien cache
  const vApp=(appSrc.match(/const APP_VERSION='([^']+)'/)||[])[1], vSw=(src.match(/const VERSION='([^']+)'/)||[])[1];
  check('version du service worker alignée sur l\'application',vSw==='carnet-v'+vApp,[vSw,vApp]);
  let s=mk([]);
  check('écouteurs push et clic présents',typeof s.L.push==='function'&&typeof s.L.notificationclick==='function');
  let e=ev({json:()=>({title:'Budget',body:'Loyer demain',tag:'r-loyer'})}); s.L.push(e); await e.p;
  check('notification affichée',s.shown.length===1&&s.shown[0][0]==='Budget'&&s.shown[0][1].body==='Loyer demain'&&s.shown[0][1].tag==='r-loyer',s.shown);
  check('icône locale',s.shown[0][1].icon==='icons/icon-192.png');
  // message vide : une notification s'affiche quand même (obligatoire sur iOS)
  s=mk([]); e=ev(null); s.L.push(e); await e.p;
  check('message vide : notification par défaut',s.shown.length===1&&s.shown[0][0]==='Carnet de dépenses',s.shown);
  // JSON invalide
  s=mk([]); e=ev({json:()=>{throw new Error('bad')},text:()=>'texte brut'}); s.L.push(e); await e.p;
  check('JSON invalide : texte brut affiché',s.shown.length===1&&s.shown[0][1].body==='texte brut',s.shown);
  // charge hostile : longueurs bornées, types forcés, pas de HTML interprété
  s=mk([]); e=ev({json:()=>({title:'T'.repeat(500),body:{a:1},tag:'x'.repeat(500),data:{url:'https://evil.example'},actions:[1]})}); s.L.push(e); await e.p;
  const o=s.shown[0];
  check('titre borné à 80',o[0].length===80);
  check('tag borné à 60',o[1].tag.length===60);
  check('corps forcé en texte',typeof o[1].body==='string');
  check('URL du message ignorée',o[1].data.url==='./',o[1].data);
  check('actions du message ignorées',!('actions' in o[1]));
  // JSON non objet
  s=mk([]); e=ev({json:()=>'chaine'}); s.L.push(e); await e.p;
  check('JSON non objet : repli',s.shown.length===1&&s.shown[0][0]==='Carnet de dépenses');
  s=mk([]); e=ev({json:()=>null}); s.L.push(e); await e.p;
  check('JSON null : repli',s.shown.length===1);
  // clic : fenêtre existante réutilisée, sinon ouverture
  let closedFlag=false;
  s=mk([{id:1}]); e={notification:{close:()=>{closedFlag=true}},waitUntil:q=>{e.p=q}}; s.L.notificationclick(e); await e.p;
  check('clic : notification fermée',closedFlag);
  check('clic : fenêtre existante au premier plan',s.focused.length===1&&s.opened.length===0);
  s=mk([]); e={notification:{close:()=>{}},waitUntil:q=>{e.p=q}}; s.L.notificationclick(e); await e.p;
  check('clic : ouverture de l\'application',s.opened.length===1&&s.opened[0]==='./',s.opened);
  console.log(ok+' réussis, '+bad.length+' échecs');
  process.exit(bad.length?1:0);
})();
