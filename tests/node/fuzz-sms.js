// Protection contre les SMS piégés : l'analyse ne doit jamais ralentir l'application (ReDoS)
const path=require('path');
const src=require('fs').readFileSync(path.join(__dirname,'..','..','app.js'),'utf8');
const grab=n=>{const i=src.indexOf(n);let d=0,j=src.indexOf('{',i);for(let k=j;k<src.length;k++){if(src[k]=='{')d++;if(src[k]=='}'){d--;if(!d)return src.slice(i,k+1)}}};
var pad=n=>String(n).padStart(2,'0'),isoOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()),parseISO=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
var norm=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
eval(grab('function parseSMS'));
const T={'chiffres':'1 '.repeat(20000),'séparateurs':'1,234.'.repeat(8000),'majuscules':('Abc '.repeat(40)+'a ').repeat(300),'a repete':'de A '.repeat(15000),'pour':'pour '+'x'.repeat(50000),'frais':'frais '.repeat(20000)+'1','points':'.'.repeat(60000),'espaces':' '.repeat(60000)+'1 FCFA','cfa':'FCFA '.repeat(15000),'mixte':'CFA 1 500.00 a '.repeat(5000)};
let bad=0;
for(const [k,v] of Object.entries(T)){const t=Date.now();let r;try{r=parseSMS(v)}catch(e){r='ERR '+e.message}const ms=Date.now()-t;const fail=ms>300;if(fail)bad++;console.log(fail?'ECHEC':'ok   ',k.padEnd(12),String(ms).padStart(6),'ms',v.length,'car.')}
console.log(bad?bad+' analyse(s) trop lente(s)':'toutes les analyses sous 300 ms');process.exit(bad?1:0);
