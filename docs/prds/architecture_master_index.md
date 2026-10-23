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
| Достижения и штрафы (interim, post-MVP) | [`../my_specs/achievements_spec.md`](../my_specs/achievements_spec.md) | — | Interim; канон поведения — [ADR-012](./07_governance/adr_012_achievements_and_penalties.md) и контракт W8-11 |

## 5. Доменная модель и данные

| Документ | Путь | Волна | Статус |
|----------|------|-------|--------|
| Database schema v1 | [`03_data_model/database_schema_v1.md`](./03_data_model/database_schema_v1.md) | W1-F6 | Canonical |
| Lifecycle models | [`02_domain_model/lifecycle_models.md`](./02_domain_model/lifecycle_models.md) | W3-02 | Canonical |
| Domain invariants | [`02_domain_model/domain_invariants.md`](./02_domain_model/domain_invariants.md) | W3-04 | Canonical |
| Seed data spec | [`03_data_model/seed_data_spec.md`](./03_data_model/seed_data_spec.md) | W6-03 | Canonical |
| Данные и скрипты Библии (interim) | [`../my_specs/Bible/README.md`](../my_specs/Bible/README.md) | — | Interim |

## 6. Governance и runtime

| Документ | Путь | Волна | Статус |
|----------|------|-------|--------|
| ADR-001 Стек и окружения | [`07_governance/adr_001_stack_and_runtime.md`](./07_governance/adr_001_stack_and_runtime.md) | W1-F1 | Canonical |
| ADR-002 Next.js runtime | [`07_governance/adr_002_nextjs_vercel_runtime_policy.md`](./07_governance/adr_002_nextjs_vercel_runtime_policy.md) | W1-F2 | Canonical |
| ADR-003 Auth (OIDC, JWT, RBAC) | [`07_governance/adr_003_auth_oidc_jwt_rbac.md`](./07_governance/adr_003_auth_oidc_jwt_rbac.md) | W4-01 | Canonical |
| ADR-004 Часовой пояс | [`07_governance/adr_004_timezone_scheduling_model.md`](./07_governance/adr_004_timezone_scheduling_model.md) | W4-02 | Canonical |
| ADR-005 Схема целиком | [`07_governance/adr_005_schema_complete_post_mvp_tables.md`](./07_governance/adr_005_schema_complete_post_mvp_tables.md) | W4-03 | Canonical |
| ADR-006 Email (идемпотентная доставка) | — | W4-04 | Не требуется (модуль `email_jobs` выключен) |
| ADR-007 Файлы / S3 | — | W4-05 | Не требуется (модуль `s3_uploads` выключен) |
| ADR-008 i18n | [`07_governance/adr_008_i18n_ru_en_dictionary_slices.md`](./07_governance/adr_008_i18n_ru_en_dictionary_slices.md) | W4-06 | Canonical |
| ADR-009 Библия: нумерация и лицензия | [`07_governance/adr_009_bible_translations_and_verse_numbering.md`](./07_governance/adr_009_bible_translations_and_verse_numbering.md) | W4-07 | Canonical (§3.2 — Proposed) |
| ADR-011 Переходный период согласий (перенесённые дети) | [`07_governance/adr_011_transitional_child_consent.md`](./07_governance/adr_011_transitional_child_consent.md) | W11 / P07 | Canonical |
| ADR-012 Волна 1: достижения и штрафы | [`07_governance/adr_012_achievements_and_penalties.md`](./07_governance/adr_012_achievements_and_penalties.md) | P12 | Canonical |
| Authorization matrix | [`04_authorization_privacy/authorization_matrix.md`](./04_authorization_privacy/authorization_matrix.md) | W5-02 | Canonical |
| Auth runtime spec | [`05_runtime/auth_runtime_spec.md`](./05_runtime/auth_runtime_spec.md) | W5-08 | Canonical |
| Policy enforcement, privacy handling, runtime README / backend / monorepo packages / cache policy | — | W5-01, W5-03…W5-07, W5-09 | Не требуется на lean (покрыто ADR-001/002/003, `authorization_matrix`, контрактами W8) |

## 7. UX/UI, контракты, фазы

