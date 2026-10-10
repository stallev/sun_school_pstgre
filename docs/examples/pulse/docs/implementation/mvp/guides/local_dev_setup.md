# Local Dev Setup — Pulse MVP

**Тип:** Guide  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W12  
**Зависит от:** [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md), [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md)  
**Связанные документы:** [`neon_prisma_migrations_guide.md`](./neon_prisma_migrations_guide.md), [`seed_and_fixtures_guide.md`](./seed_and_fixtures_guide.md)

---

## Purpose

Пошаговая инструкция **первого локального запуска** Pulse monorepo: prerequisites, env, Neon branch, migrate, seed, dev server, smoke login. Целевая аудитория — разработчики и AI-агенты на фазе **P01**.

---

## Scope / Out of scope

**In scope:** Node/npm, repo clone, `.env` template, `apps/web` dev, `packages/db` CLI from monorepo root.

**Out of scope:** Production deploy (→ vercel_deploy_guide), post-MVP Resend/Cron, Windows-specific IDE setup beyond shell notes.

---

## Prerequisites

| Tool | Version | Verify |
|------|---------|--------|
| Node.js | **20 LTS** or **22 LTS** | `node -v` |
| npm | ≥ 10 | `npm -v` |
| Git | any recent | `git --version` |
| Neon account | free tier OK | [console.neon.tech](https://console.neon.tech) |

**SHOULD** — Vercel CLI (`npm i -g vercel`) for optional env pull later.

---

## Happy path — first run

### 1. Clone and install

```bash
git clone <repo-url> fitapp
cd fitapp
npm install
```

Monorepo workspaces: `apps/web`, `packages/*` (scaffolded in P01).

### 2. Create Neon dev branch

Follow [`neon_prisma_migrations_guide.md`](./neon_prisma_migrations_guide.md) §Create dev branch.

Copy **pooled** and **direct** connection strings from Neon dashboard.

### 3. Configure environment

Create `apps/web/.env.local` (and `packages/db/.env` if CLI runs from db package):

```bash
# Neon — pooled for runtime
DATABASE_URL="postgresql://USER:PASS@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Neon — direct for Prisma CLI migrate/seed
DIRECT_URL="postgresql://USER:PASS@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Auth.js — generate: openssl rand -base64 32
AUTH_SECRET="replace-with-random-secret"

# Local auth callback base
AUTH_URL="http://localhost:3000"
```

**MVP — do NOT add:** `RESEND_API_KEY`, `CRON_SECRET` (until P21).

Optional when file upload ships (S3 — server-only):

```bash
AWS_IAM_USER_ACCESS_KEY="..."
AWS_IAM_USER_SECRET_ACCESS_KEY="..."
S3_BUCKET_REGION="eu-central-1"
S3_BUCKET_NAME="your-bucket-name"
```

### 4. Database migrate + seed

After `packages/db` exists (P01):

```bash
cd packages/db
npx prisma migrate deploy
npx prisma db seed
cd ../..
```

Or from root once workspace scripts exist:

```bash
npm run db:migrate:deploy -w @pulse/db
npm run db:seed -w @pulse/db
```

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Smoke login

Use dev credentials from [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) or локальный **`apps/text_data/dev-users.json`** (gitignored, см. [`seed_and_fixtures_guide.md`](./seed_and_fixtures_guide.md) §Local credentials JSON):

| Email | Password | Role |
|-------|----------|------|
| `client@pulse.dev` | `client123` | client |
| `admin@pulse.dev` | `admin123` | admin |
| `anna@pulse.dev` | `trainer123` | trainer |

**SHOULD** — создать `apps/text_data/dev-users.json` один раз после первого seed; значения **MUST** совпадать с seed_data_spec.

**Expected:** redirect to role dashboard; no Prisma connection errors in terminal.

---

## Negative paths

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| `P1001` Can't reach database | Wrong `DATABASE_URL`, Neon paused | Wake branch; verify SSL `sslmode=require` |
| Migrate fails on pooler URL | Used pooled for CLI | Set `DIRECT_URL` in prisma.config.ts |
| `AUTH_SECRET` missing | Env not loaded | Add to `.env.local`; restart dev |
| Port 3000 in use | Other process | `PORT=3001 npm run dev` |
| Seed refuses production | Guard working | Local only; check `NODE_ENV` |
| Workspace `@pulse/db` not found | P01 not scaffolded | Complete P01_tasks first |

---

## Security paths

- **MUST NOT** commit `.env.local` or real Neon passwords.
- **MUST** use dev fixture passwords only locally — never reuse in production.
- **SHOULD** use separate Neon branch per developer.

---

## Concurrency notes

N/A for local setup. Do not run two `migrate dev` against same branch without coordination.

---

## Verification checklist

After setup, confirm:

- [ ] `npm run dev` starts without errors
- [ ] Home `/` loads
- [ ] Login as `client@pulse.dev` succeeds
- [ ] `/trainers` shows ≥ 3 trainers (after P02 catalog)
- [ ] `npm run typecheck` passes (when packages exist)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md) | Migrate policy |
| [`neon_prisma_migrations_guide.md`](./neon_prisma_migrations_guide.md) | Neon detail |
| [`seed_and_fixtures_guide.md`](./seed_and_fixtures_guide.md) | Seed commands |
| [`P01_phase_description.md`](../phases_tasks_descriptions/P01_phase_description.md) | Scaffold phase |
| [`P01_tasks.md`](../tasks/P01_tasks.md) | Agent checklist |
| [`../README.md`](../README.md) | Implementation MVP index |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W12-05

---

## Agent notes

- On Windows PowerShell, env files same format; use `openssl` or `[Convert]::ToBase64String` for `AUTH_SECRET`.
- If monorepo packages not yet created, document blocker — do not invent alternate DB layout.
- Link smoke routes to seed_data_spec §Smoke routes.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — local dev setup guide |
| 2026-05-23 | Smoke login — ссылка на `apps/text_data/dev-users.json` |
