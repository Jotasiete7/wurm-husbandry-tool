import { useCallback, useEffect, useState } from 'react'
import {
  applyDraft,
  createAnimal,
  defaultPersistedState,
  loadPersistedState,
  savePersistedState,
} from '../storage/persistedState'
import { mergeExaminedAnimals } from '../logic/mergeExaminedAnimals'
import { historyEntry, prependHistory } from '../logic/history'
import { placeAnimal, removeAnimalFromPen, resizePen } from '../logic/penLayout'
import type { ParsedExamine } from '../logic/parseExamineLog'
import type { AnimalDraft } from '../types'

export function usePersistedHerd() {
  const [state, setState] = useState(loadPersistedState)

  useEffect(() => {
    savePersistedState(state)
  }, [state])

  const addAnimal = useCallback((draft: AnimalDraft) => {
    const animal = createAnimal(draft)
    setState((prev) => ({
      ...prev,
      animals: [animal, ...prev.animals],
      history: prependHistory(prev.history, [historyEntry('added', animal.name)]),
    }))
  }, [])

  const updateAnimal = useCallback((id: string, draft: AnimalDraft) => {
    setState((prev) => ({
      ...prev,
      animals: prev.animals.map((animal) =>
        animal.id === id ? applyDraft(animal, draft) : animal,
      ),
    }))
  }, [])

  const deleteAnimal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      animals: prev.animals.filter((animal) => animal.id !== id),
      pen: removeAnimalFromPen(prev.pen, id),
    }))
  }, [])

  const markDead = useCallback((id: string) => {
    setState((prev) => {
      const animal = prev.animals.find((item) => item.id === id)
      if (!animal) return prev
      const now = Date.now()
      return {
        ...prev,
        animals: prev.animals.filter((item) => item.id !== id),
        deceased: [{ ...animal, diedAt: now, updatedAt: now }, ...prev.deceased.filter((item) => item.id !== id)],
        pen: removeAnimalFromPen(prev.pen, id),
        history: prependHistory(prev.history, [historyEntry('died', animal.name)]),
      }
    })
  }, [])

  const setBreeding = useCallback(
    (femaleId: string, maleId: string, days: number, hours: number) => {
      const due = Date.now() + days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000
      setState((prev) => {
        const female = prev.animals.find((animal) => animal.id === femaleId)
        const male = prev.animals.find((animal) => animal.id === maleId)
        return {
          ...prev,
          animals: prev.animals.map((animal) =>
            animal.id === femaleId
              ? {
                  ...animal,
                  isPregnant: true,
                  breedingMaleId: maleId,
                  breedingDueDate: due,
                  updatedAt: Date.now(),
                }
              : animal,
          ),
          history: female
            ? prependHistory(prev.history, [historyEntry('bred', female.name, { partner: male?.name })])
            : prev.history,
        }
      })
    },
    [],
  )

  const clearPregnancy = useCallback((id: string) => {
    setState((prev) => {
      const animal = prev.animals.find((item) => item.id === id)
      return {
        ...prev,
        animals: prev.animals.map((item) =>
          item.id === id
            ? {
                ...item,
                isPregnant: false,
                breedingMaleId: null,
                breedingDueDate: null,
                updatedAt: Date.now(),
              }
            : item,
        ),
        history: animal
          ? prependHistory(prev.history, [historyEntry('born', animal.name, { birth: 'delivered' })])
          : prev.history,
      }
    })
  }, [])

  const resetHerd = useCallback(() => {
    setState(defaultPersistedState())
  }, [])

  const importExamined = useCallback((parsed: ParsedExamine[], tileIndex?: number | null) => {
    let summary = { added: 0, updated: 0, skipped: 0 }
    setState((prev) => {
      const merged = mergeExaminedAnimals(prev.animals, parsed)
      let pen = prev.pen
      let placed = 0
      if (typeof tileIndex === 'number') {
        for (const id of merged.addedIds) {
          const updatedPen = placeAnimal(pen, id, tileIndex)
          if (updatedPen !== pen) {
            pen = updatedPen
            placed += 1
          }
        }
      }
      summary = {
        added: merged.added,
        updated: merged.updated,
        skipped: typeof tileIndex === 'number' ? merged.addedIds.length - placed : 0,
      }
      const fresh = merged.addedIds
        .map((id) => merged.animals.find((animal) => animal.id === id))
        .filter((animal): animal is NonNullable<typeof animal> => Boolean(animal))
        .reverse()
      const entries = fresh.map((animal) =>
        historyEntry(
          typeof tileIndex === 'number' ? 'born' : 'added',
          animal.name,
          typeof tileIndex === 'number' ? { birth: 'newborn' } : undefined,
        ),
      )
      return { ...prev, animals: merged.animals, pen, history: prependHistory(prev.history, entries) }
    })
    return summary
  }, [])

  const placeOnTile = useCallback((animalId: string, tileIndex: number) => {
    setState((prev) => ({
      ...prev,
      pen: placeAnimal(prev.pen, animalId, tileIndex),
    }))
  }, [])

  const removeFromTile = useCallback((animalId: string) => {
    setState((prev) => ({
      ...prev,
      pen: removeAnimalFromPen(prev.pen, animalId),
    }))
  }, [])

  const setPenSize = useCallback((columns: number, rows: number) => {
    setState((prev) => ({
      ...prev,
      pen: resizePen(prev.pen, columns, rows),
    }))
  }, [])

  return {
    animals: state.animals,
    pen: state.pen,
    history: state.history,
    addAnimal,
    updateAnimal,
    deleteAnimal,
    markDead,
    setBreeding,
    clearPregnancy,
    resetHerd,
    importExamined,
    placeOnTile,
    removeFromTile,
    setPenSize,
  }
}
