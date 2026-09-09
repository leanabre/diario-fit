import { challengeProgress, rotatedChallenge } from "./challenges";
import { shiftKey, todayKey, weekStartKey, type DateKey } from "./dates";
import { supabaseServer } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import type { Day, Profile, Team } from "./types";

export type TeamChallenge = {
  id: string;
  team_id: string;
  week_start: DateKey;
  key: string;
  target: number;
  status: "active" | "won" | "missed";
};

export type TeamContext = {
  team: Team;
  me: Profile;
  partner: Profile | null;
  partnerDays: Day[];
};

/**
 * Los días del otro se leen por la vista `day_entries_shared`, que enmascara la
 * nota salvo que la tenga compartida. Nunca por la tabla.
 */
export async function getSharedDays(userId: string, from: DateKey, to: DateKey): Promise<Day[]> {
  const supabase = await supabaseServer();

  const { data: entries } = await supabase
    .from("day_entries_shared")
    .select("id,date,nutrition_score,nutrition_note,rest_day")
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", to);

  const rows = (entries ?? []) as {
    id: string;
    date: DateKey;
    nutrition_score: number | null;
    nutrition_note: string | null;
    rest_day: boolean;
  }[];
  if (rows.length === 0) return [];

  const { data: trainings } = await supabase
    .from("entry_trainings")
    .select("entry_id,training_type_id,distance_km")
    .in("entry_id", rows.map((r) => r.id));

  const byEntry = new Map<string, { training_type_id: string; distance_km: number | null }[]>();
  for (const t of (trainings ?? []) as { entry_id: string; training_type_id: string; distance_km: number | null }[]) {
    byEntry.set(t.entry_id, [...(byEntry.get(t.entry_id) ?? []), t]);
  }

  return rows.map((row) => ({
    date: row.date,
    entryId: row.id,
    nutritionScore: row.nutrition_score,
    nutritionNote: row.nutrition_note,
    restDay: row.rest_day,
    trainingTypeIds: (byEntry.get(row.id) ?? []).map((t) => t.training_type_id),
    distances: Object.fromEntries((byEntry.get(row.id) ?? []).map((t) => [t.training_type_id, t.distance_km])),
  }));
}

export async function getTeamContext(userId: string, historyDays = 400): Promise<TeamContext | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await supabaseServer();

  const { data: team } = await supabase.from("teams").select("id,name,invite_code").maybeSingle();
  if (!team) return null;

  const { data: memberRows } = await supabase.from("team_members").select("user_id").eq("team_id", team.id);
  const ids = ((memberRows ?? []) as { user_id: string }[]).map((m) => m.user_id);

  const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids.length ? ids : [""]);
  const members = (profiles as Profile[]) ?? [];

  const me = members.find((p) => p.id === userId);
  if (!me) return null;

  const partner = members.find((p) => p.id !== userId) ?? null;
  const today = todayKey();
  const partnerDays = partner ? await getSharedDays(partner.id, shiftKey(today, -historyDays), today) : [];

  return { team: team as Team, me, partner, partnerDays };
}

/**
 * Cada lunes hay un desafío propuesto. Si la semana no tiene uno, se crea con la
 * rotación; las semanas viejas que quedaron abiertas se resuelven acá mismo, que
 * es lo más cerca de "solo" que se puede sin un cron.
 */
export async function ensureChallenges(
  teamId: string,
  mine: Map<DateKey, Day>,
  theirs: Map<DateKey, Day>,
  today: DateKey = todayKey(),
): Promise<TeamChallenge[]> {
  const supabase = await supabaseServer();
  const currentWeek = weekStartKey(today);

  const { data } = await supabase
    .from("team_challenges")
    .select("*")
    .eq("team_id", teamId)
    .order("week_start", { ascending: false })
    .limit(60);

  let rows = (data as TeamChallenge[]) ?? [];

  if (!rows.some((c) => c.week_start === currentWeek)) {
    const def = rotatedChallenge(currentWeek);
    const { data: created } = await supabase
      .from("team_challenges")
      .insert({ team_id: teamId, week_start: currentWeek, key: def.key, target: def.target })
      .select("*")
      .maybeSingle();
    if (created) rows = [created as TeamChallenge, ...rows];
  }

  const pending = rows.filter((c) => c.status === "active" && c.week_start < currentWeek);
  for (const challenge of pending) {
    const sunday = shiftKey(challenge.week_start, 6);
    const result = challengeProgress(challenge.key, mine, theirs, challenge.week_start, sunday);
    const status = result.achieved ? "won" : "missed";
    await supabase.from("team_challenges").update({ status }).eq("id", challenge.id);
    challenge.status = status;
  }

  return rows;
}
