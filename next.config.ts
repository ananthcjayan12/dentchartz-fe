import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Disable ESLint errors during production builds.
  // ⚠️ Note: This is only recommended if you want to quickly run the app, not for production quality assurance.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type errors during production builds.
  // ⚠️ Note: This allows production builds despite type-check errors, which is not recommended.
  typescript: {
    ignoreBuildErrors: true,
  },
  /* other config options can be added here as needed */
};

export default nextConfig;
