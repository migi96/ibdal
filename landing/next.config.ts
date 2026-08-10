import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // stray pnpm-workspace.yaml higher up the tree confuses root inference
  turbopack: { root: __dirname },
};

export default nextConfig;
