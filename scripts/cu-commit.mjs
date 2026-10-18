#!/usr/bin/env node
/**
 * The only stage and commit entry for a CU.
 * stage writes the index from an explicit path list.
 * commit refuses anything outside that list and assembles the commitlint header.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LOG_TAIL_LINES,
  assertCommitIndex,
  assertStagePaths,
  buildCommitMessage,
  logTail,
  parseCuCommitArgs,
  parsePathsFile,
  parsePorcelain,
  partitionChangedPaths,
} from "./phase-driver.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parsed = parseCuCommitArgs(process.argv.slice(2));
if (!parsed.ok) {
  console.error(`cu-commit: ${parsed.reason}`);
  process.exit(1);
}

const logDir = path.join(rootDir, ".local", "phase-runs");
fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, `${parsed.mode}-${stamp()}.log`);
fs.writeFileSync(logPath, "");

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function fail(message, output = "") {
  console.error(`cu-commit: ${message}`);
  if (output) console.error(logTail(output, LOG_TAIL_LINES));
  console.error(`log: ${path.relative(rootDir, logPath).replace(/\\/g, "/")}`);
  process.exit(1);
}

function git(args) {
  return spawnSync("git", args, { cwd: rootDir, encoding: "utf8" });
}

function insideRepo(relativePath) {
  const resolved = path.resolve(rootDir, relativePath);
  const relative = path.relative(rootDir, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return relative.replace(/\\/g, "/");
}

const pathsFile = path.resolve(rootDir, parsed.pathsFile);
if (!fs.existsSync(pathsFile)) fail(`нет файла путей ${parsed.pathsFile}`);
const listed = parsePathsFile(fs.readFileSync(pathsFile, "utf8"));
const stagedCheck = assertStagePaths(listed);
if (!stagedCheck.ok) {
  const detail = stagedCheck.refused?.map((item) => `${item.path} (${item.reason})`).join(", ") ?? stagedCheck.reason;
  fail(`список путей отклонён: ${detail}`);
}
const safePaths = [];
for (const filePath of stagedCheck.paths) {
  const safe = insideRepo(filePath);
  if (!safe) fail(`путь вне репозитория: ${filePath}`);
  safePaths.push(safe);
}

// The driver pre-fills every existing Files path; an untouched one would fail the index check as missing.
const status = git(["-c", "core.quotepath=off", "status", "--porcelain", "--untracked-files=all"]);
if (status.status !== 0) fail("git status failed", `${status.stdout ?? ""}${status.stderr ?? ""}`);
const { kept: allowed, unchanged } = partitionChangedPaths(safePaths, parsePorcelain(status.stdout ?? ""));
for (const filePath of unchanged) console.log(`unchanged: ${filePath}`);
if (allowed.length === 0) fail("в списке путей нет изменённых файлов");

if (parsed.mode === "stage") {
  const cached = git(["diff", "--cached", "--name-only", "-z"]);
  if (cached.status !== 0) fail("не удалось прочитать индекс", `${cached.stdout ?? ""}${cached.stderr ?? ""}`);
  const cachedSet = new Set(
    (cached.stdout ?? "").split("\0").map((filePath) => filePath.trim()).filter(Boolean),
  );
  const pathsToAdd = allowed.filter((filePath) => {
    if (fs.existsSync(path.join(rootDir, filePath))) return true;
    return !cachedSet.has(filePath);
  });
  const outputParts = [];
  if (pathsToAdd.length > 0) {
    const added = git(["add", "--", ...pathsToAdd]);
    outputParts.push(`${added.stdout ?? ""}${added.stderr ?? ""}`);
    if (added.status !== 0) fail("git add failed", outputParts.join(""));
  }
  const output = outputParts.join("");
  console.log("cu-commit: staged");
  for (const filePath of allowed) console.log(filePath);
  process.exit(0);
}

const branch = git(["branch", "--show-current"]);
if (branch.status !== 0) fail("не удалось прочитать ветку", `${branch.stdout ?? ""}${branch.stderr ?? ""}`);
const message = buildCommitMessage(branch.stdout, parsed.subject);
if (!message.ok) fail(`сообщение отклонено: ${message.reason}`);

const cached = git(["diff", "--cached", "--name-only", "-z"]);
if (cached.status !== 0) fail("не удалось прочитать индекс", `${cached.stdout ?? ""}${cached.stderr ?? ""}`);
const indexed = cached.stdout.split("\0").map((filePath) => filePath.trim()).filter(Boolean);
const indexCheck = assertCommitIndex(indexed, allowed);
if (!indexCheck.ok) {
  fail(`индекс не совпал со списком: extra=${indexCheck.extra.join(",") || "-"} missing=${indexCheck.missing.join(",") || "-"}`);
}

const committed = git(["commit", "-m", message.message]);
const output = `${committed.stdout ?? ""}${committed.stderr ?? ""}`;
fs.writeFileSync(logPath, output);
if (committed.status !== 0) fail("git commit failed", output);

const head = git(["rev-parse", "HEAD"]);
const hash = (head.stdout ?? "").trim();
console.log(`cu-commit: ${hash}`);
console.log(logTail(output, LOG_TAIL_LINES));
console.log(`log: ${path.relative(rootDir, logPath).replace(/\\/g, "/")}`);
