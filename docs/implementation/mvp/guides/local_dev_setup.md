# Local dev setup — локальная разработка Sunday School

**Тип:** Guide  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W12-05  
**Зависит от:** [`neon_prisma_migrations_guide.md`](./neon_prisma_migrations_guide.md), [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md), [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md), [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) §4, [`adr_001_stack_and_runtime.md`](../../../prds/07_governance/adr_001_stack_and_runtime.md) §3.4  
**Связанные документы:** [`global_shell_spec.md`](../specs/global_shell_spec.md) §8, [`telegram_authjs_oidc_portable_guide.md`](../../../my_specs/telegram_authjs_oidc_portable_guide.md), [`vercel_deploy_guide.md`](./vercel_deploy_guide.md), [`P01_tasks.md`](../tasks/P01_tasks.md), [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** `package.json` репозитория (scripts: `rules:sync`, `rules:check`, `deps:check`, `encoding:check`, `docs:links`, `psi:lab`; `engines.node: 24.x`) — на дату документа. Скрипты `dev`, `build`, `typecheck`, `lint`, `test`, `db:generate`, `db:migrate:*` созданы на P5 (2026-10-11) и проверены; `db:seed:*` — целевые (P01/P03). Единый `.env` в корне читают Prisma CLI (`prisma.config.ts`) и `apps/web` (`next.config.ts`, `@next/env`). Telegram OIDC: HTTPS-origin обязателен, `http://localhost` Telegram часто отклоняет — по гайду владельца (§2). Neon/Prisma — [`neon_prisma_migrations_guide.md`](./neon_prisma_migrations_guide.md). Context7 недоступен.

---

## 1. Purpose

Пошаговая локальная настройка: от клона репозитория до работающего приложения с данными прототипа и входом. Читают: разработчик, агент P5/P01+.

## 2. Scope / Out of scope

**В scope:** предпосылки, переменные окружения, миграции и seed, запуск, smoke входа, частые ошибки, безопасность.  
**Вне scope:** деплой ([`vercel_deploy_guide.md`](./vercel_deploy_guide.md)); перенос данных из действующего приложения (реализует владелец); Design Lab — [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md).

## 3. Предпосылки

| Что | Требование |
|-----|------------|
| Node.js | **24.x** (`engines` в корневом `package.json`) |
| npm | версия из Node 24; установка — `npm ci` (lockfile) |
| Git | ветка `bootstrap`/рабочая; hooks (husky: commitlint, `rules:check`, lint-staged) ставятся при `npm install` |
| Neon | доступ к проекту **dev**; своя ветка разработчика (по желанию) |
| Telegram | бот dev (BotFather → Web Login → OIDC), **HTTPS**-origin (туннель или стабильный preview), redirect `{origin}/api/auth/callback/telegram` |
| Файлы данных Библии | RST в репозитории; NIV — локально, не в git (`Bible/data/.../niv`) |

## 4. Первый запуск

> Шаги 5–9 — **после** bootstrap P5/P01; до этого доступны только проверки документации (`docs:links`, `rules:check`).

| # | Шаг | Команда / действие | Ожидаемо |
|---|-----|--------------------|----------|
| 1 | Клонировать | `git clone` → `cd` | рабочее дерево |
| 2 | Установить | `npm ci` (корень) | зависимости по lockfile, `deps:check` проходит |
| 3 | Секреты | создать `.local/dev-secrets.json` (git-ignored) с `FIRST_ADMIN_EMAIL`; `apps/web/.env.local` из `.env.example` | файлы вне git |
| 4 | Neon dev | взять `DATABASE_URL` (pooled) и `DIRECT_URL` (direct) ветки | строки в `.env.local` |
| 5 | Миграции | `npm run db:migrate:deploy` | таблицы созданы, `migrate status` чист |
| 6 | Справочники | `npm run db:seed:reference` | организация, настройки, 66 книг, каталог; маркер `dev` |
| 6a | Первый admin | `npm run db:seed:admin` (email и пароль — из `.local/dev-secrets.json`: `FIRST_ADMIN_EMAIL`, `ADMIN_PASSWORD`) | admin `ACTIVE`; вход по email и паролю |
| 7 | Библия | `npm run db:seed:bible` (RST); `npm run db:seed:bible:niv` — при наличии локальных данных | перевод `READY` после сверки |
| 8 | Фикстуры | `npm run db:seed:dev` | данные прототипа (вымышленные) |
| 9 | Запуск | `npm run dev` | приложение на `http://localhost:3000` |

## 5. Канонические npm-скрипты

| Скрипт | Где | Назначение | Статус |
|--------|-----|------------|--------|
| `rules:sync`, `rules:check` | корень | зеркало правил `.claude/rules` | есть |
| `deps:check` | корень | точные версии зависимостей | есть |
| `encoding:check`, `docs:links` | корень | проверки документации | есть |
| `psi:lab` | корень | PageSpeed lab (только по запросу, на деплое) | есть |
| `dev` | корень → `apps/web` | dev-сервер | есть |
| `build` | корень → `apps/web` | `prisma generate`, затем `next build` | есть |
| `typecheck`, `lint`, `test` | корень | проверки (все workspaces) | есть |
| `db:generate` | `@sunschool/db` | `prisma generate` (клиент в `src/generated`, вне git) | есть |
| `db:migrate:dev` | `@sunschool/db` | `prisma migrate dev` (только local) | есть |
| `db:migrate:deploy` | `@sunschool/db` | `prisma migrate deploy` | есть |
| `db:migrate:status` | `@sunschool/db` | `prisma migrate status` | есть |
| `db:seed:reference` | `@sunschool/db` | справочники (dev, prod) | P01 ✔ |
| `db:seed:admin` | `@sunschool/db` | первый admin: email + пароль (dev, prod; `--reset-password`) | P01 |
| `db:seed:bible`, `db:seed:bible:niv` | `@sunschool/db` | Библия (NIV — по лицензии) | P03 |
| `db:seed:dev` | `@sunschool/db` | фикстуры (**только dev**) | P01–P05 |

Корневые `db:*` — алиасы на workspace (`npm run db:… -w @sunschool/db`).

## 6. Переменные окружения

Значения — только в `.env.local` / `.local`; в репозитории — `.env.example` с пустыми значениями.

| Переменная | Назначение | Где берётся | Обязательна | Модуль |
|------------|------------|-------------|:-----------:|--------|
| `APP_ENV` | `dev` / `prod`, сверяется с маркером БД | `dev` локально | ✔ | core |
| `DATABASE_URL` | pooled, приложение | Neon dev | ✔ | core |
| `DIRECT_URL` | direct, CLI и seed | Neon dev | ✔ | core |
| `AUTH_SECRET` | подпись JWT/cookie | `openssl rand -base64 32` | ✔ | auth |
| `AUTH_TELEGRAM_ID`, `AUTH_TELEGRAM_SECRET` | Telegram OIDC (scope `openid profile phone`) | BotFather Web Login | ✔ | auth |
| `AUTH_TRUST_HOST` / `AUTH_URL` | origin за прокси/туннелем | значение туннеля | при туннеле | auth |
| `FIRST_ADMIN_EMAIL`, `ADMIN_PASSWORD` | первый admin — **только для `db:seed:admin`**, приложение не читает | `.local/dev-secrets.json` (git-ignored) | ✔ | auth |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` | Sentry | проект Sentry (dev) | нет | sentry |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | upload source maps (сборка) | Sentry | нет в dev | sentry |

`TELEGRAM_BOT_TOKEN` как `clientSecret` **не используется** ([`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) §4.2). Выключены модули `s3_uploads`, `email_jobs` — переменных нет. `NEXT_PUBLIC_*` — только публичные значения.

