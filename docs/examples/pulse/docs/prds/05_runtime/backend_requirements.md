# Backend Requirements — Pulse MVP

**Тип:** PRD  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W5  
**Зависит от:** [`adr_001_stack_and_runtime.md`](../07_governance/adr_001_stack_and_runtime.md), [`adr_006_idempotent_email_delivery.md`](../07_governance/adr_006_idempotent_email_delivery.md)  
**Связанные документы:** [`monorepo_packages.md`](./monorepo_packages.md), [`auth_runtime_spec.md`](./auth_runtime_spec.md)

---

## Purpose

Требования к **backend runtime** Pulse: контуры Web и Jobs, env vars, handler types, запреты и MVP boundaries. Дополняет ADR-001 operational detail для implementers и AI agents.

---

## Scope / Out of scope

**In scope:** `apps/web` BFF, planned `apps/workers`, env, serverless constraints, email/jobs MVP boundary.

**Out of scope:** Frontend UX, CI YAML detail (W12), individual domain use-case logic.

---

## 1. Application contours

### 1.1 Web contour (`apps/web`)

| Responsibility | MUST |
|----------------|------|
| UI rendering | RSC-first App Router |
| Input validation | Zod at Action/Handler boundary |
| Auth session | Auth.js `auth()` in protected handlers |
| Authorization | `@pulse/policy-server` before domain |
| Domain invocation | Thin adapter — no business rules inline |
| Cache | Per [`cache_revalidation_policy.md`](./cache_revalidation_policy.md) |
| File upload | Presigned PUT via Server Action → **AWS S3** |

**MUST NOT:**

- Long-running loops, batch email, or cron logic in Server Actions.
- Direct Prisma in Client Components.
- Import `@pulse/policy-server` from `proxy.ts`.

### 1.2 Jobs contour (`apps/workers` — planned)

| Responsibility | MVP | Post-MVP |
|----------------|-----|----------|
| Cron entrypoints | Schema only | `/api/jobs/*` or workers app |
| Email delivery | ❌ | Resend + delivery_log |
| Reminder batch | ❌ | 24h booking reminder |
| Idempotency | DDL ready | FM-011 enforcement |

**MUST** — jobs invoke same `packages/domain` + `packages/db` as web.

**MUST NOT** — duplicate business rules in job handlers.

---

## 2. Handler types

| Type | Use when | Auth | Policy |
|------|----------|------|--------|
| Server Action | Form mutations, redirects | `auth()` | Yes |
| Route Handler | Webhooks, cron, upload presign, Auth.js | varies | Yes for protected |
| RSC loader (server component) | Read models | `auth()` if protected | Yes for object reads |
| `proxy.ts` | Route perimeter | JWT only | policy-edge only |

Prefer Server Actions for MVP mutations unless streaming/binary required.

---

## 3. Environment variables

| Variable | Contour | MVP required |
|----------|---------|--------------|
| `DATABASE_URL` | Web, Jobs | ✅ pooled Neon |
| `DIRECT_URL` | Migrations CLI | ✅ |
| `AUTH_SECRET` | Web | ✅ |
| `AUTH_URL` | Web (Vercel) | ✅ production |
| `AWS_IAM_USER_ACCESS_KEY` | Web upload | ✅ when upload ships |
| `AWS_IAM_USER_SECRET_ACCESS_KEY` | Web upload | ✅ when upload ships |
| `S3_BUCKET_REGION` | Web upload | ✅ when upload ships |
| `S3_BUCKET_NAME` | Web upload | ✅ when upload ships |
| `CRON_SECRET` | Jobs | ✅ when cron ships |
| `RESEND_API_KEY` | Jobs | ❌ post-MVP |

Per Prisma v7 (Context7 `/websites/prisma_io`): migrations use `DIRECT_URL` in `prisma.config.ts`.

---

## 4. Serverless constraints (Vercel)

| Constraint | Policy |
|------------|--------|
| Function duration | Keep mutations < few seconds; offload batch to jobs |
| Connection pooling | Always `DATABASE_URL` pooled for runtime |
| Cold start | Minimize heavy imports in hot paths |
| Region | fra1 default per ADR-001 |
| Background after response | **No** `unstable_after` for email — Cron only (ADR-002) |

---

## 5. Data access rules

1. **MUST** — Prisma client singleton in `@pulse/db`; server-only import.
2. **MUST** — transactions for multi-row mutations (booking, review+rating).
3. **SHOULD** — repositories in `@pulse/db`; raw SQL only in db package.
4. **MUST NOT** — `$queryRaw` in `apps/web` route files (→ [`data_access_patterns.md`](../03_data_model/data_access_patterns.md)).

---

## 6. Email & notifications (MVP boundary)

Per [ADR-006](../07_governance/adr_006_idempotent_email_delivery.md):

| MVP | Post-MVP |
|-----|----------|
| Toast + in-app state | + transactional email |
| No `delivery_log` writes | INSERT with idempotency_key |
| No Resend import | Resend in jobs contour only |

User feedback on booking created: **toast + redirect** — not email ([`email_notifications_matrix.md`](../01_product_scope/email_notifications_matrix.md)).

---

## Happy paths

- Client submits booking Action → policy → domain transaction → `updateTag('bookings')` → redirect.
- Trainer toggles service → optimistic UI + Action → domain → revalidate trainer profile tag.
- Admin approves trainer → domain transition → revalidate catalog tags.

---

## Negative paths

| Failure | Response |
|---------|------------|
| Validation error | Field errors / toast.error |
| Policy deny | FORBIDDEN; no partial DB write |
| Domain conflict | Mapped code; FM-001 toast |
| DB unavailable | error.tsx / retry |

---

## Security paths

- All mutations authenticated unless explicitly public (register/login).
- Cron routes verify secret header.
- No stack traces to client in production.

---

## Concurrency & races

- Domain transactions own overlap/idempotency — see failure_modes_catalog.
- Web layer **MUST** use `disabled` + `aria-busy` on submit (ui-mutation-pending).

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Resend in web on MVP | grep + INV-12 |
| Business logic in Action | Extract to domain |
| Missing env in preview | Vercel env docs W12 |

---

## Requirements summary

1. **MUST** — thin BFF; domain holds rules.
2. **MUST** — two-contour separation for email.
3. **MUST** — ADR-002 async APIs and proxy.
4. **SHOULD** — structured `MutationResult` from domain to web.
5. **MUST NOT** — Netlify/AWS SAM patterns on MVP.

---

## Acceptance criteria

- [ ] Web vs Jobs contours documented with MVP/post-MVP split
- [ ] Env table complete for P01 scaffold
- [ ] Handler matrix includes policy requirement
- [ ] ADR-006 MVP boundary referenced
- [ ] Links to monorepo_packages and auth_runtime_spec

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_001_stack_and_runtime.md`](../07_governance/adr_001_stack_and_runtime.md) | Stack ADR |
| [`adr_006_idempotent_email_delivery.md`](../07_governance/adr_006_idempotent_email_delivery.md) | Email jobs |
| [`monorepo_packages.md`](./monorepo_packages.md) | Packages |
| [`../../architecture_learning_pack/01_architecture_overview.md`](../../architecture_learning_pack/01_architecture_overview.md) | Overview |
| [`../06_operations/migration_runbook.md`](../06_operations/migration_runbook.md) | W12 migrate runbook |
| [`../06_operations/observability_plan.md`](../06_operations/observability_plan.md) | W12 observability |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W5-06

---

## Agent notes

- P01 scaffold: web only; workers folder may be empty placeholder.
- Context7: Prisma Neon pooled + direct URLs for migrate.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — backend runtime requirements |
