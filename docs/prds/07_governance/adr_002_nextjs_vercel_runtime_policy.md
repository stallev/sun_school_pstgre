# ADR-002 — Next.js 16.4 runtime policy (Vercel)

**Тип:** ADR
**Статус:** ACCEPTED
**Версия:** 1.0
**Дата:** 2026-10-10
**Волна:** W1-F2
**Зависит от:** [`adr_001_stack_and_runtime.md`](./adr_001_stack_and_runtime.md), [`adr_002_nextjs_vercel_runtime_policy.template.md`](./adr_002_nextjs_vercel_runtime_policy.template.md)
**Связанные документы:** [`architecture_master_index.md`](../architecture_master_index.md), [`ai_loading_patterns.md`](../../guidelines/nextjs/ai_loading_patterns.md), [`nextjs-vercel-app-router.mdc`](../../../.cursor/rules/tiers/t1-implementation/nextjs-vercel-app-router.mdc)
**Проверено по:** next@16.4.0 — официальная документация nextjs.org через WebFetch, 2026-10-10: `proxy.ts` (Middleware переименован в Proxy с Next.js 16; экспорт `proxy` или default), `cacheComponents` (стабилен с 16.0.0; включать вместе с `partialPrefetching`; требует Node.js runtime). Context7 в сессии недоступен; остальные пункты (§4–§5.2) перенесены из шаблона и подлежат сверке при P5.
**Owner:** Architecture + Runtime

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)

Канон SoT: [`.cursor/rules/project-context.mdc`](../../../.cursor/rules/project-context.mdc).

---

## 1. Context

Sunday School hosted on **Vercel**. Next.js 16 renamed request interception **`middleware.ts` → `proxy.ts`**. Next.js **16.3** adds **Instant Navigations** on Cache Components: **Partial Prefetching**, Instant Insights, and stable **`catchError`**.

Agents must not treat Next.js 15 `middleware.ts` as the canonical interception file.

