# P01 Tasks — Фундамент: данные, вход, оболочка, регистрация и доступ

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W11-02  
**Зависит от:** [`P01_phase_description.md`](../phases_tasks_descriptions/P01_phase_description.md), [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md), [`access_requests_and_roles_contract.md`](../contracts/access_requests_and_roles_contract.md), [`change_log_contract.md`](../contracts/change_log_contract.md), [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md), [`global_shell_spec.md`](../specs/global_shell_spec.md), [`access_and_registration_spec.md`](../specs/access_and_registration_spec.md)  
**Связанные документы:** [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md), [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md), [`adr_003_auth_oidc_jwt_rbac.md`](../../../prds/07_governance/adr_003_auth_oidc_jwt_rbac.md), [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md)

---

## Purpose

Доставить вход, регистрацию, роли, оболочку и запись журнала на пустой БД. DoD — [`P01_phase_description.md`](../phases_tasks_descriptions/P01_phase_description.md) §Definition of done. Критерии DoR, путей H/N/S и tiers — в [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) и [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) §2.3.2a; здесь не повторяются.

## Phase DoR audit (lean: оркестратор inline)

- [x] Bootstrap P5 и P6 завершены (gates G4, G5); `npm run typecheck`, `lint`, `test` зелёные на чистом дереве — проверено 2026-10-11, ветка P0006
- [x] Все задачи ниже проходят DoR (ссылки `§` открываются; пути H/N/S указаны; версии библиотек сверены с `Проверено по` документов; пометить дату и исполнителя) — проверено inline 2026-10-11, оркестратор (Claude)
- [x] Open questions фазы: Q-01 решён (2026-10-11: одобрение `TEACHER` без групп — с предупреждением `NO_GROUPS`); Q-03 `global_shell_spec` (dev-вход) решён или отложен — Q-03 отложен на CU6 (дефолт: dev-вход фикстур по `APP_ENV=dev`)
- [ ] Внешняя настройка: приложения Google и Telegram для dev, `AUTH_*` в `.local`, `FIRST_ADMIN_EMAIL` в `.local/dev-secrets.json`

## Commit plan

Формат задачи — [`phase_tasks.template.md`](../../../meta/phase_tasks.template.md). Пути `packages/*/src` и `apps/web/src` — по [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md) §3, §5.

### P01-CU1 — feat(domain): add roles, statuses, error codes and audit actions · Review: diff-only · Commit: auto · ✔ выполнен 2026-10-11

- [x] P01-T1 · T1 · Contract: [monorepo_boundaries §8](../contracts/monorepo_boundaries_contract.md) · Schema: [database_schema_v1 §4](../../../prds/03_data_model/database_schema_v1.md)
      Files: `packages/domain/src/constants/{user-role,account-status,login-provider,access-request-status}.ts`
      Acceptance: значения совпадают с enum схемы §4 (тест сверки списков) → тест зелёный
      Сделано: тест сверки лежит в `packages/db/src/enums-schema.test.ts` (в domain нет типов Node — читать `schema.prisma` оттуда нельзя)
      Paths: n/a — константы без поведения
- [x] P01-T2 · T1 · Contract: [monorepo_boundaries §7–§8](../contracts/monorepo_boundaries_contract.md), [access_requests §6](../contracts/access_requests_and_roles_contract.md)
      Files: `packages/domain/src/constants/mutation-error-codes.ts`, `types/mutation-result.ts`
      Acceptance: общие коды + `ACCESS_*`, `AUTH_*`; `MutationResult` с `fields?` → typecheck, тест типов
      Paths: n/a — реестр кодов
- [x] P01-T3 · T1 · Contract: [change_log §3–§4](../contracts/change_log_contract.md)
      Files: `packages/domain/src/constants/audit-action.ts`, `audit/serialize-audit-values.ts`
      Acceptance: реестр содержит `access.*`, `auth.*`, `seed.run`, `settings.*`; сериализация отбрасывает ФИО/email/`providerAccountId` → unit-тест (INV-23)
      Paths: H [change_log §3] · N [§5 L-3, L-7: ПД не попадают]
- [x] P01-T4 · T1 · Contract: [access_requests §4](../contracts/access_requests_and_roles_contract.md) · UX: [forms §5](../../../design/forms_and_validation_ux.md)
      Files: `packages/domain/src/schemas/person-name.ts`, `registration.ts`, `account/can-transition-account.ts`
      Acceptance: ФИО по РГ-3; переходы статусов по [lifecycle §5.1](../../../prds/02_domain_model/lifecycle_models.md) → unit-тесты допустимых и недопустимых
      Paths: H [lifecycle §5.1] · N [invalid transitions]

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · домен не импортирует Next/Prisma (lint boundaries) — ✔ 2026-10-11

