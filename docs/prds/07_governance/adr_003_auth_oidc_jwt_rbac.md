# ADR-003 — Аутентификация: Google и Telegram (OIDC), JWT, роли

**Тип:** ADR  
**Статус:** ACCEPTED  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W4-01  
**Зависит от:** [`adr_001_stack_and_runtime.md`](./adr_001_stack_and_runtime.md), [`adr_002_nextjs_vercel_runtime_policy.md`](./adr_002_nextjs_vercel_runtime_policy.md), [`domain_invariants.md`](../02_domain_model/domain_invariants.md), [`lifecycle_models.md`](../02_domain_model/lifecycle_models.md), [`telegram_authjs_oidc_portable_guide.md`](../../my_specs/telegram_authjs_oidc_portable_guide.md), [`sunday_school_data_analytics_spec.md`](../../my_specs/sunday_school_data_analytics_spec.md) §2.1, §2.4  
**Связанные документы:** [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) §5.1, [`responsive_navigation_contract.md`](../../design/responsive_navigation_contract.md) §7, [`architecture_master_index.md`](../architecture_master_index.md)  
**Проверено по:** Auth.js v5 (`next-auth@beta`): custom-провайдер как объект в `providers`, `type: "oidc"`, `issuer`, `clientId` / `clientSecret`, callback `/api/auth/callback/{id}`, стратегия сессии `jwt` по умолчанию без адаптера БД — authjs.dev (`configuring-oauth-providers`, `session-strategies`) через WebFetch, 2026-10-11. Детали обходов Telegram (`state ≤ 256`, синтетический `userinfo_endpoint`, `customFetch`) — по гайду владельца (рабочий путь в проде), не пересверялись по документации Auth.js. Context7 недоступен.

---

## 1. Purpose

Зафиксировать механизм входа, модель идентичностей, состав токена и границы доверия. Читают: авторы `authorization_matrix`, `auth_runtime_spec`, контрактов W8, исполнитель P01.

## 2. Scope / Out of scope

**В scope:** провайдеры, сессия, связь с `app_user`, регистрация и первый admin, привязка и объединение, безопасность.  
**Вне scope:** матрица прав (W5-02), детальная спецификация runtime (W5-08), UI экранов (specs W9).

## 3. Context

- Логинов и паролей нет; подлинность подтверждает провайдер (спец. §2.1).
- Первый вход — регистрация и заявка на доступ; роли получает только `ACTIVE` пользователь (`lifecycle_models` §5.1).
- Telegram не передаёт email; Google передаёт email, имя и фамилию.
- Шаблон проекта и `ai_auth_implementation_guide.md` ориентированы на Credentials — к этому проекту не применимы.

## 4. Decision

### 4.1 Механизм

| Элемент | Решение |
|---------|---------|
| Библиотека | Auth.js v5 (`next-auth`), `auth.ts` экспортирует `handlers`, `auth`, `signIn`, `signOut`; Route Handler `app/api/auth/[...nextauth]/route.ts` |
| Провайдеры | `Google` (встроенный) и **Telegram как custom OIDC** (`id: "telegram"`, `type: "oidc"`, `issuer: https://oauth.telegram.org`) |
| Поток | Authorization Code + **PKCE + `state`** (`checks: ["pkce", "state"]` не отключать), full-page redirect |
| Вход из UI | Только клиентский `signIn()` из `next-auth/react`; серверный `signIn()` из Server Action для Telegram не используется (обход `state` не срабатывает) |
| Обходы Telegram | (а) укорочение `state` до ≤ 256 символов; (б) синтетический `userinfo_endpoint` в discovery через `customFetch` — реализация по гайду владельца, §6 |
| Сессия | **JWT** (`session.strategy: "jwt"`), HttpOnly cookie; БД-сессий и таблиц Session нет |
| Адаптер | **Нет** `@auth/prisma-adapter` (ADR-001); идентичности — таблица `login_identity` |

### 4.2 Идентичность и пользователь

1. В `signIn`-callback по паре `(provider, providerAccountId)` ищется `login_identity`.
2. Найдена — пользователь тот же; статус `DISABLED` / `DELETED` — вход отклонён (§4.6).
3. Не найдена и нет намерения привязки — создаётся `app_user` (`REGISTRATION`) и `login_identity`; пользователь направляется на `/register`.
4. Слияние по совпавшему email **запрещено** (`allowDangerousEmailAccountLinking: false`); дубликаты объединяет только admin (§4.5).
5. Ключ идентичности — `providerAccountId` (Telegram id; Google `sub`), не email и не username.

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
- **Первый admin:** email из `FIRST_ADMIN_EMAIL` (ОК-3). Первый вход через Google с этим email создаёт `ACTIVE` пользователя с ролью `ADMIN` один раз; запись в журнале. Для Telegram email отсутствует — первый admin входит через Google.
- Роль `PARENT` в MVP недоступна: заявка с ней отклоняется (`mvp_scope.md` §4).

### 4.5 Привязка второго способа и объединение

Библиотека без адаптера не выполняет привязку сама, поэтому правила — на нашей стороне:

