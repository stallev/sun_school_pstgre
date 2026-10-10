# TypeScript monorepo guidelines (Pulse — for AI agents)

**Audience:** AI agents generating Pulse codebase.  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Reference:** adapted from lampto [`ai_typescript_monorepo_guidelines.md`](../../examples/lampto/docs/guidelines/typescript/ai_typescript_monorepo_guidelines.md)

---

## 1. Monorepo typecheck contract

### 1.1 Problem we avoid

`apps/web` `tsc --noEmit` can pass while a workspace package fails in isolation. **Never assume web build = full monorepo type safety.**

### 1.2 Required before finishing a change (after scaffold)

```bash
npm run typecheck          # root — every workspace
npm run lint               # root — apps/web + all packages/*
npm run test:domain        # when touching @pulse/domain
```

Until workspaces exist, manually run `tsc --noEmit` in each touched package.

### 1.3 Agent rule

- Editing **`packages/**`** → run that package's isolated `tsc --noEmit`.
- No `@ts-ignore` without one-line justification.

---

## 2. Where types live

| Layer | Owns | Must not depend on |
|-------|------|---------------------|
| `@pulse/domain` | Pure domain literals, unions, ports, mutation ADT, shared Zod DTOs | `@pulse/db`, Next.js, `next-auth`, Prisma |
| `@pulse/db` | Prisma client, `$Enums`, repositories | `apps/web` |
| `@pulse/policy-server` | Policy inputs as **domain types** (`UserRole`, `PolicySessionContext`) | `next-auth` types, `redirect` / `notFound` |
| `@pulse/policy-edge` | Edge-safe path/JWT helpers | `@pulse/db`, `@pulse/policy-server` |
| `apps/web` | Auth.js module augmentation, UI props, mappers | — |

**Anti-pattern:** `packages/policy/server` importing `Session` from `next-auth`.

**Target pattern:**

```ts
export type UserRole = "client" | "trainer" | "admin";

export type PolicySessionContext = {
  userId: string;
  role: UserRole | undefined;
};
```

---

## 3. Domain literals

- Prisma enums in schema are **persistence** source.
- **`@pulse/domain`** exports canonical unions (`UserRole`, `BookingStatus`, `TrainerStatus`, …) and **named constant objects** (`USER_ROLE`, `AUTH_MUTATION_ERROR_CODES`, …).
- No inline `"pending"` / `"client"` / `"INVALID_CREDENTIALS"` at call sites — import constants or type guards.
- After whitelist check — **type guard** (`isUserRole`), not `as UserRole`.

---

## 4. Mutation result ADT

Use one discriminated union from `@pulse/domain`:

```ts
export type MutationOk<T = void> = T extends void ? { ok: true } : { ok: true; data: T };
export type MutationErr = { ok: false; code: MutationErrorCode; message?: string };
export type MutationResult<T = void> = MutationOk<T> | MutationErr;
```

**Error codes:** define in `@pulse/domain` (`AUTH_MUTATION_ERROR_CODES`, `MUTATION_ERROR_CODES`) — see **domain-literals-and-codes** Cursor Rule. Do not use bare `code: string` or inline SCREAMING_SNAKE literals in actions/DAL/UI.

Do not introduce new `{ ok: false; errorMessage: string }` variants.

---

## 5. Prisma Json

- JSON columns: Zod schema + typed override in `@pulse/db` when added.
- Avoid `as unknown as Prisma.InputJsonValue` without documented exception.

---

## 6. Related Cursor rules

- [`typescript-monorepo-types.mdc`](../../../.cursor/rules/typescript-monorepo-types.mdc)
- [`data-server-actions-and-api.mdc`](../../../.cursor/rules/data-server-actions-and-api.mdc)
- [`policy-packages.mdc`](../../../.cursor/rules/policy-packages.mdc)

---

*Follow [`ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md) §2.7 — guidelines are runtime instructions for agents.*
