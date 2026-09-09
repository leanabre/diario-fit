"use client";

import { TIMEZONE } from "./config";
import type { DateKey } from "./dates";
import { supabaseBrowser } from "./supabase/client";

export const MEAL_NOTE_MAX = 280;
const BUCKET = "comidas";

export type MealMoment = "desayuno" | "almuerzo" | "merienda" | "cena" | "otro";

export const MEAL_MOMENTS: { key: MealMoment; label: string }[] = [
  { key: "desayuno", label: "Desayuno" },
  { key: "almuerzo", label: "Almuerzo" },
  { key: "merienda", label: "Merienda" },
  { key: "cena", label: "Cena" },
  { key: "otro", label: "Otro" },
];

export type Meal = {
  id: string;
  date: DateKey;
  moment: MealMoment;
  note: string | null;
  photoPath: string | null;
  /** URL firmada para mostrar la foto. Vence, se pide de nuevo al recargar. */
  photoUrl: string | null;
  createdAt: string;
};

/** El momento se sugiere por la hora en Buenos Aires y después se puede cambiar. */
export function suggestMoment(now: Date = new Date()): MealMoment {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, hour: "numeric", hour12: false }).format(now),
  ) % 24;

  if (hour >= 5 && hour < 11) return "desayuno";
  if (hour >= 11 && hour < 15) return "almuerzo";
  if (hour >= 15 && hour < 19) return "merienda";
  if (hour >= 19) return "cena";
  return "otro";
}

export function momentLabel(moment: string): string {
  return MEAL_MOMENTS.find((m) => m.key === moment)?.label ?? "Otro";
}

/**
 * Achica la foto antes de subirla. Sin esto una comida pesa 3 o 4 MB y el
 * gigabyte gratis de Supabase se llena en un mes y medio; con esto ronda los
 * 200 KB y alcanza para años.
 */
export async function compressImage(file: File, maxSide = 1280, quality = 0.75): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() =>
    createImageBitmap(file),
  );

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("No se pudo procesar la foto");
  return blob;
}

async function withSignedUrls(rows: Meal[]): Promise<Meal[]> {
  const paths = rows.map((m) => m.photoPath).filter((p): p is string => Boolean(p));
  if (paths.length === 0) return rows;

  const { data } = await supabaseBrowser().storage.from(BUCKET).createSignedUrls(paths, 3600);
  const signed = (data ?? []) as { path: string | null; signedUrl: string }[];
  const byPath = new Map(signed.map((d) => [d.path ?? "", d.signedUrl]));
  return rows.map((m) => ({ ...m, photoUrl: m.photoPath ? (byPath.get(m.photoPath) ?? null) : null }));
}

type Row = {
  id: string;
  date: string;
  moment: string;
  note: string | null;
  photo_path: string | null;
  created_at: string;
};

const toMeal = (r: Row): Meal => ({
  id: r.id,
  date: r.date,
  moment: r.moment as MealMoment,
  note: r.note,
  photoPath: r.photo_path,
  photoUrl: null,
  createdAt: r.created_at,
});

export async function listMeals(userId: string, date: DateKey): Promise<Meal[]> {
  const { data } = await supabaseBrowser()
    .from("meals")
    .select("id,date,moment,note,photo_path,created_at")
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: true });

  return withSignedUrls(((data ?? []) as Row[]).map(toMeal));
}

export async function addMeal(
  userId: string,
  date: DateKey,
  input: { moment: MealMoment; note: string | null; file: File | null },
): Promise<Meal> {
  const supabase = supabaseBrowser();

  const { data, error } = await supabase
    .from("meals")
    .insert({ user_id: userId, date, moment: input.moment, note: input.note })
    .select("id,date,moment,note,photo_path,created_at")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo guardar la comida");
  const meal = toMeal(data as Row);
  if (!input.file) return meal;

  // La foto va después de la fila: si la subida falla, queda el comentario y no
  // una comida fantasma.
  const path = `${userId}/${meal.id}.jpg`;
  const blob = await compressImage(input.file);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });

  if (uploadError) throw uploadError;

  await supabase.from("meals").update({ photo_path: path }).eq("id", meal.id);
  const [withUrl] = await withSignedUrls([{ ...meal, photoPath: path }]);
  return withUrl;
}

export async function updateMeal(id: string, patch: { moment?: MealMoment; note?: string | null }) {
  await supabaseBrowser().from("meals").update(patch).eq("id", id);
}

export async function removeMeal(meal: Meal) {
  const supabase = supabaseBrowser();
  if (meal.photoPath) await supabase.storage.from(BUCKET).remove([meal.photoPath]);
  await supabase.from("meals").delete().eq("id", meal.id);
}
