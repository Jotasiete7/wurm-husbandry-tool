import { useMemo, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import type { HistoryEntry, HistoryKind } from '../types'
import { panelClass } from './ui'

type HistoryLogProps = {
  history: HistoryEntry[]
}

const FILTERS: Array<HistoryKind | 'all'> = ['all', 'died', 'bred', 'born', 'added']

const kindKey = {
  died: 'historyDied',
  bred: 'historyBred',
  born: 'historyBorn',
  added: 'historyAdded',
} as const

const kindClass = {
  died: 'text-red-300',
  bred: 'text-wurm-accent',
  born: 'text-[#6faf7a]',
  added: 'text-wurm-text',
} as const

export function HistoryLog({ history }: HistoryLogProps) {
  const { language, t } = useLanguage()
  const [filter, setFilter] = useState<HistoryKind | 'all'>('all')

  const shown = useMemo(
    () => (filter === 'all' ? history : history.filter((entry) => entry.kind === filter)),
    [filter, history],
  )

  const locale = language === 'pt' ? 'pt-BR' : language === 'ru' ? 'ru-RU' : 'en-GB'

  const sentence = (entry: HistoryEntry) => {
    if (entry.kind === 'died') return t('historyDiedLine', { name: entry.name })
    if (entry.kind === 'bred') return t('historyBredLine', { name: entry.name, partner: entry.partner ?? t('unknownSire') })
    if (entry.kind === 'born' && entry.birth === 'delivered') return t('historyDeliveredLine', { name: entry.name })
    if (entry.kind === 'born') return t('historyBornLine', { name: entry.name })
    return t('historyAddedLine', { name: entry.name })
  }

  return (
    <section className={panelClass}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl text-wurm-text">{t('historyTitle')}</h2>
        <span className="text-sm text-wurm-muted">{history.length}</span>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={filter === kind}
            className={`rounded-md px-2.5 py-1 text-xs ${
              filter === kind
                ? 'bg-wurm-accent font-medium text-black'
                : 'border border-wurm-border text-wurm-muted hover:border-wurm-accent hover:text-wurm-text'
            }`}
            onClick={() => setFilter(kind)}
          >
            {kind === 'all' ? t('historyAll') : t(kindKey[kind])}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-wurm-muted">
          {history.length === 0 ? t('historyEmpty') : t('historyEmptyFiltered')}
        </p>
      ) : (
        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {shown.map((entry) => (
            <li key={entry.id} className="flex items-baseline gap-3 border-b border-wurm-border/70 py-2 text-sm">
              <time className="w-28 shrink-0 font-mono text-xs text-wurm-muted" dateTime={new Date(entry.at).toISOString()}>
                {new Date(entry.at).toLocaleString(locale, {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
              <span className={`w-24 shrink-0 text-xs uppercase tracking-wide ${kindClass[entry.kind]}`}>
                {t(kindKey[entry.kind])}
              </span>
              <span className="text-wurm-text">{sentence(entry)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
