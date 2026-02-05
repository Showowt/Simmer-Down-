'use client'

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-4 focus:left-4 focus:z-[9999]
        focus:bg-orange-500 focus:text-white
        focus:px-6 focus:py-3 focus:font-semibold
        focus:outline-none focus:ring-2 focus:ring-white
      "
    >
      Saltar al contenido principal
    </a>
  )
}
