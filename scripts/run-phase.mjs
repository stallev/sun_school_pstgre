#!/usr/bin/env node
/**
 * Phase driver: picks the next open CU, gates dirty tree, writes paths-file and session prompt.
 * --environment cursor (default) / print — one CU per invocation; Cursor Agent loops in chat.
 * --environment claude-code — headless loop via `claude -p` (Claude Code CLI).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LOG_TAIL_LINES,
  classifyDirtyPaths,
  concreteAllowPaths,
  decidePhaseStep,
  logTail,
  parseCommitUnits,
  parsePorcelain,
  parseRunPhaseArgs,
  renderSessionPrompt,
  renderSmokeList,
  summarizeSessionResult,
} from "./phase-driver.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parsed = parseRunPhaseArgs(process.argv.slice(2));
if (!parsed.ok) {
  console.error(`run-phase: ${parsed.reason}`);
  process.exit(1);
}

const tasksPath = `docs/implementation/mvp/tasks/${parsed.phase}_tasks.md`;
const tasksAbsolute = path.join(rootDir, tasksPath);
if (!fs.existsSync(tasksAbsolute)) {
  console.error(`run-phase: нет файла ${tasksPath}`);
  process.exit(1);
}

const runDir = path.join(rootDir, ".local", "phase-runs");
fs.mkdirSync(runDir, { recursive: true });

function readUnits() {
  return parseCommitUnits(fs.readFileSync(tasksAbsolute, "utf8"));
}

function dirtyPaths() {
  const status = spawnSync("git", ["status", "--porcelain"], { cwd: rootDir, encoding: "utf8" });
  if (status.status !== 0) {
    console.error("run-phase: git status failed");
    process.exit(1);
  }
  return parsePorcelain(status.stdout ?? "");
}

function writeSmoke(deferred) {
  const smokePath = path.join(runDir, `${parsed.phase}-smoke.md`);
  fs.writeFileSync(smokePath, renderSmokeList(parsed.phase, deferred));
  return path.relative(rootDir, smokePath).replace(/\\/g, "/");
}

function prepare(units) {
  const step = decidePhaseStep(units);
  if (step.action === "complete") {
    const smoke = writeSmoke(step.deferred);
    console.error(`run-phase: ${parsed.phase} завершена`);
    console.error(`smoke: ${smoke}`);
    process.exit(0);
  }
  if (step.action === "smoke-blocking") {
    const smoke = writeSmoke(step.deferred);
    console.error(`run-phase: стоп перед ${step.next.id}: у ${step.blocking.id} Smoke: blocking`);
    console.error(`smoke: ${smoke}`);
    process.exit(2);
  }

  const dirty = classifyDirtyPaths(dirtyPaths(), step.unit.files, tasksPath);
  if (dirty.blocked.length > 0) {
    console.error("run-phase: грязное дерево вне Files этого CU:");
    for (const filePath of dirty.blocked) console.error(`  ${filePath}`);
    process.exit(1);
  }

  const pathsFileAbsolute = path.join(runDir, `${step.unit.id}.paths`);
  const existing = concreteAllowPaths(step.unit, tasksPath).filter((filePath) =>
    fs.existsSync(path.join(rootDir, filePath)),
  );
  fs.writeFileSync(pathsFileAbsolute, `${existing.join("\n")}\n`);
  const pathsFile = path.relative(rootDir, pathsFileAbsolute).replace(/\\/g, "/");
  const promptHarness = parsed.harness === "print" ? "cursor" : parsed.harness;
  const prompt = renderSessionPrompt({ unit: step.unit, tasksPath, pathsFile, harness: promptHarness });
  return { unit: step.unit, prompt, dirty };
}

function resolveClaudeExecutable() {
  if (process.platform !== "win32") return "claude";
  const which = spawnSync("where.exe", ["claude"], { cwd: rootDir, encoding: "utf8" });
  if (which.status === 0) {
    const line = (which.stdout ?? "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .find(Boolean);
    if (line) return line;
  }
  return "claude.cmd";
}

function runClaude(prompt) {
  const command = resolveClaudeExecutable();
  const args = ["-p", "--model", parsed.model, "--max-turns", String(parsed.maxTurns), "--output-format", "json"];
  return spawnSync(command, args, {
    cwd: rootDir,
    input: prompt,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["pipe", "pipe", "inherit"],
    shell: process.platform === "win32",
  });
}

/** Saves the session JSON next to the CU logs and prints one usage line plus the result tail. */
function logSession(unitId, stdout) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sessionPath = path.join(runDir, `${unitId}-session-${stamp}.json`);
  fs.writeFileSync(sessionPath, stdout ?? "");
  const relative = path.relative(rootDir, sessionPath).replace(/\\/g, "/");
  const summary = summarizeSessionResult(stdout);
  if (!summary) {
    console.error(`run-phase: ${unitId} вернул не JSON-результат, вывод: ${relative}`);
    return null;
  }
  const { tokens } = summary;
  const cost = summary.costUsd === null ? "-" : `$${summary.costUsd.toFixed(2)}`;
  console.error(
    `run-phase: ${unitId} ${summary.subtype} · turns ${summary.turns ?? "-"} · cost ${cost} · ` +
      `in ${tokens.input} out ${tokens.output} cache-read ${tokens.cacheRead} cache-write ${tokens.cacheWrite}`,
  );
  if (summary.text) console.error(logTail(summary.text, LOG_TAIL_LINES));
  console.error(`session: ${relative}`);
  return summary;
}

function emitCursorStep(prepared) {
  if (prepared.dirty.continuable.length > 0) {
    console.error(`run-phase: продолжение ${prepared.unit.id}, в дереве уже есть файлы этого CU`);
  }
  console.error(`run-phase: ${prepared.unit.id} · environment ${parsed.environment} · harness ${parsed.harness}`);
  console.error(`paths: .local/phase-runs/${prepared.unit.id}.paths`);
  console.error("prompt: ---");
  console.log(prepared.prompt);
  console.error("prompt: ---");
  console.error(`run-phase: после коммита снова: node scripts/run-phase.mjs ${parsed.phase}`);
}

if (parsed.harness === "cursor" || parsed.harness === "print") {
  const prepared = prepare(readUnits());
  emitCursorStep(prepared);
  process.exit(0);
}

let guard = readUnits().length + 1;
while (guard > 0) {
  guard -= 1;
  const before = prepare(readUnits());
  console.error(
    `run-phase: сеанс ${before.unit.id}, environment ${parsed.environment}, harness claude, model ${parsed.model}, max-turns ${parsed.maxTurns}`,
  );
  const session = runClaude(before.prompt);
  if (session.error) {
    console.error(`run-phase: не удалось запустить claude (${session.error.code ?? session.error.message})`);
    process.exit(1);
  }
  const summary = logSession(before.unit.id, session.stdout);
  if (session.status !== 0) {
    console.error(`run-phase: сеанс ${before.unit.id} завершился с кодом ${session.status ?? 1}`);
    process.exit(session.status || 1);
  }
  if (summary?.isError) {
    console.error(`run-phase: сеанс ${before.unit.id} завершился с ошибкой ${summary.subtype}`);
    process.exit(1);
  }
  const after = decidePhaseStep(readUnits());
  if (after.action === "run" && after.unit.id === before.unit.id) {
    console.error(`run-phase: ${before.unit.id} не отмечен в ${tasksPath}`);
    process.exit(1);
  }
}
console.error("run-phase: превышен предел сеансов");
process.exit(1);
