// Test de la fonction d'envoi des rappels (supabase/functions/send-reminders/index.ts).
// La vraie fonction tourne sous Deno ; la base (API REST) et le service Web Push sont simulés en local.
// Prérequis : Deno (variable DENO, ou « deno » dans le PATH, ou tests/edge/node_modules/.bin/deno) et openssl.
// Lancement : node tests/edge/run.mjs
import http from 'node:http'; import https from 'node:https'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import crypto from 'node:crypto'; import { spawn, execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FN = path.join(HERE, '..', '..', 'supabase', 'functions', 'send-reminders', 'index.ts');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'carnet-edge-'));
const b64u = (b) => Buffer.from(b).toString('base64url');

// Clés VAPID jetables (courbe P-256) et certificat local pour le faux service Web Push
const kp = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey.export({ format: 'jwk' });
const VAPID_PRIVATE = kp.d;
const VAPID_PUBLIC = b64u(Buffer.concat([Buffer.from([4]), Buffer.from(kp.x, 'base64url'), Buffer.from(kp.y, 'base64url')]));
const keyPem = path.join(tmp, 'k.pem'), certPem = path.join(tmp, 'c.pem');
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyPem, '-out', certPem, '-days', '2', '-subj', '/CN=localhost',
  '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1'], { stdio: 'ignore' });

const mkSub = () => { const e = crypto.createECDH('prime256v1'); e.generateKeys(); return { p256dh: b64u(e.getPublicKey()), auth: b64u(crypto.randomBytes(16)) }; };
const now = Date.now(), iso = (ms) => new Date(now + ms).toISOString(), H = 3600e3;
const today = iso(0).slice(0, 10);

const db = {
  reminders: [
    { id: 'r1', user_id: 'U1', title: 'Loyer', body: 'À payer demain', tag: 'rec', fire_at: iso(-5 * 60e3), sent_at: null, note: null },
    { id: 'r2', user_id: 'U2', title: 'Sans appareil', body: 'x', tag: '', fire_at: iso(-5 * 60e3), sent_at: null, note: null },
    { id: 'test-abc', user_id: 'U2', title: 'Test', body: 'x', tag: 'test', fire_at: iso(-1000), sent_at: null, note: null },
    { id: 'r4', user_id: 'U2', title: 'Trop ancien', body: 'x', tag: '', fire_at: iso(-30 * H), sent_at: null, note: null },
    { id: 'r5', user_id: 'U1', title: 'Futur', body: 'x', tag: '', fire_at: iso(+5 * H), sent_at: null, note: null },
    { id: 'r6', user_id: 'U1', title: 'Vieux envoyé', body: 'x', tag: '', fire_at: iso(-25 * 24 * H), sent_at: iso(-20 * 24 * H), note: null },
    { id: 'test-u3', user_id: 'U3', title: 'Test', body: 'x', tag: 'test', fire_at: iso(-1000), sent_at: null, note: null },
    { id: 'r7', user_id: 'U1', title: 'Déjà envoyé', body: 'x', tag: '', fire_at: iso(-2 * H), sent_at: iso(-1 * H), note: null },
    // Rappels du soir : l'identifiant se termine par la date du jour concerné
    { id: 'r-soir-' + today, user_id: 'U1', title: 'Soir', body: 'Notes-tu tes dépenses ?', tag: 'soir', fire_at: iso(-10 * 60e3), sent_at: null, note: null },   // dépense déjà notée : ignoré
    { id: 'r-soir-' + today.replace(/\d$/, (d) => String((+d + 1) % 10)), user_id: 'U3', title: 'Soir', body: 'Notes-tu tes dépenses ?', tag: 'soir', fire_at: iso(-10 * 60e3), sent_at: null, note: null }, // rien noté pour U3 : envoyé
    { id: 'r-soir-' + today.replace(/\d$/, (d) => String((+d + 2) % 10)), user_id: 'U2', title: 'Soir', body: 'x', tag: 'soir', fire_at: iso(-4 * H), sent_at: null, note: null },        // arrivé plus de 3 h trop tard : ignoré
  ],
  push_subscriptions: [
    Object.assign({ endpoint: 'https://localhost:9443/ok/3', user_id: 'U3' }, mkSub()),
    Object.assign({ endpoint: 'https://localhost:9443/ok/1', user_id: 'U1' }, mkSub()),
    Object.assign({ endpoint: 'https://localhost:9443/gone/1', user_id: 'U1' }, mkSub()),
  ],
  // U1 a noté une dépense aujourd'hui. Celle de U3 date d'un autre jour : elle ne doit pas empêcher son rappel.
  expenses: [
    { id: 'e1', user_id: 'U1', date: today },
    { id: 'e2', user_id: 'U3', date: '2000-01-01' },
    { id: 'e3', user_id: 'U1', date: today.replace(/\d$/, (d) => String((+d + 1) % 10)) },  // même jour que le rappel de U3, mais autre utilisateur
  ],
};