### P01-CU2 — feat(db): add client factory, environment guard, audit writer and reference seed · Review: reviewer · Commit: auto

- [ ] P01-T5 · T3 · ADR: [adr_001 §3.4](../../../prds/07_governance/adr_001_stack_and_runtime.md) · Spec: [seed_data_spec §5](../../../prds/03_data_model/seed_data_spec.md)
      Files: `packages/db/src/client.ts`, `env-guard.ts`
      Acceptance: клиент с driver adapter; при расхождении `APP_ENV` и `app_setting.db_environment` — отказ до записи → тест (мок маркера)
      Paths: H [seed_data_spec §5] · N [неизвестный `APP_ENV`, нет маркера в prod] · S [INV-24: prod-URL + dev]
      Статус: частично (2026-10-11) — `packages/db/src/client.ts` — каркас P5; `env-guard.ts` и тест отсутствуют
- [ ] P01-T6 · T3 · Contract: [change_log §5, §11](../contracts/change_log_contract.md)
      Files: `packages/db/src/audit/write-audit.ts`
      Acceptance: единственная точка записи `audit_log`; требует транзакцию; нет `update`/`delete` → тест, grep-проверка в тесте
      Paths: H [change_log §8] · N [запись вне транзакции → ошибка] · S [R-6, INV-16]
- [ ] P01-T7 · T2 · Spec: [seed_data_spec §3, §6](../../../prds/03_data_model/seed_data_spec.md)
      Files: `packages/db/seed/reference/{organization,app-settings,bible-translations,bible-books,achievement-catalog}.ts`, `seed:reference` скрипт
      Acceptance: на пустой БД — 1 организация, ключи `app_setting`, 66 книг, 8+3 записи каталога; повторный запуск не меняет счётчики; пишет `seed.run` → интеграционный тест на тестовой БД/ветке
      Paths: H [seed_data_spec §9] · N [два параллельных запуска — advisory lock] · S [маркер окружения записывается один раз]

**CU DoD:** `typecheck` · `lint` · `test` · `prisma migrate` не требуется (схема из P5) · smoke: `db:migrate` + `seed:reference` на dev-ветке

### P01-CU3 — feat(auth): configure Google and Telegram OIDC providers with Telegram workarounds · Review: reviewer · Commit: auto

- [ ] P01-T8 · T3 · Spec: [auth_runtime_spec §4, §6](../../../prds/05_runtime/auth_runtime_spec.md) · Guide: [telegram guide §4, §6](../../../my_specs/telegram_authjs_oidc_portable_guide.md)
      Files: `apps/web/src/auth.config.ts`, `src/lib/auth/telegram-oidc-discovery-fetch.ts`
      Acceptance: провайдеры `google`, `telegram` (`idToken`, `checks: pkce,state`); синтетический `userinfo_endpoint` только при его отсутствии; `customFetch` импортирован из `next-auth` → unit-тест fetch-обёртки
      Paths: H [§6.2] · N [discovery недоступен → исходный ответ] · S [`TELEGRAM_BOT_TOKEN` не используется как secret]
      Статус: частично (2026-10-11) — `auth.config.ts` и `telegram-oidc-discovery-fetch.ts` (каркас P5) есть; unit-теста fetch-обёртки нет
- [ ] P01-T9 · T3 · Spec: [auth_runtime_spec §6 (TG-1…TG-5)](../../../prds/05_runtime/auth_runtime_spec.md)
      Files: `src/lib/auth/telegram-oauth-state-rewrite.ts`, `src/app/api/auth/[...nextauth]/route.ts`
      Acceptance: после обёртки `state.length ≤ 256` для Telegram; cookie `authjs.state` совпадает; нет cookie → ошибка → unit-тест (TG-5)
      Paths: H [§6.1] · N [нет `AUTH_SECRET` → 500 без деталей] · S [CSRF-проверка `state` сохранена]
      Статус: частично (2026-10-11) — `telegram-oauth-state-rewrite.ts` и route handler (каркас P5) есть; unit-теста TG-5 нет

**CU DoD:** `typecheck` · `lint` · `test` · ручной smoke Google (localhost) и Telegram (HTTPS-туннель/preview)

### P01-CU4 — feat(auth): add sign-in callbacks, first login and lazy registration purge · Review: reviewer · Commit: auto

