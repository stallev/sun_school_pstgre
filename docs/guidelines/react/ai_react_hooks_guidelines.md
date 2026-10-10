# React hooks guidelines — Pulse

**Stack:** React 19, Next.js **16.4** App Router  
**Related:** [ai_form_handling_pattern.md](./ai_form_handling_pattern.md), [ai_optimistic_ui_pattern.md](./ai_optimistic_ui_pattern.md), [ai_react_state_management_guidelines.md](./ai_react_state_management_guidelines.md)

---

## 1. Rules of Hooks

- Only at **top level** — not inside conditions, loops, or nested callbacks; hook call order must stay stable across renders (linked-list of hook state under Fiber).
- Only from **React function components** or **other custom hooks** — never from plain JS functions, classes, or event handlers.
- Component body is a **pure render** — no `fetch`, `localStorage`, timers, or `console.log` directly in the render path; side effects live in `useEffect` or event handlers.
- Client components only (`'use client'`).

---

## 2. State discipline (`useState`)

- **Never mutate** state directly (`state.items.push(x); setState(state)`); always produce a new reference (`setItems(prev => [...prev, x])`).
- **Functional updates** (`setCount(prev => prev + 1)`) when next state depends on previous — avoids stale-closure bugs from event handlers / async callbacks.
- **Derived values are not state** — compute in render (`const fullName = \`${first} ${last}\``) instead of `useState` + `useEffect` sync; use `useMemo` only for measurably expensive derivations.
- **Lazy initializer** for expensive initial state: `useState(() => expensiveComputation())`, not `useState(expensiveComputation())`.
- **Split independent fields** into separate `useState` calls instead of one object requiring a spread on every setter (`setForm(prev => ({...prev, field}))` on every field); keep object state only when fields are logically coupled (e.g. `{x, y}`).

---

## 3. Data fetching

- **Server Components** — async/await Prisma in `src/data/**` or colocated `.server.tsx`
- **Client** — avoid fetching protected data; use Server Actions or Route Handlers
- No `useEffect` for initial page data that RSC can load

---

## 4. Effects discipline (`useEffect`)

- **Never pass an `async` function directly** to `useEffect` (`useEffect(async () => {...}, [])` breaks cleanup + triggers a React warning) — declare the async function *inside* the effect and invoke it.
- **List every dependency the effect closes over**; missing deps cause stale-closure bugs (effect reads an outdated prop/state value).
- **Always clean up** subscriptions, timers, and in-flight requests that outlive the component/deps change — `return () => { ... }`. For fetch specifically, prefer **`AbortController`** over an `isMounted` flag; full pattern: [`ai_data_fetching_patterns.md`](../nextjs/ai_data_fetching_patterns.md) §4.
- If the effect only computes a value from existing props/state — it does not belong in `useEffect`; see §2 derived values.
- **One concern per effect** — don't bundle unrelated side effects (e.g. `document.title` update + `setInterval` polling) under one dependency array; an unrelated concern's dep change shouldn't tear down/restart a concern that didn't change.

---

## 5. Refs (`useRef`)

- Use for **mutable values that must not trigger a re-render**: render counters, previous-prop tracking, timer/subscription handles kept for cleanup, DOM node references.
- **Do not use `useState`** for values the UI never reads — that adds an unnecessary render on every update.
- **Ref collections** (e.g. `Record<string, HTMLInputElement | null>`) belong in `useRef`, not `useState` — mutating which nodes are tracked doesn't affect visual output.
- **"Latest ref" pattern** — sync a ref to the newest prop/state each render (`latestValue.current = value`) so a long-lived effect/subscription with an empty deps array can read fresh data without resubscribing or going stale.
- **`useImperativeHandle`** — when a child must expose an API to a parent via ref, expose a **minimal method contract** (e.g. `{ focus, clear }`), never the raw DOM node/element — the parent should not be able to mutate internals it doesn't own.

---

