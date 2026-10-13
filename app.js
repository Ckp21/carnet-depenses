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
  flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>'
};
const ic=(n,c='')=>`<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||''}</svg>`;

/* ---------- Référentiels ---------- */
const CATS=[
  ["alimentation","Alimentation","#067C3A"],["transport","Transport","#1570EF"],["logement","Logement","#04382A"],
  ["factures","Factures (eau, élec., internet)","#F5C04A"],["communication","Crédit & data","#3FAE75"],["sante","Santé","#B45309"],
  ["famille","Famille & dons","#93340A"],["loisirs","Loisirs & sorties","#CD8309"],["vetements","Vêtements","#4C5D54"],
  ["education","Éducation","#7CC79C"],["autres","Autres","#9AA8A1"]
];
const CAT=Object.fromEntries(CATS.map(c=>[c[0],{label:c[1],color:c[2]}]));
CAT.frais={label:'Frais financiers',color:'#64756C'};
const NEED=new Set(['alimentation','transport','logement','factures','communication','sante','education','frais']);
const WALLETS=[["especes","Espèces","#067C3A"],["mtn","MTN MoMo","#F5C04A"],["airtel","Airtel Money","#93340A"],["banque","Banque/Carte","#1570EF"],["epargne","Épargne","#04382A"]];
const WAL=Object.fromEntries(WALLETS.map(w=>[w[0],{label:w[1],color:w[2]}]));
const METHODS=WALLETS.slice(0,4);
const SOURCES=[["salaire","Salaire","#04382A"],["prime","Prime","#3FAE75"],["mission","Mission / freelance","#F5C04A"],["autre","Autre","#9AA8A1"]];
const SRC=Object.fromEntries(SOURCES.map(s=>[s[0],{label:s[1],color:s[2]}]));
const MOMO=new Set(['mtn','airtel']);
const MOVES={
  transfer:{label:'Transfert entre portefeuilles',from:true,to:true},
  tontine_out:{label:'Cotisation tontine',from:true,plan:'tontine'},
  tontine_in:{label:'Réception tontine',to:true,plan:'tontine'},
  loan_out:{label:'Je prête de l\'argent',from:true,plan:'loan'},
  loan_back:{label:'On me rembourse',to:true,plan:'loan'},
  debt_in:{label:'J\'emprunte',to:true,plan:'debt'},
  debt_pay:{label:'Je rembourse une dette',from:true,plan:'debt'},
  project:{label:'Versement sur un projet',from:true,plan:'project',fixedTo:'epargne'}
};
const PLAN_LABEL={tontine:'Tontine',loan:'Prêt accordé',debt:'Dette',project:'Projet d\'épargne'};

/* ---------- Utilitaires ---------- */
const nf=new Intl.NumberFormat('fr-FR');
const fmt=n=>nf.format(Math.round(n))+' FCFA';
const fmtN=n=>nf.format(Math.round(n));
const fmtS=n=>(n<0?'− ':'')+fmt(Math.abs(n));
const pctS=(x,d=0)=>(x<0?'−':'')+Math.abs(x*100).toFixed(d).replace('.',',')+' %';
const shortN=n=>{const a=Math.abs(n),s=n<0?'−':'';return s+(a>=1e6?(a/1e6).toFixed(1).replace('.',',')+' M':a>=1000?Math.round(a/1000)+' k':String(Math.round(a)))};
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
const dFr=iso=>{const [y,m,d]=iso.split('-');return d+'/'+m+'/'+y};
const dLong=iso=>parseISO(iso).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
const daysBetween=(a,b)=>Math.round((parseISO(b)-parseISO(a))/864e5);
const digits=s=>String(s||'').replace(/\D/g,'');
const group=s=>String(s).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const toInt=s=>parseInt(digits(s)||'0',10);
const nowISO=()=>new Date().toISOString();
const newId=()=>(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
const spend=e=>e.amount+(e.fee||0);
const sumBy=(a,f)=>a.reduce((t,x)=>t+f(x),0);
const median=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),h=s.length>>1;return s.length%2?s[h]:(s[h-1]+s[h])/2};
const $=id=>document.getElementById(id);
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};

/* ---------- État ---------- */
const K={cache:'cd2-cache',outbox:'cd2-outbox',uid:'cd2-uid',email:'cd2-email',tab:'cd2-tab',met:'cd2-met',bilan:'cd2-bilan-vu',span:'cd2-span'};
const DEF_SETTINGS={savings_goal:0,opening:{},opening_date:null,emergency_months:3,inflation:4};
const EMPTY=()=>({expenses:{},incomes:{},budgets:{},recurring:{},moves:{},plans:{},settings:Object.assign({},DEF_SETTINGS)});
let D=Object.assign(EMPTY(),LS.get(K.cache,{}));
D.settings=Object.assign({},DEF_SETTINGS,D.settings);D.moves=D.moves||{};D.plans=D.plans||{};
let outbox=LS.get(K.outbox,[]);
let sb=null, uid=LS.get(K.uid,null), email=LS.get(K.email,'');
let flushing=false, lastSync=0, installEvt=null, pendingImport=null, schemaOld=false;
const S={month:ymOf(new Date()),tab:LS.get(K.tab,'dash'),filter:'all',q:'',sort:{k:'date',d:'desc'},kind:'expense',editing:null,confirmDel:false,armed:null,natTouched:false,span:LS.get(K.span,6)};

const saveLocal=()=>{LS.set(K.cache,D);LS.set(K.outbox,outbox)};
const curM=()=>ymOf(new Date());
const expenses=()=>Object.values(D.expenses);
const incomes=()=>Object.values(D.incomes);
const moves=()=>Object.values(D.moves);
const plans=t=>Object.values(D.plans).filter(p=>!t||p.type===t);
// Les frais des mouvements (retraits, transferts) sont des dépenses réelles : catégorie « Frais financiers »
const feeItems=()=>moves().filter(m=>m.fee>0).map(m=>({id:'mv-'+m.id,moveId:m.id,synthetic:true,amount:m.fee,fee:0,category:'frais',method:m.from_wallet||'especes',date:m.date,note:'Frais : '+(MOVES[m.kind]?.label||'mouvement'),nature:'besoin'}));
const allItems=()=>expenses().concat(feeItems());
const monthItems=m=>allItems().filter(e=>e.date.slice(0,7)===m);
const monthInc=m=>incomes().filter(e=>e.date.slice(0,7)===m);
const monthMoves=m=>moves().filter(e=>e.date.slice(0,7)===m);
const spentIn=m=>sumBy(monthItems(m),spend);
const incomeIn=m=>sumBy(monthInc(m),e=>e.amount);
const feesOf=list=>sumBy(list,e=>e.category==='frais'?e.amount:(e.fee||0));
const natureOf=e=>e.nature||(NEED.has(e.category)?'besoin':'envie');
function byCat(list){const o={};for(const e of list)o[e.category]=(o[e.category]||0)+spend(e);return o}
const hasBudgets=()=>Object.values(D.budgets).some(v=>v>0);
const budgetState=(s,b)=>{const r=s/b;return r>1?'danger':r>=.8?'warning':'success'};

function toast(msg){const t=$('toast');t.textContent=msg;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>t.hidden=true,2800)}
const msg=(tone,title,body)=>`<div class="msg ${tone}" role="status">${ic({info:'info',success:'check',warning:'alert',danger:'error'}[tone])}<div><b>${title}</b>${body?`<span>${body}</span>`:''}</div></div>`;
const pill=(tone,label)=>`<span class="pill ${tone}">${ic({info:'info',success:'check',warning:'alert',danger:'error'}[tone]||'info')}${label}</span>`;

/* ---------- Synchronisation ---------- */
function applyLocal(op){
  if(op.t==='budgets'){ if(op.op==='upsert')D.budgets[op.row.category]=op.row.amount; else delete D.budgets[op.key]; return }
  if(op.t==='settings'){ D.settings=Object.assign({},D.settings,op.row); return }
  if(op.op==='upsert')D[op.t][op.row.id]=op.row; else delete D[op.t][op.id];
}
function mutate(ops){for(const op of ops){applyLocal(op);outbox.push(op)}saveLocal();render();flush()}
const CONFLICT={budgets:'user_id,category',settings:'user_id'};
const SCHEMA_CODES=new Set(['PGRST204','PGRST205','42703','42P01']);
function isFatal(err){const c=String(err.code||'');return /^(22|23)/.test(c)||c==='42501'}
async function flush(){
  if(flushing||!sb||!uid||!navigator.onLine||!outbox.length){updateSync();return}
  flushing=true;updateSync();
  while(outbox.length){
    const op=outbox[0];let error=null;
    try{
      if(op.op==='upsert'){({error}=await sb.from(op.t).upsert(Object.assign({},op.row,{user_id:uid}),{onConflict:CONFLICT[op.t]||'id'}))}
      else{let q=sb.from(op.t).delete();q=op.t==='budgets'?q.eq('category',op.key):q.eq('id',op.id);({error}=await q)}
    }catch(e){error={message:String(e)}}
    if(error){
      if(SCHEMA_CODES.has(String(error.code))){schemaOld=true;break}
      if(isFatal(error)){console.warn('Refusé',op,error);toast('Une modification a été refusée : '+(error.message||'erreur'));outbox.shift();LS.set(K.outbox,outbox);continue}
      break;
    }
    outbox.shift();LS.set(K.outbox,outbox);
  }
  flushing=false;updateSync();
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
    saveLocal();lastSync=Date.now();return true;
  }catch(e){console.warn('Lecture impossible',e);return false}
}
async function sync(force){
  if(!force&&Date.now()-lastSync<20000)return;
  await flush();
  if(await pull()){render();runRecurring()}
  updateSync();
}
function updateSync(){
  const el=$('sync');if(!el)return;
  const off=!navigator.onLine||!sb, pend=outbox.length>0;
  el.className='sync'+(off?' off':pend?' pending':'');
  $('syncTxt').textContent=off?(pend?`hors ligne · ${outbox.length} en attente`:'hors ligne'):pend?`${outbox.length} envoi(s) en attente`:'synchronisé';
}

