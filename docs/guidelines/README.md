# Guidelines

Нормы реализации — адаптированы из Pulse reference (fitapp) под Vercel, **Next.js 16.4** и design system проекта (Warm Forest).

**Methodology (канон):** [`docs/meta/ai_first_project_methodology.md`](../meta/ai_first_project_methodology.md) — §2.7 Guidelines, §2.4 Cursor Rules.

## Приоритет источников (для агентов)

Полный канонический список — [`.cursor/rules/tiers/t0-always/project-context.template.mdc`](../../.cursor/rules/tiers/t0-always/project-context.template.mdc) § Source-of-truth order (после bootstrap: `project-context.mdc`). Не дублировать список здесь; кратко: Cursor Rules → … → Guidelines (`guidelines/`) → prototype. Над Pulse snapshot всегда выигрывают корневые Rules **и** Guidelines.

См. [`docs/reference/pulse_project_reference.md`](../reference/pulse_project_reference.md).

## Available

| Area | Index |
|------|--------|
| TypeScript | [`typescript/README.md`](typescript/README.md) |
| Next.js | [`nextjs/README.md`](nextjs/README.md) — incl. [`ai_s3_file_upload_guidelines.md`](nextjs/ai_s3_file_upload_guidelines.md), lab PSI [`ai_psi_lab_testing.md`](nextjs/ai_psi_lab_testing.md) |
| **Lab PSI (portable)** | [`psi-lab-testing.md`](psi-lab-testing.md) — deployed origin via REST `runPagespeed`; not `next-dev-loop` |
| **Code review protocol** | [`ai_code_review_protocol.md`](ai_code_review_protocol.md) — problem → expected shape → diff; subagent prompt. WHEN/levels/budget: rule `agent-code-review-subagent.mdc`. Не Bugbot. Не заменяет T3-субагента `reviewer`. |
| **Маршрутизация моделей** | [`../meta/ai_agent_model_routing.md`](../meta/ai_agent_model_routing.md) — task tier T0–T3, субагенты, гигиена токенов; runtime: `model-routing.mdc` |
| React | [`react/README.md`](react/README.md) |
| Auth | [`auth/ai_auth_implementation_guide.md`](auth/ai_auth_implementation_guide.md) |
| Typography | [`typography_text_guidelines.md`](typography_text_guidelines.md) |
| Visual identity (canon) | [`../design/visual_identity_contract.md`](../design/visual_identity_contract.md) |
| **UI component catalog (Design Lab)** | [`../implementation/mvp/specs/design_system_lab_spec.md`](../implementation/mvp/specs/design_system_lab_spec.md) — `/design-system` |
| UX interaction & style (canon) | [`../design/interaction_design_contract.md`](../design/interaction_design_contract.md), [`ui_states_contract.md`](../design/ui_states_contract.md), [`styleguide.md`](../design/styleguide.md) |
| Accessibility (canon) | [`../design/accessibility_requirements.md`](../design/accessibility_requirements.md) |
| Security (XSS/CSRF/CSP) | [`security/README.md`](security/README.md) |
| Testing (Vitest / Playwright) | [`testing/ai_testing_guidelines.md`](testing/ai_testing_guidelines.md) — объём по профилю качества D4 / D5 / D7 |
| **General deep dives** | [`../general/`](../general/) |
| **UI/UX agent ops** | [`../general/ai_agent_ui_ux_guideline.md`](../general/ai_agent_ui_ux_guideline.md) |
| **Incidents (mitigation patterns)** | [`../incidents/`](../incidents/) — iOS Safari Server Actions |

## Cursor rules (`.cursor/rules/`)

