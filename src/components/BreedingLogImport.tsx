import { ClipboardPaste, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { parseBreedingLog } from '../logic/parseBreedingLog'
import type { Animal } from '../types'
import { fieldClass, panelClass } from './ui'

type BreedingLogImportProps = {
  animals: Animal[]
  onBreed: (femaleId: string, maleId: string, days: number, hours: number) => string | null
  onSaved?: () => void
  variant?: 'icon' | 'button'
}

export function BreedingLogImport({ animals, onBreed, onSaved, variant = 'button' }: BreedingLogImportProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState('')
  const [error, setError] = useState<string | null>(null)

  const logResult = useMemo(() => (log.trim() ? parseBreedingLog(log, animals) : null), [log, animals])

  const logMessage = () => {
    if (error) return error
    if (!logResult || logResult.ok) return ''
    if (logResult.error === 'names' && logResult.name) return t('breedLogNames', { name: logResult.name })
    if (logResult.error === 'names') return t('breedLogNamesUnknown')
    if (logResult.error === 'time') return t('breedLogTime')
    if (logResult.error === 'gender') return t('breedLogGender')
    return t('breedLogEmpty')
  }

  const handleSave = () => {
    if (!logResult || !logResult.ok) return
    const saveError = onBreed(logResult.match.female.id, logResult.match.male.id, logResult.match.days, logResult.match.hours)
    if (saveError) {
      setError(saveError)
      return
    }
    setLog('')
    setError(null)
    setOpen(false)
    onSaved?.()
  }

  return (
    <>
      <button
        type="button"
        className={
          variant === 'icon'
            ? 'inline-flex flex-1 items-center justify-center rounded-md border border-wurm-border text-wurm-text hover:border-wurm-accent'
            : 'inline-flex items-center gap-2 rounded-md border border-wurm-border px-3 py-2 text-sm text-wurm-text hover:border-wurm-accent'
        }
        aria-label={variant === 'button' ? t('breedButton') : t('pasteBreeding')}
        title={variant === 'button' ? t('breedButton') : t('pasteBreeding')}
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
      >
        <ClipboardPaste size={16} />
        {variant === 'button' && t('breedButton')}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="breed-log-title"
            className={`${panelClass} w-full max-w-lg`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="breed-log-title" className="font-serif text-xl text-wurm-text">{t('pasteBreeding')}</h2>
              <button
                type="button"
                className="text-wurm-muted hover:text-wurm-text"
                onClick={() => setOpen(false)}
                aria-label={t('cancel')}
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-3 text-sm text-wurm-muted">{t('pasteBreedingHint')}</p>
            <textarea
              id="breed-log"
              className={`${fieldClass} min-h-32 font-mono text-xs`}
              value={log}
              onChange={(event) => {
                setLog(event.target.value)
                setError(null)
              }}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className={`text-sm ${error || (logResult && !logResult.ok) ? 'text-red-400' : 'text-wurm-muted'}`}>
                {logResult?.ok && !error
                  ? t('breedLogPreview', {
                      female: logResult.match.female.name,
                      male: logResult.match.male.name,
                      days: logResult.match.days,
                      hours: logResult.match.hours,
                    })
                  : logMessage()}
              </p>
              <button
                type="button"
                className="rounded-md bg-wurm-accent px-3 py-2 text-sm font-medium text-black hover:bg-wurm-accent/90 disabled:opacity-40"
                disabled={!logResult?.ok}
                onClick={handleSave}
              >
                {t('breed')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
