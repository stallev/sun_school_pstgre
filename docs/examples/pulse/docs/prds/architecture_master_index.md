# architecture_master_index.md
Project: **Pulse** — Fitness Trainer Marketplace

Version: v1.1  
Status: Architecture navigation document — **documentation MVP-complete (W14)**

---

# 1. Purpose

This document is the **entry point for the entire Pulse architecture documentation**.

It defines:

- how architecture documents are organized
- what each document is responsible for
- the order in which documents should be read
- how engineers and AI agents should use them during development

**Reference:** this Pulse snapshot is **self-contained**. Historical provenance: [`lampto_project_reference.md`](../reference/lampto_project_reference.md) (tree `docs/examples/lampto/` is **not vendored**).

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../meta/ai_first_project_methodology.md).

**Documentation registry:** [`docs/meta/documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — волны W0–W14 complete; следующий шаг — **P01 implementation**.

---

# 2. Architecture Documentation Layers

The architecture is organized into **seven layers**:

1. Product Scope
2. Domain Model
3. Data Model
4. Authorization & Privacy
5. Runtime Architecture
6. Operations
7. Governance

Each layer has canonical documents. **Interim sources** in [`docs/default_docs/`](../default_docs/) migrate into `prds/` over time.

---

# 3. Product Scope Layer

Purpose: define **what the system does**.

| Document | Status | Purpose |
|----------|--------|---------|
| [`01_product_scope/README.md`](01_product_scope/README.md) | **Canonical** | Product scope layer entry |
| [`01_product_scope/user_flows/users_mvp/`](../01_product_scope/user_flows/users_mvp/) | **Canonical** | MVP user flows (client, trainer, admin) |
| [`default_docs/fitness-platform-mvp.md`](../default_docs/fitness-platform-mvp.md) | Interim archive | Superseded by `mvp_scope.md` |
| [`default_docs/fitness-platform-pages.md`](../default_docs/fitness-platform-pages.md) | Interim archive | Superseded by `pages_functional_spec.md` |
| [`default_docs/user-flow-client.md`](../default_docs/user-flow-client.md) | Interim archive | Superseded by `users_mvp/client_flow.md` |
| [`default_docs/user-flow-trainer.md`](../default_docs/user-flow-trainer.md) | Interim archive | Superseded by `users_mvp/trainer_flow.md` |
| [`default_docs/user-flow-admin.md`](../default_docs/user-flow-admin.md) | Interim archive | Superseded by `users_mvp/admin_flow.md` |
| [`design/canonical_routes.md`](../design/canonical_routes.md) | **Canonical** | Single inventory of all routes — do not duplicate elsewhere |
| [`prototypes/Fitness_Platform_Prototype_v1.html`](../prototypes/Fitness_Platform_Prototype_v1.html) | Visual reference | HTML prototype (Warm Forest UI) |
| [`01_product_scope/mvp_scope.md`](01_product_scope/mvp_scope.md) | **Canonical** | MVP scope, roles, stack summary |
| [`01_product_scope/post_mvp_deferrals.md`](01_product_scope/post_mvp_deferrals.md) | **Canonical** | Post-MVP deferrals + nullable schema |
| [`01_product_scope/pages_functional_spec.md`](01_product_scope/pages_functional_spec.md) | **Canonical** | Page-level behavior (routes → [`canonical_routes.md`](../design/canonical_routes.md)) |
| [`01_product_scope/email_notifications_matrix.md`](01_product_scope/email_notifications_matrix.md) | **Canonical** | Post-MVP email spec; schema-ready on MVP |

**Roles:** `client` | `trainer` | `admin`

**Canonical URLs:** only [`canonical_routes.md`](../design/canonical_routes.md). Do not maintain a second route list in other docs.

---

# 4. Domain Model Layer

Purpose: define **how the system behaves over time**.

| Document | Status | Purpose |
|----------|--------|---------|
| [`02_domain_model/README.md`](02_domain_model/README.md) | **Canonical** | Domain layer entry point |
| [`02_domain_model/lifecycle_models.md`](02_domain_model/lifecycle_models.md) | **Canonical** | State machines: Booking, TrainerProfile, Review, Complaint, Refund, FileAsset |
| [`02_domain_model/failure_modes_catalog.md`](02_domain_model/failure_modes_catalog.md) | **Canonical** | Cross-cutting failure index `FM-xxx` |
| [`02_domain_model/domain_invariants.md`](02_domain_model/domain_invariants.md) | **Canonical** | System invariants INV-01 … + package rules |
| [`02_domain_model/use_cases_index.md`](02_domain_model/use_cases_index.md) | **Canonical** | Named domain use-cases for `@pulse/domain` |

**Key domain areas for Pulse:**

- Booking lifecycle (`pending` → `confirmed` → `completed` / `cancelled`)
- Trainer verification (`pending` → `approved` / `rejected`)
- Session completion → review prompt
- Schedule slots vs exceptions (blocked dates)
- Failure modes catalog — single source for race/security scenarios before W8 contracts

---

# 5. Data Model Layer

Purpose: define **how data is stored**.

| Document | Status | Purpose |
|----------|--------|---------|
| [`03_data_model/README.md`](03_data_model/README.md) | **Canonical** | Data model layer entry |
| [`03_data_model/database_schema_v1.md`](03_data_model/database_schema_v1.md) | **Canonical** | PostgreSQL/Neon schema v1 |
| [`03_data_model/data_access_patterns.md`](03_data_model/data_access_patterns.md) | **Canonical** | SQL/query patterns for hot paths |
| [`03_data_model/indexing_strategy.md`](03_data_model/indexing_strategy.md) | **Canonical** | Indexes for catalog, schedule, bookings |
| [`03_data_model/seed_data_spec.md`](03_data_model/seed_data_spec.md) | **Canonical** | Dev/CI seed fixtures |

**Invariant:** Post-MVP fields (Stripe, Daily.co) nullable from day one — see MVP doc.

---

# 6. Authorization & Privacy Layer

Purpose: define **who can see and change what**.

| Document | Status | Purpose |
|----------|--------|---------|
| [`04_authorization_privacy/README.md`](04_authorization_privacy/README.md) | **Canonical** | Layer entry point |
| [`04_authorization_privacy/authorization_matrix.md`](04_authorization_privacy/authorization_matrix.md) | **Canonical** | Role × resource matrix |
| [`04_authorization_privacy/policy_enforcement_contract.md`](04_authorization_privacy/policy_enforcement_contract.md) | **Canonical** | Server-side enforcement layers |
| [`04_authorization_privacy/privacy_data_handling.md`](04_authorization_privacy/privacy_data_handling.md) | **Canonical** | PII classification & visibility |

**MVP auth:** Auth.js v5 Credentials, JWT, role in session, **`proxy.ts`** route guards — [ADR-003](07_governance/adr_003_auth_credentials_jwt_rbac.md).

---

# 7. Runtime Architecture Layer

Purpose: define **how the system executes requests and jobs**.

| Document | Status | Purpose |
|----------|--------|---------|
| [`prds/07_governance/adr_001_stack_and_runtime.md`](07_governance/adr_001_stack_and_runtime.md) | **Canonical** | Stack: Vercel, Neon, Prisma v7, Resend, Blob |
| [`prds/07_governance/adr_002_next162_vercel_runtime_policy.md`](07_governance/adr_002_next162_vercel_runtime_policy.md) | **Canonical** | **Next.js 16.3.0** pin, `proxy.ts`, Instant Navigations / `partialPrefetching`, `catchError`, cache policy |
| [`07_governance/adr_003_auth_credentials_jwt_rbac.md`](07_governance/adr_003_auth_credentials_jwt_rbac.md) | **Accepted** | Credentials, JWT, RBAC |
| [`07_governance/adr_004_timezone_scheduling_model.md`](07_governance/adr_004_timezone_scheduling_model.md) | **Accepted** | Trainer timezone model |
| [`07_governance/adr_005_mvp_booking_without_payment.md`](07_governance/adr_005_mvp_booking_without_payment.md) | **Accepted** | MVP booking without payment |
| [`07_governance/adr_006_idempotent_email_delivery.md`](07_governance/adr_006_idempotent_email_delivery.md) | **Accepted** | Post-MVP idempotent email |
| [`07_governance/adr_007_file_asset_blob_lifecycle.md`](07_governance/adr_007_file_asset_blob_lifecycle.md) | **Accepted** | S3 file lifecycle |
| [`05_runtime/README.md`](05_runtime/README.md) | **Canonical** | Runtime layer entry |
| [`05_runtime/backend_requirements.md`](05_runtime/backend_requirements.md) | **Canonical** | Web + jobs contours |
| [`05_runtime/monorepo_packages.md`](05_runtime/monorepo_packages.md) | **Canonical** | Workspaces, package boundaries |
| [`05_runtime/auth_runtime_spec.md`](05_runtime/auth_runtime_spec.md) | **Canonical** | Auth flows & proxy integration |
| [`05_runtime/cache_revalidation_policy.md`](05_runtime/cache_revalidation_policy.md) | **Canonical** | Cache tags & invalidation |

**Two-contour model:** Web (Vercel BFF) + Jobs (Vercel Cron / serverless on MVP).

---

# 8. Operations Layer

Purpose: **monitoring, migrations, production readiness**.

| Document | Status | Purpose |
|----------|--------|---------|
| [`06_operations/README.md`](06_operations/README.md) | **Canonical** | Operations layer entry |
| [`06_operations/migration_runbook.md`](06_operations/migration_runbook.md) | **Canonical** | Neon + Prisma v7 migrate deploy |
| [`06_operations/observability_plan.md`](06_operations/observability_plan.md) | **Canonical** | Logs, errors, MVP monitoring |
| [`06_operations/cron_jobs_registry.md`](06_operations/cron_jobs_registry.md) | **Canonical** | Vercel Cron catalog (P06) |
| [`implementation/mvp/guides/`](../../implementation/mvp/guides/) | **Canonical** | Local dev, deploy, seed, cron setup (W12) |

---

# 9. Governance Layer

Purpose: **ADR, decision process, architectural evolution**.

| Document | Status | Purpose |
|----------|--------|---------|
| [`adr_001_stack_and_runtime.md`](07_governance/adr_001_stack_and_runtime.md) | **Accepted** | Stack and hosting decision |
| [`07_governance/adr_index.md`](07_governance/adr_index.md) | **Canonical** | ADR registry |
| [`07_governance/decision_process.md`](07_governance/decision_process.md) | **Canonical** | When and how to write ADRs |
| [`07_governance/adr_003_auth_credentials_jwt_rbac.md`](07_governance/adr_003_auth_credentials_jwt_rbac.md) | **Accepted** | Auth & RBAC |
| [`07_governance/adr_004_timezone_scheduling_model.md`](07_governance/adr_004_timezone_scheduling_model.md) | **Accepted** | Timezone & scheduling |
| [`07_governance/adr_005_mvp_booking_without_payment.md`](07_governance/adr_005_mvp_booking_without_payment.md) | **Accepted** | Booking without payment |
| [`07_governance/adr_006_idempotent_email_delivery.md`](07_governance/adr_006_idempotent_email_delivery.md) | **Accepted** | Idempotent email (post-MVP) |
| [`07_governance/adr_007_file_asset_blob_lifecycle.md`](07_governance/adr_007_file_asset_blob_lifecycle.md) | **Accepted** | File asset & Blob |

---

# 10. Design Layer

| Document | Status | Purpose |
|----------|--------|---------|
| [`default_docs/fitness-platform-design-system.md`](../default_docs/fitness-platform-design-system.md) | Interim | Warm Forest tokens, typography, components |
| [`design/canonical_routes.md`](../design/canonical_routes.md) | **Canonical** | Routes |
| [`design/ux_ui_principles.md`](../design/ux_ui_principles.md) | **Canonical** | UX principles — Progressive Disclosure, Zero Dead Ends, etc. |
| [`design/responsive_navigation_contract.md`](../design/responsive_navigation_contract.md) | **Canonical** | Bottom nav / sidebar, breakpoints |
| [`design/visual_identity_contract.md`](../design/visual_identity_contract.md) | **Canonical** | Warm Forest → shadcn token mapping |
| [`design/accessibility_requirements.md`](../design/accessibility_requirements.md) | **Canonical** | WCAG 2.1 AA product requirements |
| [`design/prototype_route_mapping.md`](../design/prototype_route_mapping.md) | **Canonical** | HTML prototype screen → canonical route |
| [`design/interaction_design_contract.md`](../design/interaction_design_contract.md) | **Canonical** | Toast, optimistic, confirm dialogs |
| [`design/ui_states_contract.md`](../design/ui_states_contract.md) | **Canonical** | Empty / loading / error / forbidden matrix |
| [`design/forms_and_validation_ux.md`](../design/forms_and_validation_ux.md) | **Canonical** | Form labels, errors, submit pending |
| [`design/content_and_microcopy_contract.md`](../design/content_and_microcopy_contract.md) | **Canonical** | Tone, `@/lib/messages`, toast copy |
| [`design/styleguide.md`](../design/styleguide.md) | **Canonical** | shadcn component recipes (Warm Forest) |
| [`design/wireframes/route_index.md`](../design/wireframes/route_index.md) | **Canonical** | Path → wireframe mapping (W10) |
| [`design/wireframes/mvp/`](../design/wireframes/mvp/) | **Canonical** | 28 MVP screen wireframes (W10) |

---

# 11. Architecture Learning Pack

Purpose: **layer walkthroughs** for AI onboarding — how contracts map to `apps/*` and `packages/*`.

| Document | Status | Purpose |
|----------|--------|---------|
| [`architecture_learning_pack/01_architecture_overview.md`](../architecture_learning_pack/01_architecture_overview.md) | **Canonical** | Monorepo overview, two contours |
| [`architecture_learning_pack/02_booking_lifecycle_layers.md`](../architecture_learning_pack/02_booking_lifecycle_layers.md) | **Canonical** | Booking mutations layer map (W13) |
| [`architecture_learning_pack/03_trainer_verification_layers.md`](../architecture_learning_pack/03_trainer_verification_layers.md) | **Canonical** | Trainer moderation layer map (W13) |
| [`architecture_learning_pack/04_email_jobs_layers.md`](../architecture_learning_pack/04_email_jobs_layers.md) | **Canonical** | Email enqueue vs Cron worker (W13) |

---

# 12. Implementation Layer

| Path | Purpose |
|------|---------|
| [`implementation/mvp/phases_tasks_descriptions/`](../../implementation/mvp/phases_tasks_descriptions/) | **Canonical** — P01–P14 MVP + P16–P19, P21–P22 post-P14 (W22–W25) |
| [`implementation/mvp/tasks/`](../../implementation/mvp/tasks/) | **Canonical** — phase agent checklists |
| [`implementation/mvp/ui_component_phase_matrix.md`](../../implementation/mvp/ui_component_phase_matrix.md) | Phase × Component × Route (W16) |
| [`implementation/mvp/contracts/`](../../implementation/mvp/contracts/) | **Canonical** — cross-module contracts (W8) |
| `implementation/mvp/specs/` | **Canonical** — complex flow specs (W9) |
| [`implementation/mvp/guides/`](../../implementation/mvp/guides/) | **Canonical** — local dev, Vercel deploy, Neon migrate, seed, cron (W12) |

**W8 contracts (Canonical):** [`monorepo_boundaries_contract.md`](../../implementation/mvp/contracts/monorepo_boundaries_contract.md), [`authorization_policy_contract.md`](../../implementation/mvp/contracts/authorization_policy_contract.md), [`schedule_slots_contract.md`](../../implementation/mvp/contracts/schedule_slots_contract.md), [`booking_lifecycle_contract.md`](../../implementation/mvp/contracts/booking_lifecycle_contract.md), [`wishlist_contract.md`](../../implementation/mvp/contracts/wishlist_contract.md), [`trainer_verification_contract.md`](../../implementation/mvp/contracts/trainer_verification_contract.md), [`file_upload_contract.md`](../../implementation/mvp/contracts/file_upload_contract.md), [`review_moderation_contract.md`](../../implementation/mvp/contracts/review_moderation_contract.md), [`email_notifications_contract.md`](../../implementation/mvp/contracts/email_notifications_contract.md), [`i18n_runtime_spec.md`](../../implementation/mvp/contracts/i18n_runtime_spec.md).

**W9 specs (Canonical):** [`global_shell_spec.md`](../../implementation/mvp/specs/global_shell_spec.md), [`password_reset_spec.md`](../../implementation/mvp/specs/password_reset_spec.md), [`catalog_discovery_spec.md`](../../implementation/mvp/specs/catalog_discovery_spec.md), [`trainer_onboarding_spec.md`](../../implementation/mvp/specs/trainer_onboarding_spec.md), [`booking_wizard_spec.md`](../../implementation/mvp/specs/booking_wizard_spec.md), [`trainer_schedule_spec.md`](../../implementation/mvp/specs/trainer_schedule_spec.md), [`admin_verification_spec.md`](../../implementation/mvp/specs/admin_verification_spec.md), [`complaint_refund_spec.md`](../../implementation/mvp/specs/complaint_refund_spec.md), [`public_landing_spec.md`](../../implementation/mvp/specs/public_landing_spec.md), [`instant_navigations_adoption_spec.md`](../../implementation/mvp/specs/instant_navigations_adoption_spec.md) (W25 / P22).

**W16 phases (Canonical):** [`P01_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P01_phase_description.md) … [`P14_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P14_phase_description.md) + matching `tasks/P0N_tasks.md`. **W22–W25 post-P14:** P16 landing, **P17** i18n, P19 complaints, P18 people ops (spec), P21 email, **P22** Instant Navigations. Migrations: [`_migration_P01-P07_to_P01-P15.md`](../../implementation/mvp/phases_tasks_descriptions/_migration_P01-P07_to_P01-P15.md), [`_migration_P15-P20_renumbering.md`](../../implementation/mvp/phases_tasks_descriptions/_migration_P15-P20_renumbering.md), [`_migration_P17_to_P19.md`](../../implementation/mvp/phases_tasks_descriptions/_migration_P17_to_P19.md).

This snapshot is self-contained. Do not follow a missing `docs/examples/lampto/` tree.

---

# 13. Agent Onboarding — Recommended Reading Order

For a new AI agent session on Pulse:

1. [`AGENTS.md`](../../AGENTS.md)
2. [`.cursor/rules/pulse-project-context.mdc`](../../.cursor/rules/pulse-project-context.mdc)
3. [`docs/meta/ai_first_project_methodology.md`](../meta/ai_first_project_methodology.md)
4. [`docs/architecture_learning_pack/01_architecture_overview.md`](../architecture_learning_pack/01_architecture_overview.md)
5. Architecture Learning Pack layer walkthroughs (W13): [`02_booking_lifecycle_layers.md`](../architecture_learning_pack/02_booking_lifecycle_layers.md), [`03_trainer_verification_layers.md`](../architecture_learning_pack/03_trainer_verification_layers.md), [`04_email_jobs_layers.md`](../architecture_learning_pack/04_email_jobs_layers.md)
6. [`docs/reference/lampto_project_reference.md`](../reference/lampto_project_reference.md) — historical notice only (lampto tree not vendored)
7. [`docs/default_docs/fitness-platform-mvp.md`](../default_docs/fitness-platform-mvp.md)
8. [`docs/design/canonical_routes.md`](../design/canonical_routes.md)
9. Active phase: `implementation/mvp/phases_tasks_descriptions/P{N}_*.md` + contracts + tasks

---

# 14. Development Workflow Rules

1. **No architectural guessing** — read contracts and this snapshot first.
2. **Thin adapters in `apps/`** — business logic in `packages/`.
3. **One route list** — `canonical_routes.md` only.
4. **Docs alignment** — behavior change = doc update in same task.
5. **Phases bound scope** — one phase per agent session when possible.
6. **Reference before invent** — search this Pulse snapshot; [`lampto_project_reference.md`](../reference/lampto_project_reference.md) is a missing-tree notice.

---

# 15. Repository Layout (Target Monorepo)

```
fitapp/
├── AGENTS.md
├── apps/
│   ├── web/                 — Next.js 16.3.0 (initial shell; see apps/web/AGENTS.md)
│   └── workers/               — job entrypoints (planned)
├── packages/
│   ├── domain/
│   ├── policy/edge/
│   ├── policy/server/
│   └── db/
├── docs/                      — this tree
└── (lampto tree is not vendored in this repository)
```

Package boundary rules: [`monorepo_boundaries_contract.md`](../../implementation/mvp/contracts/monorepo_boundaries_contract.md).

---

# 16. Meta & Documentation Governance

| Document | Status | Purpose |
|----------|--------|---------|
| [`meta/ai_first_project_methodology.md`](../meta/ai_first_project_methodology.md) | **Canonical** | AI-first methodology, agent cycle, doc hierarchy |
| [`meta/documentation_creation_registry.md`](../meta/documentation_creation_registry.md) | **Canonical** | Wave plan W0–W14, backlinks, UX/UI registry |

**Runtime canon verified (Context7 `/vercel/next.js`):** request interception — **`proxy.ts`** + export `proxy()`; Instant Navigations — `cacheComponents` + `partialPrefetching`; `middleware.ts` deprecated except edge-runtime edge cases — [ADR-002](07_governance/adr_002_next162_vercel_runtime_policy.md).

---

# 17. Document Status Legend

| Label | Meaning |
|-------|---------|
| **Canonical** | Source of truth — update when behavior changes |
| Interim | Valid content in `default_docs/` — migrate to `prds/` |
| Planned | Directory exists; document not written yet |
| Reference | Historical provenance only — not a live missing tree |

---

*Navigation hub for Pulse. W14 final index sync (2026-05-23). Update when behavior changes post-P01.*
