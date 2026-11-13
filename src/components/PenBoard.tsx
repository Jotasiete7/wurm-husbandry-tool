import { useMemo, useState } from 'react'
import { ExamineImport } from './ExamineImport'
import { InspectImport } from './InspectImport'
import { BreedingLogImport } from './BreedingLogImport'
import { ANIMAL_TYPES, optionLabel } from '../data/catalog'
import { useLanguage } from '../i18n/LanguageContext'
import {
  MAX_SPAN,
  MIN_SPAN,
  TILE_CAPACITY,
  animalTone,
  type AnimalTone,
  type PenLayout,
} from '../logic/penLayout'
import type { ParsedExamine } from '../logic/parseExamineLog'
import type { Animal } from '../types'
import { hasRareTrait } from '../utils/traits'
import { fieldClass, panelClass } from './ui'

type PenBoardProps = {
  animals: Animal[]
  pen: PenLayout
  onPlace: (animalId: string, tileIndex: number) => void
  onRemove: (animalId: string) => void
  onResize: (columns: number, rows: number) => void
  onImport: (parsed: ParsedExamine[], tileIndex: number | null) => void
  onBreed: (femaleId: string, maleId: string, days: number, hours: number) => string | null
}

const TONE_CLASS: Record<AnimalTone, string> = {
  male: 'bg-[#d4b483] text-black',
  female: 'bg-[#c4897b] text-black',
  pregnant: 'bg-[#6faf7a] text-black',
}

function animalsOnTile(animals: Animal[], ids: string[]): Animal[] {
  return ids
    .map((id) => animals.find((animal) => animal.id === id))
    .filter((animal): animal is Animal => Boolean(animal))
}

