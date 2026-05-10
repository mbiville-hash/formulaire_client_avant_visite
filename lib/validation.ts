import type { BathroomFormData, SubmitPayload } from '@/types/form'

export const INITIAL_FORM: BathroomFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  projectAddress: '',
  housingType: '',
  occupiedDuringWorks: '',
  mainMotivation: '',
  idealBathroom: '',
  bathroomUsers: [],
  layoutPreference: '',
  equipments: [],
  conserveOrAvoid: '',
  inspirations: [],
  preferredStyles: [],
  likedMaterials: '',
  budget: '',
  timeline: '',
  preciseDate: '',
  constraints: '',
  supportNeeds: [],
  designFreedom: '',
  photosPlansAvailability: '',
}

export type ValidationResult = {
  valid: boolean
  data?: BathroomFormData
  fieldErrors: Partial<Record<keyof BathroomFormData | 'cfTurnstileToken', string>>
}

const REQUIRED_FIELDS: Array<keyof BathroomFormData> = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'projectAddress',
  'budget',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateSubmitPayload(payload: unknown): ValidationResult {
  const input = normalizePayload(payload)
  const fieldErrors: ValidationResult['fieldErrors'] = {}

  for (const field of REQUIRED_FIELDS) {
    if (!String(input[field] || '').trim()) {
      fieldErrors[field] = 'Ce champ est obligatoire.'
    }
  }

  if (input.email && !EMAIL_RE.test(input.email)) {
    fieldErrors.email = 'Adresse email invalide.'
  }

  if (input.phone && input.phone.replace(/[^\d+]/g, '').length < 8) {
    fieldErrors.phone = 'Numéro de téléphone invalide.'
  }

  if (input.timeline !== 'Avant une date précise') {
    input.preciseDate = ''
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    data: Object.keys(fieldErrors).length === 0 ? input : undefined,
    fieldErrors,
  }
}

export function normalizePayload(payload: unknown): SubmitPayload {
  const source: Record<string, unknown> = isObject(payload) ? payload : {}

  return {
    ...INITIAL_FORM,
    firstName: cleanText(source.firstName),
    lastName: cleanText(source.lastName),
    email: cleanText(source.email).toLowerCase(),
    phone: cleanText(source.phone),
    projectAddress: cleanText(source.projectAddress),
    housingType: cleanText(source.housingType) as SubmitPayload['housingType'],
    occupiedDuringWorks: cleanText(source.occupiedDuringWorks) as SubmitPayload['occupiedDuringWorks'],
    mainMotivation: cleanText(source.mainMotivation),
    idealBathroom: cleanText(source.idealBathroom),
    bathroomUsers: cleanArray(source.bathroomUsers),
    layoutPreference: cleanText(source.layoutPreference) as SubmitPayload['layoutPreference'],
    equipments: cleanArray(source.equipments),
    conserveOrAvoid: cleanText(source.conserveOrAvoid),
    inspirations: cleanArray(source.inspirations),
    preferredStyles: cleanArray(source.preferredStyles),
    likedMaterials: cleanText(source.likedMaterials),
    budget: cleanText(source.budget) as SubmitPayload['budget'],
    timeline: cleanText(source.timeline) as SubmitPayload['timeline'],
    preciseDate: cleanText(source.preciseDate),
    constraints: cleanText(source.constraints),
    supportNeeds: cleanArray(source.supportNeeds),
    designFreedom: cleanText(source.designFreedom) as SubmitPayload['designFreedom'],
    photosPlansAvailability: cleanText(source.photosPlansAvailability) as SubmitPayload['photosPlansAvailability'],
    cfTurnstileToken: cleanText(source.cfTurnstileToken),
  }
}

export function buildSections(data: BathroomFormData) {
  return [
    {
      title: 'Informations client',
      items: [
        { label: 'Prénom', value: data.firstName },
        { label: 'Nom', value: data.lastName },
        { label: 'Email', value: data.email },
        { label: 'Téléphone', value: data.phone },
        { label: 'Adresse du projet', value: data.projectAddress },
        { label: 'Type de logement', value: data.housingType },
        { label: 'Logement occupé pendant les travaux', value: data.occupiedDuringWorks },
      ],
    },
    {
      title: 'Votre projet',
      items: [
        { label: 'Motivation principale', value: data.mainMotivation },
        { label: 'Salle de bain idéale', value: data.idealBathroom },
        { label: 'Utilisateurs principaux', value: data.bathroomUsers },
      ],
    },
    {
      title: 'Aménagement souhaité',
      items: [
        { label: 'Préférence', value: data.layoutPreference },
        { label: 'Équipements souhaités', value: data.equipments },
        { label: 'Éléments à conserver ou éviter', value: data.conserveOrAvoid },
      ],
    },
    {
      title: 'Style et ambiance',
      items: [
        { label: 'Inspirations', value: data.inspirations },
        { label: 'Styles attirants', value: data.preferredStyles },
        { label: 'Matériaux ou finitions aimés', value: data.likedMaterials },
      ],
    },
    {
      title: 'Budget',
      items: [{ label: 'Budget souhaité', value: data.budget }],
    },
    {
      title: 'Délais et contraintes',
      items: [
        { label: 'Échéance', value: data.timeline },
        { label: 'Date précise', value: data.preciseDate },
        { label: 'Contraintes particulières', value: data.constraints },
      ],
    },
    {
      title: 'Accompagnement souhaité',
      items: [
        { label: 'Accompagnement attendu', value: data.supportNeeds },
        { label: 'Niveau de liberté', value: data.designFreedom },
      ],
    },
    {
      title: 'Photos et plans',
      items: [{ label: 'Photos ou plans disponibles', value: data.photosPlansAvailability }],
    },
  ]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 4000) : ''
}

function cleanArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(cleanText).filter(Boolean).slice(0, 30)
}
