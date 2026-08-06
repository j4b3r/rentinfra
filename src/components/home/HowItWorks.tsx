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

/** A genuine four-step sequence, so the numbering carries real information. */
export default function HowItWorks() {
  return (
    <section className="bg-[#F2F4F7] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl text-[#0B1220] sm:text-4xl">Booking, start to finish</h2>
        <p className="mt-1.5 text-sm text-gray-600">Four steps, about two minutes.</p>

        <ol className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="bg-white p-6">
              <span className="font-display text-3xl text-[#C9A84C] tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 text-base font-bold text-[#0B1220]">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
