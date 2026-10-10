# Utility functions — Pulse (`apps/web`)

**Pure** helpers: no React hooks, no `'use client'`, no implicit browser globals unless explicitly browser-only.

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Types:** [`ai_typescript_monorepo_guidelines.md`](../typescript/ai_typescript_monorepo_guidelines.md)  
**Cursor rule:** **react-ui-components**

---

## 1. What belongs here

| Include | Exclude |
|---------|---------|
| String/date formatting, slugify | Data fetching tied to React |
| `cn()` class merging | Hooks |
| Simple validation | React context/state |
| DTO → view mappers | Impure singletons |

---

## 2. Naming (§2.1)

- **Meaningful names** — `trainerProfileId`, not `data`
- **Loop counters** — `i`, `j`, `k` OK for indices
- **Variables / functions** — **camelCase** (`isSubmitting`, `handleSubmit`)
- **Booleans** — `is*`, `has*`, `can*`, `should*`
- **React components** — **PascalCase**; file name matches export
- **Module constants** — **SCREAMING_SNAKE_CASE** (`PRODUCT_TOAST_DURATION_MS`)

Cursor rule: **react-naming-conventions**.

---

## 3. Domain literals (§2.2)

No inline **`"trainer"`**, **`"pending"`**, **`"confirmed"`** at call sites.

- **Declare once** in `@/lib/...` or import from **`@pulse/domain`**
- After parsing untrusted strings — **type guards**, not `as UserRole`
- **User-visible copy** → `@/lib/messages` ([copy_and_messages.md](./copy_and_messages.md))

```ts
// Avoid
if (status === 'pending') { … }

// Prefer
import { BOOKING_STATUS } from '@pulse/domain'
if (status === BOOKING_STATUS.PENDING) { … }
```

---

## 4. `cn()` and dates

- **`cn`** from `@/lib/utils` (`clsx` + `tailwind-merge`)
- **`date-fns`** — import only needed functions; pass locale explicitly
- Booking display: respect **`TrainerProfile.timezone`**

---

## 5. File placement

`src/lib/` grouped by domain: `lib/booking/`, `lib/format.ts`, `lib/validation/`.

**Reference:** lampto [`ai_react_utilities_guidelines.md`](../../examples/lampto/docs/guidelines/react/ai_react_utilities_guidelines.md)
