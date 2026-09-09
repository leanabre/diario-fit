import { isSupabaseConfigured } from "./supabase/env";
import { supabaseServer } from "./supabase/server";
import { shiftKey, todayKey, type DateKey } from "./dates";
import type { Day, Profile, Team, TrainingType } from "./types";

type EntryRow = {
  id: string;
  date: DateKey;
  nutrition_score: number | null;
  nutrition_note: string | null;
  rest_day: boolean;
  entry_trainings: { training_type_id: string; distance_km: number | null }[] | null;
};

const ENTRY_SELECT =
  "id,date,nutrition_score,nutrition_note,rest_day,entry_trainings(training_type_id,distance_km)";

function toDay(row: EntryRow): Day {
  return {
    date: row.date,
    entryId: row.id,
    nutritionScore: row.nutrition_score,
    nutritionNote: row.nutrition_note,
    restDay: row.rest_day,
    trainingTypeIds: (row.entry_trainings ?? []).map((t) => t.training_type_id),
    distances: Object.fromEntries((row.entry_trainings ?? []).map((t) => [t.training_type_id, t.distance_km])),
  };
}

export async function getCurrentUser() {
  // Sin credenciales no hay cliente posible: las pantallas mandan a /login,
  // que muestra qué falta configurar en lugar de reventar.
  if (!isSupabaseConfigured) return null;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as Profile) ?? null;
}

export async function getTrainingTypes(userId: string): Promise<TrainingType[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("training_types")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });
  return (data as TrainingType[]) ?? [];
}

export async function getDays(userId: string, from: DateKey, to: DateKey): Promise<Day[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("day_entries")
    .select(ENTRY_SELECT)
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true });
  return ((data as EntryRow[]) ?? []).map(toDay);
}

/**
 * Ventana de histórico que alcanza para las tres rachas y para los gráficos por semana.
 * Son pocos cientos de filas: se traen enteras y se calcula en memoria.
 */
export async function getHistory(userId: string, days = 400): Promise<Day[]> {
  const today = todayKey();
  return getDays(userId, shiftKey(today, -days), today);
}

export async function getTeam(): Promise<{ team: Team; members: Profile[] } | null> {
  const supabase = await supabaseServer();
  const { data: team } = await supabase.from("teams").select("id,name,invite_code").maybeSingle();
  if (!team) return null;

  const { data: memberRows } = await supabase.from("team_members").select("user_id").eq("team_id", team.id);
  const ids = (memberRows ?? []).map((m) => m.user_id as string);
  const { data: members } = await supabase.from("profiles").select("*").in("id", ids.length ? ids : [""]);

  return { team: team as Team, members: (members as Profile[]) ?? [] };
}
