import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Example project ref — replace with your own Supabase project's storage hostname
        protocol: 'https',
        hostname: 'dbjgaorvsdvumlusntji.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        // TODO: replace with your own deployment's domain if you host images there
        protocol: 'https',
        hostname: 'rentinfra.com',
      },
    ],
  },
}

export default withNextIntl(nextConfig)
