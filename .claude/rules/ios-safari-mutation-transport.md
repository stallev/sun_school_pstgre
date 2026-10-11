---
description: iOS Safari Load failed — dual transport for mutations (Class A/B)
paths:
  - "apps/web/src/app/**"
  - "apps/web/src/actions/**"
  - "apps/web/src/data/**"
  - "apps/web/src/lib/ui/**"
---
# iOS Safari: mutation transport (mandatory for critical submits)

**Incident / pattern:** [`docs/examples/pulse/`](docs/examples/pulse/) (Pulse incidents); the project pattern doc is added with the first Class B flow
**Data layer:** [`ai_nextjs_db_data_handle.md`](docs/guidelines/nextjs/ai_nextjs_db_data_handle.md) §7  
**Forms:** [`ai_form_handling_pattern.md`](docs/guidelines/react/ai_form_handling_pattern.md) §7

When adding or editing **client-triggered mutations** on canonical routes (`/register`, access request approve, homework check save, profile saves — see [`canonical_routes.md`](docs/design/canonical_routes.md)):

## Classify first

| Class | When | Transport |
|-------|------|-----------|
| **A** | Toggle (read marker), debounced save — no RSC refresh each call | **Route Handler** `POST /api/...` + `resilientPostFetch` retry |
| **B** | One-shot critical submit + redirect / refresh | **Server Action** primary; **Route Handler fallback** on `isIosSafari()` or after `Load failed` |

## Do

1. **Single DAL** in `apps/web/src/data/**` — both Action and Route Handler call it; return **`MutationResult<T>`** from `@sunschool/domain`.
2. **Class B on mobile-first flows** — implement fallback before shipping the main mobile mutation flows (registration, access approve, homework check).
3. **`isIosSafari()`** + **`resilientPostFetch`** — colocate in `apps/web/src/lib/ui/` when first flow lands (see Pulse incidents).
4. Preserve **ui-mutation-pending** (`disabled`, `aria-busy`, gerund labels) and **ui-toast-mutations** on **both** transports.
5. After Action success: **`updateTag`** per cache policy; Route Handler success: **`router.push` / `router.refresh`** manually.
6. Tag Sentry **`submit_transport`** when Sentry enabled (`server-action` | `route-handler-fallback` | `route-handler-primary`).

## Do not

- Duplicate validation or Prisma logic in Action vs Route Handler.
- Retry **`4xx`/`5xx`** blindly — retry only `TypeError: Load failed` / network abort.
- Replace all Server Actions globally — scoped fallback per critical flow.
- Introduce ad-hoc error shapes — use **`MutationResult`** only.

## Before you finish (Class B)

- [ ] DAL shared; Action + `app/api/.../route.ts` thin
- [ ] iOS Safari path tested (device or BrowserStack)
- [ ] Desktop still uses Server Action primary
- [ ] `npm run typecheck` (root)

Reference: Pulse incidents (docs/examples/pulse) — adapted to Vercel, project routes and `@sunschool/domain`.
