const steps = [
  {
    title: 'Choose your dates',
    body: 'Pick the days you need and where you want the car. We show you what is free on those dates.',
  },
  {
    title: 'Pick a car',
    body: 'Compare the fleet with the full price for your dates already worked out — discounts applied.',
  },
  {
    title: 'Add what you need',
    body: 'Child seat, second driver, GPS. Skip this step entirely if the car is all you want.',
  },
  {
    title: 'Confirm and collect',
    body: 'You get a booking reference straight away. Bring your licence and collect the keys.',
  },
]

/** A genuine four-step sequence, so the numbering carries real information.
 *  The fourth pane is lit — it's the step that ends in a key in your hand. */
export default function HowItWorks() {
  return (
    <section className="glazing py-[3px]">
      <div className="mx-auto max-w-7xl px-[3px]">
        <div className="pane pane-seeded p-6 sm:p-8">
          <h2 className="font-display text-3xl text-[var(--ink)] sm:text-4xl">Booking, start to finish</h2>
          <p className="mt-1.5 text-sm text-[var(--ink-soft)]">Four steps, about two minutes.</p>
        </div>

        <ol className="mt-[3px] grid grid-cols-1 gap-[3px] sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1
            return (
              <li
                key={step.title}
                className={`p-6 ${isLast ? 'pane-lit' : 'pane'}`}
              >
                <span
                  className={`font-display text-3xl tabular-nums ${
                    isLast ? 'text-[var(--ink-on-signal)]' : 'text-[var(--pane-signal)]'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3
                  className={`mt-3 text-base font-bold ${
                    isLast ? 'text-[var(--ink-on-signal)]' : 'text-[var(--ink)]'
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`mt-1.5 text-sm leading-relaxed ${
                    isLast ? 'text-[var(--ink-on-signal)]/85' : 'text-[var(--ink-soft)]'
                  }`}
                >
                  {step.body}
                </p>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
