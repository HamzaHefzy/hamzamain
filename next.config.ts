import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const legacyRedirects = [
  { source: "/attendance/:path*", destination: "/assistant", permanent: false },
  { source: "/cases/:path*", destination: "/assistant", permanent: false },
  { source: "/evidence/:path*", destination: "/assistant", permanent: false },
  { source: "/funding/:path*", destination: "/assistant", permanent: false },
  { source: "/recovery/:path*", destination: "/assistant", permanent: false },
  { source: "/value/:path*", destination: "/assistant", permanent: false },
  { source: "/virtual/:path*", destination: "/assistant", permanent: false },
  { source: "/launch/:path*", destination: "/assistant", permanent: false },
  { source: "/audit/:path*", destination: "/assistant/activity", permanent: false },
  { source: "/integrations/:path*", destination: "/assistant/connections", permanent: false },
  { source: "/settings/:path*", destination: "/assistant/authority", permanent: false },
  { source: "/data-governance/:path*", destination: "/privacy", permanent: false },
  { source: "/request-demo/:path*", destination: "/signup", permanent: false },
];

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    return legacyRedirects;
  },
};

export default nextConfig;
