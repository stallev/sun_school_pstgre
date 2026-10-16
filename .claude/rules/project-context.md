---
description: Sunday School project context — stack, reference Pulse, document precedence
---
# Sunday School — project context

## Product

**Sunday School** — приложение воскресной школы: учителя и администратор ведут группы, уроки, проверку ДЗ, кирпичики и аналитику (замена действующего приложения)  
Роли: **admin, teacher**.  
MVP scope: см. [`docs/prds/01_product_scope/mvp_scope.md`](docs/prds/01_product_scope/mvp_scope.md) (канон); входной материал владельца — [`docs/my_specs/mvp_scope.md`](docs/my_specs/mvp_scope.md).

## Quality profile (read with AGENTS.md)

[`docs/meta/project_quality_profile.md`](docs/meta/project_quality_profile.md) — chosen level (`prototype` | `lean` | `standard` | `strict`), overrides and enabled stack modules. It decides how many docs waves, which DoR / H·N·S paths, tests, review gate, a11y and perf checks apply. Rules that say «по профилю Dn» take the value from there; no profile → `standard`. **Security floor** (profile template §5) applies at every level.

## Reference project (mandatory patterns)

Architectural and AI-first patterns inherit from **Pulse** (fitness marketplace — full implementation snapshot):

- Reference code/docs: [`docs/examples/pulse/`](docs/examples/pulse/)
- Reference summary: [`docs/reference/pulse_project_reference.md`](docs/reference/pulse_project_reference.md)
- Methodology: [`docs/meta/ai_first_project_methodology.md`](docs/meta/ai_first_project_methodology.md)

When Sunday School docs are silent — follow Pulse reference **architecture, feature patterns, and methodology**, adapting domain and ADR deltas.  
**Sunday School Cursor Rules and Guidelines override Pulse reference code** when they conflict — see [`pulse_project_reference.md`](docs/reference/pulse_project_reference.md) §Priority.

## Stack (baseline — full Pulse stack; optional modules per quality profile §4)

- **Next.js** **16.4** (exact patch pin, no caret) App Router, **TypeScript** — [ADR-002](docs/prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md)
- **Instant Navigations:** `cacheComponents: true` + `partialPrefetching: true`; динамика за `<Suspense>` / `'use cache'`; `export const instant = false` только с задокументированной причиной
- **Request interception:** **`proxy.ts`** (Next.js 16); `middleware.ts` — только временная миграция
- **Node.js:** **24.x** — local, CI (`node-version: "24"`), Vercel (`engines.node`: `24.x`)
- **Hosting:** Vercel · **UI:** shadcn/ui (Base UI) + Tailwind CSS v4 (Slate Cobalt tokens)
- **Database:** Neon **PostgreSQL 17** + **Prisma v7** (pooled `DATABASE_URL`, `DIRECT_URL` for migrations)
- **Auth:** Auth.js v5, вход через **Telegram (OIDC)** и **email + пароль для администратора** (Credentials) — [`telegram_authjs_oidc_portable_guide.md`](docs/my_specs/telegram_authjs_oidc_portable_guide.md); JWT sessions, role in token (`admin`, `teacher`); пароль только у администратора (создаёт команда `db:seed:admin`); Google не используется
- **Email:** Resend — **post-MVP**, модуль `email_jobs` выключен по профилю
- **Storage:** AWS S3 — модуль `s3_uploads` **выключен** по профилю (включается ADR-007 при необходимости)
- **Observability:** Sentry (`@sentry/nextjs`) — модуль `sentry` включён
- **i18n:** ru / en, срезы словарей (`common`, `auth`, `teacher`, `admin`, `analytics`) — модуль `i18n` включён
- **Monorepo:** `apps/web`, `packages/{domain,policy,db}` (`apps/workers` — post-MVP)

Runtime policy: [ADR-001](docs/prds/07_governance/adr_001_stack_and_runtime.md), [ADR-002](docs/prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md).

## Source-of-truth order when documents conflict

**Canonical list — do not restate elsewhere; other docs must link here.**

1. **Cursor Rules** (`.cursor/rules/*.mdc`)
2. **[`AGENTS.md`](AGENTS.md)** — monorepo entry
3. **Contracts** (`docs/implementation/mvp/contracts/`)
4. **PRD** (`docs/prds/`) — when created; interim: [`docs/my_specs/`](docs/my_specs/)
5. **[`docs/design/canonical_routes.md`](docs/design/canonical_routes.md)** — single route inventory
6. **Guidelines** (`docs/guidelines/`) — index in [`docs/guidelines/README.md`](docs/guidelines/README.md)
7. **HTML prototype** — visual reference only (`docs/prototypes/sunday_school_prototype.html`), subordinate to canonical docs

