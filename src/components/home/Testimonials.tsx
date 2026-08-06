import { Star } from 'lucide-react'

export interface Testimonial {
  id: string
  author_name: string
  author_country: string | null
  author_country_emoji: string | null
  rating: number
  quote: string
  car_label: string | null
}

interface TestimonialsProps {
  testimonials: Testimonial[]
  /** Aggregate figures from settings — both must be set to show the strip. */
  rating?: string
  reviewCount?: string
}

/**
 * Renders only when there are published reviews. A fresh install shows
 * nothing here rather than inventing social proof — add real reviews in
 * the admin panel under Testimonials.
 */
export default function Testimonials({ testimonials, rating, reviewCount }: TestimonialsProps) {
  if (!testimonials.length) return null

  const showAggregate = Boolean(rating && reviewCount)

  return (
    <section className="bg-[#0A1F44] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl text-white sm:text-4xl">What drivers say</h2>

          {showAggregate && (
            <p className="flex items-center gap-2 text-sm text-gray-300">
              <span className="flex" aria-hidden="true">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="fill-[#C9A84C] text-[#C9A84C]" />
                ))}
              </span>
              <span className="font-display text-lg text-[#C9A84C] tabular-nums">{rating}</span>
              from {reviewCount} reviews
            </p>
          )}
        </div>

        <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.id}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.06] p-6"
            >
              <div className="flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={13} className="fill-[#C9A84C] text-[#C9A84C]" />
                ))}
              </div>

              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-gray-200">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <figcaption className="mt-4 border-t border-white/10 pt-3 text-xs text-gray-400">
                <span className="font-semibold text-white">{t.author_name}</span>
                {t.author_country && (
                  <>
                    {' · '}
                    {t.author_country_emoji && <span aria-hidden="true">{t.author_country_emoji} </span>}
                    {t.author_country}
                  </>
                )}
                {t.car_label && <> · {t.car_label}</>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
