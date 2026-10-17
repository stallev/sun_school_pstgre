#!/usr/bin/env node
/**
 * CU verification that stays out of the agent transcript.
 * Always runs lint and test. --full adds typecheck (only before reviewer).
 * build:check is left to the pre-commit hook.
 * The test step holds vitest.lock and retries once when Vitest crashes before any test.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOG_TAIL_LINES, isHarnessTestFailure, logTail } from "./phase-driver.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const full = process.argv.slice(2).includes("--full");
const unknown = process.argv.slice(2).filter((arg) => arg !== "--full");
if (unknown.length > 0) {
  console.error(`cu-verify: неизвестный аргумент ${unknown.join(" ")}`);
  process.exit(1);
}

const vitestEntry = path.join(rootDir, "node_modules", "vitest", "vitest.mjs");
const eslintEntry = path.join(rootDir, "node_modules", "eslint", "bin", "eslint.js");
const HARNESS_EXIT = 3;
const LOCK_WAIT_MS = 4 * 60 * 1000;
const LOCK_POLL_MS = 5000;

const steps = [
  ["lint", [eslintEntry, "."]],
  ["test", [vitestEntry, "run", "--passWithNoTests"]],
];
if (full) steps.push(["typecheck", npmRunArgs(["run", "typecheck"])]);

const logDir = path.join(rootDir, ".local", "phase-runs");
fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, `verify-${stamp()}.log`);
const lockPath = path.join(logDir, "vitest.lock");
fs.writeFileSync(logPath, "");

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function resolveNpmCli() {
  const nodeDir = path.dirname(process.execPath);
  const candidates = [
    path.join(nodeDir, "node_modules", "npm", "bin", "npm-cli.js"),
    path.join(nodeDir, "..", "lib", "node_modules", "npm", "bin", "npm-cli.js"),
    path.join(nodeDir, "..", "node_modules", "npm", "bin", "npm-cli.js"),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function npmRunArgs(args) {
  const npmCli = resolveNpmCli();
  if (!npmCli) {
    console.error("cu-verify: npm-cli.js не найден рядом с node; shell-запуск npm отключён");
    process.exit(1);
  }
  return [npmCli, ...args];
}

function runNode(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: rootDir,
      shell: false,
      windowsHide: true,
      env: process.env,
    });
    let output = "";
    const capture = (chunk) => {
      const text = String(chunk);
      output += text;
      fs.appendFileSync(logPath, text);
    };
    child.stdout.on("data", capture);
    child.stderr.on("data", capture);
    child.on("error", (error) => {
      output += `${error.message}\n`;
      fs.appendFileSync(logPath, `${error.message}\n`);
      resolve({ code: 1, output });
    });
    child.on("close", (code) => resolve({ code: code ?? 1, output }));
  });
}

function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireTestLock() {
  const deadline = Date.now() + LOCK_WAIT_MS;
  while (true) {
    try {
      const fd = fs.openSync(lockPath, "wx");
      fs.writeSync(fd, String(process.pid));
      fs.closeSync(fd);
      return true;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      let owner = Number.NaN;
      try {
        owner = Number(fs.readFileSync(lockPath, "utf8").trim());
      } catch {
        owner = Number.NaN;
      }
      if (!Number.isInteger(owner) || owner <= 0 || !pidAlive(owner)) {
        fs.rmSync(lockPath, { force: true });
        continue;
      }
      if (Date.now() > deadline) return false;
      fs.appendFileSync(logPath, `\n# vitest.lock held by ${owner}, waiting\n`);
      await sleep(LOCK_POLL_MS);
    }
  }
}

function releaseTestLock() {
  try {
    const owner = Number(fs.readFileSync(lockPath, "utf8").trim());
    if (owner === process.pid) fs.rmSync(lockPath, { force: true });
  } catch {
    // The lock is already gone.
  }
}

let failed = null;
for (const [label, args] of steps) {
  fs.appendFileSync(logPath, `\n# ${label}\n`);
  let locked = false;
  if (label === "test") {
    locked = await acquireTestLock();
    if (!locked) {
      failed = {
        label,
        code: HARNESS_EXIT,
        output: "vitest.lock is still held\n",
        harness: true,
      };
      break;
    }
  }
  try {
    let result = await runNode(args);
    if (label === "test" && result.code !== 0 && isHarnessTestFailure(result.output)) {
      fs.appendFileSync(logPath, "\n# test harness, retry once\n");
      result = await runNode(args);
      if (result.code !== 0 && isHarnessTestFailure(result.output)) {
        failed = { label, code: HARNESS_EXIT, output: result.output, harness: true };
        break;
      }
    }
    if (result.code !== 0) {
      failed = { label, code: result.code, output: result.output, harness: false };
      break;
    }
  } finally {
    if (locked) releaseTestLock();
  }
}

const relativeLog = path.relative(rootDir, logPath).replace(/\\/g, "/");
if (failed) {
  console.error(failed.harness ? "cu-verify: test harness-failed" : `cu-verify: ${failed.label} failed`);
  console.error(logTail(failed.output, LOG_TAIL_LINES));
  console.error(`log: ${relativeLog}`);
  process.exit(failed.code);
}

console.log("cu-verify: ok");
console.log(`log: ${relativeLog}`);
