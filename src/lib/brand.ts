// ============================================================
// Brand assets — one switch for seasonal logos.
//
// SEASON 'navidad' = the client's Christmas logos (sent 2026-11-26):
// the Santa-hat wordmark (cut from "LOGO NAVIDEÑO COLOR FONDO NEGRO", black
// background removed for the dark site) and La Llamita with the hat, as a
// white-outlined sticker so she reads on ANIMA's orange button.
//
// Deliberately a constant, not a date check: the header and home page are
// prerendered, so a clock-based switch would bake one logo at build time and
// hydrate another in the browser (React #418). Back to the regular logos in
// January: set SEASON = null and deploy.
// ============================================================

export const SEASON: "navidad" | null = "navidad";

export interface BrandImage {
  src: string;
  width: number;
  height: number;
}

const REGULAR_LOGO: BrandImage = { src: "/logos/logo-simmer-light.svg", width: 870, height: 345 };
const NAVIDAD_LOGO: BrandImage = { src: "/logos/navidad/simmer-down-navidad.png", width: 1173, height: 548 };

const REGULAR_MASCOT: BrandImage = { src: "/logos/la-llamita.png", width: 55, height: 100 };
const NAVIDAD_MASCOT: BrandImage = { src: "/logos/navidad/llamita-navidad.png", width: 204, height: 256 };

/** Full wordmark (flame + SIMMER DOWN + tagline) for dark backgrounds. */
export const BRAND_LOGO: BrandImage = SEASON === "navidad" ? NAVIDAD_LOGO : REGULAR_LOGO;

/** La Llamita — ANIMA's launcher and chat avatar. */
export const BRAND_MASCOT: BrandImage = SEASON === "navidad" ? NAVIDAD_MASCOT : REGULAR_MASCOT;

/**
 * The Christmas wordmark carries a hat above the flame, so at the same
 * height its letters are smaller — logos sit one step taller while it's on.
 */
export function logoHeightClass(regular: string, seasonal: string): string {
  return SEASON === "navidad" ? seasonal : regular;
}
