# Migration runbook — миграции схемы (Neon + Prisma v7)

**Тип:** PRD (operations)  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W12-02  
**Зависит от:** [`database_schema_v1.md`](../03_data_model/database_schema_v1.md), [`adr_001_stack_and_runtime.md`](../07_governance/adr_001_stack_and_runtime.md) §3.2–§3.4, [`adr_005_schema_complete_post_mvp_tables.md`](../07_governance/adr_005_schema_complete_post_mvp_tables.md), [`seed_data_spec.md`](../03_data_model/seed_data_spec.md) §4–§5, [`monorepo_boundaries_contract.md`](../../implementation/mvp/contracts/monorepo_boundaries_contract.md) §9  
**Связанные документы:** [`neon_prisma_migrations_guide.md`](../../implementation/mvp/guides/neon_prisma_migrations_guide.md), [`local_dev_setup.md`](../../implementation/mvp/guides/local_dev_setup.md), [`vercel_deploy_guide.md`](../../implementation/mvp/guides/vercel_deploy_guide.md), [`deletion_requests_contract.md`](../../implementation/mvp/contracts/deletion_requests_contract.md), [`architecture_master_index.md`](../architecture_master_index.md)  
**Проверено по:** Prisma ORM — prisma.io через WebFetch, 2026-10-11: `prisma.config.ts` — `datasource.url` обязателен, `directUrl` в v7 **удалён**, `migrations.path`, `migrations.seed` (seed запускается только `prisma db seed`), `env()` бросает ошибку при отсутствии переменной (для `generate` в CI использовать `process.env`), `.env` в Node.js автоматически не загружается (нужен `dotenv/config` или `--env-file`); `migrate deploy` — команда для staging/prod, запускается в CI/CD, хранить прод-URL на машине разработчика «не считается хорошей практикой», на Vercel `prisma` может понадобиться как production-зависимость. Страница «development and production workflows» (поведение `migrate dev`, `migrate status`, shadow DB) **не удалось сверить** в этой сессии — эти пункты даны по референсу Pulse и помечены. Neon — neon.com через WebFetch, 2026-10-11: pooled-подключение (`-pooler`, PgBouncer в transaction mode) — для приложения; direct — для миграций, `pg_dump`; при pooled **не поддерживаются** `SET`, `LISTEN/NOTIFY`, SQL-level `PREPARE`, **session-level advisory locks**; ветки — copy-on-write, окно восстановления настраивается (по умолчанию 6 часов Free / 1 сутки платные, до 7 / 30 суток на старших тарифах). Context7 недоступен.

---

## 1. Purpose

Единый порядок изменения и применения схемы БД: кто, где и каким шагом создаёт и применяет миграции, как откатываться и что запрещено. Читают: исполнитель P5/P01+ (`packages/db`), `reviewer` (T3 — миграции в sensitive zone), владелец при релизе.

## 2. Scope / Out of scope

**В scope:** конфигурация Prisma v7, матрица окружений, создание и применение миграций, ручной SQL (частичные индексы, процедуры), порядок релиза, политика отката.  
**Вне scope:** перенос данных из действующего приложения — **описывать не требуется** (решение владельца 2026-10-11: реализует самостоятельно); см. границы для владельца в §11. Содержимое таблиц — [`database_schema_v1.md`](../03_data_model/database_schema_v1.md); команды seed — [`seed_data_spec.md`](../03_data_model/seed_data_spec.md).

## 3. Definitions

| Термин | Значение |
|--------|----------|
| Pooled URL | `DATABASE_URL`, хост с `-pooler`; для приложения (serverless) |
| Direct URL | `DIRECT_URL`, без `-pooler`; для CLI Prisma, seed, `pg_dump` |
| Миграция | папка в `packages/db/prisma/migrations/*` с `migration.sql` |
| Релизный шаг | применение миграций к целевой БД из CI/CD или оператором по чек-листу |
| Маркер окружения | `app_setting.db_environment` ([`seed_data_spec.md`](../03_data_model/seed_data_spec.md) §5) |

## 4. Конфигурация Prisma v7 (канон)

Файл `packages/db/prisma.config.ts` (содержимое — таблицей, код пишет исполнитель P5):

