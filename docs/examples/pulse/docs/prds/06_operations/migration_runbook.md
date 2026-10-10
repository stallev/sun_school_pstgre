# Migration Runbook — Pulse (Neon + Prisma v7)

**Тип:** PRD / Guide  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W12  
**Зависит от:** [`database_schema_v1.md`](../03_data_model/database_schema_v1.md), [`adr_001_stack_and_runtime.md`](../07_governance/adr_001_stack_and_runtime.md)  
**Связанные документы:** [`neon_prisma_migrations_guide.md`](../../implementation/mvp/guides/neon_prisma_migrations_guide.md), [`seed_data_spec.md`](../03_data_model/seed_data_spec.md)

**Context7 verified:** Prisma v7 — `prisma.config.ts` + `DIRECT_URL` for CLI; pooled `DATABASE_URL` for runtime (`/websites/prisma_io`, May 2026).

---

## Purpose

Канон **безопасного цикла миграций** Pulse: локальная разработка, CI/preview и production на Neon PostgreSQL 17 через Prisma v7. Определяет команды, порядок env, rollback policy и sync с [`database_schema_v1.md`](../03_data_model/database_schema_v1.md).

**Аудитория:** разработчики P01, CI maintainers, AI-агенты при scaffold `packages/db`.

---

## Scope / Out of scope

**In scope:** `migrate dev`, `migrate deploy`, `migrate status`, `db push` policy, Neon branch strategy, production checklist, drift guards.

**Out of scope:** Prisma schema field-by-field (→ schema v1), seed content (→ seed_data_spec), Vercel build config (→ vercel_deploy_guide).

---

## Definitions

| Term | Meaning |
|------|---------|
| **Pooled URL** | `DATABASE_URL` — Neon pgBouncer; runtime queries only |
| **Direct URL** | `DIRECT_URL` — direct Postgres; migrations + seed CLI |
| **Wave 1 migration** | Initial MVP DDL per schema v1 §13 checklist |
| **Deploy migration** | `prisma migrate deploy` — apply pending SQL in target env |

---

## Prisma v7 configuration (canon)

Per Context7 and [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) §0.3:

```typescript
// packages/db/prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"), // CLI: migrate, db seed
  },
});
```

Runtime Prisma Client (in `@pulse/db`):

- **MUST** use `@prisma/adapter-pg` + `pg` Pool with `DATABASE_URL` (pooled).
- **MUST NOT** put `url` / `directUrl` in `schema.prisma` datasource block (deprecated in v7).

`.env` example (local):

