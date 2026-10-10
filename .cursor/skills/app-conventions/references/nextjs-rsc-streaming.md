# Next.js RSC streaming — project reference

**Provenance (not installed):** patterns evaluated from [nextjs-app-architecture-skill](https://github.com/aurorascharff/nextjs-app-architecture-skill) — see [`docs/reference/adr_010_nextjs_app_architecture_skill.md`](../../../../docs/reference/adr_010_nextjs_app_architecture_skill.md).

**Do not** run `npx skills install` for external Next.js architecture skills. Canonical sources for agents:

1. `.cursor/rules/*.mdc`
2. `docs/guidelines/nextjs/ai_loading_patterns.md`, `ai_data_fetching_patterns.md`
3. This file + `app-conventions/SKILL.md`

---

## Adopt (in project guidelines)

| Pattern | Project canon |
|---------|---------------|
| Pages compose; no domain logic in `page.tsx` | `react-logic-presentation`, `ai_loading_patterns` §4 |
| Page owns `<Suspense>`; skeleton as sibling file | `app-router-streaming-loading`, `react-one-component-per-file` |
| Async server component awaits DAL | `src/data/**` + `*.server.tsx` |
| `'use client'` only at leaves | `react-ui-components`, `nextjs-vercel-app-router` |
| `cache()` on server reads | `ai_data_fetching_patterns` §2 |
| Parent passes DTO; child does not refetch | `ai_data_fetching_patterns` §7 |
| Sibling Suspense per independent region | `ai_loading_patterns` §5 |
| `'use cache'` + `cacheTag` | ADR-002, `ai_loading_patterns` §8 |

---

## Adopt with adaptation (opt-in)

| Pattern | Project adaptation |
|---------|-------------------|
| Sync page + `params.then()` | Opt-in when `cacheComponents: true` — `ai_loading_patterns` §4.1. Default: `await params`. |
| Region `ErrorBoundary` + retry | `catchError` from `next/error` — `ai_loading_patterns` §12.1. Keep segment `error.tsx`. Fallback must be meaningful — not `null`. |
| Per-link deeper prefetch | `<Link prefetch={true}>` only after a live App Shell; requires Cache Components then Partial Prefetching. |

---

## Reject

| External pattern | Project canon |
|------------------|---------------|
| `features/<domain>/` | `data/` + `actions/` + `components/{domain}/` + `packages/*` |
| Component + skeleton same file | Separate `*-skeleton.tsx` |
| `'use server'` with inline Prisma in feature file | DAL + thin `actions/**` |
| Server Action for every mutation | Route Handler for Class A (**data-server-actions-and-api**) |
| External skill as agent dependency | **Forbidden** — ADR-010 |

---

## Decision flow (this repo)

```
1. Contract / phase task? → P{N}_tasks.md first
2. Read → src/data/{domain}/get-*.server.ts (cache() or 'use cache')
3. Mutation → DAL; action or API route per Class A/B
4. UI → *.server.tsx + *.client.tsx + *-skeleton.tsx
5. Page → fast auth/redirect; Suspense per slow region; loading.tsx if data-heavy
6. Behavior change? → product-docs-alignment
```
