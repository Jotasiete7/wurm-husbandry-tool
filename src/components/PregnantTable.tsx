import { useEffect, useMemo, useState } from 'react'
import { ANIMAL_TYPES, optionLabel } from '../data/catalog'
import { useLanguage } from '../i18n/LanguageContext'
import type { Animal } from '../types'
import { TraitBadge } from './TraitBadge'
import { panelClass } from './ui'

type PregnantTableProps = {
  animals: Animal[]
  onClear: (id: string) => void
}

function formatRemaining(due: number, overdueLabel: string, now: number): string {
  const diff = due - now
  if (diff <= 0) return overdueLabel
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function PregnantTable({ animals, onClear }: PregnantTableProps) {
  const { t } = useLanguage()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const pregnant = useMemo(
    () =>
      animals
        .filter((animal) => animal.gender === 'female' && animal.isPregnant)
        .slice()
        .sort((a, b) => (a.breedingDueDate ?? 0) - (b.breedingDueDate ?? 0)),
    [animals],
  )

  const sireName = (id: string | null) => {
    if (!id) return t('unknownSire')
    return animals.find((animal) => animal.id === id)?.name ?? t('unknownSire')
  }

  return (
    <section className={panelClass}>
      <h2 className="mb-3 font-serif text-xl text-wurm-text">{t('pregnantTitle')}</h2>
      {pregnant.length === 0 ? (
        <p className="py-6 text-center text-sm text-wurm-muted">{t('noPregnant')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-wurm-muted">
              <tr className="border-b border-wurm-border">
                <th className="px-2 py-2 font-medium">{t('name')}</th>
                <th className="px-2 py-2 font-medium">{t('type')}</th>
                <th className="px-2 py-2 font-medium">{t('sire')}</th>
                <th className="px-2 py-2 font-medium">{t('traits')}</th>
                <th className="px-2 py-2 font-medium">{t('due')}</th>
                <th className="px-2 py-2 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pregnant.map((animal) => (
                <tr key={animal.id} className="border-b border-wurm-border/70">
                  <td className="whitespace-nowrap px-2 py-2 font-medium">{animal.name}</td>
                  <td className="px-2 py-2">{optionLabel(ANIMAL_TYPES, animal.type)}</td>
                  <td className="px-2 py-2">{sireName(animal.breedingMaleId)}</td>
                  <td className="px-2 py-2"><TraitBadge traits={animal.traits} /></td>
                  <td className="whitespace-nowrap px-2 py-2 font-mono text-wurm-accent">
                    {animal.breedingDueDate
                      ? formatRemaining(animal.breedingDueDate, t('overdue'), now)
                      : '-'}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      className="text-xs text-wurm-muted underline-offset-2 hover:text-wurm-text hover:underline"
                      onClick={() => onClear(animal.id)}
                    >
                      {t('clearPregnancy')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
