# React component guidelines — Pulse

**Stack:** Next.js **16.4** App Router, React 19, shadcn/ui, {{DESIGN_SYSTEM_NAME}} tokens  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Cursor rules:** **react-ui-components**, **react-one-component-per-file**, **ui-design-system-shadcn**

---

## 1. Server vs client

- **Default:** Server Component — no `'use client'`
- **Client:** hooks, events, browser APIs only
- New client modules: **`.client.tsx`** suffix for clarity
- **Heavy client deps** in shared `components/ui/*` → lazy-load per [ai_client_lazy_loading.md](../nextjs/ai_client_lazy_loading.md) (`next/dynamic`, interaction-gated panels)
- **Extract the interactive leaf, don't promote the whole page** — one interactive element (e.g. a like button) does not justify marking the entire page/route `'use client'`; extract only that element into its own small Client Component. Every client component adds to the hydration/JS bundle; static text/markup needs neither.
- **Fetch once on the server, pass down as props** — a Client Component fetching data client-side via `useEffect` for data the Server Component already had access to creates an avoidable client-side request waterfall.

---

## 2. Props and exports

- Explicit **`interface Props`** or inline type; **no `React.FC`**
- Arrow components for features: `export const TrainerCard = (props: Props) => …`
- **One component per file** (except page/layout default exports); **target = 140 lines** — split when larger
- Named exports; avoid deep `index.ts` re-export chains

---

## 2.1 Logic vs presentation

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Data | `src/data/**`, composition | Fetch, policy, domain |
| RSC shell | `page.tsx`, `*.server.tsx` | Guards + serializable props |
| Client | `*.client.tsx` | Mutations, events, hooks |
| Presentational | skeletons, cards, atoms | Props → JSX only |

**Forbidden:** same module fetches data **and** uses `useActionState`. Cursor rule: **react-logic-presentation**.

---

## 2.2 Shared components

- Before new JSX: open **Design Lab** `/design-system` and check the catalog in `components/atoms/`, `components/ui/`.
- Import product UI from `@/components/atoms` and `@/components/ui/*` only — **not** from `components/design-lab/` (showcase wrappers).
- Reuse on 2+ routes → extract shared component (named export, one file).
- New repeating primitive → add to catalog + Design Lab section before use in product screens.
- Routes stay thin — compose features, do not embed large UI trees.

Spec: [`design_system_lab_spec.md`](../../implementation/mvp/specs/design_system_lab_spec.md) §Product UI catalog contract.

---

## 2.3 Rendering: props, keys, and DOM

- **Destructure props with defaults in the function signature** (`({ variant = 'primary', ...props }: Props) => …`) instead of scattered `props.xxx || default` in the body — an explicit contract, and avoids `||` silently clobbering falsy values (`0`, `''`, `false`).
- **Early `return` per UI state** — separate `if (loading) return <Spinner />`, `if (error) return <ErrorState />`, `if (!items.length) return <EmptyState />` branches instead of nesting loading/error/empty/success into one ternary chain in JSX; each state stays independently readable and extensible.
- **Stable `key` from data** — `key={item.id}`, never array `index` on a reorderable/mutable list and never `Math.random()`. An unstable key makes React misattribute DOM nodes (state/focus/animation) on reorder/delete, or — with `Math.random()` — treats every item as new on every render, destroying all diffing benefit.
- **`key` as an intentional remount trigger** — when a component's logical identity changes but its type doesn't (e.g. `userId` changes but `<ProfileForm>` keeps stale field state), setting `key={userId}` is the sanctioned way to force unmount+remount instead of relying on prop-diffing an otherwise-unrelated instance.
- **Never mutate the real DOM directly** (`ref.current.innerHTML = ...`) outside React — drive all content through JSX/state; manual DOM changes desync React's virtual tree from the real one, and the next diff can silently revert or corrupt them.

---

## 3. Styling

