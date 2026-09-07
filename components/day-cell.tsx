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
  /** El único motion orquestado: la celda se enciende al completarse el día. */
  ignite?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
};

/**
 * La celda partida: arriba la alimentación (cálido), abajo el entrenamiento (frío).
 * Sin cargar, sólo el contorno. Es la misma pieza en el strip de Hoy y en el mes.
 */
export function DayCell({ day, colorFor, label, selected, muted, ignite, onClick, ariaLabel }: Props) {
  const top = nutritionColor(day?.nutritionScore);
  const bottom = day?.restDay ? [REST_COLOR] : (day?.trainingTypeIds ?? []).map(colorFor);
  const filled = Boolean(top) || bottom.length > 0;

  const content = (
    <span
      className={`relative block aspect-square w-full overflow-hidden rounded-cell border transition-colors ${
        filled ? "border-transparent" : "border-line"
      } ${selected ? "ring-2 ring-text/80 ring-offset-2 ring-offset-bg" : ""} ${muted ? "opacity-35" : ""} ${
        ignite ? "cell-ignite" : ""
      }`}
      style={{ background: filled ? "rgba(255,255,255,0.04)" : "transparent" }}
    >
      {top && <span className="absolute inset-x-0 top-0 h-1/2" style={{ background: top }} />}
      {bottom.length > 0 && (
        <span className="absolute inset-x-0 bottom-0 flex h-1/2">
          {bottom.map((color, i) => (
            <span key={`${color}-${i}`} className="flex-1" style={{ background: color }} />
          ))}
        </span>
      )}
      {label != null && (
        // Con alimentación cargada el número vive en la mitad cálida, en tinta oscura;
        // si esa mitad está vacía no hay contraste posible ahí, así que va al centro.
        <span
          className={`absolute inset-x-0 flex items-center justify-center text-[11px] tnum ${
            top ? "top-0 h-1/2 font-medium text-bg/75" : "inset-y-0 text-text-dim"
          }`}
        >
          {label}
        </span>
      )}
    </span>
  );

  if (!onClick) return <span aria-label={ariaLabel}>{content}</span>;

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className="block w-full">
      {content}
    </button>
  );
}
