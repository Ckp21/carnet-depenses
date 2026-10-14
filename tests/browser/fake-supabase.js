// Faux Supabase pour tests : tables génériques, filtres eq/is/lte/in, insert/upsert/delete, single, limite, panne réseau pilotable
window.supabase={createClient(){
 const TABLES=['expenses','incomes','budgets','recurring','settings','moves','plans','reminders','push_subscriptions','backups','journal'];
 const db=window.__srv=JSON.parse(sessionStorage.getItem('srv')||'null')||{};
 for(const t of TABLES)db[t]=db[t]||[];
 window.addEventListener('pagehide',()=>sessionStorage.setItem('srv',JSON.stringify(window.__srv)));
 window.__fail=window.__fail||{net:false,log:[]};
 const session={user:{id:'u1',email:'prince@test.cg'}};
 const net=()=>(!navigator.onLine||window.__fail.net)?{message:'TypeError: Failed to fetch'}:null;
 const clone=x=>JSON.parse(JSON.stringify(x));
 function from(t){
  const log=(op,extra)=>window.__fail.log.push([t,op,extra]);
  const miss=()=>(window.__fail.missing||[]).includes(t)?{code:'42P01',message:'relation does not exist'}:null;
  const rejectFor=row=>{const r=(window.__fail.reject||[]).find(x=>x.t===t&&(!x.id||(row&&row.id===x.id)));return r?{code:r.code||'23514',message:r.message||'new row violates check constraint'}:null};
  const failOp=(row)=>net()||miss()||rejectFor(row);
  return{
  select(cols){const f=[];let lim=null,rng=null,ord=null,one=false;
   const q={range(a,b){rng=[a,b];return q},order(k,o){ord=[k,o&&o.ascending===false];return q},limit(n){lim=n;return q},
    eq(k,v){f.push(r=>r[k]===v);return q},is(k,v){f.push(r=>(r[k]??null)===v);return q},lte(k,v){f.push(r=>r[k]<=v);return q},in(k,v){f.push(r=>v.includes(r[k]));return q},
    single(){one=true;return q},
    then(res,rej){const e=failOp();if(e)return Promise.resolve({data:null,error:e}).then(res,rej);
     let rows=db[t].filter(r=>f.every(g=>g(r)));if(ord)rows=rows.slice().sort((a,b)=>(a[ord[0]]<b[ord[0]]?-1:a[ord[0]]>b[ord[0]]?1:0)*(ord[1]?-1:1));
     if(rng)rows=rows.slice(rng[0],rng[1]+1);if(lim!=null)rows=rows.slice(0,lim);
     if(cols&&cols!=='*'){const c=cols.split(',').map(x=>x.trim());rows=rows.map(r=>Object.fromEntries(c.map(k=>[k,r[k]])))}
     return Promise.resolve(one?{data:rows[0]?clone(rows[0]):null,error:rows[0]?null:{message:'no rows'}}:{data:clone(rows),error:null}).then(res,rej)}};
   return q},
  insert(row){const e=failOp(Array.isArray(row)?row[0]:row);if(e)return Promise.resolve({error:e});const rows=Array.isArray(row)?row:[row];for(const r of rows){const x=Object.assign({id:'gen-'+Math.random().toString(36).slice(2),created_at:new Date().toISOString(),user_id:'u1'},clone(r));db[t].push(x)}log('insert',rows.length);return Promise.resolve({error:null})},
  upsert(row,opt){const e=failOp(Array.isArray(row)?row[0]:row);if(e)return Promise.resolve({error:e});const keys=((opt&&opt.onConflict)||'id').split(',');
   for(const r of (Array.isArray(row)?row:[row])){const i=db[t].findIndex(x=>keys.every(k=>x[k]===r[k]));if(i>=0)db[t][i]=Object.assign({},db[t][i],clone(r));else db[t].push(clone(r))}log('upsert',Array.isArray(row)?row.length:1);return Promise.resolve({error:null})},
  delete(){const f=[];const q={eq(k,v){f.push(r=>r[k]===v);return q},is(k,v){f.push(r=>(r[k]??null)===v);return q},lt(k,v){f.push(r=>r[k]!=null&&r[k]<v);return q},in(k,v){f.push(r=>v.includes(r[k]));return q},
   then(res,rej){const e=failOp();if(e)return Promise.resolve({error:e}).then(res,rej);db[t]=window.__srv[t]=db[t].filter(r=>!f.every(g=>g(r)));log('delete',f.length);return Promise.resolve({error:null}).then(res,rej)}};return q}
 }}
 const A=window.__auth=Object.assign({calls:[],listeners:[],signInError:null,resetError:null,updateError:null,noSession:false},window.__auth||{});
 return{from,rpc:async()=>({data:null,error:null}),auth:{onAuthStateChange(cb){A.listeners.push(cb);return{data:{subscription:{unsubscribe(){}}}}},resetPasswordForEmail:async(e,o)=>{A.calls.push(['reset',e,o]);return{data:{},error:A.resetError}},updateUser:async(u)=>{A.calls.push(['update',u]);return A.updateError?{data:null,error:A.updateError}:{data:{user:session.user},error:null}},registerPasskey:async()=>({data:{id:'pk1'},error:null}),signInWithPasskey:async()=>({data:{session},error:null}),getSession:async()=>({data:{session:A.noSession?null:session}}),signOut:async()=>({}),signInWithPassword:async(c)=>{A.calls.push(['signin',c.email]);return A.signInError?{data:null,error:A.signInError}:{data:{session},error:null}},signUp:async()=>({data:{session}})}};
}};
