# P15 Tasks — Баллы достижений и штрафов по группам

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-24  
**Волна:** W12-06  
**Зависит от:** [`P15_phase_description.md`](../phases_tasks_descriptions/P15_phase_description.md), [`achievement_group_points_contract.md`](../contracts/achievement_group_points_contract.md), [`adr_015_group_achievement_points.md`](../../../prds/07_governance/adr_015_group_achievement_points.md), [`achievements_and_penalties_contract.md`](../contracts/achievements_and_penalties_contract.md), [`achievements_screens_spec.md`](../specs/achievements_screens_spec.md) §5.7  
**Связанные документы:** [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) AZ-65, [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §4, [`change_log_contract.md`](../contracts/change_log_contract.md), [`canonical_routes.md`](../../../design/canonical_routes.md)

---

## Purpose

Реализовать переопределение баллов достижений и штрафов по группе и году по контракту. DoD — [`P15_phase_description.md`](../phases_tasks_descriptions/P15_phase_description.md).

**Порядок.** CU1 → CU2 → CU3 → CU4 → CU5 → CU6 → CU7. CU2 и CU5 — T3, свой CU. Домен и коды (CU3) раньше DAL (CU4, CU5). Секция Design Lab (если нужна) раньше экрана (CU6, C-2).

**UI-CU: CU6** — UX/UI verification loop из описания фазы.

## Phase DoR audit (lean: оркестратор inline)

- [x] ADR-015, контракт, spec §5.7, матрица AZ-65 существуют — 2026-10-24
- [x] Open questions фазы пусты
- [x] Задачи ниже ссылаются на `§`-якоря, называют Files, Acceptance и Paths

## Commit plan

### P15-CU1 — docs(docs): sync group achievement points docs · Review: diff-only · Commit: auto

- [x] P15-T1 · T1 · Spec: [контракт §4, §5](../contracts/achievement_group_points_contract.md) · ADR-015 §8
      Files: `docs/prds/03_data_model/database_schema_v1.md`, `docs/prds/04_authorization_privacy/authorization_matrix.md`, `docs/design/canonical_routes.md`, `docs/implementation/mvp/contracts/change_log_contract.md`, `docs/implementation/mvp/contracts/achievements_and_penalties_contract.md`, `docs/implementation/mvp/specs/achievements_screens_spec.md`, `docs/implementation/mvp/README.md`
      Acceptance: таблица `grade_achievement_points` в схеме; AZ-65 в матрице и строки маршрутов `/group/points`, `/groups/[groupId]/points` (teacher / admin, флаг, 404 при выключенном); действие журнала `achievement.group_points_changed`; в контракте достижений §4 — ссылка на новые операции, §6.1 — «баллы группы» и приоритет эффективных баллов, Change log; spec §5.7 редактор баллов; README — фаза P15. Проверено: grep устаревших утверждений «баллы глобальные» в `docs/` пуст или уточнён
      Paths: n/a — docs-only

**CU DoD:** `encoding:check` · `docs:links` · `rules:check`

### P15-CU2 — feat(db): add grade achievement points table · Review: reviewer · Commit: auto

Tier T3: миграция (sensitive zone).

- [x] P15-T2 · T3 · Spec: [контракт §4](../contracts/achievement_group_points_contract.md) · ADR-015 §4 п. 1
      Files: `packages/db/prisma/schema.prisma`, `packages/db/prisma/migrations/<timestamp>_grade_achievement_points/migration.sql`, `packages/db/src/generated/**` (генерация), `packages/db/src/seed/dev/replace-fixture.ts` (если перечисляет таблицы)
      Acceptance: модель `GradeAchievementPoints` (`@@map("grade_achievement_points")`) с FK на `grade_settings` и `achievement`, `tier Int` (0 — штраф), `@@unique([gradeSettingsId, achievementId, tier])`, `CHECK (tier BETWEEN 0 AND 3)`; миграция аддитивна, существующие данные не трогает; процедура удаления учебного года (`delete-academic-year.ts`, `deletion`) удаляет переопределения вместе с `grade_settings`
      Paths: H [применение миграции на пустой и заполненной БД] · N [дубль `(settings, achievement, tier)` — ошибка уникальности; `tier` вне 0…3] · S [таблица не доступна из клиента; запись только DAL]

**CU DoD:** `typecheck` · `lint` · `test` · `prisma validate` · `prisma generate` без diff

### P15-CU3 — feat(domain): add effective points resolver and seed guard · Review: diff-only · Commit: auto

- [x] P15-T3 · T1 · Spec: [контракт §6.2, §5](../contracts/achievement_group_points_contract.md) · ADR-015 §4 п. 2
      Files: `packages/domain/src/achievements/effective-points.ts`, `packages/domain/src/achievements/effective-points.test.ts`, `packages/domain/src/achievements/group-points-schema.ts`, `packages/domain/src/constants/mutation-error-codes.ts`, `packages/domain/src/constants/audit-action.ts`, `packages/domain/src/index.ts`
      Acceptance: `resolveEffectivePoints(globalPoints, override | undefined)` чистая функция; Zod-схема пакета `items[]` (≤ 64, без дублей, награда ≥ 0 / штраф < 0, `null` — сброс) одна для сервера и формы; коды `ACHIEVEMENT_GROUP_POINTS_INVALID`, `ACHIEVEMENT_YEAR_CLOSED` добавлены до использования; действие `achievement.group_points_changed`; экспорты через `@sunschool/domain`
      Paths: H [override задан → он; нет → глобальное] · N [`0` как допустимая награда; дубль `(achievementId, tier)`; > 64 элементов; штраф ≥ 0] · S n/a — чистая логика

- [x] P15-T4 · T2 · Spec: [контракт §6.4](../contracts/achievement_group_points_contract.md) · ADR-015 §4 п. 6
      Files: `packages/db/src/seed/reference/achievement-catalog.ts`, `packages/db/src/seed/reference/seed.integration.test.ts`
      Acceptance: для существующей строки каталога `ensureAchievementCatalog` обновляет тексты, категорию, вид, правило, метрику, но не `threshold`; для существующего уровня не меняет `length` и `points`; отсутствующее создаёт; повторный запуск после ручной правки баллов в БД их не меняет
      Paths: H [первый запуск создаёт каталог; повтор без правок — 0 изменений] · N [строка есть, уровень отсутствует — создаётся] · S n/a — seed

**CU DoD:** `typecheck` · `lint` · `test`

### P15-CU4 — feat(web): apply group points in award, penalty and snapshot · Review: reviewer · Commit: auto

- [x] P15-T5 · T2 · Spec: [контракт §6.2, §6.3](../contracts/achievement_group_points_contract.md) · ADR-015 §4 п. 3
      Files: `apps/web/src/data/achievements/achievement-evaluate-context.server.ts`, `apps/web/src/data/achievements/achievement-award-snapshot.server.ts`, `apps/web/src/data/achievements/evaluate-pupil.ts`, `apps/web/src/data/achievements/award-manually.ts`, `apps/web/src/data/achievements/issue-penalty.ts`, `apps/web/src/data/achievements/load-pupil-penalty-form.server.ts`, `apps/web/src/data/achievements/group-achievement-points.server.ts`, `apps/web/src/data/achievements/*.test.ts`, `packages/domain/src/achievements/evaluate.ts` (если нужен вход эффективных баллов)
      Acceptance: загрузчик `group-achievement-points.server.ts` читает переопределения группы-года одним запросом; `evaluatePupil` применяет эффективные баллы по группе урока завершающей проверки; потолок `awardManually` и `issuePenalty` и значение формы штрафа — эффективные; `rule_snapshot` содержит `pointsSource` и `gradeId`; прошлые выдачи не пересчитываются; grep-гейт: вне `resolveEffectivePoints` и загрузчика нет решений о баллах из `tier.points` / `threshold`
      Paths: H [override группы применяется, чужой группы — нет] · N [нет `grade_settings` для года — глобальное; серия, завершённая уроком другой группы после перевода — группа этого урока; уровень без override — глобальное] · S [ученик и группа из БД, не из клиента; баллы и снимок формирует сервер]

**CU DoD:** `typecheck` · `lint` · `test` · grep-гейт

### P15-CU5 — feat(policy): add group achievement points mutations · Review: reviewer · Commit: auto

Tier T3: права, запись данных, влияющих на баланс.

- [ ] P15-T6 · T3 · Spec: [контракт §5, §6.1, §8, §9](../contracts/achievement_group_points_contract.md) · AZ-65
      Files: `packages/policy/server/src/achievements-mutate.ts`, `packages/policy/server/src/achievements-mutate.test.ts`, `apps/web/src/data/achievements/set-group-achievement-points.ts`, `apps/web/src/data/achievements/copy-group-achievement-points.ts`, `apps/web/src/data/achievements/set-group-achievement-points.test.ts`, `apps/web/src/actions/achievements.ts`
      Acceptance: операции `setGroupAchievementPoints`, `copyGroupAchievementPoints` по контракту §5; актор проверяется по БД; teacher — только группа с назначением и активный год; admin — любая, закрытый год с журналом; флаг проверяется в use-case; блокировка `grade_settings` `FOR UPDATE`; значение, равное глобальному или `null`, удаляет строку; пакет атомарен; один журнал `achievement.group_points_changed` с до/после без ФИО; повтор идемпотентен без журнала; Server Action — тонкий адаптер с `MutationResult` и кодами из domain
      Paths: H [teacher меняет цену своей группы; admin любой; сброс] · N [уровень не из каталога; штраф ≥ 0; пустой пакет; > 64; источник copy из другого года; закрытый год у teacher → `ACHIEVEMENT_YEAR_CLOSED`; флаг выключен → `ACHIEVEMENT_FLAG_OFF`] · S [чужая группа → `NOT_FOUND`; teacher не пишет глобальный каталог; гонка двух записей]

**CU DoD:** `typecheck` · `lint` · `test` (policy + DAL)

### P15-CU6 — feat(web): add group achievement points editor · Review: reviewer · Commit: auto

UI-CU. Страница — thin adapter над DAL CU4/CU5.

- [ ] P15-T7 · T2 · Spec: [screens spec §5.7](../specs/achievements_screens_spec.md) · [контракт §5](../contracts/achievement_group_points_contract.md)
      Files: `apps/web/src/app/(app)/group/points/page.tsx`, `apps/web/src/app/(app)/groups/[groupId]/points/page.tsx`, `apps/web/src/components/achievements/GroupPointsPageContent.server.tsx`, `apps/web/src/components/achievements/GroupPointsTable.client.tsx`, `apps/web/src/components/achievements/GroupPointsRow.tsx`, `apps/web/src/components/achievements/GroupPointsCopyDialog.client.tsx`, `apps/web/src/data/achievements/load-group-points-page.server.ts`, `apps/web/src/components/teacher/GroupPageContent.server.tsx`, `apps/web/src/components/admin/GroupDetailPageContent.server.tsx`, `apps/web/src/lib/messages/**` (ru, en, срез `achievements`), `packages/policy/edge/src/route-table.ts`, `apps/web/src/components/design-lab/**` (если новый паттерн)
      Acceptance: таблица «достижение · уровень · условие · общее значение · значение группы»; пустое поле = «как в общем»; отличающаяся строка помечена текстом и иконкой, кнопка «Сбросить»; штраф вводится модулем, показывается со знаком «−»; одна кнопка «Сохранить» с pending (`disabled`, `aria-busy`) и toast 2 с; «Скопировать из группы» через `ConfirmDialog`; закрытый год у teacher — только чтение с `Banner`; `practice` (неактивное) строкой только для чтения; ссылки с карточек группы teacher и admin; маршруты в таблице edge: teacher `/group/points`, admin `/groups/[groupId]/points`; при выключенном флаге — 404; Teacher на `/achievements` по-прежнему 403; все тексты из `@/lib/messages` ru/en; страница ≤ 140 строк на компонент, один компонент на файл
      Paths: H [выбор группы и года, ввод, сохранение, сброс, копирование] · N [пустой каталог, ошибка поля `AlertText`, сетевая ошибка `toast.error`, закрытый год, нет групп] · S [чужая `groupId` → 404; пункт скрыт при выключенном флаге; серверная проверка не зависит от UI]

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify (390 / 768 / 1024 / 1280 px, teacher и admin, консоль чистая) · `rules:check`

### P15-CU7 — docs(docs): record p15 smoke and sync indexes · Review: diff-only · Commit: auto

- [ ] P15-T8 · T1 · Spec: [описание фазы, DoD](../phases_tasks_descriptions/P15_phase_description.md)
      Files: `docs/implementation/mvp/README.md`, `docs/implementation/mvp/phases_tasks_descriptions/P15_phase_description.md`, `docs/implementation/mvp/tasks/P15_tasks.md`, `AGENTS.md` (строка «Repository status»), `.cursor/rules/tiers/t0-always/project-context.template.mdc` (строка статуса, если есть), `docs/prds/architecture_master_index.md`
      Acceptance: статус фазы и чекбоксы обновлены; smoke H/N/S записан в конец `P15_tasks.md`; индексы ссылаются на P15 и ADR-015; после правки `.mdc` — `npm run rules:sync`
      Paths: n/a — docs-only

**CU DoD:** `encoding:check` · `docs:links` · `typecheck` · `lint` · `rules:check`

## Verification (phase)

- [ ] Все CU закоммичены; у CU2…CU6 trace `Review: …`; у CU6 `UI-verify: …`
- [ ] CU3 раньше CU4 и CU5; CU2 раньше CU3 (типы Prisma)
- [ ] Phase DoD из [`P15_phase_description.md`](../phases_tasks_descriptions/P15_phase_description.md)
- [ ] Docs sync — в CU1 и CU7

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P15_phase_description.md`](../phases_tasks_descriptions/P15_phase_description.md) | DoD, smoke |
| [`achievement_group_points_contract.md`](../contracts/achievement_group_points_contract.md) | Контракт |
| [`adr_015_group_achievement_points.md`](../../../prds/07_governance/adr_015_group_achievement_points.md) | Решение |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-10-24 | v1.0 — Canonical (W12-06): CU1–CU7 |
