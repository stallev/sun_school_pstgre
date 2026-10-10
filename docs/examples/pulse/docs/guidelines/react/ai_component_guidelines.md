# React component guidelines — Pulse

**Stack:** Next.js **16.3.0** App Router, React 19, shadcn/ui, Warm Forest tokens  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Cursor rules:** **react-ui-components**, **react-one-component-per-file**, **ui-warm-forest-shadcn**

---

## 1. Server vs client

- **Default:** Server Component — no `'use client'`
- **Client:** hooks, events, browser APIs only
- New client modules: **`.client.tsx`** suffix for clarity

---

## 2. Props and exports

- Explicit **`interface Props`** or inline type; **no `React.FC`**
- Arrow components for features: `export const TrainerCard = (props: Props) => …`
- **One component per file** (except page/layout default exports); **target ≤ 140 lines** — split when larger
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

## 3. Styling

- **`cn()`** + **cva** for variants
- Semantic tokens from [`fitness-platform-design-system.md`](../../default_docs/fitness-platform-design-system.md)
- **Mobile-first** — base = mobile; `md:` / `lg:` expand (see **ui-mobile-first**, design system §2)
- **Prototype fidelity** — fonts, sizes, weights, colors from [`Fitness_Platform_Prototype_v1.html`](../../prototypes/Fitness_Platform_Prototype_v1.html) + design system (**ui-prototype-fidelity**)

---

## 4. shadcn/ui workflow

1. Search shadcn MCP / registry before custom primitives
2. Install to `components/ui/`
3. Tokenize with Warm Forest CSS variables in `globals.css`

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

**Catalog index:** `/design-system` (dev-only). Cursor rule: **ui-warm-forest-shadcn** §Design Lab catalog.

Routes stay thin — data in `src/data/**`, actions in `src/actions/**`.

---

## 7. Accessibility & semantic markup

**Cursor rule:** **ui-semantics-a11y** · **Guide:** [ai_semantics_a11y_guidelines.md](./ai_semantics_a11y_guidelines.md)  
**Target:** WCAG 2.1 Level AA

### Semantic HTML

- Landmarks: `main`, `nav`, `header`, `footer`; one `h1` per page
- Native controls: `button`, `a`, `label`+`input` — not `div onClick`
- Lists/tables: proper `ul`/`ol`/`table` for repeated data and admin grids

### A11y

- Keyboard navigation for dialogs/sheets (Radix/shadcn)
- Visible focus rings (`focus-visible:ring-ring`)
- `aria-label` on icon-only buttons; `aria-hidden` on decorative icons
- `aria-invalid` + `FieldError` on forms; `aria-busy` on mutations (**ui-mutation-pending**)
- Contrast AA in light and dark; touch targets ≥ 44px (**ui-mobile-first**)

**Reference:** lampto [`ai_component_guidelines.md`](../../examples/lampto/docs/guidelines/react/ai_component_guidelines.md) §8
