# P24 Tasks — UX-правки проверки ДЗ, оболочка, кнопки, toast, дни рождения

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-11-03  
**Волна:** P24  
**Зависит от:** [`P24_phase_description.md`](../phases_tasks_descriptions/P24_phase_description.md), [`adr_017_shell_container_toast_buttons.md`](../../../prds/07_governance/adr_017_shell_container_toast_buttons.md), [`homework_check_flow_spec.md`](../specs/homework_check_flow_spec.md) §5.2–§5.7, [`global_shell_spec.md`](../specs/global_shell_spec.md) §5, §6.1а, §6.5, [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) D-14, D-15, [`school_year_and_groups_contract.md`](../contracts/school_year_and_groups_contract.md) §5.6a, §5.12  
**Связанные документы:** [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) AZ-20a, AZ-43, AZ-60, [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md) §7.1–§7.2, [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md) §3, §6, [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md) §5.3–§5.4, [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md) §3.10, [`prototype_class_parity_spec.md`](../specs/prototype_class_parity_spec.md) §7, [`change_log_contract.md`](../contracts/change_log_contract.md) §4, [`canonical_routes.md`](../../../design/canonical_routes.md) §10

---

## Purpose

Исправить баги экрана `/lessons/[lessonId]/check` (ошибка присутствия «прилипает», самосохранение по Enter, `window.confirm` с обратным смыслом), уплотнить форму проверки, свести кнопки к одному компактному размеру, перенести и раскрасить toast, дать сворачиваемый сайдбар и центрированный контейнер 1600, дать учителю ввод даты рождения и показать дни рождения в календаре. DoD — [`P24_phase_description.md`](../phases_tasks_descriptions/P24_phase_description.md).

**Порядок.** CU1 → CU2 → CU3 → CU4 → CU5 → CU6 → CU7. CU2 (проп `fit`, inline 0–10) раньше CU3 (общий размер `h-9`). CU6 (дата рождения) раньше CU7 (дни рождения в календаре читают ту же колонку). Документы, HTML-прототип и строки parity (`prototype_class_parity_spec.md` §7) обновлены в подготовительном шаге фазы, до CU1, вне commit units.

## Phase DoR audit (architect spec-gap, 2026-11-03)

- [x] ADR-017; spec проверки §5.2, §5.2а, §5.3, §5.5, §5.7, R-11…R-14; UX-06 §7.1; UX-05 D14; оболочка §5 шаг 4а, §6.1а, §6.5, R-9, R-11, R-12; UX-03 D-14, D-15; UX-02 §3; Lab §5.3–§5.4; контракт школы §5.6a, §5.12; AZ-20a; код журнала `school.pupil_birth_date_updated` — существуют — 2026-11-03 · architect · подготовка P24
- [x] Задачи ниже ссылаются на `§`-якоря, называют Files, Acceptance и Paths; T3 — свой CU; CU ≤ ~400 строк (CU3 — массовая замена размеров, ориентир по hand-written строкам без снапшотов)
- [x] `Проверено по`: Next.js `16.4.4` (`cookies()`), Sonner `2.0.8` (`position`, `icons`, `toastOptions.classNames`), `@base-ui/react` `1.9.0`, `lucide-react` `1.55.0` (`CircleCheck`, `CircleAlert`, `PanelLeftClose`, `PanelLeftOpen`, `Cake`) — ADR-017
- [x] Open questions: блокирующих нет (Q-1 фазы — проверка гипотезы Enter воспроизведением, закрывается тестом CU1)
- [x] Прототип (`vCheck`, `vCalendar`, `vGroup`, оболочка, `toast()`) и parity-строки обновлены в том же подготовительном шаге

## Commit plan

### P24-CU1 — fix(web): reset present error and confirm unsaved changes in dialog · Review: reviewer · Commit: auto

Tier T2: изменение потока мутации на клиенте (Paths H · N); мутации и права не меняются.

