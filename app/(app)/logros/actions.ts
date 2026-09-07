"use server";

import { ACHIEVEMENTS } from "@/lib/achievements";
import { supabaseServer } from "@/lib/supabase/server";

/** Persiste los logros recién alcanzados. Idempotente: la tabla tiene unique (user_id, key). */
export async function unlockAchievements(keys: string[]) {
  if (keys.length === 0) return;

  const valid = keys.filter((key) => ACHIEVEMENTS.some((a) => a.key === key));
  if (valid.length === 0) return;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("achievements")
    .upsert(
      valid.map((key) => ({ user_id: user.id, key })),
      { onConflict: "user_id,key", ignoreDuplicates: true },
    );
}