/* ---------- Récurrentes ---------- */
function runRecurring(){
  const cur=curM(), td=new Date().getDate(), now=nowISO(), ops=[];let n=0;
  for(const r of Object.values(D.recurring)){
    if(!r.active)continue;
    let m=shiftM(r.last_month,1), last=r.last_month;
    while(m<=cur){
      const day=Math.min(r.day,daysIn(m));
      if(m===cur&&td<day)break;
      const id=`rec-${r.id}-${m}`;
      if(!D.expenses[id]){ops.push({t:'expenses',op:'upsert',row:{id,amount:r.amount,fee:r.fee||0,category:r.category,method:r.method,nature:null,date:`${m}-${pad(day)}`,note:r.label,recurring_id:r.id,created_at:now,updated_at:now}});n++}
      last=m;m=shiftM(m,1);
    }
    if(last!==r.last_month)ops.push({t:'recurring',op:'upsert',row:Object.assign({},r,{last_month:last,updated_at:now})});
  }
  if(ops.length){mutate(ops);if(n)toast(n>1?`${n} dépenses récurrentes ajoutées`:'1 dépense récurrente ajoutée')}
}

/* ---------- Calculs financiers ---------- */
const SMIG=70400; // SMIG mensuel depuis le 1er janvier 2025
const INS_BZV={alimentation:44.4,logfac:9.7,transport:10.0,communication:6.7,vetements:6.9,loisirs:7.6,sante:2.4,education:2.9,divers:9.3};
const PRICES={bus:150,taxi:1000,kwh:49.08,fibre:35000};
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
function balance(w){
  const od=D.settings.opening_date, ok=d=>!od||d>=od;
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
const fixedCharges=()=>sumBy(Object.values(D.recurring).filter(r=>r.active),r=>r.amount+(r.fee||0));
const commitments=m=>sumBy(plans('tontine').filter(p=>p.active!==false&&(p.data?.start||'')<=m+'-31'&&planStats(p).end.slice(0,7)>=m),p=>planStats(p).monthly);
function dayBudget(m){
  const inc=incomeIn(m);if(!inc)return null;
  const items=monthItems(m), fixedDone=sumBy(items.filter(e=>e.recurring_id),spend);
  const fixedLeft=sumBy(Object.values(D.recurring).filter(r=>r.active&&r.last_month<m),r=>r.amount+(r.fee||0));
  const fixed=fixedDone+fixedLeft, goal=savingsGoal(m), engage=commitments(m);
  const rav=inc-fixed-goal-engage, variable=sumBy(items.filter(e=>!e.recurring_id),spend);
  const Dm=daysIn(m), today=new Date().getDate(), left=m===curM()?Dm-today+1:0;
  return {inc,fixed,goal,engage,rav,variable,left,perDay:left?(rav-variable)/left:0,used:rav>0?variable/rav:1};
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
const TABS=[['dash','Accueil','home'],['list','Dépenses','list'],['accounts','Comptes','wallet'],['plan','Plan','target'],['analyse','Analyse','chart']];
function render(){
  if($('app').hidden)return;
  $('monthLabel').textContent=mLong(S.month);
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===S.tab?'page':'false'));
  const views={dash:renderDash,list:renderList,accounts:renderAccounts,plan:renderPlan,analyse:renderAnalyse,settings:renderSettings};
  let top='';
  if(!sb)top+=msg('info','Mode hors ligne','Tes saisies sont gardées sur ce téléphone et partiront dès que le serveur sera joignable.');
  if(schemaOld)top+=msg('warning','Mise à jour de la base nécessaire','Exécute le script <b>supabase/migration-2.1.sql</b> dans Supabase. Tes saisies restent en attente sur ce téléphone, rien n\'est perdu.');
  $('main').innerHTML=top+(views[S.tab]||renderDash)();
  updateSync();
}

function renderDash(){
  const m=S.month, items=monthItems(m), spent=sumBy(items,spend), inc=incomeIn(m), name=mName(m), isCur=m===curM();
  let h='';
  const B=isCur?dayBudget(m):null;
  if(B){
    const neg=B.perDay<0;
    h+=`<section class="block hero"><p class="over">Budget par jour · jusqu'au ${daysIn(m)} ${esc(name)}</p>
      <div class="big num">${neg?'0':fmtN(Math.max(0,B.perDay))} <small>FCFA</small></div>
      <div class="bar"><div style="width:${Math.min(B.used,1)*100}%;background:${B.used>1?'var(--danger)':B.used>.85?'var(--gold-400)':'var(--forest-400)'}"></div></div>
      <div class="sub num"><span>Reste à vivre <b>${fmtS(B.rav)}</b></span><span>Dépenses courantes <b>${fmt(B.variable)}</b></span><span>${B.left} jour${B.left>1?'s':''} restant${B.left>1?'s':''}</span></div></section>`;
    if(neg)h+=msg('danger','Reste à vivre dépassé',`Tes dépenses courantes dépassent de ${fmt(B.variable-B.rav)} ce qui restait après charges fixes, engagements et épargne visée.`);
  }else if(inc>0){
    const bal=inc-spent;
    h+=`<section class="block hero"><p class="over">Solde de ${esc(name)}</p><div class="big num">${fmtS(bal)}</div>
      <div class="sub num"><span>Entrées <b>${fmt(inc)}</b></span><span>Dépensé <b>${fmt(spent)}</b></span></div></section>`;
  }else{
    h+=`<section class="block hero"><p class="over">Dépensé en ${esc(name)}</p><div class="big num">${fmtN(spent)} <small>FCFA</small></div>
      <div class="sub"><button type="button" class="linkbtn" data-act="newIncome">Ajouter une entrée d'argent pour calculer ton budget par jour</button></div></section>`;
  }
  // Alertes
  const cats=byCat(items);
  const al=Object.entries(D.budgets).filter(([c,b])=>b>0&&(cats[c]||0)/b>=.8).map(([c,b])=>({c,b,s:cats[c]||0}));
  const over=al.filter(a=>a.s>a.b), near=al.filter(a=>a.s<=a.b);
  if(over.length)h+=msg('danger','Budget dépassé',over.map(a=>`${esc(CAT[a.c]?.label||a.c)} : ${fmt(a.s)} sur ${fmt(a.b)}`).join('<br>'));
  if(near.length)h+=msg('warning','Budget presque atteint',near.map(a=>`${esc(CAT[a.c]?.label||a.c)} : ${a.s>=a.b?'budget atteint':'reste '+fmt(a.b-a.s)}`).join('<br>'));
  for(const a of alertsDue())h+=msg(a.tone,a.title,a.body);
  const un=unusual(m);
  if(un.length)h+=msg('info','Dépense inhabituelle',un.map(u=>`${esc(CAT[u.e.category]?.label)} : ${fmt(spend(u.e))} le ${dFr(u.e.date)}, ${u.ratio.toFixed(1).replace('.',',')} fois ta dépense habituelle`).join('<br>'));
  // Indicateurs
  const saved=inc-spent, rate=inc?saved/inc:null, E=emergency(), fees=feesOf(items);
  h+=`<div class="kpis">
    <div class="kpi"><span class="over">Solde du mois</span><span class="v num ${saved<0?'neg':''}">${inc?fmtS(saved):'-'}</span><span class="d">${inc?`entrées ${shortN(inc)} · dépensé ${shortN(spent)}`:'aucune entrée saisie'}</span></div>
    <div class="kpi"><span class="over">Taux d'épargne</span><span class="v num ${rate!=null&&rate<0?'neg':''}">${rate==null?'-':pctS(rate)}</span><span class="d">${inc?`objectif ${pctS(savingsGoal(m)/inc)}`:'-'}</span></div>
    <div class="kpi"><span class="over">Fonds d'urgence</span><span class="v num">${E.avg?E.covered.toFixed(1).replace('.',',')+' mois':'-'}</span><span class="d">cible ${D.settings.emergency_months||3} mois · ${fmt(E.fund)}</span></div>
    <div class="kpi"><span class="over">Frais financiers</span><span class="v num">${fmt(fees)}</span><span class="d">Mobile Money et transferts</span></div></div>`;
  if(inc>0&&!hasBudgets())h+=`<button type="button" class="teaser" data-tab="plan"><div><b>Des budgets adaptés à tes revenus sont prêts</b><span>Calculés avec les statistiques de consommation de Brazzaville.</span></div>${ic('right')}</button>`;
  const prev=shiftM(curM(),-1);
  if(isCur&&new Date().getDate()<=7&&LS.get(K.bilan,'')!==prev&&(monthItems(prev).length||monthInc(prev).length))
    h+=`<section class="block"><div class="block-head"><p class="over">Bilan de ${esc(mName(prev))}</p><button type="button" class="linkbtn" data-act="hideBilan">Masquer</button></div>${bilanHTML(prev)}</section>`;
  // Portefeuilles
  h+=`<section class="block"><div class="block-head"><p class="over">Portefeuilles</p><button type="button" class="linkbtn" data-tab="accounts">Détails</button></div><div class="rows">${WALLETS.map(([w,l,c])=>{const b=balance(w);return `<div class="rowbtn" style="cursor:default"><span class="dot" style="background:${c}"></span><span class="t"><span>${esc(l)}</span></span><b class="num" style="${b<0?'color:var(--danger)':''}">${fmtS(b)}</b></div>`}).join('')}</div>
    ${D.settings.opening_date?'':'<p class="hint">Saisis tes soldes de départ dans Comptes pour des montants exacts.</p>'}</section>`;
  if(!items.length)return h+`<section class="block"><div class="empty"><strong>Aucune dépense en ${esc(name)}</strong><span>Touche « Ajouter » pour noter ta première dépense, ou programme tes dépenses récurrentes dans Réglages.</span></div></section>`;
  const bud=Object.entries(D.budgets).filter(([,b])=>b>0);
  if(bud.length){
    h+=`<section class="block"><div class="block-head"><p class="over">Budgets du mois</p><small class="num">${fmt(sumBy(bud,([c])=>cats[c]||0))} sur ${fmt(sumBy(bud,([,b])=>b))}</small></div><div class="list">`;
    for(const [c,b] of bud.sort((x,y)=>(cats[y[0]]||0)/y[1]-(cats[x[0]]||0)/x[1])){
      const s=cats[c]||0, st=budgetState(s,b);
      h+=`<div class="hbar"><div class="lab"><span class="dot" style="background:${CAT[c]?.color}"></span><span>${esc(CAT[c]?.label||c)}</span></div>${pill(st,st==='danger'?'Dépassé':Math.round(s/b*100)+' %')}
        <div class="track"><div class="fill" style="width:${Math.min(s/b,1)*100}%;background:var(--${st==='success'?'forest-600':st})"></div></div><span class="pct num" style="grid-column:1/-1">${fmt(s)} sur ${fmt(b)}</span></div>`;
    }
    h+=`</div></section>`;
  }
  const need=sumBy(items.filter(e=>natureOf(e)==='besoin'),spend);
  h+=`<section class="block"><p class="over">Répartition</p>
    <div class="stack"><div style="width:${need/spent*100}%;background:var(--forest-900)"></div><div style="width:${(spent-need)/spent*100}%;background:var(--gold-400)"></div></div>
    <div class="legend"><div><span class="dot" style="background:var(--forest-900)"></span><span>Besoins</span><span class="v num">${pctS(need/spent)}</span></div><div><span class="dot" style="background:var(--gold-400)"></span><span>Envies</span><span class="v num">${pctS((spent-need)/spent)}</span></div></div>
    <div class="list" style="margin-top:8px">`;
  for(const [c,v] of Object.entries(cats).sort((a,b)=>b[1]-a[1])){const p=v/spent*100;
    h+=`<div class="hbar"><div class="lab"><span class="dot" style="background:${CAT[c]?.color||'#9AA8A1'}"></span><span>${esc(CAT[c]?.label||c)}</span></div><span class="num"><b>${fmt(v)}</b> <span class="pct">${p.toFixed(0)} %</span></span><div class="track"><div class="fill" style="width:${p}%;background:${CAT[c]?.color||'#9AA8A1'}"></div></div></div>`}
  h+=`</div></section>`;
  const top=[...items].sort((a,b)=>spend(b)-spend(a)).slice(0,5);
  h+=`<section class="block"><p class="over">Top 5 des dépenses</p><div class="rows">${top.map((e,i)=>`<button type="button" class="rowbtn" ${e.synthetic?`data-move="${esc(e.moveId)}"`:`data-edit="${esc(e.id)}"`}><span class="rank">${i+1}</span><span class="t"><span>${esc(CAT[e.category]?.label||e.category)}</span><span>${dFr(e.date)} · ${esc(WAL[e.method]?.label||e.method)}${e.note?' · '+esc(e.note):''}</span></span><b class="num">${fmt(spend(e))}</b></button>`).join('')}</div></section>`;
  return h;
}

