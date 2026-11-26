"use client";

/** Share / print / copy for the gift card page — hidden when printing. */

import { useState } from "react";
import { Copy, MessageCircle, Printer } from "lucide-react";

export default function GiftCardActions({ shareText, url }: { shareText: string; url: string }) {
  const [copied, setCopied] = useState(false);
  // api.whatsapp.com (not wa.me): wa.me mangles emoji in prefilled text.
  const waHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      console.error("[GiftCardActions] copy", error);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 print:hidden">
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="gift-share-whatsapp"
        className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3.5 font-semibold text-white transition hover:bg-[#1FB859]"
      >
        <MessageCircle className="w-5 h-5" /> Enviar por WhatsApp
      </a>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30"
        >
          <Printer className="w-4 h-4" /> Imprimir / PDF
        </button>
        <button
          type="button"
          onClick={copy}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30"
        >
          <Copy className="w-4 h-4" /> {copied ? "¡Copiado!" : "Copiar enlace"}
        </button>
      </div>
    </div>
  );
}
