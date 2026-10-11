# Auth runtime spec — вход, сессия, привязка

**Тип:** PRD (runtime)  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W5-08  
**Зависит от:** [`adr_003_auth_oidc_jwt_rbac.md`](../07_governance/adr_003_auth_oidc_jwt_rbac.md), [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md), [`adr_002_nextjs_vercel_runtime_policy.md`](../07_governance/adr_002_nextjs_vercel_runtime_policy.md), [`telegram_authjs_oidc_portable_guide.md`](../../my_specs/telegram_authjs_oidc_portable_guide.md), [`lifecycle_models.md`](../02_domain_model/lifecycle_models.md) §5.1–5.2  
**Связанные документы:** [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) §5.1, [`canonical_routes.md`](../../design/canonical_routes.md), [`domain_invariants.md`](../02_domain_model/domain_invariants.md) INV-04…INV-06, INV-25, PKG-02, [`architecture_master_index.md`](../architecture_master_index.md)  
**Проверено по:** Auth.js — authjs.dev через WebFetch, 2026-10-11: `reference/core` (callbacks `signIn` / `jwt` / `session` / `redirect`: сигнатуры, `false` из `signIn` → страница ошибки, `jwt` на первом входе получает `user`, `account`, `profile`; `session` отдаёт клиенту только `name`/`email`/`image`, остальное — явно; по умолчанию `redirect` пускает только тот же origin; `maxAge` по умолчанию 30 суток, `updateAge` 1 сутки), `getting-started/session-management/protecting` (в Next.js 16 `auth` экспортируется как `proxy`; **не полагаться на proxy как единственную защиту** — проверять у данных). Не пересверено по документации: `customFetch` как Symbol из `next-auth`, обходы Telegram (`state`, `userinfo_endpoint`), `trigger` значений `jwt` — по гайду владельца (рабочий путь в проде); пересверка — P5. Context7 недоступен.

---

## 1. Purpose

Конкретизировать [ADR-003](../07_governance/adr_003_auth_oidc_jwt_rbac.md): какие файлы, callbacks, cookies и функции проверки существуют, что в них происходит и как они отказывают. Читают: исполнитель P01 (auth), `reviewer` (T3), авторы `access_and_registration_spec` и контрактов W8. **Код из гайда не копируется** — ссылки по §.

## 2. Scope / Out of scope