function bilanHTML(m){
  const items=monthItems(m), spent=sumBy(items,spend), inc=incomeIn(m), p=shiftM(m,-1), pSpent=spentIn(p);
  const cats=byCat(items), pc=byCat(monthItems(p)), goal=savingsGoal(m), saved=inc-spent;
  const top=Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const rise=Object.entries(cats).map(([c,v])=>[c,v-(pc[c]||0)]).filter(([,d])=>d>0).sort((a,b)=>b[1]-a[1])[0];
  const L=[];
  L.push(`Tu as dépensé <strong>${fmt(spent)}</strong> en ${items.length} opération${items.length>1?'s':''}${pSpent?`, soit <strong>${spent>=pSpent?'+':'−'}${Math.abs(Math.round((spent-pSpent)/pSpent*100))} %</strong> par rapport à ${esc(mName(p))}`:''}.`);
  if(pSpent){const r=realChange(spent,pSpent);L.push(`Hors inflation (${String(D.settings.inflation).replace('.',',')} % par an), la variation réelle est de <strong>${pctS(r,1)}</strong>.`)}
  if(inc>0)L.push(saved>=0?`Épargne réalisée : <strong>${fmt(saved)}</strong>${goal?` pour un objectif de ${fmt(goal)} (${saved>=goal?'atteint':'non atteint'})`:''}.`:`Tu as dépensé <strong>${fmt(-saved)}</strong> de plus que tes entrées.`);
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
    <div class="filters" role="group" aria-label="Filtrer par catégorie"><button type="button" data-filter="all" aria-pressed="${S.filter==='all'}">Toutes</button>${[...CATS,['frais','Frais financiers']].filter(c=>present.has(c[0])).map(c=>`<button type="button" data-filter="${c[0]}" aria-pressed="${S.filter===c[0]}">${esc(c[1])}</button>`).join('')}</div>`;
  if(!ex.length)h+=`<div class="empty"><strong>Rien à afficher</strong><span>${all.length?'Aucune dépense ne correspond à ta recherche.':'Aucune dépense ce mois-ci. Touche « Ajouter » pour en noter une.'}</span></div></section>`;
  else{
    const arrow=key=>S.sort.k===key?(S.sort.d==='asc'?' ↑':' ↓'):'';
    h+=`<div class="sheet-scroll"><table><thead><tr><th class="rownum">#</th><th><button type="button" data-sort="date">Date${arrow('date')}</button></th><th>Catégorie</th><th>Nature</th><th>Moyen</th><th>Note</th><th class="amt">Frais</th><th class="amt"><button type="button" data-sort="amount">Montant${arrow('amount')}</button></th></tr></thead><tbody>`;
    ex.forEach((e,i)=>{h+=`<tr ${e.synthetic?`data-move="${esc(e.moveId)}"`:`data-edit="${esc(e.id)}"`} tabindex="0"><td class="rownum">${i+1}</td><td>${dFr(e.date)}</td><td><span class="lab" style="display:inline-flex"><span class="dot" style="background:${CAT[e.category]?.color||'#9AA8A1'}"></span>${esc(CAT[e.category]?.label||e.category)}</span>${e.recurring_id?`<span class="rec-tag" title="Récurrente">${ic('repeat','s16')}</span>`:''}</td><td>${natureOf(e)==='besoin'?'Besoin':'Envie'}</td><td>${esc(WAL[e.method]?.label||e.method)}</td><td class="note">${esc(e.note||'')}</td><td class="amt">${e.fee?fmtN(e.fee):''}</td><td class="amt">${fmtN(e.amount)}</td></tr>`});
    h+=`</tbody><tfoot><tr><td></td><td colspan="5">Total (FCFA)</td><td class="amt">${fmtN(sumBy(ex,e=>e.fee||0))}</td><td class="amt">${fmtN(sumBy(ex,e=>e.amount))}</td></tr></tfoot></table></div>
      <p class="hint">Touche une ligne pour la modifier. L'icône de flèches signale une dépense récurrente ajoutée automatiquement.</p></section>`;
  }
  h+=`<section class="block"><p class="over">Export Excel</p><p class="hint">Fichier CSV séparé par des points-virgules, qui s'ouvre directement dans Excel.</p>
    <div class="actions"><button type="button" class="btn" data-export="month">Exporter ${esc(mName(S.month))}</button><button type="button" class="btn" data-export="all">Tout l'historique</button></div></section>`;
  return h;
}

