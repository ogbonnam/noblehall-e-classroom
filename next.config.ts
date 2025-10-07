import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        // When a request comes in for /uploads/some-file.pdf
        source: '/uploads/:path*',
        // ...internally, Next.js will fetch it from /api/uploads/some-file.pdf
        destination: '/api/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
