/** Convierte "#4ADE9C" en "rgb(74 222 156 / 0.16)". Los colores vienen de la base. */
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const n = Number.parseInt(clean, 16);
  if (Number.isNaN(n)) return hex;
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${alpha})`;
}
