import { useCallback, useEffect, useState } from 'react'
import {
  applyDraft,
  createAnimal,
  defaultPersistedState,
  loadPersistedState,
  savePersistedState,
} from '../storage/persistedState'
import { mergeExaminedAnimals } from '../logic/mergeExaminedAnimals'
import { placeAnimal, removeAnimalFromPen, resizePen } from '../logic/penLayout'
import type { ParsedExamine } from '../logic/parseExamineLog'
import type { AnimalDraft } from '../types'

export function usePersistedHerd() {
  const [state, setState] = useState(loadPersistedState)

  useEffect(() => {
    savePersistedState(state)
  }, [state])

  const addAnimal = useCallback((draft: AnimalDraft) => {
    setState((prev) => ({
      ...prev,
      animals: [createAnimal(draft), ...prev.animals],
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

  const setBreeding = useCallback(
    (femaleId: string, maleId: string, days: number, hours: number) => {
      const due = Date.now() + days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000
      setState((prev) => ({
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
      }))
    },
    [],
  )

  const clearPregnancy = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      animals: prev.animals.map((animal) =>
        animal.id === id
          ? {
              ...animal,
              isPregnant: false,
              breedingMaleId: null,
              breedingDueDate: null,
              updatedAt: Date.now(),
            }
          : animal,
      ),
    }))
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
      return { ...prev, animals: merged.animals, pen }
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
    addAnimal,
    updateAnimal,
    deleteAnimal,
    setBreeding,
    clearPregnancy,
    resetHerd,
    importExamined,
    placeOnTile,
    removeFromTile,
    setPenSize,
  }
}
