import type { NextConfig } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const localOrigins = appUrl ? [new URL(appUrl).hostname] : [];

const nextConfig: NextConfig = {
  output: "standalone",
  ...(localOrigins.length > 0 && { allowedDevOrigins: localOrigins }),
};

export default nextConfig;
