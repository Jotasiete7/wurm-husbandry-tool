import { ImagePlus, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ANIMAL_AGES,
  ANIMAL_CONDITIONS,
  ANIMAL_GENDERS,
  ANIMAL_TRAITS,
  ANIMAL_TYPES,
  optionLabel,
} from '../data/catalog'
import { ageKey, genderKey } from '../i18n/labels'
import { useLanguage } from '../i18n/LanguageContext'
import type { ParsedExamine } from '../logic/parseExamineLog'
import { recognizeInspect } from '../logic/recognizeInspect'
import type { Gender } from '../types'
import { fieldClass, labelClass, panelClass } from './ui'

type InspectImportProps = {
  onImport: (parsed: ParsedExamine[]) => void
}

function imageFile(data: DataTransfer | null): File | null {
  if (!data) return null
  const fromItems = [...data.items].find((item) => item.type.startsWith('image/'))?.getAsFile()
  if (fromItems) return fromItems
  return [...data.files].find((file) => file.type.startsWith('image/')) ?? null
}

export function InspectImport({ onImport }: InspectImportProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [reading, setReading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedExamine | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [traitQuery, setTraitQuery] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<string | null>(null)

  const replacePreview = (next: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = next
    setPreviewUrl(next)
  }

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !reading) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, reading])

  const run = async (file: File) => {
    setOpen(true)
    setError(null)
      setParsed(null)
      setTraitQuery('')
      setReading(true)
    setProgress(0)
    replacePreview(URL.createObjectURL(file))
    try {
      const result = await recognizeInspect(file, setProgress)
      if (!result) {
        setError(t('inspectEmpty'))
        return
      }
      setParsed(result)
    } catch {
      setError(t('inspectFailed'))
    } finally {
      setReading(false)
    }
  }

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      const file = imageFile(event.clipboardData)
      if (!file) return
      event.preventDefault()
      void run(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [t])

  const patch = (partial: Partial<ParsedExamine>) => {
    setParsed((current) => (current ? { ...current, ...partial } : current))
  }

  const filteredTraits = useMemo(() => {
    const query = traitQuery.trim().toLowerCase()
    if (!query) return ANIMAL_TRAITS
    return ANIMAL_TRAITS.filter((trait) => {
      const inName = trait.trait.toLowerCase().includes(query)
      const inCategory = trait.categories.some((category) => category.toLowerCase().includes(query))
      return inName || inCategory
    })
  }, [traitQuery])

  const handleImport = () => {
    if (!parsed || !parsed.name.trim()) return
    onImport([{ ...parsed, name: parsed.name.trim(), father: parsed.father.trim(), mother: parsed.mother.trim() }])
    setParsed(null)
    setTraitQuery('')
    setError(null)
    replacePreview(null)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md bg-wurm-accent px-3 py-2 text-sm font-medium text-black hover:bg-wurm-accent/90"
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
      >
        <ImagePlus size={16} />
        {t('inspectShot')}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void run(file)
        }}
      />

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
          onClick={() => {
            if (!reading) setOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-labelledby="inspect-title"
            className={`${panelClass} max-h-[90vh] w-full max-w-2xl overflow-y-auto`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="inspect-title" className="font-serif text-xl text-wurm-text">
                {t('inspectShot')}
              </h2>
              <button
                type="button"
                className="text-wurm-muted hover:text-wurm-text disabled:opacity-40"
                disabled={reading}
                onClick={() => setOpen(false)}
                aria-label={t('cancel')}
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-3 text-sm text-wurm-muted">{t('inspectHint')}</p>

            <div
              className={`rounded-md border border-dashed px-4 py-6 text-center ${
                dragOver ? 'border-wurm-accent bg-wurm-bg' : 'border-wurm-border'
              }`}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragOver(false)
                const file = imageFile(event.dataTransfer)
                if (file) void run(file)
              }}
            >
              {previewUrl && (
                <img src={previewUrl} alt="" className="mx-auto mb-3 max-h-40 rounded-md" />
              )}
              <p className="mb-3 text-sm text-wurm-muted">{t('inspectDrop')}</p>
              <button
                type="button"
                className="rounded-md border border-wurm-border px-3 py-2 text-sm text-wurm-text hover:border-wurm-accent disabled:opacity-40"
                disabled={reading}
                onClick={() => fileRef.current?.click()}
              >
                {t('inspectChoose')}
              </button>
            </div>

            {reading && (
              <p className="mt-3 text-sm text-wurm-accent">
                {t('inspectReading')} {Math.round(progress * 100)}%
              </p>
            )}

            {parsed && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-wurm-accentDim">{t('inspectEditHint')}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="inspect-name">{t('name')}</label>
                    <input
                      id="inspect-name"
                      className={fieldClass}
                      value={parsed.name}
                      onChange={(event) => patch({ name: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="inspect-type">{t('type')}</label>
                    <select
                      id="inspect-type"
                      className={fieldClass}
                      value={parsed.type}
                      onChange={(event) => patch({ type: event.target.value })}
                    >
                      {ANIMAL_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {optionLabel(ANIMAL_TYPES, option.value)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="inspect-gender">{t('gender')}</label>
                    <select
                      id="inspect-gender"
                      className={fieldClass}
                      value={parsed.gender}
                      onChange={(event) => patch({ gender: event.target.value as Gender })}
                    >
                      {ANIMAL_GENDERS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {genderKey(option.value) ? t(genderKey(option.value)!) : option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="inspect-age">{t('age')}</label>
                    <select
                      id="inspect-age"
                      className={fieldClass}
                      value={parsed.age}
                      onChange={(event) => patch({ age: event.target.value })}
                    >
                      {ANIMAL_AGES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {ageKey(option.value) ? t(ageKey(option.value)!) : option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="inspect-condition">{t('condition')}</label>
                    <select
                      id="inspect-condition"
                      className={fieldClass}
                      value={parsed.condition}
                      onChange={(event) => patch({ condition: event.target.value })}
                    >
                      {ANIMAL_CONDITIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.value === 'none' ? t('conditionNone') : option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="inspect-mother">{t('mother')}</label>
                    <input
                      id="inspect-mother"
                      className={fieldClass}
                      value={parsed.mother}
                      placeholder={t('parentPlaceholder')}
                      onChange={(event) => patch({ mother: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="inspect-father">{t('father')}</label>
                    <input
                      id="inspect-father"
                      className={fieldClass}
                      value={parsed.father}
                      placeholder={t('parentPlaceholder')}
                      onChange={(event) => patch({ father: event.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass} htmlFor="inspect-pregnancy">{t('inspectPregnancy')}</label>
                  <select
                    id="inspect-pregnancy"
                    className={fieldClass}
                    value={parsed.pregnancy}
                    onChange={(event) =>
                      patch({ pregnancy: event.target.value as ParsedExamine['pregnancy'] })
                    }
                  >
                    <option value="unknown">{t('inspectUnknown')}</option>
                    <option value="ready">{t('inspectReady')}</option>
                    <option value="pregnant">{t('inspectPregnantChoice')}</option>
                  </select>
                  {parsed.pregnancy === 'pregnant' && (
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass} htmlFor="inspect-days">{t('days')}</label>
                        <input
                          id="inspect-days"
                          type="number"
                          min={0}
                          className={fieldClass}
                          value={parsed.pregnancyDays}
                          onChange={(event) =>
                            patch({ pregnancyDays: Math.max(0, Number(event.target.value) || 0) })
                          }
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="inspect-hours">{t('hours')}</label>
                        <input
                          id="inspect-hours"
                          type="number"
                          min={0}
                          max={23}
                          className={fieldClass}
                          value={parsed.pregnancyHours}
                          onChange={(event) =>
                            patch({
                              pregnancyHours: Math.min(23, Math.max(0, Number(event.target.value) || 0)),
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass} htmlFor="inspect-notes">{t('notes')}</label>
                  <textarea
                    id="inspect-notes"
                    className={fieldClass}
                    rows={2}
                    value={parsed.notes}
                    onChange={(event) => patch({ notes: event.target.value })}
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className={labelClass} htmlFor="inspect-traits">{t('traits')}</label>
                    <span className="text-xs text-wurm-muted">{parsed.traits.length}</span>
                  </div>
                  <input
                    id="inspect-traits"
                    className={fieldClass}
                    value={traitQuery}
                    placeholder={t('traitSearchPlaceholder')}
                    onChange={(event) => setTraitQuery(event.target.value)}
                  />
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
                            checked={parsed.traits.includes(trait.trait)}
                            onChange={() =>
                              patch({
                                traits: parsed.traits.includes(trait.trait)
                                  ? parsed.traits.filter((item) => item !== trait.trait)
                                  : [...parsed.traits, trait.trait],
                              })
                            }
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
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className={`text-sm ${error ? 'text-red-400' : 'text-wurm-muted'}`}>{error ?? ''}</p>
              <button
                type="button"
                className="rounded-md bg-wurm-accent px-3 py-2 text-sm font-medium text-black hover:bg-wurm-accent/90 disabled:opacity-40"
                disabled={!parsed?.name.trim() || reading}
                onClick={handleImport}
              >
                {t('inspectAdd')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
