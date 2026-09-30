import { ChevronDown, Pencil, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ANIMAL_CONDITIONS, ANIMAL_TYPES, optionLabel } from '../data/catalog'
import { ageKey, genderKey } from '../i18n/labels'
import { useLanguage } from '../i18n/LanguageContext'
import type { Animal, AnimalDraft } from '../types'
import { AnimalForm } from './AnimalForm'
import { TraitBadge } from './TraitBadge'
import { fieldClass, panelClass } from './ui'

type AnimalTableProps = {
  animals: Animal[]
  onUpdate: (id: string, draft: AnimalDraft) => void
  onDelete: (id: string) => void
}

export function AnimalTable({ animals, onUpdate, onDelete }: AnimalTableProps) {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [open, setOpen] = useState(true)
  const [editing, setEditing] = useState<Animal | null>(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return animals.filter((animal) => {
      if (typeFilter !== 'all' && animal.type !== typeFilter) return false
      if (!query) return true
      return animal.name.toLowerCase().includes(query)
    })
  }, [animals, search, typeFilter])

  const ageLabel = (age: string) => {
    const key = ageKey(age)
    return key ? t(key) : age
  }

  const genderLabel = (gender: string) => {
    const key = genderKey(gender)
    return key ? t(key) : gender
  }

  const conditionLabel = (condition: string) => {
    if (condition === 'none') return t('conditionNone')
    return optionLabel(ANIMAL_CONDITIONS, condition)
  }

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="flex items-center gap-2 text-left"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronDown
            size={18}
            className={`text-wurm-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
          <h2 className="font-serif text-xl text-wurm-text">{t('animals')}</h2>
          <span className="text-sm text-wurm-muted">{animals.length}</span>
        </button>
        {open && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-wurm-muted" />
            <input
              className={`${fieldClass} !w-44 pl-8 pr-8 sm:!w-52`}
              value={search}
              placeholder={t('searchPlaceholder')}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-wurm-muted hover:text-wurm-text"
                onClick={() => setSearch('')}
                aria-label={t('cancel')}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <select
            className={`${fieldClass} !w-36 shrink-0`}
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label={t('allTypes')}
          >
            <option value="all">{t('allTypes')}</option>
            {ANIMAL_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        )}
      </div>
      {open && (
      <>
      <p className="mb-3 mt-3 text-xs text-wurm-muted">{t('legend')}</p>

      {animals.length === 0 ? (
        <p className="py-8 text-center text-sm text-wurm-muted">{t('noAnimals')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-wurm-muted">
              <tr className="border-b border-wurm-border">
                <th className="px-2 py-2 font-medium">{t('name')}</th>
                <th className="px-2 py-2 font-medium">{t('type')}</th>
                <th className="px-2 py-2 font-medium">{t('gender')}</th>
                <th className="px-2 py-2 font-medium">{t('age')}</th>
                <th className="px-2 py-2 font-medium">{t('condition')}</th>
                <th className="px-2 py-2 font-medium">{t('father')}</th>
                <th className="px-2 py-2 font-medium">{t('mother')}</th>
                <th className="px-2 py-2 font-medium">{t('traits')}</th>
                <th className="px-2 py-2 font-medium">{t('notes')}</th>
                <th className="px-2 py-2 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-2 py-8 text-center text-wurm-muted">
                    {t('noAnimalsFiltered')}
                  </td>
                </tr>
              ) : (
                filtered.map((animal) => (
                  <tr key={animal.id} className="border-b border-wurm-border/70">
                    <td className="whitespace-nowrap px-2 py-2 font-medium">{animal.name}</td>
                    <td className="px-2 py-2">{optionLabel(ANIMAL_TYPES, animal.type)}</td>
                    <td className="px-2 py-2" title={genderLabel(animal.gender)}>
                      {animal.gender === 'female' ? 'F' : 'M'}
                    </td>
                    <td className="px-2 py-2">{ageLabel(animal.age)}</td>
                    <td className="px-2 py-2">{conditionLabel(animal.condition)}</td>
                    <td className="px-2 py-2 text-wurm-muted">{animal.father || '-'}</td>
                    <td className="px-2 py-2 text-wurm-muted">{animal.mother || '-'}</td>
                    <td className="px-2 py-2"><TraitBadge traits={animal.traits} /></td>
                    <td className="max-w-[140px] truncate px-2 py-2 text-wurm-muted" title={animal.notes}>
                      {animal.notes || '-'}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="rounded p-1.5 text-wurm-muted hover:bg-white/5 hover:text-wurm-accent"
                          title={t('edit')}
                          onClick={() => setEditing(animal)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="rounded p-1.5 text-wurm-muted hover:bg-white/5 hover:text-red-400"
                          title={t('delete')}
                          onClick={() => onDelete(animal.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}

      {editing && (
        <AnimalForm
          variant="dialog"
          editing={editing}
          onSave={(draft) => {
            onUpdate(editing.id, draft)
            setEditing(null)
          }}
          onCancelEdit={() => setEditing(null)}
        />
      )}
    </section>
  )
}
