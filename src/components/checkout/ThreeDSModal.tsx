"use client";

import { useEffect, useRef, useState } from "react";
import { X, ShieldCheck } from "lucide-react";

export type ThreeDSResult =
  | { type: "paid"; orderId: string; authorizationCode: string | null }
  | { type: "failed"; orderId: string; message: string }
  | { type: "timeout"; orderId: string }
  | { type: "closed"; orderId: string };

interface ThreeDSModalProps {
  orderId: string;
  redirectData: string;
  onResult: (r: ThreeDSResult) => void;
  onClose: () => void;
}

/**
 * Renders the Powertranz RedirectData HTML inside an iframe, then listens for
 * the breakout `postMessage({ type: 'pt_result', ... })` from our callback
 * route. Falls back to polling `/api/payments/status` if postMessage never
 * arrives (e.g. CSP blocks it or user navigated away inside iframe).
 */
export function ThreeDSModal({
  orderId,
  redirectData,
  onResult,
  onClose,
}: ThreeDSModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [phase, setPhase] = useState<"authenticating" | "finalizing">(
    "authenticating",
  );
  const resolvedRef = useRef(false);

  // postMessage listener — primary path.
  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (resolvedRef.current) return;
      const origin = window.location.origin;
      if (ev.origin !== origin) return;
      const data = ev.data as
        | { type?: string; status?: string; orderId?: string; message?: string; authorizationCode?: string | null }
        | null;
      if (!data || data.type !== "pt_result") return;
      if (data.orderId !== orderId) return;

      resolvedRef.current = true;
      if (data.status === "paid") {
        onResult({
          type: "paid",
          orderId,
          authorizationCode: data.authorizationCode ?? null,
        });
      } else {
        onResult({
          type: "failed",
          orderId,
          message: data.message || "El pago no pudo completarse.",
        });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [orderId, onResult]);

  // Polling fallback — kicks in after 8s if still unresolved.
  useEffect(() => {
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
    const fallbackStart = setTimeout(() => {
      if (resolvedRef.current) return;
      setPhase("finalizing");
      pollTimer = setInterval(async () => {
        if (resolvedRef.current) return;
        try {
          const res = await fetch(`/api/payments/status?orderId=${orderId}`, {
            cache: "no-store",
          });
          const body = await res.json();
          const s = body?.order?.paymentStatus;
          if (s === "paid") {
            resolvedRef.current = true;
            onResult({
              type: "paid",
              orderId,
              authorizationCode: body.order.authorizationCode ?? null,
            });
          } else if (s === "failed" || s === "voided") {
            resolvedRef.current = true;
            onResult({
              type: "failed",
              orderId,
              message: body.order.errorMessage || "El pago no pudo completarse.",
            });
          }
        } catch {
          /* keep trying */
        }
      }, 3000);
    }, 8000);

    timeoutTimer = setTimeout(() => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      onResult({ type: "timeout", orderId });
    }, 120_000);

    return () => {
      clearTimeout(fallbackStart);
      if (pollTimer) clearInterval(pollTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [orderId, onResult]);

  const handleClose = () => {
    if (resolvedRef.current) {
      onClose();
      return;
    }
    resolvedRef.current = true;
    onResult({ type: "closed", orderId });
  };

  // Escape key to close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Autenticación 3D-Secure"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-xl bg-[#0a0a0a] border border-[#3D3936] shadow-2xl">
        <header className="flex items-center justify-between p-4 border-b border-[#3D3936]">
          <div className="flex items-center gap-2 text-[#FFF8F0] text-sm">
            <ShieldCheck className="w-5 h-5 text-[#C9A84C]" />
            <span>
              {phase === "authenticating"
                ? "Autenticación con tu banco"
                : "Finalizando pago"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar ventana de autenticación"
            className="p-1 text-[#B8B0A8] hover:text-[#FFF8F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="bg-white">
          <iframe
            ref={iframeRef}
            title="3D-Secure authentication"
            srcDoc={redirectData}
            sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
            className="w-full h-[520px] border-0"
          />
        </div>

        <footer className="p-3 text-xs text-[#6B6560] text-center">
          Tu información está protegida por 3D-Secure. Nunca almacenamos los
          datos de tu tarjeta.
        </footer>
      </div>
    </div>
  );
}
