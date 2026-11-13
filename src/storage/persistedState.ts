import type { Animal, AnimalDraft, DeceasedAnimal, Gender, HistoryEntry, HistoryKind } from '../types'
import { emptyPen, type PenLayout, TILE_CAPACITY, clampSpan } from '../logic/penLayout'

export const STORAGE_KEY = 'wurm-husbandry-tool-state'
const CURRENT_VERSION = 1

export type PersistedHerdState = {
  version: number
  animals: Animal[]
  deceased: DeceasedAnimal[]
  history: HistoryEntry[]
  pen: PenLayout
}

export const defaultPersistedState = (): PersistedHerdState => ({
  version: CURRENT_VERSION,
  animals: [],
  deceased: [],
  history: [],
  pen: emptyPen(),
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

function sanitizeDeceased(value: unknown): DeceasedAnimal | null {
  const animal = sanitizeAnimal(value)
  if (!animal) return null
  const raw = value as Partial<DeceasedAnimal>
  return {
    ...animal,
    diedAt: typeof raw.diedAt === 'number' ? raw.diedAt : animal.updatedAt,
  }
}

function sanitizeHistory(value: unknown): HistoryEntry | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<HistoryEntry>
  const kinds: HistoryKind[] = ['died', 'bred', 'born', 'added']
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string' || typeof raw.at !== 'number') return null
  if (typeof raw.kind !== 'string' || !kinds.includes(raw.kind as HistoryKind)) return null
  return {
    id: raw.id,
    at: raw.at,
    kind: raw.kind as HistoryKind,
    name: raw.name,
    ...(typeof raw.partner === 'string' && raw.partner ? { partner: raw.partner } : {}),
    ...(raw.birth === 'delivered' || raw.birth === 'newborn' ? { birth: raw.birth } : {}),
  }
}

function sanitizePen(value: unknown, animalIds: Set<string>): PenLayout {
  if (!value || typeof value !== 'object') return emptyPen()
  const raw = value as Partial<PenLayout>
  const columns = clampSpan(typeof raw.columns === 'number' ? raw.columns : 6)
  const rows = clampSpan(typeof raw.rows === 'number' ? raw.rows : 4)
  const source = Array.isArray(raw.tiles) ? raw.tiles : []
  const seen = new Set<string>()
  const tiles: string[][] = []
  for (let index = 0; index < columns * rows; index += 1) {
    const cell = Array.isArray(source[index]) ? source[index] : []
    const ids: string[] = []
    for (const id of cell) {
      if (typeof id !== 'string' || !animalIds.has(id) || seen.has(id)) continue
      if (ids.length >= TILE_CAPACITY) break
      seen.add(id)
      ids.push(id)
    }
    tiles.push(ids)
  }
  return { columns, rows, tiles }
}

export function loadPersistedState(): PersistedHerdState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPersistedState()
    const parsed = JSON.parse(raw) as Partial<PersistedHerdState>
    const deceased = Array.isArray(parsed.deceased)
      ? parsed.deceased
          .map(sanitizeDeceased)
          .filter((animal): animal is DeceasedAnimal => animal !== null)
      : []
    const deceasedIds = new Set(deceased.map((animal) => animal.id))
    const animals = Array.isArray(parsed.animals)
      ? parsed.animals
          .map(sanitizeAnimal)
          .filter((animal): animal is Animal => animal !== null && !deceasedIds.has(animal.id))
      : []
    const animalIds = new Set(animals.map((animal) => animal.id))
    const seenHistory = new Set<string>()
    const history = Array.isArray(parsed.history)
      ? parsed.history
          .map(sanitizeHistory)
          .filter((entry): entry is HistoryEntry => {
            if (!entry || seenHistory.has(entry.id)) return false
            seenHistory.add(entry.id)
            return true
          })
          .slice(0, 200)
      : []
    return {
      version: CURRENT_VERSION,
      animals,
      deceased,
      history,
      pen: sanitizePen(parsed.pen, animalIds),
    }
  } catch {
    return defaultPersistedState()
  }
}

export function savePersistedState(state: PersistedHerdState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
