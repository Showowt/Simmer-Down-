"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublicEvent } from "@/lib/events";
import {
  buyLabel,
  displayTiers,
  eventReservationUrl,
  feeBreakdown,
  ticketState,
} from "@/lib/event-display";
import { money, percentLabel, tierDescription, tierName } from "@/lib/ticket-tiers";

// One decision tree for every ticket button on the site — the event page,
// the featured posters on /ticketmania and the poster grid — so a price,
// a ticket type or a sold-out state can never read differently between them.
//   1. sold on simmerdownsv.com → ticket types (if any) + "Comprar Boletos"
//   2. sold elsewhere / price list only → display-only prices + link
//   3. nothing to buy → reserve via WhatsApp

const HERO_BTN =
  "inline-flex items-center gap-2 bg-[#C2410C] hover:bg-[#9A3412] text-white px-8 py-4 font-bold transition-all min-h-[56px]";
const SHOW_LEFT_BELOW = 20;

/** Ticket call-to-action for the event page and the featured posters. */
export default function EventTicketCta({
  event,
  locale,
  whenLabel,
}: {
  event: PublicEvent;
  locale: string;
  whenLabel: string;
}) {
  const es = locale !== "en";
  const ts = ticketState(event, locale);
  const buyHref = `/boletos/comprar/${event.slug}`;

  if (ts.onSale && ts.soldOut) {
    return (
      <span className="inline-flex items-center gap-2 bg-white/10 text-white/60 px-8 py-4 font-bold min-h-[56px]">
        {es ? "Agotado" : "Sold Out"}
      </span>
    );
  }

  if (ts.onSale) {
    return (
      <div className="space-y-5">
        {ts.hasTypes && (
          <div className="max-w-lg">
            <p className="text-white/40 text-xs uppercase tracking-[0.15em] mb-2">
              {es ? "Tipos de boleto" : "Ticket types"}
            </p>
            <ul className="space-y-2" data-testid="ticket-types">
              {ts.tiers.map((t) => {
                const desc = tierDescription(t, locale);
                const body = (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold break-words">{tierName(t, locale)}</p>
                      {desc && <p className="text-white/50 text-sm mt-0.5 break-words">{desc}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={t.soldOut ? "text-white/40 font-bold" : "text-[#FBBF24] font-bold"}>
                        {money(t.price)}
                      </p>
                      {t.fee > 0 && (
                        <p className="text-white/40 text-xs">
                          + {money(t.fee)} {es ? "cargo" : "fee"}
                        </p>
                      )}
                      {t.soldOut ? (
                        <p className="text-xs font-semibold uppercase text-white/60">
                          {es ? "Agotado" : "Sold out"}
                        </p>
                      ) : t.remaining != null && t.remaining <= SHOW_LEFT_BELOW ? (
                        <p className="text-xs text-[#FBBF24]/80">
                          {es ? `Quedan ${t.remaining}` : `${t.remaining} left`}
                        </p>
                      ) : null}
                    </div>
                  </>
                );
                return (
                  <li key={t.id}>
                    {t.soldOut ? (
                      <div className="flex items-start gap-4 border border-white/10 bg-white/[0.02] px-4 py-3 opacity-60">
                        {body}
                      </div>
                    ) : (
                      <Link
                        href={`${buyHref}?tipo=${encodeURIComponent(t.id)}`}
                        className="flex items-start gap-4 border border-white/10 hover:border-[#FBBF24]/50 bg-white/[0.03] px-4 py-3 transition-colors"
                      >
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div>
          <Link href={buyHref} className={HERO_BTN}>
            {buyLabel(ts, locale)}
            <ArrowRight className="w-5 h-5" />
          </Link>
          {ts.feePercent > 0 && (
            <p className="mt-3 text-sm text-white/50" data-testid="fee-note">
              {!ts.hasTypes && ts.tiers[0]
                ? feeBreakdown(ts.tiers[0], locale)
                : es
                  ? `Precio de cada boleto + cargo por servicio (${percentLabel(ts.feePercent)}). Ves el total antes de pagar.`
                  : `Each ticket's price + service fee (${percentLabel(ts.feePercent)}). You see the total before paying.`}
            </p>
          )}
        </div>
      </div>
    );
  }

  const tiers = displayTiers(event);
  const external = event.external_tickets_url?.trim();
  if (external || tiers.length > 0) {
    return (
      <div className="space-y-5">
        {tiers.length > 0 && (
          <div className="max-w-md">
            <p className="text-white/40 text-xs uppercase tracking-[0.15em] mb-2">
              {es ? "Precios de entradas" : "Ticket prices"}
            </p>
            <ul className="space-y-1.5">
              {tiers.map((t) => {
                const desc = tierDescription(t, locale);
                return (
                  <li key={t.id || t.name}>
                    <div className="flex items-baseline gap-3">
                      <span className="text-white/80">{tierName(t, locale)}</span>
                      <span className="flex-1 border-b border-dotted border-white/15" />
                      <span className="text-[#FBBF24] font-semibold">{money(t.price)}</span>
                    </div>
                    {desc && <p className="text-white/40 text-sm">{desc}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {external ? (
          <a href={external} target="_blank" rel="noopener noreferrer" className={HERO_BTN}>
            {es ? "Comprar Boletos" : "Buy Tickets"}
            <ArrowRight className="w-5 h-5" />
          </a>
        ) : (
          <a
            href={eventReservationUrl(event, whenLabel, locale)}
            target="_blank"
            rel="noopener noreferrer"
            className={HERO_BTN}
          >
            {es ? "Más Información" : "More Info"}
            <ArrowRight className="w-5 h-5" />
          </a>
        )}
      </div>
    );
  }

  return (
    <a
      href={eventReservationUrl(event, whenLabel, locale)}
      target="_blank"
      rel="noopener noreferrer"
      className={HERO_BTN}
    >
      {es ? "Reservar Tu Lugar" : "Reserve Your Spot"}
      <ArrowRight className="w-5 h-5" />
    </a>
  );
}

/** Compact ticket button for the poster grid cards. */
export function EventCardCta({
  event,
  locale,
  whenLabel,
}: {
  event: PublicEvent;
  locale: string;
  whenLabel: string;
}) {
  const es = locale !== "en";
  const ts = ticketState(event, locale);

  if (ts.onSale && ts.soldOut) {
    return (
      <span className="block text-center bg-white/5 text-white/60 py-3 font-semibold min-h-[48px]">
        {es ? "Agotado" : "Sold Out"}
      </span>
    );
  }
  if (ts.onSale) {
    return (
      <Link
        href={`/boletos/comprar/${event.slug}`}
        className="block text-center bg-[#C2410C] hover:bg-[#9A3412] text-white py-3 px-3 font-semibold transition-colors min-h-[48px]"
      >
        {buyLabel(ts, locale, true)}
      </Link>
    );
  }

  const external = event.external_tickets_url?.trim();
  if (external) {
    const tiers = displayTiers(event).filter((t) => t.price > 0);
    const from = tiers.length ? Math.min(...tiers.map((t) => t.price)) : null;
    return (
      <a
        href={external}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center bg-[#C2410C] hover:bg-[#9A3412] text-white py-3 font-semibold transition-colors min-h-[48px]"
      >
        {es ? "Comprar Boletos" : "Buy Tickets"}
        {from != null ? ` · ${es ? "desde" : "from"} ${money(from)}` : ""}
      </a>
    );
  }

  return (
    <a
      href={eventReservationUrl(event, whenLabel, locale)}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-center bg-white/10 hover:bg-[#E85D04] text-white py-3 font-semibold transition-colors min-h-[48px]"
    >
      {es ? "Reservar" : "Reserve"}
    </a>
  );
}
