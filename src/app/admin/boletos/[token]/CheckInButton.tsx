"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface Result {
  ok: boolean;
  reason?: string;
  admitted?: number;
  quantity?: number;
  checked_in_at?: string;
}

export default function CheckInButton({
  token,
  quantity,
  initialStatus,
}: {
  token: string;
  quantity: number;
  initialStatus: string;
}) {
  const [result, setResult] = useState<Result | null>(
    initialStatus === "used"
      ? { ok: false, reason: "already_used", admitted: quantity, quantity }
      : initialStatus === "void"
        ? { ok: false, reason: "void" }
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
      setResult(await res.json());
    } catch {
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
          Este boleto ({result.quantity}) ya se registró en la entrada.
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

  return (
    <button
      onClick={admit}
      disabled={loading}
      className="w-full py-6 bg-[#4CAF50] hover:bg-[#43A047] disabled:opacity-60 text-white text-2xl font-bold rounded-xl transition flex items-center justify-center gap-3"
    >
      {loading ? "..." : `Admitir ${quantity} →`}
    </button>
  );
}
