# P05 Tasks — Кирпичики, рейтинг, аналитика

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W11-10  
**Зависит от:** [`P05_phase_description.md`](../phases_tasks_descriptions/P05_phase_description.md), [`bricks_ledger_contract.md`](../contracts/bricks_ledger_contract.md), [`homework_check_contract.md`](../contracts/homework_check_contract.md), [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md)  
**Связанные документы:** [`sunday_school_data_analytics_spec.md`](../../../my_specs/sunday_school_data_analytics_spec.md), [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md), [`P04_tasks.md`](./P04_tasks.md)

---

## Purpose

Реализовать баланс и выдачу кирпичиков, рейтинг и аналитику. DoD — [`P05_phase_description.md`](../phases_tasks_descriptions/P05_phase_description.md).

## Phase DoR audit (lean: оркестратор inline + spec-gap)

- [ ] P04 DoD; в БД есть проверенные записи
- [x] **Spec-gap:** `analytics_screens_spec.md` отсутствует — CU0 создаёт его (docs-only) до CU6–CU8
- [ ] Решения: Q-01 метрика рейтинга, Q-02 библиотека графиков (в CU6)
- [ ] Остальные задачи проходят DoR; формулы — только по спец. §5, §9 и контрактам

## Commit plan

### P05-CU0 — docs(implementation): add analytics screens spec · Review: diff-only · Commit: auto

- [x] P05-T0 · T2 · Spec: [спец. §9.1–§9.6](../../../my_specs/sunday_school_data_analytics_spec.md), [§5](../../../my_specs/sunday_school_data_analytics_spec.md) · UX: [ui_states D12](../../../design/ui_states_contract.md)
      Files: `docs/implementation/mvp/specs/analytics_screens_spec.md`, индекс
      Acceptance: spec с экранами группы/ученика/школы, фильтрами, графиками (одна ось), таблицами, пустыми состояниями, «как считали», Paths H/N/S, Acceptance → проходит DoR §2.3.6
      Paths: n/a — docs-only

**CU DoD:** `encoding:check` · `docs:links`

### P05-CU1 — feat(domain): add bricks balance rules, schemas and codes · Review: diff-only · Commit: auto

- [x] P05-T1 · T1 · Contract: [bricks_ledger §3, §5, §8](../contracts/bricks_ledger_contract.md)
      Files: `packages/domain/src/bricks/{compute-balance,can-issue,schemas}.ts`, коды `BRICKS_*`, `AUDIT_ACTION` (`bricks.*`)
      Acceptance: остаток = набрано − выдано; `canIssue` не позволяет сверх остатка; компенсация не больше выданного → unit-тесты
      Paths: H [§3] · N [0, дробное, минус без примечания]

**CU DoD:** `typecheck` · `lint` · `test`

### P05-CU2 — feat(bricks): add balance, issue and compensate use-cases · Review: reviewer · Commit: auto

- [x] P05-T2 · T3 · Contract: [bricks_ledger §6, §8–§10](../contracts/bricks_ledger_contract.md) · Invariants: INV-10, INV-17, INV-18
      Files: `apps/web/src/data/bricks/{get-balance,list-ledger,issue-bricks,compensate-bricks}.ts`, `actions/bricks.ts`
      Acceptance: блокировка пары ученик+год; остаток внутри транзакции; журнал только добавление (нет update/delete); `requestId` идемпотентен; журнал изменений → тесты гонок и отказов
      Paths: H [§6] · N [§8: сверх остатка, нулевое, нет примечания, дата будущая] · S [AZ-40, AZ-41, AZ-D4: чужой → `NOT_FOUND`; роль БД без `UPDATE`/`DELETE`]

**CU DoD:** `typecheck` · `lint` · `test` (гонка выдач, INV-10) · smoke

### P05-CU3 — feat(web): add bricks screen · Review: diff-only · Commit: auto

- [x] P05-T3 · T1 · Phase: [экранные требования `/bricks`](../phases_tasks_descriptions/P05_phase_description.md) · Flow: [teacher_flow §4.5](../../../prds/01_product_scope/user_flows/users_mvp/teacher_flow.md) · Prototype: `bricks`
      Files: `app/(app)/bricks/page.tsx`, `components/teacher/{BalanceTable,IssueBricksDialog,CompensateBricksDialog,LedgerList}.tsx`
      Acceptance: таблица с остатком и «требует внимания», диалоги выдачи/исправления, журнал ученика, пустые состояния, закрытый год допустим для выдачи → ручной smoke H/N
      Paths: H · N [сверх остатка, D8] · S [AZ-40, AZ-41]
- [x] P05-T4 · T0 · Files: `lib/messages/{ru,en}/teacher.json`
      Acceptance: ключи кирпичиков на двух языках
      Paths: n/a — copy

**CU DoD:** `typecheck` · `lint` · `test` · smoke 390 px

### P05-CU4 — feat(domain): add analytics sample, averages, dynamics and rating rules · Review: diff-only · Commit: auto

- [x] P05-T5 · T2 · Spec: [спец. БП-1…БП-4](../../../my_specs/sunday_school_data_analytics_spec.md) · Invariants: INV-11, INV-12, INV-15
      Files: `packages/domain/src/analytics/{sample-layers,attendance,averages}.ts`
      Acceptance: слои A/B/C/D, порог явки 50% от даты зачисления; среднее по тесту/тетради (присутствие либо «сдано позже»; `NULL` не входит, 0 входит); стихи по БП-2 → unit-тесты таблицами, включая обзорный и первый урок
      Paths: H · N [нет проверенных, нет зачисления, малая выборка]
