import { createAnimalId } from '../storage/persistedState'
import type { Animal } from '../types'
import type { ParsedExamine } from './parseExamineLog'

export type ImportSummary = {
  animals: Animal[]
  added: number
  updated: number
}

function dueDate(days: number, hours: number, now: number): number {
  return now + days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000
}

function findMaleId(animals: Animal[], father: string): string | null {
  if (!father || father.toLowerCase() === 'wild') return null
  return (
    animals.find(
      (animal) => animal.gender === 'male' && animal.name.toLowerCase() === father.toLowerCase(),
    )?.id ?? null
  )
}

function pregnancyFields(item: ParsedExamine, existing: Animal | null, animals: Animal[], now: number) {
  if (item.pregnancy === 'pregnant' && item.gender === 'female') {
    return {
      isPregnant: true,
      breedingMaleId: findMaleId(animals, item.father) ?? existing?.breedingMaleId ?? null,
      breedingDueDate: dueDate(item.pregnancyDays, item.pregnancyHours, now),
    }
  }
  if (item.pregnancy === 'ready') {
    return { isPregnant: false, breedingMaleId: null, breedingDueDate: null }
  }
  return {
    isPregnant: existing?.isPregnant ?? false,
    breedingMaleId: existing?.breedingMaleId ?? null,
    breedingDueDate: existing?.breedingDueDate ?? null,
  }
}

export function mergeExaminedAnimals(
  animals: Animal[],
  parsed: ParsedExamine[],
  now = Date.now(),
): ImportSummary {
  const next = [...animals]
  let added = 0
  let updated = 0

  for (const item of parsed) {
    const index = next.findIndex((animal) => animal.importKey && animal.importKey === item.importKey)
    const existing = index >= 0 ? next[index] : null
    const pregnancy = pregnancyFields(item, existing, next, now)

    if (!existing) {
      next.unshift({
        id: createAnimalId(),
        name: item.name,
        type: item.type,
        gender: item.gender,
        age: item.age,
        condition: item.condition,
        father: item.father,
        mother: item.mother,
        traits: [...item.traits],
        notes: item.notes,
        importKey: item.importKey,
        createdAt: now,
        updatedAt: now,
        ...pregnancy,
      })
      added += 1
      continue
    }

    next[index] = {
      ...existing,
      type: item.type,
      gender: item.gender,
      age: item.age || existing.age,
      condition: item.condition !== 'none' ? item.condition : existing.condition,
      father: item.father || existing.father,
      mother: item.mother || existing.mother,
      traits: item.traits.length > 0 ? [...item.traits] : existing.traits,
      notes: item.notes || existing.notes,
      updatedAt: now,
      ...pregnancy,
    }
    updated += 1
  }

  return { animals: next, added, updated }
}
