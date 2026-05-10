'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import FormField from '@/components/FormField'
import FormSection from '@/components/FormSection'
import { uploadBathroomPhoto } from '@/lib/cloudinary'
import { INITIAL_FORM, validateSubmitPayload } from '@/lib/validation'
import type { BathroomFormData, SubmitResponse } from '@/types/form'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'error-callback'?: () => void
          theme?: 'light' | 'dark'
        },
      ) => string
      remove: (widgetId: string) => void
    }
  }
}

type Status = 'idle' | 'sending' | 'success' | 'error'
type FieldErrors = Partial<Record<keyof BathroomFormData | 'cfTurnstileToken', string>>

const MAX_PHOTOS = 6
const housingTypes = ['Maison', 'Appartement', 'Autre']
const occupiedOptions = ['Oui', 'Non', 'À définir']
const users = ['Adulte', 'Couple', 'Famille', 'Enfants', 'Invités', 'Personne âgée', 'Usage occasionnel', 'Autre']
const layouts = [
  'Une douche',
  'Une baignoire',
  'Une douche + une baignoire',
  'Je ne sais pas encore, j’aimerais être conseillé',
]
const equipments = [
  'Meuble vasque',
  'Double vasque',
  'Douche à l’italienne',
  'Baignoire',
  'WC intégré',
  'Rangements optimisés',
  'Miroir lumineux',
  'Robinetterie encastrée',
  'Sèche-serviettes',
  'Chauffage au sol',
  'Éclairage d’ambiance',
  'Autre',
]
const inspirations = [
  'Photos Pinterest / Instagram',
  'Photos d’hôtel ou de showroom',
  'Magazine / catalogue',
  'Plans ou croquis',
  'Pas encore',
]
const styles = [
  'Contemporain',
  'Minimaliste',
  'Naturel / chaleureux',
  'Marbre / pierre / effet luxe',
  'Noir & blanc',
  'Bois & tons clairs',
  'Hôtel / spa',
  'Autre',
]
const budgets = [
  '5 900 à 8 000 €',
  '8 000 à 11 000 €',
  '11 000 à 14 000 €',
  '14 000 à 17 000 €',
  '17 000 à 20 000 €',
  'Je ne sais pas encore, j’aimerais être accompagné',
]
const timelines = ['Dès que possible', 'Dans les 3 mois', 'Dans les 6 mois', 'Pas d’urgence', 'Avant une date précise']
const supportNeeds = [
  'La conception complète',
  'Le choix des matériaux',
  'Le choix des équipements sanitaires',
  'L’optimisation de l’espace',
  'Une solution clé en main',
  'Je souhaite surtout être conseillé',
]
const freedomLevels = [
  'J’ai une idée très précise',
  'J’ai quelques envies, mais je veux être guidé',
  'Je préfère une proposition complète de votre part',
]

