import { BREEDING_AGES } from '../data/catalog'
import type { Animal } from '../types'

export const TILE_CAPACITY = 3
export const MIN_SPAN = 2
export const MAX_SPAN = 8

export type PenLayout = {
  columns: number
  rows: number
  tiles: string[][]
}

export type AnimalTone = 'male' | 'female' | 'pregnant' | 'birth'

export function emptyPen(columns = 6, rows = 4): PenLayout {
  return {
    columns,
    rows,
    tiles: Array.from({ length: rows * columns }, () => []),
  }
}

export function clampSpan(value: number): number {
  if (!Number.isInteger(value)) return MIN_SPAN
  return Math.min(MAX_SPAN, Math.max(MIN_SPAN, value))
}

export function resizePen(pen: PenLayout, columns: number, rows: number): PenLayout {
  const nextColumns = clampSpan(columns)
  const nextRows = clampSpan(rows)
  const next = emptyPen(nextColumns, nextRows)
  const copyRows = Math.min(pen.rows, nextRows)
  const copyColumns = Math.min(pen.columns, nextColumns)
  for (let row = 0; row < copyRows; row += 1) {
    for (let column = 0; column < copyColumns; column += 1) {
      const source = pen.tiles[row * pen.columns + column] ?? []
      next.tiles[row * nextColumns + column] = source.slice(0, TILE_CAPACITY)
    }
  }
  return next
}

export function placeAnimal(pen: PenLayout, animalId: string, tileIndex: number): PenLayout {
  if (tileIndex < 0 || tileIndex >= pen.tiles.length) return pen
  const target = pen.tiles[tileIndex] ?? []
  if (target.includes(animalId) || target.length >= TILE_CAPACITY) return pen
  return {
    ...pen,
    tiles: pen.tiles.map((tile, index) => {
      const next = tile.filter((id) => id !== animalId)
      if (index === tileIndex) next.push(animalId)
      return next
    }),
  }
}

export function removeAnimalFromPen(pen: PenLayout, animalId: string): PenLayout {
  return {
    ...pen,
    tiles: pen.tiles.map((tile) => tile.filter((id) => id !== animalId)),
  }
}

export function canGiveBirth(animal: Animal, mates: Animal[]): boolean {
  if (animal.gender !== 'female' || animal.isPregnant) return false
  if (!BREEDING_AGES.includes(animal.age)) return false
  return mates.some(
    (mate) =>
      mate.id !== animal.id &&
      mate.gender === 'male' &&
      mate.type === animal.type &&
      BREEDING_AGES.includes(mate.age),
  )
}

export function animalTone(animal: Animal, mates: Animal[]): AnimalTone {
  if (animal.gender === 'female' && animal.isPregnant) return 'pregnant'
  if (canGiveBirth(animal, mates)) return 'birth'
  return animal.gender === 'male' ? 'male' : 'female'
}

export function tileHasPossibleBirth(animals: Animal[]): boolean {
  return animals.some((animal) => canGiveBirth(animal, animals))
}
