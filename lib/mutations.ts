"use client";

import { supabaseBrowser } from "./supabase/client";
import type { DateKey } from "./dates";
import type { Day } from "./types";

/**
 * El autoguardado no tiene botón: cada toque dispara un guardado. Se serializan
 * para que dos toques seguidos no se pisen.
 */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.catch(() => undefined);
  return next;
}

function isEmpty(day: Day): boolean {
  return (
    day.nutritionScore == null && !day.restDay && day.trainingTypeIds.length === 0 && !day.nutritionNote?.trim()
  );
}

/**
 * Guarda el día completo: es idempotente, así que el llamador manda el estado
 * deseado y no un diff.
 */
export function persistDay(userId: string, day: Day): Promise<{ entryId: string | null }> {
  return enqueue(async () => {
    const supabase = supabaseBrowser();

    if (isEmpty(day)) {
      await supabase.from("day_entries").delete().eq("user_id", userId).eq("date", day.date);
      return { entryId: null };
    }

    const { data: entry, error } = await supabase
      .from("day_entries")
      .upsert(
        {
          user_id: userId,
          date: day.date,
          nutrition_score: day.nutritionScore,
          nutrition_note: day.nutritionNote?.trim() ? day.nutritionNote.trim() : null,
          rest_day: day.restDay,
        },
        { onConflict: "user_id,date" },
      )
      .select("id")
      .single();

    if (error || !entry) throw error ?? new Error("No se pudo guardar el día");

    const desired = new Set(day.restDay ? [] : day.trainingTypeIds);
    const { data: existing } = await supabase
      .from("entry_trainings")
      .select("id,training_type_id")
      .eq("entry_id", entry.id);

    const rows = (existing ?? []) as { id: string; training_type_id: string }[];
    const present = new Set(rows.map((r) => r.training_type_id));

    const stale = rows.filter((r) => !desired.has(r.training_type_id)).map((r) => r.id);
    if (stale.length) await supabase.from("entry_trainings").delete().in("id", stale);

    const missing = [...desired].filter((id) => !present.has(id));
    if (missing.length) {
      await supabase.from("entry_trainings").insert(missing.map((id) => ({ entry_id: entry.id, training_type_id: id })));
    }

    return { entryId: entry.id as string };
  });
}

export async function fetchDay(userId: string, date: DateKey): Promise<Day | null> {
  const supabase = supabaseBrowser();
  const { data } = await supabase
    .from("day_entries")
    .select("id,date,nutrition_score,nutrition_note,rest_day,entry_trainings(training_type_id)")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (!data) return null;
  return {
    date: data.date as DateKey,
    entryId: data.id as string,
    nutritionScore: data.nutrition_score as number | null,
    nutritionNote: data.nutrition_note as string | null,
    restDay: data.rest_day as boolean,
    trainingTypeIds: ((data.entry_trainings ?? []) as { training_type_id: string }[]).map((t) => t.training_type_id),
  };
}