export default function HomePage() {
  const [form, setForm] = useState<BathroomFormData>(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [photoMessage, setPhotoMessage] = useState('')
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [cfTurnstileToken, setCfTurnstileToken] = useState('')
  const [turnstileKey, setTurnstileKey] = useState(0)
  const turnstileContainerRef = useRef<HTMLDivElement>(null)
  const turnstileWidgetIdRef = useRef<string | null>(null)

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
  const hasTurnstile = Boolean(turnstileSiteKey)

  useEffect(() => {
    if (!hasTurnstile) return

    const renderWidget = () => {
      if (!turnstileContainerRef.current || !window.turnstile) return
      if (turnstileWidgetIdRef.current) {
        try {
          window.turnstile.remove(turnstileWidgetIdRef.current)
        } catch {}
      }
      turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: turnstileSiteKey,
        callback: setCfTurnstileToken,
        'error-callback': () => setCfTurnstileToken(''),
        theme: 'dark',
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      const existing = document.querySelector<HTMLScriptElement>('script[src*="turnstile"]')
      if (existing) {
        existing.addEventListener('load', renderWidget, { once: true })
      } else {
        const script = document.createElement('script')
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        script.async = true
        script.onload = renderWidget
        document.head.appendChild(script)
      }
    }

    return () => {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetIdRef.current)
        } catch {}
        turnstileWidgetIdRef.current = null
      }
    }
  }, [hasTurnstile, turnstileKey, turnstileSiteKey])

  useEffect(() => {
    const closeDropdowns = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return

      document.querySelectorAll<HTMLDetailsElement>('[data-multiselect]').forEach((details) => {
        if (!details.contains(target)) {
          details.open = false
        }
      })
    }

    document.addEventListener('pointerdown', closeDropdowns)
    return () => document.removeEventListener('pointerdown', closeDropdowns)
  }, [])

  const completion = useMemo(() => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'projectAddress', 'budget'] as const
    const completed = required.filter((field) => Boolean(form[field])).length
    return Math.round((completed / required.length) * 100)
  }, [form])

  const setValue =
    (field: keyof BathroomFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
      setFieldErrors((current) => ({ ...current, [field]: undefined }))
    }

  const setArrayValue = (field: keyof BathroomFormData, values: string[]) => {
    setForm((current) => ({ ...current, [field]: values }))
  }

  const uploadPhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return

    const remainingSlots = MAX_PHOTOS - form.currentBathroomPhotos.length
    if (remainingSlots <= 0) {
      setPhotoMessage(`Vous pouvez joindre jusqu’à ${MAX_PHOTOS} photos.`)
      return
    }

    setUploadingPhotos(true)
    setPhotoMessage('')
    try {
      const selectedFiles = files.slice(0, remainingSlots)
      const urls = await Promise.all(selectedFiles.map(uploadBathroomPhoto))
      setForm((current) => ({
        ...current,
        currentBathroomPhotos: [...current.currentBathroomPhotos, ...urls].slice(0, MAX_PHOTOS),
      }))
      if (files.length > remainingSlots) {
        setPhotoMessage(`Seules les ${remainingSlots} premières photos ont été ajoutées.`)
      }
    } catch (error) {
      setPhotoMessage(error instanceof Error ? error.message : 'L’ajout des photos a échoué.')
    } finally {
      setUploadingPhotos(false)
    }
  }

  const removePhoto = (url: string) => {
    setForm((current) => ({
      ...current,
      currentBathroomPhotos: current.currentBathroomPhotos.filter((photoUrl) => photoUrl !== url),
    }))
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    const validation = validateSubmitPayload(form)
    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors)
      setStatus('error')
      setMessage('Merci de corriger les champs signalés avant l’envoi.')
      return
    }

    if (hasTurnstile && !cfTurnstileToken) {
      setFieldErrors((current) => ({ ...current, cfTurnstileToken: 'Merci de valider la vérification anti-spam.' }))
      setStatus('error')
      return
    }

    setStatus('sending')
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cfTurnstileToken }),
      })
      const result = (await response.json()) as SubmitResponse

      if (!response.ok || !result.ok) {
        setFieldErrors(result.fieldErrors || {})
        throw new Error(result.error || 'Envoi impossible.')
      }

      setStatus('success')
      setMessage('Votre formulaire a bien été envoyé. Nous reviendrons vers vous pour préparer la visite.')
      setForm(INITIAL_FORM)
      setCfTurnstileToken('')
      setPhotoMessage('')
      setTurnstileKey((key) => key + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Une erreur est survenue pendant l’envoi.')
      setCfTurnstileToken('')
      setTurnstileKey((key) => key + 1)
    }
  }

  return (
    <main>
      {status === 'success' ? (
        <section className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-[var(--dark)] px-6 text-center">
          <div className="max-w-2xl border border-[var(--line)] bg-white/[0.04] px-6 py-12 shadow-2xl shadow-black/40 sm:px-12">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--gold)]">Formulaire envoyé</p>
            <h1 className="mb-6 font-serif text-5xl leading-tight text-white sm:text-6xl">Préparation reçue.</h1>
            <p className="mx-auto max-w-xl text-base leading-8 text-white/70">{message}</p>
            <p className="mt-8 text-sm text-white/45">Fortis Rénovation</p>
          </div>
        </section>
      ) : null}
      <header className="border-b border-white/10 bg-[rgba(17,17,16,0.82)] backdrop-blur">
        <div className="container flex min-h-[68px] items-center justify-between gap-4">
          <a className="fortis-focus font-serif text-xl font-bold tracking-[0.04em] text-white" href="https://www.fortisrenovation.fr">
            FORTIS<span className="text-[var(--gold)]">.</span>
          </a>
          <a
            className="fortis-focus hidden border border-[rgba(184,151,90,0.5)] px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--gold)] sm:inline-flex"
            href="tel:+33767491324"
          >
            07 67 49 13 24
          </a>
        </div>
      </header>

      <section className="container grid gap-10 py-12 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <p className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--gold)] before:block before:h-px before:w-8 before:bg-[var(--gold)]">
            Préparation rendez-vous
          </p>
          <h1 className="mb-6 font-serif text-5xl font-bold leading-[1.05] text-white sm:text-6xl">
            Votre salle de bain, avant la visite.
          </h1>
          <p className="mb-8 max-w-xl text-base leading-8 text-white/65">
            Afin de préparer au mieux notre rendez-vous, ce formulaire nous permet de mieux comprendre vos envies, vos
            contraintes et le niveau de prestation attendu. Il ne vous prendra que quelques minutes.
          </p>
          <div className="border border-[var(--line)] bg-black/15 p-5">
            <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-white/55">
              <span>Champs essentiels</span>
              <span className="text-[var(--gold)]">{completion}%</span>
            </div>
            <div className="h-1.5 bg-white/10">
              <div className="h-full bg-[var(--gold)] transition-all" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </aside>

        <div className="border border-[var(--line)] bg-[rgba(245,240,232,0.05)] p-4 shadow-2xl shadow-black/30 sm:p-6">
          <form className="grid gap-6" onSubmit={submit} noValidate>
            <FormSection eyebrow="Section 1" title="Informations client">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField id="firstName" label="Prénom" required error={fieldErrors.firstName}>
                  <TextInput id="firstName" value={form.firstName} onChange={setValue('firstName')} autoComplete="given-name" />
                </FormField>
                <FormField id="lastName" label="Nom" required error={fieldErrors.lastName}>
                  <TextInput id="lastName" value={form.lastName} onChange={setValue('lastName')} autoComplete="family-name" />
                </FormField>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField id="email" label="Email" required error={fieldErrors.email}>
                  <TextInput id="email" type="email" value={form.email} onChange={setValue('email')} autoComplete="email" />
                </FormField>
                <FormField id="phone" label="Téléphone" required error={fieldErrors.phone}>
                  <TextInput id="phone" type="tel" value={form.phone} onChange={setValue('phone')} autoComplete="tel" />
                </FormField>
              </div>
              <FormField id="projectAddress" label="Adresse du projet" required error={fieldErrors.projectAddress}>
                <TextInput id="projectAddress" value={form.projectAddress} onChange={setValue('projectAddress')} autoComplete="street-address" />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField id="housingType" label="Type de logement">
                  <Select id="housingType" value={form.housingType} onChange={setValue('housingType')} options={housingTypes} />
                </FormField>
                <FormField id="occupiedDuringWorks" label="Logement occupé pendant les travaux">
                  <Select
                    id="occupiedDuringWorks"
                    value={form.occupiedDuringWorks}
                    onChange={setValue('occupiedDuringWorks')}
                    options={occupiedOptions}
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection eyebrow="Section 2" title="Votre projet">
              <FormField id="mainMotivation" label="Quelle est votre motivation principale pour rénover cette salle de bain ?">
                <Textarea
                  id="mainMotivation"
                  value={form.mainMotivation}
                  onChange={setValue('mainMotivation')}
                  placeholder="Moderniser, gagner en confort, valoriser le bien, créer une suite parentale, remplacer une installation vieillissante…"
                />
              </FormField>
              <FormField id="idealBathroom" label="Comment décririez-vous la salle de bain idéale pour vous ?">
                <Textarea
                  id="idealBathroom"
                  value={form.idealBathroom}
                  onChange={setValue('idealBathroom')}
                  placeholder="Élégante, chaleureuse, minimaliste, esprit hôtel, pratique, intemporelle…"
                />
              </FormField>
              <MultiSelectDropdown
                label="Qui utilisera principalement cette salle de bain ?"
                options={users}
                selected={form.bathroomUsers}
                onChange={(values) => setArrayValue('bathroomUsers', values)}
              />
            </FormSection>

            <FormSection eyebrow="Section 3" title="Aménagement souhaité">
              <FormField label="Souhaitez-vous plutôt :">
                <RadioGroup
                  name="layoutPreference"
                  options={layouts}
                  selected={form.layoutPreference}
                  onChange={(value) => setForm((current) => ({ ...current, layoutPreference: value as BathroomFormData['layoutPreference'] }))}
                />
              </FormField>
              <MultiSelectDropdown
                label="Quels équipements souhaitez-vous intégrer ?"
                options={equipments}
                selected={form.equipments}
                onChange={(values) => setArrayValue('equipments', values)}
              />
              <FormField id="conserveOrAvoid" label="Y a-t-il des éléments que vous souhaitez absolument conserver ou éviter ?">
                <Textarea id="conserveOrAvoid" value={form.conserveOrAvoid} onChange={setValue('conserveOrAvoid')} />
              </FormField>
            </FormSection>

            <FormSection eyebrow="Section 4" title="Style et ambiance">
              <MultiSelectDropdown
                label="Avez-vous déjà des inspirations ?"
                options={inspirations}
                selected={form.inspirations}
                onChange={(values) => setArrayValue('inspirations', values)}
              />
              <MultiSelectDropdown
                label="Quel style vous attire le plus ?"
                options={styles}
                selected={form.preferredStyles}
                onChange={(values) => setArrayValue('preferredStyles', values)}
              />
              <FormField id="likedMaterials" label="Quels matériaux ou finitions aimez-vous ?">
                <Textarea
                  id="likedMaterials"
                  value={form.likedMaterials}
                  onChange={setValue('likedMaterials')}
                  placeholder="Pierre naturelle, zellige, grand format, terrazzo, bois, laiton, noir mat, chrome, travertin, béton ciré…"
                />
              </FormField>
            </FormSection>

            <FormSection eyebrow="Section 5" title="Budget">
              <p className="border-l-2 border-[var(--gold)] bg-black/20 px-4 py-3 text-sm leading-7 text-white/65">
                Une salle de bain peut varier fortement selon les matériaux, la complexité technique, le sur-mesure et
                le niveau de finition souhaité. Parler budget dès le départ nous permet de construire une proposition
                réaliste et adaptée.
              </p>
              <FormField label="Quel budget souhaitez-vous allouer à votre projet de rénovation ?" required error={fieldErrors.budget}>
                <RadioGroup
                  name="budget"
                  options={budgets}
                  selected={form.budget}
                  onChange={(value) => setForm((current) => ({ ...current, budget: value as BathroomFormData['budget'] }))}
                />
              </FormField>
            </FormSection>

            <FormSection eyebrow="Section 6" title="Délais et contraintes">
              <FormField label="Avez-vous une échéance particulière ?">
                <RadioGroup
                  name="timeline"
                  options={timelines}
                  selected={form.timeline}
                  onChange={(value) => setForm((current) => ({ ...current, timeline: value as BathroomFormData['timeline'] }))}
                />
              </FormField>
              <FormField
                id="preciseDate"
                label="Date de fin de chantier souhaitée"
                hint="Si vous avez une échéance, indiquez idéalement la date à laquelle vous aimeriez que la salle de bain soit terminée."
              >
                <TextInput
                  id="preciseDate"
                  type="date"
                  value={form.preciseDate}
                  onChange={setValue('preciseDate')}
                  disabled={form.timeline !== 'Avant une date précise'}
                />
              </FormField>
              <FormField id="constraints" label="Y a-t-il des contraintes particulières à connaître ?">
                <Textarea
                  id="constraints"
                  value={form.constraints}
                  onChange={setValue('constraints')}
                  placeholder="Copropriété, accès difficile, étage sans ascenseur, unique salle de bain du logement, horaires de chantier, présence d’enfants…"
                />
              </FormField>
            </FormSection>

            <FormSection eyebrow="Section 7" title="Accompagnement souhaité">
              <MultiSelectDropdown
                label="Souhaitez-vous être accompagné sur :"
                options={supportNeeds}
                selected={form.supportNeeds}
                onChange={(values) => setArrayValue('supportNeeds', values)}
              />
              <FormField label="Quel niveau de liberté souhaitez-vous nous laisser ?">
                <RadioGroup
                  name="designFreedom"
                  options={freedomLevels}
                  selected={form.designFreedom}
                  onChange={(value) => setForm((current) => ({ ...current, designFreedom: value as BathroomFormData['designFreedom'] }))}
                />
              </FormField>
            </FormSection>

            <FormSection eyebrow="Section 8" title="Photos de l’existant">
              <p className="text-sm leading-7 text-white/65">
                Si vous en disposez, vous pouvez joindre quelques photos de votre salle de bain actuelle. Elles nous
                permettront de préparer la visite avec une première lecture des volumes, des accès et des contraintes
                techniques.
              </p>
              <PhotoUploader
                photos={form.currentBathroomPhotos}
                uploading={uploadingPhotos}
                message={photoMessage}
                onUpload={uploadPhotos}
                onRemove={removePhoto}
              />
              <p className="text-sm text-white/55">
                Vous pourrez aussi nous transmettre des plans ou inspirations complémentaires par email ou SMS après
                l’envoi du formulaire.
              </p>
            </FormSection>

            {hasTurnstile ? (
              <div className="border border-white/10 bg-white/[0.035] p-5">
                <div ref={turnstileContainerRef} />
                {fieldErrors.cfTurnstileToken ? <p className="mt-2 text-sm text-[#ffb4a9]">{fieldErrors.cfTurnstileToken}</p> : null}
              </div>
            ) : null}

            {message && status === 'error' ? (
              <p className="border border-[#ffb4a9]/30 bg-[#ffb4a9]/10 px-4 py-3 text-sm text-[#ffd4ce]" role="alert">
                {message}
              </p>
            ) : null}

            <button
              className="fortis-focus w-full bg-[var(--gold)] px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--gold-light)] disabled:opacity-55"
              disabled={status === 'sending' || uploadingPhotos}
              type="submit"
            >
              {status === 'sending' ? 'Envoi en cours…' : uploadingPhotos ? 'Photos en cours d’ajout…' : 'Envoyer ma préparation'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="fortis-focus w-full border border-white/20 bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--gold)] disabled:opacity-45"
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="fortis-focus min-h-32 w-full resize-y border border-white/20 bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--gold)]"
    />
  )
}

