# P03 Tasks — Уроки, золотые стихи, календарь

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W11-06  
**Зависит от:** [`P03_phase_description.md`](../phases_tasks_descriptions/P03_phase_description.md), [`homework_check_contract.md`](../contracts/homework_check_contract.md), [`bible_seed_contract.md`](../contracts/bible_seed_contract.md), [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md)  
**Связанные документы:** [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md), [`adr_009`](../../../prds/07_governance/adr_009_bible_translations_and_verse_numbering.md), [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md), [`P02_tasks.md`](./P02_tasks.md)

---

## Purpose

Загрузить Библию, собрать правила стихов и урока, дать формы и экраны уроков и календаря. DoD — [`P03_phase_description.md`](../phases_tasks_descriptions/P03_phase_description.md).

## Phase DoR audit (lean: оркестратор inline)

- [ ] P02 DoD выполнен; год, группы, назначения есть
- [ ] Задачи проходят DoR; экранные требования формы урока — в phase_description (spec-gap закрыт)
- [ ] Доступны данные: RST JSON в репо, NIV локально (`Bible/data/.../niv`), скрипты владельца
- [ ] `versification.json` готов к CU2 либо CU2 ограничен загрузкой NIV как `LOADING`

## Commit plan

### P03-CU1 — feat(db): add Bible loader for Synodal translation with count verification · Review: reviewer · Commit: auto

- [x] P03-T1 · T3 · Contract: [bible_seed §3–§5, §7](../contracts/bible_seed_contract.md) · Spec: [seed_data_spec §7](../../../prds/03_data_model/seed_data_spec.md)
      Files: `packages/db/seed/bible/{load-books,load-verses,verify,run}.ts`, скрипт `seed:bible`
      Acceptance: upsert без `TRUNCATE`; проверки 66/1189/31 166, `SUM(verses_count)`, уникальность `verse_order`; переходы `startLoad` → `finishLoad` / `failLoad` (статус `READY` только после сверки); журнал `bible.*` + `seed.run` → интеграционный тест на копии БД
      Paths: H [§5.1] · N [§8: счётчики, окружение] · S [маркер БД, `DIRECT_URL`; нет вызова из приложения]
- [x] P03-T2 · T3 · Spec: [Bible/README §4 п. 1, 3, 6](../../../my_specs/Bible/README.md)
      Files: перенос скриптов в `packages/db/seed/bible/`, правка имён таблиц под схему §5.4
      Acceptance: `bible_chapter` не создаётся; `verse_order` сохраняется; повторный запуск идемпотентен → тест
      Paths: H · N [повторный запуск] · S [нет секретов в логах]

**CU DoD:** `typecheck` · `lint` · `test` · smoke: `seed:bible` на dev-БД

### P03-CU2 — feat(db): add verse map builder and NIV loader with license guard · Review: reviewer · Commit: auto

- [x] P03-T3 · T3 · Contract: [bible_seed §6](../contracts/bible_seed_contract.md) · ADR: [adr_009 §3.3](../../../prds/07_governance/adr_009_bible_translations_and_verse_numbering.md)
      Files: `packages/db/seed/bible/{build-verse-map,versification.json}`, `load-niv.ts`
      Acceptance: Псалмы — по правилу из разности `verses_count`, 27 глав и слияния — по таблице; сумма стихов по главе совпадает с `verses_count`; `Пс. 22:1–3` ↔ `Ps. 23:1–3` → unit-тест
      Paths: H [§5.2] · N [карта неполна → NIV не `READY`] · S [NIV не в git; `--confirm-license` в prod]
- [x] P03-T4 · T2 · Files: `.gitignore` проверка, CI-скрипт `check:no-niv-in-git`
      Acceptance: `git ls-files` не содержит путей NIV → скрипт зелёный
      Paths: n/a — tooling

**CU DoD:** `typecheck` · `lint` · `test` · smoke: NIV в dev, статус по сверке

### P03-CU3 — feat(domain): add verse text builder, range rules and lesson schemas · Review: diff-only · Commit: auto

- [x] P03-T5 · T1 · Contract: [bible_seed §5.2](../contracts/bible_seed_contract.md)
      Files: `packages/domain/src/bible/{build-verse-text,normalize-range}.ts`
      Acceptance: сборка по диапазону в переводе группы, `missing[]`; обратное отображение через карту; границы диапазона → unit-тесты
      Paths: H [§5.2] · N [пропуск стиха, `end < start`]
- [x] P03-T6 · T1 · Contract: [homework_check §4.1, §5.1](../contracts/homework_check_contract.md)
      Files: `packages/domain/src/lesson/{schemas,ordinal,previous-regular}.ts`, коды `CHECK_*` (урок), `AUDIT_ACTION` (`lesson.*`, `calendar.*`)
      Acceptance: схемы входов, `previousRegularLesson` пропускает обзорный (БП-2), `ordinal` по `(date, created_at)` → unit-тесты
      Paths: H · N [обзорный со стихами, лимит]

**CU DoD:** `typecheck` · `lint` · `test`

### P03-CU4 — feat(lessons): add lesson create, update, lead change and delete use-cases · Review: reviewer · Commit: auto

- [x] P03-T7 · T3 · Contract: [homework_check §5.1–§5.3, §8–§10](../contracts/homework_check_contract.md) · Invariants: INV-02, INV-21
      Files: `apps/web/src/data/lessons/{create-lesson,update-lesson,change-lead-teacher,delete-lesson}.ts`, `actions/lessons.ts`
      Acceptance: блокировка года; `golden_verse` найти/создать; ведущий назначен (R-4); пересчёт `ordinal`; правка после проверок ограничена; удаление teacher только без проверок; журнал `lesson.*` → тесты по таблице отказов
      Paths: H [§5.1–5.3] · N [§8: год, ведущий, стих, лимит, обзорный, locked] · S [AZ-30, AZ-31, AZ-P5, AZ-P6: чужая группа → `NOT_FOUND`]

