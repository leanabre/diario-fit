"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ScreenHeader } from "@/components/screen-header";
import { formatShort, shiftKey, weekStartKey, type DateKey } from "@/lib/dates";
import { weekSummary } from "@/lib/score";
import { buildDayMap } from "@/lib/streaks";
import {
  PERIODS,
  bestWeek,
  crossedInsight,
  totalDistance,
  trainingDistribution,
  weeklySeries,
  type PeriodKey,
} from "@/lib/series";
import type { Day, Profile, TrainingType } from "@/lib/types";

type Props = {
  profile: Profile;
  trainingTypes: TrainingType[];
  history: Day[];
  today: DateKey;
};

const AXIS = { stroke: "var(--color-text-dim)", fontSize: 11, fontFamily: "var(--font-sans)" };

export function DataScreen({ profile, trainingTypes, history, today }: Props) {
  const [period, setPeriod] = useState<PeriodKey>("mes");
  const goal = profile.weekly_training_goal;

  const days = useMemo(() => buildDayMap(history), [history]);
  const weeks = PERIODS.find((p) => p.key === period)!;

  const series = useMemo(() => weeklySeries(days, goal, weeks.weeks, today), [days, goal, weeks.weeks, today]);
  const distribution = useMemo(
    () => trainingDistribution(days, trainingTypes, weeks.weeks, today),
    [days, trainingTypes, weeks.weeks, today],
  );
  const kilometers = useMemo(() => totalDistance(days, weeks.weeks, today), [days, weeks.weeks, today]);
  const best = useMemo(() => bestWeek(days, goal), [days, goal]);
  const insight = useMemo(() => crossedInsight(days, goal), [days, goal]);

  const thisWeek = useMemo(() => weekSummary(days, weekStartKey(today), goal), [days, goal, today]);
  const lastWeek = useMemo(
    () => weekSummary(days, shiftKey(weekStartKey(today), -7), goal),
    [days, goal, today],
  );
  const delta = thisWeek.score - lastWeek.score;

  const hasData = history.length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title="Datos"
        subtitle={weeks.caption}
        avatar={{ emoji: profile.emoji, color: profile.accent_color }}
      />

      <div className="px-5">
        <div className="flex gap-2 rounded-2xl border border-line bg-surface p-1">
          {PERIODS.map((option) => (
            <button
              key={option.key}
              onClick={() => setPeriod(option.key)}
              className={`flex-1 rounded-xl py-2 text-note transition-colors ${
                period === option.key ? "bg-line text-text" : "text-text-dim"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <p className="mt-8 px-5 text-note text-text-dim">
          Todavía no hay nada para mostrar. Cargá unos días y esto se llena solo.
        </p>
      ) : (
        <div className="mt-7 space-y-9">
          <section className="px-5">
            <p className="text-note text-text-dim">Puntaje de la semana</p>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-display text-hero tnum">{thisWeek.score}</span>
              <span className="text-head text-text-dim">{thisWeek.label}</span>
            </div>
            <p className="mt-1 text-note text-text-dim">
              {delta === 0 ? "Igual que la semana pasada" : `${delta > 0 ? "+" : ""}${delta} contra la semana pasada`}
            </p>
          </section>

          <Card title="Alimentación por semana">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} interval="preserveStartEnd" minTickGap={22} />
                  <YAxis domain={[1, 5]} ticks={[1, 3, 5]} tickLine={false} axisLine={false} tick={AXIS} width={26} />
                  <Line
                    type="monotone"
                    dataKey="nutritionAverage"
                    stroke="var(--color-food-5)"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: "var(--color-food-5)", strokeWidth: 0 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Entrenamientos por semana" hint={`La línea punteada es tu meta: ${goal}.`}>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} interval="preserveStartEnd" minTickGap={22} />
                  <YAxis tickLine={false} axisLine={false} tick={AXIS} width={26} allowDecimals={false} />
                  <ReferenceLine y={goal} stroke="var(--color-text-dim)" strokeDasharray="4 4" />
                  <Bar dataKey="trainings" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {series.map((week) => (
                      <Cell
                        key={week.weekStart}
                        fill={week.trainings >= goal ? "var(--color-gym)" : "var(--color-line)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {distribution.length > 0 && (
            <Card title="Por tipo">
              <div className="h-auto" style={{ height: distribution.length * 38 + 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={AXIS}
                      width={78}
                    />
                    <Bar dataKey="count" radius={[0, 5, 5, 0]} barSize={16} isAnimationActive={false} label={{ position: "right", fill: "var(--color-text-dim)", fontSize: 12 }}>
                      {distribution.map((row) => (
                        <Cell key={row.id} fill={row.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {kilometers > 0 && (
            <section className="px-5">
              <p className="text-note text-text-dim">Kilómetros</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-num tnum">{String(kilometers).replace(".", ",")}</span>
                <span className="text-note text-text-dim">caminando y corriendo</span>
              </p>
            </section>
          )}

          {best && (
            <section className="px-5">
              <p className="text-note text-text-dim">Mejor semana</p>
              <p className="mt-1 flex items-baseline gap-3">
                <span className="font-display text-num tnum">{best.score}</span>
                <span className="text-note text-text-dim">
                  la del {formatShort(best.weekStart)}, {best.label.toLowerCase()}
                </span>
              </p>
            </section>
          )}

          {insight && (
            <section className="mx-5 card p-5">
              <p className="text-note leading-relaxed">
                En las semanas que entrenaste {goal} veces o más, tu promedio de alimentación fue{" "}
                <span className="tnum text-food-5">{insight.withGoal.toFixed(1).replace(".", ",")}</span>. En las demás,{" "}
                <span className="tnum">{insight.without.toFixed(1).replace(".", ",")}</span>.
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="px-5">
      <p className="text-note text-text-dim">{title}</p>
      {hint && <p className="text-mini text-text-dim/70">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
