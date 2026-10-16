# AI-First Project Methodology — Sunday School
## Архитектура, методология разработки и система документации

**Проект:** Sunday School — приложение воскресной школы: учителя и администратор ведут группы, уроки, проверку ДЗ, кирпичики и аналитику (замена действующего приложения)  
**Версия:** 1.1  
**Статус:** Canonical — адаптирована под Sunday School в P2 (2026-10-10); ожидает утверждения владельцем (gate G2)  
**Референс:** Pulse (fitapp) — [`docs/examples/pulse/`](../examples/pulse/) · [`pulse_project_reference.md`](../reference/pulse_project_reference.md)

> Полный образец methodology (Pulse, strict) — `docs/examples/pulse/docs/meta/ai_first_project_methodology.md`. Уровень строгости проекта — [`project_quality_profile.md`](./project_quality_profile.md) (lean); здесь он не дублируется.

---

## Введение

Документ описывает AI-first подход к разработке **Sunday School**. Структура наследуется из Pulse reference, адаптируется под домен и interim docs в [`docs/my_specs/`](../my_specs/) и [`docs/prototypes/`](../prototypes/).

**Цель:** AI-агенты следуют задокументированным контрактам, а не изобретают архитектуру.

**Порядок создания документов:** [`documentation_creation_registry.md`](./documentation_creation_registry.md) (Canonical, адаптирован в P2).

---

## 1. Архитектурный шаблон

### 1.1 Двухконтурная модель

**Контур A — Web (UI + BFF)** — Next.js 16.4 на Vercel  
**Контур B — Jobs** — Vercel Cron + serverless; не в request path (**post-MVP**, модуль `email_jobs` выключен)

| Компонент | Технология |
|-----------|-----------|
| Framework | Next.js **16.4** (exact patch pin, no caret), App Router, `proxy.ts` |
| Hosting | Vercel |
| DB | Neon PostgreSQL 17 + Prisma v7 |
| Auth | Auth.js v5, Telegram (OIDC) + email/пароль администратора, JWT, роли `admin` / `teacher` |
| UI | shadcn/ui (Base UI) + Tailwind CSS v4 |
| Email | Resend (post-MVP; модуль `email_jobs` выключен) |
| Storage | AWS S3 (presigned) — модуль `s3_uploads` выключен профилем |
| i18n | ru / en, срезы словарей (модуль `i18n`) |
| Observability | Sentry |
| Toasts | Sonner |

### 1.2 Монорепо

```
monorepo/
├── apps/web/          — Next.js (тонкий BFF)
├── apps/workers/      — Cron / jobs (post-MVP)
└── packages/
    ├── domain/        — чистые правила (без Next/DB)
    ├── policy/edge/   — JWT-only
    ├── policy/server/ — Prisma object checks
    └── db/            — Prisma schema (единственное DDL)
```

**Правила импорта:** см. `monorepo_boundaries_contract.md` (W8) · образец: `docs/examples/pulse/docs/implementation/mvp/contracts/`

### 1.3 Domain invariants (зафиксированы в P0 из спецификации; детализируются в W3-04)

1. В школе не более одного активного учебного года; уроки создаются только в активном году; закрытый год — только чтение для teacher, admin правит с записью в журнал (БП-6)
2. Журнал изменений и журнал кирпичиков — только добавление; ошибки исправляются компенсирующими записями; удаление — только по запросу на удаление данных (БП-8, БП-11)
3. Отметки ДЗ привязаны к уроку и группе, где выставлены; история зачислений сохраняется при переводе; кирпичики и достижения считаются по ученику и году, не по группе (БП-7, БП-11)
4. Фоновые задачи и email — post-MVP, в MVP нет `apps/workers`; будущая задача идемпотентна (idempotency key)
5. Схема БД создаётся сразу целиком, включая post-MVP (семьи, достижения, штрафы, голосовая проверка); post-MVP таблицы без интерфейса и не ломают MVP-сценарии

---

## 2. Методология AI-first

### 2.1 Принцип

Документация = **runtime-инструкция** для агента. Перед изобретением паттерна — проверить Pulse reference и guidelines.

### 2.2 Цикл агента

```
КОНТЕКСТ → TIER/DoR → ФАЗА → КОНТРАКТ → ЗАДАЧИ (CU) → [SPEC-GAP] → РЕАЛИЗАЦИЯ → ВЕРИФИКАЦИЯ → REVIEW (CU) → COMMIT
```

