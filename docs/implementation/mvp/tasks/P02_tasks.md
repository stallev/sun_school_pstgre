# P02 Tasks — Учебный год, группы, ученики, настройки

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W11-04  
**Зависит от:** [`P02_phase_description.md`](../phases_tasks_descriptions/P02_phase_description.md), [`school_year_and_groups_contract.md`](../contracts/school_year_and_groups_contract.md), [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md), [`change_log_contract.md`](../contracts/change_log_contract.md)  
**Связанные документы:** [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md), [`admin_flow.md`](../../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md), [`P01_tasks.md`](./P01_tasks.md)

---

## Purpose

Доставить структуру школы: год, группы, назначения, ученики, согласия, зачисление и настройки приложения. DoD — [`P02_phase_description.md`](../phases_tasks_descriptions/P02_phase_description.md).

## Phase DoR audit (lean: оркестратор inline)

- [ ] P01 DoD выполнен; зелёные `typecheck`, `lint`, `test`
- [ ] Задачи проходят DoR; нет `group_and_pupils_spec` → spec-gap по месту дописывается разделом «Экраны» в этом файле или отдельным spec
- [x] Решение Q-01 P01 принято (одобрение без групп с предупреждением `NO_GROUPS`); контракт W8-03 исправлен
- [x] Partial unique index для R-1/R-2 присутствуют в миграции P5 (проверка), иначе — задача миграции в CU2

## Commit plan

Формат — [`phase_tasks.template.md`](../../../meta/phase_tasks.template.md).

### P02-CU1 — feat(domain): add school rules, schemas and codes · Review: diff-only · Commit: auto

- [x] P02-T1 · T1 · Contract: [school_year §4, §6](../contracts/school_year_and_groups_contract.md)
      Files: `packages/domain/src/school/{year,enrollment,grade-settings}.ts`, `schemas/*`, `constants/mutation-error-codes.ts` (`SCHOOL_*`), `audit-action.ts` (`school.*`, `settings.*`)
      Acceptance: `validateYearDates`, `canActivateYear`, `canEnroll`, схемы входов; `maxVersesPerLesson` 0–10, веса целые ≥ 0 → unit-тесты границ
      Paths: H [school_year §5] · N [пересечение дат, `ageMin > ageMax`, веса < 0]
- [x] P02-T2 · T1 · ADR: [adr_004 §4](../../../prds/07_governance/adr_004_timezone_scheduling_model.md), [adr_008 §4.1](../../../prds/07_governance/adr_008_i18n_ru_en_dictionary_slices.md)
      Files: `packages/domain/src/settings/{timezone,locale}.ts`
      Acceptance: `isValidIanaTimeZone` (по `Intl.supportedValuesOf`), список локалей `ru`/`en` → unit-тест
      Paths: N [неизвестная зона → false]

**CU DoD:** `typecheck` · `lint` · `test`

### P02-CU2 — feat(school): add academic year use-cases · Review: reviewer · Commit: auto

- [x] P02-T3 · T3 · Contract: [school_year §5.1, §8](../contracts/school_year_and_groups_contract.md) · Invariants: INV-01
      Files: `apps/web/src/data/school/{create-year,activate-year,close-year}.ts`, `actions/school-year.ts`
      Acceptance: `activateYear` под блокировкой + partial unique; `closeYear` закрывает зачисления и назначения, год read-only для teacher; `createYear` копирует настройки и назначения; журнал `school.year_*` → тесты (второй активный, пересечение, гонка)
      Paths: H [§5.1] · N [§6: активный есть, пересечение, статус] · S [AZ-12, AZ-P5: teacher → `FORBIDDEN`]

**CU DoD:** `typecheck` · `lint` · `test` (гонка активации) · smoke: создать → активировать → закрыть

### P02-CU3 — feat(school): add groups, assignments and grade settings use-cases · Review: reviewer · Commit: auto

