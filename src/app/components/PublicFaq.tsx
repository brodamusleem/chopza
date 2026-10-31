type FaqItem = { question: string; answer: string }

export function PublicFaq({
  eyebrow = 'Questions, answered',
  title = 'A few useful things to know.',
  items,
}: {
  eyebrow?: string
  title?: string
  items: FaqItem[]
}) {
  return (
    <section aria-labelledby="faq-heading" className="mx-auto max-w-3xl">
      <div className="mb-7 text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
          {eyebrow}
        </p>
        <h2
          id="faq-heading"
          className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
        >
          {title}
        </h2>
      </div>
      <div className="space-y-3">
        {items.map(({ question, answer }) => (
          <details
            key={question}
            className="group rounded-2xl border bg-card px-5 py-1 shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-base font-semibold">
              {question}
              <span className="text-xl text-primary transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="max-w-2xl pb-5 leading-7 text-muted-foreground">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
