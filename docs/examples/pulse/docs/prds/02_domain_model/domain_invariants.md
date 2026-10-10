# Domain Invariants — Pulse

**Тип:** PRD  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W3  
**Зависит от:** [`lifecycle_models.md`](./lifecycle_models.md), [`failure_modes_catalog.md`](./failure_modes_catalog.md), [`adr_001_stack_and_runtime.md`](../07_governance/adr_001_stack_and_runtime.md)  
**Связанные документы:** [`use_cases_index.md`](./use_cases_index.md), [`../03_data_model/database_schema_v1.md`](../03_data_model/database_schema_v1.md)

---

## Purpose

**Не нарушаемые правила** домена Pulse: что система MUST garantировать независимо от UI и transport layer. Дублирует и расширяет инварианты из [`AGENTS.md`](../../AGENTS.md) и schema §0.2 для AI-агентов и code review. Нарушение = архитектурный баг.

---

## Scope / Out of scope

**In scope:** MVP business invariants, monorepo boundary rules affecting domain, drift detection.

**Out of scope:** WCAG, toast copy, SQL index choices (→ W6), authorization matrix cells (→ [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md)).

---

## Definitions

| ID prefix | Meaning |
|-----------|---------|
| `INV-NN` | Domain invariant (this document) |
| `FM-NNN` | Failure mode ([`failure_modes_catalog.md`](./failure_modes_catalog.md)) |
| `PKG-NN` | Package import invariant |

---

## Requirements (invariants)

### Time & schedule

