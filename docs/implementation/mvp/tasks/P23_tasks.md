# P23 Tasks — Подтверждаемые достижения и разовые события

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-11-02  
**Волна:** P23  
**Зависит от:** [`P23_phase_description.md`](../phases_tasks_descriptions/P23_phase_description.md), [`achievement_suggestions_contract.md`](../contracts/achievement_suggestions_contract.md), [`adr_016_confirmable_achievements_and_events.md`](../../../prds/07_governance/adr_016_confirmable_achievements_and_events.md), [`achievements_and_penalties_contract.md`](../contracts/achievements_and_penalties_contract.md), [`achievements_screens_spec.md`](../specs/achievements_screens_spec.md) §5.4, §5.7, §5.8, [`families_and_parents_screens_spec.md`](../specs/families_and_parents_screens_spec.md) §5.2  
**Связанные документы:** [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) AZ-60, AZ-66, [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §6, [`change_log_contract.md`](../contracts/change_log_contract.md) §4, [`canonical_routes.md`](../../../design/canonical_routes.md) §10

---

## Purpose

Быстрые правки редактора баллов группы, подтверждаемые учителем достижения серии «Хранитель слова» с карточкой у родителя и повторяемое событие «Рассказал стихотворение на богослужении». DoD — [`P23_phase_description.md`](../phases_tasks_descriptions/P23_phase_description.md).

**Порядок.** CU1 → CU2 → CU3 → CU4 → CU5 → CU6 → CU7 → CU8. CU3 (типы Prisma, domain) раньше CU4–CU8. CU5 раньше CU6. Секция Design Lab списка текстов — в CU6 до модалки (C-2).

## Phase DoR audit (architect spec-gap, 2026-11-02)

- [x] ADR-016, контракт предложений, spec §5.4 / §5.7 / §5.8, spec родителя §5.2, AZ-66, схема, коды журнала существуют — 2026-11-02 · architect · CU2
- [x] Задачи ниже ссылаются на `§`-якоря, называют Files, Acceptance и Paths; T3 — свой CU; CU ≤ ~400 строк
- [x] `Проверено по`: Prisma `7.10.0`, `@base-ui/react` `1.9.0` (`Select.Root` `items`)
- [ ] Open questions: ADR-016 Q-1 (ключ события) — блокирует только CU8; Q-2 не блокирует

## Commit plan

### P23-CU1 — fix(web): clarify group points editor rows · Review: reviewer · Commit: auto

- [ ] P23-T1 · T1 · Spec: [screens spec §5.7 «Уточнения P23-CU1»](../specs/achievements_screens_spec.md) · ADR-016 «Проверено по»
      Files: `apps/web/src/components/ui/form-select.tsx`, `apps/web/src/components/ui/form-select.test.tsx`, `apps/web/src/components/parent/ParentChildSwitcher.client.tsx`
      Acceptance: `FormSelect` передаёт в `Select.Root` `items={options}` (пары `{ value, label }`); тест: триггер до открытия показывает label, а не value; переключатель ребёнка проверен на тот же дефект
      Paths: H [§5.7: год названием] · N [§5.7: value без опции — пусто, без uuid] · S n/a — presentational
- [ ] P23-T2 · T1 · Spec: [screens spec §5.7](../specs/achievements_screens_spec.md)
      Files: `apps/web/src/lib/achievements/catalog-display.ts`, `apps/web/src/data/achievements/load-achievements-catalog-page.server.ts`, `apps/web/src/data/achievements/load-group-points-page.server.ts`, `apps/web/src/lib/achievements/group-points-display.ts`, `apps/web/src/lib/achievements/group-points-display.test.ts`, `apps/web/src/components/achievements/GroupPointsRow.tsx`, `apps/web/src/components/achievements/GroupPointsRow.test.tsx`, `apps/web/src/lib/messages/{ru,en}/admin.json`, `apps/web/src/lib/messages/group-points-messages.ts`, `apps/web/src/lib/messages/pick-group-points-messages.server.ts`, `packages/db/src/seed/reference/achievement-catalog.ts`
      Acceptance: `isActive`, `descriptionRu/En`, `ruleType`, `tierLength` в DTO строки; бейдж «Неактивно» текстом; кнопка «Как зарабатывается» с `aria-expanded` раскрывает описание; «Условие» — фраза по `ruleType` + `length` (`SERIES`, `ACCUMULATION`, `ONCE`), прочие — текст каталога; ключи в ru и en и в срезе; описания seed расширены; `practice` только чтение
      Paths: H [§5.7: бейдж, раскрытие, условие] · N [§5.7: пустое описание, неизвестный `ruleType`, штраф] · S n/a — DTO существующего экрана, права не меняются

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты `form-select`, `GroupPointsRow`, `group-points-display`

### P23-CU2 — docs(docs): add confirmable achievements and events docs · Review: diff-only · Commit: auto

- [x] P23-T3 · T1 · Spec: [ADR-016 §8](../../../prds/07_governance/adr_016_confirmable_achievements_and_events.md)
      Files: `docs/prds/07_governance/adr_016_confirmable_achievements_and_events.md`, `docs/implementation/mvp/contracts/achievement_suggestions_contract.md`, `docs/implementation/mvp/contracts/achievements_and_penalties_contract.md`, `docs/implementation/mvp/contracts/change_log_contract.md`, `docs/implementation/mvp/specs/achievements_screens_spec.md`, `docs/implementation/mvp/specs/families_and_parents_screens_spec.md`, `docs/prds/04_authorization_privacy/authorization_matrix.md`, `docs/prds/03_data_model/database_schema_v1.md`, `docs/design/canonical_routes.md`, `docs/implementation/mvp/README.md`, `docs/implementation/mvp/phases_tasks_descriptions/P23_phase_description.md`, `docs/implementation/mvp/tasks/P23_tasks.md`
      Acceptance: ADR-016 ACCEPTED с отклонёнными вариантами; контракт предложений §1–§15; AZ-66 и AZ-60 в матрице; 4 кода журнала; таблица, колонка, enum в схеме; spec §5.4, §5.7, §5.8 и карточка родителя; «новых маршрутов нет» в `canonical_routes.md`; README — фаза P23
      Paths: n/a — docs-only

**CU DoD:** `encoding:check` · `docs:links` · `rules:check` (не требуется: `.mdc` не трогались)

### P23-CU3 — feat(db): add achievement suggestions schema and domain · Review: reviewer · Commit: auto

Tier T3: миграция (sensitive zone `packages/db/**`, `**/migrations/**`).

- [ ] P23-T4 · T3 · Contract: [suggestions §4](../contracts/achievement_suggestions_contract.md) · Schema [§4, §6, §8](../../../prds/03_data_model/database_schema_v1.md) · ADR-016 §4 п. 1–2
      Files: `packages/db/prisma/schema.prisma`, `packages/db/prisma/migrations/<timestamp>_achievement_suggestions/migration.sql`, `packages/db/src/generated/**` (генерация), `packages/db/src/seed/dev/replace-fixture.ts` (если перечисляет таблицы), `packages/db/src/scripts/delete-academic-year.ts`, `apps/web/src/data/deletions/erase-child-data.ts`
      Acceptance: модель `AchievementSuggestion` (`@@map("achievement_suggestion")`), enum `AchievementSuggestionStatus` (`_enum`), `Achievement.requiresConfirmation Boolean @default(false) @map("requires_confirmation")`; `UNIQUE (award_key)`, `UNIQUE (award_id)`, CHECK из схемы §6, индексы §8; миграция аддитивна и содержит `UPDATE achievement SET requires_confirmation = true WHERE code = 'verses'`; удаление года и стирание ребёнка удаляют предложения до выдач
      Paths: H [миграция на пустой и заполненной БД] · N [дубль `award_key`; `CONFIRMED` без `award_id` — CHECK] · S [таблица только через DAL; стирание ребёнка удаляет предложения (схема §9)]
- [ ] P23-T5 · T1 · Contract: [suggestions §3, §11](../contracts/achievement_suggestions_contract.md) · ADR-016 §4 п. 3, 9, 10
      Files: `packages/domain/src/achievements/constants.ts`, `packages/domain/src/achievements/requires-confirmation.ts`, `packages/domain/src/achievements/requires-confirmation.test.ts`, `packages/domain/src/achievements/suggestion-verses.ts` (чистая сборка списка текстов), `packages/domain/src/achievements/evaluate.ts` (пропуск `EVENT`), `packages/domain/src/achievements/evaluate.test.ts`, `packages/domain/src/constants/mutation-error-codes.ts`, `packages/domain/src/constants/audit-action.ts`, `packages/domain/src/index.ts`
      Acceptance: `MIN_LESSONS_FOR_CONFIRMATION = 2`; `requiresConfirmation({ requiresConfirmation }, tierLength)` — тесты (false-флаг, length 1, 2, 3); `ACHIEVEMENT_SUGGESTION_STATUS`; `ACHIEVEMENT_RULE_TYPE.EVENT`, `evaluate` пропускает `EVENT`; коды `ACHIEVEMENT_SUGGESTION_RESOLVED`, `ACHIEVEMENT_SUGGESTION_NOT_FOUND`; 4 действия журнала; экспорт через `@sunschool/domain`
      Paths: H [флаг + длина ≥ 2 → true] · N [флаг false; длина 1; `EVENT` в `evaluate` не даёт выдач] · S n/a — чистая логика
- [ ] P23-T6 · T1 · Contract: [achievements §6.1](../contracts/achievements_and_penalties_contract.md)
      Files: `packages/db/src/seed/reference/achievement-catalog.ts`, `packages/db/src/seed/reference/seed.integration.test.ts`
      Acceptance: строка `worship_recital` (`REWARD`, `EVENT`, `MEMORY`, `{ tier: 1, length: 1, points: 6 }`, `requires_confirmation = false`) создаётся; тип `ruleType` seed включает `EVENT`; для существующей строки seed не меняет `requires_confirmation`
      Paths: H [первый запуск создаёт строку] · N [повтор после ручной смены `requires_confirmation` — значение не меняется] · S n/a — seed

**CU DoD:** `node scripts/cu-verify.mjs --full` · `prisma validate` · `prisma generate` без diff

### P23-CU4 — feat(web): route confirmable awards to suggestions · Review: reviewer · Commit: auto

Tier T3: запись данных, влияющих на баланс, в sensitive-контуре пересчёта.

- [ ] P23-T7 · T3 · Contract: [suggestions §6.1, §9, §10](../contracts/achievement_suggestions_contract.md) · [achievements §6.2](../contracts/achievements_and_penalties_contract.md) · ADR-016 §4 п. 4
      Files: `apps/web/src/data/achievements/evaluate-pupil.ts`, `apps/web/src/data/achievements/achievement-evaluate-context.server.ts`, `apps/web/src/data/achievements/evaluate-pupil.test.ts`, `apps/web/src/data/achievements/recalculate-achievements.test.ts`
      Acceptance: `persistProposedAwards` пишет `achievement_suggestion`, если `requiresConfirmation(achievement, tier.length)`; иначе выдача как раньше; `grade_id` — группа урока последней проверки; P2002 — пропуск; существующие предложения любого статуса — занятые уровни на входе `evaluate`; журнал `achievement.suggested` одной записью; `achievement-points-readers-grep-gate.test.ts` зелёный без правок
      Paths: H [серия `verses` 3 → предложение; `first` → выдача] · N [повтор пересчёта; рост серии до 5 при ожидающем 3; отклонённый уровень не возвращается; режим группы выключен; закрытый год (пересчёт при `closeYear`)] · S [баллы в предложении не хранятся; читатели баллов не читают таблицу]

**CU DoD:** `node scripts/cu-verify.mjs --full` · grep-гейт читателей баллов

### P23-CU5 — feat(policy): confirm, defer and dismiss achievement suggestions · Review: reviewer · Commit: auto

Tier T3: права (AZ-66), запись баланса, новый Server Action.

- [ ] P23-T8 · T3 · Contract: [suggestions §5–§9](../contracts/achievement_suggestions_contract.md) · AZ-66 · ADR-016 §4 п. 5–7, 11
      Files: `packages/policy/server/src/achievements-mutate.ts`, `packages/policy/server/src/achievements-mutate.test.ts`, `apps/web/src/data/achievements/achievement-mutate-access.server.ts`, `apps/web/src/data/achievements/confirm-suggestion.ts`, `apps/web/src/data/achievements/defer-suggestion.ts`, `apps/web/src/data/achievements/dismiss-suggestion.ts`, `apps/web/src/data/achievements/suggestions.test.ts`, `apps/web/src/actions/teacher-achievements.ts`, `apps/web/src/lib/messages/{ru,en}/teacher.json`
      Acceptance: три операции по §6.2–§6.4; актор и группа предложения по БД; условный `updateMany where status = SUGGESTED`, `count = 0` → `ACHIEVEMENT_SUGGESTION_RESOLVED`; подтверждение в одной транзакции с блокировкой ученика создаёт выдачу (`source = AUTO`, `awarded_by`, доказательства, `resolveEffectivePoints` по `grade_id`, `rule_snapshot.suggestionId`), пишет `award_id`; P2002 → `ACHIEVEMENT_EVIDENCE_TAKEN` с откатом; журнал по §6; Server Action — тонкий адаптер, `MutationResult`, коды из domain, без Route Handler fallback (ADR-016 §4 п. 11); ключи `suggestion_not_found`, `suggestion_resolved` в ru и en
      Paths: H [teacher подтверждает, откладывает, отклоняет своё; admin — любое] · N [гонка двух подтверждений; закрытый год у teacher → `ACHIEVEMENT_YEAR_CLOSED`; admin в закрытом году — успех с журналом; флаг выкл. → `ACHIEVEMENT_FLAG_OFF`; режим выкл. → `ACHIEVEMENT_MODE_OFF`; строка выключена → `ACHIEVEMENT_INACTIVE`; доказательство занято] · S [чужая группа → `NOT_FOUND`; `PARENT` → `FORBIDDEN`; баллы и ключ не с клиента; журнал без ФИО]

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты policy (allow / чужая группа / не та роль) и DAL (гонка, закрытый год, флаг)

### P23-CU6 — feat(web): add teacher suggestion confirmation dialog · Review: reviewer · Commit: auto

Tier T3: новый загрузчик ролевых данных (S — role-scoped data).

- [ ] P23-T9 · T3 · Spec: [screens spec §5.8, §6, §9](../specs/achievements_screens_spec.md) · Contract: [suggestions §6.5](../contracts/achievement_suggestions_contract.md)
      Files: `apps/web/src/data/achievements/load-pupil-achievement-panel.server.ts`, `apps/web/src/lib/achievements/pupil-achievement-panel-types.ts`, `apps/web/src/data/achievements/load-grade-achievement-ui.server.ts` (счётчик группы), `apps/web/src/components/achievements/PupilAchievementPanelContent.client.tsx`, `apps/web/src/components/achievements/PupilSuggestionList.tsx`, `apps/web/src/components/achievements/ConfirmSuggestionDialog.client.tsx`, `apps/web/src/components/achievements/SuggestionVerseList.tsx`, `apps/web/src/components/achievements/*.test.tsx`, `apps/web/src/components/teacher/GroupPageContent.server.tsx`, `apps/web/src/components/admin/GroupDetailPageContent.server.tsx`, `apps/web/src/components/design-lab/**` (секция списка текстов), `apps/web/src/lib/messages/{ru,en}/teacher.json` и срез `teacher`
      Acceptance: блок «Ждёт подтверждения» в панели ученика с кнопкой «Подтвердить достижение»; `CountBadge` «Ждут подтверждения: N» на карточке группы (teacher и admin); модалка со списком текстов (перевод группы) и тремя действиями; pending (`disabled`, `aria-busy`, герундий), `toast.success` / `toast.error` 2 с; секция Design Lab до модалки; один компонент на файл, ≤ 140 строк
      Paths: H [§5.8: подтвердить, отложить, отклонить] · N [§6: уже обработано, закрытый год, доказательство занято, пустой список текстов] · S [§7: кнопки нет у чужой группы и teacher в закрытом году; загрузчик отдаёт только предложения групп актора (AZ-57)]

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты компонентов и загрузчика · `rules:check`

### P23-CU7 — feat(web): show pending suggestions to parents · Review: reviewer · Commit: auto

Tier T3: ролевые данные ребёнка для `PARENT` (S).

- [ ] P23-T10 · T3 · Spec: [parents spec §5.2, §6](../specs/families_and_parents_screens_spec.md) · Contract: [suggestions §6.5, §8 S-6](../contracts/achievement_suggestions_contract.md) · AZ-60
      Files: `apps/web/src/data/families/load-parent-child-page.server.ts`, `apps/web/src/data/families/*.test.ts`, `apps/web/src/components/parent/ParentSuggestionCard.tsx`, `apps/web/src/components/parent/ParentChildPageContent.server.tsx`, `apps/web/src/components/parent/ParentAchievementsReadOnly.tsx`, `apps/web/src/lib/messages/{ru,en}/parent.json` и срез `parent`
      Acceptance: `pendingSuggestions` только `SUGGESTED`, только активный год, только при `features.parents` и `features.achievements` и действующем согласии; карточка с названием, уровнем, подписью и списком текстов (переиспользует `SuggestionVerseList` из CU6); только чтение; баллов нет
      Paths: H [§5.2: карточка видна до подтверждения, исчезает после] · N [§6: нет предложений — карточки нет; закрытый год; флаг выкл.] · S [чужой ребёнок → 404; без согласия — данные скрыты; отклонённое не показывается]

**CU DoD:** `node scripts/cu-verify.mjs --full` · тест загрузчика с согласием и без

### P23-CU8 — feat(web): add repeatable worship recital award · Review: reviewer · Commit: auto

Tier T3: ручная выдача баллов (AZ-53), изменение ключа уникальности. Блокируется ADR-016 Q-1 до решения владельца.

- [ ] P23-T11 · T3 · Contract: [achievements §5, §6.4, §7, §9](../contracts/achievements_and_penalties_contract.md) · Spec: [screens spec §5.4](../specs/achievements_screens_spec.md) · ADR-016 §4 п. 10, §10 Q-1
      Files: `apps/web/src/data/achievements/award-manually.ts` (прочитать целиком до правки), `apps/web/src/data/achievements/award-manually.test.ts`, `packages/domain/src/achievements/award-key.ts`, `packages/domain/src/achievements/award-key.test.ts`, `apps/web/src/data/achievements/load-manual-award-form.server.ts`, `apps/web/src/lib/achievements/manual-award-types.ts`, `apps/web/src/components/achievements/ManualAwardDialogForm.client.tsx`, `apps/web/src/components/achievements/ManualAwardEvidencePicker.client.tsx`, `apps/web/src/lib/messages/{ru,en}/teacher.json`
      Acceptance: ветка `EVENT` без `checkIds` и без доказательств; `eventOn` обязателен, в границах года, не в будущем; `award_key` с ключом события; потолок — эффективные баллы уровня 1 группы активного зачисления на `eventOn`; причина обязательна; журнал `achievement.awarded`; в диалоге вместо уроков `DateField`; строка `worship_recital` видна в редакторе баллов группы
      Paths: H [§5.4: две выдачи в разные даты] · N [та же дата → `CONFLICT`; баллы выше потолка → `ACHIEVEMENT_POINTS_EXCEED`; режим выкл.; дата вне года] · S [чужой ученик → `NOT_FOUND`; баллы и ключ формирует сервер]

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты `awardManually` и `award-key`

## Verification (phase)

- [ ] Все CU закоммичены; у каждого trace `Review: …`
- [ ] CU3 раньше CU4–CU8; CU5 раньше CU6
- [ ] Phase DoD из [`P23_phase_description.md`](../phases_tasks_descriptions/P23_phase_description.md)
- [x] Docs sync — в CU2

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P23_phase_description.md`](../phases_tasks_descriptions/P23_phase_description.md) | DoD, smoke |
| [`achievement_suggestions_contract.md`](../contracts/achievement_suggestions_contract.md) | Контракт |
| [`adr_016_confirmable_achievements_and_events.md`](../../../prds/07_governance/adr_016_confirmable_achievements_and_events.md) | Решение |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-11-02 | v1.0 — Canonical (P23-CU2): CU1–CU8, Phase DoR audit |
