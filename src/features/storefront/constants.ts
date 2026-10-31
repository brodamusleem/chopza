export const CUISINE_OPTIONS = [
  'Local dishes',
  'Rice & stews',
  'Grills & suya',
  'Fast food',
  'Shawarma & wraps',
  'Bakery & snacks',
  'Drinks & smoothies',
  'Other',
] as const

export type CuisineOption = (typeof CUISINE_OPTIONS)[number]
