import { createAnimalId } from '../storage/persistedState'
import type { HistoryEntry, HistoryKind } from '../types'

export const HISTORY_LIMIT = 200

export function historyEntry(
  kind: HistoryKind,
  name: string,
  extra?: { partner?: string; birth?: HistoryEntry['birth'] },
): HistoryEntry {
  return {
    id: createAnimalId(),
    at: Date.now(),
    kind,
    name,
    ...(extra?.partner ? { partner: extra.partner } : {}),
    ...(extra?.birth ? { birth: extra.birth } : {}),
  }
}

export function prependHistory(history: HistoryEntry[], entries: HistoryEntry[]): HistoryEntry[] {
  if (entries.length === 0) return history
  return [...entries, ...history].slice(0, HISTORY_LIMIT)
}
