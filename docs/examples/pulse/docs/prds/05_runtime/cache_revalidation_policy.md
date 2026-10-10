# Cache & Revalidation Policy — Pulse MVP

**Тип:** PRD  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W5  
**Зависит от:** [`adr_002_next162_vercel_runtime_policy.md`](../07_governance/adr_002_next162_vercel_runtime_policy.md), [`ai_loading_patterns.md`](../../guidelines/nextjs/ai_loading_patterns.md)  
**Связанные документы:** [`backend_requirements.md`](./backend_requirements.md)

---

## Purpose

Политика **кэширования и инвалидации** Pulse на Next.js 16.3.0: **`'use cache'`** + `cacheTag()` / `cacheLife()` для cross-request reads; `updateTag`, `revalidateTag`, `revalidatePath` после мутаций; tag naming; drift guards ([`domain_invariants.md`](../02_domain_model/domain_invariants.md) INV-03 catalog approval).

**Instant Navigations (16.3)** опираются на те же границы: Suspense + `'use cache'` формируют reusable App Shell при `partialPrefetching: true` ([ADR-002](../07_governance/adr_002_next162_vercel_runtime_policy.md) §5.1).

Context7 verified (`/vercel/next.js`): Server Actions use `updateTag` for read-your-own-writes; `revalidatePath` for route-scoped refresh; combine with tags for cross-route consistency.

---

## Scope / Out of scope

**In scope:** App Router cache tags, **`'use cache'`** read functions with `cacheTag()` / `cacheLife()`, post-mutation invalidation, public catalog caching strategy, stale trainer approval guard.

**Out of scope:** CDN edge config detail, full PPR layout composition recipes, client-side SWR libraries.

**Legacy:** Do **not** introduce new **`unstable_cache()`** — Next.js 16 uses the **`'use cache'`** directive ([`ai_loading_patterns.md`](../../guidelines/nextjs/ai_loading_patterns.md) §8).

---

## Definitions

| API | Semantics (Next.js 16) | Primary use in Pulse |
|-----|------------------------|----------------------|
| **`'use cache'`** | Cross-request function/component cache (replaces `unstable_cache`) | Public catalog, trainer profile reads in `src/data/**` |
| **`cacheTag(tag)`** | Tag cached `'use cache'` output | Inside cached read functions — must match tag registry below |
| **`cacheLife(profile \| opts)`** | TTL / revalidate for `'use cache'` | Safety net; `updateTag` after mutations is primary |
| **`updateTag(tag)`** | Next request waits for fresh tagged data | Server Actions after own mutation |
| **`revalidateTag(tag)`** | Stale-while-revalidate for tagged data | Route Handlers, background refresh |
| **`revalidatePath(path)`** | Invalidate specific route segment | Redirect targets, layout-scoped lists |

**Config:** `cacheComponents: true` and **`partialPrefetching: true`** in `apps/web/next.config.ts` when using `'use cache'` / Instant Navigations (see [`ai_loading_patterns.md`](../../guidelines/nextjs/ai_loading_patterns.md) §8).

**MUST NOT** use `unstable_after` for cache/email side effects ([ADR-002](../07_governance/adr_002_next162_vercel_runtime_policy.md)). **MUST NOT** add new **`unstable_cache()`** — use **`'use cache'`** instead.

---

## Tag registry (MVP)

| Tag | Data scope | Invalidated when |
|-----|------------|------------------|
| `trainers:catalog` | Public approved trainer list | Admin approve/reject trainer; trainer profile public fields |
| `trainer:{trainerId}` | Public profile, services, slots | Service CRUD, schedule change, profile edit, approval |
| `bookings:client:{userId}` | Client booking lists | Create/cancel booking |
| `bookings:trainer:{trainerProfileId}` | Trainer schedule bookings | Booking lifecycle |
| `booking:{bookingId}` | Single booking detail | Status transitions |
| `wishlist:{userId}` | Client wishlist | Toggle wishlist |
| `admin:trainers:pending` | Verification queue | Submit/approve/reject |
| `admin:reviews` | Moderation queue | Review publish/hide/delete |
| `admin:complaints` | Complaints list | Complaint status change |

Naming: lowercase, `:` separator, IDs are UUID strings.

---

## Policy by flow

### Public catalog (`/trainers`)

| Aspect | Policy |
|--------|--------|
| Read | **MAY** cache tagged `trainers:catalog` with short TTL or on-demand revalidation |
| Filter/search | Same tag or untagged dynamic `searchParams` — prefer dynamic segment without over-caching filtered queries on MVP |
| Mutation trigger | `ApproveTrainer`, `RejectTrainer`, public profile publish |

**MUST** — after admin approval, call `updateTag('trainers:catalog')` + `updateTag('trainer:{id}')` in same Action.

