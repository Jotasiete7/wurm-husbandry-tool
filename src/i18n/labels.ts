import type { TranslationKey } from './translations'

const AGE_KEYS: Record<string, TranslationKey> = {
  young: 'ageYoung',
  adolescent: 'ageAdolescent',
  mature: 'ageMature',
  aged: 'ageAged',
  old: 'ageOld',
  venerable: 'ageVenerable',
}

const GENDER_KEYS: Record<string, TranslationKey> = {
  male: 'genderMale',
  female: 'genderFemale',
}

export function ageKey(age: string): TranslationKey | null {
  return AGE_KEYS[age] ?? null
}

export function genderKey(gender: string): TranslationKey | null {
  return GENDER_KEYS[gender] ?? null
}
