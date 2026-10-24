/**
 * Prototype class parity checker — docs/implementation/mvp/specs/prototype_class_parity_spec.md §6.
 * Read-only: parity JSON block, prototype HTML, component paths from the spec.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const SPEC_PATH = path.join(
  REPO_ROOT,
  "docs/implementation/mvp/specs/prototype_class_parity_spec.md",
);
const PROTOTYPE_PATH = path.join(REPO_ROOT, "docs/prototypes/sunday_school_prototype.html");

/** N-2 token aliases → canonical prototype-side name */
const TOKEN_ALIASES = new Map([
  ["bg-primary", "bg-cobalt-ink"],
  ["text-accent-foreground", "text-cobalt-ink"],
  ["bg-accent", "bg-cobalt-soft"],
  ["border-input", "border-muted"],
  ["text-muted-foreground", "text-muted"],
  ["bg-background", "bg-paper"],
  ["text-foreground", "text-ink"],
  ["bg-card", "bg-surface"],
  ["bg-popover", "bg-surface"],
  ["border-border", "border-line"],
  ["text-destructive", "text-danger"],
  ["bg-destructive", "bg-danger"],
]);

const FORBIDDEN_ARBITRARY = [/^text-\[0\.9375rem\]$/, /^h-\[2\.5rem\]$/, /^text-\[0\.875rem\]$/, /^text-\[0\.8125rem\]$/, /^text-\[0\.75rem\]$/, /^text-xs$/];

export function loadParityRows(specPath = SPEC_PATH) {
  const text = fs.readFileSync(specPath, "utf8");
  const fenceMatch = /(?:^|\n)```json parity\s*\n/.exec(text);
  if (!fenceMatch) throw new Error("parity-spec: missing ```json parity block");
  const contentStart = fenceMatch.index + fenceMatch[0].length;
  const end = text.indexOf("\n```", contentStart);
  if (end < 0) throw new Error("parity-spec: unclosed ```json parity block");
  return JSON.parse(text.slice(contentStart, end).trim());
}

