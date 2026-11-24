// ============================================================
// Event segments — which programme an event belongs to.
//
// Client request (2026-11-22): "poder poner como un segmento:
// Simmermanía - Frontline - Otros, para colocar los eventos que
// estamos subiendo para que compren". Fixed list, mirrored by the
// CHECK constraint on events.segment (migration 20261124_event_segments).
// Adding a segment = new migration + one row here.
//
// Brand names (Simmermanía, Frontline) are the same in every language.
// ============================================================

export type EventSegment = "simmermania" | "frontline" | "otros";

export interface EventSegmentMeta {
  key: EventSegment;
  label: string;
  label_en: string;
  /** Badge colour (admin cards + public chips). */
  color: string;
}

export const EVENT_SEGMENTS: readonly EventSegmentMeta[] = [
  { key: "simmermania", label: "Simmermanía", label_en: "Simmermanía", color: "#E85D04" },
  { key: "frontline", label: "Frontline", label_en: "Frontline", color: "#38BDF8" },
  { key: "otros", label: "Otros", label_en: "Others", color: "#6B6560" },
] as const;

export const DEFAULT_EVENT_SEGMENT: EventSegment = "otros";

export function isEventSegment(value: unknown): value is EventSegment {
  return (
    typeof value === "string" &&
    EVENT_SEGMENTS.some((s) => s.key === value)
  );
}

/** Any stored/legacy value → a valid segment (rows older than the column read as "otros"). */
export function eventSegment(value: unknown): EventSegment {
  return isEventSegment(value) ? value : DEFAULT_EVENT_SEGMENT;
}

export function segmentMeta(value: unknown): EventSegmentMeta {
  const key = eventSegment(value);
  return EVENT_SEGMENTS.find((s) => s.key === key) ?? EVENT_SEGMENTS[EVENT_SEGMENTS.length - 1];
}

export function segmentLabel(value: unknown, locale: "es" | "en" = "es"): string {
  const meta = segmentMeta(value);
  return locale === "en" ? meta.label_en : meta.label;
}