| Rule | Scope |
|------|--------|
| `project-context.mdc` | Always applied — stack, invariants |
| `model-routing.mdc` | Always applied — task tier T0–T3, субагенты, гигиена токенов; канон: [`../meta/ai_agent_model_routing.md`](../meta/ai_agent_model_routing.md) |
| `product-docs-alignment.mdc` | Always applied — doc sync on behavior change |
| `typescript-monorepo-types.mdc` | Always applied — monorepo types |
| `domain-literals-and-codes.mdc` | Always applied — mutation codes, domain literals |
| `ai-dry-deduplication.mdc` | Always applied — DRY for agents |
| `data-server-actions-and-api.mdc` | DAL, Actions vs Route Handlers |
| `javascript-fundamentals.mdc` | Closures, map/filter/reduce, generators, ESM modules, TS generics |
| `ios-safari-mutation-transport.mdc` | iOS Safari `Load failed` — Class A/B dual transport |
| `policy-packages.mdc` | `@sunschool/policy-*` boundaries |
| `auth-security.mdc` | Auth.js, defense in depth |
| `security-xss-csrf.mdc` | XSS, CSRF, CSP, DOMPurify, Origin checks |
| `ui-animation-performance.mdc` | GPU animations, layout thrashing, will-change |
| `nextjs-vercel-app-router.mdc` | Next.js **16.4** + Vercel + **`proxy.ts`** + Instant Navigations |
| `app-router-streaming-loading.mdc` | Suspense, `loading.tsx`, page performance (§4–§18) |
| `s3-file-asset-uploads.mdc` | FileAsset + AWS S3 |
| `admin-forms-layout.mdc` | Admin forms layout |
| `patterns-tables-dnd.mdc` | Responsive tables |
| `react-ui-components.mdc` | RSC/client, components |
| `react-one-component-per-file.mdc` | One component; ≤140 lines |
| `react-logic-presentation.mdc` | Logic vs presentation; shared UI |
| `react-naming-conventions.mdc` | Naming best practices |
| `react-state-management.mdc` | useReducer/useContext/Zustand/Redux Toolkit, SSR safety |
| `ui-design-system-shadcn.mdc` | Design tokens, shadcn |
| `ui-mobile-first.mdc` | Mobile-first responsive |
| `ui-prototype-fidelity.mdc` | Prototype visual parity |
| `ui-semantics-a11y.mdc` | Semantic markup, WCAG 2.1 AA |
| `ui-toast-mutations.mdc` | Sonner after mutations |
| `ui-mutation-pending.mdc` | Busy/pending controls |
| `ui-optimistic-mutations.mdc` | `useOptimistic` toggles |
| `ui-messages-and-copy.mdc` | `@/lib/messages` |
| `ui-messages-bundle-splitting.mdc` | Срезы словаря по типу страницы и локали |
| `ui-icons-lucide.mdc` | lucide-react icons |
| `psi-lab-testing.mdc` | Requestable — lab PSI on deployed origin (`npm run psi:lab`) |

## Reference (Pulse snapshot)

**Референсный проект:** [`docs/examples/pulse/`](../examples/pulse/) — read-only snapshot Pulse (fitapp).

[`docs/examples/pulse/docs/guidelines/`](../examples/pulse/docs/guidelines/) — полный набор guides из fitapp; дополнительные паттерны переносятся по необходимости.

**Principle:** если guideline Sunday School молчит — следовать Pulse reference **architecture and feature patterns** с учётом ADR-001/ADR-002. **Sunday School Cursor Rules и Guidelines имеют больший приоритет**, чем reference-код Pulse — см. [`pulse_project_reference.md`](../reference/pulse_project_reference.md).

### Practices from `docs/general/` (integrated)

| General doc | Guideline | Cursor rule |
|-------------|-----------|-------------|
| `01-security-xss-csrf.md` | `security/ai_security_xss_csrf_guidelines.md` | **security-xss-csrf** |
| `02-data-fetching.md` | `nextjs/ai_data_fetching_patterns.md` | **data-server-actions-and-api** |
| `03-accessibility.md` | `react/ai_semantics_a11y_guidelines.md` | **ui-semantics-a11y** |
| `04-code-splitting.md` | `nextjs/ai_client_lazy_loading.md` | **react-ui-components** |
| `05-browser-rendering.md` | `react/ai_browser_rendering_performance.md` | **ui-animation-performance** |
| `ai_agent_ui_ux_guideline.md` | design contracts + react guidelines | T2 UI rules |
