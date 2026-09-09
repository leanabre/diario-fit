"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconBack } from "@/components/icons";
import { ColorPicker, EmojiPicker } from "@/components/pickers";
import { PushSection } from "@/components/push-section";
import { TeamSection } from "@/components/team-section";
import { ACCENT_COLORS, PROFILE_EMOJIS, TRAINING_PALETTE } from "@/lib/config";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Profile, Team, TrainingType } from "@/lib/types";

type Props = { profile: Profile; trainingTypes: TrainingType[]; team: Team | null; partner: Profile | null };

export function SettingsScreen({ profile, trainingTypes, team, partner }: Props) {
  const router = useRouter();
  const [me, setMe] = useState(profile);
  const [types, setTypes] = useState(trainingTypes);
  const [newLabel, setNewLabel] = useState("");
  const [openColor, setOpenColor] = useState<string | null>(null);

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
      <header className="safe-top flex items-center gap-1 px-3 pb-4 pt-3">
        <Link href="/" aria-label="Volver" className="tap p-2 text-text-dim">
          <IconBack />
        </Link>
        <h1 className="font-display text-head">Ajustes</h1>
      </header>

      <div className="space-y-8 px-5">
        <Section title="Vos">
          <div className="card space-y-4 p-4">
            <input
              value={me.display_name}
              onChange={(e) => setMe((prev) => ({ ...prev, display_name: e.target.value }))}
              onBlur={(e) => patchProfile({ display_name: e.target.value.trim() || me.display_name })}
              className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-body outline-none focus:border-accent"
            />

            <EmojiPicker value={me.emoji} onChange={(emoji) => patchProfile({ emoji })} />
            <ColorPicker
              value={me.accent_color}
              options={ACCENT_COLORS}
              onChange={(accent_color) => patchProfile({ accent_color })}
            />
          </div>
        </Section>

        <Section title="Meta semanal" hint="Entrenamientos por semana.">
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((goal) => (
              <button
                key={goal}
                onClick={() => patchProfile({ weekly_training_goal: goal })}
                className={`tap flex-1 rounded-2xl border py-3 font-display text-head tnum ${
                  me.weekly_training_goal === goal
                    ? "border-accent bg-raised text-text"
                    : "border-line bg-surface text-text-dim"
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
              <div key={type.id} className="card p-4">
                <div className="flex items-center gap-3">
                  {/* La paleta vive detrás del punto: cuatro tipos con trece
                      círculos cada uno tapaban toda la pantalla. */}
                  <button
                    onClick={() => setOpenColor((id) => (id === type.id ? null : type.id))}
                    aria-label={`Opciones de ${type.label}`}
                    className="tap h-6 w-6 shrink-0 rounded-full ring-1 ring-inset ring-white/15"
                    style={{ background: type.color }}
                  />
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
                    className="tap shrink-0 text-mini text-text-dim underline underline-offset-4"
                  >
                    {type.is_active ? "Desactivar" : "Activar"}
                  </button>
                </div>

                {openColor === type.id && (
                  <div className="fade-up mt-3 space-y-3 border-t border-line pt-3">
                    <ColorPicker
                      value={type.color}
                      options={TRAINING_PALETTE}
                      small
                      onChange={(color) => patchType(type.id, { color })}
                    />
                    <button
                      onClick={() => patchType(type.id, { tracks_distance: !type.tracks_distance })}
                      role="switch"
                      aria-checked={type.tracks_distance}
                      className="tap flex w-full items-center justify-between text-note"
                    >
                      <span className="text-text-dim">Preguntar kilómetros</span>
                      <span
                        className={`h-5 w-9 rounded-full p-0.5 ${type.tracks_distance ? "bg-accent" : "bg-line"}`}
                      >
                        <span
                          className={`block h-4 w-4 rounded-full bg-text transition-transform ${
                            type.tracks_distance ? "translate-x-4" : ""
                          }`}
                        />
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Pilates, natación, lo que sea"
              className="min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 py-3 text-note outline-none placeholder:text-text-dim/60 focus:border-accent"
            />
            <button onClick={addType} className="tap shrink-0 rounded-2xl border border-line px-4 text-note">
              Agregar
            </button>
          </div>
        </Section>

        <Section title="Recordatorio" hint="Sólo llega si el día está sin cargar.">
          <select
            value={me.reminder_hour ?? ""}
            onChange={(e) => patchProfile({ reminder_hour: e.target.value === "" ? null : Number(e.target.value) })}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-body outline-none"
          >
            <option value="">Sin recordatorio</option>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
          <div className="mt-3">
            <PushSection reminderHour={me.reminder_hour} />
          </div>
        </Section>

        <Section title="Compartir notas" hint="Lo demás siempre se ve entre los dos.">
          <Toggle on={me.share_notes} onChange={(share_notes) => patchProfile({ share_notes })} label="Que vea mis notas" />
        </Section>

        <Section title="Vincular pareja" hint="Un equipo de dos: cada uno con sus metas y sus rachas.">
          <div id="equipo" className="scroll-mt-6">
            <TeamSection team={team} partner={partner} />
          </div>
        </Section>

        <Section title="Tus datos">
          <div className="space-y-2.5">
            <Link href="/logros" className="tap block rounded-2xl border border-line bg-surface px-4 py-3.5 text-body">
              Ver logros
            </Link>
            <a href="/api/exportar" className="tap block rounded-2xl border border-line bg-surface px-4 py-3.5 text-body">
              Exportar todo a CSV
            </a>
          </div>
        </Section>

        <form action="/auth/signout" method="post">
          <button type="submit" className="tap w-full rounded-2xl border border-line py-3.5 text-body text-text-dim">
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
      className="tap flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5 text-body"
    >
      {label}
      <span className={`h-6 w-11 rounded-full p-0.5 transition-colors ${on ? "bg-accent" : "bg-line"}`}>
        <span className={`block h-5 w-5 rounded-full bg-text transition-transform ${on ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}
