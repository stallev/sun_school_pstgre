# P02 Tasks — Auth & Request Guards

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P02_phase_description.md`](../phases_tasks_descriptions/P02_phase_description.md)  
**Связанные документы:** [`authorization_policy_contract.md`](../contracts/authorization_policy_contract.md), [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md)

---

## Purpose

Чеклист **P02** — Auth.js, login/register, `proxy.ts`, policy packages.

---

## 1. Policy packages

- [x] `@pulse/policy-edge` — JWT decode, route role matrix (no Prisma)
- [x] `@pulse/policy-server` — `PolicySessionContext`, stub `assertCan*`
- [x] Verify forbidden import: `policy-server` **not** in `proxy.ts`

## 2. Auth.js

- [x] `auth.ts` — Credentials provider, bcrypt verify
- [x] JWT callback persists `role`; session exposes `session.user.role`
- [x] Type augmentation for `Session` / `JWT` in `apps/web`
- [x] Server Actions: `signIn`, `signOut`, `registerClient`
- [x] `/auth/login` — form, pending UI, generic error
- [x] `/auth/register` — client form; terms checkbox
- [x] **MUST NOT** `/auth/register/trainer` (→ P10)

## 3. proxy.ts

- [x] `apps/web/src/proxy.ts` with matcher per auth_runtime_spec
- [x] Unauthenticated → protected: redirect login + `callbackUrl`
- [x] Role mismatch → role home or 403
- [x] Uses `@pulse/policy-edge` only

## 4. Verification

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] Smoke: login client/trainer/admin
- [x] Smoke: invalid credentials — generic error
- [x] Smoke: client → `/admin/dashboard` denied
- [x] Smoke: duplicate register email — error

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P02_phase_description.md`](../phases_tasks_descriptions/P02_phase_description.md) | DoD |
| [`P03_tasks.md`](./P03_tasks.md) | Next — shell |

**Registry:** W16
