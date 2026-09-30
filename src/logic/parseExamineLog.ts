import { ANIMAL_TRAITS, ANIMAL_TYPES, optionLabel } from '../data/catalog'
import type { Gender } from '../types'
import { formatTraits } from '../utils/traits'

export type PregnancyState = 'pregnant' | 'ready' | 'unknown'

export type ParsedExamine = {
  importKey: string
  name: string
  type: string
  gender: Gender
  age: string
  condition: string
  father: string
  mother: string
  traits: string[]
  notes: string
  pregnancy: PregnancyState
  pregnancyDays: number
  pregnancyHours: number
}

type SpeciesRule = {
  type: string
  pattern: RegExp
}

const SPECIES_RULES: SpeciesRule[] = [
  { type: 'hell_horse', pattern: /hell horses? like this one/i },
  { type: 'horse', pattern: /horses like this one have many uses|a foal skips around/i },
  { type: 'bison', pattern: /bison like this one have many uses|the bison are impressive creatures/i },
  { type: 'cow', pattern: /cows like this one have many uses/i },
  { type: 'bull', pattern: /bulls like this one have many uses/i },
  { type: 'donkey', pattern: /donkeys like this one have many uses/i },
  { type: 'mule', pattern: /mules like this one have many uses/i },
  { type: 'ram', pattern: /rams like this one have many uses/i },
  { type: 'sheep', pattern: /sheep like this one have many uses/i },
  { type: 'pig', pattern: /pigs like this one have many uses/i },
  { type: 'deer', pattern: /a fallow deer is here/i },
  { type: 'pheasant', pattern: /pheasants like this one have many uses/i },
  { type: 'hen', pattern: /hens like this one have many uses/i },
  { type: 'rooster', pattern: /roosters like this one have many uses/i },
  { type: 'dog', pattern: /dogs like this one have many uses/i },
  { type: 'unicorn', pattern: /unicorn with a slender twisted horn|unicorn foal with a budding horn/i },
  { type: 'wild_cat', pattern: /\bwild cats?\b/i },
]

const AGES = ['young', 'adolescent', 'mature', 'aged', 'old', 'venerable']
const CONDITIONS = [
  'alert',
  'angry',
  'champion',
  'fierce',
  'greenish',
  'hardened',
  'lurking',
  'raging',
  'scared',
  'slow',
  'sly',
]

const LINE_RE = /^\[(\d{2}:\d{2}:\d{2})\]\s*(.*)$/

export function looksLikeExamineLog(text: string): boolean {
  return /\[\d{2}:\d{2}:\d{2}\]/.test(text) && /wild cat|like this one have many uses|trait points|\bmother\b|\bfather\b/i.test(text)
}

function stripTimestamp(line: string): { time: string | null; text: string } {
  const match = line.match(LINE_RE)
  if (!match) return { time: null, text: line.trim() }
  return { time: match[1], text: match[2].trim() }
}

function detectSpecies(line: string): string | null {
  if (/\bmother\b|\bfather\b/i.test(line)) return null
  for (const rule of SPECIES_RULES) {
    if (rule.pattern.test(line)) return rule.type
  }
  return null
}

function hasExamineSignal(lines: string[]): boolean {
  const text = lines.join('\n')
  return /branded by|trait points|\bmother\b|\bfather\b|\bgive birth\b|\bcan breed\b|^It (has|is|seems|looks|will)\b/im.test(text)
}

function extractGender(lines: string[]): Gender | null {
  for (const line of lines) {
    if (/^(she|her)\b/i.test(line)) return 'female'
    if (/^(he|his)\b/i.test(line)) return 'male'
  }
  return null
}

function normalizeTrait(value: string): string {
  return value.toLowerCase().replace(/\.$/, '').replace(/\s+/g, ' ').trim()
}

function traitRemainder(value: string): string {
  return normalizeTrait(value)
    .replace(/^(it has been|it has|it is|it seems|it looks|it will|been|to be)\s+/, '')
    .trim()
}

function mapTrait(sentence: string): string | null {
  const normalized = normalizeTrait(sentence)
  if (!normalized) return null

  for (const trait of ANIMAL_TRAITS) {
    if (normalizeTrait(trait.trait) === normalized) return trait.trait
  }

  if (normalized === 'it has been bred in captivity' || normalized === 'bred in captivity' || normalized === 'been bred in captivity') {
    return 'Bred in captivity.'
  }
  if (normalized === 'it is especially loyal' || normalized === 'especially loyal') {
    return 'It seems especially loyal'
  }

  const extracted = traitRemainder(sentence)
  let best: string | null = null
  let bestScore = 0
  for (const trait of ANIMAL_TRAITS) {
    const candidate = traitRemainder(trait.trait)
    if (candidate === extracted) return trait.trait
    if (!extracted || !candidate) continue
    if (candidate.includes(extracted) || extracted.includes(candidate)) {
      const score = Math.min(candidate.length, extracted.length) / Math.max(candidate.length, extracted.length)
      if (score > bestScore) {
        bestScore = score
        best = trait.trait
      }
    }
  }
  return bestScore >= 0.75 ? best : null
}

