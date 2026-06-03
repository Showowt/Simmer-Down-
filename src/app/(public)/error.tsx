"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Public section error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6 pt-24">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 bg-[#E85D04]/10 flex items-center justify-center mx-auto mb-8">
          <AlertTriangle className="w-10 h-10 text-[#E85D04]" />
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl text-white mb-4">
          Algo salio mal
        </h1>
        <p className="text-white/60 mb-2">Something went wrong</p>

        {/* Description */}
        <p className="text-white/40 mb-8">
          Lo sentimos, ocurrio un error al cargar esta pagina. Por favor intenta
          de nuevo.
        </p>

        {/* Error Digest (for debugging) */}
        {error.digest && (
          <p className="text-xs text-white/40 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-[#E85D04] hover:bg-[#C2410C] text-white px-8 py-4 font-semibold transition-colors min-h-[56px]"
          >
            <RefreshCw className="w-5 h-5" />
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 font-semibold transition-colors min-h-[56px]"
          >
            <Home className="w-5 h-5" />
            Ir al Inicio
          </Link>
        </div>

        {/* Back Link */}
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 mt-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver atras
        </button>
      </div>
    </div>
  );
}
