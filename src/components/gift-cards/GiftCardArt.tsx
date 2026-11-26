/**
 * The digital gift card itself — modelled on the client's printed card (deep
 * red, gold foil "SIMMER DOWN", gold band, snowflakes). Pure presentation:
 * used as the live preview on /giftcard and as the card on /regalo/[token].
 * print-color-adjust keeps the red when someone prints it.
 */

import Image from "next/image";
import { Snowflake } from "lucide-react";
import { BRAND_LOGO } from "@/lib/brand";

interface Props {
  /** Face value printed on the card. */
  amount: number | null;
  recipientName?: string | null;
  /** Small "Saldo" line under the value (view page only). */
  balanceLine?: string | null;
  dimmed?: boolean;
  className?: string;
}

const GOLD_TEXT: React.CSSProperties = {
  backgroundImage: "linear-gradient(180deg, #FFF1B8 0%, #F5C451 45%, #C9952F 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const FLAKES = [
  "left-[6%] top-[10%] w-10 h-10",
  "right-[10%] top-[6%] w-14 h-14",
  "left-[38%] top-[34%] w-8 h-8",
  "right-[30%] bottom-[30%] w-12 h-12",
  "left-[14%] bottom-[12%] w-9 h-9",
];

export default function GiftCardArt({ amount, recipientName, balanceLine, dimmed, className = "" }: Props) {
  const value = amount != null && amount > 0 ? `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}` : "$—";
  return (
    <div
      className={`relative aspect-[1.586] w-full overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(120,10,30,0.45)] ring-1 ring-[#F5C451]/30 ${dimmed ? "grayscale opacity-60" : ""} ${className}`}
      style={{
        background: "radial-gradient(120% 140% at 20% 0%, #C4223A 0%, #9B1B30 45%, #5E0C1A 100%)",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
      data-testid="gift-card-art"
    >
      {FLAKES.map((f) => (
        <Snowflake key={f} aria-hidden className={`absolute text-white/10 ${f}`} strokeWidth={1.2} />
      ))}
      {/* sheen */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.10) 45%, transparent 60%)" }}
      />

      <div className="absolute left-[6%] top-[9%] h-[22%] w-[42%]">
        {/* White outline: the wordmark's red "SIMMER" would vanish on the red card. */}
        <Image
          src={BRAND_LOGO.src}
          alt="Simmer Down"
          fill
          className="object-contain object-left"
          sizes="200px"
          style={{ filter: "drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff) drop-shadow(0 2px 3px rgba(0,0,0,0.35))" }}
        />
      </div>
      <p
        className="absolute right-[6%] top-[11%] font-display text-[clamp(0.8rem,3.2vw,1.15rem)] tracking-[0.3em]"
        style={GOLD_TEXT}
      >
        GIFT CARD
      </p>

      {recipientName && (
        <p className="absolute left-[6%] top-[42%] max-w-[60%] truncate text-[clamp(0.7rem,2.8vw,0.95rem)] text-white/85">
          Para <span className="font-semibold text-white">{recipientName}</span>
        </p>
      )}

      {/* gold band */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-[30%] h-[6%]"
        style={{ background: "linear-gradient(90deg, #C9952F, #FFE7A8 50%, #C9952F)" }}
      />

      <div className="absolute bottom-[6%] left-[6%] right-[6%] flex items-end justify-between gap-3">
        <div>
          <p className="font-display leading-none text-[clamp(2.2rem,11vw,3.6rem)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]" style={GOLD_TEXT}>
            {value}
          </p>
          <p className="mt-1 font-display text-[clamp(0.55rem,2.2vw,0.75rem)] tracking-[0.25em] text-[#FFE7A8]/90">
            DÓLARES CANJEABLES
          </p>
        </div>
        {balanceLine && (
          <p className="rounded-full bg-black/30 px-3 py-1 text-[clamp(0.65rem,2.6vw,0.85rem)] font-semibold text-white backdrop-blur-sm">
            {balanceLine}
          </p>
        )}
      </div>
    </div>
  );
}
