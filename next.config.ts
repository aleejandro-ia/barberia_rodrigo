import type { NextConfig } from 'next'

// Baseline security headers. Intentionally NO Content-Security-Policy: a strict
// CSP would need to allowlist Next.js/motion inline styles and runtime chunks,
// and getting it wrong silently breaks the app — out of scope for this pass.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS is a no-op over plain HTTP and only takes effect on HTTPS (Vercel).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Kept intentionally: seed/demo data may still reference picsum.photos
      // placeholder images. Removing it would break those <Image> renders.
      // Safe to drop once the DB is confirmed free of picsum URLs.
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
