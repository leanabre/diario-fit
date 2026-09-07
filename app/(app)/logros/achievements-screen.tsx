"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconBack } from "@/components/icons";
import { GROUP_LABELS, formatMissing, type AchievementGroup, type AchievementState } from "@/lib/achievements";
import { tapComplete } from "@/lib/haptics";
import { unlockAchievements } from "./actions";

const GROUP_COLOR: Record<AchievementGroup, string> = {
  registro: "#7C5CFF",
  alimentacion: "#FFD24A",
  entrenamiento: "#4A9BFF",
  equipo: "#3DDC97",
};

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
    const timer = setTimeout(() => setCelebrating(null), 2400);
    return () => clearTimeout(timer);
  }, [newlyUnlocked]);

  const groups = Object.keys(GROUP_LABELS) as AchievementGroup[];
  const total = states.length;
  const done = states.filter((s) => s.unlocked).length;
  const celebrated = states.find((s) => s.def.key === celebrating);

  return (
    <div className="flex flex-1 flex-col pb-6">
      <header className="safe-top flex items-center gap-2 px-3 pb-4 pt-3">
        <Link href="/datos" aria-label="Volver" className="p-2 text-text-dim">
          <IconBack />
        </Link>
        <div>
          <h1 className="font-display text-head">Logros</h1>
          <p className="text-mini text-text-dim tnum">
            {done} de {total}
          </p>
        </div>
      </header>

      <div className="space-y-8 px-5">
        {groups.map((group) => {
          const rows = states.filter((s) => s.def.group === group);
          return (
            <section key={group}>
              <h2 className="text-note text-text-dim">{GROUP_LABELS[group]}</h2>
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
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg/92 px-8"
        >
          <span
            className="fade-up flex h-24 w-24 items-center justify-center rounded-3xl"
            style={{ background: GROUP_COLOR[celebrated.def.group] }}
          >
            <Check />
          </span>
          <p className="font-display text-head">{celebrated.def.label}</p>
          <p className="text-note text-text-dim">{celebrated.def.criterion}</p>
        </button>
      )}
    </div>
  );
}

function Badge({ state, unlockedAt }: { state: AchievementState; unlockedAt?: string }) {
  const { def, current, target, unlocked } = state;
  const missing = Math.max(target - current, 0);
  const progress = Math.min(current / target, 1);

  return (
    <div
      className={`flex items-center gap-3.5 rounded-2xl border p-3.5 ${
        unlocked ? "border-transparent bg-surface" : "border-line"
      }`}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: unlocked ? GROUP_COLOR[def.group] : "var(--color-line)" }}
      >
        {unlocked ? <Check /> : <span className="text-mini text-text-dim tnum">{Math.round(progress * 100)}%</span>}
      </span>

      <div className="min-w-0 flex-1">
        <p className={`text-body ${unlocked ? "" : "text-text-dim"}`}>{def.label}</p>
        <p className="text-mini text-text-dim">
          {unlocked
            ? unlockedAt
              ? `Desbloqueado el ${new Date(unlockedAt).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}`
              : def.criterion
            : `${def.criterion} — te ${missing === 1 ? "falta" : "faltan"} ${formatMissing(def.unit, missing)}`}
        </p>
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path d="m5.5 12.5 4 4 9-9" stroke="#151329" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
