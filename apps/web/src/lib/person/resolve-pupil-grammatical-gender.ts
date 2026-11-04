export const PUPIL_GRAMMATICAL_GENDER = {
  MALE: "male",
  FEMALE: "female",
  UNKNOWN: "unknown",
} as const;

export type PupilGrammaticalGender =
  (typeof PUPIL_GRAMMATICAL_GENDER)[keyof typeof PUPIL_GRAMMATICAL_GENDER];

export type PupilGrammaticalGenderInput = {
  middleName?: string | null;
};

const FEMALE_PATRONYMIC_SUFFIX = /(овна|евна|ична|инична)$/i;
const MALE_PATRONYMIC_SUFFIX = /(ович|евич|ич)$/i;

/** Infers grammatical gender from patronymic (middle name) when present. */
export const resolvePupilGrammaticalGender = (
  input: PupilGrammaticalGenderInput,
): PupilGrammaticalGender => {
  const middleName = input.middleName?.trim();
  if (!middleName) {
    return PUPIL_GRAMMATICAL_GENDER.UNKNOWN;
  }
  const normalized = middleName.toLowerCase();
  if (FEMALE_PATRONYMIC_SUFFIX.test(normalized)) {
    return PUPIL_GRAMMATICAL_GENDER.FEMALE;
  }
  if (MALE_PATRONYMIC_SUFFIX.test(normalized)) {
    return PUPIL_GRAMMATICAL_GENDER.MALE;
  }
  return PUPIL_GRAMMATICAL_GENDER.UNKNOWN;
};
