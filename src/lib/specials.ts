/**
 * Shared gating + formatting for Especiales (promotions).
 *
 * All date math runs in America/El_Salvador (UTC-6, no DST). specials
 * start_date/end_date are DATE strings (YYYY-MM-DD); parsing them with
 * `new Date(str)` treats them as UTC midnight, which renders as the
 * PREVIOUS day in SV — always go through these helpers instead.
 */

import type { Special } from "@/lib/types";

const SV_UTC_OFFSET_MS = 6 * 60 * 60 * 1000;

const DAY_LABELS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Current date string (YYYY-MM-DD) and weekday (0=Dom) in El Salvador. */
export function svToday(): { dateStr: string; dayOfWeek: number } {
  const shifted = new Date(Date.now() - SV_UTC_OFFSET_MS);
  return {
    dateStr: shifted.toISOString().slice(0, 10),
    dayOfWeek: shifted.getUTCDay(),
  };
}

type SpecialWindow = Pick<
  Special,
  "active" | "start_date" | "end_date" | "days_of_week"
>;

/** Special is live right now: active + inside date window + valid weekday. */
export function isSpecialLive(s: SpecialWindow): boolean {
  if (!s.active) return false;
  const { dateStr, dayOfWeek } = svToday();
  if (dateStr < s.start_date) return false;
  if (s.end_date && dateStr > s.end_date) return false;
  if (
    s.days_of_week &&
    s.days_of_week.length > 0 &&
    !s.days_of_week.includes(dayOfWeek)
  ) {
    return false;
  }
  return true;
}

/**
 * Special should be shown on the public site: live now, or active and
 * starting within the next `horizonDays` days (builds anticipation for
 * promos like a Monday 2x1 activated over the weekend).
 */
export function isSpecialVisible(s: SpecialWindow, horizonDays = 7): boolean {
  if (!s.active) return false;
  const { dateStr } = svToday();
  if (s.end_date && dateStr > s.end_date) return false;
  if (dateStr >= s.start_date) return true;
  const horizon = new Date(
    new Date(`${dateStr}T00:00:00Z`).getTime() +
      horizonDays * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10);
  return s.start_date <= horizon;
}

/** Format a DATE string as a calendar date (es-SV), immune to TZ shift. */
export function formatSpecialDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return new Date(y, m - 1, d).toLocaleDateString("es-SV", {
    day: "numeric",
    month: "short",
  });
}

/** "Lun, Mié y Vie" style label for a days_of_week array. */
export function formatSpecialDays(days: number[]): string {
  const labels = days
    .filter((d) => d >= 0 && d <= 6)
    .map((d) => DAY_LABELS_ES[d]);
  if (labels.length === 0) return "";
  if (labels.length === 1) return `Solo ${labels[0]}`;
  return `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`;
}
