import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

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
