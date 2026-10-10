# Guidelines

Нормы реализации — **этот snapshot** под Vercel, **Next.js 16.3.0** и Pulse design system (Warm Forest).

**Methodology (канон):** [`docs/meta/ai_first_project_methodology.md`](../meta/ai_first_project_methodology.md) — §2.7 Guidelines, §2.4 Cursor Rules.

## Available

| Area | Index |
|------|--------|
| TypeScript | [`typescript/README.md`](typescript/README.md) |
| Next.js | [`nextjs/README.md`](nextjs/README.md) |
| React | [`react/README.md`](react/README.md) |
| Auth | [`auth/ai_auth_implementation_guide.md`](auth/ai_auth_implementation_guide.md) |
| Typography | [`typography_text_guidelines.md`](typography_text_guidelines.md) |
| Visual identity (canon) | [`../design/visual_identity_contract.md`](../design/visual_identity_contract.md) |
| **UI component catalog (Design Lab)** | [`../implementation/mvp/specs/design_system_lab_spec.md`](../implementation/mvp/specs/design_system_lab_spec.md) — `/design-system` |
| UX interaction & style (canon) | [`../design/interaction_design_contract.md`](../design/interaction_design_contract.md), [`ui_states_contract.md`](../design/ui_states_contract.md), [`styleguide.md`](../design/styleguide.md) |
| Accessibility (canon) | [`../design/accessibility_requirements.md`](../design/accessibility_requirements.md) |
| **Incidents (mitigation patterns)** | [`../incidents/`](../incidents/) — iOS Safari Server Actions |

## Cursor rules (`.cursor/rules/`)

| Rule | Scope |
|------|--------|
| `pulse-project-context.mdc` | Always applied — stack, invariants |
| `product-docs-alignment.mdc` | Always applied — doc sync on behavior change |
| `typescript-monorepo-types.mdc` | Always applied — monorepo types |
| `domain-literals-and-codes.mdc` | Always applied — mutation codes, domain literals |
| `ai-dry-deduplication.mdc` | Always applied — DRY for agents |
| `data-server-actions-and-api.mdc` | DAL, Actions vs Route Handlers |
| `ios-safari-mutation-transport.mdc` | iOS Safari `Load failed` — Class A/B dual transport |
| `policy-packages.mdc` | `@pulse/policy-*` boundaries |
| `auth-security.mdc` | Auth.js, defense in depth |
| `nextjs-vercel-app-router.mdc` | Next.js **16.3.0** + Vercel + **`proxy.ts`** + Instant Navigations |
| `app-router-streaming-loading.mdc` | Suspense, `loading.tsx`, page performance (§4–§18) |
| `s3-file-asset-uploads.mdc` | FileAsset + AWS S3 |
| `admin-forms-layout.mdc` | Admin forms layout |
| `patterns-tables-dnd.mdc` | Responsive tables |
| `react-ui-components.mdc` | RSC/client, components |
| `react-one-component-per-file.mdc` | One component; ≤140 lines |
| `react-logic-presentation.mdc` | Logic vs presentation; shared UI |
| `react-naming-conventions.mdc` | Naming best practices |
| `ui-warm-forest-shadcn.mdc` | Design tokens, shadcn |
| `ui-mobile-first.mdc` | Mobile-first responsive |
| `ui-prototype-fidelity.mdc` | Prototype visual parity |
| `ui-semantics-a11y.mdc` | Semantic markup, WCAG 2.1 AA |
| `ui-toast-mutations.mdc` | Sonner after mutations |
| `ui-mutation-pending.mdc` | Busy/pending controls |
| `ui-optimistic-mutations.mdc` | `useOptimistic` toggles |
| `ui-messages-and-copy.mdc` | `@/lib/messages` |
| `ui-icons-lucide.mdc` | lucide-react icons |

## Snapshot (self-contained)

Этот каталог `docs/guidelines/` внутри Pulse snapshot — **канон для изучения Pulse**, не указание следовать отсутствующему дереву.

Оставшиеся упоминания «lampto» в глубоких файлах — provenance. **Не** ходить по `docs/examples/lampto/**`.

Для **нового** продукта: корневые Cursor Rules и `guidelines/` boilerplate override этот snapshot — [`pulse_project_reference.md`](../../../../../docs/reference/pulse_project_reference.md).
