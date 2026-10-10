# Синхронизация Cursor rules → Claude Code rules

**Тип:** Playbook (переносимый)  
**Статус:** Canonical для механизма  
**Источник реализации:** этот репозиторий (`scripts/sync-claude-rules.mjs`)

Документ описывает подход, который можно скопировать в другой проект. Содержимое правил (стек, UI, фазы) сюда не входит — только загрузчики, frontmatter и скрипт.

---

## Зачем

Cursor и Claude Code **не читают одни и те же файлы**. Если держать два каталога вручную, MUST расходятся. Решение: **одно SoT-тело**, два загрузчика.

| Инструмент | Что грузит | Frontmatter |
|------------|------------|-------------|
| Cursor | `.cursor/rules/*.mdc` | `alwaysApply`, `globs` |
| Claude Code | `.claude/rules/*.md` | `paths` (YAML-список) или отсутствие `paths` = always-on |

Обычный `.md` в `.cursor/rules/` Cursor **игнорирует**. Импорт `@файл.mdc` из `CLAUDE.md` Claude Code **пропускает**. Поэтому зеркало генерируется скриптом, а не ссылками.

```
.cursor/rules/*.mdc   (править только здесь)
        │
        ▼  npm run rules:sync
.claude/rules/*.md    (не править руками)
```

HOW-гайды (`docs/guidelines/`) в rules **не кладут** — они не auto-load; агент читает их по индексу, когда реализует UI.

---

## Слои инструкций (скопировать идею, не содержимое)

| Слой | Где | Auto-load | Кто правит |
|------|-----|-----------|------------|
| Narrative | `AGENTS.md` | Cursor: сам файл. Claude: `@AGENTS.md` в `CLAUDE.md` | вручную |
| MUST (SoT) | `.cursor/rules/*.mdc` | Cursor: `alwaysApply` / `globs` | **только здесь** |
| MUST (зеркало) | `.claude/rules/*.md` | Claude: без `paths` = always-on; с `paths` = glob | **только sync** |
| HOW | `docs/guidelines/` (или аналог) | нет | вручную |

`CLAUDE.md` — тонкий указатель, не дублирует тела MUST.

Пример `CLAUDE.md`:

```markdown
@AGENTS.md

## Claude Code

MUST: generated `.claude/rules/*.md` (`npm run rules:sync` from `.cursor/rules/*.mdc`).
Do not edit those `.md` files by hand. Do not `@`-import `.mdc` (Claude Code skips them).
```

В `AGENTS.md` явно написать: править только `.mdc`, затем `rules:sync` / `rules:check`.

---

## Контракт frontmatter

### Cursor (вход)

Файл: `.cursor/rules/<name>.mdc`

Обязателен YAML-блок в начале. Парсер в этом репо **линейный**: `ключ: значение` на одной строке, без вложенных объектов, без YAML-списков на входе.

```yaml
---
description: Коротко, зачем правило
globs: src/app/**/*,src/lib/**/*.ts
alwaysApply: false
---

# Заголовок

Тело правила (Markdown). Копируется в зеркало как есть.
```

Always-on:

```yaml
---
description: Стек и инварианты
alwaysApply: true
---
```

Поля:

| Поле | Смысл для Cursor |
|------|------------------|
| `description` | Подсказка в UI Cursor |
| `alwaysApply: true` | Правило всегда в контексте |
| `alwaysApply: false` + `globs` | Правило только при совпадении путей |
| `globs` | CSV на одной строке **или** YAML-список `- glob` на следующих строках |

`README.md` в `.cursor/rules/` допустим — скрипт берёт только `*.mdc`.

### Claude Code (выход)

Файл: `.claude/rules/<name>.md` (stem тот же, расширение `.md`).

| Условие на входе | Frontmatter на выходе |
|------------------|------------------------|
| `alwaysApply: true` | `description` (если был). **Нет** `paths`. Claude считает always-on |
| `alwaysApply` не true и есть `globs` | `description` + `paths:` YAML-список (каждый glob в кавычках) |
| `alwaysApply` не true и **нет** `globs` | Только `description`. Для Claude это **тоже always-on** |

`alwaysApply` в зеркало **не копируется** — у Claude нет этого ключа.

Пример scoped-правила:

```yaml
---
description: Next.js App Router
paths:
  - "src/app/**/*"
  - "src/proxy.ts"
  - "next.config.ts"
