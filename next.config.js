/** @type {import('next').NextConfig} */
const verifiedAssetPaths = require('./lib/storage/hostinger-verified-assets.json');

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/cdn-storage/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'CDN-Cache-Control', value: 'public, max-age=31536000' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://plus.unsplash.com https://osvaldobello.com https://*.osvaldobello.com https://canarock.info https://*.canarock.info https://canabay.com.do; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://www.google-analytics.com; base-uri 'self'; form-action 'self'; frame-ancestors 'self'" },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    contentDispositionType: 'attachment',
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'whrimmszdeghblbktivp.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'osvaldobello.com',
      },
      {
        protocol: 'https',
        hostname: 'canarock.info',
      },
      {
        protocol: 'https',
        hostname: 'brokers.osvaldobello.com',
      },
      {
        protocol: 'https',
        hostname: 'canabay.com.do',
      },
    ],
  },
  async rewrites() {
    return {
      // Older dossier snapshots keep /cdn-storage URLs. Only verified exact
      // paths bypass Supabase; private and not-yet-migrated objects are untouched.
      beforeFiles: verifiedAssetPaths.flatMap((assetPath) => {
        const pattern = assetPath.replace(/[.*+?^${}()|[\]\\:-]/g, '\\$&');
        const destination = `/api/media/${assetPath.split('/').map(encodeURIComponent).join('/')}`;
        return ['object', 'render/image'].map((kind) => ({
          source: `/cdn-storage/${kind}/public/public-assets/${pattern}`,
          destination,
        }));
      }),
      afterFiles: [],
      fallback: [{
        source: '/cdn-storage/:path*',
        destination: 'https://whrimmszdeghblbktivp.supabase.co/storage/v1/:path*',
      }],
    };
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '55mb',
    },
  },
  webpack: (config) => {
    const path = require('path');
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;
