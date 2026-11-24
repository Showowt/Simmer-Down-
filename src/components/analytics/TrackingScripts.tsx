"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { trackPageview } from "@/lib/track";

// Google Tag Manager container (client's own, GTM-PQW4RLQQ — set in Vercel
// PRODUCTION only, so previews / local dev never pollute their GA4 data).
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// GTM + GA4 + Meta Pixel loaders — render NOTHING until the IDs exist in
// Vercel env (NEXT_PUBLIC_GTM_ID / NEXT_PUBLIC_GA4_ID / NEXT_PUBLIC_META_PIXEL_ID),
// so the site ships ad-ready with zero third-party weight otherwise.
//
// GTM: the canonical snippet (gtm.start event + gtm.js + <noscript> iframe).
// With GTM alone, window.gtag becomes a dataLayer shim so every
// lib/track.ts call (purchase, begin_checkout, …) reaches GTM as a custom
// event of that name — the client wires GA4 tags to them inside GTM.
// SPA navigations are tracked manually via usePathname (gtag/fbq only
// auto-track the first full page load; GA4's enhanced measurement inside
// GTM handles history changes on its own, the `page_view` push is inert
// until a trigger is built for it).
export default function TrackingScripts() {
  const pathname = usePathname();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // The base snippets already report the initial page view; only report
    // CLIENT-SIDE route changes here or every entry double-counts.
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (GTM_ID || GA4_ID || META_PIXEL_ID) trackPageview(pathname);
  }, [pathname]);

  if (!GTM_ID && !GA4_ID && !META_PIXEL_ID) return null;

  return (
    <>
      {GTM_ID && (
        <>
          <Script id="gtm-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
              if (typeof window.gtag !== 'function') {
                window.gtag = function () { window.dataLayer.push(arguments); };
              }
            `}
          </Script>
          <Script
            id="gtm-container"
            src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
            strategy="afterInteractive"
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      )}
      {GA4_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA4_ID}');
            `}
          </Script>
        </>
      )}
      {META_PIXEL_ID && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
