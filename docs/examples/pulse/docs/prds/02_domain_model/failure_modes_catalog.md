# Failure Modes Catalog — Pulse MVP

**Тип:** PRD  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W3  
**Зависит от:** [`lifecycle_models.md`](./lifecycle_models.md), [`user_flows/users_mvp/`](../01_product_scope/user_flows/users_mvp/)  
**Связанные документы:** [`domain_invariants.md`](./domain_invariants.md), [`use_cases_index.md`](./use_cases_index.md)

---

## Purpose

**Единый канонический индекс** ожидаемых сбоев, гонок, security-отказов и drift-рисков (`FM-xxx`). Contracts (W8) и specs (W9) **MUST** ссылаться `implements FM-xxx`, не дублируя полное описание. Читают разработчики, QA и AI-агенты при проектировании error handling.

---

## Scope / Out of scope

**In scope:** MVP domain failures traceable to user flows and lifecycle models.

**Out of scope:** Infrastructure outages (Vercel/Neon generic), detailed UX copy (→ W7), full authorization matrix (→ W5).

---

## How to use this catalog

| Column | Meaning |
|--------|---------|
| **FM-ID** | Stable id: `FM-001`, `FM-002`, … |
| **Type** | `race` \| `security` \| `negative UX` \| `drift` |
| **Trigger** | What initiates the scenario |
| **Expected behavior** | System response (deny, idempotent skip, rollback, …) |
| **Owner doc** | Contract/spec where implementation details live |
| **Status** | `documented` \| `implemented` \| `tested` |

**Rule:** один FM — один канон здесь. Owner doc adds inputs/outputs/errors only.

---

## Catalog

