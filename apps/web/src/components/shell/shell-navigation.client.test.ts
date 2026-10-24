import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const webRoot = join(dir, "..", "..", "..");
const clientChunksDir = join(webRoot, ".next", "static", "chunks");

const listJsFiles = (root: string): string[] => {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) out.push(...listJsFiles(full));
    else if (entry.endsWith(".js")) out.push(full);
  }
  return out;
};

describe("dev role switcher bundle guard", () => {
  it("user menu does not reference dev-role-switcher (dev loader is separate)", () => {
    const source = readFileSync(join(dir, "user-menu.tsx"), "utf8");
    expect(source).not.toContain("dev-role-switcher");
    expect(source).toMatch(/import\(["']@\/components\/shell\/user-menu-dev\.client["']\)/);
  });

  it("dev loader uses dynamic import for dev-role-switcher", () => {
    const source = readFileSync(join(dir, "user-menu-dev.client.ts"), "utf8");
    expect(source).not.toMatch(/from ["']@\/components\/shell\/dev-role-switcher["']/);
    expect(source).toMatch(/import\(["']@\/components\/shell\/dev-role-switcher["']\)/);
  });

  it("dynamic import chain is gated on APP_ENV=dev for prod tree-shaking", () => {
    const source = readFileSync(join(dir, "user-menu.tsx"), "utf8");
    expect(source).toMatch(/process\.env\.APP_ENV\s*!==\s*["']dev["']/);
  });

  it("shell header does not reference dev-role-switcher", () => {
    const source = readFileSync(join(dir, "shell-header.client.tsx"), "utf8");
    expect(source).not.toContain("dev-role-switcher");
  });

  it("prod client chunks omit dev-role-switcher when .next exists (run APP_ENV=prod build first)", () => {
    const chunkFiles = listJsFiles(clientChunksDir);
    if (chunkFiles.length === 0) return;
    for (const filePath of chunkFiles) {
      const source = readFileSync(filePath, "utf8");
      expect(source).not.toContain("dev-role-switcher");
    }
  });
});
