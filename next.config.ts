import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // API 代理: 浏览器用相对路径 /api/ → Next.js 服务端转发到 Nginx Gateway
  async rewrites() {
    const gatewayUrl = process.env.API_GATEWAY_URL || 'http://nginx:80';
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${gatewayUrl}/api/:path*`,
        },
        {
          source: '/ai/:path*',
          destination: `${gatewayUrl}/ai/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
