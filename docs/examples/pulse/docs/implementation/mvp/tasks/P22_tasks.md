# P22 Tasks — Instant Navigations Adoption

**Тип:** Tasks  

**Статус:** Canonical  

**Версия:** 1.3  

**Дата:** 2026-08-11  

**Волна:** W25  

**Зависит от:** [`P22_phase_description.md`](../phases_tasks_descriptions/P22_phase_description.md)  

**Связанные документы:** [`instant_navigations_adoption_spec.md`](../specs/instant_navigations_adoption_spec.md), [ADR-002](../../../prds/07_governance/adr_002_next162_vercel_runtime_policy.md), [`ai_loading_patterns.md`](../../../guidelines/nextjs/ai_loading_patterns.md)

---

## Purpose

Чеклист **P22** — composition adoption Instant Navigations (Next.js 16.3) после включённого `cacheComponents` + `partialPrefetching`: Gate docs/pin → P0 App Shell → hub coverage → `catchError` / prefetch → verification.

---

## 0. Gate (A1–A5 + pin)

- [x] Confirm `apps/web/package.json` pins `"next": "16.3.0"` (+ `@next/third-parties`, `eslint-config-next`); `npm ls next -w web` → `16.3.0`

- [x] Confirm `apps/web/next.config.ts` has `cacheComponents: true` and `partialPrefetching: true`

- [x] **A1** — bump high-precedence docs from `16.2.6` / Context7 `/v16.2.2` → `16.3.0` / `/vercel/next.js`:  

  `docs/meta/ai_first_project_methodology.md`, `docs/prds/01_product_scope/mvp_scope.md`, `docs/prds/05_runtime/README.md`, `docs/guidelines/auth/ai_auth_implementation_guide.md`, `docs/guidelines/react/README.md`, `docs/guidelines/react/ai_component_guidelines.md`, Context7 row in `docs/meta/documentation_creation_registry.md`  

  **A1 = только listed files;** residual `16.2.6` / `/v16.2.2` вне списка — **out of P22**.

- [x] **A2** — update user-facing stack in `apps/web/src/lib/messages/how-it-was-built-en.ts` and `how-it-was-built-ru.ts` → Next.js 16.3.0

- [x] **A3 / D4** — resolve nested `apps/web/package-lock.json` (prefer delete tracked nested lockfile; single root `package-lock.json`)

- [x] **A4** — rewrite ADR-002 Amend line (remove «Transition section removed») + sync Amend date with `adr_index.md` changelog → **2026-08-11**

- [x] **A5** — `ai_loading_patterns.md` §12.1 example uses `common.segmentError.retry` (or literal), not `messages.common.retry`

---

## 1. Book + discovery P0 (B1, B6, B7)

- [x] **B1** — `(booking)/book/[trainerId]/page.tsx`: move `getPublicTrainerProfile` (and dependent awaits) into Suspense child `*.server.tsx`; page shell sync

- [x] **B6** — `(discovery)/trainers/[id]/page.tsx`: wrap profile header/about/services in Suspense (reuse `'use cache'` DAL); keep reviews/schedule regions independent

- [x] **B7** — `(discovery)/trainers/page.tsx`: stream filter options (Suspense or cached shell) so grid is not blocked by top-level await

- [x] Skeletons match layout; no Design Lab imports in product routes

---

## 2. Client hub (B2, B4 + C client)

- [x] **B4** — `(client)/client/dashboard/page.tsx`: fast `auth()` + redirect sync on page OK; only `getClientNextSession` → Suspense; featured trainers remain independent

- [x] **B2** — `(client)/client/bookings/page.tsx`: split upcoming / past into separate Suspense regions (spec § / loading patterns §14)

- [x] `client/bookings/[id]/page.tsx`: avoid blocking access resolve on page top — async child + Suspense (segment loading already present)

- [x] `client/reviews/[bookingId]/page.tsx`: same pattern

- [x] Add missing **`loading.tsx`**: `client/profile`

- [x] Add missing **`error.tsx`**: `client/dashboard`, `client/profile`, `client/reviews/[bookingId]`

- [x] Root `app/error.tsx` — **skipped in P22** (не блокирует DoD)

- [x] P1 exceptions (если есть) — в PR description + Change log [`P22_phase_description.md`](../phases_tasks_descriptions/P22_phase_description.md); DoD «documented exception» = запись в Change log фазы

---

## 3. Trainer hub (B3 + C trainer)

