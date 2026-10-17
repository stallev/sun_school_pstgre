# P04 Tasks — Проверка домашних заданий

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W11-08  
**Зависит от:** [`P04_phase_description.md`](../phases_tasks_descriptions/P04_phase_description.md), [`homework_check_contract.md`](../contracts/homework_check_contract.md), [`homework_check_flow_spec.md`](../specs/homework_check_flow_spec.md), [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md)  
**Связанные документы:** [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md), [`adr_004`](../../../prds/07_governance/adr_004_timezone_scheduling_model.md), [`P03_tasks.md`](./P03_tasks.md)

---

## Purpose

Реализовать проверку ДЗ: правила баллов и «сдано позже», use-case проверки и корректировки, экраны. DoD — [`P04_phase_description.md`](../phases_tasks_descriptions/P04_phase_description.md).

## Phase DoR audit (lean: оркестратор inline)

- [ ] P03 DoD; уроки и стихи доступны; фикстуры уроков есть
- [ ] Задачи проходят DoR; пути H/N/S указаны; формулы — только по контракту §6–§7
- [x] `updated_at` у `homework_check`/`lesson` присутствует в схеме (иначе миграция в CU2)
- [ ] Решения: Q-01/Q-02 flow spec приняты

## Commit plan

### P04-CU1 — feat(domain): add points, late and verse-to-recite rules · Review: diff-only · Commit: auto

- [x] P04-T1 · T2 · Contract: [homework_check §6](../contracts/homework_check_contract.md) · Invariants: INV-11…INV-13
      Files: `packages/domain/src/check/{compute-points,scoring-snapshot}.ts`
      Acceptance: сумма стихи×вес + тест×вес + тетрадь×вес + спевка×вес; `NULL` вклад 0; присутствие не участвует; обзорный урок — тетрадь + спевка; снимок содержит веса и переключатели → unit-тесты таблицей
      Paths: H [§6] · N [выключенные параметры, `NULL`, максимумы]
- [x] P04-T2 · T2 · Contract: [homework_check §7](../contracts/homework_check_contract.md) · ADR: [adr_004 §4 п. 5](../../../prds/07_governance/adr_004_timezone_scheduling_model.md)
      Files: `packages/domain/src/check/{compute-late,next-lesson-date}.ts`
      Acceptance: `date(setAt in tz) > nextLessonDate`; нет следующего урока → `false`; граница полуночи, переход на летнее время, смена пояса не меняет прошлые → unit-тесты
      Paths: H [§7] · N [нет следующего урока, равные даты]
- [x] P04-T3 · T1 · Contract: [homework_check §4.2](../contracts/homework_check_contract.md)
      Files: `packages/domain/src/check/{schemas,resolve-verses-to-recite}.ts`, коды `CHECK_*` (проверка), `AUDIT_ACTION` (`check.*`)
      Acceptance: диапазоны оценок, обзорный без стихов/теста, `resolveVersesToRecite` по БП-2 (первый обычный урок года — пусто) → unit-тесты
      Paths: H [БП-2] · N [первый урок, обзорный между]

**CU DoD:** `typecheck` · `lint` · `test` (таблицы границ)

### P04-CU2 — feat(check): add partial and final check save use-cases · Review: reviewer · Commit: auto

- [x] P04-T4 · T3 · Contract: [homework_check §5.4–§5.5, §8, §10](../contracts/homework_check_contract.md)
      Files: `apps/web/src/data/checks/{save-partial-check,save-checked}.ts`, `actions/checks.ts`
      Acceptance: upsert записи; событие оценки на изменённое поле; `saveChecked` — присутствие обязательно, `points_total` и `scoring_snapshot` заморожены, `late` вычислен, `expectedUpdatedAt` проверен; год `ACTIVE`; повтор идемпотентен; журнал `check.saved` → тесты по таблице §8
      Paths: H [§5.4–5.5] · N [§8: присутствие, диапазон, `CONFLICT`, закрытый год] · S [AZ-33, AZ-P5, AZ-P6: чужой урок → `NOT_FOUND`; `late`/баллы не с клиента]

**CU DoD:** `typecheck` · `lint` · `test` (гонка двух учителей, идемпотентность) · smoke: сохранить ученика

### P04-CU3 — feat(check): add correction and manual verse score use-cases · Review: reviewer · Commit: auto

- [ ] P04-T5 · T3 · Contract: [homework_check §5.6–§5.7, §8–§9](../contracts/homework_check_contract.md) · Invariants: INV-13, INV-14
      Files: `data/checks/{correct-check,override-verse-score}.ts`
      Acceptance: teacher — год `ACTIVE`; admin — любой, в `CLOSED` с причиной; пересчёт по текущим весам, новый снимок, `late` по событиям; присутствие не меняется автоматически; `CHECK_NO_CHANGES`; журнал `check.corrected` со старым/новым значением → тесты
      Paths: H [§5.6] · N [закрытый год, нет причины, нет изменений, `CONFLICT`] · S [AZ-34, AZ-35, AZ-P5: teacher в закрытом → `FORBIDDEN`]

