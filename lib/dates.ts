import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfISOWeek,
  endOfMonth,
  format,
  getISOWeek,
  getISOWeekYear,
  parse,
  startOfISOWeek,
  startOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { DAY_CUTOFF_HOUR, EDIT_WINDOW_DAYS, TIMEZONE } from "./config";

/**
 * Una fecha civil "yyyy-MM-dd". Nunca un timestamp: el día de la app no tiene hora.
 * La única conversión de zona horaria del sistema pasa por todayKey().
 */
export type DateKey = string;

/** Fecha civil -> Date local a medianoche, para aritmética de calendario. */
export function parseKey(key: DateKey): Date {
  return parse(key, "yyyy-MM-dd", new Date());
}

export function toKey(date: Date): DateKey {
  return format(date, "yyyy-MM-dd");
}

/**
 * El día lógico de hoy en Buenos Aires, con el corte a las 04:00:
 * a la 1 AM del viernes seguís cargando el jueves.
 */
export function todayKey(now: Date = new Date()): DateKey {
  const inBA = toZonedTime(now, TIMEZONE);
  return toKey(addHours(inBA, -DAY_CUTOFF_HOUR));
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3600_000);
}

export function shiftKey(key: DateKey, days: number): DateKey {
  return toKey(addDays(parseKey(key), days));
}

export function daysBetween(a: DateKey, b: DateKey): number {
  return differenceInCalendarDays(parseKey(a), parseKey(b));
}

/** Se puede editar hoy y los 6 días anteriores. Nunca el futuro. */
export function isEditable(key: DateKey, today: DateKey = todayKey()): boolean {
  const delta = daysBetween(today, key);
  return delta >= 0 && delta < EDIT_WINDOW_DAYS;
}

export function isFuture(key: DateKey, today: DateKey = todayKey()): boolean {
  return daysBetween(today, key) < 0;
}

/** Los días editables, del más viejo al más nuevo. Es la ventana del swipe en Hoy. */
export function editableWindow(today: DateKey = todayKey()): DateKey[] {
  return Array.from({ length: EDIT_WINDOW_DAYS }, (_, i) => shiftKey(today, i - (EDIT_WINDOW_DAYS - 1)));
}

// ── Semanas ISO (arrancan lunes) ────────────────────────────────

export function weekStartKey(key: DateKey): DateKey {
  return toKey(startOfISOWeek(parseKey(key)));
}

/** Identificador estable de semana ISO, "2026-W37". */
export function isoWeekKey(key: DateKey): string {
  const d = parseKey(key);
  return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`;
}

export function weekDays(startKey: DateKey): DateKey[] {
  return Array.from({ length: 7 }, (_, i) => shiftKey(startKey, i));
}

// ── Formato para la UI (rioplatense, sentence case) ─────────────

export function formatWeekday(key: DateKey): string {
  return format(parseKey(key), "EEEE d", { locale: es });
}

export function formatMonth(key: DateKey): string {
  return format(parseKey(key), "MMMM", { locale: es });
}

export function formatMonthYear(key: DateKey): string {
  return format(parseKey(key), "MMMM yyyy", { locale: es });
}

export function formatShort(key: DateKey): string {
  return format(parseKey(key), "d 'de' MMMM", { locale: es });
}

export function dayOfMonth(key: DateKey): number {
  return parseKey(key).getDate();
}

/** Título del día para Hoy: "hoy", "ayer" o el nombre del día. */
export function relativeDayLabel(key: DateKey, today: DateKey = todayKey()): string {
  const delta = daysBetween(today, key);
  if (delta === 0) return "hoy";
  if (delta === 1) return "ayer";
  return formatWeekday(key);
}

// ── Mes ─────────────────────────────────────────────────────────

export function monthStartKey(anchor: DateKey): DateKey {
  return toKey(startOfMonth(parseKey(anchor)));
}

export function shiftMonth(anchor: DateKey, delta: number): DateKey {
  return toKey(addMonths(startOfMonth(parseKey(anchor)), delta));
}

/** Los días del mes, en orden. */
export function monthDates(anchor: DateKey): DateKey[] {
  const start = startOfMonth(parseKey(anchor));
  return eachDayOfInterval({ start, end: endOfMonth(start) }).map(toKey);
}

/**
 * Grilla del mes alineada a lunes. Las posiciones fuera del mes vienen en null
 * para no romper las columnas.
 */
export function monthGrid(anchor: DateKey): (DateKey | null)[] {
  const start = startOfMonth(parseKey(anchor));
  const end = endOfMonth(start);
  const cells = eachDayOfInterval({ start: startOfISOWeek(start), end: endOfISOWeek(end) }).map(toKey);
  const first = toKey(start);
  const last = toKey(end);
  return cells.map((key) => (key < first || key > last ? null : key));
}