**Official reference (nextjs.org, версия документации 16.4.0):** [`proxy`](https://nextjs.org/docs/app/api-reference/file-conventions/proxy), [middleware to proxy](https://nextjs.org/docs/app/guides/upgrading/version-16#middleware-to-proxy), [Instant navigation](https://nextjs.org/docs/app/guides/instant-navigation), [Adopting Partial Prefetching](https://nextjs.org/docs/app/guides/adopting-partial-prefetching), [`catchError`](https://nextjs.org/docs/app/api-reference/functions/catchError). Prefer bundled docs under `node_modules/next/dist/docs/`.

---

## 2. Decision — version pin

| Policy | Value |
|--------|-------|
| **Next.js version** | **16.4, exact patch pin** — boilerplate baseline **`16.4`** (minor). In `apps/web` `package.json`: `"next": "16.4.<patch>"` (no caret). Align `@next/third-parties` and `eslint-config-next` to the **same** patch. At **P5 scaffold:** `npm view next version` + Context7 `/vercel/next.js`; if latest is still 16.4.x, pin **that** exact patch. Bump 16.4 security/patch pins in the **same task**. **16.5+** requires an ADR amend. This row is the amend that moves the boilerplate off 16.4. |
| **React** | 19.x (peer of Next 16.4) |
| **Hosting** | Vercel |
| **Bundler** | Turbopack default (`next dev`, `next build`) |

**Hard rule:** do not downgrade to Next.js 15.x or use floating `^16` / `^16.x` without a new ADR.

---

## 3. Decision — request interception (`proxy.ts`)

| Item | Policy |
|------|--------|
| **Canonical file** | `apps/web/src/proxy.ts` |
| **Export name** | `export function proxy(request: NextRequest)` — **not** `middleware` |
| **Runtime** | **`nodejs`** — Edge is **not** supported in `proxy`. Transitional **`middleware.ts`** only with a migration ticket. |
| **Codemod** | `npx @next/codemod@canary middleware-to-proxy .` |

### Auth / policy

- **`proxy.ts`** imports **`auth.config.ts`** (edge-safe, **no Prisma**) and **`@sunschool/policy-edge`** only.
- **`auth.ts`** — **never** import from `proxy.ts`.
- **`@sunschool/policy-server`** — **forbidden** in `proxy.ts` / `middleware.ts`.

---

## 4. Decision — Async Request APIs

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

## 5. Decision — cache reads and invalidation

**Cross-request cached reads:** **`'use cache'`** + **`cacheTag()`** / **`cacheLife()`** in `src/data/**`. **Do not add new `unstable_cache()`**. Enable **`cacheComponents: true`**. Detail: [`docs/guidelines/nextjs/ai_loading_patterns.md`](../../guidelines/nextjs/ai_loading_patterns.md) §8.

| API | When |
|-----|------|
| **`updateTag`** | Server Actions — read-your-own-writes |
| **`revalidateTag`** | Route Handlers or SWR-style |
| **`revalidatePath`** | Route-scoped invalidation when tags not used |

Do **not** use `unstable_after` for background work: фоновые задачи и email — post-MVP (модуль `email_jobs` выключен); при включении — Vercel Cron + идемпотентные записи.

---

## 5.1 Decision — Instant Navigations Required (Next.js 16.4)

Instant Navigations = **Cache Components** then **Partial Prefetching**. Required `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};
```

| Item | Policy |
|------|--------|
| **Adoption order** | Enable **Cache Components** first; then **Partial Prefetching**. Never `partialPrefetching` without `cacheComponents`. |
| **`cacheComponents` / `partialPrefetching`** | **Required** — default Link warms a reusable **App Shell** |
| **Instant Insights (dev)** | Overlay **warning** for blocking segments — not general QA. Production **build** uses `blocking-prerender-*` (do **not** mix with `blocking-route`). |
| **`'use cache: private'`** | **Browser** private cache — not the static shell, not CDN. |
| **`<Link prefetch={true}>`** | Only **per-link** after a live App Shell — not the default. |
| **`export const instant = false`** | Opt out **only with documented reason** (Block) |
| **Instant routes** | Dynamic work behind **Suspense** and/or **`'use cache'`** |

Playwright `@next/playwright` `instant()` — **SHOULD** on critical product navigations when flags are on (do **not** treat Pulse `/trainers` as mandatory routes). Scaffold does **not** add the Playwright package in this boilerplate task.

Detail: [`docs/guidelines/nextjs/ai_loading_patterns.md`](../../guidelines/nextjs/ai_loading_patterns.md) §8.1 / §8.1.1.

---

## 5.2 Decision — error recovery (`error.tsx` and `catchError`)

| Layer | Policy |
|-------|--------|
| **Route segment** | Colocated **`error.tsx`** |
| **Component-level** | **`catchError`** from `next/error` (stable in 16.3); fallback is a Client Component; prefer **`retry()`** over **`reset()`** |
| **Control flow** | Must not interfere with **`notFound()`** / **`redirect()`** |

---

## 6. Consequences

**Positive:** `proxy.ts` + Node runtime; Instant Navigations reduce over-prefetch; stable `catchError` is finer than segment-only `error.tsx`.

**Trade-offs:** migrate leftover `middleware.ts` examples; Partial Prefetching changes Link semantics — do not treat `prefetch={true}` as the old full-page default.

---

## 7. Agent checklist

- [ ] `package.json` pins `"next"` to the current **16.4.x** patch (no caret; verify with `npm view next version` at P5)
- [ ] `cacheComponents: true` then `partialPrefetching: true`
- [ ] New route protection uses **`proxy.ts`**
- [ ] `auth.config.ts` in proxy; `auth.ts` only in server handlers/actions
- [ ] No `@sunschool/policy-server` in `proxy.ts` / `middleware.ts`
- [ ] Async `cookies` / `headers` / `params` / `searchParams`
- [ ] Mutations use `updateTag` / `revalidateTag` / `revalidatePath`
- [ ] Cross-request reads use **`'use cache'`** + `cacheTag()` — not `unstable_cache`
- [ ] Instant routes: Suspense and/or `'use cache'`; no casual `instant = false`
- [ ] Segment failures → `error.tsx`; component-level → `catchError` + `retry`
- [ ] Background work (post-MVP) → Cron/jobs, not `unstable_after`

---

## Related documents

- [`.cursor/rules/nextjs-vercel-app-router.mdc`](../../../.cursor/rules/nextjs-vercel-app-router.mdc)
- [`docs/guidelines/nextjs/README.md`](../../guidelines/nextjs/README.md)
- [`adr_001_stack_and_runtime.md`](./adr_001_stack_and_runtime.md) — стек и окружения
- Pulse snapshot (code/domain reference, not canon): [`docs/examples/pulse/docs/prds/07_governance/adr_002_next162_vercel_runtime_policy.md`](../../examples/pulse/docs/prds/07_governance/adr_002_next162_vercel_runtime_policy.md)

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W1-F2

## Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| Q-01 | Сверить §4–§5.2 (async request APIs, `updateTag`, `catchError`, `'use cache: private'`) с документацией 16.4.x на P5 | исполнитель P5 | P01-T1 |
| Q-02 | `@next/playwright` `instant()` — включать ли в Phase DoD (профиль lean: e2e выключен) | владелец | `P01_tasks.md` |

## Change log

| Date | Change |
|------|--------|
| 2026-10-10 | v1.0 — ACCEPTED (W1-F2), создан из шаблона |
