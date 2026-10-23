import { describe, expect, it } from "vitest";
import { ADULT_RELATION } from "../constants/enums";
import { MUTATION_ERROR_CODES, MUTATION_WARNING_CODES } from "../constants/mutation-error-codes";
import {
  assertFamilyRelationLimits,
  canAttachPupil,
  canMergeFamilies,
  canPersistFamily,
  canRemoveFamilyAdult,
  canSetAdultRelation,
  warningAfterRemoveAdult,
} from "./family-rules";

describe("canPersistFamily (СМ-5)", () => {
  it("rejects empty family", () => {
    expect(canPersistFamily(0, 0)?.code).toBe(MUTATION_ERROR_CODES.FAMILY_EMPTY);
  });

  it("allows adult only", () => {
    expect(canPersistFamily(1, 0)).toBeNull();
  });

  it("allows pupil only", () => {
    expect(canPersistFamily(0, 1)).toBeNull();
  });
});

describe("canAttachPupil (СМ-1)", () => {
  it("rejects when pupil already has a family", () => {
    expect(canAttachPupil("family-1")?.code).toBe(MUTATION_ERROR_CODES.FAMILY_CHILD_HAS_FAMILY);
  });

  it("allows when pupil has no family", () => {
    expect(canAttachPupil(null)).toBeNull();
  });
});

describe("relation limits (СМ-3)", () => {
  it("rejects second mother", () => {
    expect(
      canSetAdultRelation([ADULT_RELATION.MOTHER], ADULT_RELATION.MOTHER)?.code,
    ).toBe(MUTATION_ERROR_CODES.FAMILY_RELATION_LIMIT);
  });

  it("rejects second father", () => {
    expect(
      canSetAdultRelation([ADULT_RELATION.FATHER], ADULT_RELATION.FATHER)?.code,
    ).toBe(MUTATION_ERROR_CODES.FAMILY_RELATION_LIMIT);
  });

  it("allows multiple guardians", () => {
    expect(
      canSetAdultRelation([ADULT_RELATION.GUARDIAN], ADULT_RELATION.GUARDIAN),
    ).toBeNull();
  });

  it("allows mother and father", () => {
    expect(assertFamilyRelationLimits([ADULT_RELATION.MOTHER, ADULT_RELATION.FATHER])).toBeNull();
  });
});

describe("canRemoveFamilyAdult (СМ-7)", () => {
  it("does not forbid removing the last adult", () => {
    expect(canRemoveFamilyAdult()).toBeNull();
  });

  it("warns when no adults remain", () => {
    expect(warningAfterRemoveAdult(0)).toBe(MUTATION_WARNING_CODES.FAMILY_NO_ADULTS);
  });

  it("does not warn when adults remain", () => {
    expect(warningAfterRemoveAdult(1)).toBeNull();
  });
});

describe("canMergeFamilies (СМ-10)", () => {
  it("rejects merge that would create two mothers", () => {
    expect(
      canMergeFamilies([ADULT_RELATION.MOTHER], [ADULT_RELATION.MOTHER])?.code,
    ).toBe(MUTATION_ERROR_CODES.FAMILY_RELATION_LIMIT);
  });

  it("allows merge when relations fit", () => {
    expect(
      canMergeFamilies(
        [ADULT_RELATION.MOTHER],
        [ADULT_RELATION.FATHER, ADULT_RELATION.GUARDIAN],
      ),
    ).toBeNull();
  });
});
