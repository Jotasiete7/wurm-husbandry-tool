import { useMemo } from 'react'
import { ANIMAL_TYPES, optionLabel } from '../data/catalog'
import { useLanguage } from '../i18n/LanguageContext'
import type { Animal } from '../types'
import { panelClass } from './ui'

type HerdChartProps = {
  animals: Animal[]
}

export function HerdChart({ animals }: HerdChartProps) {
  const { t } = useLanguage()

  const rows = useMemo(() => {
    const counts = new Map<string, { male: number; female: number }>()
    for (const animal of animals) {
      const row = counts.get(animal.type) ?? { male: 0, female: 0 }
      if (animal.gender === 'female') row.female += 1
      else row.male += 1
      counts.set(animal.type, row)
    }
    return [...counts.entries()]
      .map(([type, row]) => ({
        type,
        label: optionLabel(ANIMAL_TYPES, type),
        male: row.male,
        female: row.female,
        total: row.male + row.female,
      }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label))
  }, [animals])

  const max = Math.max(1, ...rows.map((row) => row.total))

  return (
    <section className={panelClass}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl text-wurm-text">{t('herdTitle')}</h2>
        <span className="text-sm text-wurm-muted">{animals.length}</span>
      </div>
      <div className="mb-4 flex gap-4 text-xs text-wurm-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-wurm-accent" />
          M
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-[#c4897b]" />
          F
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-wurm-muted">{t('herdEmpty')}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.type}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate text-wurm-text">{row.label}</span>
                <span className="text-wurm-muted">{row.total}</span>
              </div>
              <div
                className="flex h-2 overflow-hidden rounded-full bg-wurm-bg"
                title={`M ${row.male} · F ${row.female}`}
              >
                <div
                  className="h-full bg-wurm-accent"
                  style={{ width: `${(row.male / max) * 100}%` }}
                />
                <div
                  className="h-full bg-[#c4897b]"
                  style={{ width: `${(row.female / max) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-wurm-muted">
                M {row.male} · F {row.female}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
