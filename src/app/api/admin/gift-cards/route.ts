/**
 * GET /api/admin/gift-cards?q=<code | phone | name>
 * → { cards: [...latest 100 matching], stats: { sold, soldAmount, outstanding, redeemed } }
 *
 * Owner / admin / manager only (the full list is the liability ledger).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getActiveStaff, type StaffRole } from "@/lib/staff-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { giftCardState, normalizeGiftCode } from "@/lib/gift-cards";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const CAN_LIST: ReadonlySet<StaffRole> = new Set<StaffRole>(["owner", "admin", "manager"]);

function fail(status: number, error: string, message: string) {
  return NextResponse.json({ data: null, error, message }, { status });
}

interface ListRow {
  id: string;
  code: string;
  initial_amount: number | string;
  balance: number | string;
  status: "active" | "void";
  recipient_name: string | null;
  sender_name: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  expires_at: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  const staff = await getActiveStaff();
  if (!staff) return fail(401, "unauthorized", "Sesión expirada. Vuelve a iniciar sesión.");
  if (!CAN_LIST.has(staff.role)) return fail(403, "forbidden", "Tu usuario no puede ver la lista de gift cards.");
  const rl = checkRateLimit(`giftcards_list:${staff.id}`, { maxRequests: 60, windowMs: 60_000 });
  if (!rl.success) return fail(429, "rate_limited", "Demasiadas solicitudes. Espera un momento.");

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 60);

  try {
    const service = createServiceClient();
    let query = service
      .from("gift_cards")
      .select("id, code, initial_amount, balance, status, recipient_name, sender_name, buyer_name, buyer_phone, expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (q) {
      const code = normalizeGiftCode(q);
      const digits = q.replace(/\D/g, "");
      if (code) {
        query = query.eq("code", code);
      } else if (digits.length >= 4) {
        query = query.ilike("buyer_phone", `%${digits.slice(-8, -4)}%${digits.slice(-4)}%`);
      } else {
        const safe = q.replace(/[%,()]/g, " ");
        query = query.or(`buyer_name.ilike.%${safe}%,recipient_name.ilike.%${safe}%,sender_name.ilike.%${safe}%`);
      }
    }

    const [{ data: rows, error }, { data: all, error: allErr }] = await Promise.all([
      query,
      service.from("gift_cards").select("initial_amount, balance, status, expires_at"),
    ]);
    if (error) throw error;
    if (allErr) throw allErr;

    const now = new Date();
    let soldAmount = 0;
    let outstanding = 0;
    let redeemed = 0;
    for (const c of all ?? []) {
      const initial = Number(c.initial_amount);
      const balance = Number(c.balance);
      soldAmount += initial;
      if (c.status === "active") redeemed += initial - balance;
      if (giftCardState({ status: String(c.status), balance, expires_at: String(c.expires_at) }, now) === "active") {
        outstanding += balance;
      }
    }

    return NextResponse.json({
      data: {
        cards: ((rows ?? []) as ListRow[]).map((r) => {
          const balance = Number(r.balance);
          return {
            id: r.id,
            code: r.code,
            initial_amount: Number(r.initial_amount),
            balance,
            state: giftCardState({ status: r.status, balance, expires_at: r.expires_at }, now),
            recipient_name: r.recipient_name,
            sender_name: r.sender_name,
            buyer_name: r.buyer_name,
            buyer_phone: r.buyer_phone,
            expires_at: r.expires_at,
            created_at: r.created_at,
          };
        }),
        stats: {
          sold: (all ?? []).length,
          soldAmount: Math.round(soldAmount * 100) / 100,
          outstanding: Math.round(outstanding * 100) / 100,
          redeemed: Math.round(redeemed * 100) / 100,
        },
        canManage: true,
      },
      error: null,
      message: "ok",
    });
  } catch (error) {
    logger.error("[api/admin/gift-cards] GET", error);
    return fail(500, "server_error", "No se pudo cargar la lista.");
  }
}