- [x] P24-T1 · T2 · Spec: [check flow §5.5 п. 2, 5–7, §5.7, §10, R-11…R-13](../specs/homework_check_flow_spec.md) · UX: [forms §7.1](../../../design/forms_and_validation_ux.md), [ui states D14](../../../design/ui_states_contract.md) · Lab: [§5.4 `ConfirmDialog` `unsaved`](../specs/design_system_lab_spec.md)
      Files: `apps/web/src/components/teacher/use-sequential-check.ts`, `apps/web/src/components/teacher/use-sequential-check.test.tsx`, `apps/web/src/components/teacher/check-screen.client.tsx`, `apps/web/src/components/teacher/CheckCard.tsx`, `apps/web/src/components/teacher/CheckUnsavedDialog.client.tsx`, `apps/web/src/components/patterns/ConfirmDialog.tsx`, `apps/web/src/components/design-lab/OverlayMatrix.tsx`, `apps/web/src/lib/messages/{ru,en}/teacher.json`, `apps/web/src/lib/messages/teacher-check-messages.ts`, `apps/web/src/lib/messages/pick-teacher-check-messages.server.ts`
      Acceptance: `presentError` сбрасывается в `updateActive` при выборе присутствия и при каждой смене текущего ученика (`moveTo`, переход после сохранения) — R-11; глобальный `keydown` выходит без действия, если цель — `button`, `a`, `input`, `textarea`, `select`, `[role=radio]`, `[role=button]`, `[contenteditable]`, при `defaultPrevented`, `isComposing`, `repeat`; ←/→ не листают учеников внутри `[role=radiogroup]` — R-12; `window.confirm` удалён (grep по `apps/web/src` пуст); диалог из трёх действий §5.5 п. 5: «Сохранить и перейти» вызывает тот же save и переходит только при `ok`, и после закрытия диалога фокус оказывается на `h2` выбранного ученика (§5.5 п. 5: перенос фокуса при ещё открытом диалоге не удерживается), «Не сохранять» откатывает локальную форму ученика, переходит и показывает toast «Изменения сброшены» 2000 мс, «Остаться» / Esc / фон — без изменений, фокус на вызвавший элемент; pending — `disabled`, `aria-busy`, «Сохраняем…»; вариант `unsaved` в `ConfirmDialog` и секция Lab — до использования на экране (C-2); ключи `check.unsaved_dialog_title`, `check.unsaved_dialog_body`, `check.unsaved_save`, `check.unsaved_discard`, `check.unsaved_stay`, `check.unsaved_discarded` в ru и en и в срезе; старые `check.unsaved_confirm_*` удалены; `beforeunload` остаётся; тесты хука: сброс ошибки при выборе и при переходе, Enter на кнопке не сохраняет, три ветки диалога
      Paths: H [§5.5 п. 5: «Сохранить и перейти», «Не сохранять»] · N [§10: сохранение из диалога без присутствия — ошибка у поля, перехода нет; «Остаться» / Esc; Enter на кнопке сегмента; ←/→ в радиогруппе; `CONFLICT` и обрыв сети при сохранении из диалога — диалог закрыт, ученик прежний] · S n/a — те же `saveChecked` / `correctCheck`, политика и DTO не меняются (§11 S-7)

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `use-sequential-check` · grep `window.confirm` в `apps/web/src` пуст

### P24-CU2 — feat(web): densify sequential check card on desktop · Review: reviewer · Commit: auto

