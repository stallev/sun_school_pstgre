# React guidelines — Sunday School

Patterns for **Next.js 16.4 App Router**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, **sonner**.

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Design system:** [`sunday_school_prototype.html`](../../prototypes/sunday_school_prototype.html)  
**Typography:** [`typography_text_guidelines.md`](../typography_text_guidelines.md)  
**Reference:** Pulse [`docs/examples/pulse/docs/guidelines/react/`](../../examples/pulse/docs/guidelines/react/) — **Guidelines текущего проекта override Pulse reference code** ([`pulse_project_reference.md`](../../reference/pulse_project_reference.md)).

---

## Stack (target)

| Area | Packages |
|------|----------|
| Framework | `next` **16.4** (pinned), `react` / `react-dom` 19.x |
| Styling | `tailwindcss` 4.x, Slate Cobalt tokens |
| UI | shadcn/ui (Base UI), `lucide-react`, `sonner` (no dark mode: `next-themes` is not used — UX-03) |
| Dates | `date-fns`; time zone = **school time zone** ([ADR-004](../../prds/07_governance/adr_004_timezone_scheduling_model.md)) |

---

## Documents

| Document | Topic |
|----------|--------|
| [copy_and_messages.md](./copy_and_messages.md) | `@/lib/messages`, i18n-ready copy, dictionary slices |
| [ai_form_handling_pattern.md](./ai_form_handling_pattern.md) | Forms, Server Actions, busy UI §4, iOS Safari §7 |
| [ai_optimistic_ui_pattern.md](./ai_optimistic_ui_pattern.md) | Optimistic toggles |
| [ai_react_hooks_guidelines.md](./ai_react_hooks_guidelines.md) | Hooks for mutations/data, memoization, concurrent/advanced hooks |
| [ai_react_state_management_guidelines.md](./ai_react_state_management_guidelines.md) | useReducer/useContext/Zustand/Redux Toolkit — when to use which, SSR safety |
| [ai_react_utilities_guidelines.md](./ai_react_utilities_guidelines.md) | Pure helpers, no magic strings |
| [ai_component_guidelines.md](./ai_component_guidelines.md) | RSC/client, shadcn workflow |
| [ai_client_lazy_loading.md](../nextjs/ai_client_lazy_loading.md) | `next/dynamic`, heavy client bundles |
| [ai_semantics_a11y_guidelines.md](./ai_semantics_a11y_guidelines.md) | Semantic HTML, WCAG 2.1 AA, PageSpeed a11y (ARIA + contrast) |
| [ai_browser_rendering_performance.md](./ai_browser_rendering_performance.md) | Reflow/repaint, GPU animations, layout thrashing |
| [ai_responsive_table_guidelines.md](./ai_responsive_table_guidelines.md) | Admin tables, mobile cards |
| [TypeScript monorepo](../typescript/ai_typescript_monorepo_guidelines.md) | Cross-package types |

**UX contracts (product canon):** [`ui_states_contract.md`](../../design/ui_states_contract.md), [`forms_and_validation_ux.md`](../../design/forms_and_validation_ux.md), [`responsive_navigation_contract.md`](../../design/responsive_navigation_contract.md), [`visual_identity_contract.md`](../../design/visual_identity_contract.md) — enforced via Cursor Rules below (T2 rules are activated in P6).

---

## Principles

1. **Types** — explicit props; avoid `React.FC`.
2. **Domain literals** — `@sunschool/domain` / `@/lib/...`; no magic strings.
3. **Boundaries** — `'use client'` only for interactivity/hooks; logic/presentation split (**react-logic-presentation**).
4. **Feedback** — toast + pending UI for mutations; optimistic for toggles.
5. **Accessibility** — semantic HTML, WCAG 2.1 AA, keyboard + screen reader names (**ui-semantics-a11y**).
6. **Responsive** — **mobile-first** (390px acceptance); bottom nav `< md`, sidebar `= md` (**ui-mobile-first**).
7. **Visual fidelity** — typography, colors, spacing from prototype + design system (**ui-prototype-fidelity**).
8. **Reuse** — maximize shared components; DRY + SOLID-SRP (**ai-dry-deduplication**).
9. **Icons** — **`lucide-react`** only for UI glyphs (**ui-icons-lucide**); tree-shake per-icon imports.
10. **File size** — one component per file; **= 140 lines** target for feature TSX.

---

## User flow references

- Teacher: [`teacher_flow.md`](../../prds/01_product_scope/user_flows/users_mvp/teacher_flow.md)
- Admin: [`admin_flow.md`](../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md)

---

## Cursor rules

| Rule | Topic |
|------|--------|
| `react-ui-components.mdc` | Components, RSC boundaries |
| `react-one-component-per-file.mdc` | One component; =140 lines |
| `react-logic-presentation.mdc` | Logic vs UI; shared components |
| `react-naming-conventions.mdc` | Components, hooks, utils naming |
| `react-state-management.mdc` | useReducer/useContext/Zustand/Redux Toolkit, SSR safety |
| `ui-design-system-shadcn.mdc` | Tokens, states |
| `ui-mobile-first.mdc` | Mobile-first responsive |
| `ui-prototype-fidelity.mdc` | Prototype typography/colors |
| `ui-semantics-a11y.mdc` | Semantic HTML, WCAG 2.1 AA |
| `ui-animation-performance.mdc` | GPU animations, no layout thrashing |
| `ui-toast-mutations.mdc` | Sonner success/error |
| `ui-mutation-pending.mdc` | Busy controls |
| `ui-optimistic-mutations.mdc` | `useOptimistic` |
| `ios-safari-mutation-transport.mdc` | iOS Safari `Load failed` — critical forms |
| `ui-messages-and-copy.mdc` | Centralized copy |
| `ui-messages-bundle-splitting.mdc` | Page-type dictionary slices in the client bundle |
| `ui-icons-lucide.mdc` | Icons |

---

## External references

- [React](https://react.dev)
- [Next.js 16 docs](https://nextjs.org/docs) — verify via Context7 `/vercel/next.js`; runtime canon: [ADR-002](../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md)
