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

const WEB_FILES = ["apps/web/**/*.{ts,tsx}"];
const CLIENT_ENTRY_FILES = ["apps/web/**/*.client.{ts,tsx}"];
const CYRILLIC_IN_JSX = [
  {
    selector: "JSXText[value=/[\\u0400-\\u04FF]/]",
    message: "User-visible Cyrillic in JSX — use @/lib/messages keys (ADR-008 §4.1.7).",
  },
];
const CLIENT_MESSAGE_IMPORTS = [
  {
    name: "@/lib/messages/get-dictionary",
    importNames: ["getDictionary", "getMessage"],
    message: "Client entry must not load dictionaries — pass a typed message slice via props.",
  },
];
const DESIGN_LAB_FILES = [
  "apps/web/src/components/design-lab/**",
  "apps/web/src/lib/design-lab/**",
  "apps/web/src/app/(dev)/**",
];
const WEB_PATTERNS = [
  {
    group: ["@sunschool/*/src/*", "@sunschool/*/src/**", "**/packages/**"],
    message: "Import packages through their public index only.",
  },
  {
    group: ["@radix-ui/*", "radix-ui"],
    message: "Primitives are Base UI (shadcn -b base); Radix is not allowed (ADR-001).",
  },
  ...PRISMA_DIRECT,
];
const NO_DESIGN_LAB = [
  {
    group: ["@/components/design-lab", "@/components/design-lab/*", "@/lib/design-lab", "@/lib/design-lab/*"],
    message: "Design Lab is dev-only: product code must not import it (design_system_lab_spec C-3).",
  },
];
// esquery regexes drop backslashes: only character classes here.
const RAW_COLOR = "^(#[0-9a-fA-F]{3,8}|(rgb|hsl|oklch|oklab|lab|lch)a?[(].*)$";
const ARBITRARY_COLOR_CLASS =
  "(^| )[a-z-:]*(bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|divide|accent|caret)-[[]#";
const NO_RAW_COLOR = [
  {
    selector: `Literal[value=/${RAW_COLOR}/]`,
    message: "No raw colour literals: use a design token utility (UX-03 §10).",
  },
  {
    selector: `Literal[value=/${ARBITRARY_COLOR_CLASS}/]`,
    message: "No arbitrary hex colour classes: use a design token utility (UX-03 §10).",
  },
  {
    selector:
      "JSXAttribute[name.name='style'] Property[key.name=/^(color|background|backgroundColor|borderColor|outlineColor|fill|stroke)$/]",
    message: "No inline colour styles: use Tailwind utilities over tokens (UX-03 §10).",
  },
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
  // apps/web: public surface of packages only (no deep imports), no Radix (ADR-001: Base UI),
  // product code must not import the Design Lab (design_system_lab_spec C-3).
  {
    files: WEB_FILES,
    ignores: DESIGN_LAB_FILES,
    rules: {
      "no-restricted-imports": ["error", { patterns: [...WEB_PATTERNS, ...NO_DESIGN_LAB] }],
    },
  },
  boundary(DESIGN_LAB_FILES, WEB_PATTERNS),
  // apps/web: colours come from tokens only — no hex / rgb literals, no inline style (UX-03 §10).
  // The Lab's documentation data (`lib/design-lab/**`) and the shadcn `components/ui` skins are
  // covered too: `components/ui` is tokenized, so it must stay clean.
  {
    files: WEB_FILES,
    ignores: ["apps/web/src/lib/design-lab/**"],
    rules: { "no-restricted-syntax": ["error", ...NO_RAW_COLOR] },
  },
  // proxy.ts: JWT-only layer (PKG-02, ADR-002 §3)
  {
    files: CLIENT_ENTRY_FILES,
    rules: {
      "no-restricted-imports": ["error", { paths: CLIENT_MESSAGE_IMPORTS }],
    },
  },
  {
    files: ["apps/web/src/**/*.{tsx,jsx}"],
    ignores: [...DESIGN_LAB_FILES, "apps/web/src/components/ui/**", "apps/web/src/**/*.test.{tsx,jsx}"],
    rules: { "no-restricted-syntax": ["error", ...CYRILLIC_IN_JSX] },
  },
  boundary(["apps/web/src/proxy.ts", "apps/web/src/middleware.ts"], [
    ...WEB_PATTERNS,
    {
      group: ["@sunschool/policy-server", "@sunschool/db", "@/auth", "@/data/*", "@prisma/*", "pg"],
      message: "proxy.ts imports auth.config and policy-edge only.",
    },
  ]),
);
