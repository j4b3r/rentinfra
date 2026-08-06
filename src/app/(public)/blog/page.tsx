import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { Calendar, Tag } from 'lucide-react'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Car Rental Tips & Travel Guide | RentInfra Blog',
  description: 'Expert tips on renting a car, the best road trips, and your complete travel guide.',
  keywords: 'travel guide, road trips, car rental tips, things to do',
  openGraph: {
    title: 'RentInfra Blog — Travel Tips & Driving Guides',
    description: 'Explore the best drives, hidden gems and travel tips.',
    url: absoluteUrl('/blog'),
    type: 'website',
  },
}

export default async function BlogPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#0A1F44] py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Travel Guide & Tips</h1>
          <p className="text-gray-400 mt-2">Driving routes, local tips and everything you need to explore the Costa del Sol</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts?.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
              {post.cover_image && (
                <div className="relative h-48 overflow-hidden">
                  <Image src={post.cover_image} alt={post.title_en} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              <div className="p-5">
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <Tag size={12} className="text-[#C9A84C]" />
                    <span className="text-xs text-[#C9A84C] font-medium capitalize">{post.tags[0]}</span>
                  </div>
                )}
                <h2 className="font-bold text-[#0A1F44] text-base leading-snug mb-2 group-hover:text-[#C9A84C] transition-colors">
                  {post.title_en}
                </h2>
                <p className="text-gray-500 text-sm line-clamp-2">{post.excerpt_en}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                  <Calendar size={12} />
                  {new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
