type FormSectionProps = {
  eyebrow: string
  title: string
  children: React.ReactNode
}

export default function FormSection({ eyebrow, title, children }: FormSectionProps) {
  return (
    <section className="border border-white/10 bg-white/[0.035] p-5 sm:p-7">
      <p className="mb-3 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--gold)] before:block before:h-px before:w-8 before:bg-[var(--gold)]">
        {eyebrow}
      </p>
      <h2 className="mb-6 font-serif text-2xl leading-tight text-white sm:text-3xl">{title}</h2>
      <div className="grid gap-5">{children}</div>
    </section>
  )
}