function renderAccounts(){
  const m=S.month;let h='';
  const total=sumBy(WALLETS,([w])=>balance(w));
  h+=`<section class="block"><div class="block-head"><p class="over">Portefeuilles</p><small class="num">total ${fmtS(total)}</small></div><div class="rows">`;
  for(const [w,l,c] of WALLETS){const b=balance(w);h+=`<div class="rowbtn" style="cursor:default"><span class="wicon" style="color:${c}">${ic(w==='epargne'?'shield':'wallet')}</span><span class="t"><span>${esc(l)}</span><span>${w==='epargne'?`dont projets ${fmt(projectsSaved())}`:MOMO.has(w)?'Mobile Money':w==='banque'?'compte et carte':'liquide'}</span></span><b class="num" style="${b<0?'color:var(--danger)':''}">${fmtS(b)}</b></div>`}
  h+=`</div><div class="actions"><button type="button" class="btn-primary sm" data-act="newMove">${ic('swap','s16')}Transférer</button></div>
    <details ${D.settings.opening_date?'':'open'}><summary class="linkbtn">Soldes de départ</summary><div class="add">
      <p class="hint">Indique ce que contient chaque portefeuille à une date donnée. Les soldes sont ensuite calculés à partir des opérations saisies depuis cette date.</p>
      <label class="inp">Date des soldes<input type="date" id="op-date" value="${esc(D.settings.opening_date||todayISO())}"></label>
      ${WALLETS.map(([w,l])=>`<div class="form-row"><span>${esc(l)}</span><label class="field"><input class="r" id="op-${w}" data-money inputmode="numeric" placeholder="0" value="${(D.settings.opening||{})[w]?group(D.settings.opening[w]):''}" aria-label="Solde ${esc(l)}"><span>FCFA</span></label></div>`).join('')}
      <button type="button" class="btn-primary" data-act="saveOpening">Enregistrer les soldes</button></div></details></section>`;
  const inc=monthInc(m).sort((a,b)=>a.date<b.date?1:-1);
  h+=`<section class="block"><div class="block-head"><p class="over">Entrées de ${esc(mName(m))}</p><small class="num">${fmt(sumBy(inc,e=>e.amount))}</small></div>`;
  h+=inc.length?`<div class="rows">${inc.map(e=>`<button type="button" class="rowbtn" data-income="${esc(e.id)}"><span class="dot" style="background:${SRC[e.source]?.color||'#9AA8A1'}"></span><span class="t"><span>${esc(SRC[e.source]?.label||e.source)}</span><span>${dFr(e.date)} · ${esc(WAL[e.wallet||'banque']?.label)}${e.note?' · '+esc(e.note):''}</span></span><b class="num">${fmt(e.amount)}</b></button>`).join('')}</div>`:`<p class="hint">Aucune entrée ce mois-ci. Ajoute ton salaire, une prime ou une mission pour calculer ton budget par jour.</p>`;
  h+=`<div class="actions"><button type="button" class="btn sm" data-act="newIncome">${ic('plus','s16')}Ajouter une entrée</button></div></section>`;
  const mv=monthMoves(m).sort((a,b)=>a.date<b.date?1:-1);
  h+=`<section class="block"><div class="block-head"><p class="over">Mouvements de ${esc(mName(m))}</p><small>${mv.length}</small></div><p class="hint">Transferts, tontines, prêts et projets : ils changent tes soldes sans être des dépenses. Seuls les frais comptent comme dépense.</p>`;
  if(mv.length)h+=`<div class="rows">${mv.map(x=>{const p=D.plans[x.ref_id];const path=[x.from_wallet&&WAL[x.from_wallet]?.label,x.to_wallet&&WAL[x.to_wallet]?.label].filter(Boolean).join(' → ');
    return `<button type="button" class="rowbtn" data-move="${esc(x.id)}"><span class="wicon">${ic(x.kind==='transfer'?'swap':x.kind.startsWith('tontine')?'users':x.kind==='project'?'flag':'hand')}</span><span class="t"><span>${esc(MOVES[x.kind]?.label)}${p?' · '+esc(p.name):''}</span><span>${dFr(x.date)} · ${esc(path)}${x.fee?` · frais ${fmt(x.fee)}`:''}</span></span><b class="num">${fmt(x.amount)}</b></button>`}).join('')}</div>`;
  h+=`<div class="actions"><button type="button" class="btn sm" data-act="newMove">${ic('plus','s16')}Ajouter un mouvement</button></div></section>`;
  return h;
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
      <div class="actions"><button type="button" class="btn sm" data-newmove="project" data-ref="${esc(p.id)}">Verser</button></div></div>`}
  if(p.type==='tontine'){const d=p.data||{}, got=s.received>=s.pot;
    return `<div class="plan"><div class="head"><div><b>${esc(p.name)}</b><div class="meta num">${fmt(p.amount)} par tour · ${d.frequency==='hebdomadaire'?'chaque semaine':'chaque mois'} · ${d.members} membres · mon tour : ${d.turn}</div></div>${got?pill('success','Reçu'):del}</div>
      <div class="meta num">Réception ${got?'faite':'prévue le <b>'+dLong(s.receive)+'</b>'} : ${fmt(s.pot)} · cotisé ${fmt(s.paid)} · fin le ${dLong(s.end)}</div>
      <div class="actions"><button type="button" class="btn sm" data-newmove="tontine_out" data-ref="${esc(p.id)}">Cotiser</button><button type="button" class="btn sm" data-newmove="tontine_in" data-ref="${esc(p.id)}">Recevoir</button></div></div>`}
  const isLoan=p.type==='loan', late=s.due&&s.left>0&&s.due<todayISO();
  return `<div class="plan"><div class="head"><div><b>${esc(p.name)}</b><div class="meta num">${isLoan?'Prêté':'Emprunté'} ${fmt(isLoan?s.out:s.inn)} · ${isLoan?'remboursé':'remboursé'} ${fmt(isLoan?s.back:s.paid)}${s.due?` · échéance ${dLong(s.due)}`:''}</div></div>${s.left<=0?pill('success','Soldé'):late?pill('danger','En retard'):pill('info','Reste '+shortN(s.left))}</div>
    <div class="actions">${s.left>0?`<button type="button" class="btn sm" data-newmove="${isLoan?'loan_back':'debt_pay'}" data-ref="${esc(p.id)}">${isLoan?'Enregistrer un remboursement':'Rembourser'}</button>`:''}${del}</div></div>`;
}
function renderPlan(){
  let h='';
  const sect=(type,title,hint)=>{const list=plans(type).filter(p=>p.active!==false);return `<section class="block"><div class="block-head"><p class="over">${title}</p><small>${list.length||''}</small></div>${list.length?`<div>${list.map(planRow).join('')}</div>`:`<p class="hint">${hint}</p>`}${planForm(type)}</section>`};
  h+=sect('project','Projets d\'épargne','Parcelle, véhicule, études : fixe un montant et une échéance, l\'application calcule l\'effort mensuel.');
  h+=sect('tontine','Tontines','Likelemba, ristourne : suis tes cotisations et la date de ton tour.');
  const ld=plans().filter(p=>(p.type==='loan'||p.type==='debt')&&p.active!==false);
  h+=`<section class="block"><p class="over">Prêts et dettes</p>${ld.length?`<div>${ld.map(planRow).join('')}</div>`:'<p class="hint">L\'argent prêté à un proche ou emprunté, avec son échéance. Tu es prévenu sept jours avant.</p>'}${planForm('loan')}${planForm('debt')}</section>`;
  h+=renderBudgetsBlock()+renderTips();
  return h;
}
function renderBudgetsBlock(){
  const cats=byCat(monthItems(S.month));
  let h=`<section class="block"><div class="block-head"><p class="over">Budgets mensuels</p><small>valables chaque mois</small></div><p class="hint">Laisse vide pour ne pas suivre une catégorie. Alerte à 80 % et à 100 %.</p><div>`;
  for(const [c,label,color] of CATS){const b=D.budgets[c]||0, s=cats[c]||0;
    h+=`<div class="form-row"><div class="lab"><span class="dot" style="background:${color}"></span><span>${esc(label)}</span></div><label class="field"><input class="r" id="b-${c}" data-bud="${c}" inputmode="numeric" placeholder="-" value="${b?group(b):''}" aria-label="Budget ${esc(label)}"><span>FCFA</span></label>
      <span class="meta num">Dépensé ce mois : ${fmt(s)}${b?` · ${Math.round(s/b*100)} %`:''}</span></div>`}
  return h+`</div><div class="actions" style="justify-content:space-between;align-items:center"><span class="hint num">Total budgété : ${fmt(sumBy(Object.values(D.budgets),v=>v||0))}</span><button type="button" class="btn-primary" data-act="saveBud">Enregistrer les budgets</button></div></section>`;
}
function tipFor(c,x,t){
  const ex=fmt(Math.max(x-t,0));
  switch(c){
    case 'transport':{const n=Math.round(x/PRICES.taxi),g=r500(x/PRICES.taxi/3*(PRICES.taxi-PRICES.bus));return `Ton transport équivaut à environ <strong>${n} courses de taxi</strong> à 1 000 FCFA. Remplacer une course sur trois par le bus (150 FCFA) ferait gagner environ <strong>${fmt(g)}</strong> par mois.`}
    case 'alimentation':return `Tu dépasses la cible de <strong>${ex}</strong>. Achète les produits de base en gros (sac de riz, bidon d'huile) plutôt qu'au détail, et fais une liste de marché pour la semaine.`;
    case 'factures':return `Au tarif E²C des petits compteurs, 100 kWh coûtent environ <strong>${fmt(100*PRICES.kwh)}</strong> hors taxes. Climatiseur, congélateur et chauffe-eau pèsent le plus sur la facture.`;
    case 'communication':return x>PRICES.fibre?`Tu dépenses plus que l'abonnement fibre Congo Telecom (<strong>35 000 FCFA</strong> par mois). Une connexion fixe pourrait te coûter moins cher que la data mobile.`:`Tu dépasses la cible de <strong>${ex}</strong>. Un forfait 30 jours revient en général moins cher que des petits forfaits au jour le jour.`;
    case 'logement':return `Le logement dépasse le repère de 20 % des revenus. En cas de déménagement, compte aussi l'entrée habituelle à Brazzaville : <strong>2 mois de caution + 1 mois d'agence</strong>.`;
    case 'loisirs':return `Dépassement de <strong>${ex}</strong>. Fixe une enveloppe sorties en début de mois, idéalement en espèces, et arrête quand elle est vide.`;
    case 'famille':return `Dépassement de <strong>${ex}</strong>. Les aides à la famille sont souvent imprévues : garde une réserve dédiée plutôt que de puiser dans les autres postes.`;
    default:return `Dépassement de <strong>${ex}</strong> par rapport à la cible proposée.`;
  }
}
function renderTips(){
  const R=incomeIn(S.month), name=mName(S.month);
  if(!R)return `<section class="block"><p class="over">Conseils</p><p class="hint">Ajoute tes entrées de ${esc(name)} pour recevoir des budgets proposés et des conseils calculés avec les statistiques de Brazzaville.</p><div class="actions"><button type="button" class="btn sm" data-act="newIncome">Ajouter une entrée</button></div></section>`+renderRefs();
  const P=proposal(R), items=monthItems(S.month), total=sumBy(items,spend), cats=byCat(items), isCur=S.month===curM();
  let h='';
  if(total>0){
    const scale=isCur?Math.min(new Date().getDate()/daysIn(S.month),1):1, fixedC=byCat(items.filter(e=>e.recurring_id));
    const target=c=>{const f=fixedC[c]||0,a=P.amt[c];return f>=a?a:f+(a-f)*scale};
    const over=Object.keys(P.amt).map(c=>({c,x:cats[c]||0,t:target(c)})).filter(o=>o.t>0&&o.x>o.t*1.05).sort((a,b)=>(b.x-b.t)-(a.x-a.t));
    h+=`<section class="block"><div class="block-head"><p class="over">Conseils pour ${esc(name)}</p><small>${isCur?'au prorata du mois':''}</small></div>`;
    h+=over.length?`<div>${over.slice(0,4).map(o=>`<div class="tip"><span class="rail" style="background:${CAT[o.c].color}"></span><div><b>${esc(CAT[o.c].label)} · <span class="num">${fmt(o.x)}</span> pour une cible de <span class="num">${fmt(o.t)}</span></b><p>${tipFor(o.c,o.x,o.t)}</p></div></div>`).join('')}</div>`:`<p class="hint">Toutes tes catégories sont dans les cibles proposées.</p>`;
    const fees=feesOf(items);
    if(fees>0)h+=`<div class="tip"><span class="rail" style="background:${WAL.mtn.color}"></span><div><b>Frais financiers · <span class="num">${fmt(fees)}</span></b><p>Regroupe tes retraits et paie directement en Mobile Money quand le commerçant l'accepte : chaque retrait évité, ce sont des frais en moins.</p></div></div>`;
    const env=sumBy(items.filter(e=>natureOf(e)==='envie'),spend);
    if(env/total>.3)h+=`<div class="tip"><span class="rail" style="background:var(--gold-400)"></span><div><b>Envies · <span class="num">${pctS(env/total)}</span> des dépenses</b><p>Au-delà de 30 %, une partie des envies peut alimenter ton fonds d'urgence ou un projet d'épargne.</p></div></div>`;
    h+=`</section>`;
    const me={alimentation:cats.alimentation||0,logfac:(cats.logement||0)+(cats.factures||0),transport:cats.transport||0,communication:cats.communication||0,vetements:cats.vetements||0,loisirs:cats.loisirs||0,sante:cats.sante||0,education:cats.education||0,divers:(cats.famille||0)+(cats.autres||0)+(cats.frais||0)};
    const lab={alimentation:'Alimentation',logfac:'Logement et factures',transport:'Transport',communication:'Crédit & data',vetements:'Vêtements',loisirs:'Loisirs & sorties',sante:'Santé',education:'Éducation',divers:'Famille & autres'};
    h+=`<section class="block"><div class="block-head"><p class="over">Toi et le ménage moyen de Brazzaville</p><small>part des dépenses</small></div><div class="list">`;
    for(const k in INS_BZV){const mine=me[k]/total*100, ref=INS_BZV[k];
      h+=`<div class="cmp"><span>${lab[k]}</span><div class="cr"><span>Toi</span><div class="t2"><div style="width:${Math.min(mine,100)}%;background:var(--forest-600)"></div></div><span class="num" style="text-align:right;color:var(--ink-900);font-weight:700">${Math.round(mine)} %</span><span>Moyenne</span><div class="t2"><div style="width:${ref}%;background:var(--ink-300)"></div></div><span class="num" style="text-align:right">${Math.round(ref)} %</span></div></div>`}
    h+=`</div><p class="hint">Moyenne : structure de consommation des ménages de Brazzaville utilisée par l'INS pour l'indice des prix (enquête ECOM 2011).</p></section>`;
  }
  const hb=hasBudgets();
  h+=`<section class="block"><div class="block-head"><p class="over">Budgets proposés</p><small class="num">pour ${fmt(R)}</small></div><p class="hint">Structure de consommation de Brazzaville ajustée à tes revenus : l'alimentation baisse quand le revenu monte, une part est réservée à l'épargne.</p><div>`;
  for(const c of ['alimentation','logement','transport','factures','communication','loisirs','vetements','famille','sante','education','autres']){const cur=D.budgets[c]||0;
    h+=`<div class="prop-row"><span class="lab"><span class="dot" style="background:${CAT[c].color}"></span><span>${esc(CAT[c].label)}</span></span><b class="num">${fmt(P.amt[c])}</b><span class="sub hint num">${P.sh[c].toFixed(0)} % des entrées${cur?` · budget actuel ${fmt(cur)}`:''}</span></div>`}
  h+=`<div class="prop-row save"><span><b>Épargne visée</b></span><b class="num">${fmt(P.saveAmt)}</b><span class="sub hint">${P.save.toFixed(0)} % des entrées : ce qui doit rester en fin de mois.</span></div></div>
    <div class="actions"><button type="button" class="${S.armed==='prop'?'btn-danger':'btn-primary'}" data-act="applyProp">${S.armed==='prop'?'Confirmer le remplacement':hb?'Remplacer mes budgets':'Appliquer ces budgets'}</button></div></section>`;
  return h+renderRefs();
}
function renderRefs(){
  return `<section class="block"><p class="over">Repères de prix au Congo</p><div class="ref num">
    <span>Salaire minimum (SMIG)<small>depuis janvier 2025</small></span><span class="v">70 400 FCFA</span>
    <span>Inflation au Congo<small>moyenne annuelle à fin mars 2025, BEAC</small></span><span class="v">4,0 %</span>
    <span>Bus à Brazzaville<small>tarif maintenu, juillet 2024</small></span><span class="v">150 FCFA</span>
    <span>Course de taxi à Brazzaville<small>tarif maintenu, juillet 2024</small></span><span class="v">1 000 FCFA</span>
    <span>Électricité E²C, petits compteurs<small>kWh hors taxes, plus 2 268 à 2 550 FCFA fixes</small></span><span class="v">49,08 FCFA</span>
    <span>Fibre Congo Telecom 512 Mbit/s<small>par mois, hors frais d'accès</small></span><span class="v">35 000 FCFA</span>
    <span>Riz, sac de 25 kg<small>marché de Brazzaville, février 2023</small></span><span class="v">18 000 FCFA</span>
    <span>Entrée dans un logement loué<small>usage courant</small></span><span class="v">2 mois + 1 mois</span>
  </div><p class="over" style="margin-top:8px">Sources</p><ol class="src">
    <li><a href="https://interholco.com/images/pdfs/IHC-Sustainability-Rep-2022/Indice-Janvier-2022.pdf" target="_blank" rel="noopener">INS Congo, indice des prix janvier 2022 (pondérations ECOM 2011)</a></li>
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
    <p class="hint">De ${esc(mLong(months[0]))} à ${esc(mLong(months[curI]))}.</p></section>`;
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
    <div class="stat"><span>Taux d'épargne moyen</span><b>${incTot?pctS((incTot-spTot)/incTot):'-'}</b><small>entrées ${shortN(incTot)}</small></div>
    <div class="stat"><span>Mois le plus cher</span><b>${esc(mShort(months[maxI]))} ${months[maxI].slice(0,4)}</b><small>${fmt(spentM[maxI])}</small></div>
    <div class="stat"><span>Part des envies</span><b>${spTot?pctS(env/spTot):'-'}</b><small>${fmt(env)}</small></div>
    <div class="stat"><span>Frais financiers</span><b>${fmt(fees)}</b><small>${spTot?pctS(fees/spTot,1)+' des dépenses':''}</small></div>
  </div>${biggest?`<p class="hint num">Plus grosse dépense : ${fmt(spend(biggest))}, ${esc(CAT[biggest.category]?.label)}, le ${dFr(biggest.date)}.</p>`:''}</section>`;
  // Entrées vs dépenses
  h+=`<section class="block"><p class="over">Entrées et dépenses par mois</p>${barsChart(labs,[{name:'Entrées',color:'var(--forest-400)',values:incM},{name:'Dépenses',color:'var(--forest-900)',values:spentM}],{cur:curI,label:'Entrées et dépenses par mois'})}${keys([['Entrées','var(--forest-400)'],['Dépenses','var(--forest-900)']])}
    <p class="hint num">Solde cumulé sur la période : <b>${fmtS(incTot-spTot)}</b>.</p></section>`;
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
  h+=`<section class="block"><p class="over">Moyens de paiement</p><div class="stack">${METHODS.filter(([k])=>mets[k]).map(([k])=>`<div style="width:${mets[k]/spTot*100}%;background:${WAL[k].color}"></div>`).join('')}</div>
    <div class="legend">${METHODS.map(([k])=>`<div><span class="dot" style="background:${WAL[k].color}"></span><span>${esc(WAL[k].label)}</span><span class="v num">${spTot?Math.round((mets[k]||0)/spTot*100):0} %</span></div>`).join('')}</div></section>`;
  return h;
}

function renderSettings(){
  let h='';
  const months=[];for(let i=5;i>=0;i--)months.push(shiftM(S.month,-i));
  const sav=months.map(m=>incomeIn(m)?incomeIn(m)-spentIn(m):0);
  const allM=[...new Set([...allItems(),...incomes()].map(e=>e.date.slice(0,7)))].sort();
  const cumul=sumBy(allM.filter(m=>m<=S.month&&incomeIn(m)),m=>incomeIn(m)-spentIn(m));
  const max=Math.max(...sav.map(Math.abs),1), goal=D.settings.savings_goal||0, prop=incomeIn(S.month)?proposal(incomeIn(S.month)).saveAmt:0;
  h+=`<section class="block"><div class="block-head"><p class="over">Objectif d'épargne</p><small class="num">${allM[0]?'cumul depuis '+esc(mShort(allM[0]))+' '+allM[0].slice(0,4):''}</small></div>
    <div class="big num" style="font-size:28px;${cumul<0?'color:var(--danger)':''}">${fmtS(cumul)}</div>
    <div class="bars" style="height:128px">${months.map((m,i)=>{const v=sav[i];return `<div class="bar-col ${m===S.month?'cur':''}"><span class="bar-val num">${v?shortN(v):''}</span><div class="b ${v<0?'neg':''}" style="height:${v?Math.max(Math.abs(v)/max*80,2):0}%"></div></div>`}).join('')}</div>
    <div class="bar-labs">${months.map(m=>`<span class="${m===S.month?'cur':''}">${esc(mShort(m))}</span>`).join('')}</div>
    <div class="form-row" style="border-top:1px solid var(--mist-100);padding-top:12px"><span>Objectif par mois${prop?`<span class="meta" style="display:block">Proposé pour tes entrées : ${fmt(prop)}</span>`:''}</span><label class="field"><input class="r" id="goal" data-money inputmode="numeric" placeholder="${prop?group(prop):'0'}" value="${goal?group(goal):''}" aria-label="Objectif d'épargne mensuel"><span>FCFA</span></label></div>
    <div class="form-row"><span>Fonds d'urgence visé<span class="meta" style="display:block">en mois de dépenses essentielles, 3 à 6 conseillé</span></span><label class="field"><input class="r" id="emMonths" inputmode="numeric" value="${D.settings.emergency_months||3}" aria-label="Mois de fonds d'urgence"><span>mois</span></label></div>
    <div class="form-row"><span>Inflation annuelle<span class="meta" style="display:block">BEAC : 4,0 % en moyenne à fin mars 2025</span></span><label class="field"><input class="r" id="infl" inputmode="decimal" value="${String(D.settings.inflation).replace('.',',')}" aria-label="Inflation annuelle"><span>%</span></label></div>
    <div class="actions"><button type="button" class="btn-primary" data-act="saveGoal">Enregistrer</button></div></section>`;
  const recs=Object.values(D.recurring).sort((a,b)=>a.day-b.day);
  h+=`<section class="block"><div class="block-head"><p class="over">Dépenses récurrentes</p><small class="num">${fmt(sumBy(recs.filter(r=>r.active),r=>r.amount+(r.fee||0)))} par mois</small></div><p class="hint">Ajoutées automatiquement chaque mois, le jour indiqué. Elles forment tes charges fixes dans le calcul du reste à vivre.</p>`;
  if(recs.length)h+=`<div class="rows">${recs.map(r=>`<div class="rowbtn" style="cursor:default"><span class="dot" style="background:${CAT[r.category]?.color||'#9AA8A1'}"></span><span class="t"><span>${esc(r.label)}</span><span>le ${r.day} · ${esc(CAT[r.category]?.label||r.category)} · ${fmt(r.amount)}</span></span><span style="display:flex;gap:4px;align-items:center">
      <button type="button" class="pill ${r.active?'success':''}" data-rec-toggle="${esc(r.id)}">${r.active?'Active':'En pause'}</button>
      <button type="button" class="pill ${S.armed==='rec:'+r.id?'danger':''}" data-rec-del="${esc(r.id)}">${S.armed==='rec:'+r.id?'Confirmer':'Retirer'}</button></span></div>`).join('')}</div>`;
  h+=`<details><summary class="linkbtn">${ic('plus','s16')} Ajouter une dépense récurrente</summary><div class="add">
      <div class="grid2"><label class="inp">Libellé<input id="r-label" maxlength="60" placeholder="Ex. Loyer"></label><label class="inp">Montant (FCFA)<input id="r-amount" data-money inputmode="numeric" placeholder="0"></label></div>
      <div class="grid2"><label class="inp">Catégorie<select id="r-cat">${CATS.map(c=>`<option value="${c[0]}">${esc(c[1])}</option>`).join('')}</select></label><label class="inp">Moyen<select id="r-met">${METHODS.map(m=>`<option value="${m[0]}">${esc(m[1])}</option>`).join('')}</select></label></div>
      <div class="grid2"><label class="inp">Jour du mois (1 à 28)<input id="r-day" inputmode="numeric" placeholder="5"></label><label class="inp">Frais Mobile Money<input id="r-fee" data-money inputmode="numeric" placeholder="0"></label></div>
      <label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="r-now" checked> Ajouter aussi ce mois-ci si le jour est passé</label>
      <p class="err" id="r-err" hidden></p><button type="button" class="btn-primary" data-act="addRec">Ajouter</button></div></details></section>`;
  h+=`<section class="block"><p class="over">Sauvegarde</p><p class="hint">Un fichier avec toutes tes données : dépenses, entrées, mouvements, projets, tontines, prêts, budgets et réglages.</p>
    <div class="actions"><button type="button" class="btn" data-act="exportJson">Télécharger la sauvegarde</button><button type="button" class="btn" data-act="pickImport">Restaurer un fichier</button></div>`;
  if(pendingImport){const p=pendingImport;h+=msg('warning','Fichier prêt à importer',`${p.expenses.length} dépenses · ${p.incomes.length} entrées · ${p.moves.length} mouvements · ${p.plans.length} projets, tontines et prêts. Les éléments déjà présents avec le même identifiant seront remplacés. Rien n'est supprimé.`)+`<div class="actions"><button type="button" class="btn-primary" data-act="doImport">Importer</button><button type="button" class="btn" data-act="cancelImport">Annuler</button></div>`}
  h+=`</section>`;
  const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  h+=`<section class="block"><p class="over">Application</p>${standalone?'<p class="hint">L\'application est installée sur cet appareil.</p>':installEvt?'<p class="hint">Installe le carnet sur ton écran d\'accueil pour l\'ouvrir comme une application, même sans connexion.</p><div class="actions"><button type="button" class="btn-primary" data-act="install">Installer l\'application</button></div>':'<p class="hint">Pour l\'installer : sur Android, menu du navigateur puis « Installer l\'application » ; sur iPhone, bouton Partager puis « Sur l\'écran d\'accueil ».</p>'}</section>`;
  const off=!navigator.onLine||!sb;
  h+=`<section class="block"><p class="over">Compte et synchronisation</p><div class="ref num"><span>Compte</span><span class="v">${esc(email||'-')}</span><span>État</span><span class="v">${off?'hors ligne':'en ligne'}</span><span>Modifications en attente</span><span class="v">${outbox.length}</span><span>Dernière synchronisation</span><span class="v">${lastSync?new Date(lastSync).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}).replace(':',' h '):'-'}</span></div>
    <div class="actions"><button type="button" class="btn" data-act="syncNow">Synchroniser</button><button type="button" class="${S.armed==='logout'?'btn-danger':'btn'}" data-act="logout">${S.armed==='logout'?'Confirmer la déconnexion':'Se déconnecter'}</button></div>
    ${S.armed==='logout'?`<p class="hint">${outbox.length?`<b style="color:var(--danger)">${outbox.length} modification(s) non envoyée(s) seront perdues.</b> `:''}La copie locale sera effacée de ce téléphone. Tes données restent sur le serveur.</p>`:''}</section>`;
  return h;
}

