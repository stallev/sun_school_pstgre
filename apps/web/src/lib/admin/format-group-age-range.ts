export const formatGroupAgeRange = (ageMin: number | null, ageMax: number | null): string | null => {
  if (ageMin !== null && ageMax !== null) return `${ageMin}–${ageMax}`;
  if (ageMin !== null) return `${ageMin}+`;
  if (ageMax !== null) return `≤${ageMax}`;
  return null;
};
