"use client";

import { useEffect, useState } from "react";
import { isSubscribed, pushSupport, subscribeToPush, unsubscribeFromPush, type PushSupport } from "@/lib/push";

const EXPLANATION: Record<PushSupport, string> = {
  ok: "",
  "sin-claves": "Falta configurar las claves VAPID en el servidor.",
  "sin-instalar": "En iPhone el aviso necesita la app agregada a la pantalla de inicio.",
  "sin-soporte": "Este navegador no soporta avisos. Igual te queda el punto en la tab Hoy.",
  bloqueado: "Bloqueaste los avisos en este navegador. Se cambia desde los ajustes del sistema.",
};

export function PushSection({ reminderHour }: { reminderHour: number | null }) {
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupport(pushSupport());
    isSubscribed().then(setOn).catch(() => setOn(false));
  }, []);

  async function toggle() {
    setBusy(true);
    setError(null);

    if (on) {
      await unsubscribeFromPush();
      setOn(false);
    } else {
      const result = await subscribeToPush();
      if (!result.ok) setError(result.error ?? "No se pudo activar");
      setOn(result.ok);
    }
    setBusy(false);
  }

  if (support === null) return null;

  if (support !== "ok") {
    return <p className="text-note text-text-dim">{EXPLANATION[support]}</p>;
  }

  return (
    <div className="space-y-2">
      <button
        onClick={toggle}
        disabled={busy || reminderHour == null}
        role="switch"
        aria-checked={on}
        className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5 text-body disabled:opacity-50"
      >
        Avisarme en el teléfono
        <span className={`h-6 w-11 rounded-full p-0.5 transition-colors ${on ? "bg-accent" : "bg-line"}`}>
          <span className={`block h-5 w-5 rounded-full bg-text transition-transform ${on ? "translate-x-5" : ""}`} />
        </span>
      </button>

      {reminderHour == null && <p className="text-mini text-text-dim">Elegí primero una hora arriba.</p>}
      {error && <p className="text-note text-food-4">{error}</p>}
    </div>
  );
}
