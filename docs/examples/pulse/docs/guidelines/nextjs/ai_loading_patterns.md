# Next.js Loading & Page Performance — Pulse

**Version:** 2.2 · **Project:** Pulse `apps/web`  
**Stack:** Next.js **16.3.0** App Router, React 19, Vercel, Neon PostgreSQL 17 + Prisma v7  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Runtime:** [ADR-002](../../prds/07_governance/adr_002_next162_vercel_runtime_policy.md)  
**Cursor rule:** **app-router-streaming-loading**

> **Scope:** `apps/web/src/app/**` — loading UX, streaming shell, Instant Navigations / Partial Prefetching, and page-level performance. Cross-request data cache: **`'use cache'`** (Next.js 16) — see §8; tag invalidation — [`cache_revalidation_policy.md`](../../prds/05_runtime/cache_revalidation_policy.md).

Verify against Context7 `/vercel/next.js` and [Loading UI and Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming). After package bump, prefer bundled `node_modules/next/dist/docs/`.

**Adapted from:** lampto [`ai_loading_patterns.md`](../../examples/lampto/docs/guidelines/nextjs/ai_loading_patterns.md) + [`ai_page_performance_streaming.md`](../../examples/lampto/docs/guidelines/nextjs/ai_page_performance_streaming.md) — Netlify → Vercel, Pulse domain.

---

## Table of contents