- [x] P24-T2 · T1 · Spec: [check flow §5.2, §5.2а, §5.3, R-14](../specs/homework_check_flow_spec.md) · [redesign §3.10](../../../design/redesign_v2_ui_spec.md) (`segmented-control`, `score-pad`) · Lab: [§5.3 `SegmentedControl`, `ScorePad`](../specs/design_system_lab_spec.md)
      Files: `apps/web/src/components/teacher/CheckCard.tsx`, `apps/web/src/components/teacher/CheckScoresSection.tsx`, `apps/web/src/components/teacher/CheckScaleField.tsx`, `apps/web/src/components/teacher/CheckVerseField.tsx`, `apps/web/src/components/teacher/check-scores-section.test.tsx`, `apps/web/src/components/ui/segmented-control.tsx`, `apps/web/src/components/ui/segmented-control.test.tsx`, `apps/web/src/components/ui/score-pad.tsx`, `apps/web/src/components/ui/score-pad.test.tsx`, `apps/web/src/components/design-lab/ChoiceMatrix.tsx`
      Acceptance: `SegmentedControl` получает проп `fit` (по умолчанию — по ширине содержимого, без `grid-cols-N` / `flex-1`); «Присутствие» на карточке — компактный сегмент; на ≥ `lg` присутствие и спевка в одном ряду, подпись БП-10 под рядом; сетка `lg:grid-cols-2`: слева стихи, справа тест и тетрадь; без `hasTest` — только тетрадь; обзорный урок — одна колонка; `ScorePad` `layout="inline"` поддерживает 0–10 одной линией «— 0 … 10» (`radiogroup`, ←/→, выбранный — D-10), используется в `CheckScaleField` на ≥ `lg`; на < `lg` — прежняя панель `keypad`; свёртка «Не был» и значения формы не меняются; секции Lab (сегмент `fit`, inline 0–10) обновлены до экрана; один компонент на файл, ≤ 140 строк
      Paths: H [§5.2а: 1920×1080 — карточка обычного урока без прокрутки страницы] · N [§5.4: обзорный урок, урок без теста, первый урок года, «Не был» без `late`, `late`] · S n/a — presentational, данные и мутации не меняются

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `segmented-control`, `score-pad`, `check-scores-section` · `npm run parity:check`

### P24-CU3 — refactor(ui): unify compact button size · Review: reviewer · Commit: auto

Tier T2: смена API примитивов (`Button` `size`, `SegmentedControl` `size`) с переводом всех потребителей.

- [x] P24-T3 · T2 · Spec: [UX-03 D-14, §7, §8, §9 п. 4](../../../design/visual_identity_contract.md) · [redesign §3.10](../../../design/redesign_v2_ui_spec.md) · Lab: [§5.3 `Button`, чип, `SegmentedControl`, `ScorePad`](../specs/design_system_lab_spec.md) · ADR-017 §4 п. 4 · [forms F14](../../../design/forms_and_validation_ux.md)
      Files: `apps/web/src/components/ui/button.tsx`, `apps/web/src/components/ui/segmented-control.tsx`, `apps/web/src/components/ui/score-pad.tsx`, `apps/web/src/components/ui/score-selector.tsx`, `apps/web/src/components/ui/p14-cu2-blockers.test.ts`, `apps/web/src/components/ui/button.test.tsx`, `apps/web/src/lib/ui/segmented-chip-classes.ts`, `apps/web/src/lib/ui/form-submit-button-class.ts`, `apps/web/src/components/teacher/CheckBottomBar.tsx`, `apps/web/src/components/design-lab/ButtonMatrix.tsx`, `apps/web/src/components/design-lab/ChoiceMatrix.tsx`, `apps/web/src/components/**/*.tsx` (потребители `size="compact"`, кнопки рядом с полем), `apps/web/src/app/**/*.tsx` (те же потребители)
      Acceptance: `Button` размеры `default` = `h-9 px-3` (ширина по содержимому), `field` = `h-10 px-3.5`, `touch` = `h-11 px-5`, `icon` = `size-9`, `icon-touch` = `size-11`; размер `compact` удалён, grep `size="compact"` по `apps/web/src` пуст; у `SegmentedControl` проп `size` удалён, высота `h-9`; кнопки `ScorePad` / `ScoreSelector` `h-9 min-w-9`; кнопка в ряду с полем — `size="field"` (высоты в ряду равны, F14); нижняя панель проверки на < `md` — `touch`; `w-full` у кнопок только на < `md`; компактные кнопки на < `md` — область касания ≥ 44 px (`after:-inset-y-1`); секции Lab «вариант × размер» обновлены; `npm run parity:check` — `Parity: N строк, расхождений 0`
      Paths: H [UX-03 D-14: все кнопки `h-9`, как «Выдать»] · N [кнопка рядом с полем → `field`; главное действие на 390 px → `touch`; `disabled` / `pending`] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `button`, `segmented-control`, `p14-cu2-blockers` · `npm run parity:check`

### P24-CU4 — feat(ui): color toasts and place them bottom-right · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (не T3, без `Paths: S`, вне sensitive zones).

