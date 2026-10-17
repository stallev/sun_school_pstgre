---
description: Review protocol: problem → expected shape → diff. One gate per commit unit: pinned readonly `reviewer` for runtime code, diff-only for docs/tooling. Standalone or pre-commit (via agent-commit-pipeline). Do NOT use bugbot.
---
# Code review

**Commit orchestration:** [`agent-commit-pipeline.mdc`](agent-commit-pipeline.mdc) — вызывает этот rule в **pre-commit** mode на границе commit unit (CU).
**HOW (таблицы, вердикты, prompt для `reviewer`):** [`docs/guidelines/ai_code_review_protocol.md`](docs/guidelines/ai_code_review_protocol.md) — **читать перед** уровнем `reviewer`; для `skip` / `diff-only` не нужен.
**Routing:** [`model-routing.mdc`](model-routing.mdc) §3a / §6 — commit units и единый review-гейт.

**Принцип:** один review-гейт на CU. Дорогой независимый review (`reviewer`, Grok 4.7) — на каждый CU с runtime-кодом (профиль `standard` / `strict`; `lean` / `prototype` — § Depth); батчинг задач в CU делает каждый прогон оправданным. Docs / tooling — дёшево, в контексте автора. Лимиты — § Budget.

## Запрещено: bugbot

**Не вызывать** `subagent_type: "bugbot"` — платная функция Cursor. Независимый review — только субагент **`reviewer`** ([`.cursor/agents/reviewer.md`](../agents/reviewer.md), `readonly: true`). Skills `review-bugbot` / `review-security` **не использовать**; `generalPurpose` для review **не** вызывать.

## Triggers

| Mode | Когда | Уровень |
|------|-------|---------|
| **standalone** | Пользователь просит review («review diff», «проверь изменения», `@agent-code-review-subagent`) | Всегда `reviewer` (явный запрос); threshold **игнорировать** |
| **pre-commit** | Шаг 3 commit pipeline: граница CU или явный запрос коммита | Уровень по § Depth |

Standalone review **не** ведёт к commit. `reviewer` **не правит код** — только находки; исправления — оркестратор (или по запросу пользователя).

## Sensitive zones

**Единственный список** — pipeline, `model-routing.mdc` и registry §2.3.2a (признак S) ссылаются сюда. Глобы с `**/`: `apps/web/src/lib/auth/**` тоже zone.

| Zone |
|------|
| `**/auth/**`, `**/api/**` |
| `packages/db/**`, `packages/policy/**`, `**/migrations/**` |
| `**/proxy.ts`, `**/middleware.ts` |
| env/security config (CSP, cookies, `.env*`, `next.config.*`) |

## Depth (уровень review)

Уровень определяет **содержимое staged diff**, не type коммита: `chore`, меняющий CSP или `.env*`, — runtime-конфиг в sensitive zone. **Размер** = hand-written строки (added + removed); lockfiles, generated (`**/generated/**`), snapshots и зеркало `.claude/rules/**` не считаются и не читаются — их ловят `typecheck` / `rules:check`.

| Уровень | Когда (pre-commit) | Кто | Проходы |
|---------|--------------------|-----|---------|
| `skip` | ≤ 10 строк, вне zones, без runtime-логики (коммит вне CU по явному запросу) | — | — |
| `diff-only` | Нет runtime-кода: docs, `.mdc`, tests, tooling, комментарии, форматирование — **в том числе внутри zones** | оркестратор | только 2c |
| `reviewer` | Любой runtime-код в CU (в т.ч. T3 / `Paths: S`); явный запрос пользователя | субагент `reviewer` | 2a → 2b → 2c |

Старший уровень побеждает; сомнение — брать старший.

**Профиль качества (D6)** — [`docs/meta/project_quality_profile.md`](docs/meta/project_quality_profile.md) (нет профиля → `standard`) сдвигает уровень для runtime-кода:

| Профиль | Runtime-код в CU |
|---------|------------------|
| `standard`, `strict` | Таблица выше без изменений |
| `lean` | `reviewer` — только CU с T3 / `Paths: S` / runtime-кодом в sensitive zone; остальной runtime — `diff-only` |
| `prototype` | `diff-only` для всех CU; в CU с `Paths: S` оркестратор дополнительно проходит T3-чеклист из `reviewer` |

Явный запрос пользователя → всегда `reviewer`, независимо от профиля.