## 7. Вход в dev

| Способ | Как |
|--------|-----|
| Email + пароль (admin) | форма «Вход для администратора» на `localhost` после `db:seed:admin` |
| Telegram | запуск через HTTPS-туннель; в BotFather зарегистрировать origin и redirect; `AUTH_URL` = origin туннеля |
| «Смотреть как» | dev-переключатель роли ([`global_shell_spec.md`](../specs/global_shell_spec.md) §8): показывает NAV роли; **не повышает** серверные права; нет в prod |
| Фикстуры | вымышленные пользователи `@example.test` из `seed:dev` |

## 8. Проверки перед коммитом

| Проверка | Команда |
|----------|---------|
| Типы | `npm run typecheck` |
| Линт (в т.ч. boundaries) | `npm run lint` |
| Тесты | `npm run test` |
| Зависимости | `npm run deps:check` (при изменении `package.json`) |
| Правила | `npm run rules:check` (при изменении `.mdc`) |
| Документация | `npm run docs:links`, `npm run encoding:check` |

## 9. Happy path smoke

1. После шага 9: `/login` открывается; вход через Telegram ведёт на `/register` (новый пользователь); администратор входит по email и паролю → экран согласия → `/school`.
2. Admin открывает `/year`, `/groups` (после P02) с данными фикстур.
3. «Смотреть как teacher» показывает NAV teacher.
4. `/design-system` открывается в dev (после P6) и даёт 404 при `APP_ENV=prod`.

