# Authentication Implementation Guide — Pulse (for AI agents)

**Stack:** Next.js **16.3.0** (App Router) | Auth.js v5 | Prisma v7 | Neon | Vercel  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Runtime:** [ADR-002](../../prds/07_governance/adr_002_next162_vercel_runtime_policy.md) — **`proxy.ts`**, not `middleware.ts`  
**Auth canon:** [ADR-003](../../prds/07_governance/adr_003_auth_credentials_jwt_rbac.md) — Credentials, JWT, RBAC, four-layer model  
**Schema:** [`database_schema_v1.md`](../../prds/03_data_model/database_schema_v1.md)

---

## 1. Architecture overview (Next.js 16)

```
Browser
  → proxy.ts (Layer 1 — JWT gate via auth.config.ts, NO Prisma)
  → layout guards (Layer 2 — optional UX redirect)
  → Route Handlers / Server Actions (Layer 3 — auth())
  → @pulse/policy-server (Layer 4)
  → @pulse/domain → @pulse/db → Neon
```

**Critical Next.js 16 difference from v15:**

| v15 pattern | Pulse (v16.3.0) |
|-------------|-----------------|
| `middleware.ts` + Edge | **`proxy.ts`** + Node runtime |
| `export function middleware` | **`export function proxy`** |
| Single auth file in middleware | **Split:** `auth.config.ts` (proxy) + `auth.ts` (server) |

`middleware.ts` may exist **only** during controlled migration — do not treat it as canonical.

---

## 2. Split Auth.js config (mandatory)

```typescript
// auth.config.ts — imported by proxy.ts AND auth.ts
// NO Prisma, NO bcrypt, edge-safe providers/callbacks for JWT

// auth.ts — server only
// getPrisma() + bcrypt in Credentials authorize()
// Used by Route Handlers, Server Actions, RSC — NOT by proxy via full import
```

Per Auth.js v5 (Context7): JWT `session: { strategy: "jwt" }` — **no** `@auth/prisma-adapter` on MVP (see ADR-003, `database_schema_v1.md` §0.D).

---

## 3. proxy.ts example (target)

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
  // Role-based redirects — JWT only, no Prisma
  // ...
  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/trainer/:path*", "/admin/:path*"],
};
```

Use `@pulse/policy-edge` for path classification helpers if needed.

---

## 4. Route protection matrix

See [`canonical_routes.md`](../../design/canonical_routes.md) and [`authorization_matrix.md`](../../prds/04_authorization_privacy/authorization_matrix.md). Perimeter in **proxy**; object-level in **policy-server** ([`policy_enforcement_contract.md`](../../prds/04_authorization_privacy/policy_enforcement_contract.md)).

---

## 5. MVP flows

- Registration → `user.role` from tile; trainer → `trainer_profile.status = pending`
- Forgot password → **post-MVP** (`password_reset_token` + Resend per ADR-003); not MVP UI
- Credentials + bcrypt on `User.passwordHash`

---

## 6. Migration from middleware.ts

If legacy docs show `middleware.ts`:

```bash
npx @next/codemod@canary middleware-to-proxy .
```

Update docs and imports to match ADR-002.

---

## 7. Related

- [ADR-002](../../prds/07_governance/adr_002_next162_vercel_runtime_policy.md)
- [ADR-003](../../prds/07_governance/adr_003_auth_credentials_jwt_rbac.md)
- [`auth_runtime_spec.md`](../../prds/05_runtime/auth_runtime_spec.md) — auth flows spec (W5)
- [`authorization_matrix.md`](../../prds/04_authorization_privacy/authorization_matrix.md)
- Cursor: [`auth-security.mdc`](../../../.cursor/rules/auth-security.mdc), [`policy-packages.mdc`](../../../.cursor/rules/policy-packages.mdc)
