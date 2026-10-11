// Root ESLint flat config.
// Package boundaries (monorepo_boundaries_contract.md §4, PKG-01…PKG-03) are enforced with the
// built-in `no-restricted-imports` — no extra plugin. Decision recorded in P5-CU8.
import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

const NEXT_AND_REACT = [
  { group: ["next", "next/*"], message: "Packages must not depend on Next.js." },
  { group: ["react", "react-dom", "react/*"], message: "Packages must not depend on React." },
  { group: ["next-auth", "next-auth/*", "@auth/*"], message: "Auth.js types stay in apps/web." },
];
const PRISMA_DIRECT = [
  { group: ["@prisma/*", "pg"], message: "Prisma and pg are used only inside @sunschool/db." },
];

const boundary = (files, patterns) => ({
  files,
  rules: { "no-restricted-imports": ["error", { patterns }] },
});

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/generated/**",
      "docs/**",
      "scaffold/**",
      ".local/**",
      ".claude/**",
      ".cursor/**",
      "scripts/**",
      "**/*.mjs",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  { settings: { next: { rootDir: "apps/web" } } },
  // apps/web — Next.js rules
  ...nextCoreWebVitals.map((config) => ({ ...config, files: ["apps/web/**/*.{ts,tsx}"] })),

  // @sunschool/domain: only zod + standard library (PKG-01)
  boundary(["packages/domain/**/*.ts"], [
    { group: ["@sunschool/*"], message: "domain depends on no other project package." },
    ...NEXT_AND_REACT,
    ...PRISMA_DIRECT,
  ]),
  // @sunschool/policy-edge: JWT-only, no DB (PKG-02)
  boundary(["packages/policy/edge/**/*.ts"], [
    { group: ["@sunschool/db", "@sunschool/policy-server"], message: "policy-edge is DB-free." },
    ...NEXT_AND_REACT,
    ...PRISMA_DIRECT,
  ]),
  // @sunschool/policy-server: domain + db only
  boundary(["packages/policy/server/**/*.ts"], [
    { group: ["@sunschool/policy-edge"], message: "policy-server must not import policy-edge." },
    ...NEXT_AND_REACT,
    ...PRISMA_DIRECT,
  ]),
  // @sunschool/db: domain only
  boundary(["packages/db/**/*.ts"], [
    { group: ["@sunschool/policy-*"], message: "db must not import policy packages." },
    ...NEXT_AND_REACT,
  ]),
  // apps/web: public surface of packages only (no deep imports)
  boundary(["apps/web/**/*.{ts,tsx}"], [
    {
      group: ["@sunschool/*/src/*", "@sunschool/*/src/**", "**/packages/**"],
      message: "Import packages through their public index only.",
    },
    ...PRISMA_DIRECT,
  ]),
  // proxy.ts: JWT-only layer (PKG-02, ADR-002 §3)
  boundary(["apps/web/src/proxy.ts", "apps/web/src/middleware.ts"], [
    {
      group: ["@sunschool/policy-server", "@sunschool/db", "@/auth", "@/data/*", "@prisma/*", "pg"],
      message: "proxy.ts imports auth.config and policy-edge only.",
    },
  ]),
);
