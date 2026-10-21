import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));

describe("dev role switcher bundle guard", () => {
  it("does not statically import dev-role-switcher", () => {
    const source = readFileSync(join(dir, "shell-header.client.tsx"), "utf8");
    expect(source).not.toMatch(/from ["']@\/components\/shell\/dev-role-switcher["']/);
    expect(source).toMatch(/import\(["']@\/components\/shell\/dev-role-switcher["']\)/);
  });
});
