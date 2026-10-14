// ============================================================
// Conversion tracking — GA4 (gtag) + Meta Pixel (fbq) wrappers.
//
// DORMANT until NEXT_PUBLIC_GA4_ID / NEXT_PUBLIC_META_PIXEL_ID are set in
// Vercel (see TrackingScripts.tsx): every call is a safe no-op when the
// scripts aren't loaded, so this can ship before the ad accounts exist.
// All amounts are USD.
// ============================================================

type GtagFn = (...args: unknown[]) => void;
type FbqFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    fbq?: FbqFn;
    dataLayer?: unknown[];
  }
}

function gtag(...args: unknown[]): void {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag(...args);
    }
  } catch (error) {
    console.error("[track] gtag", error);
  }
}

function fbq(...args: unknown[]): void {
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq(...args);
    }
  } catch (error) {
    console.error("[track] fbq", error);
  }
}

/** SPA route change — GA4 page_view + Meta PageView. */
export function trackPageview(path: string): void {
  gtag("event", "page_view", {
    page_path: path,
    page_location:
      typeof window !== "undefined" ? window.location.href : undefined,
  });
  fbq("track", "PageView");
}

/** Card payment approved — fires once per order (food, event tickets, estadía). */
export function trackPurchase(params: {
  value: number;
  transactionId: string;
}): void {
  const { value, transactionId } = params;
  // Dedupe across remounts/refreshes of the success screen.
  try {
    const key = `trk_purchase_${transactionId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* storage unavailable (private mode) — still fire, worst case a dupe */
  }
  gtag("event", "purchase", {
    transaction_id: transactionId,
    value,
    currency: "USD",
  });
  fbq("track", "Purchase", { value, currency: "USD" });
}

/** High-intent non-payment conversion (reservation request, room inquiry…). */
export function trackLead(leadType: string): void {
  gtag("event", "generate_lead", { lead_type: leadType });
  fbq("track", "Lead", { content_name: leadType });
}

/** Checkout page opened with a cart. */
export function trackBeginCheckout(value?: number): void {
  gtag("event", "begin_checkout", {
    ...(typeof value === "number" ? { value, currency: "USD" } : {}),
  });
  fbq("track", "InitiateCheckout", {
    ...(typeof value === "number" ? { value, currency: "USD" } : {}),
  });
}
