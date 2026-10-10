# Pulse — Monorepo Agent Instructions

**Pulse** — онлайн-маркетплейс фитнес-тренеров (клиенты, тренеры, админы).  
Monorepo: **Next.js 16.3.0** App Router + Vercel + Neon PostgreSQL.

**Methodology (обязательно):** [`docs/meta/ai_first_project_methodology.md`](docs/meta/ai_first_project_methodology.md) — цикл КОНТЕКСТ → ФАЗА → КОНТРАКТ → ЗАДАЧИ → ВЕРИФИКАЦИЯ.

## Референсный snapshot (этот каталог)

Этот каталог — **самодостаточный** эталон кода и Pulse-домена. Дерева `docs/examples/lampto/` в **этом** репозитории нет; не ходить по старым path.

- Сводка для **нового** продукта (boilerplate): [`docs/reference/pulse_project_reference.md`](../../../docs/reference/pulse_project_reference.md)
- Исторический stub: [`docs/reference/lampto_project_reference.md`](docs/reference/lampto_project_reference.md)

**Правило внутри snapshot:** следовать Pulse Cursor Rules и Guidelines **этого дерева**. Отличия стека — [ADR-001](docs/prds/07_governance/adr_001_stack_and_runtime.md) и [ADR-002](docs/prds/07_governance/adr_002_next162_vercel_runtime_policy.md).

**Для нового продукта:** корневые Cursor Rules и Guidelines boilerplate **важнее** этого snapshot.

## Monorepo structure (целевая)

| Путь | Назначение |
|------|------------|
| [`apps/web`](apps/web/AGENTS.md) | Next.js App Router (тонкий BFF) — см. [`apps/web/AGENTS.md`](apps/web/AGENTS.md) |
| `apps/workers` | Фоновые задачи (Vercel Cron / serverless jobs на MVP; см. ADR-001) |
| `packages/domain` | Чистые бизнес-правила (без Next.js, без Vercel SDK, без DB) |
| `packages/policy/edge` | JWT-only проверки. **Без DB.** |
| `packages/policy/server` | Object-level проверки с Prisma. Только Route Handlers и Server Actions |
| `packages/db` | Prisma schema. Канон DDL: [`docs/prds/03_data_model/database_schema_v1.md`](docs/prds/03_data_model/database_schema_v1.md) |

## Cross-package rules

- `apps/*` handlers = тонкие адаптеры. Логика живёт в `packages/`
- **Запрещено** импортировать `packages/policy/server` из request interception layer (`proxy.ts`, `middleware.ts`) и Edge runtime
- **Domain literals и коды ошибок** — только из `@pulse/domain` (`USER_ROLE`, `AUTH_MUTATION_ERROR_CODES`, …); user-visible текст — `@/lib/messages`. Cursor Rule: **domain-literals-and-codes**
- **`TrainerProfile.timezone`** — источник истины для расписания, слотов, напоминаний и отображения времени
- **Post-MVP:** каждый email job — **`idempotency_key` + `delivery_log`** (таблицы в schema с MVP, отправка позже — см. [`mvp_scope.md`](docs/prds/01_product_scope/mvp_scope.md))
- Долгие операции (email batch, напоминания) — **не в request path** → workers/cron (**post-MVP**)
- Post-MVP поля (Stripe, Daily.co) — nullable в схеме с первого дня

## Иерархия источников истины

При конфликте: **Cursor Rules** → **AGENTS.md** (web AGENTS для web-кода, корень для monorepo invariants) → **Contracts** → **PRD** → **Guidelines** → **Prototype**.  
Web AGENTS не отменяет Cursor Rules — только маршрутизирует. Monorepo invariants из этого файла имеют приоритет над web AGENTS.

## Документация — точки входа

**Статус документации:** MVP-complete (волны W0–W14). Реестр создания — [`documentation_creation_registry.md`](docs/meta/documentation_creation_registry.md).