function extractTraits(lines: string[]): string[] {
  const found: string[] = []
  for (const line of lines) {
    if (!/^It (has|is|seems|looks|will)\b/i.test(line)) continue
    const sentences = line.split(/(?<=\.)\s+/).map((part) => part.trim()).filter(Boolean)
    for (const sentence of sentences) {
      const mapped = mapTrait(sentence)
      if (mapped && !found.includes(mapped)) found.push(mapped)
    }
  }
  return found
}

function parentName(clause: string): string {
  const quoted = clause.match(/'([^']+)'/)
  if (quoted) return quoted[1].trim()

  let cleaned = clause.replace(/\.$/, '').trim()
  cleaned = cleaned.replace(/^(an|a|the)\s+/i, '')
  for (const age of AGES) {
    cleaned = cleaned.replace(new RegExp(`\\b${age}\\b`, 'ig'), '')
  }
  for (const condition of CONDITIONS) {
    cleaned = cleaned.replace(new RegExp(`\\b${condition}\\b`, 'ig'), '')
  }
  cleaned = cleaned.replace(/\b(fat|diseased|starving)\b/ig, '').replace(/\s+/g, ' ').trim()
  if (!cleaned || /^(wild cat|horse|bison|cow|bull|pig|sheep|dog|hen)$/i.test(cleaned) || /^wild\b/i.test(cleaned)) {
    return 'wild'
  }
  return cleaned
}

function extractParents(lines: string[]): { mother: string; father: string } {
  const line = lines.find((item) => /\bmother\b/i.test(item) || /\bfather\b/i.test(item)) ?? ''
  let mother = ''
  let father = ''
  const motherMatch = line.match(/(?:her|his)\s+mother\s+(?:was|is)\s+(.+?)(?:\.|$)/i)
  const fatherMatch = line.match(/(?:her|his)\s+father\s+(?:was|is)\s+(.+?)(?:\.|$)/i)
  if (motherMatch) mother = parentName(motherMatch[1])
  if (fatherMatch) father = parentName(fatherMatch[1])
  return { mother, father }
}

function extractTitle(lines: string[]): { name: string; age: string; condition: string } {
  let name = ''
  let age = ''
  let condition = ''
  for (const line of lines) {
    if (/\bmother\b|\bfather\b/i.test(line)) continue
    const named = line.match(/^(?:an|a)\s+(.+?)\s+'([^']+)'/i)
    if (!named) continue
    name = named[2].trim()
    const prefix = named[1].toLowerCase()
    age = AGES.find((item) => new RegExp(`\\b${item}\\b`).test(prefix)) ?? age
    condition = CONDITIONS.find((item) => new RegExp(`\\b${item}\\b`).test(prefix)) ?? condition
  }
  return { name, age, condition }
}

function parsePregnancy(lines: string[]): { state: PregnancyState; days: number; hours: number } {
  const text = lines.join('\n')
  const birth = text.match(/give birth in\s+(?:(\d+)\s+days?)?(?:,)?\s*(?:(\d+)\s+hours?)?/i)
  if (birth && (birth[1] || birth[2])) {
    return {
      state: 'pregnant',
      days: Number(birth[1] ?? 0),
      hours: Number(birth[2] ?? 0),
    }
  }
  if (/can breed (?:her|him|it) again/i.test(text)) {
    return { state: 'ready', days: 0, hours: 0 }
  }
  return { state: 'unknown', days: 0, hours: 0 }
}

function extractNotes(lines: string[]): {
  notes: string
  traitPoints: string
  body: string
  caretaker: string
  hunger: string
} {
  const bits: string[] = []
  let traitPoints = ''
  let body = ''
  let caretaker = ''
  let hunger = ''

  for (const line of lines) {
    const points = line.match(/(\d+)\s+trait points/i)
    if (points) {
      traitPoints = points[1]
      bits.push(`${points[1]} trait points`)
    }
    const care = line.match(/taken care of by ([^.]+)/i)
    if (care) {
      caretaker = care[1].trim()
      bits.push(`Taken care of by ${caretaker}`)
    }
    if (/is not hungry/i.test(line)) {
      hunger = 'not hungry'
      bits.push('Not hungry')
    } else if (/hungry enough to eat|is hungry/i.test(line)) {
      hunger = 'hungry'
      bits.push('Hungry')
    }
    const wurmAge = line.match(/determine (?:his|her|its) age to be about (\d+) Wurm months/i)
    if (wurmAge) bits.push(`${wurmAge[1]} Wurm months`)

    const bodyMatch = line.match(/\b((?:is|has) (?:a bit round|extremely well nourished|very thin|a normal build|quite fat|fat))\b/i)
    if (bodyMatch) {
      body = bodyMatch[1].toLowerCase()
      bits.push(bodyMatch[1].replace(/^is /i, '').replace(/^has /i, ''))
    }
  }

  return { notes: bits.join(' · '), traitPoints, body, caretaker, hunger }
}

