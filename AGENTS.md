# Sunday School — Monorepo Agent Instructions

**Sunday School** — приложение воскресной школы: учителя и администратор ведут группы, уроки, проверку ДЗ, кирпичики и аналитику (замена действующего приложения)  
Monorepo: **Next.js 16.4** App Router + Vercel + Neon PostgreSQL.

**Methodology (обязательно):** [`docs/meta/ai_first_project_methodology.md`](docs/meta/ai_first_project_methodology.md) — цикл КОНТЕКСТ → TIER/DoR → ФАЗА → КОНТРАКТ → ЗАДАЧИ (CU) → [SPEC-GAP] → РЕАЛИЗАЦИЯ → ВЕРИФИКАЦИЯ → REVIEW (CU) → COMMIT. **Маршрутизация моделей:** [`docs/meta/ai_agent_model_routing.md`](docs/meta/ai_agent_model_routing.md) + `model-routing.mdc`.

## Профиль качества (обязательно)

[`docs/meta/project_quality_profile.md`](docs/meta/project_quality_profile.md) — уровень строгости проекта и включённые модули стека. Объём документации, глубина DoR и путей H/N/S, тесты, review-гейт, a11y и perf берутся **оттуда**, а не по максимуму методологии. Матрица уровней — [`project_quality_profile.template.md`](docs/meta/project_quality_profile.template.md); security floor (§5) — на любом уровне.

## Референсный проект (обязательно)

Архитектурные подходы, структура документации и паттерны разработки **наследуются** из референсного проекта **Pulse** (fitapp):

- Код и документация референса: [`docs/examples/pulse/`](docs/examples/pulse/)
- Сводка: [`docs/reference/pulse_project_reference.md`](docs/reference/pulse_project_reference.md)

**Instant Navigations:** `cacheComponents` + `partialPrefetching`; динамика за Suspense / `'use cache'`.

**Правило:** если в документе Sunday School нет явного отличия — следовать Pulse reference architecture. Отличия стека и домена — ADR-001, ADR-002.

**Приоритет над Pulse:** Cursor Rules и Guidelines **текущего проекта** важнее snapshot Pulse.

## Monorepo structure (целевая)

| Путь | Назначение |
|------|------------|
| [`apps/web`](apps/web/AGENTS.md) | Next.js App Router (тонкий BFF) |
| `apps/workers` | Фоновые задачи — post-MVP (модуль `email_jobs` выключен) |
| `packages/domain` | Чистые бизнес-правила |
| `packages/policy/edge` | JWT-only проверки. **Без DB.** |
| `packages/policy/server` | Object-level проверки с Prisma |
| `packages/db` | Prisma schema — канон: [`database_schema_v1.md`](docs/prds/03_data_model/database_schema_v1.md) |

## Cross-package rules

- `apps/*` handlers = тонкие адаптеры. Логика в `packages/`
- **Запрещено** импортировать `packages/policy/server` из `proxy.ts` / `middleware.ts`
- Domain literals — `@sunschool/domain`; user-visible текст — `@/lib/messages`. Клиентский бандл получает срез словаря своей группы маршрутов и текущей локали, не полный словарь — **ui-messages-bundle-splitting** и [`docs/guidelines/react/copy_and_messages.md`](docs/guidelines/react/copy_and_messages.md) §Срезы словаря
- Долгие операции — **не в request path** → workers/cron
- Post-MVP поля — nullable в схеме с первого дня

## Иерархия источников истины

Полный канонический список — [`.cursor/rules/tiers/t0-always/project-context.template.mdc`](.cursor/rules/tiers/t0-always/project-context.template.mdc) § Source-of-truth order (после bootstrap: `project-context.mdc`). Не дублировать список здесь.

## Документация — точки входа

