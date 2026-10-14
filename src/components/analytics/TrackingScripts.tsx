"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { trackPageview } from "@/lib/track";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// GA4 + Meta Pixel loaders — render NOTHING until the IDs exist in Vercel env
// (NEXT_PUBLIC_GA4_ID / NEXT_PUBLIC_META_PIXEL_ID), so the site ships ad-ready
// with zero third-party weight today. SPA navigations are tracked manually via
// usePathname (gtag/fbq only auto-track the first full page load).
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
    if (GA4_ID || META_PIXEL_ID) trackPageview(pathname);
  }, [pathname]);

  if (!GA4_ID && !META_PIXEL_ID) return null;

  return (
    <>
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
