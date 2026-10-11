---
description: useReducer / useContext / Zustand / Redux Toolkit — when to use which, selectors, SSR safety — apps/web
paths:
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/**/*.ts"
  - "apps/web/src/hooks/**"
---
# React state management (`apps/web`)

**Guide:** [ai_react_state_management_guidelines.md](docs/guidelines/react/ai_react_state_management_guidelines.md)
**Related:** **react-ui-components** §Hooks discipline, §State management

## Decision (MUST default to the top)

`useState` → `useReducer` (related state/transitions in one feature) → `useContext` (small, rarely-changing, shared by a subtree) → **Zustand** (cross-cutting client state, simple API) → **Redux Toolkit** (complex async orchestration, normalized entities). Server data belongs in Server Components / DAL — never a client store.

## `useReducer` / `useContext`

- One reducer per unrelated concern; action describes **what happened**, not the computed result; reducer stays pure (no mutation, no side effects).
- Wrap `useContext(X)` in a custom hook that throws on a missing Provider; split by domain (no mega-context); split `StateContext`/`DispatchContext` when dispatch-only consumers exist; always memoize Provider `value`.

## Zustand / Redux Toolkit

- **Select narrowly** — `useStore(s => s.count)` / `useSelector(s => s.cart.totalPrice)`, never destructure/select the whole store.
- Redux: one `createSlice` per domain, mutating syntax (Immer), `createAsyncThunk`/RTK Query for async — not manual `switch`/`useFetch`. Typed `useAppDispatch`/`useAppSelector`.
- Zustand: actions co-located with state; `get()` inside actions for current state (not closed-over values); curried `create<T>()((set, get) => ...)` when using `persist`/`devtools` middleware.

## SSR safety (Next.js App Router) — MUST

**Never a module-level store singleton that holds per-request/per-user data** — the server is shared across requests; a singleton leaks one user's state into another user's response. Use a store-per-request pattern (`useRef` inside a Provider, low-level `useStore(store, selector)` API). Client-only, non-sensitive global stores (theme/UI toggles) may stay a singleton **only inside Client Components**, never imported into server code.

Reference: Pulse (docs/examples/pulse) — no equivalent rule; this is new territory for the project.
