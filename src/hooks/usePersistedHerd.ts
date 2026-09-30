import { useCallback, useEffect, useState } from 'react'
import {
  applyDraft,
  createAnimal,
  defaultPersistedState,
  loadPersistedState,
  savePersistedState,
} from '../storage/persistedState'
import { mergeExaminedAnimals } from '../logic/mergeExaminedAnimals'
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

  const importExamined = useCallback((parsed: ParsedExamine[]) => {
    let summary = { added: 0, updated: 0 }
    setState((prev) => {
      const merged = mergeExaminedAnimals(prev.animals, parsed)
      summary = { added: merged.added, updated: merged.updated }
      return { ...prev, animals: merged.animals }
    })
    return summary
  }, [])

  return {
    animals: state.animals,
    addAnimal,
    updateAnimal,
    deleteAnimal,
    setBreeding,
    clearPregnancy,
    resetHerd,
    importExamined,
  }
}
