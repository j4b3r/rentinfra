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
    <section className="glazing py-[3px]">
      <div className="mx-auto max-w-7xl px-[3px]">
        <div className="pane flex flex-wrap items-end justify-between gap-4 bg-[var(--bar)] p-6 sm:p-8">
          <h2 className="font-display text-3xl text-[var(--glass-clear)] sm:text-4xl">
            What drivers say
          </h2>

          {showAggregate && (
            <p className="flex items-center gap-2 text-sm text-gray-300">
              <span className="flex" aria-hidden="true">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="fill-[var(--pane-signal)] text-[var(--pane-signal)]" />
                ))}
              </span>
              <span className="font-display text-lg text-white tabular-nums">{rating}</span>
              from {reviewCount} reviews
            </p>
          )}
        </div>

        <div className="mt-[3px] grid grid-cols-1 gap-[3px] md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.id} className="pane pane-seeded flex flex-col p-6">
              <div className="flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={13} className="fill-[var(--pane-signal)] text-[var(--pane-signal)]" />
                ))}
              </div>

              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink)]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <figcaption className="mt-4 border-t-2 border-[var(--bar)] pt-3 text-xs text-[var(--ink-soft)]">
                <span className="font-semibold text-[var(--ink)]">{t.author_name}</span>
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
