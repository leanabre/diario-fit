import { scoreLabel } from "./config";
import { weekDays, type DateKey } from "./dates";
import type { DayMap } from "./streaks";
import { isLogged } from "./types";

export type WeekSummary = {
  weekStart: DateKey;
  trainings: number;
  loggedDays: number;
  nutritionAverage: number | null;
  score: number;
  label: string;
};

/**
 * Puntaje semanal 0–100:
 *   entrenamiento = min(entrenos / meta, 1) * 50
 *   alimentación  = (promedio de los días cargados / 5) * 40
 *   registro      = (días cargados / 7) * 10
 */
export function weekSummary(days: DayMap, weekStart: DateKey, goal: number): WeekSummary {
  const dates = weekDays(weekStart);

  let trainings = 0;
  let loggedDays = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  for (const date of dates) {
    const day = days.get(date);
    if (!day) continue;
    trainings += day.trainingTypeIds.length;
    if (isLogged(day)) loggedDays += 1;
    if (isLogged(day) && day.nutritionScore != null) {
      scoreSum += day.nutritionScore;
      scoreCount += 1;
    }
  }

  const nutritionAverage = scoreCount > 0 ? scoreSum / scoreCount : null;

  const trainingPart = Math.min(trainings / Math.max(goal, 1), 1) * 50;
  const nutritionPart = ((nutritionAverage ?? 0) / 5) * 40;
  const loggingPart = (loggedDays / 7) * 10;
  const score = Math.round(trainingPart + nutritionPart + loggingPart);

  return { weekStart, trainings, loggedDays, nutritionAverage, score, label: scoreLabel(score) };
}
