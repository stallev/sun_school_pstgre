import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as enums from "@sunschool/domain";

const SCHEMA = readFileSync(
  resolve(import.meta.dirname, "../prisma/schema.prisma"),
  "utf8",
);

/** Parses `enum Name { A B C @@map(...) }` blocks of schema.prisma into name → values. */
const parseSchemaEnums = (source: string): Map<string, string[]> => {
  const result = new Map<string, string[]>();
  for (const match of source.matchAll(/^enum (\w+) \{([^}]*)\}/gm)) {
    const [, name, body] = match;
    const values = (body ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.startsWith("@@") && !line.startsWith("//"));
    result.set(name ?? "", values);
  }
  return result;
};

const toConstName = (pascal: string) => pascal.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();

describe("domain enums mirror schema.prisma (database_schema_v1 §4)", () => {
  const schemaEnums = parseSchemaEnums(SCHEMA);

  it("finds the schema enums", () => {
    expect(schemaEnums.size).toBeGreaterThan(10);
  });

  it.each(["UserRole", "AccountStatus", "LoginProvider", "AccessRequestStatus"])(
    "%s has the same values in domain and schema",
    (name) => {
      const constant = (enums as Record<string, unknown>)[toConstName(name)];
      expect(constant, `${toConstName(name)} exported`).toBeDefined();
      expect(Object.values(constant as Record<string, string>).sort()).toEqual(
        [...(schemaEnums.get(name) ?? [])].sort(),
      );
    },
  );

  it("every domain enum constant that has a schema twin is equal to it", () => {
    for (const [name, values] of schemaEnums) {
      const constant = (enums as Record<string, unknown>)[toConstName(name)];
      if (!constant) continue;
      expect(Object.values(constant as Record<string, string>).sort(), name).toEqual(
        [...values].sort(),
      );
    }
  });
});
