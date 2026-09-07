import type { DateKey } from "./dates";

export type Profile = {
  id: string;
  display_name: string;
  emoji: string;
  accent_color: string;
  weekly_training_goal: number;
  reminder_hour: number | null;
  share_notes: boolean;
  created_at: string;
};

export type TrainingType = {
  id: string;
  user_id: string;
  key: string;
  label: string;
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

export type DayEntryRow = {
  id: string;
  user_id: string;
  date: DateKey;
  nutrition_score: number | null;
  nutrition_note: string | null;
  rest_day: boolean;
};

/** Un día ya resuelto: la entrada más sus entrenamientos. Es lo que consumen las vistas. */
export type Day = {
  date: DateKey;
  entryId: string | null;
  nutritionScore: number | null;
  nutritionNote: string | null;
  restDay: boolean;
  trainingTypeIds: string[];
};

export function emptyDay(date: DateKey): Day {
  return {
    date,
    entryId: null,
    nutritionScore: null,
    nutritionNote: null,
    restDay: false,
    trainingTypeIds: [],
  };
}

/** Un día está cargado con score y, además, descanso o al menos un entrenamiento. */
export function isLogged(day: Pick<Day, "nutritionScore" | "restDay" | "trainingTypeIds">): boolean {
  return day.nutritionScore != null && (day.restDay || day.trainingTypeIds.length > 0);
}

export function trainingCount(day: Pick<Day, "trainingTypeIds">): number {
  return day.trainingTypeIds.length;
}

export type Team = {
  id: string;
  name: string;
  invite_code: string;
};
