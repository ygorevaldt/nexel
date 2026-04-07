import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 301 permanent redirect: /wallet → /subscription
      // Old gambling wallet page is now the subscriptions/plans page
      {
        source: "/wallet",
        destination: "/subscription",
        permanent: true,
      },
      // Also redirect old challenge betting pages to the ranking
      {
        source: "/challenges",
        destination: "/ranking",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
