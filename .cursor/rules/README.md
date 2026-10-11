# Cursor Rules — Tier Manifest

Правила стека Pulse + lab PSI + dependency pinning, параметризованные для новых проектов. **Этот манифест — единственное место, где перечислен состав tiers.** Другие документы ссылаются сюда и не повторяют списки и количества.  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../docs/meta/ai_first_project_methodology.md) §2.4

**Референс:** [`docs/examples/pulse/`](../../docs/examples/pulse/) — Pulse snapshot. **Guidelines + Rules boilerplate override Pulse code** — [`pulse_project_reference.md`](../../docs/reference/pulse_project_reference.md).

## Источник истины и активация

- **SoT каждого правила — `tiers/<tier>/<rule>.mdc`.** Корень `.cursor/rules/` содержит только **активированные копии**. Править tier-копию, затем скопировать в корень; `npm run rules:check` падает, если корневая копия расходится с tier-копией или правила нет ни в одном tier.
- **В шаблоне активен только T0** (без `project-context` — его создаёт P0 из `tiers/t0-always/project-context.template.mdc` после замены placeholders). Это ровно состояние «после P0».

| Когда | Действие |
|-------|----------|
| **P0** | T0 уже активен; создать `.cursor/rules/project-context.mdc` из шаблона |
| **P4** (после W1) | Скопировать `tiers/t1-implementation/*.mdc` в корень — кроме правил выключенных модулей (колонка «Модуль») |
| **P6** (Design System Lab) | ✔ Выполнено (2026-10-11): `tiers/t2-ui/*.mdc` скопированы в корень (все 18; модуль `i18n` включён). Правку вносить в tier-копию и в корень одинаково |

После каждой активации — `npm run rules:sync`.

## Claude Code mirror

После любой правки или копирования `.mdc` в **корень** `.cursor/rules/`: `npm run rules:sync`. Зеркало: [`.claude/rules/*.md`](../../.claude/rules/) — **не править руками**. Не синкать `*.template.mdc`. Playbook: [`docs/claude-code-cursor-rules-sync.md`](../../docs/claude-code-cursor-rules-sync.md). CI: `npm run rules:check`.

---

## T0 — Always applied (активен в шаблоне)

| Rule | alwaysApply | Назначение |
|------|:-----------:|------------|
| `project-context.mdc` | ✅ | Stack, invariants, doc precedence |
| `product-docs-alignment.mdc` | ✅ | Doc sync on behavior change |
| `typescript-monorepo-types.mdc` | ✅ | typecheck, package boundaries |
| `domain-literals-and-codes.mdc` | ✅ | Mutation codes, no magic strings |
| `ai-dry-deduplication.mdc` | ✅ | DRY / SOLID for agents |
| `model-routing.mdc` | ✅ | Task tier T0–T3, Definition of Ready, spec-gap, commit units, субагенты, гигиена токенов. Канон: [`docs/meta/ai_agent_model_routing.md`](../../docs/meta/ai_agent_model_routing.md). Не путать с rule-tier этой таблицы. |
| `agent-commit-pipeline.mdc` | ✅ | Auto-commit на границе CU / по запросу: verify → review (уровень по diff) → conventional commit |
| `agent-code-review-subagent.mdc` | — | Review protocol: проблема → ожидаемая форма → diff; единый гейт CU — субагент `reviewer` для runtime-кода, `diff-only` для docs (requestable). Не Bugbot. |

Файлы: [`tiers/t0-always/`](tiers/t0-always/)

---

## T1 — Implementation (P4, после W1 governance)

**Модуль** — ключ из профиля качества ([`project_quality_profile.template.md`](../../docs/meta/project_quality_profile.template.md) §4). Правило с модулем активируется, только если модуль включён в `docs/meta/project_quality_profile.md`; «—» — активируется всегда.

