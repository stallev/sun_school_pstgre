# Seed Data Specification — Pulse MVP

**Тип:** PRD / Spec  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W6  
**Зависит от:** [`database_schema_v1.md`](./database_schema_v1.md), [`pages_functional_spec.md`](../01_product_scope/pages_functional_spec.md)  
**Связанные документы:** [`indexing_strategy.md`](./indexing_strategy.md), [`mvp_scope.md`](../01_product_scope/mvp_scope.md), [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md)

**Migrated from:** `docs/default_docs/fitness-platform-pages.md` § Seed Script (expanded for full MVP smoke)

---

## Purpose

Канон **начальных данных** для local dev и CI smoke: пользователи всех ролей, approved trainers для catalog, pending trainer для admin queue, услуги, расписание, sample bookings и reviews. Определяет идемпотентный `packages/db/prisma/seed.ts` и dev-only credentials. Читают разработчики и AI-агенты при scaffold P01/P02.

**Prisma v7 seed (Context7, May 2026):**

- Seed command в `prisma.config.ts`: `migrations.seed: "tsx prisma/seed.ts"`.
- Runtime client: `@prisma/adapter-pg` + `DATABASE_URL` (pooled) или `DIRECT_URL` для local seed — **SHOULD** use `DIRECT_URL` locally to avoid pooler edge cases during bulk upsert.
- **MUST** `$disconnect()` and `pool.end()` in `finally`.

---

## Scope / Out of scope

**In scope:** dev/CI seed script, fixture identities, minimal graph for smoke routes in [`pages_functional_spec.md`](../01_product_scope/pages_functional_spec.md), idempotent upsert strategy.

**Out of scope:** production bootstrap (→ planned W12 `migration_runbook.md` / production admin seed), Resend/email fixtures, Stripe/Daily.co data, large-scale load testing dataset, Bible-scale content (contrast lampto).

---

## Definitions

| Term | Meaning |
|------|---------|
| **Dev seed** | `npx prisma db seed` — safe for local + ephemeral CI DB |
| **Fixture user** | Known email/password for manual login smoke |
| **Local credentials JSON** | Machine-readable dev file at `apps/text_data/dev-users.json` — subset of fixture users; gitignored |
| **Idempotent seed** | Re-run produces same logical state; uses `upsert` / delete-and-recreate scoped subsets |

---

## Environment rules

| Environment | Run seed? | Notes |
|-------------|-----------|-------|
| Local dev | ✅ **MUST** be supported | Document in README / W12 guide |
| CI preview DB | ✅ optional | After `migrate deploy` |
| Production | ❌ **MUST NOT** auto-run full dev seed | Separate guarded bootstrap if ever needed |
| Vercel build | ❌ | No seed on build |

**MUST** — seed script checks `NODE_ENV !== 'production'` or explicit `ALLOW_DEV_SEED=true` before destructive dev-only operations.

---

## Fixture credentials (dev only)

**MUST** print banner on seed complete: «Dev credentials — never use in production».

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `admin@pulse.dev` | `admin123` | `admin` | Admin dashboard, moderation smoke |
| `client@pulse.dev` | `client123` | `client` | Client dashboard, booking, wishlist |
| `sofia@pulse.dev` | `client123` | `client` | Second client — with avatar |
| `max@pulse.dev` | `client123` | `client` | Third client — no avatar (Lucide placeholder) |
| `nina@pulse.dev` | `client123` | `client` | Fourth client — no avatar |
| `anna@pulse.dev` | `trainer123` | `trainer` | Approved trainer — yoga/pilates |
| `dmitry@pulse.dev` | `trainer123` | `trainer` | Approved trainer — strength/hiit |
| `maria@pulse.dev` | `trainer123` | `trainer` | Approved trainer — pilates/stretching |
| `ivan@pulse.dev` | `trainer123` | `trainer` | Approved trainer — hiit/strength |
| `elena@pulse.dev` | `trainer123` | `trainer` | Approved trainer — yoga/stretching |
| `sergey@pulse.dev` | `trainer123` | `trainer` | Approved trainer — strength |
| `pending@pulse.dev` | `trainer123` | `trainer` | **Pending** verification queue |

Password hashing: **bcrypt cost 12** — matches [`adr_003_auth_credentials_jwt_rbac.md`](../07_governance/adr_003_auth_credentials_jwt_rbac.md).

**MUST NOT** commit production secrets; passwords above are **documented dev fixtures only**.

### Local credentials JSON (`apps/text_data/dev-users.json`)