/* ---------- Fenêtre de saisie ---------- */
const chips=(name,list)=>list.map(([k,l,c])=>`<label class="chip"><input type="radio" name="${name}" value="${k}"><span><i class="dot" style="background:${c}"></i>${esc(l)}</span></label>`).join('');
function buildStatic(){
  $('f-cats').innerHTML=chips('cat',CATS);
  $('f-methods').innerHTML=chips('met',METHODS);
  $('f-srcs').innerHTML=chips('src',SOURCES);
  $('f-from').innerHTML=chips('from',WALLETS);
  $('f-to').innerHTML=chips('to',WALLETS);
  $('f-nats').innerHTML=chips('nat',[['besoin','Besoin','#04382A'],['envie','Envie','#F5C04A']]);
  $('f-mkind').innerHTML=Object.entries(MOVES).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('');
  $('tabs').innerHTML=TABS.map(([k,l,i])=>`<button type="button" data-tab="${k}"><span class="pil">${ic(i)}</span>${l}</button>`).join('');
  $('setBtn').innerHTML=ic('sliders','s16')+'Réglages';
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
  $('quick').innerHTML=q.map(v=>`<button type="button" data-quick="${v}">${shortN(v)}</button>`).join('');
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
  const from=k==='move'?radioVal('from'):radioVal('met');
  $('fs-fee').hidden=!((k==='expense'||(k==='move'&&M.from))&&MOMO.has(from));
}
function openSheet(item,kind,preset){
  S.editing=item||null;S.confirmDel=false;S.natTouched=!!(item&&item.nature);
  $('kindSeg').hidden=!!item;
  if(kind==='move')$('f-mkind').value=item?.kind||preset?.kind||'transfer';
  setKind(kind||'expense');
  $('f-amount').value=item?group(item.amount):'';
  radio('cat',item?.category||'');
  radio('nat',item?natureOf(item):'');
  radio('met',item?.method||LS.get(K.met,'especes'));
  radio('src',item?.source||'salaire');
  if(kind==='income')radio('to',item?.wallet||'banque');
  if(kind==='move'){const M=MOVES[$('f-mkind').value];radio('from',item?.from_wallet||(M.from?LS.get(K.met,'especes'):''));radio('to',item?.to_wallet||M.fixedTo||(M.to&&M.from?'epargne':M.to?'especes':''))}
  updateMoveFields();
  if(item?.ref_id||preset?.ref)$('f-plan').value=item?.ref_id||preset.ref;
  $('f-fee').value=item?.fee?group(item.fee):'';
  let d=todayISO();if(!item&&d.slice(0,7)!==S.month)d=S.month+'-01';
  $('f-date').value=item?item.date:d;
  $('f-note').value=item?.note||'';
  $('f-del').hidden=!item;$('f-del').textContent='Supprimer';
  $('f-err').hidden=true;
  $('sheetWrap').hidden=false;
  setTimeout(()=>$('f-amount').focus(),60);
}
function closeSheet(){$('sheetWrap').hidden=true;S.editing=null}
function formErr(m){$('f-err').textContent=m;$('f-err').hidden=false}
function saveSheet(ev){
  ev.preventDefault();
  const amount=toInt($('f-amount').value), date=$('f-date').value, note=$('f-note').value.trim().slice(0,120), now=nowISO();
  if(!(amount>0))return formErr('Indique un montant supérieur à 0.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return formErr('Indique une date.');
  const base={id:S.editing?.id||newId(),amount,date,note,created_at:S.editing?.created_at||now,updated_at:now};
  let op;
  if(S.kind==='income'){
    op={t:'incomes',op:'upsert',row:Object.assign(base,{source:radioVal('src')||'autre',wallet:radioVal('to')||'banque'})};
  }else if(S.kind==='move'){
    const kind=$('f-mkind').value, M=MOVES[kind], from=M.from?radioVal('from'):null, to=M.fixedTo||(M.to?radioVal('to'):null), ref=M.plan?$('f-plan').value:null;
    if(M.from&&!from)return formErr('Choisis le portefeuille de départ.');
    if(M.to&&!to)return formErr('Choisis le portefeuille d\'arrivée.');
    if(kind==='transfer'&&from===to)return formErr('Choisis deux portefeuilles différents.');
    if(M.plan&&!ref)return formErr('Crée d\'abord ce '+PLAN_LABEL[M.plan].toLowerCase()+' dans l\'onglet Plan.');
    const fee=M.from&&MOMO.has(from)?toInt($('f-fee').value):0;
    op={t:'moves',op:'upsert',row:Object.assign(base,{kind,fee,from_wallet:from,to_wallet:to,ref_id:ref})};
  }else{
    const category=radioVal('cat'), method=radioVal('met');
    if(!category)return formErr('Choisis une catégorie.');
    if(!method)return formErr('Choisis un moyen de paiement.');
    const nat=radioVal('nat'), def=NEED.has(category)?'besoin':'envie';
    op={t:'expenses',op:'upsert',row:Object.assign(base,{category,method,fee:MOMO.has(method)?toInt($('f-fee').value):0,nature:nat&&nat!==def?nat:null,recurring_id:S.editing?.recurring_id||null})};
    LS.set(K.met,method);
  }
  const wasEdit=!!S.editing, kind=S.kind;closeSheet();
  if(date.slice(0,7)!==S.month)S.month=date.slice(0,7);
  mutate([op]);
  toast(wasEdit?'Modification enregistrée':(kind==='income'?'Entrée enregistrée : ':kind==='move'?'Mouvement enregistré : ':'Dépense enregistrée : ')+fmt(amount));
}
function deleteSheet(){
  if(!S.editing)return;
  if(!S.confirmDel){S.confirmDel=true;$('f-del').textContent='Confirmer la suppression';return}
  const t=S.kind==='income'?'incomes':S.kind==='move'?'moves':'expenses', id=S.editing.id;
  closeSheet();mutate([{t,op:'delete',id}]);toast('Supprimé');
}

/* ---------- Actions ---------- */
function saveBudgets(){
  const ops=[],now=nowISO();
  document.querySelectorAll('[data-bud]').forEach(i=>{const c=i.dataset.bud,v=toInt(i.value),old=D.budgets[c]||0;
    if(v>0&&v!==old)ops.push({t:'budgets',op:'upsert',row:{category:c,amount:v,updated_at:now}});
    if(!v&&old)ops.push({t:'budgets',op:'delete',key:c})});
  if(!ops.length)return toast('Aucun changement');
  mutate(ops);toast('Budgets enregistrés');
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
  const op={};WALLETS.forEach(([w])=>{const v=toInt($('op-'+w).value);if(v)op[w]=v});
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
function addRec(){
  const label=$('r-label').value.trim(), amount=toInt($('r-amount').value), day=toInt($('r-day').value), fee=toInt($('r-fee').value);
  const err=m=>{$('r-err').textContent=m;$('r-err').hidden=false};
  if(!label)return err('Indique un libellé.');
  if(!(amount>0))return err('Indique un montant.');
  if(!(day>=1&&day<=28))return err('Choisis un jour entre 1 et 28.');
  const cur=curM(), method=$('r-met').value, now=nowISO();
  mutate([{t:'recurring',op:'upsert',row:{id:newId(),label:label.slice(0,60),amount,fee:MOMO.has(method)?fee:0,category:$('r-cat').value,method,day,last_month:$('r-now').checked?shiftM(cur,-1):cur,active:true,created_at:now,updated_at:now}}]);
  runRecurring();toast('Dépense récurrente ajoutée');
}
function toggleRec(id){const r=D.recurring[id];if(r)mutate([{t:'recurring',op:'upsert',row:Object.assign({},r,{active:!r.active,updated_at:nowISO()})}])}
function delRec(id){if(S.armed!=='rec:'+id){S.armed='rec:'+id;render();return}S.armed=null;mutate([{t:'recurring',op:'delete',id}]);toast('Récurrente retirée. Les dépenses déjà ajoutées sont conservées.')}

function download(name,text,type){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
function exportCSV(scope){
  const list=(scope==='month'?monthItems(S.month):allItems()).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  if(!list.length)return toast('Aucune dépense à exporter');
  const q=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
  const lines=['Date;Catégorie;Nature;Moyen de paiement;Montant (FCFA);Frais (FCFA);Note;Récurrente'];
  for(const e of list)lines.push([dFr(e.date),q(CAT[e.category]?.label||e.category),natureOf(e)==='besoin'?'Besoin':'Envie',q(WAL[e.method]?.label||e.method),e.amount,e.fee||0,q(e.note),e.recurring_id?'oui':''].join(';'));
  lines.push(['','','','Total',sumBy(list,e=>e.amount),sumBy(list,e=>e.fee||0),'',''].join(';'));
  download(scope==='month'?`depenses-${S.month}.csv`:`depenses-historique-${todayISO()}.csv`,'﻿'+lines.join('\r\n'),'text/csv;charset=utf-8');
}
function exportJson(){
  const data={app:'carnet-depenses',version:'2.1',exported_at:nowISO(),expenses:expenses(),incomes:incomes(),moves:moves(),plans:Object.values(D.plans),budgets:D.budgets,recurring:Object.values(D.recurring),settings:D.settings};
  download(`carnet-depenses-sauvegarde-${todayISO()}.json`,JSON.stringify(data,null,2),'application/json');
}
function parseBackup(txt){
  const j=JSON.parse(txt);
  if(!j||j.app!=='carnet-depenses')throw new Error('Ce fichier n\'est pas une sauvegarde du Carnet de dépenses.');
  const okD=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d), now=nowISO(), str=(s,n)=>String(s||'').slice(0,n);
  const ex=(j.expenses||[]).filter(e=>e&&e.id&&e.amount>0&&okD(e.date)).map(e=>({id:String(e.id),amount:Math.round(e.amount),fee:Math.max(0,Math.round(e.fee||0)),category:CAT[e.category]&&e.category!=='frais'?e.category:'autres',method:MET_OK(e.method),nature:e.nature==='besoin'||e.nature==='envie'?e.nature:null,date:e.date,note:str(e.note,120),recurring_id:e.recurring_id||null,created_at:e.created_at||now,updated_at:now}));
  const inc=(j.incomes||[]).filter(e=>e&&e.id&&e.amount>0&&okD(e.date)).map(e=>({id:String(e.id),amount:Math.round(e.amount),source:SRC[e.source]?e.source:'autre',wallet:WAL[e.wallet]?e.wallet:'banque',date:e.date,note:str(e.note,120),created_at:e.created_at||now,updated_at:now}));
  const mv=(j.moves||[]).filter(m=>m&&m.id&&MOVES[m.kind]&&m.amount>0&&okD(m.date)).map(m=>({id:String(m.id),kind:m.kind,amount:Math.round(m.amount),fee:Math.max(0,Math.round(m.fee||0)),date:m.date,from_wallet:WAL[m.from_wallet]?m.from_wallet:null,to_wallet:WAL[m.to_wallet]?m.to_wallet:null,ref_id:m.ref_id||null,note:str(m.note,120),created_at:m.created_at||now,updated_at:now}));
  const pl=(j.plans||[]).filter(p=>p&&p.id&&PLAN_LABEL[p.type]).map(p=>({id:String(p.id),type:p.type,name:str(p.name||'Sans nom',60),amount:Math.max(0,Math.round(p.amount||0)),data:typeof p.data==='object'&&p.data?p.data:{},active:p.active!==false,created_at:p.created_at||now,updated_at:now}));
  const bud={};for(const [c,v] of Object.entries(j.budgets||{}))if(CAT[c]&&v>0)bud[c]=Math.round(v);
  const rec=(j.recurring||[]).filter(r=>r&&r.id&&r.amount>0&&r.day>=1&&r.day<=28&&/^\d{4}-\d{2}$/.test(r.last_month||'')).map(r=>({id:String(r.id),label:str(r.label||'Récurrente',60),amount:Math.round(r.amount),fee:Math.round(r.fee||0),category:CAT[r.category]?r.category:'autres',method:MET_OK(r.method),day:r.day,last_month:r.last_month,active:r.active!==false,created_at:r.created_at||now,updated_at:now}));
  const s=j.settings&&typeof j.settings==='object'?j.settings:null;
  return {expenses:ex,incomes:inc,moves:mv,plans:pl,budgets:bud,recurring:rec,settings:s?{savings_goal:Math.max(0,Math.round(s.savings_goal||0)),opening:s.opening||{},opening_date:okD(s.opening_date)?s.opening_date:null,emergency_months:s.emergency_months||3,inflation:Number(s.inflation??4)}:null};
}
const MET_OK=m=>METHODS.some(x=>x[0]===m)?m:'especes';
function doImport(){
  const p=pendingImport;if(!p)return;pendingImport=null;const now=nowISO();
  const ops=[...p.expenses.map(row=>({t:'expenses',op:'upsert',row})),...p.incomes.map(row=>({t:'incomes',op:'upsert',row})),...p.plans.map(row=>({t:'plans',op:'upsert',row})),...p.moves.map(row=>({t:'moves',op:'upsert',row})),
    ...Object.entries(p.budgets).map(([category,amount])=>({t:'budgets',op:'upsert',row:{category,amount,updated_at:now}})),...p.recurring.map(row=>({t:'recurring',op:'upsert',row}))];
  if(p.settings)ops.push(settingsRow(p.settings));
  mutate(ops);toast(`${ops.length} élément(s) importé(s)`);
}
async function logout(){
  if(S.armed!=='logout'){S.armed='logout';render();return}
  S.armed=null;try{if(sb)await sb.auth.signOut()}catch(e){}
  D=EMPTY();outbox=[];[K.cache,K.outbox,K.uid,K.email].forEach(LS.del);uid=null;email='';showLogin();
}

/* ---------- Événements ---------- */
document.addEventListener('click',ev=>{
  const t=ev.target.closest('button,[data-edit],[data-income],[data-move],[data-act]');if(!t)return;
  const ds=t.dataset;
  if(S.armed&&!(ds.act==='applyProp'||ds.act==='logout'||ds.recDel||ds.planDel))S.armed=null;
  if(ds.tab){S.tab=ds.tab;LS.set(K.tab,S.tab);render();window.scrollTo(0,0);return}
  if(ds.kind){setKind(ds.kind);if(ds.kind==='income')radio('to','banque');if(ds.kind==='move'){radio('from',LS.get(K.met,'especes'));radio('to','epargne');updateMoveFields()}return}
  if(ds.quick){$('f-amount').value=group(ds.quick);return}
  if(ds.span){S.span=+ds.span;LS.set(K.span,S.span);render();return}
  if(ds.filter){S.filter=ds.filter;render();return}
  if(ds.sort){const k=ds.sort;S.sort=S.sort.k===k?{k,d:S.sort.d==='asc'?'desc':'asc'}:{k,d:'desc'};render();return}
  if(ds.export){exportCSV(ds.export);return}
  if(ds.edit){const e=D.expenses[ds.edit];if(e)openSheet(e,'expense');return}
  if(ds.income){const e=D.incomes[ds.income];if(e)openSheet(e,'income');return}
  if(ds.move){const e=D.moves[ds.move];if(e)openSheet(e,'move');return}
  if(ds.newmove){openSheet(null,'move',{kind:ds.newmove,ref:ds.ref});return}
  if(ds.addplan){addPlan(ds.addplan);return}
  if(ds.planDel){delPlan(ds.planDel);return}
  if(ds.recToggle){toggleRec(ds.recToggle);return}
  if(ds.recDel){delRec(ds.recDel);return}
  const acts={close:closeSheet,new:()=>openSheet(null,'expense'),newIncome:()=>openSheet(null,'income'),newMove:()=>openSheet(null,'move',{kind:'transfer'}),
    saveBud:saveBudgets,applyProp:applyProposal,saveGoal,saveOpening,addRec,exportJson,pickImport:()=>$('importFile').click(),doImport,cancelImport:()=>{pendingImport=null;render()},
    hideBilan:()=>{LS.set(K.bilan,shiftM(curM(),-1));render()},
    install:async()=>{if(!installEvt)return;installEvt.prompt();try{await installEvt.userChoice}catch(e){}installEvt=null;render()},
    syncNow:()=>sync(true).then(()=>toast(navigator.onLine?'Synchronisé':'Hors ligne : réessaie plus tard')),logout};
  if(acts[ds.act])acts[ds.act]();
});
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&!$('sheetWrap').hidden)closeSheet();
  if(ev.key==='Enter'&&ev.target.matches('tr[data-edit],tr[data-move]'))ev.target.click();
});
document.addEventListener('input',ev=>{
  const i=ev.target;
  if(i.id==='q'){S.q=i.value;const pos=i.selectionStart;render();const n=$('q');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}return}
  if(['f-amount','f-fee'].includes(i.id)||i.dataset.bud!==undefined||i.dataset.money!==undefined){const d=digits(i.value).slice(0,12);i.value=d?group(d.replace(/^0+(?=\d)/,'')):''}
});
document.addEventListener('change',ev=>{
  const n=ev.target.name;
  if(n==='cat'&&!S.natTouched)radio('nat',NEED.has(ev.target.value)?'besoin':'envie');
  if(n==='nat')S.natTouched=true;
  if(n==='met'||n==='from'||ev.target.id==='f-mkind'){if(ev.target.id==='f-mkind'){const M=MOVES[ev.target.value];if(M.fixedTo)radio('to',M.fixedTo)}updateMoveFields()}
});
$('importFile').addEventListener('change',async ev=>{
  const f=ev.target.files[0];ev.target.value='';if(!f)return;
  try{pendingImport=parseBackup(await f.text());S.tab='settings';render();window.scrollTo(0,document.body.scrollHeight)}catch(e){toast(e.message||'Fichier illisible')}
});
$('fab').onclick=()=>openSheet(null,'expense');
$('prevM').onclick=()=>{S.month=shiftM(S.month,-1);S.filter='all';render()};
$('nextM').onclick=()=>{S.month=shiftM(S.month,1);S.filter='all';render()};
$('f').addEventListener('submit',saveSheet);
$('f-del').onclick=deleteSheet;
window.addEventListener('online',()=>sync(true));
window.addEventListener('offline',updateSync);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync(false)});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;if(S.tab==='settings')render()});

