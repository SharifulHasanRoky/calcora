import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel handles output automatically */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Exclude heavy server-only deps from the client bundle if they get imported accidentally
  serverExternalPackages: ["prisma", "@prisma/client"],
};

export default nextConfig;
