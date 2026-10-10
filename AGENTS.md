# AI-First Monorepo Starter — сопровождение шаблона

Этот репозиторий — **стартовый шаблон**, а не продукт. Здесь нет кода приложения и продуктовой документации; есть методология, правила агента, guidelines, промпты bootstrap и scaffold.

- **Начать новый проект:** [`BOOTSTRAP.md`](BOOTSTRAP.md). В созданном проекте этот файл заменяется на [`AGENTS.template.md`](AGENTS.template.md) (шаг 3 BOOTSTRAP / P0).
- **Этот файл** — инструкции для агента, который **правит сам шаблон**.

## Что где лежит

| Путь | Назначение |
|------|------------|
| `.cursor/rules/tiers/` | **SoT всех правил** (T0 / T1 / T2). Манифест: [`.cursor/rules/README.md`](.cursor/rules/README.md) |
| `.cursor/rules/*.mdc` | Активированные копии — в шаблоне только T0 |
| `.claude/rules/` | Generated mirror (`npm run rules:sync`) — не править руками |
| `.cursor/agents/` | Субагенты `architect` / `implementer` / `reviewer` (SoT) |
| `.claude/agents/` | Generated для Claude Code (`npm run rules:sync`) — не править руками |
| `docs/meta/` | Методология, registry, routing, шаблон задач фазы (статус «Template») |
| `docs/guidelines/` | Канон реализации (HOW) |
| `prompts/` | P0–P6 bootstrap; карта — [`prompts/00-orchestration.md`](prompts/00-orchestration.md) |
| `scaffold/`, `specs/` | Заготовки, которые копирует P5 / P6 |
| `docs/examples/pulse/` | Read-only snapshot референса Pulse — **не канон**, не править |

## Правила правки шаблона

1. **Правило агента** — править копию в `tiers/<tier>/`; если правило из T0 — скопировать её в корень `.cursor/rules/`; затем `npm run rules:sync`. Корневая копия, расходящаяся с tier-копией, роняет `rules:check`.
2. **Не заполнять placeholders** (`{{PROJECT_NAME}}` и др.) и не добавлять доменную специфику: шаблон остаётся параметризованным. Примеры из Pulse помечать как примеры.
3. **Single source:** списки и количества правил — только в манифесте; уровни строгости, модули и security floor — только в `docs/meta/project_quality_profile.template.md`; критерии H/N/S — только в registry §2.3.2a; уровни review — только в `agent-code-review-subagent.mdc`. Остальные документы ссылаются, не копируют.
4. **Ссылки** — правила (`.mdc`) пишут пути от корня репозитория; markdown-документы — относительные пути. Ссылки на документы, которые создаются волнами (`docs/prds/`, `docs/design/`, `docs/implementation/` …), допустимы.
5. **Кодировка** — только UTF-8.
6. Изменение, затрагивающее поведение bootstrap, синхронно отражать в `BOOTSTRAP.md`, `prompts/00-orchestration.md` и затронутых промптах (**product-docs-alignment**).

## Проверки перед коммитом

```bash
npm run rules:check
npm run deps:check
npm run encoding:check
npm run docs:links
```

Коммиты — по **agent-commit-pipeline** (`<branch>: type(scope): subject`); изменения шаблона — docs / config / tooling, уровень review `diff-only`, если нет runtime-кода.

## Claude Code

[`CLAUDE.md`](CLAUDE.md) импортирует этот файл и загружает зеркало `.claude/rules/`. Playbook синхронизации: [`docs/claude-code-cursor-rules-sync.md`](docs/claude-code-cursor-rules-sync.md).
