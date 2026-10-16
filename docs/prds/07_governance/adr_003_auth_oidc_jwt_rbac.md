# ADR-003 — Аутентификация: Telegram (OIDC) и email + пароль администратора, JWT, роли

**Тип:** ADR  
**Статус:** ACCEPTED  
**Версия:** 1.1  
**Дата:** 2026-10-16 (v1.0 — 2026-10-11)  
**Волна:** W4-01  
**Зависит от:** [`adr_001_stack_and_runtime.md`](./adr_001_stack_and_runtime.md), [`adr_002_nextjs_vercel_runtime_policy.md`](./adr_002_nextjs_vercel_runtime_policy.md), [`domain_invariants.md`](../02_domain_model/domain_invariants.md), [`lifecycle_models.md`](../02_domain_model/lifecycle_models.md), [`telegram_authjs_oidc_portable_guide.md`](../../my_specs/telegram_authjs_oidc_portable_guide.md), [`sunday_school_data_analytics_spec.md`](../../my_specs/sunday_school_data_analytics_spec.md) §2.1, §2.4  
**Связанные документы:** [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) §5.1, [`responsive_navigation_contract.md`](../../design/responsive_navigation_contract.md) §7, [`architecture_master_index.md`](../architecture_master_index.md)  
**Проверено по:** Auth.js v5 (`next-auth@beta`): custom-провайдер как объект в `providers`, `type: "oidc"`, `issuer`, `clientId` / `clientSecret`, callback `/api/auth/callback/{id}`, стратегия сессии `jwt` по умолчанию без адаптера БД — authjs.dev (`configuring-oauth-providers`, `session-strategies`) через WebFetch, 2026-10-11. Детали обходов Telegram (`state ≤ 256`, синтетический `userinfo_endpoint`, `customFetch`) — по гайду владельца (рабочий путь в проде), не пересверялись по документации Auth.js. Context7 недоступен. Telegram Login (OIDC): scopes `openid`, `profile` (`name`, `preferred_username`, `picture`), `phone` (`phone_number`, «requires user consent»), claims приходят только в ID token, UserInfo endpoint нет — core.telegram.org/bots/telegram-login через WebFetch, 2026-10-16; что произойдёт, если пользователь не разрешит `phone`, документация не описывает — телефон считается необязательным. Credentials-провайдер Auth.js — `authorize()` возвращает пользователя или `null`, сессия `jwt` — authjs.dev (credentials), не пересверялось 2026-10-16.

---

## 1. Purpose

Зафиксировать механизм входа, модель идентичностей, состав токена и границы доверия. Читают: авторы `authorization_matrix`, `auth_runtime_spec`, контрактов W8, исполнитель P01.

## 2. Scope / Out of scope

**В scope:** провайдеры, сессия, связь с `app_user`, регистрация и первый admin, привязка и объединение, безопасность.  
**Вне scope:** матрица прав (W5-02), детальная спецификация runtime (W5-08), UI экранов (specs W9).

## 3. Context

- **Решение владельца 2026-10-16:** вход через Google **не используется**. Основной способ — Telegram; **администратор** входит по email и паролю (Credentials). У учителей и остальных пользователей паролей нет — подлинность подтверждает Telegram (спец. §2.1).
- Первый вход — регистрация и заявка на доступ; роли получает только `ACTIVE` пользователь (`lifecycle_models` §5.1).
- Telegram не передаёт email. При scope `phone` и согласии пользователя передаёт `phone_number`; `preferred_username` может отсутствовать (у пользователя нет username).
- Шаблон проекта и `ai_auth_implementation_guide.md` ориентированы на Credentials; в проекте Credentials — **только для администратора** (§4.4), не для самостоятельной регистрации.

## 4. Decision

### 4.1 Механизм

