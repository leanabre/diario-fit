export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-6 py-12">
      <h1 className="font-display text-head">Falta conectar Supabase</h1>
      <p className="text-note text-text-dim">
        Copiá <code className="text-text">.env.local.example</code> a <code className="text-text">.env.local</code> y
        pegá la URL y la anon key de tu proyecto. Después corré{" "}
        <code className="text-text">supabase/schema.sql</code> en el SQL Editor.
      </p>
      <ol className="space-y-2 text-note text-text-dim">
        <li>1. Crear un proyecto en supabase.com</li>
        <li>2. Project Settings → API: copiar URL y anon key</li>
        <li>3. SQL Editor: pegar y correr supabase/schema.sql</li>
        <li>4. Authentication → URL Configuration: agregar http://localhost:3000/auth/callback</li>
      </ol>
    </main>
  );
}
