# AI-First Project Methodology — Pulse
## Архитектура, методология разработки и система документации

**Проект:** Pulse — Fitness Trainer Marketplace  
**Версия:** 1.0  
**Дата:** Май 2026  
**Статус:** Живой документ — обновляется при изменении методологии

**Референс:** методология наследуется из проекта **lampto** (BSFY). См. [`docs/reference/lampto_project_reference.md`](../reference/lampto_project_reference.md).

---

## Введение

Этот документ описывает подход к разработке **Pulse** — веб-платформы, соединяющей клиентов с фитнес-тренерами. Структура и принципы **в точности** следуют отработанной системе lampto ([`docs/examples/lampto/docs/meta/ai_first_project_methodology.md`](../examples/lampto/docs/meta/ai_first_project_methodology.md)), адаптированной под домен Pulse, стек Vercel и продуктовые документы в [`docs/default_docs/`](../default_docs/) и [`docs/prototypes/`](../prototypes/).

Цель — AI-агенты (Cursor, Claude, GPT) работают как члены команды: не угадывают архитектуру, а следуют задокументированным контрактам.

Документ состоит из четырёх блоков:

1. [Архитектурный шаблон](#1-архитектурный-шаблон)
2. [Методология AI-first разработки](#2-методология-ai-first-разработки)
3. [Структура документации](#3-структура-документации)
4. [Типология документов](#4-типология-документов)

---

## 1. Архитектурный шаблон

### 1.1 Двухконтурная модель

Архитектура разделена на два изолированных контура с чёткими границами ответственности — **как в lampto**, с заменой runtime по [ADR-001](../prds/07_governance/adr_001_stack_and_runtime.md).

**Контур A — Web (UI + BFF)**

Отвечает за пользовательский интерфейс и тонкий слой Backend-for-Frontend. Работает в serverless-среде Vercel.

| Компонент | Технология | Роль |
|-----------|-----------|------|
| Фреймворк | **Next.js 16.3.0** (pinned) App Router | Routing, SSR, Server Actions — [ADR-002](../prds/07_governance/adr_002_next162_vercel_runtime_policy.md) |
| Хостинг | **Vercel** | Serverless deployment, preview из PR |
| Bundler | Turbopack (default) | Сборка |
| БД | Neon PostgreSQL 17 + Prisma v7 | Единственный источник истины |
| Авторизация | Auth.js v5 + **Credentials** | JWT-сессии, role в token |
| UI | shadcn/ui + Tailwind CSS 4 | Warm Forest design system |
| Email | Resend | Транзакционные письма |
| Storage | AWS S3 | Фото профилей, сертификаты |
| Уведомления | Sonner | Toast-фидбек |

Принципы контура A:
- **Тонкий BFF**: Route Handlers и Server Actions — только адаптеры; бизнес-логика в `packages/`
- **Server Components по умолчанию**: `'use client'` только там, где нужны хуки или браузерные события
- **Async Request APIs**: в Next.js 16 `cookies()`, `headers()`, `params`, `searchParams` — асинхронны
- **Request interception**: канон — **`proxy.ts`** (Next.js 16); `middleware.ts` — только временная миграция
- **Быстрый time-to-market**: минимальный DevOps, без отдельного API-сервиса до появления мобильного клиента

**Эталон layered architecture в коде (целевой):** первый нетривиальный flow Pulse (booking lifecycle или trainer verification) должен повторить паттерн lampto account deletion — см. [`docs/examples/lampto/docs/architecture_learning_pack/15_reference_account_deletion_layers_ru.md`](../examples/lampto/docs/architecture_learning_pack/15_reference_account_deletion_layers_ru.md).

**Контур B — Jobs (фоновые задачи)**

Отвечает за все тяжёлые, долгие и дорогие операции. Никогда не выполняется в request path.

| Компонент | Технология (MVP) | Роль |
|-----------|------------------|------|
| Триггеры | **Vercel Cron** | Расписание (напоминания 24h, digest) |
| Исполнение | Vercel Serverless Functions / Route Handlers (jobs) | Отправка email, batch-операции |
| Очередь (post-MVP) | AWS SQS + DLQ или аналог | При росте нагрузки — см. ADR-001 |

Что идёт в Jobs на MVP: email-напоминания о сессиях, batch-уведомления, отложенная обработка модерации.

Правило (из lampto): **каждый фоновый job обязан иметь `idempotency_key` и запись в `delivery_log`** — повторный запуск не создаёт дубль.

### 1.2 Монорепо с чёткими границами

```
monorepo/
├── apps/
│   ├── web/          — Next.js приложение (тонкий адаптер)
│   └── workers/      — Cron handlers / job entrypoints (MVP: может жить в apps/web/app/api/jobs)
└── packages/
    ├── domain/       — чистые бизнес-правила (без Next.js, без Vercel SDK, без DB)
    ├── policy/
    │   ├── edge/     — JWT-only проверки, безопасно в middleware
    │   └── server/   — объектные проверки с Prisma (только Route Handlers и Actions)
    └── db/           — Prisma schema, единственное DDL
```

**Правила импорта (нарушение = баг архитектуры)** — идентичны lampto:

| Откуда | Куда | Статус |
|--------|------|--------|
| `apps/web` | `packages/domain` | ✅ разрешено |
| `apps/web` | `packages/policy/server` | ✅ только из Route Handlers и Server Actions |
| `proxy.ts` / `middleware.ts` | `packages/policy/server` | ❌ запрещено (нет Prisma в interception layer) |
| `packages/domain` | `packages/db` | ❌ запрещено (domain — чистый) |
| `packages/*` | `apps/*` | ❌ запрещено (одностороннее направление) |

Детали: [`monorepo_boundaries_contract.md`](../implementation/mvp/contracts/monorepo_boundaries_contract.md) (канон Pulse W8); паттерн — [`docs/examples/lampto/docs/implementation/mvp/monorepo_boundaries.md`](../examples/lampto/docs/implementation/mvp/monorepo_boundaries.md).

### 1.3 Ключевые инварианты системы Pulse

Инварианты документируются явно и защищаются Cursor Rules.

1. **`TrainerProfile.timezone`** — источник истины для расписания тренера, слотов бронирования, напоминаний и отображения времени клиенту. Никогда не использовать серверный timezone Vercel по умолчанию для бизнес-логики расписания.

2. **Booking lifecycle** — переходы статусов (`pending` → `confirmed` → `completed` / `cancelled`) только через documented use-cases в `packages/domain`. Прямое обновление статуса из UI — баг.

3. **Trainer verification** — публичный профиль и приём бронирований только при `TrainerProfile.status = approved`. Pending/rejected — ограниченный UX (banner, no public listing).

4. **Фоновые задачи идемпотентны (post-MVP email)**: повторный запуск по тому же `idempotency_key` молча пропускается (`delivery_log`). **MVP:** DDL `job_execution` / `delivery_log` без отправки писем.

5. **Post-MVP readiness**: поля Stripe Connect и Daily.co в схеме — **nullable с первого дня**. Включение оплаты или video не должно требовать breaking DDL.

### 1.4 Стратегия роста (когда выносить отдельный backend)

MVP строится так, чтобы выделение API-сервиса (NestJS/Fastify) или миграция jobs на AWS SAM было **механическим**, а не переписыванием — принцип из lampto.

Признаки, что пора:
- Мобильный клиент или публичный API
- Команда > 5–7 человек
- Тяжёлая аналитика (OLAP)
- WebSocket / realtime chat (post-MVP video chat)

---

## 2. Методология AI-first разработки

### 2.1 Фундаментальный принцип

AI-агент — **не поисковик и не генератор кода**. Это участник команды, который:
- не помнит предыдущие сессии
- не видит весь проект целиком
- имеет устаревшие знания о версиях библиотек
- склонен изобретать паттерны, если не видит готовых

**Следствие:** документация — **runtime-инструкция** для агента, как `tsconfig.json` для компилятора.

**Обязательное правило Pulse:** перед изобретением паттерна — проверить [`docs/reference/lampto_project_reference.md`](../reference/lampto_project_reference.md) и соответствующий файл в `docs/examples/lampto/`.

### 2.2 Цикл работы агента

```
КОНТЕКСТ → ФАЗА → КОНТРАКТ → ЗАДАЧИ → ВЕРИФИКАЦИЯ
```

**Контекст** — агент читает [`AGENTS.md`](../../AGENTS.md) и `.cursor/rules/pulse-project-context.mdc`.

**Фаза** — агент знает номер фазы (P01, P02…). Фаза ограничивает область изменений.

**Контракт** — перед реализацией агент читает `docs/implementation/mvp/contracts/` для данной фазы.

**Задачи** — чеклист из `docs/implementation/mvp/tasks/P{N}_tasks.md`.

**Верификация** — lint, build, smoke-тесты по чеклисту фазы.

### 2.3 Точка входа: AGENTS.md

[`AGENTS.md`](../../AGENTS.md) в корне monorepo — **конституция** для агента.  
[`apps/web/AGENTS.md`](../../apps/web/AGENTS.md) — операционный гайд web-приложения (Next.js, структура каталогов, UI pointers, dev checklist).

### 2.4 Cursor Rules: живые ограничения

`.cursor/rules/*.mdc` — ограничения, применяемые автоматически.

**На старте Pulse:**
- `pulse-project-context.mdc` — always-applied
- `product-docs-alignment.mdc` — always-applied
- `typescript-monorepo-types.mdc` — always-applied

**Baseline (documentation phase — active):**
- `data-server-actions-and-api.mdc`
- `policy-packages.mdc`
- `auth-security.mdc`
- `nextjs-vercel-app-router.mdc`

**Перенос из lampto по мере появления кода** (не копировать UI rules до scaffold):
- `ui-toast-mutations.mdc`
- `ui-mutation-pending.mdc`
- `react-one-component-per-file.mdc`
- `data-server-actions-and-api.mdc`
- `policy-packages.mdc`
- `auth-security.mdc`

Принципы написания правил — см. lampto methodology §2.4.

### 2.5 Фазовая декомпозиция разработки

User story описывает результат для пользователя. **Фаза** — технический блок, который агент выполняет за одну сессию.

```
docs/implementation/mvp/
├── phases_tasks_descriptions/
│   └── P{N}_phase_description.md
└── tasks/
    └── P{N}_tasks.md
```

Шаблон Phase Description: [`_phase_template.md`](../implementation/mvp/phases_tasks_descriptions/_phase_template.md). **Канон фаз:** MVP **P01–P14** (W16); post-P14 **P16–P19, P21–P22** (W22–W25). Миграции: [`_migration_P01-P07_to_P01-P15.md`](../implementation/mvp/phases_tasks_descriptions/_migration_P01-P07_to_P01-P15.md), [`_migration_P15-P20_renumbering.md`](../implementation/mvp/phases_tasks_descriptions/_migration_P15-P20_renumbering.md), [`_migration_P17_to_P19.md`](../implementation/mvp/phases_tasks_descriptions/_migration_P17_to_P19.md).

**Фазы Pulse (canonical):**

| Фаза | Фокус | Phase doc | Tasks |
|------|-------|-----------|-------|
| P01 | Monorepo & data layer | [`P01_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P01_phase_description.md) | [`P01_tasks.md`](../implementation/mvp/tasks/P01_tasks.md) |
| P02 | Auth & request guards | [`P02_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P02_phase_description.md) | [`P02_tasks.md`](../implementation/mvp/tasks/P02_tasks.md) |
| P03 | Design system & app shell | [`P03_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P03_phase_description.md) | [`P03_tasks.md`](../implementation/mvp/tasks/P03_tasks.md) |
| P04 | Public landing | [`P04_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P04_phase_description.md) | [`P04_tasks.md`](../implementation/mvp/tasks/P04_tasks.md) |
| P05 | Catalog discovery | [`P05_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P05_phase_description.md) | [`P05_tasks.md`](../implementation/mvp/tasks/P05_tasks.md) |
| P06 | Trainer profile + wishlist | [`P06_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P06_phase_description.md) | [`P06_tasks.md`](../implementation/mvp/tasks/P06_tasks.md) |
| P07 | Booking wizard | [`P07_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P07_phase_description.md) | [`P07_tasks.md`](../implementation/mvp/tasks/P07_tasks.md) |
| P08 | Client bookings hub | [`P08_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P08_phase_description.md) | [`P08_tasks.md`](../implementation/mvp/tasks/P08_tasks.md) |
| P09 | Client reviews | [`P09_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P09_phase_description.md) | [`P09_tasks.md`](../implementation/mvp/tasks/P09_tasks.md) |
| P10 | Trainer onboarding | [`P10_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P10_phase_description.md) | [`P10_tasks.md`](../implementation/mvp/tasks/P10_tasks.md) |
| P11 | Trainer profile & services | [`P11_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P11_phase_description.md) | [`P11_tasks.md`](../implementation/mvp/tasks/P11_tasks.md) |
| P12 | Trainer schedule & clients | [`P12_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P12_phase_description.md) | [`P12_tasks.md`](../implementation/mvp/tasks/P12_tasks.md) |
| P13 | Admin moderation | [`P13_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P13_phase_description.md) | [`P13_tasks.md`](../implementation/mvp/tasks/P13_tasks.md) |
| P14 | Quality gate (a11y, UI states) | [`P14_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P14_phase_description.md) | [`P14_tasks.md`](../implementation/mvp/tasks/P14_tasks.md) |
| P16 | Public landing v2 | [`P16_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P16_phase_description.md) | [`P16_tasks.md`](../implementation/mvp/tasks/P16_tasks.md) |
| P19 | Complaint resolution v2 | [`P19_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P19_phase_description.md) | [`P19_tasks.md`](../implementation/mvp/tasks/P19_tasks.md) |
| P18 | Admin people ops *(spec)* | — | — |
| P21 | Email jobs (Resend) — **post-MVP** | [`P21_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P21_phase_description.md) | [`P21_tasks.md`](../implementation/mvp/tasks/P21_tasks.md) |

**UI matrix:** [`ui_component_phase_matrix.md`](../implementation/mvp/ui_component_phase_matrix.md)

### 2.6 Contracts: язык между фазами

Канонические contracts Pulse (волна W8 — [`documentation_creation_registry.md`](documentation_creation_registry.md)):

- [`monorepo_boundaries_contract.md`](../implementation/mvp/contracts/monorepo_boundaries_contract.md)
- [`authorization_policy_contract.md`](../implementation/mvp/contracts/authorization_policy_contract.md)
- [`schedule_slots_contract.md`](../implementation/mvp/contracts/schedule_slots_contract.md)
- [`booking_lifecycle_contract.md`](../implementation/mvp/contracts/booking_lifecycle_contract.md)
- [`wishlist_contract.md`](../implementation/mvp/contracts/wishlist_contract.md)
- [`trainer_verification_contract.md`](../implementation/mvp/contracts/trainer_verification_contract.md)
- [`file_upload_contract.md`](../implementation/mvp/contracts/file_upload_contract.md)
- [`review_moderation_contract.md`](../implementation/mvp/contracts/review_moderation_contract.md)
- [`email_notifications_contract.md`](../implementation/mvp/contracts/email_notifications_contract.md)

Формат — §2.3.4 реестра и lampto §4.3.

### 2.7 Guidelines: нормы реализации

Guidelines переносятся из lampto с адаптацией под Vercel и Warm Forest:

- `docs/guidelines/nextjs/` — README, data handling, loading, Vercel runtime, admin, Blob upload
- `docs/guidelines/react/` — forms, optimistic UI, components, hooks, utilities, tables, messages
- `docs/guidelines/auth/` — `ai_auth_implementation_guide.md`
- `docs/guidelines/typescript/` — `ai_typescript_monorepo_guidelines.md`
- `docs/guidelines/typography_text_guidelines.md` — Warm Forest typography

Все guidelines ссылаются на [`ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md) как на методологический канон.

---

## 3. Структура документации

### 3.1 Канонический каталог `docs/`

```
docs/
├── default_docs/                  — исходные PRD-черновики (MVP, pages, flows, design system)
├── prototypes/                    — HTML-прототип (визуальный эталон)
├── reference/
│   └── lampto_project_reference.md — связь с референсным проектом
│
├── prds/                          — требования и архитектурные решения (канон по мере миграции)
│   ├── 01_product_scope/
│   ├── 02_domain_model/
│   ├── 03_data_model/
│   ├── 04_authorization_privacy/
│   ├── 05_runtime/
│   ├── 06_operations/
│   ├── 07_governance/
│   └── architecture_master_index.md
│
├── guidelines/
├── design/
│   ├── canonical_routes.md
│   ├── styleguide.md              — Warm Forest component recipes (W7)
│   └── wireframes/mvp/
│
├── implementation/mvp/
│   ├── phases_tasks_descriptions/
│   ├── tasks/
│   ├── contracts/
│   ├── specs/
│   └── guides/
│
├── architecture_learning_pack/
└── meta/
    ├── ai_first_project_methodology.md  — этот документ
    └── documentation_creation_registry.md — порядок создания docs, волны, UX/UI, требования для агентов
```

**План создания документов:** [`documentation_creation_registry.md`](./documentation_creation_registry.md) — канонический реестр волн W0–W14, backlinks, UX/UI contracts. Агент создаёт PRD/specs/contracts **строго по реестру**.

### 3.2 Иерархия источников истины

При конфликте между документами — порядок приоритета:

1. **Cursor Rules** (`.cursor/rules/*.mdc`)
2. **`AGENTS.md`**
3. **Contracts** (`implementation/mvp/contracts/`)
4. **PRD** (`docs/prds/`) — после миграции из `default_docs/`
5. **Interim product docs** (`docs/default_docs/`) — до полной миграции в PRD
6. **Guidelines** (`docs/guidelines/`)
7. **ADR** (`docs/prds/07_governance/`)
8. **Wireframes / prototype** — визуальное описание, subordinate to canonical routes

**Правило:** если нижний документ противоречит верхнему — обновлять нижний.

**Миграция:** содержимое `default_docs/` постепенно переносится в `prds/` без изменения смысла. `default_docs/` остаётся read-only archive до завершения миграции.

### 3.3 Принципы именования файлов

Идентичны lampto — см. оригинал §3.3. Префикс `ai_` для AI-guidelines, `P{N}_` для фаз, `adr_{NNN}_` для ADR.

### 3.4 Принцип "кто обновляет что"

**Правило product-docs-alignment:** при любом изменении behavior — обновить документацию в той же задаче.

| Изменение | Что обновить |
|-----------|-------------|
| Новый маршрут | `canonical_routes.md`, wireframe, user flow |
| Изменение схемы БД | `database_schema_v1.md`, `data_access_patterns.md` |
| Изменение прав доступа | `authorization_matrix.md`, policy contract |
| Новый архитектурный выбор | ADR в `07_governance/` |
| Новый паттерн из lampto | Guideline + Cursor Rule |
| Изменение инварианта | `AGENTS.md` + Contract |

---

## 4. Типология документов

Типология **идентична lampto** (§4.1–4.10): PRD, ADR, Contract, Phase Description, Task List, Guideline, Cursor Rule, Wireframe, Spec, Architecture Learning Pack.

Примеры Pulse:

| Тип | Pulse |
|-----|-------|
| PRD MVP scope (canonical) | [`mvp_scope.md`](../prds/01_product_scope/mvp_scope.md) |
| PRD (interim archive) | [`fitness-platform-mvp.md`](../default_docs/fitness-platform-mvp.md) |
| User flows (canonical) | [`user_flows/users_mvp/client_flow.md`](../01_product_scope/user_flows/users_mvp/client_flow.md) и др. |
| User flows (interim archive) | [`user-flow-client.md`](../default_docs/user-flow-client.md) и др. |
| Design system (interim) | [`fitness-platform-design-system.md`](../default_docs/fitness-platform-design-system.md) |
| Prototype | [`Fitness_Platform_Prototype_v1.html`](../prototypes/Fitness_Platform_Prototype_v1.html) |
| ADR | [`adr_001_stack_and_runtime.md`](../prds/07_governance/adr_001_stack_and_runtime.md) |
| Routes canon | [`canonical_routes.md`](../design/canonical_routes.md) |

Полные шаблоны каждого типа — в [`docs/examples/lampto/docs/meta/ai_first_project_methodology.md`](../examples/lampto/docs/meta/ai_first_project_methodology.md) §4.

---

## Чеклист нового проекта Pulse

**Фундамент (до первой строки кода):**

- [x] `docs/meta/ai_first_project_methodology.md` — этот документ
- [x] `docs/meta/documentation_creation_registry.md` — реестр создания документации (волны, UX/UI, agent requirements)
- [x] `docs/reference/lampto_project_reference.md` — референс lampto
- [x] `docs/prds/architecture_master_index.md` — карта архитектуры
- [x] `docs/prds/07_governance/adr_001_stack_and_runtime.md` — выбор стека (Vercel, Neon, …)
- [x] `docs/prds/07_governance/adr_002_next162_vercel_runtime_policy.md` — Next.js **16.3.0** pin + `proxy.ts`
- [x] `docs/design/canonical_routes.md` — все маршруты
- [x] `docs/architecture_learning_pack/01_architecture_overview.md` — обзор для агентов
- [x] `AGENTS.md` — точка входа monorepo
- [x] `.cursor/rules/pulse-project-context.mdc` — always-applied контекст
- [x] Структура каталогов monorepo + docs
- [x] `docs/prds/01_product_scope/mvp_scope.md` — миграция из default_docs (W1)
- [x] `docs/prds/01_product_scope/post_mvp_deferrals.md` — post-MVP deferrals (W1)
- [x] `docs/prds/01_product_scope/pages_functional_spec.md` — pages spec (W1)
- [x] `docs/prds/01_product_scope/email_notifications_matrix.md` — email matrix (W1)
- [x] `docs/prds/07_governance/adr_index.md` — ADR registry (W1)
- [x] `docs/prds/07_governance/decision_process.md` — ADR process (W1)
- [x] `docs/prds/03_data_model/database_schema_v1.md`
- [x] `docs/prds/01_product_scope/user_flows/users_mvp/` — client, trainer, admin flows
- [x] `docs/prds/02_domain_model/` — lifecycle, FM catalog, invariants, use cases (W3)
- [x] `docs/prds/04_authorization_privacy/authorization_matrix.md` — role × resource (W5)
- [x] `docs/prds/04_authorization_privacy/` + `05_runtime/` — full runtime/auth PRD (W5)
- [x] `docs/prds/03_data_model/data_access_patterns.md` + supplements (W6)
- [x] `docs/prds/07_governance/adr_003`–`adr_007` — domain ADRs (W4)
- [x] UX contracts W2 + W7 — `docs/design/ux_ui_principles.md` … `styleguide.md`
- [x] `docs/implementation/mvp/contracts/` — 9 core contracts (W8)
- [x] `docs/implementation/mvp/specs/` — 8 implementation specs (W9)
- [x] `docs/design/wireframes/mvp/` — 28 MVP wireframes (W10)
- [x] `docs/prds/06_operations/` + implementation guides (W12)
- [x] `docs/architecture_learning_pack/02`–`04` — layer walkthroughs (W13)
- [x] **W14 final index sync** — `architecture_master_index`, PRD/design README, this checklist

**Документация MVP-complete (2026-05-23).** Следующий шаг — **P01 implementation**, не новые PRD без явного scope change.

**Для первой сессии реализации (P01):**

- [x] `apps/web/AGENTS.md`
- [x] `docs/implementation/mvp/phases_tasks_descriptions/P01_phase_description.md` — P01–P15 (W16)
- [x] `docs/implementation/mvp/tasks/P01_tasks.md` — P01–P15 task checklists (W16)
- [x] `docs/implementation/mvp/ui_component_phase_matrix.md` — Phase × Component (W16)
- [ ] Monorepo scaffold (package.json, workspaces)

**Guidelines (baseline ported):**

- [x] `docs/guidelines/nextjs/` — README, data handling, loading, Vercel runtime, admin, Blob upload
- [x] `docs/guidelines/react/` — forms, optimistic UI, components, hooks, utilities, tables, messages
- [x] `docs/guidelines/auth/` — Credentials guide
- [x] `docs/guidelines/typescript/` — monorepo types
- [x] `docs/guidelines/typography_text_guidelines.md` — Warm Forest typography
- [x] Cursor rules (core): product-docs-alignment, typescript-monorepo-types, data-server-actions, policy-packages, auth-security, nextjs-vercel-app-router
- [x] Cursor rules (UI/UX, from lampto): ui-toast, ui-mutation-pending, ui-optimistic, react-ui, warm-forest-shadcn, streaming-loading, blob-uploads, admin-forms, messages, icons, DRY
- [ ] On scaffold: wire `@/lib/messages`, `product-toast.ts`, typography atoms to match guidelines

---

## Итоговые принципы

1. **Документация — runtime, не архив.**
2. **Контракт важнее комментария.**
3. **Одна фаза = одна сессия агента.**
4. **Иерархия истины — явная.**
5. **Инварианты документируются отдельно.**
6. **Guidelines ссылаются на реальный код** (после scaffold) **или на lampto как эталон.**
7. **Cursor Rules — контракт, не совет.**
8. **lampto — первый источник архитектурных паттернов; Pulse ADR — для отличий.**

---

*Документ основан на [`docs/examples/lampto/docs/meta/ai_first_project_methodology.md`](../examples/lampto/docs/meta/ai_first_project_methodology.md) и продуктовых материалах Pulse в [`docs/default_docs/`](../default_docs/).*
