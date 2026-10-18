import { describe, expect, it } from "vitest";
import { getDictionary, getMessage } from "./get-dictionary";

const keys = (dictionary: unknown, prefix = ""): string[] =>
  Object.entries(dictionary as Record<string, unknown>).flatMap(([key, value]) =>
    typeof value === "object" && value !== null ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );

describe("getMessage", () => {
  it("reads nested keys and fails loudly on a missing one", async () => {
    const common = await getDictionary("en", "common");
    expect(getMessage(common, "errors.forbidden_title")).toBe("Access denied");
    expect(() => getMessage(common, "errors.nope")).toThrow(/Missing message/);
    expect(() => getMessage(common, "errors")).toThrow(/Missing message/);
  });

  it("keeps ru and en keys in step for every namespace", async () => {
    for (const namespace of ["common", "auth", "teacher", "admin", "analytics"] as const) {
      expect(keys(await getDictionary("ru", namespace)).sort()).toEqual(
        keys(await getDictionary("en", namespace)).sort(),
      );
    }
  });

  it("includes shell navigation keys in common", async () => {
    const ru = await getDictionary("ru", "common");
    expect(getMessage(ru, "shell.nav.today")).toBeTruthy();
    expect(getMessage(ru, "shell.nav.groups.people")).toBeTruthy();
  });
});
