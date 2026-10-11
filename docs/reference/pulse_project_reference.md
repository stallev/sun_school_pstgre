# Референсный проект: Pulse (fitapp)

**Статус:** зафиксирован как эталон архитектуры, AI-first методологии и feature-паттернов  
**Расположение в boilerplate:** [`docs/examples/pulse/`](../examples/pulse/)  
**Не деплоится** как часть целевого продукта — **read-only reference** для AI-агентов.

---

## Назначение

Проект **Pulse** (fitness trainer marketplace) содержит отработанную систему:

- двухконтурной архитектуры (Web BFF + Jobs),
- monorepo с `packages/domain`, `packages/policy`, `packages/db`,
- AI-first документации (PRD → contracts → phases → tasks),
- 31 Cursor Rule + 27+ Guidelines,
- Design Lab (`/design-system`) и полный MVP (P01–P14).

Новый продукт на этом boilerplate **наследует подходы**, но имеет **свой домен, PRD, contracts и domain invariants**.

---

## Приоритет: корневые Rules и Guidelines > Pulse snapshot

> **Код референса (`docs/examples/pulse/`) не является безусловным эталоном.**  
> Pulse полезен для **архитектурных паттернов** (domain → policy → db → web, фазовая декомпозиция, contracts, Design Lab), но **не для слепого копирования** домена, маршрутов или UI.

**При разработке:**

Нумерованный SoT — канон: [`.cursor/rules/project-context.mdc`](../../.cursor/rules/project-context.mdc) § Source-of-truth order. **Не дублировать список здесь.**

Над **Pulse snapshot** всегда выигрывают корневые Cursor Rules **и** корневые Guidelines (даже если Guidelines в SoT ниже PRD). Snapshot namesakes в `docs/examples/pulse/.cursor/rules/**` и `docs/examples/pulse/docs/guidelines/**` **не канон**. Дерева `docs/examples/lampto/` в этом репозитории **нет**.

1. **Код и docs Pulse** — read-only **reference for structure and flows**; при конфликте — **следовать Rules/Guidelines текущего проекта**.
2. **HTML prototype** целевого продукта — visual reference; subordinate to Rules/PRD.

Сводка stack-паттернов: [`stack_patterns_from_pulse.md`](./stack_patterns_from_pulse.md)

---

## Что брать из Pulse (принципы)

| Область | Эталон в Pulse | Применение |
|---------|----------------|------------|
| Методология AI-first | `docs/meta/ai_first_project_methodology.md` | Template → project canon |
| Doc registry (волны) | `documentation_creation_registry.md` | Адаптировать под домен |
| Monorepo boundaries | `monorepo_boundaries_contract.md` | Тот же паттерн импортов |
| Layered architecture | domain → policy → db → apps | Обязательно |
| Фазовая декомпозиция | `P{N}_phase_description.md` + tasks | Тот же формат |
| Contracts body | happy/negative/security/race/drift | §2.3.4 registry |
| AGENTS.md | корень + `apps/web/AGENTS.md` | Из template |
| Design Lab | `/design-system` + spec | P6 (dev-only, [spec](../implementation/mvp/specs/design_system_lab_spec.md)) |
| Request path | `proxy.ts` → DAL → Prisma | ADR-002 |

---

## Что не копировать слепо

| Аспект | Pulse | Sunday School |
|--------|-------|---------------|
| Продукт | Fitness marketplace (запись клиентов к тренерам) | Воскресная школа: группы, уроки, проверка ДЗ, кирпичики, аналитика |
| Роли | `client`, `trainer`, `admin` | `admin`, `teacher`; `parent` в MVP отклоняется |
| Вход | Credentials (email + пароль, `passwordHash`), адаптер | **Google + Telegram (OIDC)**, JWT, без адаптера и без пароля ([ADR-003](../prds/07_governance/adr_003_auth_oidc_jwt_rbac.md)) |
| Сущности | booking, slot, trainer profile, wishlist, платежи | учебный год, группа, урок, отметка ДЗ, кирпичики, запрос на удаление; платежей нет |
| Время | часовой пояс тренера (`TrainerProfile.timezone`) | единый часовой пояс школы ([ADR-004](../prds/07_governance/adr_004_timezone_scheduling_model.md)) |
| Объектный доступ | владелец ресурса — клиент/тренер | группы по назначению; чужой ресурс → 404, чужая роль → 403 ([матрица](../prds/04_authorization_privacy/authorization_matrix.md)) |
| Журнал | необязателен | append-only журнал изменений и кирпичиков, запись в той же транзакции |
| Персональные данные | email, телефон | ФИО учителей и детей, согласия, удаление по запросу (15 дней) |
| Фоновые задачи / email | Resend, `apps/workers` | post-MVP, модули `email_jobs`, `s3_uploads` выключены |
| Design tokens | Warm Forest | Slate Cobalt, без тёмной темы ([visual_identity_contract](../design/visual_identity_contract.md)) |
| Маршруты, flows, schema | Pulse-specific | [`canonical_routes.md`](../design/canonical_routes.md), [`database_schema_v1.md`](../prds/03_data_model/database_schema_v1.md) |

Правило: если нужен Pulse-паттерн — берётся **структура** (слои, формат контракта, фазы), а имена сущностей, роли, маршруты и тексты — из документов проекта.

---

## Ключевые файлы Pulse для изучения

### Архитектура

- `docs/examples/pulse/docs/prds/architecture_master_index.md`
- `docs/examples/pulse/docs/architecture_learning_pack/01_architecture_overview.md`
- `docs/examples/pulse/docs/implementation/mvp/contracts/monorepo_boundaries_contract.md`

### Реализация (patterns)

- `docs/examples/pulse/apps/web/src/proxy.ts` — request interception + CSP
- `docs/examples/pulse/packages/domain/` — pure business rules
- `docs/examples/pulse/apps/web/src/data/` — DAL naming
- `docs/examples/pulse/.cursor/rules/` — полный набор rules (diff с boilerplate)

### Документация

- `docs/examples/pulse/docs/meta/documentation_creation_registry.md`
- `docs/examples/pulse/docs/implementation/mvp/specs/design_system_lab_spec.md`
- `docs/examples/pulse/docs/guidelines/` — эталонные guides (сравнение с `guidelines/` boilerplate)

---

## Workflow для агента

1. **Перед изобретением паттерна** — grep в `docs/examples/pulse/`
2. **Проверить** соответствующий Guideline + Cursor Rule boilerplate
3. **При расхождении** — следовать boilerplate Rules; при необходимости обновить docs (product-docs-alignment)
4. **General deep dive** — `docs/general/` для теории (XSS, data fetching, a11y, bundle, rendering)

---

## Связанные документы

- [`docs/examples/pulse/README.md`](../examples/pulse/README.md) — snapshot layout
- [`docs/guidelines/README.md`](../guidelines/README.md) — канон реализации
- [`.cursor/rules/README.md`](../../.cursor/rules/README.md) — tier manifest
- [`docs/general/README.md`](../general/README.md) — deep dives → guidelines mapping
- [`docs/meta/ai_first_project_methodology.md`](../meta/ai_first_project_methodology.md)
