import type { NextConfig } from "next";
import path from "path";

// Content-Security-Policy — HARDENED.
// ★ unsafe-eval REMOVED (was neutralizing XSS protection).
// unsafe-inline kept for JSON-LD script tags and inline styles.
const baseCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.vercel.app https://*.powertranz.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
  "font-src 'self' https://fonts.gstatic.com https://api.fontshare.com data:",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://staging.ptranz.com https://gateway.ptranz.com",
  "frame-src https://staging.ptranz.com https://gateway.ptranz.com https://www.google.com https://maps.google.com",
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
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