1. Привязка — отдельное действие **вошедшего** пользователя; `userId` берётся только из `auth()`, с клиента не принимается.
2. Перед редиректом сервер ставит подписанный короткоживущий cookie «намерение привязки» (`userId`, провайдер, срок ≤ 10 минут, одноразовый).
3. В `signIn`-callback при наличии намерения: идентичность принадлежит другому пользователю → привязка отклоняется, пользователи **не сливаются**; свободна → создаётся `login_identity` для `userId` из намерения; уже у этого пользователя — идемпотентный успех.
4. Отвязка — действие пользователя; последний способ входа отвязать нельзя; перед удалением строки — блокировка (`SELECT … FOR UPDATE`), чтобы два параллельных запроса не оставили ноль способов.
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
| Секреты | `AUTH_SECRET`, `AUTH_GOOGLE_*`, `AUTH_TELEGRAM_*` — только server env; `TELEGRAM_BOT_TOKEN` не используется как `clientSecret` |
| Open redirect | `callbackUrl` допускается только относительным путём из `canonical_routes.md` |
| Утечка в ошибках | пользователю — сообщение по коду без токенов и JWKS |
| ПД в токене | запрещены (§4.3) |
| Окружения | отдельные приложения Google / Telegram-бот и `AUTH_SECRET` для dev и prod (ОК-1) |

## 6. Rejected alternatives

| Альтернатива | Почему отклонена |
|--------------|------------------|
| Credentials (email + пароль) | Решение владельца: паролей нет |
| `@auth/prisma-adapter` и БД-сессии | Нет таблиц Account/Session (ADR-001); JWT достаточно |
| Telegram Login Widget (HMAC) / popup-скрипт | Не OIDC; ломается на `Cross-Origin-Opener-Policy` (гайд §1) |
| Собственная реализация OAuth | Лишний код в sensitive zone |
| Слияние по email | Telegram не передаёт email; риск захвата аккаунта |

## 7. Paths (H / N / S)

| Путь | Описание | Исход |
|------|----------|-------|
| **H** | Новый пользователь входит через Google | `REGISTRATION`, перенаправление на `/register` |
| **H** | Активный teacher входит через Telegram | Сессия, перенаправление на `/today` |
| **N** | Пользователь отменил согласие у провайдера | Восстановимое сообщение на `/login`, без stack trace |
| **N** | `DISABLED` пользователь | Вход отклонён, сообщение по ключу |
| **N** | Telegram id уже у другого пользователя при привязке | Привязка отклонена, пользователи не сливаются |
| **S** | Клиент передаёт `userId` в запросе привязки | Игнорируется; используется `auth()` |
| **S** | Роль в JWT устарела | Серверная проверка по БД отказывает |
| **Race** | Двойной первый вход / две привязки одновременно | `UNIQUE (provider, provider_account_id)`; второй получает идемпотентный результат или отказ |

## 8. Affected documents

| Документ | Что меняется |
|----------|--------------|
| `authorization_matrix.md` (W5-02) | Опирается на роли и статусы §4.3 |
| `auth_runtime_spec.md` (W5-08) | Детализирует callbacks, cookie намерения, обходы Telegram |
| `access_requests_and_roles_contract.md` (W8-03) | Регистрация, одобрение, объединение |
| `ai_auth_implementation_guide.md` | Адаптация под OIDC и без адаптера — в P4 |
| `auth-security.mdc` | Актуализация правил — в P4 |
| [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) | `login_identity` — без изменений; таблицы Session нет |

## 9. Acceptance criteria

- [ ] Вход Google и Telegram создаёт `REGISTRATION` пользователя и перенаправляет на `/register` — исход: ручной smoke в dev.
- [ ] JWT не содержит ФИО и email — исход: декодирование cookie.
- [ ] Смена роли admin действует на следующую серверную проверку без повторного входа — исход: тест policy.
- [ ] Привязка чужого Telegram id отклоняется — исход: тест `signIn`-callback.
- [ ] Последний способ входа отвязать нельзя — исход: тест параллельных отвязок.
- [ ] `authorize URL` Telegram имеет `state.length ≤ 256` — исход: тест перехвата redirect.

## 10. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| Q-01 | Срок JWT (14 суток, обновление раз в сутки — по умолчанию) | владелец | `auth_runtime_spec` |
| Q-02 | Привязка без адаптера (намерение привязки в cookie) — подтвердить spike на P01; запасной вариант — `@auth/prisma-adapter` с таблицей Account поверх `login_identity` (потребует amend ADR-001) | architect | P01 auth-задачи |
| Q-03 | Поведение при смене username Telegram (ключ — id, username не используется) | architect | профиль пользователя |

## 11. Related documents

| Document | Relationship |
|----------|--------------|
| [`telegram_authjs_oidc_portable_guide.md`](../../my_specs/telegram_authjs_oidc_portable_guide.md) | Реализация Telegram OIDC |
| [`lifecycle_models.md`](../02_domain_model/lifecycle_models.md) | Статусы и переходы |
| [`domain_invariants.md`](../02_domain_model/domain_invariants.md) | INV-04…INV-06 |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W4-01

## 12. Agent notes

- Не добавлять Credentials-провайдер и `@auth/prisma-adapter` без amend ADR-001.
- Не класть ФИО, email, роли «для удобства» в JWT сверх §4.3.
- Не использовать серверный `signIn()` для Telegram.
- Не принимать `userId` с клиента.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — ACCEPTED (W4-01) |
