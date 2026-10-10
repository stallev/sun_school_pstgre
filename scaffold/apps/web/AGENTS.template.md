# {{PROJECT_NAME}} Web — Agent Instructions

> Monorepo context: [`../../AGENTS.md`](../../AGENTS.md)

**{{PROJECT_NAME}} Web** — Next.js **16.4** App Router, тонкий BFF для {{PROJECT_NAME}}.  
Hosting: **Vercel** · UI: **shadcn/ui + Tailwind CSS v4** ({{DESIGN_SYSTEM_NAME}}).

<!-- BEGIN:nextjs-agent-rules -->
## Next.js 16 — read before coding

This is **not** the Next.js from training data. APIs, conventions, and file structure differ from Next.js 15.

- Read the relevant guide in `node_modules/next/dist/docs/` before writing code
- Heed deprecation notices
- **Project canon:** [ADR-002](../../docs/prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md) and `.cursor/rules/nextjs-vercel-app-router.mdc` — not generic Next docs alone
<!-- END:nextjs-agent-rules -->

## Stack (this app)

| Package | Version | Notes |
|---------|---------|-------|
| `next` | **16.4** (pinned) | No Next 15 patterns; no floating `^16` without ADR |
| `react` / `react-dom` | 19.x | Server Components by default |
| `tailwindcss` | v4 | Semantic tokens in `src/app/globals.css` |

## Directory conventions

```
apps/web/src/
├── app/              — App Router routes (canonical: docs/design/canonical_routes.md)
├── proxy.ts          — Request interception (Next.js 16; NOT middleware.ts for new code)
├── data/             — DAL (server-only queries)
├── lib/              — App utilities, messages, UI helpers
└── components/
    ├── atoms/        — Typography atoms (Heading, ContentText, …) — catalog: /design-system
    ├── ui/           — Tokenized shadcn primitives (Button, PulseCard, CustomLink, …)
    └── design-lab/   — Design Lab showcase only — MUST NOT import in product routes
```

**Design Lab catalog:** dev-only `/design-system` (`app/(dev)/design-system/`) visualizes the canonical UI catalog. Product screens **MUST** import from `@/components/atoms` and `@/components/ui/*` — spec: [`design_system_lab_spec.md`](../../docs/implementation/mvp/specs/design_system_lab_spec.md).

- **`page.tsx` / `layout.tsx`** — only files with `default` export
- Feature components — **named export**, one component per `*.tsx` file (=140 lines target)
- Client entry — `*.client.tsx` suffix when needed

## Required patterns

Enforceable details live in Cursor Rules — summary only:

| Topic | Rule / doc |
|-------|------------|
| Request interception | `src/proxy.ts`; `export function proxy()`; runtime = **nodejs**; codemod: `npx @next/codemod@canary middleware-to-proxy .` |
| Async Request APIs | `await cookies()`, `await headers()`, `await params`, `await searchParams` |
| RSC boundary | `'use client'` only for hooks / browser APIs |
| Thin BFF | Route Handlers & Server Actions → `packages/domain` + `src/data/**` |
| Auth in proxy | **`auth.config.ts` only** — no Prisma, never import `auth.ts` |
| Policy in proxy | `@{{PACKAGE_SCOPE}}/policy-edge` only — **never** `@{{PACKAGE_SCOPE}}/policy-server` |
| Cache invalidation | `updateTag`, `revalidateTag`, `revalidatePath` — см. ADR-002 |
| Background work | Vercel Cron + jobs — **not** `unstable_after` |
| Data layer | [`ai_nextjs_db_data_handle.md`](../../docs/guidelines/nextjs/ai_nextjs_db_data_handle.md) §7 |
| iOS Safari mutations | [`ios-safari-mutation-transport-pattern.md`](../../docs/incidents/ios-safari-mutation-transport-pattern.md) — rule: `ios-safari-mutation-transport.mdc` |
| Forms | [`ai_form_handling_pattern.md`](../../docs/guidelines/react/ai_form_handling_pattern.md) §7 |
| Domain literals & error codes | `@{{PACKAGE_SCOPE}}/domain` constants — rule: `domain-literals-and-codes.mdc` |

## UI & UX

Visual and interaction canon — **do not invent** ad-hoc styles:

| Topic | Source |
|-------|--------|
| **UI component catalog** | `/design-system` (local dev) — import `@/components/atoms`, `@/components/ui/*`; spec: [`design_system_lab_spec.md`](../../docs/implementation/mvp/specs/design_system_lab_spec.md) |
| Design tokens, typography | [`{{INTERIM_DESIGN_SYSTEM_DOC}}`](../../docs/default_docs/{{INTERIM_DESIGN_SYSTEM_DOC}}), [`typography_text_guidelines.md`](../../docs/guidelines/typography_text_guidelines.md) |
| Page layout reference | [`{{MAIN_PROTOTYPE_HTML}}`](../../docs/prototypes/{{MAIN_PROTOTYPE_HTML}}) |
| User-visible copy | `@/lib/messages` (when wired) — rules: `ui-messages-and-copy.mdc`, `ui-messages-bundle-splitting.mdc` |
| Toast after mutations | Sonner — rule: `ui-toast-mutations.mdc` |
| Pending controls | rule: `ui-mutation-pending.mdc` |
| Optimistic toggles | rule: `ui-optimistic-mutations.mdc` |

## Cursor rules (scoped to `apps/web/**`)

