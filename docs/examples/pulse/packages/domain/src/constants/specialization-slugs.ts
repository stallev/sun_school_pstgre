export const SPECIALIZATION_SLUGS = [
  "cardio",
  "pilates",
  "strength",
  "hiit",
  "stretching",
] as const;

export type SpecializationSlug = (typeof SPECIALIZATION_SLUGS)[number];

export const SPECIALIZATION_SLUG_SET = new Set<string>(SPECIALIZATION_SLUGS);

export function isSpecializationSlug(value: string): value is SpecializationSlug {
  return SPECIALIZATION_SLUG_SET.has(value);
}