**Vs Pulse snapshot:** root Cursor Rules **and** root Guidelines always win over [`docs/examples/pulse/`](docs/examples/pulse/) (even though Guidelines are #6 in this list). **Enforceable paths:** `.cursor/rules/*.mdc` at the repo root and `docs/guidelines/**`. **Not canon:** `docs/examples/pulse/.cursor/rules/**`, `docs/examples/pulse/docs/guidelines/**`, any `docs/examples/lampto/**` (that tree is **not vendored**).

**Pulse namesakes are not authoritative.** Snapshot files with the *same names* as root rules/guidelines (e.g. `ui-design-system-shadcn.mdc`) are a read-only code/domain reference — they do not override this file.

## Domain invariants (do not break — полный список: [`domain_invariants.md`](docs/prds/02_domain_model/domain_invariants.md))

1. **В школе не более одного активного учебного года; уроки создаются только в активном году; закрытый год — только чтение для teacher, admin правит с записью в журнал (БП-6)**
2. **Журнал изменений и журнал кирпичиков — только добавление; ошибки исправляются компенсирующими записями; удаление — только по запросу на удаление данных (БП-8, БП-11)**
3. **Отметки ДЗ привязаны к уроку и группе, где выставлены; история зачислений сохраняется при переводе; кирпичики и достижения считаются по ученику и году, не по группе (БП-7, БП-11)**
4. **Background jobs (post-MVP email)** — Фоновые задачи и email — post-MVP, в MVP нет `apps/workers`; будущая задача идемпотентна (idempotency key)
5. **Post-MVP columns** — Схема БД создаётся сразу целиком, включая post-MVP (семьи, достижения, штрафы, голосовая проверка); post-MVP таблицы без интерфейса и не ломают MVP-сценарии

## Where to find norms

| Area | Document |
|------|----------|
| Methodology | [`docs/meta/ai_first_project_methodology.md`](docs/meta/ai_first_project_methodology.md) |
| **Quality profile** | [`docs/meta/project_quality_profile.md`](docs/meta/project_quality_profile.md) · matrix: [`project_quality_profile.template.md`](docs/meta/project_quality_profile.template.md) |
| Doc creation order | [`docs/meta/documentation_creation_registry.md`](docs/meta/documentation_creation_registry.md) |
| Architecture map | [`docs/prds/architecture_master_index.md`](docs/prds/architecture_master_index.md) |
| Agent onboarding | [`docs/architecture_learning_pack/01_architecture_overview.md`](docs/architecture_learning_pack/01_architecture_overview.md) |
| Database schema | [`docs/prds/03_data_model/database_schema_v1.md`](docs/prds/03_data_model/database_schema_v1.md) |
| Guidelines | [`docs/guidelines/README.md`](docs/guidelines/README.md) |
| **UI component catalog (Design Lab)** | `/design-system` — spec: [`design_system_lab_spec.md`](docs/implementation/mvp/specs/design_system_lab_spec.md) |
| Pulse reference | [`docs/reference/pulse_project_reference.md`](docs/reference/pulse_project_reference.md) |
| Prompt orchestration | [`prompts/00-orchestration.md`](prompts/00-orchestration.md) |
| **Model routing (task tier T0–T3)** | [`docs/meta/ai_agent_model_routing.md`](docs/meta/ai_agent_model_routing.md) · runtime `model-routing.mdc` |
| **Lab PSI (deployed)** | [`docs/guidelines/nextjs/ai_psi_lab_testing.md`](docs/guidelines/nextjs/ai_psi_lab_testing.md) · portable [`docs/guidelines/psi-lab-testing.md`](docs/guidelines/psi-lab-testing.md) |

## Cursor rules tiers

| Tier | When | Manifest |
|------|------|----------|
| T0 | Bootstrap | [`.cursor/rules/README.md`](.cursor/rules/README.md) §T0 |
| T1 | P4 (after W1) | §T1 |
| T2 | After Design Lab (P6) | §T2 |

Task classification T0–T3 (orchestrator) is a different axis from this table: [`ai_agent_model_routing.md`](docs/meta/ai_agent_model_routing.md).

## Repository status

**Текущая фаза:** Bootstrap — P6 завершена (Design Lab `/design-system`, T2-правила, shadcn на Base UI `base-vega`; гейт G5); следующая — фазы реализации P01…P07. Реализация — по фазам [`P01…P07`](docs/implementation/mvp/README.md). Не расширять реализацию без явной фазы и contract.
