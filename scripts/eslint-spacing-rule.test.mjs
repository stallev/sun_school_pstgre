// no-raw-spacing rule (P29-T3, ADR-022 §4.2): built-in `no-restricted-syntax` block in eslint.config.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const eslint = new ESLint({ cwd: root, overrideConfigFile: path.join(root, "eslint.config.mjs") });

const PRODUCT_FILE = "apps/web/src/components/teacher/__spacing_probe__.tsx";

const lintSpacing = async (code, relativePath = PRODUCT_FILE) => {
  const [result] = await eslint.lintText(code, { filePath: path.join(root, relativePath) });
  return result.messages.filter((m) => m.ruleId === "no-restricted-syntax" && /spacing/i.test(m.message));
};

const jsx = (className) => `export const Probe = () => <div className=${className} />;\n`;

describe("no-raw-spacing (P29-T3)", { timeout: 60_000 }, () => {
  it("rejects a raw gap number", async () => {
    expect(await lintSpacing(jsx('"flex gap-1.5"'))).toHaveLength(1);
  });

  it("accepts spacing tokens, 0, px and auto", async () => {
    const code = jsx('"flex gap-chip gap-x-stack p-card py-section px-page mb-label pt-0 px-px mx-auto"');
    expect(await lintSpacing(code)).toHaveLength(0);
  });

  it("catches utilities with variants, inside cn() and template strings", async () => {
    expect(await lintSpacing(jsx('"md:p-4"'))).toHaveLength(1);
    expect(await lintSpacing('import { cn } from "@/lib/utils";\nexport const a = cn("flex", "space-y-3");\n', "apps/web/src/components/teacher/probe.ts")).toHaveLength(1);
    expect(await lintSpacing("export const b = `grid gap-2 ${1}`;\n", "apps/web/src/components/teacher/probe.ts")).toHaveLength(1);
  });

  it("does not check components/ui, design-lab, tests or dynamic class names", async () => {
    const bad = jsx('"gap-1.5"');
    expect(await lintSpacing(bad, "apps/web/src/components/ui/__spacing_probe__.tsx")).toHaveLength(0);
    expect(await lintSpacing(bad, "apps/web/src/components/design-lab/__spacing_probe__.tsx")).toHaveLength(0);
    expect(await lintSpacing(bad, "apps/web/src/components/teacher/__spacing_probe__.test.tsx")).toHaveLength(0);
    expect(await lintSpacing('export const c = (n: number) => `gap-${n}`;\n', "apps/web/src/components/teacher/probe.ts")).toHaveLength(0);
  });

  it("skips files listed in eslint-spacing-baseline.json", async () => {
    const baseline = JSON.parse(fs.readFileSync(path.join(root, "apps/web/eslint-spacing-baseline.json"), "utf8"));
    expect(baseline.length).toBeGreaterThan(0);
    expect(await lintSpacing(jsx('"gap-1.5"'), baseline[0])).toHaveLength(0);
  });
});
