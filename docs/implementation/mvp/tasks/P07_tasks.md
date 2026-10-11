# P07 Tasks — Миграция из действующего приложения и prod-готовность

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W11-14  
**Зависит от:** [`P07_phase_description.md`](../phases_tasks_descriptions/P07_phase_description.md), [`sunday_school_data_analytics_spec.md`](../../../my_specs/sunday_school_data_analytics_spec.md) §13, §15, [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md), [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md)  
**Связанные документы:** [`adr_001`](../../../prds/07_governance/adr_001_stack_and_runtime.md), [`adr_009`](../../../prds/07_governance/adr_009_bible_translations_and_verse_numbering.md), [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md), [`P06_tasks.md`](./P06_tasks.md)

---

## Purpose

Перенести данные, закрыть переходный период согласий, пройти доступность и наблюдаемость и развернуть prod. DoD — [`P07_phase_description.md`](../phases_tasks_descriptions/P07_phase_description.md).

## Phase DoR audit (lean: оркестратор inline)

- [ ] P06 DoD выполнен
- [ ] Владелец предоставил экспорт старых данных (не в репозитории); формат известен
- [ ] Q-01 (модель переходного согласия — ADR-011) и Q-03 (сдвиг оценок за стихи) приняты 2026-10-11; юридическая проверка переходного периода (ADR-011 Q-01) — до prod
- [ ] Документы W12 (`migration_runbook`, `vercel_deploy_guide`, `neon_prisma_migrations_guide`) существуют или создаются перед CU3/CU7
- [ ] Приложения Google/Telegram prod и домен настроены (ручной шаг владельца)

## Commit plan



- [x] P07-T0 · T2 · Spec: [спец. СО-5, §13](../../../my_specs/sunday_school_data_analytics_spec.md) · Contract: [school_year §5.7–§5.9](../contracts/school_year_and_groups_contract.md)
      Files: `docs/prds/07_governance/adr_011_transitional_child_consent.md`, правки `database_schema_v1.md` §4–§5.3, `lifecycle_models.md` §5.5, контракт W8-04, индекс
      Acceptance: ADR с решением (статус `LEGACY_PENDING`, срок, правила зачисления/окончания периода), Paths, Affected docs → DoR §2.3.6
      Paths: n/a — docs-only

**CU DoD:** `encoding:check` · `docs:links`

### P07-CU1 — feat(school): add legacy pending consent status and deadline handling · Review: reviewer · Commit: auto

- [ ] P07-T1 · T3 · ADR: [adr_011](../../../prds/07_governance/adr_011_transitional_child_consent.md) (создан 2026-10-11) · Invariants: INV-08
      Files: `packages/db/prisma/migrations/*`, `packages/domain/src/school/can-enroll.ts`, `apps/web/src/data/school/{list-legacy-pending,resolve-legacy-consent}.ts`
      Acceptance: `LEGACY_PENDING` допускает зачисление только для перенесённых; по окончании срока — решение admin (подтвердить бумажным согласием / продлить / создать запрос на удаление); журнал → тесты
      Paths: H · N [срок истёк, согласие отсутствует] · S [AZ-20, AZ-22: только admin; teacher видит «есть/нет»]
- [ ] P07-T2 · T1 · UX: [forms §5](../../../design/forms_and_validation_ux.md) · Prototype: `people`
      Files: `components/admin/{LegacyConsentBadge,LegacyConsentList}.tsx`, `components/shell/ConsentDeadlineBanner.tsx`
      Acceptance: список «без согласия (перенесён)», срок, баннер у admin и пометка у teacher → ручной smoke
      Paths: H · N [срок истёк] · S [AZ-21]

**CU DoD:** `typecheck` · `lint` · `test` · `prisma migrate` на копии

### P07-CU2 — feat(db): add legacy data mapping with synthetic fixtures · Review: reviewer · Commit: auto

- [ ] P07-T3 · T3 · Spec: [спец. §13 таблица и правила](../../../my_specs/sunday_school_data_analytics_spec.md)
      Files: `packages/db/migration/legacy/{map-grade,map-year,map-assignment,map-pupil-enrollment,map-lesson,map-check,map-bricks,map-event,map-settings}.ts`, `fixtures/synthetic/*`
      Acceptance: чистые функции; год схлопывается по названию и датам; ведущий — единственный преподаватель группы, иначе пусто; оценки за стихи: поле i урока N → стих i урока N−1; дубли «урок × ученик» — проверенная/изменённая позже; сироты в отчёт → unit-тесты на **синтетике** (реальных данных в репозитории нет)
      Paths: H [§13] · N [сироты, дубли, нет следующего урока] · S [ПД: фикстуры вымышленные; `.local` вне git]
