// Pre-commit gate: a commit that touches code or build configuration must leave the production
// build green. Runs only when relevant files are staged, so docs-only commits stay instant.
//   - check-build-isolation: no test files / test-only imports in the production build;
//   - typecheck of every workspace (including tests);
//   - `next build` of apps/web (the same command Vercel runs).
import { execFileSync, spawnSync } from "node:child_process";

const staged = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], { encoding: "utf8" })
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const AFFECTS_BUILD =
  /^(apps|packages)\/.+\.(ts|tsx|mts|js|jsx|mjs|json|css|prisma|sql)$|^package(-lock)?\.json$|^tsconfig[^/]*\.json$|^\.npmrc$|^eslint\.config\.mjs$|^vitest\.config\.mjs$|^scripts\/check-build-isolation\.mjs$/;

const relevant = staged.filter((file) => AFFECTS_BUILD.test(file));
if (relevant.length === 0) {
  console.log("precommit-build-check: no code or build config staged — skipped");
  process.exit(0);
}

const steps = [
  ["build isolation", "node", ["scripts/check-build-isolation.mjs"]],
  ["typecheck", "npm", ["run", "typecheck"]],
  ["production build", "npm", ["run", "build"]],
];

for (const [label, command, args] of steps) {
  console.log(`\nprecommit-build-check → ${label}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    console.error(`\nprecommit-build-check: "${label}" failed — fix it before committing (the same step fails on Vercel).`);
    process.exit(result.status ?? 1);
  }
}
console.log("\nprecommit-build-check: OK");
