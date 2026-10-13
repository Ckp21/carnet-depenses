'use strict';
/* Carnet de dépenses V2
   Fonctionnement : les données sont gardées en cache sur le téléphone (lecture et saisie hors ligne).
   Chaque modification est appliquée tout de suite à l'écran, puis placée dans une file d'attente
   envoyée à Supabase dès que la connexion est disponible. */

/* ---------- Référentiels ---------- */
const CATS=[
  ["alimentation","Alimentation","#0FA968"],["transport","Transport","#00A3E0"],["logement","Logement","#7C3AED"],
  ["factures","Factures (eau, élec., internet)","#F59E0B"],["communication","Crédit & data","#06B6D4"],["sante","Santé","#EF4444"],
  ["famille","Famille & dons","#EC4899"],["loisirs","Loisirs & sorties","#F97316"],["vetements","Vêtements","#A16207"],
  ["education","Éducation","#4338FF"],["autres","Autres","#94A3B8"]
];
const METHODS=[["especes","Espèces","#0FA968"],["mtn","MTN MoMo","#FFC400"],["airtel","Airtel Money","#E5243B"],["banque","Banque/Carte","#4338FF"]];
const SOURCES=[["salaire","Salaire","#4338FF"],["prime","Prime","#0FA968"],["mission","Mission / freelance","#F59E0B"],["autre","Autre","#94A3B8"]];
const CAT=Object.fromEntries(CATS.map(c=>[c[0],{label:c[1],color:c[2]}]));
const MET=Object.fromEntries(METHODS.map(m=>[m[0],{label:m[1],color:m[2]}]));
const SRC=Object.fromEntries(SOURCES.map(s=>[s[0],{label:s[1],color:s[2]}]));
const MOMO=new Set(['mtn','airtel']);

/* ---------- Utilitaires ---------- */
const nf=new Intl.NumberFormat('fr-FR');
const fmt=n=>nf.format(Math.round(n))+' FCFA';
const fmtN=n=>nf.format(Math.round(n));
const fmtS=n=>(n<0?'− ':'')+fmt(Math.abs(n));
const shortN=n=>{const a=Math.abs(n),s=n<0?'−':'';return s+(a>=1e6?(a/1e6).toFixed(1).replace('.',',')+' M':a>=1000?Math.round(a/1000)+' k':String(Math.round(a)))};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1);
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const shiftM=(m,k)=>{const [y,mo]=m.split('-').map(Number);return ymOf(new Date(y,mo-1+k,1))};
const daysIn=m=>{const [y,mo]=m.split('-').map(Number);return new Date(y,mo,0).getDate()};
const mDate=m=>{const [y,mo]=m.split('-').map(Number);return new Date(y,mo-1,1)};
const mLong=m=>mDate(m).toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
const mName=m=>mDate(m).toLocaleDateString('fr-FR',{month:'long'});
const mShort=m=>mDate(m).toLocaleDateString('fr-FR',{month:'short'}).replace('.','');
const dFr=iso=>{const [y,m,d]=iso.split('-');return d+'/'+m+'/'+y};
const digits=s=>String(s||'').replace(/\D/g,'');
const group=s=>String(s).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const toInt=s=>parseInt(digits(s)||'0',10);
const nowISO=()=>new Date().toISOString();
const newId=()=>(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
const spend=e=>e.amount+(e.fee||0);
const sumBy=(a,f)=>a.reduce((t,x)=>t+f(x),0);
const $=id=>document.getElementById(id);
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};

/* ---------- État ---------- */
const K={cache:'cd2-cache',outbox:'cd2-outbox',uid:'cd2-uid',email:'cd2-email',tab:'cd2-tab',met:'cd2-met',bilan:'cd2-bilan-vu'};
const EMPTY=()=>({expenses:{},incomes:{},budgets:{},recurring:{},settings:{savings_goal:0}});
let D=Object.assign(EMPTY(),LS.get(K.cache,{}));
let outbox=LS.get(K.outbox,[]);
let sb=null, uid=LS.get(K.uid,null), email=LS.get(K.email,'');
let flushing=false, lastSync=0, installEvt=null, pendingImport=null;
const S={month:ymOf(new Date()),tab:LS.get(K.tab,'dash'),filter:'all',q:'',sort:{k:'date',d:'desc'},kind:'expense',editing:null,confirmDel:false,armed:null};

const saveLocal=()=>{LS.set(K.cache,D);LS.set(K.outbox,outbox)};
const expenses=()=>Object.values(D.expenses);
const incomes=()=>Object.values(D.incomes);
const monthExp=m=>expenses().filter(e=>e.date.slice(0,7)===m);
const monthInc=m=>incomes().filter(e=>e.date.slice(0,7)===m);
const spentIn=m=>sumBy(monthExp(m),spend);
const incomeIn=m=>sumBy(monthInc(m),e=>e.amount);
const feesIn=list=>sumBy(list,e=>e.fee||0);
function byCat(list){const o={};for(const e of list)o[e.category]=(o[e.category]||0)+spend(e);return o}
const hasBudgets=()=>Object.values(D.budgets).some(v=>v>0);
const budgetState=(s,b)=>{const r=s/b;return r>1?'bad':r>=.8?'warn':'ok'};

function toast(msg){const t=$('toast');t.textContent=msg;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>t.hidden=true,2800)}

/* ---------- Modifications et synchronisation ---------- */
function applyLocal(op){
  if(op.t==='budgets'){ if(op.op==='upsert') D.budgets[op.row.category]=op.row.amount; else delete D.budgets[op.key]; return }
  if(op.t==='settings'){ D.settings=Object.assign({},D.settings,op.row); return }
  if(op.op==='upsert') D[op.t][op.row.id]=op.row; else delete D[op.t][op.id];
}
function mutate(ops){
  for(const op of ops){applyLocal(op);outbox.push(op)}
  saveLocal();render();flush();
}
const CONFLICT={budgets:'user_id,category',settings:'user_id'};
function isFatal(err){const c=String(err.code||'');return /^(22|23|42)/.test(c)||c==='PGRST204'}
async function flush(){
  if(flushing||!sb||!uid||!navigator.onLine||!outbox.length){updateSync();return}
  flushing=true;updateSync();
  while(outbox.length){
    const op=outbox[0];let error=null;
    try{
      if(op.op==='upsert'){
        const row=Object.assign({},op.row,{user_id:uid});
        ({error}=await sb.from(op.t).upsert(row,{onConflict:CONFLICT[op.t]||'id'}));
      }else{
        let q=sb.from(op.t).delete();
        q=op.t==='budgets'?q.eq('category',op.key):q.eq('id',op.id);
        ({error}=await q);
      }
    }catch(e){error={message:String(e)}}
    if(error){
      if(isFatal(error)){console.warn('Refusé',op,error);toast('Une modification a été refusée : '+(error.message||'erreur'));outbox.shift();LS.set(K.outbox,outbox);continue}
      break; // réseau ou session : on réessaiera plus tard
    }
    outbox.shift();LS.set(K.outbox,outbox);
  }
  flushing=false;updateSync();
}
async function fetchAll(t,order){
  const rows=[];
  for(let from=0;;from+=1000){
    let q=sb.from(t).select('*').range(from,from+999);
    if(order)q=q.order(order,{ascending:false});
    const {data,error}=await q;
    if(error)throw error;
    rows.push(...data);
    if(data.length<1000)break;
  }
  return rows;
}
const clean=r=>{const o=Object.assign({},r);delete o.user_id;return o};
async function pull(){
  if(!sb||!uid||!navigator.onLine)return false;
  try{
    const [ex,inc,bud,rec,set]=await Promise.all([fetchAll('expenses','date'),fetchAll('incomes','date'),fetchAll('budgets'),fetchAll('recurring'),fetchAll('settings')]);
    const n=EMPTY();
    ex.forEach(r=>n.expenses[r.id]=clean(r));
    inc.forEach(r=>n.incomes[r.id]=clean(r));
    bud.forEach(r=>n.budgets[r.category]=r.amount);
    rec.forEach(r=>n.recurring[r.id]=clean(r));
    if(set[0])n.settings={savings_goal:set[0].savings_goal||0};
    D=n;
    for(const op of outbox)applyLocal(op); // les modifications pas encore envoyées restent visibles
    saveLocal();lastSync=Date.now();
    return true;
  }catch(e){console.warn('Lecture impossible',e);return false}
}
async function sync(force){
  if(!force&&Date.now()-lastSync<20000)return;
  await flush();
  if(await pull()){render();runRecurring()}
  updateSync();
}
function updateSync(){
  const d=$('syncDot');if(!d)return;
  const off=!navigator.onLine||!sb, pend=outbox.length>0;
  d.className='sync'+(off?' off':pend?' pending':'');
  d.title=off?`Hors ligne${pend?' · '+outbox.length+' modification(s) en attente':''}`:pend?outbox.length+' modification(s) en cours d\'envoi':'Synchronisé';
}

