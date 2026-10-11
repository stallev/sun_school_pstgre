# Authentication Implementation Guide — Sunday School (for AI agents)

**Stack:** Next.js **16.4** (App Router) | Auth.js v5 (JWT, без адаптера) | Prisma v7 | Neon | Vercel  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Runtime:** [ADR-002](../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md) — **`proxy.ts`**, not `middleware.ts`  
**Auth canon:** [ADR-003](../../prds/07_governance/adr_003_auth_oidc_jwt_rbac.md) — **OIDC (Google + Telegram), JWT, RBAC**; [`auth_runtime_spec.md`](../../prds/05_runtime/auth_runtime_spec.md) — файлы, callbacks, ошибки  
**Telegram:** [`telegram_authjs_oidc_portable_guide.md`](../../my_specs/telegram_authjs_oidc_portable_guide.md) — код обходов (не копировать вслепую, см. TG-1…TG-5)  
**Schema:** [`database_schema_v1.md`](../../prds/03_data_model/database_schema_v1.md) §5.1 (`app_user`, `login_identity`)  
**Rule:** [`auth-security.mdc`](../../../.cursor/rules/auth-security.mdc)

Этот гайд — «как делать»; решения и состав файлов — в ADR-003 и `auth_runtime_spec`. При расхождении выигрывает правило, затем контракт и runtime spec.

---

## 1. Architecture overview (Next.js 16)

```
Browser
  → proxy.ts            (Layer 1 — оптимистичный редирект по JWT, auth.config.ts, БЕЗ Prisma)
  → layout (app)        (Layer 2 — requireActiveUser(): статус и роли по БД)
  → Route Handlers / Server Actions (Layer 3 — requireActiveUser() / requireRole() первой строкой)
  → @sunschool/policy-server (Layer 4 — доступ к объекту: чужой ресурс → 404, чужая роль → 403)
  → @sunschool/domain → @sunschool/db → Neon  (Layer 5 — транзакция + запись в журнал)
```

| v15 pattern | v16.4 |
|-------------|-------|
| `middleware.ts` + Edge | **`proxy.ts`** + Node runtime |
| `export function middleware` | **`export function proxy`** |
| Один файл auth | **Split:** `auth.config.ts` (proxy) + `auth.ts` (сервер) |

`middleware.ts` допустим только при контролируемой миграции — не канон.

---

## 2. Split Auth.js config (mandatory)

```typescript
// auth.config.ts — импортируется proxy.ts И auth.ts
// БЕЗ Prisma. Провайдеры (Google, Telegram), pages, authorized.

// auth.ts — только сервер
// NextAuth({ ...authConfig, session: { strategy: "jwt" }, callbacks: { signIn, jwt, session, redirect } })
// signIn работает с БД через packages/db (login_identity, app_user) — без адаптера
```

- **Адаптера нет** (`@auth/prisma-adapter` не используется): в схеме нет таблиц `Account` / `Session`. Идентичности — `login_identity`, пользователи — `app_user`.
- Provider id → enum `LOGIN_PROVIDER` одной функцией в `lib/auth` (без inline-строк на call site).
- **Пароль, Credentials-провайдер и сброс пароля не используются**; добавление — только через amend ADR-001 и ADR-003.

---

## 3. Providers

| Провайдер | Заметки |
|-----------|---------|
| Google | Встроенный, scope `openid email profile`; email нужен для `FIRST_ADMIN_EMAIL` (`email_verified` обязателен) |
| Telegram | Custom `oidc`: `issuer: https://oauth.telegram.org`, `idToken: true`, `checks: ["pkce","state"]`, `profile().email = null`, `allowDangerousEmailAccountLinking: false` |

Обходы Telegram (укорочение `state`, синтетический `userinfo_endpoint`, `customFetch` из `next-auth`) — TG-1…TG-5 в `auth_runtime_spec` §6. Вход и привязка Telegram — **только клиентский** `signIn("telegram")`.

---

## 4. Callbacks (кратко)

| Callback | Что делает | Чего не делает |
|----------|-----------|----------------|
| `signIn` | Находит/создаёт `login_identity` и `app_user` (`REGISTRATION`), создаёт первого admin, выполняет привязку по cookie намерения; отказ — `false` | не раскрывает причину отказа; не сливает пользователей |
| `jwt` | На первом входе кладёт `uid`, `status`, `roles` | не ходит в БД на каждый запрос; не кладёт ФИО, email, телефон |
| `session` | Отдаёт `id`, `status`, `roles` | не отдаёт поля провайдера |
| `redirect` | Пускает относительные пути из `canonical_routes.md` | не пускает внешний `callbackUrl` |

