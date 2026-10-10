# ADR-001: Stack, Hosting and Runtime Policy

**Дата:** 2026-05-23  
**Статус:** ACCEPTED  
**Проект:** Pulse (fitapp)

---

## Контекст

Pulse — MVP маркetplace фитнес-тренеров. Продуктовые требования зафиксированы в [`docs/default_docs/`](../../default_docs/).

Архитектурные **подходы** (monorepo, AI-first docs, двухконтурная модель, layered packages) наследуются из референсного проекта **lampto** (BSFY), где принят стек Netlify + Next.js 16 + AWS SAM.

Необходимо зафиксировать **отличия стека Pulse**, чтобы агенты не копировали Netlify/AWS-паттерны lampto слепо.

---

## Решение

### Web contour

| Компонент | Выбор |
|-----------|-------|
| Framework | **Next.js 16.3.0** (pinned) App Router, TypeScript — see [ADR-002](./adr_002_next162_vercel_runtime_policy.md) |
| Hosting | **Vercel** (preview per PR, region fra1) |
| Bundler | Turbopack (default) |
| UI | shadcn/ui + Tailwind CSS v4, Warm Forest tokens |
| Auth | **Auth.js v5**, Credentials provider, JWT sessions, role in token |
| ORM | **Prisma v7** |
| Database | **Neon PostgreSQL 17** — pooled `DATABASE_URL`, `DIRECT_URL` for migrations |
| File storage | **AWS S3** — profile photos, certificates, verification documents (presigned PUT/GET) |
| Transactional email | **Resend** (post-MVP send; schema `delivery_log` on MVP) |
| Toasts | Sonner |

### Jobs contour (MVP)

| Компонент | Выбор |
|-----------|-------|
| Scheduling | **Vercel Cron** (post-MVP for email) |
| Execution | Vercel Serverless Functions (dedicated route handlers or `apps/workers`) |
| Idempotency | `idempotency_key` + `delivery_log` table — **DDL on MVP**, runtime post-MVP |

### Monorepo layout

Identical **structure** to lampto:

`apps/web`, `apps/workers`, `packages/domain`, `packages/policy/{edge,server}`, `packages/db`

### Deferred (Post-MVP)

| Feature | Technology | Notes |
|---------|------------|-------|
| Video sessions | Daily.co | Nullable fields in schema from day one |
| Payments | Stripe Connect | Nullable fields; webhooks later |
| OAuth Google | Auth.js provider | Credentials sufficient for MVP |
| AWS SAM workers | EventBridge + SQS + Lambda | When email/queue volume exceeds Vercel Cron limits |

---

## Обоснование

1. **Product docs specify Vercel hosting** — optimized for Next.js, preview deployments; **object storage is S3** (not Vercel Blob) for portable file lifecycle and alignment with lampto FileAsset pattern.
2. **Credentials auth** matches MVP (email/password, bcrypt) — no Google OAuth dependency for launch.
3. **Resend** — simpler transactional email than AWS SES for MVP team size; aligns with Vercel ecosystem.
4. **Vercel Cron** — sufficient for 24h reminders and low-volume batch jobs at MVP scale; lampto idempotency pattern still applies.
5. **Structural parity with lampto** — agents reuse documented patterns (domain/policy/db, phases, contracts) without relearning architecture.

---

## Отклонённые альтернативы

| Альтернатива | Почему отклонена |
|--------------|------------------|
| Netlify + Next.js 16 (lampto stack) | Product spec targets Vercel; would contradict PRD and prototype deployment assumptions |
| AWS SAM jobs on day one | Higher ops cost for MVP email volume; defer until proven need |
| Supabase Auth | Product spec requires Auth.js v5 + Credentials + role in JWT |
| Single-app (no monorepo) | Conflicts with lampto reference architecture and future workers split |

---

## Последствия

- Guidelines ported from lampto **must be adapted** for Vercel runtime (not Netlify).
- **Next.js 16.3.0 runtime** (proxy.ts, async APIs, cache invalidation, Instant Navigations / Partial Prefetching) — [ADR-002](./adr_002_next162_vercel_runtime_policy.md). Lampto ADR-026 (Netlify) is **not applicable**; adopt Next 16 interception rules from lampto ADR-022 pattern via ADR-002.
- Agents reading lampto docs must check ADR-001 + ADR-002 for hosting/version differences.
- When migrating jobs to AWS, add **ADR-00N** — mechanical extraction, not domain rewrite.

---

## Связанные документы

- [`adr_index.md`](./adr_index.md) — реестр ADR
- [`decision_process.md`](./decision_process.md) — процесс принятия решений
- [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)
- [`docs/reference/lampto_project_reference.md`](../../reference/lampto_project_reference.md)
- [`docs/default_docs/fitness-platform-mvp.md`](../../default_docs/fitness-platform-mvp.md)
- Pulse runtime policy: [ADR-002](./adr_002_next162_vercel_runtime_policy.md)
- Email jobs (post-MVP): [ADR-006](./adr_006_idempotent_email_delivery.md)
- Deploy & ops: [`vercel_deploy_guide.md`](../../implementation/mvp/guides/vercel_deploy_guide.md), [`06_operations/README.md`](../06_operations/README.md)
- Lampto ADR reference (patterns only): [`adr_022_next16_vercel_runtime_policy.md`](../../examples/lampto/docs/prds/07_governance/adr_022_next16_vercel_runtime_policy.md)

---

## Checklist for agents

- [ ] Do not configure Netlify for Pulse
- [ ] Use Vercel env vars pattern (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`)
- [ ] Use Resend for email when post-MVP email ships — not SES; **do not** wire Resend on MVP unless scope changes
- [ ] Follow lampto **package boundaries**, not lampto **hosting** config
- [ ] File uploads: **AWS S3** presigned URLs — see [ADR-007](./adr_007_file_asset_blob_lifecycle.md), [`s3-upload-agent-instruction.md`](../../guidelines/nextjs/s3-upload-agent-instruction.md)

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — ACCEPTED |
| 2026-05-24 | v1.1 — File storage: Vercel Blob → **AWS S3** (presigned PUT/GET) |
