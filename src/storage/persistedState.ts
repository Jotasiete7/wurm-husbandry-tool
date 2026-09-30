import type { Animal, AnimalDraft, Gender } from '../types'

export const STORAGE_KEY = 'wurm-husbandry-tool-state'
const CURRENT_VERSION = 1

export type PersistedHerdState = {
  version: number
  animals: Animal[]
}

export const defaultPersistedState = (): PersistedHerdState => ({
  version: CURRENT_VERSION,
  animals: [],
})

export function createAnimalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `animal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createAnimal(draft: AnimalDraft): Animal {
  const now = Date.now()
  return {
    id: createAnimalId(),
    name: draft.name.trim(),
    type: draft.type,
    gender: draft.gender,
    age: draft.age,
    condition: draft.condition,
    father: draft.father.trim(),
    mother: draft.mother.trim(),
    traits: [...draft.traits],
    notes: draft.notes.trim(),
    isPregnant: false,
    breedingMaleId: null,
    breedingDueDate: null,
    importKey: null,
    createdAt: now,
    updatedAt: now,
  }
}

export function applyDraft(animal: Animal, draft: AnimalDraft): Animal {
  const cleared = animal.isPregnant && draft.gender !== 'female'
  return {
    ...animal,
    name: draft.name.trim(),
    type: draft.type,
    gender: draft.gender,
    age: draft.age,
    condition: draft.condition,
    father: draft.father.trim(),
    mother: draft.mother.trim(),
    traits: [...draft.traits],
    notes: draft.notes.trim(),
    isPregnant: cleared ? false : animal.isPregnant,
    breedingMaleId: cleared ? null : animal.breedingMaleId,
    breedingDueDate: cleared ? null : animal.breedingDueDate,
    importKey: animal.importKey,
    updatedAt: Date.now(),
  }
}

function isGender(value: unknown): value is Gender {
  return value === 'male' || value === 'female'
}

function sanitizeAnimal(value: unknown): Animal | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<Animal>
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string') return null
  if (!isGender(raw.gender)) return null

  return {
    id: raw.id,
    name: raw.name,
    type: typeof raw.type === 'string' ? raw.type : 'horse',
    gender: raw.gender,
    age: typeof raw.age === 'string' ? raw.age : 'young',
    condition: typeof raw.condition === 'string' ? raw.condition : 'none',
    father: typeof raw.father === 'string' ? raw.father : '',
    mother: typeof raw.mother === 'string' ? raw.mother : '',
    traits: Array.isArray(raw.traits)
      ? raw.traits.filter((trait): trait is string => typeof trait === 'string')
      : [],
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    isPregnant: Boolean(raw.isPregnant) && raw.gender === 'female',
    breedingMaleId: typeof raw.breedingMaleId === 'string' ? raw.breedingMaleId : null,
    breedingDueDate: typeof raw.breedingDueDate === 'number' ? raw.breedingDueDate : null,
    importKey: typeof raw.importKey === 'string' ? raw.importKey : null,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
  }
}

export function loadPersistedState(): PersistedHerdState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPersistedState()
    const parsed = JSON.parse(raw) as Partial<PersistedHerdState>
    const animals = Array.isArray(parsed.animals)
      ? parsed.animals
          .map(sanitizeAnimal)
          .filter((animal): animal is Animal => animal !== null)
      : []
    return { version: CURRENT_VERSION, animals }
  } catch {
    return defaultPersistedState()
  }
}

export function savePersistedState(state: PersistedHerdState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