/* ---------- Dépenses récurrentes ---------- */
function runRecurring(){
  const cur=ymOf(new Date()), td=new Date().getDate(), now=nowISO(), ops=[];let n=0;
  for(const r of Object.values(D.recurring)){
    if(!r.active)continue;
    let m=shiftM(r.last_month,1), last=r.last_month;
    while(m<=cur){
      const day=Math.min(r.day,daysIn(m));
      if(m===cur&&td<day)break;
      const id=`rec-${r.id}-${m}`;
      if(!D.expenses[id]){ops.push({t:'expenses',op:'upsert',row:{id,amount:r.amount,fee:r.fee||0,category:r.category,method:r.method,date:`${m}-${pad(day)}`,note:r.label,recurring_id:r.id,created_at:now,updated_at:now}});n++}
      last=m;m=shiftM(m,1);
    }
    if(last!==r.last_month)ops.push({t:'recurring',op:'upsert',row:Object.assign({},r,{last_month:last,updated_at:now})});
  }
  if(ops.length){mutate(ops);if(n)toast(n>1?`${n} dépenses récurrentes ajoutées`:'1 dépense récurrente ajoutée')}
}

/* ---------- Repères Congo et propositions ---------- */
const SMIG=70400; // SMIG mensuel depuis le 1er janvier 2025
// Pondérations de l'indice des prix INS, Brazzaville (structure de consommation ECOM 2011), en %
const INS_BZV={alimentation:44.4,logfac:9.7,transport:10.0,communication:6.7,vetements:6.9,loisirs:7.6,sante:2.4,education:2.9,divers:9.3};
const PRICES={bus:150,taxi:1000,kwh:49.08,fibre:35000};
const r500=n=>Math.round(n/500)*500;
const lin=(x,x0,x1,y0,y1)=>x<=x0?y0:x>=x1?y1:y0+(x-x0)/(x1-x0)*(y1-y0);
function proposal(R){
  const k=R/SMIG, sh={};
  sh.alimentation=lin(k,2,6,44,30);
  const save=lin(k,1.5,5,0,15);
  sh.logement=lin(k,1,3,15,20);
  sh.factures=5;
  const rest=100-sh.alimentation-save-sh.logement-sh.factures;
  const W={transport:10,communication:6.7,vetements:6.9,loisirs:7.6,famille:5,sante:2.4,education:2.9,autres:4.3};
  const tw=Object.values(W).reduce((a,b)=>a+b,0);
  for(const c in W)sh[c]=W[c]*rest/tw;
  const amt={};for(const c in sh)amt[c]=r500(R*sh[c]/100);
  return {k,save,saveAmt:r500(R*save/100),sh,amt};
}
const savingsGoal=m=>D.settings.savings_goal||(incomeIn(m)?proposal(incomeIn(m)).saveAmt:0);

function tipFor(c,x,t){
  const ex=fmt(Math.max(x-t,0));
  switch(c){
    case 'transport':{const n=Math.round(x/PRICES.taxi),g=r500(x/PRICES.taxi/3*(PRICES.taxi-PRICES.bus));
      return `Ton transport équivaut à environ <strong>${n} courses de taxi</strong> à 1 000 FCFA. Remplacer une course sur trois par le bus (150 FCFA) ferait gagner environ <strong>${fmt(g)}</strong> par mois.`}
    case 'alimentation':return `Tu dépasses la cible de <strong>${ex}</strong>. Achète les produits de base en gros (sac de riz, bidon d'huile) plutôt qu'au détail, et fais une liste de marché pour la semaine.`;
    case 'factures':return `Au tarif E²C des petits compteurs, 100 kWh coûtent environ <strong>${fmt(100*PRICES.kwh)}</strong> hors taxes. Climatiseur, congélateur et chauffe-eau sont les appareils qui pèsent le plus sur la facture.`;
    case 'communication':return x>PRICES.fibre?`Tu dépenses plus que l'abonnement fibre Congo Telecom (<strong>35 000 FCFA</strong> par mois). Une connexion fixe à la maison pourrait te coûter moins cher que la data mobile.`:`Tu dépasses la cible de <strong>${ex}</strong>. Un forfait 30 jours revient en général moins cher que des petits forfaits achetés au jour le jour.`;
    case 'logement':return `Le logement dépasse le repère de 20 % du revenu. Si tu prévois de déménager, compte aussi l'entrée habituelle à Brazzaville : <strong>2 mois de caution + 1 mois d'agence</strong>.`;
    case 'loisirs':return `Dépassement de <strong>${ex}</strong>. Fixe une enveloppe sorties en début de mois, idéalement en espèces, et arrête quand elle est vide.`;
    case 'famille':return `Dépassement de <strong>${ex}</strong>. Les aides à la famille sont souvent imprévues : garde une petite réserve dédiée plutôt que de puiser dans les autres postes.`;
    default:return `Dépassement de <strong>${ex}</strong> par rapport à la cible proposée.`;
  }
}

