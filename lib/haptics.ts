"use client";

/**
 * Feedback háptico donde el navegador lo permita. Safari en iOS todavía no expone
 * la Vibration API: ahí simplemente no pasa nada, sin romper el toque.
 */
export function tap(pattern: number | number[] = 8) {
  if (typeof navigator === "undefined") return;
  const vibrate = (navigator as unknown as { vibrate?: (p: number[]) => boolean }).vibrate;
  try {
    vibrate?.call(navigator, Array.isArray(pattern) ? pattern : [pattern]);
  } catch {
    // silencio
  }
}

export function tapComplete() {
  tap([12, 40, 18]);
}
