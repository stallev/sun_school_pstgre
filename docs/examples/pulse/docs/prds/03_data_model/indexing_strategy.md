# Indexing Strategy — Pulse MVP

**Тип:** PRD / Spec  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W6  
**Зависит от:** [`data_access_patterns.md`](./data_access_patterns.md), [`database_schema_v1.md`](./database_schema_v1.md)  
**Связанные документы:** [`lifecycle_models.md`](../02_domain_model/lifecycle_models.md), [`domain_invariants.md`](../02_domain_model/domain_invariants.md)

---

## Purpose

Канон **индексов PostgreSQL** для Pulse MVP: какие индексы уже заданы в schema v1, какие добавить в Wave 1 migration, partial vs composite, связь с hot paths из [`data_access_patterns.md`](./data_access_patterns.md). Читают DB-инженеры и AI-агенты при написании миграций `packages/db`.

---

## Scope / Out of scope

**In scope:** MVP query performance, overlap detection support, catalog/admin list indexes, partial indexes for filtered statuses.

**Out of scope:** full-text search index (post-MVP catalog search), partitioning, read replicas, Neon-specific tuning beyond connection pooling, materialized views.

---

## Definitions

| Term | Meaning |
|------|---------|
| **Partial index** | Index with `WHERE` clause — smaller, matches filtered queries |
| **Covering index** | Index includes all columns needed by query (MVP: rare; prefer selectivity first) |
| **Wave 1 baseline** | Indexes shipped in first Prisma migration matching `database_schema_v1.md` |

---

## Principles

1. **MUST** — каждый индекс трассируется к паттерну в `data_access_patterns.md` или invariant check.
2. **SHOULD** — partial indexes для доменных фильтров (`status = approved`, `status NOT IN ('cancelled')`).
3. **MUST NOT** — дублировать redundant indexes (same leading columns subset).
4. **SHOULD** — review new indexes with `EXPLAIN (ANALYZE, BUFFERS)` on seed dataset ([`seed_data_spec.md`](./seed_data_spec.md)).
5. **MAY** — defer non-critical indexes if migration size is a concern; document in changelog.

---

## Baseline indexes (schema v1 — MUST ship Wave 1)

Indexes **already defined** in [`database_schema_v1.md`](./database_schema_v1.md). **MUST** remain unless ADR supersedes.

### Identity

| Index | Table | Columns | Serves |
|-------|-------|---------|--------|
| `user_pkey` | `user` | `id` | PK lookups |
| `user_email_key` | `user` | `email` UNIQUE | Login, upsert seed |
| `idx_user_role` | `user` | `role` | Admin user tooling (post-MVP) |

### Trainer profile & catalog

| Index | Table | Columns | Serves |
|-------|-------|---------|--------|
| `trainer_profile_user_id_key` | `trainer_profile` | `user_id` UNIQUE | Trainer session → profile |
| `idx_trainer_profile_status` | `trainer_profile` | `status` | Admin queue filter |
| `idx_trainer_profile_rating` | `trainer_profile` | `(status, rating_avg DESC)` **WHERE status = 'approved'** | Catalog sort by rating |

### Specializations & services

| Index | Table | Columns | Serves |
|-------|-------|---------|--------|
| `specialization_slug_key` | `specialization` | `slug` UNIQUE | Seed + filter by slug |
| `trainer_specialization_pkey` | `trainer_specialization` | `(trainer_profile_id, specialization_id)` | Join filter |
| `idx_trainer_service_profile_active` | `trainer_service` | `(trainer_profile_id, is_active)` | Profile services tab |

### Schedule

| Index | Table | Columns | Serves |
|-------|-------|---------|--------|
| `idx_weekly_interval_profile_day` | `trainer_weekly_interval` | `(trainer_profile_id, day_of_week)` | Slot generation load |
| `trainer_schedule_exception_trainer_profile_id_exception_date_key` | `trainer_schedule_exception` | `(trainer_profile_id, exception_date)` UNIQUE | Exception lookup |

### Booking & wishlist

