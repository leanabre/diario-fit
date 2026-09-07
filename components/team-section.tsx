"use client";

import { useState, useTransition } from "react";
import { createTeam, joinTeam, leaveTeam, renameTeam } from "@/app/(app)/ajustes/actions";
import type { Profile, Team } from "@/lib/types";

type Props = { team: Team | null; partner: Profile | null };

export function TeamSection({ team, partner }: Props) {
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [name, setName] = useState(team?.name ?? "");
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
    });
  }

  if (!team) {
    return (
      <div className="space-y-4">
        <button
          disabled={pending}
          onClick={() => run(() => createTeam("Nosotros"))}
          className="w-full rounded-2xl bg-[#7C5CFF] px-4 py-3.5 text-body font-medium text-white disabled:opacity-50"
        >
          Crear equipo
        </button>

        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="Código de 6"
            autoCapitalize="characters"
            className="min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 py-3 text-body tracking-[0.15em] outline-none placeholder:tracking-normal placeholder:text-text-dim/60"
          />
          <button
            disabled={pending || code.length < 6}
            onClick={() => run(() => joinTeam(code))}
            className="shrink-0 rounded-2xl border border-line px-4 text-note disabled:opacity-40"
          >
            Unirme
          </button>
        </div>

        {error && <p className="text-note text-food-4">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={(e) => run(() => renameTeam(e.target.value))}
        className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-body outline-none focus:border-[#7C5CFF]"
      />

      {partner ? (
        <p className="text-note text-text-dim">
          Vinculada con {partner.emoji} {partner.display_name}.
        </p>
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-note text-text-dim">Código de invitación</p>
          <p className="mt-1 font-display text-num tnum tracking-[0.2em]">{team.invite_code}</p>
          <p className="mt-2 text-mini text-text-dim">Pasáselo a la otra persona para que se sume.</p>
        </div>
      )}

      <button
        disabled={pending}
        onClick={() => run(leaveTeam)}
        className="text-note text-text-dim underline underline-offset-4 disabled:opacity-50"
      >
        Salir del equipo
      </button>

      {error && <p className="text-note text-food-4">{error}</p>}
    </div>
  );
}
