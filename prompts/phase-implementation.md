# Запуск имплементации фазы

**Куда вставлять:** один раз на фазу в **новый** сеанс агента.  
**Что подставить:** `PNN` (`P02`, …) и **среду** — `Cursor AI` или `Claude Code` (см. ниже).  
**Протокол:** [`docs/meta/ai_agent_model_routing.md`](../docs/meta/ai_agent_model_routing.md) § Phase driver · [`docs/guidelines/agent-phase-orchestration.md`](../docs/guidelines/agent-phase-orchestration.md).

---

## Выбор среды (обязательно в стартовой фразе)

| | **Cursor AI** | **Claude Code** |
|---|----------------|-----------------|
| Где | Новый чат **Cursor Agent** | Терминал + CLI `claude`, или чат Cursor только для **запуска** драйвера в фоне |
| Драйвер | `node scripts/run-phase.mjs PNN` (default: `--environment cursor`) — **на каждый CU**; чат — оркестратор, CU делает субагент `implementer` | `node scripts/run-phase.mjs PNN --environment claude-code` — **цикл** до конца фазы или ошибки |
| Harness | `cursor` (промпт на stdout, агент в чате выполняет CU) | `claude` (`claude -p` headless, JSON в `.local/phase-runs/*-session-*.json`) |
| Разрешения | User rules + `agent-commit-pipeline`; Shell для `cu-*` | [`.claude/settings.json`](../.claude/settings.json) allowlist |
| Не смешивать | Не запускать `--environment claude-code` внутри Cursor Agent как способ «сделать фазу в чате» | Не ждать, что Cursor сам крутит CU без драйвера |

Эквиваленты: `--environment cursor` ≡ `--harness cursor` (default); `--environment claude-code` ≡ `--harness claude`. Одновременно противоречащие пары флаг даёт ошибку `environment-harness`.

---

## Фраза: Cursor AI

```text
Среда: Cursor AI. Запусти имплементацию фазы PNN целиком в этом чате. Ты тонкий оркестратор: код пишет субагент implementer, по одному свежему вызову на CU.

Цикл:
1) node scripts/run-phase.mjs PNN --environment cursor
2) по первой строке stdout:
   - STATUS: cu <CU> — выполни блок ORCHESTRATOR; блок IMPLEMENTER передай субагенту implementer дословно
   - STATUS: complete PNN — пройди smoke из .local/phase-runs/PNN-smoke.md и доложи
   - STATUS: smoke-blocking <CU> — остановись и доложи
   - STATUS: dirty <CU> или любой другой ненулевой код — остановись и доложи
3) после коммита — одна строка «<CU> — <hash>» и снова шаг 1

Сам код не пиши, исходники и git diff не читай, итоги прошлых CU не пересказывай.
Задачи фазы: docs/implementation/mvp/tasks/PNN_tasks.md.
Протокол: docs/meta/ai_agent_model_routing.md § Phase driver.

Коммиты по Commit: auto для всех CU этой фазы разрешены заранее. Между CU не спрашивай подтверждения. Push не делай. Сырой git add и git commit не вызывай.

Не используй --environment claude-code в этом чате.
```

Чат растёт на несколько строк за CU: код, вывод проверок и diff остаются в контексте `implementer` и `reviewer`. Если чат всё же исчерпан, откройте новый с той же фразой: драйвер продолжит с первого неотмеченного CU.

---

## Фраза: Claude Code

```text
Среда: Claude Code. Запусти имплементацию фазы PNN целиком через headless harness.

Запусти драйвер как фоновую задачу (run_in_background), вывод только в файл:
node scripts/run-phase.mjs PNN --environment claude-code > .local/phase-runs/driver.log 2>&1
Не запускай его как foreground-команду в чате и не читай лог, пока задача не закончилась.

Задачи фазы: docs/implementation/mvp/tasks/PNN_tasks.md.
Протокол: docs/meta/ai_agent_model_routing.md § Phase driver.

Коммиты по Commit: auto для всех CU этой фазы разрешены заранее. Между CU не спрашивай подтверждения. Push не делай. Сырой git add и git commit не вызывает чат — только scripts/cu-commit.mjs внутри сеанса claude. Пока драйвер работает, работу CU в этом чате не дублируй.

Когда задача закончится, прочитай последние 40 строк .local/phase-runs/driver.log и доложи код выхода, какие CU закоммичены, путь к .local/phase-runs/PNN-smoke.md и файлы .local/phase-runs/*-session-*.json с расходом токенов.

Ненулевой код означает остановку фазы. Не перезапускай команду сам. Доложи причину и остановись.
```

Перед первым запуском: `claude` в PATH, [`.claude/settings.json`](../.claude/settings.json) с allowlist (см. agent-phase-orchestration §8).

---

## Терминал (один CU, любая среда)

```bash
# Cursor: промпт одного CU
node scripts/run-phase.mjs PNN --environment cursor

# Claude Code: то же для отладки без цикла (не headless-агент)
node scripts/run-phase.mjs PNN --environment cursor   # промпт вручную в claude -p

# Полный цикл Claude Code
node scripts/run-phase.mjs PNN --environment claude-code
```

`--harness print` — алиас dry-run для `cursor` (тот же промпт).

## Коды выхода

- `0` — фаза завершена (`STATUS: complete`) **или** (режим `cursor`) выдан промпт следующего CU (`STATUS: cu <CU>`). Различать по первой строке stdout, не по тексту stderr.
- `2` — `Smoke: blocking` у закрытого CU.
- `1` — грязное дерево вне Files CU; CU не отмечен; `claude` не найден (`claude-code`); ошибка сеанса; проверка/хук/reviewer после повтора; конфликт `--environment` и `--harness`.
