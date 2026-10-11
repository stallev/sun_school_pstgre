# Implementation MVP — навигатор

**Тип:** Index  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W14-06  
**Зависит от:** [`architecture_master_index.md`](../../prds/architecture_master_index.md), [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md)

---

Список документов реализации Sunday School. Каноническая карта проекта — [`architecture_master_index.md`](../../prds/architecture_master_index.md); этот файл — быстрый вход для исполнителя фазы.

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

Нумерация фаз реализации (P01…P07) не совпадает с промптами bootstrap (P0…P6).

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

## Specs

| Spec | Назначение |
|------|------------|
| [`global_shell_spec.md`](./specs/global_shell_spec.md) | Оболочка и навигация |
| [`access_and_registration_spec.md`](./specs/access_and_registration_spec.md) | Вход, регистрация, профиль |
| [`homework_check_flow_spec.md`](./specs/homework_check_flow_spec.md) | Экраны проверки и сводной таблицы |
| [`design_system_lab_spec.md`](./specs/design_system_lab_spec.md) | Каталог компонентов `/design-system` |

Остальные specs W9 на lean **не создаются**: требования — в контрактах, UX-контрактах и разделе «Экранные требования» описаний фаз P03/P05.

## Guides

| Guide | Назначение |
|-------|------------|
| [`local_dev_setup.md`](./guides/local_dev_setup.md) | Локальная разработка |
| [`neon_prisma_migrations_guide.md`](./guides/neon_prisma_migrations_guide.md) | Neon и Prisma |
| [`vercel_deploy_guide.md`](./guides/vercel_deploy_guide.md) | Деплой |
| [`migration_runbook.md`](../../prds/06_operations/migration_runbook.md) | Миграции схемы и откат |

## Что вне проекта

Перенос данных из действующего приложения реализует владелец (решение 2026-10-11); требования совместимости — [`P07_phase_description.md`](./phases_tasks_descriptions/P07_phase_description.md) §Совместимость.
