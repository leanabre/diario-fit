"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ColorPicker, EmojiPicker } from "@/components/pickers";
import { ACCENT_COLORS, DEFAULT_WEEKLY_GOAL, PROFILE_EMOJIS } from "@/lib/config";
import { supabaseBrowser } from "@/lib/supabase/client";

export function OnboardingForm({ userId, defaultName }: { userId: string; defaultName: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [emoji, setEmoji] = useState(PROFILE_EMOJIS[0]);
  const [color, setColor] = useState(ACCENT_COLORS[0]);
  const [goal, setGoal] = useState(DEFAULT_WEEKLY_GOAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);

    const { error } = await supabaseBrowser().from("profiles").insert({
      id: userId,
      display_name: name.trim(),
      emoji,
      accent_color: color,
      weekly_training_goal: goal,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-7 px-6 py-12">
      <div className="space-y-2">
        <h1 className="font-display text-head">Contame quién sos</h1>
        <p className="text-note text-text-dim">Se cambia todo después, en Ajustes.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-note text-text-dim">
            Tu nombre
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-body outline-none focus:border-accent"
          />
        </div>

        <EmojiPicker value={emoji} onChange={setEmoji} />

        <ColorPicker value={color} options={ACCENT_COLORS} onChange={setColor} />

        <div className="space-y-2">
          <span className="block text-note text-text-dim">Entrenamientos por semana</span>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setGoal(option)}
                className={`flex-1 rounded-2xl border py-3 font-display text-head tnum ${
                  goal === option ? "border-transparent bg-line" : "border-line bg-surface"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="tap w-full rounded-2xl bg-accent px-4 py-3.5 text-body font-medium text-white disabled:opacity-50"
        >
          {saving ? "Creando…" : "Empezar"}
        </button>
        {error && <p className="text-note text-food-4">{error}</p>}
      </form>
    </main>
  );
}