export function PenBoard({ animals, pen, onPlace, onRemove, onResize, onImport, onBreed }: PenBoardProps) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [birthTile, setBirthTile] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const targetTile = birthTile != null && birthTile < pen.tiles.length ? birthTile : null

  const placed = useMemo(() => {
    const map = new Map<string, number>()
    pen.tiles.forEach((tile, index) => {
      tile.forEach((id) => map.set(id, index))
    })
    return map
  }, [pen.tiles])

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase()
    return animals.filter((animal) => {
      if (!text) return true
      const type = optionLabel(ANIMAL_TYPES, animal.type).toLowerCase()
      return animal.name.toLowerCase().includes(text) || type.includes(text)
    })
  }, [animals, query])

  const toneLabel = (tone: AnimalTone) => {
    if (tone === 'male') return t('penLegendMale')
    if (tone === 'female') return t('penLegendFemale')
    return t('penLegendPregnant')
  }

  const dropOnTile = (tileIndex: number, animalId: string) => {
    if (!animalId) return
    onPlace(animalId, tileIndex)
    setSelectedId(animalId)
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className={`${panelClass} lg:sticky lg:top-4`}>
        <h2 className="font-serif text-xl text-wurm-text">{t('animals')}</h2>
        <input
          className={`${fieldClass} mt-3`}
          value={query}
          placeholder={t('searchPlaceholder')}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ul className="mt-3 max-h-[70vh] space-y-1 overflow-y-auto">
          {visible.length === 0 && (
            <li className="px-1 py-2 text-sm text-wurm-muted">
              {animals.length === 0 ? t('herdEmpty') : t('noAnimalsFiltered')}
            </li>
          )}
          {visible.map((animal) => {
            const tileIndex = placed.get(animal.id)
            const tone = animalTone(animal)
            const selected = selectedId === animal.id
            return (
              <li key={animal.id}>
                <button
                  type="button"
                  draggable
                  aria-pressed={selected}
                  className={`relative flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left text-sm ${
                    selected ? 'border-wurm-accent' : 'border-transparent hover:border-wurm-border'
                  }`}
                  onClick={() => setSelectedId((current) => (current === animal.id ? null : animal.id))}
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/animal-id', animal.id)
                    event.dataTransfer.effectAllowed = 'move'
                    setSelectedId(animal.id)
                  }}
                >
                  <span className={`h-3 w-3 shrink-0 rounded-sm ${TONE_CLASS[tone]}`} />
                  {hasRareTrait(animal.traits) && (
                    <span className="absolute bottom-1 left-0 top-1 w-1 rounded-sm bg-[#4c8dff]" title={t('penLegendRare')} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-wurm-text">{animal.name}</span>
                    <span className="block truncate text-xs text-wurm-muted">
                      {animal.gender === 'female' ? 'F' : 'M'}
                      {' · '}
                      {optionLabel(ANIMAL_TYPES, animal.type)}
                      {tileIndex !== undefined ? ` · ${t('penPlaced')}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <section className={panelClass}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <ExamineImport onImport={(parsed) => onImport(parsed, targetTile)} />
          <InspectImport onImport={(parsed) => onImport(parsed, targetTile)} />
          <BreedingLogImport animals={animals} onBreed={onBreed} />
          <p className="text-sm text-wurm-accentDim">
            {targetTile == null ? t('penPickTile') : t('penBirthTarget')}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-wurm-muted">{t('penHint')}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <SizeControl
              label={t('penColumns')}
              value={pen.columns}
              shrinkLabel={t('penShrink')}
              growLabel={t('penGrow')}
              onChange={(columns) => onResize(columns, pen.rows)}
            />
            <SizeControl
              label={t('penRows')}
              value={pen.rows}
              shrinkLabel={t('penShrink')}
              growLabel={t('penGrow')}
              onChange={(rows) => onResize(pen.columns, rows)}
            />
          </div>
        </div>

        <ul className="mb-4 flex flex-wrap gap-3 text-xs text-wurm-muted">
          {(['male', 'female', 'pregnant'] as AnimalTone[]).map((tone) => (
            <li key={tone} className="inline-flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-sm ${TONE_CLASS[tone]}`} />
              {toneLabel(tone)}
            </li>
          ))}
          <li className="inline-flex items-center gap-1.5">
            <span className="h-3 w-1 rounded-sm bg-[#4c8dff]" />
            {t('penLegendRare')}
          </li>
        </ul>

        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${pen.columns}, minmax(0, 1fr))` }}
        >
          {pen.tiles.map((ids, index) => {
            const occupants = animalsOnTile(animals, ids)
            const full = occupants.length >= TILE_CAPACITY
            return (
              <div
                key={index}
                title={full ? t('penFull') : undefined}
                className={`flex aspect-square flex-col gap-1 rounded-md border border-wurm-border p-1.5 ${
                  targetTile === index ? 'ring-2 ring-wurm-accent' : ''
                } ${
                  dragOver === index ? 'bg-wurm-bg' : 'bg-wurm-bg/40'
                }`}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragOver(index)
                }}
                onDragLeave={() => setDragOver((current) => (current === index ? null : current))}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragOver(null)
                  dropOnTile(index, event.dataTransfer.getData('text/animal-id'))
                }}
                onClick={() => {
                  if (selectedId) dropOnTile(index, selectedId)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && selectedId) dropOnTile(index, selectedId)
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                  {occupants.map((animal) => {
                    const tone = animalTone(animal)
                    const rare = hasRareTrait(animal.traits)
                    return (
                      <div
                        key={animal.id}
                        draggable
                        title={rare ? `${toneLabel(tone)} · ${t('penLegendRare')}` : toneLabel(tone)}
                        className={`flex min-h-0 items-center gap-1 rounded px-1.5 py-1 text-xs font-medium ${TONE_CLASS[tone]} ${
                          rare ? 'border-l-4 border-l-[#4c8dff]' : ''
                        }`}
                        onDragStart={(event) => {
                          event.stopPropagation()
                          event.dataTransfer.setData('text/animal-id', animal.id)
                          event.dataTransfer.effectAllowed = 'move'
                          setSelectedId(animal.id)
                        }}
                      >
                        <span className="min-w-0 flex-1 truncate">{animal.name}</span>
                        <span className="shrink-0 opacity-70">{animal.gender === 'female' ? 'F' : 'M'}</span>
                        <button
                          type="button"
                          className="shrink-0 rounded px-1 leading-none hover:bg-black/20"
                          aria-label={t('delete')}
                          onClick={(event) => {
                            event.stopPropagation()
                            onRemove(animal.id)
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    aria-pressed={targetTile === index}
                    aria-label={t('penAddHere')}
                    title={t('penAddHere')}
                    className={`h-5 w-5 rounded text-sm leading-none ${
                      targetTile === index
                        ? 'bg-wurm-accent font-medium text-black'
                        : 'border border-wurm-border text-wurm-muted hover:border-wurm-accent hover:text-wurm-text'
                    }`}
                    onClick={(event) => {
                      event.stopPropagation()
                      setBirthTile((current) => (current === index ? null : index))
                      setSelectedId(null)
                    }}
                  >
                    +
                  </button>
                  <span className="text-[10px] text-wurm-muted">
                    {occupants.length}/{TILE_CAPACITY}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function SizeControl({
  label,
  value,
  shrinkLabel,
  growLabel,
  onChange,
}: {
  label: string
  value: number
  shrinkLabel: string
  growLabel: string
  onChange: (value: number) => void
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <span className="text-wurm-muted">{label}</span>
      <button
        type="button"
        className="h-7 w-7 rounded border border-wurm-border text-wurm-text hover:border-wurm-accent disabled:opacity-40"
        aria-label={`${shrinkLabel} ${label}`}
        disabled={value <= MIN_SPAN}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="w-4 text-center text-wurm-text">{value}</span>
      <button
        type="button"
        className="h-7 w-7 rounded border border-wurm-border text-wurm-text hover:border-wurm-accent disabled:opacity-40"
        aria-label={`${growLabel} ${label}`}
        disabled={value >= MAX_SPAN}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}
