/**
 * Supabase contesta en inglés y con jerga. Estos son los errores que se cruzan
 * de verdad al entrar, dichos de manera que se entienda qué hacer.
 */
export function authErrorMessage(raw: string): string {
  const text = raw.toLowerCase();

  if (text.includes("invalid login credentials")) {
    return "Mail o contraseña incorrectos.";
  }
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "Ese mail ya tiene cuenta. Entrá con tu contraseña.";
  }
  if (text.includes("password") && text.includes("at least")) {
    return "La contraseña necesita al menos 6 caracteres.";
  }
  if (text.includes("email not confirmed")) {
    return "La cuenta quedó esperando confirmación por mail. Hay que desactivar “Confirm email” en Supabase.";
  }
  if (text.includes("signups not allowed") || text.includes("signup is disabled")) {
    return "Están desactivadas las cuentas nuevas en Supabase.";
  }
  if (text.includes("rate limit") || text.includes("too many requests")) {
    return "Demasiados intentos seguidos. Esperá un momento.";
  }
  if (text.includes("network") || text.includes("fetch")) {
    return "No hay conexión con el servidor. Probá de nuevo en un momento.";
  }
  return raw;
}
