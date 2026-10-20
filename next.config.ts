import type { NextConfig } from "next";

// Set by the GitHub Pages workflow, since the site is served from
// https://thivankatech.github.io/myprofile-web/ rather than the domain root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Plain static files in ./out: host anywhere, no Node server or API needed.
  output: "export",
  basePath,
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