Подробный порядок шагов — `auth_runtime_spec` §5.

---

## 5. proxy.ts (target)

```typescript
// apps/web/src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export async function proxy(request: NextRequest) {
  const session = await auth();
  const path = request.nextUrl.pathname;
  // Оптимистичный редирект по JWT-статусу и префиксу маршрута (policy-edge) — без Prisma.
  // Это не защита данных: серверная проверка — requireActiveUser().
  return NextResponse.next();
}
```

`matcher` берётся из `canonical_routes.md` (маршруты `(app)` и публичные), не из примера. `policy-server` и `packages/db` в `proxy.ts` не импортируются.

---

## 6. Серверные проверки

| Функция | Результат |
|---------|-----------|
| `requireSession()` | `{ uid }` или редирект `/login` |
| `requireActiveUser()` | `PolicySessionContext` **по БД**; иначе редирект по статусу (authorization_matrix §6) |
| `requireRole(role)` | контекст или отказ AZ-D3 |
| `loadOwnedResource(...)` | ресурс или 404 (AZ-D4) |

- `userId` — только из сессии, никогда из ввода клиента.
- Результат проверки кэшируется на **один запрос** (`React.cache`), не между запросами; `'use cache'` для данных пользователя не используется.
- Route Handlers (кроме `/api/auth/*`) вызывают `requireActiveUser()` первой строкой.

---

## 7. Привязка второго способа входа

Без адаптера привязка выполняется так (`auth_runtime_spec` §7):

1. Server Action `startLinkProvider(provider)` ставит подписанный cookie `sunschool.link-intent` (`HttpOnly`, `Secure`, `SameSite=Lax`, TTL 10 минут) и возвращает подтверждение.
2. Клиент вызывает `signIn(provider, { callbackUrl: "/profile" })`.
3. `signIn` читает cookie: подпись, срок, провайдер, `uid`; идентичность свободна → создать; у этого пользователя → идемпотентный успех; у другого → `AUTH_LINK_CONFLICT`. Cookie гасится в любом исходе.
4. Отвязка — `unlinkProvider(provider)`: транзакция + `SELECT … FOR UPDATE`; последний способ нельзя (`AUTH_LAST_IDENTITY`).

**Спайк P01 (ADR-003 Q-02):** подтвердить, что cookie виден в `signIn` при OIDC-callback. Запасной вариант — адаптер поверх `login_identity` с amend ADR-001.

---

## 8. Route protection matrix

См. [`canonical_routes.md`](../../design/canonical_routes.md) и [`authorization_matrix.md`](../../prds/04_authorization_privacy/authorization_matrix.md) (§6 «статус × маршрут»). Периметр — в **proxy**; доступ к объекту — в **policy-server**.

---

## 9. MVP flows

- Первый вход → `REGISTRATION` → `/register` (согласие, ФИО, роль `TEACHER`; `parent` в MVP отклоняется) → `REQUEST_PENDING` → решение admin → `ACTIVE`.
- Первый admin — по `FIRST_ADMIN_EMAIL` (Google, `email_verified`), один раз, в одной транзакции.
- Email и пароль не запрашиваются; формы ввода учётных данных на сайте нет.

Детали — [`access_and_registration_spec.md`](../../implementation/mvp/specs/access_and_registration_spec.md) и [`access_requests_and_roles_contract.md`](../../implementation/mvp/contracts/access_requests_and_roles_contract.md).

---

## 10. Migration from middleware.ts

```bash
npx @next/codemod@canary middleware-to-proxy .
```

Обновить docs и импорты по ADR-002.

---

## 11. Related

- [ADR-002](../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md)
- [ADR-003](../../prds/07_governance/adr_003_auth_oidc_jwt_rbac.md)
- [`auth_runtime_spec.md`](../../prds/05_runtime/auth_runtime_spec.md)
- [`authorization_matrix.md`](../../prds/04_authorization_privacy/authorization_matrix.md)
- Cursor: [`auth-security.mdc`](../../../.cursor/rules/auth-security.mdc), [`security-xss-csrf.mdc`](../../../.cursor/rules/security-xss-csrf.mdc), [`policy-packages.mdc`](../../../.cursor/rules/policy-packages.mdc)
- Security guide: [`ai_security_xss_csrf_guidelines.md`](../security/ai_security_xss_csrf_guidelines.md)
