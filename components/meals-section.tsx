"use client";

import { useEffect, useRef, useState } from "react";
import { IconCamera, IconTrash } from "./icons";
import type { DateKey } from "@/lib/dates";
import { tap, tapComplete } from "@/lib/haptics";
import {
  MEAL_MOMENTS,
  MEAL_NOTE_MAX,
  addMeal,
  listMeals,
  momentLabel,
  removeMeal,
  suggestMoment,
  updateMeal,
  type Meal,
  type MealMoment,
} from "@/lib/meals";

type Props = { userId: string; date: DateKey; editable: boolean };

/**
 * Registro suelto de comidas: foto y comentario cuando pinta, sin casilleros
 * que llenar. El puntaje del 1 al 5 sigue siendo lo que define el día; esto es
 * una capa opcional encima y no toca rachas ni puntaje.
 */
export function MealsSection({ userId, date, editable }: Props) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Meal | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listMeals(userId, date)
      .then((rows) => alive && setMeals(rows))
      .catch(() => alive && setError("No se pudieron cargar las comidas"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId, date]);

  async function onFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const meal = await addMeal(userId, date, { moment: suggestMoment(), note: null, file });
      setMeals((prev) => [...prev, meal]);
      tapComplete();
    } catch {
      setError("No se pudo subir la foto. Probá de nuevo.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function addNoteOnly() {
    setBusy(true);
    setError(null);
    try {
      const meal = await addMeal(userId, date, { moment: suggestMoment(), note: null, file: null });
      setMeals((prev) => [...prev, meal]);
      setOpen(meal);
      tap();
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  function patch(id: string, changes: Partial<Meal>) {
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m)));
    setOpen((prev) => (prev && prev.id === id ? { ...prev, ...changes } : prev));
  }

  async function discard(meal: Meal) {
    setMeals((prev) => prev.filter((m) => m.id !== meal.id));
    setOpen(null);
    await removeMeal(meal).catch(() => setError("No se pudo borrar"));
  }

  if (!editable && meals.length === 0 && !loading) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between px-5">
        <h2 className="text-body">Comidas del día</h2>
        {meals.length > 0 && <span className="text-mini text-text-dim tnum">{meals.length}</span>}
      </div>

      <div className="flex gap-2.5 overflow-x-auto px-5 pb-1">
        {meals.map((meal) => (
          <button
            key={meal.id}
            onClick={() => setOpen(meal)}
            className="tap relative h-[74px] w-[74px] shrink-0 overflow-hidden rounded-2xl border border-line bg-surface"
          >
            {meal.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={meal.photoUrl} alt={momentLabel(meal.moment)} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center px-1.5 text-center text-[11px] leading-tight text-text-dim">
                {meal.note?.slice(0, 28) || momentLabel(meal.moment)}
              </span>
            )}
            {meal.photoUrl && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 pb-1 pt-3 text-[10px] text-white">
                {momentLabel(meal.moment)}
              </span>
            )}
          </button>
        ))}

        {editable && (
          <button
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            aria-label="Agregar foto de comida"
            className="tap flex h-[74px] w-[74px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line text-text-dim disabled:opacity-50"
          >
            <IconCamera />
            <span className="text-[11px]">{busy ? "…" : "foto"}</span>
          </button>
        )}
      </div>

      {editable && (
        <div className="px-5">
          <button onClick={addNoteOnly} disabled={busy} className="tap text-note text-text-dim disabled:opacity-50">
            + anotar sin foto
          </button>
        </div>
      )}

      {error && <p className="px-5 text-note text-food-4">{error}</p>}

      {open && (
        <MealSheet
          meal={open}
          editable={editable}
          onClose={() => setOpen(null)}
          onPatch={(changes) => {
            patch(open.id, changes);
            updateMeal(open.id, changes);
          }}
          onDelete={() => discard(open)}
        />
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </section>
  );
}

function MealSheet({
  meal,
  editable,
  onClose,
  onPatch,
  onDelete,
}: {
  meal: Meal;
  editable: boolean;
  onClose: () => void;
  onPatch: (changes: { moment?: MealMoment; note?: string | null }) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(meal.note ?? "");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/70" />

      <div className="sheet-in safe-bottom relative mx-auto max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-line bg-bg pt-2">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />

        {meal.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meal.photoUrl} alt="" className="mx-5 max-h-[46dvh] w-[calc(100%-2.5rem)] rounded-2xl object-contain" />
        )}

        <div className="space-y-5 px-5 pb-8 pt-5">
          {editable ? (
            <div className="flex flex-wrap gap-2">
              {MEAL_MOMENTS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => onPatch({ moment: m.key })}
                  className={`tap rounded-full border px-3.5 py-1.5 text-note ${
                    meal.moment === m.key ? "border-accent bg-raised text-text" : "border-line text-text-dim"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-note text-text-dim">{momentLabel(meal.moment)}</p>
          )}

          {editable ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MEAL_NOTE_MAX))}
              onBlur={() => draft !== (meal.note ?? "") && onPatch({ note: draft.trim() || null })}
              rows={2}
              placeholder="Qué comiste, cómo te cayó, lo que quieras"
              className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-note outline-none placeholder:text-text-dim/60 focus:border-accent"
            />
          ) : (
            meal.note && <p className="text-body">{meal.note}</p>
          )}

          <div className="flex items-center justify-between">
            {editable ? (
              <button onClick={onDelete} className="tap flex items-center gap-1.5 text-note text-food-4">
                <IconTrash />
                Borrar
              </button>
            ) : (
              <span />
            )}
            <button onClick={onClose} className="tap text-note text-text-dim">
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