- [x] **B3** — `(trainer)/trainer/dashboard/page.tsx`: snapshot behind Suspense; add colocated **`loading.tsx`** + **`error.tsx`**

- [x] Add **`loading.tsx`**: `trainer/clients`, `trainer/clients/[id]`, `trainer/income`, `trainer/profile`

- [x] Add **`error.tsx`**: `trainer/clients` (+ `[id]`), `trainer/income`, `trainer/profile`

- [x] `trainer/services/page.tsx`: move `getTrainerServicesForEdit` into Suspense child

- [x] `trainer/schedule`: ensure page-level Suspense around async editor child (not only segment `loading.tsx`)

---

## 4. Admin hub (B5 + C admin)

- [x] **B5** — `(admin)/admin/dashboard/page.tsx`: split KPI / queues into Suspense regions (no single top-level `getAdminDashboardData` blocking whole page)

- [x] Admin list pages (`trainers`, `complaints`, `reviews`): counts/tabs must not block list Suspense chrome

- [x] Admin detail `[id]` pages: access/detail fetch in Suspense child; keep existing `loading.tsx` / `error.tsx`

---

## 5. catchError + deeper prefetch (D1–D2)

- [x] **D1** — add at least one `catchError` + prefer `retry()` region (candidates: catalog grid, public profile region, dashboard KPI vs list); fallback Client Component; messages from `@/lib/messages`

- [x] **D2** — after P0: intentional `prefetch={true}` on hot CTAs only — landing browse → `/trainers`, trainer cards → `/trainers/[id]`, book CTAs → `/book/[trainerId]`

- [x] **MUST NOT** set `export const instant = false` without documented reason in PR / phase notes

- [x] **MUST NOT** treat `prefetch={true}` as legacy full-page default

---

## 6. Verification

- [x] **D3** — Instant Insights (`next dev`) on P0 routes — usable App Shell (`/`, `/trainers`, `/trainers/[id]` clean of `blocking-prerender-crypto` after auth/`connection()` shell fixes)

- [x] Manual smoke: happy path from [`P22_phase_description.md`](../phases_tasks_descriptions/P22_phase_description.md) — `/` → `/trainers` → `/trainers/[id]` paint; `/book/*` and `/client/dashboard` redirect unauthenticated to login

- [x] Negative: `catchError` + `retry()` wired on catalog grid (`CatalogGridRegionError`); segment `error.tsx` use `retry` (Auth.js/DB fault injection not run in this pass)

- [x] Security: no private data in `'use cache'`; auth gates unchanged

- [x] `npm run typecheck` (root / `apps/web`)

- [x] `npm run lint` (root — web + packages) — exit 1 only from pre-existing `ThemeToggle.client.tsx` (`react-hooks/set-state-in-effect`); P22 files clean

- [x] Leftover product-docs-alignment sweep for any new behavior (composition notes only if needed)

---

## Agent anti-patterns

- Growing `page.tsx` with more top-level awaits «for simplicity»

- Wrapping already-fetched data in empty Suspense (false streaming)

- `'use cache'` on client bookings / admin queues

- Importing `@/components/design-lab/**`

- Inventing mutation/error codes or retry copy outside `@pulse/domain` / `@/lib/messages`

---

## Related documents

| Document | Relationship |

|----------|--------------|

| [`P22_phase_description.md`](../phases_tasks_descriptions/P22_phase_description.md) | Phase |

| [`instant_navigations_adoption_spec.md`](../specs/instant_navigations_adoption_spec.md) | Spec + gap matrix |

| [`ai_loading_patterns.md`](../../../guidelines/nextjs/ai_loading_patterns.md) | Streaming canon |

| [ADR-002](../../../prds/07_governance/adr_002_next162_vercel_runtime_policy.md) | Runtime |

---

## Change log

| Date | Change |

|------|--------|

| 2026-08-11 | v1.3 — D3 Instant Insights + happy smoke; follow-ups (sibling `/trainers`, retry errors, split DAL, auth/`connection()` shell fixes) |
| 2026-08-11 | v1.2 — implementation complete (Gate A + B1–B7 + hubs + D1/D2); D3/manual smoke pending live `next dev` |

| 2026-08-11 | v1.1 — docs polish: A1 listed-only; A4 amend date; B4 auth nuance; D3 label; root `error.tsx` skipped; P1 exceptions → phase Change log |

| 2026-08-11 | v1.0 — W25 P22 tasks |

