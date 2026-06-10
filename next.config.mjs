/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a minimal, self-contained server bundle (.next/standalone) for slim Docker images.
  output: "standalone",
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};
export default nextConfig;