| Область | Документ |
|---------|----------|
| Методология | [`docs/meta/ai_first_project_methodology.md`](docs/meta/ai_first_project_methodology.md) |
| **Маршрутизация моделей** | [`docs/meta/ai_agent_model_routing.md`](docs/meta/ai_agent_model_routing.md) — task tier T0–T3, Definition of Ready, commit units; runtime: `model-routing.mdc` |
| **Реестр создания docs** | [`docs/meta/documentation_creation_registry.md`](docs/meta/documentation_creation_registry.md) — §2.3.2a пути H / N / S, §2.3.6 DoR-ready документы |
| Шаблон задач фазы | [`docs/meta/phase_tasks.template.md`](docs/meta/phase_tasks.template.md) — commit units, `Tier`, `Paths` |
| Карта архитектуры | [`docs/prds/architecture_master_index.md`](docs/prds/architecture_master_index.md) |
| MVP scope | [`docs/prds/01_product_scope/mvp_scope.md`](docs/prds/01_product_scope/mvp_scope.md) |
| Маршруты (единственный инвентарь) | [`docs/design/canonical_routes.md`](docs/design/canonical_routes.md) |
| Database schema | [`docs/prds/03_data_model/database_schema_v1.md`](docs/prds/03_data_model/database_schema_v1.md) |
| Guidelines + Rules | [`docs/guidelines/README.md`](docs/guidelines/README.md) |
| Prompt orchestration | [`prompts/00-orchestration.md`](prompts/00-orchestration.md) |
| HTML-прототип (visual) | [`docs/prototypes/sunday_school_prototype.html`](docs/prototypes/sunday_school_prototype.html) |
| Pulse reference | [`docs/examples/pulse/`](docs/examples/pulse/) |

## Цикл работы агента

```
КОНТЕКСТ → TIER/DoR → ФАЗА → КОНТРАКТ → ЗАДАЧИ (CU) → [SPEC-GAP] → РЕАЛИЗАЦИЯ → ВЕРИФИКАЦИЯ → REVIEW (CU) → COMMIT
```

1. Прочитать этот файл + `project-context.mdc` + профиль качества. Классифицировать задачу (`Tier: T0|T1|T2|T3 — … · CU: P{N}-CU{k}`) и проверить Definition of Ready по [`ai_agent_model_routing.md`](docs/meta/ai_agent_model_routing.md) до правок. DoR пройден — код пишет оркестратор; не пройден — `architect` spec-gap правит документы.
2. Определить фазу (`docs/implementation/mvp/phases_tasks_descriptions/P{N}_*.md`). Перед первой задачей фазы — **Phase DoR audit** в `P{N}_tasks.md` (один вызов `architect` spec-gap на фазу).
3. Прочитать разделы contracts / specs / ADR, на которые ссылается задача (`§N.M`), а не документы целиком.
4. **Перед написанием/правкой кода** — прочитать применимые `.cursor/rules/*.mdc` для затрагиваемой области (индекс: [`.cursor/rules/README.md`](.cursor/rules/README.md) или таблица в `app-conventions` skill). Эти файлы — enforceable и имеют приоритет над `docs/examples/pulse/**` при конфликте (Pulse — донор/референс, не источник истины). Claude Code грузит зеркало `.claude/rules/*.md`, не `.mdc` (§ Cursor vs Claude Code rules).
   Индекс в `.cursor/skills/app-conventions` может быть не виден Claude Code — при сомнении читать `.cursor/rules/` (или `.claude/rules/`) напрямую, не полагаясь только на skill.
5. Выполнить задачи `docs/implementation/mvp/tasks/P{N}_tasks.md` по commit units (§ Commit plan), включая пути H / N / S из `Paths` задачи.
6. `npm run typecheck` + `npm run lint` + CU DoD (обязательная ВЕРИФИКАЦИЯ). Runtime dual-view (`next-dev-loop`) и lab PSI (`npm run psi:lab`) — **только если пользователь явно попросил**; не auto.
7. На границе CU — в **том же ходе**, где закрыта последняя задача CU: review и auto-commit без запроса разрешения (`Commit: auto` в Commit plan); pipeline целиком (§ Commit & review).

## Cursor vs Claude Code rules

