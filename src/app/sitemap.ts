import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rentinfra.com'
  const supabase = await createClient()

  const { data: cars } = await supabase.from('cars').select('slug, updated_at').eq('is_active', true)
  const { data: posts } = await supabase.from('blog_posts').select('slug, updated_at').eq('is_published', true)

  const staticPages = [
    { url: baseUrl, priority: 1.0 },
    { url: `${baseUrl}/cars`, priority: 0.9 },
    { url: `${baseUrl}/contact`, priority: 0.7 },
    { url: `${baseUrl}/blog`, priority: 0.8 },
    { url: `${baseUrl}/faq`, priority: 0.7 },
    { url: `${baseUrl}/my-booking`, priority: 0.5 },
    { url: `${baseUrl}/customer-care`, priority: 0.6 },
    { url: `${baseUrl}/terms`, priority: 0.4 },
    { url: `${baseUrl}/privacy`, priority: 0.4 },
  ]

  const carPages = (cars || []).map(car => ({
    url: `${baseUrl}/cars/${car.slug}`,
    lastModified: new Date(car.updated_at),
    priority: 0.8,
  }))

  const blogPages = (posts || []).map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    priority: 0.7,
  }))

  return [
    ...staticPages.map(p => ({ ...p, lastModified: new Date(), changeFrequency: 'weekly' as const })),
    ...carPages,
    ...blogPages,
  ]
}