| ID | Rule | Enforcement | Drift guard |
|----|------|-------------|-------------|
| **INV-01** | **`TrainerProfile.timezone` (IANA)** — единственный источник истины для weekly schedule, slot generation, reminders (post-MVP), display клиенту | `packages/domain` slot functions; never `Intl` default server TZ | [`FM-009`](./failure_modes_catalog.md#fm-009); unit tests with `America/New_York` vs `Europe/Berlin` |
| **INV-02** | Slot boundaries computed in trainer local calendar, stored as `timestamptz` UTC in `booking.starts_at` | Domain converts local → UTC on write; UTC → local on read | Compare golden fixtures in CI |

### Trainer verification & catalog

| ID | Rule | Enforcement | Drift guard |
|----|------|-------------|-------------|
| **INV-03** | Public catalog and bookable trainers **MUST** have `trainer_profile.status = approved` | Query filters + `CreateBooking` precheck | [`FM-003`](./failure_modes_catalog.md#fm-003) |
| **INV-04** | `pending` / `rejected` trainers **MUST NOT** appear in public catalog queries | SQL WHERE + policy | Integration test catalog endpoint |

### Booking

| ID | Rule | Enforcement | Drift guard |
|----|------|-------------|-------------|
| **INV-05** | Booking status transitions **MUST** only occur via named use-cases ([`use_cases_index.md`](./use_cases_index.md)), never ad-hoc Prisma update from UI | Domain module API | Code search ban `booking.update({ status` outside domain |
| **INV-06** | Non-`cancelled` bookings for same trainer **MUST NOT** overlap in time | Transaction + overlap query | [`FM-001`](./failure_modes_catalog.md#fm-001) |
| **INV-07** | Service price/duration/name at booking time **MUST** be snapshotted on `booking` row | `CreateBooking` copies fields | Historical bookings immune to service edits |
| **INV-08** | Client cancel **MUST** respect 24h window before `starts_at` (unless actor is trainer/admin) | `CancelBooking` domain rule | [`FM-002`](./failure_modes_catalog.md#fm-002) |

### Reviews

| ID | Rule | Enforcement | Drift guard |
|----|------|-------------|-------------|
| **INV-09** | At most **one** review per `booking_id` | UNIQUE constraint + domain | [`FM-006`](./failure_modes_catalog.md#fm-006) |
| **INV-10** | Reviews **MUST NOT** be edited by client after publish; admin hide/delete only | No update use-case for client | User flow + domain API surface |

### Media & uploads

| ID | Rule | Enforcement | Drift guard |
|----|------|-------------|-------------|
| **INV-11** | `verification_document` / public certificate **MUST** reference `file_asset` with `upload_status = ready` | Domain validation on link | [`FM-012`](./failure_modes_catalog.md#fm-012) |

### Jobs & email (schema vs runtime)

| ID | Rule | Enforcement | Drift guard |
|----|------|-------------|-------------|
| **INV-12** | MVP application **MUST NOT** write `delivery_log` or invoke Resend | No SDK in apps/web MVP | [`FM-020`](./failure_modes_catalog.md#fm-020) |
| **INV-13** | Post-MVP: each email send **MUST** have UNIQUE `idempotency_key` in `delivery_log` | Job worker | [`FM-011`](./failure_modes_catalog.md#fm-011); [ADR-001](../07_governance/adr_001_stack_and_runtime.md) |

### Post-MVP readiness

| ID | Rule | Enforcement | Drift guard |
|----|------|-------------|-------------|
| **INV-14** | Stripe / Daily.co columns **MAY** exist nullable; MVP UI **MUST NOT** expose payment/video flows | Feature flags / route absence | [`post_mvp_deferrals.md`](../01_product_scope/post_mvp_deferrals.md) |

### Monorepo & layering

| ID | Rule | Enforcement | Drift guard |
|----|------|-------------|-------------|
| **PKG-01** | `packages/domain` **MUST NOT** import `packages/db`, Next.js, Vercel SDK | ESLint boundaries | typecheck + lint |
| **PKG-02** | `packages/policy/server` **MUST NOT** be imported from `proxy.ts` / Edge | ADR-002 | grep CI check |
| **PKG-03** | Domain literals (`UserRole`, `BookingStatus`, …) **MUST** live in `@pulse/domain` | No inline `"pending"` in apps | [`FM-017`](./failure_modes_catalog.md#fm-017) |

---

## Happy paths (invariant preservation)

Normal flows preserve invariants by construction:

- Approved trainer → slot in TZ → `CreateBooking` → snapshot + no overlap.
- Trainer `CompleteBooking` → client `PublishReview` → rating recalc in same transaction as INSERT review.

---

## Negative paths

| Violation attempt | Invariant | System response |
|-------------------|-----------|-----------------|
| Book overlapping slot | INV-06 | Deny [`FM-001`](./failure_modes_catalog.md#fm-001) |
| Cancel < 24h (client) | INV-08 | Deny [`FM-002`](./failure_modes_catalog.md#fm-002) |
| Second review | INV-09 | Deny [`FM-006`](./failure_modes_catalog.md#fm-006) |
| Link pending file | INV-11 | Deny [`FM-012`](./failure_modes_catalog.md#fm-012) |

---

## Security paths

Invariants **INV-03**, **INV-04** are authorization-adjacent; object-level checks supplement edge role gates:

- **INV-05** ensures auditability of state changes (pairs with `audit_log`).
- Cross-user access denied by policy — see [`FM-004`](./failure_modes_catalog.md#fm-004), [`FM-005`](./failure_modes_catalog.md#fm-005).

---

## Concurrency & races

- **INV-06** is the primary booking consistency invariant; implement with transactions (Prisma: overlap SELECT in `$transaction`; retry `P2034` if Serializable — Context7 `/websites/prisma_io` transactions docs).
- Wishlist idempotency — not overlap; PK uniqueness suffices [`FM-007`](./failure_modes_catalog.md#fm-007).

---

## Drift risks & guards

| Risk | Detection | Prevention |
|------|-----------|------------|
| Schema enum ≠ domain type | `npm run typecheck` root | Same PR for migration + `@pulse/domain` |
| UTC slot bug | TZ fixture tests | INV-01 code review checklist |
| MVP email send | grep `resend`, `delivery_log.create` | INV-12 PR template |
| Docs ↔ code status names | Contract tests / smoke | lifecycle_models as source |
| Cache shows stale trainer approval | Manual + revalidation tags | [`cache_revalidation_policy.md`](../05_runtime/cache_revalidation_policy.md) |

Phase DoD **MUST** include: «no new invariant violations» + doc sync if behavior changes.

---

## Acceptance criteria

- [ ] All AGENTS.md monorepo invariants reflected (timezone, booking SM, verification, jobs)
- [ ] Each INV links to FM or enforcement layer where applicable
- [ ] PKG rules align with ADR-001/002
- [ ] Post-MVP columns covered by INV-14
- [ ] No duplicate full FM prose — links only

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`lifecycle_models.md`](./lifecycle_models.md) | Transitions guarded by INV |
| [`failure_modes_catalog.md`](./failure_modes_catalog.md) | FM when invariant violated |
| [`../../AGENTS.md`](../../AGENTS.md) | Monorepo entry invariants |
| [`../03_data_model/database_schema_v1.md`](../03_data_model/database_schema_v1.md) | DDL §0.2 |
| [`../07_governance/adr_001_stack_and_runtime.md`](../07_governance/adr_001_stack_and_runtime.md) | Jobs/idempotency |
| [`../07_governance/adr_004_timezone_scheduling_model.md`](../07_governance/adr_004_timezone_scheduling_model.md) | INV-01 governance |
| [`../../implementation/mvp/contracts/monorepo_boundaries_contract.md`](../../implementation/mvp/contracts/monorepo_boundaries_contract.md) | PKG enforcement W8 |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W3-04

---

## Agent notes

- Adding invariant: assign next `INV-NN`, add FM if user-visible failure mode exists.
- Do not weaken INV-01 for «simplicity» — historical production bug class in scheduling apps.
- `packages/domain` scaffold: export invariant constants as documentation comments near validators.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — 14 INV + 3 PKG rules |
