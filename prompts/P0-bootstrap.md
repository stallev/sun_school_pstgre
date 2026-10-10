# P0 — Bootstrap проекта из шаблона

## Роль
Software Architect (AI-first monorepo).

## Preconditions
- [ ] Репозиторий проекта создан из шаблона (BOOTSTRAP §1)
- [ ] Gate **G0**: `docs/meta/project_quality_profile.md` создан ([`P00-quality-profile.md`](P00-quality-profile.md))
- [ ] [`PLACEHOLDERS.md`](../PLACEHOLDERS.md) заполнен
- [ ] (Рекомендуется) visual seed в `docs/prototypes/{{MAIN_PROTOTYPE_HTML}}` — см. [`P1-html-prototype-claude-desktop.md`](P1-html-prototype-claude-desktop.md)

## Inputs (READ FIRST)
- [`BOOTSTRAP.md`](../BOOTSTRAP.md) — полная инструкция bootstrap
- [`README.md`](../README.md)
- [`docs/meta/ai_first_project_methodology.md`](../docs/meta/ai_first_project_methodology.md)
- [`docs/reference/pulse_project_reference.md`](../docs/reference/pulse_project_reference.md)
- Pulse snapshot: [`docs/examples/pulse/`](../docs/examples/pulse/) (поставляется шаблоном)

## Task
1. Заменить все `{{PLACEHOLDER}}` (verify: `rg '{{'`)
2. Заменить AGENTS и создать project-context:
   - `AGENTS.template.md` → `AGENTS.md` (перезаписывает AGENTS.md сопровождения шаблона)
   - скопировать `.cursor/rules/tiers/t0-always/project-context.template.mdc` → `.cursor/rules/project-context.mdc` (tier-шаблон не трогать)
3. Создать пустую структуру `docs/` **без удаления существующих файлов**:
   ```
   docs/{default_docs,prototypes,reference,examples/pulse,meta,prds,design,guidelines,implementation/mvp/{contracts,specs,phases_tasks_descriptions,tasks,guides},architecture_learning_pack,incidents}
   ```
   Канон прототипов: **`docs/prototypes/`**. Не создавать `docs/prototype/`. **MUST NOT** overwrite `docs/prototypes/*.html`.
4. Guidelines уже лежат в `docs/guidelines/` (индекс `docs/guidelines/README.md`) — **не копировать**
5. **T0 cursor rules** уже активны в шаблоне — не копировать повторно; создать только `project-context.mdc` (шаг 2)
6. Добавить `.gitkeep` в пустые scaffold dirs (не в `docs/prototypes/`, если там уже HTML)
7. `npm run rules:sync` (или `node scripts/sync-claude-rules.mjs`). Не править `.claude/rules/` руками.

## Forbidden
- Implementation code (кроме config skeleton в P5)
- Domain-specific PRD content
- Активация T1/T2 rules
- Удаление / перезапись HTML-прототипа

## Verification
- [ ] `AGENTS.md` — проектный (из `AGENTS.template.md`), ссылается на methodology
- [ ] `CLAUDE.md` exists at root, содержит `@AGENTS.md` и указание не править `.claude/rules/` / не `@` на `.mdc`
- [ ] `.cursor/rules/project-context.mdc` — no unreplaced `{{`
- [ ] T0 rules в `.cursor/rules/` (без `*.template.mdc`)
- [ ] `npm run rules:check` pass; `.claude/rules/` stem-match активных T0 `.mdc`
- [ ] `docs/meta/` готов для P2
- [ ] Guidelines на месте в `docs/guidelines/` (без копии в корне)
- [ ] Если seed был — `docs/prototypes/{{MAIN_PROTOTYPE_HTML}}` на месте

## Next
→ [`P1-html-prototype.md`](P1-html-prototype.md) (ingest, если seed есть) или interim `docs/default_docs/` если prototype позже
