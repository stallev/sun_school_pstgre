# 07_governance

Architecture Decision Records и governance Pulse.

## Canonical

| Document | Status | Purpose |
|----------|--------|---------|
| [adr_index.md](adr_index.md) | **Canonical** | Реестр всех ADR (ACCEPTED) |
| [decision_process.md](decision_process.md) | **Canonical** | Когда и как писать ADR |

## ADR

| ADR | Status | Topic |
|-----|--------|-------|
| [adr_001_stack_and_runtime.md](adr_001_stack_and_runtime.md) | ACCEPTED | Vercel, Neon, Prisma v7, Resend, monorepo |
| [adr_002_next162_vercel_runtime_policy.md](adr_002_next162_vercel_runtime_policy.md) | ACCEPTED | **Next.js 16.3.0** pin, `proxy.ts`, Instant Navigations / `partialPrefetching`, `catchError`, cache/jobs policy |
| [adr_003_auth_credentials_jwt_rbac.md](adr_003_auth_credentials_jwt_rbac.md) | ACCEPTED | Credentials, JWT, RBAC, split auth config |
| [adr_004_timezone_scheduling_model.md](adr_004_timezone_scheduling_model.md) | ACCEPTED | Trainer IANA timezone, UTC instants |
| [adr_005_mvp_booking_without_payment.md](adr_005_mvp_booking_without_payment.md) | ACCEPTED | MVP booking without Stripe |
| [adr_006_idempotent_email_delivery.md](adr_006_idempotent_email_delivery.md) | ACCEPTED | Post-MVP idempotent email jobs |
| [adr_007_file_asset_blob_lifecycle.md](adr_007_file_asset_blob_lifecycle.md) | ACCEPTED | AWS S3 + `file_asset` lifecycle |
