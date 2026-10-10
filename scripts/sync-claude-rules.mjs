#!/usr/bin/env node
/**
 * Cursor `.cursor/rules/*.mdc` (SoT) → Claude Code `.claude/rules/*.md`
 * Cursor `.cursor/agents/*.md` (SoT) → Claude Code `.claude/agents/*.md`
 * Playbook: docs/claude-code-cursor-rules-sync.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cursorRulesDir = path.join(rootDir, ".cursor", "rules");
const claudeRulesDir = path.join(rootDir, ".claude", "rules");
const cursorAgentsDir = path.join(rootDir, ".cursor", "agents");
const claudeAgentsDir = path.join(rootDir, ".claude", "agents");
const isCheck = process.argv.includes("--check");

// Cursor pins models from its own pool; Claude Code takes an alias. Prefix of the Cursor model id → alias.
const CLAUDE_MODEL_BY_CURSOR_PREFIX = [
  ["grok", "opus"],
  ["composer", "sonnet"],
];
const READONLY_AGENT_TOOLS = "Read, Grep, Glob, Bash";

function detectNewline(text) {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseLinearFrontmatter(block) {
  const fields = {};
  const lines = block.split(/\r?\n/);
  let lineIndex = 0;
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    if (!line.trim() || line.trim().startsWith("#")) {
      lineIndex += 1;
      continue;
    }
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) {
      lineIndex += 1;
      continue;
    }
    const key = match[1];
    const rawValue = match[2].trim();
    if (rawValue === "" && key === "globs") {
      const items = [];
      lineIndex += 1;
      while (lineIndex < lines.length) {
        const listMatch = lines[lineIndex].match(/^\s+-\s+(.+)$/);
        if (!listMatch) {
          break;
        }
        items.push(stripWrappingQuotes(listMatch[1].trim()));
        lineIndex += 1;
      }
      fields[key] = items.join(",");
      continue;
    }
    fields[key] = stripWrappingQuotes(rawValue);
    lineIndex += 1;
  }
  return fields;
}

function splitMdc(source, filePath) {
  source = source.replace(/^\uFEFF/, "");
  const newline = detectNewline(source);
  if (!source.startsWith("---")) {
    throw new Error(`${filePath}: frontmatter must start with ---`);
  }
  const rest = source.slice(source.indexOf("\n") + 1);
  const closerIndex = rest.search(/\r?\n---\r?\n/);
  if (closerIndex === -1) {
    throw new Error(`${filePath}: missing closing frontmatter ---`);
  }
  const fmBlock = rest.slice(0, closerIndex);
  const afterCloser = rest.slice(closerIndex).replace(/^\r?\n---\r?\n/, "");
  return { fields: parseLinearFrontmatter(fmBlock), body: afterCloser, newline };
}

function buildClaudeMarkdown(fields, body, newline) {
  const lines = ["---"];
  if (fields.description) {
    lines.push(`description: ${fields.description}`);
  }
  const isAlways = fields.alwaysApply === "true";
  const globList = (fields.globs ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!isAlways && globList.length > 0) {
    lines.push("paths:");
    for (const glob of globList) {
      lines.push(`  - "${glob}"`);
    }
  }
  lines.push("---");
  const bodyWithNl = body.startsWith("\n") || body.startsWith("\r") ? body : `${newline}${body}`;
  return `${lines.join(newline)}${newline}${bodyWithNl.replace(/^\r?\n/, "")}`;
}

function listCursorMdcFiles() {
  return fs
    .readdirSync(cursorRulesDir)
    .filter((name) => name.endsWith(".mdc") && !name.endsWith(".template.mdc"))
    .sort();
}

function expectedClaudeFiles() {
  const expected = new Map();
  for (const name of listCursorMdcFiles()) {
    const sourcePath = path.join(cursorRulesDir, name);
    const source = fs.readFileSync(sourcePath, "utf8");
    const { fields, body, newline } = splitMdc(source, sourcePath);
    const stem = name.slice(0, -".mdc".length);
    expected.set(`${stem}.md`, buildClaudeMarkdown(fields, body, newline));
  }
  return expected;
}

function mapCursorModelToClaude(cursorModel = "") {
  const match = CLAUDE_MODEL_BY_CURSOR_PREFIX.find(([prefix]) => cursorModel.startsWith(prefix));
  return match ? match[1] : "inherit";
}

function buildClaudeAgent(fields, body, newline, sourceName) {
  const lines = ["---", `name: ${fields.name}`, `description: ${fields.description}`];
  if (fields.readonly === "true") {
    lines.push(`tools: ${READONLY_AGENT_TOOLS}`);
  }
  lines.push(`model: ${mapCursorModelToClaude(fields.model)}`, "---");
  const notice = `<!-- Generated from .cursor/agents/${sourceName} by \`npm run rules:sync\` — do not edit. -->`;
  return `${lines.join(newline)}${newline}${notice}${newline}${newline}${body.replace(/^\r?\n/, "")}`;
}

function expectedClaudeAgents() {
  const expected = new Map();
  if (!fs.existsSync(cursorAgentsDir)) {
    return expected;
  }
  for (const name of fs.readdirSync(cursorAgentsDir).filter((file) => file.endsWith(".md")).sort()) {
    const sourcePath = path.join(cursorAgentsDir, name);
    const { fields, body, newline } = splitMdc(fs.readFileSync(sourcePath, "utf8"), sourcePath);
    expected.set(name, buildClaudeAgent(fields, body, newline, name));
  }
  return expected;
}

function listMdFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir).filter((name) => name.endsWith(".md"));
}

// tiers/** is the source of truth for every rule; the root holds activated copies only.
function findTierRuleProblems() {
  const tiersDir = path.join(cursorRulesDir, "tiers");
  const tierPathByName = new Map();
  const problems = [];
  for (const tier of fs.readdirSync(tiersDir)) {
    const tierDir = path.join(tiersDir, tier);
    if (!fs.statSync(tierDir).isDirectory()) {
      continue;
    }
    for (const name of fs.readdirSync(tierDir).filter((file) => file.endsWith(".mdc"))) {
      if (tierPathByName.has(name)) {
        problems.push(`${name}: present in two tiers`);
      }
      tierPathByName.set(name, path.join(tierDir, name));
    }
  }
  for (const name of fs.readdirSync(cursorRulesDir).filter((file) => file.endsWith(".mdc"))) {
    const tierPath = tierPathByName.get(name);
    // project-context.mdc is filled in from project-context.template.mdc at P0 and legitimately differs.
    if (!tierPath && tierPathByName.has(name.replace(/\.mdc$/, ".template.mdc"))) {
      continue;
    }
    if (!tierPath) {
      problems.push(`${name}: active rule has no copy in tiers/ (add it to a tier first)`);
      continue;
    }
    const readNormalized = (filePath) => fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
    if (readNormalized(path.join(cursorRulesDir, name)) !== readNormalized(tierPath)) {
      const tierRelative = path.relative(rootDir, tierPath).split(path.sep).join("/");
      problems.push(`${name}: differs from ${tierRelative} (edit the tier copy, then copy it to the root)`);
    }
  }
  return problems;
}

function exitOnTierProblems() {
  const problems = findTierRuleProblems();
  if (problems.length) {
    console.error("tier:", problems.join("\n  "));
    process.exit(1);
  }
}

function mirrorTargets() {
  return [
    { label: ".claude/rules", dir: claudeRulesDir, expected: expectedClaudeFiles() },
    { label: ".claude/agents", dir: claudeAgentsDir, expected: expectedClaudeAgents() },
  ];
}

function findMirrorProblems({ label, dir, expected }) {
  const actualNames = new Set(listMdFiles(dir));
  const problems = [];
  for (const name of actualNames) {
    if (!expected.has(name)) {
      problems.push(`extra: ${label}/${name}`);
    }
  }
  for (const [name, text] of expected) {
    const dest = path.join(dir, name);
    if (!fs.existsSync(dest)) {
      problems.push(`missing: ${label}/${name}`);
      continue;
    }
    // core.autocrlf rewrites line endings on checkout; only content drift matters.
    const current = fs.readFileSync(dest, "utf8").replace(/\r\n/g, "\n");
    if (current !== text.replace(/\r\n/g, "\n")) {
      problems.push(`drift: ${label}/${name}`);
    }
  }
  return problems;
}

function runCheck() {
  exitOnTierProblems();
  const problems = mirrorTargets().flatMap(findMirrorProblems);
  if (problems.length) {
    console.error(problems.join("\n"));
    console.error("Run `npm run rules:sync`.");
    process.exit(1);
  }
}

function writeMirror({ dir, expected }) {
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, text] of expected) {
    fs.writeFileSync(path.join(dir, name), text);
  }
  for (const name of listMdFiles(dir)) {
    if (!expected.has(name)) {
      fs.unlinkSync(path.join(dir, name));
    }
  }
}

function runSync() {
  exitOnTierProblems();
  mirrorTargets().forEach(writeMirror);
}

if (isCheck) {
  runCheck();
} else {
  runSync();
}
