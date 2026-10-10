# ADR-002 — Next.js 16.3.0 runtime policy (Vercel)

**Дата:** 2026-05-23  
**Amend:** 2026-08-11 — pin **16.3.0** shipped; Instant Navigations / Partial Prefetching / `catchError`; Context7 `/vercel/next.js`  
**Статус:** ACCEPTED  
**Проект:** Pulse (fitapp)  
**Owner:** Architecture + Runtime

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)

---

## 1. Context

Pulse hosted on **Vercel** ([ADR-001](./adr_001_stack_and_runtime.md)). Architectural patterns inherit from **lampto**, where Next.js 16.2 introduced a breaking rename of request interception: **`middleware.ts` → `proxy.ts`**.

Next.js **16.3** adds **Instant Navigations** on top of Cache Components: **Partial Prefetching** (`partialPrefetching`), Instant Insights, and stable **`catchError`** / `retry` for component-level error recovery ([Next.js 16.3 blog](https://nextjs.org/blog/next-16-3)).

Agents must not implement Next.js 15 `middleware.ts` patterns as the canonical approach.

**Official reference (Context7 `/vercel/next.js`):** [`proxy` file convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy), [Upgrading to v16 — middleware to proxy](https://nextjs.org/docs/app/guides/upgrading/version-16#middleware-to-proxy), [Instant navigation](https://nextjs.org/docs/app/guides/instant-navigation), [Adopting Partial Prefetching](https://nextjs.org/docs/app/guides/adopting-partial-prefetching), [`catchError`](https://nextjs.org/docs/app/api-reference/functions/catchError). Prefer bundled docs under `node_modules/next/dist/docs/`.

---

## 2. Decision — version pin

| Policy | Value |
|--------|-------|
| **Next.js version** | **`16.3.0` exactly** — pin in `apps/web` `package.json` as `"next": "16.3.0"` (no caret/range in production lockfile); align `@next/third-parties` and `eslint-config-next` |
| **React** | 19.x (peer of Next 16.3) |
| **Hosting** | Vercel |
| **Bundler** | Turbopack default (`next dev`, `next build`) |

**Hard rule:** do not downgrade to Next.js 15.x or use floating `^16.x` without a new ADR.

---

## 3. Decision — request interception (`proxy.ts`)

Next.js 16 deprecates `middleware.ts` in favor of **`proxy.ts`**.

| Item | Policy |
|------|--------|
| **Canonical file** | `apps/web/src/proxy.ts` (or `proxy.ts` at app src root per scaffold) |
| **Export name** | `export function proxy(request: NextRequest)` — **not** `middleware` |
| **Runtime** | **`nodejs`** — Edge runtime is **not** supported in `proxy` (Next.js 16). If Edge interception is required temporarily, **`middleware.ts` only** with explicit migration ticket. |
| **Transitional `middleware.ts`** | Allowed **only** as tracked migration step; do not add new logic to `middleware.ts` without plan to move to `proxy.ts`. |
| **Codemod** | `npx @next/codemod@canary middleware-to-proxy .` |

### Auth / policy integration

- **`proxy.ts`** imports **`auth.config.ts`** (edge-safe, **no Prisma**) and **`@pulse/policy-edge`** only.
- **`auth.ts`** (full Auth.js + Prisma adapter) — **never** import from `proxy.ts`.
- **`@pulse/policy-server`** — **forbidden** in `proxy.ts` and `middleware.ts` (no Prisma in interception layer).

Split Auth.js config is **mandatory** (pattern from lampto, adapted for Vercel).

---

## 4. Decision — Async Request APIs

Mandatory in all App Router code (Next.js 15+ retained in 16):

```ts
const cookieStore = await cookies();
const headersList = await headers();

export default async function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await props.params;
}
```

---

## 5. Decision — cache reads and invalidation (Next.js 16)

**Cross-request cached reads:** use the **`'use cache'`** directive with **`cacheTag()`** and **`cacheLife()`** in `src/data/**`. **Do not add new `unstable_cache()`** — legacy API superseded in Next.js 16. Enable **`cacheComponents: true`** in `apps/web/next.config.ts` when implementing cached reads. Detail: [`ai_loading_patterns.md`](../../guidelines/nextjs/ai_loading_patterns.md) §8.

**Post-mutation invalidation:**

| API | When |
|-----|------|
| **`updateTag`** | Server Actions — read-your-own-writes (next request waits for fresh data) |
| **`revalidateTag`** | Route Handlers or SWR-style stale-while-revalidate |
| **`revalidatePath`** | Route-scoped invalidation when tags not used |

Do **not** use `unstable_after` for background email/jobs — use Vercel Cron + `job_execution` / `delivery_log` ([ADR-001](./adr_001_stack_and_runtime.md)).

---

## 5.1 Decision — Instant Navigations and Partial Prefetching (Next.js 16.3)

Instant Navigations = **Cache Components** + **Partial Prefetching**. Required `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};
```

| Item | Policy |
|------|--------|
| **`cacheComponents`** | **Required** |
| **`partialPrefetching`** | **Required** — default Link warms a reusable **App Shell** per route (not full page per link) |
| **Adoption** | Follow [Adopting Partial Prefetching](https://nextjs.org/docs/app/guides/adopting-partial-prefetching): audit `<Link prefetch={true}>` / `router.prefetch` → temporary `export const prefetch = 'partial'` if needed → enable global flag → `npx @next/codemod@latest remove-partial-prefetch` |
| **Pulse audit** | Global flag is on. Intentional deeper `prefetch={true}` only on approved hot CTAs (landing → `/trainers`, trainer cards → `/trainers/[id]`, book CTAs → `/book/[trainerId]`). Verify Instant Insights in `next dev` on navigation-heavy routes |
| **`<Link prefetch={true}>`** | Only for intentional **per-link deeper prefetch** (URL data / cached content behind Suspense or `'use cache'`) — not a default |
| **`export const instant = false`** | Opt out of instant validation for a segment **only with documented reason** (blocking route) — not the default |
| **Instant routes** | Prefer **Suspense** streaming and/or **`'use cache'`** so navigations paint the shared shell immediately |

Detail: [`ai_loading_patterns.md`](../../guidelines/nextjs/ai_loading_patterns.md) (Instant Navigations / Partial Prefetching).

---

## 5.2 Decision — error recovery (`error.tsx` and `catchError`)

| Layer | Policy |
|-------|--------|
| **Route segment** | Colocated **`error.tsx`** remains the canonical boundary for async segment failures (existing Pulse rule) |
| **Component-level** | **`catchError`** from `next/error` (stable in 16.3) — use when a segment `error.tsx` is too coarse; fallback must be a Client Component; prefer **`retry()`** (re-fetch children) over **`reset()`** |
| **Control flow** | `catchError` must not interfere with **`notFound()`** / **`redirect()`** |

Do not invent ad-hoc client error boundaries that duplicate catalog/`error.tsx` patterns without need. Detail: [`ai_loading_patterns.md`](../../guidelines/nextjs/ai_loading_patterns.md) §12+.

---

## 6. Consequences

**Positive:**

- Aligns Pulse with lampto Next.js 16 patterns while keeping Vercel hosting.
- `proxy.ts` + Node runtime simplifies Auth.js JWT gate without Edge Prisma restrictions.
- Single runtime ADR prevents agents from mixing v15 middleware docs with v16 codebase.
- Instant Navigations / Partial Prefetching reduce over-prefetch and enable SPA-like shells without abandoning the server model.
- Stable `catchError` allows finer recovery than segment-only `error.tsx`.

**Trade-offs:**

- Teams must migrate any legacy `middleware.ts` examples in docs/code to `proxy.ts`.
- Libraries assuming Edge middleware (e.g. some i18n setups) may require keeping transitional `middleware.ts` — document exception in implementation contract.
- Partial Prefetching changes Link semantics — agents must not treat `prefetch={true}` as the old “full page” default without reading the adoption guide.

---

## 7. Relationship to lampto ADRs

| Lampto ADR | Pulse |
|------------|-------|
| ADR-026 (Netlify) | **Not applicable** — Pulse uses Vercel |
| ADR-022 (Vercel + Next 16.2) | **Conceptually superseded by this ADR** for Pulse; adopt interception/cache rules, pin **16.3.0** |

---

## 8. Agent checklist

- [ ] `package.json` pins `"next": "16.3.0"`
- [ ] `cacheComponents: true` and `partialPrefetching: true` in `next.config.ts`
- [ ] New route protection uses **`proxy.ts`**, not `middleware.ts`
- [ ] `auth.config.ts` used in proxy; `auth.ts` only in server handlers/actions
- [ ] No `@pulse/policy-server` in `proxy.ts` / `middleware.ts`
- [ ] Async `cookies` / `headers` / `params` / `searchParams`
- [ ] Mutations use `updateTag` / `revalidateTag` / `revalidatePath` per scenario
- [ ] New cross-request cached reads use **`'use cache'`** + `cacheTag()` — not `unstable_cache`
- [ ] Instant routes: Suspense and/or `'use cache'`; no casual `export const instant = false`
- [ ] Segment failures → `error.tsx`; component-level → `catchError` + `retry` when needed
- [ ] Background work → Cron/jobs, not `unstable_after`

---

## Related documents

- [`adr_index.md`](./adr_index.md) — ADR registry
- [`decision_process.md`](./decision_process.md) — ADR process
- [ADR-001](./adr_001_stack_and_runtime.md)
- [`docs/guidelines/nextjs/README.md`](../../guidelines/nextjs/README.md)
- [`.cursor/rules/nextjs-vercel-app-router.mdc`](../../../.cursor/rules/nextjs-vercel-app-router.mdc)
- [`cache_revalidation_policy.md`](../05_runtime/cache_revalidation_policy.md) — tag/path invalidation detail (W5)