/* ---------- Rendu ---------- */
function render(){
  if($('app').hidden)return;
  $('monthLabel').textContent=mLong(S.month);
  document.querySelectorAll('nav.tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===S.tab?'page':'false'));
  const views={dash:renderDash,list:renderList,budgets:renderBudgets,tips:renderTips,settings:renderSettings};
  const banner=!sb?`<div class="banner"><b>Mode hors ligne.</b> Tes saisies sont gardées sur ce téléphone et seront envoyées dès que l'application pourra joindre le serveur.</div>`:'';
  $('main').innerHTML=banner+(views[S.tab]||renderDash)();
  updateSync();
}

function renderDash(){
  const ex=monthExp(S.month), spent=sumBy(ex,spend), inc=incomeIn(S.month), name=mName(S.month);
  let h='';
  if(inc>0){
    const bal=inc-spent;
    h+=`<section class="block hero"><h2>Solde de ${esc(name)}</h2><div class="big num ${bal<0?'neg':''}">${fmtS(bal)}</div>
      <div class="sub num"><span>Entrées <b>${fmt(inc)}</b></span><span>Dépensé <b>${fmt(spent)}</b></span><span>${ex.length} dépense${ex.length>1?'s':''}</span></div></section>`;
  }else{
    h+=`<section class="block hero"><h2>Dépensé en ${esc(name)}</h2><div class="big num">${fmt(spent)}</div>
      <div class="sub"><span>${ex.length} dépense${ex.length>1?'s':''}</span><button type="button" class="linkbtn" data-act="newIncome">Ajouter une entrée d'argent pour voir le solde</button></div></section>`;
  }
  // Bilan du mois précédent, visible la première semaine
  const cur=ymOf(new Date()), prev=shiftM(cur,-1);
  if(S.month===cur&&new Date().getDate()<=7&&LS.get(K.bilan,'')!==prev&&(monthExp(prev).length||monthInc(prev).length)){
    h+=`<section class="block"><div class="block-head"><h2>Bilan de ${esc(mName(prev))}</h2><button type="button" class="linkbtn" data-act="hideBilan">Masquer</button></div>${bilanHTML(prev)}</section>`;
  }
  // Épargne et frais
  const goal=savingsGoal(S.month), saved=inc-spent, fees=feesIn(ex);
  if(inc>0||fees>0){
    const st=inc>0?(saved>=goal&&goal>0?'good':saved>=0?'ok':'bad'):'off';
    h+=`<section class="block"><div class="kpis">
      <div class="kpi"><span>épargne du mois</span><span class="mid num ${saved<0?'neg':''}" style="${saved<0?'color:var(--bad)':''}">${inc>0?fmtS(saved):'-'}</span>${inc>0&&goal?`<span class="pill ${st}" style="align-self:flex-start">objectif ${fmt(goal)}</span>`:''}</div>
      <div class="kpi"><span>frais mobile money</span><span class="mid num">${fmt(fees)}</span><span class="pct num">${new Date().getFullYear()} : ${fmt(feesIn(expenses().filter(e=>e.date.startsWith(String(new Date().getFullYear())))))}</span></div>
    </div></section>`;
  }
  // Alertes budgets
  const cats=byCat(ex);
  const alerts=Object.entries(D.budgets).filter(([c,b])=>b>0&&(cats[c]||0)/b>=.8).map(([c,b])=>({c,b,s:cats[c]||0}));
  const over=alerts.filter(a=>a.s>a.b), near=alerts.filter(a=>a.s<=a.b);
  if(over.length)h+=`<div class="alert bad" role="status"><b>Budget dépassé</b>${over.map(a=>`<span>${esc(CAT[a.c]?.label||a.c)} : ${fmt(a.s)} sur ${fmt(a.b)} (+${fmt(a.s-a.b)})</span>`).join('')}</div>`;
  if(near.length)h+=`<div class="alert warn" role="status"><b>Budget presque atteint (80 %)</b>${near.map(a=>`<span>${esc(CAT[a.c]?.label||a.c)} : ${a.s>=a.b?'budget atteint':'reste '+fmt(a.b-a.s)}</span>`).join('')}</div>`;
  if(inc>0&&!hasBudgets())h+=`<button type="button" class="teaser" data-tab="tips"><div><b>Des budgets adaptés à tes revenus sont prêts</b><span>Calculés avec les statistiques de consommation de Brazzaville.</span></div><b aria-hidden="true">›</b></button>`;

  if(!ex.length){
    h+=`<section class="block"><div class="empty"><strong>Aucune dépense en ${esc(name)}</strong><span>Touche le bouton + pour noter ta première dépense, ou ajoute tes dépenses récurrentes dans Réglages.</span><button type="button" class="btn-primary" data-act="new">Ajouter une dépense</button></div></section>`;
    return h+renderTrend();
  }
  const bud=Object.entries(D.budgets).filter(([,b])=>b>0);
  if(bud.length){
    h+=`<section class="block"><div class="block-head"><h2>Budgets du mois</h2><small class="num">${fmt(sumBy(bud,([c])=>cats[c]||0))} / ${fmt(sumBy(bud,([,b])=>b))}</small></div><div class="list">`;
    for(const [c,b] of bud.sort((x,y)=>(cats[y[0]]||0)/y[1]-(cats[x[0]]||0)/x[1])){
      const s=cats[c]||0, st=budgetState(s,b);
      h+=`<div class="hbar"><div class="lab"><span class="dot" style="background:${CAT[c]?.color}"></span><span>${esc(CAT[c]?.label||c)}</span></div><span class="pill ${st}">${st==='bad'?'Dépassé':Math.round(s/b*100)+' %'}</span>
        <div class="track"><div class="fill" style="width:${Math.min(s/b,1)*100}%;background:var(--${st==='ok'?'accent':st})"></div></div><span class="pct num" style="grid-column:1/-1">${fmt(s)} sur ${fmt(b)}</span></div>`;
    }
    h+=`</div></section>`;
  }
  h+=`<section class="block"><h2>Répartition par catégorie</h2><div class="list">`;
  for(const [c,v] of Object.entries(cats).sort((a,b)=>b[1]-a[1])){
    const p=v/spent*100;
    h+=`<div class="hbar"><div class="lab"><span class="dot" style="background:${CAT[c]?.color||'#888'}"></span><span>${esc(CAT[c]?.label||c)}</span></div><span class="num"><b>${fmt(v)}</b> <span class="pct">${p.toFixed(0)} %</span></span>
      <div class="track"><div class="fill" style="width:${p}%;background:${CAT[c]?.color||'#888'}"></div></div></div>`;
  }
  h+=`</div></section>`+renderTrend();
  const top=[...ex].sort((a,b)=>spend(b)-spend(a)).slice(0,5);
  h+=`<section class="block"><h2>Top 5 des dépenses</h2><div class="rows">${top.map((e,i)=>`<button type="button" class="rowbtn" data-edit="${esc(e.id)}"><span class="rank">${i+1}</span><span class="t"><span>${esc(CAT[e.category]?.label||e.category)}</span><span>${dFr(e.date)} · ${esc(MET[e.method]?.label||e.method)}${e.note?' · '+esc(e.note):''}</span></span><b class="num">${fmt(spend(e))}</b></button>`).join('')}</div></section>`;
  const mets={};for(const e of ex)mets[e.method]=(mets[e.method]||0)+spend(e);
  h+=`<section class="block"><h2>Moyens de paiement</h2><div class="stack">${METHODS.filter(([k])=>mets[k]).map(([k])=>`<div style="width:${mets[k]/spent*100}%;background:${MET[k].color}" title="${esc(MET[k].label)}"></div>`).join('')}</div>
    <div class="legend">${METHODS.map(([k])=>`<div><span class="dot" style="background:${MET[k].color}"></span><span>${esc(MET[k].label)}</span><span class="v num">${Math.round((mets[k]||0)/spent*100)} %</span></div>`).join('')}</div></section>`;
  return h;
}

function renderTrend(){
  const months=[];for(let i=5;i>=0;i--)months.push(shiftM(S.month,-i));
  const tots=months.map(spentIn), max=Math.max(...tots,1), nz=tots.filter(Boolean);
  let h=`<section class="block"><div class="block-head"><h2>Évolution sur 6 mois</h2>${nz.length?`<small class="num">Moyenne ${fmt(sumBy(nz,x=>x)/nz.length)}</small>`:''}</div><div class="bars">`;
  months.forEach((m,i)=>{const t=tots[i];h+=`<div class="bar-col ${m===S.month?'cur':''}"><span class="bar-val num">${t?shortN(t):''}</span><div class="bar" style="height:${t?Math.max(t/max*82,2):0}%"></div></div>`});
  return h+`</div><div class="bar-labs">${months.map(m=>`<span class="${m===S.month?'cur':''}">${esc(mShort(m))}</span>`).join('')}</div></section>`;
}

function bilanHTML(m){
  const ex=monthExp(m), spent=sumBy(ex,spend), inc=incomeIn(m), p=shiftM(m,-1), pSpent=spentIn(p);
  const cats=byCat(ex), pc=byCat(monthExp(p)), goal=savingsGoal(m), saved=inc-spent;
  const top=Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const rise=Object.entries(cats).map(([c,v])=>[c,v-(pc[c]||0)]).filter(([,d])=>d>0).sort((a,b)=>b[1]-a[1])[0];
  const lines=[];
  lines.push(`Tu as dépensé <strong>${fmt(spent)}</strong> en ${ex.length} opération${ex.length>1?'s':''}${pSpent?`, soit <strong>${spent>=pSpent?'+':'−'}${Math.abs(Math.round((spent-pSpent)/pSpent*100))} %</strong> par rapport à ${esc(mName(p))}`:''}.`);
  if(inc>0)lines.push(saved>=0?`Épargne réalisée : <strong>${fmt(saved)}</strong>${goal?` pour un objectif de ${fmt(goal)} ${saved>=goal?'(atteint)':'(non atteint)'}`:''}.`:`Tu as dépensé <strong>${fmt(-saved)}</strong> de plus que tes entrées.`);
  if(top.length)lines.push(`Postes principaux : ${top.map(([c,v])=>`${esc(CAT[c]?.label||c)} ${fmt(v)}`).join(', ')}.`);
  if(rise&&pSpent)lines.push(`Plus forte hausse : <strong>${esc(CAT[rise[0]]?.label||rise[0])}</strong> (+${fmt(rise[1])}).`);
  const fees=feesIn(ex);if(fees)lines.push(`Frais Mobile Money : <strong>${fmt(fees)}</strong>.`);
  return `<div class="tip" style="border-top:none;padding-top:0"><span class="rail" style="background:var(--accent)"></span><div>${lines.map(l=>`<p style="margin:0 0 6px">${l}</p>`).join('')}</div></div>`;
}

function renderList(){
  const q=S.q.trim().toLowerCase();
  const all=monthExp(S.month);
  const ex=all.filter(e=>(S.filter==='all'||e.category===S.filter)&&(!q||(e.note||'').toLowerCase().includes(q)||(CAT[e.category]?.label||'').toLowerCase().includes(q)||String(e.amount).includes(q)));
  const {k,d}=S.sort, dir=d==='asc'?1:-1;
  ex.sort((a,b)=>k==='amount'?(spend(a)-spend(b))*dir:(a.date<b.date?-1:a.date>b.date?1:(a.created_at||'')<(b.created_at||'')?-1:1)*dir);
  const present=new Set(all.map(e=>e.category));
  let h=`<section class="block"><div class="block-head"><h2>Dépenses de ${esc(mName(S.month))}</h2><small class="num">${ex.length} ligne${ex.length>1?'s':''}</small></div>
    <label class="search"><span aria-hidden="true">⌕</span><input id="q" type="search" placeholder="Rechercher une note, une catégorie, un montant" value="${esc(S.q)}" aria-label="Rechercher"></label>
    <div class="filters" role="group" aria-label="Filtrer par catégorie"><button type="button" data-filter="all" aria-pressed="${S.filter==='all'}">Toutes</button>${CATS.filter(c=>present.has(c[0])).map(c=>`<button type="button" data-filter="${c[0]}" aria-pressed="${S.filter===c[0]}">${esc(c[1])}</button>`).join('')}</div>`;
  if(!ex.length){
    h+=`<div class="empty"><strong>Rien à afficher</strong><span>${all.length?'Aucune dépense ne correspond à ta recherche.':'Aucune dépense ce mois-ci. Touche + pour en ajouter une.'}</span></div></section>`;
  }else{
    const arrow=key=>S.sort.k===key?(S.sort.d==='asc'?' ↑':' ↓'):'';
    h+=`<div class="sheet-scroll"><table><thead><tr><th class="rownum">#</th><th><button type="button" data-sort="date">date${arrow('date')}</button></th><th>catégorie</th><th>moyen</th><th>note</th><th class="amt">frais</th><th class="amt"><button type="button" data-sort="amount">montant${arrow('amount')}</button></th></tr></thead><tbody>`;
    ex.forEach((e,i)=>{h+=`<tr data-edit="${esc(e.id)}" tabindex="0"><td class="rownum num">${i+1}</td><td class="num">${dFr(e.date)}</td><td><span class="lab" style="display:inline-flex"><span class="dot" style="background:${CAT[e.category]?.color||'#888'}"></span>${esc(CAT[e.category]?.label||e.category)}</span>${e.recurring_id?'<span class="rec-tag">↻</span>':''}</td><td>${esc(MET[e.method]?.label||e.method)}</td><td class="note">${esc(e.note||'')}</td><td class="amt num">${e.fee?fmtN(e.fee):''}</td><td class="amt num">${fmtN(e.amount)}</td></tr>`});
    h+=`</tbody><tfoot><tr><td></td><td colspan="4">Total (FCFA)</td><td class="amt num">${fmtN(feesIn(ex))}</td><td class="amt num">${fmtN(sumBy(ex,e=>e.amount))}</td></tr></tfoot></table></div>
      <p class="hint">Touche une ligne pour la modifier. ↻ : dépense récurrente ajoutée automatiquement.</p></section>`;
  }
  h+=`<section class="block"><h2>Export Excel</h2><p class="hint">Fichier CSV séparé par des points-virgules, qui s'ouvre directement dans Excel.</p>
    <div class="actions"><button type="button" class="btn" data-export="month">Exporter ${esc(mName(S.month))}</button><button type="button" class="btn" data-export="all">Tout l'historique</button></div></section>`;
  return h;
}

function renderBudgets(){
  const inc=monthInc(S.month).sort((a,b)=>a.date<b.date?1:-1), cats=byCat(monthExp(S.month));
  let h=`<section class="block"><div class="block-head"><h2>Entrées d'argent de ${esc(mName(S.month))}</h2><small class="num">${fmt(sumBy(inc,e=>e.amount))}</small></div>`;
  h+=inc.length?`<div class="rows">${inc.map(e=>`<button type="button" class="rowbtn" data-income="${esc(e.id)}"><span class="dot" style="background:${SRC[e.source]?.color||'#888'}"></span><span class="t"><span>${esc(SRC[e.source]?.label||e.source)}</span><span>${dFr(e.date)}${e.note?' · '+esc(e.note):''}</span></span><b class="num">${fmt(e.amount)}</b></button>`).join('')}</div>`:`<p class="hint">Aucune entrée ce mois-ci. Ajoute ton salaire, une prime ou une mission pour calculer ton solde et ton épargne.</p>`;
  h+=`<button type="button" class="btn" data-act="newIncome">+ Ajouter une entrée</button></section>`;
  h+=`<section class="block"><div class="block-head"><h2>Budgets mensuels</h2><small>valables chaque mois</small></div><p class="hint">Laisse vide pour ne pas suivre une catégorie. Alerte à 80 % et à 100 %.</p><div>`;
  for(const [c,label,color] of CATS){
    const b=D.budgets[c]||0, s=cats[c]||0;
    h+=`<div class="form-row"><div class="lab"><span class="dot" style="background:${color}"></span><span>${esc(label)}</span></div>
      <label class="field"><input class="r" id="b-${c}" data-bud="${c}" inputmode="numeric" placeholder="-" value="${b?group(b):''}" aria-label="Budget ${esc(label)}"><span>FCFA</span></label>
      <span class="meta num">Dépensé ce mois : ${fmt(s)}${b?` · <span class="pill ${budgetState(s,b)}">${Math.round(s/b*100)} %</span>`:''}</span></div>`;
  }
  h+=`</div><div class="actions" style="justify-content:space-between;align-items:center"><span class="hint num">Total budgété : ${fmt(sumBy(Object.values(D.budgets),v=>v||0))}</span><button type="button" class="btn-primary" data-act="saveBud">Enregistrer les budgets</button></div></section>`;
  return h;
}

function renderTips(){
  const R=incomeIn(S.month), name=mName(S.month);
  if(!R)return `<section class="block"><div class="empty"><strong>Ajoute tes entrées de ${esc(name)}</strong><span>Les propositions sont calculées à partir de tes revenus du mois et des statistiques de consommation de Brazzaville.</span><button type="button" class="btn-primary" data-act="newIncome">Ajouter une entrée d'argent</button></div></section>`+renderRefs();
  const P=proposal(R), ex=monthExp(S.month), total=sumBy(ex,spend), cats=byCat(ex), isCur=S.month===ymOf(new Date()), goal=savingsGoal(S.month);
  let h='';
  if(isCur&&total>0){
    const day=new Date().getDate(), Dm=daysIn(S.month);
    const fixed=sumBy(ex.filter(e=>e.recurring_id),spend), variable=total-fixed;
    const toCome=sumBy(Object.values(D.recurring).filter(r=>r.active&&r.last_month<S.month),r=>r.amount+(r.fee||0));
    const proj=fixed+toCome+variable/day*Dm, cap=R-goal;
    const st=proj>R?'bad':proj>cap?'warn':'ok';
    const msg=st==='bad'?`À ce rythme, tu finirais le mois à <strong>${fmt(proj)}</strong>, au-dessus de tes entrées. Ralentis sur les postes en dépassement ci-dessous.`:st==='warn'?`À ce rythme, tu finirais à <strong>${fmt(proj)}</strong>. Tu restes dans tes entrées mais tu n'atteindrais pas l'objectif d'épargne de ${fmt(goal)}.`:`À ce rythme, tu finirais à <strong>${fmt(proj)}</strong>, ce qui laisse environ <strong>${fmt(R-proj)}</strong> à épargner.`;
    h+=`<div class="alert ${st}"><b>Projection fin de ${esc(name)} (jour ${day} sur ${Dm})</b><span>${msg}</span><span class="hint">Les dépenses récurrentes sont comptées une seule fois, le reste au rythme actuel.</span></div>`;
  }
  if(total>0){
    const scale=isCur?Math.min(new Date().getDate()/daysIn(S.month),1):1;
    const fixedC=byCat(ex.filter(e=>e.recurring_id));
    const target=c=>{const f=fixedC[c]||0,a=P.amt[c];return f>=a?a:f+(a-f)*scale};
    const over=Object.keys(P.amt).map(c=>({c,x:cats[c]||0,t:target(c)})).filter(o=>o.t>0&&o.x>o.t*1.05).sort((a,b)=>(b.x-b.t)-(a.x-a.t));
    h+=`<section class="block"><div class="block-head"><h2>Propositions pour ${esc(name)}</h2><small>${isCur?'au prorata du mois':''}</small></div>`;
    h+=over.length?`<div>${over.slice(0,4).map(o=>`<div class="tip"><span class="rail" style="background:${CAT[o.c].color}"></span><div><b>${esc(CAT[o.c].label)} · <span class="num">${fmt(o.x)}</span> pour une cible de <span class="num">${fmt(o.t)}</span></b><p>${tipFor(o.c,o.x,o.t)}</p></div></div>`).join('')}</div>`:`<p class="hint">Toutes tes catégories sont dans les cibles proposées. Continue comme ça.</p>`;
    const fees=feesIn(ex);
    if(fees>0)h+=`<div class="tip"><span class="rail" style="background:${MET.mtn.color}"></span><div><b>Frais Mobile Money · <span class="num">${fmt(fees)}</span></b><p>Regroupe tes retraits et paie directement en Mobile Money quand le commerçant l'accepte : chaque retrait évité, ce sont des frais en moins.</p></div></div>`;
    h+=`</section>`;
    const me={alimentation:cats.alimentation||0,logfac:(cats.logement||0)+(cats.factures||0),transport:cats.transport||0,communication:cats.communication||0,vetements:cats.vetements||0,loisirs:cats.loisirs||0,sante:cats.sante||0,education:cats.education||0,divers:(cats.famille||0)+(cats.autres||0)};
    const lab={alimentation:'Alimentation',logfac:'Logement et factures',transport:'Transport',communication:'Crédit & data',vetements:'Vêtements',loisirs:'Loisirs & sorties',sante:'Santé',education:'Éducation',divers:'Famille & autres'};
    const col={alimentation:CAT.alimentation.color,logfac:CAT.logement.color,transport:CAT.transport.color,communication:CAT.communication.color,vetements:CAT.vetements.color,loisirs:CAT.loisirs.color,sante:CAT.sante.color,education:CAT.education.color,divers:CAT.famille.color};
    h+=`<section class="block"><div class="block-head"><h2>Toi et le ménage moyen de Brazzaville</h2><small>part des dépenses</small></div><div class="list">`;
    for(const k in INS_BZV){const mine=me[k]/total*100, ref=INS_BZV[k];
      h+=`<div class="cmp"><span>${lab[k]}</span><div class="cr"><span>Toi</span><div class="t2"><div style="width:${Math.min(mine,100)}%;background:${col[k]}"></div></div><span class="num" style="text-align:right;color:var(--ink)">${Math.round(mine)} %</span>
        <span>Moyenne</span><div class="t2"><div style="width:${ref}%;background:var(--muted);opacity:.45"></div></div><span class="num" style="text-align:right">${Math.round(ref)} %</span></div></div>`}
    h+=`</div><p class="hint">Moyenne : structure de consommation des ménages de Brazzaville utilisée par l'INS pour l'indice des prix (enquête ECOM 2011). Échelle de 0 à 100 %.</p></section>`;
  }else{
    h+=`<section class="block"><div class="empty" style="padding:16px 8px"><strong>Pas encore de dépenses en ${esc(name)}</strong><span>Dès tes premières saisies, tu verras ici une projection de fin de mois et des conseils ciblés.</span></div></section>`;
  }
  const prev=shiftM(S.month,-1);
  if(monthExp(prev).length)h+=`<section class="block"><h2>Bilan de ${esc(mName(prev))}</h2>${bilanHTML(prev)}</section>`;
  const hb=hasBudgets();
  h+=`<section class="block"><div class="block-head"><h2>Budgets proposés</h2><small class="num">pour ${fmt(R)}</small></div>
    <p class="hint">Calculés à partir de la structure de consommation de Brazzaville, ajustée à tes revenus : la part de l'alimentation baisse quand le revenu monte, et une part est réservée à l'épargne.</p><div>`;
  for(const c of ['alimentation','logement','transport','factures','communication','loisirs','vetements','famille','sante','education','autres']){const cur=D.budgets[c]||0;
    h+=`<div class="prop-row"><span class="lab"><span class="dot" style="background:${CAT[c].color}"></span><span>${esc(CAT[c].label)}</span></span><b class="num">${fmt(P.amt[c])}</b><span class="sub hint num">${P.sh[c].toFixed(0)} % des entrées${cur?` · budget actuel : ${fmt(cur)}`:''}</span></div>`}
  h+=`<div class="prop-row save"><span><b>Épargne visée</b></span><b class="num">${fmt(P.saveAmt)}</b><span class="sub hint">${P.save.toFixed(0)} % des entrées : c'est ce qui doit rester en fin de mois.</span></div></div>
    <p class="hint">${hb?'Tu as déjà des budgets : les appliquer remplacera les montants actuels.':'Applique-les en un geste, puis ajuste dans l\'onglet Budget (ton vrai loyer en premier).'}</p>
    <div class="actions"><button type="button" class="${S.armed==='prop'?'btn-danger':'btn-primary'}" data-act="applyProp">${S.armed==='prop'?'Confirmer le remplacement':hb?'Remplacer mes budgets':'Appliquer ces budgets'}</button></div></section>`;
  return h+renderRefs();
}

function renderRefs(){
  return `<section class="block"><h2>Repères de prix au Congo</h2><div class="ref num">
    <span>Salaire minimum (SMIG)<small>depuis janvier 2025</small></span><span class="v">70 400 FCFA</span>
    <span>Bus à Brazzaville<small>tarif maintenu, juillet 2024</small></span><span class="v">150 FCFA</span>
    <span>Course de taxi à Brazzaville<small>tarif maintenu, juillet 2024</small></span><span class="v">1 000 FCFA</span>
    <span>Électricité E²C, petits compteurs<small>prix du kWh hors taxes, plus 2 268 à 2 550 FCFA fixes</small></span><span class="v">49,08 FCFA</span>
    <span>Fibre Congo Telecom 512 Mbit/s<small>par mois, hors frais d'accès</small></span><span class="v">35 000 FCFA</span>
    <span>Riz, sac de 25 kg<small>marché de Brazzaville, février 2023</small></span><span class="v">18 000 FCFA</span>
    <span>Huile végétale, 1 litre<small>février 2022</small></span><span class="v">1 350 FCFA</span>
    <span>Entrée dans un logement loué<small>usage courant</small></span><span class="v">2 mois + 1 mois</span>
    <span>Revenu pour vivre décemment en ville<small>fourchette indicative</small></span><span class="v">200 à 300 k</span>
  </div><p class="hint">Les prix de l'alimentation datent de 2022 et 2023 et ont pu augmenter depuis.</p>
  <h2 style="margin-top:6px">Sources</h2><ol class="src">
    <li><a href="https://interholco.com/images/pdfs/IHC-Sustainability-Rep-2022/Indice-Janvier-2022.pdf" target="_blank" rel="noopener">INS Congo, indice des prix janvier 2022 (pondérations ECOM 2011)</a></li>
    <li><a href="https://africa24tv.com/?p=133603" target="_blank" rel="noopener">Africa24 : le SMIG passe à 70 400 FCFA</a></li>
    <li><a href="https://fr.allafrica.com/stories/202407300189.html" target="_blank" rel="noopener">AllAfrica : tarifs des transports en commun inchangés</a></li>
    <li><a href="https://liziba.cg/en/facteur-de-production-electricite/" target="_blank" rel="noopener">LIZIBA : tarifs d'électricité</a> et <a href="https://liziba.cg/en/facteur-de-production-telecommunication/" target="_blank" rel="noopener">télécommunications</a></li>
    <li><a href="https://lesechos-congobrazza.com/societe/9154-cherte-de-la-vie-a-brazzaville-quand-manger-du-poisson-frais-ou-fume-devient-un-luxe" target="_blank" rel="noopener">Les Échos du Congo : prix au marché, 2023</a></li>
    <li><a href="https://www.adiac-congo.com/content/panier-de-la-menagere-des-prix-des-denrees-alimentaires-galopent-au-marche-135419" target="_blank" rel="noopener">ADIAC : panier de la ménagère, 2022</a></li>
    <li><a href="https://lepetitjournal.com/vivre-republique-congo/loger-brazzaville-guide-394087" target="_blank" rel="noopener">Le Petit Journal : se loger à Brazzaville</a></li>
    <li><a href="https://africarrieres.com/congo/fr/guide/decouvrir/cout-de-la-vie" target="_blank" rel="noopener">Africarrières : coût de la vie au Congo</a></li>
  </ol></section>`;
}

function renderSettings(){
  let h='';
  // Épargne
  const months=[];for(let i=5;i>=0;i--)months.push(shiftM(S.month,-i));
  const sav=months.map(m=>incomeIn(m)?incomeIn(m)-spentIn(m):0);
  const allMonths=[...new Set([...expenses(),...incomes()].map(e=>e.date.slice(0,7)))].sort();
  const cumul=sumBy(allMonths.filter(m=>m<=S.month&&incomeIn(m)),m=>incomeIn(m)-spentIn(m));
  const max=Math.max(...sav.map(Math.abs),1), goal=D.settings.savings_goal||0, prop=incomeIn(S.month)?proposal(incomeIn(S.month)).saveAmt:0;
  h+=`<section class="block"><div class="block-head"><h2>Objectif d'épargne</h2><small class="num">cumul ${allMonths[0]?'depuis '+esc(mShort(allMonths[0]))+' '+allMonths[0].slice(0,4):''}</small></div>
    <div class="mid num" style="${cumul<0?'color:var(--bad)':''}">${fmtS(cumul)}</div>
    <div class="bars" style="height:130px">${months.map((m,i)=>{const v=sav[i];return `<div class="bar-col ${m===S.month?'cur':''}"><span class="bar-val num">${v?shortN(v):''}</span><div class="bar ${v<0?'neg':''}" style="height:${v?Math.max(Math.abs(v)/max*80,2):0}%"></div></div>`}).join('')}</div>
    <div class="bar-labs">${months.map(m=>`<span class="${m===S.month?'cur':''}">${esc(mShort(m))}</span>`).join('')}</div>
    <div class="form-row" style="border-top:1px solid var(--line);padding-top:12px"><span>Objectif par mois${prop?`<span class="meta" style="display:block">Proposé pour tes entrées : ${fmt(prop)}</span>`:''}</span>
      <label class="field"><input class="r" id="goal" inputmode="numeric" placeholder="${prop?group(prop):'0'}" value="${goal?group(goal):''}" aria-label="Objectif d'épargne mensuel"><span>FCFA</span></label></div>
    <div class="actions"><button type="button" class="btn-primary" data-act="saveGoal">Enregistrer l'objectif</button></div></section>`;
  // Récurrentes
  const recs=Object.values(D.recurring).sort((a,b)=>a.day-b.day);
  h+=`<section class="block"><div class="block-head"><h2>Dépenses récurrentes</h2><small class="num">${fmt(sumBy(recs.filter(r=>r.active),r=>r.amount+(r.fee||0)))} / mois</small></div>
    <p class="hint">Ajoutées automatiquement chaque mois, le jour indiqué. Tu peux toujours modifier ou supprimer une dépense ajoutée.</p>`;
  if(recs.length)h+=`<div class="rows">${recs.map(r=>`<div class="rowbtn" style="cursor:default"><span class="dot" style="background:${CAT[r.category]?.color||'#888'}"></span><span class="t"><span>${esc(r.label)}</span><span>le ${r.day} · ${esc(CAT[r.category]?.label||r.category)} · ${esc(MET[r.method]?.label||r.method)}</span></span><span style="display:flex;gap:6px;align-items:center"><b class="num">${fmt(r.amount)}</b>
      <button type="button" class="pill ${r.active?'good':'off'}" style="border:none" data-rec-toggle="${esc(r.id)}">${r.active?'active':'en pause'}</button>
      <button type="button" class="pill ${S.armed==='rec:'+r.id?'bad':'off'}" style="border:none" data-rec-del="${esc(r.id)}" aria-label="Supprimer ${esc(r.label)}">${S.armed==='rec:'+r.id?'confirmer':'×'}</button></span></div>`).join('')}</div>`;
  h+=`<details><summary class="linkbtn" style="cursor:pointer">+ Ajouter une dépense récurrente</summary>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">
      <div class="grid2"><label class="inp">libellé<input id="r-label" maxlength="60" placeholder="Ex. Loyer"></label><label class="inp">montant (FCFA)<input id="r-amount" inputmode="numeric" placeholder="0"></label></div>
      <div class="grid2"><label class="inp">catégorie<select id="r-cat">${CATS.map(c=>`<option value="${c[0]}">${esc(c[1])}</option>`).join('')}</select></label><label class="inp">moyen<select id="r-met">${METHODS.map(m=>`<option value="${m[0]}">${esc(m[1])}</option>`).join('')}</select></label></div>
      <div class="grid2"><label class="inp">jour du mois (1 à 28)<input id="r-day" inputmode="numeric" placeholder="5"></label><label class="inp">frais mobile money<input id="r-fee" inputmode="numeric" placeholder="0"></label></div>
      <label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="r-now" checked> Ajouter aussi ce mois-ci si le jour est passé</label>
      <p class="err" id="r-err" hidden></p>
      <button type="button" class="btn-primary" data-act="addRec">Ajouter</button></div></details></section>`;
  // Sauvegarde
  h+=`<section class="block"><h2>Sauvegarde</h2><p class="hint">Un fichier avec toutes tes données (dépenses, entrées, budgets, récurrentes, objectif). Garde-le en lieu sûr, par exemple dans ton Drive.</p>
    <div class="actions"><button type="button" class="btn" data-act="exportJson">Télécharger la sauvegarde</button><button type="button" class="btn" data-act="pickImport">Restaurer un fichier</button></div>`;
  if(pendingImport){const p=pendingImport;
    h+=`<div class="alert warn"><b>Fichier prêt à importer</b><span class="num">${p.expenses.length} dépenses · ${p.incomes.length} entrées · ${Object.keys(p.budgets).length} budgets · ${p.recurring.length} récurrentes</span><span>Les éléments déjà présents avec le même identifiant seront remplacés. Rien n'est supprimé.</span>
      <div class="actions" style="margin-top:6px"><button type="button" class="btn-primary" data-act="doImport">Importer</button><button type="button" class="btn" data-act="cancelImport">Annuler</button></div></div>`}
  h+=`</section>`;
  // Installation
  const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  h+=`<section class="block"><h2>Application</h2>`;
  if(standalone)h+=`<p class="hint">L'application est installée sur cet appareil.</p>`;
  else if(installEvt)h+=`<p class="hint">Installe le carnet sur ton écran d'accueil pour l'ouvrir comme une vraie application, même sans connexion.</p><button type="button" class="btn-primary" data-act="install">Installer l'application</button>`;
  else h+=`<p class="hint">Pour l'installer : sur Android, menu ⋮ du navigateur puis « Installer l'application » ; sur iPhone, bouton Partager puis « Sur l'écran d'accueil ».</p>`;
  h+=`</section>`;
  // Compte
  const off=!navigator.onLine||!sb;
  h+=`<section class="block"><h2>Compte et synchronisation</h2>
    <div class="ref num"><span>Compte</span><span class="v">${esc(email||'-')}</span>
    <span>État</span><span class="v">${off?'hors ligne':'en ligne'}</span>
    <span>Modifications en attente</span><span class="v">${outbox.length}</span>
    <span>Dernière synchronisation</span><span class="v">${lastSync?new Date(lastSync).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'-'}</span></div>
    <div class="actions"><button type="button" class="btn" data-act="syncNow">Synchroniser maintenant</button>
    <button type="button" class="${S.armed==='logout'?'btn-danger':'btn'}" data-act="logout">${S.armed==='logout'?'Confirmer la déconnexion':'Se déconnecter'}</button></div>
    ${S.armed==='logout'?`<p class="hint">${outbox.length?`<b style="color:var(--bad)">${outbox.length} modification(s) pas encore envoyée(s) seront perdues.</b> `:''}La copie locale sera effacée de ce téléphone. Tes données restent sur le serveur.</p>`:''}</section>`;
  return h;
}

/* ---------- Feuille de saisie ---------- */
function buildChips(){
  $('f-cats').innerHTML=CATS.map(([k,l,c])=>`<label class="chip"><input type="radio" name="cat" value="${k}"><span><i class="dot" style="background:${c}"></i>${esc(l)}</span></label>`).join('');
  $('f-methods').innerHTML=METHODS.map(([k,l,c])=>`<label class="chip"><input type="radio" name="met" value="${k}"><span><i class="dot" style="background:${c}"></i>${esc(l)}</span></label>`).join('');
  $('f-srcs').innerHTML=SOURCES.map(([k,l,c])=>`<label class="chip"><input type="radio" name="src" value="${k}"><span><i class="dot" style="background:${c}"></i>${esc(l)}</span></label>`).join('');
}
function setKind(kind){
  S.kind=kind;const inc=kind==='income';
  document.querySelectorAll('#kindSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.kind===kind));
  $('fs-cat').hidden=inc;$('fs-met').hidden=inc;$('fs-src').hidden=!inc;
  $('sheetTitle').textContent=(S.editing?'Modifier ':'Nouvelle ')+(inc?'entrée':'dépense');
  $('f-note').placeholder=inc?'Ex. salaire octobre':'Ex. marché Total';
  const q=inc?[50000,100000,200000,400000]:[500,1000,2000,5000,10000];
  $('quick').innerHTML=q.map(v=>`<button type="button" data-quick="${v}">${shortN(v)}</button>`).join('');
  updateFee();
}
function updateFee(){const m=document.querySelector('input[name=met]:checked')?.value;$('fs-fee').hidden=S.kind!=='expense'||!MOMO.has(m)}
function openSheet(item,kind){
  S.editing=item||null;S.confirmDel=false;
  $('kindSeg').hidden=!!item;
  setKind(kind||'expense');
  $('f-amount').value=item?group(item.amount):'';
  document.querySelectorAll('input[name=cat]').forEach(i=>i.checked=!!item&&i.value===item.category);
  const met=item?.method||LS.get(K.met,'especes');
  document.querySelectorAll('input[name=met]').forEach(i=>i.checked=i.value===met);
  const src=item?.source||'salaire';
  document.querySelectorAll('input[name=src]').forEach(i=>i.checked=i.value===src);
  $('f-fee').value=item?.fee?group(item.fee):'';
  let d=todayISO();if(!item&&d.slice(0,7)!==S.month)d=S.month+'-01';
  $('f-date').value=item?item.date:d;
  $('f-note').value=item?.note||'';
  $('f-del').hidden=!item;$('f-del').textContent='Supprimer';
  $('f-err').hidden=true;
  updateFee();
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
    const source=document.querySelector('input[name=src]:checked')?.value||'autre';
    op={t:'incomes',op:'upsert',row:Object.assign(base,{source})};
  }else{
    const category=document.querySelector('input[name=cat]:checked')?.value, method=document.querySelector('input[name=met]:checked')?.value;
    if(!category)return formErr('Choisis une catégorie.');
    if(!method)return formErr('Choisis un moyen de paiement.');
    const fee=MOMO.has(method)?toInt($('f-fee').value):0;
    op={t:'expenses',op:'upsert',row:Object.assign(base,{category,method,fee,recurring_id:S.editing?.recurring_id||null})};
    LS.set(K.met,method);
  }
  const wasEdit=!!S.editing;closeSheet();
  if(date.slice(0,7)!==S.month)S.month=date.slice(0,7);
  mutate([op]);
  toast(wasEdit?'Modification enregistrée':(S.kind==='income'?'Entrée enregistrée : ':'Dépense enregistrée : ')+fmt(amount));
}
function deleteSheet(){
  if(!S.editing)return;
  if(!S.confirmDel){S.confirmDel=true;$('f-del').textContent='Confirmer la suppression';return}
  const t=S.kind==='income'?'incomes':'expenses', id=S.editing.id;
  closeSheet();mutate([{t,op:'delete',id}]);toast('Supprimé');
}

/* ---------- Actions des onglets ---------- */
function saveBudgets(){
  const ops=[];const now=nowISO();
  document.querySelectorAll('[data-bud]').forEach(i=>{const c=i.dataset.bud,v=toInt(i.value),old=D.budgets[c]||0;
    if(v>0&&v!==old)ops.push({t:'budgets',op:'upsert',row:{category:c,amount:v,updated_at:now}});
    if(!v&&old)ops.push({t:'budgets',op:'delete',key:c});});
  if(!ops.length)return toast('Aucun changement');
  mutate(ops);toast('Budgets enregistrés');
}
function applyProposal(){
  const R=incomeIn(S.month);if(!R)return;
  if(hasBudgets()&&S.armed!=='prop'){S.armed='prop';render();return}
  S.armed=null;
  const P=proposal(R),now=nowISO();
  mutate(Object.entries(P.amt).map(([category,amount])=>({t:'budgets',op:'upsert',row:{category,amount,updated_at:now}})));
  toast('Budgets appliqués');
}
function saveGoal(){mutate([{t:'settings',op:'upsert',row:{savings_goal:toInt($('goal').value),updated_at:nowISO()}}]);toast('Objectif enregistré')}
function addRec(){
  const label=$('r-label').value.trim(), amount=toInt($('r-amount').value), day=toInt($('r-day').value), fee=toInt($('r-fee').value);
  const err=m=>{$('r-err').textContent=m;$('r-err').hidden=false};
  if(!label)return err('Indique un libellé.');
  if(!(amount>0))return err('Indique un montant.');
  if(!(day>=1&&day<=28))return err('Choisis un jour entre 1 et 28.');
  const cur=ymOf(new Date()), method=$('r-met').value, now=nowISO();
  const row={id:newId(),label:label.slice(0,60),amount,fee:MOMO.has(method)?fee:0,category:$('r-cat').value,method,day,last_month:$('r-now').checked?shiftM(cur,-1):cur,active:true,created_at:now,updated_at:now};
  mutate([{t:'recurring',op:'upsert',row}]);runRecurring();toast('Dépense récurrente ajoutée');
}
function toggleRec(id){const r=D.recurring[id];if(!r)return;mutate([{t:'recurring',op:'upsert',row:Object.assign({},r,{active:!r.active,updated_at:nowISO()})}])}
function delRec(id){if(S.armed!=='rec:'+id){S.armed='rec:'+id;render();return}S.armed=null;mutate([{t:'recurring',op:'delete',id}]);toast('Récurrente supprimée. Les dépenses déjà ajoutées sont conservées.')}

function download(name,text,type){
  const blob=new Blob([text],{type});const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
}
function exportCSV(scope){
  const list=(scope==='month'?monthExp(S.month):expenses()).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  if(!list.length)return toast('Aucune dépense à exporter');
  const q=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
  const lines=['Date;Catégorie;Moyen de paiement;Montant (FCFA);Frais (FCFA);Note;Récurrente'];
  for(const e of list)lines.push([dFr(e.date),q(CAT[e.category]?.label||e.category),q(MET[e.method]?.label||e.method),e.amount,e.fee||0,q(e.note),e.recurring_id?'oui':''].join(';'));
  lines.push(['','','Total',sumBy(list,e=>e.amount),feesIn(list),'',''].join(';'));
  download(scope==='month'?`depenses-${S.month}.csv`:`depenses-historique-${todayISO()}.csv`,'﻿'+lines.join('\r\n'),'text/csv;charset=utf-8');
}
function exportJson(){
  const data={app:'carnet-depenses',version:2,exported_at:nowISO(),expenses:expenses(),incomes:incomes(),budgets:D.budgets,recurring:Object.values(D.recurring),settings:D.settings};
  download(`carnet-depenses-sauvegarde-${todayISO()}.json`,JSON.stringify(data,null,2),'application/json');
}
function parseBackup(txt){
  const j=JSON.parse(txt);
  if(!j||j.app!=='carnet-depenses')throw new Error('Ce fichier n\'est pas une sauvegarde du Carnet de dépenses.');
  const okDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d), now=nowISO();
  const ex=(j.expenses||[]).filter(e=>e&&e.id&&e.amount>0&&okDate(e.date)).map(e=>({id:String(e.id),amount:Math.round(e.amount),fee:Math.max(0,Math.round(e.fee||0)),category:CAT[e.category]?e.category:'autres',method:MET[e.method]?e.method:'especes',date:e.date,note:String(e.note||'').slice(0,120),recurring_id:e.recurring_id||null,created_at:e.created_at||now,updated_at:now}));
  const inc=(j.incomes||[]).filter(e=>e&&e.id&&e.amount>0&&okDate(e.date)).map(e=>({id:String(e.id),amount:Math.round(e.amount),source:SRC[e.source]?e.source:'autre',date:e.date,note:String(e.note||'').slice(0,120),created_at:e.created_at||now,updated_at:now}));
  const bud={};for(const [c,v] of Object.entries(j.budgets||{}))if(CAT[c]&&v>0)bud[c]=Math.round(v);
  const rec=(j.recurring||[]).filter(r=>r&&r.id&&r.amount>0&&r.day>=1&&r.day<=28&&/^\d{4}-\d{2}$/.test(r.last_month||'')).map(r=>({id:String(r.id),label:String(r.label||'Récurrente').slice(0,60),amount:Math.round(r.amount),fee:Math.round(r.fee||0),category:CAT[r.category]?r.category:'autres',method:MET[r.method]?r.method:'especes',day:r.day,last_month:r.last_month,active:r.active!==false,created_at:r.created_at||now,updated_at:now}));
  return {expenses:ex,incomes:inc,budgets:bud,recurring:rec,settings:j.settings&&j.settings.savings_goal>=0?{savings_goal:Math.round(j.settings.savings_goal)}:null};
}
function doImport(){
  const p=pendingImport;if(!p)return;pendingImport=null;const now=nowISO();
  const ops=[...p.expenses.map(row=>({t:'expenses',op:'upsert',row})),...p.incomes.map(row=>({t:'incomes',op:'upsert',row})),
    ...Object.entries(p.budgets).map(([category,amount])=>({t:'budgets',op:'upsert',row:{category,amount,updated_at:now}})),
    ...p.recurring.map(row=>({t:'recurring',op:'upsert',row}))];
  if(p.settings)ops.push({t:'settings',op:'upsert',row:Object.assign({},p.settings,{updated_at:now})});
  mutate(ops);toast(`${ops.length} élément(s) importé(s)`);
}
async function logout(){
  if(S.armed!=='logout'){S.armed='logout';render();return}
  S.armed=null;
  try{if(sb)await sb.auth.signOut()}catch(e){}
  D=EMPTY();outbox=[];[K.cache,K.outbox,K.uid,K.email].forEach(LS.del);uid=null;email='';
  showLogin();
}

