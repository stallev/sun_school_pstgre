import { defineConfig, globalIgnores } from "eslint/config";

/**
 * Root ESLint flat config — IDE scope only.
 *
 * Workspace packages keep their own configs (`apps/web`, `packages/*`).
 * Reference code under docs/examples/lampto is read-only and must not be linted.
 */
export default defineConfig([
  globalIgnores(["docs/examples/**"]),
]);
