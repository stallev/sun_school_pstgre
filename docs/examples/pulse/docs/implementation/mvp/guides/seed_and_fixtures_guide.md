# Seed & Fixtures Guide — Pulse MVP

**Тип:** Guide  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W12  
**Зависит от:** [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md)  
**Связанные документы:** [`local_dev_setup.md`](./local_dev_setup.md), [`neon_prisma_migrations_guide.md`](./neon_prisma_migrations_guide.md)

---

## Purpose

Пошаговое руководство по **запуску dev seed** Pulse: команды, prerequisites, fixture credentials, smoke routes, troubleshooting. Канон данных — [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md); этот guide — operational how-to.

---

## Scope / Out of scope

**In scope:** `prisma db seed`, env guards, re-run idempotency, smoke verification, CI optional seed.

**Out of scope:** Production bootstrap, custom fixture authoring rules (→ seed_data_spec), email/job fixtures (INV-12).

---

## Prerequisites

- [ ] Neon dev branch with migrations applied (`migrate deploy`)
- [ ] `DIRECT_URL` set (recommended for bulk seed)
- [ ] `packages/db/prisma/seed.ts` implemented (P01)
- [ ] `NODE_ENV` not `production` (unless explicit override)

---

## Happy path — run seed

### From packages/db

```bash
cd packages/db
npx prisma db seed
```

### From monorepo root (when script exists)

```bash
npm run db:seed -w @pulse/db
```

**Expected output:** banner with dev credentials reminder; no stack trace.

### Verify

1. `npx prisma studio` — check `user` count ≥ 6.
2. Login at `/auth/login` as `client@pulse.dev` / `client123`.
3. Visit `/client/bookings` — expect 4 bookings (after P08).
4. Login as `admin@pulse.dev` — `/admin/trainers` shows `pending@pulse.dev`.

---

## Fixture credentials (dev only)

**MUST** display after seed — never use in production:

| Email | Password | Role | Smoke purpose |
|-------|----------|------|---------------|
| `admin@pulse.dev` | `admin123` | admin | Moderation queue |
| `client@pulse.dev` | `client123` | client | Bookings, wishlist |
| `anna@pulse.dev` | `trainer123` | trainer | Approved — cardio/pilates |
| `dmitry@pulse.dev` | `trainer123` | trainer | Approved — strength/hiit |
| `maria@pulse.dev` | `trainer123` | trainer | Approved — NY timezone |
| `pending@pulse.dev` | `trainer123` | trainer | **Pending** — admin queue |

Full entity graph — [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) §Seed graph.

---

## Local credentials JSON

Для быстрого доступа к логинам без просмотра PRD — локальный файл **`apps/text_data/dev-users.json`** (gitignored).

1. Создайте каталог `apps/text_data/` (если ещё нет).
2. Скопируйте структуру из [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) §Local credentials JSON.
3. После `prisma db seed` используйте любую запись из `users[]` на `/auth/login`.

| Field | Meaning |
|-------|---------|
| `role` | `admin` \| `client` \| `trainer` |
| `email` | Fixture email (must match seed) |
| `password` | Plain dev password (bcrypt in DB only) |

**MUST NOT** коммитить файл — только локальная копия. Канон значений — [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) §Fixture credentials; JSON содержит **3 роли**, полный seed — **6 пользователей**.

---

## Re-run seed (idempotent)

**SHOULD** be safe to run multiple times locally:

```bash
npx prisma db seed
```

Implementation uses `upsert` on natural keys (`email`, `slug`). If duplicates appear, check seed implementation against spec §Idempotent pattern.

**MUST NOT** run concurrent seed processes on same DB.

---

## Negative paths

| Scenario | Expected | Action |
|----------|----------|--------|
| `Refusing to run dev seed in production` | Guard triggered | Use local DB only |
| FK constraint error | Wrong seed order | Fix order per spec §Implementation structure |
| Login fails after seed | Wrong hash cost | bcrypt cost 12 per ADR-003 |
| Empty catalog | Trainers not approved | Check `trainer_profile.status` in seed |
| `delivery_log` rows created | INV-12 violation | Remove from seed — post-MVP only |

---

## Security paths

| Rule | Detail |
|------|--------|
| Dev passwords documented | Weak by design — local/CI only |
| No admin via public register | Seed creates admin — FM-005 |
| Production seed blocked | Default guard in seed.ts |
| `ALLOW_DEV_SEED=true` | Emergency only; ops approval |

---

## CI usage (optional)

After migrate on ephemeral DB:

```bash
cd packages/db
npx prisma migrate deploy
npx prisma db seed
# run smoke tests
```

**MUST NOT** seed production Vercel DB in CI pipeline.

---

## Smoke route matrix

Post-seed manual checks (expand as phases ship):

| Phase | Route | Actor | Expected |
|-------|-------|-------|----------|
| P05 | `/trainers` | guest | ≥ 3 trainers |
| P06 | `/trainers/[id]` | guest | Services visible |
| P08 | `/client/bookings` | client | 4 bookings |
| P07 | `/book/[trainerId]` | client | Slots from schedule |
| P12 | `/trainer/dashboard` | anna | Upcoming sessions |
| P13 | `/admin/trainers` | admin | pending in queue |

From [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) §Smoke routes.

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) | **Canon** — what to seed |
| [`local_dev_setup.md`](./local_dev_setup.md) | First-time setup |
| [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md) | Migrate before seed |
| [`pages_functional_spec.md`](../../../prds/01_product_scope/pages_functional_spec.md) | Route behavior |
| [`../README.md`](../README.md) | MVP index |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W12-08

---

## Agent notes

- Implement seed only in `packages/db/prisma/seed.ts` — not in apps/web.
- `pending@pulse.dev` must stay pending for P13 admin smoke.
- Do not insert `job_execution` / `delivery_log` rows in seed.

---

## Acceptance criteria

- [ ] Commands for seed documented
- [ ] Fixture table matches seed_data_spec
- [ ] Production guard mentioned
- [ ] Smoke matrix linked to phases
- [ ] Local credentials JSON documented

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — seed & fixtures guide |
| 2026-05-23 | §Local credentials JSON — `apps/text_data/dev-users.json` |
