# Code review protocol: проблема → ожидаемая форма → diff

Project HOW для **commit / standalone review pipeline** (`agent-code-review-subagent.mdc`). **WHEN** — уровни, sensitive zones, бюджет, trace — в том же rule; commit units — `model-routing.mdc` §3a. Оркестрация commit — `agent-commit-pipeline.mdc` §3. Методология: [`docs/meta/ai_first_project_methodology.md`](../meta/ai_first_project_methodology.md) §2.2 ВЕРИФИКАЦИЯ.

Исполнитель review — субагент **`reviewer`** ([`.cursor/agents/reviewer.md`](../../.cursor/agents/reviewer.md), [`docs/meta/ai_agent_model_routing.md`](../meta/ai_agent_model_routing.md)): один вызов на commit unit (CU) с runtime-кодом; §5 — его prompt.

**Читать на уровне `reviewer`.** Для `skip` / `diff-only` не нужен.

Правила T1/T2 (`data-server-actions-and-api`, `ui-*` и др.) применять, если они уже скопированы в проект (bootstrap).

---

## 1. Проблема (2a)

3–5 строк: что нужно сделать и зачем. Источники — **только** просьба пользователя и задачи CU в `P{N}_tasks.md` (Goal, Acceptance, `§`-ссылки, `Paths`). **Не** diff и **не** собственный commit message: иначе review подтверждает то, что уже написано.

- Постановка неясна → спросить пользователя **до** review.
- Неинтерактивный режим → допущение в trace (`Проблема: (допущение) …`) и продолжить.
- CU из нескольких задач → 2a и 2b **по каждой задаче** CU, не по CU целиком.

## 2. Ожидаемая форма (2b)

До чтения hunks — только `git status --short`. Взять из таблицы **применимые** строки (≤ 5 пунктов на задачу). Список берётся из таблицы, а не из памяти: пропуски автора — ровно то, что он не помнит. Заново выводить то, что уже зафиксировано каноном, не нужно.

| Изменение | Ожидаемая форма |
|-----------|-----------------|
| Мутация (Server Action) | валидация на границе; сессия/роль через policy; ревалидация; `MutationResult` + коды из `@sunschool/domain` (`domain-literals-and-codes`); тексты из `@/lib/messages`; toast + pending UI (`ui-toast-mutations`, `ui-mutation-pending`) |
| Route Handler / API | валидация входа; authn/authz на самом handler; корректные status codes; секреты не в ответе и не в логах (`auth-security`, `security-xss-csrf`) |
| DAL / Prisma | БД только в DAL (`data-server-actions-and-api`); scoping по владельцу; в UI DTO из domain, не Prisma shapes |
| Миграция / схема | migration + `schema.prisma` + `database_schema_v1.md` согласованы |
| UI-компонент | один компонент на файл ≤140 строк; Design Lab primitives; тексты из `@/lib/messages`; empty / loading / error / forbidden; a11y (`react-one-component-per-file`, `ui-design-system-shadcn`, `ui-semantics-a11y`) |
| UI-компонент из `components/{ui,shell,patterns,atoms,analytics}`, `app/globals.css`, `app/layout.tsx` (P14+) | класс компонента совпадает со строкой [`prototype_class_parity_spec.md`](../implementation/mvp/specs/prototype_class_parity_spec.md) §7 после нормализации §3 (протокол §4); новая или изменённая константа/компонент — строка §7 в том же diff; в `<main>` нет `text-xs` вне бейджей, нет нативных `select` / `checkbox` / `date`, нет `max-w-*` / `mx-auto` на странице (UX-03 v2.0). Расхождение вне `allowed_diff` — blocker «drift» |
| Поведение, маршруты, права | docs в том же diff (`product-docs-alignment`): `canonical_routes.md`, contracts, ADR |
| Правка `.cursor/rules/*.mdc` | `npm run rules:sync`; `.claude/rules/` в stage, не руками |
| Любое | в stage только файлы задачи; существующие helpers переиспользованы (`ai-dry-deduplication`) |
| Задача с `Paths` | каждый путь H / N / S из задачи реализован так, как описан в связанном `§` spec / contract (признаки — registry §2.3.2a); N — код ошибки + ключ сообщения + UI-состояние; S — отказ на сервере |

Таблица + `Paths` задач — это ожидаемая форма. Независимую реконструкцию даёт только то, что её строит `reviewer` (свежий контекст), а не автор кода.

