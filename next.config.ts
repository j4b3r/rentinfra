import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Any Supabase project's public Storage bucket. This matches the
        // `<project-ref>.supabase.co` host of whichever project you point
        // NEXT_PUBLIC_SUPABASE_URL at, so no edit is needed when you fork.
        protocol: 'https',
        hostname: '*.supabase.co',
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
