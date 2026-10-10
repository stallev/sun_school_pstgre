---
name: app-conventions
description: >
  Project-specific conventions for this monorepo: folder structure (data/actions/components),
  naming, Design Lab catalog, DAL + Server Actions, feature scaffolding, and RSC streaming
  patterns (Suspense, anti-waterfall). Use when creating new features, components, routes,
  or DB schemas in apps/web. Does NOT cover generic React bundle/re-render performance —
  defer to react-best-practices (Vercel plugin). RSC detail: references/nextjs-rsc-streaming.md.
---

# App conventions

## Relationship to other skills

| Source | Owns |
|--------|------|
| **`.cursor/rules/*.mdc`** | Enforceable contracts — **always win** |
| **This skill** | Monorepo layout, DAL/actions split, Cursor Rules index, RSC streaming checklist |
| **`react-best-practices`** (Vercel plugin) | Bundle size, re-renders, memoization, generic React/Next perf |

**On conflict:** Cursor Rules → this skill → `react-best-practices`.

**External skills:** do **not** install [nextjs-app-architecture-skill](https://github.com/aurorascharff/nextjs-app-architecture-skill) or other third-party Next.js architecture skills — selected patterns are already in project guidelines; extra skills risk conflicting with Cursor Rules. Provenance only: [`docs/reference/adr_010_nextjs_app_architecture_skill.md`](../../../docs/reference/adr_010_nextjs_app_architecture_skill.md) · detail: [`references/nextjs-rsc-streaming.md`](./references/nextjs-rsc-streaming.md).

---

## Project structure (`apps/web`)

```
apps/web/src/
├── app/              — routes; thin compose only
├── proxy.ts          — request interception (Next.js 16)
├── data/**           — DAL: import "server-only"; Prisma via packages/db
├── actions/**        — thin Server Actions → DAL → updateTag/revalidatePath
├── components/
│   ├── atoms/        — typography (Design Lab catalog)
│   ├── ui/           — shadcn primitives
│   └── {domain}/     — feature UI (*.server.tsx, *.client.tsx, *-skeleton.tsx)
└── lib/              — messages, validation helpers, UI utils
```

**Monorepo:** business rules → `packages/domain`; authz → `packages/policy-server`; never import policy-server from `proxy.ts`.

**NOT `features/` folders** — horizontal layers above, not vertical feature slices.

---

## New feature checklist

1. Domain use-case / types in `packages/domain` if cross-cutting.
2. DAL read → `src/data/{domain}/get-*.server.ts` with `cache()`; cross-request → `'use cache'` + `cacheTag`.
3. Mutation → DAL in `src/data/**`; thin export in `src/actions/**` or Route Handler (Class A optimistic — see **ios-safari-mutation-transport**).
4. Server UI → `*.server.tsx` awaits DAL; passes plain props to presentational / `*.client.tsx`.
5. Skeleton → sibling `*-skeleton.tsx` (one component per file).
6. Page → compose + `<Suspense>`; colocated `loading.tsx` for data-heavy routes.
7. Update product docs if behavior changes (**product-docs-alignment**).

---

## Cursor rules index

| When | Rule | Key constraint |
|------|------|----------------|
| Routes / streaming | `app-router-streaming-loading.mdc` | Suspense per region; `loading.tsx` |
| Next 16 / Vercel | `nextjs-vercel-app-router.mdc` | `proxy.ts`, `await params`, `'use cache'` |
| Data / mutations | `data-server-actions-and-api.mdc` | DAL in `data/**`; `MutationResult` |
| Logic vs UI | `react-logic-presentation.mdc` | No fetch + hooks in one file |
| One component/file | `react-one-component-per-file.mdc` | Named export; skeleton = sibling file |
| Domain codes | `domain-literals-and-codes.mdc` | `@{{PACKAGE_SCOPE}}/domain` |
| Mutations UX | `ui-mutation-pending`, `ui-toast-mutations`, `ui-optimistic-mutations` | Sonner, aria-busy |
| Design system | `ui-design-system-shadcn.mdc` | Design Lab catalog only |

Full index: [`docs/guidelines/README.md`](../../../docs/guidelines/README.md).

---

## RSC patterns (project canon — not external skill)

Evaluated against [nextjs-app-architecture-skill](https://github.com/aurorascharff/nextjs-app-architecture-skill); **not installed**. Full mapping: ADR-010 + `references/nextjs-rsc-streaming.md`.

| Pattern | This project |
|---------|--------------|
| Page composes; Suspense on page | `app-router-streaming-loading`, `ai_loading_patterns` §4–§5 |
| Async child fetches via DAL | `*.server.tsx` + `src/data/**` |
| No parent→child refetch | `ai_data_fetching_patterns` §7 |
| Client boundary as leaf | `react-logic-presentation`, `react-ui-components` |
| `params.then()` static shell | Opt-in only — `ai_loading_patterns` §4.1 |
| Region errors | `catchError` (`next/error`) opt-in — `ai_loading_patterns` §12.1; fallback must be a **meaningful** skeleton (not `null`) |
| Instant prefetch | `prefetch={true}` only per-link after a live App Shell — ADR-002 §5.1 |

**Rejected (use project layout instead):**

| Do not use | Use instead |
|------------|-------------|
| `features/<domain>/` | `data/` + `actions/` + `components/{domain}/` |
| Skeleton in same file as component | `*-skeleton.tsx` sibling |
| `'use server'` + inline DB in feature file | DAL `data/**` + thin `actions/**` |
| Ad-hoc `{ ok, error }` | `MutationResult<T>` from domain |

---

## Deviations from react-best-practices

*(Empty by default — add only with rule ID + measured reason per `docs/project-react-skill-requirements.md` §5.)*
