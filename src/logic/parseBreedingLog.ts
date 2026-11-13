import type { Animal } from '../types'

export type BreedingMatch = {
  female: Animal
  male: Animal
  days: number
  hours: number
}

export type BreedingLogError = 'empty' | 'time' | 'names' | 'gender'

export type BreedingLogResult =
  | { ok: true, match: BreedingMatch }
  | { ok: false, error: BreedingLogError, name?: string }

function stripTimestamps(text: string): string {
  return text
    .split(/\n/)
    .map((line) => line.replace(/^\s*\[\d{2}:\d{2}:\d{2}\]\s*/, '').trim())
    .filter(Boolean)
    .join('\n')
}

function quotedNames(line: string): string[] {
  return [...line.matchAll(/[''‘’]([^''‘’]+)[''‘’]/g)].map((match) => match[1].trim()).filter(Boolean)
}

function findByName(animals: Animal[], name: string): Animal[] {
  const target = name.toLowerCase()
  return animals.filter((animal) => animal.name.toLowerCase() === target)
}

export function parseBreedingLog(text: string, animals: Animal[]): BreedingLogResult {
  const cleaned = stripTimestamps(text)
  const intimate = cleaned
    .split(/\n/)
    .find((line) => /get intimate/i.test(line))
  if (!intimate) return { ok: false, error: 'empty' }

  const names = quotedNames(intimate)
  if (names.length < 2) return { ok: false, error: 'names' }

  const birthChunk = cleaned.match(/give birth in\s+([^.]+)/i)?.[1] ?? ''
  const dayMatch = birthChunk.match(/(\d+)\s+days?/i)
  const hourMatch = birthChunk.match(/(\d+)\s+hours?/i)
  if (!dayMatch && !hourMatch) return { ok: false, error: 'time' }
  const days = Number(dayMatch?.[1] ?? 0)
  const hours = Number(hourMatch?.[1] ?? 0)
  if (hours > 23) return { ok: false, error: 'time' }

  const [firstName, secondName] = names
  const first = findByName(animals, firstName)
  const second = findByName(animals, secondName)
  if (first.length === 0) return { ok: false, error: 'names', name: firstName }
  if (second.length === 0) return { ok: false, error: 'names', name: secondName }

  const femaleFirst = first.find((animal) => animal.gender === 'female')
  const maleFirst = first.find((animal) => animal.gender === 'male')
  const femaleSecond = second.find((animal) => animal.gender === 'female')
  const maleSecond = second.find((animal) => animal.gender === 'male')

  const pairings: BreedingMatch[] = []
  if (femaleFirst && maleSecond) pairings.push({ female: femaleFirst, male: maleSecond, days, hours })
  if (femaleSecond && maleFirst) pairings.push({ female: femaleSecond, male: maleFirst, days, hours })
  if (pairings.length === 0) return { ok: false, error: 'gender' }

  const match = pairings.find((pair) => pair.female === femaleFirst) ?? pairings[0]
  return { ok: true, match }
}