| Элемент | Решение |
|---------|---------|
| Библиотека | Auth.js v5 (`next-auth`), `auth.ts` экспортирует `handlers`, `auth`, `signIn`, `signOut`; Route Handler `app/api/auth/[...nextauth]/route.ts` |
| Провайдеры | **Telegram как custom OIDC** (`id: "telegram"`, `type: "oidc"`, `issuer: https://oauth.telegram.org`, `scope: "openid profile phone"`) и **Credentials** (`id: "credentials"`, email + пароль; только для учётных записей администратора) |
| Поток | Authorization Code + **PKCE + `state`** (`checks: ["pkce", "state"]` не отключать), full-page redirect |
| Вход из UI | Только клиентский `signIn()` из `next-auth/react`; серверный `signIn()` из Server Action для Telegram не используется (обход `state` не срабатывает). Форма email + пароль — `signIn("credentials", { email, password, redirect: false })` на клиенте |
| Пароль | Хэш **scrypt** (`node:crypto`, соль на запись, параметры в строке хэша) в `login_identity.password_hash`; сравнение — `timingSafeEqual`; открытый пароль нигде не хранится и не логируется |
| Перебор пароля | `login_identity.failed_attempts` и `locked_until`: 5 неудач подряд → блокировка на 15 минут; ответ на неверный email и неверный пароль одинаков; код `RATE_LIMITED` |
| Обходы Telegram | (а) укорочение `state` до ≤ 256 символов; (б) синтетический `userinfo_endpoint` в discovery через `customFetch` — реализация по гайду владельца, §6 |
| Данные Telegram | `sub` → `provider_account_id`; `preferred_username` → `login_identity.username` (без `@`, может быть пусто); `phone_number` → `login_identity.phone` (как пришло, может быть пусто). Обновляются при каждом входе, если изменились; в журнал не попадают (INV-23) |
| Сессия | **JWT** (`session.strategy: "jwt"`), HttpOnly cookie; БД-сессий и таблиц Session нет |
| Адаптер | **Нет** `@auth/prisma-adapter` (ADR-001); идентичности — таблица `login_identity` |

### 4.2 Идентичность и пользователь

1. В `signIn`-callback по паре `(provider, providerAccountId)` ищется `login_identity`.
2. Найдена — пользователь тот же; статус `DISABLED` / `DELETED` — вход отклонён (§4.6).
3. Не найдена и нет намерения привязки — создаётся `app_user` (`REGISTRATION`) и `login_identity`; пользователь направляется на `/register`.
4. Слияние по совпавшему email **запрещено** (`allowDangerousEmailAccountLinking: false`); дубликаты объединяет только admin (§4.5).
5. Ключ идентичности — `providerAccountId` (Telegram id; для Credentials — нормализованный email), не username и не телефон.
6. Credentials: `authorize()` ищет `login_identity` с `provider = CREDENTIALS` по email (нижний регистр), проверяет блокировку и хэш; статус `DISABLED` / `DELETED` — отказ; успех сбрасывает `failed_attempts`. Регистрации по паролю нет.

### 4.3 Токен и сессия

| Поле JWT | Значение | Примечание |
|----------|----------|------------|
| `uid` | `app_user.id` | единственный идентификатор |
| `status` | `ACCOUNT_STATUS` | для оптимистичной проверки |
| `roles` | `USER_ROLE[]` | для оптимистичной проверки |

- В токене нет ФИО, email, телефона и иных ПД.
- Срок: `maxAge` 14 суток, `updateAge` 1 сутки (скользящая сессия); значение — решение по умолчанию (Q-01).
- **JWT не источник истины:** `proxy.ts` и `policy-edge` используют токен только для перенаправлений; любая мутация и чтение данных проверяют роль и статус по БД на сервере (`policy-server`, INV-04, INV-06). Смена роли admin вступает в силу при следующей серверной проверке, не при следующем входе.

### 4.4 Регистрация и первый admin

- Форма регистрации и согласие (РГ-2…РГ-4) — `lifecycle_models` §5.1; `submitRegistration` создаёт заявку.
- **Первый admin:** создаётся не входом, а явной командой оператора `db:seed:admin` (seed_data_spec §4): `FIRST_ADMIN_EMAIL` и `ADMIN_PASSWORD` (dev — из `.local/dev-secrets.json`, prod — переменные окружения на время запуска, не в репозитории и не в Vercel runtime). Команда создаёт `ACTIVE` пользователя с ролью `ADMIN` и `login_identity` (`CREDENTIALS`, хэш пароля) один раз; повторный запуск идемпотентен и меняет пароль только при `--reset-password`. Записи журнала: `access.first_admin_created`, `auth.password_set` (`SYSTEM`).
- Администратор после первого входа подтверждает согласие на `/register` (режим «подтвердить согласие»); позже может подключить Telegram вторым способом (§4.5). Другие администраторы назначаются обычным путём (заявка через Telegram → роль `ADMIN`) и пароля не получают, пока оператор не создаст его командой.
- Роль `PARENT` в MVP недоступна: заявка с ней отклоняется (`mvp_scope.md` §4).

### 4.5 Привязка второго способа и объединение

Библиотека без адаптера не выполняет привязку сама, поэтому правила — на нашей стороне:

1. Привязка — отдельное действие **вошедшего** пользователя; `userId` берётся только из `auth()`, с клиента не принимается.
2. Перед редиректом сервер ставит подписанный короткоживущий cookie «намерение привязки» (`userId`, провайдер, срок ≤ 10 минут, одноразовый).
3. В `signIn`-callback при наличии намерения: идентичность принадлежит другому пользователю → привязка отклоняется, пользователи **не сливаются**; свободна → создаётся `login_identity` для `userId` из намерения; уже у этого пользователя — идемпотентный успех.
4. Отвязка — действие пользователя; последний способ входа отвязать нельзя (для администратора: пароль и Telegram — два способа); перед удалением строки — блокировка (`SELECT … FOR UPDATE`), чтобы два параллельных запроса не оставили ноль способов.
5. **Объединение дубликатов** — только admin (`mergeUsers`, РГ): переносит `login_identity`, роли, назначения, авторство; запись в журнале; не отменяется автоматически.

### 4.6 Выход и отключение

- Выход — очистка cookie; JWT остаётся недействительным только в браузере, поэтому критичные операции перепроверяют статус на сервере.
- `DISABLED` / `DELETED`: вход отклоняется в `signIn`-callback; действующая сессия теряет доступ при первой серверной проверке (мутации, `auth()` в Server Components с проверкой статуса).
- Лениво очищаемая регистрация (`lifecycle_models` §5.1): при входе пользователя с просроченной `REGISTRATION` запись удаляется и создаётся заново.

## 5. Security consequences (S)

| Угроза | Мера |
|--------|------|
| IDOR / повышение роли | `userId` только из `auth()`; роль и статус — по БД на каждой мутации |
| Подмена `state` / CSRF | `checks: ["pkce", "state"]`; cookie `authjs.state` совпадает с `state` в URL после укорочения |
| Захват привязки | одноразовое подписанное намерение (§4.5 п. 2), отказ при чужой идентичности |
| Секреты | `AUTH_SECRET`, `AUTH_TELEGRAM_*` — только server env; `ADMIN_PASSWORD` — только при запуске `db:seed:admin`, приложением не читается; `TELEGRAM_BOT_TOKEN` не используется как `clientSecret` |
| Подбор пароля | блокировка по `failed_attempts` / `locked_until`, одинаковый ответ на неверный email и пароль, scrypt; пароль не логируется и не попадает в Sentry |
| ПД из Telegram | `phone` и `username` видят только admin и сам пользователь (`/profile`, карточка пользователя); не в JWT, не в журнале; перечислены в тексте согласия и в процедуре удаления |
| Open redirect | `callbackUrl` допускается только относительным путём из `canonical_routes.md` |
| Утечка в ошибках | пользователю — сообщение по коду без токенов и JWKS |
| ПД в токене | запрещены (§4.3) |
| Окружения | отдельный Telegram-бот, `AUTH_SECRET` и пароль администратора для dev и prod (ОК-1) |

## 6. Rejected alternatives

| Альтернатива | Почему отклонена |
|--------------|------------------|
| Credentials для всех пользователей / самостоятельная регистрация по паролю | Лишняя поверхность атаки и поддержка сброса паролей; Credentials — только для администратора (решение владельца 2026-10-16) |
| Google (OIDC) | Решение владельца 2026-10-16: не используется |
| Первый admin по email из Google | Заменён командой `db:seed:admin` — не зависит от внешнего провайдера |
| `@auth/prisma-adapter` и БД-сессии | Нет таблиц Account/Session (ADR-001); JWT достаточно |
| Telegram Login Widget (HMAC) / popup-скрипт | Не OIDC; ломается на `Cross-Origin-Opener-Policy` (гайд §1) |
| Собственная реализация OAuth | Лишний код в sensitive zone |
| Слияние по email | Telegram не передаёт email; риск захвата аккаунта |

## 7. Paths (H / N / S)

| Путь | Описание | Исход |
|------|----------|-------|
| **H** | Новый пользователь входит через Telegram | `REGISTRATION`, `login_identity` с `username` и `phone` (если переданы), перенаправление на `/register` |
| **H** | Администратор входит по email и паролю | Сессия, при отсутствии согласия — `/register`, иначе `/school` |
| **H** | Активный teacher входит через Telegram | Сессия, перенаправление на `/today` |
| **N** | Пользователь отменил согласие у провайдера | Восстановимое сообщение на `/login`, без stack trace |
| **N** | Telegram не передал `phone` или `username` | Вход проходит, поля пустые |
| **N** | Неверный пароль / 5 неудач подряд | Одинаковая ошибка; затем блокировка 15 минут, `RATE_LIMITED` |
| **N** | `DISABLED` пользователь | Вход отклонён, сообщение по ключу |
| **N** | Telegram id уже у другого пользователя при привязке | Привязка отклонена, пользователи не сливаются |
| **S** | Клиент передаёт `userId` в запросе привязки | Игнорируется; используется `auth()` |
| **S** | Роль в JWT устарела | Серверная проверка по БД отказывает |
| **S** | Пароль или хэш в логах, журнале, ответе | Запрещено; проверка тестом сериализации и grep |
| **Race** | Двойной первый вход / две привязки одновременно | `UNIQUE (provider, provider_account_id)`; второй получает идемпотентный результат или отказ |