const pushLog = [];
const push = https.createServer({ key: fs.readFileSync(keyPem), cert: fs.readFileSync(certPem) }, (req, res) => {
  const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => {
    const body = Buffer.concat(chunks);
    pushLog.push({ url: req.url, auth: req.headers.authorization, enc: req.headers['content-encoding'], ttl: req.headers.ttl, len: body.length, urgency: req.headers.urgency });
    if (req.url.startsWith('/ok')) { res.statusCode = 201; res.end(); } else if (req.url.startsWith('/gone')) { res.statusCode = 410; res.end('gone'); } else { res.statusCode = 500; res.end('boom'); }
  });
}).listen(9443);

const parse = (u) => {
  const q = new URL(u, 'http://x'); const f = [];
  for (const [k, v] of q.searchParams) { if (['select', 'order', 'limit', 'offset'].includes(k)) continue; const m = v.match(/^(eq|is|lte|lt|gte|gt)\.(.*)$/); if (m) f.push([k, m[1], m[2]]); }
  return { table: q.pathname.split('/').pop(), f, limit: +q.searchParams.get('limit') || 1e9, order: q.searchParams.get('order') };
};
const match = (r, [k, op, v]) => { const x = r[k]; switch (op) { case 'eq': return String(x) === v; case 'is': return v === 'null' ? x == null : String(x) === v; case 'lte': return x != null && x <= v; case 'lt': return x != null && x < v; case 'gte': return x >= v; case 'gt': return x > v; } };
const rest = http.createServer((req, res) => {
  const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => {
    const p = parse(req.url), rows = db[p.table]; res.setHeader('Content-Type', 'application/json');
    if (!rows) { res.statusCode = 404; return res.end('{"message":"table"}'); }
    const sel = rows.filter((r) => p.f.every((f) => match(r, f)));
    if (req.method === 'HEAD') { res.setHeader('Content-Range', `*/${sel.length}`); res.statusCode = 200; return res.end(); }
    if (req.method === 'GET') { let out = sel; if (p.order) { const c = p.order.split('.')[0]; out = out.slice().sort((a, b) => a[c] < b[c] ? -1 : 1); } res.end(JSON.stringify(out.slice(0, p.limit))); }
    else if (req.method === 'PATCH') { const b = JSON.parse(Buffer.concat(chunks) || '{}'); sel.forEach((r) => Object.assign(r, b)); res.statusCode = 204; res.end(); }
    else if (req.method === 'DELETE') { db[p.table] = rows.filter((r) => !sel.includes(r)); res.statusCode = 204; res.end(); }
    else { res.statusCode = 500; res.end(); }
  });
}).listen(54321);

const local = path.join(HERE, 'node_modules', '.bin', 'deno');
const DENO = process.env.DENO || (fs.existsSync(local) ? local : 'deno');
const deno = spawn(DENO, ['run', '--allow-net', '--allow-env', '--allow-read', '--allow-write', '--allow-sys', FN], {
  env: Object.assign({}, process.env, { SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'srv', CRON_SECRET: 'secret123', VAPID_PUBLIC_KEY: VAPID_PUBLIC,
    VAPID_PRIVATE_KEY: VAPID_PRIVATE, VAPID_SUBJECT: 'mailto:test@example.org', DENO_CERT: certPem, NODE_EXTRA_CA_CERTS: certPem }),
  stdio: ['ignore', 'pipe', 'pipe'],
});
let derr = ''; deno.stderr.on('data', (d) => derr += d); deno.stdout.on('data', (d) => derr += d);
const stop = () => { try { deno.kill(); } catch { /* déjà arrêté */ } push.close(); rest.close(); fs.rmSync(tmp, { recursive: true, force: true }); };

