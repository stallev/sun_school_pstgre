import { describe, expect, it } from "vitest";
import {
  PUPIL_GRAMMATICAL_GENDER,
  resolvePupilGrammaticalGender,
} from "./resolve-pupil-grammatical-gender";

describe("resolvePupilGrammaticalGender", () => {
  it("returns unknown when patronymic is missing", () => {
    expect(resolvePupilGrammaticalGender({ middleName: null })).toBe(
      PUPIL_GRAMMATICAL_GENDER.UNKNOWN,
    );
  });

  it("detects female patronymic endings", () => {
    expect(resolvePupilGrammaticalGender({ middleName: "Ивановна" })).toBe(
      PUPIL_GRAMMATICAL_GENDER.FEMALE,
    );
  });

  it("detects male patronymic endings", () => {
    expect(resolvePupilGrammaticalGender({ middleName: "Петрович" })).toBe(
      PUPIL_GRAMMATICAL_GENDER.MALE,
    );
  });
});