**SHOULD** — каждый разработчик держит локальную копию machine-readable credentials для smoke login, E2E и ручного QA. Каталог **`apps/text_data/`** в `.gitignore` (`/apps/**/text_data/`) — файл **не коммитится**.

| Property | Rule |
|----------|------|
| **Канон** | Таблица §Fixture credentials выше — единственный источник истины для email/password |
| **Содержимое JSON** | Подмножество: по одному пользователю на роль `admin`, `client`, `trainer` |
| **Синхронизация** | Значения в JSON **MUST** совпадать с seed; при изменении fixtures — обновить JSON локально |
| **Seed script** | **MUST NOT** читать этот файл — seed использует `packages/db/prisma/seed/fixtures.ts` (или inline constants) |

**Формат:**

```json
{
  "description": "Dev fixture credentials (local/CI only). Canon: docs/prds/03_data_model/seed_data_spec.md",
  "users": [
    { "role": "admin", "email": "admin@pulse.dev", "password": "admin123" },
    { "role": "client", "email": "client@pulse.dev", "password": "client123" },
    { "role": "trainer", "email": "anna@pulse.dev", "password": "trainer123" }
  ]
}
```

Полный seed graph (12 пользователей, bookings, reviews) — только через `npx prisma db seed`; JSON не заменяет seed.

Operational how-to: [`seed_and_fixtures_guide.md`](../../implementation/mvp/guides/seed_and_fixtures_guide.md) §Local credentials JSON.

---

## Seed graph (entities & counts)

### 1. Lookup: specializations

**MUST** upsert by `slug`:

| slug | name |
|------|------|
| `cardio` | Cardio |
| `pilates` | Pilates |
| `strength` | Strength Training |
| `hiit` | HIIT |
| `stretching` | Stretching |

### 2. Users & trainer profiles

| User | Profile status | timezone | specializations | photo_url |
|------|----------------|----------|-----------------|-----------|
| admin@pulse.dev | — (no trainer profile) | — | — | — |
| client@pulse.dev | — | — | — | avatar (seed URL) |
| sofia@pulse.dev | — | — | — | avatar (seed URL) |
| max@pulse.dev | — | — | — | null |
| nina@pulse.dev | — | — | — | null |
| anna@pulse.dev | `approved` | `Europe/Berlin` | cardio, pilates | seed URL |
| dmitry@pulse.dev | `approved` | `America/Chicago` | strength, hiit | null |
| maria@pulse.dev | `approved` | `America/New_York` | pilates, stretching | seed URL |
| ivan@pulse.dev | `approved` | `Europe/London` | hiit, strength | null |
| elena@pulse.dev | `approved` | `Europe/Berlin` | cardio, stretching | seed URL |
| sergey@pulse.dev | `approved` | `America/Los_Angeles` | strength | null |
| pending@pulse.dev | `pending` | `Europe/Paris` | cardio | null |

**Approved trainers MUST have:**

- `submitted_at` set (past date)
- `rating_avg` / `rating_count` plausible (e.g. 4.5–4.9, count 12–48)
- `bio`, `experience_years`, optional `photo_url` placeholder (null OK MVP)

**Pending trainer MUST have:**

- `submitted_at` set
- at least one `verification_document` row (optional `file_asset` stub `ready` or null blob MVP)

### 3. Services (per approved trainer)

**SHOULD** — 2 active services each:

| Trainer | Example services | duration | price_cents |
|---------|------------------|----------|-------------|
| Anna | «Cardio Endurance 60», «Pilates Core 45» | 60 / 45 | 3500 / 4000 |
| Dmitry | «Strength Basics 60», «HIIT 30» | 60 / 30 | 4500 / 3000 |
| Maria | «Pilates 50», «Stretch & Recover 40» | 50 / 40 | 3800 / 3200 |
| Ivan | «CrossFit WOD 45», «HIIT Blast 30» | 45 / 30 | 4200 / 3100 |
| Elena | «Morning Cardio 60», «Mobility Flow 45» | 60 / 45 | 3600 / 3300 |
| Sergey | «Powerlifting 90», «Strength Fundamentals 60» | 90 / 60 | 5500 / 4800 |

All `is_active: true`, `currency: USD`.

### 4. Weekly schedule

**SHOULD** — each approved trainer: Mon–Fri 09:00–17:00 local (`trainer_weekly_interval`), `day_of_week` 0–4.

**SHOULD** — one `trainer_schedule_exception` blocked date within next 14 days (smoke calendar UI).

