/**
 * /boletos/comprar/[slug] — buy tickets for one event.
 * Server-fetches the event (ticket types, cupos, service fee), then hands off
 * to the client checkout which reuses the certified card-payment components
 * (CardPaymentForm, ThreeDSecureModal).
 *
 * ?tipo=<ticket type id> preselects one type (links from the event page).
 * Drafts open only for logged-in staff, so the team can check a new event's
 * checkout before publishing it.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { getActiveStaff } from "@/lib/staff-auth";
import { eventSeatsLeft, onSiteTickets } from "@/lib/ticket-tiers";
import TicketCheckout from "./TicketCheckout";

export const dynamic = "force-dynamic";

async function getEvent(slug: string) {
  const supabase = createServiceClient();
  const { data: ev, error } = await supabase
    .from("events")
    .select(
      "id, slug, title, title_es, starts_at, custom_venue, location_id, image_url, is_published, deleted_at, tickets_enabled, ticket_price, ticket_tiers, ticket_tier_sold, ticket_fee_percent, has_capacity_limit, max_capacity, tickets_sold",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!ev) return null;

  let venue = ev.custom_venue as string | null;
  if (!venue && ev.location_id) {
    const { data: loc } = await supabase
      .from("locations")
      .select("name")
      .eq("id", ev.location_id)
      .maybeSingle();
    venue = loc?.name ?? null;
  }
  const ended = !!ev.starts_at && new Date(ev.starts_at).getTime() <= Date.now();
  return { ...ev, venue, ended };
}

export default async function BuyTicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tipo?: string | string[] }>;
}) {
  const [{ slug }, { tipo }] = await Promise.all([params, searchParams]);
  const ev = await getEvent(slug);
  if (!ev || ev.deleted_at) notFound();

  let draft = false;
  if (!ev.is_published) {
    if (!(await getActiveStaff())) notFound();
    draft = true;
  }

  const offer = onSiteTickets(ev);
  const ended = ev.ended;

  if (offer.mode === "none" || ended || offer.soldOut) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="font-display text-2xl text-white mb-3">
            {ev.title_es || ev.title}
          </h1>
          <p className="text-white/60 mb-8">
            {offer.soldOut && !ended
              ? "Boletos agotados para este evento."
              : ended
                ? "Este evento ya pasó."
                : "Los boletos para este evento no están disponibles en línea."}
          </p>
          <Link
            href="/ticketmania"
            className="inline-block px-6 py-3 bg-[#E85D04] hover:bg-[#C2410C] text-white font-semibold rounded-xl transition"
          >
            Ver eventos
          </Link>
        </div>
      </div>
    );
  }

  const initialTierId = typeof tipo === "string" ? tipo : null;

  return (
    <TicketCheckout
      event={{
        slug: ev.slug,
        title: ev.title_es || ev.title,
        startsAt: ev.starts_at,
        venue: ev.venue,
        imageUrl: ev.image_url,
        mode: offer.mode,
        feePercent: offer.feePercent,
        tiers: offer.tiers.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          price: t.price,
          fee: t.fee,
          total: t.total,
          remaining: t.remaining,
          soldOut: t.soldOut,
        })),
        seatsLeft: eventSeatsLeft(ev),
        draft,
      }}
      initialTierId={initialTierId}
    />
  );
}
