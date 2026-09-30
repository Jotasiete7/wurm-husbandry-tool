import { useMemo, useState } from 'react'
import { ANIMAL_TYPES, BREEDING_AGES, optionLabel } from '../data/catalog'
import { useLanguage } from '../i18n/LanguageContext'
import type { Animal } from '../types'
import { formatTraits } from '../utils/traits'
import { fieldClass, labelClass, panelClass } from './ui'

type BreedingPanelProps = {
  animals: Animal[]
  onBreed: (femaleId: string, maleId: string, days: number, hours: number) => string | null
}

export function BreedingPanel({ animals, onBreed }: BreedingPanelProps) {
  const { t } = useLanguage()
  const [maleId, setMaleId] = useState('')
  const [femaleId, setFemaleId] = useState('')
  const [days, setDays] = useState('')
  const [hours, setHours] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  const males = useMemo(
    () =>
      animals.filter(
        (animal) => animal.gender === 'male' && BREEDING_AGES.includes(animal.age),
      ),
    [animals],
  )
  const females = useMemo(
    () =>
      animals.filter(
        (animal) =>
          animal.gender === 'female' &&
          BREEDING_AGES.includes(animal.age) &&
          !animal.isPregnant,
      ),
    [animals],
  )

  const optionText = (animal: Animal) => {
    const summary = formatTraits(animal.traits)
    const type = optionLabel(ANIMAL_TYPES, animal.type)
    return `${animal.name} · ${type} · ${summary.abbreviation}`
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const parsedDays = Number(days)
    const parsedHours = Number(hours)
    if (!maleId || !femaleId || days === '' || hours === '') {
      setIsError(true)
      setMessage(t('fillBreeding'))
      return
    }
    if (
      !Number.isInteger(parsedDays) ||
      !Number.isInteger(parsedHours) ||
      parsedDays < 0 ||
      parsedHours < 0 ||
      parsedHours > 23
    ) {
      setIsError(true)
      setMessage(t('invalidTime'))
      return
    }
    const error = onBreed(femaleId, maleId, parsedDays, parsedHours)
    if (error) {
      setIsError(true)
      setMessage(error)
      return
    }
    setMaleId('')
    setFemaleId('')
    setDays('')
    setHours('')
    setIsError(false)
    setMessage(t('bred'))
  }

  return (
    <section className={panelClass}>
      <h2 className="font-serif text-xl text-wurm-text">{t('breedingTitle')}</h2>
      <p className="mt-1 mb-4 text-sm text-wurm-muted">{t('breedingHint')}</p>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className={labelClass} htmlFor="breed-male">{t('selectMale')}</label>
          <select
            id="breed-male"
            className={fieldClass}
            value={maleId}
            onChange={(event) => setMaleId(event.target.value)}
          >
            <option value="">{males.length ? t('selectMale') : t('noEligible')}</option>
            {males.map((animal) => (
              <option key={animal.id} value={animal.id}>{optionText(animal)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="breed-female">{t('selectFemale')}</label>
          <select
            id="breed-female"
            className={fieldClass}
            value={femaleId}
            onChange={(event) => setFemaleId(event.target.value)}
          >
            <option value="">{females.length ? t('selectFemale') : t('noEligible')}</option>
            {females.map((animal) => (
              <option key={animal.id} value={animal.id}>{optionText(animal)}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="breed-days">{t('days')}</label>
            <input
              id="breed-days"
              className={fieldClass}
              inputMode="numeric"
              value={days}
              onChange={(event) => setDays(event.target.value.replace(/[^\d]/g, ''))}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="breed-hours">{t('hours')}</label>
            <input
              id="breed-hours"
              className={fieldClass}
              inputMode="numeric"
              value={hours}
              onChange={(event) => setHours(event.target.value.replace(/[^\d]/g, ''))}
            />
          </div>
        </div>
        {message && (
          <p className={`text-sm ${isError ? 'text-red-400' : 'text-emerald-400'}`}>{message}</p>
        )}
        <button
          type="submit"
          className="w-full rounded-md bg-wurm-accent px-3 py-2 text-sm font-medium text-black hover:bg-wurm-accent/90"
        >
          {t('breed')}
        </button>
      </form>
    </section>
  )
}
