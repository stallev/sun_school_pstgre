# P11 Tasks — Панель оценок сводной таблицы и тип карточки аналитики

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-21  
**Волна:** post-P10  
**Зависит от:** [`P11_phase_description.md`](../phases_tasks_descriptions/P11_phase_description.md), [`homework_check_flow_spec.md`](../specs/homework_check_flow_spec.md) v1.2, [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) v1.4, [`phase_tasks.template.md`](../../../meta/phase_tasks.template.md)  
**Связанные документы:** [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md), [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md), [`homework_check_contract.md`](../contracts/homework_check_contract.md)

---

## Purpose

Зафиксировать контракт панели оценок сводной таблицы и тип карточки аналитики, затем прототип, каталог и продукт. DoD — [`P11_phase_description.md`](../phases_tasks_descriptions/P11_phase_description.md). Профиль lean: DoR пункты 1–4 и 6.

## Phase DoR audit

- [x] Все задачи прошли DoR — 2026-10-21 · architect spec-gap · `homework_check_flow_spec` §7.1–§7.3 / §9–§11 / §14, `analytics_screens_spec` §4.1, `design_system_lab_spec` строка `ScorePad`, `typography_text_guidelines` (analytics cards), `P11_phase_description.md`, `P11_tasks.md`, строка P11 в README
- [x] Open questions связанных документов пусты или не блокируют задачи этой фазы (Q-06 закрыт)

## Commit plan

### P11-CU1 — docs(docs): define lesson table score pad and analytics card type · Review: diff-only · Smoke: none · Commit: auto

- [x] P11-T1 · T1 · Spec: [homework_check_flow_spec §7.1–§7.3](../specs/homework_check_flow_spec.md) · Contract: [homework_check_contract §5.4 / §5.6](../contracts/homework_check_contract.md)
      Files: `docs/implementation/mvp/specs/homework_check_flow_spec.md` · Acceptance: в §7 нет `select` оценок; «—» = `NULL`, `0` = 0; клавиатура §7.3; §5.3 без переписывания → сверка документа
      Paths: H [§7, §9] · N [§10: пусто / 0 / вне диапазона не отправляется, Escape без сохранения] · S [§11 S-7, AZ-33 / AZ-34]
- [x] P11-T2 · T0 · Spec: [design_system_lab_spec §5.3](../specs/design_system_lab_spec.md)
      Files: `docs/implementation/mvp/specs/design_system_lab_spec.md` · Acceptance: одна строка `ScorePad` в каталоге L2 → сверка таблицы
      Paths: n/a — docs-only
- [x] P11-T3 · T1 · Spec: [analytics_screens_spec §4.1](../specs/analytics_screens_spec.md)
      Files: `docs/implementation/mvp/specs/analytics_screens_spec.md`, `docs/guidelines/typography_text_guidelines.md` · Acceptance: в spec записаны `1.3125rem` и `p-3` / `gap-3`; в typography — одна строка исключения analytics cards → сверка
      Paths: n/a — docs-only (поведение экрана — CU6)
- [x] P11-T4 · T0 · Files: `docs/implementation/mvp/phases_tasks_descriptions/P11_phase_description.md`, `docs/implementation/mvp/tasks/P11_tasks.md`, `docs/implementation/mvp/README.md` · Acceptance: шесть CU с заголовками драйвера; Phase DoR audit отмечен 2026-10-21 → сверка
      Paths: n/a — docs-only

**CU DoD:** сверка якорей §7 / §4.1; Open questions не блокируют

### P11-CU2 — docs(prototype): lesson table score pad · Review: diff-only · Smoke: none · Commit: auto

- [x] P11-T5 · T1 · Spec: [homework_check_flow_spec §7.1–§7.3](../specs/homework_check_flow_spec.md)
      Files: `docs/prototypes/sunday_school_prototype.html` (`vLessonTable`, `data-tbl` ~3688)
      Acceptance: стихи — сразу `— 0 1 2`; тест/тетрадь — тихая ячейка + панель; 390 — карточка-стек без карандаша; md+ — колонка «Открыть»; одна панель → сверка прототипа
      Paths: n/a — docs-only (прототип)

**CU DoD:** только этот HTML-файл в stage