| Diff | Уровень |
|------|---------|
| Опечатка в комментарии / текст кнопки, 1–3 строки, вне CU | `skip` |
| CU из трёх T1-задач UI, 180 строк | `reviewer` |
| 1 строка логики в `lib/auth/session.ts` (отдельный T3-CU) | `reviewer` |
| Docs-CU фазы, 40 строк | `diff-only` |
| Server Action + миграция | `reviewer` |

## Protocol (кратко)

Три прохода в порядке — **не** «прочитать diff и оценить». Таблицы и формулировки — в guideline.

1. **2a Проблема** — 3–5 строк из задач CU в `P{N}_tasks.md` (Goal, Acceptance, `§`-ссылки, `Paths`) и просьбы пользователя, **не** из diff и **не** из commit message. Неясно → спросить до review; неинтерактивно — допущение в trace.
2. **2b Ожидаемая форма** — до hunks только `git status --short`; применимые строки таблицы из guideline (≤ 5 пунктов на задачу) **+ каждый путь H / N / S** из `Paths` задачи.
3. **2c Diff** — находка **только** по таблице вердиктов (guideline § 3): конкретный дефект (вход/состояние → неверный результат) или ссылка на канон. Требуемый путь H / N / S не реализован — blocker. «Я бы сделал иначе» — **не находка**.

## Budget (качество ↔ стоимость)

Стоимость: `skip` ≈ 0 · `diff-only` ≈ одно чтение diff · `reviewer` ≈ холодный старт + чтение diff, блокирует commit — самый дорогой.

1. **Порядок:** review — только после зелёной ВЕРИФИКАЦИИ (`typecheck` / `lint` / `rules:check`). Не тратить review на то, что ловят инструменты, и на код, который ещё перепишут.
2. **Потолок:** один `reviewer` на CU (не на задачу). После fix — **re-review только delta** (diff правки + прежние blockers). В драйвере фазы тот же blocker даёт одну фразу инварианта через `architect` и ещё одну дельту. Дальше blocker остался → остановиться и доложить пользователю, не крутить цикл.
3. **Suggestions** повторный review не запускают.
4. **Неизменное не пересматривать:** файлы, не менявшиеся с последнего review в этой сессии, не перечитывать.
5. **`reviewer` ограничен:** staged diff + задачи CU + rules из таблицы 2b (guideline § 2) + связанные `§` docs; репозиторий не исследует; ≤ 10 находок, только high-confidence.
6. **Docs drift** (`diff-only`): grep изменённого термина/пути по `docs/`, не аудит всех доков.

## Вызов `reviewer`

Получает **только** проблему (2a) и scope; сам строит 2b до чтения hunks. **Не** передавать: summary автора, черновик commit message, свою «ожидаемую форму». Prompt-шаблон — guideline § 5.

- Cursor `Task`: субагент `reviewer` (модель из frontmatter), `run_in_background: false`
- Claude Code `Agent`: `subagent_type: "reviewer"` (`.claude/agents/reviewer.md`, генерируется `npm run rules:sync`), `run_in_background: false`
- **Не** `bugbot`; **не** `generalPurpose`; **не** Background Agent; **не** «новый чат вручную»; отдельный security-review subagent **не** вызывать (T3-чеклист — в `reviewer`)

## Trace и disposition

Trace в ответе — **всегда**; первая строка начинается с `Review:`. Для `skip` / `diff-only` — одна строка: `Review: diff-only — docs-CU P03-CU4, 40 строк`. Для `reviewer` — ≤ 4 строк (`Review` · `Проблема` · `Ожидаемая форма` · `Находки`; пример — guideline § 6).

| Severity | Критерий |
|----------|----------|
| `blocker` | Баг, явное нарушение правила, security red flag, пропуск по таблице вердиктов, нереализованный путь H / N / S |
| `suggestion` | Стиль, опциональные улучшения |

| Result | pre-commit | standalone |
|--------|------------|------------|
| Blocker | Исправить → re-review delta ≤ 1 раза (§ Budget) → commit | Доложить; fix **только по запросу** |
| Suggestions only | Commit; suggestions — в отчёт (принять / отложить / отклонить) | Доложить (таблица Severity · Location · Finding); fix по запросу |
| No findings | Продолжить pipeline | «review found no issues» |

Не запускать commit после standalone review, если пользователь явно не просил commit.

## Diff scope

| Mode | Default scope | Override |
|------|---------------|----------|
| pre-commit | staged diff (`git diff --staged`) | — |
| standalone | uncommitted / working tree | full branch — если просят review ветки / PR |

## Related

**agent-commit-pipeline** · **model-routing** · **product-docs-alignment** · **domain-literals-and-codes** · **ai-dry-deduplication**
