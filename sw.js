// Service worker : garde l'application disponible hors ligne.
// Les appels à Supabase ne sont jamais mis en cache (les données passent par la file de synchronisation).
const VERSION='carnet-v2.2.0';
const SHELL=['./','index.html','styles.css','app.js','config.js','manifest.webmanifest','icons/favicon.svg','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
const LIB='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js';

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll([...SHELL,LIB])).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request, url=new URL(req.url);
  if(req.method!=='GET'||url.hostname.endsWith('supabase.co'))return;
  // Code de l'application : réseau d'abord pour recevoir les mises à jour, cache si hors ligne
  if(url.origin===self.location.origin){
    e.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(VERSION).then(c=>c.put(req,copy));return res})
      .catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
    return;
  }
  // Bibliothèque et polices : cache d'abord
  if(url.hostname==='cdn.jsdelivr.net'||url.hostname.endsWith('googleapis.com')||url.hostname.endsWith('gstatic.com')){
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const copy=res.clone();caches.open(VERSION).then(c=>c.put(req,copy));return res})));
  }
});
