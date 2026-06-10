import { Flame } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#2D2A26] flex items-center justify-center">
      <div className="text-center">
        {/* Animated Spinner */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-[white/10]" />
          <div className="absolute inset-0 border-4 border-transparent border-t-[#E85D04] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Flame className="w-6 h-6 text-[#E85D04] animate-pulse" />
          </div>
        </div>

        {/* Loading Text */}
        <p className="text-[#B8B0A8] font-medium">Cargando...</p>
        <p className="text-[#6B6560] text-sm mt-1">Loading...</p>
      </div>
    </div>
  );
}