| Параметр | Значение | Примечание |
|----------|----------|------------|
| `schema` | `prisma/schema.prisma` | один источник схемы; правка начинается с `database_schema_v1.md` |
| `datasource.url` | `env("DIRECT_URL")` | CLI подключается напрямую; `directUrl` в v7 удалён |
| `migrations.path` | `prisma/migrations` | |
| `migrations.seed` | команда запуска seed (`tsx …`) | запускается только `prisma db seed`; `migrate` seed **не** запускает |
| Загрузка `.env` | `import "dotenv/config"` в конфиге либо `--env-file` | Node не загружает `.env` сам |
| `env()` и `generate` | в CI для `prisma generate` использовать `process.env`, а не `env()` | `env()` падает при отсутствии переменной |

Приложение (runtime): клиент создаётся **только** с driver adapter (`@prisma/adapter-pg` + пул `pg`) на `DATABASE_URL`; в `schema.prisma` нет `url`/`directUrl` (v7). `prisma` на Vercel может понадобиться как production-зависимость (если devDependencies отсекаются при сборке) — проверяется на P5.

## 5. Матрица окружений

| Окружение | Создать миграцию (`migrate dev`) | Применить (`migrate deploy`) | Seed |
|-----------|:--------------------------------:|:----------------------------:|:----:|
| Local dev (Neon-проект dev) | ✔ автор миграции | ✔ после pull | ✔ `db:seed:reference` / `bible` / `dev` |
| CI (временная БД / ветка Neon) | ✘ | ✔ на пустой/ветке | опционально smoke |
| Vercel Preview | ✘ | ✔ релизным шагом на **dev-проект** (не prod) | ✘ |
| Production (Neon-проект prod) | ✘ **запрещено** | ✔ **только релизный шаг** | ✘ `seed:dev` запрещён; `seed:reference` / `seed:bible` — по чек-листу релиза |

Два проекта Neon (dev и prod) — [ADR-001 §3.4](../07_governance/adr_001_stack_and_runtime.md); ветки Neon внутри проекта — для репетиций и тестов, не для разделения dev и prod.

## 6. Happy path — новая миграция (локально)

**Предусловия:** изменение согласовано с [`database_schema_v1.md`](../03_data_model/database_schema_v1.md); `DIRECT_URL` указывает на dev-проект.

1. Правка `database_schema_v1.md` (**в том же CU**, `product-docs-alignment`).
2. Правка `packages/db/prisma/schema.prisma`.
3. `migrate dev --name <snake_case>` из `packages/db` (команда — [`neon_prisma_migrations_guide.md`](../../implementation/mvp/guides/neon_prisma_migrations_guide.md)).
4. Просмотр сгенерированного `migration.sql`; ручные дополнения (§7).
5. `prisma generate`; `npm run typecheck` (корень).
6. Тесты `packages/db` на временной БД/ветке.
7. Коммит: схема + миграция + документ.

**Постусловия:** таблица `_prisma_migrations` обновлена локально; папка миграции в git.

## 7. Ручной SQL в миграциях (обязательные случаи)

| Случай | Что | Источник |
|--------|-----|----------|
| Частичные уникальные индексы | `UNIQUE … WHERE` (один `ACTIVE` год R-1; одно активное зачисление R-2; один открытый запрос на субъект) | [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) §7 |
| CHECK-ограничения | `signed_on` nullable только при `LEGACY_PENDING`; субъект запроса удаления — ровно один | ADR-011, deletion contract |
| Привилегированные процедуры | функции БД для удаления данных ребёнка и очистки текста журнала (P06) | [`deletion_requests_contract.md`](../../implementation/mvp/contracts/deletion_requests_contract.md) §12 |
| Роль приложения | права без `UPDATE`/`DELETE` над `audit_log`, `brick_ledger` | R-6 |

Правила: ручной SQL — в `migration.sql` под ревью `reviewer` (T3); без `IF EXISTS`-«исправлений» дрифта; блокировки приложения — `SELECT … FOR UPDATE` и **транзакционные** advisory-блокировки (`pg_advisory_xact_lock`); **session-level** advisory locks допустимы только на direct-подключении (seed, миграции) — на pooled не поддерживаются.

