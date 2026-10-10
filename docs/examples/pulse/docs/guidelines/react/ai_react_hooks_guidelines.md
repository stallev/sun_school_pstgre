# React hooks guidelines — Pulse

**Stack:** React 19, Next.js **16.2.6** App Router  
**Related:** [ai_form_handling_pattern.md](./ai_form_handling_pattern.md), [ai_optimistic_ui_pattern.md](./ai_optimistic_ui_pattern.md)

---

## 1. Rules of Hooks

- Only at top level — not in conditions/loops
- Client components only (`'use client'`)

---

## 2. Data fetching

- **Server Components** — async/await Prisma in `src/data/**` or colocated `.server.tsx`
- **Client** — avoid fetching protected data; use Server Actions or Route Handlers
- No `useEffect` for initial page data that RSC can load

---

## 3. Mutations

| Hook | Use when |
|------|----------|
| `useActionState` | Form + server validation state |
| `useFormStatus` | Pending in child submit inside same `<form>` |
| `useTransition` | Imperative submit, optimistic flows |
| `useOptimistic` | Toggle/list-append before server confirms |

Always pair mutations with **ui-mutation-pending** + **ui-toast-mutations**.

---

## 4. URL state

- Prefer **`nuqs`** or Next.js `searchParams` for filters (catalog, admin lists) when scaffolded
- Sync filter state with shareable URLs per client_flow

---

## 5. Custom hooks

- Place in `src/hooks/` — one concern per hook (`useBookingWizard`, `useMediaQuery`)
- **Naming:** `use` + PascalCase; file kebab-case (`use-booking-wizard.ts`)
- **`use` prefix only if the function calls Hooks** — otherwise plain `getX` / `formatX` in `@/lib/`
- Pure logic → `@/lib/` instead of hooks

Cursor rule: **react-naming-conventions**. React canon: [custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) (`/reactjs/react.dev` via Context7).

**Reference:** lampto [`ai_react_hooks_guidelines.md`](../../examples/lampto/docs/guidelines/react/ai_react_hooks_guidelines.md)
