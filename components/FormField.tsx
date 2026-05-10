type FormFieldProps = {
  id?: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}

export default function FormField({ id, label, required, error, hint, children }: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[12px] font-bold uppercase tracking-[0.12em] text-white/70"
      >
        {label}
        {required ? <span className="ml-1 text-[var(--gold)]">*</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-2 text-sm text-white/45">{hint}</p> : null}
      {error ? (
        <p className="mt-2 text-sm font-medium text-[#ffb4a9]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
