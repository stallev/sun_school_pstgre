import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { nonEmptyTerm } from "@/components/ui/non-empty-term";

const uiDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(uiDir, "../..");

const clientImportPattern =
  /import\s*\{[^}]*\bnonEmptyTerm\b[^}]*\}\s*from\s*["']@\/components\/ui\/term-label["']/;

const isClientModule = (source: string) =>
  source.split("\n").some((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return false;
    }
    return trimmed === '"use client";' || trimmed === "'use client';" || trimmed === '"use client"' || trimmed === "'use client'";
  });

const serverFilesImportingClientHelper = (dir: string): string[] => {
  const offenders: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      offenders.push(...serverFilesImportingClientHelper(fullPath));
      continue;
    }
    if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
    if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx")) continue;
    const source = fs.readFileSync(fullPath, "utf8");
    if (isClientModule(source) || !clientImportPattern.test(source)) continue;
    offenders.push(path.relative(srcDir, fullPath));
  }
  return offenders;
};

describe("nonEmptyTerm", () => {
  it("returns a non-empty term", () => {
    expect(nonEmptyTerm("Посещаемость")).toBe("Посещаемость");
  });

  it("rejects an empty term", () => {
    expect(() => nonEmptyTerm("")).toThrow(/non-empty/i);
  });

  it("is not a client reference, so a Server Component can call it", () => {
    const helperSource = fs.readFileSync(path.join(uiDir, "non-empty-term.ts"), "utf8");
    expect(helperSource).not.toMatch(/use client/);
    expect(serverFilesImportingClientHelper(srcDir)).toEqual([]);
  });
});