## 8. Affected documents

| Документ | Что меняется |
|----------|--------------|
| [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md) (W5-02) | Опирается на роли и статусы §4.3 |
| [`auth_runtime_spec.md`](../05_runtime/auth_runtime_spec.md) (W5-08) | Детализирует callbacks, cookie намерения, обходы Telegram |
| `access_requests_and_roles_contract.md` (W8-03) | Регистрация, одобрение, объединение |
| `ai_auth_implementation_guide.md` | Адаптация под OIDC и без адаптера — в P4 |
| `auth-security.mdc` | Актуализация правил — в P4 |
| [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) | `LOGIN_PROVIDER` = `CREDENTIALS`, `TELEGRAM`; `login_identity` + `phone`, `password_hash`, `failed_attempts`, `locked_until`; таблицы Session нет |

## 9. Acceptance criteria

- [ ] Вход через Telegram создаёт `REGISTRATION` пользователя (с `username` и `phone`, если переданы) и перенаправляет на `/register` — исход: ручной smoke в dev.
- [ ] Администратор из `db:seed:admin` входит по email и паролю; хэш в БД — scrypt, пароль нигде не виден — исход: smoke и тест.
- [ ] 5 неверных паролей блокируют вход на 15 минут — исход: тест.
- [ ] JWT не содержит ФИО, email, телефон и username — исход: декодирование cookie.
- [ ] Смена роли admin действует на следующую серверную проверку без повторного входа — исход: тест policy.
- [ ] Привязка чужого Telegram id отклоняется — исход: тест `signIn`-callback.
- [ ] Последний способ входа отвязать нельзя — исход: тест параллельных отвязок.
- [ ] `authorize URL` Telegram имеет `state.length ≤ 256` — исход: тест перехвата redirect.

## 10. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| Q-01 | Срок JWT (14 суток, обновление раз в сутки — по умолчанию) | владелец | `auth_runtime_spec` |
| Q-02 | Привязка без адаптера (намерение привязки в cookie) — подтвердить spike на P01; запасной вариант — `@auth/prisma-adapter` с таблицей Account поверх `login_identity` (потребует amend ADR-001) | architect | P01 auth-задачи |
| Q-03 | ~~Поведение при смене username Telegram~~ — **решено 2026-10-16:** ключ — id; `username` и `phone` обновляются при каждом входе | — | — |
| Q-04 | Отказ пользователя от `phone` в Telegram: поведение провайдера не описано в документации — проверить в dev на P01-CU3; по умолчанию телефон необязателен | architect | P01-CU3 |
| Q-05 | Сброс пароля администратора: только оператором (`db:seed:admin --reset-password`); самообслуживание — вне MVP | владелец | — |

## 11. Related documents

| Document | Relationship |
|----------|--------------|
| [`telegram_authjs_oidc_portable_guide.md`](../../my_specs/telegram_authjs_oidc_portable_guide.md) | Реализация Telegram OIDC |
| [`lifecycle_models.md`](../02_domain_model/lifecycle_models.md) | Статусы и переходы |
| [`domain_invariants.md`](../02_domain_model/domain_invariants.md) | INV-04…INV-06 |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W4-01

## 12. Agent notes

- Credentials — только для администратора (v1.1); не расширять на регистрацию и сброс пароля без amend ADR-001 и ADR-003. `@auth/prisma-adapter` не добавлять.
- Google не подключать. Пароль, хэш, телефон, username — не в JWT и не в журнал.
- Не класть ФИО, email, роли «для удобства» в JWT сверх §4.3.
- Не использовать серверный `signIn()` для Telegram.
- Не принимать `userId` с клиента.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — ACCEPTED (W4-01) |
| 2026-10-16 | v1.1 — Google исключён; добавлен Credentials (email + пароль) только для администратора, первый admin — командой `db:seed:admin`; Telegram передаёт `username` и `phone` (scope `phone`); поля `login_identity`; Q-03 решён, Q-04/Q-05 |