/* ---------- Événements ---------- */
document.addEventListener('click',ev=>{
  const t=ev.target.closest('button,[data-edit],[data-income],[data-act]');if(!t)return;
  const ds=t.dataset;
  if(ds.act!=='applyProp'&&ds.act!=='logout'&&!ds.recDel&&S.armed){S.armed=null}
  if(ds.tab){S.tab=ds.tab;LS.set(K.tab,S.tab);render();window.scrollTo(0,0);return}
  if(ds.kind){setKind(ds.kind);return}
  if(ds.quick){$('f-amount').value=group(ds.quick);return}
  if(ds.filter){S.filter=ds.filter;render();return}
  if(ds.sort){const k=ds.sort;S.sort=S.sort.k===k?{k,d:S.sort.d==='asc'?'desc':'asc'}:{k,d:'desc'};render();return}
  if(ds.export){exportCSV(ds.export);return}
  if(ds.edit){const e=D.expenses[ds.edit];if(e)openSheet(e,'expense');return}
  if(ds.income){const e=D.incomes[ds.income];if(e)openSheet(e,'income');return}
  if(ds.recToggle){toggleRec(ds.recToggle);return}
  if(ds.recDel){delRec(ds.recDel);return}
  const acts={close:closeSheet,new:()=>openSheet(null,'expense'),newIncome:()=>openSheet(null,'income'),saveBud:saveBudgets,applyProp:applyProposal,saveGoal,addRec,
    exportJson,pickImport:()=>$('importFile').click(),doImport,cancelImport:()=>{pendingImport=null;render()},
    hideBilan:()=>{LS.set(K.bilan,shiftM(ymOf(new Date()),-1));render()},
    install:async()=>{if(!installEvt)return;installEvt.prompt();try{await installEvt.userChoice}catch(e){}installEvt=null;render()},
    syncNow:()=>sync(true).then(()=>toast(navigator.onLine?'Synchronisé':'Hors ligne : réessaie plus tard')),logout};
  if(acts[ds.act])acts[ds.act]();
});
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&!$('sheetWrap').hidden)closeSheet();
  if(ev.key==='Enter'&&ev.target.matches('tr[data-edit]')){const e=D.expenses[ev.target.dataset.edit];if(e)openSheet(e,'expense')}
});
document.addEventListener('input',ev=>{
  const i=ev.target;
  if(i.id==='q'){S.q=i.value;const pos=i.selectionStart;render();const n=$('q');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}return}
  if(['f-amount','f-fee','goal','r-amount','r-fee'].includes(i.id)||i.dataset.bud!==undefined){const d=digits(i.value).slice(0,12);i.value=d?group(d.replace(/^0+(?=\d)/,'')):''}
});
document.addEventListener('change',ev=>{if(ev.target.name==='met')updateFee()});
$('importFile').addEventListener('change',async ev=>{
  const f=ev.target.files[0];ev.target.value='';if(!f)return;
  try{pendingImport=parseBackup(await f.text());S.tab='settings';render();window.scrollTo(0,document.body.scrollHeight)}
  catch(e){toast(e.message||'Fichier illisible')}
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
function showSetup(){
  gate(`<h1>carnet de dépenses</h1><p>L'application n'est pas encore reliée à ta base Supabase.</p>
    <p class="hint">Renseigne l'URL du projet et la clé publique dans le fichier <code>config.js</code>, puis republie le site. Le guide complet est dans le README.</p>
    <pre>window.CARNET_CONFIG = {
  SUPABASE_URL: "https://xxxx.supabase.co",
  SUPABASE_ANON_KEY: "clé publique"
};</pre>`);
}
function showLogin(msg){
  gate(`<h1>carnet de dépenses</h1><p class="hint">Connecte-toi pour retrouver tes dépenses sur tous tes appareils.</p>
    <form id="login" novalidate style="display:flex;flex-direction:column;gap:12px">
      <label class="inp">e-mail<input type="email" id="l-email" autocomplete="email" required value="${esc(email)}"></label>
      <label class="inp">mot de passe<input type="password" id="l-pass" autocomplete="current-password" minlength="8" required></label>
      <p class="err" id="l-err" ${msg?'':'hidden'}>${esc(msg||'')}</p>
      <button type="submit" class="btn-primary btn-wide" id="l-in">Se connecter</button>
      <button type="button" class="btn btn-wide" id="l-up">Créer mon compte (première fois)</button>
    </form>`);
  const err=m=>{$('l-err').textContent=m;$('l-err').hidden=false;$('l-err').style.color=''};
  const creds=()=>({email:$('l-email').value.trim(),password:$('l-pass').value});
  $('login').addEventListener('submit',async ev=>{
    ev.preventDefault();const c=creds();if(!c.email||!c.password)return err('Indique ton e-mail et ton mot de passe.');
    $('l-in').disabled=true;
    const {data,error}=await sb.auth.signInWithPassword(c);
    $('l-in').disabled=false;
    if(error)return err(/confirm/i.test(error.message)?'Confirme d\'abord ton adresse avec le lien reçu par e-mail.':'E-mail ou mot de passe incorrect.');
    startApp(data.session);
  });
  $('l-up').addEventListener('click',async()=>{
    const c=creds();if(!c.email||c.password.length<8)return err('Indique ton e-mail et un mot de passe d\'au moins 8 caractères.');
    $('l-up').disabled=true;
    const {data,error}=await sb.auth.signUp(c);
    $('l-up').disabled=false;
    if(error)return err(error.message);
    if(data.session)return startApp(data.session);
    err('Compte créé. Ouvre le lien de confirmation reçu par e-mail, puis connecte-toi.');$('l-err').style.color='var(--good)';
  });
}
function startApp(session){
  if(session){uid=session.user.id;email=session.user.email||'';LS.set(K.uid,uid);LS.set(K.email,email)}
  $('gate').hidden=true;$('app').hidden=false;
  render();
  if(sb){sync(true)}else runRecurring();
}
async function init(){
  buildChips();
  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
  const cfg=window.CARNET_CONFIG||{};
  if(!window.supabase){ // bibliothèque indisponible (premier lancement hors ligne)
    if(uid)return startApp(null);
    return gate(`<h1>carnet de dépenses</h1><p>Connexion impossible pour le moment. Vérifie ta connexion Internet puis recharge la page.</p>`);
  }
  if(!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY)return showSetup();
  sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'cd2-auth'}});
  const {data}=await sb.auth.getSession();
  if(data.session)startApp(data.session);
  else if(uid&&!navigator.onLine)startApp(null);
  else showLogin();
}
init();
