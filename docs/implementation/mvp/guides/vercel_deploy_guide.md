# Vercel deploy guide — развёртывание Sunday School

**Тип:** Guide  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W12-06  
**Зависит от:** [`adr_001_stack_and_runtime.md`](../../../prds/07_governance/adr_001_stack_and_runtime.md) §3.1–§3.4, [`adr_002_nextjs_vercel_runtime_policy.md`](../../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md), [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) §4, §9, [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md), [`local_dev_setup.md`](./local_dev_setup.md) §6  
**Связанные документы:** [`neon_prisma_migrations_guide.md`](./neon_prisma_migrations_guide.md), [`P07_tasks.md`](../tasks/P07_tasks.md), [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md), [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** Vercel — vercel.com/docs через WebFetch, 2026-10-11: монорепо — для каждой директории создаётся отдельный проект, **Root Directory** задаётся на проект; проект на GitHub пропускает сборку, если его код, внутренние зависимости или lockfile не менялись (workspaces npm/yarn/pnpm/Bun, уникальные `name` пакетов); команда установки может быть задана в `vercel.json` (`installCommand`); переменные окружения — области **Production**, **Preview** (можно по ветке), **Development**; значения бывают **Config** или **Secret** (secret write-only после сохранения); изменение переменной действует только на **новые** деплои; лимит 64 KB на деплой; `vercel env pull` создаёт `.env` из Development. **Не сверено:** включение файлов вне Root Directory при `apps/web` как корне, версия Node на проекте (`engines.node` по ADR-001 §3.1), точные поля `vercel.json` для заголовков/CSP — подтверждаются на P5/P07 (Q-01…Q-03). Context7 недоступен.

---

## 1. Purpose

Как развернуть приложение на Vercel: настройки проекта, переменные окружения, домены и callback-адреса провайдеров входа, порядок релиза и откат. Читают: исполнитель P5/P07, владелец.

## 2. Scope / Out of scope

**В scope:** проект Vercel, env-матрица, домены, провайдеры входа, релиз, preview vs production, smoke.  
**Вне scope:** содержимое миграций ([`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md)); перенос данных из действующего приложения (реализует владелец); cron и workers (в MVP нет — INV-25); S3 и email (модули выключены).

## 3. Проект и сборка

| Параметр | Значение | Примечание |
|----------|----------|------------|
| Репозиторий | GitHub, одна основная ветка production | Preview — на каждую ветку/PR |
| Проектов Vercel | **один** (`apps/web`) | `workers` нет |
| Root Directory | `apps/web` **или** корень монорепо — решается на P5 (Q-01) | нужны файлы `packages/*` вне `apps/web`; проверить настройку включения файлов вне Root Directory |
| Node.js | **24.x** | `engines.node` (ADR-001 §3.1) |
| Install | `npm ci` | lockfile обязателен; Vercel определяет менеджер по lockfile |
| Build | скрипт `build` пакета `@sunschool/web`: `prisma generate` (`db:generate` в `@sunschool/db`), затем `next build` | клиент в `packages/db/src/generated/` вне git; `prisma` остаётся devDependency — Vercel ставит devDependencies на время сборки |
| Framework | Next.js 16.4.x (точная версия) | ADR-002 |
| `vercel.json` | `apps/web/vercel.json`: `installCommand` / `buildCommand` для монорепо; **без** `crons`; CSP nonce — `apps/web/src/proxy.ts`; baseline headers — `next.config.ts` `headers()` | |
| Skip unaffected builds | по умолчанию включено для GitHub | не отключать без причины |
| Функции | Node.js runtime; `proxy.ts` на nodejs | ADR-002 §3 |

## 4. Матрица переменных окружения

Значения — Secret (кроме отмеченных). Имена — [`local_dev_setup.md`](./local_dev_setup.md) §6.

| Переменная | Production | Preview | Development (локально) | Тип |
|------------|:----------:|:-------:|:----------------------:|-----|
| `APP_ENV` | `prod` | `dev` | `dev` | Config |
| `DATABASE_URL` | Neon **prod** pooled | Neon **dev** pooled | Neon dev | Secret |
| `DIRECT_URL` | Neon prod direct — **только релизный шаг CI** | Neon dev direct (CI) | Neon dev | Secret |
| `AUTH_SECRET` | уникальный prod | уникальный preview | dev | Secret |
| `AUTH_TELEGRAM_ID`, `AUTH_TELEGRAM_SECRET` | бот prod | **не задаётся** (Telegram на эфемерных preview не включается) | бот dev | Secret |
| `AUTH_TRUST_HOST` / `AUTH_URL` | `true` / `https://<prod-домен>` | `true` | по туннелю | Config |
| `FIRST_ADMIN_EMAIL` | email владельца | тестовый | `.local` | Secret |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` | prod DSN | preview DSN | — | Config |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | build | build | — | Secret |

Правила:

1. `DIRECT_URL` prod **не** хранится в проекте Vercel для рантайма; он доступен релизному шагу CI ([`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md) §8).
2. Preview использует **dev-проект Neon** (не prod): preview-деплой не должен касаться данных школы.
3. `NEXT_PUBLIC_*` — только публичные значения; секретов в них нет.
4. Изменение переменной действует **только на новые деплои** — после изменения нужен redeploy.
5. Суммарный размер переменных — ≤ 64 KB на деплой (запас большой).
6. `TELEGRAM_BOT_TOKEN` как OIDC-секрет не используется ([`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) §4.2).

## 5. Домены и провайдеры входа

| Провайдер | Что зарегистрировать | Prod | Preview |
|-----------|----------------------|------|---------|
| Telegram (BotFather Web Login) | Trusted Origin (HTTPS) и Redirect URI `https://<домен>/api/auth/callback/telegram` | prod-домен | **не включать**: эфемерные URL нестабильны |

Telegram требует заранее зарегистрированный HTTPS-origin ([`telegram guide`](../../../my_specs/telegram_authjs_oidc_portable_guide.md) §2). `callback` совпадает с `id` провайдера (`telegram`). Вход администратора по email и паролю внешней регистрации не требует; `FIRST_ADMIN_EMAIL` и `ADMIN_PASSWORD` в Vercel **не задаются** — их передаёт оператор команде `db:seed:admin` на время запуска.

## 6. Порядок релиза

| Шаг | Действие | Кто | Проверка |
|-----|----------|-----|----------|
| 1 | Merge в production-ветку | разработчик | CI зелёный (typecheck, lint, test) |
| 2 | `prisma migrate deploy` на prod-БД | релизный шаг CI (protected environment) | `migrate status` чист |
| 3 | Деплой приложения | Vercel (Git) | сборка зелёная |
| 4 | Проверка старта | автоматически | `APP_ENV` ↔ маркер БД совпали |
| 5 | Справочники и первый admin (первый релиз/при изменении) | оператор по [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md) §8 | `db:seed:reference` → `db:seed:bible` (RST; `db:seed:bible:niv` — по лицензии) → `db:seed:admin` |
| 6 | Smoke | оператор | §8 |

Порядок «миграции → деплой» (совместимость схемы); несовместимые изменения — expand/contract ([`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md) §8).

## 7. Откат

| Ситуация | Действие |
|----------|----------|
| Плохой деплой, схема совместима | откат деплоя (Promote предыдущего) на Vercel |
| Плохая миграция | исправляющая миграция вперёд; откат БД — только по окну Neon по решению владельца |
| Утечка секрета | ротация переменной, redeploy, отзыв в консоли провайдера; `AUTH_SECRET` — инвалидирует сессии |

## 8. Smoke после релиза

| Проверка | Ожидаемо |
|----------|----------|
| `/login` открывается по HTTPS | форма входа, без ошибок |
| Вход первого admin по email и паролю (после `db:seed:admin`) | `ACTIVE`, экран согласия, `/school` |
| Регистрация нового пользователя | `/pending`, заявка у admin |
| `/design-system` | 404 |
| Dev-переключатель роли | отсутствует |
| Заголовки безопасности, cookie `Secure/HttpOnly` | присутствуют |
| Sentry получает тестовое событие | без ПД |

## 9. Negative paths

| Случай | Исход |
|--------|-------|
| `APP_ENV` ≠ маркер БД | деплой стартует с ошибкой; приложение не обслуживает запросы |
| Не задан `AUTH_SECRET` | ошибка конфигурации Auth.js, вход недоступен |
| Redirect URI не совпал | отказ Telegram (redirect URI не совпал) |
| Preview без Telegram-секретов | кнопка Telegram скрыта/недоступна (по конфигурации) |
| Миграция упала в CI | деплой не выполняется (шаг 3 после шага 2) |

## 10. Security paths

| Путь | Требование |
|------|------------|
| S-1 | Секреты — Secret-тип Vercel; не в git, не в `NEXT_PUBLIC_*` |
| S-2 | Prod и dev не делят `AUTH_SECRET`, OAuth-приложения, БД (ОК-1) |
| S-3 | Preview не использует prod-БД и prod-секреты |
| S-4 | Релизный шаг prod — protected environment с ручным подтверждением |
| S-5 | CSP, cookie, заголовки — [`P07_tasks.md`](../tasks/P07_tasks.md) CU7 |

## 11. Concurrency notes

| Сценарий | Правило |
|----------|---------|
| Два релиза параллельно | один релизный шаг на окружение (concurrency group) |
| Деплой во время миграции | миграция завершается до деплоя (шаг 2 → 3) |
| Смена переменной | применяется к новым деплоям; старые остаются с прежними значениями |

## 12. Acceptance criteria

- [ ] Preview-деплой работает на dev-БД, prod-секреты недоступны — исход: проверка env.
- [x] Prod-деплой проходит smoke §8 — P07-T12, отчёт в [`P07_tasks.md`](../tasks/P07_tasks.md) CU9 (2026-10-19).
- [ ] Redirect URI Telegram совпадает с доменом; первый admin создан `db:seed:admin` и входит по паролю — исход: вход проходит.
- [ ] `DIRECT_URL` prod отсутствует в runtime-окружении Vercel — исход: проверка настроек.
- [ ] `vercel.json` не содержит `crons` — исход: grep.

## 13. Open questions

| ID | Вопрос | Предложение | Блокирует |
|----|--------|-------------|-----------|
| Q-01 | Root Directory: `apps/web` или корень монорепо; включение файлов вне Root Directory | Проверить на P5 по документации и фактической сборке; зафиксировать здесь | P5 |
| Q-02 | Где выполняется `prisma generate` | **Закрыт (2026-10-16):** в скрипте `build` `@sunschool/web`, до `next build`. `prisma` — devDependency `@sunschool/db`, не prod-зависимость | — |
| Q-03 | Поля `vercel.json` для заголовков/CSP | **Закрыт (P07-CU7):** `vercel.json` — только install/build; CSP в `proxy.ts`; baseline headers в `next.config.ts` | — |
| Q-04 | Домен prod и preview-хост | Выбор владельца | P07 |

## 14. Related documents

| Document | Relationship |
|----------|--------------|
| [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md) | Миграции и откат |
| [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) | Env и вход |
| [`P07_tasks.md`](../tasks/P07_tasks.md) | Prod-готовность |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W12-06

## 15. Agent notes

- Не подключать preview к prod-БД и не хранить `DIRECT_URL` prod в рантайме.
- Не включать Telegram на эфемерных preview.
- Не добавлять `crons` и `middleware.ts`.
- Не класть секреты в `NEXT_PUBLIC_*`.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W12-06) |
| 2026-10-16 | Q-02 закрыт: `prisma generate` в скрипте `build` `@sunschool/web` |
| 2026-10-19 | §12: prod smoke §8 зафиксирован (P07-CU9) |

## Сборка и тесты (инцидент 2026-10-16)

- `next build` проверяет типы всех файлов из `apps/web/tsconfig.json`. Тесты (`*.test.ts(x)`, `src/test/**`) из него **исключены**: `vitest` — devDependency корня и в сборке Vercel недоступна (preview упал с `TS2307: Cannot find module 'vitest'`). Типы тестов проверяет `npm run typecheck` (`apps/web/tsconfig.test.json`).
- `npm run build:check` = `scripts/check-build-isolation.mjs` + `next build`; запускается в pre-commit (`scripts/precommit-build-check.mjs`, только если в commit есть код или конфигурация сборки) и в CI (`ci.yml`).
- Сборка не должна требовать секретов: без `DATABASE_URL`, `AUTH_*` она проходит (проверено 2026-10-16). `/design-system` смотрит на `APP_ENV` в момент сборки: `dev` — страница есть, иначе 404. Пока preview не получает `APP_ENV`, лаборатория там отвечает 404.
- `prisma generate` обязателен в том же скрипте, который запускает Vercel (`@sunschool/web` `build`). Клиент в `src/generated` не в git; без generate Turbopack падает с `Can't resolve './generated/prisma/client'` (preview `dpl_G4HHP2n4p4PdrswwovzbKGMBV18P`, 2026-10-16). Корневой `npm run build` только делегирует в этот скрипт. CI по-прежнему вызывает `db:generate` отдельно до `build:check` — повторный generate идемпотентен.
- Переменные проекта сейчас с target **production**. Preview их не получает. Пререндер тогда падал: `/_not-found` через `getUiLocale` → `getServerEnv`, затем `/privacy` через `getPrisma` (`Invalid server environment: APP_ENV, DATABASE_URL, AUTH_SECRET`, `dpl_29YN7krTGZXmGiaBYF24NUXdAhS9`). Без валидного server env `getUiLocale` возвращает `ru` и не открывает БД, а `/privacy` откладывает рендер (`connection()`). Чтобы preview **работал** (вход, данные), на target Preview нужны свои `APP_ENV=dev`, `DATABASE_URL` (Neon dev) и `AUTH_SECRET` — не копия prod.
