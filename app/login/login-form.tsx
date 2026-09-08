"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { APP_NAME } from "@/lib/config";
import { authErrorMessage } from "@/lib/auth-errors";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Mail y contraseña, sin mails de por medio. Son dos personas: el link mágico
 * agregaba un rebote por Safari que en el iPhone dejaba la app instalada afuera
 * de la sesión, además de chocar contra el límite de envíos de Supabase.
 */
export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"entrar" | "crear">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const creating = mode === "crear";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || password.length < 6) return;

    setBusy(true);
    setMessage(null);

    const supabase = supabaseBrowser();
    const credentials = { email: email.trim(), password };
    const { error } = creating
      ? await supabase.auth.signUp(credentials)
      : await supabase.auth.signInWithPassword(credentials);

    if (error) {
      setMessage(authErrorMessage(error.message));
      setBusy(false);
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

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
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
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-note text-text-dim">
            Tu contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete={creating ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="al menos 6 caracteres"
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-body outline-none placeholder:text-text-dim/60 focus:border-[#7C5CFF]"
          />
        </div>

        <button
          type="submit"
          disabled={busy || !email.trim() || password.length < 6}
          className="w-full rounded-2xl bg-[#7C5CFF] px-4 py-3.5 text-body font-medium text-white disabled:opacity-50"
        >
          {busy ? (creating ? "Creando…" : "Entrando…") : creating ? "Crear cuenta" : "Entrar"}
        </button>

        {message && <p className="text-note text-food-4">{message}</p>}

        <button
          type="button"
          onClick={() => {
            setMode(creating ? "entrar" : "crear");
            setMessage(null);
          }}
          className="text-note text-text-dim underline underline-offset-4"
        >
          {creating ? "Ya tengo cuenta" : "Es mi primera vez"}
        </button>
      </form>
    </main>
  );
}