- [ ] P01-T10 · T3 · Contract: [access_requests §5.1, §5.10](../contracts/access_requests_and_roles_contract.md) · Spec: [auth_runtime_spec §5](../../../prds/05_runtime/auth_runtime_spec.md)
      Files: `apps/web/src/auth.ts`, `src/data/access/first-login.ts`, `purge-expired-registration.ts`
      Acceptance: `signIn` создаёт `REGISTRATION` + `login_identity` в одной транзакции; `DISABLED`/`DELETED` → `false`; первый admin по `FIRST_ADMIN_EMAIL` один раз под блокировкой; просроченная `REGISTRATION` удаляется и создаётся заново → тесты use-case и гонки двойного входа
      Paths: H [§5.1, §5.10] · N [`DISABLED`, нет провайдера, email не верифицирован] · S [AZ-D5; `FIRST_ADMIN_EMAIL` не раскрывается; ПД не в JWT]
- [ ] P01-T11 · T3 · Spec: [auth_runtime_spec §5.2–§5.4, §9](../../../prds/05_runtime/auth_runtime_spec.md)
      Files: `src/auth.ts` (jwt/session/redirect), `src/types/next-auth.d.ts`
      Acceptance: JWT = `uid`, `status`, `roles`; `session.user` без email/имени; `redirect` пускает только маршруты из `canonical_routes` → тест callbacks
      Paths: H [§5.2–5.3] · N [внешний `callbackUrl`] · S [ПД не в токене]
      Статус: частично (2026-10-11) — `auth.ts` — каркас без callbacks `signIn`/`jwt`/`session`/`redirect`; `next-auth.d.ts` есть; тестов нет

**CU DoD:** `typecheck` · `lint` · `test` (включая гонку двойного первого входа) · smoke: вход нового пользователя → `REGISTRATION`

### P01-CU5 — feat(policy): add edge and server policy, requireActiveUser and proxy · Review: reviewer · Commit: auto

- [ ] P01-T12 · T3 · Matrix: [authorization_matrix §4, §6](../../../prds/04_authorization_privacy/authorization_matrix.md) · Contract: [monorepo_boundaries §3–§4](../contracts/monorepo_boundaries_contract.md)
      Files: `packages/policy/edge/src/{route-access,home-route}.ts`, `packages/policy/server/src/{context,require-role}.ts`
      Acceptance: таблица «статус × префикс» из §6 матрицы реализована функцией; `PolicySessionContext` без типов `next-auth` → unit-тест по всей таблице
      Paths: H [§6] · N [неизвестный статус → deny] · S [INV-04…INV-06; AZ-P4]
- [ ] P01-T13 · T3 · Spec: [auth_runtime_spec §10](../../../prds/05_runtime/auth_runtime_spec.md) · ADR: [adr_002 §3](../../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md)
      Files: `apps/web/src/proxy.ts`, `src/lib/auth/require-user.ts`
      Acceptance: `proxy.ts` использует только `policy-edge` и `auth.config`; `requireActiveUser()` читает статус/роли по БД, кэш на запрос; перенаправления по §6 → тесты + lint boundaries
      Paths: H [§10] · N [нет сессии → `/login`] · S [AZ-D1…D5: устаревший JWT, снятая роль]
      Статус: частично (2026-10-11) — `proxy.ts` подключён к `policy-edge`; `canVisitRoutePrefix` — заглушка «allow all», `requireActiveUser()` бросает ошибку (реализация в CU5)

**CU DoD:** `typecheck` · `lint` (boundaries) · `test` · smoke: teacher → `/users` даёт 403, аноним → `/login`

### P01-CU6 — feat(web): add app shell, navigation and shell-level states · Review: diff-only · Commit: auto

- [ ] P01-T14 · T1 · Spec: [global_shell_spec §4–§6](../specs/global_shell_spec.md)
      Files: `apps/web/src/app/layout.tsx`, `app/(app)/layout.tsx`, `app/(auth)/layout.tsx`, `components/shell/*`, `lib/shell/nav-resolver.ts`
      Acceptance: NAV по роли совпадает с [UX-02 §5](../../../design/responsive_navigation_contract.md); disclosure + `aria-expanded`; drawer по APG; skip-link → проверка DOM и 390 px / `lg`
      Paths: H [§10] · N [§11: бейдж не ломает оболочку] · S [§12 S-1, S-4: пункт не в DOM; dev-переключатель не в prod]
- [ ] P01-T15 · T1 · Spec: [global_shell_spec §5, §7](../specs/global_shell_spec.md) · UX: [ui_states S1, S3, S4](../../../design/ui_states_contract.md)
      Files: `app/global-error.tsx`, `app/not-found.tsx`, `app/(app)/{loading,error}.tsx`, `components/shell/nav-badge.tsx`
      Acceptance: 403/404/ошибка внутри оболочки; бейдж «Люди» = заявки (+ удаления после P06) → ручной шаг
      Paths: H · N [§7 таблица состояний] · S [бейджи только admin]
