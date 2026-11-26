/**
 * /regalo/[token] — the digital gift card (public; the 256-bit token is the
 * capability, like /boletos/[token]). Card art + live balance, the QR staff
 * scan at the register (opens /admin/giftcards/<code>), the code to type if
 * the QR won't scan, expiry and usage history. Never indexed.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import GiftCardArt from "@/components/gift-cards/GiftCardArt";
import GiftCardActions from "@/components/gift-cards/GiftCardActions";
import { giftCardByToken } from "@/lib/gift-cards-server";
import { GIFT_STATE_LABEL, formatGiftCode, giftDateLong, giftDateTime, giftMoney } from "@/lib/gift-cards";
import { BRAND_LOGO } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tu Gift Card",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GiftCardViewPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const sp = await searchParams;
  const card = await giftCardByToken(token);
  if (!card) notFound();

  const pageUrl = `https://simmerdownsv.com/regalo/${card.view_token}`;
  const qrDataUrl = await QRCode.toDataURL(`https://simmerdownsv.com/admin/giftcards/${card.code}`, {
    margin: 1,
    width: 360,
    color: { dark: "#0A0A0A", light: "#FFFFFF" },
  });
  const active = card.state === "active";
  const isNew = sp.nueva === "1";
  const uses = card.transactions.filter((t) => t.kind === "redeem");
  const shareText =
    `🎁 ¡Tienes una Gift Card de Simmer Down por ${giftMoney(card.initial_amount)}!` +
    (card.sender_name ? ` De: ${card.sender_name}.` : "") +
    (card.message ? `\n“${card.message}”` : "") +
    `\nÁbrela aquí y muéstrala al pagar en cualquiera de nuestras 5 sucursales:\n${pageUrl}`;

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-4 py-10 text-white print:bg-white print:text-black">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex justify-center print:hidden">
          <Image src={BRAND_LOGO.src} alt="Simmer Down" width={BRAND_LOGO.width} height={BRAND_LOGO.height} className="h-12 w-auto" />
        </div>

        {isNew && active && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-center text-sm text-green-300 print:hidden" data-testid="gift-new-banner">
            ¡Listo! Tu gift card ya está activa. Guárdala o envíala por WhatsApp a quien la recibe.
          </div>
        )}

        <GiftCardArt
          amount={card.initial_amount}
          recipientName={card.recipient_name}
          balanceLine={active ? `Saldo ${giftMoney(card.balance)}` : GIFT_STATE_LABEL[card.state]}
          dimmed={!active}
        />

        {(card.sender_name || card.message) && (
          <div className="rounded-xl border border-white/10 bg-[#141414] p-4 text-center print:border-black/20 print:bg-white">
            {card.message && <p className="italic text-white/85 print:text-black">“{card.message}”</p>}
            {card.sender_name && <p className="mt-1 text-sm text-white/50 print:text-black/60">— {card.sender_name}</p>}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-[#141414] p-5 text-center print:border-black/20 print:bg-white" data-testid="gift-redeem-box">
          {active ? (
            <>
              <p className="text-sm text-white/60 print:text-black/70">Muestra este QR al pagar</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Código QR de la gift card" className="mx-auto mt-3 w-56 rounded-lg bg-white p-2" />
            </>
          ) : (
            <p className="py-6 text-lg font-semibold text-white/70 print:text-black" data-testid="gift-state">
              {GIFT_STATE_LABEL[card.state]}
            </p>
          )}
          <p className="mt-4 text-xs uppercase tracking-widest text-white/40 print:text-black/50">Código</p>
          <p className="mt-1 select-all font-mono text-xl font-bold tracking-wider" data-testid="gift-code">
            {formatGiftCode(card.code)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-left text-sm">
            <div className="rounded-lg bg-white/5 p-3 print:bg-black/5">
              <p className="text-xs text-white/40 print:text-black/50">Saldo</p>
              <p className="text-lg font-bold" data-testid="gift-balance">{giftMoney(card.balance)}</p>
              <p className="text-[11px] text-white/40 print:text-black/50">de {giftMoney(card.initial_amount)}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3 print:bg-black/5">
              <p className="text-xs text-white/40 print:text-black/50">Válida hasta</p>
              <p className="text-sm font-semibold">{giftDateLong(card.expires_at)}</p>
            </div>
          </div>
        </div>

        <GiftCardActions shareText={shareText} url={pageUrl} />

        <p className="text-center text-xs text-white/40 print:hidden">
          Quien tenga este enlace o el código puede usar la tarjeta: compártelo solo con quien la recibe.
        </p>

        {uses.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-[#141414] p-4 print:hidden" data-testid="gift-history">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Movimientos</p>
            <ul className="space-y-2 text-sm">
              {uses.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 text-white/70">
                    {giftDateTime(t.created_at)}
                    {t.location_name ? ` · ${t.location_name}` : ""}
                  </span>
                  <span className="shrink-0 tabular-nums text-white">
                    −{giftMoney(t.amount)} <span className="text-white/40">→ {giftMoney(t.balance_after)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-center text-[11px] leading-relaxed text-white/35 print:text-black/50">
          Canjeable en las 5 sucursales de Simmer Down · El saldo se descuenta en cada visita · No canjeable por
          efectivo · simmerdownsv.com
        </p>
      </div>
    </main>
  );
}
