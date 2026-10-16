// Guards the production build against dev-only code (Vercel failure of 2026-10-16:
// `next build` type-checked *.test.ts files that import `vitest`, which is a ROOT devDependency
// and is not installed in the deployment build).
//
// Rules (apps/web is the only workspace that Next builds):
//   1. apps/web/tsconfig.json excludes test files and the test helpers, so `next build` never
//      type-checks them (they are still type-checked by `npm run typecheck` via tsconfig.test.json).
//   2. No non-test source file under apps/web/src imports a test-only package.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const webRoot = join(root, "apps/web");
const TEST_ONLY = /from\s+["'](vitest|@vitest\/[^"']+|@testing-library\/[^"']+|jsdom)["']|require\(\s*["'](vitest|jsdom)["']\s*\)/;
const REQUIRED_EXCLUDES = ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test/**"];

const problems = [];

const tsconfig = JSON.parse(readFileSync(join(webRoot, "tsconfig.json"), "utf8"));
for (const pattern of REQUIRED_EXCLUDES) {
  if (!(tsconfig.exclude ?? []).includes(pattern)) {
    problems.push(`apps/web/tsconfig.json must exclude "${pattern}" (tests are not part of the production build)`);
  }
}

const isTestFile = (path) => /\.test\.tsx?$/.test(path) || relative(join(webRoot, "src"), path).replaceAll("\\", "/").startsWith("test/");

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    if (name === "node_modules" || name === ".next") return [];
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : /\.(ts|tsx|mts|js|jsx|mjs)$/.test(name) ? [full] : [];
  });

for (const file of walk(join(webRoot, "src"))) {
  if (isTestFile(file)) continue;
  if (TEST_ONLY.test(readFileSync(file, "utf8"))) {
    problems.push(`${relative(root, file).replaceAll("\\", "/")} imports a test-only package but is not a test file`);
  }
}

if (problems.length > 0) {
  console.error("build-isolation check failed:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log("build-isolation check — tests are excluded from the production build, no test-only imports in app code.");
