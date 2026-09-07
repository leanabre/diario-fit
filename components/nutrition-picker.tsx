"use client";

import { NOTE_MAX_LENGTH, NUTRITION_SCALE, nutritionLabel } from "@/lib/config";
import { useEffect, useRef, useState } from "react";

type Props = {
  score: number | null;
  note: string | null;
  onScore: (score: number | null) => void;
  onNote: (note: string) => void;
};

export function NutritionPicker({ score, note, onScore, onNote }: Props) {
  const [open, setOpen] = useState(Boolean(note));
  const [draft, setDraft] = useState(note ?? "");
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(note ?? "");
    setOpen(Boolean(note));
  }, [note]);

  function commit() {
    if ((note ?? "") !== draft) onNote(draft);
  }

  return (
    <section className="px-5">
      <h2 className="text-body">¿Cómo comiste?</h2>

      <div className="mt-3 grid grid-cols-5 gap-2.5">
        {NUTRITION_SCALE.map((step) => {
          const active = score === step.value;
          return (
            <button
              key={step.value}
              type="button"
              onClick={() => onScore(active ? null : step.value)}
              aria-label={step.label}
              aria-pressed={active}
              style={{ background: step.color }}
              className={`flex aspect-square w-full items-center justify-center rounded-full font-display text-body tnum transition-transform ${
                active ? "scale-[1.07] ring-2 ring-text/85 ring-offset-2 ring-offset-bg" : ""
              } ${step.value >= 4 ? "text-bg/60" : "text-text/70"}`}
            >
              {step.value}
            </button>
          );
        })}
      </div>

      <p className="mt-2.5 h-5 text-note text-text-dim">{nutritionLabel(score) ?? " "}</p>

      {open ? (
        <div className="mt-1">
          <textarea
            ref={textarea}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, NOTE_MAX_LENGTH))}
            onBlur={commit}
            rows={2}
            placeholder="Algo para acordarte del día"
            className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-note outline-none placeholder:text-text-dim/60 focus:border-line"
          />
          <div className="flex items-center justify-between text-mini text-text-dim">
            <button
              type="button"
              onClick={() => {
                setDraft("");
                onNote("");
                setOpen(false);
              }}
              className="underline underline-offset-4"
            >
              Sacar la nota
            </button>
            <span className="tnum">
              {draft.length}/{NOTE_MAX_LENGTH}
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            requestAnimationFrame(() => textarea.current?.focus());
          }}
          className="mt-1 text-note text-text-dim"
        >
          + agregar nota
        </button>
      )}
    </section>
  );
}
