# Prompt Orchestration — AI-First Monorepo Bootstrap

**Проект:** {{PROJECT_NAME}}  
**Шаблон:** этот репозиторий (стартовый шаблон; проект создаётся из него)  
**Bootstrap guide:** [`BOOTSTRAP.md`](../BOOTSTRAP.md)  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../docs/meta/ai_first_project_methodology.md)  
**Pulse reference:** [`docs/examples/pulse/`](../docs/examples/pulse/)

---

## Принципы оркестрации

1. **Один промпт = одна роль = один deliverable** (или одна doc wave)
2. **Context budget:** не смешивать doc creation и implementation code в одной сессии
3. **Gates:** следующий промпт только после verification checklist предыдущего
4. **Prototype:** visual reference only — канон: Rules → AGENTS → Contracts → PRD
5. **DB-first:** schema wave (W3 data model) до domain contracts (W8)
6. **Context7:** обязателен для runtime/auth/data промптов (см. registry §2.7)
7. **Профиль качества:** уровень (`prototype` | `lean` | `standard` | `strict`) и модули из `docs/meta/project_quality_profile.md` определяют объём волн, тестов и review во всех следующих промптах

---

## Карта промптов

| ID | Файл | Когда | Deliverable |
|----|------|-------|-------------|
| **P00** | [`P00-quality-profile.md`](P00-quality-profile.md) | День 0, **первым** | `docs/meta/project_quality_profile.md` — уровень строгости, модули стека |
| **P0** | [`P0-bootstrap.md`](P0-bootstrap.md) | День 0 | Структура каталогов, AGENTS, T0 rules |
| **P1-desktop** | [`P1-html-prototype-claude-desktop.md`](P1-html-prototype-claude-desktop.md) | До P1 (рекомендуется) | Seed: один HTML в `docs/prototypes/` (Claude Desktop + spec + URL DS) |
| **P1** | [`P1-html-prototype.md`](P1-html-prototype.md) | После P0 + brief | `docs/prototypes/{{MAIN_PROTOTYPE_HTML}}` — ingest или create |
| **P2** | [`P2-doc-registry.md`](P2-doc-registry.md) | После P1 | `documentation_creation_registry.md` |
| **P3** | [`P3-wave-executor.md`](P3-wave-executor.md) | Каждая волна W{N} | Файлы волны + backlinks |
| **P4** | [`P4-rules-guidelines.md`](P4-rules-guidelines.md) | После W1 | T1 rules активны, guidelines проверены |
| **P5** | [`P5-nextjs-scaffold.md`](P5-nextjs-scaffold.md) | После W8+ contracts | Monorepo + Next.js 16.4 |
| **P6** | [`P6-design-system-lab.md`](P6-design-system-lab.md) | После P5 + UX-03 | `/design-system` + T2 rules |
| **P7+** | Phase tasks | После P6 | `P01_tasks.md` … по фазам ([`phase_tasks.template.md`](../docs/meta/phase_tasks.template.md)); перед каждой фазой — **Phase DoR audit** (`architect` spec-gap, один вызов на фазу) |

---

## Gates (обязательные проверки)

```
P00 ──▶ Visual seed (реком.) ──▶ P0 ──▶ P1 (ingest/create) ──▶ P2 ──▶ P3 (W1…W14) ──▶ P4 ──▶ P5 ──▶ P6 ──▶ P7 (P01+)
                                      │                         │
                                      │                         └── Gate: database_schema_v1 canonical до W8 contracts
                                      └── Gate: interim docs / product brief exists
```

| Gate | Условие |
|------|---------|
| G0 → P0 | `docs/meta/project_quality_profile.md` создан пользователем через P00 |
| G1 → P2 | Есть product brief или `docs/default_docs/` |
| G1b → W2 UX-03 | Рекомендуется `docs/prototypes/{{MAIN_PROTOTYPE_HTML}}` (token dump) |
| G2 → P3-W3 | P2 registry утверждён пользователем |
| G3 → P5 | `database_schema_v1.md` canonical + волны, обязательные для уровня профиля (registry §5.0) до W8 включительно |
| G4 → P6 | Next.js build pass, `globals.css` scaffold |
| G5 → P7 | Design Lab acceptance criteria pass, включая минимальный объём по профилю (все компоненты и состояния; с `lean`) |
| G6 → каждая фаза P{N} | Phase DoR audit в `P{N}_tasks.md` закрыт: все задачи проходят DoR ([`ai_agent_model_routing.md`](../docs/meta/ai_agent_model_routing.md) § DoR); глубина — профиль D3 |

