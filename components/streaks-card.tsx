"use client";

import Link from "next/link";
import { IconChevron, IconShield } from "./icons";
import type { Streaks } from "@/lib/streaks";
import type { AchievementState } from "@/lib/achievements";
import { formatMissing } from "@/lib/achievements";

type Props = {
  streaks: Streaks;
  weekTrainings: number;
  goal: number;
  nextAchievement?: AchievementState | null;
  unlockedCount?: number;
  totalAchievements?: number;
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function StreaksCard({
  streaks,
  weekTrainings,
  goal,
  nextAchievement,
  unlockedCount = 0,
  totalAchievements = 0,
}: Props) {
  const progress = Math.min(weekTrainings / Math.max(goal, 1), 1);
  const { registration, nutrition, weeks } = streaks;

  return (
    <div className="space-y-3 px-5">
      <section className="card p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-hero tnum leading-none">{registration}</p>
            <p className="mt-1.5 text-note text-text-dim">
              {registration === 0 ? "todavía sin racha" : plural(registration, "día seguido", "días seguidos")}
            </p>
          </div>

          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-note">
              <span className="tnum">{nutrition.days}</span>
              <span className="text-text-dim">comiendo bien</span>
              <span
                title={nutrition.wildcardAvailable ? "Te queda el comodín de la semana" : "Comodín usado esta semana"}
                className={nutrition.wildcardAvailable ? "text-food-5" : "text-text-dim/35"}
              >
                <IconShield />
              </span>
            </p>
            {weeks > 0 && (
              <p className="mt-1 text-mini text-text-dim">
                {weeks} {plural(weeks, "semana", "semanas")} con la meta
              </p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between text-note">
            <span className="text-text-dim">Esta semana</span>
            <span className="tnum">
              {weekTrainings} de {goal}
            </span>
          </div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: Math.max(goal, weekTrainings) }, (_, i) => (
              <span
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i < weekTrainings ? "bg-gym" : "bg-line"
                }`}
              />
            ))}
          </div>
          {progress >= 1 && <p className="mt-2 text-mini text-yoga">Meta de la semana cumplida.</p>}
        </div>
      </section>

      {nextAchievement && (
        <Link href="/logros" className="tap card flex items-center gap-4 p-4">
          <AchievementMedal state={nextAchievement} />
          <div className="min-w-0 flex-1">
            <p className="text-mini text-text-dim">
              Próximo logro · {unlockedCount} de {totalAchievements}
            </p>
            <p className="mt-0.5 truncate text-body">{nextAchievement.def.label}</p>
            <p className="mt-0.5 text-mini text-text-dim">
              te {nextAchievement.target - nextAchievement.current === 1 ? "falta" : "faltan"}{" "}
              {formatMissing(nextAchievement.def.unit, nextAchievement.target - nextAchievement.current)}
            </p>
          </div>
          <span className="text-text-dim">
            <IconChevron />
          </span>
        </Link>
      )}
    </div>
  );
}

/** Medalla con anillo de progreso: el hueco que falta se ve, y eso es el gancho. */
export function AchievementMedal({ state, size = 46 }: { state: AchievementState; size?: number }) {
  const { def, current, target, unlocked } = state;
  const ratio = Math.max(0, Math.min(current / target, 1));
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        {ratio > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={GROUP_COLOR[def.group]}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference * ratio} ${circumference}`}
          />
        )}
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-display tnum"
        style={{
          fontSize: size * 0.32,
          color: unlocked ? GROUP_COLOR[def.group] : "var(--color-text-dim)",
        }}
      >
        {unlocked ? <Check color={GROUP_COLOR[def.group]} size={size * 0.42} /> : MEDAL_TEXT[def.key] ?? "★"}
      </span>
    </span>
  );
}

export const GROUP_COLOR: Record<string, string> = {
  registro: "#A78BFA",
  alimentacion: "#FFD75E",
  entrenamiento: "#60A5FA",
  equipo: "#4ADE9C",
};

/** El hito adentro de la medalla: dice de qué se trata sin leer el criterio. */
const MEDAL_TEXT: Record<string, string> = {
  primer_dia: "1",
  semana_completa: "7",
  un_mes: "30",
  cien_dias: "100",
  un_ano: "365",
  dia_redondo: "5",
  semana_verde: "7",
  mes_parejo: "4",
  finde_firme: "4",
  arranque: "10",
  cincuenta: "50",
  cien_entrenos: "100",
  doble_jornada: "2",
  nunca_dos_seguidos: "30",
  mes_completo: "4",
  los_dos_en_linea: "2",
  treinta_juntos: "30",
  primer_desafio: "1",
  diez_desafios: "10",
};

function Check({ color, size }: { color: string; size: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size }}>
      <path d="m5.5 12.5 4 4 9-9" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