### 5. Bookings (client@pulse.dev)

| Status | Count | Notes |
|--------|-------|-------|
| `pending` | 1 | With Anna, starts_at +3 days |
| `confirmed` | 1 | With Dmitry, starts_at +5 days |
| `completed` | 5 | See review matrix below |
| `cancelled` | 1 | With Anna, past |

**Completed bookings (client@pulse.dev) — review smoke matrix:**

| ID suffix | Trainer | Review | Purpose |
|-----------|---------|--------|---------|
| `…2203` | Maria | **Yes** (5★) | «Отзыв оставлен» UI |
| `…2205` | Anna | **No** | Primary P09 submit smoke |
| `…2206` | Dmitry | **No** | Repeat submit smoke |
| `…2207` | Elena | **No** | Repeat submit smoke |
| `…2208` | Ivan | **Yes** (4★) | Second «Отзыв оставлен» row |

**MUST** — snapshot fields on booking (`service_name_snapshot`, `price_cents`, `duration_minutes`) match service at seed time.

### 6. Wishlist

**SHOULD** — client wishlists Anna + Maria (not Dmitry) — smoke wishlist page.

### 7. Reviews

**MUST** — seed reviews on completed bookings `…2203` (Maria, 5★) and `…2208` (Ivan, 4★).

**MUST** — three **completed bookings without review** (`…2205` Anna, `…2206` Dmitry, `…2207` Elena) for repeatable P09 manual smoke.

**MUST** — recalc each affected trainer `rating_avg` / `rating_count` from non-hidden reviews after seed.

### 8. Admin moderation samples (optional SHOULD)

| Entity | Purpose |
|--------|---------|
| `complaint` | 1 `open`, medium priority — admin complaints list |
| `refund_request` | 1 `pending` linked to cancelled booking — admin refunds |

### 9. Explicitly NOT seeded on MVP

| Data | Reason |
|------|--------|
| `delivery_log` rows | [`INV-12`](../02_domain_model/domain_invariants.md) — no email runtime |
| `job_execution` rows | Post-MVP cron |
| Stripe/Daily.co IDs | Post-MVP nullable columns stay null |
| `password_reset_token` | Post-MVP email flow |

---

## Implementation structure

**Target path:** `packages/db/prisma/seed.ts` (+ optional `seed/` modules).

**MUST** — execution order (FK-safe):

1. Specializations
2. Users (all roles)
3. Trainer profiles + specializations join
4. Services
5. Weekly intervals + exceptions
6. Bookings
7. Reviews (+ rating update)
8. Wishlist
9. Complaints / refunds (if included)
10. Verification docs for pending trainer

### Idempotent pattern (Prisma v7 + adapter)

```typescript
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function upsertUser(email: string, data: { fullName: string; role: string; password: string }) {
  return prisma.user.upsert({
    where: { email },
    update: { fullName: data.fullName },
    create: {
      email,
      fullName: data.fullName,
      role: data.role as "client" | "trainer" | "admin",
      passwordHash: await bcrypt.hash(data.password, 12),
    },
  });
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_SEED !== "true") {
    throw new Error("Refusing to run dev seed in production");
  }
  // ... ordered steps per graph above
  console.log("✓ Pulse dev seed complete — see seed_data_spec.md for credentials");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
```

**SHOULD** — extract constants (`FIXTURE_USERS`) in `seed/fixtures.ts` for test reuse.

**package.json / prisma.config.ts:**

```typescript
// prisma.config.ts
migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
datasource: { url: env("DIRECT_URL") },
```

---

## Smoke routes enabled by seed

After seed + migrate, manual smoke **SHOULD** succeed without extra setup:

| Route | Actor | Expected |
|-------|-------|----------|
| `/trainers` | guest | ≥ 3 approved trainers |
| `/trainers/[anna-id]` | guest | Services + schedule preview |
| `/auth/login` | client@pulse.dev | Client dashboard |
| `/client/bookings` | client | 8 bookings across tabs; Past tab: 5 completed (3 review-eligible, 2 reviewed) |
| `/client/reviews/22222222-2222-4222-8222-222222222205` | client | Review form (Anna, no review) — primary smoke |
| `/client/reviews/22222222-2222-4222-8222-222222222206` | client | Review form (Dmitry, no review) — repeat smoke |
| `/client/reviews/22222222-2222-4222-8222-222222222203` | client | Redirect — Maria already reviewed → `/client/bookings/…2203` |
| `/book/[trainerId]` | client | Available slots from weekly schedule |
| `/trainer/dashboard` | anna@pulse.dev | Today/upcoming sessions |
| `/admin/trainers` | admin | pending@pulse.dev in queue |
| `/admin/complaints` | admin | Open complaint (if seeded) |

