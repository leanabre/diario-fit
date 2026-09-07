"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DayCell } from "@/components/day-cell";
import { DaySheet } from "@/components/day-sheet";
import { IconBack, IconChevron } from "@/components/icons";
import { ScreenHeader } from "@/components/screen-header";
import { REST_COLOR } from "@/lib/config";
import { dayOfMonth, formatMonthYear, isFuture, monthDates, monthGrid, shiftMonth, type DateKey } from "@/lib/dates";
import { isLogged, type Day, type Profile, type TrainingType } from "@/lib/types";
import { useDays } from "@/lib/use-days";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

type Props = {
  userId: string;
  profile: Profile;
  trainingTypes: TrainingType[];
  initialDays: Day[];
  month: DateKey;
  today: DateKey;
};

export function MonthScreen({ userId, profile, trainingTypes, initialDays, month, today }: Props) {
  const { days, dayAt, update, igniteDate, error } = useDays(userId, initialDays);
  const [open, setOpen] = useState<DateKey | null>(null);

  const grid = useMemo(() => monthGrid(month), [month]);
  const colorFor = useMemo(() => {
    const map = new Map(trainingTypes.map((t) => [t.id, t.color]));
    return (id: string) => map.get(id) ?? REST_COLOR;
  }, [trainingTypes]);

  const summary = useMemo(() => {
    let trainings = 0;
    let logged = 0;
    let sum = 0;
    let scored = 0;
    for (const date of monthDates(month)) {
      const day = days.get(date);
      if (!day) continue;
      trainings += day.trainingTypeIds.length;
      if (isLogged(day)) logged += 1;
      if (day.nutritionScore != null) {
        sum += day.nutritionScore;
        scored += 1;
      }
    }
    return { trainings, logged, average: scored ? sum / scored : null };
  }, [days, month]);

  const nextMonth = shiftMonth(month, 1);
  const canGoNext = !isFuture(nextMonth, today);

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title={formatMonthYear(month)}
        action={
          <div className="flex items-center gap-1 text-text-dim">
            <Link href={`/mes?m=${shiftMonth(month, -1)}`} aria-label="Mes anterior" className="p-2">
              <IconBack />
            </Link>
            {canGoNext ? (
              <Link href={`/mes?m=${nextMonth}`} aria-label="Mes siguiente" className="p-2">
                <IconChevron />
              </Link>
            ) : (
              <span className="p-2 opacity-25">
                <IconChevron />
              </span>
            )}
          </div>
        }
      />

      <div className="px-5">
        <div className="grid grid-cols-7 gap-1.5 pb-2 text-center text-mini text-text-dim">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((date, i) =>
            date ? (
              <DayCell
                key={date}
                day={days.get(date)}
                colorFor={colorFor}
                label={dayOfMonth(date)}
                muted={isFuture(date, today)}
                ignite={date === igniteDate}
                onClick={isFuture(date, today) ? undefined : () => setOpen(date)}
                ariaLabel={date}
              />
            ) : (
              <span key={`blank-${i}`} className="aspect-square" />
            ),
          )}
        </div>
      </div>

      <section className="mx-5 mt-8 grid grid-cols-3 gap-3 rounded-card border border-line bg-surface p-4">
        <Stat value={summary.average != null ? summary.average.toFixed(1).replace(".", ",") : "—"} label="Promedio" />
        <Stat value={String(summary.trainings)} label="Entrenos" />
        <Stat value={String(summary.logged)} label="Días cargados" />
      </section>

      {error && <p className="mt-4 px-5 text-note text-food-4">{error}</p>}

      {open && (
        <DaySheet
          date={open}
          day={dayAt(open)}
          today={today}
          trainingTypes={trainingTypes}
          onUpdate={(patch) => update(open, patch)}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-head tnum">{value}</p>
      <p className="text-mini text-text-dim">{label}</p>
    </div>
  );
}
