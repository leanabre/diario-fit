"use client";

import { useEffect, useState } from "react";
import { REST_COLOR } from "@/lib/config";
import { withAlpha } from "@/lib/color";
import type { TrainingType } from "@/lib/types";

type Props = {
  types: TrainingType[];
  selected: string[];
  restDay: boolean;
  distances: Record<string, number | null>;
  onToggleType: (id: string) => void;
  onToggleRest: () => void;
  onDistance: (id: string, km: number | null) => void;
};

/**
 * El seleccionado no se rellena a fondo: se tiñe y toma el color en el borde y
 * en el texto. Con cuatro chips prendidos, cuatro rectángulos saturados tapaban
 * la pantalla. El punto de color va siempre, así se aprende qué color es cuál.
 */
export function TrainingPicker({
  types,
  selected,
  restDay,
  distances,
  onToggleType,
  onToggleRest,
  onDistance,
}: Props) {
  const withKm = restDay ? [] : types.filter((t) => t.tracks_distance && selected.includes(t.id));

  return (
    <section className="px-5">
      <h2 className="text-body">¿Entrenaste?</h2>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {types.map((type) => (
          <Chip
            key={type.id}
            label={type.label}
            color={type.color}
            active={selected.includes(type.id) && !restDay}
            dimmed={restDay}
            onClick={() => onToggleType(type.id)}
          />
        ))}
      </div>

      {/* Los kilómetros son opcionales y aparecen sólo para lo que se mide en
          distancia: cargar el día no puede depender de acordarse del número. */}
      {withKm.length > 0 && (
        <div className="fade-up mt-2.5 space-y-2">
          {withKm.map((type) => (
            <DistanceField
              key={type.id}
              type={type}
              km={distances[type.id] ?? null}
              onChange={(value) => onDistance(type.id, value)}
            />
          ))}
        </div>
      )}

      <div className="mt-2.5">
        <Chip label="Descanso" color={REST_COLOR} active={restDay} onClick={onToggleRest} />
      </div>
    </section>
  );
}

function DistanceField({
  type,
  km,
  onChange,
}: {
  type: TrainingType;
  km: number | null;
  onChange: (km: number | null) => void;
}) {
  // Se guarda el texto tal cual se escribe para poder tipear "3," sin que se
  // reformatee en el medio.
  const [draft, setDraft] = useState(km == null ? "" : String(km).replace(".", ","));

  useEffect(() => {
    setDraft(km == null ? "" : String(km).replace(".", ","));
  }, [km]);

  function commit(text: string) {
    const clean = text.replace(",", ".").trim();
    if (clean === "") return onChange(null);
    const value = Number.parseFloat(clean);
    if (Number.isNaN(value) || value < 0) return onChange(null);
    onChange(Math.min(Math.round(value * 100) / 100, 999));
  }

  return (
    <label
      className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5"
      style={{ borderColor: withAlpha(type.color, 0.35) }}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: type.color }} />
      <span className="min-w-0 flex-1 truncate text-note text-text-dim">{type.label}</span>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))}
        onBlur={(e) => commit(e.target.value)}
        inputMode="decimal"
        placeholder="—"
        aria-label={`Kilómetros de ${type.label}`}
        className="w-16 bg-transparent text-right font-display text-body tnum outline-none placeholder:text-text-dim/50"
      />
      <span className="text-note text-text-dim">km</span>
    </label>
  );
}

function Chip({
  label,
  color,
  active,
  dimmed,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  dimmed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        background: active ? withAlpha(color, 0.16) : "var(--color-surface)",
        borderColor: active ? color : "var(--color-line)",
        color: active ? color : undefined,
      }}
      className={`tap flex w-full items-center gap-2.5 rounded-2xl border px-4 py-3.5 text-body ${
        active ? "font-medium" : ""
      } ${dimmed ? "opacity-40" : ""}`}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: color, opacity: active ? 1 : 0.85 }}
      />
      {label}
    </button>
  );
}
