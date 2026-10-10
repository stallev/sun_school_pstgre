# P02 — Auth & Request Guards

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P01_phase_description.md`](./P01_phase_description.md), [`authorization_policy_contract.md`](../contracts/authorization_policy_contract.md), [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md)  
**Связанные документы:** [`P02_tasks.md`](../tasks/P02_tasks.md)

**Context7 verified:** Auth.js Credentials + JWT `role`; Next.js 16.2 `proxy.ts`.

---

## Purpose

Фаза **P02** — Auth.js v5 Credentials, JWT session with `role`, `/auth/login` + `/auth/register` (client), `proxy.ts` + `@pulse/policy-edge`, `@pulse/policy-server` stubs. **Без** trainer onboarding wizard.

**Аудитория:** AI-агенты после P01.

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P02_tasks.md`](../tasks/P02_tasks.md) | Checklist |
| 2 | [`authorization_policy_contract.md`](../contracts/authorization_policy_contract.md) | `PolicySessionContext` |
| 3 | [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) | Flows, proxy matcher |
| 4 | [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md) | FM-003 no policy-server in proxy |
| 5 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P02 row |
| 6 | [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md) | Auth form a11y |

**Wireframe:** auth screens per [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md).

**MUST NOT read** P04+ phase docs.

---

## Scope / Out of scope

### In scope

| Area | Deliverable |
|------|-------------|
| Auth.js | Credentials, bcrypt, JWT `role`, session callback |
| Actions | `signIn`, `signOut`, `registerClient` |
| Routes | `/auth/login`, `/auth/register` |
| Proxy | `apps/web/src/proxy.ts` — JWT-only via `@pulse/policy-edge` |
| Policy | `@pulse/policy-edge`, `@pulse/policy-server` stubs |

### Out of scope

- Trainer wizard `/auth/register/trainer` (→ **P10**)
- App shell, role dashboards (→ **P03**)
- Feature routes (→ **P04+**)

---

## UI Catalog (this phase)

| Action | Component | Route |
|--------|-----------|-------|
| **USE** | `Button`, `Input`, `Field`, `Checkbox` | `/auth/login`, `/auth/register` |
| **USE** | `Container`, `Heading`, `ContentText`, `AlertText` | auth pages |
| **MUST NOT** | Trainer wizard steps | → P10 |
| **MUST NOT** | `AppShell`, nav chrome | → P03 |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P01** complete | Yes | DB + domain enums |
| User table + seed | Yes | Login smoke |

---

## In-scope routes

| Path | Content |
|------|---------|
| `/auth/login` | Functional form |
| `/auth/register` | Client tile + form; terms checkbox |

Protected segments wired in proxy; pages MAY be stubs until P03.

---

## Happy path smoke

1. Register client → session → redirect client home (stub OK).
2. Login client/trainer/admin — role in session.
3. Anonymous → `/admin/dashboard` → redirect login + `callbackUrl`.
4. Client → `/admin/*` denied at proxy.

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| Invalid credentials | Generic error; no enumeration ([**FM-008**](../../../prds/02_domain_model/failure_modes_catalog.md)) |
| Duplicate register email | Field validation error; DB UNIQUE on `user.email` |

---

## Security smoke

| Check | Expected |
|-------|----------|
| `policy-server` in `proxy.ts` | **Forbidden** — FM-003 |
| Password in response/logs | Never |
| JWT role tampering | Server-side verify only |

---

## Concurrency & race check

| Scenario | Expected |
|----------|----------|
| Double submit register | One user row |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Account enumeration | Generic auth errors per spec |
| FM-003 policy-server in proxy | Lint/import rule |
| Auth logic in `apps/web` | Domain/policy layer for register |
| Shell built before auth | P02 = auth only |

---

## Definition of done

- [x] Auth.js login + client register working
- [x] `proxy.ts` live; no `middleware.ts` as canonical
- [x] Policy packages stubbed; import graph valid
- [x] Smoke passed; `typecheck` + lint pass

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P02_tasks.md`](../tasks/P02_tasks.md) | Checklist |
| [`P03_phase_description.md`](./P03_phase_description.md) | Next — shell |

---

## Agent notes

- Async APIs: `await cookies()`, `await headers()` — Next.js 16.
- **Одна сессия = P02 only.**

---

## Acceptance criteria

- [x] Auth + proxy smoke pass
- [x] No trainer wizard or full shell in PR