- [x] P24-T4 · T1 · Spec: [shell §6.5, R-12](../specs/global_shell_spec.md) · [UX-03 D-15, §8 Toast](../../../design/visual_identity_contract.md) · Lab: [§5.3 `Toast`](../specs/design_system_lab_spec.md) · ADR-017 §4 п. 3
      Files: `apps/web/src/components/shell/product-toaster.client.tsx`, `apps/web/src/components/shell/product-toaster.test.tsx`, `apps/web/src/lib/ui/product-toast.ts`, `apps/web/src/components/design-lab/FeedbackMatrix.tsx`, `apps/web/src/components/design-lab/ChoiceMatrix.tsx` (хвост CU3 — Lab после снятия `size="compact"`)
      Acceptance: ≥ `lg` — `position="bottom-right"` с отступом `bottom-6 right-6`; < `lg` — сверху по центру; `toastOptions.classNames`: `success` — `bg-ok-soft border-ok text-ink`, `error` — `bg-danger-soft border-danger text-ink`, нейтральный — `bg-surface border-line`, `shadow-float`, ширина `min(24rem, 100vw - 2rem)`; `icons`: `success` — `CircleCheck` `text-ok`, `error` — `CircleAlert` `text-danger` (`aria-hidden`); `duration` = `PRODUCT_TOAST_DURATION_MS` (2000); без hex и `style`; Lab — кнопки success / error / нейтральный; тест рендера классов и позиции
      Paths: H [§6.5: success и error различаются цветом и иконкой] · N [длинный текст переносится; `motion-reduce` без анимации; одновременно два toast — стек] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тест `product-toaster`

### P24-CU5 — feat(web): add collapsible sidebar rail and centered shell container · Review: reviewer · Commit: auto

Tier T2: серверное чтение cookie в layout оболочки и новый режим навигации. Cookie — UI-предпочтение без ПД, не auth-cookie (не sensitive zone `cookies` — ADR-017 §7 S).

- [x] P24-T5 · T2 · Spec: [shell §4, §5 шаг 4а, §6.1а, R-9, R-11, §16](../specs/global_shell_spec.md) · [UX-02 §3, §4, §6 п. 2b, §9](../../../design/responsive_navigation_contract.md) · [UX-03 §7, §8 пункт сайдбара](../../../design/visual_identity_contract.md) · [redesign §3.10](../../../design/redesign_v2_ui_spec.md) · ADR-017 §4 п. 1–2
      Files: `apps/web/src/app/(app)/layout.tsx`, `apps/web/src/components/shell/app-shell.tsx`, `apps/web/src/components/shell/shell-header.client.tsx`, `apps/web/src/components/shell/sidebar-nav.tsx`, `apps/web/src/components/shell/nav-link-row.tsx`, `apps/web/src/components/shell/nav-link-row.test.tsx`, `apps/web/src/components/shell/nav-badge.tsx`, `apps/web/src/components/shell/app-shell.test.tsx`, `apps/web/src/lib/shell/sidebar-collapsed-cookie.ts`, `apps/web/src/lib/shell/sidebar-collapsed-cookie.test.ts`, `apps/web/src/components/design-lab/ShellMatrix.tsx`, `apps/web/src/lib/messages/{ru,en}/common.json`, `apps/web/src/lib/messages/shell-messages.ts`
      Acceptance: `(app)/layout.tsx` читает `sidebar_collapsed` через `cookies()` и передаёт `sidebarCollapsed` в `AppShell`; сетка `lg:grid-cols-[16rem_minmax(0,1fr)]` / `lg:grid-cols-[4rem_minmax(0,1fr)]` с переходом и `motion-reduce:transition-none`; кнопка в шапке (`PanelLeftClose` / `PanelLeftOpen`, `aria-label` «Свернуть меню» / «Развернуть меню», `aria-expanded`, `aria-controls`) пишет cookie (`Path=/; Max-Age=31536000; SameSite=Lax`) и меняет состояние без перезагрузки; rail: иконки `size-5` в `h-10 w-10`, `aria-label` и tooltip у каждой ссылки, `aria-current` сохраняется, бейдж — точка + число в `aria-label`, заголовки групп `sr-only`; `#view` и правая часть шапки — `mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8`; < `lg` — drawer без изменений; ключи `shell.sidebar_collapse`, `shell.sidebar_expand` в ru и en; секция Lab «развёрнут × rail»; тесты парсера cookie и класса сетки
      Paths: H [§6.1а: свернуть, перезагрузить — rail без мигания; развернуть] · N [§5 шаг 4а: нет cookie / значение не `"1"` → развёрнут; `motion-reduce`; < `lg` cookie игнорируется; длинная подпись в rail — только tooltip] · S n/a — cookie без ПД и без влияния на права; набор пунктов решает сервер (UX-02 §7)

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `sidebar-collapsed-cookie`, `app-shell`, `nav-link-row` · `npm run parity:check`

