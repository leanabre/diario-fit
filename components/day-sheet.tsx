"use client";

import { useEffect } from "react";
import { REST_COLOR, nutritionColor, nutritionLabel } from "@/lib/config";
import { formatShort, isEditable, type DateKey } from "@/lib/dates";
import type { Day, TrainingType } from "@/lib/types";
import { NutritionPicker } from "./nutrition-picker";
import { TrainingPicker } from "./training-picker";

type Props = {
  date: DateKey;
  day: Day;
  today: DateKey;
  trainingTypes: TrainingType[];
  onUpdate: (patch: Partial<Day>) => void;
  onClose: () => void;
};

/** Hoja inferior del calendario: editable dentro de la ventana, sólo lectura afuera. */
export function DaySheet({ date, day, today, trainingTypes, onUpdate, onClose }: Props) {
  const editable = isEditable(date, today);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/55" />

      <div className="sheet-in safe-bottom relative mx-auto max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-line bg-bg pt-2">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />

        <div className="flex items-baseline justify-between px-5 pb-4">
          <h2 className="font-display text-head">{formatShort(date)}</h2>
          <button onClick={onClose} className="text-note text-text-dim">
            Listo
          </button>
        </div>

        {editable ? (
          <div className="space-y-8 pb-8">
            <NutritionPicker
              score={day.nutritionScore}
              note={day.nutritionNote}
              onScore={(nutritionScore) => onUpdate({ nutritionScore })}
              onNote={(note) => onUpdate({ nutritionNote: note || null })}
            />
            <TrainingPicker
              types={trainingTypes.filter((t) => t.is_active || day.trainingTypeIds.includes(t.id))}
              selected={day.trainingTypeIds}
              restDay={day.restDay}
              onToggleType={(id) =>
                onUpdate({
                  restDay: false,
                  trainingTypeIds: day.trainingTypeIds.includes(id)
                    ? day.trainingTypeIds.filter((x) => x !== id)
                    : [...day.trainingTypeIds, id],
                })
              }
              onToggleRest={() =>
                onUpdate(day.restDay ? { restDay: false } : { restDay: true, trainingTypeIds: [] })
              }
            />
          </div>
        ) : (
          <ReadOnlyDay day={day} trainingTypes={trainingTypes} />
        )}
      </div>
    </div>
  );
}

function ReadOnlyDay({ day, trainingTypes }: { day: Day; trainingTypes: TrainingType[] }) {
  const label = nutritionLabel(day.nutritionScore);
  const trainings = day.restDay
    ? [{ id: "rest", label: "Descanso", color: REST_COLOR }]
    : day.trainingTypeIds
        .map((id) => trainingTypes.find((t) => t.id === id))
        .filter((t): t is TrainingType => Boolean(t));

  return (
    <div className="space-y-6 px-5 pb-9">
      <div>
        <p className="text-note text-text-dim">Alimentación</p>
        {label ? (
          <p className="mt-1.5 flex items-center gap-2 text-body">
            <span
              className="inline-block h-3.5 w-3.5 rounded-full"
              style={{ background: nutritionColor(day.nutritionScore) ?? "transparent" }}
            />
            {label}
          </p>
        ) : (
          <p className="mt-1.5 text-body text-text-dim">Sin cargar</p>
        )}
      </div>

      <div>
        <p className="text-note text-text-dim">Entrenamiento</p>
        {trainings.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {trainings.map((t) => (
              <span
                key={t.id}
                className="rounded-full px-3 py-1.5 text-note"
                style={{ background: t.color, color: "#151329" }}
              >
                {t.label}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1.5 text-body text-text-dim">Sin cargar</p>
        )}
      </div>

      {day.nutritionNote && (
        <div>
          <p className="text-note text-text-dim">Nota</p>
          <p className="mt-1.5 text-body">{day.nutritionNote}</p>
        </div>
      )}

      <p className="text-mini text-text-dim">Pasaron más de 7 días: este día ya no se edita.</p>
    </div>
  );
}
