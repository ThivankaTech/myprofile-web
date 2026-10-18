import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Plain static files in ./out: host anywhere, no Node server or API needed.
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
