import { ADULT_RELATION, type AdultRelation } from "../constants/enums";
import {
  MUTATION_ERROR_CODES,
  MUTATION_WARNING_CODES,
  type MutationWarningCode,
} from "../constants/mutation-error-codes";
import type { MutationErr } from "../types/mutation-result";

const relationLimitError = (): MutationErr => ({
  ok: false,
  code: MUTATION_ERROR_CODES.FAMILY_RELATION_LIMIT,
  message: "admin.family.relation_limit",
});

const childHasFamilyError = (): MutationErr => ({
  ok: false,
  code: MUTATION_ERROR_CODES.FAMILY_CHILD_HAS_FAMILY,
  message: "admin.family.child_taken",
});

const emptyFamilyError = (): MutationErr => ({
  ok: false,
  code: MUTATION_ERROR_CODES.FAMILY_EMPTY,
  message: "admin.family.empty",
});

const countMothersAndFathers = (relations: readonly AdultRelation[]): { mothers: number; fathers: number } => {
  let mothers = 0;
  let fathers = 0;
  for (const relation of relations) {
    if (relation === ADULT_RELATION.MOTHER) mothers += 1;
    if (relation === ADULT_RELATION.FATHER) fathers += 1;
  }
  return { mothers, fathers };
};

/** families_and_parents_contract §6.1, СМ-3 — at most one mother and one father per family. */
export const assertFamilyRelationLimits = (relations: readonly AdultRelation[]): MutationErr | null => {
  const { mothers, fathers } = countMothersAndFathers(relations);
  if (mothers > 1 || fathers > 1) {
    return relationLimitError();
  }
  return null;
};

/** СМ-3 — adding or updating an adult must not exceed relation limits. */
export const canSetAdultRelation = (
  existingRelations: readonly AdultRelation[],
  nextRelation: AdultRelation,
  replaceIndex: number | null = null,
): MutationErr | null => {
  const next = [...existingRelations];
  if (replaceIndex === null) {
    next.push(nextRelation);
  } else {
    next[replaceIndex] = nextRelation;
  }
  return assertFamilyRelationLimits(next);
};

/** СМ-1 — pupil may belong to at most one family. */
export const canAttachPupil = (pupilFamilyId: string | null): MutationErr | null => {
  if (pupilFamilyId !== null) {
    return childHasFamilyError();
  }
  return null;
};

/** СМ-5 — family is not persisted without at least one adult or pupil. */
export const canPersistFamily = (adultCount: number, pupilCount: number): MutationErr | null => {
  if (adultCount <= 0 && pupilCount <= 0) {
    return emptyFamilyError();
  }
  return null;
};

/** СМ-7 — removing the last adult is allowed; caller may surface a warning. */
export const canRemoveFamilyAdult = (): MutationErr | null => null;

export const warningAfterRemoveAdult = (remainingAdultCount: number): MutationWarningCode | null => {
  if (remainingAdultCount <= 0) {
    return MUTATION_WARNING_CODES.FAMILY_NO_ADULTS;
  }
  return null;
};

/** СМ-10 — merged family must satisfy СМ-3 before write. */
export const canMergeFamilies = (
  targetRelations: readonly AdultRelation[],
  sourceRelations: readonly AdultRelation[],
): MutationErr | null => assertFamilyRelationLimits([...targetRelations, ...sourceRelations]);
