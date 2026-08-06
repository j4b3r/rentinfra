import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { Calendar, ChevronLeft, Tag } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase.from('blog_posts').select('*').eq('slug', slug).single()
  if (!post) return {}
  return {
    title: `${post.title_en} | RentInfra Blog`,
    description: post.excerpt_en,
    keywords: post.tags?.join(', '),
    openGraph: {
      title: post.title_en,
      description: post.excerpt_en,
      url: `https://rentinfra.com/blog/${slug}`,
      type: 'article',
      publishedTime: post.published_at,
      images: post.cover_image ? [{ url: post.cover_image }] : [],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title_en,
    description: post.excerpt_en,
    image: post.cover_image,
    datePublished: post.published_at,
    author: { '@type': 'Organization', name: 'RentInfra' },
    publisher: {
      '@type': 'Organization',
      name: 'RentInfra',
      url: 'https://rentinfra.com',
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-[#F8F9FA]">
        {post.cover_image && (
          <div className="relative h-64 md:h-80 w-full">
            <Image src={post.cover_image} alt={post.title_en} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F44]/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 max-w-3xl mx-auto">
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <Tag size={12} className="text-[#C9A84C]" />
                  <span className="text-xs text-[#C9A84C] font-medium capitalize">{post.tags[0]}</span>
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-white">{post.title_en}</h1>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/blog" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#C9A84C] mb-6 transition-colors">
            <ChevronLeft size={16} /> Back to Blog
          </Link>

          {!post.cover_image && (
            <h1 className="text-3xl font-bold text-[#0A1F44] mb-4">{post.title_en}</h1>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span>By {post.author}</span>
          </div>

          {post.excerpt_en && (
            <p className="text-lg text-gray-600 leading-relaxed mb-6 font-medium border-l-4 border-[#C9A84C] pl-4">
              {post.excerpt_en}
            </p>
          )}

          <div
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed
              [&_h2]:text-[#0A1F44] [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3
              [&_h3]:text-[#0A1F44] [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2
              [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
              [&_a]:text-[#C9A84C] [&_a]:font-medium [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: post.content_en }}
          />

          <div className="mt-10 pt-6 border-t border-gray-200">
            <div className="bg-[#0A1F44] rounded-xl p-6 text-center">
              <p className="text-white font-bold text-lg mb-2">Ready to explore the Costa del Sol?</p>
              <p className="text-gray-400 text-sm mb-4">Book your rental car from RentInfra — airport and hotel delivery available.</p>
              <Link href="/cars"
                className="inline-block bg-[#C9A84C] text-[#0A1F44] px-6 py-2.5 rounded-lg font-bold hover:bg-yellow-400 transition-colors">
                Browse Our Fleet
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
