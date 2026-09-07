"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export async function createTeam(name: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("create_team", { team_name: name });
  if (error) return { error: error.message };

  revalidatePath("/ajustes");
  revalidatePath("/nosotros");
  return {};
}

export async function joinTeam(code: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("join_team_by_code", { code });
  if (error) return { error: error.message };

  revalidatePath("/ajustes");
  revalidatePath("/nosotros");
  return {};
}

export async function leaveTeam() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { error } = await supabase.from("team_members").delete().eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/ajustes");
  revalidatePath("/nosotros");
  return {};
}

export async function renameTeam(name: string) {
  const supabase = await supabaseServer();
  const { data: team } = await supabase.from("teams").select("id").maybeSingle();
  if (!team) return { error: "No tenés equipo" };

  const { error } = await supabase.from("teams").update({ name: name.trim() || "Nosotros" }).eq("id", team.id);
  if (error) return { error: error.message };

  revalidatePath("/ajustes");
  revalidatePath("/nosotros");
  return {};
}