| Rule | Модуль | Назначение |
|------|--------|------------|
| `nextjs-vercel-app-router.mdc` | — | Next.js 16.4 (exact patch, no caret), `proxy.ts`, Instant Navigations |
| `auth-security.mdc` | `auth` | Auth.js v5, JWT, defense in depth |
| `security-xss-csrf.mdc` | — | XSS, CSRF, CSP, DOMPurify |
| `policy-packages.mdc` | `auth` | `@sunschool/policy-*` boundaries |
| `data-server-actions-and-api.mdc` | — | DAL, Actions vs Route Handlers |
| `app-router-streaming-loading.mdc` | — | Suspense, `loading.tsx`, cache |
| `ios-safari-mutation-transport.mdc` | `ios_safari_transport` | iOS Safari dual transport |
| `s3-file-asset-uploads.mdc` | `s3_uploads` | FileAsset + AWS S3 presigned |
| `javascript-fundamentals.mdc` | — | Closures, map/filter/reduce, generators, ESM modules, TS generics |
| `psi-lab-testing.mdc` | — | Requestable — lab PSI on deployed origin (REST, not MCP / localhost) |
| `testing.mdc` | — | Vitest: объём по профилю D4 / D5, раскладка, проверки по contract. Globs: `*.test.*`, `e2e/**`, configs |
| `dependency-pinning.mdc` | — | Exact npm versions (no `^` / `~`), `.npmrc` `save-exact`, lockfile + `npm ci`, `chore(deps)` CU; `npm run deps:check`. Globs: `package.json`, lockfile, `.npmrc` |

Файлы: [`tiers/t1-implementation/`](tiers/t1-implementation/)

---

## T2 — UI / React (P6, Design System Lab)

Prototype без Design Lab (профиль §4): T2 активировать перед первой UI-задачей вместо P6.

| Rule | Модуль | Назначение |
|------|--------|------------|
| `react-ui-components.mdc` | — | RSC/client boundaries |
| `react-one-component-per-file.mdc` | — | One export; ≤140 lines |
| `react-logic-presentation.mdc` | — | Logic vs presentation split |
| `react-naming-conventions.mdc` | — | Naming conventions |
| `react-state-management.mdc` | — | useReducer/useContext/Zustand/Redux Toolkit, SSR safety |
| `ui-design-system-shadcn.mdc` | — | Design tokens, shadcn catalog |
| `ui-mobile-first.mdc` | — | Bottom nav / sidebar |
| `ui-prototype-fidelity.mdc` | — | Prototype visual parity |
| `ui-semantics-a11y.mdc` | — | WCAG 2.1 AA |
| `ui-animation-performance.mdc` | — | GPU animations, layout thrashing |
| `ui-toast-mutations.mdc` | — | Sonner after mutations |
| `ui-mutation-pending.mdc` | — | `aria-busy`, pending UI |
| `ui-optimistic-mutations.mdc` | — | `useOptimistic` toggles |
| `ui-messages-and-copy.mdc` | — | `@/lib/messages` |
| `ui-messages-bundle-splitting.mdc` | `i18n` | Срезы словаря по типу страницы и локали; полный словарь не в клиентском бандле |
| `ui-icons-lucide.mdc` | — | lucide-react |
| `admin-forms-layout.mdc` | — | Admin forms layout |
| `patterns-tables-dnd.mdc` | — | Responsive tables |

Файлы: [`tiers/t2-ui/`](tiers/t2-ui/)

---

## Guidelines mapping

Полный индекс: [`docs/guidelines/README.md`](../../docs/guidelines/README.md)  
General deep dives: [`docs/general/README.md`](../../docs/general/README.md)

| Rule cluster | Guidelines |
|--------------|------------|
| Security (XSS/CSRF) | `docs/guidelines/security/ai_security_xss_csrf_guidelines.md` |
| Next.js / Vercel | `docs/guidelines/nextjs/*` |
| Lab PSI (deployed) | `docs/guidelines/psi-lab-testing.md` + `docs/guidelines/nextjs/ai_psi_lab_testing.md` |
| Code review (protocol, subagent prompt) | `docs/guidelines/ai_code_review_protocol.md` |
| React / forms / optimistic / rendering | `docs/guidelines/react/*` |
| Auth | `docs/guidelines/auth/ai_auth_implementation_guide.md` |
| TypeScript monorepo | `docs/guidelines/typescript/ai_typescript_monorepo_guidelines.md` |
| Testing (Vitest / Playwright) | `docs/guidelines/testing/ai_testing_guidelines.md` |
| Typography | `docs/guidelines/typography_text_guidelines.md` |

---

## Reference (Pulse)

**Референсный проект:** [`docs/examples/pulse/`](../../docs/examples/pulse/) — read-only architecture & feature patterns.

**Приоритет:** Cursor Rules + Guidelines **текущего boilerplate** > Pulse reference code.

Pulse reference rules (compare): [`docs/examples/pulse/.cursor/rules/`](../../docs/examples/pulse/.cursor/rules/)  
Сводка: [`docs/reference/pulse_project_reference.md`](../../docs/reference/pulse_project_reference.md)
