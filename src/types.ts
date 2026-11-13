export type Gender = 'male' | 'female'

export type Animal = {
  id: string
  name: string
  type: string
  gender: Gender
  age: string
  condition: string
  father: string
  mother: string
  traits: string[]
  notes: string
  isPregnant: boolean
  breedingMaleId: string | null
  breedingDueDate: number | null
  importKey: string | null
  createdAt: number
  updatedAt: number
}

export type DeceasedAnimal = Animal & {
  diedAt: number
}

export type HistoryKind = 'died' | 'bred' | 'born' | 'added'

export type HistoryEntry = {
  id: string
  at: number
  kind: HistoryKind
  name: string
  partner?: string
  birth?: 'delivered' | 'newborn'
}

export type AnimalDraft = {
  name: string
  type: string
  gender: Gender
  age: string
  condition: string
  father: string
  mother: string
  traits: string[]
  notes: string
}
