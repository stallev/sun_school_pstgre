# Implementation MVP — навигатор

**Тип:** Index  
**Статус:** Canonical  
**Версия:** 1.8  
**Дата:** 2026-10-24  
**Волна:** W14-06  
**Зависит от:** [`architecture_master_index.md`](../../prds/architecture_master_index.md), [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md)

---

Список документов реализации Sunday School. Каноническая карта проекта — [`architecture_master_index.md`](../../prds/architecture_master_index.md); этот файл — быстрый вход для исполнителя фазы.

**Статус (2026-10-23):** фазы P01…P08 реализованы; P09 (фиксы соответствия прототипу) — закрыт. **P10** — проход 3 визуального дрейфа по матрице экранов: [`P10_tasks.md`](./tasks/P10_tasks.md), журнал [`ui_prototype_fidelity_2026-10-21.md`](./audits/ui_prototype_fidelity_2026-10-21.md). **P11** — панель оценок сводной таблицы и тип карточки аналитики: [`P11_tasks.md`](./tasks/P11_tasks.md). **P12** — волна 1, достижения и штрафы: реализована за флагом `features.achievements` ([`P12_tasks.md`](./tasks/P12_tasks.md)); включение флага в prod — действие владельца. **P13** — волна 2, семьи и родители: реализована за флагом `features.parents` ([`P13_tasks.md`](./tasks/P13_tasks.md)); дайджест без почты; включение флага в prod — действие владельца. **P14** — редизайн v2: Source Sans 3, база 18 px, левый сайдбар, `Select` / `Checkbox` / `DateField` вместо нативных ([`P14_tasks.md`](./tasks/P14_tasks.md), [ADR-014](../../prds/07_governance/adr_014_app_redesign_v2.md)): реализована (2026-10-24), повторный замер — [`ui_redesign_audit_2026-10-24.md`](./audits/ui_redesign_audit_2026-10-24.md) §5. Импорт данных из старого приложения — вне проекта (владелец).

## Порядок чтения для фазы

1. [`P{N}_tasks.md`](./tasks/) — чек-лист и commit units.
2. [`P{N}_phase_description.md`](./phases_tasks_descriptions/) — DoD, smoke, бюджет контекста (≤ 8 документов).
3. Контракты и specs, на которые ссылаются задачи (`§`).
4. Правила `.cursor/rules/*.mdc` затрагиваемой области.

## Фазы реализации

| Фаза | Тема | Описание | Задачи |
|------|------|----------|--------|
| P01 | Фундамент: данные, вход, оболочка, регистрация и доступ | [P01](./phases_tasks_descriptions/P01_phase_description.md) | [P01](./tasks/P01_tasks.md) |
| P02 | Учебный год, группы, ученики, настройки | [P02](./phases_tasks_descriptions/P02_phase_description.md) | [P02](./tasks/P02_tasks.md) |
| P03 | Уроки, золотые стихи, календарь | [P03](./phases_tasks_descriptions/P03_phase_description.md) | [P03](./tasks/P03_tasks.md) |
| P04 | Проверка домашних заданий | [P04](./phases_tasks_descriptions/P04_phase_description.md) | [P04](./tasks/P04_tasks.md) |
| P05 | Кирпичики, рейтинг, аналитика | [P05](./phases_tasks_descriptions/P05_phase_description.md) | [P05](./tasks/P05_tasks.md) |
| P06 | Журнал, запросы на удаление, локализация | [P06](./phases_tasks_descriptions/P06_phase_description.md) | [P06](./tasks/P06_tasks.md) |
| P07 | Переходный период согласий и prod-готовность | [P07](./phases_tasks_descriptions/P07_phase_description.md) | [P07](./tasks/P07_tasks.md) |
| P08 | Аналитика по учебным годам | [P08](./phases_tasks_descriptions/P08_phase_description.md) | [P08](./tasks/P08_tasks.md) |
| P09 | Фиксы соответствия UI прототипу | [P09](./phases_tasks_descriptions/P09_phase_description.md) | [P09](./tasks/P09_tasks.md) |
| P10 | Визуальный дрейф UI (замеры по матрице) | — (см. [P10_tasks](./tasks/P10_tasks.md) Purpose) | [P10](./tasks/P10_tasks.md) |
| P11 | Панель оценок сводной таблицы и тип карточки аналитики | [P11](./phases_tasks_descriptions/P11_phase_description.md) | [P11](./tasks/P11_tasks.md) |
| P12 | Достижения и штрафы (волна 1, флаг `features.achievements`) | [P12](./phases_tasks_descriptions/P12_phase_description.md) | [P12](./tasks/P12_tasks.md) |
| P13 | Семьи и родители (волна 2, флаг `features.parents`) | [P13](./phases_tasks_descriptions/P13_phase_description.md) | [P13](./tasks/P13_tasks.md) |
| P14 | Редизайн v2: шрифт, шкала, оболочка, контролы | [P14](./phases_tasks_descriptions/P14_phase_description.md) | [P14](./tasks/P14_tasks.md) |

