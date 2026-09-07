import { NUTRITION_STREAK_THRESHOLD } from "./config";
import { weekDays, type DateKey } from "./dates";
import type { DayMap } from "./streaks";
import { isLogged } from "./types";

export type ChallengeKey = "suma_8" | "promedio_4" | "semana_completa" | "sin_baches" | "en_sintonia";

export type ChallengeDef = {
  key: ChallengeKey;
  label: string;
  description: string;
  target: number;
};

/** Se gana o se pierde de a dos: ninguno mide a uno contra el otro. */
export const CHALLENGES: ChallengeDef[] = [
  { key: "suma_8", label: "Suma 8", description: "8 entrenamientos entre los dos", target: 8 },
  { key: "promedio_4", label: "Promedio 4", description: "Promedio de alimentación conjunto de 4 o más", target: 4 },
  { key: "semana_completa", label: "Semana completa", description: "Los dos cargan los 7 días", target: 14 },
  { key: "sin_baches", label: "Sin baches", description: "Ninguno pasa 2 días seguidos sin entrenar", target: 7 },
  { key: "en_sintonia", label: "En sintonía", description: "3 días en que entrenaron los dos", target: 3 },
];

export function challengeDef(key: string): ChallengeDef {
  return CHALLENGES.find((c) => c.key === key) ?? CHALLENGES[0];
}

/** El lunes 5 de enero de 1970, para numerar semanas de forma estable. */
const WEEK_EPOCH = Date.parse("1970-01-05T00:00:00Z");

/** Rotación automática: cada lunes toca el siguiente de la lista. */
export function rotatedChallenge(weekStart: DateKey): ChallengeDef {
  const weeks = Math.floor((Date.parse(`${weekStart}T00:00:00Z`) - WEEK_EPOCH) / (7 * 86_400_000));
  const index = ((weeks % CHALLENGES.length) + CHALLENGES.length) % CHALLENGES.length;
  return CHALLENGES[index];
}

export type ChallengeProgress = {
  def: ChallengeDef;
  current: number;
  target: number;
  achieved: boolean;
  detail: string;
};

/**
 * Progreso del desafío hasta hoy. Al cerrar la semana se llama con el domingo
 * como `until` y el resultado es el definitivo.
 */
export function challengeProgress(
  key: string,
  mine: DayMap,
  theirs: DayMap,
  weekStart: DateKey,
  until: DateKey,
): ChallengeProgress {
  const def = challengeDef(key);
  const dates = weekDays(weekStart).filter((d) => d <= until);

  switch (def.key) {
    case "suma_8": {
      const current = dates.reduce(
        (total, date) =>
          total + (mine.get(date)?.trainingTypeIds.length ?? 0) + (theirs.get(date)?.trainingTypeIds.length ?? 0),
        0,
      );
      return { def, current, target: def.target, achieved: current >= def.target, detail: `${current} de 8` };
    }

    case "promedio_4": {
      let sum = 0;
      let count = 0;
      for (const date of dates) {
        for (const map of [mine, theirs]) {
          const score = map.get(date)?.nutritionScore;
          if (score != null) {
            sum += score;
            count += 1;
          }
        }
      }
      const average = count ? sum / count : 0;
      return {
        def,
        current: Math.round(average * 10) / 10,
        target: def.target,
        achieved: count > 0 && average >= def.target,
        detail: count ? `${average.toFixed(1).replace(".", ",")} de promedio` : "sin datos todavía",
      };
    }

    case "semana_completa": {
      const current = dates.reduce((total, date) => {
        const a = mine.get(date);
        const b = theirs.get(date);
        return total + (a && isLogged(a) ? 1 : 0) + (b && isLogged(b) ? 1 : 0);
      }, 0);
      return { def, current, target: def.target, achieved: current >= def.target, detail: `${current} de 14 días` };
    }

    case "sin_baches": {
      let broken = false;
      for (const map of [mine, theirs]) {
        let idle = 0;
        for (const date of dates) {
          idle = (map.get(date)?.trainingTypeIds.length ?? 0) > 0 ? 0 : idle + 1;
          if (idle >= 2) broken = true;
        }
      }
      const current = broken ? 0 : dates.length;
      return {
        def,
        current,
        target: def.target,
        achieved: !broken && dates.length === 7,
        detail: broken ? "hubo un bache" : `${dates.length} de 7 días sin baches`,
      };
    }

    case "en_sintonia": {
      const current = dates.filter(
        (date) =>
          (mine.get(date)?.trainingTypeIds.length ?? 0) > 0 && (theirs.get(date)?.trainingTypeIds.length ?? 0) > 0,
      ).length;
      return { def, current, target: def.target, achieved: current >= def.target, detail: `${current} de 3 días` };
    }
  }
}

export { NUTRITION_STREAK_THRESHOLD };
