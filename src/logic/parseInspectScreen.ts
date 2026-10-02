import {
  ANIMAL_AGES,
  ANIMAL_CONDITIONS,
  ANIMAL_TRAITS,
  ANIMAL_TYPES,
  optionLabel,
} from '../data/catalog'
import type { Gender } from '../types'
import type { ParsedExamine, PregnancyState } from './parseExamineLog'

const TITLE_PATTERN = /(?:inspect|analisar|inspecionar)\s+animal\s*:\s*(.+)/i

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\bit(?=[a-z])/g, 'it ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function words(value: string): string[] {
  return normalize(value)
    .split(' ')
    .filter((word) => word.length > 2)
}

function matchTrait(line: string): string | null {
  const stripped = line
    .replace(/\b(combat|miscellaneous|draft|output|speed|negative|rare)\b/gi, ' ')
    .replace(/\d+/g, ' ')
  const norm = normalize(stripped)
  if (norm.includes('wild creature')) return null
  if (norm.includes('bred in captivity')) return 'Bred in captivity.'
  if (norm.includes('especially loyal')) return 'It seems especially loyal'
  if (!norm.startsWith('it ')) return null

  let best: { trait: string; length: number } | null = null
  const lineWords = words(norm)
  for (const item of ANIMAL_TRAITS) {
    const targetWords = words(item.trait)
    if (targetWords.length === 0) continue
    const allPresent = targetWords.every((word) => lineWords.includes(word))
    const closeLength = Math.abs(lineWords.length - targetWords.length) <= 2
    if (!allPresent || !closeLength) continue
    if (!best || targetWords.length > best.length) {
      best = { trait: item.trait, length: targetWords.length }
    }
  }
  return best?.trait ?? null
}

