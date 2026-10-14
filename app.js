if(window.top!==window.self){document.documentElement.hidden=true;try{window.top.location=window.self.location.href}catch(e){}}
'use strict';
/* Carnet de dépenses V2.1
   Les données sont gardées en cache sur le téléphone (lecture et saisie hors ligne). Chaque modification
   s'affiche tout de suite, puis part dans une file d'attente envoyée à Supabase dès que le réseau revient. */

/* ---------- Icônes (Lucide, tracé 1,75) ---------- */
const ICONS={
  home:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  list:'<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  wallet:'<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  chart:'<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  sliders:'<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  left:'<path d="m15 18-6-6 6-6"/>', right:'<path d="m9 18 6-6-6-6"/>',
  check:'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  error:'<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  repeat:'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  swap:'<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  hand:'<path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16"/><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 15 6 6"/>',
  flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
  lock:'<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  share:'<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/>',
  eye:'<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:'<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
  calendar:'<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  message:'<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>'
};
// Logo A « l'anneau » : un C de Carnet ouvert comme une pièce, le point orange est le franc mis de côté
const LOGO=fg=>`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M47.32 19.14A20 20 0 1 0 47.32 44.86" fill="none" stroke="${fg}" stroke-width="9" stroke-linecap="round"/><circle cx="50" cy="32" r="5" fill="#F47521"/></svg>`;
const ic=(n,c='')=>`<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||''}</svg>`;

/* ---------- Référentiels ---------- */
const CATS=[
  ["alimentation","Alimentation","#067C3A"],["transport","Transport","#1570EF"],["logement","Logement","#04382A"],
  ["factures","Factures (eau, élec., internet)","#F5C04A"],["communication","Crédit & data","#3FAE75"],["sante","Santé","#B45309"],
  ["famille","Famille & dons","#93340A"],["loisirs","Loisirs & sorties","#CD8309"],["vetements","Vêtements","#4C5D54"],
  ["education","Éducation","#7CC79C"],["autres","Autres","#9AA8A1"]
];
const dict=o=>Object.assign(Object.create(null),o);
const CAT=dict(Object.fromEntries(CATS.map(c=>[c[0],{label:c[1],color:c[2]}])));
CAT.frais={label:'Frais financiers',color:'#64756C'};
const NEED=new Set(['alimentation','transport','logement','factures','communication','sante','education','frais']);
// Catégories : 11 de base (renommables) plus les tiennes, stockées dans settings.opening.__cats
const BASE_CATS=CATS.map(c=>c.slice()), NEED_BASE=new Set(NEED);
const CCOLORS=['#067C3A','#1570EF','#04382A','#F5C04A','#3FAE75','#B45309','#93340A','#CD8309','#4C5D54','#7CC79C','#9AA8A1','#7C3AED','#DB2777','#0891B2'];
const CAT_MAX=20;
const CAT_PRESETS=[
  {label:'Dîme et offrandes',color:'#7C3AED',need:false,words:['dime','offrande','quete','eglise']},
  {label:'Solidarité (deuil, mariage)',color:'#DB2777',need:false,words:['deuil','mariage','bapteme','veillee','solidarite','dot']},
  {label:'Coiffure et beauté',color:'#0891B2',need:false,words:['coiffure','tresse','tissage','salon','manucure','perruque']},
  {label:'Scolarité des enfants',color:'#1570EF',need:true,words:['scolarite','cantine','uniforme','fournitures','inscription']},
  {label:'Groupe électrogène',color:'#B45309',need:true,words:['groupe','generateur','mazout']}
];
// Portefeuilles : 5 de base, personnalisables, plus ceux que tu ajoutes (stockés dans settings.opening.__wallets)
const WCOLORS=['#067C3A','#F5C04A','#93340A','#1570EF','#04382A','#7C3AED','#DB2777','#0891B2','#64748B','#CD8309'];
const BASE_WALLETS=[["especes","Espèces","#067C3A","cash"],["mtn","MTN MoMo","#F5C04A","momo"],["airtel","Airtel Money","#93340A","momo"],["banque","Banque/Carte","#1570EF","bank"],["epargne","Épargne","#04382A","savings"]];
const WKIND={cash:'Liquide',momo:'Mobile Money',bank:'Compte ou carte',card:'Carte prépayée',other:'Autre'};
const WSUB={cash:'liquide',momo:'Mobile Money',bank:'compte et carte',card:'carte prépayée',other:'portefeuille',savings:''};
const WALLETS=[], WAL=Object.create(null), METHODS=[], MOMO=new Set(), CARD=new Set();
const SOURCES=[["salaire","Salaire","#04382A"],["prime","Prime","#3FAE75"],["mission","Mission / freelance","#F5C04A"],["autre","Autre","#9AA8A1"]];
const SRC=dict(Object.fromEntries(SOURCES.map(s=>[s[0],{label:s[1],color:s[2]}])));
const MOVES=dict({
  transfer:{label:'Transfert entre portefeuilles',from:true,to:true},
  tontine_out:{label:'Cotisation tontine',from:true,plan:'tontine'},
  tontine_in:{label:'Réception tontine',to:true,plan:'tontine'},
  loan_out:{label:'Je prête de l\'argent',from:true,plan:'loan'},
  loan_back:{label:'On me rembourse',to:true,plan:'loan'},
  debt_in:{label:'J\'emprunte',to:true,plan:'debt'},
  debt_pay:{label:'Je rembourse une dette',from:true,plan:'debt'},
  project:{label:'Versement sur un projet',from:true,plan:'project',fixedTo:'epargne'},
  adjust:{label:'Ajustement de solde',from:true,to:true,hidden:true}
});
const PLAN_LABEL=dict({tontine:'Tontine',loan:'Prêt accordé',debt:'Dette',project:'Projet d\'épargne'});

/* ---------- Utilitaires ---------- */
const nf=new Intl.NumberFormat('fr-FR');
let HIDE=false; // mode discret : les montants affichés deviennent ****
const fmtNR=n=>nf.format(Math.round(n));
const fmtRaw=n=>fmtNR(n)+' FCFA';
const fmt=n=>HIDE?'**** FCFA':fmtRaw(n);
const fmtN=n=>HIDE?'****':fmtNR(n);
const fmtS=n=>(n<0?'− ':'')+fmt(Math.abs(n));
const pctS=(x,d=0)=>(x<0?'−':'')+Math.abs(x*100).toFixed(d).replace('.',',')+' %';
const shortN=n=>HIDE?'***':shortRaw(n);
const shortRaw=n=>{const a=Math.abs(n),s=n<0?'−':'';return s+(a>=1e6?(a/1e6).toFixed(1).replace('.',',')+' M':a>=1000?Math.round(a/1000)+' k':String(Math.round(a)))};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1);
const isoOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const todayISO=()=>isoOf(new Date());
const parseISO=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const shiftM=(m,k)=>{const [y,mo]=m.split('-').map(Number);return ymOf(new Date(y,mo-1+k,1))};
const daysIn=m=>{const [y,mo]=m.split('-').map(Number);return new Date(y,mo,0).getDate()};
const mDate=m=>{const [y,mo]=m.split('-').map(Number);return new Date(y,mo-1,1)};
const mLong=m=>mDate(m).toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
const mName=m=>mDate(m).toLocaleDateString('fr-FR',{month:'long'});
const mShort=m=>mDate(m).toLocaleDateString('fr-FR',{month:'short'}).replace('.','');
// Toujours un texte sûr : une valeur qui n'est pas une date (donnée piégée venant de la base) donne « - », jamais du texte brut
const dFr=iso=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso==null?'':iso));return m?m[3]+'/'+m[2]+'/'+m[1]:'-'};
const dLong=iso=>parseISO(iso).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
const daysBetween=(a,b)=>Math.round((parseISO(b)-parseISO(a))/864e5);
const addDays=(iso,n)=>{const d=parseISO(iso);return isoOf(new Date(d.getFullYear(),d.getMonth(),d.getDate()+n))};
const digits=s=>String(s||'').replace(/\D/g,'');
const group=s=>String(s).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const toInt=s=>parseInt(digits(s)||'0',10);
const nowISO=()=>new Date().toISOString();
const newId=()=>(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
const spend=e=>e.amount+(e.fee||0);
const sumBy=(a,f)=>a.reduce((t,x)=>t+f(x),0);
const median=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),h=s.length>>1;return s.length%2?s[h]:(s[h-1]+s[h])/2};
const $=id=>document.getElementById(id);
const IOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const STANDALONE=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const BIO=IOS?'Face ID':'la biométrie';
const HAS_WEBAUTHN=!!(window.PublicKeyCredential&&navigator.credentials);
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};

/* ---------- État ---------- */
const APP_VERSION='2.7.0';
const K={push:'cd2-push',remSig:'cd2-remsig',testId:'cd2-testid',bkAt:'cd2-bk-at',bkSig:'cd2-bk-sig',bkErr:'cd2-bk-err',fileBk:'cd2-file-bk',bkSnooze:'cd2-bk-snooze',firstUse:'cd2-first-use',synclog:'cd2-synclog',lastOk:'cd2-last-ok',remember:'cd2-remember',passkey:'cd2-passkey',lock:'cd2-lock',hiddenAt:'cd2-hidden-at',cache:'cd2-cache',outbox:'cd2-outbox',uid:'cd2-uid',email:'cd2-email',tab:'cd2-tab',met:'cd2-met',bilan:'cd2-bilan-vu',span:'cd2-span',rej:'cd2-rejected',errq:'cd2-errq',favOff:'cd2-fav-off',scope:'cd2-scope',onbSnooze:'cd2-onb-snooze',planView:'cd2-planview'};
const DEF_SETTINGS={savings_goal:0,opening:{},opening_date:null,emergency_months:3,inflation:4};
const EMPTY=()=>({expenses:{},incomes:{},budgets:{},recurring:{},moves:{},plans:{},settings:Object.assign({},DEF_SETTINGS)});
// Session Supabase : appareil (localStorage) si « Rester connecté », sinon durée de l'onglet (sessionStorage)
const remember=()=>LS.get('cd2-remember',true);
const authStore={
  getItem(k){try{return localStorage.getItem(k)??sessionStorage.getItem(k)}catch(e){return null}},
  setItem(k,v){try{if(remember()){localStorage.setItem(k,v);sessionStorage.removeItem(k)}else{sessionStorage.setItem(k,v);localStorage.removeItem(k)}}catch(e){}},
  removeItem(k){try{localStorage.removeItem(k);sessionStorage.removeItem(k)}catch(e){}}
};
let D=Object.assign(EMPTY(),LS.get(K.cache,{}));
const cfgWallets=()=>Array.isArray((D.settings.opening||{}).__wallets)?D.settings.opening.__wallets:[];
let wSig='';
function rebuildWallets(){
  const byId={};cfgWallets().forEach(w=>{if(w&&w.id)byId[w.id]=w});
  const mk=(id,label,color,kind,base)=>{const o=byId[id]||{};return {id,label:String(o.label||label).slice(0,30),color:WCOLORS.includes(o.color)?o.color:(WCOLORS.includes(color)?color:'#64748B'),kind:base?kind:(WKIND[o.kind]?o.kind:'other'),archived:!!o.archived&&id!=='especes'&&id!=='epargne',pro:!!o.pro&&id!=='epargne'}};
  const base=BASE_WALLETS.map(([id,l,c,k])=>mk(id,l,c,k,true));
  const custom=cfgWallets().filter(w=>w&&SAFE_ID(w.id)&&!BASE_WALLETS.some(b=>b[0]===w.id)).slice(0,20).map(w=>mk(w.id,w.label||'Portefeuille',w.color,w.kind,false));
  const all=[...base.slice(0,4),...custom,base[4]], sig=JSON.stringify(all);
  if(sig===wSig)return false;wSig=sig;
  WALLETS.length=0;METHODS.length=0;MOMO.clear();CARD.clear();for(const k of Object.keys(WAL))delete WAL[k];
  for(const w of all){WAL[w.id]={label:w.label,color:w.color,kind:w.kind,archived:w.archived,pro:w.pro};if(w.kind==='momo')MOMO.add(w.id);if(w.kind==='card')CARD.add(w.id);
    if(!w.archived){WALLETS.push([w.id,w.label,w.color,w.kind]);if(w.id!=='epargne')METHODS.push([w.id,w.label,w.color,w.kind])}}
  return true;
}
const METALL=()=>Object.entries(WAL).filter(([k])=>k!=='epargne').map(([k,w])=>[k,w.label,w.color]);
const lastMet=()=>{const m=LS.get(K.met,'especes');return WAL[m]&&!WAL[m].archived&&m!=='epargne'?m:'especes'};
const cfgCats=()=>Array.isArray((D.settings.opening||{}).__cats)?D.settings.opening.__cats:[];
const cleanWords=a=>Array.isArray(a)?[...new Set(a.map(w=>norm(String(w)).replace(/[^a-z0-9+ ]/g,' ').replace(/\s+/g,' ').trim()).filter(w=>w.length>=3&&w.length<=24))].slice(0,12):[];
const CUSTOM_WORDS=Object.create(null);
let cSig='';
function rebuildCats(){
  const byId={};cfgCats().forEach(c=>{if(c&&SAFE_ID(c.id))byId[c.id]=c});
  const mk=(id,label,color,need,base)=>{const o=byId[id]||{};return {id,base,label:String(o.label||label).slice(0,30),color:CCOLORS.includes(o.color)?o.color:color,need:base?NEED_BASE.has(id):!!o.need,words:cleanWords(o.words),archived:!base&&!!o.archived,pro:!!o.pro}};
  const bases=BASE_CATS.map(([id,l,c])=>mk(id,l,c,false,true));
  const custom=cfgCats().filter(c=>c&&SAFE_ID(c.id)&&c.id!=='frais'&&!BASE_CATS.some(b=>b[0]===c.id)).slice(0,CAT_MAX).map(c=>mk(c.id,'Catégorie',CCOLORS[11],c.need,false));
  const autres=bases.find(c=>c.id==='autres'), all=[...bases.filter(c=>c.id!=='autres'),...custom,autres], sig=JSON.stringify(all);
  if(sig===cSig)return false;cSig=sig;
  CATS.length=0;NEED.clear();NEED_BASE.forEach(x=>NEED.add(x));
  for(const k of Object.keys(CAT))delete CAT[k];for(const k of Object.keys(CUSTOM_WORDS))delete CUSTOM_WORDS[k];
  for(const c of all){CAT[c.id]={label:c.label,color:c.color,archived:c.archived,base:c.base,pro:c.pro};if(c.need)NEED.add(c.id);if(c.words.length)CUSTOM_WORDS[c.id]=c.words;if(!c.archived)CATS.push([c.id,c.label,c.color])}
  CAT.frais={label:'Frais financiers',color:'#64756C'};
  return true;
}
D.settings=Object.assign({},DEF_SETTINGS,D.settings);D.moves=D.moves||{};D.plans=D.plans||{};
let outbox=LS.get(K.outbox,[]);
// Opérations refusées par le serveur : conservées ici jusqu'à correction, nouvel essai ou abandon explicite
let rejected=LS.get(K.rej,[]);if(!Array.isArray(rejected))rejected=[];
let sb=null, uid=LS.get(K.uid,null), email=LS.get(K.email,'');
let flushing=false, lastSync=LS.get(K.lastOk,0), installEvt=null, pendingImport=null, schemaOld=false;
const S={catTouched:false,month:ymOf(new Date()),tab:LS.get(K.tab,'dash'),filter:'all',q:'',sort:{k:'date',d:'desc'},kind:'expense',editing:null,confirmDel:false,armed:null,natTouched:false,span:LS.get(K.span,6),scope:LS.get(K.scope,'all'),more:false,planView:LS.get(K.planView,'goals')==='subs'?'subs':'goals'};

const saveLocal=()=>{LS.set(K.cache,D);LS.set(K.outbox,outbox);LS.set(K.rej,rejected)};
const curM=()=>ymOf(new Date());
const expenses=()=>Object.values(D.expenses);
const incomes=()=>Object.values(D.incomes);
const moves=()=>Object.values(D.moves);
const plans=t=>Object.values(D.plans).filter(p=>!t||p.type===t);
// Les frais des mouvements (retraits, transferts) sont des dépenses réelles : catégorie « Frais financiers »
const feeItems=()=>moves().filter(m=>m.fee>0).map(m=>({id:'mv-'+m.id,moveId:m.id,synthetic:true,amount:m.fee,fee:0,category:'frais',method:m.from_wallet||'especes',date:m.date,note:'Frais : '+(MOVES[m.kind]?.label||'mouvement'),nature:'besoin'}));
const allItems=()=>expenses().concat(feeItems());
// Vue Perso / Pro : un simple filtre d'affichage et de calcul. Les soldes réels des portefeuilles ne sont jamais modifiés.
const hasPro=()=>Object.values(WAL).some(w=>w.pro)||Object.values(CAT).some(c=>c.pro);
const scopeOn=()=>hasPro()&&['perso','pro'].includes(S.scope)?S.scope:'all';
const inScope=pro=>{const sc=scopeOn();return sc==='all'||(sc==='pro')===!!pro};
const isProExp=e=>!!(CAT[e.category]?.pro||WAL[e.method]?.pro);
const isProInc=e=>!!WAL[e.wallet||'banque']?.pro;
const recInScope=r=>inScope(isProExp({category:r.category,method:r.method}));
const scopedWallets=()=>WALLETS.filter(w=>inScope(!!WAL[w[0]]?.pro));
const SCOPE_LABEL={all:'Tout',perso:'Perso',pro:'Pro'};
const monthItems=m=>allItems().filter(e=>e.date.slice(0,7)===m&&inScope(isProExp(e)));
const monthInc=m=>incomes().filter(e=>e.date.slice(0,7)===m&&inScope(isProInc(e)));
const monthMoves=m=>moves().filter(e=>e.date.slice(0,7)===m);
const spentIn=m=>sumBy(monthItems(m),spend);
const incomeIn=m=>sumBy(monthInc(m),e=>e.amount);
const feesOf=list=>sumBy(list,e=>e.category==='frais'?e.amount:(e.fee||0));
const natureOf=e=>e.nature||(NEED.has(e.category)?'besoin':'envie');
function byCat(list){const o={};for(const e of list)o[e.category]=(o[e.category]||0)+spend(e);return o}
const hasBudgets=()=>Object.values(D.budgets).some(v=>v>0);
const budgetState=(s,b)=>{const r=s/b;return r>1?'danger':r>=.8?'warning':'success'};

function toast(msg,undo){
  const t=$('toast');t.textContent=msg;t.hidden=false;clearTimeout(toast._t);toast.undo=null;
  if(typeof undo==='function'){toast.undo=undo;const b=document.createElement('button');b.type='button';b.className='toast-undo';b.dataset.act='toastUndo';b.textContent='Annuler';t.appendChild(b)}
  toast._t=setTimeout(()=>{t.hidden=true;toast.undo=null},undo?7000:2800);
}
// Annuler une saisie : supprime les lignes qui viennent d'être créées (confirmation implicite : l'utilisateur vient de les créer)
const undoOps=ops=>()=>{mutate(ops.filter(o=>o.op==='upsert').map(o=>({t:o.t,op:'delete',id:o.row.id})));toast('Saisie annulée')};
const msg=(tone,title,body)=>`<div class="msg ${tone}" role="status">${ic({info:'info',success:'check',warning:'alert',danger:'error'}[tone])}<div><b>${title}</b>${body?`<span>${body}</span>`:''}</div></div>`;
const pill=(tone,label)=>`<span class="pill ${tone}">${ic({info:'info',success:'check',warning:'alert',danger:'error'}[tone]||'info')}${label}</span>`;

/* ---------- Synchronisation ---------- */
function applyLocal(op){
  if(op.t==='budgets'){ if(op.op==='upsert')D.budgets[op.row.category]=op.row.amount; else delete D.budgets[op.key]; return }
  if(op.t==='settings'){ D.settings=Object.assign({},D.settings,op.row); return }
  if(op.op==='upsert')D[op.t][op.row.id]=op.row; else delete D[op.t][op.id];
}
const opKey=op=>op.t+'|'+(op.t==='settings'?'1':op.t==='budgets'?(op.row?op.row.category:op.key):(op.row?op.row.id:op.id));
function mutate(ops){
  for(const op of ops){applyLocal(op);outbox.push(op);const k=opKey(op);rejected=rejected.filter(r=>opKey(r.op)!==k)}
  saveLocal();render();flush();
}
const CONFLICT={budgets:'user_id,category',settings:'user_id'};
const SCHEMA_CODES=new Set(['PGRST204','PGRST205','42703','42P01']);
function isFatal(err){const c=String(err.code||'');return /^(22|23)/.test(c)||c==='42501'}
let retryT=null, retryN=0, lastErr='', retryAt=0;
function logSync(ok,msg){const l=LS.get(K.synclog,[]);l.unshift({t:Date.now(),ok,msg:String(msg||'').slice(0,120)});LS.set(K.synclog,l.slice(0,8))}
// Réseau instable : nouvel essai après 5 s, 15 s, 45 s, 2 min 15 s puis toutes les 5 minutes, tant que des envois attendent
function scheduleRetry(){
  clearTimeout(retryT);if(!outbox.length||!sb||!uid||schemaOld){retryAt=0;return}
  const wait=Math.min(300,5*Math.pow(3,Math.min(retryN,4)));retryN++;retryAt=Date.now()+wait*1000;
  retryT=setTimeout(()=>{retryAt=0;if(navigator.onLine)flush();else updateSync()},wait*1000);
}
async function flush(){
  if(flushing||!sb||!uid||!navigator.onLine||!outbox.length){updateSync();return}
  flushing=true;updateSync();let sent=0,failed=false;const rejN=rejected.length;
  while(outbox.length){
    const op=outbox[0];let error=null;
    try{
      if(op.op==='upsert'){({error}=await sb.from(op.t).upsert(Object.assign({},op.row,{user_id:uid}),{onConflict:CONFLICT[op.t]||'id'}))}
      else{let q=sb.from(op.t).delete();q=op.t==='budgets'?q.eq('category',op.key):q.eq('id',op.id);({error}=await q)}
    }catch(e){error={message:String(e)}}
    if(error){
      if(SCHEMA_CODES.has(String(error.code))){schemaOld=true;break}
      if(isFatal(error)){
        // Refus définitif du serveur : l'opération ne part plus, mais elle reste visible dans « À corriger » (jamais perdue, jamais masquée)
        console.warn('Refusé',op,error);const msgE=String(error.message||'erreur').slice(0,200);
        rejected=rejected.filter(r=>opKey(r.op)!==opKey(op));rejected.push({op,code:String(error.code||''),msg:msgE,at:Date.now()});rejected=rejected.slice(-50);
        logSync(false,'Refusé : '+msgE);logErr('refus '+op.t+' '+(error.code||''),msgE);
        toast('Le serveur a refusé une modification : elle est dans « À corriger »');
        outbox.shift();saveLocal();continue}
      lastErr=error.message||'erreur réseau';failed=true;break;
    }
    outbox.shift();LS.set(K.outbox,outbox);sent++;
  }
  flushing=false;
  if(failed){logSync(false,lastErr+' · '+outbox.length+' en attente');scheduleRetry()}
  else{retryN=0;retryAt=0;clearTimeout(retryT);if(!outbox.length){lastErr='';if(sent){LS.set(K.lastOk,Date.now());logSync(true,sent+' envoi'+(sent>1?'s':''))}}}
  if(rejected.length!==rejN||(rejected.length&&sent))render();else updateSync();
}
async function fetchAll(t,order,optional){
  const rows=[];
  for(let from=0;;from+=1000){
    let q=sb.from(t).select('*').range(from,from+999);
    if(order)q=q.order(order,{ascending:false});
    const {data,error}=await q;
    if(error){if(optional&&SCHEMA_CODES.has(String(error.code))){schemaOld=true;return null}throw error}
    rows.push(...data);
    if(data.length<1000)break;
  }
  return rows;
}
const clean=r=>{const o=Object.assign({},r);delete o.user_id;return o};
async function pull(){
  if(!sb||!uid||!navigator.onLine)return false;
  try{
    const [ex,inc,bud,rec,set,mv,pl]=await Promise.all([fetchAll('expenses','date'),fetchAll('incomes','date'),fetchAll('budgets'),fetchAll('recurring'),fetchAll('settings'),fetchAll('moves','date',true),fetchAll('plans',null,true)]);
    const n=EMPTY();
    ex.forEach(r=>n.expenses[r.id]=clean(r));
    inc.forEach(r=>n.incomes[r.id]=clean(r));
    bud.forEach(r=>n.budgets[r.category]=r.amount);
    rec.forEach(r=>n.recurring[r.id]=clean(r));
    if(set[0]){const s=clean(set[0]);delete s.updated_at;n.settings=Object.assign({},DEF_SETTINGS,s);n.settings.inflation=Number(n.settings.inflation)}
    if(mv)mv.forEach(r=>n.moves[r.id]=clean(r)); else n.moves=D.moves;
    if(pl)pl.forEach(r=>n.plans[r.id]=clean(r)); else n.plans=D.plans;
    if(mv&&pl&&set[0]&&'opening' in set[0])schemaOld=false;
    D=n;
    for(const op of outbox)applyLocal(op);
    for(const r of rejected)applyLocal(r.op);
    saveLocal();lastSync=Date.now();LS.set(K.lastOk,lastSync);return true;
  }catch(e){console.warn('Lecture impossible',e);return false}
}
async function sync(force){
  if(!force&&Date.now()-lastSync<20000)return;
  await flush();
  if(await pull()){render();afterSync()}
  updateSync();
}
const hhmm=t=>new Date(t).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}).replace(':',' h ');
function updateSync(){
  const el=$('sync');if(!el)return;
  const off=!navigator.onLine||!sb, pend=outbox.length>0, rj=rejected.length;
  el.className='sync'+(rj?' err':off?' off':pend?' pending':'');
  const n=outbox.length;
  $('syncTxt').textContent=rj?`${rj} à corriger`+(pend?` · ${n} en attente`:''):off?(pend?`hors ligne · ${n} en attente`:'hors ligne'):pend?(retryAt&&!flushing?`${n} en attente · nouvel essai bientôt`:`${n} envoi${n>1?'s':''} en cours`):(lastSync?'synchronisé · '+hhmm(lastSync):'synchronisé');
}
/* ---------- Journal d'incidents anonymisé et retours des testeurs ---------- */
// Aucun montant, aucune note, aucun courriel : seuls un message technique nettoyé, la version et l'écran sont envoyés
const scrub=t=>String(t||'').replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g,'[courriel]').replace(/\d{4,}/g,'#').replace(/\s+/g,' ').slice(0,300);
let jOff=false, jCount=0;
function logErr(where,msg,ctx){
  try{
    const m=(where+' : '+scrub(msg)).slice(0,400), q=LS.get(K.errq,[]);
    if(q.some(x=>x.message===m))return;
    q.push({kind:'erreur',message:m,context:Object.assign({v:APP_VERSION,tab:S.tab,online:navigator.onLine,inst:STANDALONE()},ctx||{})});
    LS.set(K.errq,q.slice(-20));
  }catch(e){}
}
async function flushJournal(){
  if(jOff||!sb||!uid||!navigator.onLine)return;
  const q=LS.get(K.errq,[]);if(!q.length)return;
  const batch=q.slice(0,10);
  const {error}=await sb.from('journal').insert(batch);
  if(error){if(SCHEMA_CODES.has(String(error.code)))jOff=true;return}
  LS.set(K.errq,LS.get(K.errq,[]).slice(batch.length));
}
window.addEventListener('error',e=>{if(jCount++>20||!e.message||/^Script error/i.test(e.message))return;logErr('js',e.message+' ('+String(e.filename||'').split('/').pop()+':'+(e.lineno||0)+')')});
window.addEventListener('unhandledrejection',e=>{if(jCount++>20)return;const r=e.reason;logErr('promesse',(r&&r.message)||String(r||'rejet'))});
function diagText(){
  const log=LS.get(K.synclog,[]).slice(0,5).map(l=>`${new Date(l.t).toISOString().slice(5,16)} ${l.ok?'ok':'échec'} ${scrub(l.msg)}`);
  return [`Carnet de dépenses ${APP_VERSION}`,`Appareil : ${IOS?'iPhone ou iPad':/Android/.test(navigator.userAgent)?'Android':'autre'}, ${STANDALONE()?'application installée':'navigateur'}`,`Réseau : ${navigator.onLine?'en ligne':'hors ligne'}`,`En attente : ${outbox.length} · à corriger : ${rejected.length}`,`Dernière synchronisation : ${lastSync?new Date(lastSync).toISOString().slice(0,16).replace('T',' '):'jamais'}`,`Journal : ${log.join(' | ')||'vide'}`].join('\n');
}
async function sendFeedback(mode){
  const txt=($('fb-text')?.value||'').trim().replace(/\s+/g,' ').slice(0,600);
  if(txt.length<5)return toast('Décris en quelques mots ce qui ne va pas ou ce qui manque.');
  if(mode==='share'){
    const full='Retour sur le Carnet de dépenses\n\n'+txt+'\n\n'+diagText();
    if(navigator.share){try{await navigator.share({title:'Retour sur le Carnet de dépenses',text:full});return}catch(e){if(e&&e.name==='AbortError')return}}
    try{await navigator.clipboard.writeText(full);toast('Retour copié : colle-le dans un message')}catch(e){toast('Partage impossible sur cet appareil')}
    return;
  }
  const q=LS.get(K.errq,[]);q.push({kind:'retour',message:txt,context:{v:APP_VERSION,tab:S.tab,diag:diagText()}});LS.set(K.errq,q.slice(-20));
  if($('fb-text'))$('fb-text').value='';
  if(sb&&uid&&navigator.onLine){await flushJournal();toast(jOff?'Envoi impossible : exécute supabase/migration-2.6.sql. Utilise « Partager » en attendant.':'Merci, ton retour est envoyé.')}
  else toast('Retour gardé : il partira dès que la connexion revient.');
}
function renderFeedback(){
  return `<section class="block"><p class="over">Aide et retours</p><p class="hint">Un défaut, une idée, une phrase pas claire ? Dis-le en quelques mots. N'écris ni montant ni mot de passe : le carnet joint seulement la version, le type d'appareil et l'état de synchronisation.</p>
    <label class="inp">Ton message<textarea id="fb-text" rows="3" maxlength="600" placeholder="Ex. le bouton Payer ne répond pas sur la page d'accueil"></textarea></label>
    <div class="actions"><button type="button" class="btn-primary sm" data-act="sendFeedback">Envoyer le retour</button><button type="button" class="btn sm" data-act="shareFeedback">Partager par message</button></div>
    <details data-keep="diagopen" ${S.diagopen?'open':''}><summary class="linkbtn">Voir ce qui est joint</summary><pre class="diag">${esc(diagText())}</pre></details></section>`;
}

/* ---------- Opérations refusées : « À corriger » ---------- */
const REJ_T={expenses:'Dépense',incomes:'Entrée',moves:'Mouvement',plans:'Plan',recurring:'Charge récurrente',budgets:'Budget',settings:'Réglages'};
function opLabel(op){
  const r=op.row||{}, t=REJ_T[op.t]||op.t;
  if(op.op==='delete')return 'Suppression : '+t.toLowerCase();
  if(op.t==='settings')return 'Réglages (soldes, catégories, portefeuilles)';
  if(op.t==='budgets')return 'Budget '+(CAT[r.category]?.label||r.category)+' : '+fmt(r.amount||0);
  if(op.t==='plans'||op.t==='recurring')return t+' « '+String(r.name||r.label||'').slice(0,40)+' »';
  return t+(r.amount?' de '+fmt(r.amount):'')+(r.date?' du '+dFr(r.date):'');
}
const rejWhy=r=>r.code==='42501'?'accès refusé par les règles de sécurité':/^23/.test(r.code)?'valeur refusée par les règles de la base':/^22/.test(r.code)?'valeur invalide':'erreur du serveur';
function rejectedBlock(){
  if(!rejected.length)return '';
  const rows=rejected.map((r,i)=>{
    const canEdit=r.op.op==='upsert'&&['expenses','incomes','moves'].includes(r.op.t), arm=S.armed==='rej:'+i;
    return `<div class="rej"><b>${esc(opLabel(r.op))}</b><span class="meta">${esc(rejWhy(r))} : ${esc(r.msg)}</span><div class="actions"><button type="button" class="btn sm" data-rej-retry="${i}">Réessayer</button>${canEdit?`<button type="button" class="btn sm" data-rej-edit="${i}">Modifier</button>`:''}<button type="button" class="pill ${arm?'danger':''}" data-rej-drop="${i}">${arm?'Confirmer l\'abandon':'Abandonner'}</button></div></div>`}).join('');
  return `<section class="block rejblock" role="alert"><div class="block-head"><p class="over">À corriger</p>${pill('danger',rejected.length+' refus')}</div><p class="hint">Le serveur a refusé ces modifications. Elles restent affichées sur ce téléphone mais ne sont pas enregistrées sur le serveur tant qu'elles ne sont pas corrigées.</p>${rows}</section>`;
}
function rejRetry(i){const r=rejected.splice(i,1)[0];if(!r)return;outbox.push(r.op);saveLocal();render();flush()}
function rejEdit(i){const r=rejected[i];if(!r||!r.op.row)return;openSheet(r.op.row,r.op.t==='incomes'?'income':r.op.t==='moves'?'move':'expense')}
function rejDrop(i){
  if(S.armed!=='rej:'+i){S.armed='rej:'+i;render();return}
  S.armed=null;rejected.splice(i,1);saveLocal();render();
  toast('Abandonné. Le carnet se remet d\'accord avec le serveur à la prochaine synchronisation.');sync(true);
}

/* ---------- Charges récurrentes : à payer, payées, ignorées ---------- */
// Une charge récurrente n'est plus enregistrée toute seule : chaque mois elle devient « À payer ». Tant qu'elle n'est pas confirmée,
// la somme est réservée dans les prévisions, mais le solde du portefeuille ne bouge pas. La confirmation crée la dépense avec le montant réel.
const MRX=/^\d{4}-\d{2}$/;
const skipList=()=>{const a=(D.settings.opening||{}).__skip;return Array.isArray(a)?a.map(String):[]};
const recStart=r=>MRX.test(r.last_month||'')?r.last_month:shiftM(curM(),-1);
const recDue=(r,m)=>`${m}-${pad(Math.min(r.day,daysIn(m)))}`;
const recPaidId=(r,m)=>`rec-${r.id}-${m}`;

/* ---------- Abonnements (2.7) : une charge récurrente enrichie ---------- */
// Un abonnement est une charge récurrente (table recurring) complétée par settings.opening.__subs : périodicité, prix en devise, essai gratuit,
// changement de prix annoncé. Aucune colonne n'est ajoutée côté serveur : une charge sans fiche reste mensuelle, en FCFA, exactement comme avant.
const SUB_PERIODS={1:'Mensuel',3:'Trimestriel',6:'Semestriel',12:'Annuel'};
const SUB_PER_ADJ={1:'mensuel',3:'trimestriel',6:'semestriel',12:'annuel'};
const CURS=['USD','EUR'];
const DEF_FX={EUR:656}; // parité fixe du franc CFA : 655,957 FCFA pour 1 euro
const isoOk=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&isoOf(parseISO(s))===s;
const numIn=(v,lo,hi,d=2)=>{if(typeof v!=='number'&&!(typeof v==='string'&&v.length<=20&&/^\d+(\.\d+)?$/.test(v)))return null;const x=Number(v);if(!isFinite(x)||x<lo||x>hi)return null;const k=Math.pow(10,d);return Math.round(x*k)/k};
// Lecture toujours sûre : une valeur inattendue venant de la base ou d'un fichier est ignorée, jamais interprétée
function cleanSubs(v){
  const out={fx:{},m:Object.create(null),ig:[]};
  if(!v||typeof v!=='object'||Array.isArray(v))return out;
  if(v.fx&&typeof v.fx==='object')for(const c of CURS){const x=numIn(v.fx[c],1,100000);if(x)out.fx[c]=x}
  const rf=numIn(v.rf,0.1,20,1);if(rf)out.rf=rf;
  if(v.m&&typeof v.m==='object'&&!Array.isArray(v.m))for(const [id,s] of Object.entries(v.m).slice(0,80)){
    if(!SAFE_ID(id)||!s||typeof s!=='object'||Array.isArray(s))continue;
    const o={}, p=Number(s.p);
    if([3,6,12].includes(p)&&MRX.test(String(s.a||''))){o.p=p;o.a=String(s.a)}
    if(CURS.includes(s.c)){const x=numIn(s.x,0.01,1e6);if(x){o.c=s.c;o.x=x}}
    if(isoOk(s.t))o.t=s.t;
    if(s.n&&typeof s.n==='object'&&isoOk(s.n.d)){const x=numIn(s.n.x,0.01,1e9);if(x)o.n={d:s.n.d,x}}
    if(Object.keys(o).length)out.m[id]=o;
  }
  if(Array.isArray(v.ig))out.ig=[...new Set(v.ig.filter(x=>typeof x==='string'&&x.length>=3).map(x=>x.slice(0,40)))].slice(-30);
  return out;
}
let _subsRaw,_subsClean=null;
const subCfg=()=>{const raw=(D.settings.opening||{}).__subs;if(!_subsClean||raw!==_subsRaw){_subsRaw=raw;_subsClean=cleanSubs(raw)}return _subsClean};
const subM=id=>subCfg().m[id]||null;
const fxRate=c=>subCfg().fx[c]||DEF_FX[c]||0;
const subPer=r=>{const m=subM(r.id);return m&&m.p?m.p:1};
const monthIdx=m=>{const [y,mo]=m.split('-').map(Number);return y*12+mo-1};
// Une charge trimestrielle, semestrielle ou annuelle n'est due que les mois alignés sur son mois d'ancrage
const recIsDue=(r,m)=>{const p=subPer(r);return p===1||((monthIdx(m)-monthIdx(subM(r.id).a))%p+p)%p===0};
// Montant prévu (sans frais) pour une échéance : un changement de prix annoncé s'applique à partir de sa date
function recAmt(r,date){
  const m=subM(r.id);if(!m||!m.n||(date||todayISO())<m.n.d)return r.amount;
  if(!m.c)return Math.round(m.n.x);
  const rt=fxRate(m.c);return rt?Math.round(m.n.x*rt):r.amount;
}
// Prix de référence dans la devise de l'abonnement (ou en FCFA) à l'instant présent
const subPriceNow=r=>{const m=subM(r.id);if(!m)return r.amount;if(m.n&&todayISO()>=m.n.d)return m.n.x;return m.c?m.x:r.amount};
const subMonthly=r=>(recAmt(r)+(r.fee||0))/subPer(r);
const parseNum=s=>{const v=String(s||'').replace(/\s/g,'').replace(',','.');return /^\d+(\.\d{0,2})?$/.test(v)?parseFloat(v):NaN};
const fmtPx=x=>nf.format(Math.round(x*100)/100);
const fmtRate=x=>nf.format(Math.round(x*100)/100);
// Occurrences non réglées d'une charge jusqu'à une date : en retard (3 mois au plus) ou à venir
function recDueList(r,until){
  const out=[], sk=new Set(skipList()), floor=shiftM(curM(),-2);
  let m=shiftM(recStart(r),1);if(m<floor)m=floor;
  for(;;m=shiftM(m,1)){const date=recDue(r,m);if(date>until)break;if(!recIsDue(r,m)||D.expenses[recPaidId(r,m)]||sk.has(r.id+'|'+m))continue;out.push({m,date})}
  return out;
}
function recPending(){
  const t=todayISO(), until=curM()+'-31', out=[];
  for(const r of Object.values(D.recurring)){if(!r.active)continue;
    for(const o of recDueList(r,until))out.push({r,m:o.m,date:o.date,amount:recAmt(r,o.date)+(r.fee||0),late:o.date<t?daysBetween(o.date,t):0})}
  return out.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
}
// Dernier mois réglé : on avance tant que les mois suivants sont payés ou ignorés (garde la compatibilité avec la colonne last_month)
function advancedLast(r,settledM,skipKey){
  const sk=new Set(skipList());if(skipKey)sk.add(skipKey);
  let last=recStart(r), m=shiftM(last,1);
  while(m<=curM()&&(m===settledM||!recIsDue(r,m)||D.expenses[recPaidId(r,m)]||sk.has(r.id+'|'+m))){last=m;m=shiftM(m,1)}
  return last;
}
const recOp=(r,last)=>({t:'recurring',op:'upsert',row:Object.assign({},r,{last_month:last,updated_at:nowISO()})});
function openRecPay(rid,m){const r=D.recurring[rid];if(!r)return;openSheet(null,'expense',{recPay:{rid,m}})}
function recSkip(rid,m){
  const key=rid+'|'+m, r=D.recurring[rid];if(!r)return;
  if(S.armed!=='skip:'+key){S.armed='skip:'+key;render();return}
  S.armed=null;
  const keep=skipList().filter(k=>k.split('|')[1]>=shiftM(curM(),-6)), op=Object.assign({},D.settings.opening,{__skip:[...keep,key].slice(-60)});
  mutate([settingsRow({opening:op}),recOp(r,advancedLast(r,null,key))]);
  toast(r.label+' : pas de paiement en '+mName(m));
}
function dueBlock(){
  const t=todayISO(), all=recPending(), soon=addDays(t,10), show=all.filter(p=>p.date<=soon).slice(0,5), rest=all.filter(p=>!show.includes(p));
  if(!all.length)return '';
  const row=p=>{const k=p.r.id+'|'+p.m, arm=S.armed==='skip:'+k;
    const when=p.late?pill('danger','en retard de '+p.late+' j'):p.date===t?pill('warning','aujourd\'hui'):pill('info','le '+dLong(p.date));
    return `<div class="due"><div class="due-top"><span class="t"><span>${esc(p.r.label)}${p.m!==curM()?' ('+esc(mName(p.m))+')':''}</span><span>${esc(CAT[p.r.category]?.label||'')} · ${esc(WAL[p.r.method]?.label||'')}${subTag(p.r)?' · '+esc(subTag(p.r)):''}</span></span><b class="num">${fmt(p.amount)}</b></div>
      <div class="actions">${when}<button type="button" class="btn-primary sm" data-rec-pay="${esc(p.r.id)}" data-m="${p.m}">Payer</button><button type="button" class="pill ${arm?'danger':''}" data-rec-skip="${esc(p.r.id)}" data-m="${p.m}">${arm?'Confirmer : pas ce mois-ci':'Pas ce mois-ci'}</button></div></div>`};
  return `<section class="block"><div class="block-head"><p class="over">À payer</p><small class="num">${fmt(sumBy(all,p=>p.amount))} réservés</small></div>
    ${show.length?show.map(row).join(''):'<p class="hint">Rien à payer dans les 10 prochains jours.</p>'}
    ${rest.length?`<p class="hint num">${rest.length} autre${rest.length>1?'s':''} plus tard ce mois-ci : ${fmt(sumBy(rest,p=>p.amount))} (${rest.map(p=>esc(p.r.label)).join(', ')}).</p>`:''}
    <p class="hint">Ces sommes sont réservées dans tes prévisions. Le solde de ton portefeuille ne change qu'à la confirmation du paiement, avec le montant réellement payé.</p></section>`;
}

/* ---------- Abonnements (2.7) : écran, carte prépayée, détection, rappels ---------- */
const dShort=iso=>isoOk(iso)?parseISO(iso).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}).replace('.',''):'-';
const subTag=r=>{const m=subM(r.id), a=[];if(subPer(r)>1)a.push(SUB_PER_ADJ[subPer(r)]);if(m&&m.c)a.push(fmtPx(subPriceNow(r))+' '+m.c);return a.join(' · ')};
// Prochaine échéance non réglée (en retard ou à venir)
function subNext(r){const l=recDueList(r,addDays(todayISO(),400));return l[0]||null}
const rechargeFee=n=>Math.round(n*(subCfg().rf||0)/100);
// Enregistre la configuration des abonnements : une seule opération sur les réglages
function subSettingsOp(n){
  const v={fx:Object.assign({},n.fx),m:Object.assign({},n.m),ig:(n.ig||[]).slice(-30)};if(n.rf>0)v.rf=n.rf;
  return settingsRow({opening:Object.assign({},D.settings.opening,{__subs:v})});
}
const subBase=()=>{const c=subCfg();return {fx:Object.assign({},c.fx),m:Object.assign({},c.m),ig:c.ig.slice(),rf:c.rf||0}};
// Les abonnements en devise suivent le taux : leur montant en FCFA est recalculé (la colonne amount reste toujours à jour)
function subReprice(newFx,skipId){
  const ops=[];
  for(const r of Object.values(D.recurring)){if(r.id===skipId)continue;const m=subM(r.id);if(!m||!m.c)continue;
    const rt=newFx[m.c]||DEF_FX[m.c]||0;if(!rt)continue;
    const amount=Math.round(m.x*rt);if(amount>0&&amount<1e9&&amount!==r.amount)ops.push({t:'recurring',op:'upsert',row:Object.assign({},r,{amount,updated_at:nowISO()})})}
  return ops;
}

/* Carte prépayée : combien faut-il y avoir pour les prélèvements à venir ? */
function cardAlerts(days=30){
  const t=todayISO(), end=addDays(t,days), out=[];
  for(const [w,label,,kind] of WALLETS){
    if(kind!=='card'||!inScope(!!WAL[w]?.pro))continue;
    const dues=[];
    for(const r of Object.values(D.recurring)){if(!r.active||r.method!==w)continue;
      for(const o of recDueList(r,end))dues.push({r,date:o.date,amount:recAmt(r,o.date)+(r.fee||0)})}
    dues.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
    const bal=balance(w), total=sumBy(dues,d=>d.amount);
    let run=bal, k=-1;dues.forEach((d,i)=>{run-=d.amount;if(run<0&&k<0)k=i});
    out.push({w,label,bal,dues,total,need:k>=0?Math.max(0,total-bal):0,by:k>=0?dues[k].date:null,short:k>=0?dues.slice(k):[]});
  }
  return out;
}
function rechargeCard(w){
  if(!CARD.has(w)||(WAL[w]&&WAL[w].archived))return;
  const a=cardAlerts(30).find(x=>x.w===w), need=a?a.need:0, last=lastMet();
  const mo=WALLETS.find(x=>x[0]===last&&x[3]==='momo')||WALLETS.find(x=>x[3]==='momo');
  openSheet(null,'move',{kind:'transfer',from:mo?mo[0]:last,to:w,amount:need,fee:need?rechargeFee(need):0});
}
function cardBlock(a){
  const rf=subCfg().rf||0, fee=rechargeFee(a.need), t=todayISO();
  let st;
  if(a.need>0){
    const now=a.by<=t, n=a.short.length;
    st=msg(now?'danger':'warning','Recharge la carte '+(now?'dès maintenant':'avant le '+esc(dLong(a.by))),`Il faut ${fmt(a.need)} de plus pour ${n} abonnement${n>1?'s':''} : ${a.short.map(d=>esc(d.r.label)).join(', ')}.${fee?` Avec ${String(rf).replace('.',',')} % de frais, prévois environ ${fmt(a.need+fee)} depuis ton Mobile Money.`:''}`);
  }else if(a.bal<0)st=msg('warning','Solde négatif',`La carte affiche ${fmtS(a.bal)}${a.dues.length?'':' et aucun prélèvement n\'est prévu dans les 30 jours'}. Une recharge manque peut-être dans le carnet : touche « Vérifier mon solde » dans Comptes pour recaler.`);
  else if(a.dues.length)st=msg('success','Solde suffisant',`Les ${a.dues.length} prélèvement${a.dues.length>1?'s':''} des 30 prochains jours (${fmt(a.total)}) sont couverts.`);
  else st='<p class="hint">Aucun prélèvement prévu sur cette carte dans les 30 prochains jours.</p>';
  return `<section class="block"><div class="block-head"><p class="over">${esc(a.label)}</p><small class="num" style="${a.bal<0?'color:var(--danger)':''}">solde ${fmtS(a.bal)}</small></div>${st}<div class="actions"><button type="button" class="${a.need>0?'btn-primary':'btn'} sm" data-recharge="${esc(a.w)}">${ic('swap','s16')}Recharger${a.need>0?' : '+fmt(a.need):''}</button></div></section>`;
}

/* Détection dans l'historique : un même paiement qui revient à intervalle régulier, ou un service en ligne connu */
const SUB_WORDS=['netflix','spotify','youtube','canal+','canal plus','icloud','google one','chatgpt','openai','claude','anthropic','microsoft','office 365','adobe','disney','prime video','amazon prime','apple music','apple tv','deezer','dropbox','notion','canva','zoom','linkedin','showmax','starzplay','audible','duolingo','coursera','udemy','nordvpn','expressvpn','github','figma','slack','crunchyroll','mubi','tidal','midjourney','perplexity','hostinger','namecheap','godaddy'];
const subKey=note=>norm(note).replace(/[^a-z0-9+ ]/g,' ').replace(/\b\d+\b/g,' ').replace(/\s+/g,' ').trim().split(' ').slice(0,3).join(' ').slice(0,40);
function subGuessNext(last,p){
  const day=parseISO(last).getDate(), t=todayISO();let m=last.slice(0,7);
  for(let i=0;i<40;i++){m=shiftM(m,p);const d=m+'-'+pad(Math.min(day,daysIn(m)));if(d>=t)return d}
  return t;
}
function subDetect(){
  const t=todayISO(), from=addDays(t,-420), have=Object.values(D.recurring).map(r=>subKey(r.label)).filter(k=>k.length>=3), ig=new Set(subCfg().ig), groups=new Map();
  for(const e of expenses()){
    if(e.recurring_id||e.synthetic||!e.note||e.date<from||e.date>t)continue;
    const k=subKey(e.note);if(k.length<3)continue;
    if(!groups.has(k))groups.set(k,[]);groups.get(k).push(e);
  }
  const out=[];
  for(const [k,list] of groups){
    if(ig.has(k)||have.some(h=>h===k||h.includes(k)||k.includes(h)))continue;
    list.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
    const last=list[list.length-1], ln=norm(last.note), known=SUB_WORDS.some(w=>ln.includes(w));
    let p=0;
    if(list.length>=2){
      const gaps=[];for(let i=1;i<list.length;i++)gaps.push(daysBetween(list[i-1].date,list[i].date));
      const fit=(lo,hi)=>gaps.every(g=>g>=lo&&g<=hi);
      p=fit(24,38)?1:fit(84,97)?3:fit(170,195)?6:fit(350,380)?12:0;
      if(p){const am=list.map(x=>x.amount), md=median(am);if(!am.every(a=>Math.abs(a-md)<=md*0.3))p=0}
    }
    if(!p){if(!known)continue;p=1}
    if(daysBetween(last.date,t)>p*31+10)continue;
    out.push({key:k,label:String(last.note).slice(0,40),amount:last.amount,method:last.method,category:last.category,p,last:last.date,n:list.length,known,date:subGuessNext(last.date,p)});
  }
  return out.sort((a,b)=>(b.n-a.n)||(a.key<b.key?-1:1)).slice(0,5);
}
function subIgnore(key){const b=subBase();b.ig=[...b.ig.filter(x=>x!==key),key];mutate([subSettingsOp(b)]);toast('Ignoré : il ne sera plus proposé')}

/* Écran Abonnements */
function subRow(r){
  const nx=subNext(r), t=todayISO(), days=nx?daysBetween(t,nx.date):null, m=subM(r.id);
  const amt=(nx?recAmt(r,nx.date):recAmt(r))+(r.fee||0);
  const when=!r.active?pill('info','en pause'):!nx?'':days<0?pill('danger','en retard de '+(-days)+' j'):days===0?pill('warning','aujourd\'hui'):days<=7?pill('warning','dans '+days+' j'):pill('info',esc(dShort(nx.date)));
  const trial=m&&m.t&&m.t>=t?pill('warning','essai jusqu\'au '+esc(dShort(m.t))):'', chg=m&&m.n&&m.n.d>=t?pill('info','nouveau prix le '+esc(dShort(m.n.d))):'';
  const canPay=r.active&&nx&&nx.m<=curM(), tag=subTag(r);
  return `<div class="due"><div class="due-top"><span class="t"><span>${esc(r.label)}</span><span>${esc(CAT[r.category]?.label||r.category)} · ${esc(WAL[r.method]?.label||r.method)}${tag?' · '+esc(tag):''}</span></span><b class="num">${fmt(amt)}</b></div>
    <div class="actions">${when}${trial}${chg}${canPay?`<button type="button" class="btn-primary sm" data-rec-pay="${esc(r.id)}" data-m="${esc(nx.m)}">Payer</button>`:''}<button type="button" class="pill" data-sub-edit="${esc(r.id)}">Modifier</button></div></div>`;
}
function renderSubs(){
  const recs=Object.values(D.recurring).filter(recInScope), act=recs.filter(r=>r.active), monthly=sumBy(act,subMonthly);
  const byW={};act.forEach(r=>{byW[r.method]=(byW[r.method]||0)+subMonthly(r)});
  let h=scopeNote();
  h+=`<section class="block hero"><div class="block-head"><p class="over">Abonnements et charges fixes</p>${eyeBtn()}</div><div class="big num">${fmt(monthly)}</div><p class="sub num">par mois en moyenne, soit ${fmt(monthly*12)} par an · ${act.length} actif${act.length>1?'s':''}</p>${Object.keys(byW).length>1?`<div class="sub num">${Object.entries(byW).sort((a,b)=>b[1]-a[1]).map(([w,v])=>`<span>${esc(WAL[w]?.label||w)} <b>${fmt(v)}</b></span>`).join('')}</div>`:''}</section>`;
  const cards=cardAlerts(30);
  if(cards.length)h+=cards.map(cardBlock).join('');
  else h+=`<section class="block"><p class="over">Carte prépayée</p><p class="hint">Tu paies tes abonnements avec une carte prépayée ? Ajoute-la comme portefeuille : le carnet te dit combien recharger, et avant quelle date, pour que chaque renouvellement passe.</p><div class="actions"><button type="button" class="btn sm" data-act="subNewCard">${ic('plus','s16')}Ajouter ma carte prépayée</button></div></section>`;
  const det=subDetect();
  if(det.length)h+=`<section class="block"><div class="block-head"><p class="over">Abonnements détectés</p><small>${det.length}</small></div><p class="hint">Ces paiements reviennent dans ton historique. Ajoute-les pour être prévenu avant chaque prélèvement.</p>${det.map(d=>`<div class="due"><div class="due-top"><span class="t"><span>${esc(d.label)}</span><span>${esc(SUB_PER_ADJ[d.p])} · dernier le ${esc(dShort(d.last))}${d.n>1?' · '+d.n+' paiements':''}</span></span><b class="num">${fmt(d.amount)}</b></div><div class="actions"><button type="button" class="btn-primary sm" data-sub-add="${esc(d.key)}">Ajouter</button><button type="button" class="pill" data-sub-ignore="${esc(d.key)}">Ignorer</button></div></div>`).join('')}</section>`;
  const sorted=[...recs].sort((a,b)=>{const na=a.active?subNext(a):null, nb=b.active?subNext(b):null, da=na?na.date:'9999', db=nb?nb.date:'9999';return da<db?-1:da>db?1:(a.label<b.label?-1:1)});
  h+=`<section class="block"><div class="block-head"><p class="over">Mes abonnements</p><small>${recs.length||''}</small></div>${recs.length?sorted.map(subRow).join(''):'<p class="hint">Loyer, forfait, Netflix, cloud, logiciels : ajoute chaque prélèvement régulier. Le carnet réserve la somme, te prévient avant la date et calcule ton coût mensuel réel.</p>'}<div class="actions"><button type="button" class="btn-primary sm" data-sub-new="1">${ic('plus','s16')}Ajouter un abonnement</button></div></section>`;
  const cfg=subCfg();
  h+=`<section class="block"><details data-keep="fxopen" ${S.fxopen?'open':''}><summary class="linkbtn">${ic('sliders','s16')} Taux de change et frais de recharge</summary><div class="add">
    <p class="hint">Pour un abonnement en dollars ou en euros, le carnet convertit en FCFA avec ces taux. Indique le taux réellement appliqué par ta carte ; après chaque paiement, tu pourras le corriger avec le montant débité.</p>
    <div class="grid2"><label class="inp">1 USD en FCFA<input id="sx-USD" inputmode="decimal" placeholder="Ex. 600" value="${cfg.fx.USD?esc(String(cfg.fx.USD).replace('.',',')):''}"></label><label class="inp">1 EUR en FCFA<input id="sx-EUR" inputmode="decimal" value="${esc(String(fxRate('EUR')).replace('.',','))}"></label></div>
    <label class="inp">Frais de recharge de la carte (%)<input id="sx-rf" inputmode="decimal" placeholder="0" value="${cfg.rf?esc(String(cfg.rf).replace('.',',')):''}"></label>
    <p class="err" id="sx-err" hidden></p><div class="actions"><button type="button" class="btn-primary sm" data-act="saveFx">Enregistrer</button></div></div></details></section>`;
  return h;
}
function saveFx(){
  const err=m=>{$('sx-err').textContent=m;$('sx-err').hidden=false};
  const b=subBase(), old=Object.assign({},b.fx);
  for(const c of CURS){const raw=$('sx-'+c).value.trim();if(!raw){delete b.fx[c];continue}const x=parseNum(raw);if(!(x>=1&&x<=100000))return err('Taux '+c+' incorrect : indique combien de FCFA valent 1 '+c+'.');b.fx[c]=x}
  const rr=$('sx-rf').value.trim();if(rr){const x=parseNum(rr);if(!(x>=0&&x<=20))return err('Frais de recharge : indique un pourcentage entre 0 et 20.');b.rf=x}else b.rf=0;
  S.fxopen=true;
  const ops=[subSettingsOp(b),...subReprice(b.fx)];
  mutate(ops);toast(ops.length>1?'Taux enregistré : '+(ops.length-1)+' abonnement(s) en devise recalculé(s)':'Taux enregistrés');
}

/* Ajout et modification d'un abonnement */
function openSubForm(id,preset){
  const r=id?D.recurring[id]:null;if(id&&!r)return;
  const m=r?subM(r.id):null, nx=r?subNext(r):null, P=preset||{}, t=todayISO();
  const per=r?subPer(r):([3,6,12].includes(P.p)?P.p:1), cur=m&&m.c?m.c:'';
  const px=r?(cur?subPriceNow(r):r.amount):(P.amount>0?P.amount:''), date=r?(nx?nx.date:t):(isoOk(P.date)?P.date:t);
  const cardW=WALLETS.find(w=>w[3]==='card'&&inScope(!!WAL[w[0]]?.pro));
  const met=r?r.method:(P.method&&WAL[P.method]&&!WAL[P.method].archived&&P.method!=='epargne'?P.method:(cardW?cardW[0]:lastMet()));
  const cat=r?r.category:(CAT[P.category]&&!CAT[P.category].archived?P.category:(CAT.loisirs?'loisirs':'autres'));
  S.subEdit=r?r.id:'new';S.subOrig=r?date:'';
  const o=(v,l,sel)=>`<option value="${esc(v)}" ${sel?'selected':''}>${esc(l)}</option>`;
  const metOpts=METHODS.map(([k,l])=>o(k,l,k===met)).join('')+(!METHODS.some(x=>x[0]===met)&&WAL[met]?o(met,WAL[met].label+' (archivé)',true):'');
  const catOpts=CATS.map(([k,l])=>o(k,l,k===cat)).join('')+(!CATS.some(x=>x[0]===cat)&&CAT[cat]?o(cat,CAT[cat].label+' (archivée)',true):'');
  const np=m&&m.n&&m.n.d>=t?m.n:null;
  openDlg(`<div class="sheet-head"><h2>${r?'Modifier l\'abonnement':'Nouvel abonnement'}</h2><button type="button" class="x" data-act="dlgClose" aria-label="Fermer">${ic('x')}</button></div>
    <label class="inp">Nom<input id="sb-label" maxlength="60" placeholder="Ex. Netflix" value="${esc(r?r.label:(P.label||''))}"></label>
    <div class="grid2"><label class="inp">Prix<input id="sb-amt" inputmode="decimal" autocomplete="off" placeholder="0" value="${esc(px===''?'':String(px).replace('.',','))}"></label>
      <label class="inp">Devise<select id="sb-cur">${o('','FCFA',!cur)}${o('USD','USD (dollar)',cur==='USD')}${o('EUR','EUR (euro)',cur==='EUR')}</select></label></div>
    <div id="sb-fxrow" ${cur?'':'hidden'}><label class="inp">Taux : combien de FCFA pour 1 <span id="sb-fxc">${esc(cur||'USD')}</span><input id="sb-fx" inputmode="decimal" placeholder="Ex. 600" value="${cur&&fxRate(cur)?esc(String(fxRate(cur)).replace('.',',')):''}"></label></div>
    <p class="hint num" id="sb-conv" aria-live="polite"></p>
    <div class="grid2"><label class="inp">Fréquence<select id="sb-per">${Object.entries(SUB_PERIODS).map(([k,v])=>o(k,v,+k===per)).join('')}</select></label>
      <label class="inp">Prochain prélèvement<input type="date" id="sb-date" value="${esc(date)}"></label></div>
    <p class="hint" id="sb-dayhint" hidden>Après le 28 du mois, le carnet compte le 28.</p>
    <label class="check"><input type="checkbox" id="sb-trial" ${m&&m.t?'checked':''}> Ce prélèvement marque la fin d'un essai gratuit</label>
    <div class="grid2"><label class="inp">Payé avec<select id="sb-met">${metOpts}</select></label><label class="inp">Catégorie<select id="sb-cat">${catOpts}</select></label></div>
    <label class="inp" id="sb-feerow" ${MOMO.has(met)?'':'hidden'}>Frais Mobile Money (FCFA)<input id="sb-fee" data-money inputmode="numeric" placeholder="0" value="${r&&r.fee?group(r.fee):''}"></label>
    <details ${np?'open':''}><summary class="linkbtn">Le prix va changer ?</summary><div class="add"><p class="hint">Le fournisseur annonce un nouveau prix : le carnet l'applique à partir de cette date et te prévient trois jours avant.</p>
      <div class="grid2"><label class="inp">À partir du<input type="date" id="sb-npd" value="${np?esc(np.d):''}"></label><label class="inp">Nouveau prix<input id="sb-npx" inputmode="decimal" placeholder="0" value="${np?esc(String(np.x).replace('.',',')):''}"></label></div></div></details>
    <p class="err" id="sb-err" hidden></p>
    <div class="sheet-actions">${r?`<button type="button" class="btn-danger" data-sub-del="${esc(r.id)}">Retirer</button><button type="button" class="btn" data-sub-pause="${esc(r.id)}">${r.active?'Mettre en pause':'Reprendre'}</button>`:''}<button type="button" class="btn-primary" data-act="saveSub">Enregistrer</button></div>`);
  subFormSync();
  setTimeout(()=>$('sb-label')&&$('sb-label').focus(),60);
}
function subFormSync(ev){
  if(!$('sb-label'))return;
  const c=$('sb-cur').value, id=ev&&ev.target&&ev.target.id;
  $('sb-fxrow').hidden=!c;
  if(c){$('sb-fxc').textContent=c;if(id==='sb-cur'){const rt=fxRate(c);$('sb-fx').value=rt?String(rt).replace('.',','):''}}
  $('sb-feerow').hidden=!MOMO.has($('sb-met').value);
  const x=parseNum($('sb-amt').value), rate=c?parseNum($('sb-fx').value):1;
  $('sb-conv').textContent=c&&x>0&&rate>0?'Soit environ '+fmtRaw(Math.round(x*rate))+' par prélèvement.':'';
  const d=$('sb-date').value;$('sb-dayhint').hidden=!(isoOk(d)&&+d.slice(8)>28);
}
function saveSub(){
  const id=S.subEdit, isNew=id==='new', r=isNew?null:D.recurring[id];
  const err=m=>{$('sb-err').textContent=m;$('sb-err').hidden=false};
  if(!isNew&&!r){closeDlg();return}
  const label=$('sb-label').value.trim().replace(/\s+/g,' ').slice(0,60);
  if(!label)return err('Indique le nom de l\'abonnement.');
  const cur=$('sb-cur').value, c=CURS.includes(cur)?cur:'', x=parseNum($('sb-amt').value);
  if(!(x>0))return err('Indique le prix.');
  let rate=0;if(c){rate=parseNum($('sb-fx').value);if(!(rate>=1&&rate<=100000))return err('Indique le taux : combien de FCFA valent 1 '+c+'.')}
  const amount=c?Math.round(x*rate):Math.round(x);
  if(!(amount>0&&amount<1e9))return err('Le montant est incorrect.');
  const p=[1,3,6,12].includes(+$('sb-per').value)?+$('sb-per').value:1, date=$('sb-date').value;
  if(!isoOk(date))return err('Indique la date du prochain prélèvement.');
  const method=$('sb-met').value;if(!WAL[method]||method==='epargne')return err('Choisis le moyen de paiement.');
  const category=CAT[$('sb-cat').value]?$('sb-cat').value:'autres', month=date.slice(0,7), now=nowISO();
  const npd=$('sb-npd').value, npxRaw=$('sb-npx').value.trim();let n=null;
  if(npd||npxRaw){const nx=parseNum(npxRaw);if(!isoOk(npd)||!(nx>0))return err('Pour un changement de prix, indique la date et le nouveau prix, ou laisse les deux vides.');n={d:npd,x:c?nx:Math.round(nx)}}
  const dateChanged=isNew||date!==S.subOrig;
  let last=isNew?shiftM(month,-1):r.last_month;
  if(!isNew&&dateChanged){const nl=shiftM(month,-1);if(nl>last)last=nl}
  const fee=MOMO.has(method)?toInt($('sb-fee').value):0;
  const row=Object.assign({},r||{},{id:isNew?newId():r.id,label,amount,fee,category,method,day:dateChanged?Math.min(+date.slice(8),28):r.day,last_month:last,active:isNew?true:r.active,created_at:isNew?now:r.created_at,updated_at:now});
  const b=subBase(), meta={};
  if(p>1){meta.p=p;meta.a=month}
  if(c){meta.c=c;meta.x=x;b.fx[c]=rate}
  if($('sb-trial').checked)meta.t=date;
  if(n)meta.n=n;
  if(Object.keys(meta).length)b.m[row.id]=meta;else delete b.m[row.id];
  const ops=[{t:'recurring',op:'upsert',row},subSettingsOp(b),...subReprice(b.fx,row.id)];
  closeDlg();S.planView='subs';LS.set(K.planView,'subs');
  mutate(ops);
  toast(isNew?'Abonnement ajouté : prochain prélèvement le '+dLong(date):'Abonnement modifié');
}
function subDelClick(id,btn){
  if(S.armed!=='rec:'+id){S.armed='rec:'+id;btn.textContent='Confirmer le retrait';btn.classList.add('danger');return}
  closeDlg();delRec(id);
}
// Après un paiement dont le montant réel diffère du prévu : on retient le taux réel (devise) ou le nouveau prix (FCFA)
function subLearn(r,real){
  const m=subM(r.id), b=subBase();
  if(m&&m.c){
    const rate=Math.round(real/subPriceNow(r)*100)/100;if(!(rate>=1&&rate<=100000))return null;
    b.fx[m.c]=rate;
    return {row:Object.assign({},r,{amount:Math.round(m.x*rate),updated_at:nowISO()}),more:[subSettingsOp(b),...subReprice(b.fx,r.id)]};
  }
  const more=[];
  if(m&&m.n&&todayISO()>=m.n.d){const o=Object.assign({},m);delete o.n;if(Object.keys(o).length)b.m[r.id]=o;else delete b.m[r.id];more.push(subSettingsOp(b))}
  return {row:Object.assign({},r,{amount:real,updated_at:nowISO()}),more};
}
function updateKeep(){
  const box=$('fs-keep');if(!box)return;
  const RP=S.recPay&&D.recurring[S.recPay.rid]?S.recPay:null;
  if(!RP||S.kind!=='expense'){box.hidden=true;return}
  const r=D.recurring[RP.rid], real=toInt($('f-amount').value), exp=recAmt(r,recDue(r,RP.m)), m=subM(r.id);
  if(!(real>0)||real===exp){box.hidden=true;return}
  if(m&&m.c){const x=subPriceNow(r);$('keep-t').textContent='Retenir ce taux pour les prochains prélèvements : 1 '+m.c+' = '+fmtRate(real/x)+' FCFA (au lieu de '+fmtRate(fxRate(m.c))+')'}
  else $('keep-t').textContent='Retenir ce montant pour les prochains prélèvements ('+fmtRaw(real)+' au lieu de '+fmtRaw(exp)+')';
  box.hidden=false;
}

/* Alertes de l'accueil : recharge de carte, fin d'essai, changement de prix */
function subsAlerts(){
  const t=todayISO(), soon=addDays(t,14), items=[];
  for(const a of cardAlerts(30))if(a.need>0&&a.by&&a.by<=soon){const n=a.short.length;
    items.push({tone:a.by<=t?'danger':'warning',title:'Recharge la carte '+(a.by<=t?'dès maintenant':'avant le '+esc(dLong(a.by))),body:`« ${esc(a.label)} » : il faut ${fmt(a.need)} de plus pour ${n} abonnement${n>1?'s':''} (${a.short.map(d=>esc(d.r.label)).join(', ')}).`,w:a.w})}
  for(const r of Object.values(D.recurring)){if(!r.active||!recInScope(r))continue;const m=subM(r.id);if(!m)continue;
    if(m.t&&m.t>=t&&m.t<=addDays(t,7))items.push({tone:'warning',title:'Essai gratuit : '+esc(r.label),body:`Premier prélèvement le ${esc(dLong(m.t))} : ${fmt(recAmt(r,m.t)+(r.fee||0))}. Annule avant si tu n'en veux pas.`});
    if(m.n&&m.n.d>=t&&m.n.d<=soon)items.push({tone:'info',title:'Changement de prix : '+esc(r.label),body:`Dès le ${esc(dLong(m.n.d))} : ${fmt(recAmt(r,m.n.d)+(r.fee||0))} au lieu de ${fmt(recAmt(r,t)+(r.fee||0))}.`})}
  return items;
}
const subsAlertBlock=()=>{const l=subsAlerts();if(!l.length)return '';
  return l.map(a=>msg(a.tone,a.title,a.body)).join('')+`<div class="actions">${l.some(a=>a.w)?`<button type="button" class="btn-primary sm" data-recharge="${esc(l.find(a=>a.w).w)}">Recharger la carte</button>`:''}<button type="button" class="btn sm" data-act="openSubs">Voir les abonnements</button></div>`};
const planSeg=()=>`<div class="seg" style="grid-template-columns:repeat(2,1fr);margin-bottom:12px" role="group" aria-label="Vue du plan"><button type="button" data-planview="goals" aria-pressed="${S.planView==='goals'}">Objectifs et budgets</button><button type="button" data-planview="subs" aria-pressed="${S.planView==='subs'}">Abonnements</button></div>`;
function openSubs(){S.tab='plan';S.planView='subs';LS.set(K.tab,'plan');LS.set(K.planView,'subs');render();$('main').scrollTop=0}

/* ---------- Calculs financiers ---------- */
const SMIG=70400; // SMIG mensuel depuis le 1er janvier 2025
const INS_BZV={alimentation:44.4,logfac:9.7,transport:10.0,communication:6.7,vetements:6.9,loisirs:7.6,sante:2.4,education:2.9,divers:9.3};
const PRICES={bus:150,taxi:1000,kwh:49.08,fibre:15000};
const r500=n=>Math.round(n/500)*500;
const lin=(x,x0,x1,y0,y1)=>x<=x0?y0:x>=x1?y1:y0+(x-x0)/(x1-x0)*(y1-y0);
function proposal(R){
  const k=R/SMIG, sh={};
  sh.alimentation=lin(k,2,6,44,30);
  const save=lin(k,1.5,5,0,15);
  sh.logement=lin(k,1,3,15,20);sh.factures=5;
  const rest=100-sh.alimentation-save-sh.logement-sh.factures;
  const W={transport:10,communication:6.7,vetements:6.9,loisirs:7.6,famille:5,sante:2.4,education:2.9,autres:4.3};
  const tw=Object.values(W).reduce((a,b)=>a+b,0);
  for(const c in W)sh[c]=W[c]*rest/tw;
  const amt={};for(const c in sh)amt[c]=r500(R*sh[c]/100);
  return {k,save,saveAmt:r500(R*save/100),sh,amt};
}
const savingsGoal=m=>D.settings.savings_goal||(incomeIn(m)?proposal(incomeIn(m)).saveAmt:0);

// Solde d'un portefeuille : solde de départ + flux depuis la date de départ
function balance(w,until){
  const od=D.settings.opening_date, ok=d=>(!od||d>=od)&&(!until||d<=until);
  let b=Number((D.settings.opening||{})[w]||0);
  for(const e of incomes())if(ok(e.date)&&(e.wallet||'banque')===w)b+=e.amount;
  for(const e of expenses())if(ok(e.date)&&e.method===w)b-=spend(e);
  for(const m of moves()){if(!ok(m.date))continue;if(m.from_wallet===w)b-=m.amount+(m.fee||0);if(m.to_wallet===w)b+=m.amount}
  return b;
}
function planStats(p){
  const mv=moves().filter(m=>m.ref_id===p.id), s=k=>sumBy(mv.filter(m=>m.kind===k),m=>m.amount);
  if(p.type==='project'){const saved=s('project'),target=p.amount,due=p.data?.due;let monthly=0;
    if(due){const months=Math.max(1,(parseISO(due).getFullYear()-new Date().getFullYear())*12+parseISO(due).getMonth()-new Date().getMonth());monthly=Math.max(0,(target-saved)/months)}
    return {saved,target,due,monthly,ratio:target?saved/target:0}}
  if(p.type==='loan'){const out=s('loan_out'),back=s('loan_back');return {out,back,left:Math.max(0,out-back),due:p.data?.due}}
  if(p.type==='debt'){const inn=s('debt_in'),paid=s('debt_pay');return {inn,paid,left:Math.max(0,inn-paid),due:p.data?.due}}
  if(p.type==='tontine'){const d=p.data||{}, cot=p.amount, members=d.members||1, turn=d.turn||1, weekly=d.frequency==='hebdomadaire';
    const start=d.start||todayISO(), sd=parseISO(start);
    const recv=weekly?new Date(sd.getTime()+(turn-1)*7*864e5):new Date(sd.getFullYear(),sd.getMonth()+turn-1,sd.getDate());
    const end=weekly?new Date(sd.getTime()+(members-1)*7*864e5):new Date(sd.getFullYear(),sd.getMonth()+members-1,sd.getDate());
    return {paid:s('tontine_out'),received:s('tontine_in'),pot:cot*members,total:cot*members,receive:isoOf(recv),end:isoOf(end),monthly:weekly?cot*52/12:cot}}
  return {};
}
const projectsSaved=()=>sumBy(plans('project').filter(p=>p.active!==false),p=>planStats(p).saved);
const fixedCharges=()=>sumBy(Object.values(D.recurring).filter(r=>r.active),subMonthly);
const commitments=m=>sumBy(plans('tontine').filter(p=>p.active!==false&&(p.data?.start||'')<=m+'-31'&&planStats(p).end.slice(0,7)>=m),p=>planStats(p).monthly);
function dayBudget(m){
  const inc=incomeIn(m);if(!inc)return null;
  const items=monthItems(m), fixedDone=sumBy(items.filter(e=>e.recurring_id),spend);
  const fixedLeft=sumBy(recPending().filter(p=>p.m<=m&&recInScope(p.r)),p=>p.amount);
  const fixed=fixedDone+fixedLeft, goal=savingsGoal(m), engage=commitments(m);
  const rav=inc-fixed-goal-engage, variable=sumBy(items.filter(e=>!e.recurring_id),spend);
  const Dm=daysIn(m), today=new Date().getDate(), left=m===curM()?Dm-today+1:0;
  return {inc,fixed,goal,engage,rav,variable,left,perDay:left?(rav-variable)/left:0,used:rav>0?variable/rav:1};
}
/* ---------- Cycle de paie et salaire en retard ---------- */
const cfgCycle=()=>{const c=(D.settings.opening||{}).__cycle;return c&&typeof c==='object'?c:{}};
const payDay=()=>{const d=Math.round(Number(cfgCycle().day));return d>=1&&d<=28?d:0};
const lastSalary=()=>{let b=null;for(const e of incomes())if(e.source==='salaire'&&(!b||e.date>b.date))b=e;return b};
const liquid=()=>sumBy(scopedWallets().filter(w=>w[0]!=='epargne'),([w])=>balance(w));
// Prochaine paie attendue = prochain jour de paie au moins 15 jours après le dernier salaire noté
function payInfo(){
  const pd=payDay();if(!pd)return null;
  const t=todayISO(), last=lastSalary();
  let next=nextDate(pd,last?addDays(last.date,15):t), late=next<t?daysBetween(next,t):0;
  if(late>60){next=nextDate(pd,t);late=0}
  return {pd,last,next,late,wait:late?0:daysBetween(t,next)};
}
// Dépense courante moyenne par jour sur les 30 derniers jours (hors récurrentes)
function dailyRate(){
  const t=todayISO(), from=addDays(t,-30), all=expenses().filter(e=>inScope(isProExp(e)));
  const list=all.filter(e=>!e.recurring_id&&e.date>from&&e.date<=t);
  if(!list.length)return 0;
  const first=all.reduce((m,e)=>e.date<m?e.date:m,t);
  return sumBy(list,spend)/Math.max(7,Math.min(30,daysBetween(first,t)+1));
}
// Sorties déjà connues d'ici N jours : récurrentes non encore passées, tontines, dettes à rembourser
function committed(days){
  const t=todayISO(), end=addDays(t,days);let sum=0;
  // Charges récurrentes non réglées (en retard ou à venir) : réservées jusqu'à leur paiement
  for(const r of Object.values(D.recurring)){if(!r.active||!recInScope(r))continue;sum+=sumBy(recDueList(r,end),o=>recAmt(r,o.date)+(r.fee||0))}
  for(const u of upcoming(days)){if(u.plus||u.late||u.kind==='Récurrente'||u.kind==='Créance'||u.kind==='Projet')continue;sum+=u.amount}
  return sum;
}
function holdDays(cash,rate){if(rate<=0)return null;if(cash<=0)return 0;let d=0;while(d<90&&cash-committed(d+1)>=rate*(d+1))d++;return d}
function payScenarios(P,cash,rate){
  const delays=P.late?[7,14,21,30]:[0,7,14,21];
  return delays.map(x=>{const n=P.late?x:P.wait+x;if(n<=0)return null;const avail=cash-committed(n), per=avail/n;
    return {n,x,avail,per,state:rate>0?(per>=rate?'success':per>=rate*.7?'warning':'danger'):null}}).filter(Boolean);
}
function payCard(){
  const P=payInfo();if(!P)return '';
  const cash=liquid(), rate=dailyRate(), sc=payScenarios(P,cash,rate), hold=holdDays(cash,rate), sav=balance('epargne');
  const lab=P.late?`Salaire en retard de ${P.late} jour${P.late>1?'s':''}`:P.wait===0?'Jour de paie attendu aujourd\'hui':`Salaire dans ${P.wait} jour${P.wait>1?'s':''}`;
  let h=`<section class="block"><div class="block-head"><p class="over">Cycle de paie</p>${pill(P.late?'danger':P.wait<=3?'success':'info',lab)}</div>`;
  if(cash<=0)return h+msg('warning','Liquidités nulles ou négatives','Selon le carnet, tes portefeuilles hors épargne sont à zéro ou en négatif. Vérifie tes soldes de départ dans Comptes : sans eux, le calcul des jours tenables n\'est pas fiable.')+'</section>';
  if(hold!=null)h+=`<div class="big num" style="font-size:26px;color:var(--${P.late&&hold<14?'danger':'forest-900'})">${hold>=90?'Plus de 90 jours':'Tu tiens environ '+hold+' jour'+(hold>1?'s':'')}</div>
    <p class="hint num">À ton rythme actuel de ${fmt(rate)} par jour, tes liquidités de ${fmt(cash)} couvrent ce délai après tes charges à venir.</p>`;
  else h+=`<p class="hint num">Tes liquidités : ${fmt(cash)}. Le calcul des jours tenables apparaît dès que tu as noté quelques dépenses.</p>`;
  if(sc.length)h+=`<p class="over" style="margin-top:12px">${P.late?'Si le salaire arrive':'Si le salaire tarde'}</p><div class="rows">${sc.map(r=>`<div class="scn"><span class="l">${P.late?'Dans '+r.n+' jours':r.x===0?'À la date prévue, '+esc(dLong(P.next)):r.x+' jours de plus'}</span><b class="a num" style="${r.per<=0?'color:var(--danger)':''}">${r.per>0?fmt(r.per):'0 FCFA'}</b><span class="s">${r.per>0?'par jour, charges à venir déduites':'charges à venir supérieures aux liquidités'}</span><span class="p">${r.state?pill(r.state,r.state==='success'?'Tenable':r.state==='warning'?'Serré':'Insuffisant'):''}</span></div>`).join('')}</div>`;
  if(P.late){const s14=sc.find(r=>r.n===14);
    h+=`<p class="hint" style="margin-top:8px">${s14&&s14.per>0?`Pour tenir 14 jours, limite-toi à <b class="num">${fmt(s14.per)}</b> par jour : loyer, nourriture, transport et santé d'abord. `:''}${sav>0?`Ton épargne (<span class="num">${fmt(sav)}</span>) n'est pas comptée : elle reste un filet de sécurité.`:''}</p>`;
  }else if(!D.settings.opening_date)h+=`<p class="hint">Saisis tes soldes de départ dans Comptes pour des montants exacts.</p>`;
  return h+'</section>';
}
// Période du budget du jour (accueil) : jusqu'à la prochaine paie ou jusqu'à la fin du mois
function hzChoice(P){
  const H=horizon(), pref=cfgHz()||(H.pay?'pay':'month');
  if(!P)return '<p class="hint">Budget du jour : sans jour de paie, il est calculé jusqu\'à la fin du mois.</p>';
  const opt=[['pay','Jusqu\'à la prochaine paie',H.pay?H.pay.n+' j':P.late?'salaire en retard':'-'],['month','Jusqu\'à la fin du mois',H.month.n+' j']];
  return `<div class="form-row"><span>Budget du jour<span class="meta" style="display:block">Période sur laquelle l'accueil répartit ton argent</span></span></div>
    <div class="hzseg set" role="group" aria-label="Période du budget du jour">${opt.map(([k,l,n])=>`<button type="button" data-hz="${k}" aria-pressed="${pref===k}">${l}<small>${n}</small></button>`).join('')}</div>
    ${P.late?'<p class="hint">Ton salaire est en retard : en attendant, le calcul va jusqu\'à la fin du mois.</p>':''}`;
}
function cycleSettings(){
  const P=payInfo(), d=payDay();
  return `<section class="block"><p class="over">Salaire et cycle de paie</p><p class="hint">Indique ton jour de paie habituel. Le carnet calcule combien de jours tu tiens avec tes liquidités, et ce qu'il te reste par jour si le salaire tarde.</p>
    <div class="form-row"><span>Jour de paie habituel<span class="meta" style="display:block">de 1 à 28, vide si ton salaire est irrégulier</span></span><label class="field"><input class="r" id="cy-day" inputmode="numeric" maxlength="2" value="${d||''}" placeholder="-" aria-label="Jour de paie"><span>du mois</span></label></div>
    ${P?`<p class="hint">Prochain salaire attendu : <b>${esc(dLong(P.next))}</b>${P.late?` (en retard de ${P.late} jour${P.late>1?'s':''})`:''}. ${P.last?'Dernier salaire noté le '+esc(dLong(P.last.date))+'.':'Aucun salaire noté pour l\'instant : ajoute-le dans Comptes, source « Salaire ».'}</p>`:''}
    <div class="actions"><button type="button" class="btn-primary" data-act="saveCycle">Enregistrer</button></div>
    <div style="border-top:1px solid var(--mist-100);margin-top:14px;padding-top:4px">${hzChoice(P)}</div></section>`;
}
function saveCycle(){
  const raw=$('cy-day').value.trim(), d=toInt(raw);
  if(raw&&!(d>=1&&d<=28))return toast('Choisis un jour entre 1 et 28');
  const op=Object.assign({},D.settings.opening);if(raw)op.__cycle={day:d};else delete op.__cycle;
  mutate([settingsRow({opening:op})]);toast(raw?'Jour de paie enregistré':'Cycle de paie retiré');
}
function emergency(){
  const months=[];for(let i=1;i<=3;i++){const m=shiftM(curM(),-i);const it=monthItems(m);if(it.length)months.push(sumBy(it.filter(e=>natureOf(e)==='besoin'),spend))}
  let avg=months.length?sumBy(months,x=>x)/months.length:0;
  if(!avg){const it=monthItems(curM());const d=new Date().getDate();avg=sumBy(it.filter(e=>natureOf(e)==='besoin'),spend)/d*daysIn(curM())}
  if(!avg&&incomeIn(curM())){const P=proposal(incomeIn(curM()));avg=['alimentation','logement','factures','transport','communication','sante','education'].reduce((t,c)=>t+P.amt[c],0)}
  const fund=Math.max(0,balance('epargne')-projectsSaved()), target=avg*(D.settings.emergency_months||3);
  return {avg,fund,target,covered:avg?fund/avg:0,ratio:target?fund/target:0};
}
function unusual(m){
  const out=[], items=monthItems(m).filter(e=>!e.recurring_id&&!e.synthetic);
  for(const e of items){
    const from=isoOf(new Date(parseISO(e.date).getTime()-90*864e5));
    const hist=expenses().filter(x=>x.category===e.category&&x.id!==e.id&&!x.recurring_id&&x.date>=from&&x.date<=e.date).map(spend);
    if(hist.length<5)continue;
    const mean=sumBy(hist,x=>x)/hist.length, sd=Math.sqrt(sumBy(hist,x=>(x-mean)**2)/hist.length), med=median(hist), v=spend(e);
    if(v>mean+2.5*sd&&v>=2*med)out.push({e,ratio:v/med});
  }
  return out.sort((a,b)=>b.ratio-a.ratio).slice(0,3);
}
const realChange=(cur,prev)=>prev?((cur/prev)/Math.pow(1+(D.settings.inflation||0)/100,1/12))-1:null;
function alertsDue(){
  const out=[], t=todayISO();
  for(const p of plans()){if(p.active===false)continue;const s=planStats(p);
    if((p.type==='loan'||p.type==='debt')&&s.left>0&&s.due){const d=daysBetween(t,s.due);
      if(d<=7)out.push({tone:d<0?'danger':'warning',title:p.type==='loan'?`Remboursement attendu de ${esc(p.data?.person||p.name)}`:`Dette à rembourser à ${esc(p.data?.person||p.name)}`,body:`${fmt(s.left)} ${d<0?`en retard depuis ${-d} jour${d<-1?'s':''}`:d===0?'aujourd\'hui':`le ${dLong(s.due)}`}.`})}
    if(p.type==='tontine'){const d=daysBetween(t,s.receive);if(d>=0&&d<=14&&s.received<s.pot)out.push({tone:'info',title:`Ton tour dans la tontine ${esc(p.name)}`,body:`Réception prévue le ${dLong(s.receive)} : ${fmt(s.pot)}.`})}
  }
  return out;
}

/* ---------- V2.3 : SMS Mobile Money, catégorie devinée, échéances, patrimoine ---------- */
const norm=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const KEYWORDS={
  transport:['taxi','bus','foula','moto','carburant','essence','gasoil','coaster','course','parking','peage','billet'],
  alimentation:['marche','pain','riz','poisson','viande','manioc','foufou','boulangerie','supermarche','epicerie','huile','sucre','lait','legume','fruit','courses'],
  factures:['e2c','lcde','electricite','courant','facture','canal','fibre','congo telecom','abonnement','gaz','prepaye'],
  communication:['credit','forfait','data','databundle','bundle','recharge','airtime','unites','internet mobile','pass'],
  logement:['loyer','bail','caution','agence','menage','gardien'],
  sante:['pharmacie','clinique','hopital','medecin','consultation','medicament','analyse','labo','dentiste'],
  education:['ecole','scolarite','frais scolaires','universite','livre','fourniture','inscription','cours'],
  loisirs:['restaurant','resto','bar','sortie','cinema','boite','match','concert','biere','glace'],
  vetements:['habit','chaussure','pagne','tailleur','vetement','robe','chemise','pantalon'],
  famille:['famille','maman','papa','deuil','mariage','bapteme','don','eglise','offrande','dime','anniversaire']
};
function guessCategory(note){
  const n=norm(note);if(n.length<3)return null;
  const words=n.split(/[^a-z0-9+]+/).filter(w=>w.length>2), score={};
  for(const [c,ks] of Object.entries(KEYWORDS))for(const k of ks)if(n.includes(k))score[c]=(score[c]||0)+3;
  for(const [c,ks] of Object.entries(CUSTOM_WORDS))for(const k of ks)if(n.includes(k))score[c]=(score[c]||0)+4;
  for(const e of expenses()){if(!e.note||e.recurring_id)continue;const en=norm(e.note);for(const w of words)if(en.includes(w)){score[e.category]=(score[e.category]||0)+2;break}}
  const best=Object.entries(score).filter(([c])=>CAT[c]&&!CAT[c].archived&&c!=='frais').sort((a,b)=>b[1]-a[1])[0];
  return best?best[0]:null;
}
// Lecture d'un SMS de transaction MTN Mobile Money ou Airtel Money : montant, frais, date, opérateur, sens
// Formats couverts (Congo) : « Vous avez envoye 1552 FCFA a … le 2026-10-03 », « Vous avez retire 11000 XAF … Frais: 385XAF »,
// « Vous avez paye 320 FCFA pour leap », « Vous avez recu 500 XAF de … », « Trans.ID:CI260812… Vous avez recu 1500.00 CFA »,
// « Ref: MP260812… Paiement de CFA 1500.00 a DATABUNDLE … Frais: CFA 0.00 ».
function parseSMS(text){
  const t=String(text||'').replace(/ | /g,' ').replace(/[ \t]+/g,' ');
  if(!t.trim())return null;
  // « 1 500.00 », « 1500,5 », « 15.500 » : décimales ignorées, séparateurs de milliers retirés
  const amt=x=>{x=String(x).trim().replace(/[.,]\d{1,2}$/,'');return parseInt(x.replace(/\D/g,''),10)||0};
  const CUR='(?:f\\s?cfa|fcfa|xaf|cfa|frs?)', NUM='(\\d{1,3}(?:[ .,]\\d{3})+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)';
  const money=[];
  for(const m of t.matchAll(new RegExp(NUM+'\\s*'+CUR+'\\b','gi')))money.push({v:amt(m[1]),i:m.index});
  for(const m of t.matchAll(new RegExp('\\b'+CUR+'\\s*'+NUM,'gi')))money.push({v:amt(m[1]),i:m.index});
  money.sort((a,b)=>a.i-b.i);
  const ctx=i=>norm(t.slice(Math.max(0,i-24),i));
  const feeM=t.match(new RegExp('(?:frais|fees?|commission|charges?)\\s*(?:de|:|=)?\\s*(?:'+CUR+'\\s*)?'+NUM,'i'));
  const fee=feeM?amt(feeM[1]):0;
  const cand=money.filter(m=>!/solde|balance|nouveau|disponible|actuel|frais|fee|commission|charge/.test(ctx(m.i)));
  let amount=cand.length?cand[0].v:0;
  if(!amount){const m=t.match(new RegExp('(?:montant|amount|somme)\\s*(?:de|:|=)?\\s*'+NUM,'i'));if(m)amount=amt(m[1])}
  // Date : 2026-10-03, 03/10/2026, ou référence Airtel « CI260812 » / « MP260812 » (AAMMJJ)
  let date=null;
  const d2=t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/), d1=t.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/), d3=t.match(/\b(?:CI|MP|CO|PP)(\d{2})(\d{2})(\d{2})\.\d{4}/i);
  if(d2)date=`${d2[1]}-${d2[2]}-${d2[3]}`;
  else if(d1){const y=d1[3].length===2?'20'+d1[3]:d1[3];date=`${y}-${pad(+d1[2])}-${pad(+d1[1])}`}
  else if(d3)date=`20${d3[1]}-${d3[2]}-${d3[3]}`;
  if(date){const dd=parseISO(date);if(isNaN(dd)||dd.getMonth()+1!==+date.slice(5,7)||date>isoOf(new Date(Date.now()+864e5)))date=null}
  const n=norm(t);
  // Airtel : nommé, ou reconnaissable à ses références (Trans.ID:CI…, Ref: MP…) et au « CFA » placé avant le montant
  const op=/airtel|trans\.?\s?id\s*:\s*ci\d|ref\s*:\s*mp\d|solde actuel|\bcfa \d/.test(n)?'airtel':'mtn';
  const kind=/retrait|withdraw|cash ?out|retire/.test(n)?'withdraw':/re[cç]u|received|credite|depot|cash ?in|transfert entrant/.test(n)&&!/envoy|paiement|paye|achat|sent/.test(n)?'income':'expense';
  let who=null;
  const pay=t.match(/\bpour\s+([^.\n]{2,40}?)\s*\./i);
  const STOP=/^(MTN|Airtel|Mobile|Money|F?CFA|XAF|Frs?|Pour|Frais|Solde|Ref|Trans)$/i;
  let w=null;
  for(const m of t.matchAll(/(?:\bà|\ba|\bto|\bchez|\bvers|\bde|\bfrom|\bpar)\s+([A-Z][A-Za-zÀ-ÿ'.-]+(?:\s+[A-Z][A-Za-zÀ-ÿ'.-]+){0,4})/g)){
    const name=m[1].replace(/\s+/g,' ').replace(/\s+(Pour|Frais|Solde)$/i,'').replace(/[.'-]+$/,'');
    if(!STOP.test(name.split(' ')[0])){w=name;break}
  }
  const okPay=pay&&!/promo|\d{4,}|frais/i.test(pay[1]);
  if(kind==='expense'&&okPay)who=pay[1].trim();
  else if(w)who=w.slice(0,40);
  return amount>0?{amount,fee,date,op,kind,who}:null;
}
function nextDate(day,fromISO){const f=parseISO(fromISO);let d=new Date(f.getFullYear(),f.getMonth(),Math.min(day,daysIn(ymOf(f))));if(isoOf(d)<fromISO){const n=new Date(f.getFullYear(),f.getMonth()+1,1);d=new Date(n.getFullYear(),n.getMonth(),Math.min(day,daysIn(ymOf(n))))}return isoOf(d)}
function upcoming(days=10){
  const t=todayISO(), lim=isoOf(new Date(Date.now()+days*864e5)), out=[];
  for(const r of Object.values(D.recurring)){if(!r.active)continue;for(const o of recDueList(r,lim))out.push({date:o.date,label:r.label,amount:recAmt(r,o.date)+(r.fee||0),kind:'Récurrente',icon:'repeat',late:o.date<t})}
  for(const p of plans()){if(p.active===false)continue;const s=planStats(p);
    if((p.type==='loan'||p.type==='debt')&&s.left>0&&s.due&&s.due<=lim)out.push({date:s.due,label:(p.type==='loan'?'Remboursement attendu : ':'Dette à rembourser : ')+p.name,amount:s.left,kind:p.type==='loan'?'Créance':'Dette',icon:'hand',late:s.due<t});
    if(p.type==='tontine'){const dd=p.data||{};if(s.end<t)continue;
      if(dd.frequency==='hebdomadaire'){let d=parseISO(dd.start||t);while(isoOf(d)<t)d=new Date(d.getTime()+7*864e5);if(isoOf(d)<=lim)out.push({date:isoOf(d),label:'Cotisation '+p.name,amount:p.amount,kind:'Tontine',icon:'users'})}
      else{const d=nextDate(parseISO(dd.start||t).getDate(),t);if(d<=lim&&d>=(dd.start||t))out.push({date:d,label:'Cotisation '+p.name,amount:p.amount,kind:'Tontine',icon:'users'})}
      if(s.receive>=t&&s.receive<=lim&&s.received<s.pot)out.push({date:s.receive,label:'Réception '+p.name,amount:s.pot,kind:'Tontine',icon:'users',plus:true})}
    if(p.type==='project'&&s.due&&s.due>=t&&s.due<=lim&&s.ratio<1)out.push({date:s.due,label:'Échéance du projet '+p.name,amount:Math.max(0,s.target-s.saved),kind:'Projet',icon:'flag'})}
  return out.sort((a,b)=>a.date<b.date?-1:1);
}
function buildICS(){
  const esc2=x=>String(x).replace(/[\\;,]/g,m=>'\\'+m).replace(/[\r\n]+/g,' ');
  const dt=iso=>iso.replace(/-/g,''), stamp=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z', ev=[];
  const add=(uid,date,title,desc,rule)=>ev.push(['BEGIN:VEVENT',`UID:${uid}@carnet-depenses`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${dt(date)}`,`SUMMARY:${esc2(title)}`,`DESCRIPTION:${esc2(desc)}`,rule?`RRULE:${rule}`:null,'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${esc2(title)}`,'TRIGGER:-PT15H','END:VALARM','END:VEVENT'].filter(Boolean).join('\r\n'));
  for(const r of Object.values(D.recurring))if(r.active){const nx=subNext(r), per=subPer(r);add('rec-'+r.id,nx?nx.date:nextDate(r.day,todayISO()),r.label+' : '+fmtNR(recAmt(r)+(r.fee||0))+' FCFA',per>1||subM(r.id)?'Abonnement du Carnet de dépenses':'Dépense récurrente du Carnet de dépenses',`FREQ=MONTHLY;${per>1?'INTERVAL='+per+';':''}BYMONTHDAY=${Math.min(r.day,28)}`)}
  for(const p of plans()){if(p.active===false)continue;const s=planStats(p);
    if((p.type==='loan'||p.type==='debt')&&s.left>0&&s.due)add('plan-'+p.id,s.due,(p.type==='loan'?'Remboursement attendu de ':'Rembourser ')+p.name+' : '+fmtNR(s.left)+' FCFA','Échéance du Carnet de dépenses');
    if(p.type==='tontine'){const d=p.data||{};add('ton-'+p.id,d.start||todayISO(),'Cotisation '+p.name+' : '+fmtNR(p.amount)+' FCFA','Tontine',`FREQ=${d.frequency==='hebdomadaire'?'WEEKLY':'MONTHLY'};COUNT=${d.members||1}`);
      add('tonr-'+p.id,s.receive,'Réception tontine '+p.name+' : '+fmtNR(s.pot)+' FCFA','Ton tour dans la tontine')}
    if(p.type==='project'&&s.due)add('proj-'+p.id,s.due,'Échéance du projet '+p.name,'Projet d\'épargne')}
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Carnet de depenses//FR','CALSCALE:GREGORIAN','X-WR-CALNAME:Carnet de dépenses',...ev,'END:VCALENDAR'].join('\r\n');
}
const assets=()=>Array.isArray((D.settings.opening||{}).__biens)?D.settings.opening.__biens:[];
function netWorth(){
  const cash=sumBy(scopedWallets(),([w])=>balance(w)), goods=sumBy(assets(),a=>a.value||0);
  const claims=sumBy(plans('loan').filter(p=>p.active!==false),p=>planStats(p).left), debts=sumBy(plans('debt').filter(p=>p.active!==false),p=>planStats(p).left);
  return {cash,goods,claims,debts,net:cash+goods+claims-debts};
}
function toAllocate(m){
  const R=incomeIn(m);if(!R)return null;
  const bud=sumBy(Object.values(D.budgets),v=>v||0), goal=savingsGoal(m), eng=commitments(m), proj=sumBy(plans('project').filter(p=>p.active!==false),p=>planStats(p).monthly);
  return {R,bud,goal,eng,proj,rest:R-bud-goal-eng-proj};
}
const discreet=()=>LS.get('cd2-discreet',false);
function applyDiscreet(){HIDE=discreet();document.documentElement.classList.toggle('discreet',HIDE)}

/* ---------- Graphiques SVG ---------- */
function barsChart(labels,series,opts={}){
  // series: [{name,color,values}] ; barres groupées ou empilées
  const W=340,H=180,pl=4,pr=4,pt=16,pb=20, n=labels.length, stacked=opts.stacked;
  const tot=labels.map((_,i)=>stacked?sumBy(series,s=>Math.max(0,s.values[i])):Math.max(...series.map(s=>Math.abs(s.values[i]))));
  const max=Math.max(...tot,1), slot=(W-pl-pr)/n, bw=stacked?slot*.56:slot*.72/series.length, y=v=>pt+(H-pt-pb)*(1-v/max);
  let g='';for(let k=1;k<=3;k++){const yy=pt+(H-pt-pb)*k/4;g+=`<line class="gl" x1="0" x2="${W}" y1="${yy}" y2="${yy}"/>`}
  let b='';
  labels.forEach((lab,i)=>{
    const x0=pl+slot*i+(slot-(stacked?bw:bw*series.length))/2;
    if(stacked){let acc=0;series.forEach(s=>{const v=Math.max(0,s.values[i]);if(!v)return;const y1=y(acc+v),y2=y(acc);b+=`<rect x="${x0}" y="${y1}" width="${bw}" height="${Math.max(y2-y1,0)}" fill="${s.color}"><title>${esc(s.name)} : ${fmt(v)}</title></rect>`;acc+=v})}
    else series.forEach((s,j)=>{const v=Math.max(0,s.values[i]);b+=`<rect x="${x0+j*bw}" y="${y(v)}" width="${bw-2}" height="${Math.max(H-pb-y(v),0)}" rx="3" fill="${s.color}"><title>${esc(s.name)} : ${fmt(v)}</title></rect>`});
    b+=`<text class="ax ${opts.cur===i?'cur':''}" x="${pl+slot*i+slot/2}" y="${H-6}" text-anchor="middle">${esc(lab)}</text>`;
    if(opts.top)b+=`<text class="ax ${opts.cur===i?'cur':''}" x="${pl+slot*i+slot/2}" y="${y(tot[i])-4}" text-anchor="middle">${tot[i]?shortN(opts.top[i]??tot[i]):''}</text>`;
  });
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label||'Graphique')}">${g}<line class="base" x1="0" x2="${W}" y1="${H-pb}" y2="${H-pb}"/>${b}</svg></div>`;
}
function lineChart(xs,series,opts={}){
  const W=340,H=170,pl=4,pr=40,pt=12,pb=20, all=series.flatMap(s=>s.values.filter(v=>v!=null));
  const max=Math.max(...all,1), n=xs.length, x=i=>pl+(W-pl-pr)*(n>1?i/(n-1):0), y=v=>pt+(H-pt-pb)*(1-v/max);
  let g='';for(let k=0;k<=3;k++){const v=max*k/3, yy=y(v);g+=`<line class="gl" x1="0" x2="${W-pr+4}" y1="${yy}" y2="${yy}"/><text class="ax" x="${W}" y="${yy+3}" text-anchor="end">${shortN(v)}</text>`}
  let p='';
  series.forEach(s=>{const pts=s.values.map((v,i)=>v==null?null:[x(i),y(v)]).filter(Boolean);if(!pts.length)return;
    p+=`<polyline fill="none" stroke="${s.color}" stroke-width="${s.width||2.5}" ${s.dash?'stroke-dasharray="5 4"':''} stroke-linejoin="round" stroke-linecap="round" points="${pts.map(q=>q.join(',')).join(' ')}"/>`;
    const l=pts[pts.length-1];p+=`<circle cx="${l[0]}" cy="${l[1]}" r="3.5" fill="${s.color}"/>`});
  const ticks=opts.ticks||xs.map((_,i)=>i);
  const t=ticks.map(i=>`<text class="ax" x="${x(i)}" y="${H-6}" text-anchor="middle">${esc(xs[i])}</text>`).join('');
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label||'Graphique')}">${g}<line class="base" x1="0" x2="${W-pr+4}" y1="${H-pb}" y2="${H-pb}"/>${p}${t}</svg></div>`;
}
const keys=list=>`<div class="keys">${list.map(([n,c])=>`<span><i style="background:${c}"></i>${esc(n)}</span>`).join('')}</div>`;

/* ---------- Rendu ---------- */
// Mois en cours : la date du jour en toutes lettres ; autre mois : mois et année (toucher pour revenir à aujourd'hui)
const capFirst=x=>x.charAt(0).toUpperCase()+x.slice(1);
const headLabel=()=>capFirst(S.month===curM()?new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):mLong(S.month));
const TABS=[['dash','Accueil','home'],['list','Dépenses','list'],['accounts','Comptes','wallet'],['plan','Plan','target'],['analyse','Analyse','chart']];
function render(){
  if($('app').hidden)return;
  if(rebuildWallets())refreshWalletChips();
  if(rebuildCats())refreshCatChips();
  normalizeData();
  const mlab=$('monthLabel'), isNow=S.month===curM();
  mlab.textContent=headLabel();mlab.classList.toggle('back',!isNow);
  if(isNow)mlab.removeAttribute('title');else mlab.title='Revenir à aujourd\'hui';
  const sbar=$('scopeBar');
  if(hasPro()){sbar.hidden=false;sbar.innerHTML=['all','perso','pro'].map(k=>`<button type="button" data-scope="${k}" aria-pressed="${scopeOn()===k}">${SCOPE_LABEL[k]}</button>`).join('')}else sbar.hidden=true;
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===S.tab?'page':'false'));
  const views={dash:renderDash,list:renderList,accounts:renderAccounts,plan:renderPlan,analyse:renderAnalyse,settings:renderSettings};
  let top='';
  if(!sb)top+=msg('info','Mode hors ligne','Tes saisies sont gardées sur ce téléphone et partiront dès que le serveur sera joignable.');
  if(schemaOld)top+=msg('warning','Mise à jour de la base nécessaire','Exécute les scripts <b>supabase/migration-2.1.sql</b> puis <b>migration-2.6.sql</b> dans Supabase. Tes saisies restent en attente sur ce téléphone, rien n\'est perdu.');
  top+=rejectedBlock();
  $('main').innerHTML=top+(views[S.tab]||renderDash)();
  if(S.tab==='settings'&&bkList===null)loadBackups();
  updateSync();
}

/* ---------- Accueil allégé : argent disponible, utilisable par jour, prochaine échéance ---------- */
const eyeBtn=()=>`<button type="button" class="eye" data-act="toggleDiscreet">${ic(discreet()?'eye':'eyeoff','s16')}${discreet()?'Afficher':'Masquer'}</button>`;
const cfgHz=()=>{const h=(D.settings.opening||{}).__hz;return h==='pay'||h==='month'?h:''};
// Épargne mise de côté dans le mois : versements vers le portefeuille Épargne (transferts et projets), moins les retraits
function savedAside(m){
  if(!WAL.epargne||!inScope(!!WAL.epargne.pro))return 0;
  const mv=monthMoves(m).filter(x=>x.kind==='transfer'||x.kind==='project');
  return sumBy(mv.filter(x=>x.to_wallet==='epargne'),x=>x.amount)-sumBy(mv.filter(x=>x.from_wallet==='epargne'),x=>x.amount+(x.fee||0))+sumBy(monthInc(m).filter(e=>e.wallet==='epargne'),e=>e.amount);
}
// Un seul budget quotidien, avec un horizon au choix : prochaine paie ou fin du mois
function horizon(){
  const P=payInfo(), cm=curM();
  const month={kind:'month',n:daysIn(cm)-new Date().getDate()+1,label:'jusqu\'à la fin du mois',short:'Fin du mois',end:cm+'-'+pad(daysIn(cm))};
  const pay=P&&!P.late&&P.wait>0?{kind:'pay',n:P.wait,label:'jusqu\'à ta prochaine paie',short:'Prochaine paie',end:P.next}:null;
  const pref=cfgHz()||(pay?'pay':'month');
  return {cur:pref==='pay'&&pay?pay:month,pay,month,late:!!(P&&P.late),hasDay:!!P};
}
// Prochaine sortie d'argent connue (charge à payer, tontine, dette, projet) sur 30 jours, les retards d'abord
function setHz(k){if(k!=='pay'&&k!=='month')return;mutate([settingsRow({opening:Object.assign({},D.settings.opening,{__hz:k})})]);toast(k==='pay'?'Budget du jour calculé jusqu\'à ta prochaine paie':'Budget du jour calculé jusqu\'à la fin du mois')}
function nextDue(){
  const t=todayISO(), end=addDays(t,30), list=[];
  for(const r of Object.values(D.recurring)){if(!r.active||!recInScope(r))continue;for(const o of recDueList(r,end))list.push({label:r.label,date:o.date,amount:recAmt(r,o.date)+(r.fee||0),late:o.date<t?daysBetween(o.date,t):0})}
  for(const u of upcoming(30))if(!u.plus&&u.kind!=='Récurrente'&&u.kind!=='Créance')list.push({label:u.label,date:u.date,amount:u.amount,late:u.date<t?daysBetween(u.date,t):0});
  list.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:b.amount-a.amount);
  return list[0]||null;
}
function heroNow(){
  const set=!!(D.settings.opening_date||incomes().length), sc=scopeOn()!=='all'?' · '+SCOPE_LABEL[scopeOn()].toLowerCase():'';
  if(!set)return `<section class="block hero" id="hero"><div class="block-head"><p class="over">Argent disponible${esc(sc)}</p>${eyeBtn()}</div><div class="big num">-</div><p class="sub">Indique ce que tu as en poche et sur tes comptes. Le carnet en déduit ce que tu peux dépenser chaque jour.</p><div class="actions"><button type="button" class="btn-primary sm" data-act="startOnb">Renseigner mes soldes</button></div></section>`;
  const H=horizon(), sel=H.cur, t=todayISO(), cash=liquid(), plan=committed(sel.n), rate=dailyRate(), nd=nextDue();
  // Dépensé aujourd'hui hors charges récurrentes (elles sont déjà dans les sorties prévues) : le budget du jour reste stable dans la journée
  const vt=sumBy(expenses().filter(e=>e.date===t&&!e.recurring_id&&inScope(isProExp(e))),spend);
  const raw=(cash+vt-plan)/sel.n, budget=Math.max(0,raw), left=budget-vt;
  const note=H.pay?'':H.late?'Ton salaire est en retard : le calcul va jusqu\'à la fin du mois.':H.hasDay?'':'<button type="button" class="linkbtn" data-tab="settings">Indique ton jour de paie pour calculer jusqu\'à la prochaine paie</button>';
  const ndWhen=nd?(nd.late?'en retard de '+nd.late+' jour'+(nd.late>1?'s':''):nd.date===t?'aujourd\'hui':(daysBetween(t,nd.date)===1?'demain':'dans '+daysBetween(t,nd.date)+' jours')+' · '+dShort(nd.date)):'';
  const ndHtml=nd?`<div class="nd"><span class="t"><span>${esc(nd.label)}</span><span>${esc(ndWhen)}</span></span><b class="num">${fmt(nd.amount)}</b></div>`:'<p class="sub">Aucune sortie prévue sur les 30 prochains jours.</p>';
  const head=`<div class="block-head"><p class="over">Argent disponible${esc(sc)}</p>${eyeBtn()}</div>
    <div class="big num" id="hero-cash">${fmtN(cash)} <small>FCFA</small></div>
    <div class="sub"><span>Espèces, Mobile Money et banque, sans l'épargne</span></div>`;
  let h;
  if(cash<=0){
    h=`<section class="block hero" id="hero">${head}
      <div class="hz"><p class="over">Budget du jour</p><p class="sub">D'après le carnet, le solde de tes portefeuilles est nul ou négatif : impossible de calculer un budget. Si ce n'est pas le cas, mets tes soldes à jour dans Comptes.</p>
        <div class="actions"><button type="button" class="btn-primary sm" data-tab="accounts">Ouvrir Comptes</button></div></div>
      <div class="hz"><p class="over">Prochaine sortie prévue</p>${ndHtml}</div></section>`;
  }else{
    const over=left<0, pct=budget>0?Math.min(vt/budget,1)*100:(vt>0?100:0);
    const today=vt>0?`<div class="bar" aria-hidden="true"><div style="width:${pct.toFixed(0)}%;${over?'background:var(--orange)':''}"></div></div>
      <p class="sub num" id="hero-today"><span>Aujourd'hui : <b>${fmt(vt)}</b> dépensés, ${over?'<b class="accent">'+fmt(-left)+' de plus que ton budget</b>':'il reste <b>'+fmt(left)+'</b>'}.</span></p>`
      :`<p class="sub" id="hero-today">Rien dépensé aujourd'hui.</p>`;
    h=`<section class="block hero" id="hero">${head}
      <div class="hz"><p class="over">Budget du jour</p>
        <div class="big2 num" id="hero-day">${fmtN(budget)} <small>FCFA par jour</small></div>
        ${today}
        <p class="sub">À ne pas dépasser pour tenir ${esc(sel.label)}, le ${esc(dShort(sel.end))} (${sel.n} jour${sel.n>1?'s':''}).</p>
        ${note?`<p class="sub">${note}</p>`:''}
        <details class="calc" data-keep="calcopen" ${S.calcopen?'open':''}><summary>Comment c'est calculé ?</summary>
          <div class="calcl num" id="hero-calc"><span>Argent disponible ce matin</span><b>${fmt(cash+vt)}</b><span>Sorties déjà prévues (charges à payer, tontines, dettes)</span><b>− ${fmt(plan)}</b><span>À répartir sur ${sel.n} jour${sel.n>1?'s':''}</span><b>${fmt(budget)} par jour</b>${rate>0?`<span>Ton rythme actuel</span><b>${fmt(rate)} par jour</b>`:''}</div><p class="sub">Période : ${esc(sel.label)}. <button type="button" class="linkbtn" data-tab="settings">Changer dans Réglages</button></p></details></div>
      <div class="hz"><p class="over">Prochaine sortie prévue</p>${ndHtml}</div></section>`;
    if(raw<=0)h+=msg('danger','Sorties prévues supérieures à ton argent',`Tes charges à payer, tontines et dettes d'ici ${sel.n} jour${sel.n>1?'s':''} (${fmt(plan)}) dépassent ton argent disponible (${fmt(cash+vt)}).`);
    else if(rate>0&&budget<rate*.7)h+=msg('warning','Rythme trop rapide pour cette période',`Tu dépenses en moyenne ${fmt(rate)} par jour. Pour tenir ${sel.label}, limite-toi à ${fmt(budget)}.`);
  }
  return h;
}
function heroPast(m){
  const inc=incomeIn(m), spent=spentIn(m), name=mName(m), sa=savedAside(m);
  return `<section class="block hero" id="hero"><div class="block-head"><p class="over">${inc?'Excédent de '+esc(name):'Dépensé en '+esc(name)}</p>${eyeBtn()}</div><div class="big num">${inc?fmtS(inc-spent):fmtN(spent)+' <small>FCFA</small>'}</div>
    <div class="sub num"><span>Entrées <b>${fmt(inc)}</b></span><span>Dépensé <b>${fmt(spent)}</b></span><span>Mis de côté <b>${fmt(sa)}</b></span></div></section>`;
}
const scopeNote=()=>scopeOn()==='all'?'':`<p class="hint" id="scope-note">Vue ${esc(SCOPE_LABEL[scopeOn()])} : seuls les comptes, catégories et opérations marqués ${scopeOn()==='pro'?'Pro':'Perso (non Pro)'} sont comptés. Tes soldes réels ne changent pas.</p>`;

/* ---------- Saisies rapides (favoris) ---------- */
function favCandidates(){
  const t=todayISO(), from=addDays(t,-60), g=new Map();
  for(const e of expenses()){
    if(e.date<from||e.date>t||e.recurring_id||!CAT[e.category]||CAT[e.category].archived||!WAL[e.method]||WAL[e.method].archived||!inScope(isProExp(e)))continue;
    const nk=norm(e.note||'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim().slice(0,30), key=e.category+'|'+e.method+'|'+nk;
    if(!g.has(key))g.set(key,[]);g.get(key).push(e);
  }
  const out=[];
  for(const [key,l] of g){
    if(l.length<3)continue;
    l.sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:0);
    const last=l.slice(0,5), c=l[0], lab=(c.note||CAT[c.category].label).slice(0,22);
    out.push({key,count:l.length,recent:c.date,amount:Math.round(median(last.map(e=>e.amount))),fee:Math.round(median(last.map(e=>e.fee||0))),category:c.category,method:c.method,note:(c.note||'').slice(0,60),label:lab.charAt(0).toUpperCase()+lab.slice(1)});
  }
  return out.sort((a,b)=>b.count-a.count||(a.recent<b.recent?1:-1));
}
const favorites=()=>{const off=new Set(LS.get(K.favOff,[]));return favCandidates().filter(f=>!off.has(f.key)).slice(0,5)};
function favBlock(){
  const f=favorites();if(!f.length)return '';
  return `<section class="block" id="favs"><div class="block-head"><p class="over">Saisies rapides</p><small>une touche, annulable</small></div><div class="favs">${f.map(x=>`<button type="button" class="fav" data-fav="${esc(x.key)}"><span class="dot" style="background:${CAT[x.category]?.color||'#9AA8A1'}"></span><span class="fl">${esc(x.label)}</span><b class="num">${fmtN(x.amount)}</b></button>`).join('')}</div></section>`;
}
function addFav(key){
  const f=favCandidates().find(x=>x.key===key);if(!f)return;
  const now=nowISO(), row={id:newId(),amount:f.amount,date:todayISO(),note:f.note,category:f.category,method:f.method,fee:MOMO.has(f.method)?f.fee:0,nature:null,recurring_id:null,created_at:now,updated_at:now};
  const op={t:'expenses',op:'upsert',row};
  mutate([op]);toast(f.label+' ajouté : '+fmtRaw(f.amount),undoOps([op]));
}
function favFill(key){
  const f=favCandidates().find(x=>x.key===key);if(!f)return;
  $('f-amount').value=group(f.amount);radio('cat',f.category);radio('met',f.method);$('f-note').value=f.note;S.catTouched=true;
  if(!S.natTouched)radio('nat',NEED.has(f.category)?'besoin':'envie');
  $('f-fee').value=MOMO.has(f.method)&&f.fee?group(f.fee):'';updateMoveFields();
}
function favToggle(key){const off=new Set(LS.get(K.favOff,[]));if(off.has(key))off.delete(key);else off.add(key);LS.set(K.favOff,[...off].slice(-60));render()}
function renderFavSettings(){
  const all=favCandidates(), off=new Set(LS.get(K.favOff,[]));
  return `<section class="block"><p class="over">Saisies rapides</p><p class="hint">Les dépenses que tu répètes (au moins 3 fois en 60 jours) apparaissent sur l'accueil. Une touche les enregistre, avec un bouton Annuler juste après. Ton choix de masquer s'applique à cet appareil.</p>
    ${all.length?`<div class="rows">${all.slice(0,12).map(f=>`<div class="rowbtn" style="cursor:default"><span class="dot" style="background:${CAT[f.category]?.color||'#9AA8A1'}"></span><span class="t"><span>${esc(f.label)}</span><span>${esc(CAT[f.category]?.label)} · ${esc(WAL[f.method]?.label)} · ${f.count} fois</span></span><span style="display:flex;gap:6px;align-items:center"><b class="num">${fmt(f.amount)}</b><button type="button" class="pill ${off.has(f.key)?'':'success'}" data-fav-off="${esc(f.key)}">${off.has(f.key)?'Remettre':'Visible'}</button></span></div>`).join('')}</div>`:'<p class="hint">Aucune dépense répétée pour l\'instant.</p>'}</section>`;
}

/* ---------- Fenêtre de dialogue (vérification de solde, ajustements) ---------- */
function openDlg(html){$('dlg').innerHTML=html;$('dlgWrap').hidden=false;document.documentElement.classList.add('modal')}
function closeDlg(){S.chk=null;S.adjArm=null;S.subEdit=null;$('dlgWrap').hidden=true;$('dlg').innerHTML='';if($('sheetWrap').hidden&&$('onb').hidden)document.documentElement.classList.remove('modal')}
const CK_WHY=[['oubli','Dépense non notée','#04382A'],['entree','Entrée non notée','#04382A'],['frais','Frais non notés','#04382A'],['erreur','Erreur de saisie','#04382A'],['autre','Autre','#04382A']];
function openCheck(w){
  if(!WAL[w])return;S.chk={w};
  const last=((D.settings.opening||{}).__chk||{})[w];
  openDlg(`<div class="sheet-head"><h2>Vérifier mon solde</h2><button type="button" class="x" data-act="dlgClose" aria-label="Fermer">${ic('x')}</button></div>
    <p class="hint">${esc(WAL[w].label)} : le carnet indique <b class="num">${fmtRaw(balance(w))}</b>.${last?' Dernière vérification le '+esc(dFr(last))+'.':''} Compte ce que tu as vraiment (billets, solde affiché par MTN MoMo ou Airtel Money, solde de la banque) et indique-le ici.</p>
    <label class="amount"><input id="ck-real" data-money inputmode="numeric" autocomplete="off" placeholder="0" aria-label="Solde réel"><span>FCFA</span></label>
    <p class="hint" id="ck-diff" aria-live="polite"></p>
    <div id="ck-why" hidden><fieldset><legend>Motif de l'écart</legend><div class="chips">${chips('ckwhy',CK_WHY)}</div></fieldset>
      <label class="inp" style="margin-top:12px">Précision (facultatif)<input id="ck-note" maxlength="60" placeholder="Ex. taxi du 12"></label>
      <p class="hint" style="margin-top:8px">Le carnet enregistre un ajustement daté, avec ce motif. Il n'est pas compté comme une dépense et reste visible dans Mouvements.</p></div>
    <p class="err" id="ck-err" hidden></p>
    <div class="sheet-actions"><button type="button" class="btn" id="ck-exp" data-act="ckExpense" hidden>Noter comme dépense</button><button type="button" class="btn-primary" id="ck-save" data-act="ckSave">Enregistrer</button></div>`);
  setTimeout(()=>$('ck-real')&&$('ck-real').focus(),60);
}
function ckUpdate(){
  const w=S.chk&&S.chk.w;if(!w||!$('ck-real'))return;
  const raw=$('ck-real').value.trim(), diff=toInt(raw)-balance(w);
  $('ck-err').hidden=true;
  if(!raw){$('ck-diff').textContent='';$('ck-why').hidden=true;$('ck-exp').hidden=true;$('ck-save').textContent='Enregistrer';return}
  if(diff===0){$('ck-diff').textContent='Le carnet est juste.';$('ck-why').hidden=true;$('ck-exp').hidden=true;$('ck-save').textContent='Confirmer : solde juste'}
  else{$('ck-diff').textContent=`Écart de ${diff>0?'+':'−'} ${fmtRaw(Math.abs(diff))} : tu as ${diff>0?'plus':'moins'} que le carnet ne l'indique.`;$('ck-why').hidden=false;$('ck-exp').hidden=diff>0;$('ck-save').textContent='Corriger le carnet'}
}
function ckSave(){
  const w=S.chk&&S.chk.w;if(!w)return;
  const err=m=>{$('ck-err').textContent=m;$('ck-err').hidden=false}, raw=$('ck-real').value.trim();
  if(!raw)return err('Indique le solde réel.');
  const real=toInt(raw);if(real>999999999)return err('Montant trop grand.');
  const diff=real-balance(w), today=todayISO(), now=nowISO();
  const chk=Object.assign({},(D.settings.opening||{}).__chk,{[w]:today});
  const ops=[settingsRow({opening:Object.assign({},D.settings.opening,{__chk:chk})})];
  let row=null;
  if(diff!==0){
    const why=radioVal('ckwhy');if(!why)return err('Choisis le motif de l\'écart.');
    const lab=CK_WHY.find(x=>x[0]===why)[1].toLowerCase(), extra=$('ck-note').value.trim().slice(0,60);
    row={id:newId(),kind:'adjust',amount:Math.abs(diff),fee:0,date:today,from_wallet:diff<0?w:null,to_wallet:diff>0?w:null,ref_id:null,note:('Ajustement : '+lab+(extra?' · '+extra:'')).slice(0,120),created_at:now,updated_at:now};
    ops.unshift({t:'moves',op:'upsert',row});
  }
  closeDlg();mutate(ops);
  toast(diff===0?'Solde vérifié : le carnet est juste':'Solde corrigé : '+(diff>0?'+':'−')+' '+fmtRaw(Math.abs(diff)),row?undoOps([{t:'moves',op:'upsert',row}]):undefined);
}
function ckExpense(){
  const w=S.chk&&S.chk.w;if(!w)return;
  const diff=toInt($('ck-real').value)-balance(w);if(diff>=0)return;
  closeDlg();openSheet(null,'expense',{amount:-diff,method:w,note:'Écart constaté'});
}
function openAdjust(x){
  const w=x.to_wallet||x.from_wallet, arm=S.adjArm===x.id;
  openDlg(`<div class="sheet-head"><h2>Ajustement de solde</h2><button type="button" class="x" data-act="dlgClose" aria-label="Fermer">${ic('x')}</button></div>
    <div class="ref num"><span>Date</span><span class="v">${esc(dFr(x.date))}</span><span>Portefeuille</span><span class="v">${esc(WAL[w]?.label||'')}</span><span>Écart corrigé</span><span class="v">${x.to_wallet?'+':'−'} ${fmtRaw(x.amount)}</span><span>Motif</span><span class="v" style="white-space:normal">${esc((x.note||'').replace(/^Ajustement : /,''))}</span></div>
    <p class="hint">Cet ajustement a aligné le solde du carnet sur ton solde réel. Il n'est pas compté comme une dépense. ${arm?'<b style="color:var(--danger)">Le solde du portefeuille reviendra à sa valeur d\'avant la correction.</b>':''}</p>
    <div class="sheet-actions"><button type="button" class="${arm?'btn-danger':'btn'}" data-act="adjDel" data-id="${esc(x.id)}">${arm?'Confirmer la suppression':'Supprimer l\'ajustement'}</button><button type="button" class="btn-primary" data-act="dlgClose">Fermer</button></div>`);
  S.adjArm=arm?x.id:null;
}
function adjDel(id){
  const x=D.moves[id];if(!x)return closeDlg();
  if(S.adjArm!==id){S.adjArm=id;openAdjust(x);S.adjArm=id;return}
  closeDlg();mutate([{t:'moves',op:'delete',id}]);toast('Ajustement supprimé');
}

/* ---------- Démarrage guidé : soldes, revenus, charges fixes, première dépense ---------- */
const onbDone=()=>!!(((D.settings.opening||{}).__start)||{}).done;
const needsOnb=()=>lastSync>0&&!onbDone()&&!D.settings.opening_date&&!expenses().length&&!incomes().length&&!Object.keys(D.recurring).length&&LS.get(K.onbSnooze,'')<todayISO();
let onb=null;
function maybeOnboard(){if(onb||!needsOnb()||$('app').hidden||!$('sheetWrap').hidden||!$('dlgWrap').hidden)return;startOnb()}
function startOnb(){onb={step:D.settings.opening_date?2:1,min:D.settings.opening_date?2:1,w:{},day:String(payDay()||''),sal:0,sald:'',salw:'banque',rows:[{},{},{}],err:''};paintOnb()}
const dayErr=v=>{const d=toInt(v);return !(d>=1&&d<=28)};
function paintOnb(){
  const el=$('onb'), o=onb;
  if(!o){el.hidden=true;el.innerHTML='';if($('sheetWrap').hidden&&$('dlgWrap').hidden)document.documentElement.classList.remove('modal');return}
  el.hidden=false;document.documentElement.classList.add('modal');
  const maxD=addDays(D.settings.opening_date||todayISO(),-1), step=o.step;
  let body='', nextTxt='Continuer';
  if(step===1)body=`<h2>Ton argent aujourd'hui</h2><p class="hint">Indique ce que contient chaque portefeuille à l'instant. Laisse vide ou mets 0 s'il est vide. Le carnet part de ces chiffres.</p>
    ${WALLETS.map(([w,l])=>`<div class="form-row"><span>${esc(l)}</span><label class="field"><input class="r" id="ob-w-${esc(w)}" data-money inputmode="numeric" placeholder="0" value="${o.w[w]?group(o.w[w]):''}" aria-label="Solde ${esc(l)}"><span>FCFA</span></label></div>`).join('')}`;
  else if(step===2)body=`<h2>Ton revenu</h2><p class="hint">Le jour de paie permet de calculer ce que tu peux dépenser jusqu'à ta prochaine paie.</p>
    <div class="form-row"><span>Jour de paie habituel<span class="meta" style="display:block">de 1 à 28, vide si irrégulier</span></span><label class="field"><input class="r" id="ob-day" inputmode="numeric" maxlength="2" value="${esc(o.day)}" placeholder="-" aria-label="Jour de paie"><span>du mois</span></label></div>
    <p class="over" style="margin-top:8px">Dernier salaire reçu (facultatif)</p>
    <div class="grid2"><label class="inp">Montant (FCFA)<input id="ob-sal" data-money inputmode="numeric" placeholder="0" value="${o.sal?group(o.sal):''}"></label><label class="inp">Reçu le<input type="date" id="ob-sal-d" max="${maxD}" value="${esc(o.sald)}"></label></div>
    <label class="inp">Reçu sur<select id="ob-sal-w">${WALLETS.filter(w=>w[0]!=='epargne').map(([w,l])=>`<option value="${esc(w)}" ${o.salw===w?'selected':''}>${esc(l)}</option>`).join('')}</select></label>
    <p class="hint">Choisis une date avant aujourd'hui : ce salaire est déjà compris dans l'argent indiqué à l'étape précédente.</p>`;
  else if(step===3)body=`<h2>Tes charges fixes</h2><p class="hint">Loyer, électricité, internet, abonnements : le carnet te rappelle de les payer et réserve la somme. Trois au plus ici, les autres plus tard dans Réglages. Tu peux passer cette étape.</p>
    ${[0,1,2].map(i=>{const r=o.rows[i]||{};return `<div class="add"><div class="grid2"><label class="inp">Libellé<input id="ob-rl-${i}" maxlength="60" placeholder="${['Loyer','Électricité','Internet'][i]}" value="${esc(r.label||'')}"></label><label class="inp">Montant (FCFA)<input id="ob-ra-${i}" data-money inputmode="numeric" placeholder="0" value="${r.amount?group(r.amount):''}"></label></div>
      <div class="grid2"><label class="inp">Jour du mois (1 à 28)<input id="ob-rd-${i}" inputmode="numeric" maxlength="2" placeholder="5" value="${esc(r.day||'')}"></label><label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="ob-rp-${i}" ${r.paid?'checked':''}> Déjà payé ce mois-ci</label></div></div>`}).join('')}`;
  else{body=`<h2>Tout est prêt</h2><p class="hint">Le plus important maintenant : note ta première dépense. Chaque dépense notée rend les calculs plus justes.</p><div class="actions"><button type="button" class="btn-primary" data-act="onbFirst">Noter ma première dépense</button></div>`;nextTxt='Terminer'}
  el.innerHTML=`<div class="onb-card" role="dialog" aria-modal="true" aria-label="Démarrage guidé"><div class="onb-top"><span class="over">${step<=3?'Étape '+step+' sur 3':'Démarrage guidé'}</span><div class="onb-dots">${[1,2,3,4].map(i=>`<i class="${i<=step?'on':''}"></i>`).join('')}</div></div>
    ${body}<p class="err" id="ob-err" ${o.err?'':'hidden'}>${esc(o.err)}</p>
    <div class="sheet-actions">${step>o.min&&step<4?`<button type="button" class="btn" data-act="onbBack">Retour</button>`:''}<button type="button" class="btn-primary" data-act="onbNext">${nextTxt}</button></div>
    <div class="row-between" style="justify-content:center;gap:20px"><button type="button" class="linkbtn" data-act="onbLater">Plus tard</button><button type="button" class="linkbtn" data-act="onbSkip">Passer le guide</button></div></div>`;
  el.scrollTop=0;
}
function onbRead(){
  const o=onb;if(!o)return;
  if(o.step===1){o.w={};WALLETS.forEach(([w])=>{const e=$('ob-w-'+w);o.w[w]=e?toInt(e.value):0})}
  else if(o.step===2){o.day=$('ob-day').value.trim();o.sal=toInt($('ob-sal').value);o.sald=$('ob-sal-d').value;o.salw=$('ob-sal-w').value}
  else if(o.step===3)o.rows=[0,1,2].map(i=>({label:$('ob-rl-'+i).value.trim().slice(0,60),amount:toInt($('ob-ra-'+i).value),day:$('ob-rd-'+i).value.trim(),paid:$('ob-rp-'+i).checked}));
}
function onbErr(m){onb.err=m;const e=$('ob-err');if(e){e.textContent=m;e.hidden=false}}
function onbNext(){
  const o=onb;if(!o)return;onbRead();o.err='';const now=nowISO();
  if(o.step===1){
    const op=Object.assign({},D.settings.opening);WALLETS.forEach(([w])=>{if(o.w[w]>0)op[w]=o.w[w];else delete op[w]});
    mutate([settingsRow({opening:op,opening_date:todayISO()})]);o.step=2;
  }else if(o.step===2){
    if(o.day&&dayErr(o.day))return onbErr('Choisis un jour entre 1 et 28, ou laisse vide.');
    const ops=[];
    if(o.sal>0){
      if(!o.sald)return onbErr('Indique la date de réception du salaire, ou retire le montant.');
      if(o.sald>addDays(D.settings.opening_date||todayISO(),-1))return onbErr('Le salaire doit dater d\'avant aujourd\'hui, sinon il serait compté deux fois.');
      ops.push({t:'incomes',op:'upsert',row:{id:newId(),amount:o.sal,date:o.sald,note:'Salaire',source:'salaire',wallet:WAL[o.salw]?o.salw:'banque',created_at:now,updated_at:now}});
    }
    if(o.day){const op=Object.assign({},D.settings.opening);op.__cycle={day:toInt(o.day)};ops.push(settingsRow({opening:op}))}
    if(ops.length)mutate(ops);o.step=3;
  }else if(o.step===3){
    const ops=[], method=lastMet();
    for(const r of o.rows){
      if(!r.label&&!r.amount&&!r.day)continue;
      if(!r.label||!(r.amount>0)||dayErr(r.day))return onbErr('Pour chaque charge, indique un libellé, un montant et un jour entre 1 et 28.');
      ops.push({t:'recurring',op:'upsert',row:{id:newId(),label:r.label,amount:r.amount,fee:0,category:guessCategory(r.label)||'autres',method,day:toInt(r.day),last_month:r.paid?curM():shiftM(curM(),-1),active:true,created_at:now,updated_at:now}});
    }
    if(ops.length)mutate(ops);o.step=4;
  }else{
    const op=Object.assign({},D.settings.opening,{__start:{done:true}});
    mutate([settingsRow({opening:op})]);onb=null;paintOnb();toast('Démarrage terminé');return;
  }
  paintOnb();
}
function onbBack(){if(!onb)return;onbRead();onb.err='';onb.step=Math.max(onb.min,onb.step-1);paintOnb()}
function onbLater(){LS.set(K.onbSnooze,todayISO());onb=null;paintOnb()}
function onbSkip(){const op=Object.assign({},D.settings.opening,{__start:{done:true}});onb=null;paintOnb();mutate([settingsRow({opening:op})]);toast('Guide ignoré. Tu peux tout régler dans Comptes et Réglages.')}
function onbFirst(){
  const op=Object.assign({},D.settings.opening,{__start:{done:true}});
  onb=null;paintOnb();mutate([settingsRow({opening:op})]);openSheet(null,'expense',{coach:true});
}

function renderDash(){
  const m=S.month, items=monthItems(m), spent=sumBy(items,spend), inc=incomeIn(m), name=mName(m), isCur=m===curM();
  let h=scopeNote();
  h+=isCur?heroNow():heroPast(m);
  if(isCur)h+=favBlock()+dueBlock()+subsAlertBlock();
  const cats=byCat(items);
  const al=Object.entries(D.budgets).filter(([c,b])=>b>0&&(cats[c]||0)/b>=.8).map(([c,b])=>({c,b,s:cats[c]||0}));
  const over=al.filter(a=>a.s>a.b), near=al.filter(a=>a.s<=a.b);
  if(over.length)h+=msg('danger','Budget dépassé',over.map(a=>`${esc(CAT[a.c]?.label||a.c)} : ${fmt(a.s)} sur ${fmt(a.b)}`).join('<br>'));
  if(near.length)h+=msg('warning','Budget presque atteint',near.map(a=>`${esc(CAT[a.c]?.label||a.c)} : ${a.s>=a.b?'budget atteint':'reste '+fmt(a.b-a.s)}`).join('<br>'));
  for(const a of alertsDue())h+=msg(a.tone,a.title,a.body);
  const un=unusual(m);
  if(un.length)h+=msg('info','Dépense inhabituelle',un.map(u=>`${esc(CAT[u.e.category]?.label)} : ${fmt(spend(u.e))} le ${dFr(u.e.date)}, ${u.ratio.toFixed(1).replace('.',',')} fois ta dépense habituelle`).join('<br>'));
  if(inc>0&&!hasBudgets())h+=`<button type="button" class="teaser" data-tab="plan"><div><b>Des budgets adaptés à tes revenus sont prêts</b><span>Calculés à partir de tes dépenses réelles et des repères de Brazzaville.</span></div>${ic('right')}</button>`;
  const prev=shiftM(curM(),-1);
  if(isCur&&new Date().getDate()<=7&&LS.get(K.bilan,'')!==prev&&(monthItems(prev).length||monthInc(prev).length))
    h+=`<section class="block"><div class="block-head"><p class="over">Bilan de ${esc(mName(prev))}</p><button type="button" class="linkbtn" data-act="hideBilan">Masquer</button></div>${bilanHTML(prev)}<div class="actions"><button type="button" class="btn sm" data-act="openPrevReport">Rapport complet</button><button type="button" class="btn sm" data-act="sharePrev">Partager</button></div></section>`;
  h+=backupNudge();
  if(!items.length)h+=`<section class="block"><div class="empty"><strong>Aucune dépense en ${esc(name)}</strong><span>Touche « Ajouter » pour noter ta première dépense, ou programme tes dépenses récurrentes dans Réglages.</span></div></section>`;
  else{
    const bud=Object.entries(D.budgets).filter(([,b])=>b>0);
    if(bud.length){
      h+=`<section class="block"><div class="block-head"><p class="over">Budgets du mois</p><small class="num">${fmt(sumBy(bud,([c])=>cats[c]||0))} sur ${fmt(sumBy(bud,([,b])=>b))}</small></div><div class="list">`;
      for(const [c,b] of bud.sort((x,y)=>(cats[y[0]]||0)/y[1]-(cats[x[0]]||0)/x[1])){
        const s=cats[c]||0, st=budgetState(s,b);
        h+=`<div class="hbar"><div class="lab"><span class="dot" style="background:${CAT[c]?.color}"></span><span>${esc(CAT[c]?.label||c)}</span></div>${pill(st,st==='danger'?'Dépassé':Math.round(s/b*100)+' %')}
          <div class="track"><div class="fill" style="width:${Math.min(s/b,1)*100}%;background:var(--${st==='success'?'forest-600':st})"></div></div><span class="pct num" style="grid-column:1/-1">${fmt(s)} sur ${fmt(b)}</span></div>`;
      }
      h+=`</div></section>`;
    }
  }
  const det=detailsHTML(m,items,spent,inc,cats);
  h+=isCur?`<button type="button" class="more" id="moreBtn" data-act="toggleMore" aria-expanded="${!!S.more}">${S.more?'Masquer les détails du mois':'Voir les détails du mois'}</button>`+(S.more?det:''):det;
  return h;
}
// Détails du mois : repliés par défaut sur le mois en cours pour garder un accueil léger
function detailsHTML(m,items,spent,inc,cats){
  const isCur=m===curM(), B=isCur?dayBudget(m):null, saved=inc-spent, E=emergency(), fees=feesOf(items), sa=savedAside(m), goal=savingsGoal(m);
  let h='<div id="details">';
  if(B){
    const left=B.rav-B.variable, neg=left<0;
    h+=`<section class="block"><div class="block-head"><p class="over">Reste à vivre du mois</p></div><div class="big num" style="font-size:28px;${neg?'color:var(--danger)':''}">${fmtS(left)}</div>
      <div class="pbar"><div style="width:${Math.min(B.used,1)*100}%;background:${B.used>1?'var(--danger)':B.used>.85?'var(--gold-400)':'var(--forest-400)'}"></div></div>
      <div class="dsub num"><span>Reste à vivre prévu <b>${fmtS(B.rav)}</b></span><span>Dépenses courantes <b>${fmt(B.variable)}</b></span></div>
      <p class="hint">Entrées du mois, moins charges fixes, engagements et épargne visée. C'est un budget mensuel : il diffère du montant utilisable par jour de l'accueil, qui part de ton argent réellement disponible.</p></section>`;
    if(neg)h+=msg('danger','Reste à vivre dépassé',`Tes dépenses courantes dépassent de ${fmt(B.variable-B.rav)} ce qui restait après charges fixes, engagements et épargne visée.`);
    else{const frac=new Date().getDate()/daysIn(m);if(B.rav>0&&B.used>frac+.15)h+=msg('warning','Tu dépenses plus vite que prévu',`${pctS(B.used)} de ton reste à vivre est déjà utilisé, alors que ${pctS(frac)} du mois est écoulé.`)}
  }
  if(isCur)h+=payCard();
  h+=`<div class="kpis">
    <div class="kpi"><span class="over">Excédent du mois</span><span class="v num ${saved<0?'neg':''}">${inc?fmtS(saved):'-'}</span><span class="d">${inc?(saved>=0?`${pctS(saved/inc)} des entrées non dépensées`:'dépenses supérieures aux entrées')+` · entrées ${shortN(inc)}, dépensé ${shortN(spent)}`:'aucune entrée saisie'}</span></div>
    <div class="kpi"><span class="over">Épargne mise de côté</span><span class="v num">${fmt(sa)}</span><span class="d">virée vers Épargne ce mois-ci${goal?` · objectif ${shortN(goal)}`:''}</span></div>
    <div class="kpi"><span class="over">Fonds d'urgence</span><span class="v num">${E.avg?E.covered.toFixed(1).replace('.',',')+' mois':'-'}</span><span class="d">cible ${D.settings.emergency_months||3} mois · ${fmt(E.fund)}</span></div>
    <div class="kpi"><span class="over">Frais financiers</span><span class="v num">${fmt(fees)}</span><span class="d">Mobile Money et transferts</span></div></div>`;
  const up=isCur?upcoming(10).filter(u=>u.kind!=='Récurrente'):[];
  if(up.length)h+=`<section class="block"><div class="block-head"><p class="over">À venir sur 10 jours</p><button type="button" class="linkbtn" data-act="ics">${ic('calendar','s16')} Calendrier</button></div><div class="rows">${up.slice(0,6).map(u=>`<div class="rowbtn" style="cursor:default"><span class="wicon">${ic(u.icon)}</span><span class="t"><span>${esc(u.label)}</span><span>${u.late?'en retard depuis le ':''}${dLong(u.date)} · ${esc(u.kind)}</span></span><b class="num" style="${u.plus?'color:var(--success)':u.late?'color:var(--danger)':''}">${u.plus?'+':''}${fmt(u.amount)}</b></div>`).join('')}</div></section>`;
  h+=`<section class="block"><div class="block-head"><p class="over">Portefeuilles</p><button type="button" class="linkbtn" data-tab="accounts">Détails</button></div><div class="rows">${scopedWallets().map(([w,l,c])=>{const b=balance(w);return `<div class="rowbtn" style="cursor:default"><span class="dot" style="background:${c}"></span><span class="t"><span>${esc(l)}</span></span><b class="num" style="${b<0?'color:var(--danger)':''}">${fmtS(b)}</b></div>`}).join('')}</div>
    ${D.settings.opening_date?'':'<p class="hint">Saisis tes soldes de départ dans Comptes pour des montants exacts.</p>'}</section>`;
  if(items.length){
    const need=sumBy(items.filter(e=>natureOf(e)==='besoin'),spend);
    h+=`<section class="block"><p class="over">Répartition</p>
      <div class="stack"><div style="width:${need/spent*100}%;background:var(--forest-900)"></div><div style="width:${(spent-need)/spent*100}%;background:var(--gold-400)"></div></div>
      <div class="legend"><div><span class="dot" style="background:var(--forest-900)"></span><span>Besoins</span><span class="v num">${pctS(need/spent)}</span></div><div><span class="dot" style="background:var(--gold-400)"></span><span>Envies</span><span class="v num">${pctS((spent-need)/spent)}</span></div></div>
      <div class="list" style="margin-top:8px">`;
    for(const [c,v] of Object.entries(cats).sort((a,b)=>b[1]-a[1])){const p=v/spent*100;
      h+=`<div class="hbar"><div class="lab"><span class="dot" style="background:${CAT[c]?.color||'#9AA8A1'}"></span><span>${esc(CAT[c]?.label||c)}</span></div><span class="num"><b>${fmt(v)}</b> <span class="pct">${p.toFixed(0)} %</span></span><div class="track"><div class="fill" style="width:${p}%;background:${CAT[c]?.color||'#9AA8A1'}"></div></div></div>`}
    h+=`</div></section>`;
    const top=[...items].sort((a,b)=>spend(b)-spend(a)).slice(0,5);
    h+=`<section class="block"><p class="over">Top 5 des dépenses</p><div class="rows">${top.map((e,i)=>`<button type="button" class="rowbtn" ${e.synthetic?`data-move="${esc(e.moveId)}"`:`data-edit="${esc(e.id)}"`}><span class="rank">${i+1}</span><span class="t"><span>${esc(CAT[e.category]?.label||e.category)}</span><span>${dFr(e.date)} · ${esc(WAL[e.method]?.label||e.method)}${e.note?' · '+esc(e.note):''}</span></span><b class="num">${fmt(spend(e))}</b></button>`).join('')}</div></section>`;
  }
  return h+'</div>';
}

function bilanHTML(m){
  const items=monthItems(m), spent=sumBy(items,spend), inc=incomeIn(m), p=shiftM(m,-1), pSpent=spentIn(p);
  const cats=byCat(items), pc=byCat(monthItems(p)), goal=savingsGoal(m), saved=inc-spent;
  const top=Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const rise=Object.entries(cats).map(([c,v])=>[c,v-(pc[c]||0)]).filter(([,d])=>d>0).sort((a,b)=>b[1]-a[1])[0];
  const L=[];
  L.push(`Tu as dépensé <strong>${fmt(spent)}</strong> en ${items.length} opération${items.length>1?'s':''}${pSpent?`, soit <strong>${spent>=pSpent?'+':'−'}${Math.abs(Math.round((spent-pSpent)/pSpent*100))} %</strong> par rapport à ${esc(mName(p))}`:''}.`);
  if(pSpent){const r=realChange(spent,pSpent);L.push(`Hors inflation (${String(D.settings.inflation).replace('.',',')} % par an), la variation réelle est de <strong>${pctS(r,1)}</strong>.`)}
  if(inc>0){const sa=savedAside(m);L.push(saved>=0?`Excédent du mois : <strong>${fmt(saved)}</strong>, soit ${pctS(saved/inc)} de tes entrées non dépensées. Mis de côté : <strong>${fmt(sa)}</strong>${goal?` pour un objectif de ${fmt(goal)} (${sa>=goal?'atteint':'non atteint'})`:''}.`:`Tu as dépensé <strong>${fmt(-saved)}</strong> de plus que tes entrées.`)}
  if(top.length)L.push(`Postes principaux : ${top.map(([c,v])=>`${esc(CAT[c]?.label||c)} ${fmt(v)}`).join(', ')}.`);
  if(rise&&pSpent)L.push(`Plus forte hausse : <strong>${esc(CAT[rise[0]]?.label||rise[0])}</strong> (+${fmt(rise[1])}).`);
  const fees=feesOf(items);if(fees)L.push(`Frais financiers : <strong>${fmt(fees)}</strong>.`);
  return `<div class="tip" style="border-top:none;padding-top:0"><span class="rail" style="background:var(--forest-600)"></span><div>${L.map(l=>`<p style="margin:0 0 8px">${l}</p>`).join('')}</div></div>`;
}

function renderList(){
  const q=S.q.trim().toLowerCase(), all=monthItems(S.month);
  const ex=all.filter(e=>(S.filter==='all'||e.category===S.filter)&&(!q||(e.note||'').toLowerCase().includes(q)||(CAT[e.category]?.label||'').toLowerCase().includes(q)||String(e.amount).includes(q)));
  const {k,d}=S.sort, dir=d==='asc'?1:-1;
  ex.sort((a,b)=>k==='amount'?(spend(a)-spend(b))*dir:(a.date<b.date?-1:a.date>b.date?1:(a.created_at||'')<(b.created_at||'')?-1:1)*dir);
  const present=new Set(all.map(e=>e.category));
  let h=`<section class="block"><div class="block-head"><p class="over">Dépenses de ${esc(mName(S.month))}</p><small class="num">${ex.length} ligne${ex.length>1?'s':''}</small></div>
    <label class="search">${ic('search','s16')}<input id="q" type="search" placeholder="Rechercher une note, une catégorie, un montant" value="${esc(S.q)}" aria-label="Rechercher"></label>
    <div class="filters" role="group" aria-label="Filtrer par catégorie"><button type="button" data-filter="all" aria-pressed="${S.filter==='all'}">Toutes</button>${Object.entries(CAT).map(([k,v])=>[k,v.label+(v.archived?' (archivée)':'')]).filter(c=>present.has(c[0])).map(c=>`<button type="button" data-filter="${c[0]}" aria-pressed="${S.filter===c[0]}">${esc(c[1])}</button>`).join('')}</div>`;
  if(!ex.length)h+=`<div class="empty"><strong>Rien à afficher</strong><span>${all.length?'Aucune dépense ne correspond à ta recherche.':'Aucune dépense ce mois-ci. Touche « Ajouter » pour en noter une.'}</span></div></section>`;
  else{
    const arrow=key=>S.sort.k===key?(S.sort.d==='asc'?' ↑':' ↓'):'';
    h+=`<div class="sheet-scroll"><table><thead><tr><th class="rownum">#</th><th><button type="button" data-sort="date">Date${arrow('date')}</button></th><th>Catégorie</th><th>Nature</th><th>Moyen</th><th>Note</th><th class="amt">Frais</th><th class="amt"><button type="button" data-sort="amount">Montant${arrow('amount')}</button></th></tr></thead><tbody>`;
    ex.forEach((e,i)=>{h+=`<tr ${e.synthetic?`data-move="${esc(e.moveId)}"`:`data-edit="${esc(e.id)}"`} tabindex="0"><td class="rownum">${i+1}</td><td>${dFr(e.date)}</td><td><span class="lab" style="display:inline-flex"><span class="dot" style="background:${CAT[e.category]?.color||'#9AA8A1'}"></span>${esc(CAT[e.category]?.label||e.category)}</span>${e.recurring_id?`<span class="rec-tag" title="Récurrente">${ic('repeat','s16')}</span>`:''}</td><td>${natureOf(e)==='besoin'?'Besoin':'Envie'}</td><td>${esc(WAL[e.method]?.label||e.method)}</td><td class="note">${esc(e.note||'')}</td><td class="amt">${e.fee?fmtN(e.fee):''}</td><td class="amt">${fmtN(e.amount)}</td></tr>`});
    h+=`</tbody><tfoot><tr><td></td><td colspan="5">Total (FCFA)</td><td class="amt">${fmtN(sumBy(ex,e=>e.fee||0))}</td><td class="amt">${fmtN(sumBy(ex,e=>e.amount))}</td></tr></tfoot></table></div>
      <p class="hint">Touche une ligne pour la modifier. L'icône de flèches signale le paiement d'une charge récurrente.</p></section>`;
  }
  h+=`<section class="block"><p class="over">Export Excel</p><p class="hint">Fichier CSV séparé par des points-virgules, qui s'ouvre directement dans Excel.</p>
    <div class="actions"><button type="button" class="btn" data-export="month">Exporter ${esc(mName(S.month))}</button><button type="button" class="btn" data-export="all">Tout l'historique</button></div></section>`;
  return h;
}

function renderAccounts(){
  const m=S.month;let h='';
  const N=netWorth();
  h+=`<section class="block hero"><div class="block-head"><p class="over">Patrimoine net</p><button type="button" class="eye" data-act="toggleDiscreet">${ic(discreet()?'eye':'eyeoff','s16')}${discreet()?'Afficher':'Masquer'}</button></div><div class="big num">${fmtS(N.net)}</div>
    <div class="sub num"><span>Liquidités <b>${fmtS(N.cash)}</b></span><span>Biens <b>${fmt(N.goods)}</b></span><span>Créances <b>${fmt(N.claims)}</b></span><span>Dettes <b>${fmt(N.debts)}</b></span></div></section>`;
  const A=assets();
  h+=`<section class="block"><div class="block-head"><p class="over">Biens</p><small class="num">${fmt(N.goods)}</small></div>${A.length?`<div class="rows">${A.map(a=>`<div class="rowbtn" style="cursor:default"><span class="wicon">${ic('flag')}</span><span class="t"><span>${esc(a.name)}</span><span>valeur estimée</span></span><span style="display:flex;gap:4px;align-items:center"><b class="num">${fmt(a.value)}</b><button type="button" class="pill ${S.armed==='asset:'+a.id?'danger':''}" data-asset-del="${esc(a.id)}">${S.armed==='asset:'+a.id?'Confirmer':'Retirer'}</button></span></div>`).join('')}</div>`:'<p class="hint">Parcelle, véhicule, matériel : ajoute leur valeur estimée pour suivre ton patrimoine net.</p>'}
    <details><summary class="linkbtn">${ic('plus','s16')} Ajouter un bien</summary><div class="add"><div class="grid2"><label class="inp">Nom<input id="as-name" maxlength="40" placeholder="Ex. Parcelle à Kintélé"></label><label class="inp">Valeur estimée (FCFA)<input id="as-value" data-money inputmode="numeric" placeholder="0"></label></div><p class="err" id="as-err" hidden></p><button type="button" class="btn-primary" data-act="addAsset">Enregistrer</button></div></details></section>`;
  const total=sumBy(WALLETS,([w])=>balance(w));
  h+=`<section class="block"><div class="block-head"><p class="over">Portefeuilles</p><small class="num">total ${fmtS(total)}</small></div><div class="rows">`;
  for(const [w,l,c] of WALLETS){const b=balance(w), ck=((D.settings.opening||{}).__chk||{})[w];h+=`<div class="rowbtn" style="cursor:default"><span class="wicon" style="color:${c}">${ic(w==='epargne'?'shield':'wallet')}</span><span class="t"><span>${esc(l)}</span><span>${w==='epargne'?`dont projets ${fmt(projectsSaved())}`:esc(WSUB[WAL[w].kind]||'')}${ck?' · vérifié le '+dFr(ck):''}</span></span><span style="display:flex;gap:8px;align-items:center"><button type="button" class="pill" data-check="${esc(w)}">Vérifier</button><b class="num" style="${b<0?'color:var(--danger)':''}">${fmtS(b)}</b></span></div>`}
  h+=`</div><div class="actions"><button type="button" class="btn-primary sm" data-act="newMove">${ic('swap','s16')}Transférer</button></div>
    <details ${D.settings.opening_date?'':'open'}><summary class="linkbtn">Soldes de départ</summary><div class="add">
      <p class="hint">Indique ce que contient chaque portefeuille à une date donnée. Les soldes sont ensuite calculés à partir des opérations saisies depuis cette date.</p>
      <label class="inp">Date des soldes<input type="date" id="op-date" value="${esc(D.settings.opening_date||todayISO())}"></label>
      ${WALLETS.map(([w,l])=>`<div class="form-row"><span>${esc(l)}</span><label class="field"><input class="r" id="op-${w}" data-money inputmode="numeric" placeholder="0" value="${(D.settings.opening||{})[w]?group(D.settings.opening[w]):''}" aria-label="Solde ${esc(l)}"><span>FCFA</span></label></div>`).join('')}
      <button type="button" class="btn-primary" data-act="saveOpening">Enregistrer les soldes</button></div></details>
    ${walletsManage()}</section>`;
  const inc=monthInc(m).sort((a,b)=>a.date<b.date?1:-1);
  h+=`<section class="block"><div class="block-head"><p class="over">Entrées de ${esc(mName(m))}</p><small class="num">${fmt(sumBy(inc,e=>e.amount))}</small></div>`;
  h+=inc.length?`<div class="rows">${inc.map(e=>`<button type="button" class="rowbtn" data-income="${esc(e.id)}"><span class="dot" style="background:${SRC[e.source]?.color||'#9AA8A1'}"></span><span class="t"><span>${esc(SRC[e.source]?.label||e.source)}</span><span>${dFr(e.date)} · ${esc(WAL[e.wallet||'banque']?.label)}${e.note?' · '+esc(e.note):''}</span></span><b class="num">${fmt(e.amount)}</b></button>`).join('')}</div>`:`<p class="hint">Aucune entrée ce mois-ci. Ajoute ton salaire, une prime ou une mission pour calculer ton budget par jour.</p>`;
  h+=`<div class="actions"><button type="button" class="btn sm" data-act="newIncome">${ic('plus','s16')}Ajouter une entrée</button></div></section>`;
  const mv=monthMoves(m).sort((a,b)=>a.date<b.date?1:-1);
  h+=`<section class="block"><div class="block-head"><p class="over">Mouvements de ${esc(mName(m))}</p><small>${mv.length}</small></div><p class="hint">Transferts, tontines, prêts et projets : ils changent tes soldes sans être des dépenses. Seuls les frais comptent comme dépense.</p>`;
  if(mv.length)h+=`<div class="rows">${mv.map(x=>{const p=D.plans[x.ref_id];const path=[x.from_wallet&&WAL[x.from_wallet]?.label,x.to_wallet&&WAL[x.to_wallet]?.label].filter(Boolean).join(' → ');
    return `<button type="button" class="rowbtn" data-move="${esc(x.id)}"><span class="wicon">${ic(x.kind==='transfer'?'swap':x.kind==='adjust'?'check':x.kind.startsWith('tontine')?'users':x.kind==='project'?'flag':'hand')}</span><span class="t"><span>${esc(MOVES[x.kind]?.label)}${p?' · '+esc(p.name):''}${x.kind==='adjust'&&x.note?' · '+esc(x.note.replace(/^Ajustement : /,'')):''}</span><span>${dFr(x.date)} · ${esc(path)}${x.fee?` · frais ${fmt(x.fee)}`:''}</span></span><b class="num">${x.kind==='adjust'?(x.to_wallet?'+':'−')+' ':''}${fmt(x.amount)}</b></button>`}).join('')}</div>`;
  h+=`<div class="actions"><button type="button" class="btn sm" data-act="newMove">${ic('plus','s16')}Ajouter un mouvement</button></div></section>`;
  return h;
}

/* ---------- Modèles d'objectifs locaux ---------- */
const onOrAfter=(mo,d)=>{const t=todayISO(), y=new Date().getFullYear(), c=`${y}-${pad(mo)}-${pad(d)}`;return c>=t?c:`${y+1}-${pad(mo)}-${pad(d)}`};
const addMonthsISO=(iso,n)=>{const d=parseISO(iso), m=shiftM(ymOf(d),n);return `${m}-${pad(Math.min(d.getDate(),daysIn(m)))}`};
// Chaque modèle : champs à remplir, puis un calcul du montant visé et de l'échéance
const TEMPLATES={
  ecole:{label:'Rentrée scolaire',intro:'Inscription, fournitures et uniformes. La rentrée a eu lieu le 1er octobre en 2024 : vérifie la date de l\'année et corrige-la au besoin.',
    fields:[['per','Coût estimé par enfant (FCFA)','money','0'],['kids','Nombre d\'enfants','int','1'],['due','Échéance','date',()=>onOrAfter(10,1)]],
    build:v=>({name:'Rentrée scolaire '+(v.due||todayISO()).slice(0,4),amount:v.per*Math.min(10,Math.max(1,v.kids||1)),due:v.due,line:`${group(v.per)} FCFA × ${Math.min(10,Math.max(1,v.kids||1))} enfant(s)`})},
  terrain:{label:'Terrain par tranches',intro:'Tu paies ta parcelle en plusieurs versements : le carnet calcule la tranche à mettre de côté chaque mois.',
    fields:[['name','Nom du projet','text','Terrain à Kintélé'],['price','Prix du terrain (FCFA)','money','0'],['n','Nombre de tranches mensuelles','int','12']],
    build:v=>{const n=Math.min(60,Math.max(2,v.n||12));return {name:v.name||'Terrain par tranches',amount:v.price,due:addMonthsISO(todayISO(),n),tranches:n,line:`${n} tranches de ${group(Math.ceil(v.price/n))} FCFA`}}},
  caution:{label:'Caution de loyer',intro:'À Brazzaville, l\'entrée dans un logement loué demande en général 2 mois de caution plus 1 mois d\'agence. Confirme avec ton bailleur.',
    fields:[['rent','Loyer mensuel visé (FCFA)','money','0'],['due','Déménagement prévu le (facultatif)','date','']],
    build:v=>({name:'Caution de loyer',amount:v.rent*3,due:v.due||null,line:`3 mois de loyer : ${group(v.rent)} FCFA × 3`})},
  ceremonie:{label:'Cérémonie',intro:'Deuil, mariage, baptême, dot : une enveloppe prévue à l\'avance évite de puiser dans les autres postes.',
    fields:[['name','Nom','text','Cérémonie familiale'],['amount','Budget prévu (FCFA)','money','0'],['due','Date','date','']],
    build:v=>({name:v.name||'Cérémonie',amount:v.amount,due:v.due||null,line:''})},
  fetes:{label:'Fêtes de fin d\'année',intro:'Cadeaux, repas, tenues : mets de côté mois après mois pour décembre.',
    fields:[['amount','Budget prévu (FCFA)','money','0'],['due','Date','date',()=>onOrAfter(12,20)]],
    build:v=>({name:'Fêtes de fin d\'année '+(v.due||todayISO()).slice(0,4),amount:v.amount,due:v.due,line:''})},
  chantier:{label:'Construction par étapes',intro:'Ciment, briques, tôles : finance une étape à la fois plutôt que tout le chantier.',
    fields:[['name','Étape','text','Ciment et tôles'],['amount','Coût de l\'étape (FCFA)','money','0'],['due','Date visée','date','']],
    build:v=>({name:v.name||'Étape de construction',amount:v.amount,due:v.due||null,line:''})}
};
function tplValues(k){
  const T=TEMPLATES[k], v={};
  for(const [id,,type] of T.fields){const el=$('tp-'+id), raw=el?el.value:'';v[id]=type==='money'||type==='int'?toInt(raw):type==='date'?(/^\d{4}-\d{2}-\d{2}$/.test(raw)?raw:''):raw.trim().replace(/\s+/g,' ').slice(0,60)}
  return v;
}
function tplCompute(k){
  const T=TEMPLATES[k], v=tplValues(k), main=T.fields.find(f=>f[2]==='money')[0];
  if(!(v[main]>0))return {err:'Indique le montant.'};
  const r=T.build(v);if(!(r.amount>0))return {err:'Indique le montant.'};
  const sv=r.due&&r.due>todayISO()?Math.max(1,(parseISO(r.due).getFullYear()-new Date().getFullYear())*12+parseISO(r.due).getMonth()-new Date().getMonth()):0;
  return {r,monthly:sv?Math.ceil(r.amount/sv):0};
}
function tplForm(){
  const k=S.tpl, T=TEMPLATES[k];
  const chipsRow=Object.entries(TEMPLATES).map(([id,t])=>`<button type="button" class="pill ${id===k?'success':''}" data-tpl="${id}">${esc(t.label)}</button>`).join('');
  let form='';
  if(T)form=`<div class="add"><p class="hint">${esc(T.intro)}</p>${T.fields.map(([id,l,type,def])=>{const val=typeof def==='function'?def():def;
      const value=type==='text'||type==='money'?'':val, ph=type==='text'?val:type==='money'?'0':'';
      return `<label class="inp">${esc(l)}<input id="tp-${id}" ${type==='date'?'type="date"':type==='text'?'maxlength="60"':'inputmode="numeric" '+(type==='money'?'data-money':'')} value="${esc(value)}" placeholder="${esc(ph)}"></label>`}).join('')}
      <p class="hint num" id="tp-prev"></p><p class="err" id="tp-err" hidden></p><button type="button" class="btn-primary" data-act="createTpl">Créer l'objectif</button></div>`;
  return `<details data-keep="topen" ${S.topen?'open':''}><summary class="linkbtn">${ic('flag','s16')} Partir d'un modèle local</summary><div class="add"><div class="actions">${chipsRow}</div></div>${form}</details>`;
}
function updateTplPreview(){
  if(!S.tpl||!$('tp-prev'))return;
  const c=tplCompute(S.tpl);
  $('tp-prev').textContent=c.err?'':`Objectif : ${fmtRaw(c.r.amount)}${c.r.line?' ('+c.r.line+')':''}${c.monthly?`. À mettre de côté : environ ${fmtRaw(c.monthly)} par mois.`:'.'}`;
}
function createTpl(){
  const k=S.tpl;if(!TEMPLATES[k])return;
  const c=tplCompute(k), err=m=>{$('tp-err').textContent=m;$('tp-err').hidden=false};
  if(c.err)return err(c.err);
  if(c.r.due&&c.r.due<todayISO())return err('Choisis une date à venir.');
  const now=nowISO(), data={tpl:k};if(c.r.due)data.due=c.r.due;if(c.r.tranches)data.tranches=c.r.tranches;
  S.tpl=null;S.topen=false;
  mutate([{t:'plans',op:'upsert',row:{id:newId(),type:'project',name:c.r.name.slice(0,60),amount:c.r.amount,data,active:true,created_at:now,updated_at:now}}]);
  toast('Objectif créé : '+c.r.name);
}
function planForm(type){
  const f={
    project:`<label class="inp">Nom du projet<input id="p-name" maxlength="60" placeholder="Ex. Parcelle à Kintélé"></label><div class="grid2"><label class="inp">Montant visé (FCFA)<input id="p-amount" data-money inputmode="numeric" placeholder="0"></label><label class="inp">Échéance<input type="date" id="p-due"></label></div>`,
    tontine:`<label class="inp">Nom de la tontine<input id="p-name" maxlength="60" placeholder="Ex. Likelemba du bureau"></label><div class="grid2"><label class="inp">Cotisation par tour (FCFA)<input id="p-amount" data-money inputmode="numeric" placeholder="0"></label><label class="inp">Fréquence<select id="p-freq"><option value="mensuelle">Mensuelle</option><option value="hebdomadaire">Hebdomadaire</option></select></label></div><div class="grid2"><label class="inp">Nombre de membres<input id="p-members" inputmode="numeric" placeholder="10"></label><label class="inp">Mon tour (rang)<input id="p-turn" inputmode="numeric" placeholder="1"></label></div><label class="inp">Date du premier tour<input type="date" id="p-start" value="${todayISO()}"></label>`,
    loan:`<div class="grid2"><label class="inp">Personne<input id="p-name" maxlength="60" placeholder="Ex. Cousin Arnaud"></label><label class="inp">Montant prêté (FCFA)<input id="p-amount" data-money inputmode="numeric" placeholder="0"></label></div><div class="grid2"><label class="inp">Remboursement prévu le<input type="date" id="p-due"></label><label class="inp">Payé depuis<select id="p-wallet">${METHODS.map(w=>`<option value="${w[0]}">${esc(w[1])}</option>`).join('')}</select></label></div>`,
    debt:`<div class="grid2"><label class="inp">Prêteur<input id="p-name" maxlength="60" placeholder="Ex. Tante Mireille"></label><label class="inp">Montant emprunté (FCFA)<input id="p-amount" data-money inputmode="numeric" placeholder="0"></label></div><div class="grid2"><label class="inp">À rembourser le<input type="date" id="p-due"></label><label class="inp">Reçu sur<select id="p-wallet">${METHODS.map(w=>`<option value="${w[0]}">${esc(w[1])}</option>`).join('')}</select></label></div>`
  }[type];
  return `<details><summary class="linkbtn">${ic('plus','s16')} ${type==='loan'?'Ajouter un prêt':type==='debt'?'Ajouter une dette':type==='tontine'?'Ajouter une tontine':'Ajouter un projet'}</summary><div class="add" data-form="${type}">${f}<p class="err" data-err="${type}" hidden></p><button type="button" class="btn-primary" data-addplan="${type}">Enregistrer</button></div></details>`;
}
function planRow(p){
  const s=planStats(p), del=`<button type="button" class="pill ${S.armed==='plan:'+p.id?'danger':''}" data-plan-del="${esc(p.id)}">${S.armed==='plan:'+p.id?'Confirmer':'Retirer'}</button>`;
  if(p.type==='project'){const r=Math.min(s.ratio,1);
    return `<div class="plan"><div class="head"><div><b>${esc(p.name)}</b><div class="meta num">${fmt(s.saved)} sur ${fmt(s.target)}${s.due?` · échéance ${dLong(s.due)}`:''}</div></div>${s.ratio>=1?pill('success','Atteint'):del}</div>
      <div class="track"><div class="fill" style="width:${r*100}%;background:var(--forest-600)"></div></div>
      <div class="meta num">${s.ratio>=1?'Objectif atteint.':s.monthly?`À mettre de côté : <b>${fmt(s.monthly)}</b> par mois pour tenir l'échéance.`:'Ajoute une échéance pour connaître l\'effort mensuel.'}</div>
      ${p.data&&p.data.tranches?`<div class="meta num">Tranche prévue : <b>${fmt(Math.ceil(p.amount/p.data.tranches))}</b> par mois, sur ${p.data.tranches} mois.</div>`:''}
      <div class="actions"><button type="button" class="btn sm" data-newmove="project" data-ref="${esc(p.id)}">Verser</button></div></div>`}
  if(p.type==='tontine'){const d=p.data||{}, got=s.received>=s.pot;
    return `<div class="plan"><div class="head"><div><b>${esc(p.name)}</b><div class="meta num">${fmt(p.amount)} par tour · ${d.frequency==='hebdomadaire'?'chaque semaine':'chaque mois'} · ${esc(d.members)} membres · mon tour : ${esc(d.turn)}</div></div>${got?pill('success','Reçu'):del}</div>
      <div class="meta num">Réception ${got?'faite':'prévue le <b>'+dLong(s.receive)+'</b>'} : ${fmt(s.pot)} · cotisé ${fmt(s.paid)} · fin le ${dLong(s.end)}</div>
      <div class="actions"><button type="button" class="btn sm" data-newmove="tontine_out" data-ref="${esc(p.id)}">Cotiser</button><button type="button" class="btn sm" data-newmove="tontine_in" data-ref="${esc(p.id)}">Recevoir</button></div></div>`}
  const isLoan=p.type==='loan', late=s.due&&s.left>0&&s.due<todayISO();
  return `<div class="plan"><div class="head"><div><b>${esc(p.name)}</b><div class="meta num">${isLoan?'Prêté':'Emprunté'} ${fmt(isLoan?s.out:s.inn)} · ${isLoan?'remboursé':'remboursé'} ${fmt(isLoan?s.back:s.paid)}${s.due?` · échéance ${dLong(s.due)}`:''}</div></div>${s.left<=0?pill('success','Soldé'):late?pill('danger','En retard'):pill('info','Reste '+shortN(s.left))}</div>
    <div class="actions">${s.left>0?`<button type="button" class="btn sm" data-newmove="${isLoan?'loan_back':'debt_pay'}" data-ref="${esc(p.id)}">${isLoan?'Enregistrer un remboursement':'Rembourser'}</button>`:''}${del}</div></div>`;
}
function renderPlan(){
  let h=planSeg();
  if(S.planView==='subs')return h+renderSubs();
  const sect=(type,title,hint)=>{const list=plans(type).filter(p=>p.active!==false);return `<section class="block"><div class="block-head"><p class="over">${title}</p><small>${list.length||''}</small></div>${list.length?`<div>${list.map(planRow).join('')}</div>`:`<p class="hint">${hint}</p>`}${planForm(type)}</section>`};
  h+=sect('project','Projets d\'épargne','Parcelle, véhicule, études : fixe un montant et une échéance, l\'application calcule l\'effort mensuel.').replace('</section>',tplForm()+'</section>');
  h+=sect('tontine','Tontines','Likelemba, ristourne : suis tes cotisations et la date de ton tour.');
  const ld=plans().filter(p=>(p.type==='loan'||p.type==='debt')&&p.active!==false);
  h+=`<section class="block"><p class="over">Prêts et dettes</p>${ld.length?`<div>${ld.map(planRow).join('')}</div>`:'<p class="hint">L\'argent prêté à un proche ou emprunté, avec son échéance. Tu es prévenu sept jours avant.</p>'}${planForm('loan')}${planForm('debt')}</section>`;
  h+=renderBudgetsBlock()+renderTips();
  return h;
}
function renderBudgetsBlock(){
  const cats=byCat(monthItems(S.month));
  const T=toAllocate(S.month);
  let h='';
  if(T){const st=T.rest>0?'warning':T.rest<0?'danger':'success';
    h+=`<section class="block"><div class="block-head"><p class="over">Chaque franc a une mission</p>${pill(st,T.rest===0?'Tout est affecté':T.rest>0?'Reste à affecter':'Trop affecté')}</div>
      <div class="big num" style="font-size:28px;color:var(--${T.rest<0?'danger':'forest-900'})">${fmtS(T.rest)}</div>
      <div class="ref num"><span>Entrées du mois</span><span class="v">${fmt(T.R)}</span><span>Budgets</span><span class="v">− ${fmt(T.bud)}</span><span>Épargne visée</span><span class="v">− ${fmt(T.goal)}</span><span>Tontines</span><span class="v">− ${fmt(T.eng)}</span><span>Projets d'épargne</span><span class="v">− ${fmt(T.proj)}</span></div>
      <p class="hint">${T.rest>0?'Donne une mission à ce reste : augmente un budget, ou envoie-le vers l\'épargne.':T.rest<0?'Tes affectations dépassent tes entrées : réduis un budget ou l\'épargne visée.':'Chaque franc de tes entrées a une affectation.'}</p>
      ${T.rest>0?`<div class="actions"><button type="button" class="btn-primary sm" data-act="restToSavings">Ajouter ${fmt(T.rest)} à l'épargne visée</button></div>`:''}</section>`}
  h+=`<section class="block"><div class="block-head"><p class="over">Budgets mensuels</p><small>valables chaque mois</small></div><p class="hint">Laisse vide pour ne pas suivre une catégorie. Alerte à 80 % et à 100 %.</p><div>`;
  for(const [c,label,color] of CATS){const b=D.budgets[c]||0, s=cats[c]||0;
    h+=`<div class="form-row"><div class="lab"><span class="dot" style="background:${color}"></span><span>${esc(label)}</span></div><label class="field"><input class="r" id="b-${c}" data-bud="${c}" inputmode="numeric" placeholder="-" value="${b?group(b):''}" aria-label="Budget ${esc(label)}"><span>FCFA</span></label>
      <span class="meta num">Dépensé ce mois : ${fmt(s)}${b?` · ${Math.round(s/b*100)} %`:''}</span></div>`}
  return h+`</div><div class="actions" style="justify-content:space-between;align-items:center"><span class="hint num">Total budgété : ${fmt(sumBy(Object.values(D.budgets),v=>v||0))}</span><button type="button" class="btn-primary" data-act="saveBud">Enregistrer les budgets</button></div></section>`;
}
function tipFor(c,x,t){
  const ex=fmt(Math.max(x-t,0));
  switch(c){
    case 'transport':{const n=Math.round(x/PRICES.taxi),g=r500(x/PRICES.taxi/3*(PRICES.taxi-PRICES.bus));return `Ton transport équivaut à environ <strong>${n} courses de taxi</strong> à 1 000 FCFA. Remplacer une course sur trois par le bus (150 FCFA) ferait gagner environ <strong>${fmt(g)}</strong> par mois (tarifs de juillet 2024, à vérifier sur ton trajet).`}
    case 'alimentation':return `Tu dépasses la cible de <strong>${ex}</strong>. Achète les produits de base en gros (sac de riz, bidon d'huile) plutôt qu'au détail, et fais une liste de marché pour la semaine.`;
    case 'factures':return `Au tarif E²C des petits compteurs, 100 kWh coûtent environ <strong>${fmt(100*PRICES.kwh)}</strong> hors taxes (tarif de référence, à comparer à ta facture). Climatiseur, congélateur et chauffe-eau pèsent le plus sur la facture.`;
    case 'communication':return x>PRICES.fibre?`Tu dépenses plus que l'offre d'entrée en fibre chez Congo Telecom ou CanalBox (<strong>15 000 FCFA</strong> par mois). Une connexion fixe pourrait te coûter moins cher que la data mobile.`:`Tu dépasses la cible de <strong>${ex}</strong>. Un forfait 30 jours revient en général moins cher que des petits forfaits au jour le jour.`;
    case 'logement':return `Le logement dépasse le repère de 20 % des revenus. En cas de déménagement, compte aussi l'entrée habituelle à Brazzaville : <strong>2 mois de caution + 1 mois d'agence</strong>.`;
    case 'loisirs':return `Dépassement de <strong>${ex}</strong>. Fixe une enveloppe sorties en début de mois, idéalement en espèces, et arrête quand elle est vide.`;
    case 'famille':return `Dépassement de <strong>${ex}</strong>. Les aides à la famille sont souvent imprévues : garde une réserve dédiée plutôt que de puiser dans les autres postes.`;
    default:return `Dépassement de <strong>${ex}</strong> par rapport à la cible proposée.`;
  }
}
// Moyenne mensuelle réelle d'une catégorie sur les 3 derniers mois complets ayant des données
const ownMonths=()=>[1,2,3].map(i=>shiftM(curM(),-i)).filter(x=>monthItems(x).length);
const ownAvg=c=>{const ms=ownMonths();return ms.length?sumBy(ms,x=>byCat(monthItems(x))[c]||0)/ms.length:0};
// Conseils tirés d'abord de tes propres chiffres : charges fixes, hausses par rapport à tes moyennes, objectif d'épargne
function ownAdvice(){
  const m=S.month, inc=incomeIn(m), items=monthItems(m), L=[], hist=ownMonths();
  const fixed=sumBy(Object.values(D.recurring).filter(r=>r.active&&recInScope(r)),subMonthly);
  if(fixed>0)L.push({c:'var(--forest-600)',t:`Charges fixes · <span class="num">${fmt(fixed)}</span> par mois`,b:inc>0?`Elles représentent <strong>${pctS(fixed/inc)}</strong> de tes entrées de ${esc(mName(m))}. ${fixed/inc>.5?'Il reste peu de marge : toute baisse de revenu se ressent tout de suite.':'Le reste de tes entrées est à répartir entre dépenses courantes et épargne.'}`:'Ajoute tes entrées pour voir leur poids dans ton budget.'});
  if(hist.length&&items.length&&(m!==curM()||new Date().getDate()>=10)){
    const cats=byCat(items), frac=m===curM()?new Date().getDate()/daysIn(m):1;
    const up=Object.keys(cats).map(c=>{const avg=ownAvg(c)*frac;return {c,v:cats[c],avg,d:cats[c]-avg}}).filter(x=>x.avg>0&&x.d>=5000&&x.d/x.avg>=.2).sort((a,b)=>b.d-a.d)[0];
    if(up)L.push({c:CAT[up.c]?.color||'var(--gold-400)',t:`${esc(CAT[up.c]?.label||up.c)} · <span class="num">${fmt(up.v)}</span>`,b:`C'est <strong>${pctS(up.d/up.avg)}</strong> de plus que ta moyenne des ${hist.length} mois précédents${frac<1?' au même jour du mois':''} (<span class="num">${fmt(up.avg)}</span>). Regarde les dépenses de cette catégorie dans l'onglet Dépenses.`});
  }
  const goal=savingsGoal(m), sa=savedAside(m);
  if(goal>0&&inc>0)L.push({c:'var(--forest-400)',t:`Épargne · <span class="num">${fmt(sa)}</span> mis de côté sur <span class="num">${fmt(goal)}</span> visés`,b:sa>=goal?'Objectif du mois atteint.':'Vire la somme vers ton portefeuille Épargne dès que ton argent arrive : une épargne qui reste dans le portefeuille courant se dépense.'});
  if(!hist.length)L.push({c:'var(--ink-300)',t:'Tes moyennes arrivent bientôt',b:'Note tes dépenses sur quelques semaines : les conseils partiront alors de tes propres chiffres, pas de moyennes nationales.'});
  return `<section class="block"><div class="block-head"><p class="over">Ce que disent tes chiffres</p><small>d'abord tes dépenses réelles</small></div>${L.map(x=>`<div class="tip"><span class="rail" style="background:${x.c}"></span><div><b>${x.t}</b><p>${x.b}</p></div></div>`).join('')}</section>`;
}
function renderTips(){
  const R=incomeIn(S.month), name=mName(S.month);
  if(!R)return ownAdvice()+`<section class="block"><p class="over">Conseils</p><p class="hint">Ajoute tes entrées de ${esc(name)} pour recevoir des budgets proposés, calculés d'abord avec tes dépenses réelles puis avec les repères de Brazzaville.</p><div class="actions"><button type="button" class="btn sm" data-act="newIncome">Ajouter une entrée</button></div></section>`+renderRefs();
  const P=proposal(R), items=monthItems(S.month), total=sumBy(items,spend), cats=byCat(items), isCur=S.month===curM();
  let h=ownAdvice();
  if(total>0){
    const scale=isCur?Math.min(new Date().getDate()/daysIn(S.month),1):1, fixedC=byCat(items.filter(e=>e.recurring_id));
    const target=c=>{const f=fixedC[c]||0,a=P.amt[c];return f>=a?a:f+(a-f)*scale};
    const over=Object.keys(P.amt).map(c=>({c,x:cats[c]||0,t:target(c)})).filter(o=>o.t>0&&o.x>o.t*1.05).sort((a,b)=>(b.x-b.t)-(a.x-a.t));
    h+=`<section class="block"><div class="block-head"><p class="over">Écarts aux cibles de référence</p><small>${isCur?'au prorata du mois':''}</small></div><p class="hint" style="margin-bottom:8px">Cibles calculées avec la structure de consommation de Brazzaville (INS, enquête 2011) ajustée à tes revenus. Ce sont des repères anciens : tes propres moyennes, plus haut, passent en premier.</p>`;
    h+=over.length?`<div>${over.slice(0,4).map(o=>`<div class="tip"><span class="rail" style="background:${CAT[o.c].color}"></span><div><b>${esc(CAT[o.c].label)} · <span class="num">${fmt(o.x)}</span> pour une cible de <span class="num">${fmt(o.t)}</span></b><p>${tipFor(o.c,o.x,o.t)}</p></div></div>`).join('')}</div>`:`<p class="hint">Toutes tes catégories sont dans les cibles proposées.</p>`;
    const fees=feesOf(items);
    if(fees>0)h+=`<div class="tip"><span class="rail" style="background:${WAL.mtn.color}"></span><div><b>Frais financiers · <span class="num">${fmt(fees)}</span></b><p>Regroupe tes retraits et paie directement en Mobile Money quand le commerçant l'accepte : chaque retrait évité, ce sont des frais en moins.</p></div></div>`;
    const env=sumBy(items.filter(e=>natureOf(e)==='envie'),spend);
    if(env/total>.3)h+=`<div class="tip"><span class="rail" style="background:var(--gold-400)"></span><div><b>Envies · <span class="num">${pctS(env/total)}</span> des dépenses</b><p>Au-delà de 30 %, une partie des envies peut alimenter ton fonds d'urgence ou un projet d'épargne.</p></div></div>`;
    h+=`</section>`;
    const me={alimentation:cats.alimentation||0,logfac:(cats.logement||0)+(cats.factures||0),transport:cats.transport||0,communication:cats.communication||0,vetements:cats.vetements||0,loisirs:cats.loisirs||0,sante:cats.sante||0,education:cats.education||0,divers:0};
    me.divers=Math.max(0,total-sumBy(Object.keys(me),k=>me[k]));
    const lab={alimentation:'Alimentation',logfac:'Logement et factures',transport:'Transport',communication:'Crédit & data',vetements:'Vêtements',loisirs:'Loisirs & sorties',sante:'Santé',education:'Éducation',divers:'Famille & autres'};
    h+=`<section class="block"><div class="block-head"><p class="over">Toi et le ménage moyen de Brazzaville</p><small>part des dépenses</small></div><div class="list">`;
    for(const k in INS_BZV){const mine=me[k]/total*100, ref=INS_BZV[k];
      h+=`<div class="cmp"><span>${lab[k]}</span><div class="cr"><span>Toi</span><div class="t2"><div style="width:${Math.min(mine,100)}%;background:var(--forest-600)"></div></div><span class="num" style="text-align:right;color:var(--ink-900);font-weight:700">${Math.round(mine)} %</span><span>Moyenne</span><div class="t2"><div style="width:${ref}%;background:var(--ink-300)"></div></div><span class="num" style="text-align:right">${Math.round(ref)} %</span></div></div>`}
    h+=`</div><p class="hint">Moyenne : structure de consommation des ménages de Brazzaville utilisée par l'INS pour l'indice des prix (enquête ECOM 2011, donc ancienne). Repère indicatif, pas un objectif.</p></section>`;
  }
  const hb=hasBudgets();
  h+=`<section class="block"><div class="block-head"><p class="over">Budgets proposés</p><small class="num">pour ${fmt(R)}</small></div><p class="hint">Point de départ : structure de consommation de Brazzaville (INS, 2011) ajustée à tes revenus. Si tu as déjà des mois de dépenses notées, préfère tes propres moyennes.</p><div>`;
  for(const c of ['alimentation','logement','transport','factures','communication','loisirs','vetements','famille','sante','education','autres']){const cur=D.budgets[c]||0;
    h+=`<div class="prop-row"><span class="lab"><span class="dot" style="background:${CAT[c].color}"></span><span>${esc(CAT[c].label)}</span></span><b class="num">${fmt(P.amt[c])}</b><span class="sub hint num">${P.sh[c].toFixed(0)} % des entrées${ownAvg(c)>0?` · ta moyenne ${fmt(ownAvg(c))}`:''}${cur?` · budget actuel ${fmt(cur)}`:''}</span></div>`}
  h+=`<div class="prop-row save"><span><b>Épargne visée</b></span><b class="num">${fmt(P.saveAmt)}</b><span class="sub hint">${P.save.toFixed(0)} % des entrées : ce qui doit rester en fin de mois.</span></div></div>
    <div class="actions">${ownMonths().length?`<button type="button" class="${S.armed==='own'?'btn-danger':'btn-primary'}" data-act="applyOwn">${S.armed==='own'?'Confirmer le remplacement':hb?'Remplacer par mes dépenses réelles':'Partir de mes dépenses réelles'}</button>`:''}<button type="button" class="${S.armed==='prop'?'btn-danger':ownMonths().length?'btn':'btn-primary'}" data-act="applyProp">${S.armed==='prop'?'Confirmer le remplacement':hb?'Remplacer par les repères':'Appliquer les repères'}</button></div></section>`;
  return h+renderRefs();
}
function renderRefs(){
  return `<section class="block"><p class="over">Repères de prix au Congo</p><p class="hint">Chaque repère porte sa date. Les plus anciens (2011, 2022, 2023) sont des ordres de grandeur : compare-les à tes propres factures et reçus.</p><div class="ref num">
    <span>Salaire minimum (SMIG)<small>depuis janvier 2025</small></span><span class="v">70 400 FCFA</span>
    <span>Inflation au Congo<small>moyenne annuelle à fin mars 2025, BEAC</small></span><span class="v">4,0 %</span>
    <span>Bus à Brazzaville<small>tarif maintenu, juillet 2024</small></span><span class="v">150 FCFA</span>
    <span>Course de taxi à Brazzaville<small>tarif maintenu, juillet 2024</small></span><span class="v">1 000 FCFA</span>
    <span>Électricité E²C, petits compteurs<small>kWh hors taxes, plus 2 268 à 2 550 FCFA fixes</small></span><span class="v">49,08 FCFA</span>
    <span>Fibre Congo Telecom et CanalBox, offre d'entrée<small>par mois, prix fixé en octobre 2026</small></span><span class="v">15 000 FCFA</span>
    <span>Riz, sac de 25 kg<small>marché de Brazzaville, février 2023 (ancien)</small></span><span class="v">18 000 FCFA</span>
    <span>Entrée dans un logement loué<small>usage courant, sans date précise</small></span><span class="v">2 mois + 1 mois</span>
  </div><p class="over" style="margin-top:8px">Sources</p><ol class="src">
    <li><a href="https://interholco.com/images/pdfs/IHC-Sustainability-Rep-2022/Indice-Janvier-2022.pdf" target="_blank" rel="noopener">INS Congo, indice des prix janvier 2022 (pondérations issues de l'enquête ECOM 2011)</a></li>
    <li><a href="https://www.beac.int/wp-content/uploads/2016/10/note_inflation_CEMAC_T22025_vf.pdf" target="_blank" rel="noopener">BEAC, note sur l'inflation en CEMAC, 2e trimestre 2025</a></li>
    <li><a href="https://africa24tv.com/?p=133603" target="_blank" rel="noopener">Africa24 : le SMIG passe à 70 400 FCFA</a></li>
    <li><a href="https://fr.allafrica.com/stories/202407300189.html" target="_blank" rel="noopener">AllAfrica : tarifs des transports en commun</a></li>
    <li><a href="https://liziba.cg/en/facteur-de-production-electricite/" target="_blank" rel="noopener">LIZIBA : électricité</a> et <a href="https://liziba.cg/en/facteur-de-production-telecommunication/" target="_blank" rel="noopener">télécommunications</a></li>
    <li><a href="https://lesechos-congobrazza.com/societe/9154-cherte-de-la-vie-a-brazzaville-quand-manger-du-poisson-frais-ou-fume-devient-un-luxe" target="_blank" rel="noopener">Les Échos du Congo : prix au marché, 2023</a></li>
    <li><a href="https://lepetitjournal.com/vivre-republique-congo/loger-brazzaville-guide-394087" target="_blank" rel="noopener">Le Petit Journal : se loger à Brazzaville</a></li>
  </ol></section>`;
}

function renderAnalyse(){
  const n=S.span, months=[];for(let i=n-1;i>=0;i--)months.push(shiftM(S.month,-i));
  const labs=months.map(mShort), curI=months.length-1;
  const spentM=months.map(spentIn), incM=months.map(incomeIn), withData=months.filter((m,i)=>spentM[i]>0);
  let h=`<section class="block"><div class="block-head"><p class="over">Période d'analyse</p><div class="seg2" role="group" aria-label="Période">${[3,6,12].map(k=>`<button type="button" data-span="${k}" aria-pressed="${n===k}">${k} mois</button>`).join('')}</div></div>
    <p class="hint">De ${esc(mLong(months[0]))} à ${esc(mLong(months[curI]))}.</p></section>`+reportBlock();
  if(!withData.length)return h+`<section class="block"><div class="empty"><strong>Pas encore de données sur la période</strong><span>Les graphiques et statistiques apparaissent dès tes premières dépenses.</span></div></section>`;
  const periodItems=months.flatMap(monthItems), amounts=periodItems.filter(e=>!e.synthetic).map(spend);
  const vals=withData.map(spentIn), avg=sumBy(vals,x=>x)/vals.length, sd=Math.sqrt(sumBy(vals,x=>(x-avg)**2)/vals.length);
  const days=sumBy(months,(m,i)=>i===curI&&m===curM()?new Date().getDate():daysIn(m));
  const maxI=spentM.indexOf(Math.max(...spentM)), incTot=sumBy(incM,x=>x), spTot=sumBy(spentM,x=>x);
  const env=sumBy(periodItems.filter(e=>natureOf(e)==='envie'),spend), fees=feesOf(periodItems), biggest=[...periodItems].sort((a,b)=>spend(b)-spend(a))[0];
  h+=`<section class="block"><p class="over">Statistiques</p><div class="stats num">
    <div class="stat"><span>Dépense mensuelle moyenne</span><b>${fmt(avg)}</b><small>sur ${vals.length} mois actifs</small></div>
    <div class="stat"><span>Volatilité mensuelle</span><b>${avg?pctS(sd/avg):'-'}</b><small>écart type ${fmt(sd)}</small></div>
    <div class="stat"><span>Dépense moyenne par jour</span><b>${fmt(spTot/Math.max(days,1))}</b><small>${days} jours</small></div>
    <div class="stat"><span>Médiane d'une dépense</span><b>${fmt(median(amounts))}</b><small>${amounts.length} opérations</small></div>
    <div class="stat"><span>Part moyenne non dépensée</span><b>${incTot?pctS((incTot-spTot)/incTot):'-'}</b><small>entrées ${shortN(incTot)}</small></div>
    <div class="stat"><span>Mois le plus cher</span><b>${esc(mShort(months[maxI]))} ${months[maxI].slice(0,4)}</b><small>${fmt(spentM[maxI])}</small></div>
    <div class="stat"><span>Part des envies</span><b>${spTot?pctS(env/spTot):'-'}</b><small>${fmt(env)}</small></div>
    <div class="stat"><span>Frais financiers</span><b>${fmt(fees)}</b><small>${spTot?pctS(fees/spTot,1)+' des dépenses':''}</small></div>
  </div>${biggest?`<p class="hint num">Plus grosse dépense : ${fmt(spend(biggest))}, ${esc(CAT[biggest.category]?.label)}, le ${dFr(biggest.date)}.</p>`:''}</section>`;
  // Entrées vs dépenses
  h+=`<section class="block"><p class="over">Entrées et dépenses par mois</p>${barsChart(labs,[{name:'Entrées',color:'var(--forest-400)',values:incM},{name:'Dépenses',color:'var(--forest-900)',values:spentM}],{cur:curI,label:'Entrées et dépenses par mois'})}${keys([['Entrées','var(--forest-400)'],['Dépenses','var(--forest-900)']])}
    <p class="hint num">Excédent cumulé sur la période : <b>${fmtS(incTot-spTot)}</b> (entrées moins dépenses).</p></section>`;
  // Cumul du mois vs mois précédent
  const cm=S.month, pm=shiftM(cm,-1), Dm=Math.max(daysIn(cm),daysIn(pm)), lim=cm===curM()?new Date().getDate():daysIn(cm);
  const cum=(m,stop)=>{const it=monthItems(m);let a=0;const out=[];for(let d=1;d<=Dm;d++){if(d>daysIn(m)||d>stop){out.push(null);continue}a+=sumBy(it.filter(e=>+e.date.slice(8)===d),spend);out.push(a)}return out};
  const cc=cum(cm,lim), cp=cum(pm,99), xs=Array.from({length:Dm},(_,i)=>String(i+1));
  const atDay=cp[lim-1]??cp.filter(v=>v!=null).pop(), diff=cc[lim-1]-(atDay||0);
  h+=`<section class="block"><p class="over">Rythme de dépense : ${esc(mName(cm))} et ${esc(mName(pm))}</p>${lineChart(xs,[{name:mName(pm),color:'var(--ink-300)',values:cp,dash:true,width:2},{name:mName(cm),color:'var(--forest-900)',values:cc}],{ticks:[0,9,19,Dm-1],label:'Dépenses cumulées par jour'})}${keys([[mName(cm),'var(--forest-900)'],[mName(pm),'var(--ink-300)']])}
    ${atDay?`<p class="hint num">Au ${lim} ${esc(mName(cm))}, tu as dépensé <b>${fmt(Math.abs(diff))} ${diff>=0?'de plus':'de moins'}</b> qu'au même jour de ${esc(mName(pm))}.</p>`:''}</section>`;
  // Catégories par mois
  const tot={};periodItems.forEach(e=>tot[e.category]=(tot[e.category]||0)+spend(e));
  const topC=Object.entries(tot).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
  const ser=topC.map(c=>({name:CAT[c].label,color:CAT[c].color,values:months.map(m=>byCat(monthItems(m))[c]||0)}));
  ser.push({name:'Autres postes',color:'var(--mist-200)',values:months.map((m,i)=>spentM[i]-sumBy(topC,c=>byCat(monthItems(m))[c]||0))});
  h+=`<section class="block"><p class="over">Catégories par mois</p>${barsChart(labs,ser,{stacked:true,cur:curI,top:spentM,label:'Dépenses par catégorie et par mois'})}${keys(ser.map(s=>[s.name,s.color]))}</section>`;
  // Tableau des variations
  const cur=byCat(monthItems(S.month));
  const frac=S.month===curM()?new Date().getDate()/daysIn(S.month):1;
  const rowsV=Object.keys(tot).map(c=>{const a=frac*sumBy(months.slice(0,-1),m=>byCat(monthItems(m))[c]||0)/Math.max(1,months.length-1);return {c,a,v:cur[c]||0}}).sort((x,y)=>y.v-x.v);
  h+=`<section class="block"><p class="over">Écarts à ta moyenne</p><div class="sheet-scroll"><table class="compact"><thead><tr><th>Catégorie</th><th class="amt">${frac<1?'Moyenne au '+new Date().getDate():'Moyenne'}</th><th class="amt">${esc(mShort(S.month))}</th><th class="amt">Écart</th></tr></thead><tbody>${rowsV.map(r=>{const e=r.a?(r.v-r.a)/r.a:null;return `<tr style="cursor:default"><td><span class="lab" style="display:inline-flex"><span class="dot" style="background:${CAT[r.c]?.color}"></span>${esc(CAT[r.c]?.label)}</span></td><td class="amt">${fmtN(r.a)}</td><td class="amt">${fmtN(r.v)}</td><td class="amt ${e==null?'':e>.1?'var-up':e<-.1?'var-down':''}">${e==null?'nouveau':(e>0?'+':'')+pctS(e)}</td></tr>`}).join('')}</tbody></table></div><p class="hint">Moyenne des mois précédents de la période${frac<1?', ramenée au même jour du mois pour comparer à rythme égal':''}. En rouge : hausse de plus de 10 %.</p></section>`;
  // Jour de la semaine
  const wd=[0,0,0,0,0,0,0], cnt=[0,0,0,0,0,0,0];
  months.forEach((m,i)=>{const last=i===curI&&m===curM()?new Date().getDate():daysIn(m);for(let d=1;d<=last;d++){cnt[new Date(+m.slice(0,4),+m.slice(5)-1,d).getDay()]++}});
  periodItems.filter(e=>!e.recurring_id).forEach(e=>wd[parseISO(e.date).getDay()]+=spend(e));
  const order=[1,2,3,4,5,6,0], wl=['lun','mar','mer','jeu','ven','sam','dim'], wv=order.map(d=>cnt[d]?wd[d]/cnt[d]:0), wmax=wv.indexOf(Math.max(...wv));
  h+=`<section class="block"><p class="over">Dépense moyenne par jour de la semaine</p>${barsChart(wl,[{name:'Moyenne',color:'var(--forest-600)',values:wv}],{cur:wmax,top:wv,label:'Dépense moyenne par jour de la semaine'})}<p class="hint">Hors dépenses récurrentes. Le ${['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'][wmax]} est ton jour le plus dépensier.</p></section>`;
  // Besoins et envies
  h+=`<section class="block"><p class="over">Besoins et envies</p>${barsChart(labs,[{name:'Besoins',color:'var(--forest-900)',values:months.map(m=>sumBy(monthItems(m).filter(e=>natureOf(e)==='besoin'),spend))},{name:'Envies',color:'var(--gold-400)',values:months.map(m=>sumBy(monthItems(m).filter(e=>natureOf(e)==='envie'),spend))}],{stacked:true,cur:curI,label:'Besoins et envies par mois'})}${keys([['Besoins','var(--forest-900)'],['Envies','var(--gold-400)']])}</section>`;
  // Pouvoir d'achat
  const r=(D.settings.inflation||0)/100, real=months.map((m,i)=>spentM[i]?spentM[i]/Math.pow(1+r,i/12):null);
  const fI=spentM.findIndex(v=>v>0);
  const nomCh=fI>=0&&fI<curI&&spentM[fI]?spentM[curI]/spentM[fI]-1:null, realCh=nomCh!=null?real[curI]/real[fI]-1:null;
  h+=`<section class="block"><p class="over">Pouvoir d'achat</p>${lineChart(labs,[{name:'Dépenses',color:'var(--forest-900)',values:spentM.map(v=>v||null)},{name:'À prix de '+mShort(months[0]),color:'var(--gold-600)',values:real,dash:true,width:2}],{label:'Dépenses nominales et à prix constants'})}${keys([['Dépenses en francs courants','var(--forest-900)'],['À prix de '+mShort(months[0])+' (inflation '+String(D.settings.inflation).replace('.',',')+' % par an)','var(--gold-600)']])}
    ${nomCh!=null?`<p class="hint num">Depuis ${esc(mShort(months[fI]))}, tes dépenses ont varié de <b>${(nomCh>0?'+':'')+pctS(nomCh,1)}</b>. Hors inflation, la variation réelle est de <b>${(realCh>0?'+':'')+pctS(realCh,1)}</b>.</p>`:''}</section>`;
  // Moyens de paiement
  const mets={};periodItems.forEach(e=>mets[e.method]=(mets[e.method]||0)+spend(e));
  h+=`<section class="block"><p class="over">Moyens de paiement</p><div class="stack">${METALL().filter(([k])=>mets[k]).map(([k])=>`<div style="width:${mets[k]/spTot*100}%;background:${WAL[k].color}"></div>`).join('')}</div>
    <div class="legend">${METALL().map(([k])=>`<div><span class="dot" style="background:${WAL[k].color}"></span><span>${esc(WAL[k].label)}</span><span class="v num">${spTot?Math.round((mets[k]||0)/spTot*100):0} %</span></div>`).join('')}</div></section>`;
  return h;
}

function renderGuide(){
  const G=[['Argent disponible','Ce que contiennent tes portefeuilles hors épargne (espèces, Mobile Money, banque), d\'après tes soldes de départ et les opérations notées.'],
    ['Budget du jour','(argent disponible − sorties déjà prévues) ÷ nombre de jours jusqu\'à la prochaine paie ou la fin du mois, au choix. Les sorties prévues sont les charges à payer, les tontines et les dettes. Ce qui est dépensé aujourd\'hui se compare à ce budget sans le faire bouger.'],
    ['Excédent du mois','Entrées du mois moins dépenses du mois. Ce n\'est pas de l\'épargne tant que tu ne l\'as pas mis de côté.'],
    ['Épargne mise de côté','Les sommes virées vers ton portefeuille Épargne dans le mois, moins les retraits.'],
    ['Reste à vivre','Entrées du mois moins charges fixes, engagements et épargne visée.'],
    ['À payer et Payé','Une charge récurrente est « à payer » à sa date. Elle ne devient une dépense, et le solde du portefeuille ne baisse, qu\'à la confirmation du paiement avec le montant réel.'],
    ['Ajustement de solde','Correction datée, avec son motif, quand le carnet diffère de ton solde réel. Elle n\'est pas une dépense.']];
  return `<section class="block"><p class="over">Démarrage et vocabulaire</p>${D.settings.opening_date?'':'<p class="hint">Tu n\'as pas encore indiqué tes soldes de départ.</p><div class="actions"><button type="button" class="btn-primary sm" data-act="startOnb">Lancer le démarrage guidé</button></div>'}
    <details data-keep="gopen" ${S.gopen?'open':''}><summary class="linkbtn">Les mots du carnet</summary><div class="ref" style="grid-template-columns:minmax(0,1fr)">${G.map(([t,d])=>`<span style="white-space:normal"><b>${t}</b><small style="display:block;white-space:normal">${d}</small></span>`).join('')}</div></details></section>`;
}
function renderSettings(){
  let h='';
  const months=[];for(let i=5;i>=0;i--)months.push(shiftM(S.month,-i));
  const sav=months.map(m=>incomeIn(m)?incomeIn(m)-spentIn(m):0);
  const allM=[...new Set([...allItems(),...incomes()].map(e=>e.date.slice(0,7)))].sort();
  const cumul=sumBy(allM.filter(m=>m<=S.month&&incomeIn(m)),m=>incomeIn(m)-spentIn(m));
  const max=Math.max(...sav.map(Math.abs),1), goal=D.settings.savings_goal||0, prop=incomeIn(S.month)?proposal(incomeIn(S.month)).saveAmt:0;
  h+=`<section class="block"><div class="block-head"><p class="over">Objectif d'épargne</p><small class="num">${allM[0]?'excédent cumulé depuis '+esc(mShort(allM[0]))+' '+allM[0].slice(0,4):''}</small></div>
    <div class="big num" style="font-size:28px;${cumul<0?'color:var(--danger)':''}">${fmtS(cumul)}</div>
    <div class="bars" style="height:128px">${months.map((m,i)=>{const v=sav[i];return `<div class="bar-col ${m===S.month?'cur':''}"><span class="bar-val num">${v?shortN(v):''}</span><div class="b ${v<0?'neg':''}" style="height:${v?Math.max(Math.abs(v)/max*80,2):0}%"></div></div>`}).join('')}</div>
    <div class="bar-labs">${months.map(m=>`<span class="${m===S.month?'cur':''}">${esc(mShort(m))}</span>`).join('')}</div>
    <p class="hint num">L'excédent (entrées moins dépenses) n'est de l'épargne que si tu le mets de côté : en ${esc(mName(S.month))}, ${fmt(savedAside(S.month))} ont été virés vers Épargne.</p>
    <div class="form-row" style="border-top:1px solid var(--mist-100);padding-top:12px"><span>Objectif par mois${prop?`<span class="meta" style="display:block">Proposé pour tes entrées : ${fmt(prop)}</span>`:''}</span><label class="field"><input class="r" id="goal" data-money inputmode="numeric" placeholder="${prop?group(prop):'0'}" value="${goal?group(goal):''}" aria-label="Objectif d'épargne mensuel"><span>FCFA</span></label></div>
    <div class="form-row"><span>Fonds d'urgence visé<span class="meta" style="display:block">en mois de dépenses essentielles, 3 à 6 conseillé</span></span><label class="field"><input class="r" id="emMonths" inputmode="numeric" value="${D.settings.emergency_months||3}" aria-label="Mois de fonds d'urgence"><span>mois</span></label></div>
    <div class="form-row"><span>Inflation annuelle<span class="meta" style="display:block">BEAC : 4,0 % en moyenne à fin mars 2025</span></span><label class="field"><input class="r" id="infl" inputmode="decimal" value="${String(D.settings.inflation).replace('.',',')}" aria-label="Inflation annuelle"><span>%</span></label></div>
    <div class="actions"><button type="button" class="btn-primary" data-act="saveGoal">Enregistrer</button></div></section>`;
  h+=cycleSettings();
  h+=categoriesManage();
  h+=renderFavSettings();
  const recAll=Object.values(D.recurring), recOn=recAll.filter(r=>r.active).length;
  h+=`<section class="block"><div class="block-head"><p class="over">Abonnements et dépenses récurrentes</p><small class="num">${fmt(fixedCharges())} par mois</small></div><p class="hint">${recAll.length?`${recOn} actif${recOn>1?'s':''} sur ${recAll.length}. `:''}Loyer, forfaits, abonnements en ligne : tout se gère dans l'onglet Plan, vue Abonnements, avec la carte prépayée, les prix en dollars ou en euros et les rappels avant chaque prélèvement.</p><div class="actions"><button type="button" class="btn sm" data-act="openSubs">Ouvrir les abonnements</button></div></section>`;
  h+=renderBackup();
  h+=renderReminders();
  h+=renderSecurity();
  h+=renderFeedback();
  h+=renderGuide();
  const standalone=STANDALONE();
  h+=`<section class="block"><p class="over">Application</p>${standalone?'<p class="hint">L\'application est installée sur cet appareil.</p>':installEvt?'<p class="hint">Installe le carnet sur ton écran d\'accueil pour l\'ouvrir comme une application, même sans connexion.</p><div class="actions"><button type="button" class="btn-primary" data-act="install">Installer l\'application</button></div>':installGuide()}</section>`;
  const off=!navigator.onLine||!sb, log=LS.get(K.synclog,[]);
  h+=`<section class="block"><p class="over">Compte et synchronisation</p><p class="hint">Tout ce que tu notes s'affiche tout de suite et est gardé sur ce téléphone. Dès que le réseau revient, les envois partent dans l'ordre ; en cas d'échec, le carnet réessaie tout seul (5 s, 15 s, 45 s, puis toutes les 5 minutes).</p>
    <div class="ref num"><span>Compte</span><span class="v">${esc(email||'-')}</span><span>État</span><span class="v">${off?'hors ligne':'en ligne'}</span><span>Envois en attente</span><span class="v">${outbox.length}</span><span>Dernière synchronisation</span><span class="v">${lastSync?esc(dateTimeFr(lastSync)):'-'}</span><span>Version</span><span class="v">${APP_VERSION}</span></div>
    ${lastErr&&outbox.length?msg('warning','Dernier incident',esc(lastErr)+'. Les '+outbox.length+' envoi(s) sont conservés et seront réessayés.'):''}
    <div class="actions"><button type="button" class="btn-primary sm" data-act="syncNow">${outbox.length?'Réessayer maintenant':'Synchroniser'}</button><button type="button" class="${S.armed==='logout'?'btn-danger':'btn'} sm" data-act="logout">${S.armed==='logout'?'Confirmer la déconnexion':'Se déconnecter'}</button></div>
    ${S.armed==='logout'?`<p class="hint">${outbox.length+rejected.length?`<b style="color:var(--danger)">${outbox.length+rejected.length} modification(s) non enregistrée(s) sur le serveur seront perdues.</b> `:''}La copie locale sera effacée de ce téléphone. Tes données restent sur le serveur.</p>`:''}
    ${log.length?`<details data-keep="lopen" ${S.lopen?'open':''}><summary class="linkbtn">Journal des synchronisations</summary><div class="ref num">${log.map(l=>`<span>${esc(dateTimeFr(l.t))}</span><span class="v" style="white-space:normal;${l.ok?'':'color:var(--danger)'}">${l.ok?'réussie':'échec'} · ${esc(l.msg)}</span>`).join('')}</div></details>`:''}</section>`;
  return h;
}

/* ---------- Connexion : messages clairs, mot de passe oublié, changement de mot de passe ---------- */
function authMsg(error){
  const m=String((error&&error.message)||error||''), st=error&&error.status, c=String((error&&(error.code||error.error_code))||'');
  if(!navigator.onLine||/fetch|network|load failed/i.test(m))return 'Pas de connexion Internet. Vérifie ton réseau, puis réessaie.';
  if(/not.?confirmed|email_not_confirmed/i.test(m+c))return 'Adresse non confirmée. Ouvre le lien reçu par courriel, puis connecte-toi.';
  if(st===429||/rate.?limit|too many|over_/i.test(m+c))return 'Trop de tentatives. Attends quelques minutes avant de réessayer.';
  if(/banned|disabled/i.test(m))return 'Ce compte est désactivé. Contacte l\'administrateur.';
  if(/reauth|recent/i.test(m+c))return 'Pour des raisons de sécurité, reconnecte-toi puis réessaie.';
  if(/same.?password|different/i.test(m+c))return 'Choisis un mot de passe différent de l\'ancien.';
  if(/weak|short|least/i.test(m+c))return 'Mot de passe trop faible : 8 caractères au moins, avec des lettres et des chiffres.';
  if(/invalid|credentials/i.test(m+c))return 'Adresse ou mot de passe incorrect. Vérifie ta saisie, ou touche « Mot de passe oublié ».';
  return 'Opération impossible pour le moment. Réessaie dans un instant.';
}
const COMMON_PWD=['12345678','123456789','1234567890','password','motdepasse','azertyui','azerty123','qwertyui','00000000','11111111'];
function pwdIssue(p,mail){
  if(p.length<8)return 'Le mot de passe doit contenir au moins 8 caractères.';
  if(COMMON_PWD.includes(p.toLowerCase())||/^(.)\1+$/.test(p))return 'Ce mot de passe est trop courant. Choisis-en un moins prévisible.';
  if(mail&&p.toLowerCase()===String(mail).toLowerCase())return 'Le mot de passe ne doit pas être ton adresse électronique.';
  if(!/[A-Za-z]/.test(p)||!/\d/.test(p))return 'Mélange des lettres et des chiffres.';
  return '';
}
const siteUrl=()=>location.href.split(/[?#]/)[0].replace(/index\.html$/,'');
async function changePwd(){
  const a=$('pw-new')?.value||'', b=$('pw-new2')?.value||'', err=m=>{$('pw-err').textContent=m;$('pw-err').hidden=false};
  if(!sb||!navigator.onLine)return err('Connexion Internet nécessaire pour changer le mot de passe.');
  const bad=pwdIssue(a,email);if(bad)return err(bad);
  if(a!==b)return err('Les deux mots de passe ne sont pas identiques.');
  $('pw-btn').disabled=true;
  try{const {error}=await sb.auth.updateUser({password:a});$('pw-btn').disabled=false;
    if(error)return err(authMsg(error));
    $('pw-new').value='';$('pw-new2').value='';$('pw-err').hidden=true;toast('Mot de passe modifié');
  }catch(e){if($('pw-btn'))$('pw-btn').disabled=false;err(authMsg(e))}
}

/* ---------- Sécurité : connexion mémorisée, Face ID, verrouillage ---------- */
function installGuide(){
  if(IOS)return `<div class="steps"><p class="hint">Installe le carnet comme une application : plein écran, icône sur l'écran d'accueil, ${BIO} et fonctionnement hors ligne.</p>
    <ol><li>Ouvre cette page dans <b>Safari</b>.</li><li>Touche le bouton <b>Partager</b> ${ic('share','s16')} en bas de l'écran.</li><li>Choisis <b>Sur l'écran d'accueil</b>, puis <b>Ajouter</b>.</li></ol></div>`;
  return '<p class="hint">Pour l\'installer : menu du navigateur puis « Installer l\'application » ou « Ajouter à l\'écran d\'accueil ».</p>';
}
function renderSecurity(){
  const pk=LS.get(K.passkey,false), lock=LS.get(K.lock,false);
  let h=`<section class="block"><p class="over">Sécurité</p>
    <div class="form-row"><span>Rester connecté sur cet appareil<span class="meta" style="display:block">Désactivé : il faudra se reconnecter à chaque ouverture.</span></span><label class="switch"><input type="checkbox" id="remember" ${remember()?'checked':''}><span></span></label></div>`;
  h+=`<div class="form-row"><span>Mode discret<span class="meta" style="display:block">Remplace les montants par des étoiles (****), pratique en public.</span></span><label class="switch"><input type="checkbox" id="discreetOpt" ${discreet()?'checked':''}><span></span></label></div>`;
  h+=`<details data-keep="pwopen" ${S.pwopen?'open':''}><summary class="linkbtn">Changer mon mot de passe</summary><div class="add"><label class="inp">Nouveau mot de passe<input type="password" id="pw-new" autocomplete="new-password" minlength="8"></label><label class="inp">Confirmer le nouveau mot de passe<input type="password" id="pw-new2" autocomplete="new-password"></label><p class="hint">8 caractères au moins, avec des lettres et des chiffres.</p><p class="err" id="pw-err" hidden></p><button type="button" class="btn-primary sm" id="pw-btn" data-act="changePwd">Changer le mot de passe</button></div></details>`;
  if(!HAS_WEBAUTHN)return h+`<p class="hint">Cet appareil ne prend pas en charge les clés d'accès biométriques.</p></section>`;
  h+=`<div class="form-row"><span>Connexion avec ${BIO}<span class="meta" style="display:block">${pk?'Clé d\'accès enregistrée sur cet appareil.':'Une clé d\'accès est créée et gardée dans ton trousseau. Aucun mot de passe à retaper.'}</span></span>${pk?pill('success','Activée'):`<button type="button" class="btn-primary sm" data-act="registerPasskey">Activer</button>`}</div>`;
  if(pk)h+=`<div class="form-row"><span>Verrouiller à l'ouverture<span class="meta" style="display:block">${BIO} est demandé à chaque ouverture et après 2 minutes en arrière-plan.</span></span><label class="switch"><input type="checkbox" id="lockOpt" ${lock?'checked':''}><span></span></label></div>`;
  return h+`<p class="hint">Ton mot de passe n'est jamais stocké par l'application. Pour le retenir, utilise le trousseau de ton téléphone : il te le propose à la première connexion.</p></section>`;
}
async function registerPasskey(){
  if(!sb||!navigator.onLine)return toast('Connexion Internet nécessaire pour activer '+BIO);
  try{
    const {error}=await sb.auth.registerPasskey();
    if(error)throw error;
    LS.set(K.passkey,true);toast(BIO+' activé');render();
  }catch(e){
    const m=String(e?.message||e);
    if(/cancel|abort|NotAllowed/i.test(m))return toast('Activation annulée');
    toast(/disabled|not enabled|passkey/i.test(m)&&!/cancel/i.test(m)?'Les clés d\'accès ne sont pas activées dans Supabase (voir le README)':'Activation impossible : '+m);
  }
}
let locked=false;
function showLock(){
  locked=true;$('sheetWrap').hidden=true;
  gate(`<div class="lock-screen"><span class="band-mark">${LOGO('#FFFFFF')}</span><h1>Carnet <em>verrouillé</em></h1>
    <button type="button" class="btn-action" id="unlockBtn">${ic('scan')}Déverrouiller avec ${BIO}</button>
    <p class="err" id="lockErr" hidden></p>
    <button type="button" class="linkbtn" id="pwdBtn">Utiliser mon mot de passe</button></div>`);
  $('unlockBtn').onclick=unlock;
  $('pwdBtn').onclick=()=>{locked=false;showLogin()};
  setTimeout(unlock,300);
}
async function unlock(){
  const err=m=>{$('lockErr').textContent=m;$('lockErr').hidden=false};
  try{
    if(sb&&navigator.onLine){
      const {data,error}=await sb.auth.signInWithPasskey();
      if(error)throw error;
      locked=false;return startApp(data.session,true);
    }
    // Hors ligne : vérification biométrique locale avec la clé de l'appareil
    const challenge=crypto.getRandomValues(new Uint8Array(32));
    const cred=await navigator.credentials.get({publicKey:{challenge,rpId:location.hostname,userVerification:'required',timeout:60000}});
    if(!cred)throw new Error('annulé');
    locked=false;startApp(null,true);
  }catch(e){err(/cancel|abort|NotAllowed|annul/i.test(String(e?.message||e))?'Déverrouillage annulé. Touche le bouton pour réessayer.':'Déverrouillage impossible. Utilise ton mot de passe.')}
}
async function passkeyLogin(){
  const err=x=>{$('l-err').textContent=x;$('l-err').hidden=false};
  try{const {data,error}=await sb.auth.signInWithPasskey();if(error)throw error;LS.set(K.passkey,true);startApp(data.session,true)}
  catch(e){const m=String(e?.message||e);err(/cancel|abort|NotAllowed/i.test(m)?'Connexion annulée.':'Aucune clé d\'accès trouvée. Connecte-toi avec ton mot de passe, puis active '+BIO+' dans Réglages.')}
}

/* ---------- Fenêtre de saisie ---------- */
const chips=(name,list)=>list.map(([k,l,c])=>`<label class="chip"><input type="radio" name="${name}" value="${esc(k)}"><span><i class="dot" style="background:${esc(c)}"></i>${esc(l)}</span></label>`).join('');
function refreshWalletChips(){if(!$('f-methods'))return;$('f-methods').innerHTML=chips('met',METHODS);$('f-from').innerHTML=chips('from',WALLETS);$('f-to').innerHTML=chips('to',WALLETS)}
function refreshCatChips(){if($('f-cats'))$('f-cats').innerHTML=chips('cat',CATS)}
function ensureChip(box,name,id,map=WAL){if(!id||!map[id]||!map[id].archived||document.querySelector(`input[name=${name}][value="${id}"]`))return;$(box).insertAdjacentHTML('beforeend',chips(name,[[id,map[id].label+(map===CAT?' (archivée)':' (archivé)'),map[id].color]]))}
function buildStatic(){
  $('f-cats').innerHTML=chips('cat',CATS);
  $('f-methods').innerHTML=chips('met',METHODS);
  $('f-srcs').innerHTML=chips('src',SOURCES);
  $('f-from').innerHTML=chips('from',WALLETS);
  $('f-to').innerHTML=chips('to',WALLETS);
  $('f-nats').innerHTML=chips('nat',[['besoin','Besoin','#04382A'],['envie','Envie','#F5C04A']]);
  $('f-mkind').innerHTML=Object.entries(MOVES).filter(([,v])=>!v.hidden).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('');
  $('tabs').innerHTML=TABS.map(([k,l,i])=>`<button type="button" data-tab="${k}"><span class="pil">${ic(i)}</span>${l}</button>`).join('');
  $('brandMark').innerHTML=LOGO('#FFFFFF');
  $('setBtn').innerHTML=ic('sliders','s16')+'Réglages';
  $('smsToggle').innerHTML=ic('message','s16')+' Remplir depuis un SMS Mobile Money';
  $('fab').innerHTML=ic('plus')+'Ajouter';
  $('closeBtn').innerHTML=ic('x');
  $('prevM').innerHTML=ic('left');$('nextM').innerHTML=ic('right');
}
const radio=(n,v)=>document.querySelectorAll(`input[name=${n}]`).forEach(i=>i.checked=i.value===v);
const radioVal=n=>document.querySelector(`input[name=${n}]:checked`)?.value;
function setKind(kind){
  S.kind=kind;const inc=kind==='income', mv=kind==='move', ex=kind==='expense';
  document.querySelectorAll('#kindSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.kind===kind));
  $('fs-cat').hidden=!ex;$('fs-nat').hidden=!ex;$('fs-met').hidden=!ex;$('fs-src').hidden=!inc;$('fs-mkind').hidden=!mv;
  const verb=S.editing?'Modifier ':'Nouvelle ';
  $('sheetTitle').textContent=ex?verb+'dépense':inc?verb+'entrée':(S.editing?'Modifier le mouvement':'Nouveau mouvement');
  $('f-note').placeholder=inc?'Ex. salaire octobre':mv?'Ex. retrait au kiosque':'Ex. marché Total';
  const q=inc?[50000,100000,200000,400000]:mv?[5000,10000,25000,50000]:[500,1000,2000,5000,10000];
  $('quick').innerHTML=q.map(v=>`<button type="button" data-quick="${v}">${shortRaw(v)}</button>`).join('');
  const fv=ex&&!S.editing&&!S.recPay?favorites():[];
  $('favchips').hidden=!fv.length;$('favchips').innerHTML=fv.length?`<span class="over">Habitudes</span>`+fv.map(f=>`<button type="button" data-favfill="${esc(f.key)}">${esc(f.label)} <b class="num">${shortRaw(f.amount)}</b></button>`).join(''):'';
  updateMoveFields();
}
function updateMoveFields(){
  const k=S.kind, mk=$('f-mkind').value, M=MOVES[mk];
  if(k==='income'){$('fs-from').hidden=true;$('fs-to').hidden=false;$('lg-to').textContent='Reçu sur';$('fs-plan').hidden=true}
  else if(k==='move'){
    $('fs-from').hidden=!M.from;$('fs-to').hidden=!M.to;$('lg-from').textContent='Depuis';$('lg-to').textContent='Vers';
    $('fs-plan').hidden=!M.plan;
    if(M.plan){const list=plans(M.plan).filter(p=>p.active!==false||p.id===S.editing?.ref_id);$('lg-plan').textContent=PLAN_LABEL[M.plan];
      const cur=$('f-plan').value;$('f-plan').innerHTML=list.length?list.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join(''):`<option value="">Aucun : crée-le d'abord dans Plan</option>`;
      if(list.some(p=>p.id===cur))$('f-plan').value=cur}
  }else{$('fs-from').hidden=true;$('fs-to').hidden=true;$('fs-plan').hidden=true}
  const from=k==='move'?radioVal('from'):radioVal('met'), to=k==='move'?radioVal('to'):null;
  const momoFee=(k==='expense'||(k==='move'&&M.from))&&MOMO.has(from), cardFee=k==='move'&&!!M.from&&!!M.to&&CARD.has(to);
  $('fs-fee').hidden=!(momoFee||cardFee);
  $('fee-lg').textContent=cardFee?'Frais de transfert et de recharge (FCFA)':'Frais Mobile Money (FCFA)';
}
function openSheet(item,kind,preset){
  S.editing=item||null;S.confirmDel=false;S.natTouched=!!(item&&item.nature);
  const rp=preset&&preset.recPay&&D.recurring[preset.recPay.rid]?preset.recPay:null, RR=rp?D.recurring[rp.rid]:null;S.recPay=rp;
  if(RR)item=null;
  $('kindSeg').hidden=!!item||!!RR;$('smsBox').hidden=!!item||!!RR;$('smsArea').hidden=true;$('smsText').value='';$('smsInfo').hidden=true;$('catHint').hidden=true;S.catTouched=!!item;
  if(kind==='move')$('f-mkind').value=item?.kind||preset?.kind||'transfer';
  setKind(kind||'expense');
  if(RR)$('sheetTitle').textContent='Confirmer le paiement : '+RR.label+' ('+mName(rp.m)+')';
  $('f-save').textContent=RR?'Confirmer le paiement':'Enregistrer';
  $('f-amount').value=item?group(item.amount):RR?group(RR.amount):'';
  refreshWalletChips();refreshCatChips();ensureChip('f-cats','cat',RR?RR.category:item?.category,CAT);ensureChip('f-methods','met',RR?RR.method:item?.method);ensureChip('f-to','to',item?.wallet);ensureChip('f-from','from',item?.from_wallet);ensureChip('f-to','to',item?.to_wallet);
  radio('cat',RR?RR.category:item?.category||'');
  radio('nat',item?natureOf(item):RR?(NEED.has(RR.category)?'besoin':'envie'):'');
  radio('met',RR?RR.method:item?.method||lastMet());
  radio('src',item?.source||'salaire');
  if(kind==='income')radio('to',item?.wallet||'banque');
  if(kind==='move'){const M=MOVES[$('f-mkind').value];radio('from',item?.from_wallet||(M.from?lastMet():''));radio('to',item?.to_wallet||M.fixedTo||(M.to&&M.from?'epargne':M.to?'especes':''));
    if(!item&&preset){if(preset.from&&WAL[preset.from])radio('from',preset.from);if(preset.to&&WAL[preset.to])radio('to',preset.to)}}
  updateMoveFields();
  if(item?.ref_id||preset?.ref)$('f-plan').value=item?.ref_id||preset.ref;
  $('f-fee').value=item?.fee?group(item.fee):RR&&RR.fee?group(RR.fee):'';
  if(!item&&preset&&preset.fee>0)$('f-fee').value=group(preset.fee);
  let d=todayISO();if(!item&&!RR&&d.slice(0,7)!==S.month)d=S.month+'-01';
  $('f-date').value=item?item.date:d;
  $('f-note').value=item?.note||(RR?RR.label:'');
  if(RR)S.catTouched=true;
  if(preset&&preset.amount>0)$('f-amount').value=group(preset.amount);
  if(preset&&preset.method&&WAL[preset.method]&&!WAL[preset.method].archived){radio('met',preset.method);updateMoveFields()}
  if(preset&&preset.note)$('f-note').value=String(preset.note).slice(0,120);
  $('coach').hidden=!(preset&&preset.coach);
  $('f-del').hidden=!item;$('f-del').textContent='Supprimer';
  $('f-err').hidden=true;$('f-keep').checked=true;updateKeep();
  $('sheetWrap').hidden=false;document.documentElement.classList.add('modal');
  setTimeout(()=>$('f-amount').focus(),60);
}
function closeSheet(){$('fs-keep').hidden=true;$('coach').hidden=true;$('sheetWrap').hidden=true;document.documentElement.classList.remove('modal');S.editing=null;S.recPay=null;$('f-save').textContent='Enregistrer'}
function formErr(m){$('f-err').textContent=m;$('f-err').hidden=false}
function saveSheet(ev){
  ev.preventDefault();
  const amount=toInt($('f-amount').value), date=$('f-date').value, note=$('f-note').value.trim().slice(0,120), now=nowISO();
  if(!(amount>0))return formErr('Indique un montant supérieur à 0.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return formErr('Indique une date.');
  const base={id:S.editing?.id||newId(),amount,date,note,created_at:S.editing?.created_at||now,updated_at:now};
  let op, extraOps=[];
  if(S.kind==='income'){
    op={t:'incomes',op:'upsert',row:Object.assign(base,{source:radioVal('src')||'autre',wallet:radioVal('to')||'banque'})};
  }else if(S.kind==='move'){
    const kind=$('f-mkind').value, M=MOVES[kind], from=M.from?radioVal('from'):null, to=M.fixedTo||(M.to?radioVal('to'):null), ref=M.plan?$('f-plan').value:null;
    if(M.from&&!from)return formErr('Choisis le portefeuille de départ.');
    if(M.to&&!to)return formErr('Choisis le portefeuille d\'arrivée.');
    if(kind==='transfer'&&from===to)return formErr('Choisis deux portefeuilles différents.');
    if(M.plan&&!ref)return formErr('Crée d\'abord ce '+PLAN_LABEL[M.plan].toLowerCase()+' dans l\'onglet Plan.');
    const fee=M.from&&(MOMO.has(from)||(M.to&&CARD.has(to)))?toInt($('f-fee').value):0;
    op={t:'moves',op:'upsert',row:Object.assign(base,{kind,fee,from_wallet:from,to_wallet:to,ref_id:ref})};
  }else{
    const category=radioVal('cat'), method=radioVal('met');
    if(!category)return formErr('Choisis une catégorie.');
    if(!method)return formErr('Choisis un moyen de paiement.');
    const nat=radioVal('nat'), def=NEED.has(category)?'besoin':'envie';
    const RP=S.recPay&&D.recurring[S.recPay.rid]?S.recPay:null;
    if(RP)base.id=recPaidId(D.recurring[RP.rid],RP.m);
    op={t:'expenses',op:'upsert',row:Object.assign(base,{category,method,fee:MOMO.has(method)?toInt($('f-fee').value):0,nature:nat&&nat!==def?nat:null,recurring_id:RP?RP.rid:(S.editing?.recurring_id||null)})};
    if(RP){const r=D.recurring[RP.rid], last=advancedLast(r,RP.m), L=!$('fs-keep').hidden&&$('f-keep').checked?subLearn(r,amount):null;
      extraOps=(L||last!==r.last_month)?[recOp(L?L.row:r,last),...(L?L.more:[])]:[]}
    LS.set(K.met,method);
  }
  const wasEdit=!!S.editing, kind=S.kind, wasPay=!!S.recPay;closeSheet();
  if(date.slice(0,7)!==S.month)S.month=date.slice(0,7);
  mutate([op,...extraOps]);
  toast(wasPay?'Paiement confirmé : '+fmtRaw(amount):wasEdit?'Modification enregistrée':(kind==='income'?'Entrée enregistrée : ':kind==='move'?'Mouvement enregistré : ':'Dépense enregistrée : ')+fmtRaw(amount),wasPay||wasEdit?undefined:undoOps([op]));
}
function deleteSheet(){
  if(!S.editing)return;
  if(!S.confirmDel){S.confirmDel=true;$('f-del').textContent='Confirmer la suppression';return}
  const t=S.kind==='income'?'incomes':S.kind==='move'?'moves':'expenses', id=S.editing.id, ops=[{t,op:'delete',id}];
  // Un paiement de charge récurrente supprimé repasse « À payer »
  const mm=t==='expenses'?/^rec-(.+)-(\d{4}-\d{2})$/.exec(id):null;
  if(mm&&D.recurring[mm[1]]&&D.recurring[mm[1]].last_month>=mm[2])ops.push(recOp(D.recurring[mm[1]],shiftM(mm[2],-1)));
  closeSheet();mutate(ops);toast(mm?'Supprimé : la charge repasse à payer':'Supprimé');
}

/* ---------- Actions ---------- */
function smsParse(){
  const r=parseSMS($('smsText').value), info=$('smsInfo');info.hidden=false;
  if(!r){info.textContent='Montant introuvable dans ce SMS. Vérifie qu\'il contient bien une somme en FCFA.';info.style.color='var(--danger)';return}
  info.style.color='';
  if(r.kind==='withdraw'){$('f-mkind').value='transfer';setKind('move');radio('from',r.op||'mtn');radio('to','especes')}
  else if(r.kind==='income'){setKind('income');radio('to',r.op||'mtn');radio('src','autre')}
  else{setKind('expense');radio('met',r.op||lastMet())}
  updateMoveFields();
  $('f-amount').value=group(r.amount);
  if(r.fee){$('f-fee').value=group(r.fee)}
  if(r.date)$('f-date').value=r.date;
  const note=r.kind==='withdraw'?'Retrait '+(WAL[r.op]?.label||''):r.who||'';
  if(note)$('f-note').value=note.slice(0,120);
  if(r.kind==='expense')suggestCat();
  info.textContent=`Lu : ${r.kind==='withdraw'?'retrait':r.kind==='income'?'argent reçu':'paiement'} de ${fmtRaw(r.amount)}${r.fee?`, frais ${fmtRaw(r.fee)}`:''}${r.date?`, le ${dFr(r.date)}`:''}${r.op?` sur ${WAL[r.op].label}`:''}. Vérifie puis enregistre.`;
}
function suggestCat(){
  if(S.kind!=='expense')return;
  const c=guessCategory($('f-note').value), h=$('catHint');
  if(!c){h.hidden=true;return}
  h.hidden=false;h.textContent='Catégorie proposée d\'après la note : '+CAT[c].label+'.';
  if(!S.catTouched){radio('cat',c);if(!S.natTouched)radio('nat',NEED.has(c)?'besoin':'envie')}
}
// Valeurs inconnues ou inattendues venant de la base (autre appareil, import ancien, donnée altérée) : repli sûr à l'affichage, sans toucher la base
function normalizeData(){
  const wal=w=>w&&WAL[w]?w:null;
  for(const e of Object.values(D.expenses)){if(!CAT[e.category])e.category='autres';if(!wal(e.method))e.method='especes'}
  for(const e of Object.values(D.incomes)){if(!SRC[e.source])e.source='autre';if(!wal(e.wallet))e.wallet='banque'}
  for(const e of Object.values(D.recurring)){if(!CAT[e.category])e.category='autres';if(!wal(e.method))e.method='especes'}
  for(const [id,m] of Object.entries(D.moves)){if(!MOVES[m.kind]){delete D.moves[id];continue}m.from_wallet=wal(m.from_wallet);m.to_wallet=wal(m.to_wallet)}
  for(const [id,p] of Object.entries(D.plans)){if(!PLAN_LABEL[p.type]){delete D.plans[id];continue}if(!p.data||typeof p.data!=='object'||Array.isArray(p.data))p.data={}}
}
function walletsManage(){
  const id=S.wedit, isNew=id==='new', cur=isNew?null:WAL[id], isBase=!isNew&&BASE_WALLETS.some(b=>b[0]===id);
  const rows=Object.entries(WAL).map(([k,w])=>`<div class="rowbtn" style="cursor:default"><span class="wicon" style="color:${esc(w.color)}">${ic(k==='epargne'?'shield':'wallet')}</span><span class="t"><span>${esc(w.label)}${w.archived?' (archivé)':''}</span><span>${k==='epargne'?'épargne':esc((WKIND[w.kind]||'').toLowerCase())}</span></span><button type="button" class="pill" data-wedit="${esc(k)}">Modifier</button></div>`).join('');
  let form='';
  if(isNew||cur){
    const color=cur?cur.color:WCOLORS[5], kind=cur?cur.kind:(isNew&&S.wpreset==='card'?'card':'cash');
    form=`<div class="add"><p class="over">${isNew?'Nouveau portefeuille':'Modifier le portefeuille'}</p>
      <label class="inp">Nom<input id="wf-name" maxlength="30" value="${esc(cur?cur.label:(isNew&&S.wpreset==='card'?'Carte prépayée':''))}" placeholder="Ex. Compte Ecobank"></label>
      <fieldset><legend>Couleur</legend><div class="chips">${WCOLORS.map(c=>`<label class="chip" title="${esc(c)}"><input type="radio" name="wf-color" value="${esc(c)}" ${c===color?'checked':''}><span aria-label="Couleur ${esc(c)}" style="padding:10px"><i class="dot" style="background:${esc(c)};width:22px;height:22px;margin:0"></i></span></label>`).join('')}</div></fieldset>
      ${isBase?'':`<label class="inp">Type<select id="wf-kind">${Object.entries(WKIND).map(([k,v])=>`<option value="${k}" ${k===kind?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`}
      ${id==='epargne'?'':`<label class="check"><input type="checkbox" id="wf-pro" ${cur&&cur.pro?'checked':''}> Compte professionnel (suivi à part dans la vue Pro)</label>`}
      ${isNew?'<label class="inp">Solde de départ (FCFA)<input id="wf-open" data-money inputmode="numeric" placeholder="0"></label>':''}
      <p class="err" id="wf-err" hidden></p>
      <div class="actions"><button type="button" class="btn-primary sm" data-act="saveWallet">Enregistrer</button><button type="button" class="pill" data-act="cancelWallet">Annuler</button>${(!isNew&&id!=='epargne'&&id!=='especes')?`<button type="button" class="pill ${S.armed==='wal:'+id?'danger':''}" data-act="archiveWallet">${cur.archived?'Restaurer':(S.armed==='wal:'+id?'Confirmer l\'archivage':'Archiver')}</button>`:''}</div>
      ${(!isNew&&id!=='epargne'&&id!=='especes'&&!cur.archived)?'<p class="hint">Archiver masque le portefeuille des saisies. Ton historique est conservé et tu peux le restaurer. Le solde doit être à 0.</p>':''}</div>`;
  }
  return `<details data-keep="wopen" ${S.wopen?'open':''}><summary class="linkbtn">${ic('sliders','s16')} Gérer mes portefeuilles</summary><div class="add"><div class="rows">${rows}</div>${isNew||cur?'':`<div class="actions"><button type="button" class="btn-primary sm" data-act="newWallet">${ic('plus','s16')}Ajouter un portefeuille</button></div>`}</div>${form}</details>`;
}
function saveWallet(){
  const id=S.wedit, isNew=id==='new', err=m=>{$('wf-err').textContent=m;$('wf-err').hidden=false};
  const name=$('wf-name').value.trim().replace(/\s+/g,' ').slice(0,30);
  if(!name)return err('Indique un nom.');
  if(Object.entries(WAL).some(([k,w])=>k!==id&&w.label.toLowerCase()===name.toLowerCase()))return err('Ce nom existe déjà.');
  const cfg=cfgWallets().slice(), wid=isNew?'w-'+newId().replace(/-/g,'').slice(0,10):id, base=BASE_WALLETS.some(b=>b[0]===wid);
  if(isNew&&cfg.filter(w=>!BASE_WALLETS.some(b=>b[0]===w.id)).length>=12)return err('12 portefeuilles ajoutés au maximum.');
  const entry=Object.assign({},cfg.find(w=>w.id===wid)||{},{id:wid,label:name,color:WCOLORS.includes(radioVal('wf-color'))?radioVal('wf-color'):'#64748B'});
  if(!base){const k=$('wf-kind')?.value;entry.kind=WKIND[k]?k:'other'}
  entry.pro=wid!=='epargne'&&!!$('wf-pro')?.checked;
  const i=cfg.findIndex(w=>w.id===wid);if(i>=0)cfg[i]=entry;else cfg.push(entry);
  const opening=Object.assign({},D.settings.opening,{__wallets:cfg});
  if(isNew){const v=toInt($('wf-open')?.value);if(v)opening[wid]=v}
  S.wedit=null;S.wpreset=null;S.wopen=true;mutate([settingsRow({opening})]);toast(isNew?'Portefeuille ajouté':'Portefeuille modifié');
}
function archiveWallet(){
  const id=S.wedit, w=WAL[id];if(!w||id==='new'||id==='especes'||id==='epargne')return;
  if(!w.archived){
    if(Math.round(balance(id))!==0){toast('Solde non nul : transfère d\'abord '+fmtRaw(balance(id))+' vers un autre portefeuille.');return}
    if(S.armed!=='wal:'+id){S.armed='wal:'+id;S.wopen=true;render();return}
  }
  S.armed=null;const cfg=cfgWallets().slice(), i=cfg.findIndex(x=>x.id===id), archived=!w.archived;
  if(i>=0)cfg[i]=Object.assign({},cfg[i],{archived});else cfg.push({id,label:w.label,color:w.color,archived});
  S.wedit=null;S.wopen=true;mutate([settingsRow({opening:Object.assign({},D.settings.opening,{__wallets:cfg})})]);toast(archived?'Portefeuille archivé':'Portefeuille restauré');
}
function categoriesManage(){
  const id=S.cedit, isNew=id==='new', cur=isNew?null:CAT[id], editable=!!cur&&id!=='frais';
  const used={};for(const e of expenses())used[e.category]=(used[e.category]||0)+1;
  const rows=Object.entries(CAT).filter(([k])=>k!=='frais').map(([k,c])=>`<div class="rowbtn" style="cursor:default"><span class="dot" style="background:${esc(c.color)}"></span><span class="t"><span>${esc(c.label)}${c.archived?' (archivée)':''}</span><span>${c.base?'catégorie de base':'ajoutée par toi'} · ${NEED.has(k)?'besoin':'envie'}${used[k]?' · '+used[k]+' dépense'+(used[k]>1?'s':''):''}</span></span><button type="button" class="pill" data-cedit="${esc(k)}">Modifier</button></div>`).join('');
  const have=new Set(Object.values(CAT).map(c=>c.label.toLowerCase()));
  const presets=CAT_PRESETS.map((p,i)=>[p,i]).filter(([p])=>!have.has(p.label.toLowerCase()));
  let form='';
  if(isNew||editable){
    const color=cur?cur.color:CCOLORS[11], base=!!cur&&cur.base, need=cur?NEED.has(id):false;
    const words=cur?((cfgCats().find(c=>c&&c.id===id)||{}).words||[]):[];
    form=`<div class="add"><p class="over">${isNew?'Nouvelle catégorie':'Modifier la catégorie'}</p>
      <label class="inp">Nom<input id="cf-name" maxlength="30" value="${esc(cur?cur.label:'')}" placeholder="Ex. Dîme et offrandes"></label>
      <fieldset><legend>Couleur</legend><div class="chips">${CCOLORS.map(c=>`<label class="chip"><input type="radio" name="cf-color" value="${esc(c)}" ${c===color?'checked':''}><span aria-label="Couleur ${esc(c)}" style="padding:10px"><i class="dot" style="background:${esc(c)};width:22px;height:22px;margin:0"></i></span></label>`).join('')}</div></fieldset>
      ${base?'':`<fieldset><legend>Nature</legend><div class="chips">${[['besoin','Besoin'],['envie','Envie']].map(([v,l])=>`<label class="chip"><input type="radio" name="cf-nat" value="${v}" ${(need?'besoin':'envie')===v?'checked':''}><span>${l}</span></label>`).join('')}</div></fieldset>`}
      <label class="check"><input type="checkbox" id="cf-pro" ${cur&&cur.pro?'checked':''}> Dépense professionnelle (suivie à part dans la vue Pro)</label>
      <label class="inp">Mots qui reconnaissent cette catégorie<input id="cf-words" maxlength="200" value="${esc(words.join(', '))}" placeholder="Ex. dîme, offrande, église"></label>
      <p class="hint">Quand l'un de ces mots apparaît dans la note d'une dépense, la catégorie est proposée toute seule. Sépare les mots par des virgules.</p>
      <p class="err" id="cf-err" hidden></p>
      <div class="actions"><button type="button" class="btn-primary sm" data-act="saveCat">Enregistrer</button><button type="button" class="pill" data-act="cancelCat">Annuler</button>${(!isNew&&!base)?`<button type="button" class="pill ${S.armed==='cat:'+id?'danger':''}" data-act="archiveCat">${cur.archived?'Restaurer':(S.armed==='cat:'+id?'Confirmer l\'archivage':'Archiver')}</button>`:''}</div>
      ${(!isNew&&!base&&!cur.archived)?'<p class="hint">Archiver masque la catégorie des saisies. Les dépenses déjà notées sont conservées et tu peux la restaurer. Le budget doit être vide.</p>':''}</div>`;
  }
  return `<section class="block"><p class="over">Catégories</p><p class="hint">Ajoute les postes de ta vie réelle : dîme, solidarité, coiffure, scolarité. Les 11 catégories de base restent disponibles et tu peux les renommer.</p>
    <details data-keep="copen" ${S.copen?'open':''}><summary class="linkbtn">${ic('sliders','s16')} Gérer mes catégories</summary>
      ${presets.length&&!isNew&&!editable?`<div class="add"><p class="over">Suggestions</p><div class="actions">${presets.map(([p,i])=>`<button type="button" class="pill" data-cpreset="${i}">${ic('plus','s16')} ${esc(p.label)}</button>`).join('')}</div></div>`:''}
      <div class="add"><div class="rows">${rows}</div>${isNew||editable?'':`<div class="actions"><button type="button" class="btn-primary sm" data-act="newCat">${ic('plus','s16')}Ajouter une catégorie</button></div>`}</div>${form}
    </details></section>`;
}
const catSettings=extra=>settingsRow({opening:Object.assign({},D.settings.opening,{__cats:extra})});
function saveCat(){
  const id=S.cedit, isNew=id==='new', err=m=>{$('cf-err').textContent=m;$('cf-err').hidden=false};
  const name=$('cf-name').value.trim().replace(/\s+/g,' ').slice(0,30);
  if(!name)return err('Indique un nom.');
  if(Object.entries(CAT).some(([k,c])=>k!==id&&c.label.toLowerCase()===name.toLowerCase()))return err('Ce nom existe déjà.');
  const cfg=cfgCats().slice();
  if(isNew&&cfg.filter(c=>c&&!BASE_CATS.some(b=>b[0]===c.id)).length>=CAT_MAX)return err(CAT_MAX+' catégories ajoutées au maximum.');
  const cid=isNew?'c-'+newId().replace(/-/g,'').slice(0,10):id, base=BASE_CATS.some(b=>b[0]===cid), color=radioVal('cf-color');
  const entry=Object.assign({},cfg.find(c=>c&&c.id===cid)||{},{id:cid,label:name,color:CCOLORS.includes(color)?color:CCOLORS[11],words:cleanWords($('cf-words').value.split(/[,;\n]/))});
  if(!base)entry.need=radioVal('cf-nat')==='besoin';
  entry.pro=!!$('cf-pro')?.checked;
  const i=cfg.findIndex(c=>c&&c.id===cid);if(i>=0)cfg[i]=entry;else cfg.push(entry);
  S.cedit=null;S.copen=true;mutate([catSettings(cfg)]);toast(isNew?'Catégorie ajoutée':'Catégorie modifiée');
}
function addPreset(i){
  const p=CAT_PRESETS[i];if(!p)return;
  const cfg=cfgCats().slice();if(cfg.filter(c=>c&&!BASE_CATS.some(b=>b[0]===c.id)).length>=CAT_MAX)return toast(CAT_MAX+' catégories ajoutées au maximum');
  if(Object.values(CAT).some(c=>c.label.toLowerCase()===p.label.toLowerCase()))return;
  cfg.push({id:'c-'+newId().replace(/-/g,'').slice(0,10),label:p.label,color:p.color,need:p.need,words:p.words});
  S.copen=true;mutate([catSettings(cfg)]);toast('Catégorie ajoutée : '+p.label);
}
function archiveCat(){
  const id=S.cedit, c=CAT[id];if(!c||c.base||id==='new'||id==='frais')return;
  if(!c.archived){
    if((D.budgets[id]||0)>0){toast('Un budget existe sur cette catégorie : vide-le dans Plan, puis archive.');return}
    if(Object.values(D.recurring).some(r=>r.active&&r.category===id)){toast('Une dépense récurrente active utilise cette catégorie.');return}
    if(S.armed!=='cat:'+id){S.armed='cat:'+id;S.copen=true;render();return}
  }
  S.armed=null;const cfg=cfgCats().slice(), i=cfg.findIndex(x=>x&&x.id===id), archived=!c.archived;
  if(i>=0)cfg[i]=Object.assign({},cfg[i],{archived});else cfg.push({id,label:c.label,color:c.color,need:NEED.has(id),words:CUSTOM_WORDS[id]||[],archived});
  S.cedit=null;S.copen=true;mutate([catSettings(cfg)]);toast(archived?'Catégorie archivée':'Catégorie restaurée');
}
function addAsset(){
  const name=$('as-name').value.trim(), value=toInt($('as-value').value), err=m=>{$('as-err').textContent=m;$('as-err').hidden=false};
  if(!name)return err('Indique un nom.');if(!(value>0))return err('Indique une valeur.');
  mutate([settingsRow({opening:Object.assign({},D.settings.opening,{__biens:[...assets(),{id:newId(),name:name.slice(0,40),value}]})})]);toast('Bien ajouté');
}
function delAsset(id){
  if(S.armed!=='asset:'+id){S.armed='asset:'+id;render();return}
  S.armed=null;mutate([settingsRow({opening:Object.assign({},D.settings.opening,{__biens:assets().filter(a=>a.id!==id)})})]);toast('Bien retiré');
}
function restToSavings(){
  const T=toAllocate(S.month);if(!T||T.rest<=0)return;
  mutate([settingsRow({savings_goal:savingsGoal(S.month)+T.rest})]);toast('Épargne visée : '+fmtRaw(savingsGoal(S.month)));
}
function exportICS(){
  const ics=buildICS();if(!/VEVENT/.test(ics))return toast('Aucune échéance à exporter');
  download('carnet-echeances.ics',ics,'text/calendar;charset=utf-8');toast('Ouvre le fichier pour ajouter les échéances à ton calendrier');
}
function saveBudgets(){
  const ops=[],now=nowISO();
  document.querySelectorAll('[data-bud]').forEach(i=>{const c=i.dataset.bud,v=toInt(i.value),old=D.budgets[c]||0;
    if(v>0&&v!==old)ops.push({t:'budgets',op:'upsert',row:{category:c,amount:v,updated_at:now}});
    if(!v&&old)ops.push({t:'budgets',op:'delete',key:c})});
  if(!ops.length)return toast('Aucun changement');
  mutate(ops);toast('Budgets enregistrés');
}
function applyOwn(){
  const ms=ownMonths();if(!ms.length)return;
  if(hasBudgets()&&S.armed!=='own'){S.armed='own';render();return}
  S.armed=null;const now=nowISO(), ops=[];
  for(const c of Object.keys(CAT)){if(CAT[c].archived||c==='frais')continue;const a=ownAvg(c);if(a>0)ops.push({t:'budgets',op:'upsert',row:{category:c,amount:Math.max(500,r500(a)),updated_at:now}})}
  if(!ops.length)return toast('Pas assez de dépenses notées');
  mutate(ops);toast('Budgets calés sur tes dépenses réelles (moyenne de '+ms.length+' mois)');
}
function applyProposal(){
  const R=incomeIn(S.month);if(!R)return;
  if(hasBudgets()&&S.armed!=='prop'){S.armed='prop';render();return}
  S.armed=null;const P=proposal(R),now=nowISO();
  mutate(Object.entries(P.amt).map(([category,amount])=>({t:'budgets',op:'upsert',row:{category,amount,updated_at:now}})));
  toast('Budgets appliqués');
}
const settingsRow=extra=>({t:'settings',op:'upsert',row:Object.assign({savings_goal:D.settings.savings_goal||0,opening:D.settings.opening||{},opening_date:D.settings.opening_date||null,emergency_months:D.settings.emergency_months||3,inflation:D.settings.inflation??4},extra,{updated_at:nowISO()})});
function saveGoal(){
  const em=Math.min(24,Math.max(1,toInt($('emMonths').value)||3)), inf=parseFloat(String($('infl').value).replace(',','.'));
  mutate([settingsRow({savings_goal:toInt($('goal').value),emergency_months:em,inflation:isFinite(inf)?Math.max(-20,Math.min(100,inf)):4})]);toast('Réglages enregistrés');
}
function saveOpening(){
  const op=Object.assign({},D.settings.opening);WALLETS.forEach(([w])=>{const v=toInt($('op-'+w).value);if(v)op[w]=v;else delete op[w]});
  const d=$('op-date').value||todayISO();
  mutate([settingsRow({opening:op,opening_date:d})]);toast('Soldes de départ enregistrés');
}
function addPlan(type){
  const box=document.querySelector(`[data-form="${type}"]`), v=id=>box.querySelector('#'+id)?.value||'';
  const err=m=>{const e=box.querySelector(`[data-err="${type}"]`);e.textContent=m;e.hidden=false};
  const name=v('p-name').trim(), amount=toInt(v('p-amount')), now=nowISO(), id=newId();
  if(!name)return err(type==='loan'?'Indique la personne.':type==='debt'?'Indique le prêteur.':'Indique un nom.');
  if(!(amount>0))return err('Indique un montant.');
  const data={};const ops=[];
  if(type==='project'){if(v('p-due'))data.due=v('p-due')}
  if(type==='tontine'){data.frequency=v('p-freq');data.members=Math.max(2,toInt(v('p-members'))||2);data.turn=Math.min(data.members,Math.max(1,toInt(v('p-turn'))||1));data.start=v('p-start')||todayISO()}
  if(type==='loan'||type==='debt'){data.person=name;if(v('p-due'))data.due=v('p-due');const w=v('p-wallet')||'especes';
    ops.push({t:'moves',op:'upsert',row:{id:newId(),kind:type==='loan'?'loan_out':'debt_in',amount,fee:0,date:todayISO(),from_wallet:type==='loan'?w:null,to_wallet:type==='debt'?w:null,ref_id:id,note:'',created_at:now,updated_at:now}})}
  mutate([{t:'plans',op:'upsert',row:{id,type,name:name.slice(0,60),amount,data,active:true,created_at:now,updated_at:now}},...ops]);
  toast(PLAN_LABEL[type]+' enregistré'+(type==='tontine'||type==='debt'?'e':''));
}
function delPlan(id){
  if(S.armed!=='plan:'+id){S.armed='plan:'+id;render();return}
  S.armed=null;const p=D.plans[id];if(!p)return;
  mutate([{t:'plans',op:'upsert',row:Object.assign({},p,{active:false,updated_at:nowISO()})}]);toast('Retiré. Les mouvements déjà saisis sont conservés.');
}
function toggleRec(id){
  const r=D.recurring[id];if(!r)return;
  // À la reprise, les mois passés pendant la pause ne reviennent pas en retard : on repart du mois en cours
  const last=!r.active&&recStart(r)<shiftM(curM(),-1)?shiftM(curM(),-1):r.last_month;
  mutate([{t:'recurring',op:'upsert',row:Object.assign({},r,{active:!r.active,last_month:last,updated_at:nowISO()})}]);
}
function delRec(id){
  if(S.armed!=='rec:'+id){S.armed='rec:'+id;render();return}
  S.armed=null;const ops=[{t:'recurring',op:'delete',id}];
  if(subM(id)){const b=subBase();delete b.m[id];ops.push(subSettingsOp(b))}
  mutate(ops);toast('Retiré. Les dépenses déjà ajoutées sont conservées.');
}

function download(name,text,type){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
function exportCSV(scope){
  const pro=hasPro(), list=(scope==='month'?monthItems(S.month):allItems().filter(e=>inScope(isProExp(e)))).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  if(!list.length)return toast('Aucune dépense à exporter');
  const q=s=>{let v=String(s??'');if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};
  const lines=['Date;Catégorie;Nature;Moyen de paiement;Montant (FCFA);Frais (FCFA);Note;Récurrente'+(pro?';Usage':'')];
  for(const e of list)lines.push([dFr(e.date),q(CAT[e.category]?.label||e.category),natureOf(e)==='besoin'?'Besoin':'Envie',q(WAL[e.method]?.label||e.method),e.amount,e.fee||0,q(e.note),e.recurring_id?'oui':''].concat(pro?[isProExp(e)?'Pro':'Perso']:[]).join(';'));
  lines.push(['','','','Total',sumBy(list,e=>e.amount),sumBy(list,e=>e.fee||0),'',''].concat(pro?['']:[]).join(';'));
  const sfx=scopeOn()==='all'?'':'-'+scopeOn();
  download(scope==='month'?`depenses-${S.month}${sfx}.csv`:`depenses-historique-${todayISO()}${sfx}.csv`,'﻿'+lines.join('\r\n'),'text/csv;charset=utf-8');
}
async function exportJson(){
  const r=await saveFile(`carnet-depenses-sauvegarde-${todayISO()}.json`,JSON.stringify(backupObject(),null,2),'application/json');
  if(r!=='cancelled'){LS.set(K.fileBk,Date.now());toast(r==='shared'?'Sauvegarde envoyée':'Sauvegarde téléchargée');if(S.tab==='settings'||S.tab==='dash')render()}
}
function parseBackup(txt){
  const j=JSON.parse(txt);
  if(!j||j.app!=='carnet-depenses')throw new Error('Ce fichier n\'est pas une sauvegarde du Carnet de dépenses.');
  const bc=new Set(cleanCats(((j.settings&&j.settings.opening)||{}).__cats).map(c=>c.id)), COK=id=>!!id&&id!=='frais'&&(!!CAT[id]||bc.has(String(id)));
  const bw=new Set(cleanWallets(((j.settings&&j.settings.opening)||{}).__wallets).map(w=>w.id)), WOK=id=>!!id&&(!!WAL[id]||bw.has(String(id))), metOk=m=>(WOK(m)&&m!=='epargne')?m:'especes';
  const okD=d=>typeof d==='string'&&/^(20\d\d|2100)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(d), now=nowISO(), str=(s,n)=>String(s||'').slice(0,n);
  const ex=(j.expenses||[]).filter(e=>e&&SAFE_ID(e.id)&&e.amount>0&&e.amount<1e9&&okD(e.date)).map(e=>({id:String(e.id),amount:Math.round(e.amount),fee:Math.min(99999999,Math.max(0,Math.round(e.fee||0))),category:COK(e.category)?e.category:'autres',method:metOk(e.method),nature:e.nature==='besoin'||e.nature==='envie'?e.nature:null,date:e.date,note:str(e.note,120),recurring_id:e.recurring_id||null,created_at:e.created_at||now,updated_at:now}));
  const inc=(j.incomes||[]).filter(e=>e&&SAFE_ID(e.id)&&e.amount>0&&e.amount<1e9&&okD(e.date)).map(e=>({id:String(e.id),amount:Math.round(e.amount),source:SRC[e.source]?e.source:'autre',wallet:WOK(e.wallet)?e.wallet:'banque',date:e.date,note:str(e.note,120),created_at:e.created_at||now,updated_at:now}));
  const mv=(j.moves||[]).filter(m=>m&&SAFE_ID(m.id)&&MOVES[m.kind]&&m.amount>0&&m.amount<1e9&&okD(m.date)).map(m=>({id:String(m.id),kind:m.kind,amount:Math.round(m.amount),fee:Math.min(99999999,Math.max(0,Math.round(m.fee||0))),date:m.date,from_wallet:WOK(m.from_wallet)?m.from_wallet:null,to_wallet:WOK(m.to_wallet)?m.to_wallet:null,ref_id:m.ref_id||null,note:str(m.note,120),created_at:m.created_at||now,updated_at:now}));
  const pl=(j.plans||[]).filter(p=>p&&SAFE_ID(p.id)&&PLAN_LABEL[p.type]).map(p=>({id:String(p.id),type:p.type,name:str(p.name||'Sans nom',60),amount:Math.min(999999999,Math.max(0,Math.round(p.amount||0))),data:cleanData(p.data),active:p.active!==false,created_at:p.created_at||now,updated_at:now}));
  const bud={};for(const [c,v] of Object.entries(j.budgets||{}))if(COK(c)&&v>0&&v<1e9)bud[c]=Math.round(v);
  const rec=(j.recurring||[]).filter(r=>r&&SAFE_ID(r.id)&&r.amount>0&&r.amount<1e9&&r.day>=1&&r.day<=28&&/^\d{4}-\d{2}$/.test(r.last_month||'')).map(r=>({id:String(r.id),label:str(r.label||'Récurrente',60),amount:Math.round(r.amount),fee:Math.min(99999999,Math.max(0,Math.round(r.fee||0))),category:COK(r.category)?r.category:'autres',method:metOk(r.method),day:r.day,last_month:r.last_month,active:r.active!==false,created_at:r.created_at||now,updated_at:now}));
  const s=j.settings&&typeof j.settings==='object'?j.settings:null;
  return {expenses:ex,incomes:inc,moves:mv,plans:pl,budgets:bud,recurring:rec,settings:s?{savings_goal:Math.max(0,Math.round(s.savings_goal||0)),opening:cleanOpening(s.opening,WOK),opening_date:okD(s.opening_date)?s.opening_date:null,emergency_months:s.emergency_months||3,inflation:Number(s.inflation??4)}:null};
}
const SAFE_ID=i=>(typeof i==='string'||typeof i==='number')&&/^[A-Za-z0-9_.:-]{1,100}$/.test(String(i))&&!(String(i) in Object.prototype)&&String(i)!=='prototype';
const cleanData=o=>{const out={};if(!o||typeof o!=='object'||Array.isArray(o))return out;for(const [k,v] of Object.entries(o).slice(0,30)){if(!/^[a-z_]{1,24}$/.test(k)||k==='__proto__')continue;if(typeof v==='number'&&isFinite(v))out[k]=v;else if(typeof v==='boolean')out[k]=v;else if(typeof v==='string')out[k]=v.slice(0,60)}return out};
const cleanWallets=a=>Array.isArray(a)?a.slice(0,30).filter(w=>w&&typeof w==='object'&&SAFE_ID(w.id)).map(w=>({id:String(w.id),label:String(w.label||'Portefeuille').slice(0,30),color:WCOLORS.includes(w.color)?w.color:'#64748B',kind:WKIND[w.kind]?w.kind:'other',archived:!!w.archived,pro:!!w.pro})):[];
const cleanCats=a=>Array.isArray(a)?a.slice(0,50).filter(c=>c&&typeof c==='object'&&SAFE_ID(c.id)).map(c=>({id:String(c.id),label:String(c.label||'Catégorie').slice(0,30),color:CCOLORS.includes(c.color)?c.color:CCOLORS[11],need:!!c.need,words:cleanWords(c.words),archived:!!c.archived,pro:!!c.pro})):[];
const cleanOpening=(o,ok=id=>!!WAL[id])=>{const out={};if(!o||typeof o!=='object')return out;for(const [k,v] of Object.entries(o)){if(k==='__biens'){if(Array.isArray(v))out.__biens=v.slice(0,100).filter(a=>a&&typeof a==='object').map(a=>({id:SAFE_ID(a.id)?String(a.id):newId(),name:String(a.name||'Bien').slice(0,40),value:Math.max(0,Math.round(Number(a.value)||0))}));continue}
  if(k==='__wallets'){out.__wallets=cleanWallets(v);continue}
  if(k==='__cats'){out.__cats=cleanCats(v);continue}
  if(k==='__subs'){const c=cleanSubs(v), o={fx:c.fx,m:Object.assign({},c.m),ig:c.ig};if(c.rf)o.rf=c.rf;out.__subs=o;continue}
  if(k==='__rem'){if(v&&typeof v==='object')out.__rem={lead:[0,1,2].includes(v.lead)?v.lead:1,hour:[7,8,12,18].includes(v.hour)?v.hour:8,amounts:!!v.amounts,evening:!!v.evening};continue}
  if(k==='__hz'){if(v==='pay'||v==='month')out.__hz=v;continue}
  if(k==='__start'){if(v&&typeof v==='object')out.__start={done:!!v.done};continue}
  if(k==='__chk'){if(v&&typeof v==='object'){const o={};for(const [w,d] of Object.entries(v).slice(0,30))if(SAFE_ID(w)&&/^\d{4}-\d{2}-\d{2}$/.test(String(d)))o[w]=String(d);out.__chk=o}continue}
  if(k==='__skip'){if(Array.isArray(v))out.__skip=v.filter(x=>typeof x==='string'&&/^[A-Za-z0-9_.:-]{1,100}\|\d{4}-\d{2}$/.test(x)).slice(-60);continue}
  if(k==='__cycle'){const d=Math.round(Number(v&&v.day));if(d>=1&&d<=28)out.__cycle={day:d};continue}
  if(ok(k)&&isFinite(Number(v)))out[k]=Math.round(Number(v))}return out};
// Fusion par identifiant : ce qui est dans la sauvegarde l'emporte, le reste de tes réglages actuels est conservé
const mergeById=(a,b)=>{const m=new Map();for(const x of (Array.isArray(a)?a:[]))if(x&&x.id)m.set(x.id,x);for(const x of (Array.isArray(b)?b:[]))if(x&&x.id)m.set(x.id,x);return [...m.values()]};
// Aperçu avant restauration : ce qui sera ajouté, remplacé (même identifiant, contenu différent) et conservé
const nv=v=>v===undefined||v===null||v===''?'null':canon(v);
const diffKeys=(loc,inc)=>Object.keys(inc).filter(k=>!TECH.has(k)&&nv(loc[k])!==nv(inc[k]));
const FLD={amount:'montant',fee:'frais',date:'date',category:'catégorie',method:'moyen',note:'note',source:'source',wallet:'portefeuille',name:'nom',label:'libellé',day:'jour',kind:'type',from_wallet:'départ',to_wallet:'arrivée'};
const fldVal=(k,v)=>v==null||v===''?'vide':k==='amount'||k==='fee'?fmtRaw(v):k==='date'?dFr(v):k==='category'?(CAT[v]?.label||v):(k==='method'||k==='wallet'||k==='from_wallet'||k==='to_wallet')?(WAL[v]?.label||v):String(v).slice(0,30);
function importPlan(p){
  const rows=[], ex=[];
  const tab=(label,list,cur,what)=>{
    let add=0,rep=0;const seen=new Set();
    for(const x of list){seen.add(String(x.id));const c=cur[x.id];if(!c){add++;continue}
      const dk=diffKeys(c,x);if(dk.length){rep++;if(ex.length<6)ex.push(`${what(c)} : ${dk.slice(0,3).map(k=>`${FLD[k]||k} ${fldVal(k,c[k])} → ${fldVal(k,x[k])}`).join(', ')}`)}}
    rows.push({label,add,rep,keep:Object.keys(cur).filter(id=>!seen.has(String(id))).length});
  };
  tab('Dépenses',p.expenses,D.expenses,c=>'Dépense du '+dFr(c.date));
  tab('Entrées',p.incomes,D.incomes,c=>'Entrée du '+dFr(c.date));
  tab('Mouvements',p.moves,D.moves,c=>'Mouvement du '+dFr(c.date));
  tab('Projets, tontines, prêts',p.plans,D.plans,c=>(PLAN_LABEL[c.type]||'Plan')+' '+c.name);
  tab('Charges récurrentes',p.recurring,D.recurring,c=>'Récurrente '+c.label);
  let ba=0,br=0;for(const [c,v] of Object.entries(p.budgets)){if(!(c in D.budgets))ba++;else if(D.budgets[c]!==v){br++;if(ex.length<6)ex.push(`Budget ${CAT[c]?.label||c} : ${fmtRaw(D.budgets[c])} → ${fmtRaw(v)}`)}}
  rows.push({label:'Budgets',add:ba,rep:br,keep:Object.keys(D.budgets).filter(c=>!(c in p.budgets)).length});
  if(p.settings){
    const cur=D.settings, inc=p.settings, co=cur.opening||{}, io=inc.opening||{};let sa=0,sr=0,sk=0;
    for(const k of ['savings_goal','opening_date','emergency_months','inflation']){if(nv(cur[k])!==nv(inc[k])){if(cur[k]==null||cur[k]===0||cur[k]==='')sa++;else{sr++;if(ex.length<6)ex.push(`Réglage ${k==='savings_goal'?'objectif d\'épargne':k==='opening_date'?'date des soldes':k==='emergency_months'?'fonds d\'urgence':'inflation'} : ${cur[k]} → ${inc[k]}`)}}else sk++}
    for(const k of Object.keys(io)){
      if(Array.isArray(io[k])){const cm=new Map((Array.isArray(co[k])?co[k]:[]).map(x=>[x.id,x]));for(const x of io[k]){const c=cm.get(x.id);if(!c)sa++;else if(canon(contentOf(c))!==canon(contentOf(x)))sr++;else sk++}}
      else if(!(k in co))sa++;else if(nv(co[k])!==nv(io[k])){sr++;if(ex.length<6&&WAL[k])ex.push(`Solde de départ ${WAL[k].label} : ${fmtRaw(co[k])} → ${fmtRaw(io[k])}`)}else sk++}
    const ik=new Set(Object.keys(io));for(const k of Object.keys(co))if(!ik.has(k))sk++;
    rows.push({label:'Réglages',add:sa,rep:sr,keep:sk});
  }
  return {rows,ex,add:sumBy(rows,r=>r.add),rep:sumBy(rows,r=>r.rep),keep:sumBy(rows,r=>r.keep)};
}
function importPreviewHTML(p){
  const P=importPlan(p);
  return `<div class="msg warning" role="status">${ic('alert')}<div><b>Aperçu de la restauration</b><span>Avant de valider, voici ce qui va se passer. Rien n'est supprimé, mais des éléments peuvent être modifiés.</span></div></div>
    <div class="sheet-scroll"><table class="compact"><thead><tr><th>Élément</th><th class="amt">Ajoutés</th><th class="amt">Remplacés</th><th class="amt">Conservés</th></tr></thead><tbody>${P.rows.map(r=>`<tr style="cursor:default"><td>${esc(r.label)}</td><td class="amt">${r.add}</td><td class="amt ${r.rep?'var-up':''}">${r.rep}</td><td class="amt">${r.keep}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td class="amt">${P.add}</td><td class="amt">${P.rep}</td><td class="amt">${P.keep}</td></tr></tfoot></table></div>
    <p class="hint"><b>Ajoutés</b> : présents dans la copie, absents de ton carnet. <b>Remplacés</b> : même identifiant, contenu différent ; la version de la copie prend la place de la tienne. <b>Conservés</b> : présents chez toi, absents de la copie ; ils ne sont pas touchés.</p>
    ${P.ex.length?`<p class="over">Exemples de remplacements</p><div class="rows">${P.ex.map(x=>`<div class="rowbtn" style="cursor:default;grid-template-columns:minmax(0,1fr)"><span class="t"><span style="white-space:normal;font-size:13px">${esc(x)}</span></span></div>`).join('')}</div>${P.rep>P.ex.length?`<p class="hint">et ${P.rep-P.ex.length} autre(s).</p>`:''}`:''}
    <p class="hint">Si tu es connecté, une copie de ton état actuel est enregistrée juste avant la restauration, pour pouvoir revenir en arrière.</p>`;
}
async function doImport(){
  const p=pendingImport;if(!p||S.importing)return;S.importing=true;
  if(sb&&uid&&navigator.onLine&&!outbox.length&&!rejected.length){try{await autoBackup(true)}catch(e){}}
  S.importing=false;if(pendingImport!==p)return;pendingImport=null;const now=nowISO();
  const ops=[...p.expenses.map(row=>({t:'expenses',op:'upsert',row})),...p.incomes.map(row=>({t:'incomes',op:'upsert',row})),...p.plans.map(row=>({t:'plans',op:'upsert',row})),...p.moves.map(row=>({t:'moves',op:'upsert',row})),
    ...Object.entries(p.budgets).map(([category,amount])=>({t:'budgets',op:'upsert',row:{category,amount,updated_at:now}})),...p.recurring.map(row=>({t:'recurring',op:'upsert',row}))];
  if(p.settings){const cur=D.settings.opening||{}, inc=p.settings.opening||{}, merged=Object.assign({},cur,inc);
    for(const k of ['__wallets','__cats','__biens'])if(Array.isArray(cur[k])||Array.isArray(inc[k]))merged[k]=mergeById(cur[k],inc[k]);
    if(cur.__subs||inc.__subs){const a=cleanSubs(cur.__subs), b=cleanSubs(inc.__subs);merged.__subs={fx:Object.assign({},a.fx,b.fx),rf:b.rf||a.rf,m:Object.assign({},a.m,b.m),ig:[...new Set([...a.ig,...b.ig])]}}
    // Le résultat de la fusion est nettoyé une dernière fois : rien d'inattendu n'est réécrit en base
    const wset=new Set(cleanWallets(merged.__wallets).map(w=>w.id)), op=cleanOpening(merged,id=>!!WAL[id]||wset.has(id));
    ops.push(settingsRow(Object.assign({},p.settings,{opening:op})))}
  mutate(ops);toast(`${ops.length} élément(s) importé(s)`);
}
async function logout(){
  if(S.armed!=='logout'){S.armed='logout';render();return}
  S.armed=null;try{if(LS.get(K.push,false))await disablePush(true)}catch(e){}
  try{if(sb)await sb.auth.signOut()}catch(e){}
  D=EMPTY();outbox=[];rejected=[];clearTimeout(retryT);[K.rej,K.cache,K.outbox,K.uid,K.lock,K.push,K.remSig,K.testId,K.bkAt,K.bkSig,K.bkErr,K.synclog,K.lastOk].forEach(LS.del);lastSync=0;lastErr='';bkList=null;pushChecked=false;uid=null;email='';showLogin();
}

/* ---------- Après chaque synchronisation : rappels et sauvegarde automatique ---------- */
let pushChecked=false;
function afterSync(){
  refreshPushSub().catch(()=>{});
  syncReminders().catch(()=>{});
  flushJournal().catch(()=>{});
  maybeOnboard();
  autoBackup(false).then(done=>{if(done&&S.tab==='settings')loadBackups()}).catch(()=>{});
}
const dateTimeFr=t=>new Date(t).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}).replace('.','')+' à '+hhmm(t);

/* ---------- Rappels par notification (Web Push) ---------- */
const VAPID=()=>String((window.CARNET_CONFIG||{}).VAPID_PUBLIC_KEY||'');
const b64u=x=>{const pad='='.repeat((4-x.length%4)%4), raw=atob((x+pad).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0))};
const cfgRem=()=>{const r=(D.settings.opening||{}).__rem||{};return {lead:[0,1,2].includes(r.lead)?r.lead:1,hour:[7,8,12,18].includes(r.hour)?r.hour:8,amounts:!!r.amounts,evening:!!r.evening}};
function pushBlock(){
  if(!sb||!uid)return 'Connexion au compte nécessaire.';
  if(!navigator.onLine)return 'Connexion Internet nécessaire pour activer les rappels.';
  if(!('serviceWorker' in navigator)||!('Notification' in window))return 'Ce navigateur ne gère pas les notifications.';
  if(IOS&&!STANDALONE())return 'Sur iPhone, installe d\'abord le carnet sur l\'écran d\'accueil (Partager, puis Sur l\'écran d\'accueil) et ouvre-le depuis son icône.';
  if(!('PushManager' in window))return 'Cet appareil ne gère pas les notifications web (iOS 16.4 minimum).';
  if(!VAPID())return 'Clé publique des rappels absente de config.js (voir docs/notifications.md).';
  if(Notification.permission==='denied')return 'Notifications refusées. Autorise-les dans Réglages de l\'iPhone, Notifications, Carnet.';
  return '';
}
// Heure du rappel exprimée à Brazzaville (UTC+1, sans heure d'été)
const fireAt=(date,lead,hour)=>{const [y,m,d]=date.split('-').map(Number);return new Date(Date.UTC(y,m-1,d-lead,hour-1,0,0)).toISOString()};
function buildReminders(){
  const cfg=cfgRem(), now=Date.now(), t=todayISO(), end=addDays(t,45), out=new Map();
  const relOf=l=>l===0?'aujourd\'hui':l===1?'demain':'dans '+l+' jours';
  const add=(id,date,title,body,amount,lead=cfg.lead,hour=cfg.hour)=>{
    if(!date||date<t||date>end)return;
    const when=fireAt(date,lead,hour);if(Date.parse(when)<=now+60000)return;
    const key=('r-'+id+'-'+date).slice(0,120);
    out.set(key,{id:key,fire_at:when,title:String(title).slice(0,80),body:(body.replace('{quand}',relOf(lead))+(cfg.amounts&&amount>0?' : '+fmtRaw(amount):'')).slice(0,200),tag:id.split('-')[0].slice(0,20)});
  };
  for(const r of Object.values(D.recurring)){if(!r.active)continue;
    for(const o of recDueList(r,end))add('rec-'+r.id,o.date,r.label,subPer(r)>1?'Renouvellement {quand}':'À payer {quand}',recAmt(r,o.date)+(r.fee||0))}
  // Abonnements : fin d'essai gratuit, changement de prix, renouvellement annuel (une semaine avant), recharge de la carte prépayée
  for(const r of Object.values(D.recurring)){if(!r.active)continue;const m=subM(r.id);if(!m)continue;
    if(m&&m.t&&m.t>=t)add('essai-'+r.id,m.t,'Essai gratuit : '+r.label,'Premier prélèvement {quand}. Annule avant si tu n\'en veux pas.',recAmt(r,m.t)+(r.fee||0),Math.max(1,cfg.lead));
    if(m&&m.n&&m.n.d>=t)add('prix-'+r.id,m.n.d,'Changement de prix : '+r.label,'Le nouveau prix s\'applique {quand}.',recAmt(r,m.n.d)+(r.fee||0),3);
    if(subPer(r)>=12)for(const o of recDueList(r,end))add('renouv-'+r.id,o.date,r.label,'Renouvellement annuel {quand}',recAmt(r,o.date)+(r.fee||0),7)}
  for(const a of cardAlerts(45))if(a.need>0&&a.by)add('carte-'+a.w,a.by,'Recharge ta carte','Recharge « '+a.label+' » avant le '+dFr(a.by)+' pour '+a.short.length+' abonnement'+(a.short.length>1?'s':'')+'.',a.need,2);
  for(const p of plans()){if(p.active===false)continue;const s=planStats(p), d=p.data||{};
    if((p.type==='loan'||p.type==='debt')&&s.left>0&&s.due)add('plan-'+p.id,s.due,p.type==='debt'?'Dette à rembourser : '+p.name:p.name+' doit te rembourser','Échéance {quand}',s.left);
    if(p.type==='tontine'&&s.end>=t){
      if(d.frequency==='hebdomadaire'){let x=parseISO(d.start||t);while(isoOf(x)<t)x=new Date(x.getFullYear(),x.getMonth(),x.getDate()+7);for(;isoOf(x)<=end;x=new Date(x.getFullYear(),x.getMonth(),x.getDate()+7))add('ton-'+p.id,isoOf(x),'Tontine '+p.name,'Cotisation {quand}',p.amount)}
      else{const x=nextDate(parseISO(d.start||t).getDate(),t);if(x>=(d.start||t))add('ton-'+p.id,x,'Tontine '+p.name,'Cotisation {quand}',p.amount)}
      if(s.received<s.pot)add('tonr-'+p.id,s.receive,'Tontine '+p.name,'C\'est ton tour : réception {quand}',s.pot)}
    if(p.type==='project'&&s.due&&s.ratio<1)add('proj-'+p.id,s.due,'Projet '+p.name,'Échéance {quand}',Math.max(0,s.target-s.saved));
  }
  const P=payInfo();
  if(P&&!P.late){add('sal',P.next,'Jour de paie','Salaire attendu {quand}. Pense à le noter dans le carnet.',0);
    add('salretard',addDays(P.next,3),'Salaire non noté','Aucun salaire noté trois jours après la date de paie. Ouvre le carnet pour voir combien de jours tu tiens.',0,0)}
  // Rappel du soir (20 h à Brazzaville) : « as-tu noté tes dépenses ? ». Retiré pour les jours où une dépense est déjà notée ; le serveur revérifie avant l'envoi.
  if(cfg.evening)for(let i=0;i<4;i++){const d=addDays(t,i);if(expenses().some(e=>e.date===d))continue;add('soir',d,'Carnet de dépenses','As-tu noté tes dépenses d\'aujourd\'hui ?',0,0,20)}
  const nm=shiftM(curM(),1);add('bilan-'+nm,nm+'-01','Bilan de '+mName(curM()),'Ton bilan du mois est prêt dans le carnet.',0,0);
  return [...out.values()].sort((a,b)=>a.fire_at<b.fire_at?-1:1).slice(0,150);
}
let remBusy=false;
async function syncReminders(force){
  if(!sb||!uid||!navigator.onLine||!LS.get(K.push,false)||remBusy)return;
  const list=buildReminders(), sig=JSON.stringify(list.map(r=>[r.id,r.fire_at,r.title,r.body]));
  if(!force&&sig===LS.get(K.remSig,''))return;
  remBusy=true;
  try{
    const {data:ex,error:e1}=await sb.from('reminders').select('id').is('sent_at',null).range(0,999);
    if(e1)throw e1;
    const keep=new Set(list.map(r=>r.id)), stale=(ex||[]).map(r=>r.id).filter(id=>!keep.has(id)&&!String(id).startsWith('test-'));
    for(let i=0;i<list.length;i+=50){const {error}=await sb.from('reminders').upsert(list.slice(i,i+50).map(r=>Object.assign({},r,{user_id:uid})),{onConflict:'id'});if(error)throw error}
    for(let i=0;i<stale.length;i+=50){const {error}=await sb.from('reminders').delete().in('id',stale.slice(i,i+50));if(error)throw error}
    LS.set(K.remSig,sig);
  }catch(e){console.warn('Rappels non synchronisés',e)}
  finally{remBusy=false}
}
async function refreshPushSub(){
  if(pushChecked||!LS.get(K.push,false)||!sb||!uid||!navigator.onLine||!('serviceWorker' in navigator)||!('PushManager' in window))return;
  pushChecked=true;
  const reg=await navigator.serviceWorker.ready, sub=await reg.pushManager.getSubscription();
  if(!sub||Notification.permission!=='granted'){LS.set(K.push,false);if(S.tab==='settings')render();return}
  const j=sub.toJSON();
  await sb.from('push_subscriptions').upsert({endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,agent:navigator.userAgent.slice(0,150),user_id:uid},{onConflict:'endpoint'});
}
async function enablePush(){
  const why=pushBlock();if(why)return toast(why);
  try{
    const perm=await Notification.requestPermission();
    if(perm!=='granted')return toast('Autorisation refusée. Tu peux la donner dans Réglages de l\'iPhone, Notifications.');
    const reg=await navigator.serviceWorker.ready, key=b64u(VAPID());
    let sub=await reg.pushManager.getSubscription();
    if(sub){const cur=sub.options&&sub.options.applicationServerKey;if(cur&&new Uint8Array(cur).join()!==key.join()){await sub.unsubscribe();sub=null}}
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
    const j=sub.toJSON();
    const {error}=await sb.from('push_subscriptions').upsert({endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,agent:navigator.userAgent.slice(0,150),user_id:uid},{onConflict:'endpoint'});
    if(error){if(SCHEMA_CODES.has(String(error.code)))return toast('Exécute supabase/migration-2.5.sql dans Supabase, puis réessaie.');throw error}
    LS.set(K.push,true);pushChecked=true;
    try{await reg.showNotification('Rappels activés',{body:'Tu seras prévenu des échéances, même quand le carnet est fermé.',icon:'icons/icon-192.png',tag:'carnet-on'})}catch(e){}
    await syncReminders(true);toast('Rappels activés sur cet appareil');render();
  }catch(e){toast('Activation impossible : '+String((e&&e.message)||e).slice(0,100))}
}
async function disablePush(silent){
  try{
    const reg=await navigator.serviceWorker.ready, sub=await reg.pushManager.getSubscription();
    if(sub){const ep=sub.endpoint;await sub.unsubscribe();if(sb&&navigator.onLine)await sb.from('push_subscriptions').delete().eq('endpoint',ep)}
    if(sb&&navigator.onLine)await sb.from('reminders').delete().is('sent_at',null);
  }catch(e){}
  LS.set(K.push,false);LS.del(K.remSig);
  if(!silent){toast('Rappels désactivés sur cet appareil');render()}
}
async function pushTest(){
  if(!LS.get(K.push,false))return toast('Active d\'abord les rappels.');
  const id='test-'+Date.now().toString(36);
  const {error}=await sb.from('reminders').upsert({id,user_id:uid,fire_at:new Date().toISOString(),title:'Carnet de dépenses',body:'Test réussi : les rappels fonctionnent sur cet appareil.',tag:'test'},{onConflict:'id'});
  if(error)return toast(SCHEMA_CODES.has(String(error.code))?'Exécute supabase/migration-2.5.sql dans Supabase.':'Test impossible : '+(error.message||'erreur'));
  LS.set(K.testId,id);toast('Test programmé. La notification arrive en moins de 5 minutes ; reviens ensuite toucher « Vérifier le test ».');render();
}
async function pushTestCheck(){
  const id=LS.get(K.testId,'');if(!id||!sb)return;
  const {data,error}=await sb.from('reminders').select('id,sent_at,note').eq('id',id).single();
  if(error||!data)return toast('Test introuvable. Relance un test.');
  toast(data.sent_at?(data.note?'Envoi en échec : '+data.note:'Notification envoyée à '+hhmm(data.sent_at)+'. Si rien ne s\'affiche, vérifie Réglages de l\'iPhone, Notifications.'):'Pas encore envoyée. Patiente 5 minutes ; sinon la fonction serveur n\'est pas installée (docs/notifications.md).');
}
function saveRem(){
  const lead=+$('rem-lead').value, hour=+$('rem-hour').value, amounts=$('rem-amounts').checked, evening=$('rem-evening').checked;
  mutate([settingsRow({opening:Object.assign({},D.settings.opening,{__rem:{lead:[0,1,2].includes(lead)?lead:1,hour:[7,8,12,18].includes(hour)?hour:8,amounts,evening}})})]);
  toast('Réglages des rappels enregistrés');setTimeout(()=>syncReminders(true),50);
}
function renderReminders(){
  const on=LS.get(K.push,false), why=on?'':pushBlock(), r=cfgRem(), test=LS.get(K.testId,'');
  let h=`<section class="block"><p class="over">Rappels par notification</p><p class="hint">Loyer, tontines, dettes, projets, jour de paie et bilan du mois : le carnet te prévient même quand il est fermé. Par défaut, la notification ne contient aucun montant.</p>
    <div class="form-row"${on||!why?'':' style="grid-template-columns:minmax(0,1fr)"'}><span>Sur cet appareil<span class="meta" style="display:block">${on?'Les rappels sont envoyés par le serveur du carnet.':esc(why)||'Désactivés.'}</span></span>${on?pill('success','Activés'):(why?'':`<button type="button" class="btn-primary sm" data-act="enablePush">Activer</button>`)}</div>`;
  if(on)h+=`<div class="form-row"><span>Prévenir<span class="meta" style="display:block">avant chaque échéance</span></span><select id="rem-lead" aria-label="Délai du rappel"><option value="0" ${r.lead===0?'selected':''}>Le jour même</option><option value="1" ${r.lead===1?'selected':''}>La veille</option><option value="2" ${r.lead===2?'selected':''}>Deux jours avant</option></select></div>
    <div class="form-row"><span>Heure<span class="meta" style="display:block">heure de Brazzaville</span></span><select id="rem-hour" aria-label="Heure du rappel">${[7,8,12,18].map(x=>`<option value="${x}" ${r.hour===x?'selected':''}>${x} h</option>`).join('')}</select></div>
    <div class="form-row"><span>Rappel du soir<span class="meta" style="display:block">À 20 h : « as-tu noté tes dépenses ? ». Rien n'est envoyé si tu as déjà noté une dépense dans la journée.</span></span><label class="switch"><input type="checkbox" id="rem-evening" ${r.evening?'checked':''}><span></span></label></div>
    <div class="form-row"><span>Afficher les montants<span class="meta" style="display:block">Désactivé : l'écran verrouillé ne révèle rien de tes finances.</span></span><label class="switch"><input type="checkbox" id="rem-amounts" ${r.amounts?'checked':''}><span></span></label></div>
    <div class="actions"><button type="button" class="btn-primary sm" data-act="saveRem">Enregistrer</button><button type="button" class="btn sm" data-act="pushTest">Envoyer un test</button>${test?'<button type="button" class="btn sm" data-act="pushTestCheck">Vérifier le test</button>':''}<button type="button" class="pill" data-act="disablePush">Désactiver</button></div>`;
  return h+'</section>';
}

/* ---------- Sauvegarde : automatique sur le serveur, fichier, restauration ---------- */
const countsOf=()=>({expenses:expenses().length,incomes:incomes().length,moves:moves().length,plans:Object.keys(D.plans).length,recurring:Object.keys(D.recurring).length});
const backupObject=()=>({app:'carnet-depenses',version:APP_VERSION,exported_at:nowISO(),expenses:expenses(),incomes:incomes(),moves:moves(),plans:Object.values(D.plans),budgets:D.budgets,recurring:Object.values(D.recurring),settings:D.settings});
// Empreinte du contenu réel (insensible à l'ordre et aux dates techniques) : une nouvelle copie n'est utile que si le contenu a changé
const canon=v=>v===null||typeof v!=='object'?JSON.stringify(v===undefined?null:v):Array.isArray(v)?'['+v.map(canon).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}';
const TECH=new Set(['updated_at','created_at','user_id']);
const contentOf=r=>{const o={};for(const k of Object.keys(r||{}))if(!TECH.has(k)&&r[k]!==undefined&&r[k]!==null&&r[k]!=='')o[k]=r[k];return o};
function hash64(str){let a=0x811c9dc5,b=0x9e3779b9;for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);a=Math.imul(a^c,16777619);b=(Math.imul(b+c,2246822519)^(b>>>13))|0}return (a>>>0).toString(36)+(b>>>0).toString(36)+str.length.toString(36)}
function dataSig(){
  const parts=[];
  for(const [t,list] of [['e',expenses()],['i',incomes()],['m',moves()],['p',Object.values(D.plans)],['r',Object.values(D.recurring)]])for(const x of list)parts.push(t+canon(contentOf(x)));
  for(const [c,v] of Object.entries(D.budgets))parts.push('b'+c+':'+v);
  parts.push('s'+canon(contentOf(D.settings)));
  return hash64(parts.sort().join('\n'));
}
let bkBusy=false;
async function autoBackup(force){
  if(!sb||!uid||!navigator.onLine||bkBusy||schemaOld||outbox.length)return false;
  if(!expenses().length&&!incomes().length)return false;
  const sig=dataSig();
  if(!force&&(LS.get(K.bkSig,'')===sig||Date.now()-LS.get(K.bkAt,0)<20*36e5))return false;
  bkBusy=true;
  try{
    const payload=backupObject();
    if(JSON.stringify(payload).length>8e6){LS.set(K.bkErr,'Données trop volumineuses pour la copie automatique : télécharge un fichier de sauvegarde.');return false}
    const {error}=await sb.from('backups').insert({kind:force?'manuel':'auto',counts:countsOf(),payload});
    if(error){LS.set(K.bkErr,SCHEMA_CODES.has(String(error.code))?'Exécute supabase/migration-2.5.sql dans Supabase pour activer la sauvegarde automatique.':'Dernière tentative en échec : '+String(error.message||'erreur').slice(0,100));return false}
    LS.set(K.bkAt,Date.now());LS.set(K.bkSig,sig);LS.del(K.bkErr);return true;
  }catch(e){LS.set(K.bkErr,'Dernière tentative en échec : '+String((e&&e.message)||e).slice(0,100));return false}
  finally{bkBusy=false}
}
let bkList=null, bkLoading=false;
function bkListHTML(){
  if(bkList===null)return '<p class="hint">Chargement…</p>';
  if(bkList==='old')return '<p class="hint">Sauvegarde automatique non activée : exécute supabase/migration-2.5.sql dans Supabase.</p>';
  if(bkList==='err')return `<p class="hint">${navigator.onLine?'Liste indisponible pour le moment.':'La liste des sauvegardes automatiques est disponible en ligne.'}</p>`;
  if(!bkList.length)return '<p class="hint">Aucune sauvegarde automatique pour l\'instant. La première est faite à la prochaine synchronisation.</p>';
  const row=b=>{const c=b.counts||{};return `<div class="rowbtn" style="cursor:default"><span class="wicon">${ic('shield')}</span><span class="t"><span>${esc(dateTimeFr(Date.parse(b.created_at)))}${b.kind==='manuel'?' · manuelle':b.kind==='serveur'?' · serveur (nuit)':''}</span><span style="white-space:normal">${Number(c.expenses)||0} dépenses · ${Number(c.incomes)||0} entrées · ${Number(c.plans)||0} plans</span></span><button type="button" class="pill" data-restore="${esc(b.id)}">Restaurer</button></div>`};
  return `<div class="rows">${bkList.slice(0,5).map(row).join('')}</div>${bkList.length>5?`<details data-keep="bkopen" ${S.bkopen?'open':''}><summary class="linkbtn">Voir les ${bkList.length-5} copies plus anciennes</summary><div class="rows">${bkList.slice(5).map(row).join('')}</div></details>`:''}`;
}
async function loadBackups(){
  if(!sb||!uid||!navigator.onLine){bkList='err';paintBk();return}
  if(bkLoading)return;bkLoading=true;
  try{const {data,error}=await sb.from('backups').select('id,kind,counts,created_at').order('created_at',{ascending:false}).limit(40);
    bkList=error?(SCHEMA_CODES.has(String(error.code))?'old':'err'):data}catch(e){bkList='err'}
  bkLoading=false;paintBk();
}
const paintBk=()=>{const el=$('bk-block');if(el)el.innerHTML=backupInner()};
async function restoreBackup(id){
  if(!sb||!navigator.onLine)return toast('Connexion Internet nécessaire pour restaurer.');
  const {data,error}=await sb.from('backups').select('payload').eq('id',id).single();
  if(error||!data)return toast('Sauvegarde introuvable.');
  try{pendingImport=parseBackup(JSON.stringify(data.payload));S.tab='settings';render();$('main').scrollTop=$('main').scrollHeight}catch(e){toast(e.message||'Sauvegarde illisible')}
}
async function backupNow(){
  if(!navigator.onLine||!sb)return toast('Connexion Internet nécessaire.');
  if(outbox.length)await flush();
  if(outbox.length)return toast('Des envois sont encore en attente : réessaie dans un instant.');
  const ok=await autoBackup(true);toast(ok?'Sauvegarde créée sur le serveur':(LS.get(K.bkErr,'')||'Sauvegarde impossible'));
  if(ok)loadBackups();else if(S.tab==='settings')render();
}
// Sur iPhone, le menu Partager permet d'enregistrer dans Fichiers ou d'envoyer par WhatsApp ou courriel
async function saveFile(name,text,type){
  try{if(IOS&&navigator.canShare&&navigator.share){const f=new File([text],name,{type});if(navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return 'shared'}}}
  catch(e){if(e&&e.name==='AbortError')return 'cancelled'}
  download(name,text,type);return 'download';
}
function backupNudge(){
  const fb=LS.get(K.fileBk,0), first=LS.get(K.firstUse,Date.now()), day=864e5;
  if(expenses().length<20||Date.now()<LS.get(K.bkSnooze,0)||(fb?Date.now()-fb<45*day:Date.now()-first<14*day))return '';
  return `<section class="block"><p class="over">Sauvegarde sur fichier</p><p class="hint">${fb?'Ton dernier fichier de sauvegarde date de '+Math.round((Date.now()-fb)/day)+' jours.':'Tu n\'as encore téléchargé aucun fichier de sauvegarde.'} Garde une copie hors du serveur : elle te protège même si le compte Supabase était perdu.</p><div class="actions"><button type="button" class="btn-primary sm" data-act="exportJson">Télécharger</button><button type="button" class="pill" data-act="nudgeLater">Plus tard</button></div></section>`;
}
const lastCopyAt=()=>{const l=Array.isArray(bkList)&&bkList.length?Math.max(...bkList.map(b=>Date.parse(b.created_at)||0)):0;return Math.max(l,LS.get(K.bkAt,0))};
const agoFr=t=>{const m=Math.round((Date.now()-t)/6e4);return m<2?'à l\'instant':m<60?'il y a '+m+' min':m<1440?'il y a '+Math.round(m/60)+' h':'il y a '+Math.round(m/1440)+' j'};
const renderBackup=()=>`<section class="block" id="bk-block">${backupInner()}</section>`;
function backupInner(){
  const fb=LS.get(K.fileBk,0), err=LS.get(K.bkErr,''), lc=lastCopyAt(), has=expenses().length+incomes().length>0, srv=Array.isArray(bkList)?bkList.find(b=>b.kind==='serveur'):null;
  const stale=has&&(!lc||Date.now()-lc>3*864e5);
  let h=`<p class="over">Sauvegarde</p>
    <div class="ref num"><span>Dernière copie réussie</span><span class="v">${lc?esc(dateTimeFr(lc))+' ('+agoFr(lc)+')':'aucune'}</span><span>Copie serveur de nuit</span><span class="v">${Array.isArray(bkList)?(srv?esc(dateTimeFr(Date.parse(srv.created_at))):'non détectée'):'-'}</span><span>Dernier fichier téléchargé</span><span class="v">${fb?esc(dateTimeFr(fb)):'jamais'}</span></div>
    ${stale?msg('warning','Aucune copie récente',lc?'La dernière copie date de plus de 3 jours. Ouvre le carnet connecté, ou touche « Sauvegarder maintenant ».':'Aucune copie n\'existe encore. Touche « Sauvegarder maintenant ».'):''}
    <p class="hint"><b>Copie automatique</b> : faite par l'application quand tu l'ouvres, une fois toutes les 20 h au plus et seulement si tes données ont changé. Si tu n'ouvres pas le carnet, elle ne se fait pas. <b>Copie serveur</b> : faite chaque nuit par la base elle-même, sans ouvrir l'application ; elle s'active une fois (guide <i>docs/sauvegardes.md</i>)${Array.isArray(bkList)&&!srv?' et n\'est pas détectée pour l\'instant':''}. <b>Fichier</b> : la seule copie hors du serveur, à télécharger toi-même. Historique conservé : 14 copies automatiques, 14 copies serveur, 6 manuelles.</p>
    ${err?msg('warning','Copie automatique',esc(err)):''}
    <div id="bk-list" style="margin-top:8px">${bkListHTML()}</div>
    <div class="actions"><button type="button" class="btn-primary sm" data-act="backupNow">Sauvegarder maintenant</button><button type="button" class="btn sm" data-act="exportJson">Télécharger un fichier</button><button type="button" class="btn sm" data-act="pickImport">Restaurer un fichier</button></div>`;
  if(pendingImport){const p=pendingImport;h+=`<p class="hint">Copie prête : ${p.expenses.length} dépenses, ${p.incomes.length} entrées, ${p.moves.length} mouvements, ${p.plans.length} projets, tontines et prêts.</p>`+importPreviewHTML(p)+`<div class="actions"><button type="button" class="btn-primary" data-act="doImport">Confirmer la restauration</button><button type="button" class="btn" data-act="cancelImport">Annuler</button></div>`}
  return h;
}

/* ---------- Rapport du mois : lecture, impression en PDF, partage ---------- */
const rawMode=fn=>{const h=HIDE;HIDE=false;try{return fn()}finally{HIDE=h}};
function reportHTML(m){
  return rawMode(()=>{
    const items=monthItems(m), spent=sumBy(items,spend), inc=incomeIn(m), saved=inc-spent, cats=byCat(items), goal=savingsGoal(m), fees=feesOf(items), sa=savedAside(m);
    const p=shiftM(m,-1), pSpent=spentIn(p), until=m===curM()?todayISO():`${m}-${pad(daysIn(m))}`, need=sumBy(items.filter(e=>natureOf(e)==='besoin'),spend);
    const catRows=Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([c,v])=>{const b=D.budgets[c]||0;return `<tr><td><i class="rp-dot" style="background:${esc(CAT[c]?.color||'#9AA8A1')}"></i>${esc(CAT[c]?.label||c)}</td><td class="n">${fmtNR(v)}</td><td class="n">${spent?Math.round(v/spent*100):0} %</td><td class="n">${b?fmtNR(b):'-'}</td><td class="n ${b&&v>b?'rp-over':''}">${b?(v>b?'+ ':'− ')+fmtNR(Math.abs(v-b)):''}</td></tr>`}).join('');
    const top=[...items].sort((a,b)=>spend(b)-spend(a)).slice(0,5).map(e=>`<tr><td>${dFr(e.date)}</td><td>${esc(CAT[e.category]?.label||e.category)}${e.note?' · '+esc(e.note):''}</td><td class="n">${fmtNR(spend(e))}</td></tr>`).join('');
    const incRows=monthInc(m).sort((a,b)=>a.date<b.date?-1:1).map(e=>`<tr><td>${dFr(e.date)}</td><td>${esc(SRC[e.source]?.label||e.source)}${e.note?' · '+esc(e.note):''}</td><td class="n">${fmtNR(e.amount)}</td></tr>`).join('');
    const mets={};items.forEach(e=>mets[e.method]=(mets[e.method]||0)+spend(e));
    const metRows=Object.entries(mets).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td>${esc(WAL[k]?.label||k)}</td><td class="n">${fmtNR(v)}</td><td class="n">${spent?Math.round(v/spent*100):0} %</td></tr>`).join('');
    const walRows=scopedWallets().map(([w,l])=>`<tr><td>${esc(l)}</td><td class="n">${fmtNR(balance(w,until))}</td></tr>`).join('');
    const eng=plans().filter(x=>x.active!==false).map(x=>{const s=planStats(x);
      const txt=x.type==='project'?`${fmtNR(s.saved)} sur ${fmtNR(s.target)}${s.due?', échéance '+dFr(s.due):''}`:x.type==='tontine'?`cotisé ${fmtNR(s.paid)}, réception prévue le ${dFr(s.receive)}`:`reste ${fmtNR(s.left)}${s.due?', échéance '+dFr(s.due):''}`;
      return `<tr><td>${esc(PLAN_LABEL[x.type])}</td><td>${esc(x.name)}</td><td class="r">${txt}</td></tr>`}).join('');
    const unpaidRows=m===curM()?recPending().map(p=>`<tr><td>${esc(p.r.label)}${p.m!==m?' ('+esc(mName(p.m))+')':''}</td><td>${p.late?'en retard de '+p.late+' j':'prévue le '+dFr(p.date)}</td><td class="n">${fmtNR(p.amount)}</td></tr>`).join(''):'';
    const kp=(l,v,c='')=>`<div class="rp-k"><span>${l}</span><b class="${c}">${v}</b></div>`;
    return `<div class="rp-bar"><button type="button" class="rp-btn" data-act="closeReport">Fermer</button><span></span><button type="button" class="rp-btn" data-act="shareReport">Partager le résumé</button><button type="button" class="rp-btn main" data-act="printReport">Imprimer ou PDF</button></div>
    <article class="rp"><header><span class="rp-brand">Carnet de dépenses</span><h1>Rapport de ${esc(mLong(m))}</h1><p>Établi le ${esc(dLong(todayISO()))}. Montants en FCFA. ${scopeOn()==='all'?'':'Vue '+esc(SCOPE_LABEL[scopeOn()])+' uniquement. '}${m===curM()?'Mois en cours, situation au '+esc(dFr(until))+'.':''}</p></header>
      <div class="rp-kpis">${kp('Entrées',fmtNR(inc))}${kp('Dépenses',fmtNR(spent))}${kp('Excédent du mois',(saved<0?'− ':'')+fmtNR(Math.abs(saved)),saved<0?'rp-over':'')}${kp('Mis de côté',fmtNR(sa))}</div>
      <p class="rp-line">${pSpent?`Par rapport à ${esc(mName(p))} : ${spent>=pSpent?'+':'−'}${Math.abs(Math.round((spent-pSpent)/pSpent*100))} % de dépenses. `:''}${inc?`Excédent : ${saved>=0?pctS(saved/inc)+' des entrées non dépensées':'dépenses supérieures aux entrées'}. `:''}${goal&&inc?`Objectif d'épargne de ${fmtNR(goal)} : ${sa>=goal?'atteint':'non atteint'} (mis de côté : ${fmtNR(sa)}). `:''}${spent?`Besoins ${Math.round(need/spent*100)} %, envies ${Math.round((spent-need)/spent*100)} %. `:''}${fees?`Frais financiers : ${fmtNR(fees)}.`:''}</p>
      ${catRows?`<h2>Dépenses par catégorie</h2><table class="rp-cat"><thead><tr><th>Catégorie</th><th class="n">Montant</th><th class="n">Part</th><th class="n">Budget</th><th class="n">Écart</th></tr></thead><tbody>${catRows}</tbody><tfoot><tr><td>Total</td><td class="n">${fmtNR(spent)}</td><td></td><td></td><td></td></tr></tfoot></table>`:'<p class="rp-line">Aucune dépense ce mois-ci.</p>'}
      ${top?`<h2>Cinq plus grosses dépenses</h2><table><tbody>${top}</tbody></table>`:''}
      ${incRows?`<h2>Entrées d'argent</h2><table><tbody>${incRows}</tbody></table>`:''}
      ${metRows?`<h2>Moyens de paiement</h2><table><tbody>${metRows}</tbody></table>`:''}
      <h2>Soldes des portefeuilles au ${esc(dFr(until))}</h2><table><tbody>${walRows}</tbody></table>
      ${unpaidRows?`<h2>Charges récurrentes à payer</h2><table><tbody>${unpaidRows}</tbody></table>`:''}
      ${eng?`<h2>Engagements en cours</h2><table><tbody>${eng}</tbody></table>`:''}
      <footer>Document personnel généré par le Carnet de dépenses. Il contient des données financières : ne le partage qu'avec des personnes de confiance.</footer></article>`;
  });
}
function summaryText(m){
  return rawMode(()=>{
    const items=monthItems(m), spent=sumBy(items,spend), inc=incomeIn(m), saved=inc-spent, top=Object.entries(byCat(items)).sort((a,b)=>b[1]-a[1]).slice(0,3);
    const over=Object.entries(D.budgets).filter(([c,b])=>b>0&&(byCat(items)[c]||0)>b).map(([c])=>CAT[c]?.label||c);
    return [`Carnet de dépenses · ${mLong(m)}`,`Entrées : ${fmtRaw(inc)}`,`Dépenses : ${fmtRaw(spent)}`,`Excédent du mois : ${saved<0?'− ':''}${fmtRaw(Math.abs(saved))}${inc&&saved>=0?` (${pctS(saved/inc)} des entrées non dépensées)`:''}`,`Mis de côté : ${fmtRaw(savedAside(m))}`,top.length?'Postes principaux : '+top.map(([c,v])=>`${CAT[c]?.label||c} ${fmtRaw(v)}`).join(', '):'',over.length?'Budgets dépassés : '+over.join(', '):''].filter(Boolean).join('\n');
  });
}
function openReport(m){
  S.report=m||S.month;$('report').innerHTML=reportHTML(S.report);$('report').hidden=false;$('report').scrollTop=0;
  if(HIDE)toast('Le rapport affiche les montants, même en mode discret.');
}
function closeReport(){$('report').hidden=true;$('report').innerHTML='';S.report=null}
async function shareSummary(m){
  const t=summaryText(m||S.report||S.month);
  if(navigator.share){try{await navigator.share({title:'Carnet de dépenses · '+mLong(m||S.report||S.month),text:t});return}catch(e){if(e&&e.name==='AbortError')return}}
  try{await navigator.clipboard.writeText(t);toast('Résumé copié : colle-le dans WhatsApp ou un message')}catch(e){toast('Partage impossible sur cet appareil')}
}
const reportBlock=()=>`<section class="block"><div class="block-head"><p class="over">Rapport de ${esc(mName(S.month))}</p></div><p class="hint">Un document propre avec les chiffres du mois, les budgets, les plus grosses dépenses et les soldes. Imprime-le en PDF ou envoie un résumé par WhatsApp.</p><div class="actions"><button type="button" class="btn-primary sm" data-act="openReport">Ouvrir le rapport</button><button type="button" class="btn sm" data-act="shareSummary">Partager le résumé</button></div></section>`;

/* ---------- Événements ---------- */
document.addEventListener('click',ev=>{
  const t=ev.target.closest('button,[data-edit],[data-income],[data-move],[data-act]');if(!t)return;
  const ds=t.dataset;
  if(S.armed&&!(ds.act==='applyProp'||ds.act==='applyOwn'||ds.act==='logout'||ds.act==='archiveWallet'||ds.act==='archiveCat'||ds.recDel||ds.subDel||ds.planDel||ds.assetDel||ds.recSkip||ds.rejDrop!==undefined))S.armed=null;
  if(ds.rejRetry!==undefined){rejRetry(+ds.rejRetry);return}
  if(ds.rejEdit!==undefined){rejEdit(+ds.rejEdit);return}
  if(ds.rejDrop!==undefined){rejDrop(+ds.rejDrop);return}
  if(ds.scope){S.scope=['perso','pro'].includes(ds.scope)?ds.scope:'all';LS.set(K.scope,S.scope);render();return}
  if(ds.hz){setHz(ds.hz);return}
  if(ds.check){openCheck(ds.check);return}
  if(ds.fav){addFav(ds.fav);return}
  if(ds.favfill){favFill(ds.favfill);return}
  if(ds.favOff){favToggle(ds.favOff);return}
  if(ds.tab){if(ds.tab==='settings'&&S.tab!=='settings')bkList=null;S.tab=ds.tab;LS.set(K.tab,S.tab);render();$('main').scrollTop=0;return}
  if(ds.restore){restoreBackup(ds.restore);return}
  if(ds.kind){setKind(ds.kind);if(ds.kind==='income')radio('to','banque');if(ds.kind==='move'){radio('from',lastMet());radio('to','epargne');updateMoveFields()}return}
  if(ds.quick){$('f-amount').value=group(ds.quick);return}
  if(ds.span){S.span=+ds.span;LS.set(K.span,S.span);render();return}
  if(ds.filter){S.filter=ds.filter;render();return}
  if(ds.sort){const k=ds.sort;S.sort=S.sort.k===k?{k,d:S.sort.d==='asc'?'desc':'asc'}:{k,d:'desc'};render();return}
  if(ds.export){exportCSV(ds.export);return}
  if(ds.edit){const e=D.expenses[ds.edit];if(e)openSheet(e,'expense');return}
  if(ds.income){const e=D.incomes[ds.income];if(e)openSheet(e,'income');return}
  if(ds.move){const e=D.moves[ds.move];if(e){if(e.kind==='adjust')openAdjust(e);else openSheet(e,'move')}return}
  if(ds.newmove){openSheet(null,'move',{kind:ds.newmove,ref:ds.ref});return}
  if(ds.addplan){addPlan(ds.addplan);return}
  if(ds.planDel){delPlan(ds.planDel);return}
  if(ds.assetDel){delAsset(ds.assetDel);return}
  if(ds.wedit){S.wedit=ds.wedit;S.wopen=true;render();return}
  if(ds.cedit){S.cedit=ds.cedit;S.copen=true;render();return}
  if(ds.tpl){S.tpl=S.tpl===ds.tpl?null:ds.tpl;S.topen=true;render();setTimeout(updateTplPreview,0);return}
  if(ds.cpreset!==undefined){addPreset(+ds.cpreset);return}
  if(ds.planview){S.planView=ds.planview==='subs'?'subs':'goals';LS.set(K.planView,S.planView);render();return}
  if(ds.subEdit){openSubForm(ds.subEdit);return}
  if(ds.subNew){openSubForm(null);return}
  if(ds.subAdd){const d=subDetect().find(x=>x.key===ds.subAdd);if(d)openSubForm(null,d);return}
  if(ds.subIgnore){subIgnore(ds.subIgnore);return}
  if(ds.subDel){subDelClick(ds.subDel,t);return}
  if(ds.subPause){closeDlg();toggleRec(ds.subPause);return}
  if(ds.recharge){rechargeCard(ds.recharge);return}
  if(ds.recPay){openRecPay(ds.recPay,ds.m);return}
  if(ds.recSkip){recSkip(ds.recSkip,ds.m);return}
  if(ds.recToggle){toggleRec(ds.recToggle);return}
  if(ds.recDel){delRec(ds.recDel);return}
  const acts={close:closeSheet,new:()=>openSheet(null,'expense'),newIncome:()=>openSheet(null,'income'),newMove:()=>openSheet(null,'move',{kind:'transfer'}),
    saveBud:saveBudgets,applyProp:applyProposal,saveGoal,saveOpening,saveSub,saveFx,openSubs,subNewCard:()=>{S.tab='accounts';S.wedit='new';S.wopen=true;S.wpreset='card';LS.set(K.tab,'accounts');render();$('main').scrollTop=0},exportJson,pickImport:()=>$('importFile').click(),doImport,cancelImport:()=>{pendingImport=null;render()},
    hideBilan:()=>{LS.set(K.bilan,shiftM(curM(),-1));render()},
    install:async()=>{if(!installEvt)return;installEvt.prompt();try{await installEvt.userChoice}catch(e){}installEvt=null;render()},
    registerPasskey,smsParse,addAsset,restToSavings,saveWallet,archiveWallet,saveCycle,createTpl,enablePush,disablePush:()=>disablePush(false),pushTest,pushTestCheck,saveRem,backupNow,openReport:()=>openReport(S.month),openPrevReport:()=>openReport(shiftM(curM(),-1)),sharePrev:()=>shareSummary(shiftM(curM(),-1)),closeReport,printReport:()=>window.print(),shareReport:()=>shareSummary(S.report),shareSummary:()=>shareSummary(S.month),nudgeLater:()=>{LS.set(K.bkSnooze,Date.now()+14*864e5);render()},saveCat,archiveCat,newCat:()=>{S.cedit='new';S.copen=true;render()},cancelCat:()=>{S.cedit=null;S.copen=true;render()},newWallet:()=>{S.wedit='new';S.wpreset=null;S.wopen=true;render()},cancelWallet:()=>{S.wedit=null;S.wpreset=null;S.wopen=true;render()},ics:exportICS,
    smsToggle:()=>{$('smsArea').hidden=!$('smsArea').hidden;if(!$('smsArea').hidden)$('smsText').focus()},
    toggleDiscreet:()=>{LS.set('cd2-discreet',!discreet());applyDiscreet();render()},
    sendFeedback:()=>sendFeedback('send'),shareFeedback:()=>sendFeedback('share'),changePwd,
    applyOwn,toggleMore:()=>{S.more=!S.more;render()},startOnb,onbNext,onbBack,onbLater,onbSkip,onbFirst,dlgClose:closeDlg,ckSave,ckExpense,adjDel:()=>adjDel(ds.id),
    toastUndo:()=>{const u=toast.undo;toast.undo=null;$('toast').hidden=true;if(u)u()},
    syncNow:()=>sync(true).then(()=>toast(navigator.onLine?'Synchronisé':'Hors ligne : réessaie plus tard')),logout};
  if(acts[ds.act])acts[ds.act]();
});
// Mémorise les sections repliables ouvertes ou fermées par l'utilisateur, pour qu'un nouveau rendu ne les rouvre pas
document.addEventListener('toggle',ev=>{const d=ev.target;if(d&&d.dataset&&d.dataset.keep)S[d.dataset.keep]=d.open},true);
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&!$('dlgWrap').hidden)closeDlg();
  else if(ev.key==='Escape'&&!$('report').hidden)closeReport();
  else if(ev.key==='Escape'&&!$('sheetWrap').hidden)closeSheet();
  if(ev.key==='Enter'&&ev.target.matches('tr[data-edit],tr[data-move]'))ev.target.click();
});
document.addEventListener('input',ev=>{
  const i=ev.target;
  if(i.id&&i.id.startsWith('tp-'))updateTplPreview();
  if(i.id==='ck-real')ckUpdate();
  if(i.id==='sb-amt'||i.id==='sb-fx')subFormSync(ev);
  if(i.id==='f-amount')updateKeep();
  if(i.id==='f-note'){clearTimeout(suggestCat._t);suggestCat._t=setTimeout(suggestCat,250)}
  if(i.id==='q'){S.q=i.value;const pos=i.selectionStart;render();const n=$('q');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}return}
  if(['f-amount','f-fee','ck-real'].includes(i.id)||i.dataset.bud!==undefined||i.dataset.money!==undefined){const d=digits(i.value).slice(0,12);i.value=d?group(d.replace(/^0+(?=\d)/,'')):''}
});
document.addEventListener('change',ev=>{
  if(ev.target.id==='remember'){LS.set(K.remember,ev.target.checked);sb?.auth.getSession().then(({data})=>{if(data.session){authStore.setItem('cd2-auth',JSON.stringify(data.session))}});toast(ev.target.checked?'Tu resteras connecté sur cet appareil':'Reconnexion demandée à chaque ouverture');return}
  if(ev.target.id==='discreetOpt'){LS.set('cd2-discreet',ev.target.checked);applyDiscreet();return}
  if(ev.target.id==='lockOpt'){LS.set(K.lock,ev.target.checked);toast(ev.target.checked?'Verrouillage activé':'Verrouillage désactivé');return}
  if(['sb-cur','sb-met','sb-date'].includes(ev.target.id)){subFormSync(ev);return}
  const n=ev.target.name;
  if(n==='cat'){S.catTouched=true;$('catHint').hidden=true;if(!S.natTouched)radio('nat',NEED.has(ev.target.value)?'besoin':'envie')}
  if(n==='nat')S.natTouched=true;
  if(n==='met'||n==='from'||n==='to'||ev.target.id==='f-mkind'){if(ev.target.id==='f-mkind'){const M=MOVES[ev.target.value];if(M.fixedTo)radio('to',M.fixedTo)}updateMoveFields()}
});
document.addEventListener('paste',ev=>{
  if($('sheetWrap').hidden||ev.target.id==='smsText')return;
  const txt=(ev.clipboardData||window.clipboardData)?.getData('text')||'';
  if(txt.length>40&&/(fcfa|xaf|cfa)/i.test(txt)){ev.preventDefault();$('smsArea').hidden=false;$('smsText').value=txt;smsParse()}
});
$('importFile').addEventListener('change',async ev=>{
  const f=ev.target.files[0];ev.target.value='';if(!f)return;
  try{pendingImport=parseBackup(await f.text());S.tab='settings';render();$('main').scrollTop=$('main').scrollHeight}catch(e){toast(e.message||'Fichier illisible')}
});
$('fab').onclick=()=>openSheet(null,'expense');
$('monthLabel').onclick=()=>{if(S.month!==curM()){S.month=curM();S.filter='all';render()}};
$('prevM').onclick=()=>{S.month=shiftM(S.month,-1);S.filter='all';render()};
$('nextM').onclick=()=>{S.month=shiftM(S.month,1);S.filter='all';render()};
$('f').addEventListener('submit',saveSheet);
$('f-del').onclick=deleteSheet;
window.addEventListener('online',()=>{retryN=0;sync(true)});
$('sync').addEventListener('click',()=>{retryN=0;sync(true).then(()=>toast(!navigator.onLine?'Hors ligne : les envois partiront à la reconnexion':outbox.length?outbox.length+' envoi(s) encore en attente':'Tout est synchronisé'))});
setInterval(()=>{if(document.visibilityState==='visible'&&navigator.onLine&&outbox.length&&!flushing&&!retryAt)flush()},60000);
window.addEventListener('offline',updateSync);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync(false)});
['gesturestart','gesturechange'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
let lastTouch=0;document.addEventListener('touchend',e=>{const n=Date.now();if(n-lastTouch<300&&!e.target.closest('input,select,textarea'))e.preventDefault();lastTouch=n},{passive:false});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'){LS.set(K.hiddenAt,Date.now());return}
  const away=Date.now()-LS.get(K.hiddenAt,Date.now());
  if(LS.get(K.lock,false)&&LS.get(K.passkey,false)&&!locked&&!$('app').hidden&&away>120000)showLock();
});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;if(S.tab==='settings')render()});

/* ---------- Accès ---------- */
function gate(html){$('app').hidden=true;$('gate').hidden=false;$('gate').innerHTML=html}
const band=`<div class="band"><span class="band-mark">${LOGO('#FFFFFF')}</span><h1>Carnet de <em>dépenses</em></h1><p>Ton budget, tes portefeuilles et ton épargne, en francs CFA.</p></div>`;
function showSetup(){gate(band+`<div class="body"><p>L'application n'est pas encore reliée à ta base Supabase.</p><p class="hint">Renseigne l'URL du projet et la clé publique dans <b>config.js</b>, puis republie le site. Le guide complet est dans le README.</p></div>`)}
function showLogin(m,ok){
  gate(band+`<div class="body"><form id="login" novalidate style="display:flex;flex-direction:column;gap:16px">
      ${HAS_WEBAUTHN?`<button type="button" class="btn-action btn-wide" id="l-pk">${ic('scan')}Se connecter avec ${BIO}</button><p class="or"><span>ou avec ton mot de passe</span></p>`:''}
      <label class="inp">Adresse électronique<input type="email" id="l-email" name="username" autocomplete="username" autocapitalize="off" required value="${esc(email)}"></label>
      <label class="inp">Mot de passe<input type="password" id="l-pass" name="password" autocomplete="current-password" minlength="8" required></label>
      <div class="row-between"><label class="check"><input type="checkbox" id="l-show"> Afficher le mot de passe</label><button type="button" class="linkbtn" id="l-forgot">Mot de passe oublié ?</button></div>
      <label class="check"><input type="checkbox" id="l-remember" ${remember()?'checked':''}> Rester connecté sur cet appareil</label>
      <p class="err" id="l-err" ${m?'':'hidden'} style="${ok?'color:var(--success)':''}">${esc(m||'')}</p>
      <button type="submit" class="${HAS_WEBAUTHN?'btn-primary':'btn-action'} btn-wide" id="l-in">Se connecter</button>
      <button type="button" class="btn btn-wide" id="l-up">Créer mon compte</button></form>${IOS&&!STANDALONE()?`<section class="block" style="margin-top:8px"><p class="over">Installer sur l'iPhone</p>${installGuide()}</section>`:''}</div>`);
  if($('l-pk'))$('l-pk').onclick=passkeyLogin;
  $('l-remember').onchange=e=>LS.set(K.remember,e.target.checked);
  $('l-show').onchange=e=>{$('l-pass').type=e.target.checked?'text':'password'};
  $('l-forgot').onclick=()=>showReset($('l-email').value.trim());
  const err=x=>{$('l-err').textContent=x;$('l-err').hidden=false;$('l-err').style.color=''};
  const creds=()=>({email:$('l-email').value.trim(),password:$('l-pass').value});
  $('login').addEventListener('submit',async ev=>{ev.preventDefault();const c=creds();if(!c.email||!c.password)return err('Indique ton adresse et ton mot de passe.');
    $('l-in').disabled=true;let r;try{r=await sb.auth.signInWithPassword(c)}catch(e){r={error:e}}$('l-in').disabled=false;
    if(r.error)return err(authMsg(r.error));startApp(r.data.session,true)});
  $('l-up').addEventListener('click',async()=>{const c=creds();if(!c.email)return err('Indique ton adresse électronique.');const bad=pwdIssue(c.password,c.email);if(bad)return err(bad);
    $('l-up').disabled=true;let r;try{r=await sb.auth.signUp(c)}catch(e){r={error:e}}$('l-up').disabled=false;
    if(r.error)return err(/not allowed|disabled|signups/i.test(String(r.error.message))?'Les inscriptions sont fermées sur ce carnet. Demande un accès à l\'administrateur.':authMsg(r.error));
    if(r.data.session)return startApp(r.data.session,true);
    err('Compte créé. Ouvre le lien de confirmation reçu par courriel, puis connecte-toi.');$('l-err').style.color='var(--success)'});
}
// Mot de passe oublié : un lien est envoyé par courriel ; la réponse ne révèle jamais si l'adresse existe
function showReset(mail){
  gate(band+`<div class="body"><form id="reset" novalidate style="display:flex;flex-direction:column;gap:16px">
      <p style="margin:0">Indique ton adresse électronique. Si un compte existe, tu reçois un lien pour choisir un nouveau mot de passe.</p>
      <label class="inp">Adresse électronique<input type="email" id="r-mail" autocomplete="username" autocapitalize="off" required value="${esc(mail||'')}"></label>
      <p class="err" id="r-msg" hidden></p>
      <button type="submit" class="btn-action btn-wide" id="r-send">Envoyer le lien</button>
      <button type="button" class="btn btn-wide" id="r-back">Retour à la connexion</button></form></div>`);
  const say=(x,good)=>{$('r-msg').textContent=x;$('r-msg').hidden=false;$('r-msg').style.color=good?'var(--success)':''};
  $('r-back').onclick=()=>showLogin();
  $('reset').addEventListener('submit',async ev=>{ev.preventDefault();const mail=$('r-mail').value.trim();
    if(!/^\S+@\S+\.\S+$/.test(mail))return say('Indique une adresse électronique valide.');
    $('r-send').disabled=true;let r;try{r=await sb.auth.resetPasswordForEmail(mail,{redirectTo:siteUrl()})}catch(e){r={error:e}}
    if(r.error){$('r-send').disabled=false;return say(authMsg(r.error))}
    say('Si un compte existe pour cette adresse, un lien vient d\'être envoyé. Ouvre-le sur ce téléphone. Pense à regarder les courriers indésirables. Sans message après 10 minutes, demande à l\'administrateur de réinitialiser ton accès.',true);
    let n=60;$('r-send').textContent='Renvoyer dans 60 s';const iv=setInterval(()=>{n--;if(!$('r-send')){clearInterval(iv);return}$('r-send').textContent=n>0?'Renvoyer dans '+n+' s':'Renvoyer le lien';if(n<=0){clearInterval(iv);$('r-send').disabled=false}},1000)});
}
// Arrivée par le lien du courriel : choix du nouveau mot de passe
function showNewPassword(){
  gate(band+`<div class="body"><form id="np" novalidate style="display:flex;flex-direction:column;gap:16px">
      <p style="margin:0">Choisis ton nouveau mot de passe.</p>
      <label class="inp">Nouveau mot de passe<input type="password" id="n-pass" autocomplete="new-password" minlength="8" required></label>
      <label class="inp">Confirmer le mot de passe<input type="password" id="n-pass2" autocomplete="new-password" required></label>
      <p class="hint">8 caractères au moins, avec des lettres et des chiffres.</p>
      <p class="err" id="n-err" hidden></p>
      <button type="submit" class="btn-action btn-wide" id="n-save">Enregistrer le mot de passe</button></form></div>`);
  const err=m=>{$('n-err').textContent=m;$('n-err').hidden=false};
  $('np').addEventListener('submit',async ev=>{ev.preventDefault();const a=$('n-pass').value, b=$('n-pass2').value, bad=pwdIssue(a,email);
    if(bad)return err(bad);if(a!==b)return err('Les deux mots de passe ne sont pas identiques.');
    $('n-save').disabled=true;let r;try{r=await sb.auth.updateUser({password:a})}catch(e){r={error:e}}
    if(r.error){$('n-save').disabled=false;return err(authMsg(r.error))}
    try{history.replaceState(null,'',siteUrl())}catch(e){}
    const {data}=await sb.auth.getSession();recovering=false;
    if(data.session){toast('Mot de passe modifié');startApp(data.session,true)}else showLogin('Mot de passe modifié. Connecte-toi avec le nouveau.',true)});
}
function startApp(session,unlocked){
  if(!unlocked&&session&&LS.get(K.lock,false)&&LS.get(K.passkey,false)&&HAS_WEBAUTHN){if(session){uid=session.user.id;email=session.user.email||''}return showLock()}
  if(session){uid=session.user.id;email=session.user.email||'';LS.set(K.uid,uid);LS.set(K.email,email)}
  if(!LS.get(K.firstUse,0))LS.set(K.firstUse,Date.now());
  if(S.tab==='budgets'||S.tab==='tips')S.tab='plan';
  $('gate').hidden=true;$('app').hidden=false;render();
  if(sb)sync(true);
}
// Lien de réinitialisation (courriel) : détecté avant que la bibliothèque ne lise puis efface l'adresse
const RECOVERY=/[#&?]type=recovery/.test(location.hash+location.search), LINK_ERR=/error_code=otp_expired|error=access_denied/.test(location.hash+location.search);
let recovering=RECOVERY;
async function init(){
  rebuildWallets();rebuildCats();buildStatic();applyDiscreet();
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
  const cfg=window.CARNET_CONFIG||{};
  if(!window.supabase){if(uid)return startApp(null);return gate(band+`<div class="body"><p>Connexion impossible pour le moment. Vérifie ta connexion Internet puis recharge la page.</p></div>`)}
  if(!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY)return showSetup();
  sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'cd2-auth',storage:authStore,flowType:'implicit'}});
  sb.auth.onAuthStateChange(ev=>{if(ev==='PASSWORD_RECOVERY'){recovering=true;showNewPassword()}});
  const {data}=await sb.auth.getSession();
  if(LINK_ERR){try{history.replaceState(null,'',siteUrl())}catch(e){}return showLogin('Ce lien a expiré ou a déjà servi. Touche « Mot de passe oublié » pour en demander un nouveau.')}
  if(recovering&&data.session)return showNewPassword();
  if(data.session)startApp(data.session);
  else if(uid&&!navigator.onLine&&remember())(LS.get(K.lock,false)&&LS.get(K.passkey,false)?showLock():startApp(null));
  else showLogin();
}
init();
