import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

/**
 * Shared Node/TypeScript preset for Pulse packages (domain, db, policy).
 * Web app uses its own eslint.config.mjs with eslint-config-next.
 */
const pulseNodeConfig = defineConfig(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
);

export default pulseNodeConfig;
