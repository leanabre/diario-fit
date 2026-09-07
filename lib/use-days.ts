"use client";

import { useCallback, useRef, useState } from "react";
import type { DateKey } from "./dates";
import { tap, tapComplete } from "./haptics";
import { persistDay } from "./mutations";
import { emptyDay, isLogged, type Day } from "./types";

const IGNITE_MS = 700;

/**
 * Estado optimista del histórico. Cada toque actualiza la memoria y dispara el
 * guardado: no hay botón "Guardar" en ninguna pantalla.
 */
export function useDays(userId: string, initial: Day[]) {
  const [days, setDays] = useState(() => new Map(initial.map((d) => [d.date, d])));
  const [igniteDate, setIgniteDate] = useState<DateKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(days);
  latest.current = days;

  const update = useCallback(
    (date: DateKey, patch: Partial<Day>) => {
      const current = latest.current.get(date) ?? emptyDay(date);
      const next: Day = { ...current, ...patch };
      const completed = !isLogged(current) && isLogged(next);

      setDays((prev) => new Map(prev).set(date, next));
      setError(null);

      if (completed) {
        tapComplete();
        setIgniteDate(date);
        setTimeout(() => setIgniteDate((d) => (d === date ? null : d)), IGNITE_MS);
      } else {
        tap();
      }

      persistDay(userId, next)
        .then(({ entryId }) => {
          setDays((prev) => {
            const stored = prev.get(date);
            if (!stored || stored.entryId === entryId) return prev;
            return new Map(prev).set(date, { ...stored, entryId });
          });
        })
        .catch(() => setError("No se pudo guardar. Probá de nuevo."));
    },
    [userId],
  );

  const dayAt = useCallback((date: DateKey): Day => days.get(date) ?? emptyDay(date), [days]);

  return { days, dayAt, update, igniteDate, error };
}
