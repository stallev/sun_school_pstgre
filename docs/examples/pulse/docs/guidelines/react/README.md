# React guidelines — Pulse

Patterns for **Next.js 16.3.0 App Router**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, **sonner**.

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Design system:** [`fitness-platform-design-system.md`](../../default_docs/fitness-platform-design-system.md)  
**Typography:** [`typography_text_guidelines.md`](../typography_text_guidelines.md)  
**Reference:** lampto [`docs/examples/lampto/docs/guidelines/react/`](../../examples/lampto/docs/guidelines/react/)

---

## Stack (target)

| Area | Packages |
|------|----------|
| Framework | `next` **16.3.0** (pinned), `react` / `react-dom` 19.x |
| Styling | `tailwindcss` 4.x, Warm Forest tokens |
| UI | shadcn/ui, `lucide-react`, `next-themes`, `sonner` |
| Dates | `date-fns`; timezone from **`TrainerProfile.timezone`** |

---

## Documents

| Document | Topic |
|----------|--------|
| [copy_and_messages.md](./copy_and_messages.md) | `@/lib/messages`, i18n-ready copy |
| [ai_form_handling_pattern.md](./ai_form_handling_pattern.md) | Forms, Server Actions, busy UI §4, iOS Safari §7 |
| [ai_optimistic_ui_pattern.md](./ai_optimistic_ui_pattern.md) | Wishlist, service toggle |
| [ai_react_hooks_guidelines.md](./ai_react_hooks_guidelines.md) | Hooks for mutations/data |
| [ai_react_utilities_guidelines.md](./ai_react_utilities_guidelines.md) | Pure helpers, no magic strings |
| [ai_component_guidelines.md](./ai_component_guidelines.md) | RSC/client, shadcn workflow |
| [ai_semantics_a11y_guidelines.md](./ai_semantics_a11y_guidelines.md) | Semantic HTML, WCAG 2.1 AA |
| [ai_responsive_table_guidelines.md](./ai_responsive_table_guidelines.md) | Admin tables, mobile cards |
| [TypeScript monorepo](../typescript/ai_typescript_monorepo_guidelines.md) | Cross-package types |

**UX contracts (product canon):** [`interaction_design_contract.md`](../../design/interaction_design_contract.md), [`ui_states_contract.md`](../../design/ui_states_contract.md), [`forms_and_validation_ux.md`](../../design/forms_and_validation_ux.md), [`content_and_microcopy_contract.md`](../../design/content_and_microcopy_contract.md) — enforced via Cursor Rules above.

---

## Principles

1. **Types** — explicit props; avoid `React.FC`.
2. **Domain literals** — `@pulse/domain` / `@/lib/...`; no magic strings.
3. **Boundaries** — `'use client'` only for interactivity/hooks; logic/presentation split (**react-logic-presentation**).
4. **Feedback** — toast + pending UI for mutations; optimistic for toggles.
5. **Accessibility** — semantic HTML, WCAG 2.1 AA, keyboard + screen reader names (**ui-semantics-a11y**).
6. **Responsive** — **mobile-first** (390px acceptance); bottom nav `< md`, sidebar `≥ md` (**ui-mobile-first**).
7. **Visual fidelity** — typography, colors, spacing from prototype + design system (**ui-prototype-fidelity**).
8. **Reuse** — maximize shared components; DRY + SOLID-SRP (**ai-dry-deduplication**).
9. **Icons** — **`lucide-react`** only for UI glyphs (**ui-icons-lucide**); tree-shake per-icon imports.
10. **File size** — one component per file; **≤ 140 lines** target for feature TSX.

---

## User flow references

- Client: [`client_flow.md`](../../prds/01_product_scope/user_flows/users_mvp/client_flow.md)
- Trainer: [`trainer_flow.md`](../../prds/01_product_scope/user_flows/users_mvp/trainer_flow.md)
- Admin: [`admin_flow.md`](../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md)

---

## Cursor rules

| Rule | Topic |
|------|--------|
| `react-ui-components.mdc` | Components, RSC boundaries |
| `react-one-component-per-file.mdc` | One component; ≤140 lines |
| `react-logic-presentation.mdc` | Logic vs UI; shared components |
| `react-naming-conventions.mdc` | Components, hooks, utils naming |
| `ui-warm-forest-shadcn.mdc` | Tokens, states |
| `ui-mobile-first.mdc` | Mobile-first responsive |
| `ui-prototype-fidelity.mdc` | Prototype typography/colors |
| `ui-semantics-a11y.mdc` | Semantic HTML, WCAG 2.1 AA |
| `ui-toast-mutations.mdc` | Sonner success/error |
| `ui-mutation-pending.mdc` | Busy controls |
| `ui-optimistic-mutations.mdc` | `useOptimistic` |
| `ios-safari-mutation-transport.mdc` | iOS Safari `Load failed` — critical forms |
| `ui-messages-and-copy.mdc` | Centralized copy |
| `ui-icons-lucide.mdc` | Icons |

---

## External references

- [React](https://react.dev)
- [Next.js 16 docs](https://nextjs.org/docs) — verify via Context7 `/vercel/next.js`; runtime canon: [ADR-002](../../prds/07_governance/adr_002_next162_vercel_runtime_policy.md)
