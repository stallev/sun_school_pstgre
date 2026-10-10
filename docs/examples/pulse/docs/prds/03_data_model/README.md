# 03_data_model

Каноническая модель данных Pulse (PostgreSQL 17 / Neon / Prisma v7).

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)

| Document | Status |
|----------|--------|
| [`database_schema_v1.md`](./database_schema_v1.md) | **Canonical** — DDL contract for Wave 1 MVP |
| [`../02_domain_model/lifecycle_models.md`](../02_domain_model/lifecycle_models.md) | **Canonical** — state machines aligned with schema enums |
| [`../02_domain_model/domain_invariants.md`](../02_domain_model/domain_invariants.md) | **Canonical** — INV rules including timezone |
| [`data_access_patterns.md`](./data_access_patterns.md) | **Canonical** — hot path queries |
| [`indexing_strategy.md`](./indexing_strategy.md) | **Canonical** — indexes for catalog, bookings, admin |
| [`seed_data_spec.md`](./seed_data_spec.md) | **Canonical** — dev/CI seed fixtures |
| `apps/text_data/dev-users.json` | **Local only** (gitignored) — machine-readable subset of fixture credentials; see seed_data_spec §Local credentials JSON |

**Implementation:** `packages/db/prisma/schema.prisma` (on scaffold) must match `database_schema_v1.md`.

**Reference layering:** lampto [`database_schema_v3.md`](../../examples/lampto/docs/prds/03_data_model/database_schema_v3.md)
