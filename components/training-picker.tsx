"use client";

import { REST_COLOR } from "@/lib/config";
import type { TrainingType } from "@/lib/types";

type Props = {
  types: TrainingType[];
  selected: string[];
  restDay: boolean;
  onToggleType: (id: string) => void;
  onToggleRest: () => void;
};

export function TrainingPicker({ types, selected, restDay, onToggleType, onToggleRest }: Props) {
  return (
    <section className="px-5">
      <h2 className="text-body">¿Entrenaste?</h2>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {types.map((type) => {
          const active = selected.includes(type.id) && !restDay;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onToggleType(type.id)}
              aria-pressed={active}
              style={{
                background: active ? type.color : "var(--color-surface)",
                borderColor: active ? type.color : "var(--color-line)",
                color: active ? "#151329" : undefined,
              }}
              className={`rounded-2xl border px-4 py-3.5 text-body transition-colors ${
                restDay ? "opacity-40" : ""
              } ${active ? "font-medium" : ""}`}
            >
              {type.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onToggleRest}
        aria-pressed={restDay}
        style={{
          background: restDay ? REST_COLOR : "var(--color-surface)",
          borderColor: restDay ? "#5A5490" : "var(--color-line)",
        }}
        className="mt-2.5 w-full rounded-2xl border px-4 py-3.5 text-body transition-colors"
      >
        Descanso
      </button>
    </section>
  );
}