**CU DoD:** `typecheck` · `lint` · `test` (отказы, гонка `ordinal`) · smoke: создать/править/удалить

### P03-CU5 — feat(lessons): add verse text reads and group translation resolver · Review: diff-only · Commit: auto

- [x] P03-T8 · T1 · Contract: [bible_seed §5.2, §12](../contracts/bible_seed_contract.md) · ADR: [adr_002 §5](../../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md)
      Files: `apps/web/src/data/bible/{get-group-translation,get-verse-text,list-books}.ts` (`'use cache'` с тегом перевода)
      Acceptance: текст по индексу `(translation, book, chapter, verse)`; `missing[]` для формы; кэш с тегом, сброс при перезагрузке перевода → тест
      Paths: H · N [нет перевода у группы → `SCHOOL_LANGUAGE_UNAVAILABLE`] · S [только чтение, нет мутаций]

**CU DoD:** `typecheck` · `lint` · `test`

### P03-CU6 — feat(web): add lesson form with verse picker · Review: diff-only · Commit: auto

- [ ] P03-T9 · T1 · Phase: [Экранные требования](../phases_tasks_descriptions/P03_phase_description.md) · UX: [forms §5–§7](../../../design/forms_and_validation_ux.md) · Prototype: `lessonForm`
      Files: `app/(app)/lessons/new/page.tsx`, `lessons/[lessonId]/edit/page.tsx`, `components/teacher/{LessonForm,VersePicker,VerseRefList}.tsx`
      Acceptance: поля и ограничения по таблице; текст выбранных стихов в переводе группы; список недостающих; сохранение блокируется при `missing`; ошибки у полей, фокус на первом → ручной smoke H/N
      Paths: H [форма] · N [§8 контракта; D10] · S [AZ-30; текст стиха — из БД, содержание санитизируется]
- [ ] P03-T10 · T0 · Files: `lib/messages/{ru,en}/teacher.json`
      Acceptance: ключи форм и экранов уроков на двух языках
      Paths: n/a — copy

**CU DoD:** `typecheck` · `lint` · `test` · smoke 390 px и `lg`

### P03-CU7 — feat(web): add lessons list, lesson card and verses screens · Review: diff-only · Commit: auto

- [ ] P03-T11 · T1 · Flow: [teacher_flow §4.2](../../../prds/01_product_scope/user_flows/users_mvp/teacher_flow.md) · Prototype: `lessons`, `lesson`, `verses`
      Files: `app/(app)/lessons/page.tsx`, `lessons/[lessonId]/page.tsx`, `verses/page.tsx`, `components/teacher/{LessonCard,LessonListRow}.tsx`
      Acceptance: список, карточка со стихами и текстом, справочник; D1/D2/D3/D4 состояния; удаление только без проверок; «Проверить» → заглушка P04 → ручной smoke
      Paths: H · N [UX-05 D1–D4] · S [AZ-32, AZ-36: чужой урок → 404]

**CU DoD:** `typecheck` · `lint` · `test` · smoke

### P03-CU8 — feat(calendar): add event use-cases and calendar screen · Review: reviewer · Commit: auto

- [ ] P03-T12 · T3 · Spec: [спец. §3.18](../../../my_specs/sunday_school_data_analytics_spec.md) · Matrix: AZ-42, AZ-43
      Files: `data/calendar/{create-event,update-event,delete-event}.ts`, `actions/calendar.ts`; обновление [`change_log_contract.md`](../contracts/change_log_contract.md) §4 (`calendar.event_*`)
      Acceptance: тип `LESSON` связан с уроком; teacher — своя группа и активный год; admin любая; журнал → тесты отказов
      Paths: H · N [тип/урок, чужая группа, закрытый год] · S [AZ-42, AZ-P5, AZ-P6]
- [ ] P03-T13 · T1 · Prototype: `calendar`
      Files: `app/(app)/calendar/page.tsx`, `components/teacher/{CalendarMonth,CalendarEventForm}.tsx`
      Acceptance: месяц/список, создание/правка/удаление, открытие урока из события → ручной smoke
      Paths: H · N [пустой месяц — призыв] · S [AZ-43]

**CU DoD:** `typecheck` · `lint` · `test` · smoke

### P03-CU9 — feat(web): add today screen · Review: diff-only · Commit: auto

- [ ] P03-T14 · T1 · Flow: [teacher_flow §4.2](../../../prds/01_product_scope/user_flows/users_mvp/teacher_flow.md) · Prototype: `today`
      Files: `app/(app)/today/page.tsx`, `components/teacher/TodayLessonCard.tsx`
      Acceptance: ближайший/текущий урок, «Новый урок», блок прогресса — заглушка до P04; D1/D2 → ручной smoke
      Paths: H · N [D1, D2] · S [только свои группы]

**CU DoD:** `typecheck` · `lint` · smoke

### P03-CU10 — docs(docs): sync P03 docs · Review: diff-only · Commit: auto

- [ ] P03-T15 · T0 · Files: `docs/**` (change_log registry, bible_seed_contract Q, schema при расхождениях)
      Acceptance: grep терминов; нет drift с кодом
      Paths: n/a — docs-only

## Verification (phase)

- [ ] Все CU закоммичены; trace `Review: …`
- [ ] Phase DoD из [`P03_phase_description.md`](../phases_tasks_descriptions/P03_phase_description.md)
- [ ] Docs sync — в CU10

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P03_phase_description.md`](../phases_tasks_descriptions/P03_phase_description.md) | DoD |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W11-06) |
