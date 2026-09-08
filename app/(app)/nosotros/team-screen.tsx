"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ScreenHeader } from "@/components/screen-header";
import { CHALLENGES, challengeProgress, type ChallengeProgress } from "@/lib/challenges";
import { formatShort, parseKey, shiftKey, weekStartKey, type DateKey } from "@/lib/dates";
import { weekSummary } from "@/lib/score";
import { buildDayMap } from "@/lib/streaks";
import { jointStreak } from "@/lib/achievements";
import type { Day, Profile, Team } from "@/lib/types";
import type { TeamChallenge } from "@/lib/team";
import { changeChallenge } from "./actions";

type Props = {
  team: Team;
  me: Profile;
  partner: Profile | null;
  myDays: Day[];
  partnerDays: Day[];
  challenges: TeamChallenge[];
  today: DateKey;
};

export function TeamScreen({ team, me, partner, myDays, partnerDays, challenges, today }: Props) {
  const [pending, startTransition] = useTransition();
  const [picking, setPicking] = useState(false);

  const mine = buildDayMap(myDays);
  const theirs = buildDayMap(partnerDays);
  const weekStart = weekStartKey(today);
  const isMonday = parseKey(today).getDay() === 1;

  const current = challenges.find((c) => c.week_start === weekStart);
  const progress = current ? challengeProgress(current.key, mine, theirs, weekStart, today) : null;
  const won = challenges.filter((c) => c.status === "won");

  const streak = partner ? jointStreak(mine, theirs, today) : 0;

  if (!partner) {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader
          title={team.name}
          subtitle="Falta que se sume la otra persona"
          avatar={{ emoji: me.emoji, color: me.accent_color }}
        />
        <section className="mx-5 card p-5">
          <p className="text-note text-text-dim">Tu código de invitación</p>
          <p className="mt-2 font-display text-hero tnum tracking-[0.2em]">{team.invite_code}</p>
          <p className="mt-3 text-note text-text-dim">
            La otra persona lo pone en Ajustes, en “Vincular pareja”. Son seis caracteres y no distingue mayúsculas.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title={team.name}
        subtitle={`${me.display_name} y ${partner.display_name}`}
        avatar={{ emoji: me.emoji, color: me.accent_color }}
      />

      <section className="mx-5 card p-5">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-hero tnum leading-none">{streak}</span>
          <span className="text-note text-text-dim">
            {streak === 0
              ? "sin racha conjunta todavía"
              : streak === 1
                ? "día cargando los dos"
                : "días seguidos cargando los dos"}
          </span>
        </div>
      </section>

      {current && progress && (
        <section className="mx-5 mt-8 card p-5">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-note text-text-dim">Desafío de la semana</p>
              <p className="mt-0.5 text-head font-display">{progress.def.label}</p>
            </div>
            {isMonday && (
              <button onClick={() => setPicking((v) => !v)} className="text-mini text-text-dim underline underline-offset-4">
                Cambiar
              </button>
            )}
          </div>

          <p className="mt-1 text-note text-text-dim">{progress.def.description}</p>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${Math.min(progress.current / progress.target, 1) * 100}%`,
                background: progress.achieved ? "var(--color-yoga)" : "var(--color-ludus)",
              }}
            />
          </div>
          <p className="mt-2 text-mini text-text-dim">{progress.detail}</p>

          {picking && (
            <div className="mt-4 space-y-2 border-t border-line pt-4">
              {CHALLENGES.filter((c) => c.key !== current.key).map((option) => (
                <button
                  key={option.key}
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await changeChallenge(option.key);
                      setPicking(false);
                    })
                  }
                  className="block w-full rounded-2xl border border-line px-4 py-3 text-left text-note disabled:opacity-50"
                >
                  <span className="text-text">{option.label}</span>
                  <span className="block text-mini text-text-dim">{option.description}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mt-8 grid grid-cols-2 gap-3 px-5">
        <PersonWeek profile={me} days={mine} weekStart={weekStart} />
        <PersonWeek profile={partner} days={theirs} weekStart={weekStart} />
      </section>

      {won.length > 0 && (
        <section className="mt-9 px-5">
          <h2 className="text-note text-text-dim">Desafíos ganados</h2>
          <div className="mt-3 space-y-2">
            {won.slice(0, 12).map((challenge) => (
              <div key={challenge.id} className="flex items-baseline justify-between rounded-2xl border border-line px-4 py-3">
                <span className="text-note">{CHALLENGES.find((c) => c.key === challenge.key)?.label ?? challenge.key}</span>
                <span className="text-mini text-text-dim">semana del {formatShort(challenge.week_start)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <CelebrationFrame challenges={challenges} />
    </div>
  );
}

function PersonWeek({ profile, days, weekStart }: { profile: Profile; days: Map<DateKey, Day>; weekStart: DateKey }) {
  const summary = weekSummary(days, weekStart, profile.weekly_training_goal);

  return (
    <div className="card p-4">
      {/* Mismo lenguaje que el avatar del header: emoji dentro de un aro del
          color de cada uno. */}
      <p className="flex items-center gap-2 text-note">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[14px] leading-none"
          style={{ borderColor: profile.accent_color }}
        >
          {profile.emoji}
        </span>
        <span className="truncate">{profile.display_name}</span>
      </p>
      <p className="mt-3 font-display text-num tnum">{summary.score}</p>
      <p className="text-mini text-text-dim">{summary.label}</p>
      <dl className="mt-3 space-y-1 text-mini text-text-dim">
        <div className="flex justify-between">
          <dt>Entrenos</dt>
          <dd className="tnum text-text">
            {summary.trainings}/{profile.weekly_training_goal}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Promedio</dt>
          <dd className="tnum text-text">
            {summary.nutritionAverage != null ? summary.nutritionAverage.toFixed(1).replace(".", ",") : "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

const SEEN_KEY = "diario-fit:desafios-festejados";

/** El segundo y último momento de motion orquestado: un frame al ganar. */
function CelebrationFrame({ challenges }: { challenges: TeamChallenge[] }) {
  const [show, setShow] = useState<TeamChallenge | null>(null);

  useEffect(() => {
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    } catch {
      seen = [];
    }

    const fresh = challenges.find((c) => c.status === "won" && !seen.includes(c.id));
    if (!fresh) return;

    setShow(fresh);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, fresh.id].slice(-40)));
    } catch {
      // sin storage no pasa nada: se muestra igual esta vez
    }

    const timer = setTimeout(() => setShow(null), 2600);
    return () => clearTimeout(timer);
  }, [challenges]);

  if (!show) return null;
  const def = CHALLENGES.find((c) => c.key === show.key);

  return (
    <button
      onClick={() => setShow(null)}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-bg/92 px-8"
    >
      <span className="fade-up flex h-24 w-24 items-center justify-center rounded-3xl bg-yoga">
        <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10">
          <path d="m5.5 12.5 4 4 9-9" stroke="#151329" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="font-display text-head">{def?.label ?? "Desafío ganado"}</p>
      <p className="text-note text-text-dim">Lo ganaron los dos.</p>
    </button>
  );
}
