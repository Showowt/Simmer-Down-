"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#2D2A26] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 bg-[#FF6B35]/10 flex items-center justify-center mx-auto mb-8">
          <AlertTriangle className="w-10 h-10 text-[#FF6B35]" />
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl text-[#FFF8F0] mb-4">
          Algo salio mal
        </h1>
        <p className="text-[#B8B0A8] mb-2">Something went wrong</p>

        {/* Description */}
        <p className="text-[#6B6560] mb-8">
          Lo sentimos, ocurrio un error inesperado. Por favor intenta de nuevo.
        </p>

        {/* Error Digest (for debugging) */}
        {error.digest && (
          <p className="text-xs text-[#6B6560] mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-8 py-4 font-semibold transition-colors min-h-[56px]"
          >
            <RefreshCw className="w-5 h-5" />
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#3D3936] hover:bg-[#4A4642] text-[#FFF8F0] px-8 py-4 font-semibold transition-colors min-h-[56px]"
          >
            <Home className="w-5 h-5" />
            Ir al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
