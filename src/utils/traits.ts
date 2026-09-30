import { ANIMAL_TRAITS } from '../data/catalog'

const CATEGORY_LETTER: Record<string, string> = {
  Draft: 'D',
  Output: 'O',
  Combat: 'C',
  Speed: 'S',
  Miscellaneous: 'M',
  Negative: 'N',
}

const CATEGORY_ORDER = [
  'Draft',
  'Output',
  'Combat',
  'Speed',
  'Miscellaneous',
  'Negative',
]

export type TraitSummary = {
  abbreviation: string
  names: string[]
}

export function formatTraits(traitNames: string[] | undefined): TraitSummary {
  if (!traitNames || traitNames.length === 0) {
    return { abbreviation: '-', names: [] }
  }

  const counts: Record<string, number> = {}

  traitNames.forEach((name) => {
    const trait = ANIMAL_TRAITS.find((item) => item.trait === name)
    const categories = trait?.categories ?? ['Miscellaneous']
    categories.forEach((category) => {
      if (category === 'Rare' || !CATEGORY_LETTER[category]) return
      counts[category] = (counts[category] || 0) + 1
    })
  })

  const abbreviation = CATEGORY_ORDER.filter((category) => counts[category] > 0)
    .map((category) => `${counts[category]}${CATEGORY_LETTER[category]}`)
    .join('')

  return {
    abbreviation: abbreviation || '-',
    names: traitNames,
  }
}