## 3. Diff (2c)

Читать через две линзы: § 4 (Checklist) и ожидаемая форма из § 2. Расхождение — находка **только** по таблице:

| Расхождение | Вердикт |
|-------------|---------|
| Отсутствует нужное | **Blocker**, если это поведение, безопасность или контракт docs; иначе suggestion |
| Лишнее | **Blocker**, если в stage чужие / несвязанные файлы; мёртвый код или лишняя абстракция в файлах задачи — suggestion; остальное вне scope |
| Иначе, но допустимо | отбросить |
| Иначе и хуже | находка, если есть **конкретный дефект** или ссылка на канон (rule + пункт); иначе отбросить |

**Конкретный дефект** — можно назвать вход/состояние → неверный результат (гонка, off-by-one, часовой пояс, N+1). Канон всего не покрывает, поэтому такой дефект — находка и **без** ссылки на правило.

Канон важнее собственного подхода: «я бы сделал иначе» без дефекта и без ссылки на канон — **не находка**.

## 4. Checklist

1. **Логические баги** — неверные условия, off-by-one, diff ≠ проблема из 2a
2. **Конвенции** — AGENTS.md + `.cursor/rules/*.mdc` (находка **со ссылкой на правило**)
3. **Next.js 16 / React 19** — лишний `'use client'`; `useEffect` vs derived state; `useOptimistic` / `'use cache'`; barrel imports
4. **Security** *(sensitive zones)* — секреты; нет валидации API; XSS; cookies без `httpOnly`/`secure`

LLM review **не заменяет** `npm run typecheck`, ESLint, тесты.

## 5. `reviewer` prompt

`reviewer` получает **только** проблему (2a) и сам строит ожидаемую форму до чтения hunks — независимая реконструкция. **Не** передавать: summary автора, черновик commit message, свою «ожидаемую форму». Один вызов на CU; в 2a — перечень задач CU из `P{N}_tasks.md`.

Вызов: Cursor `Task`, субагент `reviewer` (модель и `readonly: true` — из frontmatter), `run_in_background: false`. **Не** `bugbot`; **не** `generalPurpose`; **не** Background Agent; **не** «новый чат вручную».

```text
Review the local diff in <absolute repo root> before commit.
Scope: <staged only | uncommitted | branch vs main>. Ignore lockfiles, generated files, snapshots, .claude/rules/**.

Problem (from the user's request / commit unit tasks — do not infer intent from the diff):
<2a: 3–5 lines per task of the CU: Goal, Acceptance, linked § sections>
Required paths (from the tasks' `Paths`): <H [§] · N [§: cases] · S [§, authz row] | n/a — reason>

Three passes, in order:
1. Expected shape: from the problem, the required paths and repo canon (AGENTS.md, .cursor/rules/*.mdc, linked § docs) list what a correct change must contain. Before reading hunks run only `git status --short`.
2. Read the diff. Read other files only when a finding depends on them.
3. Report. A gap vs expected shape is a finding only if: something required is missing (Blocker if behavior/security/docs contract or a required H/N/S path); unrelated files are staged (Blocker); a concrete defect (input/state -> wrong result); or a canon violation (cite the rule). "I would do it differently" is not a finding. At most 10 findings, high confidence only.

Also check: logic bugs and edge cases; Next.js 16 / React 19 anti-patterns ('use client', useEffect, useOptimistic, barrel imports); <T3 / Paths S only: T3 checklist from your agent file — server-side policy, 401/403/IDOR, secrets, API validation, XSS, cookie httpOnly/secure>.

Return:
## Review Result
### Expected shape
### Blockers — [file:line] issue — rule or failing scenario
### Suggestions — [file:line] issue

Do NOT edit files. If no issues: "No blockers or suggestions found."
```

T3 / `Paths: S` → в prompt пункт про T3-чеклист; **отдельный bugbot/security-review subagent не вызывать**.

## 6. Пример trace

```text
Review: reviewer — P04-CU2, 120 строк
Проблема: тренер включает/выключает услугу; состояние должно сохраняться и быть видно клиенту.
Ожидаемая форма: Server Action с валидацией и проверкой владельца; ревалидация каталога; useOptimistic + toast.error при откате.
Находки: Blocker — нет ревалидации `/trainers/[id]` (toggle-service.ts:31); Suggestion — вынести маппинг DTO.
```