**CU DoD:** `typecheck` · `lint` · `test` (регрессия INV-13: смена весов не меняет старые)

### P04-CU4 — feat(check): add lesson completion and check read models · Review: reviewer · Commit: auto

- [ ] P04-T6 · T3 · Contract: [homework_check §5.8](../contracts/homework_check_contract.md)
      Files: `data/checks/complete-lesson-check.ts`
      Acceptance: `HELD → CHECK_COMPLETED` при ≥ 1 проверенной записи; идемпотентно; журнал `lesson.check_completed` → тесты
      Paths: H · N [`CHECK_NOTHING_CHECKED`] · S [AZ-33]
- [ ] P04-T7 · T1 · Spec: [flow §3, §5, §7](../specs/homework_check_flow_spec.md)
      Files: `data/checks/{get-check-roster,get-check-record,get-lesson-table,get-lesson-progress,get-current-lesson}.ts`
      Acceptance: roster на дату урока (+ добавленные позже), стихи предыдущего обычного урока, прогресс N из M, «текущий урок» по поясу школы → тесты выборок
      Paths: H · N [нет учеников, нет текущего урока] · S [фильтр по группе и году; чужой → `NOT_FOUND`]

**CU DoD:** `typecheck` · `lint` · `test`

### P04-CU5 — feat(web): add sequential check screen · Review: diff-only · Commit: auto

- [ ] P04-T8 · T1 · Spec: [flow §4–§6, §8, §10](../specs/homework_check_flow_spec.md) · Prototype: `check`
      Files: `app/(app)/lessons/[lessonId]/check/page.tsx`, `components/teacher/{CheckPupilList,CheckCard,CheckCardHeader,ScoreGroup,LateBadge,CheckProgress,CheckBottomBar,CheckFinishedCard}.tsx`
      Acceptance: порядок блоков, режимы проверки/исправления, радиогруппы со стрелками, «—» = `NULL`, баннер исправления и причины, фокус на следующего ученика, `aria-live`, подтверждение при несохранённых изменениях, экран завершения без достижений → ручной smoke H/N
      Paths: H [flow §9] · N [flow §10] · S [flow §11: закрытый год — форма скрыта]
- [ ] P04-T9 · T0 · Files: `lib/messages/{ru,en}/teacher.json`
      Acceptance: ключи проверки на двух языках
      Paths: n/a — copy

**CU DoD:** `typecheck` · `lint` · `test` · smoke 390 px и `lg`

### P04-CU6 — feat(web): add lesson summary table · Review: diff-only · Commit: auto

- [ ] P04-T10 · T1 · Spec: [flow §7](../specs/homework_check_flow_spec.md) · Prototype: `lessonTable`
      Files: `app/(app)/lessons/[lessonId]/table/page.tsx`, `components/teacher/{LessonCheckTable,LessonCheckTableRow}.tsx`
      Acceptance: фильтры, раскраска + значение, метка «позже» текстом, правка ячейки сразу (partial/correct) с откатом при отказе, карточки на < `md` → ручной smoke
      Paths: H · N [`CONFLICT` откат ячейки] · S [AZ-33, AZ-34]

**CU DoD:** `typecheck` · `lint` · `test` · smoke 390 px

### P04-CU7 — feat(web): wire check entry points, today progress and lesson status · Review: diff-only · Commit: auto

- [ ] P04-T11 · T1 · Flow: [teacher_flow §4.2–§4.3](../../../prds/01_product_scope/user_flows/users_mvp/teacher_flow.md)
      Files: `app/(app)/check/page.tsx` (редирект), `today/page.tsx`, `lessons/page.tsx`, `lessons/[lessonId]/page.tsx`
      Acceptance: `/check` → текущий урок либо пустое состояние; прогресс «N из M» на «Сегодня»; статус проверки в списке; кнопка «Проверить» ведёт на экран → ручной smoke
      Paths: H · N [нет текущего урока] · S [только свои]

**CU DoD:** `typecheck` · `lint` · smoke

### P04-CU8 — docs(docs): sync P04 docs · Review: diff-only · Commit: auto

- [ ] P04-T12 · T0 · Files: `docs/**` (contract, flow spec, ui_states, lifecycle)
      Acceptance: grep терминов; нет drift
      Paths: n/a — docs-only

## Verification (phase)

- [ ] Все CU закоммичены; trace `Review: …`
- [ ] Phase DoD из [`P04_phase_description.md`](../phases_tasks_descriptions/P04_phase_description.md)
- [ ] Docs sync — в CU8

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P04_phase_description.md`](../phases_tasks_descriptions/P04_phase_description.md) | DoD |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W11-08) |
