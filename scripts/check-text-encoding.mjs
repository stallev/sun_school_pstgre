#!/usr/bin/env node
/**
 * Text files of the template must be valid UTF-8 without mojibake.
 * Catches files saved as Windows-1252 (smart quotes, dashes, arrows lost to `?`)
 * and UTF-8 text double-decoded as Windows-1252 (an em dash turns into "a-circumflex + euro + quote").
 * Scope: tracked text files outside the read-only reference snapshots in docs/examples/.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEXT_EXTENSIONS = new Set([".md", ".mdc", ".mjs", ".js", ".ts", ".json", ".yml", ".yaml", ".css", ".html"]);
const EXCLUDED_PREFIXES = ["docs/examples/"];
// Built from code points so this file does not trip its own check.
const MOJIBAKE_MARKERS = [String.fromCodePoint(0xe2, 0x20ac), String.fromCodePoint(0xfffd)];

function listTrackedTextFiles() {
  const output = execFileSync("git", ["ls-files", "-z"], { cwd: rootDir, encoding: "utf8" });
  return output
    .split("\0")
    .filter(Boolean)
    .filter((file) => TEXT_EXTENSIONS.has(path.extname(file)))
    .filter((file) => !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)))
    .filter((file) => fs.existsSync(path.join(rootDir, file)));
}

const decoder = new TextDecoder("utf-8", { fatal: true });
const problems = [];

for (const file of listTrackedTextFiles()) {
  const bytes = fs.readFileSync(path.join(rootDir, file));
  let text;
  try {
    text = decoder.decode(bytes);
  } catch {
    problems.push(`${file}: not valid UTF-8`);
    continue;
  }
  const marker = MOJIBAKE_MARKERS.find((candidate) => text.includes(candidate));
  if (marker) {
    const line = text.slice(0, text.indexOf(marker)).split("\n").length;
    problems.push(`${file}:${line}: mojibake (${JSON.stringify(marker)})`);
  }
}

if (problems.length) {
  console.error(`encoding:check — ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error("Fix: re-save as UTF-8 and restore the lost characters (→, —, «», Cyrillic) by hand.");
  process.exit(1);
}
console.log("encoding:check — all tracked text files are valid UTF-8.");
