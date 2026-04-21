import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react", "@google/genai"],
  },
  async headers() {
    return [
      {
        // Required for @ffmpeg/ffmpeg (SharedArrayBuffer / WASM threads)
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/wallet",
        destination: "/subscription",
        permanent: true,
      },
      {
        source: "/challenges",
        destination: "/ranking",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