| Шаг | Действие |
|-----|----------|
| КОНТЕКСТ | `AGENTS.md` + `project-context.mdc` + [`project_quality_profile.md`](./project_quality_profile.md) — уровень строгости и модули |
| TIER/DoR | Task tier T0–T3, Definition of Ready и делегирование: [`ai_agent_model_routing.md`](./ai_agent_model_routing.md), runtime `model-routing.mdc`. Это не rule-tier T0–T2 из `.cursor/rules/README.md`. |
| ФАЗА | `P{N}_phase_description.md` |
| КОНТРАКТ | `docs/implementation/mvp/contracts/` |
| ЗАДАЧИ (CU) | `P{N}_tasks.md` по [`phase_tasks.template.md`](./phase_tasks.template.md): commit units, `Tier`, ссылки `§N.M`, `Paths` H/N/S |
| [SPEC-GAP] | DoR не пройден → `architect` (Grok 4.7) правит spec / contract / ADR / PRD до кода; до старта фазы — Phase DoR audit одним вызовом |
| РЕАЛИЗАЦИЯ | Оркестратор; `implementer` — только для изоляции контекста / параллельных шагов |
| ВЕРИФИКАЦИЯ | **Always:** typecheck, lint, CU DoD / phase DoD; тесты — по профилю (D4 / D5 / D7). **On user request only:** (1) runtime dual-view via skill `next-dev-loop` (`/_next/mcp` + `agent-browser`) — live `next dev`, 4 layers; (2) lab PSI on a **deployed** origin via `npm run psi:lab` (`psi-lab-testing.mdc`) — not localhost, not MCP as primary. Do **not** auto-start either after UI edits or in commit pipeline. |
| REVIEW (CU) | Runtime-код в CU → субагент `reviewer` (не Bugbot, не замена lint); docs-only CU → `diff-only` ([`agent-code-review-subagent.mdc`](../../.cursor/rules/agent-code-review-subagent.mdc)) |
| COMMIT | На границе CU — автоматически после зелёной ВЕРИФИКАЦИИ и review без blockers ([`agent-commit-pipeline.mdc`](../../.cursor/rules/agent-commit-pipeline.mdc)) |

### 2.3 AGENTS.md

Корень monorepo + `apps/web/AGENTS.md` — из templates boilerplate.

### 2.4 Cursor Rules (tiers)

| Tier | Когда | Manifest |
|------|-------|----------|
| T0 | Bootstrap | `.cursor/rules/README.md` §T0 |
| T1 | Implementation | §T1 |
| T2 | Design Lab | §T2 |

### 2.5 Фазовая декомпозиция

```
docs/implementation/mvp/
├── phases_tasks_descriptions/P{N}_phase_description.md
└── tasks/P{N}_tasks.md
```

Фазы проекта: [`docs/implementation/mvp/phases_tasks_descriptions/`](../implementation/mvp/phases_tasks_descriptions/) (P01–P07, W11). Образец структуры: `docs/examples/pulse/docs/implementation/mvp/phases_tasks_descriptions/`

Задачи фазы — по шаблону [`phase_tasks.template.md`](./phase_tasks.template.md): Commit plan (commit units) задаётся **при планировании фазы**, а не в момент коммита. Перед первой задачей фазы — **Phase DoR audit** ([`ai_agent_model_routing.md`](./ai_agent_model_routing.md) § DoR). Задачи пишутся только по документам, прошедшим registry §2.3.6.

### 2.6 Contracts

Формат: §2.3.4 registry — Happy / Negative / Security / Concurrency / Drift / Acceptance.

### 2.7 Guidelines

`docs/guidelines/` — полный набор (included in boilerplate). Индекс: [`README.md`](../guidelines/README.md)

---

## 3. Структура документации

См. волны §5 и иерархию источников истины §2.1 в [`documentation_creation_registry.md`](./documentation_creation_registry.md); полный образец — Pulse registry.

**Иерархия истины:** канон — [`.cursor/rules/project-context.mdc`](../../.cursor/rules/project-context.mdc) § Source-of-truth order.

---

## 4. Типология документов

PRD · ADR · Contract · Spec · Phase · Tasks · Guideline · Cursor Rule · Wireframe · Learning Pack

Образцы каждого типа — в `docs/examples/pulse/docs/`

---

## Agent notes

- HTML prototype — **не** канон; путь `docs/prototypes/sunday_school_prototype.html`; при конфликте — PRD/schema
- Context7 перед runtime docs: Next.js **16.4**, Auth.js v5, Prisma v7; прототип: Tailwind v4 Play CDN (`/websites/tailwindcss`).
- Одна сессия = одна doc wave или 1–3 файла внутри волны
- DB-first: `database_schema_v1.md` до domain contracts
