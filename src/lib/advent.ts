// ============================================================
// Calendario de Adviento — shared types + date logic (client-safe).
//
// 12 drawers, each tied to a December date. A drawer opens at 00:00
// El Salvador time (UTC-6, no DST) on its date. "Today" is ALWAYS computed
// in America/El_Salvador — Vercel runs in UTC, so a plain new Date() would
// open tomorrow's drawer at 6 PM local time.
//
// Display dates use fixed month/weekday tables instead of Intl so server
// and browser render the exact same string (no hydration #418).
// ============================================================

export const ADVENT_TZ = "America/El_Salvador";
export const ADVENT_BUCKET = "advent";
export const ADVENT_DAYS = 12;
export const ADVENT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ADVENT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AdventImageType = (typeof ADVENT_IMAGE_TYPES)[number];

export type AdventState = "locked" | "today" | "past";

/** One drawer as the public page sees it. Title, description and image are
 *  null for locked drawers — the server never sends them early. */
export interface AdventDayPublic {
  day: number;
  date: string;
  state: AdventState;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
}

/** The public calendar as of `today` (El Salvador). */
export interface AdventCalendarView {
  isLive: boolean;
  /** Campaign switched on but every drawer's date is past + 1 day. */
  ended: boolean;
  today: string;
  days: AdventDayPublic[];
}

/** Gift button + menu chip visibility. */
export interface AdventStatus {
  active: boolean;
  todayIsDrawer: boolean;
}

/** One drawer as the admin page sees it — every drawer, any date. */
export interface AdminAdventDay {
  day: number;
  date: string;
  state: AdventState;
  title: string | null;
  description: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  opens: number;
  updatedAt: string;
}

export interface AdminAdventPayload {
  today: string;
  isLive: boolean;
  totalOpens: number;
  days: AdminAdventDay[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Today's date (YYYY-MM-DD) in El Salvador. */
export function svToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ADVENT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function adventState(date: string, today: string): AdventState {
  if (date > today) return "locked";
  if (date === today) return "today";
  return "past";
}

/** The gift button stays up through the day after the last drawer. */
export function adventActive(isLive: boolean, lastDate: string | null, today: string): boolean {
  if (!isLive || !lastDate) return false;
  return today <= addDays(lastDate, 1);
}

const MONTHS = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
} as const;
const MONTHS_SHORT = {
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
} as const;
const WEEKDAYS = {
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
} as const;
const WEEKDAYS_SHORT = {
  es: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
} as const;

type Lang = "es" | "en";

function parts(date: string): { day: number; month: number; weekday: number } {
  const d = new Date(`${date}T12:00:00Z`);
  return { day: d.getUTCDate(), month: d.getUTCMonth(), weekday: d.getUTCDay() };
}

/** "mié 2 dic" / "Wed Dec 2" */
export function formatAdventShort(date: string, lang: Lang): string {
  const p = parts(date);
  return lang === "es"
    ? `${WEEKDAYS_SHORT.es[p.weekday]} ${p.day} ${MONTHS_SHORT.es[p.month]}`
    : `${WEEKDAYS_SHORT.en[p.weekday]} ${MONTHS_SHORT.en[p.month]} ${p.day}`;
}

/** "miércoles 2 de diciembre" / "Wednesday, December 2" */
export function formatAdventLong(date: string, lang: Lang): string {
  const p = parts(date);
  return lang === "es"
    ? `${WEEKDAYS.es[p.weekday]} ${p.day} de ${MONTHS.es[p.month]}`
    : `${WEEKDAYS.en[p.weekday]}, ${MONTHS.en[p.month]} ${p.day}`;
}

/** File extension for an accepted upload type. */
export function adventImageExt(type: AdventImageType): "jpg" | "png" | "webp" {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

/** Storage paths are always `day-<n>/<uuid>.<ext>` — anything else is refused. */
export function isAdventImagePath(path: string, day: number): boolean {
  return new RegExp(`^day-${day}/[0-9a-f-]{36}\\.(jpg|png|webp)$`).test(path);
}