/* ---------- Accès ---------- */
function gate(html){$('app').hidden=true;$('gate').hidden=false;$('gate').innerHTML=html}
const band=`<div class="band"><h1>Carnet de <em>dépenses</em></h1><p>Ton budget, tes portefeuilles et ton épargne, en francs CFA.</p></div>`;
function showSetup(){gate(band+`<div class="body"><p>L'application n'est pas encore reliée à ta base Supabase.</p><p class="hint">Renseigne l'URL du projet et la clé publique dans <b>config.js</b>, puis republie le site. Le guide complet est dans le README.</p></div>`)}
function showLogin(m){
  gate(band+`<div class="body"><form id="login" novalidate style="display:flex;flex-direction:column;gap:16px">
      <label class="inp">Adresse électronique<input type="email" id="l-email" autocomplete="email" required value="${esc(email)}"></label>
      <label class="inp">Mot de passe<input type="password" id="l-pass" autocomplete="current-password" minlength="8" required></label>
      <p class="err" id="l-err" ${m?'':'hidden'}>${esc(m||'')}</p>
      <button type="submit" class="btn-primary btn-wide" id="l-in">Se connecter</button>
      <button type="button" class="btn btn-wide" id="l-up">Créer mon compte</button></form></div>`);
  const err=x=>{$('l-err').textContent=x;$('l-err').hidden=false;$('l-err').style.color=''};
  const creds=()=>({email:$('l-email').value.trim(),password:$('l-pass').value});
  $('login').addEventListener('submit',async ev=>{ev.preventDefault();const c=creds();if(!c.email||!c.password)return err('Indique ton adresse et ton mot de passe.');
    $('l-in').disabled=true;const {data,error}=await sb.auth.signInWithPassword(c);$('l-in').disabled=false;
    if(error)return err(/confirm/i.test(error.message)?'Confirme d\'abord ton adresse avec le lien reçu par courriel.':'Adresse ou mot de passe incorrect.');startApp(data.session)});
  $('l-up').addEventListener('click',async()=>{const c=creds();if(!c.email||c.password.length<8)return err('Indique ton adresse et un mot de passe d\'au moins 8 caractères.');
    $('l-up').disabled=true;const {data,error}=await sb.auth.signUp(c);$('l-up').disabled=false;
    if(error)return err(/not allowed|disabled/i.test(error.message)?'Les inscriptions sont fermées sur ce carnet.':error.message);
    if(data.session)return startApp(data.session);
    err('Compte créé. Ouvre le lien de confirmation reçu par courriel, puis connecte-toi.');$('l-err').style.color='var(--success)'});
}
function startApp(session){
  if(session){uid=session.user.id;email=session.user.email||'';LS.set(K.uid,uid);LS.set(K.email,email)}
  if(S.tab==='budgets'||S.tab==='tips')S.tab='plan';
  $('gate').hidden=true;$('app').hidden=false;render();
  if(sb)sync(true);else runRecurring();
}
async function init(){
  buildStatic();
  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
  const cfg=window.CARNET_CONFIG||{};
  if(!window.supabase){if(uid)return startApp(null);return gate(band+`<div class="body"><p>Connexion impossible pour le moment. Vérifie ta connexion Internet puis recharge la page.</p></div>`)}
  if(!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY)return showSetup();
  sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'cd2-auth'}});
  const {data}=await sb.auth.getSession();
  if(data.session)startApp(data.session);
  else if(uid&&!navigator.onLine)startApp(null);
  else showLogin();
}
init();