### P11-CU3 — docs(prototype): denser analytics cards · Review: diff-only · Smoke: none · Commit: auto

- [x] P11-T6 · T1 · Spec: [analytics_screens_spec §4.1](../specs/analytics_screens_spec.md)
      Files: `docs/prototypes/sunday_school_prototype.html` (только `vAnalytics`, `vPupil`, `vRating`, `vSchool`)
      Acceptance: тело карточки ~22 px, мета 17 px, `p-3` / `gap-3`; KPI и `lg+` таблицы не менялись; `CARD` глобально не менялся → сверка прототипа
      Paths: n/a — docs-only (прототип)

**CU DoD:** только этот HTML-файл в stage; правки вне четырёх экранов нет

### P11-CU4 — feat(ui): add score pad to the catalog · Review: diff-only · Smoke: deferred · Commit: auto

- [x] P11-T7 · T1 · Spec: [design_system_lab_spec §5.3 `ScorePad`](../specs/design_system_lab_spec.md) · Contract: [homework_check_flow_spec §7.2](../specs/homework_check_flow_spec.md)
      Files: `apps/web/src/components/ui/score-pad.tsx`, `apps/web/src/components/ui/score-cell.tsx`, `apps/web/src/components/patterns/ChoiceMatrix.tsx`, секция Lab `/design-system`
      Acceptance: в Lab на 390 и md видны тихая ячейка, стихи inline, панель 0–10, одна открытая панель, Escape закрывает без выбора; `ScoreGroup` / `apps/web/src/components/teacher/ScoreGroup.tsx` не рефакторятся → ручной шаг Lab
      Paths: n/a — презентационный каталог без данных и мутаций

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke deferred

### P11-CU5 — feat(web): use score pad on the lesson table · Review: reviewer · Smoke: deferred · Commit: auto

- [ ] P11-T8 · T3 · Spec: [homework_check_flow_spec §7](../specs/homework_check_flow_spec.md) · Contract: [homework_check_contract §5.4 / §5.6](../contracts/homework_check_contract.md) · AZ: AZ-33, AZ-34, AZ-P5
      Files: `apps/web/src/components/teacher/LessonCheckTable.tsx`, `apps/web/src/components/teacher/LessonCheckTableRow.tsx`, `apps/web/src/components/teacher/LessonCheckTableCards.tsx` (новый)
      Acceptance: нет `select` оценок; стихи inline; тест/тетрадь — панель; 390 — стек без карандаша, имя на экране; md+ — «Открыть»; оптимизм + `aria-busy`; ошибка — toast + откат; success toast нет; те же `savePartialCheck` / `correctCheck` → ручной шаг + существующие тесты таблицы
      Paths: H [§7] · N [§10: пусто / 0 / вне диапазона не отправляется, Escape без сохранения] · S [§11 S-7, AZ-33 / AZ-34: аноним → login, чужой урок → 404, закрытый год teacher → без записи]

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke deferred (H + N + S к концу фазы)

### P11-CU6 — feat(ui): enlarge analytics card type · Review: diff-only · Smoke: deferred · Commit: auto

- [ ] P11-T9 · T1 · Spec: [analytics_screens_spec §4.1](../specs/analytics_screens_spec.md)
      Files: `apps/web/src/components/analytics/**` (только тип карточки: `Card` / `RecordCard` / мобильные карточки)
      Acceptance: тело `text-[1.3125rem] leading-snug`, мета `text-base`, `p-3`, `gap-3` / `gap-2`; KPI и заголовок страницы без изменений; не тронуты `NumberDisplay`, `BarChart`, `ContentText`, таблицы `lg+` → сверка экранов `/analytics`, ученик, школа, рейтинг на 390 и md
      Paths: H [§4.1] · N n/a — copy/CSS, без мутации · S n/a — права экранов не меняются

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke deferred

## Verification (phase)

- [ ] Все CU закоммичены; у каждого trace `Review: …`
- [ ] Phase DoD из `P11_phase_description.md`
- [ ] Docs sync (product-docs-alignment) — CU1, не хвостом без CU

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P11_phase_description.md`](../phases_tasks_descriptions/P11_phase_description.md) | DoD фазы |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, task tiers, commit units |
| [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) §2.3.2a / §2.3.6 | Пути H / N / S |
