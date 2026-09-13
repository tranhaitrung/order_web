import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // `output: "standalone"` bundles a self-contained server for the Docker deployment (see
  // docker-compose.yml) but breaks Vercel's own build pipeline, which expects the default
  // output format and manages its own optimized packaging. Vercel sets VERCEL=1 automatically
  // during builds, so standalone mode is only enabled when NOT building on Vercel.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  images: {
    // Menu item images can be any external link an admin pastes in — allow any https host.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