- [x] P05-T6 · T2 · Spec: [спец. §9.1.3, РТ-3](../../../my_specs/sunday_school_data_analytics_spec.md)
      Files: `packages/domain/src/analytics/{normalized-score,smoothing,trend,rating}.ts`
      Acceptance: нормированный балл по максимуму урока; скользящее среднее по 3; разность; тренд МНК по 6 урокам, < 4 точек → «мало данных»; метрика рейтинга по Q-01 → unit-тесты
      Paths: H · N [пропуск точки ≠ 0, < 4 точек]

**CU DoD:** `typecheck` · `lint` · `test`

### P05-CU5 — feat(analytics): add analytics read models and caching · Review: diff-only · Commit: auto

- [x] P05-T7 · T1 · Spec: [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) · ADR: [adr_002 §5](../../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md)
      Files: `apps/web/src/data/analytics/{get-group-analytics,get-pupil-analytics,get-school-overview,get-conducted-lessons,get-data-quality}.ts`
      Acceptance: фильтр периода (год/месяц/диапазон), фильтр по группе; доступ по `teacher_assignment`; `'use cache'` с тегами и сбросом из `saveChecked`/`correctCheck`/выдачи → тесты выборок, проверка отсутствия чужих данных
      Paths: H · N [пустой период] · S [AZ-44…AZ-46: чужой → `NOT_FOUND`]

**CU DoD:** `typecheck` · `lint` · `test`

### P05-CU6 — feat(web): add group analytics screen with charts · Review: diff-only · Commit: auto

- [x] P05-T8 · T1 · Spec: [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) · Prototype: `analytics`
      Files: `app/(app)/analytics/page.tsx`, `components/analytics/{AnalyticsKpiRow,SampleCompositionRow,LineChart,ChartTableToggle,MethodologyNote,DataQualityNote}.tsx`
      Acceptance: ключевые цифры, состав выборки, 4 графика (одна ось), таблицы, «как мы считали», пустые состояния D12, строка качества данных для admin → ручной smoke H/N, проверка DOM
      Paths: H · N [D12] · S [AZ-45: чужая группа → 404]
- [x] P05-T9 · T2 · Phase Q-02 (библиотека графиков)
      Files: решение в [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md), зависимость в `apps/web/package.json` (exact)
      Acceptance: версия и API сверены по документации; `deps:check` зелёный; графики доступны (подписи, таблица) → отчёт
      Paths: n/a — выбор зависимости (`dependency-pinning`)

**CU DoD:** `typecheck` · `lint` · `test` · `deps:check` · smoke 390 px

### P05-CU7 — feat(web): add pupil analytics with dynamics · Review: diff-only · Commit: auto

- [x] P05-T10 · T1 · Spec: [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) · Prototype: `pupil`
      Files: `app/(app)/analytics/pupils/[pupilId]/page.tsx`, `components/analytics/{PupilLessonTable,DynamicsBlock,BarChart}.tsx`
      Acceptance: слой выборки и причина, личные средние с N, графики, таблица по урокам («сдано позже», «тест не проводился»), блок динамики (сглаживание, изменение, тренд) → ручной smoke
      Paths: H · N [нет данных, < 4 точек] · S [AZ-45]

**CU DoD:** `typecheck` · `lint` · `test` · smoke

### P05-CU8 — feat(web): add rating, school overview and conducted lessons · Review: diff-only · Commit: auto

- [ ] P05-T11 · T1 · Phase: [экранные требования `/rating`](../phases_tasks_descriptions/P05_phase_description.md) · Prototype: `rating`
      Files: `app/(app)/rating/page.tsx`, `components/analytics/RatingTable.tsx`
      Acceptance: рейтинг группы/школы по метрике Q-01; без режима показа; admin — школа → ручной smoke
      Paths: H · N [нет данных] · S [AZ-47, РТ-1: teacher только своя]
- [ ] P05-T12 · T1 · Spec: [спец. §9.1.2, §9.1.4](../../../my_specs/sunday_school_data_analytics_spec.md) · Prototype: `school`
      Files: `app/(app)/school/page.tsx` (показатели), `components/analytics/ConductedLessonsTable.tsx`
      Acceptance: сравнение групп, график по линии на группу (≤ 4), «требует внимания», блок «кто какие уроки провёл» (0 для не ведших; «уже не в группе») → ручной smoke
      Paths: H · N [одна группа, нет данных] · S [AZ-16, AZ-44]

**CU DoD:** `typecheck` · `lint` · `test` · smoke

### P05-CU9 — docs(docs): sync P05 docs · Review: diff-only · Commit: auto

- [ ] P05-T13 · T0 · Files: `docs/**` (bricks contract, analytics spec, ui_states, индекс)
      Acceptance: grep терминов; нет drift; Q-01/Q-02 записаны
      Paths: n/a — docs-only

## Verification (phase)

- [ ] Все CU закоммичены; trace `Review: …`
- [ ] Phase DoD из [`P05_phase_description.md`](../phases_tasks_descriptions/P05_phase_description.md)
- [ ] Docs sync — в CU9

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P05_phase_description.md`](../phases_tasks_descriptions/P05_phase_description.md) | DoD |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W11-10) |
