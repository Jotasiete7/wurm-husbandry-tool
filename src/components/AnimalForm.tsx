import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ANIMAL_AGES, ANIMAL_CONDITIONS, ANIMAL_GENDERS, ANIMAL_TRAITS, ANIMAL_TYPES } from '../data/catalog'
import { ageKey, genderKey } from '../i18n/labels'
import { useLanguage } from '../i18n/LanguageContext'
import type { Animal, AnimalDraft, Gender } from '../types'
import { fieldClass, labelClass, panelClass } from './ui'

type AnimalFormProps = {
  editing: Animal | null
  onSave: (draft: AnimalDraft) => void
  onCancelEdit: () => void
  variant?: 'panel' | 'dialog'
}

const emptyDraft = (): AnimalDraft => ({
  name: '',
  type: 'horse',
  gender: 'male',
  age: 'young',
  condition: 'none',
  father: '',
  mother: '',
  traits: [],
  notes: '',
})

export function AnimalForm({ editing, onSave, onCancelEdit, variant = 'panel' }: AnimalFormProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(true)
  const [draft, setDraft] = useState<AnimalDraft>(emptyDraft)
  const [traitQuery, setTraitQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (variant !== 'dialog') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancelEdit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [variant, onCancelEdit])

  useEffect(() => {
    if (!editing) {
      setDraft(emptyDraft())
      setTraitQuery('')
      setError(null)
      return
    }
    setOpen(true)
    setDraft({
      name: editing.name,
      type: editing.type,
      gender: editing.gender,
      age: editing.age,
      condition: editing.condition,
      father: editing.father,
      mother: editing.mother,
      traits: [...editing.traits],
      notes: editing.notes,
    })
    setError(null)
  }, [editing])

  const filteredTraits = useMemo(() => {
    const query = traitQuery.trim().toLowerCase()
    if (!query) return ANIMAL_TRAITS
    return ANIMAL_TRAITS.filter((trait) => {
      const inName = trait.trait.toLowerCase().includes(query)
      const inCategory = trait.categories.some((category) =>
        category.toLowerCase().includes(query),
      )
      return inName || inCategory
    })
  }, [traitQuery])

  const toggleTrait = (trait: string) => {
    setDraft((prev) => ({
      ...prev,
      traits: prev.traits.includes(trait)
        ? prev.traits.filter((item) => item !== trait)
        : [...prev.traits, trait],
    }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.name.trim()) {
      setError(t('nameRequired'))
      return
    }
    onSave(draft)
    if (!editing) {
      setDraft(emptyDraft())
      setTraitQuery('')
    }
    setError(null)
  }

  const ageLabel = (value: string, fallback: string) => {
    const key = ageKey(value)
    return key ? t(key) : fallback
  }

  const genderLabel = (value: string, fallback: string) => {
    const key = genderKey(value)
    return key ? t(key) : fallback
  }

  const id = (name: string) => (variant === 'dialog' ? `edit-${name}` : name)

  const form = (
        <form className={variant === 'dialog' ? 'space-y-4' : 'mt-4 space-y-4'} onSubmit={handleSubmit}>
          <div>
            <label className={labelClass} htmlFor={id('animal-name')}>{t('name')}</label>
            <input
              id={id('animal-name')}
              className={fieldClass}
              value={draft.name}
              placeholder={t('namePlaceholder')}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor={id('animal-type')}>{t('type')}</label>
              <select
                id={id('animal-type')}
                className={fieldClass}
                value={draft.type}
                onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value }))}
              >
                {ANIMAL_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor={id('animal-gender')}>{t('gender')}</label>
              <select
                id={id('animal-gender')}
                className={fieldClass}
                value={draft.gender}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, gender: event.target.value as Gender }))
                }
              >
                {ANIMAL_GENDERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {genderLabel(option.value, option.label)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor={id('animal-age')}>{t('age')}</label>
              <select
                id={id('animal-age')}
                className={fieldClass}
                value={draft.age}
                onChange={(event) => setDraft((prev) => ({ ...prev, age: event.target.value }))}
              >
                {ANIMAL_AGES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {ageLabel(option.value, option.label)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor={id('animal-condition')}>{t('condition')}</label>
              <select
                id={id('animal-condition')}
                className={fieldClass}
                value={draft.condition}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, condition: event.target.value }))
                }
              >
                {ANIMAL_CONDITIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value === 'none' ? t('conditionNone') : option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor={id('animal-father')}>{t('father')}</label>
              <input
                id={id('animal-father')}
                className={fieldClass}
                value={draft.father}
                placeholder={t('parentPlaceholder')}
                onChange={(event) => setDraft((prev) => ({ ...prev, father: event.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={id('animal-mother')}>{t('mother')}</label>
              <input
                id={id('animal-mother')}
                className={fieldClass}
                value={draft.mother}
                placeholder={t('parentPlaceholder')}
                onChange={(event) => setDraft((prev) => ({ ...prev, mother: event.target.value }))}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className={labelClass} htmlFor={id('trait-search')}>{t('traits')}</label>
              <span className="text-xs text-wurm-muted">{draft.traits.length}</span>
            </div>
            <input
              id={id('trait-search')}
              className={fieldClass}
              value={traitQuery}
              placeholder={t('traitSearchPlaceholder')}
              onChange={(event) => setTraitQuery(event.target.value)}
            />
            {traitQuery && (
              <p className="mt-1 text-xs text-wurm-muted">
                {t('traitResults', { count: filteredTraits.length })}
              </p>
            )}
            <div className="mt-2 max-h-36 space-y-1 overflow-y-auto rounded-md border border-wurm-border p-2">
              {filteredTraits.length === 0 ? (
                <p className="px-1 py-2 text-sm text-wurm-muted">{t('noTraitsFound')}</p>
              ) : (
                filteredTraits.map((trait) => (
                  <label
                    key={trait.trait}
                    className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-sm hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 accent-wurm-accent"
                      checked={draft.traits.includes(trait.trait)}
                      onChange={() => toggleTrait(trait.trait)}
                    />
                    <span>
                      {trait.trait}
                      <span className="text-wurm-muted"> ({trait.categories.join(', ')})</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor={id('animal-notes')}>{t('notes')}</label>
            <textarea
              id={id('animal-notes')}
              className={fieldClass}
              rows={3}
              value={draft.notes}
              placeholder={t('notesPlaceholder')}
              onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-wurm-border px-3 py-2 text-sm text-wurm-muted hover:text-wurm-text"
              onClick={() => {
                setDraft(emptyDraft())
                setTraitQuery('')
                setError(null)
                onCancelEdit()
              }}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="rounded-md bg-wurm-accent px-3 py-2 text-sm font-medium text-black hover:bg-wurm-accent/90"
            >
              {editing ? t('save') : t('add')}
            </button>
          </div>
        </form>
  )

  if (variant === 'dialog') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        onClick={onCancelEdit}
      >
        <section
          className={`${panelClass} max-h-[90vh] w-full max-w-2xl overflow-auto`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={id('animal-title')}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id={id('animal-title')} className="font-serif text-xl text-wurm-text">{t('editAnimal')}</h2>
            <button
              type="button"
              className="rounded p-1.5 text-wurm-muted hover:text-wurm-text"
              aria-label={t('cancel')}
              onClick={onCancelEdit}
            >
              <X size={16} />
            </button>
          </div>
          {form}
        </section>
      </div>
    )
  }

  return (
    <section className={panelClass}>
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-medium text-wurm-text">
          <Plus size={16} className="text-wurm-accent" />
          {t('addAnimal')}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && form}
    </section>
  )
}
