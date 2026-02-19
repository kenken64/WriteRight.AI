const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@writeright/ai'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  outputFileTracingRoot: path.join(__dirname, '../../'),
  serverExternalPackages: ['@google-cloud/vision', 'pdf-to-img', 'pdfjs-dist', 'canvas'],
};

module.exports = nextConfig;
