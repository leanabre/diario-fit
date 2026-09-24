import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * Cliente con service role: sólo para el cron de recordatorios, que necesita
 * mirar a todos los usuarios. Nunca se importa desde un componente del cliente.
 */
export function supabaseAdmin() {
  // "secret" en el panel nuevo, "service_role" en el viejo.
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) return null;

  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Un pedido mínimo a la base, sin sesión. Existe para que el proyecto no se
 * considere inactivo: en el plan gratis Supabase pausa los proyectos a los 7
 * días sin pedidos, y cuando eso pasa le saca el dominio y la app se queda sin
 * backend. Un toque por día alcanza.
 */
export async function pingSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await client.from("profiles").select("id", { head: true, count: "exact" });
    return true;
  } catch {
    return false;
  }
}
