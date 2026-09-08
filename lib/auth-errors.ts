/**
 * Supabase contesta en inglés y con jerga. Estos son los errores que se cruzan
 * de verdad al entrar, dichos de manera que se entienda qué hacer.
 */
export function authErrorMessage(raw: string): string {
  const text = raw.toLowerCase();

  if (text.includes("rate limit") || text.includes("too many requests")) {
    return "Se agotaron los mails por ahora. Supabase permite pocos por hora con el correo por defecto: esperá un rato o configurá SMTP propio.";
  }
  if (text.includes("expired") || text.includes("invalid") || text.includes("not found")) {
    return "Ese link o código ya no sirve. Pedí uno nuevo.";
  }
  if (text.includes("email") && text.includes("valid")) {
    return "Revisá el mail, parece que tiene algo raro.";
  }
  if (text.includes("network") || text.includes("fetch")) {
    return "No hay conexión con el servidor. Probá de nuevo en un momento.";
  }
  return raw;
}
