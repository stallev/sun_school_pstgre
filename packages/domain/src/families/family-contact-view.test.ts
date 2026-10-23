import { describe, expect, it } from "vitest";
import { ADULT_RELATION } from "../constants/enums";
import { mapAdultToTeacherFamilyContact } from "./family-contact-view";

describe("mapAdultToTeacherFamilyContact (AZ-63, СМ-8)", () => {
  it("keeps names, relation and phones only", () => {
    const contact = mapAdultToTeacherFamilyContact({
      id: "adult-1",
      lastName: "Иванова",
      firstName: "Мария",
      middleName: null,
      relation: ADULT_RELATION.MOTHER,
      phones: ["+79001234567", 42, ""],
      email: "secret@example.com",
    });

    expect(contact).toEqual({
      adultId: "adult-1",
      lastName: "Иванова",
      firstName: "Мария",
      middleName: null,
      relation: ADULT_RELATION.MOTHER,
      phones: ["+79001234567"],
    });
    expect(contact).not.toHaveProperty("email");
    expect(contact).not.toHaveProperty("address");
    expect(contact).not.toHaveProperty("note");
  });
});