- [ ] P01-T16 · T0 · Files: `apps/web/src/lib/messages/{ru,en}/{common,auth}.json`, `get-dictionary.ts`
      Acceptance: ключи оболочки и `auth` в ru и en; тип `en` ≡ `typeof ru` → сборка падает при пропуске
      Paths: n/a — copy
      Статус: частично (2026-10-11) — словари `ru`/`en` (`common`, `auth`, `teacher`, `admin`, `analytics`) и `get-dictionary.ts` (каркас P5) есть; ключи оболочки и проверка `en ≡ ru` — нет

**CU DoD:** `typecheck` · `lint` · `test` · smoke 390 px и `lg` · проверка Lab-секций новых компонентов

### P01-CU7 — feat(auth): add registration, resubmission and own-name use-cases · Review: reviewer · Commit: auto

- [ ] P01-T17 · T3 · Contract: [access_requests §5.2–§5.3, §5.8, §6](../contracts/access_requests_and_roles_contract.md)
      Files: `apps/web/src/data/access/{submit-registration,resubmit-registration,update-own-name}.ts`, `actions/access.ts`
      Acceptance: атомарно `privacy_consent` + `access_request` + статус; повтор идемпотентен; `consentVersion` — серверная; журнал `access.registration_submitted/_resubmitted/name_changed` → тесты по таблице отказов §6
      Paths: H [§5.2–5.3] · N [§6: нет согласия, ФИО, статус, уже `PENDING`] · S [AZ-05, AZ-D5; `userId` из сессии; нет ПД в журнале]

**CU DoD:** `typecheck` · `lint` · `test` (отказы, идемпотентность) · smoke: `REGISTRATION → REQUEST_PENDING`

### P01-CU8 — feat(web): add login, privacy, register and pending screens · Review: diff-only · Commit: auto

- [ ] P01-T18 · T1 · Spec: [access_and_registration §6–§10](../specs/access_and_registration_spec.md)
      Files: `app/(auth)/{login,privacy,register,pending}/page.tsx`, `components/auth/{ProviderButton,ConsentBlock,RegisterForm}.tsx`
      Acceptance: клиентский `signIn`; чекбокс не отмечен, кнопка неактивна без него; режимы «исправить» и «подтвердить согласие»; «Выйти» на `/register` и `/pending`; `/privacy` публичный → ручной smoke H/N + проверка DOM
      Paths: H [spec §12] · N [spec §13] · S [spec §14: `callbackUrl`, нет ПД в URL]
- [ ] P01-T19 · T0 · Files: `apps/web/src/lib/messages/{ru,en}/auth.json`, `app/(auth)/privacy/content.ts`
      Acceptance: текст согласия v1 (черновик) на ru и en; версия = `consent_text_version`
      Paths: n/a — copy

**CU DoD:** `typecheck` · `lint` · `test` · ручной smoke Google/Telegram → `/register` → `/pending`

### P01-CU9 — feat(auth): add approval, roles, disable and merge use-cases · Review: reviewer · Commit: auto

- [ ] P01-T20 · T3 · Contract: [access_requests §5.4–§5.7, §5.9, §6–§8](../contracts/access_requests_and_roles_contract.md)
      Files: `apps/web/src/data/access/{approve-request,reject-request,change-roles,disable-access,enable-access,update-user-name,merge-users}.ts`, `actions/access-admin.ts`
      Acceptance: блокировки и порядок по §8; `ACCESS_LAST_ADMIN`, `ACCESS_SELF_FORBIDDEN`, `ACCESS_ROLE_UNAVAILABLE`; `TEACHER` без групп одобряется с предупреждением `NO_GROUPS`, группа не активного года — `VALIDATION`; журнал на каждую операцию → тесты отказов и гонок (два admin, последний admin)
      Paths: H [§5.4–5.9] · N [§6 все строки] · S [AZ-01…AZ-04, AZ-P1…AZ-P3: teacher → `FORBIDDEN`, чужой → `NOT_FOUND`]
- [ ] P01-T21 · T3 · Contract: [access_requests §5.10](../contracts/access_requests_and_roles_contract.md) · Lifecycle: [§5.1 ленивая очистка](../../../prds/02_domain_model/lifecycle_models.md)
      Files: вызов `purgeExpiredRegistration` из загрузчиков `/approvals`, `/users`
      Acceptance: просроченные `REGISTRATION` (> 30 дней) удаляются при открытии admin-экранов; журнал `SYSTEM` → тест
      Paths: H [§5.10] · N [свежие не затрагиваются] · S [INV-25: нет cron]