Нумерация фаз реализации (P01…P14) не совпадает с промптами bootstrap (P0…P6).

## Контракты

| Контракт | Назначение |
|----------|------------|
| [`monorepo_boundaries_contract.md`](./contracts/monorepo_boundaries_contract.md) | Пакеты, слои, `MutationResult`, коды отказов |
| [`access_requests_and_roles_contract.md`](./contracts/access_requests_and_roles_contract.md) | Регистрация, заявки, роли |
| [`school_year_and_groups_contract.md`](./contracts/school_year_and_groups_contract.md) | Год, группы, ученики, зачисление, согласия |
| [`homework_check_contract.md`](./contracts/homework_check_contract.md) | Уроки, проверка ДЗ, баллы |
| [`bricks_ledger_contract.md`](./contracts/bricks_ledger_contract.md) | Кирпичики |
| [`change_log_contract.md`](./contracts/change_log_contract.md) | Журнал изменений, action-коды |
| [`deletion_requests_contract.md`](./contracts/deletion_requests_contract.md) | Запросы на удаление |
| [`bible_seed_contract.md`](./contracts/bible_seed_contract.md) | Загрузка Библии, нумерация |
| [`analytics_year_snapshots_contract.md`](./contracts/analytics_year_snapshots_contract.md) | Снимки итогов учебного года, пороги, год по умолчанию (P08) |
| [`achievements_and_penalties_contract.md`](./contracts/achievements_and_penalties_contract.md) | Достижения и штрафы, пересчёт, флаг (P12) |
| [`families_and_parents_contract.md`](./contracts/families_and_parents_contract.md) | Семьи, роль родителя, согласие, дайджест без почты (P13) |

## Specs

| Spec | Назначение |
|------|------------|
| [`global_shell_spec.md`](./specs/global_shell_spec.md) | Оболочка и навигация |
| [`access_and_registration_spec.md`](./specs/access_and_registration_spec.md) | Вход, регистрация, профиль |
| [`homework_check_flow_spec.md`](./specs/homework_check_flow_spec.md) | Экраны проверки и сводной таблицы |
| [`analytics_screens_spec.md`](./specs/analytics_screens_spec.md) | Аналитика группы, ученика, школа (W9-07); v1.2 — по учебным годам (P08) |
| [`design_system_lab_spec.md`](./specs/design_system_lab_spec.md) | Каталог компонентов `/design-system` |
| [`achievements_screens_spec.md`](./specs/achievements_screens_spec.md) | Экраны достижений и штрафов; сверка с прототипом (P12) |
| [`families_and_parents_screens_spec.md`](./specs/families_and_parents_screens_spec.md) | Экраны семьи и родителя; сверка с прототипом (P13) |
| [`prototype_class_parity_spec.md`](./specs/prototype_class_parity_spec.md) | Сопоставление классов прототипа и UI-компонентов; протокол и скрипт сверки (P14) |

Остальные specs W9 на lean **не создаются** (W9-03, W9-05, W9-06, W9-08): требования тех экранов — в контрактах и описаниях фаз. Созданы W9-09 (P12) и W9-10 (P13).

## Guides

| Guide | Назначение |
|-------|------------|
| [`local_dev_setup.md`](./guides/local_dev_setup.md) | Локальная разработка |
| [`neon_prisma_migrations_guide.md`](./guides/neon_prisma_migrations_guide.md) | Neon и Prisma |
| [`vercel_deploy_guide.md`](./guides/vercel_deploy_guide.md) | Деплой |
| [`migration_runbook.md`](../../prds/06_operations/migration_runbook.md) | Миграции схемы и откат |

## Что вне проекта

Перенос данных из действующего приложения реализует владелец (решение 2026-10-11); требования совместимости — [`P07_phase_description.md`](./phases_tasks_descriptions/P07_phase_description.md) §Совместимость.