- [ ] P07-T4 · T3 · Files: `packages/db/migration/legacy/report.ts`
      Acceptance: отчёт: перенесено, дублей, сирот (по типам), изменённые правила, без ФИО в логах (идентификаторы) → тест
      Paths: H · N [пустой экспорт] · S [нет ПД в отчёте консоли]

**CU DoD:** `typecheck` · `lint` · `test`

### P07-CU3 — feat(db): add idempotent legacy import runner with environment guard · Review: reviewer · Commit: auto

- [ ] P07-T5 · T3 · ADR: [adr_001 §3.4](../../../prds/07_governance/adr_001_stack_and_runtime.md) · Spec: [seed_data_spec §5](../../../prds/03_data_model/seed_data_spec.md)
      Files: `packages/db/migration/legacy/run-import.ts`, скрипт `migrate:legacy`, карта id в `.local/legacy-id-map.json` (вне git)
      Acceptance: только по явному подтверждению окружения; запуск на копии/ветке; идемпотентно по карте; транзакция на группу сущностей; журнал `seed.run`/`migration.run`; переходные согласия создаются (`LEGACY_PENDING`) → тесты на тестовой БД с синтетикой
      Paths: H · N [prod без подтверждения, повторный запуск, расхождение маркера] · S [нет реальных ПД в dev/тестах; секреты не в логах]

**CU DoD:** `typecheck` · `lint` · `test` · репетиция на ветке Neon (ручной шаг)

### P07-CU4 — feat(db): add reconciliation checks and report · Review: reviewer · Commit: auto

- [ ] P07-T6 · T3 · Spec: [спец. §13 «Проверка сходимости»](../../../my_specs/sunday_school_data_analytics_spec.md)
      Files: `packages/db/migration/legacy/reconcile.ts`
      Acceptance: сверка по ученику и году: число уроков, проверок, суммы баллов и выданных кирпичиков со старой системой; несовпадения перечислены; импорт «принят» только при нулевых блокирующих расхождениях → тесты на синтетике
      Paths: H · N [расхождение суммы, отсутствует ученик] · S [отчёт без ПД]

**CU DoD:** `typecheck` · `lint` · `test` · репетиция: отчёт сходимости утверждён владельцем

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

- [ ] P07-T9 · T3 · ADR: [adr_001 §3.4](../../../prds/07_governance/adr_001_stack_and_runtime.md) · Guide: `vercel_deploy_guide` (W12-06)
      Files: `vercel.json` (без `crons`), `next.config.*` (заголовки, CSP), `.env.example`, `docs/implementation/mvp/guides/*` (ссылки)
      Acceptance: Node 24.x; pooled/direct URL; `AUTH_*` отдельные; `APP_ENV=prod` и маркер БД; нет `NEXT_PUBLIC_*` секретов; заголовки безопасности и cookie; `/design-system` 404; dev-переключатель отсутствует → проверка сборки и маршрутов
      Paths: H · N [`APP_ENV` не совпал] · S [CSP, cookie, секреты; INV-24]
- [ ] P07-T10 · T3 · Spec: [seed_data_spec §4](../../../prds/03_data_model/seed_data_spec.md)
      Files: runbook-шаги: миграции → `seed:reference` → `seed:bible` (RST; NIV по лицензии) → первый admin
      Acceptance: на пустой prod-подобной ветке приложение работает; в БД нет фикстур → ручной smoke
      Paths: H · N [NIV без флага] · S [маркер `prod`]

**CU DoD:** `typecheck` · `lint` · `test` · `next build` · smoke на preview

### P07-CU8 — docs(prds): close pre-production checklist · Review: diff-only · Commit: auto

- [ ] P07-T11 · T2 · Files: `docs/prds/06_operations/` (чек-лист) или раздел `migration_runbook`; `/privacy` v1 (финал); ADR-009 (лицензия)
      Acceptance: лицензия NIV подтверждена (или BSB выбран); юр. срок удаления проверен; окно backup Neon указано в тексте согласия; security review T3-зон выполнен; план отката → чек-лист с датами и ответственными
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
