"use client";

import { IconShield } from "./icons";
import type { Streaks } from "@/lib/streaks";

type Props = {
  streaks: Streaks;
  weekTrainings: number;
  goal: number;
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function StreaksCard({ streaks, weekTrainings, goal }: Props) {
  const progress = Math.min(weekTrainings / Math.max(goal, 1), 1);
  const { registration, nutrition, weeks } = streaks;

  return (
    <section className="mx-5 mt-2 border-t border-line pt-5">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-num tnum">{registration}</span>
        <span className="text-note text-text-dim">
          {registration === 0 ? "todavía sin racha" : plural(registration, "día seguido", "días seguidos")}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2 text-note text-text-dim">
        <span className="tnum text-text">{nutrition.days}</span>
        <span>{plural(nutrition.days, "día comiendo bien", "días comiendo bien")}</span>
        <span
          title={nutrition.wildcardAvailable ? "Te queda el comodín de la semana" : "Comodín usado esta semana"}
          className={nutrition.wildcardAvailable ? "text-food-5" : "text-text-dim/40"}
        >
          <IconShield />
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between text-note">
          <span className="text-text-dim">Semana</span>
          <span className="tnum">
            {weekTrainings}/{goal}
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-gym transition-[width] duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {weeks > 0 && (
          <p className="mt-2 text-mini text-text-dim">
            {weeks} {plural(weeks, "semana seguida", "semanas seguidas")} con la meta
          </p>
        )}
      </div>
    </section>
  );
}