### P24-CU6 — feat(web): let teachers edit pupil birth date · Review: reviewer · Commit: auto

Tier T3: мутация ПД ребёнка учителем (S — user-data mutation, role-scoped), новый Server Action, правка журнала `updatePupil`.

- [ ] P24-T6 · T3 · Contract: [school §3, §4, §5.6, §5.6a, §6, §7 S-5, S-6, §10, §11](../contracts/school_year_and_groups_contract.md) · [change log §4](../contracts/change_log_contract.md) · AZ-20, AZ-20a, AZ-P5, AZ-D4 · Flow: [teacher §4.6](../../../prds/01_product_scope/user_flows/users_mvp/teacher_flow.md)
      Files: `packages/domain/src/schemas/pupil.ts`, `packages/domain/src/schemas/pupil.test.ts`, `packages/domain/src/constants/audit-action.ts`, `packages/domain/src/index.ts`, `packages/policy/server/src/pupil-birth-date.ts`, `packages/policy/server/src/pupil-birth-date.test.ts`, `packages/policy/server/src/index.ts`, `apps/web/src/data/school/pupil-birth-date-access.server.ts`, `apps/web/src/data/school/update-pupil-birth-date.ts`, `apps/web/src/data/school/update-pupil-birth-date.test.ts`, `apps/web/src/data/school/update-pupil.ts`, `apps/web/src/data/school/update-pupil.test.ts`, `apps/web/src/data/school/load-teacher-group-page.server.ts`, `apps/web/src/actions/school-pupils.ts`, `apps/web/src/components/teacher/RosterTable.tsx`, `apps/web/src/components/teacher/PupilBirthDateDialog.client.tsx`, `apps/web/src/components/teacher/PupilBirthDateDialog.test.tsx`, `apps/web/src/components/teacher/GroupPageContent.server.tsx`, `apps/web/src/lib/messages/{ru,en}/teacher.json`, `apps/web/src/lib/messages/{ru,en}/common.json`, `apps/web/src/lib/messages/pick-teacher-roster-messages.server.ts`
      Acceptance: `updatePupilBirthDateInputSchema` — strict `{ pupilId, birthDate }`; `AUDIT_ACTION.SCHOOL_PUPIL_BIRTHDATE_UPDATED = "school.pupil_birth_date_updated"`; `canEditPupilBirthDate(context, facts)` — тесты: admin → allow; teacher своей группы активного года → allow; teacher чужой группы / без зачисления → `NOT_FOUND`; закрытый год → `FORBIDDEN`; parent → `FORBIDDEN`; DAL в одной транзакции: факты доступа по БД → `validateBirthDateInPast` → `UPDATE pupil SET birth_date` → журнал `{ fields: ["birthDate"] }` без даты; та же дата — `ok` без журнала; `updatePupil` при смене даты пишет `school.pupil_birth_date_updated` и `fields` в `school.pupil_updated`; Server Action `updatePupilBirthDateAction` — тонкий адаптер, `MutationResult`, коды из domain, `revalidate` `/group` и `/calendar`; диалог «Дата рождения» в строке `RosterTable` (только teacher, только активный год): `DateField`, pending (`disabled`, `aria-busy`, «Сохраняем…»), `toast.success` «Дата рождения сохранена» / `toast.error` 2000 мс, ошибка поля `common.errors.birth_date_in_future`; ключи `group.birth_date.*` в ru и en и в срезе `teacher`; один компонент на файл, ≤ 140 строк
      Paths: H [§5.6a: teacher вносит дату ученику своей группы; admin через `updatePupil` — журнал] · N [§6: дата в будущем → `VALIDATION`; та же дата — без журнала; лишние поля → `VALIDATION`; закрытый год → `FORBIDDEN`; обрыв сети — диалог открыт, введённое сохранено] · S [§7 S-6: чужая группа → `NOT_FOUND` без раскрытия; parent → `FORBIDDEN`; группа не с клиента — по `enrollment` + `teacher_assignment`; журнал без значения даты и ФИО (S-5, INV-23)]

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты policy (allow / чужая группа / закрытый год / parent) и DAL (журнал, идемпотентность, `updatePupil`)

