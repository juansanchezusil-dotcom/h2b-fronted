import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://h2b-backend-three.vercel.app/api/:path*',
      },
    ];
  },
};

export default nextConfig;
