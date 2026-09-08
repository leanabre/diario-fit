"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { DayStrip } from "@/components/day-strip";
import { NutritionPicker } from "@/components/nutrition-picker";
import { ScreenHeader } from "@/components/screen-header";
import { StreaksCard } from "@/components/streaks-card";
import { TrainingPicker } from "@/components/training-picker";
import { REST_COLOR } from "@/lib/config";
import { editableWindow, formatMonth, formatWeekday, relativeDayLabel, weekStartKey, type DateKey } from "@/lib/dates";
import { allStreaks, weekTrainingCount } from "@/lib/streaks";
import { evaluateAchievements } from "@/lib/achievements";
import type { Day, Profile, TrainingType } from "@/lib/types";
import { useDays } from "@/lib/use-days";

type Props = {
  userId: string;
  profile: Profile;
  trainingTypes: TrainingType[];
  initialDays: Day[];
  today: DateKey;
};

const SWIPE_THRESHOLD = 55;

export function TodayScreen({ userId, profile, trainingTypes, initialDays, today }: Props) {
  const { days, dayAt, update, igniteDate, error } = useDays(userId, initialDays);
  const [selected, setSelected] = useState<DateKey>(today);
  const window = useMemo(() => editableWindow(today), [today]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const day = dayAt(selected);
  const colorFor = useMemo(() => {
    const map = new Map(trainingTypes.map((t) => [t.id, t.color]));
    return (id: string) => map.get(id) ?? REST_COLOR;
  }, [trainingTypes]);

  const streaks = useMemo(
    () => allStreaks(days, profile.weekly_training_goal, today),
    [days, profile.weekly_training_goal, today],
  );
  const weekTrainings = useMemo(() => weekTrainingCount(days, weekStartKey(today)), [days, today]);

  // Los logros dejan de estar escondidos: el más cercano vive en Hoy, que es la
  // pantalla que se abre todos los días. Se calculan diferidos porque recorren
  // todo el histórico y no tienen por qué frenar el toque.
  const deferredDays = useDeferredValue(days);
  const achievements = useMemo(
    () => evaluateAchievements({ days: deferredDays, goal: profile.weekly_training_goal, today }),
    [deferredDays, profile.weekly_training_goal, today],
  );
  const nextAchievement = useMemo(() => {
    const pending = achievements.filter((a) => !a.unlocked && a.def.group !== "equipo");
    if (pending.length === 0) return null;
    return pending.reduce((best, a) => (a.current / a.target > best.current / best.target ? a : best));
  }, [achievements]);

  const isFirstDay = days.size === 0 && day.nutritionScore == null;

  function shift(delta: number) {
    const index = window.indexOf(selected);
    const next = window[index + delta];
    if (next) setSelected(next);
  }

  function onTouchStart(event: React.TouchEvent) {
    const t = event.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    shift(dx < 0 ? 1 : -1);
  }

  function toggleType(id: string) {
    const has = day.trainingTypeIds.includes(id);
    update(selected, {
      restDay: false,
      trainingTypeIds: has ? day.trainingTypeIds.filter((x) => x !== id) : [...day.trainingTypeIds, id],
    });
  }

  function toggleRest() {
    update(selected, day.restDay ? { restDay: false } : { restDay: true, trainingTypeIds: [] });
  }

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="flex flex-1 flex-col">
      <ScreenHeader
        title={formatWeekday(selected)}
        subtitle={selected === today ? formatMonth(selected) : `${formatMonth(selected)} · ${relativeDayLabel(selected, today)}`}
      />

      <DayStrip
        dates={window}
        days={days}
        selected={selected}
        igniteDate={igniteDate}
        colorFor={colorFor}
        onSelect={setSelected}
      />

      <div className="mt-8 space-y-8">
        {isFirstDay && <p className="px-5 text-note text-text-dim">Arrancá marcando cómo comiste hoy.</p>}

        <NutritionPicker
          score={day.nutritionScore}
          note={day.nutritionNote}
          onScore={(score) => update(selected, { nutritionScore: score })}
          onNote={(note) => update(selected, { nutritionNote: note || null })}
        />

        <TrainingPicker
          types={trainingTypes.filter((t) => t.is_active || day.trainingTypeIds.includes(t.id))}
          selected={day.trainingTypeIds}
          restDay={day.restDay}
          onToggleType={toggleType}
          onToggleRest={toggleRest}
        />
      </div>

      <div className="mt-9 border-t border-line pt-7">
        <StreaksCard
          streaks={streaks}
          weekTrainings={weekTrainings}
          goal={profile.weekly_training_goal}
          nextAchievement={nextAchievement}
          unlockedCount={achievements.filter((a) => a.unlocked).length}
          totalAchievements={achievements.length}
        />
      </div>

      {error && <p className="mt-4 px-5 text-note text-food-4">{error}</p>}
    </div>
  );
}
