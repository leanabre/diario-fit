"use client";

import { useState } from "react";
import { PROFILE_EMOJIS } from "@/lib/config";

/** Cincuenta y pico de emojis a mano, y un campo libre para cualquier otro. */
export function EmojiPicker({
  value,
  onChange,
  label = "Tu emoji",
}: {
  value: string;
  onChange: (emoji: string) => void;
  label?: string;
}) {
  const [custom, setCustom] = useState("");

  return (
    <div>
      <p className="mb-2 text-mini text-text-dim">{label}</p>
      <div className="grid max-h-44 grid-cols-8 gap-1.5 overflow-y-auto rounded-xl bg-bg p-2">
        {PROFILE_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={`tap flex aspect-square items-center justify-center rounded-lg text-body ${
              value === emoji ? "bg-raised ring-1 ring-accent" : ""
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom([...e.target.value].slice(-2).join(""))}
          placeholder="o pegá el que quieras"
          className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-note outline-none placeholder:text-text-dim/60"
        />
        <button
          type="button"
          onClick={() => {
            if (custom.trim()) onChange(custom.trim());
            setCustom("");
          }}
          disabled={!custom.trim()}
          className="tap shrink-0 rounded-xl border border-line px-3 py-2 text-mini disabled:opacity-40"
        >
          Usar
        </button>
      </div>
    </div>
  );
}

/** Paleta sugerida más el selector del sistema, para no limitar a nadie. */
export function ColorPicker({
  value,
  options,
  onChange,
  small,
  label = "Tu color",
}: {
  value: string;
  options: string[];
  onChange: (color: string) => void;
  small?: boolean;
  label?: string;
}) {
  const size = small ? "h-6 w-6" : "h-8 w-8";

  return (
    <div>
      {!small && <p className="mb-2 text-mini text-text-dim">{label}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {options.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={color}
            onClick={() => onChange(color)}
            style={{ background: color }}
            className={`tap ${size} rounded-full ${
              value.toLowerCase() === color.toLowerCase() ? "ring-2 ring-text ring-offset-2 ring-offset-surface" : ""
            }`}
          />
        ))}
        <label
          className={`tap relative ${size} cursor-pointer overflow-hidden rounded-full border border-line`}
          style={{ background: "conic-gradient(#f87171,#fbbf24,#4ade9c,#22d3ee,#60a5fa,#a78bfa,#f87171)" }}
          aria-label="Elegir otro color"
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}
