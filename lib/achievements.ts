import { NUTRITION_STREAK_THRESHOLD } from "./config";
import { isoWeekKey, monthDates, shiftKey, toKey, weekDays, weekStartKey, type DateKey } from "./dates";
import type { DayMap } from "./streaks";
import { weekTrainingCount } from "./streaks";
import { isLogged } from "./types";

export type AchievementGroup = "registro" | "alimentacion" | "entrenamiento" | "equipo";

export type AchievementUnit = "dias" | "entrenos" | "semanas" | "veces" | "desafios" | "promedio";

export type AchievementDef = {
  key: string;
  group: AchievementGroup;
  label: string;
  /** Criterio visible: un logro oculto no motiva a nadie. */
  criterion: string;
  /** Unidad para el "te faltan N". Es un dato, no una función: cruza al cliente. */
  unit: AchievementUnit;
};

export function formatMissing(unit: AchievementUnit, missing: number): string {
  const n = Math.round(missing * 10) / 10;
  const texto = String(n).replace(".", ",");
  switch (unit) {
    case "dias":
      return n === 1 ? "1 día" : `${texto} días`;
    case "entrenos":
      return n === 1 ? "1 entreno" : `${texto} entrenos`;
    case "semanas":
      return n === 1 ? "1 semana" : `${texto} semanas`;
    case "veces":
      return n === 1 ? "1 vez" : `${texto} veces`;
    case "desafios":
      return n === 1 ? "1 desafío" : `${texto} desafíos`;
    case "promedio":
      return `${texto} de promedio`;
  }
}

export type AchievementContext = {
  days: DayMap;
  goal: number;
  today: DateKey;
  /** Días del otro, si hay equipo. */
  partnerDays?: DayMap;
  partnerGoal?: number;
  challengesWon?: number;
};

export type AchievementState = {
  def: AchievementDef;
  current: number;
  target: number;
  unlocked: boolean;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "primer_dia", group: "registro", label: "Primer día", criterion: "Cargar un día", unit: "dias" },
  { key: "semana_completa", group: "registro", label: "Semana completa", criterion: "7 días seguidos cargados", unit: "dias" },
  { key: "un_mes", group: "registro", label: "Un mes", criterion: "30 días seguidos cargados", unit: "dias" },
  { key: "cien_dias", group: "registro", label: "Cien días", criterion: "100 días seguidos cargados", unit: "dias" },
  { key: "un_ano", group: "registro", label: "Un año", criterion: "365 días seguidos cargados", unit: "dias" },

  { key: "dia_redondo", group: "alimentacion", label: "Día redondo", criterion: "Un día con 5", unit: "dias" },
  { key: "semana_verde", group: "alimentacion", label: "Semana verde", criterion: "7 días seguidos con 4 o más", unit: "dias" },
  { key: "mes_parejo", group: "alimentacion", label: "Mes parejo", criterion: "Un mes con promedio 4 o más, sobre al menos 20 días cargados", unit: "promedio" },
  { key: "finde_firme", group: "alimentacion", label: "Finde firme", criterion: "Sábado y domingo con 4 o más, 4 semanas seguidas", unit: "semanas" },

  { key: "arranque", group: "entrenamiento", label: "Arranque", criterion: "10 entrenamientos", unit: "entrenos" },
  { key: "cincuenta", group: "entrenamiento", label: "Cincuenta", criterion: "50 entrenamientos", unit: "entrenos" },
  { key: "cien_entrenos", group: "entrenamiento", label: "Cien", criterion: "100 entrenamientos", unit: "entrenos" },
  { key: "doble_jornada", group: "entrenamiento", label: "Doble jornada", criterion: "Dos entrenamientos en un mismo día", unit: "veces" },
  { key: "nunca_dos_seguidos", group: "entrenamiento", label: "Nunca dos seguidos", criterion: "30 días sin pasar 2 días seguidos sin moverte", unit: "dias" },
  { key: "mes_completo", group: "entrenamiento", label: "Mes completo", criterion: "4 semanas seguidas alcanzando la meta", unit: "semanas" },

  { key: "los_dos_en_linea", group: "equipo", label: "Los dos en línea", criterion: "Una semana con los dos cumpliendo su meta", unit: "semanas" },
  { key: "treinta_juntos", group: "equipo", label: "Treinta juntos", criterion: "30 días seguidos cargando los dos", unit: "dias" },
  { key: "primer_desafio", group: "equipo", label: "Primer desafío", criterion: "Ganar un desafío semanal", unit: "desafios" },
  { key: "diez_desafios", group: "equipo", label: "Diez desafíos", criterion: "Ganar 10 desafíos semanales", unit: "desafios" },
];

