"use server";

import { revalidatePath } from "next/cache";
import { CHALLENGES } from "@/lib/challenges";
import { todayKey, weekStartKey } from "@/lib/dates";
import { parseKey } from "@/lib/dates";
import { supabaseServer } from "@/lib/supabase/server";

/** El desafío se puede cambiar sólo durante el lunes, antes de que la semana corra. */
export async function changeChallenge(key: string) {
  const def = CHALLENGES.find((c) => c.key === key);
  if (!def) return { error: "Ese desafío no existe" };

  const today = todayKey();
  const weekStart = weekStartKey(today);
  if (parseKey(today).getDay() !== 1) return { error: "El desafío se cambia sólo los lunes" };

  const supabase = await supabaseServer();
  const { data: team } = await supabase.from("teams").select("id").maybeSingle();
  if (!team) return { error: "No tenés equipo" };

  const { error } = await supabase
    .from("team_challenges")
    .update({ key: def.key, target: def.target })
    .eq("team_id", team.id)
    .eq("week_start", weekStart)
    .eq("status", "active");

  if (error) return { error: error.message };
  revalidatePath("/nosotros");
  return {};
}