export function splitClassString(input) {
  return String(input ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function canonicalizeToken(cls) {
  return TOKEN_ALIASES.get(cls) ?? cls;
}

export function normalizeClassSet(classString) {
  const set = new Set();
  for (const raw of splitClassString(classString)) {
    const token = canonicalizeToken(raw);
    if (FORBIDDEN_ARBITRARY.some((re) => re.test(token))) {
      set.add(`__forbidden__:${token}`);
      continue;
    }
    set.add(token);
  }
  return set;
}

function isAllowedDiff(token, allowed) {
  const canonical = canonicalizeToken(token);
  for (const entry of allowed) {
    const rule = canonicalizeToken(entry);
    if (rule.endsWith(":*")) {
      const prefix = rule.slice(0, -1);
      if (canonical.startsWith(prefix)) return true;
      continue;
    }
    if (rule === canonical) return true;
  }
  return false;
}

export function diffSets(a, b, allowed = []) {
  const onlyA = [...a].filter((c) => !b.has(c) && !isAllowedDiff(c, allowed));
  const onlyB = [...b].filter((c) => !a.has(c) && !isAllowedDiff(c, allowed));
  return { onlyA, onlyB, drift: onlyA.length > 0 || onlyB.length > 0 };
}

function parseQuotedStrings(expr) {
  const parts = [];
  const re = /(['"])(?:\\.|(?!\1)[^\\])*\1/g;
  let m;
  while ((m = re.exec(expr)) !== null) {
    parts.push(m[0].slice(1, -1));
  }
  return parts;
}

export function resolveProtoConst(html, symbol, seen = new Set()) {
  if (seen.has(symbol)) return "";
  seen.add(symbol);
  const decl = new RegExp(`const\\s+${symbol}\\s*=\\s*([^;\\n]+)`, "m").exec(html);
  if (!decl) return "";
  const expr = decl[1].trim();
  if (/^['"]/.test(expr)) {
    return parseQuotedStrings(expr).join("");
  }
  const segments = expr.split(/\s*\+\s*/);
  return segments
    .map((seg) => {
      const trimmed = seg.trim();
      if (/^['"]/.test(trimmed)) return parseQuotedStrings(trimmed).join("");
      const ident = trimmed.match(/^([A-Z_][A-Z0-9_]*)$/)?.[1];
      return ident ? resolveProtoConst(html, ident, seen) : "";
    })
    .join("");
}

export function resolveProtoFn(html, symbol) {
  const decl = new RegExp(`const\\s+${symbol}\\s*=\\s*[^\\n]+`, "m").exec(html);
  if (!decl) return "";
  const classMatch = /class="([^"]+)"/.exec(decl[0]);
  return classMatch?.[1] ?? "";
}

function readStringLiteralAt(source, startIndex) {
  const quote = source[startIndex];
  if (quote !== '"' && quote !== "'" && quote !== "`") return { value: "", end: startIndex };
  let i = startIndex + 1;
  let value = "";
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      value += ch + (source[i + 1] ?? "");
      i += 2;
      continue;
    }
    if (ch === quote) return { value, end: i + 1 };
    value += ch;
    i += 1;
  }
  return { value, end: i };
}

export function extractCvaClasses(source, { variant, size } = {}) {
  const anchor = source.indexOf("cva(");
  if (anchor < 0) return "";
  const { value: base, end } = readStringLiteralAt(source, source.indexOf('"', anchor));
  let cursor = end;
  const variantsMatch = /variants:\s*\{([\s\S]*?)\}\s*,\s*defaultVariants/.exec(source.slice(cursor));
  if (!variantsMatch) return base;
  const variantsBody = variantsMatch[1];
  const pickVariant = (key, name) => {
    if (!name) return "";
    const block = new RegExp(`${key}:\\s*\\{([\\s\\S]*?)\\}`, "m").exec(variantsBody)?.[1] ?? "";
    const entry = new RegExp(`${name}:\\s*"([^"]+)"`).exec(block);
    return entry?.[1] ?? "";
  };
  const variantClasses = pickVariant("variant", variant);
  const sizeClasses = pickVariant("size", size);
  return [base, variantClasses, sizeClasses].filter(Boolean).join(" ");
}

function extractExportConst(source, name) {
  const m = new RegExp(`export\\s+const\\s+${name}\\s*=\\s*"([^"]+)"`).exec(source);
  return m?.[1] ?? "";
}

function extractChipClassBlock(source) {
  const start = source.indexOf("const chipClass");
  if (start < 0) return "";
  const slice = source.slice(start);
  const cnIdx = slice.indexOf("cn(");
  if (cnIdx < 0) return "";
  return slice.slice(cnIdx);
}

function extractCnByPick(source, pick) {
  if (pick === "SHELL_NAV_DROPDOWN_PANEL") {
    return extractExportConst(source, pick);
  }
  const chipBlock = extractChipClassBlock(source);
  if (chipBlock) {
    if (pick === "checked") {
      const m = /\bchecked\s*\?\s*"([^"]+)"/.exec(chipBlock);
      return m?.[1] ?? "";
    }
    if (pick === "unchecked") {
      const m = /:\s*invalid\s*\?\s*"[^"]+"\s*:\s*"([^"]+)"/.exec(chipBlock);
      return m?.[1] ?? "";
    }
    if (pick === "base") {
      const m = /cn\(\s*\n?\s*"([^"]+)"/.exec(chipBlock);
      return m?.[1] ?? "";
    }
  }
  if (pick === "checked") {
    const m = /\?\s*"([^"]+)"/.exec(source);
    return m?.[1] ?? "";
  }
  if (pick === "unchecked") {
    const ternary =
      /:\s*invalid\s*\?\s*"[^"]+"\s*:\s*"([^"]+)"/.exec(source) ??
      /\?\s*"[^"]+"\s*:\s*"([^"]+)"/.exec(source);
    return ternary?.[1] ?? "";
  }
  if (pick === "base") {
    const m = /className=\{cn\(\s*"([^"]+)"/.exec(source);
    return m?.[1] ?? "";
  }
  const fn = new RegExp(`function\\s+${pick}\\s*\\([^)]*\\)[^{]*\\{[\\s\\S]*?className=\\{cn\\(\\s*"([^"]+)"`).exec(
    source,
  );
  if (fn) return fn[1];
  if (pick === "NavBadge") {
    const imported = fs.readFileSync(
      path.join(REPO_ROOT, "apps/web/src/components/ui/count-badge.tsx"),
      "utf8",
    );
    const m = /cn\(\s*"([^"]+)"/.exec(imported);
    return m?.[1] ?? "";
  }
  if (pick === "sidebar" || pick === "sidebar-active") {
    const active = /isActive\s*\?\s*"([^"]+)"/.exec(source)?.[1] ?? "";
    const base =
      /className=\{cn\(\s*"([^"]+)"/.exec(source)?.[1] ??
      "";
    if (pick === "sidebar-active") return active;
    return base;
  }
  const labeled = new RegExp(`${pick}[^"]*"([^"]+)"`).exec(source);
  return labeled?.[1] ?? "";
}

