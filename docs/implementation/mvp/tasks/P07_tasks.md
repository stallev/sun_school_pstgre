# P07 Tasks — Переходный период согласий и prod-готовность

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.1  
**Дата:** 2026-10-11  
**Волна:** W11-14  
**Зависит от:** [`P07_phase_description.md`](../phases_tasks_descriptions/P07_phase_description.md), [`adr_011_transitional_child_consent.md`](../../../prds/07_governance/adr_011_transitional_child_consent.md), [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md), [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md)  
**Связанные документы:** [`adr_001`](../../../prds/07_governance/adr_001_stack_and_runtime.md), [`adr_009`](../../../prds/07_governance/adr_009_bible_translations_and_verse_numbering.md), [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md), [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md), [`P06_tasks.md`](./P06_tasks.md)

---

## Purpose

Принять перенесённых владельцем детей в переходный период согласий, пройти доступность и наблюдаемость, развернуть prod. **Перенос данных — вне проекта** (владелец, 2026-10-11). DoD — [`P07_phase_description.md`](../phases_tasks_descriptions/P07_phase_description.md).

## Phase DoR audit (lean: оркестратор inline)

- [ ] P06 DoD выполнен
- [ ] ADR-011 принят; юридическая проверка переходного периода (ADR-011 Q-01) — до prod
- [ ] Документы W12 (`migration_runbook`, `vercel_deploy_guide`, `neon_prisma_migrations_guide`) существуют
- [ ] Приложения Google/Telegram prod и домен настроены (ручной шаг владельца)

## Commit plan

### P07-CU0 — docs(prds): add transitional consent ADR and contract amendments · ✔ выполнено 2026-10-11 · Commit: done

- [x] P07-T0 · T2 · Spec: [спец. СО-5, §13](../../../my_specs/sunday_school_data_analytics_spec.md) · Contract: [school_year §5.7–§5.9](../contracts/school_year_and_groups_contract.md)
      Files: `docs/prds/07_governance/adr_011_transitional_child_consent.md`, правки `database_schema_v1.md` §4–§5.3, `lifecycle_models.md` §5.5, контракт W8-04, индекс
      Acceptance: ADR с решением (статус `LEGACY_PENDING`, срок, правила зачисления/окончания периода), Paths, Affected docs → DoR §2.3.6
      Paths: n/a — docs-only

### P07-CU1 — feat(school): add legacy pending consent status and deadline handling · Review: reviewer · Commit: auto

- [ ] P07-T1 · T3 · ADR: [adr_011](../../../prds/07_governance/adr_011_transitional_child_consent.md) · Invariants: INV-08
      Files: `packages/db/prisma/migrations/*`, `packages/domain/src/school/can-enroll.ts`, `apps/web/src/data/school/{list-legacy-pending,resolve-legacy-consent,extend-legacy-deadline}.ts`
      Acceptance: `LEGACY_PENDING` допускает зачисление только для перенесённых до срока; новый ребёнок требует `ACTIVE`; `recordPaperConsent` переводит в `ACTIVE`; `extendLegacyDeadline` (причина, журнал); автоудаления нет → тесты на **синтетических** данных
      Paths: H [ADR-011 §7] · N [срок истёк, согласие отсутствует, не-перенесённый] · S [AZ-20, AZ-22: только admin; teacher видит «есть/нет»]
- [ ] P07-T2 · T1 · UX: [forms §5](../../../design/forms_and_validation_ux.md) · Prototype: `people`
      Files: `components/admin/{LegacyConsentBadge,LegacyConsentList}.tsx`, `components/shell/ConsentDeadlineBanner.tsx`
      Acceptance: список «без согласия (перенесён)», срок, оставшиеся дни, баннер у admin и пометка у teacher → ручной smoke
      Paths: H · N [срок истёк] · S [AZ-21]
- [ ] P07-T2a · T2 · Doc: [P07 §Совместимость](../phases_tasks_descriptions/P07_phase_description.md)
      Files: тест-фикстуры `packages/db/test/fixtures/legacy-compatible/*` (синтетика), проверка инвариантов
      Acceptance: набор синтетических данных, соответствующих §Совместимость п. 3–6, проходит `enrollPupil`/аналитику/кирпичики без нарушений → тест
      Paths: H · N [нарушение требования → тест падает] · S [нет реальных ПД]

**CU DoD:** `typecheck` · `lint` · `test` · `prisma migrate` на копии

### P07-CU2…CU4 — исключены из проекта

Решение владельца 2026-10-11: перенос данных из действующего приложения (маппинг, раннер импорта, сверка сходимости, отчёт сирот и дублей) **реализует владелец вне проекта**. Требования совместимости — [`P07_phase_description.md`](../phases_tasks_descriptions/P07_phase_description.md) §Совместимость и [`migration_runbook.md`](../../../prds/06_operations/migration_runbook.md) §11. Нумерация CU сохранена, чтобы не ломать ссылки.

