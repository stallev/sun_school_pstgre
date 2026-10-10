# Wireframe: Login

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/auth/login` · **Group:** `(public)` · **Prototype:** —

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | «Войти» (submit) |
| **Spec** | [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) |

## Components

`Card`, `Form`, `Input`, `Label`, `Button`, `Alert` (optional), link to register.

## Regions

1. **Logo + title** — centered.
2. **Form** — email, password (show/hide toggle), forgot password link (disabled/post-MVP tooltip).
3. **Submit** — full width; pending gerund.
4. **Footer link** — «Нет аккаунта?» → `/auth/register`.

## Data dependencies

`callbackUrl` searchParam; Auth.js `signIn('credentials')`.

## Guardrails

- Generic error only — never «email not found» vs «wrong password».
- Redirect by JWT role after success.

## States

| State | Description |
|-------|-------------|
| happy | Empty form |
| loading | Submit disabled + aria-busy |
| error | toast.error generic credentials |
| forbidden | Logged-in user → role dashboard redirect |

## Mobile / Desktop

Mobile: full viewport form, CTA bottom-safe. Desktop: `max-w-md mx-auto` Card centered.

```
┌────────────────────┐
│      [Logo]        │
│   Вход в Pulse     │
│ Email              │
│ Password [👁]      │
│ [    Войти    ]    │
│ → Register         │
└────────────────────┘
```

**Registry:** W10-05
