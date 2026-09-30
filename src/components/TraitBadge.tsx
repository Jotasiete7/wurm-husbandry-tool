import { formatTraits } from '../utils/traits'

export function TraitBadge({ traits }: { traits: string[] }) {
  const summary = formatTraits(traits)
  if (summary.abbreviation === '-') {
    return <span className="text-wurm-muted">-</span>
  }

  return (
    <span className="group relative inline-flex">
      <span className="cursor-help font-mono text-sm text-wurm-accent">
        {summary.abbreviation}
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-max max-w-xs -translate-x-1/2 whitespace-pre-line rounded-md border border-wurm-border bg-black px-2 py-1.5 text-left text-xs font-sans text-wurm-text shadow-lg group-hover:block">
        {summary.names.join('\n')}
      </span>
    </span>
  )
}
