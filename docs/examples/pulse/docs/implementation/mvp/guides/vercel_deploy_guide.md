# Vercel Deploy Guide — Pulse MVP

**Тип:** Guide  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W12  
**Зависит от:** [`adr_001_stack_and_runtime.md`](../../../prds/07_governance/adr_001_stack_and_runtime.md), [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md)  
**Связанные документы:** [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md), [`local_dev_setup.md`](./local_dev_setup.md)

**Context7 verified:** Next.js 16 env vars — server-only unless `NEXT_PUBLIC_` prefix (`/vercel/next.js/v16.2.2`).

---

## Purpose

Инструкция деплоя **apps/web** на Vercel: project linking, root directory, env vars per environment, preview vs production, post-deploy migrate. Для P01 scaffold и ongoing releases.

---

## Scope / Out of scope

**In scope:** Vercel project config, env matrix, build settings, Auth.js production URLs, Neon branch pairing.

**Out of scope:** Custom domain DNS detail, AWS migration, Netlify (forbidden per ADR-001).

---

## Project settings

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `apps/web` |
| Build Command | `cd ../.. && npm run build` or `npm run build -w web` |
| Install Command | `npm install` (from repo root) |
| Output Directory | default (`.next`) |
| Node.js Version | 20.x |
| Region | **fra1** (Frankfurt) per ADR-001 |

Monorepo: Vercel **must** install from repository root so workspaces resolve.

---

## Environment variables

Configure in Vercel Dashboard → Project → Settings → Environment Variables.

| Variable | Preview | Production | Notes |
|----------|:-------:|:------------:|-------|
| `DATABASE_URL` | ✅ | ✅ | Neon **pooled** URL |
| `DIRECT_URL` | ✅ | ✅ | Neon **direct** — for migrate step |
| `AUTH_SECRET` | ✅ | ✅ | Unique per env recommended |
| `AUTH_URL` | ✅ | ✅ | `https://<preview-url>` / `https://<prod-domain>` |
| `AWS_IAM_USER_ACCESS_KEY` | ✅ | ✅ | When upload feature enabled |
| `AWS_IAM_USER_SECRET_ACCESS_KEY` | ✅ | ✅ | When upload feature enabled |
| `S3_BUCKET_REGION` | ✅ | ✅ | S3 bucket region |
| `S3_BUCKET_NAME` | ✅ | ✅ | When upload feature enabled |
| `CRON_SECRET` | ❌ MVP | ❌ MVP | P21 post-MVP |
| `RESEND_API_KEY` | ❌ MVP | ❌ MVP | P21 post-MVP |

**MUST** — `AUTH_URL` matches deployed origin for Auth.js callbacks ([`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md)).

**MUST NOT** — prefix secrets with `NEXT_PUBLIC_`.

### Pull env locally (optional)

```bash
vercel link
vercel env pull apps/web/.env.local
```

Sanitize before use — preview URLs differ from local `AUTH_URL`.

---

## Happy path — first deploy

1. Push repo to GitHub; import project in Vercel.
2. Set Root Directory = `apps/web`; enable monorepo install from root.
3. Add env vars for **Preview** and **Production** (separate Neon branches recommended).
4. Deploy preview from PR — verify build logs.
5. Run migrate on preview DB:

```bash
# CI or manual with preview DIRECT_URL
cd packages/db && npx prisma migrate deploy
```

6. Smoke preview URL: `/`, `/auth/login`.
7. Merge to main → production deploy → migrate prod DB.

**Postconditions:** App serves; auth login works; no missing env errors in function logs.

---

## Preview vs production

| Aspect | Preview | Production |
|--------|---------|------------|
| Neon branch | `preview/*` or dedicated | `main` production branch |
| `AUTH_URL` | Vercel preview hostname | Custom domain |
| Seed data | ❌ **MUST NOT** auto-seed | ❌ **MUST NOT** |
| Migrations | ✅ `migrate deploy` | ✅ `migrate deploy` |

**SHOULD** — isolate preview DB from production to prevent test data leakage.

---

## Build integration (SHOULD)

Add to root `package.json` when `@pulse/db` exists:

```json
{
  "scripts": {
    "vercel-build": "npm run db:migrate:deploy -w @pulse/db && npm run build -w web"
  }
}
```

Set Vercel Build Command to `npm run vercel-build` from root if migrate should run every deploy.

**CAUTION:** serialize migrate — failed migrate must fail build.

---

## Negative paths

| Issue | Cause | Fix |
|-------|-------|-----|
| Build: workspace not found | Install not from root | Fix install command |
| Auth redirect loop | Wrong `AUTH_URL` | Match exact deployment URL |
| DB SSL errors | Missing `sslmode=require` | Fix connection string |
| 500 on all pages post-deploy | Schema not migrated | Run `migrate deploy` |
| S3 upload 403 | Missing/invalid AWS credentials | Add S3 env vars per [`s3-upload-agent-instruction.md`](../../../guidelines/nextjs/s3-upload-agent-instruction.md) |

---

## Security paths

- Env vars only in Vercel — never in client bundle.
- Use Vercel **Protected Preview** if staging contains real-like data.
- Rotate `AUTH_SECRET` if leaked; invalidates sessions.
- Production Neon credentials scoped to production branch only.

---

## Concurrency notes

Parallel preview deploys on same Neon branch: last migrate wins — prefer branch-per-preview or serialized migrate job.

---

## Post-MVP additions (P21)

When email phase unlocks:

1. Add `RESEND_API_KEY`, `CRON_SECRET` to Production (+ Preview if testing).
2. Deploy `vercel.json` crons — [`cron_jobs_setup_guide.md`](./cron_jobs_setup_guide.md).
3. Verify Cron invocations in Vercel dashboard.

---

## Acceptance criteria

- [ ] Root directory and monorepo install documented
- [ ] Env matrix Preview/Production complete
- [ ] AUTH_URL alignment noted
- [ ] MVP excludes Resend/Cron env
- [ ] Migrate deploy step referenced
- [ ] ADR-001 fra1 region noted

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_001_stack_and_runtime.md`](../../../prds/07_governance/adr_001_stack_and_runtime.md) | Vercel stack |
| [`adr_002_next162_vercel_runtime_policy.md`](../../../prds/07_governance/adr_002_next162_vercel_runtime_policy.md) | Next 16 runtime |
| [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) | AUTH_URL |
| [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md) | Migrate |
| [`neon_prisma_migrations_guide.md`](./neon_prisma_migrations_guide.md) | Neon branches |
| [`../README.md`](../README.md) | MVP index |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W12-06

---

## Agent notes

- Do not configure Netlify for Pulse.
- Pin Next.js 16.2.6 in `apps/web/package.json` — ADR-002.
- Preview deploy is default verification before production promote.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — Vercel deploy guide |
