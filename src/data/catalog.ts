export type CatalogOption = {
  value: string
  label: string
}

export type AnimalTrait = {
  trait: string
  categories: string[]
}

export const ANIMAL_TYPES: CatalogOption[] = [
  { value: 'horse', label: 'Horse' },
  { value: 'bison', label: 'Bison' },
  { value: 'hell_horse', label: 'Hell Horse' },
  { value: 'cow', label: 'Cow' },
  { value: 'bull', label: 'Bull' },
  { value: 'donkey', label: 'Donkey' },
  { value: 'mule', label: 'Mule' },
  { value: 'ram', label: 'Ram' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'pig', label: 'Pig' },
  { value: 'deer', label: 'Deer' },
  { value: 'pheasant', label: 'Pheasant' },
  { value: 'hen', label: 'Hen' },
  { value: 'rooster', label: 'Rooster' },
  { value: 'dog', label: 'Dog' },
  { value: 'unicorn', label: 'Unicorn' },
  { value: 'wild_cat', label: 'Wild cat' },
]

export const ANIMAL_AGES: CatalogOption[] = [
  { value: 'young', label: 'Young' },
  { value: 'adolescent', label: 'Adolescent' },
  { value: 'mature', label: 'Mature' },
  { value: 'aged', label: 'Aged' },
  { value: 'old', label: 'Old' },
  { value: 'venerable', label: 'Venerable' },
]

export const ANIMAL_CONDITIONS: CatalogOption[] = [
  { value: 'none', label: 'None' },
  { value: 'alert', label: 'Alert' },
  { value: 'angry', label: 'Angry' },
  { value: 'champion', label: 'Champion' },
  { value: 'fierce', label: 'Fierce' },
  { value: 'greenish', label: 'Greenish' },
  { value: 'hardened', label: 'Hardened' },
  { value: 'lurking', label: 'Lurking' },
  { value: 'raging', label: 'Raging' },
  { value: 'scared', label: 'Scared' },
  { value: 'slow', label: 'Slow' },
  { value: 'sly', label: 'Sly' },
]

export const ANIMAL_GENDERS: CatalogOption[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

export const BREEDING_AGES = ['mature', 'aged', 'old', 'venerable']

export const ANIMAL_TRAITS: AnimalTrait[] = [
  { trait: 'Bred in captivity.', categories: ['Miscellaneous'] },
  { trait: "Horse's color is considered a trait.", categories: ['Miscellaneous'] },
  { trait: 'It can carry more than average.', categories: ['Draft'] },
  { trait: 'It gives more resources', categories: ['Output'] },
  { trait: 'It has a certain spark in its eyes.', categories: ['Miscellaneous'] },
  { trait: 'It has a chance to produce twins', categories: ['Miscellaneous', 'Rare'] },
  { trait: 'It has a slow metabolism', categories: ['Miscellaneous'] },
  { trait: 'It has a strong body.', categories: ['Draft'] },
  { trait: 'It has adapted well to cooler climates', categories: ['Miscellaneous'] },
  { trait: 'It has been corrupted.', categories: ['Miscellaneous'] },
  { trait: 'It has fleeter movement than normal.', categories: ['Speed'] },
  { trait: 'It has lightning movement.', categories: ['Speed'] },
  { trait: 'It has malformed hindlegs.', categories: ['Negative'] },
  { trait: 'It has some illness.', categories: ['Negative'] },
  { trait: 'It has strong legs', categories: ['Draft'] },
  { trait: 'It has very good genes', categories: ['Output', 'Rare'] },
  { trait: 'It has very strong leg muscles.', categories: ['Speed'] },
  { trait: 'It is a tough bugger.', categories: ['Combat'] },
  { trait: 'It is easy on its gear', categories: ['Draft'] },
  { trait: 'It is unbelievably fast', categories: ['Speed', 'Rare'] },
  { trait: 'It is unusually strong-willed.', categories: ['Negative'] },
  { trait: 'It looks constantly hungry.', categories: ['Negative'] },
  { trait: 'It looks extremely sick', categories: ['Negative'] },
  { trait: 'It looks feeble and unhealthy.', categories: ['Negative'] },
  { trait: 'It looks more friendly than normal', categories: ['Combat'] },
  { trait: 'It looks plump and ready to butcher', categories: ['Output'] },
  { trait: 'It looks stationary', categories: ['Miscellaneous'] },
  { trait: 'It looks unusually strong and healthy.', categories: ['Miscellaneous'] },
  { trait: 'It looks very unmotivated.', categories: ['Negative'] },
  { trait: 'It seems accustomed to water', categories: ['Speed'] },
  { trait: 'It seems especially loyal', categories: ['Combat'] },
  { trait: 'It seems extremely tame', categories: ['Combat', 'Rare'] },
  { trait: 'It seems immortal', categories: ['Miscellaneous', 'Rare'] },
  { trait: 'It seems more friendly', categories: ['Combat'] },
  { trait: 'It seems more nimble than normal', categories: ['Draft', 'Rare'] },
  { trait: 'It seems overly aggressive.', categories: ['Negative'] },
  { trait: 'It seems prize winning', categories: ['Output'] },
  { trait: 'It seems shabby and frail', categories: ['Negative'] },
  { trait: 'It seems stronger than normal', categories: ['Draft', 'Rare'] },
  { trait: 'It seems to be a graceful eater', categories: ['Miscellaneous'] },
  { trait: 'It seems to dislike steep terrain', categories: ['Negative'] },
  { trait: 'It seems to pick stuff up', categories: ['Output'] },
  { trait: 'It seems vibrant', categories: ['Output'] },
  { trait: 'It will fight fiercely.', categories: ['Combat'] },
  { trait: 'The legs are of different length.', categories: ['Negative'] },
]

export function optionLabel(options: CatalogOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}