### Trainer public profile (`/trainers/[id]`)

- Tag: `trainer:{id}`
- Invalidate on: service toggle, schedule, bio/photo, approval status

### Client bookings

- After `CreateBooking`: `updateTag('bookings:client:{userId}')`, `updateTag('booking:{id}')`, `updateTag('trainer:{trainerId}')` (slot taken)
- After `CancelBooking`: same set

### Wishlist (optimistic UI)

- Server success: `updateTag('wishlist:{userId}')` optional if list page cached
- Optimistic rollback on error — no cache update

### Admin queues

- Approve trainer: `updateTag('admin:trainers:pending')` + catalog tags

---

## Happy path

```typescript
'use server'

import { updateTag, revalidatePath } from 'next/cache'

export async function approveTrainerAction(trainerId: string) {
  // ... policy → domain → db
  updateTag('admin:trainers:pending')
  updateTag('trainers:catalog')
  updateTag(`trainer:${trainerId}`)
  revalidatePath('/admin/trainers')
  revalidatePath(`/trainers/${trainerId}`)
}
```

User sees approved trainer on next navigation without stale catalog ([INV-03](../02_domain_model/domain_invariants.md) drift guard).

---

## Negative paths

| Scenario | Policy |
|----------|--------|
| Mutation failed | **MUST NOT** revalidate tags |
| Partial transaction rollback | No tag updates |
| Read after write same Action | Prefer `updateTag` over `revalidatePath` alone for RSC children |

---

## Security paths

- Tags with user IDs (`bookings:client:{userId}`) **MUST** only be invalidated from Actions that verified session owns that userId.
- **MUST NOT** expose tag names as public API.
- Admin tags require admin role on mutating Action.

---

## Concurrency notes

- Cache invalidation does not replace transactional consistency — FM-001 overlap still domain-level.
- Two admins approve same trainer: one DB win; both Actions may revalidate — idempotent tag bump acceptable.

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Stale approved trainer in catalog | Mandatory tags on ApproveTrainer |
| Forgot tag on schedule change | Checklist in booking/schedule contracts W8 |
| Over-revalidate entire site | Prefer granular tags |
| Cached pending trainer visible | Catalog query filter + tag bust on approval |

Pair with [`ai_loading_patterns.md`](../../guidelines/nextjs/ai_loading_patterns.md): route loading via Suspense; streaming shell and page performance (§4–§16); cache separate from mutation pending UI.

---

## Requirements

1. **MUST** — every Server Action that mutates listed entities calls appropriate `updateTag` (or documents exception).
2. **MUST** — use `updateTag` in Actions for read-your-own-writes after redirect.
3. **SHOULD** — `revalidatePath` on redirect destination when page not tag-based.
4. **MAY** — `revalidateTag` in Route Handlers for webhook/cron (post-MVP).
5. **MUST NOT** — rely on cache for authorization — always server auth on read.

---

## Static vs dynamic routes

| Route | Default |
|-------|---------|
| `/`, `/auth/*` | Dynamic (session-aware chrome) |
| `/trainers` | Dynamic or tagged cache |
| `/trainers/[id]` | Dynamic + tags |
| `/client/*`, `/trainer/*`, `/admin/*` | Dynamic — user-specific |

---

## Acceptance criteria

- [ ] Tag registry covers MVP hot paths
- [ ] updateTag vs revalidateTag vs revalidatePath policy clear
- [ ] ApproveTrainer invalidates catalog (INV-03 drift)
- [ ] ADR-002 and loading patterns linked
- [ ] Security note on user-scoped tags
- [ ] Context7 Next.js 16 API referenced

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_002_next162_vercel_runtime_policy.md`](../07_governance/adr_002_next162_vercel_runtime_policy.md) | Cache ADR |
| [`ai_loading_patterns.md`](../../guidelines/nextjs/ai_loading_patterns.md) | Loading vs cache |
| [`backend_requirements.md`](./backend_requirements.md) | Handler types |
| [`../02_domain_model/domain_invariants.md`](../02_domain_model/domain_invariants.md) | Catalog invariants |
| [`../../implementation/mvp/contracts/trainer_verification_contract.md`](../../implementation/mvp/contracts/trainer_verification_contract.md) | W8 approval |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W5-09

---

## Agent notes

- Context7: combine `revalidatePath('/blog')` + `updateTag('posts')` pattern for multi-surface updates.
- Read paths and tag mapping — see [`data_access_patterns.md`](../03_data_model/data_access_patterns.md).
- Tag functions colocate in `@/lib/cache/tags.ts` when implementing.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — MVP cache revalidation policy |
| 2026-05-23 | v1.1 — `'use cache'` / `cacheTag()` / `cacheLife()` in scope; `unstable_cache` legacy ban |