- **`cn()`** + **cva** for variants
- Semantic tokens from [`{{INTERIM_DESIGN_SYSTEM_DOC}}`](../../default_docs/{{INTERIM_DESIGN_SYSTEM_DOC}}) (until UX-03)
- **Mobile-first** — base = mobile; `md:` / `lg:` expand (see **ui-mobile-first**, design system §2)
- **Prototype fidelity** — fonts, sizes, weights, colors from [`{{MAIN_PROTOTYPE_HTML}}`](../../prototypes/{{MAIN_PROTOTYPE_HTML}}) + design system (**ui-prototype-fidelity**)

---

## 4. shadcn/ui workflow

Primitives are **Base UI**. Cursor rule: **ui-design-system-shadcn**.

1. `shadcn init -b base` once; `components.json` `"style": "base-vega"`; dependency `@base-ui/react`
2. Search shadcn MCP / registry before custom primitives
3. Install to `components/ui/`
4. Tokenize with {{DESIGN_SYSTEM_NAME}} CSS variables in `globals.css`
5. Compose with the Base UI `render` prop (`<Button render={<Link href="…" />}>`), not `asChild`

---

## 5. React Compiler

When `reactCompiler: true`:

- Do **not** add `memo` / `useCallback` / `useMemo` without measured need
- Follow [Rules of React](https://react.dev/reference/rules) — violations disable optimization
- Перед завершением **фазы** — `npm run lint` из корня monorepo (все `packages/*` + `web`). Внутри UI-задачи в `apps/web` достаточно `npm run lint:web`.

---

## 6. Feature folder layout

```
components/
  ui/           # shadcn + tokenized primitives (Button, PulseCard, CustomLink, …)
  atoms/        # typography atoms — import via @/components/atoms
  shell/        # app chrome: TopBar, BottomNav, SideNav — see global_shell_spec
  design-lab/   # Design Lab showcase only — not for product import
  catalog/      # discovery molecules (TrainerCard)
  booking/      # booking-specific
  trainer/      # trainer dashboard
  admin/        # moderation tables
```

**Full inventory (paths, phases, FAANG UX, Context7, prototype anchors):** [`design_system_lab_spec.md`](../../implementation/mvp/specs/design_system_lab_spec.md) § Component catalog placement & Phase 2–3 inventory.

**Catalog index:** `/design-system` (dev-only). Cursor rule: **ui-design-system-shadcn** §Design Lab catalog.

Routes stay thin — data in `src/data/**`, actions in `src/actions/**`.

---

## 8. Client lazy loading (heavy deps)

Server Components and Suspense optimize **data streaming**, not **client JS download**. When a `'use client'` module imports heavy libraries (`react-day-picker`, `recharts`, editors):

1. Isolate the heavy UI in a dedicated client file.
2. Use **`next/dynamic`** from a parent `.client.tsx` — as low in the tree as possible.
3. For popovers/dialogs — mount lazy child only when `open === true`.
4. Provide sized `loading` skeletons (CLS < 0.1).

Full contract, patterns, and Pulse audit backlog: [ai_client_lazy_loading.md](../nextjs/ai_client_lazy_loading.md).  
Cursor rules: **react-ui-components**, **app-router-streaming-loading**.

---

## 9. Accessibility & semantic markup

**Cursor rule:** **ui-semantics-a11y** · **Guide:** [ai_semantics_a11y_guidelines.md](./ai_semantics_a11y_guidelines.md)  
**Target:** WCAG 2.1 Level AA

### Semantic HTML

- Landmarks: `main`, `nav`, `header`, `footer`; one `h1` per page
- Native controls: `button`, `a`, `label`+`input` — not `div onClick`
- Lists/tables: proper `ul`/`ol`/`table` for repeated data and admin grids

### A11y

- Keyboard navigation for dialogs/sheets (shadcn on Base UI)
- Visible focus rings (`focus-visible:ring-ring`)
- `aria-label` on icon-only buttons; `aria-hidden` on decorative icons
- `aria-invalid` + `FieldError` on forms; `aria-busy` on mutations (**ui-mutation-pending**)
- Contrast AA in light and dark; touch targets = 44px (**ui-mobile-first**)

**Reference:** Pulse snapshot [`ai_component_guidelines.md`](../../examples/pulse/docs/guidelines/react/ai_component_guidelines.md) §8