| FM-ID | Type | Trigger | Expected behavior | Owner doc | Status |
|-------|------|---------|-------------------|-----------|--------|
| [FM-001](#fm-001) | race | Two clients book overlapping slot concurrently | One succeeds; second gets domain error `SLOT_UNAVAILABLE`; no double booking; UI toast.error + refresh slots | [`schedule_slots_contract.md`](../../implementation/mvp/contracts/schedule_slots_contract.md) | documented |
| [FM-002](#fm-002) | negative UX | Client cancels booking within 24h of `starts_at` | Deny cancel; show policy message; no status change | [`booking_lifecycle_contract.md`](../../implementation/mvp/contracts/booking_lifecycle_contract.md) | documented |
| [FM-003](#fm-003) | security | Create booking against non-`approved` trainer | Deny before INSERT; 403/validation error | [`booking_lifecycle_contract.md`](../../implementation/mvp/contracts/booking_lifecycle_contract.md) | documented |
| [FM-004](#fm-004) | security | User accesses another user's booking by ID (IDOR) | Deny read/mutate; 403 or 404 (no leak) | [`policy_enforcement_contract.md`](../04_authorization_privacy/policy_enforcement_contract.md) | documented |
| [FM-005](#fm-005) | security | Client/trainer calls admin-only mutation | Deny; audit log optional | [`policy_enforcement_contract.md`](../04_authorization_privacy/policy_enforcement_contract.md) | documented |
| [FM-006](#fm-006) | race | Duplicate review submit for same booking | Second request fails UNIQUE; first wins; UI shows already reviewed | [`review_moderation_contract.md`](../../implementation/mvp/contracts/review_moderation_contract.md) | documented |
| [FM-007](#fm-007) | race | Double wishlist add/remove (double tap) | Idempotent: duplicate add/remove = success; no error toast | [`wishlist_contract.md`](../../implementation/mvp/contracts/wishlist_contract.md) | documented |
| [FM-008](#fm-008) | negative UX | Login with wrong credentials | Generic error; no user enumeration | *(planned)* `auth_runtime_spec.md` | documented |
| [FM-009](#fm-009) | drift | Slot times computed in UTC instead of trainer TZ | Wrong slots displayed/booked; **prevent** by invariant INV-01 | `domain_invariants.md` | documented |
| [FM-010](#fm-010) | race | Concurrent admin approve + reject same trainer | One transition wins in transaction; loser gets stale state error; UI refresh | [`trainer_verification_contract.md`](../../implementation/mvp/contracts/trainer_verification_contract.md) | documented |
| [FM-011](#fm-011) | race | Cron/email job retry sends duplicate (post-MVP) | Skip send if `delivery_log.idempotency_key` exists | [`email_notifications_contract.md`](../../implementation/mvp/contracts/email_notifications_contract.md) | documented |
| [FM-012](#fm-012) | drift | Certificate linked to `file_asset` still `pending` | Deny attach; orphan pending cleaned by scheduled job (post-MVP) or manual | [`file_upload_contract.md`](../../implementation/mvp/contracts/file_upload_contract.md) | documented |
| [FM-013](#fm-013) | race | Two admins approve/reject same refund | One wins; second gets `ALREADY_PROCESSED` | *(planned)* `complaint_refund` spec area | documented |
| [FM-014](#fm-014) | negative UX | Admin revokes approved trainer with future bookings | Deny revoke OR cancel bookings first — policy TBD in contract; MVP: warn + block if active confirmed bookings | [`trainer_verification_contract.md`](../../implementation/mvp/contracts/trainer_verification_contract.md) | documented |
| [FM-015](#fm-015) | race | Client cancel vs trainer confirm same booking | Transaction orders writes; one succeeds; other gets conflict error + UI resync | [`booking_lifecycle_contract.md`](../../implementation/mvp/contracts/booking_lifecycle_contract.md) | documented |
| [FM-016](#fm-016) | security | Trainer edits another trainer's service/schedule | Deny via policy/server ownership check | [`policy_enforcement_contract.md`](../04_authorization_privacy/policy_enforcement_contract.md) | documented |
| [FM-017](#fm-017) | drift | Prisma schema enum diverges from `@pulse/domain` literals | CI typecheck fails; agent MUST sync domain + schema same PR | `domain_invariants.md` | documented |
| [FM-018](#fm-018) | negative UX | Catalog filter returns zero trainers | Empty state + Clear filters CTA (Zero Dead Ends) | [`catalog_discovery_spec.md`](../../implementation/mvp/specs/catalog_discovery_spec.md) | documented |
| [FM-019](#fm-019) | race | Optimistic wishlist toggle fails server-side | Rollback UI state; **toast.error required** | [`wishlist_contract.md`](../../implementation/mvp/contracts/wishlist_contract.md) | documented |
| [FM-020](#fm-020) | drift | MVP code writes `delivery_log` / sends email | Violates MVP scope; reject in review — tables empty on MVP | [`mvp_scope.md`](../01_product_scope/mvp_scope.md) | documented |

---

## FM entries (detail)

### FM-001

**Type:** race  
**Trigger:** Two `CreateBooking` requests for overlapping `[starts_at, starts_at + duration)` for the same `trainer_profile_id`.  
**Expected behavior:**

1. Use DB transaction with overlap query on non-`cancelled` bookings.
2. First commit wins.
3. Second raises domain error `SLOT_UNAVAILABLE` (maps to P2002 or custom check).
4. UI: toast.error, refresh slot grid (disabled slot).

**Implementation note (Prisma v7, Context7):** on conflict under concurrent transactions, consider `Serializable` isolation or explicit overlap SELECT … FOR UPDATE; retry on `P2034` if using serializable.

**Owner:** [`schedule_slots_contract.md`](../../implementation/mvp/contracts/schedule_slots_contract.md)

---

### FM-002

**Type:** negative UX  
**Trigger:** Client invokes `CancelBooking` when `starts_at - now() < 24 hours`.  
**Expected behavior:** Deny; return `CANCELLATION_WINDOW_CLOSED`; UI explains free cancel policy. Trainer/admin paths unaffected.

**Owner:** [`booking_lifecycle_contract.md`](../../implementation/mvp/contracts/booking_lifecycle_contract.md)

---

### FM-003

**Type:** security  
**Trigger:** `CreateBooking` when `trainer_profile.status != approved`.  
**Expected behavior:** Deny before persistence; catalog should not surface trainer (defense in depth).

---

### FM-004

**Type:** security  
**Trigger:** Authenticated user requests `/client/bookings/[id]` or mutation where `booking.client_id != session.user.id` (and not trainer/admin with rights).  
**Expected behavior:** Deny; prefer **404** for cross-tenant IDs on read to avoid enumeration (product decision: 404 vs 403 — lock in authorization matrix W5).

---

### FM-005

**Type:** security  
**Trigger:** Non-admin hits admin Server Action or `/admin/*` without role.  
**Expected behavior:** `proxy.ts` redirect/deny at edge; server action double-check in policy.

---

### FM-006

**Type:** race  
**Trigger:** Double submit on review form.  
**Expected behavior:** UNIQUE on `booking_id` — second fails gracefully; redirect to existing review.

---

### FM-007

**Type:** race  
**Trigger:** Rapid wishlist toggle / double tap.  
**Expected behavior:** INSERT … ON CONFLICT DO NOTHING or catch P2002 → success; DELETE missing row → success.

---

### FM-008

**Type:** security  
**Trigger:** Invalid email/password on login.  
**Expected behavior:** Same message for unknown email vs wrong password; rate limit post-MVP.

---

### FM-009

**Type:** drift  
**Trigger:** Developer uses `new Date()` in server TZ for slot boundaries.  
**Expected behavior:** **Prevent** — all slot math in `TrainerProfile.timezone` (IANA); tests with fixed TZ fixtures.

---

### FM-010

**Type:** race  
**Trigger:** Two admins approve/reject same pending trainer simultaneously.  
**Expected behavior:** Row-level lock or status check in UPDATE WHERE status=pending; one succeeds.

---

### FM-011

**Type:** race  
**Trigger:** Vercel Cron retry for same reminder window (post-MVP).  
**Expected behavior:** Insert `delivery_log` with UNIQUE `idempotency_key`; duplicate job skips Resend call.

---

### FM-012

**Type:** drift  
**Trigger:** UI saves `verification_document.file_asset_id` before Blob confirm.  
**Expected behavior:** Domain rejects non-`ready` assets; upload flow: pending → client PUT → confirmUpload → ready.

---

### FM-013

**Type:** race  
**Trigger:** Parallel admin refund decisions.  
**Expected behavior:** UPDATE … WHERE status=pending; 0 rows → ALREADY_PROCESSED.

---

### FM-014

**Type:** negative UX  
**Trigger:** Admin attempts `RevokeTrainerApproval` while trainer has future `confirmed` bookings.  
**Expected behavior (MVP lock):** Block revoke until bookings resolved or cancelled; show count in admin UI.

---

### FM-015

**Type:** race  
**Trigger:** Concurrent cancel and confirm on same booking.  
**Expected behavior:** Serializable transaction or version check; loser gets `BOOKING_STATE_CONFLICT`.

---

### FM-016

**Type:** security  
**Trigger:** Trainer A mutates Trainer B's `trainer_service_id`.  
**Expected behavior:** policy/server verifies `trainer_profile.user_id === session.user.id`.

---

### FM-017

**Type:** drift  
**Trigger:** Schema migration adds enum value not in `@pulse/domain`.  
**Expected behavior:** Monorepo typecheck fails; update domain literals + guards in same PR.

---

### FM-018

**Type:** negative UX  
**Trigger:** Filter combination matches zero approved trainers.  
**Expected behavior:** Empty state component; primary CTA Clear filters.

---

### FM-019

**Type:** race  
**Trigger:** Optimistic wishlist toggle; server returns 401/500.  
**Expected behavior:** Revert heart icon; toast.error (mandatory per ui-optimistic-mutations rule).

---

### FM-020

**Type:** drift  
**Trigger:** Agent adds Resend send in booking flow on MVP.  
**Expected behavior:** Code review rejects; product scope — in-app feedback only.

---

## Security paths (summary)

| FM-ID | Role / attack | MVP response |
|-------|---------------|--------------|
| FM-003 | Book unapproved trainer | Deny create |
| FM-004 | Booking IDOR | Deny read/write |
| FM-005 | Privilege escalation | Deny + edge gate |
| FM-008 | Credential guessing | Generic error |
| FM-016 | Cross-trainer mutation | Deny ownership |

Full matrix — *(planned)* [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md).

---

## Concurrency & idempotency (summary)

| FM-ID | Mechanism |
|-------|-----------|
| FM-001 | Transaction + overlap check |
| FM-006 | UNIQUE `booking_id` |
| FM-007 | Idempotent wishlist PK |
| FM-010, FM-013, FM-015 | UPDATE WHERE status + transaction |
| FM-011 | UNIQUE `idempotency_key` (post-MVP) |

---

## Drift & consistency notes

- **FM-009, FM-017, FM-020** — primary drift guards for agents.
- Phase DoD (W11): smoke test FM-001 (double submit), FM-002 (cancel window), FM-005 (403 admin).
- Cache invalidation for catalog after trainer approval — *(planned)* `cache_revalidation_policy.md`.

---

## Acceptance criteria

- [ ] Every FM has Type, Trigger, Expected behavior, Owner doc, Status
- [ ] FM-001 references Prisma transaction pattern (Context7 verified)
- [ ] MVP scope violations covered (FM-020)
- [ ] lifecycle_models.md links use FM anchors, not duplicate prose
- [ ] At least one security + one race FM marked for P03 smoke

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`lifecycle_models.md`](./lifecycle_models.md) | State transitions referencing FM |
| [`domain_invariants.md`](./domain_invariants.md) | INV-01 … INV-07 |
| [`../01_product_scope/mvp_scope.md`](../01_product_scope/mvp_scope.md) | MVP boundaries |
| [`../../AGENTS.md`](../../AGENTS.md) | Monorepo invariants |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W3-03

---

## Agent notes

- Adding new FM: append row + detail section; bump catalog version if material.
- Do not create FM-021 for generic network errors — handle at UI layer unless domain-specific.
- Owner doc «planned» — replace link when W8 file created in same session as contract.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — initial 20 failure modes for MVP |
