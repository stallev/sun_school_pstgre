# ADR Index — Pulse

**Тип:** ADR  
**Статус:** Canonical  
**Версия:** 1.1  
**Дата:** 2026-05-23  
**Волна:** W1  
**Зависит от:** [`adr_001_stack_and_runtime.md`](./adr_001_stack_and_runtime.md), [`adr_002_next162_vercel_runtime_policy.md`](./adr_002_next162_vercel_runtime_policy.md), [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md)  
**Связанные документы:** [`decision_process.md`](./decision_process.md), [`architecture_master_index.md`](../architecture_master_index.md)

---

## Purpose

Единый реестр Architecture Decision Records (ADR) для Pulse. Агенты **MUST** проверять этот индекс перед принятием архитектурных решений и перед копированием паттернов из lampto — отличия стека зафиксированы в ADR Pulse, не в reference-коде.

---

## Scope / Out of scope

**In scope:** нумерация ADR, статус, краткое решение, ссылки на файлы, planned ADR из реестра документации.

**Out of scope:** детали реализации (contracts, specs), продуктовые требования (PRD `01_product_scope/`), пошаговые runbooks (волна W12).

---

## ADR registry

| ID | File | Status | Topic | Summary |
|----|------|--------|-------|---------|
| ADR-001 | [`adr_001_stack_and_runtime.md`](./adr_001_stack_and_runtime.md) | **ACCEPTED** | Stack & hosting | Vercel, Neon PostgreSQL 17, Prisma v7, Auth.js Credentials, Resend, Blob; jobs via Vercel Cron; monorepo `apps/*` + `packages/*` |
| ADR-002 | [`adr_002_next162_vercel_runtime_policy.md`](./adr_002_next162_vercel_runtime_policy.md) | **ACCEPTED** | Next.js 16.3.0 runtime | Pin `next@16.3.0`; канон **`proxy.ts`**; `cacheComponents` + **`partialPrefetching`** (Instant Navigations); `catchError`; async Request APIs; `updateTag` / `revalidateTag` / `revalidatePath` |
| ADR-003 | [`adr_003_auth_credentials_jwt_rbac.md`](./adr_003_auth_credentials_jwt_rbac.md) | **ACCEPTED** | Auth & RBAC | Credentials provider, JWT session, `client` \| `trainer` \| `admin` в token; split `auth.config.ts` / `auth.ts`; four-layer defense |
| ADR-004 | [`adr_004_timezone_scheduling_model.md`](./adr_004_timezone_scheduling_model.md) | **ACCEPTED** | Timezone | `TrainerProfile.timezone` (IANA) — source of truth; local weekly times → UTC `timestamptz` |
| ADR-005 | [`adr_005_mvp_booking_without_payment.md`](./adr_005_mvp_booking_without_payment.md) | **ACCEPTED** | Booking MVP | Бронирование без Stripe; `pending` → trainer confirm; service snapshot |
| ADR-006 | [`adr_006_idempotent_email_delivery.md`](./adr_006_idempotent_email_delivery.md) | **ACCEPTED** | Email jobs | Post-MVP runtime; `idempotency_key` + `delivery_log`; Resend; не в request path |
| ADR-007 | [`adr_007_file_asset_blob_lifecycle.md`](./adr_007_file_asset_blob_lifecycle.md) | **ACCEPTED** | File storage | AWS S3 + `file_asset`; `pending` → `ready`; FK only after ready |
| ADR-008 | [`adr_008_complaint_resolution_model.md`](./adr_008_complaint_resolution_model.md) | **ACCEPTED** | Complaint resolution | `resolution` enum on close; status SM unchanged; P19 implementation |
| ADR-009 | [`adr_009_ui_locale_strategy.md`](./adr_009_ui_locale_strategy.md) | **ACCEPTED** | UI locale (i18n) | EN/RU; cookie-first; default `en`; no URL prefix P17; P17 implementation |

### Lampto reference (не применять как Pulse ADR)