function parseTitle(raw: string): {
  name: string
  age: string
  condition: string
  type: string
  extras: string[]
} | null {
  const quoted = raw.match(/[''‘’"]([^''‘’"]+)[''‘’"]/)
  const name = quoted?.[1]?.trim() ?? ''
  const withoutName = quoted ? raw.replace(quoted[0], ' ') : raw
  const species = [...ANIMAL_TYPES]
    .sort((left, right) => right.label.length - left.label.length)
    .find((item) => withoutName.toLowerCase().includes(item.label.toLowerCase()))
  if (!species) return null

  const head = withoutName.slice(0, withoutName.toLowerCase().indexOf(species.label.toLowerCase()))
  const tokens = head
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  let age = ''
  let condition = ''
  const extras: string[] = []
  for (const token of tokens) {
    if (!age && ANIMAL_AGES.some((item) => item.value === token)) {
      age = token
      continue
    }
    if (!condition && ANIMAL_CONDITIONS.some((item) => item.value === token && item.value !== 'none')) {
      condition = token
      continue
    }
    if (token.length > 1) extras.push(token)
  }

  return {
    name,
    age: age || 'young',
    condition: condition || 'none',
    type: species.value,
    extras,
  }
}

function lineValue(lines: string[], pattern: RegExp): string {
  for (const line of lines) {
    const match = line.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return ''
}

function cleanParent(value: string): string {
  const cleaned = value
    .replace(/[|\\[\]{}<>~_=]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^a-zA-Z'’\s-].*$/, '')
    .trim()
  if (!cleaned) return ''
  const lower = cleaned.toLowerCase()
  const species = [...ANIMAL_TYPES]
    .sort((left, right) => right.label.length - left.label.length)
    .find((item) => lower === item.label.toLowerCase() || lower.startsWith(`${item.label.toLowerCase()} `))
  if (!species) return cleaned
  const rest = lower.slice(species.label.length).trim()
  if (!rest || rest.split(/\s+/).every((word) => word.length <= 2)) return 'wild'
  return cleaned
}

function cleanBrand(value: string): string {
  const words: string[] = []
  for (const word of value.replace(/[|\\[\]{}<>~_=]+/g, ' ').split(/\s+/)) {
    const plain = word.replace(/[^a-zA-Z'-]/g, '')
    if (plain.length < 2) break
    if (/^[A-Z]{1,2}$/.test(plain) && words.length > 0) break
    words.push(plain)
  }
  return words.join(' ')
}

function readDuration(value: string): { days: number; hours: number } | null {
  if (!value) return null
  const days = value.match(/(\d+)\s*d/i)
  const hours = value.match(/(\d+)\s*h/i)
  if (!days && !hours) return null
  return {
    days: Number(days?.[1] ?? 0),
    hours: Number(hours?.[1] ?? 0),
  }
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function unnamedName(title: { age: string; condition: string; type: string; extras: string[] }): string {
  const age = optionLabel(ANIMAL_AGES, title.age)
  const condition = title.condition !== 'none' ? optionLabel(ANIMAL_CONDITIONS, title.condition) : ''
  const species = optionLabel(ANIMAL_TYPES, title.type)
  return [age, condition, ...title.extras.map(capitalize), species].filter(Boolean).join(' ')
}

export function parseInspectScreen(text: string): ParsedExamine | null {
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  let title: ReturnType<typeof parseTitle> = null
  for (const line of lines) {
    const raw = line.match(TITLE_PATTERN)?.[1]
    if (!raw) continue
    const parsed = parseTitle(raw)
    if (parsed) {
      title = parsed
      break
    }
  }
  if (!title) return null

  let gender: Gender = 'female'
  for (const line of lines) {
    if (!/\bgender\b/i.test(line)) continue
    if (/female/i.test(line)) gender = 'female'
    else if (/\bmale\b/i.test(line)) gender = 'male'
    break
  }

  const mother = cleanParent(lineValue(lines, /mother.?s name\s+(.+)/i))
  const father = cleanParent(lineValue(lines, /father.?s name\s+(.+)/i))
  const brand = cleanBrand(lineValue(lines, /village\s+brand\s+(.+)/i))
  const hungry = lines.some((line) => /\bhungry\s+yes\b/i.test(line))
  const birth = lineValue(lines, /time\s+until\s+giving\s+birth\s+(.+)/i)
  const breed = lineValue(lines, /time\s+until\s+being\s+able\s+to\s+breed\s+(.+)/i)
  const duration = readDuration(birth)
  const pointsMatch = lines.find((line) => /total\s+trait\s+points/i.test(line))?.match(/(\d+)/)
  const points = pointsMatch?.[1] ?? ''

  let pregnancy: PregnancyState = 'unknown'
  let pregnancyDays = 0
  let pregnancyHours = 0
  if (duration && gender === 'female') {
    pregnancy = 'pregnant'
    pregnancyDays = duration.days
    pregnancyHours = duration.hours
  } else if (/ready|pronto/i.test(breed)) {
    pregnancy = 'ready'
  }

  const traits: string[] = []
  let wildCreature = false
  for (const line of lines) {
    if (TITLE_PATTERN.test(line)) continue
    if (/wild creature/i.test(line)) wildCreature = true
    const trait = matchTrait(line)
    if (trait && !traits.includes(trait)) traits.push(trait)
  }

  const notes: string[] = []
  if (brand) notes.push(`Branded in ${brand}`)
  if (points) notes.push(`${points} trait points`)
  if (hungry) notes.push('Hungry')
  if (wildCreature) notes.push('Wild creature')
  if (title.name && title.extras.length > 0) notes.push(title.extras.map(capitalize).join(' '))

  const name = title.name || unnamedName(title)
  const importKey = title.name
    ? ['inspect', title.type, gender, title.name.toLowerCase()].join('|')
    : [
        'inspect',
        title.type,
        gender,
        title.age,
        title.condition,
        mother.toLowerCase(),
        father.toLowerCase(),
        title.extras.join(','),
        [...traits].sort().join(','),
      ].join('|')

  return {
    importKey,
    name,
    type: title.type,
    gender,
    age: title.age,
    condition: title.condition,
    father,
    mother,
    traits,
    notes: notes.join(' · '),
    pregnancy,
    pregnancyDays,
    pregnancyHours,
  }
}
