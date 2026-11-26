// ============================================================
// Gift cards — server reads (service role). Every caller is a staff route
// or the buyer's own token page; nothing here is reachable anonymously
// without a 60-bit code or a 256-bit view token.
// ============================================================

import { createServiceClient } from "@/lib/supabase/service";
import { giftCardState, type GiftCardState } from "@/lib/gift-cards";

export interface GiftCardTx {
  id: string;
  kind: "issue" | "redeem" | "void";
  amount: number;
  balance_after: number;
  location_name: string | null;
  staff_name: string | null;
  note: string | null;
  created_at: string;
}

export interface GiftCardDetail {
  id: string;
  code: string;
  view_token: string;
  initial_amount: number;
  balance: number;
  status: "active" | "void";
  state: GiftCardState;
  recipient_name: string | null;
  sender_name: string | null;
  message: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  expires_at: string;
  void_reason: string | null;
  order_number: string | null;
  created_at: string;
  transactions: GiftCardTx[];
}

const CARD_SELECT =
  "id, code, view_token, initial_amount, balance, status, recipient_name, sender_name, message, buyer_name, buyer_phone, expires_at, void_reason, created_at, order:orders!gift_cards_order_id_fkey(order_number)";

interface CardRow {
  id: string;
  code: string;
  view_token: string;
  initial_amount: number | string;
  balance: number | string;
  status: "active" | "void";
  recipient_name: string | null;
  sender_name: string | null;
  message: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  expires_at: string;
  void_reason: string | null;
  created_at: string;
  order: { order_number: string | null } | { order_number: string | null }[] | null;
}

interface TxRow {
  id: string;
  kind: GiftCardTx["kind"];
  amount: number | string;
  balance_after: number | string;
  note: string | null;
  created_at: string;
  location: { name: string | null } | { name: string | null }[] | null;
  staff: { first_name: string | null; last_name: string | null } | { first_name: string | null; last_name: string | null }[] | null;
}

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

async function hydrate(row: CardRow): Promise<GiftCardDetail> {
  const service = createServiceClient();
  const { data: txs, error } = await service
    .from("gift_card_transactions")
    .select("id, kind, amount, balance_after, note, created_at, location:locations(name), staff:staff(first_name, last_name)")
    .eq("gift_card_id", row.id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const balance = Number(row.balance);
  return {
    id: row.id,
    code: row.code,
    view_token: row.view_token,
    initial_amount: Number(row.initial_amount),
    balance,
    status: row.status,
    state: giftCardState({ status: row.status, balance, expires_at: row.expires_at }),
    recipient_name: row.recipient_name,
    sender_name: row.sender_name,
    message: row.message,
    buyer_name: row.buyer_name,
    buyer_phone: row.buyer_phone,
    expires_at: row.expires_at,
    void_reason: row.void_reason,
    order_number: one(row.order)?.order_number ?? null,
    created_at: row.created_at,
    transactions: ((txs ?? []) as TxRow[]).map((t) => {
      const staff = one(t.staff);
      const staffName = staff ? [staff.first_name, staff.last_name].filter(Boolean).join(" ") : "";
      return {
        id: t.id,
        kind: t.kind,
        amount: Number(t.amount),
        balance_after: Number(t.balance_after),
        location_name: one(t.location)?.name ?? null,
        staff_name: staffName || null,
        note: t.note,
        created_at: t.created_at,
      };
    }),
  };
}

export async function giftCardByCode(code: string): Promise<GiftCardDetail | null> {
  const service = createServiceClient();
  const { data, error } = await service.from("gift_cards").select(CARD_SELECT).eq("code", code).maybeSingle();
  if (error) throw error;
  return data ? hydrate(data as unknown as CardRow) : null;
}

export async function giftCardByToken(token: string): Promise<GiftCardDetail | null> {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const service = createServiceClient();
  const { data, error } = await service.from("gift_cards").select(CARD_SELECT).eq("view_token", token).maybeSingle();
  if (error) throw error;
  return data ? hydrate(data as unknown as CardRow) : null;
}

export async function giftCardById(id: string): Promise<GiftCardDetail | null> {
  const service = createServiceClient();
  const { data, error } = await service.from("gift_cards").select(CARD_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? hydrate(data as unknown as CardRow) : null;
}
