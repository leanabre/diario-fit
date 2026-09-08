"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconBack } from "@/components/icons";
import { AchievementMedal, GROUP_COLOR } from "@/components/streaks-card";
import { GROUP_LABELS, formatMissing, type AchievementGroup, type AchievementState } from "@/lib/achievements";
import { withAlpha } from "@/lib/color";
import { tapComplete } from "@/lib/haptics";
import { unlockAchievements } from "./actions";

type Props = {
  states: AchievementState[];
  unlockedAt: Record<string, string>;
  /** Alcanzados pero todavía sin registrar: son los que se festejan. */
  newlyUnlocked: string[];
};

export function AchievementsScreen({ states, unlockedAt, newlyUnlocked }: Props) {
  const [celebrating, setCelebrating] = useState<string | null>(newlyUnlocked[0] ?? null);

  useEffect(() => {
    if (newlyUnlocked.length === 0) return;
    tapComplete();
    unlockAchievements(newlyUnlocked);
    const timer = setTimeout(() => setCelebrating(null), 2600);
    return () => clearTimeout(timer);
  }, [newlyUnlocked]);

  const groups = Object.keys(GROUP_LABELS) as AchievementGroup[];
  const done = states.filter((s) => s.unlocked).length;
  const celebrated = states.find((s) => s.def.key === celebrating);

  return (
    <div className="flex flex-1 flex-col pb-6">
      <header className="safe-top flex items-center gap-1 px-3 pb-2 pt-3">
        <Link href="/" aria-label="Volver" className="tap p-2 text-text-dim">
          <IconBack />
        </Link>
        <h1 className="font-display text-head">Logros</h1>
      </header>

      <section className="mx-5 card p-5">
        <div className="flex items-end gap-3">
          <span className="font-display text-hero tnum leading-none">{done}</span>
          <span className="pb-1 text-note text-text-dim">de {states.length} desbloqueados</span>
        </div>
        <div className="mt-4 flex gap-1">
          {states.map((s) => (
            <span
              key={s.def.key}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: s.unlocked ? GROUP_COLOR[s.def.group] : "var(--color-line)" }}
            />
          ))}
        </div>
      </section>

      <div className="mt-8 space-y-8 px-5">
        {groups.map((group) => {
          const rows = states.filter((s) => s.def.group === group);
          const hechos = rows.filter((r) => r.unlocked).length;
          return (
            <section key={group}>
              <h2 className="flex items-baseline justify-between text-note">
                <span style={{ color: GROUP_COLOR[group] }}>{GROUP_LABELS[group]}</span>
                <span className="text-mini text-text-dim tnum">
                  {hechos}/{rows.length}
                </span>
              </h2>
              <div className="mt-3 space-y-2">
                {rows.map((state) => (
                  <Badge key={state.def.key} state={state} unlockedAt={unlockedAt[state.def.key]} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {celebrated && (
        <button
          onClick={() => setCelebrating(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-bg/94 px-8"
        >
          <span className="fade-up">
            <AchievementMedal state={celebrated} size={112} />
          </span>
          <div className="fade-up text-center">
            <p className="text-mini uppercase tracking-widest text-text-dim">Logro desbloqueado</p>
            <p className="mt-2 font-display text-head">{celebrated.def.label}</p>
            <p className="mt-1 text-note text-text-dim">{celebrated.def.criterion}</p>
          </div>
        </button>
      )}
    </div>
  );
}

function Badge({ state, unlockedAt }: { state: AchievementState; unlockedAt?: string }) {
  const { def, current, target, unlocked } = state;
  const missing = Math.max(target - current, 0);
  const color = GROUP_COLOR[def.group];

  return (
    <div
      className="flex items-center gap-3.5 rounded-2xl border p-3.5"
      style={{
        background: unlocked ? withAlpha(color, 0.08) : "var(--color-surface)",
        borderColor: unlocked ? withAlpha(color, 0.35) : "var(--color-line)",
      }}
    >
      <AchievementMedal state={state} />

      <div className="min-w-0 flex-1">
        <p className={`text-body ${unlocked ? "" : "text-text-dim"}`}>{def.label}</p>
        <p className="mt-0.5 text-mini text-text-dim">
          {unlocked
            ? unlockedAt
              ? `El ${new Date(unlockedAt).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}`
              : def.criterion
            : def.criterion}
        </p>
        {!unlocked && (
          <p className="mt-1 text-mini" style={{ color }}>
            te {missing === 1 ? "falta" : "faltan"} {formatMissing(def.unit, missing)}
          </p>
        )}
      </div>
    </div>
  );
}
