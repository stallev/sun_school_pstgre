# Neon + Prisma migrations guide

**Тип:** Guide  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W12-07  
**Зависит от:** [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md), [`adr_001_stack_and_runtime.md`](../../../prds/07_governance/adr_001_stack_and_runtime.md) §3.4, [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) §4–§5, [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md)  
**Связанные документы:** [`local_dev_setup.md`](./local_dev_setup.md), [`vercel_deploy_guide.md`](./vercel_deploy_guide.md), [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md), [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** Neon — neon.com через WebFetch, 2026-10-11: проект и ветка — copy-on-write, каждая ветка имеет свои вычислительные ресурсы; pooled-подключение (`-pooler`, PgBouncer transaction mode) — для serverless/веб-приложений, direct — для миграций и `pg_dump`; при pooled не поддерживаются `SET`, `LISTEN/NOTIFY`, SQL-level `PREPARE`, session-level advisory locks; окно восстановления настраивается (по умолчанию 6 часов Free / 1 сутки платные). Prisma ORM — prisma.io через WebFetch, 2026-10-11: `prisma.config.ts` (`datasource.url` обязателен, `directUrl` в v7 удалён, `migrations.seed`), `migrate deploy` — для CI/CD. **Команды `migrate dev` / `migrate status` и shadow database проверены на dev-ветке Neon (P5, 2026-10-11):** `migrate dev --create-only`, применение, `migrate status` — «Database schema is up to date»; shadow DB создаётся на Neon без отдельной настройки. Driver adapter — `@prisma/adapter-pg` (клиент `prisma-client`, вывод в `packages/db/src/generated/prisma`, вне git; `db:generate` обязателен после установки и в CI). Context7 недоступен.

---

## 1. Purpose

Практическое руководство: как поднять Neon-проекты, подключить Prisma v7, создавать и применять миграции, запускать seed и не перепутать окружения. Читают: разработчик и агент P5/P01+, владелец при релизе. Правила и политика отката — [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md); здесь — «как».

## 2. Scope / Out of scope

**В scope:** проекты и ветки Neon, строки подключения, раскладка `packages/db`, команды, ошибки.  
**Вне scope:** перенос данных из действующего приложения (реализует владелец); Vercel ([`vercel_deploy_guide.md`](./vercel_deploy_guide.md)); содержимое схемы.

## 3. Проекты и ветки Neon

| Что | Решение | Источник |
|-----|---------|----------|
| Проекты | **два**: `dev` и `prod` (разные строки подключения, пользователи, секреты) | ADR-001 §3.4, ОК-1 |
| Регион | один, близкий к Vercel-функциям и пользователям; одинаковый для dev и prod | ADR-001 |
| Ветки внутри проекта | `main` — рабочая; временные — для репетиций миграций и тестов; **не** замена разделения dev/prod | runbook §5 |
| Postgres | 17 | ADR-001 |
| Окно восстановления | prod: не менее 1 суток (платный тариф), значение — владелец; указывается в тексте согласия | runbook §9, УД-11 |

## 4. Строки подключения

| Переменная | Тип | Где используется | Хранение |
|------------|-----|------------------|----------|
| `DATABASE_URL` | pooled (`-pooler`) | приложение (runtime) через `@prisma/adapter-pg` | Vercel env; локально `.env.local` |
| `DIRECT_URL` | direct (без `-pooler`) | Prisma CLI (`migrate`, `db seed`), seed-скрипты, `pg_dump` | CI secrets; локально `.env.local` |

Правила:

1. Переменные **не** попадают в git; шаблон — `.env.example` без значений.
2. `prisma.config.ts` берёт `datasource.url` из `DIRECT_URL` ([`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md) §4).
3. Приложение использует **только** `DATABASE_URL` через адаптер; `DIRECT_URL` на сервере приложения (Vercel runtime) не нужен.
4. Прод-`DIRECT_URL` — только в секретах релизного шага (CI/CD); не у разработчиков.
5. Маркер окружения — `app_setting.db_environment` — защищает от неверно подставленной строки ([`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) §5).

## 5. Раскладка `packages/db`

```
packages/db/
  prisma.config.ts           # CLI-конфиг (url = DIRECT_URL, migrations, seed)
  prisma/
    schema.prisma            # без url/directUrl (v7)
    migrations/              # *_name/migration.sql (в git)
  src/
    client.ts                # фабрика PrismaClient + adapter-pg + проверка маркера
    audit/write-audit.ts
  seed/
    reference/ bible/ dev/   # seed_data_spec §3
```

Один пакет владеет DDL (monorepo_boundaries §3); приложение импортирует клиент из `@sunschool/db`.

## 6. Команды

Имена npm-скриптов — канон [`local_dev_setup.md`](./local_dev_setup.md) §5; ниже — что они вызывают.

| Задача | Команда (из `packages/db`) | Окружение | Результат |
|--------|----------------------------|-----------|-----------|
| Сгенерировать клиент | `prisma generate` | любое | типы клиента актуальны |
| Создать миграцию | `prisma migrate dev --name <snake_case>` *(по референсу)* | **только local dev** | новая папка в `migrations/`, применена к dev |
| Статус | `prisma migrate status` *(по референсу)* | любое | список pending |
| Применить | `prisma migrate deploy` | CI, preview-dev, **prod релизным шагом** | pending применены |
| Seed справочников | `db:seed:reference` | dev, prod | см. seed_data_spec |
| Seed Библии | `db:seed:bible`, `db:seed:bible:niv` | dev, prod (NIV — по лицензии) | счётчики сверены |
| Seed фикстур | `db:seed:dev` | **только dev** | данные прототипа |

Запрещено: `migrate dev` и `db:seed:dev` против prod; `migrate reset` где-либо кроме локального dev.

## 7. Happy path — новый разработчик

1. Доступ к Neon-проекту `dev`; получить `DIRECT_URL`/`DATABASE_URL` ветки разработчика.
2. Заполнить `.env.local` (шаблон `.env.example`).
3. `npm ci` (корень) → `prisma generate`.
4. `prisma migrate deploy` на пустой ветке (применяются существующие миграции).
5. `db:seed:reference` → `db:seed:bible` → `db:seed:dev`.
6. `npm run dev`; приложение стартует (маркер `dev` совпал).

## 8. Negative paths

| Симптом | Причина | Решение |
|---------|---------|---------|
| `Missing required environment variable: DIRECT_URL` | не загружен `.env` (Node не читает сам) или не задана переменная | `dotenv/config` в `prisma.config.ts` либо `--env-file`; проверить имя |
| Команда миграции зависает / падает на pooled | в `DIRECT_URL` указан хост с `-pooler` | использовать direct-хост |
| `prisma generate` падает в CI из-за `env()` | `env()` бросает при отсутствии переменной | в конфиге для `generate` читать `process.env` |
| Приложение не стартует: «окружение не совпало» | `APP_ENV` ≠ `app_setting.db_environment` | проверить строку подключения и env; не править маркер вручную |
| Ошибка seed «advisory lock» на pooled | session-level lock не поддерживается pooler | seed — только через `DIRECT_URL` |
| Первое обращение медленное | cold start (scale-to-zero) | ожидаемо в dev; для prod — настройки автоприостановки (владелец) |
| Дрифт схемы | ручные правки БД | исправляющая миграция; не править вручную |

## 9. Security paths

| Путь | Требование |
|------|------------|
| S-1 | Секреты — только env/секреты CI; в логах и документах — только имена переменных |
| S-2 | Роль приложения без `UPDATE`/`DELETE` на журналах; процедуры БД — отдельно (P06) |
| S-3 | Prod-доступ к БД — только релизный шаг и владелец; нет локальных прод-URL |
| S-4 | Реальные данные детей в dev/ветки dev не загружаются (ОК-4) |

## 10. Concurrency notes

| Сценарий | Правило |
|----------|---------|
| Два seed одновременно | `pg_advisory_lock` на direct-подключении (bible_seed §10) |
| Приложение: блокировка ученика/остатка | `SELECT … FOR UPDATE` внутри транзакции и `pg_advisory_xact_lock` (работают в transaction pooling) |
| Два релиза | один релизный шаг на окружение (CI concurrency) |

## 11. CI-фрагмент (ссылка)

Шаблон — `scaffold/.github/workflows/ci.template.yml` (jobs своего уровня профиля). Для БД-тестов — временная ветка Neon либо контейнер Postgres; способ фиксируется в `local_dev_setup` и CU P5 («DAL-тесты»). Релизный шаг prod — отдельный workflow с protected environment ([`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md) Q-03).

## 12. Acceptance criteria

- [ ] Новый разработчик по §7 получает рабочее приложение на dev — исход: ручной прогон.
- [ ] `prisma.config.ts` использует `DIRECT_URL`; `schema.prisma` без `url` — исход: проверка файлов.
- [ ] Приложение использует pooled через адаптер — исход: проверка `client.ts`.
- [ ] В репозитории нет строк подключения — исход: поиск по `postgresql://`.
- [ ] Команды §6 подтверждены на P5/P01 — исход: чек-лист CU DoD.

## 13. Open questions

| ID | Вопрос | Предложение | Блокирует |
|----|--------|-------------|-----------|
| Q-01 | ~~Сверить `migrate dev`, `migrate status`, shadow DB~~ — **решено 2026-10-11** (см. «Проверено по») | — | — |
| Q-02 | Тестовая БД для DAL: ветка Neon или контейнер Postgres | Контейнер Postgres в CI (быстрее, без секретов), ветка Neon — для репетиций | P5 |
| Q-03 | Автоприостановка compute prod | По решению владельца (стоимость vs cold start) | P07 |

## 14. Related documents

| Document | Relationship |
|----------|--------------|
| [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md) | Политика и матрица |
| [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) | Seed и маркер |
| [`local_dev_setup.md`](./local_dev_setup.md) | Локальная работа |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W12-07

## 15. Agent notes

- Не использовать `directUrl` и `url` в `schema.prisma` (v7).
- Не запускать миграции и seed:dev против prod; не хранить прод-URL.
- Не использовать session-level advisory locks на pooled-подключении.
- Не придумывать флаги Prisma: только подтверждённые документацией.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W12-07) |
