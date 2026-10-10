#!/usr/bin/env node
/**
 * Relative links in the template's markdown and rules must resolve.
 *
 * Allowed to be missing — targets a project creates later:
 *   - documents written by doc waves / bootstrap (FUTURE_PREFIXES, FUTURE_FILES);
 *   - rules that live in .cursor/rules/tiers/ and get activated into the root at P4 / P6.
 * Copy-templates are resolved from where bootstrap copies them (DESTINATION_BY_SOURCE).
 * docs/examples/ (read-only reference snapshots) and the generated .claude/ mirror are not checked.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXCLUDED_PREFIXES = ["docs/examples/", ".claude/"];
const FUTURE_PREFIXES = [
  "apps/",
  "packages/",
  "docs/prds/",
  "docs/design/",
  "docs/implementation/",
  "docs/incidents/",
  "docs/default_docs/",
  "docs/architecture_learning_pack/",
  "docs/prototypes/",
];
const FUTURE_FILES = new Set([
  "docs/meta/project_quality_profile.md",
  ".cursor/rules/project-context.mdc",
  ".env.local",
]);
// Copy-templates: links are written relative to the destination, not to the template's own folder.
const DESTINATION_BY_SOURCE = [
  ["scaffold/", ""],
  ["specs/design_system_lab_spec.template.md", "docs/implementation/mvp/specs/design_system_lab_spec.md"],
  ["docs/meta/phase_tasks.template.md", "docs/implementation/mvp/tasks/P01_tasks.md"],
];

const toPosix = (filePath) => filePath.split(path.sep).join("/");

function listTrackedDocs() {
  const output = execFileSync("git", ["ls-files", "-z"], { cwd: rootDir, encoding: "utf8" });
  return output
    .split("\0")
    .filter((file) => /\.(md|mdc)$/.test(file))
    .filter((file) => !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)))
    .filter((file) => fs.existsSync(path.join(rootDir, file)));
}

function destinationOf(file) {
  for (const [source, destination] of DESTINATION_BY_SOURCE) {
    if (source.endsWith("/") && file.startsWith(source)) {
      return destination + file.slice(source.length);
    }
    if (file === source) {
      return destination;
    }
  }
  return file;
}

function listTierRuleNames() {
  const tiersDir = path.join(rootDir, ".cursor", "rules", "tiers");
  return new Set(
    fs.readdirSync(tiersDir).flatMap((tier) => {
      const tierDir = path.join(tiersDir, tier);
      return fs.statSync(tierDir).isDirectory() ? fs.readdirSync(tierDir) : [];
    }),
  );
}
const tierRuleNames = listTierRuleNames();

// Illustrative links in templates (`../path/doc.md`, `P{N}_tasks.md`, `…`) have no target to check.
function isIllustrativeLink(link) {
  return /[…]|\/path\/|\{[A-Za-z]/.test(link.replace(/\{\{[A-Z_]+\}\}/g, ""));
}

// `docs/default_docs/{{INTERIM_DESIGN_SYSTEM_DOC}}` — the file name is filled at bootstrap; its folder must still resolve.
function placeholderFreeLink(link) {
  const placeholderIndex = link.indexOf("{{");
  if (placeholderIndex === -1) {
    return link;
  }
  const folder = link.slice(0, placeholderIndex).replace(/[^/]*$/, "");
  return folder || null;
}

function isAllowedMissing(target) {
  const asFolder = `${target}/`;
  if (FUTURE_FILES.has(target) || FUTURE_PREFIXES.some((prefix) => target.startsWith(prefix) || asFolder === prefix)) {
    return true;
  }
  const activatedRule = target.match(/^\.cursor\/rules\/([^/]+\.mdc)$/);
  return Boolean(activatedRule && tierRuleNames.has(activatedRule[1]));
}

// Candidate repo-relative targets for one link. Rules and agents under .cursor/ are read from the repo root.
function candidateTargets(file, link) {
  const destinationDir = path.posix.dirname(destinationOf(file));
  const candidates = [path.posix.normalize(path.posix.join(destinationDir, link))];
  if (file.startsWith(".cursor/")) {
    candidates.push(path.posix.normalize(link), path.posix.normalize(path.posix.join(".cursor/rules", link)));
  }
  return candidates.map((candidate) => candidate.replace(/\/$/, ""));
}

const problems = [];
for (const file of listTrackedDocs()) {
  // Blank out fenced code blocks (templates of other documents) but keep line numbers.
  const text = fs
    .readFileSync(path.join(rootDir, file), "utf8")
    .replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (block) => block.replace(/[^\n]/g, ""));
  for (const match of text.matchAll(/\]\(([^)\s#]+)(#[^)\s]*)?\)/g)) {
    const rawLink = decodeURI(match[1]);
    if (/^[a-z]+:/i.test(rawLink) || isIllustrativeLink(rawLink)) {
      continue;
    }
    const link = placeholderFreeLink(rawLink);
    if (link === null) {
      continue;
    }
    const candidates = candidateTargets(file, link);
    const escapesRoot = candidates.every((candidate) => candidate.startsWith(".."));
    const resolves = candidates.some((candidate) => fs.existsSync(path.join(rootDir, candidate)));
    if (!escapesRoot && (resolves || candidates.some(isAllowedMissing))) {
      continue;
    }
    const line = text.slice(0, match.index).split("\n").length;
    problems.push(`${file}:${line}: ${link}`);
  }
}

if (problems.length) {
  console.error(`docs:links — ${problems.length} broken link(s):`);
  for (const problem of problems) console.error(`  ${toPosix(problem)}`);
  process.exit(1);
}
console.log("docs:links — all relative links resolve (or point to documents created later).");
