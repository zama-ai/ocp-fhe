import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*?)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin', // Matched parameters can be used in the value
          },
          {
            key: 'Cross-Origin-Embedder-Policy', // Matched parameters can be used in the key
            value: 'require-corp',
          },
        ],
      },
    ];
  },
  devIndicators: {
    position: 'bottom-right',
  },
};

export default nextConfig;
