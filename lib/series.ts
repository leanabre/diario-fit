import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseKey, shiftKey, weekStartKey, type DateKey } from "./dates";
import { weekSummary, type WeekSummary } from "./score";
import type { DayMap } from "./streaks";

export type PeriodKey = "semana" | "mes" | "ano";

/** El selector define cuánta historia entra en los gráficos. */
export const PERIODS: { key: PeriodKey; label: string; weeks: number; caption: string }[] = [
  { key: "semana", label: "Semana", weeks: 6, caption: "últimas 6 semanas" },
  { key: "mes", label: "Mes", weeks: 13, caption: "últimos 3 meses" },
  { key: "ano", label: "Año", weeks: 52, caption: "último año" },
];

export type WeekPoint = WeekSummary & { label: string };

export function weeklySeries(days: DayMap, goal: number, weeks: number, today: DateKey): WeekPoint[] {
  const points: WeekPoint[] = [];
  let cursor = weekStartKey(today);

  for (let i = 0; i < weeks; i++) {
    points.unshift({
      ...weekSummary(days, cursor, goal),
      label: format(parseKey(cursor), "d/M", { locale: es }),
    });
    cursor = shiftKey(cursor, -7);
  }
  return points;
}

/** Todas las semanas con algún dato, de la más vieja a la más nueva. */
export function allWeeks(days: DayMap, goal: number): WeekSummary[] {
  const starts = new Set<DateKey>();
  for (const date of days.keys()) starts.add(weekStartKey(date));
  return [...starts].sort().map((start) => weekSummary(days, start, goal));
}

export function bestWeek(days: DayMap, goal: number): WeekSummary | null {
  const weeks = allWeeks(days, goal).filter((w) => w.loggedDays > 0);
  if (weeks.length === 0) return null;
  return weeks.reduce((best, week) => (week.score > best.score ? week : best));
}

export type Distribution = { id: string; label: string; color: string; count: number; share: number };

export function trainingDistribution(
  days: DayMap,
  types: { id: string; label: string; color: string }[],
  weeks: number,
  today: DateKey,
): Distribution[] {
  const from = shiftKey(weekStartKey(today), -7 * (weeks - 1));
  const counts = new Map<string, number>();

  for (const [date, day] of days) {
    if (date < from) continue;
    for (const id of day.trainingTypeIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return types
    .map((type) => ({
      id: type.id,
      label: type.label,
      color: type.color,
      count: counts.get(type.id) ?? 0,
      share: total ? (counts.get(type.id) ?? 0) / total : 0,
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
}

export type Insight = { withGoal: number; without: number; difference: number } | null;

/**
 * El cruce sólo aparece con al menos 8 semanas de datos y una diferencia que
 * valga la pena nombrar. Si no, no se muestra nada.
 */
export function crossedInsight(days: DayMap, goal: number, minWeeks = 8, minDifference = 0.3): Insight {
  const weeks = allWeeks(days, goal).filter((w) => w.nutritionAverage != null);
  if (weeks.length < minWeeks) return null;

  const hit = weeks.filter((w) => w.trainings >= goal);
  const miss = weeks.filter((w) => w.trainings < goal);
  if (hit.length === 0 || miss.length === 0) return null;

  const average = (list: WeekSummary[]) =>
    list.reduce((sum, w) => sum + (w.nutritionAverage ?? 0), 0) / list.length;

  const withGoal = average(hit);
  const without = average(miss);
  const difference = withGoal - without;

  if (Math.abs(difference) < minDifference) return null;
  return { withGoal, without, difference };
}

/** Kilómetros sumados en el período, para los tipos que miden distancia. */
export function totalDistance(days: DayMap, weeks: number, today: DateKey): number {
  const from = shiftKey(weekStartKey(today), -7 * (weeks - 1));
  let total = 0;

  for (const [date, day] of days) {
    if (date < from) continue;
    for (const km of Object.values(day.distances)) total += km ?? 0;
  }
  return Math.round(total * 10) / 10;
}