Aligns with [`pages_functional_spec.md`](../01_product_scope/pages_functional_spec.md) happy paths.

---

## Happy paths

1. Developer runs `migrate deploy` → `db seed` → logs in as client → sees bookings.
2. Re-run seed idempotent — no duplicate users/emails; booking counts stable (upsert by natural keys or wipe scoped dev tables).
3. CI job migrates empty DB, seeds, runs smoke API checks.

---

## Negative paths

| Scenario | Expected |
|----------|----------|
| Seed on production without flag | Script throws; no data |
| Missing DIRECT_URL local | Clear error from Prisma config |
| Partial failed seed | Transaction per major section OR documented cleanup re-run |
| Invalid timezone string | Domain validation fails at profile upsert — use IANA from spec |

---

## Security paths

| Rule | Enforcement |
|------|-------------|
| Admin role only via seed/fixture | No seed path creates admin from public register — [`FM-005`](../02_domain_model/failure_modes_catalog.md#fm-005) |
| Dev passwords weak by design | Documented; never in prod |
| Seed does not disable auth | Fixtures use normal Credentials flow |

---

## Concurrency notes

Seed is single-threaded CLI — no race concerns. **MUST NOT** run two seed processes against same DB concurrently.

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Seed schema drift vs Prisma | CI step: seed after migrate in pipeline |
| Fixture emails differ from docs | Single `fixtures.ts` source; `dev-users.json` mirrors §Fixture credentials only |
| Pages spec expects data seed lacks | Cross-check smoke table above each phase |
| Interim pages seed snippet outdated | This doc wins over `default_docs` |

---

## Requirements

1. **MUST** — include admin, client, ≥3 approved trainers, 1 pending trainer.
2. **MUST** — bcrypt cost 12 for all fixture passwords.
3. **MUST** — idempotent re-run safe for local dev.
4. **SHOULD** — bookings cover all four statuses for client tabs.
5. **SHOULD** — at least two timezones across trainers (FM-009 manual smoke).
6. **MUST NOT** — insert `delivery_log` / send email in seed.
7. **MUST NOT** — use seed as production data load mechanism.

---

## Acceptance criteria

- [ ] All fixture emails/passwords documented
- [ ] Entity graph covers catalog, booking, admin queue smoke
- [ ] Prisma v7 adapter + DIRECT_URL pattern documented
- [ ] Production guard documented
- [ ] Idempotent strategy explicit
- [ ] Links to pages_functional_spec smoke routes
- [ ] INV-12 respected (no delivery_log)
- [ ] Local credentials JSON path and gitignore policy documented

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`database_schema_v1.md`](./database_schema_v1.md) | DDL + migration checklist |
| [`pages_functional_spec.md`](../01_product_scope/pages_functional_spec.md) | Routes enabled by fixtures |
| [`mvp_scope.md`](../01_product_scope/mvp_scope.md) | Dev seed SHOULD |
| [`indexing_strategy.md`](./indexing_strategy.md) | EXPLAIN on seeded volume |
| [`data_access_patterns.md`](./data_access_patterns.md) | Queries validated by seed data |
| [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md) | Role fixture matrix |
| [`../../implementation/mvp/guides/seed_and_fixtures_guide.md`](../../implementation/mvp/guides/seed_and_fixtures_guide.md) | W12 seed how-to |
| [`../../implementation/mvp/guides/local_dev_setup.md`](../../implementation/mvp/guides/local_dev_setup.md) | W12 local setup |
| `apps/text_data/dev-users.json` | Local gitignored mirror — §Local credentials JSON |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W6-03

---

## Agent notes

- When implementing seed, update only `packages/db/prisma/seed.ts` — do not scatter fixture inserts in apps/web.
- Use `upsert` on natural keys (`email`, `slug`); for bookings use deterministic IDs or delete client bookings section before re-insert.
- `pending@pulse.dev` is required for P05 admin smoke — do not approve in seed.
- Photo URLs may be null; catalog cards use placeholder component.
- `apps/text_data/dev-users.json` — local dev convenience only; seed **MUST NOT** import it; keep in sync with §Fixture credentials manually.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — canonical dev seed specification |
| 2026-05-23 | §Local credentials JSON — `apps/text_data/dev-users.json` |
