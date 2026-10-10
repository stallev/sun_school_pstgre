# Post-MVP Deferrals — Pulse

**Тип:** PRD  
**Статус:** Canonical  
**Версия:** 1.1  
**Дата:** 2026-05-23  
**Волна:** W1  
**Зависит от:** [`mvp_scope.md`](./mvp_scope.md), [`database_schema_v1.md`](../03_data_model/database_schema_v1.md)  
**Связанные документы:** [`adr_001_stack_and_runtime.md`](../07_governance/adr_001_stack_and_runtime.md), [`canonical_routes.md`](../../design/canonical_routes.md)

---

## Purpose

Явный реестр возможностей **вне MVP**, с обоснованием отложения, затронутыми таблицами/полями schema и зарезервированными маршрутами. Предотвращает scope creep агентов и фиксирует стратегию **schema-first readiness** (nullable поля с первого дня).

---

## Scope / Out of scope

**In scope:** deferred features, nullable columns, reserved routes, prerequisites to enable.

**Out of scope:** детальные ADR post-MVP (создаются при включении фичи), implementation contracts.

---

## Definitions

| Term | Meaning |
|------|---------|
| **Dormant column** | Nullable поле в БД без UI и без business logic на MVP |
| **Reserved route** | Путь в `canonical_routes.md` § Post-MVP; не реализовать до ADR + contract |

---

## Deferred feature registry

| Feature | Why deferred | Schema / data (dormant) | Reserved routes | Unlock prerequisites |
|---------|--------------|-------------------------|-----------------|----------------------|
| **Transactional email notifications** | MVP: in-app feedback достаточно; снижение scope P01–P05 | `job_execution`, `delivery_log` — **DDL на MVP**, без отправки; `password_reset_token` для reset flow | `/api/jobs/*` (cron handlers) | Resend + ADR-006 + [`email_notifications_matrix.md`](./email_notifications_matrix.md); contract W8-09 |
| **Password reset via email** | Зависит от Resend / email jobs | `password_reset_token` table ready | — | E-09 in email matrix |
| **Video sessions (Daily.co)** | Room provisioning, in-call UX, compliance | `booking.daily_room_name`, `booking.daily_room_url` | `/sessions/[sessionId]/room` | ADR + contract; Daily API keys |
| **Online payments (Stripe Connect)** | Onboarding, webhooks, PCI scope | `trainer_profile.stripe_account_id`, `booking.stripe_payment_intent_id` | `/trainer/payouts`, `/client/payments` | ADR-005 supersede; Stripe Connect contract |
| **Stripe refunds** | Depends on payment capture | `booking.stripe_refund_id`, `refund_request.stripe_refund_id` | — | Payments live |
| **Platform fee calculation** | Needs payment settlement | TBD in payment ADR | — | Stripe Connect |
| **In-session chat** | Depends on video | — | — | Daily.co |
| **No-show auto-refund** | Needs video attendance + payment | — | — | Payments + session telemetry |
| **OAuth (Google)** | Not critical for launch | `User.password_hash` NULL allowed for OAuth-only (post-MVP) | — | ADR-003 amendment |
| **Subscription plans** | Business validation post-PMF | — | — | Product ADR |
| **Multi-currency** | Single currency USD on MVP | `currency` column exists; MVP fixed USD | — | Pricing ADR |
| **Trainer analytics (advanced)** | Post-PMF | — | — | Data warehouse / BI |
| **Client wishlist** | Снижение scope discovery; schema и domain готовы | `wishlist` table (composite PK) | — | [`wishlist_contract.md`](../../implementation/mvp/contracts/wishlist_contract.md); re-enable UI + `/api/client/wishlist` |
| **User account suspend / ban** | Нет `account_status` в MVP schema; support через complaints | — (future column or enum) | — | ADR + migration; [`admin_people_ops_spec.md`](../../implementation/mvp/specs/admin_people_ops_spec.md) — P18 registry read-only first |
| **AWS SAM / SQS jobs** | Vercel Cron enough until volume grows | `job_execution`, `delivery_log` — schema on MVP, **no email cron** | — | Volume ADR amending ADR-001 |

---

## Schema readiness rules

1. **MUST** — post-MVP columns остаются **nullable**; MVP код **MUST NOT** писать в Stripe/Daily поля.
2. **MUST** — `job_execution` / `delivery_log` мигрируются на MVP; MVP код **MUST NOT** insert/update для email delivery (таблицы пустые — норма).
3. **MUST NOT** — breaking DDL при включении фичи (только заполнение nullable + новые индексы при необходимости).
4. **SHOULD** — UI не показывает disabled Stripe / «Email sent» без реальной отправки.
5. **MUST** — включение фичи = ADR + contract + перенос строки из этой таблицы в [`mvp_scope.md`](./mvp_scope.md).

См. [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) § Post-MVP columns.

---

## Happy paths

N/A — функции не доступны пользователю на MVP.

---

## Negative paths

| Scenario | Expected behavior |
|----------|-------------------|
| Agent adds Stripe checkout on booking confirm | **Reject** — out of scope; use pending booking only |
| User navigates to reserved route | 404 or «Coming soon» **only** if route accidentally shipped — prefer 404 |
| Code sets `stripe_payment_intent_id` on create booking | **Bug** — field must stay null on MVP |
| Agent adds Resend on booking confirm | **Reject** — use toast; see email deferral row |
| Rows in `delivery_log` on MVP | **Bug** unless explicit post-MVP phase |

---

## Security paths

| Risk | Guard |
|------|-------|
| Exposed Stripe keys in client | No Stripe SDK on MVP |
| Webhook endpoints without ADR | Do not add `/api/stripe/*` until contract |

---

## Concurrency & drift

| Drift risk | Guard |
|------------|-------|
| Schema has payment columns → agent assumes payments live | Read this file + `mvp_scope.md` before booking UI |
| Prototype shows video CTA | Prototype is visual only; `/sessions/[sessionId]` = placeholder per canonical routes |
| lampto payment patterns copied | lampto ≠ Pulse MVP; check ADR-001 |

---

## Requirements

1. **MUST** — любая post-MVP фича в PR/задаче сопровождается удалением строки из этой таблицы и ADR.
2. **MUST NOT** — описывать post-MVP как MVP MUST в contracts/specs фаз P01–P06.
3. **SHOULD** — при демо использовать copy «Available after launch» только на placeholder session screen.

---

## Acceptance criteria

- [ ] Все пункты из interim MVP «Out of Scope» перенесены
- [ ] Nullable columns перечислены и согласованы с `database_schema_v1.md`
- [ ] Reserved routes ссылаются на `canonical_routes.md` § Post-MVP
- [ ] `mvp_scope.md` ссылается на этот файл в § Deferred
- [ ] Нет требований реализовать deferred в MVP phases

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`mvp_scope.md`](./mvp_scope.md) | MVP boundary |
| [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) | Dormant columns |
| [`canonical_routes.md`](../../design/canonical_routes.md) | Reserved paths |
| [`adr_001_stack_and_runtime.md`](../07_governance/adr_001_stack_and_runtime.md) | Deferred technologies table |
| [`default_docs/fitness-platform-mvp.md`](../../default_docs/fitness-platform-mvp.md) | Interim source |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W1-04

---

## Agent notes

- Nullable ≠ optional feature on MVP. Nullable = **no UI**.
- Session route `/sessions/[sessionId]` — placeholder, не Daily room.
- Refunds on MVP — admin manual status in DB, not Stripe API.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.1 — transactional email + password reset email deferred; ops tables schema-only on MVP |
| 2026-05-23 | v1.0 — initial deferrals registry |