// Attente de démarrage de la fonction (téléchargement des dépendances au premier lancement : jusqu'à 90 s)
let up = false;
for (let i = 0; i < 180 && !up; i++) { try { await fetch('http://127.0.0.1:8000/'); up = true; } catch { await new Promise((r) => setTimeout(r, 500)); } }
if (!up) { console.log('ECHEC : la fonction ne démarre pas\n' + derr.slice(-1500)); stop(); process.exit(1); }

const results = []; const ok = (n, c, x) => results.push([c ? 'OK ' : 'ECHEC', n, c ? '' : JSON.stringify(x)]);
const call = (h, m = 'POST') => fetch('http://127.0.0.1:8000/', { method: m, headers: h }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
const g = (id) => db.reminders.find((x) => x.id === id);
const soirIds = db.reminders.filter((x) => x.tag === 'soir').map((x) => x.id);

let r = await call({}); ok('sans secret : 403', r.status === 403, r);
r = await call({ 'x-cron-secret': 'faux' }); ok('mauvais secret : 403', r.status === 403, r);
r = await call({ 'x-cron-secret': 'secret123' }, 'GET'); ok('GET refusé : 405', r.status === 405, r);
r = await call({ 'x-cron-secret': 'secret123' });
ok('exécution réussie', r.status === 200 && r.body.ok === true, r);
ok('8 rappels dus (5 classiques + 3 du soir)', r.body.due === 8, r.body);
ok('2 rappels du soir ignorés', r.body.skipped === 2, r.body);
ok('r1 envoyé (au moins un appareil)', g('r1').sent_at && !g('r1').note, g('r1'));
ok('appareil 410 supprimé', !db.push_subscriptions.some((s) => s.endpoint.includes('/gone/')), db.push_subscriptions.map((s) => s.endpoint));
ok('appareil valide conservé', db.push_subscriptions.some((s) => s.endpoint.includes('/ok/')));
ok('r2 sans appareil : nouvel essai (non marqué)', g('r2').sent_at == null, g('r2'));
ok('test sans appareil : trace de l\'échec', g('test-abc').sent_at && /aucun appareil/.test(g('test-abc').note), g('test-abc'));
ok('r4 trop ancien : abandonné avec note', g('r4').sent_at && /non envoyé/.test(g('r4').note), g('r4'));
ok('r5 futur intact', g('r5').sent_at == null);
ok('r6 purgé (envoyé depuis 20 jours)', !g('r6'));
ok('r7 déjà envoyé : intact', g('r7') && g('r7').sent_at);
// Rappels du soir
ok('soir : dépense déjà notée, rappel non envoyé', g(soirIds[0]).sent_at && /déjà noté/.test(g(soirIds[0]).note), g(soirIds[0]));
ok('soir : rien noté ce jour-là, rappel envoyé (la dépense d\'un autre utilisateur ne compte pas)', g(soirIds[1]).sent_at && !g(soirIds[1]).note, g(soirIds[1]));
ok('soir : arrivé plus de 3 h trop tard, ignoré', g(soirIds[2]).sent_at && /trop tard/.test(g(soirIds[2]).note), g(soirIds[2]));
const ok1 = pushLog.filter((p) => p.url.startsWith('/ok/1')), ok3 = pushLog.filter((p) => p.url.startsWith('/ok/3'));
ok('aucune notification pour le rappel du soir ignoré', ok1.length === 1, pushLog);              // seulement r1
ok('U3 : test + rappel du soir = 2 notifications', ok3.length === 2, pushLog);
ok('requête Web Push chiffrée (aes128gcm)', ok1.length === 1 && ok1[0].enc === 'aes128gcm' && ok1[0].len > 60, ok1);
ok('en-tête VAPID présent', ok1[0] && /^vapid t=.+, k=.+/.test(ok1[0].auth || ''), ok1[0]);
ok('TTL = 6 h', ok1[0] && ok1[0].ttl === '21600', ok1[0]);
// Deuxième passage : plus rien à envoyer
const before = pushLog.length;
r = await call({ 'x-cron-secret': 'secret123' });
ok('2e passage : aucun renvoi', r.body.sent === 0 && pushLog.length === before, r.body);

stop();
for (const x of results) console.log(...x);
const bad = results.filter((x) => x[0] !== 'OK ');
console.log(`${results.length - bad.length} réussis, ${bad.length} échecs`);
if (bad.length) console.log('Journal Deno :', derr.slice(-1500));
process.exit(bad.length ? 1 : 0);
