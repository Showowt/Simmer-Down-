// ============================================================
// Calendario de Adviento — server-side reads (service role).
//
// advent_* tables are service-role only (RLS on, no policies) and the
// `advent` bucket is private, so THIS file is the only gate between a
// visitor and a prize: it signs image URLs for drawers whose date has
// arrived and returns nothing else for locked ones.
// ============================================================

import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import logger from "@/lib/logger";
import {
  ADVENT_BUCKET,
  adventActive,
  adventState,
  svToday,
  type AdventCalendarView,
  type AdventStatus,
} from "@/lib/advent";

/** Signed prize URLs live long enough for a visit, short enough not to be
 *  worth passing around. Each page load signs fresh ones. */
const SIGNED_URL_SECONDS = 60 * 60 * 2;

export interface AdventDayRow {
  day: number;
  unlock_date: string;
  title: string | null;
  description: string | null;
  image_path: string | null;
  updated_at: string;
}

const DAY_SELECT = "day, unlock_date, title, description, image_path, updated_at";

export async function readAdventRows(): Promise<{ isLive: boolean; days: AdventDayRow[] }> {
  const service = createServiceClient();
  const [settings, days] = await Promise.all([
    service.from("advent_settings").select("is_live").eq("id", true).maybeSingle(),
    service.from("advent_days").select(DAY_SELECT).order("day", { ascending: true }),
  ]);
  if (settings.error) throw settings.error;
  if (days.error) throw days.error;
  const s = settings.data as { is_live: boolean } | null;
  return { isLive: s?.is_live === true, days: (days.data ?? []) as AdventDayRow[] };
}

/** Signed URLs for the given storage paths, keyed by path. Missing = unsigned. */
export async function signAdventPaths(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (paths.length === 0) return out;
  const service = createServiceClient();
  const { data, error } = await service.storage
    .from(ADVENT_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) {
    logger.error("[advent] sign urls", error.message);
    return out;
  }
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) out.set(item.path, item.signedUrl);
  }
  return out;
}

function lastUnlockDate(days: AdventDayRow[]): string | null {
  return days.reduce<string | null>((max, d) => (max === null || d.unlock_date > max ? d.unlock_date : max), null);
}


/**
 * The calendar as of `today` (YYYY-MM-DD, El Salvador). When the campaign is
 * not live every drawer renders locked unless `forceLive` (admin preview).
 * Fails soft: an outage returns an empty, not-live calendar.
 */
export async function loadAdventCalendar(opts: {
  today?: string;
  forceLive?: boolean;
} = {}): Promise<AdventCalendarView> {
  const today = opts.today ?? svToday();
  try {
    const { isLive, days } = await readAdventRows();
    const live = isLive || opts.forceLive === true;
    const lastDate = lastUnlockDate(days);

    const states = days.map((d) => ({
      row: d,
      state: live ? adventState(d.unlock_date, today) : ("locked" as const),
    }));
    const signed = await signAdventPaths(
      states
        .filter((s) => s.state !== "locked" && s.row.image_path)
        .map((s) => s.row.image_path as string),
    );

    return {
      isLive: live,
      ended: live && !adventActive(true, lastDate, today),
      today,
      days: states.map(({ row, state }) => {
        const open = state !== "locked";
        return {
          day: row.day,
          date: row.unlock_date,
          state,
          title: open ? row.title : null,
          description: open ? row.description : null,
          imageUrl: open && row.image_path ? signed.get(row.image_path) ?? null : null,
        };
      }),
    };
  } catch (error) {
    logger.error("[advent] load calendar", error);
    return { isLive: false, ended: false, today, days: [] };
  }
}

export async function loadAdventStatus(): Promise<AdventStatus> {
  try {
    const today = svToday();
    const { isLive, days } = await readAdventRows();
    const lastDate = lastUnlockDate(days);
    const active = adventActive(isLive, lastDate, today);
    return { active, todayIsDrawer: active && days.some((d) => d.unlock_date === today) };
  } catch (error) {
    logger.error("[advent] status", error);
    return { active: false, todayIsDrawer: false };
  }
}

/** True when the signed-in user's profile role is 'admin' (same gate as /admin). */
export async function isAdminRequest(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    return (profile as { role?: string } | null)?.role === "admin";
  } catch (error) {
    logger.error("[advent] admin check", error);
    return false;
  }
}
