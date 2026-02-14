import { Flame } from "lucide-react";

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-[#2D2A26] pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-4 bg-[#3D3936] w-32 mb-4" />
          <div className="h-10 bg-[#3D3936] w-48 mb-2" />
          <div className="h-4 bg-[#3D3936] w-32" />
        </div>

        {/* Order Type Skeleton */}
        <div className="bg-[#252320] border border-[#3D3936] p-6 mb-6 animate-pulse">
          <div className="h-6 bg-[#3D3936] w-32 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-14 bg-[#3D3936]" />
            <div className="h-14 bg-[#3D3936]" />
          </div>
        </div>

        {/* Location Skeleton */}
        <div className="bg-[#252320] border border-[#3D3936] p-6 mb-6 animate-pulse">
          <div className="h-6 bg-[#3D3936] w-24 mb-4" />
          <div className="h-12 bg-[#1F1D1A] border border-[#3D3936]" />
        </div>

        {/* Contact Info Skeleton */}
        <div className="bg-[#252320] border border-[#3D3936] p-6 mb-6 animate-pulse">
          <div className="h-6 bg-[#3D3936] w-48 mb-4" />
          <div className="space-y-4">
            <div className="h-12 bg-[#1F1D1A] border border-[#3D3936]" />
            <div className="h-12 bg-[#1F1D1A] border border-[#3D3936]" />
            <div className="h-12 bg-[#1F1D1A] border border-[#3D3936]" />
          </div>
        </div>

        {/* Order Summary Skeleton */}
        <div className="bg-[#252320] border border-[#3D3936] p-6 mb-6 animate-pulse">
          <div className="h-6 bg-[#3D3936] w-40 mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-[#3D3936] w-32" />
                <div className="h-4 bg-[#3D3936] w-16" />
              </div>
            ))}
            <div className="border-t border-[#3D3936] pt-3 mt-3">
              <div className="flex justify-between">
                <div className="h-6 bg-[#3D3936] w-16" />
                <div className="h-6 bg-[#3D3936] w-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button Skeleton */}
        <div className="h-14 bg-[#3D3936] w-full animate-pulse" />

        {/* Centered Loading Indicator */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#252320] border border-[#3D3936] px-6 py-3 flex items-center gap-3">
          <Flame className="w-5 h-5 text-[#FF6B35] animate-pulse" />
          <span className="text-[#B8B0A8] text-sm">Cargando checkout...</span>
        </div>
      </div>
    </div>
  );
}