**CU DoD:** `typecheck` · `lint` · `test` (S-пути тестом) · smoke: approve ADMIN, reject с причиной, disable/enable

### P01-CU10 — feat(web): add approvals and users screens · Review: diff-only · Commit: auto

- [ ] P01-T22 · T1 · Spec: [admin_flow §4.1–§4.2](../../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md) · Matrix: AZ-01…AZ-04 · UX: [forms §6](../../../design/forms_and_validation_ux.md)
      Files: `app/(app)/approvals/page.tsx`, `users/page.tsx`, `users/[userId]/page.tsx`, `components/admin/{ApprovalRow,UserRow,RoleSelector}.tsx`
      Acceptance: список заявок «старые сверху» с датой и версией согласия; диалоги одобрения (роли, группы) и отклонения (причина); профиль пользователя (роли, статус, способы входа, журнал по пользователю — после P06 ссылка) → ручной smoke H/N, проверка DOM
      Paths: H [admin_flow §4.1] · N [UX-05 D15: пусто «Новых заявок нет»; конфликт — список обновляется] · S [AZ-01…AZ-04: teacher → 403]

**CU DoD:** `typecheck` · `lint` · `test` · smoke 390 px и `lg`

### P01-CU11 — feat(auth): add identity linking and unlinking · Review: reviewer · Commit: auto

- [ ] P01-T23 · T3 · Spec: [auth_runtime_spec §7](../../../prds/05_runtime/auth_runtime_spec.md) · ADR: [adr_003 §4.5, Q-02](../../../prds/07_governance/adr_003_auth_oidc_jwt_rbac.md)
      Files: `src/lib/auth/link-intent.ts`, `src/data/access/{start-link-provider,unlink-provider}.ts`, расширение `signIn`-callback
      Acceptance: подписанный одноразовый cookie TTL ≤ 10 мин; привязка чужой идентичности → `AUTH_LINK_CONFLICT`; последний способ не отвязывается (`FOR UPDATE`) → тесты callback и параллельных отвязок
      Paths: H [§7] · N [просрочен/повторён cookie, конфликт, последний способ] · S [AZ-05; `userId` не с клиента; подделка cookie]
- [ ] P01-T24 · T2 · ADR: [adr_003 Q-02](../../../prds/07_governance/adr_003_auth_oidc_jwt_rbac.md)
      Files: ADR-003 (запись результата спайка), при провале — решение об amend ADR-001
      Acceptance: подтверждено, что cookie доступен в `signIn`-callback при OIDC-callback; результат записан в ADR → отчёт в CU
      Paths: n/a — исследовательская задача

**CU DoD:** `typecheck` · `lint` · `test` · ручной smoke привязки Telegram↔Google

### P01-CU12 — feat(web): add profile screen with identities · Review: diff-only · Commit: auto

- [ ] P01-T25 · T1 · Spec: [access_and_registration §9](../specs/access_and_registration_spec.md)
      Files: `app/(app)/profile/page.tsx`, `app/(auth)/profile/…` (вид без оболочки), `components/auth/LinkedIdentityRow.tsx`
      Acceptance: ФИО, роли/статус, способы входа (подключить/отключить), согласие (чтение), «Выйти»; блок удаления — заглушка до P06 → ручной smoke
      Paths: H [spec §12] · N [spec §13: конфликт, последний способ] · S [spec §14 S-7]

**CU DoD:** `typecheck` · `lint` · `test` · smoke 390 px

### P01-CU13 — docs(docs): sync P01 docs with implementation · Review: diff-only · Commit: auto

- [ ] P01-T26 · T0 · Files: `docs/**` (контракты, specs, ADR-003, auth guideline `ai_auth_implementation_guide.md`, индекс)
      Acceptance: grep изменённых терминов; нет расхождений между кодом и документами; расхождения исправлены в документах (product-docs-alignment)
      Paths: n/a — docs-only

## Verification (phase)

- [ ] Все CU закоммичены; у каждого trace `Review: …`
- [ ] Phase DoD из [`P01_phase_description.md`](../phases_tasks_descriptions/P01_phase_description.md)
- [ ] Docs sync выполнен в CU13, а не отдельным хвостом без CU

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P01_phase_description.md`](../phases_tasks_descriptions/P01_phase_description.md) | DoD фазы |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, task tiers, commit units |
| [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) §2.3.2a / §2.3.6 | Критерии путей и DoR |

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W11-02) |
