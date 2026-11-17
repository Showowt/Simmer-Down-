/**
 * Staff identity for admin API routes that act on behalf of a person (door
 * check-in, deleting events). /admin pages are gated on profiles.role by the
 * middleware; these routes also require an ACTIVE `staff` row so every write
 * is attributable (event_tickets.checked_in_by stores staff.id).
 */

import { createClient } from "@/lib/supabase/server";
import logger from "@/lib/logger";

export type StaffRole = "owner" | "admin" | "manager" | "location_manager" | "staff";

export interface ActiveStaff {
  id: string;
  role: StaffRole;
}

export async function getActiveStaff(): Promise<ActiveStaff | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: staff, error } = await supabase
      .from("staff")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (error) {
      logger.error("[staff-auth] staff lookup failed", error);
      return null;
    }
    if (!staff) return null;
    return { id: String(staff.id), role: String(staff.role) as StaffRole };
  } catch (error) {
    logger.error("[staff-auth] getActiveStaff failed", error);
    return null;
  }
}
