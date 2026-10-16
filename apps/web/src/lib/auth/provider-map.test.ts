import { describe, expect, it } from "vitest";
import { LOGIN_PROVIDER } from "@sunschool/domain";
import { toLoginProvider } from "./provider-map";

describe("toLoginProvider", () => {
  it("maps the two supported Auth.js ids", () => {
    expect(toLoginProvider("credentials")).toBe(LOGIN_PROVIDER.CREDENTIALS);
    expect(toLoginProvider("telegram")).toBe(LOGIN_PROVIDER.TELEGRAM);
  });

  it("refuses anything else, including Google", () => {
    expect(toLoginProvider("google")).toBeNull();
    expect(toLoginProvider(undefined)).toBeNull();
    expect(toLoginProvider("")).toBeNull();
  });
});
