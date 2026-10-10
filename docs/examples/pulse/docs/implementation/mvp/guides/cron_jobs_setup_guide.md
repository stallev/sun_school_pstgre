# Cron Jobs Setup Guide — Pulse (Post-MVP P21)

**Тип:** Guide  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W12  
**Зависит от:** [`cron_jobs_registry.md`](../../../prds/06_operations/cron_jobs_registry.md), [`P21_phase_description.md`](../phases_tasks_descriptions/P21_phase_description.md)  
**Связанные документы:** [`email_notifications_contract.md`](../contracts/email_notifications_contract.md), [`vercel_deploy_guide.md`](./vercel_deploy_guide.md)

---

## Purpose

Пошаговая настройка **Vercel Cron** и job Route Handlers для post-MVP email (фаза **P21**). **Не выполнять на MVP P01–P13** — таблицы `job_execution` / `delivery_log` exist but remain empty ([**INV-12**](../../../prds/02_domain_model/domain_invariants.md)).

**Prerequisite:** explicit unlock in [`post_mvp_deferrals.md`](../../../prds/01_product_scope/post_mvp_deferrals.md) + P21 phase start.

---

## Scope / Out of scope

**In scope:** `vercel.json` crons, `CRON_SECRET`, `/api/jobs/*` handlers, Resend env, smoke verification, idempotency check.

**Out of scope:** MVP deployment, Resend domain DNS full tutorial, AWS Cron migration.

---

## Prerequisites checklist

- [ ] P01–P14 MVP deployed and stable
- [ ] Product sign-off for email deferral removal
- [ ] Resend account + verified sending domain
- [ ] `RESEND_API_KEY` in Vercel Production (+ Preview if testing)
- [ ] `CRON_SECRET` generated (`openssl rand -hex 32`)
- [ ] Read [`email_notifications_contract.md`](../contracts/email_notifications_contract.md)

---

## Step 1 — Environment variables

Add to Vercel project:

| Variable | Example | Environments |
|----------|---------|--------------|
| `CRON_SECRET` | random hex string | Production, Preview (test) |
| `RESEND_API_KEY` | `re_...` | Production, Preview |

**MUST NOT** expose in client code or `NEXT_PUBLIC_*`.

Local testing `.env.local`:

```bash
CRON_SECRET="local-dev-cron-secret"
RESEND_API_KEY="re_..."
```

---

## Step 2 — Register crons in vercel.json

At repo root or `apps/web/vercel.json` (match Vercel project root config):

```json
{
  "crons": [
    {
      "path": "/api/jobs/email",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/jobs/reminders",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Job definitions — [`cron_jobs_registry.md`](../../../prds/06_operations/cron_jobs_registry.md).

Deploy to enable schedules (Cron activates on production deployment).

---

## Step 3 — Implement job routes

**Target paths:**

- `apps/web/src/app/api/jobs/email/route.ts` — drains `job_execution`, sends via Resend
- `apps/web/src/app/api/jobs/reminders/route.ts` — scans T-24h bookings, enqueues E-07

**Auth pattern (MUST):**

```typescript
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ... process jobs
  return Response.json({ ok: true });
}
```

**MUST** — check `delivery_log` before send ([**FM-011**](../../../prds/02_domain_model/failure_modes_catalog.md#fm-011)).

**MUST NOT** — import Resend in Server Actions on user request path.

---

## Step 4 — Wire enqueue after mutations

After domain transaction commits (e.g. `ConfirmBooking`):

```typescript
// post-commit only — workers adapter
await enqueueEmailJob({
  jobType: "booking_confirmed",
  idempotencyKey: `booking_confirmed:${bookingId}`,
  payload: { bookingId, userId },
});
```

Details — [`email_notifications_contract.md`](../contracts/email_notifications_contract.md).

---

## Happy path — verification

1. Confirm a booking in staging → row in `job_execution`.
2. Wait for Cron (or manual curl with secret):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://<preview-url>/api/jobs/email
```

3. Verify `delivery_log.status = sent` for idempotency key.
4. Re-run curl → no second Resend send (FM-011 skip).
5. Check Vercel Cron logs — 200 responses.

---

## Negative paths

| Scenario | Expected |
|----------|----------|
| curl without secret | 401 |
| Resend API error | `delivery_log.failed`; retry per registry |
| Enqueue before commit | **Bug** — fix ordering |
| Cron on MVP branch | Routes absent or 404 — no Resend calls |
| Duplicate enqueue | UNIQUE conflict — treated as success |

---

## Security paths

- Rotate `CRON_SECRET` if leaked; update Vercel env.
- Job routes excluded from user session auth — secret only.
- Resolve email recipients from DB — never trust client payload email field.

---

## Concurrency notes

Vercel may invoke Cron concurrently — implement claim + FM-011 skip. See [`cron_jobs_registry.md`](../../../prds/06_operations/cron_jobs_registry.md) §Retry policy.

---

## Local Cron testing

Vercel Cron does not run locally. Options:

1. Manual curl to local route with `CRON_SECRET`.
2. Temporary script invoking handler function directly in dev.
3. Preview deployment for integration test.

**MUST NOT** disable auth check for convenience.

---

## Rollback

If email phase must disable:

1. Remove crons from `vercel.json`; redeploy.
2. Remove enqueue calls (keep MVP toast UX).
3. Leave historical `delivery_log` rows — audit trail.

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`cron_jobs_registry.md`](../../../prds/06_operations/cron_jobs_registry.md) | Job catalog |
| [`email_notifications_contract.md`](../contracts/email_notifications_contract.md) | Contract |
| [`P21_phase_description.md`](../phases_tasks_descriptions/P21_phase_description.md) | Phase scope |
| [`P21_tasks.md`](../tasks/P21_tasks.md) | Agent checklist |
| [`observability_plan.md`](../../../prds/06_operations/observability_plan.md) | Failed job monitoring |
| [`vercel_deploy_guide.md`](./vercel_deploy_guide.md) | Env setup |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W12-09

---

## Agent notes

- **Default: skip this guide** unless user explicitly enables P21.
- grep `resend` in apps/web before merging P01–P13.
- Start with J-01 email processor only; add reminders (J-02) after E-07 tested.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — cron jobs setup guide (post-MVP) |