## 8. Happy path — релиз (preview / production)

**Предусловия:** миграции влиты в целевую ветку; `DIRECT_URL` целевого проекта доступен **релизному шагу** (CI/CD), не разработчику локально для prod.

| Шаг | Действие | Проверка |
|-----|----------|----------|
| 1 | `migrate status` (целевая БД) | ожидаемые pending, нет «failed» (*по референсу Pulse*) |
| 2 | `migrate deploy` | применены только pending, без ошибок |
| 3 | `prisma generate` (если не в сборке) | типы актуальны |
| 4 | Деплой приложения | старт проходит проверку `APP_ENV` ↔ маркер |
| 5 | Справочники и первый admin (первый релиз / по чек-листу) | `npm run db:seed:reference` → `npm run db:seed:bible` (RST; `db:seed:bible:niv` — только при подтверждённой лицензии NIV) → `npm run db:seed:admin` (email и пароль — env оператора на время команды, не Vercel runtime) |

Порядок: **миграции → деплой** (приложение совместимо с новой схемой); для несовместимых изменений — расширяющая миграция → деплой → сужающая миграция (expand/contract).

## 9. Rollback-политика

| Ситуация | Действие |
|----------|----------|
| Ошибка в миграции **до** применения в prod | исправить миграцию, пересоздать в dev, повторить |
| Миграция применена в prod, нужна правка | **исправляющая миграция вперёд** (forward-only); `migrate reset`, правка истории и ручной откат в prod запрещены |
| Катастрофа (потеря/порча данных) | восстановление по окну Neon (ветка/instant restore), решение владельца; окно — **часть текста согласия** (УД-11) |
| Деплой приложения неудачен, схема совместима | откат деплоя на Vercel, миграции остаются |
| Деплой неудачен, схема несовместима | исправляющая миграция + новый деплой |

Окно восстановления Neon (по умолчанию 6 часов Free, 1 сутки на платных, до 7/30 суток по тарифу) определяет, как далеко назад возможно восстановление; для prod выбирается тариф и значение, указывается в [`/privacy`](../../implementation/mvp/specs/access_and_registration_spec.md) (P07).

## 10. Negative paths

| Случай | Условие | Исход |
|--------|---------|-------|
| `migrate dev` на prod | прод-URL в окружении | **запрещено**; релизный шаг не содержит `migrate dev` |
| Дрифт схемы | БД ≠ `schema.prisma` | остановка; исправляющая миграция, не правка вручную |
| Миграция через pooled URL | `-pooler` в `DIRECT_URL` | CLI может зависать/ошибаться; проверка `DIRECT_URL` в релизном шаге |
| Нет `DIRECT_URL` | `env()` бросает ошибку | команда не стартует (ожидаемо) |
| Расхождение `APP_ENV` и маркера | после миграции | приложение не стартует (INV-24) |
| `seed:dev` в prod | любая попытка | отказ ([`seed_data_spec.md`](../03_data_model/seed_data_spec.md) §5) |

## 11. Границы для владельца: перенос данных из действующего приложения

Документ **не описывает** перенос данных (реализует владелец самостоятельно). Чтобы он был совместим с проектом:

| Условие | Источник |
|---------|----------|
| Целевая схема и ограничения — [`database_schema_v1.md`](../03_data_model/database_schema_v1.md); импорт не меняет схему вне миграций | §6–§7 |
| Перенесённые дети без согласия — статус `LEGACY_PENDING`, срок — [ADR-011](../07_governance/adr_011_transitional_child_consent.md) | ADR-011 |
| Импорт выполняется на копии/ветке Neon, затем на prod-проекте; реальные данные детей **не попадают** в dev и репозиторий | спец. §15 ОК-4, ОК-6 |
| Журнал изменений и журнал кирпичиков — только добавление; импорт не правит их задним числом | R-6 |
| Баллы за старые выдачи достижений задним числом не начисляются | спец. §13 |
| Оценки за стихи: поле i урока N → стих i урока N−1 (принято 2026-10-11) | спец. 12.2 п. 15 |