| Index | Table | Columns | Serves |
|-------|-------|---------|--------|
| `idx_booking_client_status` | `booking` | `(client_id, status, starts_at DESC)` | Client bookings tabs |
| `idx_booking_trainer_starts` | `booking` | `(trainer_profile_id, starts_at)` **WHERE status NOT IN ('cancelled')** | Overlap detection, trainer calendar |
| `idx_booking_trainer_day` | `booking` | `(trainer_profile_id, starts_at)` | Trainer day view (includes cancelled — filter in query) |
| `wishlist_pkey` | `wishlist` | `(client_id, trainer_profile_id)` | Wishlist toggle |
| `idx_wishlist_trainer` | `wishlist` | `trainer_profile_id` | Reverse lookup (rare MVP) |

### Reviews & moderation

| Index | Table | Columns | Serves |
|-------|-------|---------|--------|
| `review_booking_id_key` | `review` | `booking_id` UNIQUE | One review per booking |
| `idx_review_trainer_visible` | `review` | `(trainer_profile_id, created_at DESC)` **WHERE is_hidden = false** | Public profile reviews |
| `idx_complaint_status_priority` | `complaint` | `(status, priority, created_at DESC)` | Admin complaint queue |
| `idx_refund_status` | `refund_request` | `(status, created_at DESC)` | Admin refunds queue |

### Ops & media

| Index | Table | Columns | Serves |
|-------|-------|---------|--------|
| `job_execution_idempotency_key_key` | `job_execution` | `idempotency_key` UNIQUE | Post-MVP jobs |
| `delivery_log_idempotency_key_key` | `delivery_log` | `idempotency_key` UNIQUE | Post-MVP email |
| `idx_file_asset_owner` | `file_asset` | `owner_user_id` | Upload ownership cleanup |
| `idx_audit_target` | `audit_log` | `(target_type, target_id)` | Support investigations |

---

## Recommended additions (Wave 1 — SHOULD add in same migration)

These **close gaps** between access patterns and baseline DDL.

| Index name | Definition | Pattern | Priority |
|------------|------------|---------|----------|
| `idx_trainer_specialization_spec` | `(specialization_id, trainer_profile_id)` on `trainer_specialization` | Catalog filter by specialization (reverse join) | **High** |
| `idx_trainer_profile_submitted` | `(status, submitted_at ASC)` **WHERE status = 'pending'** | Admin verification queue ordering | **High** |
| `idx_booking_trainer_status_starts` | `(trainer_profile_id, status, starts_at)` | Trainer dashboard upcoming/past without seq scan | **Medium** |
| `idx_trainer_certificate_profile_sort` | `(trainer_profile_id, sort_order)` | Profile certificates ordered list | **Low** |

### SQL (add to Wave 1 migration after baseline)

```sql
CREATE INDEX idx_trainer_specialization_spec
  ON trainer_specialization (specialization_id, trainer_profile_id);

CREATE INDEX idx_trainer_profile_submitted
  ON trainer_profile (submitted_at ASC)
  WHERE status = 'pending';

CREATE INDEX idx_booking_trainer_status_starts
  ON booking (trainer_profile_id, status, starts_at);

CREATE INDEX idx_trainer_certificate_profile_sort
  ON trainer_certificate (trainer_profile_id, sort_order);
```

**Note:** `idx_booking_trainer_starts` (partial) and `idx_booking_trainer_day` overlap partially — **SHOULD** monitor; if redundant after EXPLAIN, drop `idx_booking_trainer_day` in follow-up migration (document in change log).

---

## Overlap detection & concurrency