export const GROUP_LABELS: Record<AchievementGroup, string> = {
  registro: "Registro",
  alimentacion: "Alimentación",
  entrenamiento: "Entrenamiento",
  equipo: "Equipo",
};

// ── Cálculos sobre el histórico ─────────────────────────────────

function sortedDates(days: DayMap): DateKey[] {
  return [...days.keys()].sort();
}

/** La racha más larga del histórico, no la actual. */
function longestRun(dates: DateKey[], matches: (date: DateKey) => boolean): number {
  let best = 0;
  let run = 0;
  let previous: DateKey | null = null;

  for (const date of dates) {
    if (!matches(date)) {
      run = 0;
      previous = date;
      continue;
    }
    run = previous && shiftKey(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}

function totalTrainings(days: DayMap): number {
  let total = 0;
  for (const day of days.values()) total += day.trainingTypeIds.length;
  return total;
}

function maxTrainingsInADay(days: DayMap): number {
  let max = 0;
  for (const day of days.values()) max = Math.max(max, day.trainingTypeIds.length);
  return max;
}

function bestNutritionScore(days: DayMap): number {
  let max = 0;
  for (const day of days.values()) max = Math.max(max, day.nutritionScore ?? 0);
  return max;
}

/** El mejor mes: promedio sobre al menos 20 días cargados, para que un mes de un día no cuente. */
function bestMonthAverage(days: DayMap): number {
  const byMonth = new Map<string, { sum: number; count: number }>();
  for (const [date, day] of days) {
    if (day.nutritionScore == null) continue;
    const month = date.slice(0, 7);
    const bucket = byMonth.get(month) ?? { sum: 0, count: 0 };
    bucket.sum += day.nutritionScore;
    bucket.count += 1;
    byMonth.set(month, bucket);
  }

  let best = 0;
  for (const { sum, count } of byMonth.values()) {
    if (count >= 20) best = Math.max(best, sum / count);
  }
  return best;
}

/** Semanas seguidas en que sábado y domingo cerraron con 4 o más. */
function bestWeekendRun(days: DayMap, today: DateKey): number {
  let cursor = weekStartKey(today);
  let best = 0;
  let run = 0;

  for (let i = 0; i < 260; i++) {
    const saturday = days.get(shiftKey(cursor, 5))?.nutritionScore ?? null;
    const sunday = days.get(shiftKey(cursor, 6))?.nutritionScore ?? null;
    const firm =
      saturday != null && sunday != null &&
      saturday >= NUTRITION_STREAK_THRESHOLD && sunday >= NUTRITION_STREAK_THRESHOLD;

    run = firm ? run + 1 : 0;
    best = Math.max(best, run);
    cursor = shiftKey(cursor, -7);
  }
  return best;
}

/** Semanas ISO seguidas alcanzando la meta, mirando todo el histórico. */
function bestGoalWeekRun(days: DayMap, goal: number, today: DateKey): number {
  let cursor = weekStartKey(today);
  let best = 0;
  let run = 0;

  for (let i = 0; i < 260; i++) {
    run = weekTrainingCount(days, cursor) >= goal ? run + 1 : 0;
    best = Math.max(best, run);
    cursor = shiftKey(cursor, -7);
  }
  return best;
}

/**
 * La ventana más larga sin pasar dos días seguidos sin entrenar. Se mide en días
 * corridos desde el primer registro hasta hoy.
 */
function bestNoGapWindow(days: DayMap, today: DateKey): number {
  const dates = sortedDates(days);
  if (dates.length === 0) return 0;

  let best = 0;
  let windowStart = dates[0];
  let idleRun = 0;
  let cursor = dates[0];

  while (cursor <= today) {
    const trained = (days.get(cursor)?.trainingTypeIds.length ?? 0) > 0;
    idleRun = trained ? 0 : idleRun + 1;

    if (idleRun >= 2) {
      windowStart = shiftKey(cursor, 1);
      idleRun = 0;
    } else {
      const length = daysInclusive(windowStart, cursor);
      best = Math.max(best, length);
    }
    cursor = shiftKey(cursor, 1);
  }
  return best;
}

function daysInclusive(from: DateKey, to: DateKey): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
}

/** Días seguidos en que cargaron los dos. */
export function jointStreak(mine: DayMap, theirs: DayMap, today: DateKey): number {
  const both = (date: DateKey) => {
    const a = mine.get(date);
    const b = theirs.get(date);
    return Boolean(a && isLogged(a) && b && isLogged(b));
  };

  let cursor = both(today) ? today : shiftKey(today, -1);
  let count = 0;
  while (count < 3650 && both(cursor)) {
    count += 1;
    cursor = shiftKey(cursor, -1);
  }
  return count;
}

function bestJointRun(mine: DayMap, theirs: DayMap): number {
  const dates = [...new Set([...mine.keys(), ...theirs.keys()])].sort();
  return longestRun(dates, (date) => {
    const a = mine.get(date);
    const b = theirs.get(date);
    return Boolean(a && isLogged(a) && b && isLogged(b));
  });
}

/** Semanas en que los dos alcanzaron su propia meta. */
function weeksBothOnGoal(mine: DayMap, theirs: DayMap, myGoal: number, theirGoal: number, today: DateKey): number {
  let cursor = weekStartKey(today);
  let count = 0;

  for (let i = 0; i < 260; i++) {
    if (weekTrainingCount(mine, cursor) >= myGoal && weekTrainingCount(theirs, cursor) >= theirGoal) count += 1;
    cursor = shiftKey(cursor, -7);
  }
  return count;
}

// ── Evaluación ──────────────────────────────────────────────────

export function evaluateAchievements(ctx: AchievementContext): AchievementState[] {
  const { days, goal, today, partnerDays, partnerGoal, challengesWon = 0 } = ctx;
  const dates = sortedDates(days);

  const loggedRun = longestRun(dates, (date) => {
    const day = days.get(date);
    return Boolean(day && isLogged(day));
  });
  const greenRun = longestRun(dates, (date) => (days.get(date)?.nutritionScore ?? 0) >= NUTRITION_STREAK_THRESHOLD);

  const loggedDays = dates.filter((date) => isLogged(days.get(date)!)).length;
  const trainings = totalTrainings(days);

  const joint = partnerDays ? bestJointRun(days, partnerDays) : 0;
  const bothOnGoal = partnerDays ? weeksBothOnGoal(days, partnerDays, goal, partnerGoal ?? goal, today) : 0;

  const values: Record<string, { current: number; target: number }> = {
    primer_dia: { current: Math.min(loggedDays, 1), target: 1 },
    semana_completa: { current: loggedRun, target: 7 },
    un_mes: { current: loggedRun, target: 30 },
    cien_dias: { current: loggedRun, target: 100 },
    un_ano: { current: loggedRun, target: 365 },

    dia_redondo: { current: bestNutritionScore(days) >= 5 ? 1 : 0, target: 1 },
    semana_verde: { current: greenRun, target: 7 },
    mes_parejo: { current: Math.round(bestMonthAverage(days) * 10) / 10, target: 4 },
    finde_firme: { current: bestWeekendRun(days, today), target: 4 },

    arranque: { current: trainings, target: 10 },
    cincuenta: { current: trainings, target: 50 },
    cien_entrenos: { current: trainings, target: 100 },
    doble_jornada: { current: maxTrainingsInADay(days) >= 2 ? 1 : 0, target: 1 },
    nunca_dos_seguidos: { current: bestNoGapWindow(days, today), target: 30 },
    mes_completo: { current: bestGoalWeekRun(days, goal, today), target: 4 },

    los_dos_en_linea: { current: bothOnGoal, target: 1 },
    treinta_juntos: { current: joint, target: 30 },
    primer_desafio: { current: challengesWon, target: 1 },
    diez_desafios: { current: challengesWon, target: 10 },
  };

  return ACHIEVEMENTS.map((def) => {
    const { current, target } = values[def.key];
    return { def, current, target, unlocked: current >= target };
  });
}

/** Días con score y mes con datos: sirve para el resumen del calendario y de Datos. */
export { monthDates, toKey, weekDays, isoWeekKey };