## 12. Security paths

| Путь | Требование |
|------|------------|
| S-1 | Секреты (`DIRECT_URL`, `DATABASE_URL`) — только в server env и менеджере секретов CI; не в git и не в логах |
| S-2 | Релиз prod — только из CI/CD по чек-листу; прод-URL не хранится у разработчиков |
| S-3 | Миграции в sensitive zone (`packages/db/**`, `**/migrations/**`) — отдельный CU с `reviewer` |
| S-4 | Роль БД приложения без прав на `UPDATE`/`DELETE` журналов (кроме процедур) |
| S-5 | Дамп prod не загружается в dev никогда (ОК-4) |

## 13. Concurrency & idempotency

| Сценарий | Защита |
|----------|--------|
| Два релиза одновременно | один релизный шаг на окружение (concurrency group в CI) |
| Две миграции от разных авторов | линейная история: перед merge — `migrate status` на актуальной ветке; конфликт имён решается пересозданием более поздней |
| Повторный `migrate deploy` | идемпотентен (применяет только pending) |
| Одновременные seed | `pg_advisory_lock` на **direct**-подключении ([`bible_seed_contract.md`](../../implementation/mvp/contracts/bible_seed_contract.md) §10) |

## 14. Drift & consistency

| Риск | Guard |
|------|-------|
| `schema.prisma` ≠ `database_schema_v1.md` | правка документа и схемы в одном CU; review |
| Ручной SQL не отражён в схеме Prisma | перечень в §7; тест миграций на копии |
| `directUrl` из примеров v6 | запрещён в v7; `datasource.url` = direct |
| Session-level advisory lock в приложении | запрещено; `pg_advisory_xact_lock` |

## 15. Acceptance criteria

- [ ] Миграции применяются на пустой ветке Neon без ошибок; `migrate status` чист — исход: прогон на ветке.
- [ ] Частичные индексы R-1, R-2 присутствуют — исход: запрос к каталогу БД.
- [ ] `migrate dev` и `seed:dev` отсутствуют в релизном шаге prod — исход: проверка CI.
- [ ] Роль приложения без `UPDATE`/`DELETE` над журналами — исход: тест БД.
- [ ] Окно восстановления Neon указано в тексте согласия (P07) — исход: ручная проверка.

## 16. Open questions

| ID | Вопрос | Предложение | Владелец | Блокирует |
|----|--------|-------------|----------|-----------|
| Q-01 | Поведение `migrate dev`/`migrate status`/shadow DB не сверено с документацией в этой сессии | Сверить по prisma.io на P5 (preflight) | architect | P5 |
| Q-02 | ✔ **Решено 2026-10-19 (P07-CU8).** Окно восстановления Neon для prod | **1 календарный день** (платный тариф PITR); текст — `/privacy` v1, [`pre_production_checklist.md`](./pre_production_checklist.md) L-3 | владелец | — |
| Q-03 | Релизный шаг: GitHub Actions или Vercel build hook | GitHub Actions с protected environment для prod | architect | P07 |
| Q-04 | `prisma` как production-зависимость при деплое на Vercel | проверить на P5 | architect | P5 |

## 17. Related documents

| Document | Relationship |
|----------|--------------|
| [`neon_prisma_migrations_guide.md`](../../implementation/mvp/guides/neon_prisma_migrations_guide.md) | Команды и настройка |
| [`vercel_deploy_guide.md`](../../implementation/mvp/guides/vercel_deploy_guide.md) | Релиз приложения |
| [`adr_011_transitional_child_consent.md`](../07_governance/adr_011_transitional_child_consent.md) | Переходный период |
| [`pre_production_checklist.md`](./pre_production_checklist.md) | Закрытие P07: юр. сроки, лицензия, security, откат |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W12-02

## 18. Agent notes

- Не запускать `migrate dev` и `seed:dev` против prod; не хранить прод-URL локально.
- Не использовать `directUrl` и `url` в `schema.prisma` (v7).
- Не править БД вручную мимо миграций; откат — forward-only.
- Не описывать и не реализовывать перенос данных из старого приложения (вне проекта).

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W12-02); перенос данных исключён по решению владельца |