| Lampto ADR | Pulse |
|------------|-------|
| ADR-026 Netlify | **N/A** — Pulse на Vercel ([ADR-001](./adr_001_stack_and_runtime.md)) |
| ADR-022 Next 16 Vercel | Концептуально покрыт **[ADR-002](./adr_002_next162_vercel_runtime_policy.md)** |

Паттерны monorepo/policy/domain — [`lampto_project_reference.md`](../../reference/lampto_project_reference.md).

---

## Naming convention

- Файл: `adr_{NNN}_snake_case_topic.md` (трёхзначный номер, ведущие нули).
- Новый ADR: следующий свободный номер в этой таблице + запись в Change log ниже.
- Процесс: [`decision_process.md`](./decision_process.md).

---

## Context7 verification (runtime ADR)

Перед изменением ADR-002 или auth ADR агент **MUST** сверить актуальные API:

| Topic | Context7 library | Verified for Pulse |
|-------|------------------|-------------------|
| `proxy.ts` | `/vercel/next.js` | `middleware.ts` deprecated; export `proxy`; Node runtime only in proxy |
| Instant Navigations / Partial Prefetching / `catchError` | `/vercel/next.js` | `cacheComponents` + `partialPrefetching`; App Shell prefetch; `catchError` from `next/error` |
| Auth.js JWT + role | `/websites/authjs_dev` | Credentials `authorize`; `jwt` / `session` callbacks для `role` |

---

## Requirements

1. **MUST** — любое архитектурное решение, меняющее стек, границы пакетов, auth, jobs или кэш — оформляется ADR или правкой существующего ACCEPTED ADR.
2. **MUST** — новый ADR добавляется в эту таблицу в той же сессии, что и файл ADR.
3. **MUST NOT** — дублировать полный текст ADR в `AGENTS.md` или contracts; только ссылка.
4. **SHOULD** — при PROPOSED статусе указать владельца review и блокируемые фазы implementation.

---

## Acceptance criteria

- [ ] Все ACCEPTED ADR перечислены со статусом и ссылкой на файл
- [ ] ADR-003–007 ACCEPTED и отражены в таблице
- [ ] Указана связь lampto ↔ Pulse для hosting/runtime
- [ ] `decision_process.md` и `07_governance/README.md` ссылаются на этот индекс

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`decision_process.md`](./decision_process.md) | How to create/update ADRs |
| [`adr_001_stack_and_runtime.md`](./adr_001_stack_and_runtime.md) | Stack decision |
| [`adr_002_next162_vercel_runtime_policy.md`](./adr_002_next162_vercel_runtime_policy.md) | Next.js 16.3.0 + proxy + Instant Navigations |
| [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) | Wave W4 ADR plan |
| [`architecture_master_index.md`](../architecture_master_index.md) | Navigation hub |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W1-01

---

## Agent notes

- Не создавать `middleware.ts` как канон — только `proxy.ts` ([ADR-002](./adr_002_next162_vercel_runtime_policy.md), Context7 `/vercel/next.js`).
- Не копировать Netlify/AWS SAM из lampto без нового ADR.
- Planned ADR **не** реализовать в коде до статуса ACCEPTED (кроме nullable schema fields, уже в [database_schema_v1.md](../03_data_model/database_schema_v1.md)).

---

## Change log

| Date | Change |
|------|--------|
| 2026-08-11 | v1.4 — ADR-002 amend: pin Next.js **16.3.0**; Instant Navigations / Partial Prefetching / `catchError`; Context7 `/vercel/next.js` |
| 2026-05-25 | v1.3 — ADR-009 ACCEPTED (UI locale / P17 i18n) |
| 2026-05-25 | v1.2 — ADR-008 ACCEPTED (Complaint Resolution v2 / P19) |
| 2026-05-23 | v1.1 — ADR-003–007 ACCEPTED (wave W4) |
| 2026-05-23 | v1.0 — initial index; ADR-001/002 ACCEPTED; ADR-003–007 planned |
