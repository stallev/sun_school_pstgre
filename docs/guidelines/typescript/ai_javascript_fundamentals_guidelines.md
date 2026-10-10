# JavaScript/TypeScript fundamentals — Pulse

**Stack:** Node.js (Next.js **16.4** runtime), TypeScript strict mode, npm workspaces monorepo  
**Related:** [ai_typescript_monorepo_guidelines.md](./ai_typescript_monorepo_guidelines.md) (package boundaries, mutation ADT — this doc does not repeat those)

Scope: general JS/TS language mechanics that TypeScript's type system does **not** catch at compile time, filtered to patterns that plausibly prevent a real bug in this stack. Not a JS tutorial — skip anything a strict-TS/React-hooks codebase already makes moot (e.g. classic `this`-binding confusion, which does not occur in hooks-only React code; see [ai_react_hooks_guidelines.md](../react/ai_react_hooks_guidelines.md)).

---

## 1. Closures

- **Encapsulate module-level init flags in a closure factory** (`once(fn)`) instead of a loose `let initialized = false` at module scope — a bare boolean is mutable state any other code in the module can accidentally read or reset; TS can't flag misuse of a plain `boolean`.
- **One closure instance per caller** for stateful factories (`debounce`, `throttle`) — don't share a single `debounce(fn)` instance's `timerId`/`lastCallTime` across multiple unrelated call sites; a shared timer silently cross-cancels or rate-limits calls that have nothing to do with each other. Same runtime bug, identical TS types either side — the type system won't catch it.
- **Extract repeated inline predicates into a closure-returning factory** (`byRole(role) => (user) => user.role === role`) instead of repeating the same literal predicate across multiple `.filter()`/`.find()` calls — keeps the check testable/composable and prevents literal drift.

---

## 2. `map` / `filter` / `reduce`

- **`reduce` always takes an explicit `initialValue`** — `arr.reduce((acc, x) => ..., initialValue)`, never the no-initial-value form. Without it, `reduce` throws on an empty array and silently uses the first element as the accumulator (wrong shape for anything but pure concatenation). TS infers the accumulator type from the array element type, not your intent — it will not flag this.
- **Never fire async work inside `.map()` without consuming the result** — `data.map(async (item) => await save(item))` returns an unconsumed `Promise<T>[]`; rejections are silently swallowed and nothing is actually awaited. Use `for...of` with `await` for sequential side effects, or `await Promise.all(arr.map(async fn))` for parallel async work. TS types the return correctly as `Promise<T>[]` — it will not warn that you forgot `Promise.all`.
- **`.map()` returns new objects, never mutates in place** (`return { ...item, x }`, not `item.x = x; return item`) — besides breaking the pure-transform contract, mutating and returning the same reference can make React's reconciliation skip a re-render it should have done (reference-equality check sees "no change").

---

## 3. Generators — narrow use case only

Skip generators/iterators for typical CRUD flows. The one concrete fit in this stack:

- **Stream large DB result sets in batches via an async generator** (`async function* streamBatches() { yield page }`, consumed with `for await (const batch of streamBatches())`) instead of loading an entire large query into memory before processing (`const all = await db.x.findMany(); all.filter(...).map(...)`). An unbounded `findMany()` on a large table is an OOM/latency risk that TypeScript gives no signal about — reach for this only when a DAL query genuinely has no practical page/limit bound.

---

## 4. Modules (ESM/CJS, tree-shaking)

- **Keep each npm workspace package uniformly ESM** (`"type": "module"`) — don't mix `require()`/`module.exports` into an ESM package or `import`/`export` into a CJS one. At the few real interop boundary points, use `createRequire(import.meta.url)` or dynamic `await import()`, not ad hoc syntax mixing — mixing throws `ReferenceError: require is not defined` or `SyntaxError: Cannot use import statement outside a module` at runtime, not at typecheck.
- **Set `"sideEffects": false`** (or an explicit list) in each workspace package's `package.json` — this is what actually licenses bundlers to tree-shake; without it, importing anything from a workspace package pulls in its entire module graph regardless of how clean individual exports look.
- **Prefer named exports over `import * as ns`** when consuming a package/barrel, and use native `await import('x')` (not just `next/dynamic`, which is React-component-specific — see [ai_client_lazy_loading.md](../nextjs/ai_client_lazy_loading.md)) to defer loading heavy server-side/CLI-side modules until actually needed.

---

## 5. TypeScript fundamentals (beyond monorepo boundaries)

- **Generics over `any`** for reusable helpers (`function first<T>(arr: T[]): T | undefined`, `apiFetch<T>(url: string): Promise<T>`) — `any` silently accepts a wrong-shape value (e.g. a typo'd field) that a generic-typed call catches at compile time. This is a common shortcut when scaffolding a new utility or fetch wrapper — resist it.
- **Derive DTOs/view-models from the source type** (`Partial<Omit<User, 'passwordHash'>>`, `Pick<User, 'id' | 'name'>`) instead of hand-writing a near-duplicate interface (`UpdateUserDTO`, `PublicUser`) — a manually duplicated shape silently drifts from the source type as the model evolves; a derived type updates automatically. Distinct from the `MutationResult<T>` discriminated-union ADT already covered in [ai_typescript_monorepo_guidelines.md](./ai_typescript_monorepo_guidelines.md) §4.

---

**Cursor rule:** **javascript-fundamentals**