**В scope:** конфигурация Auth.js, callbacks, обходы Telegram, привязка, ошибки входа, cookies, серверные проверки.  
**Вне scope:** права по действиям ([`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md)); экраны (`access_and_registration_spec`, W9); контракты мутаций (W8).

## 3. Файлы и границы

| Файл (`apps/web/src`) | Runtime | Содержит | Импортирует |
|-----------------------|---------|----------|-------------|
| `auth.config.ts` | edge-safe | провайдеры (Google, Telegram), `pages`, `authorized` | только `next-auth`, `lib/auth/telegram-oidc-discovery-fetch` |
| `auth.ts` | Node | `NextAuth(...)`: `session`, `callbacks`, экспорт `handlers`, `auth`, `signIn`, `signOut` | `auth.config.ts`, `packages/db`, `policy-server` |
| `app/api/auth/[...nextauth]/route.ts` | Node | `GET` / `POST` с обёрткой укорочения `state` | `handlers`, `lib/auth/telegram-oauth-state-rewrite` |
| `proxy.ts` | edge | `auth`-обёртка, перенаправление по статусу и префиксу | `auth.config.ts`, `policy-edge` |
| `lib/auth/telegram-oidc-discovery-fetch.ts` | edge-safe | синтетический `userinfo_endpoint` | — |
| `lib/auth/telegram-oauth-state-rewrite.ts` | Node | укорочение `state` | `@auth/core/jwt` |
| `lib/auth/link-intent.ts` | Node | cookie «намерение привязки» (§7) | — |
| `lib/auth/require-user.ts` | Node | `requireActiveUser`, `requireRole` (§10) | `auth.ts`, `policy-server` |

Правила: `proxy.ts` **не** импортирует `auth.ts`, `packages/db`, `policy-server` (PKG-02, ADR-002 §3). Пакеты `packages/**` не импортируют `next-auth`; в `policy-*` передаётся `PolicySessionContext` (`typescript-monorepo-types`).

## 4. Провайдеры и окружение

### 4.1 Провайдеры

| Провайдер | `id` | Тип | Особенности |
|-----------|------|-----|-------------|
| Google | `google` | встроенный | scope `openid email profile`; email и имя из профиля |
| Telegram | `telegram` | custom `oidc` | `issuer: https://oauth.telegram.org`, `idToken: true`, scope `openid profile`, `checks: ["pkce","state"]`, `allowDangerousEmailAccountLinking: false`, `profile().email = null`, `customFetch` из `next-auth`; конфигурация — гайд §4 |

Сопоставление `LOGIN_PROVIDER`: `google` → `GOOGLE`, `telegram` → `TELEGRAM` (одна функция в `lib/auth`, без inline-строк на call site — `domain-literals-and-codes`).

### 4.2 Переменные окружения

| Переменная | Назначение | Правило |
|------------|------------|---------|
| `AUTH_SECRET` | подпись и шифрование JWT, cookie | server only; разный для dev и prod (ОК-1) |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth | отдельное приложение на окружение |
| `AUTH_TELEGRAM_ID`, `AUTH_TELEGRAM_SECRET` | Telegram OIDC (BotFather Web Login) | `TELEGRAM_BOT_TOKEN` не использовать как `clientSecret` |
| `AUTH_TRUST_HOST` / `AUTH_URL` | за прокси Vercel | по гайду §3 |
| `FIRST_ADMIN_EMAIL` | email первого admin (ОК-3) | значение — в `.local/dev-secrets.json` (git-ignored) и в env Vercel prod; в документах не хранится |
| `APP_ENV` | `dev` / `prod` | сверка со строкой подключения (INV-24) |

Все значения — только серверные; `NEXT_PUBLIC_*` для auth нет. Валидация env при старте — `lib/env.server.ts` (P5).

### 4.3 Telegram: внешняя настройка

В BotFather: OIDC включён; Trusted Origin — HTTPS; Redirect URI — `{origin}/api/auth/callback/telegram`. Локальная проверка Telegram — HTTPS-туннель или стабильный preview; Google проверяется на `localhost`. Эфемерные preview Vercel для Telegram не включаются.

## 5. Callbacks

Сессия: `strategy: "jwt"`, `maxAge` 14 суток, `updateAge` 1 сутки (ADR-003 Q-01; значения Auth.js по умолчанию — 30 суток / 1 сутки).

### 5.1 `signIn({ account, profile, user })`

Порядок (при отказе — `false`, ошибка не раскрывает причину, §8):

1. Провайдер известен (`google` / `telegram`); `account.providerAccountId` непустой.
2. Прочитать cookie «намерение привязки» (§7). Если есть и валидно — **ветка привязки** (шаг 6).
3. Найти `login_identity` по `(provider, providerAccountId)`:
   - найдена и пользователь `ACTIVE` / `REQUEST_PENDING` / `REJECTED` / `REGISTRATION` — продолжить;
   - найдена и пользователь `DISABLED` / `DELETED` — отказ;
   - не найдена — шаг 4.
4. **Регистрация:** создать `app_user` (`REGISTRATION`) и `login_identity` (email из Google, `username` Telegram — только справочно) в одной транзакции; гонка — `UNIQUE (provider, provider_account_id)`: проигравший перечитывает найденную запись.
5. **Первый admin:** если провайдер `google`, email верифицирован и совпал с `FIRST_ADMIN_EMAIL`, в школе ещё нет `ADMIN` — создать пользователя сразу `ACTIVE` с ролью `ADMIN` и запись в журнале; проверка «нет admin» — в той же транзакции, блокировка (двойной первый вход даёт одного admin).
6. **Привязка:** `login_identity` свободна → создать для `userId` из намерения; уже у этого пользователя → успех (идемпотентно); у другого → отказ с кодом конфликта, пользователи **не сливаются**; намерение погашается в любом исходе.
7. Лениво очистить просроченную `REGISTRATION` (> 30 дней, INV-25): удалить и создать заново (шаг 4).
8. Обновить `last_login_at` (и `first_login_at`, если пусто).

Возврат: `true` — Auth.js продолжает; строка допускается только как относительный путь из `canonical_routes.md` (иначе `false`).

### 5.2 `jwt({ token, user, trigger })`

- При первом входе (`user` задан): записать `uid` = `app_user.id` (по `login_identity`, **не** `user.id` провайдера), `status`, `roles`.
- При чтении сессии: **не** ходить в БД на каждый запрос; `status`/`roles` в токене — оптимистичный срез, обновляются при `updateAge` и после событий AZ-D5. Окончательная проверка — §10.
- В токен **не** кладутся ФИО, email, телефон, имя пользователя Telegram (ADR-003 §4.3).

### 5.3 `session({ session, token })`

Копирует в `session.user`: `id` (= `uid`), `status`, `roles`. Остальные поля очищаются: клиент не получает email и имя из провайдера. Тип сессии — module augmentation в `apps/web` (не в `packages/**`).

### 5.4 `redirect({ url, baseUrl })`

Разрешены только относительные пути и тот же origin; путь должен совпадать с маршрутом из `canonical_routes.md` §4; иначе — домашний маршрут статуса (authorization_matrix §6). `callbackUrl` с внешним хостом игнорируется (open redirect).

## 6. Обходы Telegram

Реализуются по гайду владельца §6.1 (укорочение `state` до ≤ 256 символов и перепечатывание cookie `authjs.state`) и §6.2 (синтетический `userinfo_endpoint` через `customFetch`). Дополнительные требования проекта:

| ID | Требование |
|----|------------|
| TG-1 | Вход Telegram — только клиентский `signIn("telegram")` из `next-auth/react`; серверный `signIn()` из Server Action не используется ни при входе, ни при привязке |
| TG-2 | Обёртка `GET` / `POST` route handler оборачивает **оба** метода; ошибка перезаписи → ответ 500 без деталей, событие в Sentry без токенов |
| TG-3 | `customFetch` импортируется из `next-auth` (тот же пакет, что `NextAuth`) |
| TG-4 | `AUTH_REDIRECT_PROXY_URL` / `redirectProxyUrl` не включаются |
| TG-5 | Тест приёмки: authorize URL `state.length ≤ 256`; callback возвращает сессию; отмена consent — восстановимое сообщение |

Обходы чувствительны к версии `next-auth` / `@auth/core`: версия закрепляется точной (без `^`), обновление — отдельной задачей с повтором TG-5.

## 7. Привязка и отвязка второго способа входа

Библиотека без адаптера не привязывает аккаунты сама (ADR-003 §4.5), поэтому:

| Элемент | Решение |
|---------|---------|
| Начало | Server Action `startLinkProvider(provider)` (вошедший `ACTIVE`/`REQUEST_PENDING`/`REJECTED` пользователь) возвращает только подтверждение и ставит cookie; редирект на провайдера делает **клиентский** `signIn(provider, { callbackUrl: "/profile" })` |
| Cookie | `sunschool.link-intent`; значение — подписанный (HMAC на `AUTH_SECRET`) JSON `{ uid, provider, nonce, exp }`; `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/api/auth`, TTL 10 минут |
| Валидация | Подпись, срок, `provider` совпадает с `account.provider`, `uid` существует и `ACTIVE`/`PENDING`/`REJECTED` |
| Одноразовость | После использования cookie очищается; повтор запроса — обычный вход, не привязка |
| Результат | Идемпотентный успех / отказ с кодом `AUTH_LINK_CONFLICT` (отвязка последнего способа — `AUTH_LAST_IDENTITY`); в журнал — привязка (без значения `providerAccountId`: INV-23) |
| Отвязка | Server Action `unlinkProvider(provider)`: транзакция, `SELECT … FOR UPDATE` по `login_identity` пользователя; отказ, если остался один способ; подтверждение в UI, без оптимистичного удаления |
| Объединение | Только admin, контракт W8-03; не часть runtime входа |

**Спайк (P01, ADR-003 Q-02):** подтвердить, что cookie доступен в `signIn`-callback при OIDC-callback и что клиентский `signIn` не теряет его на редиректах. Запасной вариант — `@auth/prisma-adapter` поверх `login_identity` с amend ADR-001.

## 8. Ошибки входа

Страница ошибки — `/login?error=<код>`. Ключи сообщений — словарь `auth` (ADR-008); тексты без токенов, JWKS и деталей чужого аккаунта.

| `error` | Причина | Сообщение (ключ) | Логирование |
|---------|---------|------------------|-------------|
| `OAuthCallback`, `OAuthCallbackError` | Отмена consent или сбой callback | `auth.login.cancelled` — можно повторить | Sentry: info |
| `OAuthAccountNotLinked` | Идентичность у другого пользователя | `auth.login.account_conflict` | Sentry: warning, без идентификаторов |
| `AccessDenied` | `signIn` вернул `false`: `DISABLED`/`DELETED`, невалидное намерение | `auth.login.denied` | Sentry: info; причина — в тегах серверного лога, не в URL |
| `Configuration` | Нет `userinfo_endpoint`, неверный issuer | `auth.login.failed` | Sentry: **error** (поломка обхода §6.2) |
| прочие | — | `auth.login.failed` | Sentry: error |

Auth.js глотает OIDC-исключения: в Sentry они попадают через `logger.error` в конфигурации (реализация — P01).

## 9. Cookies

| Cookie | Назначение | Атрибуты |
|--------|------------|----------|
| `authjs.session-token` / `__Secure-authjs.session-token` | сессия JWT | `HttpOnly`, `Secure` в prod, `SameSite=Lax` |
| `authjs.state`, `authjs.pkce.code_verifier`, `authjs.callback-url` | временные OAuth-куки | управляются Auth.js; `state` перепечатывается §6 |
| `sunschool.link-intent` | намерение привязки | §7 |

Выход: `signOut` клиента очищает сессионный cookie; клиентские данные чистятся (ничего персонального в `localStorage` не хранится). Сессия после выхода недействительна только в браузере (ADR-003 §4.6) — поэтому §10 перепроверяет статус на сервере.

## 10. Серверные проверки

| Функция | Вход | Результат | Использование |
|---------|------|-----------|---------------|
| `requireSession()` | — | `{ uid }` или перенаправление на `/login` | страницы `(app)` |
| `requireActiveUser()` | — | `PolicySessionContext { userId, status: ACTIVE, roles }` **по БД**; иначе перенаправление по статусу (authorization_matrix §6) | layout `(app)`, любая мутация |
| `requireRole(role)` | роль | контекст или AZ-D3 | страницы и действия роли |
| `loadOwnedResource(...)` | тип + id | ресурс или 404 (AZ-D4) | DAL; детали — `policy-server` |

Правила: `userId` берётся только из сессии; результат запроса к БД на статус/роли кэшируется на **один запрос** (`React.cache`), не между запросами; `'use cache'` для данных пользователя не используется (ADR-002 §5). Route Handlers (кроме `/api/auth/*`) вызывают `requireActiveUser()` первой строкой. `proxy.ts` делает оптимистичное перенаправление по JWT и **не заменяет** серверную проверку.

## 11. Paths (H / N / S)

| Путь | Описание | Исход |
|------|----------|-------|
| **H** | Новый пользователь входит через Google | `REGISTRATION`, перенаправление `/register` |
| **H** | `FIRST_ADMIN_EMAIL` входит через Google в пустую школу | `ACTIVE` + `ADMIN`, запись в журнале, `/school` |
| **H** | Teacher привязывает Telegram в `/profile` | `login_identity` создана; повтор — идемпотентный успех |
| **N** | `DISABLED` пользователь входит | `/login?error=AccessDenied`, сообщение `auth.login.denied` |
| **N** | Telegram `state` > 256 | Обёртка укорачивает; при сбое — 500 без деталей |
| **N** | Истёк / повторён cookie намерения | Обычный вход, привязка не выполняется |
| **N** | Telegram id принадлежит другому | `OAuthAccountNotLinked`-сценарий: отказ, без слияния |
| **S** | Клиент передаёт `userId` при привязке | Игнорируется; `uid` из сессии / подписанного cookie |
| **S** | Подделка cookie намерения | Подпись не проходит → обычный вход |
| **S** | `callbackUrl` на внешний хост | Игнорируется, домашний маршрут |
| **Race** | Два первых входа одного человека; две привязки; две отвязки | `UNIQUE (provider, provider_account_id)`; `FOR UPDATE`; один успех |

## 12. Acceptance criteria

- [ ] Вход Google и Telegram создаёт `REGISTRATION` и ведёт на `/register` — исход: ручной smoke dev.
- [ ] Первый admin из `FIRST_ADMIN_EMAIL` создаётся один раз — исход: тест двойного входа.
- [ ] JWT не содержит ФИО и email — исход: декодирование cookie.
- [ ] `state.length ≤ 256` для Telegram — исход: тест перехвата redirect (TG-5).
- [ ] Привязка чужого Telegram id отклоняется; последний способ отвязать нельзя — исход: тесты `signIn`-callback и `unlinkProvider`.
- [ ] `proxy.ts` не импортирует `policy-server` и `packages/db` — исход: `lint` (PKG-02).
- [ ] Мутации вызывают `requireActiveUser()` до работы с данными — исход: review (путь S).

## 13. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| Q-01 | Срок JWT 14 суток (ADR-003 Q-01) | владелец | P01 |
| Q-02 | Спайк привязки без адаптера (ADR-003 Q-02) | architect | P01 auth-задачи |
| Q-03 | Нужна ли политика «один активный сеанс» или принудительный выход при отключении — по умолчанию нет, достаточно серверной проверки | владелец | — |
| Q-04 | Верифицированность email из Google: использовать `email_verified` для `FIRST_ADMIN_EMAIL` (по умолчанию — обязательно) | architect | P01 |

## 14. Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_003_auth_oidc_jwt_rbac.md`](../07_governance/adr_003_auth_oidc_jwt_rbac.md) | Решения |
| [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md) | Права и перенаправления |
| [`telegram_authjs_oidc_portable_guide.md`](../../my_specs/telegram_authjs_oidc_portable_guide.md) | Обходы Telegram |
| [`access_and_registration_spec.md`](../../implementation/mvp/specs/access_and_registration_spec.md) (W9-02) | Экраны входа и регистрации |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W5-08

## 15. Agent notes

- Не добавлять Credentials и `@auth/prisma-adapter` без amend ADR-001.
- Не вызывать серверный `signIn("telegram")`.
- Не класть ПД и роли «для удобства» в JWT сверх `uid`, `status`, `roles`.
- Не использовать `status`/`roles` из JWT для решения о доступе к данным.
- Не импортировать `auth.ts` и `policy-server` из `proxy.ts`.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W5-08) |