## 6. Async UI state — discriminated unions

For any hand-rolled loading/error/success state (rare — prefer `useActionState` for mutations, RSC/Suspense for reads), model it as a **discriminated union**, not independent booleans (`isLoading` + `isError` + `data` can produce impossible combinations):

```typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
```

---

## 7. `use()` (React 19)

- Not a classic hook — can be called conditionally, has no internal state.
- The **Promise must be stable** across renders (created outside the component, in a parent, or memoized) — a new Promise per render re-triggers Suspense indefinitely. Full pattern: [`ai_data_fetching_patterns.md`](../nextjs/ai_data_fetching_patterns.md) §4.
- Wrap the consumer in **`<Suspense>` + an `ErrorBoundary`** — a rejected Promise otherwise crashes the tree.

---

## 8. Mutations

| Hook | Use when |
|------|----------|
| `useActionState` | Form + server validation state |
| `useFormStatus` | Pending in child submit inside same `<form>` |
| `useTransition` | Imperative submit, optimistic flows |
| `useOptimistic` | Toggle/list-append before server confirms |

Always pair mutations with **ui-mutation-pending** + **ui-toast-mutations**.

- **`useActionState`** — initial/returned state is a **structured object** (`{ success, errors, data }`), never a bare primitive (e.g. just an error string) — forms accrue fields over time; a primitive forces a breaking signature change later.
- **`useOptimistic`** — only clear/reset input on **confirmed** success; on rollback, restore the input and show an explicit error toast. Clearing input immediately on submit is a silent data-loss bug, not just a visual glitch, if the server call fails.

---

## 9. URL state

- Prefer **`nuqs`** or Next.js `searchParams` for filters (catalog, admin lists) when scaffolded
- Sync filter state with shareable URLs per client_flow

---

## 10. Custom hooks

- Place in `src/hooks/` — one concern per hook (`useBookingWizard`, `useMediaQuery`)
- **Naming:** `use` + PascalCase; file kebab-case (`use-booking-wizard.ts`)
- **`use` prefix only if the function calls Hooks** — otherwise plain `getX` / `formatX` in `@/lib/`
- Pure logic → `@/lib/` instead of hooks
- **One concern per hook** — no "god hooks" bundling unrelated logic (fetch + theme + notifications in one `usePageLogic`); split so each hook is independently testable/reusable.
- **Return shape:** named object once a hook returns **3+ values** (`{ value, setValue, isValid, error }`); keep the `[value, setValue]` array/tuple form only for pairs, mirroring `useState`. Array order beyond 2 is easy to mis-destructure.
- **A hook returns data/logic, never JSX** — the calling component decides what/how to render; this is what lets the same hook (e.g. `useCountdown`) back both a text timer and a progress bar.

Cursor rule: **react-naming-conventions**. React canon: [custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) (`/reactjs/react.dev` via Context7).

---

## 11. Memoization (`useMemo` / `useCallback` / `React.memo`)

- **Measure before memoizing** — the memo cache/comparison has its own cost; only add after confirming a real cost via Profiler, not by default on every computation/handler.
- **`useCallback` only pays off** when the callback is passed to a `React.memo`-wrapped child or used as a dependency elsewhere — referential stability alone gives nothing against plain DOM elements or non-memoized children.
- **Memoize Context Provider `value`** — a fresh object/array literal each render (`value={{ user, theme }}`) re-renders **every** consumer on **any** field change, regardless of which one; wrap in `useMemo`.
- `React.memo` is a shallow (`Object.is`) comparison — it's void unless memoization is consistent at every level of the prop chain (parent creating props **and** child wrapped in `memo`).
- With React Compiler (`reactCompiler: true`) — do not hand-add `memo`/`useCallback`/`useMemo` without a profiled need; see §React Compiler in **react-ui-components**.

---

## 12. `useLayoutEffect` / `useInsertionEffect`

