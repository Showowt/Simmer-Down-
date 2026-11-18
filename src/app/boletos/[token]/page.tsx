/**
 * /boletos/[token] — the customer's ticket (public; the token is the capability).
 * Shows event details + a QR that opens the staff check-in page at the door,
 * plus a one-tap "save to WhatsApp".
 */

import { notFound } from "next/navigation";
import QRCode from "qrcode";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { money, parseTicketTiers } from "@/lib/ticket-tiers";

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

interface SiblingTicket {
  qr_token: string;
  tier_name: string | null;
  quantity: number;
}

interface TicketView {
  qr_token: string;
  quantity: number;
  status: string;
  admitted_count: number;
  buyer_name: string | null;
  total_amount: number | null;
  /** Ticket's own price and service fee, per ticket (fee null on older tickets). */
  unit_price: number | null;
  unit_fee: number | null;
  tier_name: string | null;
  tier_description: string | null;
  order_number: string | null;
  event_title: string;
  starts_at: string | null;
  venue: string | null;
  /** The order's other QR codes (one per ticket type). */
  siblings: SiblingTicket[];
}

async function getTicket(token: string): Promise<TicketView | null> {
  const supabase = createServiceClient();
  const { data: tk } = await supabase
    .from("event_tickets")
    .select(
      "qr_token, quantity, status, admitted_count, buyer_name, total_amount, unit_price, unit_fee, tier_id, tier_name, event_id, order_id",
    )
    .eq("qr_token", token)
    .maybeSingle();
  if (!tk) return null;

  const [{ data: ev }, { data: order }, { data: others }] = await Promise.all([
    supabase
      .from("events")
      .select("title, title_es, starts_at, custom_venue, location_id, ticket_tiers")
      .eq("id", tk.event_id)
      .maybeSingle(),
    supabase.from("orders").select("order_number").eq("id", tk.order_id).maybeSingle(),
    supabase
      .from("event_tickets")
      .select("qr_token, tier_name, quantity, line_no")
      .eq("order_id", tk.order_id)
      .neq("qr_token", tk.qr_token)
      .order("line_no", { ascending: true }),
  ]);
  // What the type includes comes from the event's current setup.
  const tier = tk.tier_id
    ? parseTicketTiers(ev?.ticket_tiers).find((t) => t.id === tk.tier_id)
    : undefined;

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
    unit_price: tk.unit_price != null ? Number(tk.unit_price) : null,
    unit_fee: tk.unit_fee != null ? Number(tk.unit_fee) : null,
    tier_name: tk.tier_name ?? null,
    tier_description: tier?.description ?? null,
    order_number: order?.order_number ?? null,
    event_title: ev?.title_es || ev?.title || "Evento",
    starts_at: ev?.starts_at ?? null,
    venue,
    siblings: ((others ?? []) as SiblingTicket[]).map((s) => ({
      qr_token: s.qr_token,
      tier_name: s.tier_name ?? null,
      quantity: Number(s.quantity),
    })),
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
  // Group tickets can be admitted in parts; the QR stays valid for the rest.
  const remaining = ticket.status === "valid" ? Math.max(0, ticket.quantity - ticket.admitted_count) : 0;
  const isPartial = ticket.status === "valid" && ticket.admitted_count > 0 && remaining > 0;

  const waText = `🎫 Mi boleto — ${ticket.event_title}${ticket.tier_name ? ` (${ticket.tier_name})` : ""}\nAdmite: ${ticket.quantity}\nhttps://simmerdownsv.com/boletos/${ticket.qr_token}`;
  // api.whatsapp.com (not wa.me): wa.me mangles the emoji in prefilled text.
  const waHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;

  // Receipt line: what was paid, with the service fee itemised when there is one.
  const fee = ticket.unit_fee != null && ticket.unit_fee > 0 ? ticket.unit_fee * ticket.quantity : 0;
  const paidLine =
    ticket.total_amount != null && ticket.total_amount > 0
      ? fee > 0 && ticket.unit_price != null
        ? `Pagado ${money(ticket.total_amount)} · valor ${money(ticket.unit_price * ticket.quantity)} + cargo ${money(fee)}`
        : `Pagado ${money(ticket.total_amount)}`
      : null;

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

            {ticket.tier_name && (
              <div className="mb-5 rounded-lg border border-[#FBBF24]/40 bg-[#FBBF24]/10 px-4 py-3 text-center">
                <p className="text-[#FBBF24] font-bold uppercase tracking-wider">{ticket.tier_name}</p>
                {ticket.tier_description && (
                  <p className="text-white/60 text-sm mt-0.5">{ticket.tier_description}</p>
                )}
              </div>
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
            {isPartial && (
              <div className="mb-5 rounded-lg border border-[#FFB800]/30 bg-[#FFB800]/10 px-4 py-3 text-center">
                <p className="text-[#FFB800] font-semibold">
                  Ya ingresaron {ticket.admitted_count} de {ticket.quantity}
                </p>
                <p className="text-white/50 text-xs mt-1">
                  El mismo QR sirve para las {remaining} entrada{remaining === 1 ? "" : "s"} restante{remaining === 1 ? "" : "s"}.
                </p>
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
                Admite {isPartial ? remaining : ticket.quantity}
              </p>
              <p className="text-white/40 text-sm mt-1">
                {ticket.buyer_name ? `A nombre de ${ticket.buyer_name}` : ""}
              </p>
              {paidLine && <p className="text-white/30 text-xs mt-1">{paidLine}</p>}
            </div>

            <p className="text-center text-white/50 text-sm mt-5">
              Muestra este código QR en la entrada del evento.
            </p>

            {ticket.siblings.length > 0 && (
              <div className="mt-5 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-white/70 text-sm font-semibold mb-2">
                  Tu compra también incluye:
                </p>
                <ul className="space-y-2">
                  {ticket.siblings.map((s) => (
                    <li key={s.qr_token}>
                      <Link
                        href={`/boletos/${s.qr_token}`}
                        className="flex items-center justify-between gap-3 text-sm text-[#FBBF24] hover:text-[#FCD34D]"
                      >
                        <span className="min-w-0 break-words">
                          {s.tier_name ?? "Boleto"} · admite {s.quantity}
                        </span>
                        <span className="shrink-0">Ver QR →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 w-full py-3 bg-[#25D366]/15 border border-[#25D366]/30 hover:bg-[#25D366]/25 text-[#25D366] font-semibold rounded-xl flex items-center justify-center gap-2 transition"
            >
              Guardar en WhatsApp
            </a>
            <Link
              href="/ticketmania"
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
