// CSP tuned for a WebRTC app: allow ws/wss (LiveKit signalling), blob/data media,
// WASM (codecs), workers, and https media sources. Tighten further per deployment.
// Dev needs 'unsafe-eval' for the React-refresh/HMR runtime; prod uses the
// stricter 'wasm-unsafe-eval' (enough for LiveKit's WASM codecs).
const isDev = process.env.NODE_ENV !== "production";
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'";
const csp = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob: https: http:",
  "connect-src 'self' ws: wss: https:",
  "worker-src 'self' blob:",
  "font-src 'self' data:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Allow the room's own camera/mic/screen-share; deny everything else by default.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), display-capture=(self), fullscreen=(self), geolocation=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a minimal, self-contained server bundle (.next/standalone) for slim Docker images.
  output: "standalone",
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default nextConfig;
