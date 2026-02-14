"use client";

import { useEffect } from "react";
import {
  AlertTriangle,
  RefreshCw,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Admin section error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#1F1D1A] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 bg-[#FF6B35]/10 flex items-center justify-center mx-auto mb-8">
          <AlertTriangle className="w-10 h-10 text-[#FF6B35]" />
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl text-[#FFF8F0] mb-4">
          Error en el Panel
        </h1>
        <p className="text-[#B8B0A8] mb-2">Admin Panel Error</p>

        {/* Description */}
        <p className="text-[#6B6560] mb-8">
          Ocurrio un error en el panel de administracion. Por favor intenta de
          nuevo o contacta soporte.
        </p>

        {/* Error Digest (for debugging) */}
        {error.digest && (
          <p className="text-xs text-[#6B6560] mb-6 font-mono bg-[#252320] px-4 py-2 inline-block">
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
            href="/admin"
            className="inline-flex items-center justify-center gap-2 bg-[#3D3936] hover:bg-[#4A4642] text-[#FFF8F0] px-8 py-4 font-semibold transition-colors min-h-[56px]"
          >
            <LayoutDashboard className="w-5 h-5" />
            Ir al Panel
          </Link>
        </div>

        {/* Logout Link */}
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-[#6B6560] hover:text-[#B8B0A8] mt-8 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesion e intentar de nuevo
        </Link>
      </div>
    </div>
  );
}