---

## Doc waves — context budget

| Wave | Файлов (ориентир) | Сессий | Содержание |
|------|-------------------|--------|------------|
| W0 | 1 | 1 | Registry meta |
| W1 | 6 | 1–2 | Governance + product canon |
| W2 | 5 | 1 | UX/UI foundation |
| W3 | 5 | 1–2 | Domain model + **data model priority** |
| W4–W7 | ~15 | 2–3 | ADR, auth, runtime, design, wireframes |
| W8 | ~10 | 2 | **Contracts** (happy/negative/security/race) |
| W9–W11 | ~12 | 2 | Specs, phases, guides |
| W12–W14 | ~8 | 1–2 | Learning pack, ops, quality |

**Правило:** 1 сессия = **одна волна** или **1–3 файла** внутри волны (см. registry §3).

Полный перечень файлов — [`documentation_creation_registry.md`](../docs/meta/documentation_creation_registry.md) и Pulse snapshot.

---

## UX/UI documents (волна W2 + W7)

| ID | Файл | Назначение |
|----|------|------------|
| UX-01 | `docs/design/ux_ui_principles.md` | Progressive Disclosure, Zero Dead Ends |
| UX-02 | `docs/design/responsive_navigation_contract.md` | Bottom nav / sidebar |
| UX-03 | `docs/design/visual_identity_contract.md` | Tokens, typography |
| UX-04 | `docs/design/interaction_design_contract.md` | Toast, optimistic, pending |
| UX-05 | `docs/design/ui_states_contract.md` | empty/loading/error/forbidden |
| UX-06 | `docs/design/forms_and_validation_ux.md` | Field errors, submit pending |
| UX-07 | `docs/design/accessibility_requirements.md` | WCAG 2.1 AA |
| UX-08 | `docs/design/prototype_route_mapping.md` | Prototype → routes |
| UX-09 | `docs/design/styleguide.md` | Component recipes |
| UX-10 | `docs/design/content_and_microcopy_contract.md` | `@/lib/messages` |

---

## Требования к документации (все промпты P2/P3)

Из registry §2 — обязательно в каждом новом файле:

- Front matter (тип, статус, волна, зависимости; `Проверено по` для runtime/auth/data)
- Purpose, Scope, Requirements (MUST/SHOULD/MAY); нумерованные разделы `§N.M`
- **Happy / Negative / Security** — по признакам registry §2.3.2a (+ Races / Drift по матрице типа)
- Acceptance criteria с ожидаемым исходом — по 1 на каждый обязательный путь
- Open questions (пусто или с владельцем) — DoR-ready checklist registry §2.3.6
- Agent notes (антипаттерны)
- Backlinks в ранние файлы (та же сессия)

---

## Cursor Rules activation timeline

| После промпта | Tier |
|---------------|------|
| P0 (активен в шаблоне) | T0 |
| P4 (после W1) | T1 |
| P6 | T2 |

Состав tiers — только в манифесте.

Manifest: [`.cursor/rules/README.md`](../.cursor/rules/README.md)

---

## Guidelines (included)

Полный набор в `docs/guidelines/` — не создавать заново; адаптировать ссылки и {{PLACEHOLDERS}} в P4.

**S3 uploads:** [`docs/guidelines/nextjs/ai_s3_file_upload_guidelines.md`](../docs/guidelines/nextjs/ai_s3_file_upload_guidelines.md) + infra в [`BOOTSTRAP.md`](../BOOTSTRAP.md) §7.

---

## Context7 libraries

| Тема | Library ID |
|------|------------|
| Next.js 16.4 | `/vercel/next.js` |
| Tailwind CSS v4 | `/websites/tailwindcss` (Play CDN, `@theme`) |
| Auth.js v5 | `/websites/authjs_dev` |
| Prisma v7 | `/websites/prisma_io` |
| shadcn/ui | via shadcn MCP |

---

## Quick start для агента

```
1. READ prompts/00-orchestration.md (this file)
2. EXECUTE P00 — quality profile chosen by the user (gate G0)
3. READ PLACEHOLDERS.md — verify all {{}} replaced
4. Visual seed → docs/prototypes/ (Claude Desktop prompt) — recommended before P1
5. EXECUTE P0 → verify → P1 (ingest/create) → …
6. Never skip gates
```