- [ ] P02-T4 · T3 · Contract: [school_year §5.2–§5.5](../contracts/school_year_and_groups_contract.md)
      Files: `data/school/{create-group,update-group,set-group-language,assign-teacher,unassign-teacher,update-grade-settings}.ts`
      Acceptance: `grade_settings` по умолчанию; язык `EN` только при `READY`; назначение — пользователь `ACTIVE` с ролью `TEACHER`; снятие не удаляет уроки; веса действуют на новые проверки → тесты по таблице отказов
      Paths: H [§5.2–5.5] · N [§6: язык недоступен, не teacher, имя занято, группа неактивна] · S [AZ-10, AZ-11, AZ-13; teacher → `FORBIDDEN`]

**CU DoD:** `typecheck` · `lint` · `test`

### P02-CU4 — feat(school): add pupil and paper consent use-cases · Review: reviewer · Commit: auto

- [ ] P02-T5 · T3 · Contract: [school_year §5.6–§5.8](../contracts/school_year_and_groups_contract.md) · Matrix: AZ-20…AZ-22
      Files: `data/school/{create-pupil,update-pupil,deactivate-pupil,record-paper-consent,revoke-consent}.ts`
      Acceptance: карточка без согласия допустима; `recordPaperConsent` создаёт `ACTIVE` (подписант, дата, версия, место); отзыв блокирует зачисление; в DTO teacher — только «есть/нет» → тесты, проверка отсутствия ФИО в журнале
      Paths: H [§5.6–5.8] · N [нет подписанта/даты, дата в будущем] · S [AZ-20, AZ-22, СО-7: teacher не видит детали; INV-23]

**CU DoD:** `typecheck` · `lint` · `test`

### P02-CU5 — feat(school): add enrollment, unenrollment and transfer use-cases · Review: reviewer · Commit: auto

- [ ] P02-T6 · T3 · Contract: [school_year §5.9–§5.11, §8](../contracts/school_year_and_groups_contract.md) · Invariants: INV-07…INV-10
      Files: `data/school/{enroll-pupil,unenroll-pupil,transfer-pupil}.ts`
      Acceptance: зачисление требует действующего согласия и активной группы; перевод — одна транзакция (закрыть + открыть); история проверок и остаток не меняются; teacher — только своя группа активного года → тесты, включая гонку перевода/исключения
      Paths: H [§5.9–5.11] · N [§6: нет согласия, уже зачислен, не зачислен, группа неактивна, закрытый год] · S [AZ-23, AZ-P6: чужая группа → `NOT_FOUND`]

**CU DoD:** `typecheck` · `lint` · `test` (гонки) · smoke: зачислить → перевести → исключить

### P02-CU6 — feat(settings): add application language and school timezone use-cases · Review: reviewer · Commit: auto

- [ ] P02-T7 · T3 · ADR: [adr_004 §4, §7](../../../prds/07_governance/adr_004_timezone_scheduling_model.md), [adr_008 §4.2, §7](../../../prds/07_governance/adr_008_i18n_ru_en_dictionary_slices.md) · Matrix: AZ-15
      Files: `data/settings/{update-app-language,update-school-timezone}.ts`, кэш `ui-locale`/`school-timezone` с `updateTag`
      Acceptance: только `ADMIN`; валидация IANA; запись `settings.*_changed`; `updateTag` после commit; `<html lang>` меняется при следующей загрузке; смена пояса не пересчитывает прошлые данные → тесты
      Paths: H [adr_004 §7 H, adr_008 §7 H] · N [неизвестный пояс, неизвестная локаль] · S [AZ-15, AZ-D3]

**CU DoD:** `typecheck` · `lint` · `test` · smoke: смена языка видна после перезагрузки

### P02-CU7 — feat(web): add year and groups screens · Review: diff-only · Commit: auto

