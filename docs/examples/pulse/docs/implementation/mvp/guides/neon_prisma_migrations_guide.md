# Neon + Prisma Migrations Guide — Pulse

**Тип:** Guide  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W12  
**Зависит от:** [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md)  
**Связанные документы:** [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md), [`local_dev_setup.md`](./local_dev_setup.md)

**Context7 verified:** Prisma v7 — `prisma.config.ts` uses `DIRECT_URL` for CLI; runtime uses pooled connection via driver adapter (`/websites/prisma_io`, May 2026).

---

## Purpose

Практическое руководство по **Neon PostgreSQL 17** + **Prisma v7** для Pulse: создание проекта/веток, pooled vs direct URLs, команды CLI, типичные ошибки. Дополняет [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md) пошаговыми UI действиями.

---

## Scope / Out of scope

**In scope:** Neon console workflow, connection string formats, branch strategy, Prisma CLI commands, adapter setup pointer.

**Out of scope:** Full Prisma schema authoring (→ database_schema_v1), query optimization (→ data_access_patterns).

---

## Neon project setup

### 1. Create project

1. [Neon Console](https://console.neon.tech) → New Project.
2. Region: **EU (Frankfurt)** — align with Vercel fra1 (ADR-001).
3. PostgreSQL version: **17**.

### 2. Branch strategy (recommended)

| Branch | Use |
|--------|-----|
| `main` | Production database |
| `dev` | Local development (each dev MAY fork) |
| `preview/*` | Optional per-team preview isolation |

Neon **database branching** allows copy-on-write forks for safe experimentation.

### 3. Connection strings

From Neon dashboard → Connection Details:

| Type | Use in Pulse | Env var |
|------|--------------|---------|
| **Pooled** (pgBouncer, `-pooler` host) | Prisma Client runtime | `DATABASE_URL` |
| **Direct** (non-pooler host) | `migrate`, `db seed`, introspect | `DIRECT_URL` |

Example shape:

```bash
# Pooled — note -pooler in hostname
DATABASE_URL="postgresql://neondb_owner:****@ep-cool-name-123456-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Direct — no -pooler
DIRECT_URL="postgresql://neondb_owner:****@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

**MUST** include `?sslmode=require` for Neon.

---

## Prisma v7 package layout (target P01)

```
packages/db/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── prisma.config.ts      # DIRECT_URL for CLI
├── src/
│   └── client.ts         # pooled DATABASE_URL + adapter
└── package.json
```

### prisma.config.ts (CLI)

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
```

### Runtime client (pooled)

```typescript
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
```

Per Context7: CLI operations use direct URL; application queries use pooler to avoid connection exhaustion on serverless.

---

## Common commands

Run from `packages/db` (or via workspace scripts):

| Command | When | Connection |
|---------|------|------------|
| `npx prisma migrate dev --name xxx` | Local new migration | `DIRECT_URL` |
| `npx prisma migrate deploy` | Preview/prod apply | `DIRECT_URL` |
| `npx prisma migrate status` | Check pending | `DIRECT_URL` |
| `npx prisma generate` | After schema change | N/A |
| `npx prisma db seed` | Local/CI fixtures | `DIRECT_URL` (recommended) |
| `npx prisma studio` | Local data browse | `DIRECT_URL` |

**MUST NOT** run `migrate dev` on production branch.

---

## Happy path — new developer

1. Create Neon `dev` branch (or use shared team dev).
2. Copy pooled + direct strings to `.env.local` / `packages/db/.env`.
3. `npx prisma migrate deploy` — applies all migrations.
4. `npx prisma db seed` — dev fixtures.
5. `npx prisma generate`.
6. Start `apps/web` — queries use `DATABASE_URL`.

---

## Negative paths

| Error | Cause | Fix |
|-------|-------|-----|
| `P1001` | Neon suspended / wrong host | Restore branch; verify project active |
| `P1017` Server closed connection | Pooler timeout on long migration | Use `DIRECT_URL` for CLI |
| `Migration failed to apply` | Drift or edited applied migration | Forward-fix migration; see runbook rollback |
| `Environment variable not found: DIRECT_URL` | Missing env | Add to `.env` loaded by prisma.config |
| Too many connections | Pool misconfigured | Ensure runtime uses pooled URL only |
| `db push` wiped history | Used push on shared DB | Use migrate only on shared envs |

---

## Security paths

- Rotate Neon password if exposed; update Vercel env.
- **MUST NOT** share production `DIRECT_URL` in chat/logs.
- Use Neon IP allow / Vercel integration when available.

---

## Concurrency notes

- Neon branching avoids dev blocking prod migrations.
- Only one `migrate deploy` to same branch at a time (CI mutex).

---

## CI snippet (reference)

```yaml
# Example — adapt to repo CI
- name: Migrate preview DB
  env:
    DIRECT_URL: ${{ secrets.NEON_DIRECT_URL_PREVIEW }}
  run: cd packages/db && npx prisma migrate deploy
```

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md) | Policy + rollback |
| [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) | Schema canon |
| [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) | Seed content |
| [`vercel_deploy_guide.md`](./vercel_deploy_guide.md) | Vercel env pairing |
| [`local_dev_setup.md`](./local_dev_setup.md) | First run |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W12-07

---

## Agent notes

- Prisma v7: do not add `url = env("DATABASE_URL")` to schema datasource — use config file.
- When scaffolding P01, verify generated SQL against schema v1 §13 checklist.
- Neon free tier auto-suspend: first query may cold-start — normal for dev.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — Neon + Prisma v7 guide |
