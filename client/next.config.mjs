const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const apiUrlWithProto = rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
  ? rawApiUrl
  : `https://${rawApiUrl}`;
const backendBaseUrl = apiUrlWithProto.replace(/\/+$/, '').replace(/\/api$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendBaseUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendBaseUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