Booking overlap ([`FM-001`](../02_domain_model/failure_modes_catalog.md#fm-001)) relies on:

1. **Partial index** `idx_booking_trainer_starts` — narrows scan to active bookings.
2. **Transaction** with `SELECT … FOR UPDATE` on overlapping rows (see data access patterns).

**MUST NOT** rely on UNIQUE index alone for overlap — intervals are ranges, not single timestamps.

**Future (post-MVP, if volume grows):** GiST on `tstzrange` for bookings — **out of MVP scope** unless perf ADR.

---

## Query ↔ index mapping

| Hot path | Primary index(es) | Notes |
|----------|-------------------|-------|
| `ListApprovedTrainers` + rating sort | `idx_trainer_profile_rating` | Filter `approved` matches partial predicate |
| Catalog by specialization | `idx_trainer_specialization_spec` + join | Avoid seq scan on bridge table |
| `ListClientBookings` tabs | `idx_booking_client_status` | Leading `client_id` |
| Trainer today sessions | `idx_booking_trainer_status_starts` | Range on `starts_at` |
| Overlap check | `idx_booking_trainer_starts` | Partial excludes cancelled |
| Admin pending trainers | `idx_trainer_profile_submitted` | Partial `pending` |
| Public reviews | `idx_review_trainer_visible` | Partial `not hidden` |
| Login | `user_email_key` | Unique btree |

---

## Happy paths

1. Catalog page load uses index scan on `idx_trainer_profile_rating` for default sort.
2. Client bookings tab uses `idx_booking_client_status` with `client_id` equality.
3. Booking create overlap check scans small partial set per trainer.
4. Admin trainer queue uses partial index on `submitted_at`.

---

## Negative paths

| Scenario | Index behavior |
|----------|----------------|
| Filter yields zero rows | Index scan still valid; empty result |
| Missing index (dev drift) | Seq scan — acceptable only in tiny dev DB; CI SHOULD catch via perf budget optional |
| Over-indexing writes | Extra indexes on `booking` slow inserts — acceptable MVP tradeoff |

---

## Security paths

Indexes **do not** enforce authorization. They only affect performance of **already authorized** queries.

**MUST** — partial index predicates align with domain filters (e.g. catalog never queries `pending` via rating index misuse).

---

## Concurrency & races

Indexes do not replace transaction isolation. Unique indexes enforce:

| Constraint | Race outcome |
|------------|--------------|
| `review.booking_id` UNIQUE | Second insert fails — [`FM-006`](../02_domain_model/failure_modes_catalog.md#fm-006) |
| `wishlist` PK | Duplicate insert fails — idempotent handling |
| `job_execution.idempotency_key` | Post-MVP cron dedup |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Prisma schema missing index from this doc | Diff migration vs `database_schema_v1.md` + this file |
| Partial index predicate ≠ app filter | Document predicate in migration comment |
| Neon EXPLAIN differs from local | Run smoke EXPLAIN on seed after migrate |
| Duplicate/redundant indexes | Periodic review when queries change |

**MUST** — update this file and `database_schema_v1.md` in same PR when adding/dropping indexes.

---

## Verification checklist (post-migrate)

```bash
# After seed (see seed_data_spec.md)
EXPLAIN ANALYZE SELECT ... -- catalog by rating
EXPLAIN ANALYZE SELECT ... -- client bookings upcoming
EXPLAIN ANALYZE SELECT ... -- overlap window for trainer
```

**Acceptance targets (seed scale, indicative):**

- Catalog list: Index Scan or Bitmap Heap Scan, not Seq Scan on `trainer_profile` &gt; 100 rows
- Client bookings: Index Scan on `idx_booking_client_status`
- Overlap: Index Scan using `idx_booking_trainer_starts`

---

## Acceptance criteria

- [ ] All baseline indexes from `database_schema_v1.md` listed with purpose
- [ ] Recommended Wave 1 additions documented with SQL
- [ ] Each recommended index maps to a data access pattern
- [ ] Overlap strategy references FM-001 without duplicating contract
- [ ] Partial index predicates documented
- [ ] No post-MVP FTS/partitioning scope creep

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`database_schema_v1.md`](./database_schema_v1.md) | Baseline DDL + indexes |
| [`data_access_patterns.md`](./data_access_patterns.md) | Queries served by indexes |
| [`seed_data_spec.md`](./seed_data_spec.md) | Dataset for EXPLAIN |
| [`domain_invariants.md`](../02_domain_model/domain_invariants.md) | INV-03, INV-06 |
| *(planned)* [`../../implementation/mvp/guides/neon_prisma_migrations_guide.md`](../../implementation/mvp/guides/neon_prisma_migrations_guide.md) | W12 migrate guide |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W6-02

---

## Agent notes

- When adding Prisma `@@index`, mirror name in migration SQL comment with pattern ID from data access doc.
- Do not add GIN/tsvector for catalog name search until product spec requires it.
- `idx_booking_trainer_day` vs partial index — prefer partial for overlap; revisit duplication in P03 perf pass.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — baseline + Wave 1 recommended indexes |