function stripCssInlineComments(value) {
  return String(value ?? "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
}

export function extractCssRule(css, pick) {
  if (pick === "html") {
    const block = /@layer base\s*\{[\s\S]*?html\s*\{([^}]+)\}/.exec(css);
    const font = /font-size:\s*([^;]+)/.exec(block?.[1] ?? "");
    return font ? `font-size: ${stripCssInlineComments(font[1])}` : "";
  }
  if (pick === "main:focus:not(:focus-visible)") {
    const block = /main:focus:not\(:focus-visible\)\s*\{([^}]+)\}/.exec(css);
    const outline = /outline:\s*([^;]+)/.exec(block?.[1] ?? "");
    return outline ? `outline: ${stripCssInlineComments(outline[1])}` : "";
  }
  if (pick === "--control-h") {
    const h = /--control-h:\s*([^;]+);[\s\S]*--control-h-compact:\s*([^;]+);[\s\S]*--control-h-touch:\s*([^;]+)/.exec(
      css,
    );
    if (!h) return "";
    return `--control-h: ${h[1].trim()}; --control-h-compact: ${h[2].trim()}; --control-h-touch: ${h[3].trim()}`;
  }
  return "";
}

export function readComponentClasses(row, rootDir = REPO_ROOT) {
  const filePath = path.join(rootDir, row.component.path);
  if (!fs.existsSync(filePath)) return null;
  const source = fs.readFileSync(filePath, "utf8");
  const { kind, variant, size, pick } = row.component;
  if (kind === "cva") return extractCvaClasses(source, { variant, size });
  if (kind === "cn") return extractCnByPick(source, pick);
  if (kind === "css") return extractCssRule(source, pick);
  return "";
}

function normalizeCssValue(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function compareRow(row, { prototypeHtml, rootDir = REPO_ROOT } = {}) {
  if (row.check !== "auto") {
    return { id: row.id, status: "skip", reason: "manual" };
  }

  const componentRaw = readComponentClasses(row, rootDir);
  if (componentRaw === null) {
    return { id: row.id, status: "error", reason: "component file not found" };
  }

  const allowed = row.allowed_diff ?? [];

  if (row.component.kind === "css") {
    const drift = normalizeCssValue(componentRaw) !== normalizeCssValue(row.expect);
    return { id: row.id, status: drift ? "drift" : "ok" };
  }

  const protoKind = row.proto.kind;
  let protoRaw = "";
  if (protoKind === "const") protoRaw = resolveProtoConst(prototypeHtml, row.proto.symbol);
  else if (protoKind === "fn") protoRaw = resolveProtoFn(prototypeHtml, row.proto.symbol);

  const expectSet = normalizeClassSet(row.expect);
  const protoSet = normalizeClassSet(protoRaw);
  const componentSet = normalizeClassSet(componentRaw);

  const protoVsExpect = diffSets(protoSet, expectSet, allowed);
  const componentVsExpect = diffSets(componentSet, expectSet, allowed);

  const forbidden =
    [...componentSet, ...protoSet].some((t) => t.startsWith("__forbidden__:"));

  const drift = forbidden || protoVsExpect.drift || componentVsExpect.drift;

  return {
    id: row.id,
    status: drift ? "drift" : "ok",
    componentMissing: componentVsExpect.onlyB,
    componentExtra: componentVsExpect.onlyA,
  };
}

export function runParity({ componentId, all = false, json = false, rootDir = REPO_ROOT } = {}) {
  const rows = loadParityRows();
  const prototypeHtml = fs.readFileSync(PROTOTYPE_PATH, "utf8");
  let selected = rows;
  if (componentId) {
    selected = rows.filter((r) => r.id === componentId);
    if (selected.length === 0) {
      throw new Error(`Unknown --component id: ${componentId}`);
    }
  } else if (!all) {
    throw new Error("Pass --component <id> or --all");
  }

  const results = selected.map((row) => compareRow(row, { prototypeHtml, rootDir }));
  const drifts = results.filter((r) => r.status === "drift" || r.status === "error").length;
  const payload = { results, summary: { total: results.length, drifts } };

  if (json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    for (const r of results) {
      if (r.status === "skip") console.log(`${r.id}: skip (manual)`);
      else if (r.status === "error") console.log(`${r.id}: error (${r.reason})`);
      else console.log(`${r.id}: ${r.status}`);
    }
    console.log(`Parity: ${results.length} строк, расхождений ${drifts}`);
  }

  return { ...payload, exitCode: drifts > 0 ? 1 : 0 };
}

function parseArgs(argv) {
  const args = { all: false, json: false, componentId: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--all") args.all = true;
    else if (a === "--json") args.json = true;
    else if (a === "--component") {
      args.componentId = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const args = parseArgs(process.argv);
    const { exitCode } = runParity(args);
    process.exit(exitCode);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
