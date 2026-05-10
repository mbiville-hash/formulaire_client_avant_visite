export type HousingType = 'Maison' | 'Appartement' | 'Autre' | ''
export type OccupancyDuringWorks = 'Oui' | 'Non' | 'À définir' | ''
export type LayoutPreference =
  | 'Une douche'
  | 'Une baignoire'
  | 'Une douche + une baignoire'
  | 'Je ne sais pas encore, j’aimerais être conseillé'
  | ''
export type BudgetRange =
  | '5 900 à 8 000 €'
  | '8 000 à 11 000 €'
  | '11 000 à 14 000 €'
  | '14 000 à 17 000 €'
  | '17 000 à 20 000 €'
  | 'Je ne sais pas encore, j’aimerais être accompagné'
  | ''
export type Timeline =
  | 'Dès que possible'
  | 'Dans les 3 mois'
  | 'Dans les 6 mois'
  | 'Pas d’urgence'
  | 'Avant une date précise'
  | ''
export type DesignFreedom =
  | 'J’ai une idée très précise'
  | 'J’ai quelques envies, mais je veux être guidé'
  | 'Je préfère une proposition complète de votre part'
  | ''
export type PhotosPlansAvailability = 'Oui' | 'Non' | 'Je peux les envoyer plus tard' | ''

export type BathroomFormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  projectAddress: string
  housingType: HousingType
  occupiedDuringWorks: OccupancyDuringWorks
  mainMotivation: string
  idealBathroom: string
  bathroomUsers: string[]
  layoutPreference: LayoutPreference
  equipments: string[]
  conserveOrAvoid: string
  inspirations: string[]
  preferredStyles: string[]
  likedMaterials: string
  budget: BudgetRange
  timeline: Timeline
  preciseDate: string
  constraints: string
  supportNeeds: string[]
  designFreedom: DesignFreedom
  photosPlansAvailability: PhotosPlansAvailability
  currentBathroomPhotos: string[]
}

export type SubmitPayload = BathroomFormData & {
  cfTurnstileToken?: string
}

export type SubmitResponse = {
  ok: boolean
  message?: string
  fileId?: string
  fileName?: string
  fileUrl?: string
  error?: string
  fieldErrors?: Partial<Record<keyof BathroomFormData | 'cfTurnstileToken', string>>
}

export type AppsScriptResponse = {
  ok: boolean
  fileId?: string
  fileName?: string
  fileUrl?: string
  error?: string
}

export type FormSectionDefinition = {
  title: string
  items: Array<{
    label: string
    value: string | string[]
  }>
}
