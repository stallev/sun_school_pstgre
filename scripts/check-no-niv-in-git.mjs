/**
 * CI guard: licensed NIV seed must not be tracked (bible_seed_contract §11, ADR-009 §3.2).
 */
import { execSync } from "node:child_process";

const patterns = [
  /(^|\/)docs\/my_specs\/Bible\/data\/RelSQLData\/niv\//,
  /(^|\/)docs\/my_specs\/Bible\/data\/niv_src\//,
];

const tracked = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const violations = tracked.filter((file) => patterns.some((re) => re.test(file)));

if (violations.length > 0) {
  console.error("Licensed NIV paths must not be tracked in git:");
  for (const file of violations) {
    console.error(`  ${file}`);
  }
  process.exit(1);
}

console.log("check:no-niv-in-git OK");
