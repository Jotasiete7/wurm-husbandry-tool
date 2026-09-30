import { ClipboardPaste, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { looksLikeExamineLog, parseExamineLog, type ParsedExamine } from '../logic/parseExamineLog'
import { fieldClass, panelClass } from './ui'

type ExamineImportProps = {
  onImport: (parsed: ParsedExamine[]) => void
}

export function ExamineImport({ onImport }: ExamineImportProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const parsed = useMemo(() => (log.trim() ? parseExamineLog(log) : []), [log])

  useEffect(() => {
    if (open) textRef.current?.focus()
  }, [open])

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      const text = event.clipboardData?.getData('text') ?? ''
      if (!looksLikeExamineLog(text)) return
      event.preventDefault()
      setLog(text)
      setError(null)
      setOpen(true)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  const handleFile = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setLog(String(reader.result ?? ''))
      setError(null)
      setOpen(true)
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (parsed.length === 0) {
      setError(t('examineEmpty'))
      return
    }
    onImport(parsed)
    setLog('')
    setError(null)
    setOpen(false)
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-wurm-accent px-3 py-2 text-sm font-medium text-black hover:bg-wurm-accent/90"
          onClick={() => {
            setError(null)
            setOpen(true)
          }}
        >
          <ClipboardPaste size={16} />
          {t('pasteExamine')}
        </button>
        <button
          type="button"
          className="rounded-md border border-wurm-border px-3 py-2 text-sm text-wurm-text hover:border-wurm-accent"
          onClick={() => fileRef.current?.click()}
        >
          {t('openLog')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(event) => {
            handleFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className={`${panelClass} w-full max-w-2xl`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-serif text-xl text-wurm-text">{t('pasteExamine')}</h2>
              <button
                type="button"
                className="text-wurm-muted hover:text-wurm-text"
                onClick={() => setOpen(false)}
                aria-label={t('cancel')}
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-3 text-sm text-wurm-muted">{t('pasteExamineHint')}</p>
            <textarea
              id="examine-log"
              ref={textRef}
              className={`${fieldClass} min-h-56 font-mono text-xs`}
              placeholder={t('examinePlaceholder')}
              value={log}
              onChange={(event) => {
                setLog(event.target.value)
                setError(null)
              }}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className={`text-sm ${error ? 'text-red-400' : 'text-wurm-muted'}`}>
                {error ?? (log.trim() ? t('examinePreview', { count: parsed.length }) : '')}
              </p>
              <button
                type="button"
                className="rounded-md bg-wurm-accent px-3 py-2 text-sm font-medium text-black hover:bg-wurm-accent/90 disabled:opacity-40"
                disabled={!log.trim()}
                onClick={handleImport}
              >
                {t('importAnimals')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
