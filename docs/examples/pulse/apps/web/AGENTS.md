# Pulse Web — Agent Instructions

> Monorepo context: [`../../AGENTS.md`](../../AGENTS.md)

**Pulse Web** — Next.js **16.3.0** App Router, тонкий BFF для маркетплейса фитнес-тренеров.  
Hosting: **Vercel** · UI: **shadcn/ui + Tailwind CSS v4** (Warm Forest).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Stack (this app)

| Package | Version | Notes |
|---------|---------|-------|
| `next` | **16.3.0** (pinned) | No Next 15 patterns; no floating `^16` without ADR; Instant Navigations (`partialPrefetching`) — see ADR-002 |
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
- Feature components — **named export**, one component per `*.tsx` file (≤140 lines target)
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
| Policy in proxy | `@pulse/policy-edge` only — **never** `@pulse/policy-server` |
| Cache invalidation | `updateTag`, `revalidateTag`, `revalidatePath` — см. ADR-002 |
| Background work | Vercel Cron + jobs — **not** `unstable_after` |
| Data layer | [`ai_nextjs_db_data_handle.md`](../../docs/guidelines/nextjs/ai_nextjs_db_data_handle.md) §7 |
| iOS Safari mutations | [`ios-safari-mutation-transport-pattern.md`](../../docs/incidents/ios-safari-mutation-transport-pattern.md) — rule: `ios-safari-mutation-transport.mdc` |
| Forms | [`ai_form_handling_pattern.md`](../../docs/guidelines/react/ai_form_handling_pattern.md) §7 |
| Domain literals & error codes | `@pulse/domain` constants — rule: `domain-literals-and-codes.mdc` |

## UI & UX

Visual and interaction canon — **do not invent** ad-hoc styles:

| Topic | Source |
|-------|--------|
| **UI component catalog** | `/design-system` (local dev) — import `@/components/atoms`, `@/components/ui/*`; spec: [`design_system_lab_spec.md`](../../docs/implementation/mvp/specs/design_system_lab_spec.md) |
| Design tokens, typography | [`fitness-platform-design-system.md`](../../docs/default_docs/fitness-platform-design-system.md), [`typography_text_guidelines.md`](../../docs/guidelines/typography_text_guidelines.md) |
| Page layout reference | [`Fitness_Platform_Prototype_v1.html`](../../docs/prototypes/Fitness_Platform_Prototype_v1.html); landing `/`: [`Pulse Landing Page -Standalone-.html`](../../docs/prototypes/Pulse Landing Page -Standalone-.html) + [`public_landing_spec.md`](../../docs/implementation/mvp/specs/public_landing_spec.md) (P16) |
| User-visible copy | `@/lib/messages` (when wired) — rule: `ui-messages-and-copy.mdc` |
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
| `s3-file-asset-uploads.mdc` | FileAsset + AWS S3 |
| `react-ui-components.mdc` | RSC/client boundaries |
| `react-one-component-per-file.mdc` | One component per file |
| `react-logic-presentation.mdc` | Logic vs presentation split |
| `react-naming-conventions.mdc` | Naming |
| `domain-literals-and-codes.mdc` | Mutation codes, roles, domain strings |
| `ui-warm-forest-shadcn.mdc` | Design system tokens |
| `ui-mobile-first.mdc` | Responsive, bottom nav / sidebar |
| `ui-prototype-fidelity.mdc` | Prototype visual parity |
| `ui-semantics-a11y.mdc` | WCAG 2.1 AA |
| `ui-icons-lucide.mdc` | lucide-react |
| `admin-forms-layout.mdc` | Admin forms |
| `patterns-tables-dnd.mdc` | Responsive tables |

Full index: [`docs/guidelines/README.md`](../../docs/guidelines/README.md).

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

### Manual verification checklist (web)

- [ ] `next` pinned to **16.3.0** in `package.json`
- [ ] `partialPrefetching: true` alongside `cacheComponents: true`
- [ ] New interception in **`src/proxy.ts`**, not Next 15 `middleware.ts` patterns
- [ ] No `@pulse/policy-server` import in `proxy.ts` / `middleware.ts`
- [ ] Routes match [`canonical_routes.md`](../../docs/design/canonical_routes.md)
- [ ] UI follows Warm Forest tokens — no arbitrary Tailwind color strings for product UI
- [ ] Product UI uses Design Lab catalog imports (`@/components/atoms`, `@/components/ui/*`) — no `@/components/design-lab/**` in routes
- [ ] Mutation/error codes and roles from `@pulse/domain` — no inline magic strings (**domain-literals-and-codes**)
- [ ] Mutations: pending UI + toast per mutation rules

## Do NOT

- Import `@pulse/policy-server` from `proxy.ts` or Edge runtime
- Add routes outside [`canonical_routes.md`](../../docs/design/canonical_routes.md) without updating that doc
- Put business logic in Route Handlers — delegate to `packages/domain`
- Bypass PRD with client-side-only business rules
- Duplicate guideline content here — link to Cursor Rules and `docs/guidelines/`