### P24-CU7 — feat(web): show pupil birthdays in group calendar · Review: reviewer · Commit: auto

Tier T3: ролевой срез ПД (дата рождения) в загрузчике, общем для teacher, admin и parent (S — role-scoped data).

- [ ] P24-T7 · T3 · Contract: [school §5.12, §7 S-7](../contracts/school_year_and_groups_contract.md) · AZ-20a, AZ-43, AZ-60 · [canonical routes `/calendar`](../../../design/canonical_routes.md) · Flow: [teacher §4.6](../../../prds/01_product_scope/user_flows/users_mvp/teacher_flow.md), [admin §4.5](../../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md)
      Files: `apps/web/src/data/calendar/load-calendar-page.server.ts`, `apps/web/src/data/calendar/calendar-birthdays.server.ts`, `apps/web/src/data/calendar/calendar-birthdays.test.ts`, `packages/domain/src/calendar/birthday-in-month.ts`, `packages/domain/src/calendar/birthday-in-month.test.ts`, `packages/domain/src/index.ts`, `apps/web/src/components/teacher/CalendarMonth.tsx`, `apps/web/src/components/teacher/CalendarBirthdayRow.tsx`, `apps/web/src/components/teacher/CalendarPageContent.server.tsx`, `apps/web/src/lib/messages/{ru,en}/teacher.json`, `apps/web/src/lib/messages/teacher-calendar-messages.ts`, `apps/web/src/lib/messages/pick-teacher-calendar-messages.server.ts`
      Acceptance: чистая функция `birthdayDayInMonth(birthDate, year, month)` в domain: совпадение месяца, 29 февраля → 28 в невисокосный год — тесты; `birthdays: { pupilId, dayOfMonth, eventDateIso, displayName }[]` в DTO `calendar` — ученики с зачислением в выбранную группу, пересекающим месяц, и непустой `birth_date`; год рождения и возраст не отдаются; ветка `PARENT` возвращает `[]` без запроса `birth_date`; строка дня рождения в ячейке (иконка `Cake` `aria-hidden` + «День рождения: <имя>»), не кликается и не открывает форму события; в мобильном списке — та же строка; `GRADE_EVENT_TYPE` и схема БД не меняются; ключ `calendar.birthday` в ru и en и в срезе
      Paths: H [§5.12: teacher и admin видят дни рождения группы в месяце] · N [§5.12: `birth_date` пустая — нет строки; 29 февраля в невисокосный год → 28; ученик зачислен с середины месяца; переведён в другую группу] · S [§5.12, S-7: `PARENT` не получает `birthdays` (тест загрузчика); teacher — только группа назначения (AZ-43, чужая → прежний 404 / `unassigned`)]

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты `birthday-in-month`, `calendar-birthdays` (teacher / admin / parent)

## Verification (phase)

- [ ] Все CU закоммичены; у каждого trace `Review: …`
- [ ] CU2 раньше CU3; CU6 раньше CU7
- [ ] Phase DoD из [`P24_phase_description.md`](../phases_tasks_descriptions/P24_phase_description.md)
- [x] Docs sync, прототип и parity — подготовительный шаг фазы (до CU1)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P24_phase_description.md`](../phases_tasks_descriptions/P24_phase_description.md) | DoD, smoke, причины багов |
| [`adr_017_shell_container_toast_buttons.md`](../../../prds/07_governance/adr_017_shell_container_toast_buttons.md) | Решение по оболочке, toast, кнопкам |
| [`homework_check_flow_spec.md`](../specs/homework_check_flow_spec.md) | Экран проверки |
| [`school_year_and_groups_contract.md`](../contracts/school_year_and_groups_contract.md) | Дата рождения, дни рождения |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-11-03 | v1.0 — Canonical (подготовка P24): CU1–CU7, Phase DoR audit; документы, прототип и parity обновлены до CU1 |
