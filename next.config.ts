import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to silence webpack migration warning
  turbopack: {},

  // Mark firebase-admin as external so it's not bundled on the client
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
