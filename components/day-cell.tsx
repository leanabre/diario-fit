"use client";

import { REST_COLOR, nutritionColor } from "@/lib/config";
import type { Day } from "@/lib/types";

export type ColorFor = (trainingTypeId: string) => string;

type Props = {
  day?: Day;
  colorFor: ColorFor;
  label?: string | number;
  selected?: boolean;
  muted?: boolean;
  /** El único motion orquestado de la carga: la celda se enciende al completarse. */
  ignite?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
};

/**
 * La celda parte alimentación arriba (cálido) y entrenamiento abajo (frío). La
 * franja de abajo ocupa un tercio en vez de la mitad: el color del día pesa más
 * que el del entrenamiento, y los dos dejan de pelearse.
 */
export function DayCell({ day, colorFor, label, selected, muted, ignite, onClick, ariaLabel }: Props) {
  const food = nutritionColor(day?.nutritionScore);
  const trainings = day?.restDay ? [REST_COLOR] : (day?.trainingTypeIds ?? []).map(colorFor);
  const empty = !food && trainings.length === 0;

  const content = (
    <span
      className={`relative block aspect-square w-full overflow-hidden rounded-cell ${
        empty ? "border border-line bg-surface/50" : "bg-surface"
      } ${selected ? "outline outline-2 outline-offset-2 outline-text/70" : ""} ${muted ? "opacity-30" : ""} ${
        ignite ? "cell-ignite" : ""
      }`}
    >
      {food && <span className="absolute inset-x-0 top-0 h-[66%]" style={{ background: food }} />}

      {trainings.length > 0 && (
        <span className="absolute inset-x-0 bottom-0 flex h-[34%] gap-px">
          {trainings.map((color, i) => (
            <span key={`${color}-${i}`} className="flex-1" style={{ background: color }} />
          ))}
        </span>
      )}

      {label != null && (
        // El número vive en la mitad cálida, en tinta oscura. Si esa mitad está
        // vacía no hay contraste posible ahí, así que se centra en la celda.
        <span
          className={`absolute inset-x-0 flex items-center justify-center text-[11px] tnum ${
            food ? "top-0 h-[66%] font-semibold text-bg/70" : "inset-y-0 text-text-dim"
          }`}
        >
          {label}
        </span>
      )}
    </span>
  );

  if (!onClick) return <span aria-label={ariaLabel}>{content}</span>;

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className="tap block w-full">
      {content}
    </button>
  );
}
