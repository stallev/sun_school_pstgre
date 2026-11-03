import { describe, expect, it } from "vitest";
import { updatePupilBirthDateInputSchema } from "./pupil";

describe("updatePupilBirthDateInputSchema", () => {
  it("accepts pupilId and birthDate only", () => {
    const parsed = updatePupilBirthDateInputSchema.safeParse({
      pupilId: "11111111-1111-4111-8111-111111111111",
      birthDate: "2015-03-20",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects extra fields", () => {
    const parsed = updatePupilBirthDateInputSchema.safeParse({
      pupilId: "11111111-1111-4111-8111-111111111111",
      birthDate: "2015-03-20",
      firstName: "Extra",
    });
    expect(parsed.success).toBe(false);
  });
});
