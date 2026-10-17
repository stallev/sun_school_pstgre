#!/usr/bin/env node
/**
 * CU verification that stays out of the agent transcript.
 * Always runs lint and test. --full adds typecheck (only before reviewer).
 * build:check is left to the pre-commit hook.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOG_TAIL_LINES, logTail } from "./phase-driver.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const full = process.argv.slice(2).includes("--full");
const unknown = process.argv.slice(2).filter((arg) => arg !== "--full");
if (unknown.length > 0) {
  console.error(`cu-verify: неизвестный аргумент ${unknown.join(" ")}`);
  process.exit(1);
}

const steps = [
  ["lint", "npm", ["run", "lint"]],
  ["test", "npm", ["run", "test"]],
];
if (full) steps.push(["typecheck", "npm", ["run", "typecheck"]]);

const logDir = path.join(rootDir, ".local", "phase-runs");
fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, `verify-${stamp()}.log`);
fs.writeFileSync(logPath, "");

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function runStep(label, command, args) {
  fs.appendFileSync(logPath, `\n# ${label}\n`);
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      shell: process.platform === "win32",
      windowsHide: true,
    });
    let output = "";
    const capture = (chunk) => {
      const text = String(chunk);
      output += text;
      fs.appendFileSync(logPath, text);
    };
    child.stdout.on("data", capture);
    child.stderr.on("data", capture);
    child.on("close", (code) => resolve({ label, code: code ?? 1, output }));
  });
}

let failed = null;
for (const [label, command, args] of steps) {
  const result = await runStep(label, command, args);
  if (result.code !== 0) {
    failed = result;
    break;
  }
}

const relativeLog = path.relative(rootDir, logPath).replace(/\\/g, "/");
if (failed) {
  console.error(`cu-verify: ${failed.label} failed`);
  console.error(logTail(failed.output, LOG_TAIL_LINES));
  console.error(`log: ${relativeLog}`);
  process.exit(failed.code);
}

console.log("cu-verify: ok");
console.log(`log: ${relativeLog}`);
