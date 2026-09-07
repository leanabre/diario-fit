import { NextResponse, type NextRequest } from "next/server";
import webpush from "web-push";
import { formatWeekday, todayKey } from "@/lib/dates";
import { TIMEZONE } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Subscription = { id: string; endpoint: string; p256dh: string; auth: string };

/** Hora actual en Buenos Aires, para comparar contra reminder_hour. */
function currentHourInBA(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  return Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
}

/**
 * Corre cada hora (ver vercel.json). Manda el recordatorio a quien lo tenga
 * configurado a esta hora y todavía no cargó el día. Copy plano, sin culpa.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${secret}`) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contact = process.env.VAPID_SUBJECT ?? "mailto:hola@diariofit.app";
  const supabase = supabaseAdmin();

  if (!publicKey || !privateKey || !supabase) {
    return NextResponse.json({ skipped: "faltan las claves VAPID o el service role" });
  }

  webpush.setVapidDetails(contact, publicKey, privateKey);

  const hour = currentHourInBA();
  const today = todayKey();

  const { data: profiles } = await supabase.from("profiles").select("id").eq("reminder_hour", hour);
  const candidates = (profiles ?? []) as { id: string }[];
  if (candidates.length === 0) return NextResponse.json({ hour, sent: 0 });

  const { data: entries } = await supabase
    .from("day_entries")
    .select("user_id,nutrition_score,rest_day,entry_trainings(training_type_id)")
    .eq("date", today)
    .in("user_id", candidates.map((p) => p.id));

  const logged = new Set(
    ((entries ?? []) as {
      user_id: string;
      nutrition_score: number | null;
      rest_day: boolean;
      entry_trainings: { training_type_id: string }[] | null;
    }[])
      .filter((e) => e.nutrition_score != null && (e.rest_day || (e.entry_trainings ?? []).length > 0))
      .map((e) => e.user_id),
  );

  const pending = candidates.filter((p) => !logged.has(p.id)).map((p) => p.id);
  if (pending.length === 0) return NextResponse.json({ hour, sent: 0 });

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth,user_id")
    .in("user_id", pending);

  const payload = JSON.stringify({
    title: "Diario Fit",
    body: `Te falta cargar el ${formatWeekday(today).split(" ")[0]}.`,
  });

  let sent = 0;
  const dead: string[] = [];

  for (const sub of ((subs ?? []) as (Subscription & { user_id: string })[])) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      sent += 1;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) dead.push(sub.id);
    }
  }

  if (dead.length) await supabase.from("push_subscriptions").delete().in("id", dead);

  return NextResponse.json({ hour, sent, removed: dead.length });
}