## 10. Negative paths

| Симптом | Причина | Решение |
|---------|---------|---------|
| Приложение не стартует: окружение не совпало | `APP_ENV` ≠ маркер БД | проверить `.env.local`; не править маркер вручную |
| `/login?error=Configuration` (Telegram) | нет `userinfo_endpoint` / не сработал обход | проверить `customFetch` из `next-auth` ([`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) §6) |
| `state too long` у Telegram | не сработала обёртка route handler | проверить TG-2 |
| Telegram отклоняет `http://localhost` | нужен HTTPS | туннель/preview |
| `OAuthAccountNotLinked` | идентичность у другого пользователя | ожидаемо; слияние — admin |
| `Missing required environment variable` | не загружен `.env` | см. [`neon_prisma_migrations_guide.md`](./neon_prisma_migrations_guide.md) §8 |
| Seed падает на lock | выполнен через pooled | использовать `DIRECT_URL` |
| `db:seed:dev` отказал | `APP_ENV`/маркер ≠ dev | это защита (INV-24) |

## 11. Security paths

| Путь | Требование |
|------|------------|
| S-1 | `.env*`, `.local/` вне git; в документах — имена, не значения |
| S-2 | Реальные данные детей в dev не загружаются; дамп prod в dev — никогда (ОК-4) |
| S-3 | Секреты dev и prod различны (`AUTH_SECRET`, Telegram-бот, пароль администратора) (ОК-1) |
| S-4 | Dev-переключатель не используется как доказательство прав |

## 12. Acceptance criteria

- [ ] По §4 разработчик получает работающее приложение с фикстурами — исход: ручной прогон.
- [ ] Все скрипты §5 существуют после P5/P01 с указанными именами — исход: сверка `package.json`.
- [ ] Вход через Telegram и по email + паролю проходит в dev — исход: smoke P01.
- [ ] В репозитории нет значений секретов — исход: поиск по `AUTH_`/`postgresql://`.

## 13. Open questions

| ID | Вопрос | Предложение | Блокирует |
|----|--------|-------------|-----------|
| Q-01 | Порт и способ HTTPS-туннеля для Telegram (инструмент) | Выбрать на P01; зафиксировать в этом документе | P01 |
| Q-02 | ~~Единый `.env.example` в корне или в `apps/web`~~ — **решено 2026-10-11:** один `.env` и один `.env.example` в корне (читают CLI и приложение) | — | — |
| Q-03 | Контейнер Postgres для тестов DAL (локально) | Да, `docker compose` (опционально) | P5 |

## 14. Related documents

| Document | Relationship |
|----------|--------------|
| [`neon_prisma_migrations_guide.md`](./neon_prisma_migrations_guide.md) | БД и миграции |
| [`vercel_deploy_guide.md`](./vercel_deploy_guide.md) | Деплой |
| [`P01_tasks.md`](../tasks/P01_tasks.md) | Первая фаза |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W12-05

## 15. Agent notes

- Не запускать `db:seed:dev` и `migrate dev` против prod.
- Не коммитить `.env*`, `.local/`, NIV и любые реальные данные.
- Не использовать `TELEGRAM_BOT_TOKEN` как OIDC-секрет.
- Не добавлять скрипты вне таблицы §5 без правки этого документа.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W12-05) |
