/**
 * Constantes de producto. Todo lo editable sin tocar componentes vive acá.
 */

export const APP_NAME = "Diario Fit";

export const TIMEZONE = "America/Argentina/Buenos_Aires";

/** El día cierra a las 04:00, no a medianoche. */
export const DAY_CUTOFF_HOUR = 4;

/** Ventana de edición, contando hoy. Más viejo que esto queda en sólo lectura. */
export const EDIT_WINDOW_DAYS = 7;

export const NOTE_MAX_LENGTH = 280;

export const DEFAULT_WEEKLY_GOAL = 4;

/** Escala de alimentación: anclajes en lenguaje neutro, no moral. */
export const NUTRITION_SCALE = [
  { value: 1, label: "Lejos de lo que quería", color: "#4A3B2A" },
  { value: 2, label: "Flojo", color: "#7A5A2E" },
  { value: 3, label: "Ni bien ni mal", color: "#A8802F" },
  { value: 4, label: "Bien", color: "#D4A62A" },
  { value: 5, label: "Muy bien", color: "#FFD24A" },
] as const;

export type NutritionScore = 1 | 2 | 3 | 4 | 5;

export function nutritionLabel(score: number | null | undefined): string | null {
  if (score == null) return null;
  return NUTRITION_SCALE.find((s) => s.value === score)?.label ?? null;
}

export function nutritionColor(score: number | null | undefined): string | null {
  if (score == null) return null;
  return NUTRITION_SCALE.find((s) => s.value === score)?.color ?? null;
}

/** Un score >= a esto sostiene la racha de alimentación. */
export const NUTRITION_STREAK_THRESHOLD = 4;

export const REST_COLOR = "#3A3660";

/** Semilla de tipos de entrenamiento al crear el perfil (espejo del trigger SQL). */
export const SEED_TRAINING_TYPES = [
  { key: "yoga", label: "Yoga", color: "#3DDC97", icon: "yoga" },
  { key: "ludus", label: "Ludus", color: "#8B6BFF", icon: "ludus" },
  { key: "gym", label: "Gym", color: "#4A9BFF", icon: "gym" },
  { key: "running", label: "Running", color: "#2FD8D2", icon: "running" },
] as const;

/** Paleta ofrecida al crear o recolorear un tipo de entrenamiento. */
export const TRAINING_PALETTE = [
  "#3DDC97",
  "#8B6BFF",
  "#4A9BFF",
  "#2FD8D2",
  "#FF7AB6",
  "#7C5CFF",
  "#5AD1A0",
  "#6E8BFF",
];

/** Colores de persona para las vistas de equipo. */
export const ACCENT_COLORS = ["#7C5CFF", "#3DDC97", "#4A9BFF", "#FF7AB6", "#2FD8D2", "#FFD24A"];

export const PROFILE_EMOJIS = ["🙂", "🌙", "⭐️", "🔥", "🌿", "🐦", "🍋", "🫐", "🏔️", "🎧"];

/** Etiquetas del puntaje semanal. */
export const SCORE_BANDS = [
  { min: 85, label: "Top" },
  { min: 70, label: "Muy buena" },
  { min: 50, label: "Buena" },
  { min: 0, label: "Floja" },
] as const;

export function scoreLabel(score: number): string {
  return SCORE_BANDS.find((b) => score >= b.min)?.label ?? "Floja";
}