| Область | Документ |
|---------|----------|
| **Реестр документации (волны W0–W14)** | [`docs/meta/documentation_creation_registry.md`](docs/meta/documentation_creation_registry.md) |
| Методология AI-first | [`docs/meta/ai_first_project_methodology.md`](docs/meta/ai_first_project_methodology.md) |
| Карта архитектуры | [`docs/prds/architecture_master_index.md`](docs/prds/architecture_master_index.md) |
| Обзор для новых агентов | [`docs/architecture_learning_pack/01_architecture_overview.md`](docs/architecture_learning_pack/01_architecture_overview.md) |
| MVP scope (canonical) | [`docs/prds/01_product_scope/mvp_scope.md`](docs/prds/01_product_scope/mvp_scope.md) |
| MVP scope (interim archive) | [`docs/default_docs/fitness-platform-mvp.md`](docs/default_docs/fitness-platform-mvp.md) |
| **User flows (canonical)** | [`docs/prds/01_product_scope/user_flows/users_mvp/`](docs/prds/01_product_scope/user_flows/users_mvp/) |
| **Database schema (canonical)** | [`docs/prds/03_data_model/database_schema_v1.md`](docs/prds/03_data_model/database_schema_v1.md) |
| **Domain model (canonical)** | [`docs/prds/02_domain_model/`](docs/prds/02_domain_model/) — lifecycle, FM catalog, invariants |
| **Authorization & runtime** | [`docs/prds/04_authorization_privacy/`](docs/prds/04_authorization_privacy/), [`docs/prds/05_runtime/`](docs/prds/05_runtime/) |
| Страницы и маршруты | [`docs/design/canonical_routes.md`](docs/design/canonical_routes.md), [`docs/default_docs/fitness-platform-pages.md`](docs/default_docs/fitness-platform-pages.md) |
| Design system | [`docs/default_docs/fitness-platform-design-system.md`](docs/default_docs/fitness-platform-design-system.md) |
| **UI component catalog (Design Lab)** | [`docs/implementation/mvp/specs/design_system_lab_spec.md`](docs/implementation/mvp/specs/design_system_lab_spec.md) — `/design-system` → `apps/web/src/components/atoms/`, `components/ui/` |
| Guidelines + Cursor Rules | [`docs/guidelines/README.md`](docs/guidelines/README.md) |
| **Implementation contracts** | [`docs/implementation/mvp/contracts/`](docs/implementation/mvp/contracts/) |
| **Implementation specs** | [`docs/implementation/mvp/specs/`](docs/implementation/mvp/specs/) |
| **Implementation guides** | [`docs/implementation/mvp/guides/`](docs/implementation/mvp/guides/) |
| **Implementation phases (P01–P14 MVP; P16–P19, P21–P22 post-P14)** | [`docs/implementation/mvp/phases_tasks_descriptions/`](docs/implementation/mvp/phases_tasks_descriptions/) + [`tasks/`](docs/implementation/mvp/tasks/) + [`ui_component_phase_matrix.md`](docs/implementation/mvp/ui_component_phase_matrix.md) |
| HTML-прототип | [`docs/prototypes/Fitness_Platform_Prototype_v1.html`](docs/prototypes/Fitness_Platform_Prototype_v1.html), landing: [`Pulse Landing Page -Standalone-.html`](docs/prototypes/Pulse Landing Page -Standalone-.html) |
| Runtime / стек | [`docs/prds/07_governance/adr_001_stack_and_runtime.md`](docs/prds/07_governance/adr_001_stack_and_runtime.md), [ADR-002](docs/prds/07_governance/adr_002_next162_vercel_runtime_policy.md) |

## Цикл работы агента

```
КОНТЕКСТ → ФАЗА → КОНТРАКТ → ЗАДАЧИ → ВЕРИФИКАЦИЯ
```

1. Прочитать этот файл, [`ai_first_project_methodology.md`](docs/meta/ai_first_project_methodology.md) и `.cursor/rules/pulse-project-context.mdc`
2. При работе в `apps/web` — также [`apps/web/AGENTS.md`](apps/web/AGENTS.md)
3. Определить фазу (`docs/implementation/mvp/phases_tasks_descriptions/P{N}_*.md`)
4. Прочитать contracts для фазы
5. Выполнить чеклист из `docs/implementation/mvp/tasks/P{N}_tasks.md`
6. Верифицировать по чеклисту фазы и обновить документацию при изменении behavior

## Статус репозитория

**Текущая фаза:** P14 complete (quality gate). **Post-P14 tracks:** **P16** (public landing v2), **P17** (UI i18n EN/RU — **complete**), **P19** (complaint resolution v2 — in progress), **P18** (admin people ops, spec only), **P21** (email & jobs, post-MVP deferral), **P22** (Instant Navigations / Next.js 16.3 — **implementation complete**, D3 smoke on `next dev`). См. [`_migration_P17_to_P19.md`](docs/implementation/mvp/phases_tasks_descriptions/_migration_P17_to_P19.md) (complaints renumber only).  
`apps/workers` — ещё не создан.  
Не расширять реализацию без явной фазы и contract.

### Manual verification checklist (monorepo)

- [ ] Изменения согласуются с [`ai_first_project_methodology.md`](docs/meta/ai_first_project_methodology.md)
- [ ] Маршруты не дублируются вне [`canonical_routes.md`](docs/design/canonical_routes.md)
- [ ] Нет inline domain/mutation codes — константы из `@pulse/domain` (**domain-literals-and-codes**)
- [ ] Domain invariants не нарушены (timezone, booking state machine, trainer verification)