- **Default to `useEffect`**; switch to `useLayoutEffect` only when you can point to a measurable visual flash/jump (layout measurement before paint, e.g. tooltip/popover positioning) — it blocks paint synchronously, unlike `useEffect`.
- No-op during Next.js SSR (React warns) — client-only, same as any hook requiring `'use client'`.
- Keep `useLayoutEffect` bodies to cheap DOM reads (`getBoundingClientRect`); heavy computation inside directly delays the next paint.
- **`useInsertionEffect`** is a narrow primitive for CSS-in-JS **library authors** (inject `<style>` before layout effects measure) — not application code; use Tailwind/CSS Modules instead.

---

## 13. Concurrent hooks (`useTransition` / `useDeferredValue`)

- Reserve `startTransition` for genuinely **expensive** re-renders (large list re-filter, heavy derived computation) — wrapping trivial updates (`setIsModalOpen`) adds no value.
- Keep the triggering input always interactive while `isPending` — show pending state as **non-blocking** feedback (opacity/spinner), never disable the input; blocking defeats the purpose of a transition (the urgent update must stay responsive).
- Don't wrap the controlled input's own value echo in `startTransition` — only defer the derived expensive work computed from it; deferring the echo itself makes typing feel laggy.
- Not a debounce substitute — transitions prioritize/interrupt work, they don't delay-by-timer; don't conflate the two.

---

## 14. `useId` / `useSyncExternalStore` / `useDebugValue`

- **`useId`** for any SSR-rendered `id`/`aria-*` attribute (form fields, `aria-describedby`) — `Math.random()` or a module-level counter produces a hydration mismatch (server/client IDs differ); `useId` guarantees identical output.
- `useId` is **not** a list `key` — use data-derived `item.id` for list identity; `useId` is only for stable non-data DOM/aria IDs.
- **`useSyncExternalStore(subscribe, getSnapshot)`** for subscribing to any external (non-React) source — browser APIs, `matchMedia`, WebSocket, third-party stores — instead of hand-rolled `useEffect` + `useState`; prevents "tearing" (inconsistent values across components) under concurrent rendering that the naive approach can't guarantee. State libraries (Zustand, Redux bindings) build on this — see [`ai_react_state_management_guidelines.md`](./ai_react_state_management_guidelines.md).
- `getSnapshot` **must return a referentially stable value** when the underlying data hasn't changed (cache and compare) — a new object every call causes an infinite re-render loop.
- `useDebugValue` — only worth adding inside widely-reused/complex custom hooks with opaque internal state; skip for one-off local hooks.

---

## 15. Hooks antipatterns (beyond §1 Rules of Hooks)

`eslint-plugin-react-hooks` (rules-of-hooks + exhaustive-deps) catches the mechanical violations; these are the architectural ones it can't:

- **Stale fetch race** — `useEffect(() => { fetch(...).then(setData) }, [id])` with no cancellation lets a fast `id` change let an *older* response overwrite a *newer* one; track a cancelled flag or `AbortController` and ignore stale responses.
- **Fully derivable value kept as its own `useState` and synced via `useEffect`** (e.g. a running `totalRating` recomputed from `items`) — a second source of truth that can desync from the original; compute inline (optionally `useMemo`) in the render body instead.
- **Inline object/array/function literal as an effect dependency** (`useEffect(() => {...}, [{ inStock: true }])`) — a new reference every render defeats `Object.is` comparison and reruns the effect every render regardless of actual change; construct it inside the effect or memoize it outside.
- **Undocumented `eslint-disable` on `exhaustive-deps`** to keep a stale callback out of deps — reads as a forgotten dependency to the next reviewer. Use the §5 "latest ref" pattern instead, or leave a comment explaining exactly why the dep is intentionally omitted.

---

**Reference:** Pulse snapshot [`ai_react_hooks_guidelines.md`](../../examples/pulse/docs/guidelines/react/ai_react_hooks_guidelines.md)
