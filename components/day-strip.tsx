"use client";

import { dayOfMonth, parseKey, type DateKey } from "@/lib/dates";
import type { Day } from "@/lib/types";
import { DayCell, type ColorFor } from "./day-cell";

const INITIALS = ["D", "L", "M", "M", "J", "V", "S"];

type Props = {
  dates: DateKey[];
  days: Map<DateKey, Day>;
  selected: DateKey;
  igniteDate: DateKey | null;
  colorFor: ColorFor;
  onSelect: (date: DateKey) => void;
};

/** La ventana editable de 7 días. Misma celda partida que el calendario del mes. */
export function DayStrip({ dates, days, selected, igniteDate, colorFor, onSelect }: Props) {
  return (
    <div className="grid grid-cols-7 gap-1.5 px-5">
      {dates.map((date) => (
        <div key={date} className="space-y-1">
          <div className="text-center text-mini text-text-dim">{INITIALS[parseKey(date).getDay()]}</div>
          <DayCell
            day={days.get(date)}
            colorFor={colorFor}
            label={dayOfMonth(date)}
            selected={date === selected}
            ignite={date === igniteDate}
            onClick={() => onSelect(date)}
            ariaLabel={date}
          />
        </div>
      ))}
    </div>
  );
}
