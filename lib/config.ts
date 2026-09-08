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
  { value: 1, label: "Lejos de lo que quería", color: "#7A5E3E" },
  { value: 2, label: "Flojo", color: "#A37C39" },
  { value: 3, label: "Ni bien ni mal", color: "#C79A33" },
  { value: 4, label: "Bien", color: "#E6B92E" },
  { value: 5, label: "Muy bien", color: "#FFD75E" },
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

export const REST_COLOR = "#46445A";

/** Semilla de tipos de entrenamiento al crear el perfil (espejo del trigger SQL). */
export const SEED_TRAINING_TYPES = [
  { key: "yoga", label: "Yoga", color: "#4ADE9C", icon: "yoga" },
  { key: "ludus", label: "Ludus", color: "#A78BFA", icon: "ludus" },
  { key: "gym", label: "Gym", color: "#60A5FA", icon: "gym" },
  { key: "running", label: "Running", color: "#22D3EE", icon: "running" },
  { key: "caminata", label: "Caminata", color: "#E879C7", icon: "caminata" },
] as const;

/**
 * Paleta para los tipos de entrenamiento. Familia fría, a luminosidad pareja:
 * así ninguna grita por encima de las otras al lado del ámbar de alimentación.
 * Igual se puede elegir cualquier color con el selector.
 */
export const TRAINING_PALETTE = [
  "#4ADE9C",
  "#34D399",
  "#22D3EE",
  "#38BDF8",
  "#60A5FA",
  "#818CF8",
  "#A78BFA",
  "#C084FC",
  "#E879C7",
  "#F472B6",
  "#2DD4BF",
  "#7DD3FC",
];

/** Colores de persona para las vistas de equipo. */
export const ACCENT_COLORS = [
  "#8B6BFF",
  "#A78BFA",
  "#60A5FA",
  "#22D3EE",
  "#4ADE9C",
  "#34D399",
  "#FFD75E",
  "#FB923C",
  "#F472B6",
  "#E879C7",
  "#F87171",
  "#94A3B8",
];

export const PROFILE_EMOJIS = [
  "🙂", "😎", "🤓", "🥳", "😌", "🤠", "🫶", "💪",
  "🌙", "☀️", "⭐️", "⚡️", "🔥", "❄️", "🌈", "✨",
  "🌿", "🍀", "🌵", "🌻", "🌸", "🍄", "🪴", "🌊",
  "🐦", "🦊", "🐺", "🦁", "🐢", "🦖", "🐙", "🦋",
  "🍋", "🫐", "🍉", "🥑", "🍅", "🥕", "🍒", "🥥",
  "🏔️", "🏃", "🚴", "🧘", "🏊", "⛰️", "🥊", "🏀",
  "🎧", "🎸", "🎨", "📚", "☕️", "🧉", "🎯", "🚀",
];

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
