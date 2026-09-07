"use client";

/** La clave VAPID viaja en base64url y el navegador la quiere en bytes. */
function toUint8Array(base64: string): Uint8Array {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export type PushSupport = "ok" | "sin-soporte" | "sin-instalar" | "bloqueado" | "sin-claves";

export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "sin-soporte";
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return "sin-claves";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    // En iPhone el push sólo existe con la app agregada a la pantalla de inicio.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isIOS && !(window.navigator as Navigator & { standalone?: boolean }).standalone
      ? "sin-instalar"
      : "sin-soporte";
  }
  if (Notification.permission === "denied") return "bloqueado";
  return "ok";
}

export async function isSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  return Boolean(await registration.pushManager.getSubscription());
}

export async function subscribeToPush(): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) return { ok: false, error: "Faltan las claves VAPID" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, error: "No diste permiso para las notificaciones" };

  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toUint8Array(key) as BufferSource,
    }));

  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });

  if (!response.ok) return { ok: false, error: "No se pudo registrar el recordatorio" };
  return { ok: true };
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription?.endpoint ?? null }),
  });

  await subscription?.unsubscribe();
}
