/**
 * /admin/boletos/[token] — door check-in (staff only; gated by the /admin
 * middleware). Opened by scanning a ticket's QR with a phone camera.
 */

import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import CheckInButton from "./CheckInButton";

export const dynamic = "force-dynamic";

const SV_TZ = "America/El_Salvador";

async function getTicket(token: string) {
  const supabase = createServiceClient();
  const { data: tk } = await supabase
    .from("event_tickets")
    .select("qr_token, quantity, status, admitted_count, buyer_name, buyer_phone, oversold, event_id, order_id, checked_in_at")
    .eq("qr_token", token)
    .maybeSingle();
  if (!tk) return null;
  const [{ data: ev }, { data: order }] = await Promise.all([
    supabase.from("events").select("title, title_es, starts_at").eq("id", tk.event_id).maybeSingle(),
    supabase.from("orders").select("order_number").eq("id", tk.order_id).maybeSingle(),
  ]);
  return {
    ...tk,
    event_title: ev?.title_es || ev?.title || "Evento",
    starts_at: ev?.starts_at ?? null,
    order_number: order?.order_number ?? null,
  };
}

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tk = await getTicket(token);
  if (!tk) notFound();

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#252320] border border-[#3D3936] rounded-2xl overflow-hidden">
        <div className="bg-[#1F1D1A] px-6 py-4 border-b border-[#3D3936]">
          <p className="text-xs text-[#6B6560] uppercase tracking-wider mb-1">
            Check-in de Boleto
          </p>
          <h1 className="text-xl font-bold text-[#FFF8F0]">{tk.event_title}</h1>
          {tk.starts_at && (
            <p className="text-sm text-[#6B6560] capitalize mt-1">
              {new Intl.DateTimeFormat("es-SV", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: SV_TZ,
              }).format(new Date(tk.starts_at))}
            </p>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[#6B6560]">Comprador</p>
              <p className="text-[#FFF8F0] font-medium">{tk.buyer_name || "—"}</p>
            </div>
            <div>
              <p className="text-[#6B6560]">Pedido</p>
              <p className="text-[#FFF8F0] font-mono">#{tk.order_number ?? ""}</p>
            </div>
            <div>
              <p className="text-[#6B6560]">Cantidad</p>
              <p className="text-[#FFF8F0] font-bold text-lg">{tk.quantity}</p>
            </div>
            <div>
              <p className="text-[#6B6560]">Teléfono</p>
              <p className="text-[#FFF8F0]">{tk.buyer_phone || "—"}</p>
            </div>
          </div>

          {tk.oversold && (
            <div className="rounded-lg border border-[#FFB800]/40 bg-[#FFB800]/10 px-4 py-2 text-center text-[#FFB800] text-sm">
              ⚠️ Venta sobre cupo — confirmar con gerencia
            </div>
          )}

          <CheckInButton
            token={tk.qr_token}
            quantity={tk.quantity}
            initialStatus={tk.status}
          />
        </div>
      </div>
    </div>
  );
}
