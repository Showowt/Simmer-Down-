import type { NextConfig } from "next";
import path from "path";

// Content-Security-Policy — HARDENED.
// ★ unsafe-eval REMOVED (was neutralizing XSS protection).
// unsafe-inline kept for JSON-LD script tags and inline styles.
// Google Tag Manager (NEXT_PUBLIC_GTM_ID): scripts from googletagmanager.com,
// GA4 hits to *.google-analytics.com / *.analytics.google.com, Google Signals /
// Ads to google.com + doubleclick, tagassistant.google.com for GTM Preview.
// Google Signals (ga-audiences) pixels go to the visitor's Google ccTLD
// (google.com.sv for El Salvador, .co, .mx, .gt…) — listed explicitly, CSP
// cannot wildcard a TLD. The client's GA4 tag (G-XNL18V2PFV) already fires them.
// Any NEW third-party tag the client adds in GTM needs its host here too.
const baseCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.vercel.app https://*.powertranz.com https://www.googletagmanager.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
  "font-src 'self' https://fonts.gstatic.com https://api.fontshare.com data:",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://www.facebook.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.google.com https://*.google.com.sv https://*.google.com.gt https://*.google.com.hn https://*.google.com.ni https://*.google.com.cr https://*.google.com.pa https://*.google.com.mx https://*.google.com.co https://*.google.es https://*.doubleclick.net",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://staging.ptranz.com https://gateway.ptranz.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://graph.facebook.com https://*.google.com https://*.google.com.sv https://*.google.com.gt https://*.google.com.hn https://*.google.com.ni https://*.google.com.cr https://*.google.com.pa https://*.google.com.mx https://*.google.com.co https://*.google.es https://*.doubleclick.net https://tagassistant.google.com",
  "frame-src https: http:",
  "form-action 'self' https://staging.ptranz.com https://gateway.ptranz.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
  },
  { key: "Content-Security-Policy", value: baseCsp },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      { source: '/menu', destination: '/carta', permanent: true },
      { source: '/locations', destination: '/restaurantes', permanent: true },
      { source: '/about', destination: '/nosotros', permanent: true },
      { source: '/reservar', destination: '/reservations', permanent: true },
      { source: '/eventos', destination: '/ticketmania', permanent: true },
      // /events was the events URL until Nov 2026 — already indexed by Google
      // and shared on WhatsApp/Instagram, so these must stay.
      { source: '/events', destination: '/ticketmania', permanent: true },
      { source: '/events/:slug', destination: '/ticketmania/:slug', permanent: true },
    ];
  },
  async headers() {
    // The door scanner (/admin/boletos) needs the camera. A later entry wins
    // for the same header key, so /admin and /auth (login hands off to the
    // panel by client-side navigation, keeping its document policy) get
    // camera=(self); the public site keeps the camera off.
    const staffPermissions = "camera=(self), microphone=(), geolocation=(self), payment=(self)";
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "Permissions-Policy", value: staffPermissions }],
      },
      {
        source: "/auth/:path*",
        headers: [{ key: "Permissions-Policy", value: staffPermissions }],
      },
    ];
  },
};

export default nextConfig;