function Select({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) {
  return (
    <select
      {...props}
      className="fortis-focus w-full border border-white/20 bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--gold)]"
    >
      <option value="">— Choisissez —</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const summary = selected.length ? selected.join(', ') : 'Sélectionner une ou plusieurs réponses'

  const toggle = (option: string) => {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option])
  }

  return (
    <div>
      <p className="mb-2 block text-[12px] font-bold uppercase tracking-[0.12em] text-white/70">{label}</p>
      <details className="group relative" data-multiselect>
        <summary className="fortis-focus flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 border border-white/20 bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)]">
          <span className={selected.length ? 'truncate' : 'text-[var(--ink-faint)]'}>{summary}</span>
          <span className="text-[var(--gold)] transition group-open:rotate-180">⌄</span>
        </summary>
        <div className="absolute left-0 right-0 z-20 mt-2 max-h-80 overflow-auto border border-[var(--line)] bg-[var(--dark)] p-2 shadow-2xl shadow-black/40">
          {options.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm text-white/75 transition hover:bg-white/5">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--gold)]"
                checked={selected.includes(option)}
                onChange={() => toggle(option)}
              />
              {option}
            </label>
          ))}
        </div>
      </details>
      {selected.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((item) => (
            <button
              key={item}
              type="button"
              className="border border-[var(--line)] bg-black/20 px-3 py-1 text-xs text-white/65"
              onClick={() => toggle(item)}
            >
              {item} ×
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PhotoUploader({
  photos,
  uploading,
  message,
  onUpload,
  onRemove,
}: {
  photos: string[]
  uploading: boolean
  message: string
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (url: string) => void
}) {
  const remaining = MAX_PHOTOS - photos.length

  return (
    <div className="grid gap-4">
      <label className="fortis-focus flex cursor-pointer flex-col items-center justify-center border border-dashed border-[var(--line)] bg-black/20 px-5 py-8 text-center transition hover:bg-black/30">
        <span className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-[var(--gold)]">
          {uploading ? 'Ajout des photos…' : 'Ajouter des photos'}
        </span>
        <span className="text-sm text-white/55">
          Jusqu’à {MAX_PHOTOS} photos, format image.{' '}
          {remaining > 0
            ? `${remaining} emplacement${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}.`
            : 'Limite atteinte.'}
        </span>
        <input className="sr-only" type="file" accept="image/*" multiple disabled={uploading || remaining <= 0} onChange={onUpload} />
      </label>
      {message ? <p className="text-sm text-[#ffd4ce]">{message}</p> : null}
      {photos.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((url, index) => (
            <div key={url} className="relative overflow-hidden border border-white/10 bg-black/20">
              <img src={url} alt={`Salle de bain actuelle ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
              <button type="button" className="absolute right-2 top-2 bg-black/70 px-2 py-1 text-xs text-white" onClick={() => onRemove(url)}>
                Retirer
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function RadioGroup({
  name,
  options,
  selected,
  onChange,
}: {
  name: string
  options: string[]
  selected: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-3">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-3 border border-white/10 bg-black/15 p-3 text-sm text-white/75">
          <input
            type="radio"
            name={name}
            className="h-4 w-4 accent-[var(--gold)]"
            checked={selected === option}
            onChange={() => onChange(option)}
          />
          {option}
        </label>
      ))}
    </div>
  )
}
