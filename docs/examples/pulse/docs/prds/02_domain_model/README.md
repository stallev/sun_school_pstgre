# Domain Model Layer — Pulse

**Тип:** PRD  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W3  
**Зависит от:** [`mvp_scope.md`](../01_product_scope/mvp_scope.md), [`database_schema_v1.md`](../03_data_model/database_schema_v1.md)  
**Связанные документы:** [`lifecycle_models.md`](./lifecycle_models.md), [`failure_modes_catalog.md`](./failure_modes_catalog.md), [`domain_invariants.md`](./domain_invariants.md), [`use_cases_index.md`](./use_cases_index.md)

---

## Purpose

Точка входа в **доменный слой** Pulse: как сущности меняют состояние во времени, какие инварианты нельзя нарушать, какие сбои ожидаемы и какие use-case их обрабатывают. Читают PM, backend-разработчики, AI-агенты перед contracts (W8) и implementation specs (W9).

Доменная логика **MUST** жить в `packages/domain`; этот каталог описывает **поведение**, не DDL (→ [`database_schema_v1.md`](../03_data_model/database_schema_v1.md)).

---

## Scope / Out of scope

**In scope:** state machines MVP, cross-cutting failure index (`FM-xxx`), системные инварианты, каталог use-case для `@pulse/domain`.

**Out of scope:** SQL/Prisma DDL, authorization matrix (W5), implementation contracts (W8), UI specs (W9), post-MVP Stripe/Daily.co runtime.

---

## Documents in this layer

| Document | Role | Read when |
|----------|------|-----------|
| [`lifecycle_models.md`](./lifecycle_models.md) | Канон state machines: Booking, TrainerProfile, Review, Complaint, Refund, FileAsset | Добавляете переход статуса |
| [`failure_modes_catalog.md`](./failure_modes_catalog.md) | Индекс `FM-xxx`: race, security, negative UX, drift | Пишете contract/spec или обрабатываете edge case |
| [`domain_invariants.md`](./domain_invariants.md) | Не нарушаемые правила системы + guards для агентов | Любое изменение domain/policy/schema |
| [`use_cases_index.md`](./use_cases_index.md) | Именованные use-case → lifecycle + FM + planned contract | Scaffold `packages/domain` |

---

## Reading order (agents)

```
README (this file)
  → lifecycle_models.md
  → failure_modes_catalog.md
  → domain_invariants.md
  → use_cases_index.md
  → W8 contracts (booking_lifecycle, schedule_slots, …)
```

**User flows** дают UX-контекст; **lifecycle** — канон переходов. При конфликте: lifecycle + domain_invariants побеждают UX-черновики.

---

## Layer boundaries

| Layer | Responsibility |
|-------|----------------|
| `01_product_scope` | Что видит пользователь, happy paths |
| **`02_domain_model`** | **Как система ведёт себя во времени** |
| `03_data_model` | Как данные хранятся (DDL) |
| `04_authorization_privacy` | Кто может инициировать переход (planned W5) |
| `implementation/mvp/contracts` | Межмодульные контракты (inputs/outputs/errors) |

**MUST NOT:** дублировать детали race resolution в user flows — только ссылка `FM-xxx`.

---

## Key domain areas (MVP)

| Area | Primary entity | Canonical doc |
|------|----------------|---------------|
| Booking | `Booking` | [`lifecycle_models.md`](./lifecycle_models.md) § Booking |
| Trainer verification | `TrainerProfile` | § Trainer verification |
| Schedule & slots | `TrainerWeeklyInterval`, exceptions | § Schedule; invariant timezone |
| Reviews | `Review` | § Review |
| Admin moderation | `Complaint`, `RefundRequest` | § Complaint, § Refund |
| Media | `FileAsset` | § File upload |
| Wishlist | `Wishlist` | use-case index (toggle, idempotent) |

---

## Requirements

1. **MUST** — любой новый переход статуса добавляется в `lifecycle_models.md` до кода.
2. **MUST** — cross-cutting race/security сценарий получает `FM-xxx` в `failure_modes_catalog.md`.
3. **MUST** — use-case в коде имеет имя из [`use_cases_index.md`](./use_cases_index.md).
4. **SHOULD** — contract W8 ссылается на `implements FM-xxx`, не копирует полное описание.
5. **MAY** — post-MVP transitions помечены `Deferred` в lifecycle, без MVP UI.

---

## Acceptance criteria

- [ ] Все четыре дочерних документа W3 существуют и cross-linked
- [ ] `architecture_master_index.md` § Domain Model обновлён на Canonical
- [ ] `database_schema_v1.md` § Related ссылается на lifecycle (не Planned)
- [ ] Нет второго списка маршрутов — только ссылка на `canonical_routes.md`
- [ ] Booking и TrainerProfile lifecycle согласованы с schema enums

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`../01_product_scope/mvp_scope.md`](../01_product_scope/mvp_scope.md) | Product scope |
| [`../01_product_scope/user_flows/users_mvp/`](../01_product_scope/user_flows/users_mvp/) | UX journeys |
| [`../03_data_model/database_schema_v1.md`](../03_data_model/database_schema_v1.md) | DDL enums & tables |
| [`../07_governance/adr_001_stack_and_runtime.md`](../07_governance/adr_001_stack_and_runtime.md) | Jobs idempotency |
| *(planned)* [`../04_authorization_privacy/authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md) | Role × resource |
| [`../../implementation/mvp/contracts/booking_lifecycle_contract.md`](../../implementation/mvp/contracts/booking_lifecycle_contract.md) | W8 — implements booking FM |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W3-01

---

## Agent notes

- Не описывать payment/video flows как MVP — nullable columns only.
- `pending` booking на MVP **без оплаты** — confirm делает тренер (или auto-confirm — только если зафиксировано в contract; по умолчанию trainer confirms).
- Timezone: **всегда** `TrainerProfile.timezone`, never server default UTC for slot math.
- При добавлении FM — один канон в catalog; в lifecycle — ссылка по ID.
