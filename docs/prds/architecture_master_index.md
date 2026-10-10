# Architecture Master Index — Sunday School

**Тип:** PRD (индекс)  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-10  
**Волна:** W1-F3  
**Зависит от:** [`adr_001_stack_and_runtime.md`](./07_governance/adr_001_stack_and_runtime.md), [`adr_002_nextjs_vercel_runtime_policy.md`](./07_governance/adr_002_nextjs_vercel_runtime_policy.md)  
**Связанные документы:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md), [`AGENTS.md`](../../AGENTS.md)

---

## 1. Purpose

Единая карта документации проекта: где что лежит, в каком статусе, какая волна создаёт. Агент читает индекс после `AGENTS.md`, чтобы найти нужный раздел, не перебирая каталоги. Порядок и обязательность документов определяет **только** реестр; индекс отражает фактическое состояние.

## 2. Scope

Покрывает документы уровня lean (профиль [`project_quality_profile.md`](../meta/project_quality_profile.md)). Документы вне lean перечислены в реестре со строкой «не требуется на lean».

## 3. Статусы

| Статус | Значение |
|--------|----------|
| **Canonical** | Создан, прошёл §2.6 реестра |
| **Planned** | Строка в реестре есть, файла ещё нет (волна W{N}) |
| **Interim** | Входной материал владельца в [`docs/my_specs/`](../my_specs/); читать при миграции, не править |

## 4. Продуктовый слой

| Документ | Путь | Волна | Статус |
|----------|------|-------|--------|
| MVP scope | [`01_product_scope/mvp_scope.md`](./01_product_scope/mvp_scope.md) | W1-03 | Canonical |
| Post-MVP deferrals | [`01_product_scope/post_mvp_deferrals.md`](./01_product_scope/post_mvp_deferrals.md) | W1-04 | Canonical |
| User flows (admin, teacher) | [`01_product_scope/user_flows/users_mvp/`](./01_product_scope/user_flows/users_mvp/) | W1-F4 | Canonical |
| Canonical routes | [`../design/canonical_routes.md`](../design/canonical_routes.md) | W1-F5 | Canonical |
| Спецификация (interim) | [`../my_specs/sunday_school_data_analytics_spec.md`](../my_specs/sunday_school_data_analytics_spec.md) | — | Interim |
| MVP и post-MVP (interim) | [`../my_specs/mvp_scope.md`](../my_specs/mvp_scope.md) | — | Interim |
| Достижения и штрафы (interim, post-MVP) | [`../my_specs/achievements_spec.md`](../my_specs/achievements_spec.md) | — | Interim |

## 5. Доменная модель и данные

| Документ | Путь | Волна | Статус |
|----------|------|-------|--------|
| Database schema v1 | [`03_data_model/database_schema_v1.md`](./03_data_model/database_schema_v1.md) | W1-F6 | Planned |
| Lifecycle models | `02_domain_model/lifecycle_models.md` | W3-02 | Planned |
| Domain invariants | `02_domain_model/domain_invariants.md` | W3-04 | Planned |
| Seed data spec | `03_data_model/seed_data_spec.md` | W6-03 | Planned |
| Данные и скрипты Библии (interim) | [`../my_specs/Bible/README.md`](../my_specs/Bible/README.md) | — | Interim |

## 6. Governance и runtime

| Документ | Путь | Волна | Статус |
|----------|------|-------|--------|
| ADR-001 Стек и окружения | [`07_governance/adr_001_stack_and_runtime.md`](./07_governance/adr_001_stack_and_runtime.md) | W1-F1 | Canonical |
| ADR-002 Next.js runtime | [`07_governance/adr_002_nextjs_vercel_runtime_policy.md`](./07_governance/adr_002_nextjs_vercel_runtime_policy.md) | W1-F2 | Canonical |
| ADR-003 Auth (OIDC, JWT, RBAC) | `07_governance/adr_003_auth_oidc_jwt_rbac.md` | W4-01 | Planned |
| ADR-005 Схема целиком | `07_governance/adr_005_schema_complete_post_mvp_tables.md` | W4-03 | Planned |
| ADR-008 i18n | `07_governance/adr_008_i18n_ru_en_dictionary_slices.md` | W4-06 | Planned |
| ADR-009 Библия: нумерация и лицензия | `07_governance/adr_009_bible_translations_and_verse_numbering.md` | W4-07 | Planned |
| Authorization matrix | `04_authorization_privacy/authorization_matrix.md` | W5-02 | Planned |
| Auth runtime spec | `05_runtime/auth_runtime_spec.md` | W5-08 | Planned |

## 7. UX/UI, контракты, фазы

| Слой | Документы | Волны | Статус |
|------|-----------|-------|--------|
| UX/UI | UX-02 `responsive_navigation_contract`, UX-03 `visual_identity_contract` (+ UX-08 `prototype_route_mapping`) | W2 | Planned |
| UX interaction | UX-05 `ui_states_contract`, UX-06 `forms_and_validation_ux` | W7 | Planned |
| Contracts | `monorepo_boundaries` и контракты мутаций | W8 | Planned |
| Specs | `global_shell_spec`, `homework_check_flow_spec` (+ вход / регистрация) | W9 | Planned |
| Design System Lab | `design_system_lab_spec` | W15 | Planned |
| Phases + tasks | `P01…P07` description + tasks | W11 | Planned |
| Operations | `local_dev_setup`, `vercel_deploy_guide`, `neon_prisma_migrations_guide` | W12 | Planned |

## 8. Визуальный эталон

HTML-прототип: [`../prototypes/sunday_school_prototype.html`](../prototypes/sunday_school_prototype.html) — visual reference only; ключи экранов `#screen-<view>`, token dump и gap-список — в `<head>`.

## 9. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| — | — | — | — |

## 10. Related documents

| Document | Relationship |
|----------|--------------|
| [`../meta/documentation_creation_registry.md`](../meta/documentation_creation_registry.md) | Порядок и обязательность документов |
| [`../meta/ai_first_project_methodology.md`](../meta/ai_first_project_methodology.md) | Методология |
| [`../../AGENTS.md`](../../AGENTS.md) | Точка входа |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W1-F3

## 11. Agent notes

- Индекс не заменяет реестр: при расхождении правит индекс.
- При создании документа в той же сессии менять статус Planned → Canonical (реестр §2.5).
- Маршруты — только в `canonical_routes.md`, сущности — только в `database_schema_v1.md`.

## Change log

| Date | Change |
|------|--------|
| 2026-10-10 | v1.0 — Canonical (W1-F3); ADR-001 / ADR-002 созданы |
| 2026-10-10 | v1.1 — W1-F4, W1-F5, W1-03, W1-04 → Canonical |