### P07-CU5 — fix(web): complete accessibility pass on key screens · Review: diff-only · Commit: auto

- [ ] P07-T7 · T1 · Rule: `ui-semantics-a11y` · UX: [UX-03 §9](../../../design/visual_identity_contract.md), [global_shell_spec §16](../specs/global_shell_spec.md)
      Files: компоненты по результатам прохода
      Acceptance: чек-лист для `/login`, `/register`, `/pending`, `/today`, проверка ДЗ, `/bricks`, `/approvals`, `/deletions`, `/audit` — клавиатура, фокус, имена, контраст по таблице UX-03, 390 px, `prefers-reduced-motion`; дефекты исправлены → отчёт в CU
      Paths: n/a — a11y-исправления без изменения поведения (по §2.3.2a)

**CU DoD:** `typecheck` · `lint` · ручной проход чек-листа

### P07-CU6 — feat(web): add Sentry observability with PII filtering · Review: reviewer · Commit: auto

- [ ] P07-T8 · T3 · Spec: [auth_runtime_spec §8](../../../prds/05_runtime/auth_runtime_spec.md) · Profile: D9
      Files: `apps/web/sentry.{client,server,edge}.config.ts`, `instrumentation.ts`, `lib/observability/scrub.ts`
      Acceptance: события серверных ошибок и `logger.error` Auth.js; `beforeSend` удаляет значения форм, email, ФИО, токены; `release`/`environment` по `APP_ENV`; `digest` попадает в событие → тест фильтра
      Paths: H · N [Sentry недоступен — приложение работает] · S [нет ПД; DSN в env]

**CU DoD:** `typecheck` · `lint` · `test` · проверка события в dev

### P07-CU7 — chore(config): prepare production deployment · Review: reviewer · Commit: auto

- [ ] P07-T9 · T3 · ADR: [adr_001 §3.4](../../../prds/07_governance/adr_001_stack_and_runtime.md) · Guide: [vercel_deploy_guide](../guides/vercel_deploy_guide.md)
      Files: `vercel.json` (без `crons`), `next.config.*` (заголовки, CSP), `.env.example`, ссылки в guides
      Acceptance: Node 24.x; pooled/direct URL; `AUTH_*` отдельные; `APP_ENV=prod` и маркер БД; нет `NEXT_PUBLIC_*` секретов; заголовки безопасности и cookie; `/design-system` 404; dev-переключатель отсутствует → проверка сборки и маршрутов
      Paths: H · N [`APP_ENV` не совпал] · S [CSP, cookie, секреты; INV-24]
- [ ] P07-T10 · T3 · Spec: [seed_data_spec §4](../../../prds/03_data_model/seed_data_spec.md) · Runbook: [migration_runbook §8](../../../prds/06_operations/migration_runbook.md)
      Files: релизные шаги: миграции → `seed:reference` → `seed:bible` (RST; NIV по лицензии) → первый admin
      Acceptance: на пустой prod-подобной ветке приложение работает; в БД нет фикстур → ручной smoke
      Paths: H · N [NIV без флага] · S [маркер `prod`]

**CU DoD:** `typecheck` · `lint` · `test` · `next build` · smoke на preview

### P07-CU8 — docs(prds): close pre-production checklist · Review: diff-only · Commit: auto

- [ ] P07-T11 · T2 · Files: `docs/prds/06_operations/` (чек-лист) или раздел `migration_runbook`; `/privacy` v1 (финал); ADR-009 (лицензия)
      Acceptance: лицензия NIV подтверждена (или BSB выбран); юр. срок удаления и переходного периода проверены; окно backup Neon указано в тексте согласия; security review T3-зон выполнен; план отката → чек-лист с датами и ответственными
      Paths: n/a — docs-only

**CU DoD:** `encoding:check` · `docs:links`

### P07-CU9 — docs(docs): sync P07 docs and record production smoke · Review: diff-only · Commit: auto

- [ ] P07-T12 · T0 · Files: `docs/**`, индекс, `AGENTS.md`/`project-context.mdc` («Текущая фаза»)
      Acceptance: smoke prod пройден (H/N/S), статус проекта обновлён, нет drift
      Paths: n/a — docs-only

## Verification (phase)

- [ ] Все CU закоммичены; trace `Review: …`
- [ ] Phase DoD из [`P07_phase_description.md`](../phases_tasks_descriptions/P07_phase_description.md)
- [ ] Docs sync — в CU9

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P07_phase_description.md`](../phases_tasks_descriptions/P07_phase_description.md) | DoD |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W11-14) |
| 2026-10-11 | v1.1 — CU2–CU4 исключены (перенос данных вне проекта); добавлена P07-T2a (совместимость) |