```bash
DATABASE_URL="postgresql://...@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://...@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

---

## Environment matrix

| Environment | Create migration (`migrate dev`) | Apply migration (`migrate deploy`) | Seed |
|-------------|----------------------------------|-------------------------------------|------|
| Local dev | ✅ author new SQL | ✅ after pull | ✅ `db seed` |
| CI ephemeral | ❌ | ✅ on empty/preview DB | ✅ optional smoke |
| Vercel Preview | ❌ | ✅ in build hook or post-deploy step | ❌ |
| Production | ❌ **forbidden** | ✅ release step only | ❌ **forbidden** |

---

## Happy path — new migration (local)

**Preconditions:** schema change aligned with `database_schema_v1.md`; `DIRECT_URL` set.

1. Edit `packages/db/prisma/schema.prisma`.
2. Update `database_schema_v1.md` in **same PR** (product-docs-alignment).
3. From repo root or `packages/db`:

```bash
cd packages/db
npx prisma migrate dev --name descriptive_snake_case
```

4. Review generated SQL in `prisma/migrations/*/migration.sql`.
5. Run `npx prisma generate`.
6. Run `npm run typecheck` at monorepo root.
7. (Optional) `npx prisma db seed` for local smoke.
8. Commit: schema + migration SQL + doc update.

**Postconditions:** `_prisma_migrations` table updated locally; migration folder committed.

---

## Happy path — deploy to preview/production

**Preconditions:** migration folders merged to target branch; `DIRECT_URL` for target Neon branch.

```bash
cd packages/db
npx prisma migrate status   # verify pending
npx prisma migrate deploy   # applies pending only
npx prisma generate         # if not in build pipeline
```

**Vercel integration (SHOULD):**

- Add build or deploy hook step: `npm run db:migrate:deploy -w @pulse/db` (script TBD in P01).
- Use Neon **production** branch `DIRECT_URL` for Production env; **preview** branch for Preview.

**Postconditions:** target DB schema matches repo HEAD; app starts without Prisma schema mismatch.

---

## Wave 1 initial migration checklist

Execute once when scaffolding `packages/db` (P01):

```
[ ] prisma init in packages/db
[ ] schema.prisma matches database_schema_v1.md enums + models
[ ] prisma.config.ts with DIRECT_URL + seed command
[ ] migrate dev --name wave1_mvp_core
[ ] Verify §13 checklist tables present
[ ] migrate deploy on preview Neon branch
[ ] db seed on local only
[ ] No delivery_log rows from seed (INV-12)
```

Full table list — [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) §13.

---

## Negative paths

| Scenario | Expected behavior | Action |
|----------|-------------------|--------|
| Missing `DIRECT_URL` | CLI error on migrate | Set direct connection string |
| Using pooled URL for migrate | Timeouts / advisory lock failures | Switch CLI to `DIRECT_URL` |
| `migrate dev` on production | **Forbidden** — data loss risk | Use `migrate deploy` only |
| Migration fails mid-deploy | `_prisma_migrations` may be partial | Fix SQL; new migration; never edit applied SQL |
| Schema doc updated without migration | Drift | Same PR rule — block merge |
| `db push` on shared env | Bypasses migration history | **MUST NOT** on preview/prod; local prototype only |
| Empty migration (no SQL diff) | Skip commit | Re-check schema edits |

---

## Security paths

| Scenario | Mitigation |
|----------|------------|
| DB credentials in git | `.env*` gitignored; use Vercel/Neon dashboard |
| Over-privileged DB user | App role: DML only; migrate role: DDL (Neon branch owner) |
| Public migrate endpoint | **No** HTTP migrate route — CLI/CI only |
| SQL injection in migrate | Review generated SQL; no dynamic SQL in migrations |

---

## Concurrency & idempotency

| Scenario | Resolution |
|----------|------------|
| Two developers `migrate dev` same time | Coordinate; one authors migration per feature branch |
| Parallel CI deploy same DB | Serialize migrate deploy job (mutex) |
| `migrate deploy` re-run | Idempotent — applies only pending migrations |
| Hotfix prod while preview migrates | Separate Neon branches — no cross-env lock |

---

## Drift & consistency notes

| Risk | Guard |
|------|-------|
| Prisma v6 docs (`directUrl` in schema) | ADR-001 + this runbook + Context7 v7 |
| Lampto Supabase migrate docs | Neon URLs; same DIRECT/pooled split |
| Applied migration edited | **Forbidden** — forward-only new migration |
| Enum values vs domain | Cross-check `@pulse/domain` + lifecycle_models |

---

## Rollback policy

**MUST** — forward-only migrations on preview/production.

| Situation | Allowed |
|-----------|---------|
| Bad migration not yet deployed | Delete local migration folder; fix schema; re-run `migrate dev` |
| Bad migration deployed to prod | New **forward** migration to revert DDL; no `migrate reset` on prod |
| Catastrophic prod issue | Neon point-in-time restore (PITR) — ops decision; document incident |

`prisma migrate reset` — **local dev only**.

---

## Requirements

1. **MUST** — `migrate deploy` for preview and production.
2. **MUST** — `DIRECT_URL` for all Prisma CLI migration/seed commands.
3. **MUST** — `DATABASE_URL` pooled for runtime Prisma Client only.
4. **MUST** — schema v1 doc updated in same PR as DDL change.
5. **MUST NOT** — `migrate dev` against production database.
6. **SHOULD** — name migrations `waveN_feature` or `add_table_x` — descriptive snake_case.

---

## Acceptance criteria

- [ ] Prisma v7 config pattern documented with Context7 reference
- [ ] Local vs deploy command matrix complete
- [ ] Wave 1 checklist references schema v1 §13
- [ ] Negative paths include pooled URL mistake
- [ ] Rollback policy forward-only explicit
- [ ] Links to neon_prisma_migrations_guide

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) | DDL canon + §13 checklist |
| [`adr_001_stack_and_runtime.md`](../07_governance/adr_001_stack_and_runtime.md) | Neon + Prisma stack |
| [`seed_data_spec.md`](../03_data_model/seed_data_spec.md) | Post-migrate seed |
| [`neon_prisma_migrations_guide.md`](../../implementation/mvp/guides/neon_prisma_migrations_guide.md) | Step-by-step Neon setup |
| [`local_dev_setup.md`](../../implementation/mvp/guides/local_dev_setup.md) | First-time dev |
| [`../06_operations/README.md`](./README.md) | Ops layer index |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W12-02

---

## Agent notes

- P01 task: create `packages/db` matching this runbook before any app queries.
- Never run seed after production migrate unless incident recovery with explicit approval.
- If Neon pooler errors during seed bulk upsert, use `DIRECT_URL` for seed CLI (seed_data_spec).

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — Neon + Prisma v7 migration runbook |