| Слой | Документы | Волны | Статус |
|------|-----------|-------|--------|
| UX/UI | [UX-02 `responsive_navigation_contract`](../design/responsive_navigation_contract.md), [UX-03 `visual_identity_contract`](../design/visual_identity_contract.md), [UX-08 `prototype_route_mapping`](../design/prototype_route_mapping.md) | W2 | Canonical |
| UX interaction | [UX-05 `ui_states_contract`](../design/ui_states_contract.md), [UX-06 `forms_and_validation_ux`](../design/forms_and_validation_ux.md) | W7 | Canonical |
| Contracts | [W8-01 `monorepo_boundaries_contract`](../implementation/mvp/contracts/monorepo_boundaries_contract.md); контракты мутаций W8-03…W8-11 ([W8-03](../implementation/mvp/contracts/access_requests_and_roles_contract.md), [W8-04](../implementation/mvp/contracts/school_year_and_groups_contract.md), [W8-05](../implementation/mvp/contracts/homework_check_contract.md), [W8-06](../implementation/mvp/contracts/bricks_ledger_contract.md), [W8-07](../implementation/mvp/contracts/change_log_contract.md), [W8-08](../implementation/mvp/contracts/deletion_requests_contract.md), [W8-09](../implementation/mvp/contracts/bible_seed_contract.md), [W8-10](../implementation/mvp/contracts/analytics_year_snapshots_contract.md), [W8-11](../implementation/mvp/contracts/achievements_and_penalties_contract.md)) | W8 | W8-01, W8-03…W8-11 Canonical (W8-02 не требуется) |
| Specs | [W9-01 `global_shell_spec`](../implementation/mvp/specs/global_shell_spec.md); [W9-02 `access_and_registration_spec`](../implementation/mvp/specs/access_and_registration_spec.md); [W9-04 `homework_check_flow_spec`](../implementation/mvp/specs/homework_check_flow_spec.md); [W9-07 `analytics_screens_spec`](../implementation/mvp/specs/analytics_screens_spec.md); [W9-09 `achievements_screens_spec`](../implementation/mvp/specs/achievements_screens_spec.md); W9-03, W9-05, W9-06, W9-08 — не требуются на lean | W9 | W9-01, W9-02, W9-04, W9-07, W9-09 Canonical |
| Design System Lab | [`design_system_lab_spec`](../implementation/mvp/specs/design_system_lab_spec.md) | W15 | Canonical |
| Phases + tasks | [P01](../implementation/mvp/phases_tasks_descriptions/P01_phase_description.md) · [P02](../implementation/mvp/phases_tasks_descriptions/P02_phase_description.md) · [P03](../implementation/mvp/phases_tasks_descriptions/P03_phase_description.md) · [P04](../implementation/mvp/phases_tasks_descriptions/P04_phase_description.md) · [P05](../implementation/mvp/phases_tasks_descriptions/P05_phase_description.md) · [P06](../implementation/mvp/phases_tasks_descriptions/P06_phase_description.md) · [P07](../implementation/mvp/phases_tasks_descriptions/P07_phase_description.md) · [P08](../implementation/mvp/phases_tasks_descriptions/P08_phase_description.md) · [P09](../implementation/mvp/phases_tasks_descriptions/P09_phase_description.md) · [P12](../implementation/mvp/phases_tasks_descriptions/P12_phase_description.md) (description + tasks в `implementation/mvp/tasks/`) | W11 | Canonical; P12 — документы, код не начат |
| Operations | [`migration_runbook`](./06_operations/migration_runbook.md), [`pre_production_checklist`](./06_operations/pre_production_checklist.md), [`local_dev_setup`](../implementation/mvp/guides/local_dev_setup.md), [`vercel_deploy_guide`](../implementation/mvp/guides/vercel_deploy_guide.md), [`neon_prisma_migrations_guide`](../implementation/mvp/guides/neon_prisma_migrations_guide.md) | W12 / P07 | Canonical |
| Навигаторы | [implementation/mvp/README](../implementation/mvp/README.md), [prds/README](./README.md), [design/README](../design/README.md) | W14 | Canonical |
| Реестр решений и открытых вопросов bootstrap P3 | [`../meta/bootstrap_p3_decisions_register.md`](../meta/bootstrap_p3_decisions_register.md) | W14 | Canonical |

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
| 2026-10-10 | v1.2 — W1-F6 `database_schema_v1.md` → Canonical |
| 2026-10-10 | v1.3 — ADR-009 создан раньше волны (решения владельца по Библии) |
| 2026-10-10 | v1.4 — W2: UX-02, UX-03, UX-08 → Canonical |
| 2026-10-10 | v1.5 — W3: lifecycle_models, domain_invariants → Canonical |
| 2026-10-11 | v1.6 — ADR-003 → Canonical |
| 2026-10-11 | v1.7 — ADR-004, ADR-005 → Canonical |
| 2026-10-11 | v1.8 — ADR-008 → Canonical; ADR-006 / ADR-007 помечены «не требуется» |
| 2026-10-11 | v1.9 — W5-02 `authorization_matrix` → Canonical |
| 2026-10-11 | v1.10 — W5-08 `auth_runtime_spec` → Canonical; прочие W5 помечены «не требуется» |
| 2026-10-11 | v1.11 — W6-03 `seed_data_spec` → Canonical; W6-01 / W6-02 «не требуется» |
| 2026-10-11 | v1.12 — W7-02 UX-05 `ui_states_contract` → Canonical; W7-01 / W7-04 / W7-05 «не требуется на lean» |
| 2026-10-11 | v1.13 — W7-03 UX-06 `forms_and_validation_ux` → Canonical |
| 2026-10-11 | v1.14 — W8-01 `monorepo_boundaries_contract` → Canonical |
| 2026-10-11 | v1.15 — W8-03 `access_requests_and_roles_contract` → Canonical |
| 2026-10-11 | v1.16 — W8-04 `school_year_and_groups_contract` → Canonical |
| 2026-10-11 | v1.17 — W8-05 `homework_check_contract` → Canonical |
| 2026-10-11 | v1.18 — W8-06 `bricks_ledger_contract` → Canonical |
| 2026-10-11 | v1.19 — W8-07 `change_log_contract` → Canonical; `audit_log.request_id` |
| 2026-10-11 | v1.20 — W8-08 `deletion_requests_contract` → Canonical |
| 2026-10-11 | v1.21 — W8-09 `bible_seed_contract` → Canonical; W8-02 «не требуется на lean» |
| 2026-10-11 | v1.22 — W9-01 `global_shell_spec` → Canonical; UX-02 §6: disclosure вместо role=menu |
| 2026-10-11 | v1.23 — W9-04 `homework_check_flow_spec` → Canonical |
| 2026-10-11 | v1.24 — W9-02 `access_and_registration_spec` → Canonical; W9 lean завершена |
| 2026-10-11 | v1.25 — W15-01 `design_system_lab_spec` → Canonical; `/design-system` dev-only в canonical_routes |
| 2026-10-11 | v1.26 — W11 P01…P07 phase descriptions and tasks → Canonical |
| 2026-10-11 | v1.27 — ADR-011 (переходный период согласий); решения владельца по W11: одобрение teacher без групп, метрика рейтинга, сдвиг оценок за стихи; правки промптов P4/P5/P6 |
| 2026-10-11 | v1.28 — W12: migration_runbook, local_dev_setup, vercel_deploy_guide, neon_prisma_migrations_guide → Canonical; перенос данных из старого приложения вне проекта (реализует владелец) |
| 2026-10-11 | v1.29 — P07 переименована (переходный период согласий и prod-готовность): перенос данных вне проекта по решению владельца |
| 2026-10-11 | v1.30 — W14: навигаторы (README), финальная сверка индекса; статус проекта обновлён |
| 2026-10-11 | v1.31 — W14: реестр решений и открытых вопросов bootstrap P3 |
| 2026-10-11 | v1.33 — bootstrap P5: каркас монорепо (`packages/{domain,db,policy}`, `apps/web`), схема v1 реализована и мигрирована на dev-Neon; ADR-001 Q-01, Q-02 решены, Q-05 (PG 18) открыт |
| 2026-10-11 | v1.32 — bootstrap P4: активированы T1-правила; `auth-security` и auth-гайд переписаны под ADR-003; guidelines очищены от несозданных ссылок |
| 2026-10-18 | v1.34 — W9-07 `analytics_screens_spec` → Canonical (P05-CU9) |
| 2026-10-19 | v1.35 — P07 MVP prod-ready: `pre_production_checklist`, smoke CU9; статус проекта в `AGENTS.md` |
| 2026-10-19 | v1.36 — P08 «Аналитика по учебным годам»: W8-10 `analytics_year_snapshots_contract`, `analytics_screens_spec` v1.2, схема §5.7, AZ-48…AZ-51, INV-26/27, D19–D21, `P08_phase_description` + `P08_tasks` (W11-15, W11-16) |
| 2026-10-20 | v1.37 — P09 «Фиксы соответствия UI прототипу»: `P09_phase_description` + `P09_tasks`; подписи оболочки UX-02 и вход §6 |
| 2026-10-22 | v1.38 — Волна 1: ADR-012, W8-11, W9-09, P12 (документы; код не начат) |
