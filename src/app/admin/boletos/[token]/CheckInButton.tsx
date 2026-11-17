"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { CheckInResult } from "@/lib/ticket-door";

export default function CheckInButton({
  token,
  quantity,
  admittedCount,
  initialStatus,
}: {
  token: string;
  quantity: number;
  admittedCount: number;
  initialStatus: string;
}) {
  // Partially admitted tickets stay 'valid' — only the rest can still enter.
  const remaining = initialStatus === "valid" ? Math.max(0, quantity - admittedCount) : 0;
  const [result, setResult] = useState<CheckInResult | null>(
    initialStatus === "void"
      ? { ok: false, reason: "void" }
      : remaining === 0
        ? { ok: false, reason: "already_used", admitted: admittedCount, quantity }
        : null,
  );
  const [loading, setLoading] = useState(false);

  const admit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = (await res.json().catch(() => null)) as CheckInResult | null;
      setResult(json ?? { ok: false, reason: "error" });
    } catch (err) {
      console.error("[CheckInButton] check-in failed", err);
      setResult({ ok: false, reason: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (result?.ok) {
    return (
      <div className="rounded-xl border border-[#4CAF50]/40 bg-[#4CAF50]/10 px-6 py-8 text-center">
        <CheckCircle className="w-16 h-16 text-[#4CAF50] mx-auto mb-3" />
        <p className="text-2xl font-bold text-white">Admitido ✓</p>
        <p className="text-white/60 mt-1">Dejar entrar a {result.admitted} persona(s)</p>
      </div>
    );
  }

  if (result && !result.ok && result.reason === "already_used") {
    return (
      <div className="rounded-xl border border-[#FFB800]/40 bg-[#FFB800]/10 px-6 py-8 text-center">
        <AlertTriangle className="w-16 h-16 text-[#FFB800] mx-auto mb-3" />
        <p className="text-2xl font-bold text-white">Ya fue usado</p>
        <p className="text-white/60 mt-1">
          Este boleto ({result.quantity ?? quantity}) ya se registró en la entrada.
        </p>
      </div>
    );
  }

  if (result && !result.ok && (result.reason === "void" || result.reason === "not_found")) {
    return (
      <div className="rounded-xl border border-[#C73E1D]/40 bg-[#C73E1D]/10 px-6 py-8 text-center">
        <XCircle className="w-16 h-16 text-[#FF6B6B] mx-auto mb-3" />
        <p className="text-2xl font-bold text-white">
          {result.reason === "void" ? "Boleto anulado" : "Boleto no encontrado"}
        </p>
      </div>
    );
  }

  if (result && !result.ok && result.reason === "unauthorized") {
    return (
      <div className="rounded-xl border border-[#C73E1D]/40 bg-[#C73E1D]/10 px-6 py-6 text-center">
        <p className="text-lg font-bold text-white">Tu sesión expiró</p>
        <Link
          href={`/auth/login?redirect=/admin/boletos/${token}`}
          className="inline-block mt-3 px-6 py-3 bg-[#FF6B35] text-white font-semibold rounded-xl"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {admittedCount > 0 && (
        <p className="text-center text-sm text-[#FFB800]">
          Ya entraron {admittedCount} de {quantity}. Quedan {remaining}.
        </p>
      )}
      {result && !result.ok && (
        <p className="text-center text-sm text-red-400">
          No se pudo registrar la entrada. Revisa el internet e intenta de nuevo.
        </p>
      )}
      <button
        onClick={admit}
        disabled={loading}
        className="w-full py-6 bg-[#4CAF50] hover:bg-[#43A047] disabled:opacity-60 text-white text-2xl font-bold rounded-xl transition flex items-center justify-center gap-3"
      >
        {loading ? "..." : `Admitir ${remaining} →`}
      </button>
    </div>
  );
}
