// Carnet de dépenses : envoi des rappels (Web Push)
// Appelée toutes les 5 minutes par pg_cron (voir supabase/cron-rappels.sql).
// Variables à définir dans les secrets de la fonction : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET.
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournies automatiquement par Supabase.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const need = (k: string): string => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`Variable manquante : ${k}`);
  return v;
};

// Comparaison à temps constant pour le secret partagé avec pg_cron
const enc = new TextEncoder();
function same(a: string, b: string): boolean {
  const x = enc.encode(a), y = enc.encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return d === 0;
}

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "méthode refusée" }, 405);
    if (!same(req.headers.get("x-cron-secret") ?? "", need("CRON_SECRET"))) return json({ error: "refusé" }, 403);

    webpush.setVapidDetails(need("VAPID_SUBJECT"), need("VAPID_PUBLIC_KEY"), need("VAPID_PRIVATE_KEY"));
    const db = createClient(need("SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
    const now = new Date();

    const { data: due, error } = await db
      .from("reminders")
      .select("id,user_id,title,body,tag,fire_at")
      .is("sent_at", null)
      .lte("fire_at", now.toISOString())
      .order("fire_at")
      .limit(200);
    if (error) throw error;

    const subsByUser = new Map<string, { endpoint: string; p256dh: string; auth: string }[]>();
    let sent = 0, retry = 0, dropped = 0;

    for (const r of due ?? []) {
      if (!subsByUser.has(r.user_id)) {
        const { data } = await db.from("push_subscriptions").select("endpoint,p256dh,auth").eq("user_id", r.user_id);
        subsByUser.set(r.user_id, data ?? []);
      }
      const subs = subsByUser.get(r.user_id)!;
      const tooLate = now.getTime() - Date.parse(r.fire_at) > 24 * 3600 * 1000;
      let ok = 0, lastErr = subs.length ? "" : "aucun appareil enregistré";

      for (const s of [...subs]) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ title: r.title, body: r.body, tag: r.tag || r.id }),
            { TTL: 6 * 3600, urgency: "normal" },
          );
          ok++;
        } catch (e) {
          // deno-lint-ignore no-explicit-any
          const err = e as any;
          lastErr = `${err?.statusCode ?? ""} ${String(err?.body ?? err?.message ?? err)}`.trim().slice(0, 190);
          // Appareil désinstallé ou autorisation retirée : on oublie cet abonnement
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
            subsByUser.set(r.user_id, (subsByUser.get(r.user_id) ?? []).filter((x) => x.endpoint !== s.endpoint));
          }
        }
      }

      if (ok > 0) {
        await db.from("reminders").update({ sent_at: now.toISOString(), note: null }).eq("id", r.id);
        sent++;
      } else if (tooLate || String(r.id).startsWith("test-")) {
        // Trop ancien, ou test : on garde la trace de l'échec pour que l'application puisse l'afficher
        await db.from("reminders").update({ sent_at: now.toISOString(), note: `non envoyé : ${lastErr}`.slice(0, 190) }).eq("id", r.id);
        dropped++;
      } else {
        retry++; // nouvel essai au prochain passage
      }
    }

    // Nettoyage : rappels envoyés depuis plus de 14 jours
    await db.from("reminders").delete().lt("sent_at", new Date(now.getTime() - 14 * 24 * 3600 * 1000).toISOString());

    return json({ ok: true, due: due?.length ?? 0, sent, retry, dropped });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
