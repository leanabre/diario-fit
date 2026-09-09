import { NUTRITION_STREAK_THRESHOLD } from "./config";
import { isoWeekKey, shiftKey, todayKey, weekDays, weekStartKey, type DateKey } from "./dates";
import { isLogged, type Day } from "./types";

export type DayMap = Map<DateKey, Day>;

export function buildDayMap(days: Day[]): DayMap {
  return new Map(days.map((d) => [d.date, d]));
}

/**
 * Todas las rachas se recalculan del histórico en cada render: nunca se guardan
 * incrementalmente. Así una edición retroactiva las corrige sola.
 */

/** Hasta dónde vale la pena caminar hacia atrás si no hay datos. */
const MAX_LOOKBACK_DAYS = 3650;
const MAX_LOOKBACK_WEEKS = 520;

/**
 * Días consecutivos con el día cargado. Sin comodín.
 * El día en curso todavía sin cargar no rompe nada: se ancla en ayer.
 */
export function registrationStreak(days: DayMap, today: DateKey = todayKey()): number {
  const anchor = isLogged(days.get(today) ?? blank()) ? today : shiftKey(today, -1);
  let count = 0;
  let cursor = anchor;
  while (count < MAX_LOOKBACK_DAYS) {
    const day = days.get(cursor);
    if (!day || !isLogged(day)) break;
    count += 1;
    cursor = shiftKey(cursor, -1);
  }
  return count;
}

export type NutritionStreak = {
  /** Días que efectivamente cumplieron el umbral. El comodín puentea, no suma. */
  days: number;
  /** Queda comodín en la semana ISO en curso. */
  wildcardAvailable: boolean;
};

/**
 * Días consecutivos con score >= 4, con un comodín por semana ISO: el primer día
 * flojo de la semana no corta la racha, el segundo sí.
 */
export function nutritionStreak(days: DayMap, today: DateKey = todayKey()): NutritionStreak {
  const scoredToday = days.get(today)?.nutritionScore != null;
  const anchor = scoredToday ? today : shiftKey(today, -1);

  const wildcardUsed = new Set<string>();
  let count = 0;
  let cursor = anchor;

  for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
    const score = days.get(cursor)?.nutritionScore ?? null;
    if (score != null && score >= NUTRITION_STREAK_THRESHOLD) {
      count += 1;
    } else {
      const week = isoWeekKey(cursor);
      if (wildcardUsed.has(week)) break;
      wildcardUsed.add(week);
    }
    cursor = shiftKey(cursor, -1);
  }

  return { days: count, wildcardAvailable: currentWeekWildcardAvailable(days, today) };
}

/**
 * El comodín de la semana en curso se gasta con el primer día flojo (o sin cargar)
 * ya transcurrido. Los días que todavía no llegaron no cuentan.
 */
function currentWeekWildcardAvailable(days: DayMap, today: DateKey): boolean {
  const scoredToday = days.get(today)?.nutritionScore != null;
  const lastRelevant = scoredToday ? today : shiftKey(today, -1);

  for (const date of weekDays(weekStartKey(today))) {
    if (date > lastRelevant) break;
    const score = days.get(date)?.nutritionScore ?? null;
    if (score == null || score < NUTRITION_STREAK_THRESHOLD) return false;
  }
  return true;
}

export function weekTrainingCount(days: DayMap, weekStart: DateKey): number {
  return weekDays(weekStart).reduce((total, date) => total + (days.get(date)?.trainingTypeIds.length ?? 0), 0);
}

/**
 * Semanas ISO consecutivas alcanzando la meta. La semana en curso, mientras no
 * llegue a la meta, no rompe la racha: todavía está jugándose.
 */
export function weeklyGoalStreak(days: DayMap, goal: number, today: DateKey = todayKey()): number {
  const thisWeek = weekStartKey(today);
  let cursor = weekTrainingCount(days, thisWeek) >= goal ? thisWeek : shiftKey(thisWeek, -7);
  let count = 0;

  while (count < MAX_LOOKBACK_WEEKS) {
    if (weekTrainingCount(days, cursor) < goal) break;
    count += 1;
    cursor = shiftKey(cursor, -7);
  }
  return count;
}

export type Streaks = {
  registration: number;
  nutrition: NutritionStreak;
  weeks: number;
};

export function allStreaks(days: DayMap, goal: number, today: DateKey = todayKey()): Streaks {
  return {
    registration: registrationStreak(days, today),
    nutrition: nutritionStreak(days, today),
    weeks: weeklyGoalStreak(days, goal, today),
  };
}

function blank(): Day {
  return {
    date: "",
    entryId: null,
    nutritionScore: null,
    nutritionNote: null,
    restDay: false,
    trainingTypeIds: [],
    distances: {},
  };
}