1. [Overview & key concepts](#1-overview--key-concepts)
2. [Streaming model in App Router](#2-streaming-model-in-app-router)
3. [Mechanisms: `loading.tsx` and Suspense](#3-mechanisms-loadingtsx-and-suspense)
4. [Light `page.tsx` and layout](#4-light-pagetsx-and-layout)
5. [Independent regions behind Suspense](#5-independent-regions-behind-suspense)
6. [`auth()` cost and request dedup](#6-auth-cost-and-request-dedup)
7. [Eliminating DB waterfalls](#7-eliminating-db-waterfalls)
8. [Query caching — React `cache()` vs `'use cache'`](#8-query-caching--react-cache-vs-use-cache)
   - [8.1 Instant Navigations & Partial Prefetching](#81-instant-navigations--partial-prefetching)
9. [Neon: cold start and connection](#9-neon-cold-start-and-connection)
10. [`loading.tsx` as navigation insurance](#10-loadingtsx-as-navigation-insurance)
11. [Skeletons without CLS](#11-skeletons-without-cls)
12. [Error handling near data](#12-error-handling-near-data)
   - [12.1 `catchError` (component-level)](#121-catcherror-component-level)
13. [Mutation loading vs route loading](#13-mutation-loading-vs-route-loading)
14. [Pulse route examples](#14-pulse-route-examples)
15. [Metrics and budgets](#15-metrics-and-budgets)
16. [AI assistant checklist (mandatory)](#16-ai-assistant-checklist-mandatory)
17. [Anti-patterns](#17-anti-patterns)
18. [Documented exceptions](#18-documented-exceptions)
19. [Cross-references](#19-cross-references)

---

## 1. Overview & key concepts

**Key principle:** On navigation, the new route **must appear immediately** — even if data is still loading. Use lightweight `page.tsx`, **`loading.tsx`**, and **Suspense** per independent data region.

**Vercel:** App Router **streaming** (HTML + RSC payload aligned with Suspense) is supported in production.

### 1.1 Worst-case delay

User sees a **blank or stale page** for a long time after clicking a link because the server does not send the first RSC chunk until the **slowest** `await` in `page.tsx` or layout completes. Worst-case sources: Neon cold start, heavy JWT callback, unindexed Prisma query.

### 1.2 Streaming shell

Page chrome (nav, titles, containers, skeletons) sent **before** data arrives. User sees the new route and placeholders; data streams in via separate RSC chunks aligned with `<Suspense>` boundaries.

### 1.3 RSC chunk

A portion of the React Server Components payload in the HTTP response. Without Suspense — one large chunk at the end. With Suspense — several smaller chunks as data resolves.

### 1.4 Data boundaries (“senior” framing)

- **Shell:** nav, titles, static chrome — no slow DB waits
- **Independent sources:** each gets its own Suspense (catalog filters vs trainer grid)
- **Bottleneck isolation:** move heavy `await` into child components

After material loading/streaming changes, validate on **Vercel preview** when available — latency and caching differ from localhost.

---

## 2. Streaming model in App Router

```
User request
        │
        ▼
   proxy.ts (JWT gate, Node)   ← no Prisma — see ADR-002
        │
        ▼
  Root Layout (await auth())   ← acceptable if JWT-only, no heavy DB in layout
        │
        ▼
  Segment Layout               ← MUST stay without heavy await
        │
        ▼
  page.tsx (light shell)       ← first RSC chunk sent quickly
   ├── <Suspense fallback={<Skeleton />}>
   │       └── <ContentRegionA />   ◄── await DB query A
   └── <Suspense fallback={<Skeleton />}>
           └── <ContentRegionB />   ◄── await DB query B (independent of A)
```

> Without streaming, TTFB equals the slowest query. With streaming, the static shell is sent as soon as it is ready, decoupling FCP from data fetch time.

Each `<Suspense>` boundary is an **independent streaming point**. Sibling regions resolve and stream **in any order**.

---

## 3. Mechanisms: `loading.tsx` and Suspense

### 3.1 `loading.tsx`

Place beside `page.tsx`. Next.js wraps the segment in Suspense automatically.

```
apps/web/src/app/
├── trainers/
│   ├── page.tsx
│   ├── loading.tsx
│   └── _components/
```

Skeleton should match page chrome (Warm Forest spacing, `Container` variant from catalog).

### 3.2 Manual Suspense (within page)

**Anti-pattern:** heavy `await` at top of `page.tsx` blocks first paint.

**Recommended:** async children in separate files + `<Suspense fallback={<Skeleton />}>`.

```tsx
import { Suspense } from 'react'
import { TrainerGrid } from './_components/trainer-grid.server'
import { TrainerGridSkeleton } from './_components/trainer-grid-skeleton'

export default async function TrainersPage() {
  return (
    <div>
      <h1>…</h1>
      <Suspense fallback={<TrainerGridSkeleton />}>
        <TrainerGrid />
      </Suspense>
    </div>
  )
}
```

**Parallel boundaries:** sibling Suspense regions resolve independently.

### 3.3 Do not duplicate

Same full-page UI via both `loading.tsx` **and** outer Suspense wrapping **identical** content. Choose segment-level (`loading.tsx`) vs within-page (Suspense) deliberately.

| Mechanism | When |
|-----------|------|
| `loading.tsx` | New route segment navigation — instant route shell |
| `<Suspense fallback={…}>` | Multiple independent data sources on one page |

---

## 4. Light `page.tsx` and layout

### Rule

`page.tsx` and segment `layout.tsx` contain **only fast operations**:

- `await params` / `await searchParams`
- Fast session check (`auth()` from JWT — OK when no heavy DB in jwt callback)
- Redirect / `notFound`
- Static shell markup

Anything slower than ~5–10 ms (Prisma, external APIs) → **child async Server Components** behind `<Suspense>`, preferably in `*.server.tsx` or `*-content.server.tsx` siblings.

### Bad — blocks shell

```tsx
// ❌ page.tsx — waits for all data before first chunk
export default async function ClientBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const { id } = await params
  const booking = await getBookingDetail(session.user.id, id) // blocks shell
  return <BookingDetailView booking={booking} />
}
```

### Good — shell immediately, data streams

```tsx
// ✅ page.tsx — fast checks + shell; heavy work in child
import { Suspense } from 'react'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { BookingDetailContent } from './_components/booking-detail-content.server'
import { BookingDetailSkeleton } from './_components/booking-detail-skeleton'

export default async function ClientBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const { id } = await params
  if (!isUuid(id)) notFound()

  return (
    <Suspense fallback={<BookingDetailSkeleton />}>
      <BookingDetailContent userId={session.user.id} bookingId={id} />
    </Suspense>
  )
}
```

Data fetching lives in `booking-detail-content.server.tsx` via DAL `apps/web/src/data/**` with `import 'server-only'`.

---

## 5. Independent regions behind Suspense

### Rule

Each UI region backed by **its own** data source → separate `<Suspense>` boundary. Independent blocks must not block each other.

| Situation | Action |
|-----------|--------|
| Two+ independent Prisma queries on one page | Two Suspense boundaries, separate async children |
| One fast + one slow query | Fast may stay in shell; slow behind Suspense |
| One atomic query (single entity) | One Suspense is enough; `Promise.all` inside the child if needed |

### Parallel queries in one component

When several queries are needed **inside one** async child, start them in parallel:

```tsx
// ✅ Parallel in one async component
async function ClientBookingsContent({ userId }: { userId: string }) {
  const [upcoming, past] = await Promise.all([
    getUpcomingBookings(userId),
    getPastBookings(userId),
  ])
  return <BookingsTabs upcoming={upcoming} past={past} />
}
```

```tsx
// ❌ Sequential waterfall — second query waits for first
async function ClientBookingsContent({ userId }: { userId: string }) {
  const upcoming = await getUpcomingBookings(userId)
  const past = await getPastBookings(userId)
  return <BookingsTabs upcoming={upcoming} past={past} />
}
```

> **⚠️ `Promise.all` caveat:** if one query fails, all fail. For **logically independent UI regions** (upcoming list vs past list), prefer **separate Suspense** + separate `error.tsx` so each region degrades independently. Use `Promise.all` only when data is **atomically linked** (cannot render without all results).

### Nested vs sibling Suspense

**False hierarchy** — ID already in `params`; nesting adds visual waterfall without real dependency:

```tsx
// ❌ trainerId from params — nesting is unnecessary
export default async function TrainerProfilePage({ params }) {
  const { id } = await params
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <TrainerProfile id={id} />
      <Suspense fallback={<ReviewsSkeleton />}>
        <TrainerReviews trainerId={id} />
      </Suspense>
    </Suspense>
  )
}

// ✅ Parallel independent boundaries
export default async function TrainerProfilePage({ params }) {
  const { id } = await params
  return (
    <div>
      <Suspense fallback={<ProfileSkeleton />}>
        <TrainerProfile id={id} />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <TrainerReviews trainerId={id} />
      </Suspense>
    </div>
  )
}
```

**Justified nesting** — child needs a value only available after parent DB read:

```tsx
async function TrainerProfile({ id }: { id: string }) {
  const trainer = await getTrainerProfile(id)
  return (
    <>
      <ProfileHeader trainer={trainer} />
      <Suspense fallback={<ServicesSkeleton />}>
        {/* servicesGroupId not in params — real dependency */}
        <TrainerServices groupId={trainer.servicesGroupId} />
      </Suspense>
    </>
  )
}
```

---

## 6. `auth()` cost and request dedup

### Context (Pulse)

Root `layout.tsx` may `await auth()` for session-aware chrome (nav, role). Pulse uses **JWT sessions** (Auth.js v5, Credentials) — see [ADR-003](../../prds/07_governance/adr_003_auth_credentials_jwt_rbac.md).

Typical JWT `auth()`:

- Cookie read: ~0.1 ms
- JWT verify: ~1–3 ms
- **Total: usually < 5 ms**

Worst-case: jwt callback hits DB on token refresh (e.g. hourly `maxAge`) — one extra Prisma round-trip to Neon.

### Rule

```
auth() in root layout — acceptable when:
  ✅ jwt() callback has no heavy DB on every call
  ✅ DB in jwt() only on real token refresh (not every request)
  ✅ Layout does not run additional Prisma queries beyond auth()
  ✅ Session result is not used for heavy DB work in layout
```

Perimeter auth in **`proxy.ts`** uses `auth.config.ts` only (no Prisma). Server `auth()` in RSC/Actions uses full `auth.ts` — see [`ai_auth_implementation_guide.md`](../auth/ai_auth_implementation_guide.md).

### React `cache()` — dedup within one request

When `auth()` or session-derived reads are needed in **multiple** RSC nodes, wrap in `cache()` so work runs once per HTTP request:

```tsx
import { cache } from 'react'
import { auth } from '@/auth'

export const getRequestCachedAuth = cache(async () => {
  return await auth()
})
```

Colocate cached auth helpers in `apps/web/src/lib/auth/` (e.g. `request-cache.ts`) when implementing product routes — extend existing modules, do not duplicate.

### Future (not MVP): non-blocking session promise

If profiling shows `auth()` as TTFB bottleneck, pass a promise without `await` in layout and resolve in a client boundary. Requires AppShell refactor — **only after measurement**.

---

## 7. Eliminating DB waterfalls

**DB waterfall** — sequential `await` chain where each query waits for the previous, though data is independent.

### Diagnosis

```tsx
// ❌ Waterfall: latency ≈ sum of all queries
const prisma = getPrisma()
const user = await prisma.user.findUnique({ where: { id: userId } })
const bookings = await prisma.booking.findMany({ where: { clientId: userId } })
const wishlist = await prisma.wishlistEntry.findMany({ where: { userId } })
```

### Fix

```tsx
// ✅ Parallel: latency ≈ max(query latencies)
const prisma = getPrisma()
const [user, bookings, wishlist] = await Promise.all([
  prisma.user.findUnique({ where: { id: userId } }),
  prisma.booking.findMany({ where: { clientId: userId } }),
  prisma.wishlistEntry.findMany({ where: { userId } }),
])
```

### Hidden waterfall through Suspense

```tsx
// ❌ Child query starts only after parent resolves
async function ParentContent({ userId }) {
  const user = await getUser(userId)
  return <ChildContent trainerId={user.favoriteTrainerId} />
}

// ✅ Prefer parallel start or independent Suspense if trainerId is known from params/session
```

Use `@pulse/db` / `getPrisma()` from DAL — **never** ad-hoc `@/lib/db`. Queries live in `apps/web/src/data/**`.

---

## 8. Query caching — React `cache()` vs `'use cache'`

Next.js 16 replaces **`unstable_cache()`** with the **`'use cache'`** directive. **Do not add new `unstable_cache` calls** in Pulse — use `'use cache'` + `cacheTag()` + `cacheLife()`.

Enable Cache Components and Partial Prefetching when implementing cross-request cached reads / Instant Navigations:

```ts
// apps/web/next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
}

export default nextConfig
```

Verify against Context7 `/vercel/next.js` — [Cache Components](https://nextjs.org/docs/app/getting-started/cache-components), [`use cache`](https://nextjs.org/docs/app/api-reference/directives/use-cache), [Instant navigation](https://nextjs.org/docs/app/guides/instant-navigation), [Adopting Partial Prefetching](https://nextjs.org/docs/app/guides/adopting-partial-prefetching).

| Layer | API | Scope | Use for |
|-------|-----|-------|---------|
| **Per-request dedup** | React `cache()` | Single HTTP request | `auth()`, repeated Prisma reads in one RSC tree |
| **Cross-request cache** | `'use cache'` + `cacheTag()` + `cacheLife()` | Between requests / deploy-aware | Public catalog, trainer profile static slice |
| **Fresh per request** | No cross-request cache | Always live | Bookings, slot availability, auth-gated mutable data |

### React `cache()` — per-request dedup

Wrap expensive read functions so they **do not run twice** in one RSC tree:

```tsx
import { cache } from 'react'
import { getPrisma } from '@pulse/db'

export const cachedLoadTrainerServices = cache(async (trainerProfileId: string) => {
  const prisma = getPrisma()
  return prisma.service.findMany({
    where: { trainerProfileId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
})
```

Colocate role- or domain-specific cached loaders in `apps/web/src/lib/**` or `src/data/**` — one module per concern, no scatter.

### `'use cache'` — cross-request cache (Next.js 16)

Colocate cached read functions in `src/data/**` with `import 'server-only'`. Tag names **must** match [`cache_revalidation_policy.md`](../../prds/05_runtime/cache_revalidation_policy.md).

```tsx
import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { getPrisma } from '@pulse/db'

/** Public approved trainer catalog — cross-request cache. */
export async function getCachedTrainersCatalog() {
  'use cache'
  cacheTag('trainers:catalog')
  cacheLife('minutes') // or cacheLife({ revalidate: 60 }) — safety TTL; mutations use updateTag

  const prisma = getPrisma()
  return prisma.trainerProfile.findMany({
    where: { status: 'approved' },
    select: { id: true, displayName: true, headline: true, avatarUrl: true },
    orderBy: { displayName: 'asc' },
  })
}

/** Per-trainer public slice — tag includes id (replaces unstable_cache keyParts). */
export async function getCachedTrainerPublicProfile(trainerId: string) {
  'use cache'
  cacheTag('trainers:catalog', `trainer:${trainerId}`)
  cacheLife('minutes')

  const prisma = getPrisma()
  return prisma.trainerProfile.findUnique({
    where: { id: trainerId, status: 'approved' },
    /* … public select … */
  })
}
```

After mutation in a Server Action:

```tsx
'use server'

import { updateTag } from 'next/cache'

export async function approveTrainerAction(trainerId: string) {
  // … policy → domain → db …
  updateTag('admin:trainers:pending')
  updateTag('trainers:catalog')
  updateTag(`trainer:${trainerId}`)
}
```

### `'use cache'` rules

- **No `unstable_cache` in new code** — migrate existing call sites to `'use cache'` when touched.
- **Tags** — `cacheTag(...)` inside the function; strings **must** match the tag registry in `cache_revalidation_policy.md`.
- **Lifetime** — `cacheLife('minutes' | 'hours' | …)` or `cacheLife({ revalidate: N })`; deploy still busts caches — **`updateTag` after mutations is primary**.
- **Cache keys** — automatic from function id + serializable arguments (no manual `keyParts`).
- **Never cache authorization** — verify session on every read path; cache is a performance layer only.
- **Runtime APIs** — **cannot** call `cookies()`, `headers()`, or `searchParams` inside `'use cache'`. Extract values **outside**, pass as arguments (they become part of the cache key):

```tsx
// ❌ cookies() inside use cache
async function CachedWishlist() {
  'use cache'
  const session = (await cookies()).get('session') // Error
}

// ✅ pass userId from dynamic parent (Suspense child or page shell)
async function ClientWishlistPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')
  return (
    <Suspense fallback={<WishlistSkeleton />}>
      <CachedWishlist userId={session.user.id} />
    </Suspense>
  )
}

async function CachedWishlist({ userId }: { userId: string }) {
  'use cache'
  cacheTag(`wishlist:${userId}`)
  cacheLife('minutes')
  return loadWishlist(userId)
}
```

For compliance-only cases where refactor is blocked, **`'use cache: private'`** may allow runtime APIs — prefer explicit arguments (see Next.js 16 docs).

### What to cache (Pulse MVP)

| Data | Strategy | Invalidation |
|------|----------|--------------|
| Session / auth (same request) | React `cache()` | automatic per request |
| Repeated reads on one page (role guards) | React `cache()` | automatic per request |
| Public trainer catalog | `'use cache'` + `trainers:catalog` | `updateTag('trainers:catalog')` on admin approve |
| Trainer profile public slice | `'use cache'` + `trainer:{id}` | service/schedule/profile mutations |
| Client bookings list | `'use cache'` + `bookings:client:{userId}` | create/cancel booking |
| Live booking status, slot availability | **no** cross-request cache | Suspense + fresh read or RSC refresh after mutation |

**Vercel note:** deploy invalidates Full Route Cache / Data Cache. `updateTag` / `revalidateTag` after mutations is the primary freshness mechanism; `cacheLife` TTL is a safety net.

### 8.1 Instant Navigations & Partial Prefetching

Next.js **16.3** Instant Navigations = **Cache Components** + **Partial Prefetching** ([guide](https://nextjs.org/docs/app/guides/instant-navigation)).

| Concept | Pulse rule |
|---------|------------|
| **`partialPrefetching: true`** | Required after `next@16.3.0` bump (ADR-002 §5.1). Default `<Link>` warms a reusable **App Shell** per route — not a full page per link. |
| **Adoption** | [Adopting Partial Prefetching](https://nextjs.org/docs/app/guides/adopting-partial-prefetching): audit `prefetch={true}` / `router.prefetch` → temporary `export const prefetch = 'partial'` if needed → enable flag → `npx @next/codemod@latest remove-partial-prefetch`. Pulse has no `prefetch={true}` today — global flag is on; verify Instant Insights in `next dev` when changing navigation-heavy routes. |
| **`<Link prefetch={true}>`** | Intentional **deeper** per-link prefetch only (URL data / cached content). Requires Suspense / `'use cache'` behind URL reads. |
| **Instant routes** | Prefer Suspense streaming and/or `'use cache'` so the shared shell paints immediately. |
| **`export const instant = false`** | Opt out of instant validation **only with documented reason** — not the default. |
| **Prefetch in prod** | Prefetch behavior is production-oriented; confirm shells under `next start` / Vercel preview, not only `next dev`. |

---

## 9. Neon: cold start and connection

Neon is serverless PostgreSQL. Suspended compute adds **~300–1000 ms** to the first query after idle — main DB source of worst-case latency.

### Measures

**1. Pooled `DATABASE_URL` — mandatory for runtime**

```env
# Pooled — -pooler in hostname (app runtime)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"

# Direct — migrations/seed CLI only
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

See [`neon_prisma_migrations_guide.md`](../../implementation/mvp/guides/neon_prisma_migrations_guide.md) and [`migration_runbook.md`](../../prds/06_operations/migration_runbook.md).

**2. Suspend timeout** — tune in Neon Console for production traffic patterns.

**3. Transient errors (P1001)** — wrap critical read paths with retry when implementing auth/DB hot paths (pattern: small helper in `apps/web/src/lib/db/` — add when `@pulse/db` lands in P01+).

**4. Streaming shell as UX buffer** — even on cold start, user sees nav and skeletons immediately; DB latency hides behind visible fallbacks, not a blank screen.

---

## 10. `loading.tsx` as navigation insurance

`loading.tsx` shows **immediately on client navigation** while the first RSC chunk of the new segment is pending.

### When required

Every `page.tsx` segment that runs server-side data work (Prisma, slow I/O) **must** have colocated `loading.tsx`, unless [§18](#18-documented-exceptions) applies.

```
app/
├── trainers/
│   ├── page.tsx
│   └── loading.tsx          ← required for catalog
├── client/
│   └── bookings/
│       ├── page.tsx
│       └── loading.tsx      ← required
```

Auth/session alone does **not** require `loading.tsx`; add it when the page fetches DB data.

### Content

Reproduce **page chrome** (container, vertical rhythm) with `<Skeleton />` — not a generic full-page spinner. Use `Container` from `@/components/ui/container` and skeleton shapes from [`ui_states_contract.md`](../../design/ui_states_contract.md) S1.

Reuse the same skeleton component in `loading.tsx` and Suspense fallback when they represent the **same** layout.

---

## 11. Skeletons without CLS

**CLS (Cumulative Layout Shift)** — layout jump when skeleton replaces real content. Target **< 0.1** in production (Core Web Vitals).

### Rules

1. **Match dimensions** — skeleton `h-*` / `w-*` ≈ final content (cards, KPI rows, table rows).
2. **Match structure** — header + N body lines + CTA → same block count in skeleton.
3. **Fixed wrappers** — use `min-h-*` on containers when height is predictable.
4. **One component per file** — shared skeletons as named exports per **react-one-component-per-file**.
5. **Catalog primitive** — `<Skeleton />` from `@/components/ui/skeleton`, not bare pulsing divs.

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export function TrainerCardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex justify-end pt-2">
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  )
}
```

Wireframe matrix: [`ui_states_contract.md`](../../design/ui_states_contract.md) — per-route skeleton shapes.

---

## 12. Error handling near data

`<Suspense>` handles **waiting**, not **errors**. Use `error.tsx` for recoverable segment failures.

### Rule

Every segment with async server data **must** have `error.tsx` (colocated or inherited from parent). Copy from `@/lib/messages`; use `Button` from catalog — not raw `<button>`.

```tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { messages } from '@/lib/messages'

export default function ClientBookingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[client/bookings]', error)
  }, [error])

  return (
    <Container>
      <div className="flex max-w-lg flex-col gap-4 py-8">
        <p className="text-sm text-destructive">{messages.client.bookings.loadError}</p>
        <Button type="button" onClick={() => reset()}>
          {messages.common.segmentError.retry}
        </Button>
      </div>
    </Container>
  )
}
```

| Segment type | loading.tsx | error.tsx |
|--------------|-------------|-----------|
| Data-heavy product route | colocated or inherited | colocated or parent |
| Redirect-only auth gate | optional | optional |
| Multiple Suspense regions | per-page or segment | per segment or region-specific parent |

Independent Suspense regions **should** pair with error boundaries when partial failure is acceptable (catalog grid fails, filters still work).

### 12.1 `catchError` (component-level)

Stable in Next.js **16.3** — [`catchError`](https://nextjs.org/docs/app/api-reference/functions/catchError) from `next/error` creates a programmatic error boundary (alternative to file-convention `error.tsx` for **component** trees).

| Use | Prefer |
|-----|--------|
| Route segment failure | Colocated **`error.tsx`** (canon) |
| Finer recovery inside a page (one Suspense region) | **`catchError(fallback)`** — fallback must be Client Component / `'use client'` module |
| Recover after failure | Prefer **`retry()`** (re-fetch children) over **`reset()`** |
| `notFound()` / `redirect()` | Must not be swallowed — `catchError` is designed not to interfere |

Do not invent ad-hoc client boundaries that duplicate catalog/`error.tsx` without need.

```tsx
'use client'

import { catchError, type ErrorInfo } from 'next/error'
import { Button } from '@/components/ui/button'
import { messages } from '@/lib/messages'

function RegionErrorFallback(
  props: { title: string },
  { error, retry }: ErrorInfo,
) {
  return (
    <div className="flex flex-col gap-2 py-4">
      <p className="text-sm text-destructive">{props.title}</p>
      <p className="text-xs text-muted-foreground">{error.message}</p>
      <Button type="button" size="sm" onClick={() => retry()}>
        {messages.common.segmentError.retry}
      </Button>
    </div>
  )
}

export const RegionErrorBoundary = catchError(RegionErrorFallback)
```

---

## 13. Mutation loading vs route loading

| Type | Mechanism |
|------|-----------|
| **Route navigation** | `loading.tsx`, Suspense fallbacks |
| **Form/button mutation** | `useTransition` / `useActionState` — [ai_form_handling_pattern.md](../react/ai_form_handling_pattern.md) §4 |

Do not use route skeletons for button pending states. See **ui-mutation-pending** and **ui-toast-mutations** cursor rules.

---

## 14. Pulse route examples

| Route | Pattern |
|-------|---------|
| `/trainers` | Filter shell + Suspense trainer grid; catalog tag `trainers:catalog` |
| `/trainers/[id]` | Profile + reviews + schedule — sibling Suspense per tab region |
| `/client/bookings` | Upcoming / past — two Suspense regions |
| `/client/bookings/[id]` | Detail shell + Suspense content |
| `/trainer/dashboard` | KPI shell + Suspense upcoming sessions |
| `/trainer/schedule` | Grid shell + Suspense slot data |
| `/admin/trainers/pending` | `loading.tsx` + table Suspense |
| `/book/[trainerId]` | Wizard steps — Suspense per step data (services, slots) |

---

## 15. Metrics and budgets

| Metric | Good | Acceptable | Poor | Pulse levers |
|--------|------|------------|------|--------------|
| **TTFB** (warm) | < 200 ms | < 500 ms | > 800 ms | heavy layout, blocking `page.tsx` |
| **TTFB** (Neon cold) | < 600 ms | < 1000 ms | > 1800 ms | cold start; streaming shell masks UX |
| **FCP** | < 1.8 s | < 3 s | > 3 s | first RSC chunk, shell weight |
| **LCP** | < 2.5 s | < 4 s | > 4 s | main content Suspense boundary |
| **CLS** | < 0.1 | < 0.25 | > 0.25 | skeleton vs real layout (§11) |
| **INP** | < 200 ms | < 500 ms | > 500 ms | client hydration, not route loading |

### When optimizing

1. **TTFB > 500 ms warm** — inspect `auth()` in layout, blocking awaits in `page.tsx`.
2. **TTFB > 1000 ms** — likely Neon cold start; check pooler URL and suspend timeout.
3. **High FCP** — heavy top-level `await` in `page.tsx`.
4. **High LCP** — main content behind wrong Suspense boundary.
5. **High CLS** — skeleton dimensions vs final UI.

Optional: `useReportWebVitals` from `next/web-vitals` or Sentry (post-MVP instrumentation).

---

## 16. AI assistant checklist (mandatory)

Run before finishing any `page.tsx`, segment `layout.tsx`, or colocated `loading.tsx`.

### A. Structure

- [ ] `page.tsx` — only `await params` / `searchParams`, fast `auth()`, redirect, JSX shell
- [ ] No heavy Prisma / slow I/O in `page.tsx` or segment layout — data in `*.server.tsx` or `src/data/**` behind `<Suspense>`
- [ ] Each independent DB-backed UI region — own `<Suspense fallback={<RegionSkeleton />}>`
- [ ] Each heavy async child — separate file (`*.server.tsx` or clear `*-content.server.tsx` name)

### B. Parallelism

- [ ] Independent queries in one component — `Promise.all`, not sequential `await`
- [ ] No hidden waterfalls: child Suspense does not wait for parent without real data dependency
- [ ] Independent UI regions — separate Suspense (not one `Promise.all` that fails entirely)

### C. Cache

- [ ] Repeated reads in one request — React `cache()` or shared cached loader
- [ ] Cross-request public reads — **`'use cache'`** + `cacheTag()` + `cacheLife()` per [`cache_revalidation_policy.md`](../../prds/05_runtime/cache_revalidation_policy.md) — **not** `unstable_cache`
- [ ] `cacheComponents: true` and `partialPrefetching: true` in `next.config.ts`
- [ ] Instant routes use Suspense / `'use cache'`; no casual `export const instant = false`
- [ ] No `cookies()` / `headers()` inside `'use cache'` — pass values as arguments from dynamic parent
- [ ] Mutations call matching `updateTag` — no stale catalog/bookings after write
- [ ] `<Link prefetch={true}>` only for intentional deeper prefetch (not legacy full-page habit)

### D. `loading.tsx`, `error.tsx`, and `catchError`

- [ ] Data-heavy segment — colocated `loading.tsx` (or documented §18 exception)
- [ ] Segment covered by `error.tsx` (own or parent)
- [ ] Component-level recovery — `catchError` + prefer `retry()` when segment boundary is too coarse
- [ ] No duplicate full-page loading UI (`loading.tsx` + identical outer Suspense)

### E. Skeletons & Neon

- [ ] Skeletons structurally match content (CLS target < 0.1)
- [ ] `@/components/ui/skeleton` — not bare div pulse
- [ ] One skeleton component per file when shared
- [ ] Runtime uses pooled `DATABASE_URL` (`-pooler` hostname)

Verify on **Vercel preview** when available.

---

## 17. Anti-patterns

| Anti-pattern | Why bad | Fix |
|--------------|---------|-----|
| `await prisma.*` at top of `page.tsx` | Blocks first RSC chunk | Child async component + Suspense |
| One `Promise.all` of all page queries in `page.tsx` | Blocks shell even if fast | Independent Suspense regions |
| `Promise.all` for independent UI regions | One failure kills whole block | Separate Suspense + `error.tsx` each |
| Duplicate session reads without `cache()` | N× JWT work per request | `cache()` wrapper |
| `loading.tsx` — spinner only, no chrome | Poor UX, CLS | Page-shaped skeleton |
| `loading.tsx` + Suspense fallback for same surface | Duplication | Pick segment vs region |
| No `error.tsx` with async data | Unhandled throw crashes segment | Add colocated `error.tsx` |
| Sequential independent Prisma calls | DB waterfall | `Promise.all` or split Suspense |
| Direct Prisma in `page.tsx` | Breaks DAL contract | `src/data/**` + `server-only` |
| False nested Suspense (ID in params) | Visual waterfall | Sibling Suspense boundaries |
| Caching authorization decisions | Security drift | Auth on every read path |
| New code using `unstable_cache` | Legacy Next 15 API | `'use cache'` + `cacheTag()` + `cacheLife()` |
| `cookies()` inside `'use cache'` | Build/runtime error or wrong cache key | Pass session/user id as argument from parent |
| Route skeleton for mutation pending | Wrong UX layer | `useTransition` + pending UI |
| Blind `prefetch={true}` under Partial Prefetching | Unexpected server work / wrong mental model | App Shell default; deeper prefetch only when intentional |
| Casual `export const instant = false` | Disables Instant Insights without reason | Fix Suspense/`'use cache'` or document blocking need |

---

## 18. Documented exceptions

State briefly in PR/task which exception applies:

| Exception | When |
|-----------|------|
| **Redirect-only** | `page.tsx` only checks session and `redirect()` — no slow-dependent UI |
| **Single bounded query** | One fast `findUnique`, no other independent slow regions |
| **Inherited loading** | Parent `loading.tsx` matches chrome; page uses Suspense for regions |
| **Client-only data** | Region loaded via client fetch after paint — document tradeoff vs RSC streaming |

---

## 19. Cross-references

| Document | Topic |
|----------|-------|
| [`cache_revalidation_policy.md`](../../prds/05_runtime/cache_revalidation_policy.md) | Tag registry, `updateTag` after mutations |
| [`ui_states_contract.md`](../../design/ui_states_contract.md) | Empty/loading/error matrix per route |
| [`ai_auth_implementation_guide.md`](../auth/ai_auth_implementation_guide.md) | JWT, `proxy.ts`, split config |
| [`ai_nextjs_db_data_handle.md`](./ai_nextjs_db_data_handle.md) | DAL, Server Actions vs Route Handlers |
| [`neon_prisma_migrations_guide.md`](../../implementation/mvp/guides/neon_prisma_migrations_guide.md) | Pooler vs direct URLs |
| [`ai_vercel_runtime_compatibility.md`](./ai_vercel_runtime_compatibility.md) | Vercel streaming baseline |
| [Next.js: Loading UI and Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming) | Official API |
| [Next.js: Error Handling](https://nextjs.org/docs/app/getting-started/error-handling) | `error.tsx`, `reset` / `retry` |
| [Next.js: `catchError`](https://nextjs.org/docs/app/api-reference/functions/catchError) | Component-level error boundary |
| [Next.js: Instant navigation](https://nextjs.org/docs/app/guides/instant-navigation) | Instant Navigations suite |
| [Next.js: Adopting Partial Prefetching](https://nextjs.org/docs/app/guides/adopting-partial-prefetching) | `partialPrefetching`, App Shell |
| [Next.js: `use cache`](https://nextjs.org/docs/app/api-reference/directives/use-cache) | Cross-request cache directive (replaces `unstable_cache`) |
| [Next.js: Cache Components](https://nextjs.org/docs/app/getting-started/cache-components) | `cacheComponents`, static + cached + dynamic mix |
| lampto [`ai_page_performance_streaming.md`](../../examples/lampto/docs/guidelines/nextjs/ai_page_performance_streaming.md) | Source reference (BSFY) |

---

**Version:** 2.2  
**Last updated:** August 2026  
**Next.js:** 16.3.0 · **Hosting:** Vercel · **Cross-request cache:** `'use cache'` · **Instant Navigations:** `partialPrefetching: true`