| Rule | Focus |
|------|-------|
| `nextjs-vercel-app-router.mdc` | Next 16, Vercel, proxy, async APIs |
| `data-server-actions-and-api.mdc` | DAL, Actions vs Route Handlers |
| `ios-safari-mutation-transport.mdc` | iOS Safari `Load failed` — Class A/B |
| `auth-security.mdc` | Auth.js, defense in depth |
| `app-router-streaming-loading.mdc` | Suspense, `loading.tsx` |
| Client lazy loading | [`ai_client_lazy_loading.md`](../../docs/guidelines/nextjs/ai_client_lazy_loading.md) — `next/dynamic` |
| `s3-file-asset-uploads.mdc` | FileAsset + AWS S3 |
| `react-ui-components.mdc` | RSC/client boundaries |
| `react-one-component-per-file.mdc` | One component per file |
| `react-logic-presentation.mdc` | Logic vs presentation split |
| `react-naming-conventions.mdc` | Naming |
| `domain-literals-and-codes.mdc` | Mutation codes, roles, domain strings |
| `ui-design-system-shadcn.mdc` | Design system tokens |
| `ui-mobile-first.mdc` | Responsive, bottom nav / sidebar |
| `ui-prototype-fidelity.mdc` | Prototype visual parity |
| `ui-semantics-a11y.mdc` | WCAG 2.1 AA |
| `ui-icons-lucide.mdc` | lucide-react |
| `admin-forms-layout.mdc` | Admin forms |
| `patterns-tables-dnd.mdc` | Responsive tables |

Full index: [`docs/guidelines/README.md`](../../docs/guidelines/README.md).

## Skills (`.cursor/skills/`)

| Skill | Focus |
|-------|-------|
| **`app-conventions`** | Project conventions: `data/` + `actions/` + `components/`, Design Lab, DAL, RSC streaming. Spec: [`docs/project-react-skill-requirements.md`](../../docs/project-react-skill-requirements.md) |
| **`next-dev-loop`** (user skill) | **Only when the user explicitly asks** — runtime dual-view (`/_next/mcp` + `agent-browser`), 4 layers. Not auto after edits/commit. |
| **Lab PSI** | **Only when the user explicitly asks** — deployed origin via `npm run psi:lab` (`PAGE_SPEED_API_KEY`). Not localhost. |

**Do not install** external Next.js **architecture** skills (`npx skills install …`). Mapping: [`docs/reference/adr_010_nextjs_app_architecture_skill.md`](../../docs/reference/adr_010_nextjs_app_architecture_skill.md). Workflow skill `next-dev-loop` is allowed as a user skill (**opt-in by user request**).

> Read `.cursor/skills/app-conventions/SKILL.md` when scaffolding features.

## Observability (Sentry)

Error tracking via `@sentry/nextjs` — config in `src/instrumentation*.ts`, `src/sentry.*.config.ts`, `src/app/global-error.tsx`.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Client + server DSN |
| `SENTRY_AUTH_TOKEN` | Source map upload (build only, secret) |
| `SENTRY_ORG` / `SENTRY_PROJECT` | Release + source map target |

Mutation flows tag `submit_transport` via `@/lib/sentry/pulse-tags` (see ios-safari incident docs). Session Replay deferred.

## Dev & verification

From `apps/web/`:

```bash
npm run dev      # local dev (Turbopack default)
npm run build    # production build
npm run lint     # ESLint
```

When `packages/` exist — from monorepo root before phase DoD:

```bash
npm run typecheck
npm run lint        # web + all packages/*
```

From `apps/web/` only (mid-task UI shortcut):

```bash
npm run lint        # or npm run lint:web from root
```

### Runtime dual-view (on user request only)

Skill **`next-dev-loop`**: confirm the feature works in a live `next dev` by cross-checking **two views** — `/_next/mcp` (routes, RSC, server actions, compile/runtime errors) and `agent-browser` (DOM, console, network, React fiber/props/state). Loop when asked: narrow scope via runtime → edit → 4 layers (compile → runtime errors → browser UX → React). **Do not** start automatically after UI edits or before commit — only when the user explicitly asks (e.g. «проверь в runtime», «next-dev-loop»). Details: user skill `next-dev-loop`; index: [`docs/guidelines/nextjs/README.md`](../../docs/guidelines/nextjs/README.md) § Agent runtime verification.

Lab PSI is **orthogonal**: `npm run psi:lab` against a **deployed** origin when the user asks. Not localhost. Not MCP as primary. See [`ai_psi_lab_testing.md`](../../docs/guidelines/nextjs/ai_psi_lab_testing.md).

### Manual verification checklist (web)

- [ ] `next` pinned to **16.4** in `package.json`
- [ ] New interception in **`src/proxy.ts`**, not Next 15 `middleware.ts` patterns
- [ ] No `@{{PACKAGE_SCOPE}}/policy-server` import in `proxy.ts` / `middleware.ts`
- [ ] Routes match [`canonical_routes.md`](../../docs/design/canonical_routes.md)
- [ ] UI follows {{DESIGN_SYSTEM_NAME}} tokens — no arbitrary Tailwind color strings for product UI
- [ ] Product UI uses Design Lab catalog imports (`@/components/atoms`, `@/components/ui/*`) — no `@/components/design-lab/**` in routes
- [ ] Mutation/error codes and roles from `@{{PACKAGE_SCOPE}}/domain` — no inline magic strings (**domain-literals-and-codes**)
- [ ] Mutations: pending UI + toast per mutation rules
- [ ] Runtime dual-view (`next-dev-loop`) — **only if the user requested it**
- [ ] Lab PSI (`npm run psi:lab`) — **only if the user requested a deployed-origin score**

## Do NOT

- Import `@{{PACKAGE_SCOPE}}/policy-server` from `proxy.ts` or Edge runtime
- Add routes outside [`canonical_routes.md`](../../docs/design/canonical_routes.md) without updating that doc
- Put business logic in Route Handlers — delegate to `packages/domain`
- Bypass PRD with client-side-only business rules
- Duplicate guideline content here — link to Cursor Rules and `docs/guidelines/`