**SoT MUST:** `.cursor/rules/*.mdc` only (not `tiers/` until copied to the rules root). **Активны T0 + T1** (манифест — [`.cursor/rules/README.md`](.cursor/rules/README.md)); T2 (UI) — с P6; `s3-file-asset-uploads` не активируется (модуль выключен). Правку правила вносить в tier-копию и в корень одинаково (`rules:check` сверяет). After any `.mdc` edit in this task: `npm run rules:sync`. Before commit: `npm run rules:check`. Mirror: `.claude/rules/*.md` — generated, in git, never hand-edit. Playbook: [`docs/claude-code-cursor-rules-sync.md`](docs/claude-code-cursor-rules-sync.md).

Cursor `alwaysApply: false` without `globs` (e.g. `agent-code-review-subagent.mdc`) is requestable in Cursor; Claude Code treats a missing `paths` as always-on — do not “fix” the Claude file by hand.

## Commit & review

| Задача | Rule |
|--------|------|
| Commit на границе commit unit или по запросу (verify → review → message → hook) | **`.cursor/rules/agent-commit-pipeline.mdc`** (always) |
| Review: протокол, уровни, sensitive zones; standalone («review diff», проверка перед PR) | **`.cursor/rules/agent-code-review-subagent.mdc`** (requestable) |

Кратко: prefix = `git branch --show-current`; формат `<branch-name>: type(scope): subject`.

Review: проблема → ожидаемая форма → diff; уровень (`skip` / `diff-only` / `reviewer`) задаёт содержимое diff, не type коммита. Runtime-код в CU — субагент `reviewer` (pinned, readonly), один на commit, re-review только delta. Коммит на границе CU — автоматически после зелёной ВЕРИФИКАЦИИ и review без blockers; задача вне CU не коммитится. В ответе всегда trace-блок `Review: …`. Таблицы и prompt — [`docs/guidelines/ai_code_review_protocol.md`](docs/guidelines/ai_code_review_protocol.md).

## Agent skills (`.cursor/skills/`)

| Skill | When |
|-------|------|
| **`app-conventions`** | New features, routes, components — project layout + RSC patterns (single project skill) |
| **`next-dev-loop`** (user skill) | **Only when the user explicitly asks** for runtime / live / browser verify — dual-view (`/_next/mcp` + `agent-browser`), 4 layers (compile → errors → UX → React). Not auto after edits or in commit pipeline. |
| **Lab PSI** (`psi-lab-testing.mdc`) | **Only when the user explicitly asks** to score a **deployed** origin (`npm run psi:lab`, `PAGE_SPEED_API_KEY`). Not localhost; not MCP as primary; not commit pipeline. |

**Do not install** external Next.js **architecture** skills (`npx skills install …`). Patterns from [nextjs-app-architecture-skill](https://github.com/aurorascharff/nextjs-app-architecture-skill) are in-repo only: [`docs/reference/adr_010_nextjs_app_architecture_skill.md`](docs/reference/adr_010_nextjs_app_architecture_skill.md) · spec: [`docs/project-react-skill-requirements.md`](docs/project-react-skill-requirements.md). Workflow verification skill `next-dev-loop` is allowed as a Cursor user skill (**opt-in by user request**); it is not an architecture-skill install and does not replace `app-conventions`.

Web detail: [`apps/web/AGENTS.md`](apps/web/AGENTS.md) § Skills.

## Stack (full Pulse)

Next.js 16.4 · Vercel · Neon PG 17 · Prisma v7 · Auth.js v5 (Telegram + email/пароль администратора; в dev — `db:seed:teacher`) · Sentry · shadcn/ui · Tailwind v4 · Sonner · i18n ru/en (Resend и AWS S3 — post-MVP / выключены профилем)

## Repository status

**Текущая фаза:** Bootstrap — P6 завершена (Design Lab `/design-system`, T2-правила, shadcn на Base UI `base-vega`; гейт G5); следующая — фазы реализации P01…P07. См. [`documentation_creation_registry.md`](docs/meta/documentation_creation_registry.md) и [`docs/implementation/mvp/README.md`](docs/implementation/mvp/README.md).