- [ ] P02-T8 · T1 · Flow: [admin_flow §4.4](../../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md) · Prototype: `year`, `groups`, `groupEdit`
      Files: `app/(app)/year/page.tsx`, `groups/page.tsx`, `groups/[groupId]/page.tsx`, `components/admin/{YearCard,GroupCard,GroupSettingsForm,TeacherAssignmentList}.tsx`
      Acceptance: создание/активация/закрытие с подтверждением; группа: язык с предупреждением ЯГ-4, настройки, назначения; D1 пустое состояние с действием → ручной smoke H/N
      Paths: H [admin_flow §4.4] · N [UX-05 D1, D9; ошибки кодов §6 контракта] · S [AZ-10…AZ-13: teacher → 403]
- [ ] P02-T9 · T0 · Files: `lib/messages/{ru,en}/admin.json`
      Acceptance: ключи экранов года и групп на двух языках
      Paths: n/a — copy

**CU DoD:** `typecheck` · `lint` · `test` · smoke 390 px и `lg`

### P02-CU8 — feat(web): add people screen with consent and enrollment · Review: diff-only · Commit: auto

- [ ] P02-T10 · T1 · Flow: [admin_flow §4.5](../../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md) · Prototype: `people`, `pupil`
      Files: `app/(app)/people/page.tsx`, `components/admin/{PupilRow,PupilCardForm,ConsentDialog,EnrollDialog,TransferDialog}.tsx`
      Acceptance: список (все / без группы / неактивные), карточка, бумажное согласие, зачисление/перевод/исключение; статус «нет согласия» виден admin → ручной smoke H/N
      Paths: H [admin_flow §4.5] · N [§6 контракта; UX-05 D11] · S [AZ-20…AZ-23; ФИО не в URL]

**CU DoD:** `typecheck` · `lint` · `test` · smoke 390 px

### P02-CU9 — feat(web): add teacher group, settings and school skeleton screens · Review: diff-only · Commit: auto

- [ ] P02-T11 · T1 · Flow: [teacher_flow §4.6](../../../prds/01_product_scope/user_flows/users_mvp/teacher_flow.md) · Prototype: `group`
      Files: `app/(app)/group/page.tsx`, `components/teacher/RosterTable.tsx`
      Acceptance: состав своей группы; зачисление/исключение в своей группе; «согласие есть/нет»; D2 для teacher без назначения; D3 в закрытом году → ручной smoke
      Paths: H · N [D2, D3] · S [AZ-21, AZ-23, AZ-P6]
- [ ] P02-T12 · T1 · ADR: adr_004, adr_008 · Prototype: `settings`
      Files: `app/(app)/settings/page.tsx`, `components/admin/{SettingsLanguageForm,TimezonePicker}.tsx`
      Acceptance: язык и часовой пояс (поиск по IANA), предупреждение D13 до выбора → ручной smoke
      Paths: H · N [неизвестный пояс] · S [AZ-15]
- [ ] P02-T13 · T1 · Prototype: `school`
      Files: `app/(app)/school/page.tsx`, `components/shell/ShellBanners.tsx`
      Acceptance: каркас — счётчики (группы, ученики, заявки), баннеры D1/D13; без средних (P05) → ручной smoke
      Paths: H · N [D1] · S [AZ-16]

**CU DoD:** `typecheck` · `lint` · `test` · smoke

### P02-CU10 — docs(docs): sync P02 docs and P01 follow-up · Review: diff-only · Commit: auto

- [ ] P02-T14 · T0 · Files: `docs/**`, регрессионные тесты одобрения `TEACHER`
      Acceptance: сквозной smoke «заявка teacher → одобрение без групп (предупреждение `NO_GROUPS`) → назначение группы → вход → `/today`»; контракт W8-03 и admin_flow согласованы; ссылки открываются
      Paths: n/a — docs/tests

## Verification (phase)

- [ ] Все CU закоммичены; trace `Review: …`
- [ ] Phase DoD из [`P02_phase_description.md`](../phases_tasks_descriptions/P02_phase_description.md)
- [ ] Docs sync — в CU10

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P02_phase_description.md`](../phases_tasks_descriptions/P02_phase_description.md) | DoD |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W11-04) |