---
```

Пример always-on:

```yaml
---
description: Stack, invariants
---
```

---

## Правила, которые нельзя нарушать

1. **Не править** `.claude/rules/*.md` руками. Любой ручной фикс сотрётся при следующем sync.
2. **Не класть README и прочий `*.md` в `.claude/rules/`**. Любой `.md` там Claude считает rule; без `paths` он станет always-on.
3. **Не импортировать `.mdc` из `CLAUDE.md` через `@`**.
4. **Не коммитить drift.** Зеркало **в git** (не в `.gitignore`), чтобы Claude Code на другой машине видел те же MUST без запуска sync. CI (или хук) гоняет `--check`.
5. Не класть индекс/HOW в каталог Claude rules. Индекс Cursor — `.cursor/rules/README.md`.
6. Держать мало always-on файлов. Scoped (`globs` / `paths`) — для узких тем (роутер, auth, UI). Иначе раздувается контекст обоих агентов.

Крайний случай: `alwaysApply: false` без `globs` → Claude получит always-on. Либо задайте globs, либо поставьте `alwaysApply: true` явно.

---

## Скрипт

Путь в этом репо: [`scripts/sync-claude-rules.mjs`](../scripts/sync-claude-rules.mjs). Можно скопировать файл как есть.

npm-скрипты:

```json
{
  "scripts": {
    "rules:sync": "node scripts/sync-claude-rules.mjs",
    "rules:check": "node scripts/sync-claude-rules.mjs --check"
  }
}
```

Поведение:

| Режим | Что делает |
|-------|------------|
| без флагов | Перезаписывает ожидаемые `.md`, **удаляет лишние** `.md` в `.claude/rules/` и `.claude/agents/`, создаёт каталоги при отсутствии |
| `--check` | Exit 1 при extra / missing / drift или расхождении tier-копий; ничего не пишет |

Оба режима сначала проверяют tiers: каждое активное правило в корне `.cursor/rules/` обязано иметь копию в `tiers/` с тем же содержимым (исключение — `project-context.mdc`, заполненный из `project-context.template.mdc`).

Алгоритм write (rules):

1. Прочитать все `*.mdc` в `.cursor/rules/` (не рекурсивно). **Пропустить `*.template.mdc`.**
2. Распарсить frontmatter + тело; сохранить стиль перевода строк исходника (LF / CRLF). UTF-8 BOM в начале файла снимается.
3. Собрать ожидаемое имя `<stem>.md` и текст Claude-файла.
4. Записать все ожидаемые файлы.
5. Удалить `.md`, которых нет среди ожидаемых.

Агенты: каждый `.cursor/agents/<name>.md` → `.claude/agents/<name>.md` с тем же телом. Frontmatter: `name`, `description`; `model` — алиас Claude по префиксу модели Cursor (`grok*` → `opus`, `composer*` → `sonnet`, иначе `inherit`); `readonly: true` → `tools: Read, Grep, Glob, Bash`. Маппинг — константа в скрипте.

Алгоритм check: сравнить имена (лишние / недостающие) и содержимое без учёта LF / CRLF (`core.autocrlf` переписывает переводы строк при checkout).

Ограничения парсера (осознанные):

- Frontmatter обязан быть `---\n...\n---\n` в начале файла (допустим BOM).
- Значения `key: value` на одной строке. **`globs`:** CSV **или** YAML-список `- item` на следующих строках (как в существующих Cursor rules).
- Комментарии `#` в frontmatter пропускаются.
- Вложенные ключи и произвольный многострочный YAML (кроме списка `globs`) — не поддерживаются.

---

## Чеклист внедрения в другом репозитории

1. Создать `.cursor/rules/*.mdc` с корректным frontmatter (`alwaysApply` и/или `globs`). Не класть `*.template.mdc` в активный корень без rename.
2. Скопировать `scripts/sync-claude-rules.mjs` (пути `.cursor/rules` и `.claude/rules` зашиты относительно корня репо).
3. Добавить `rules:sync` и `rules:check` в `package.json`.
4. Запустить `npm run rules:sync`. Проверить, что `.claude/rules/` совпадает по числу stem-файлов и что scoped-правила имеют `paths`.
5. Добавить тонкий `CLAUDE.md` (`@AGENTS.md` + запрет ручного редактирования зеркала и `@` на `.mdc`).
6. В narrative (`AGENTS.md` или аналог) описать SoT и команды sync/check.
7. Закоммитить `.cursor/rules/`, `.claude/rules/`, скрипт, `CLAUDE.md`.
8. Подключить `npm run rules:check` в CI (и по желанию в pre-commit). После правки `.mdc` агент/человек обязан прогнать `rules:sync` в той же задаче.

Проверка вручную:

```bash
npm run rules:sync
npm run rules:check
```

Имитация drift: изменить `.claude/rules/foo.md` → `rules:check` должен упасть. Вернуть sync.

---

## Что не входит в этот механизм

- Содержимое конкретных MUST (стек, auth, UI) — это продукт целевого репо.
- Skills Cursor / Claude, MCP, `docs/guidelines/` — отдельные слои.
- `.claude/worktrees/` и прочие служебные каталоги Claude — не канон правил.
- Двусторонняя синхронизация: Claude → Cursor **нет**. SoT только `.mdc` и `.cursor/agents/*.md`.
