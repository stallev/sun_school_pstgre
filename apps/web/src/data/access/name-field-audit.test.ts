import { describe, expect, it } from "vitest";
import { listChangedNameFields, nameAuditPayload } from "./name-field-audit";

describe("name-field-audit", () => {
  it("lists only changed name parts for audit payloads", () => {
    const changed = listChangedNameFields(
      { lastName: "Old", firstName: "Same", middleName: null },
      { lastName: "New", firstName: "Same", middleName: "М." },
    );
    expect(changed).toEqual(["lastName", "middleName"]);
    expect(nameAuditPayload(changed)).toEqual({ changedFields: ["lastName", "middleName"] });
  });
});
