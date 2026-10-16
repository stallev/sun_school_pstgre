# ADR-001 — Стек, хостинг и окружения Sunday School

**Тип:** ADR  
**Статус:** ACCEPTED  
**Версия:** 1.0  
**Дата:** 2026-10-10  
**Волна:** W1-F1  
**Зависит от:** [`project-context.mdc`](../../../.cursor/rules/project-context.mdc), [`project_quality_profile.md`](../../meta/project_quality_profile.md), [`mvp_scope.md`](../../my_specs/mvp_scope.md), [`sunday_school_data_analytics_spec.md`](../../my_specs/sunday_school_data_analytics_spec.md) §11, §15  
**Связанные документы:** [`adr_002_nextjs_vercel_runtime_policy.md`](./adr_002_nextjs_vercel_runtime_policy.md), [`architecture_master_index.md`](../architecture_master_index.md), [`ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Проверено по:** next@16.4.0 (docs `proxy`, `cacheComponents`, `partialPrefetching`) — официальная документация nextjs.org через WebFetch, 2026-10-10; next-auth@beta (Auth.js v5, `NextAuth()` → `handlers, auth, signIn, signOut`) — authjs.dev, 2026-10-10; Prisma ORM v7 (`datasource.url` в `prisma.config.ts`, адаптер обязателен) — prisma.io, 2026-10-10; Neon pooled / direct URL — prisma.io (страница v6, правило сохраняется, см. Q-01). Context7 в сессии недоступен.

---

## 1. Purpose

Зафиксировать стек, хостинг, границы монорепо и два окружения (`dev`, `prod`) для приложения воскресной школы, чтобы агенты не угадывали архитектуру и не копировали решения референса Pulse. Читают: агенты и разработчик перед любым документом W2–W9 и перед P5 (scaffold).

## 2. Scope / Out of scope

**В scope:** web-контур, БД, auth-провайдеры, наблюдаемость, i18n, модули по профилю, окружения, структура монорепо.  
**Вне scope:** детали Next.js runtime — [ADR-002](./adr_002_nextjs_vercel_runtime_policy.md); модель авторизации — ADR-003 (W4-01); схема БД — [`database_schema_v1.md`](../03_data_model/database_schema_v1.md); фоновые задачи, email, S3 — выключены профилем.

## 3. Decision

### 3.1 Web-контур и данные

| Компонент | Выбор | Примечание |
|-----------|-------|------------|
| Framework | **Next.js 16.4.x**, App Router, TypeScript | exact pin, без caret; детали — ADR-002 |
| Hosting | **Vercel** | preview на PR; один production-проект |
| ORM | **Prisma v7** | `datasource.url` — в `prisma.config.ts`; `PrismaClient` создаётся только с driver adapter |
| База данных | **Neon PostgreSQL 17** (dev-проект фактически на 18.6 — Q-05) | pooled `DATABASE_URL` (приложение), direct `DIRECT_URL` (миграции) |
| UI | shadcn/ui на **Base UI** (`@base-ui/react`, `components.json` style `base-vega`) + Tailwind CSS v4, токены Slate Cobalt | токены — UX-03 (W2); Radix как слой примитивов не используется; проверено в P6 |
| Toasts | Sonner | |
| Auth | **Auth.js v5** (`next-auth@beta`), JWT-сессии | провайдеры: Telegram (custom OIDC) и Credentials (email + пароль — только администратор, ADR-003 v1.1); Google не используется |
| i18n | ru / en, срезы словарей | ADR-008 (W4-06) |
| Observability | **Sentry** (`@sentry/nextjs`) | модуль `sentry` включён профилем |

### 3.2 Монорепо

```
apps/web                 — Next.js (тонкий BFF)
packages/domain          — чистые правила, enum-ы, DTO (без Next/DB)
packages/policy/edge     — JWT-only проверки для proxy.ts
packages/policy/server   — проверки с обращением к БД
packages/db              — Prisma schema, миграции, seed-скрипты (единственное DDL)
```

Scope пакетов — `@sunschool/*`. `apps/workers` не создаётся (post-MVP). Правила импорта — [`monorepo_boundaries_contract.md`](../../implementation/mvp/contracts/monorepo_boundaries_contract.md) (W8-01).

### 3.3 Модули по профилю качества

| Модуль | Состояние | Следствие |
|--------|-----------|-----------|
| `auth` | включён | Telegram + Credentials администратора, роли `admin`, `teacher` в JWT |
| `design_lab` | включён | `/design-system`, W15 |
| `sentry` | включён | `@sentry/nextjs` на P5 |
| `i18n` | включён | словари `common`, `auth`, `teacher`, `admin`, `analytics` |
| `ios_safari_transport` | включён | правило `ios-safari-mutation-transport` |
| `s3_uploads` | **выключен** | голосовые записи — post-MVP; ADR-007 не создаётся |
| `email_jobs` | **выключен** | Resend, cron, `delivery_log` — post-MVP; ADR-006 не создаётся |

### 3.4 Окружения (спец. §15)

Окружений ровно два; staging не нужен (ОК-8).

| | `dev` | `prod` |
|---|---|---|
| Переменная | `APP_ENV=dev` | `APP_ENV=prod` |
| База | отдельный Neon-проект (решено: два проекта) | отдельный Neon-проект |
| Первый admin | `FIRST_ADMIN_EMAIL` (свой) | `FIRST_ADMIN_EMAIL` (свой) |
| Секреты, `AUTH_SECRET`, Telegram-бот, пароль администратора | свои | свои |
| Содержимое | схема + справочники + фейковые данные (`seed:dev`) | схема + справочники + первый admin |
| Переключатель роли «смотреть как» | есть | **нет в сборке** |

**Правила (MUST):**
1. Приложение при старте сверяет `APP_ENV` со строкой подключения и **падает**, если окружение не определено или не совпадает (ОК-1).
2. `seed:dev` отказывается работать при `APP_ENV != dev` или если строка подключения не отмечена как dev (ОК-4).
3. Миграции — одни для обоих окружений: сначала dev, потом prod; ручных правок схемы в prod нет (ОК-6).
4. Реальные данные из prod в dev не попадают никогда (ОК-4).
5. Секреты — только server env; в `NEXT_PUBLIC_*` не попадает ничего секретного (security floor).

## 4. Paths (H / N / S)

| Путь | Описание | Ожидаемый исход |
|------|----------|-----------------|
| **H** | Агент создаёт scaffold по этому ADR | `apps/web` + `packages/*` с указанными пинами; `npm run typecheck` проходит |
| **N** | `APP_ENV` не задан или не совпадает с БД | процесс завершается с понятной ошибкой до обработки запросов |
| **N** | В `seed:dev` передан prod-URL | команда отказывается, ничего не пишет |
| **S** | Секрет попал в клиентский бандл или в `NEXT_PUBLIC_*` | запрещено; проверка в review и CI (`security-xss-csrf`) |
| **S** | `policy/server` импортирован в `proxy.ts` | запрещено (ADR-002 §3) |

Concurrency: нет (решение на уровне стека). Drift: версии из §3.1 — единственный источник; изменение — только через amend этого ADR.

## 5. Rejected alternatives

| Альтернатива | Почему отклонена |
|--------------|------------------|
| Credentials для всех пользователей | Решение владельца 2026-10-16: пароль только у администратора (ADR-003 v1.1), у остальных — Telegram; Google отклонён |
| `@auth/prisma-adapter` | В схеме нет Account/Session-таблиц Auth.js; JWT-сессии; привязка провайдеров — собственная таблица способов входа (ADR-003) |
| Одна БД на dev и prod | Нарушает ОК-1 (разные базы, секреты, провайдеры) |
| Staging-окружение | ОК-8: нет пользователей и команды, не нужно |
| `apps/workers` / Vercel Cron в MVP | Нет фоновых задач и email в MVP; `email_jobs` выключен |
| Netlify / иной хостинг | Vercel — решение проекта; шаблон и guidelines рассчитаны на него |

## 6. Consequences

- Документы W2–W9 и scaffold P5 используют версии и границы отсюда; отклонения — через ADR amend.
- Guidelines, написанные под Credentials (`ai_auth_implementation_guide.md`), требуют адаптации в P4 / W4-01.
- `packages/db` владеет миграциями и seed-скриптами, включая загрузку Библии (см. [`Bible/README.md`](../../my_specs/Bible/README.md)).

## 7. Acceptance criteria

- [ ] Все компоненты §3.1 имеют пин или правило пина; в `package.json` нет `^` у `next` — исход: `npm run deps:check` проходит.
- [ ] §3.3 совпадает с `project_quality_profile.md` — исход: расхождений нет.
- [ ] Правила §3.4 повторены в [`seed_data_spec`](../03_data_model/seed_data_spec.md) (W6-03) и `local_dev_setup` (W12-05) ссылками, не копиями.
- [ ] ADR-002 не противоречит §3.1 — исход: версия и runtime совпадают.

## 8. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| Q-01 | ~~Какой driver adapter для Neon в Prisma 7~~ — **решено 2026-10-11 (P5):** `@prisma/adapter-pg` с pooled `DATABASE_URL`; по документации Prisma (PostgreSQL, Neon: CLI — `DIRECT_URL`, runtime — pooled URL); `migrate dev`, shadow database и приложение проверены на dev-ветке Neon | architect | — |
| Q-02 | ~~Точный patch-пин Next.js 16.4.x~~ — **решено 2026-10-11 (P5): `next@16.4.0`** (`npm view next version` = 16.4.0) | исполнитель P5 | — |
| Q-05 | Версия PostgreSQL: документ фиксирует PG 17, а dev-проект Neon создан на **PG 18.6** (`show server_version`, 2026-10-11). Схема и миграции совместимы; оставить PG 18 для dev и prod (одна версия на оба проекта) или создать проекты на 17 | владелец | P07 (prod-проект) |
| Q-03 | ~~Один или два Neon-проекта~~ — **решено 2026-10-10: два** (отдельные проекты dev и prod; спец. 12.2 п. 34) | владелец | — |
| Q-04 | ~~Первый admin по email из env~~ — **решено 2026-10-10**: email в переменной `FIRST_ADMIN_EMAIL` (значение — только в локальном, не коммитимом конфиге и в env Vercel); первый вход с этим email создаёт активного admin один раз (спец. 12.2 п. 32, ОК-3) | владелец | — |

## 9. Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_002_nextjs_vercel_runtime_policy.md`](./adr_002_nextjs_vercel_runtime_policy.md) | Runtime-политика Next.js |
| [`architecture_master_index.md`](../architecture_master_index.md) | Карта документов |
| [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) | Схема БД |
| [`telegram_authjs_oidc_portable_guide.md`](../../my_specs/telegram_authjs_oidc_portable_guide.md) | Вход через Telegram |
| [`adr_003_auth_oidc_jwt_rbac.md`](./adr_003_auth_oidc_jwt_rbac.md) | Модель auth и ролей (W4-01) |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W1-F1

## 10. Agent notes

- Не добавлять Credentials-провайдер, `@auth/prisma-adapter`, Resend, S3, `apps/workers` без amend ADR.
- Не импортировать `@sunschool/policy-server` в `proxy.ts`.
- Не создавать третье окружение; не использовать дамп prod как dev-данные.
- Версии не «обновлять по привычке»: пины меняются только через этот ADR.

## Change log

| Date | Change |
|------|--------|
| 2026-10-10 | v1.0 — ACCEPTED (W1-F1) |
