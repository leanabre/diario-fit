"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconBack } from "@/components/icons";
import { ACCENT_COLORS, PROFILE_EMOJIS, TRAINING_PALETTE } from "@/lib/config";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Profile, Team, TrainingType } from "@/lib/types";
import { TeamSection } from "@/components/team-section";
import { PushSection } from "@/components/push-section";
import Link from "next/link";

type Props = { profile: Profile; trainingTypes: TrainingType[]; team: Team | null; partner: Profile | null };

export function SettingsScreen({ profile, trainingTypes, team, partner }: Props) {
  const router = useRouter();
  const [me, setMe] = useState(profile);
  const [types, setTypes] = useState(trainingTypes);
  const [newLabel, setNewLabel] = useState("");

  async function patchProfile(patch: Partial<Profile>) {
    setMe((prev) => ({ ...prev, ...patch }));
    await supabaseBrowser().from("profiles").update(patch).eq("id", profile.id);
    router.refresh();
  }

  async function patchType(id: string, patch: Partial<TrainingType>) {
    setTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    await supabaseBrowser().from("training_types").update(patch).eq("id", id);
    router.refresh();
  }

  async function addType() {
    const label = newLabel.trim();
    if (!label) return;

    const base = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let key = base || "tipo";
    let n = 2;
    while (types.some((t) => t.key === key)) key = `${base}-${n++}`;

    const { data } = await supabaseBrowser()
      .from("training_types")
      .insert({
        user_id: profile.id,
        key,
        label,
        color: TRAINING_PALETTE[types.length % TRAINING_PALETTE.length],
        icon: key,
        sort_order: types.length,
      })
      .select("*")
      .single();

    if (data) setTypes((prev) => [...prev, data as TrainingType]);
    setNewLabel("");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col pb-6">
      <header className="safe-top flex items-center gap-2 px-3 pb-4 pt-3">
        <Link href="/" aria-label="Volver" className="p-2 text-text-dim">
          <IconBack />
        </Link>
        <h1 className="font-display text-head">Ajustes</h1>
      </header>

      <div className="space-y-9 px-5">
        <Section title="Vos">
          <input
            value={me.display_name}
            onChange={(e) => setMe((prev) => ({ ...prev, display_name: e.target.value }))}
            onBlur={(e) => patchProfile({ display_name: e.target.value.trim() || me.display_name })}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-body outline-none focus:border-[#7C5CFF]"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {PROFILE_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => patchProfile({ emoji })}
                className={`h-10 w-10 rounded-full border text-body ${
                  me.emoji === emoji ? "border-transparent bg-line" : "border-line bg-surface"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color}
                aria-label={color}
                onClick={() => patchProfile({ accent_color: color })}
                style={{ background: color }}
                className={`h-8 w-8 rounded-full ${
                  me.accent_color === color ? "ring-2 ring-text ring-offset-2 ring-offset-bg" : ""
                }`}
              />
            ))}
          </div>
        </Section>

        <Section title="Meta semanal" hint="Entrenamientos por semana.">
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((goal) => (
              <button
                key={goal}
                onClick={() => patchProfile({ weekly_training_goal: goal })}
                className={`flex-1 rounded-2xl border py-3 font-display text-head tnum ${
                  me.weekly_training_goal === goal ? "border-transparent bg-line" : "border-line bg-surface"
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Tipos de entrenamiento" hint="Son tuyos: no aparecen en la lista del otro.">
          <div className="space-y-2.5">
            {types.map((type) => (
              <div key={type.id} className="rounded-2xl border border-line bg-surface p-3">
                <div className="flex items-center gap-3">
                  <input
                    value={type.label}
                    onChange={(e) =>
                      setTypes((prev) => prev.map((t) => (t.id === type.id ? { ...t, label: e.target.value } : t)))
                    }
                    onBlur={(e) => patchType(type.id, { label: e.target.value.trim() || type.label })}
                    className={`min-w-0 flex-1 bg-transparent text-body outline-none ${
                      type.is_active ? "" : "text-text-dim line-through"
                    }`}
                  />
                  <button
                    onClick={() => patchType(type.id, { is_active: !type.is_active })}
                    className="shrink-0 text-mini text-text-dim underline underline-offset-4"
                  >
                    {type.is_active ? "Desactivar" : "Activar"}
                  </button>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {TRAINING_PALETTE.map((color) => (
                    <button
                      key={color}
                      aria-label={color}
                      onClick={() => patchType(type.id, { color })}
                      style={{ background: color }}
                      className={`h-6 w-6 rounded-full ${
                        type.color === color ? "ring-2 ring-text ring-offset-2 ring-offset-surface" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Pilates, natación, lo que sea"
              className="min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 py-3 text-note outline-none placeholder:text-text-dim/60"
            />
            <button onClick={addType} className="shrink-0 rounded-2xl border border-line px-4 text-note">
              Agregar
            </button>
          </div>
        </Section>

        <Section title="Recordatorio" hint="Sólo llega si el día está sin cargar.">
          <div className="flex items-center gap-3">
            <select
              value={me.reminder_hour ?? ""}
              onChange={(e) => patchProfile({ reminder_hour: e.target.value === "" ? null : Number(e.target.value) })}
              className="flex-1 rounded-2xl border border-line bg-surface px-4 py-3 text-body outline-none"
            >
              <option value="">Sin recordatorio</option>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3">
            <PushSection reminderHour={me.reminder_hour} />
          </div>
        </Section>

        <Section title="Compartir notas" hint="Lo demás siempre se ve entre los dos.">
          <Toggle
            on={me.share_notes}
            onChange={(share_notes) => patchProfile({ share_notes })}
            label="Que vea mis notas"
          />
        </Section>

        <Section title="Vincular pareja" hint="Un equipo de dos: cada uno con sus metas y sus rachas.">
          <div id="equipo" className="scroll-mt-6">
            <TeamSection team={team} partner={partner} />
          </div>
        </Section>

        <Section title="Tus datos">
          <div className="space-y-2.5">
            <Link
              href="/logros"
              className="block rounded-2xl border border-line bg-surface px-4 py-3.5 text-body"
            >
              Ver logros
            </Link>
            <a
              href="/api/exportar"
              className="block rounded-2xl border border-line bg-surface px-4 py-3.5 text-body"
            >
              Exportar todo a CSV
            </a>
          </div>
        </Section>

        <form action="/auth/signout" method="post">
          <button type="submit" className="w-full rounded-2xl border border-line py-3.5 text-body text-text-dim">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-body">{title}</h2>
      {hint && <p className="mb-3 mt-0.5 text-mini text-text-dim">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5 text-body"
    >
      {label}
      <span className={`h-6 w-11 rounded-full p-0.5 transition-colors ${on ? "bg-[#7C5CFF]" : "bg-line"}`}>
        <span className={`block h-5 w-5 rounded-full bg-text transition-transform ${on ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}
