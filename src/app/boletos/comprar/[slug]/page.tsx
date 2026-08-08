/**
 * /boletos/comprar/[slug] — buy tickets for one event.
 * Server-fetches the event, then hands off to the client checkout which reuses
 * the certified card-payment components (CardPaymentForm, ThreeDSecureModal).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import TicketCheckout from "./TicketCheckout";

export const dynamic = "force-dynamic";

async function getEvent(slug: string) {
  const supabase = createServiceClient();
  const { data: ev } = await supabase
    .from("events")
    .select(
      "id, slug, title, title_es, description_es, description, starts_at, custom_venue, location_id, image_url, is_published, tickets_enabled, ticket_price, has_capacity_limit, max_capacity, tickets_sold",
    )
    .eq("slug", slug)
    .maybeSingle();
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
  return { ...ev, venue };
}

export default async function BuyTicketsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ev = await getEvent(slug);
  if (!ev || !ev.is_published) notFound();

  const onSale =
    ev.tickets_enabled &&
    ev.ticket_price != null &&
    Number(ev.ticket_price) > 0 &&
    (!ev.starts_at || new Date(ev.starts_at).getTime() > Date.now());

  const remaining =
    ev.has_capacity_limit && ev.max_capacity != null
      ? Math.max(0, ev.max_capacity - ev.tickets_sold)
      : null;

  if (!onSale || remaining === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-32 pb-24 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="font-display text-2xl text-white mb-3">
            {ev.title_es || ev.title}
          </h1>
          <p className="text-white/60 mb-8">
            {remaining === 0
              ? "Boletos agotados para este evento."
              : "Los boletos para este evento no están disponibles en línea."}
          </p>
          <Link
            href="/events"
            className="inline-block px-6 py-3 bg-[#E85D04] hover:bg-[#C2410C] text-white font-semibold rounded-xl transition"
          >
            Ver eventos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TicketCheckout
      event={{
        slug: ev.slug,
        title: ev.title_es || ev.title,
        startsAt: ev.starts_at,
        venue: ev.venue,
        imageUrl: ev.image_url,
        price: Number(ev.ticket_price),
        remaining,
      }}
    />
  );
}
