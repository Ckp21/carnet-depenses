// Service worker : garde l'application disponible hors ligne.
// Les appels à Supabase ne sont jamais mis en cache (les données passent par la file de synchronisation).
const VERSION='carnet-v2.7.0';
const SHELL=['./','index.html','styles.css','app.js','config.js','manifest.webmanifest','icons/favicon.svg','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','lib/supabase.js','fonts/montserrat-latin-wght-normal.woff2'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request, url=new URL(req.url);
  if(req.method!=='GET'||url.hostname.endsWith('supabase.co'))return;
  // Code de l'application : réseau d'abord pour recevoir les mises à jour, cache si hors ligne
  if(url.origin===self.location.origin){
    e.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(VERSION).then(c=>c.put(req,copy))}return res})
      .catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
    return;
  }
});

// Rappels : le serveur envoie un message chiffré {title, body, tag} ; l'appareil doit toujours afficher une notification
self.addEventListener('push',e=>{
  let d={};
  try{d=e.data?e.data.json():{}}catch(_){d={body:e.data?e.data.text():''}}
  if(!d||typeof d!=='object')d={};
  const title=String(d.title||'Carnet de dépenses').slice(0,80), body=String(d.body||'').slice(0,200), tag=String(d.tag||'carnet').slice(0,60);
  e.waitUntil(self.registration.showNotification(title,{body,tag,icon:'icons/icon-192.png',badge:'icons/icon-192.png',data:{url:'./'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if('focus' in c)return c.focus()}
    return self.clients.openWindow('./');
  }));
});
