#!/usr/bin/env node
/**
 * Fails if any package.json in the monorepo declares a non-exact dependency version.
 * Rule: .cursor/rules/dependency-pinning.mdc
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIPPED_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build"]);
// Pulse snapshot is a reference copy, not a workspace of this monorepo.
const SKIPPED_PATHS = new Set([path.join("docs", "examples")]);
const CHECKED_FIELDS = ["dependencies", "devDependencies", "optionalDependencies", "overrides"];
const EXACT_SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const NPM_ALIAS = /^npm:(?:@[^/@]+\/)?[^/@]+@(.+)$/;

function findPackageJsonPaths(dir) {
  const paths = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const entryPath = path.join(dir, entry.name);
      const isSkipped = SKIPPED_DIRS.has(entry.name) || SKIPPED_PATHS.has(path.relative(rootDir, entryPath));
      if (!isSkipped) paths.push(...findPackageJsonPaths(entryPath));
    } else if (entry.name === "package.json") {
      paths.push(path.join(dir, entry.name));
    }
  }
  return paths;
}

function isExactVersion(version) {
  const aliasMatch = version.match(NPM_ALIAS);
  return EXACT_SEMVER.test(aliasMatch ? aliasMatch[1] : version);
}

function collectViolations(manifest, workspaceNames, fieldPath = []) {
  const violations = [];
  for (const [name, value] of Object.entries(manifest)) {
    const currentPath = [...fieldPath, name];
    if (value !== null && typeof value === "object") {
      // nested overrides: { "pkg": { ".": "1.2.3", "dep": "4.5.6" } }
      violations.push(...collectViolations(value, workspaceNames, currentPath));
    } else if (typeof value === "string") {
      const isWorkspaceRef = workspaceNames.has(name) && value === "*";
      if (!isWorkspaceRef && !isExactVersion(value)) violations.push(`${currentPath.join(" > ")}: "${value}"`);
    }
  }
  return violations;
}

const manifestPaths = findPackageJsonPaths(rootDir);
const manifests = manifestPaths.map((manifestPath) => ({
  manifestPath,
  manifest: JSON.parse(fs.readFileSync(manifestPath, "utf8")),
}));
const workspaceNames = new Set(manifests.map(({ manifest }) => manifest.name).filter(Boolean));

let violationCount = 0;
for (const { manifestPath, manifest } of manifests) {
  for (const field of CHECKED_FIELDS) {
    if (!manifest[field]) continue;
    for (const violation of collectViolations(manifest[field], workspaceNames, [field])) {
      console.error(`${path.relative(rootDir, manifestPath)}  ${violation}`);
      violationCount += 1;
    }
  }
}

if (violationCount > 0) {
  console.error(`\ndeps:check — ${violationCount} non-exact version(s). Pin exact versions (dependency-pinning.mdc).`);
  process.exit(1);
}
console.log(`deps:check — ${manifests.length} package.json file(s), all versions exact.`);
