import { Flame } from "lucide-react";

export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-[#2D2A26] pt-20">
      {/* Header Skeleton */}
      <section className="py-16 border-b border-[#3D3936]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-6 bg-[#3D3936] w-32 mb-4" />
            <div className="h-12 bg-[#3D3936] w-64 mb-4" />
            <div className="h-4 bg-[#3D3936] w-96 max-w-full" />
          </div>
        </div>
      </section>

      {/* Category Filter Skeleton */}
      <section className="sticky top-20 z-30 bg-[#2D2A26] border-b border-[#3D3936]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-10 w-24 bg-[#3D3936] animate-pulse flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Menu Grid Skeleton */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-[#252320] mb-4" />
                <div className="flex justify-between mb-2">
                  <div className="h-5 bg-[#3D3936] w-3/4" />
                  <div className="h-5 bg-[#3D3936] w-16" />
                </div>
                <div className="h-3 bg-[#3D3936] w-full mb-1" />
                <div className="h-3 bg-[#3D3936] w-2/3" />
                <div className="h-14 bg-[#3D3936] w-full mt-4" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Centered Loading Indicator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#252320] border border-[#3D3936] px-6 py-3 flex items-center gap-3">
        <Flame className="w-5 h-5 text-[#FF6B35] animate-pulse" />
        <span className="text-[#B8B0A8] text-sm">Cargando menu...</span>
      </div>
    </div>
  );
}
