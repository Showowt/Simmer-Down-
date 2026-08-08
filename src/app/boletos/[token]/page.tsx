/**
 * /boletos/[token] — the customer's ticket (public; the token is the capability).
 * Shows event details + a QR that opens the staff check-in page at the door,
 * plus a one-tap "save to WhatsApp".
 */

import { notFound } from "next/navigation";
import QRCode from "qrcode";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const SV_TZ = "America/El_Salvador";

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("es-SV", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: SV_TZ,
  }).format(new Date(iso));
}
function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat("es-SV", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: SV_TZ,
  }).format(new Date(iso));
}

interface TicketView {
  qr_token: string;
  quantity: number;
  status: string;
  admitted_count: number;
  buyer_name: string | null;
  total_amount: number | null;
  order_number: string | null;
  event_title: string;
  starts_at: string | null;
  venue: string | null;
}

async function getTicket(token: string): Promise<TicketView | null> {
  const supabase = createServiceClient();
  const { data: tk } = await supabase
    .from("event_tickets")
    .select("qr_token, quantity, status, admitted_count, buyer_name, total_amount, event_id, order_id")
    .eq("qr_token", token)
    .maybeSingle();
  if (!tk) return null;

  const [{ data: ev }, { data: order }] = await Promise.all([
    supabase
      .from("events")
      .select("title, title_es, starts_at, custom_venue, location_id")
      .eq("id", tk.event_id)
      .maybeSingle(),
    supabase.from("orders").select("order_number").eq("id", tk.order_id).maybeSingle(),
  ]);

  let venue = ev?.custom_venue ?? null;
  if (!venue && ev?.location_id) {
    const { data: loc } = await supabase
      .from("locations")
      .select("name")
      .eq("id", ev.location_id)
      .maybeSingle();
    venue = loc?.name ?? null;
  }

  return {
    qr_token: tk.qr_token,
    quantity: tk.quantity,
    status: tk.status,
    admitted_count: tk.admitted_count,
    buyer_name: tk.buyer_name,
    total_amount: tk.total_amount != null ? Number(tk.total_amount) : null,
    order_number: order?.order_number ?? null,
    event_title: ev?.title_es || ev?.title || "Evento",
    starts_at: ev?.starts_at ?? null,
    venue,
  };
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ticket = await getTicket(token);
  if (!ticket) notFound();

  // The QR opens the staff check-in page — scanning with a phone camera lands
  // a logged-in staffer straight on the admit screen.
  const checkinUrl = `https://simmerdownsv.com/admin/boletos/${ticket.qr_token}`;
  const qrDataUrl = await QRCode.toDataURL(checkinUrl, {
    margin: 1,
    width: 320,
    color: { dark: "#0A0A0A", light: "#FFFFFF" },
  });

  const isUsed = ticket.status === "used";
  const isVoid = ticket.status === "void";

  const waText = `🎫 Mi boleto — ${ticket.event_title}\nAdmite: ${ticket.quantity}\nhttps://simmerdownsv.com/boletos/${ticket.qr_token}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#E85D04] px-6 py-4 flex items-center justify-between">
            <span className="text-white font-bold uppercase tracking-wider text-sm">
              🎫 Boleto Simmer Down
            </span>
            <span className="text-white/90 text-xs font-mono">
              #{ticket.order_number ?? ""}
            </span>
          </div>

          <div className="p-6">
            <h1 className="font-display text-2xl text-white mb-1 leading-tight">
              {ticket.event_title}
            </h1>
            {ticket.starts_at && (
              <p className="text-white/60 text-sm capitalize mb-1">
                {fmtDate(ticket.starts_at)} · {fmtTime(ticket.starts_at)}
              </p>
            )}
            {ticket.venue && (
              <p className="text-white/40 text-sm mb-5">{ticket.venue}</p>
            )}

            {/* Status banner */}
            {isUsed && (
              <div className="mb-5 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-center">
                <p className="text-white/80 font-semibold">Boleto ya utilizado</p>
                <p className="text-white/40 text-xs mt-1">
                  Admitido: {ticket.admitted_count} de {ticket.quantity}
                </p>
              </div>
            )}
            {isVoid && (
              <div className="mb-5 rounded-lg border border-[#C73E1D]/40 bg-[#C73E1D]/10 px-4 py-3 text-center">
                <p className="text-[#FF6B6B] font-semibold">Boleto anulado</p>
              </div>
            )}

            {/* QR */}
            <div
              className={`bg-white rounded-xl p-4 mx-auto w-fit ${isUsed || isVoid ? "opacity-40" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Código QR del boleto" width={280} height={280} />
            </div>

            <div className="mt-4 text-center">
              <p className="text-3xl font-bold text-[#E85D04] tabular-nums">
                Admite {ticket.quantity}
              </p>
              <p className="text-white/40 text-sm mt-1">
                {ticket.buyer_name ? `A nombre de ${ticket.buyer_name}` : ""}
              </p>
            </div>

            <p className="text-center text-white/50 text-sm mt-5">
              Muestra este código QR en la entrada del evento.
            </p>

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 w-full py-3 bg-[#25D366]/15 border border-[#25D366]/30 hover:bg-[#25D366]/25 text-[#25D366] font-semibold rounded-xl flex items-center justify-center gap-2 transition"
            >
              Guardar en WhatsApp
            </a>
            <Link
              href="/events"
              className="mt-3 block text-center text-white/40 hover:text-white/70 text-sm transition"
            >
              Ver más eventos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
