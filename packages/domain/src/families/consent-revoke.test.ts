import { describe, expect, it } from "vitest";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { lastActiveConsentRevokeBlocked } from "./consent-revoke";

describe("lastActiveConsentRevokeBlocked", () => {
  it("allows revoke when other active consents remain", () => {
    expect(lastActiveConsentRevokeBlocked(false, 1)).toBeNull();
  });

  it("blocks last revoke without confirmDeletion", () => {
    expect(lastActiveConsentRevokeBlocked(false, 0)).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.CONSENT_LAST_REQUIRES_DELETION,
      message: "parent.consent.confirm_deletion",
    });
  });

  it("allows last revoke with confirmDeletion", () => {
    expect(lastActiveConsentRevokeBlocked(true, 0)).toBeNull();
  });
});
