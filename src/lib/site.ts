/**
 * The site's own public URL.
 *
 * SEO metadata (canonical links, Open Graph, sitemap, JSON-LD) used to hardcode
 * `https://rentinfra.com` in a dozen files, so every fork advertised someone
 * else's domain as canonical — which tells search engines the fork is a
 * duplicate of a site it has nothing to do with.
 *
 * Set NEXT_PUBLIC_SITE_URL and everything follows. Note it is read at build
 * time, so changing it needs a redeploy.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/$/, '')

/** Absolute URL for a path, e.g. absoluteUrl('/cars') */
export function absoluteUrl(path = ''): string {
  return `${SITE_URL}${path.startsWith('/') || path === '' ? path : `/${path}`}`
}

/** Hostname without protocol, for display: "demo.rentinfra.infranomad.com" */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '')