function uniqueName(base: string, used: Set<string>): string {
  if (!used.has(base.toLowerCase())) {
    used.add(base.toLowerCase())
    return base
  }
  let index = 2
  while (used.has(`${base} ${index}`.toLowerCase())) index += 1
  const name = `${base} ${index}`
  used.add(name.toLowerCase())
  return name
}

function bodyLabel(body: string): string {
  if (/very thin/.test(body)) return 'thin'
  if (/a bit round/.test(body)) return 'round'
  if (/well nourished/.test(body)) return 'well fed'
  if (/normal build/.test(body)) return 'normal'
  if (/\bfat\b/.test(body)) return 'fat'
  return ''
}

function pregnancyLabel(state: PregnancyState, days: number, hours: number): string {
  if (state !== 'pregnant') return ''
  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  return parts.join(' ') || 'pregnant'
}

function buildName(
  type: string,
  givenName: string,
  mother: string,
  father: string,
  traitPoints: string,
  traits: string[],
  caretaker: string,
  body: string,
  pregnancy: PregnancyState,
  pregnancyDays: number,
  pregnancyHours: number,
  used: Set<string>,
): string {
  if (givenName) return uniqueName(givenName, used)
  const label = optionLabel(ANIMAL_TYPES, type)
  const parts = [label]
  if (traitPoints) parts.push(`${traitPoints}p`)
  if (mother || father) parts.push(`${mother || '?'} × ${father || '?'}`)
  else {
    if (caretaker) parts.push(caretaker)
    const shape = bodyLabel(body)
    if (shape) parts.push(shape)
    const due = pregnancyLabel(pregnancy, pregnancyDays, pregnancyHours)
    if (due) parts.push(due)
  }
  const summary = formatTraits(traits)
  if (summary.abbreviation !== '-') parts.push(summary.abbreviation)
  return uniqueName(parts.join(' · '), used)
}

export function parseExamineLog(raw: string): ParsedExamine[] {
  const groups: string[][] = []
  let currentTime: string | null = null
  let current: string[] = []

  const flush = () => {
    if (current.length > 0) groups.push(current)
    current = []
  }

  for (const rawLine of raw.split(/\r?\n/)) {
    const { time, text } = stripTimestamp(rawLine)
    if (!text) continue
    if (time && time !== currentTime) {
      flush()
      currentTime = time
    }
    current.push(text)
  }
  flush()

  const byKey = new Map<string, Omit<ParsedExamine, 'name'> & { givenName: string; traitPoints: string; caretaker: string; body: string }>()

  for (const lines of groups) {
    if (!hasExamineSignal(lines)) continue
    const type = lines.map(detectSpecies).find((value): value is string => Boolean(value))
    const gender = extractGender(lines)
    if (!type || !gender) continue

    const traits = extractTraits(lines)
    const { mother, father } = extractParents(lines)
    const title = extractTitle(lines)
    const pregnancy = parsePregnancy(lines)
    const extra = extractNotes(lines)
    const branded = lines.some((line) => /branded by/i.test(line))
    const isFoal = lines.some((line) => /a foal skips around/i.test(line))
    const age = title.age || (isFoal ? 'young' : (branded || pregnancy.state !== 'unknown' ? 'mature' : 'young'))
    const condition = title.condition || 'none'
    const identified = Boolean(title.name) || traits.length > 0 || Boolean(mother) || Boolean(father)
    const importKey = [
      type,
      gender,
      traits.join('|'),
      mother,
      father,
      extra.traitPoints,
      extra.body,
      extra.caretaker,
      ...(identified ? [] : [pregnancy.state, String(pregnancy.days), String(pregnancy.hours), extra.hunger]),
    ].join('::')

    byKey.set(importKey, {
      importKey,
      givenName: title.name,
      type,
      gender,
      age,
      condition,
      father,
      mother,
      traits,
      notes: extra.notes,
      traitPoints: extra.traitPoints,
      caretaker: extra.caretaker,
      body: extra.body,
      pregnancy: pregnancy.state,
      pregnancyDays: pregnancy.days,
      pregnancyHours: pregnancy.hours,
    })
  }

  const usedNames = new Set<string>()
  return [...byKey.values()].map((animal) => ({
    importKey: animal.importKey,
    name: buildName(
      animal.type,
      animal.givenName,
      animal.mother,
      animal.father,
      animal.traitPoints,
      animal.traits,
      animal.caretaker,
      animal.body,
      animal.pregnancy,
      animal.pregnancyDays,
      animal.pregnancyHours,
      usedNames,
    ),
    type: animal.type,
    gender: animal.gender,
    age: animal.age,
    condition: animal.condition,
    father: animal.father,
    mother: animal.mother,
    traits: animal.traits,
    notes: animal.notes,
    pregnancy: animal.pregnancy,
    pregnancyDays: animal.pregnancyDays,
    pregnancyHours: animal.pregnancyHours,
  }))
}
