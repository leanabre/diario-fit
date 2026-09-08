"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { APP_NAME } from "@/lib/config";
import { supabaseBrowser } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "verifying">("idle");
  const [showCode, setShowCode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;

    setStatus("sending");
    setMessage(null);
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus("idle");
      setMessage(authErrorMessage(error.message));
      return;
    }
    setStatus("sent");
  }

  /**
   * El código evita salir de la app: en iPhone el link del mail abre en Safari y
   * la PWA instalada guarda la sesión aparte, así que quedarías afuera.
   */
  async function verify(event: React.FormEvent) {
    event.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length < 6) return;

    setStatus("verifying");
    setMessage(null);
    const { error } = await supabaseBrowser().auth.verifyOtp({ email: email.trim(), token, type: "email" });

    if (error) {
      setStatus("sent");
      setMessage(authErrorMessage(error.message));
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-2">
        <h1 className="font-display text-hero">{APP_NAME}</h1>
        <p className="text-note text-text-dim">Cómo comiste y cómo te moviste. Nada más.</p>
      </div>

      {status === "sent" || status === "verifying" ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-body">Te mandamos un mail a {email}.</p>
            <p className="text-note text-text-dim">
              Abrilo desde este mismo teléfono y tocá el link. Con eso entrás.
            </p>
          </div>

          {/*
            El código sólo llega si la plantilla del mail lo incluye, y eso en
            Supabase pide SMTP propio. Mientras tanto el link alcanza, así que
            esto queda como segunda opción y no como el camino principal.
          */}
          {showCode ? (
            <form onSubmit={verify} className="space-y-3 border-t border-line pt-5">
              <label htmlFor="code" className="block text-note text-text-dim">
                Código de 6 dígitos
              </label>
              <input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-center font-display text-num tnum tracking-[0.3em] outline-none placeholder:text-text-dim/40 focus:border-[#7C5CFF]"
              />
              <button
                type="submit"
                disabled={code.length < 6 || status === "verifying"}
                className="w-full rounded-2xl bg-[#7C5CFF] px-4 py-3.5 text-body font-medium text-white disabled:opacity-50"
              >
                {status === "verifying" ? "Entrando…" : "Entrar"}
              </button>
              {message && <p className="text-note text-food-4">{message}</p>}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowCode(true)}
              className="text-note text-text-dim underline underline-offset-4"
            >
              El mail me trajo un código
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setCode("");
              setShowCode(false);
              setMessage(null);
            }}
            className="block text-note text-text-dim underline underline-offset-4"
          >
            Usar otro mail
          </button>
        </div>
      ) : (
        <form onSubmit={send} className="space-y-3">
          <label htmlFor="email" className="block text-note text-text-dim">
            Tu mail
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vos@mail.com"
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-body outline-none placeholder:text-text-dim/60 focus:border-[#7C5CFF]"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-2xl bg-[#7C5CFF] px-4 py-3.5 text-body font-medium text-white disabled:opacity-50"
          >
            {status === "sending" ? "Mandando…" : "Mandame el link"}
          </button>
          {message && <p className="text-note text-food-4">{message}</p>}
          <p className="pt-1 text-mini text-text-dim">Sin contraseña. Llega un mail y listo.</p>
        </form>
      )}
    </main>
  );
}
