import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  canonicalizeToken,
  compareRow,
  diffSets,
  extractCvaClasses,
  extractCssRule,
  loadParityRows,
  normalizeClassSet,
  resolveProtoConst,
  runParity,
} from "./check-prototype-parity.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const prototypeHtml = fs.readFileSync(
  path.join(REPO_ROOT, "docs/prototypes/sunday_school_prototype.html"),
  "utf8",
);

describe("parity normalization", () => {
  it("N-2 maps semantic aliases to prototype tokens", () => {
    expect(canonicalizeToken("bg-primary")).toBe("bg-cobalt-ink");
    expect(canonicalizeToken("border-input")).toBe("border-muted");
  });

  it("N-3 flags forbidden arbitrary text size", () => {
    const set = normalizeClassSet("text-[0.9375rem] text-base");
    expect(set.has("__forbidden__:text-[0.9375rem]")).toBe(true);
    expect(set.has("text-base")).toBe(true);
    const { drift } = diffSets(
      normalizeClassSet("text-[0.9375rem]"),
      normalizeClassSet("text-base"),
      [],
    );
    expect(drift).toBe(true);
  });

  it("N-8 merges cva base, variant and size", () => {
    const buttonSource = fs.readFileSync(
      path.join(REPO_ROOT, "apps/web/src/components/ui/button.tsx"),
      "utf8",
    );
    const merged = extractCvaClasses(buttonSource, { variant: "default", size: "default" });
    expect(merged).toContain("bg-cobalt-ink");
    expect(merged).toContain("h-10");
  });
});

describe("parity real rows", () => {
  const rows = loadParityRows();

  it("BTN (P-01) resolves prototype const and reports component drift before CU2", () => {
    const row = rows.find((r) => r.id === "P-01");
    const proto = resolveProtoConst(prototypeHtml, "BTN");
    expect(proto).toContain("text-base");
    const result = compareRow(row, { prototypeHtml, rootDir: REPO_ROOT });
    expect(result.status).toBe("drift");
  });

  it("SEG_ON (P-14) resolves prototype const and matches segmented-control (P14-CU3)", () => {
    const row = rows.find((r) => r.id === "P-14");
    const proto = resolveProtoConst(prototypeHtml, "SEG_ON");
    expect(proto).toContain("font-bold");
    const result = compareRow(row, { prototypeHtml, rootDir: REPO_ROOT });
    expect(result.status).toBe("ok");
  });
});

describe("extractCssRule", () => {
  it("P-38 strips inline comments from html font-size", () => {
    const css = `@layer base {
  html {
    font-size: 112.5%; /* 18px base (UX-03 D-5 v2.0) */
  }
}`;
    expect(extractCssRule(css, "html")).toBe("font-size: 112.5%");
    const row = loadParityRows().find((r) => r.id === "P-38");
    const result = compareRow(row, { prototypeHtml, rootDir: REPO_ROOT });
    expect(result.status).toBe("ok");
  });
});

describe("parity CLI", () => {
  it("unknown component id exits with error", () => {
    expect(() => runParity({ componentId: "P-999" })).toThrow(/Unknown/);
  });
});
