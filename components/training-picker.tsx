"use client";

import { REST_COLOR } from "@/lib/config";
import { withAlpha } from "@/lib/color";
import type { TrainingType } from "@/lib/types";

type Props = {
  types: TrainingType[];
  selected: string[];
  restDay: boolean;
  onToggleType: (id: string) => void;
  onToggleRest: () => void;
};

/**
 * El seleccionado no se rellena a fondo: se tiñe y toma el color en el borde y
 * en el texto. Con cuatro chips prendidos, cuatro rectángulos saturados tapaban
 * la pantalla. El punto de color va siempre, así se aprende qué color es cuál.
 */
export function TrainingPicker({ types, selected, restDay, onToggleType, onToggleRest }: Props) {
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

      <div className="mt-2.5">
        <Chip label="Descanso" color={REST_COLOR} active={restDay} onClick={onToggleRest} />
      </div>
    </section>
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
