# P14 Tasks — Редизайн v2

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-24  
**Волна:** W12-05  
**Зависит от:** [`P14_phase_description.md`](../phases_tasks_descriptions/P14_phase_description.md), [`adr_014_app_redesign_v2.md`](../../../prds/07_governance/adr_014_app_redesign_v2.md), [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md), [`prototype_class_parity_spec.md`](../specs/prototype_class_parity_spec.md), [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) (UX-03 v2.0), [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md) (UX-02 v2.0)  
**Связанные документы:** [`global_shell_spec.md`](../specs/global_shell_spec.md), [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md), [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md), [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md), [`ui_redesign_audit_2026-10-24.md`](../audits/ui_redesign_audit_2026-10-24.md), [`prototype_route_mapping.md`](../../../design/prototype_route_mapping.md)

---

## Purpose

Применить редизайн v2 к `apps/web` по матрице [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md) §3, не меняя поведение, маршруты, права и данные. DoD — [`P14_phase_description.md`](../phases_tasks_descriptions/P14_phase_description.md).

**Порядок.** CU1 (токены, шрифт, скрипт сверки) раньше всего. CU3 (`DateField`, `PageSection`, режимы `SegmentedControl`) раньше CU5, CU6, CU7, CU8. Секция Design Lab добавляется раньше использования компонента на экране (C-2).

**UI-CU (CU2…CU8): UX/UI verification loop** — описание фазы. CU не коммитится без двух строк: `UI-verify: …, расхождений 0, консоль чистая` и `Parity: <N> строк сверено, расхождений 0`.

## Минимизация визуального дрифта (UI-CU: CU2…CU8)

Во время реализации держать минимальный дрейф относительно [`sunday_school_prototype.html`](../../../prototypes/sunday_school_prototype.html) и правил **ui-prototype-fidelity** / **ui-design-system-shadcn**. Прототип обновлён под v2.0 в одном изменении с контрактами; он — эталон классов.

**В конце каждого UI-CU** (перед review и коммитом):

1. Запустить приложение, открыть каждую затронутую страницу и ту же функцию прототипа (`v*` по [`prototype_route_mapping.md`](../../../design/prototype_route_mapping.md)).
2. Сверить **390 px, 768 px, 1024 px, 1280 px**; консоль без `error` и `unhandledrejection`.
3. Выполнить замер [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md) §5.1 на каждой затронутой странице: `html: "18px"`, `smallText: []`, `mainOutline: "none"`, `nativeControls: 0`, `controlHeights ⊂ {41, 45, 50}`.
4. Выполнить протокол [`prototype_class_parity_spec.md`](../specs/prototype_class_parity_spec.md) §4 для каждого изменённого файла из `Files:`: `node scripts/check-prototype-parity.mjs --component <id>` для строк `auto`; строки `manual` — чтением прототипного символа и итоговых классов компонента.
5. Расхождение чинить на всей странице и во всех экранах-потребителях компонента.
6. Trace: `UI-verify: <экраны>, <роли>, <ширины>, расхождений 0, консоль чистая` и `Parity: <N> строк сверено, расхождений 0`.

Для CU1, CU9, CU10 UI-verify не требуется (CU9 — проверка текстов на экранах ссылкой на строки словаря).

## Phase DoR audit (lean: оркестратор inline)

- [x] ADR-014, UX-03 v2.0, UX-02 v2.0, `redesign_v2_ui_spec`, `prototype_class_parity_spec`, аудит существуют — 2026-10-24
- [x] Open questions фазы Q-01 (календарь) и Q-02 (часовые пояса) закрываются внутри CU3 и CU7 как T2-задачи, без блокировки CU1–CU2
- [x] Задачи ниже ссылаются на `§`-якоря, называют Files, Acceptance и Paths

## Commit plan

### P14-CU1 — chore(config): add source sans 3 and 18px base tokens · Review: reviewer · Commit: auto

- [x] P14-T1 · T1 · Spec: [redesign §3.1](../../../design/redesign_v2_ui_spec.md) · ADR: [ADR-014 R-1, R-2, R-6, R-9](../../../prds/07_governance/adr_014_app_redesign_v2.md)
      Files: `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/lib/design-lab/tokens.ts`
      Acceptance: в `layout.tsx` нет `Alegreya_Sans`, есть `Source_Sans_3` (400/500/600/700, `latin` + `cyrillic`, `display: "swap"`, переменная `--font-source-sans`); `--font-body`/`--font-sans` указывают на неё; `html { font-size: 112.5% }`; в `:root` заданы `--control-h`, `--control-h-compact`, `--control-h-touch`; `main:focus:not(:focus-visible) { outline: none }`; `TYPE_SCALE` и `SHAPES` в `tokens.ts` совпадают с UX-03 §6–§7
      Paths: n/a — токены и шрифты без поведения; HTML/CSS-эталон — parity-spec P-37…P-40

- [x] P14-T2 · T1 · Spec: [parity §6](../specs/prototype_class_parity_spec.md)
      Files: `scripts/check-prototype-parity.mjs`, `scripts/prototype-parity.test.mjs`, `package.json` (скрипт `parity:check`; без новых зависимостей)
      Acceptance: скрипт читает блок ` ```json parity ` из parity-spec §7.2, значения констант прототипа и классы компонентов, применяет нормализацию N-1…N-8, печатает `ok | drift | skip` по строкам и итог `Parity: N строк, расхождений M`, exit-код 1 при M > 0; флаги `--component <id>`, `--all`, `--json`; тесты покрывают алиасы N-2, единицы N-3, `cva` N-8 и два реальных случая (BTN, SEG_ON); не пишет файлов
      Paths: H [`--all` на текущем коде выдаёт список расхождений P-01…P-40, до CU2–CU3 расхождения ожидаемы] · N [нет блока JSON; файл компонента не найден; неизвестный `--component`] · S n/a — читает только пути из parity-spec §7.2

**CU DoD:** `typecheck` · `lint` · `test` · `rules:check` · `grep "Alegreya_Sans\|Alegreya Sans" apps/web/src` пуст

### P14-CU2 — feat(ui): unify type scale and control heights in primitives · Review: reviewer · Commit: auto

- [x] P14-T3 · T2 · Spec: [redesign §3.2, §3.6](../../../design/redesign_v2_ui_spec.md) · UX-03: §6, §7, D-9 · ADR: R-3, R-6, R-11
      Files: `apps/web/src/components/ui/button.tsx`, `apps/web/src/components/ui/input.tsx`, `apps/web/src/components/ui/textarea.tsx`, `apps/web/src/components/ui/label.tsx`, `apps/web/src/components/ui/field.tsx`, `apps/web/src/components/ui/select.tsx`, `apps/web/src/components/ui/checkbox.tsx`, `apps/web/src/components/ui/radio-group.tsx`, `apps/web/src/components/ui/table.tsx`, `apps/web/src/components/ui/card.tsx`, `apps/web/src/components/ui/score-pad.tsx`, `apps/web/src/components/ui/score-cell.tsx`, `apps/web/src/components/ui/score-selector.tsx`, `apps/web/src/components/design-lab/**`, `apps/web/src/lib/design-lab/matrices.ts`, `apps/web/src/**/*.tsx`
      Заметка к Files: глоб `apps/web/src/**/*.tsx` нужен только для переименования размеров и вариантов Button у потребителей (размеры sm, lg, nav; вариант destructive-solid вне ConfirmDialog)
      Acceptance: `Button` — база `text-base`, размеры `default` (`h-10 px-3.5`), `compact` (`h-9 px-3`), `touch` (`h-11 px-5`), `icon`, `icon-compact`, `icon-touch`; размеры `sm`, `lg`, `nav` и `icon-sm`/`icon-lg` не используются; `Label`/`FieldLabel` — `text-base font-medium`; `Table` — `text-base`, заголовок колонки `text-sm text-muted-foreground px-3 py-3`, ячейка `px-3 py-3`; `Select` — триггер `w-full h-10 px-3 text-base`, пункт `min-h-10 rounded-lg px-2.5 text-base`, выбранный `bg-cobalt-soft text-cobalt-ink`, панель `rounded-xl`; `Checkbox` `size-5`; `RadioGroup` item `size-5`; `ScorePad`/`ScoreCell`/`ScoreSelector` `text-base`; в Lab обновлены матрицы `Button`, `Select`, `Checkbox`, `Table`, `Typography`
      Paths: H [кнопки, поля, таблицы на экранах получают новый кегль и высоты] · N [`destructive-solid` вне диалога — замена на `destructive`; disabled/invalid без смены размеров] · S n/a — presentational

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify · Parity

### P14-CU3 — feat(ui): add date field, page section and chip modes · Review: reviewer · Commit: auto

- [x] P14-T4 · T2 · Spec: [redesign §3.2, §6 Q-01](../../../design/redesign_v2_ui_spec.md) · UX-06: F13 · ADR: R-4, R-5, R-7
      Files: `apps/web/src/components/ui/date-field.tsx`, `apps/web/src/components/ui/page-section.tsx`, `apps/web/src/components/ui/segmented-control.tsx`, `apps/web/src/components/ui/segmented-control.test.tsx`, `apps/web/src/components/ui/date-field.test.tsx`, `apps/web/src/components/design-lab/**`, `apps/web/src/lib/design-lab/matrices.ts`, `apps/web/package.json`, `package-lock.json`
      Acceptance: `DateField` принимает `value` ISO `YYYY-MM-DD`, `onChange(iso)`, `min`, `max`, `name`, `invalid`, `disabled`; отображение и ввод в формате локали из `lib/i18n/format.ts`; календарь на `Popover` (Base UI), сетка месяца загружается через `next/dynamic`; скрытый input с ISO для form-submit; неверная дата (`31.02.2027`) — `aria-invalid`, значение не теряется; `PageSection` — `width="full" | "wide" | "form"` → `""` / `max-w-5xl` / `max-w-3xl`, без `mx-auto`; `SegmentedControl` — `mode="radio"` (как сейчас) и `mode="toggle"` (`aria-pressed`), `size="default" | "compact"`, `h-10` / `h-9`, `text-base`, невыбранный `hover:border-ink-2`; при добавлении календарной библиотеки версия сверена `npm view`, закреплена без `^`, `npm run deps:check` зелёный; секции Lab `DateField`, `SegmentedControl`, `PageSection` добавлены до CU5–CU8
      Paths: H [ввод и выбор даты, переключение чипов `toggle`, `PageSection` на трёх ширинах] · N [неверная дата, `min`/`max`, disabled, пустое значение] · S n/a — presentational

**CU DoD:** `typecheck` · `lint` · `test` · `deps:check` · UI-verify · Parity

### P14-CU4 — feat(web): replace top navigation with sidebar · Review: reviewer · Commit: auto

Tier T3 по триггеру S: переключатель роли (ОК-5) переезжает в меню пользователя; отдельный CU.

- [x] P14-T5 · T3 · Contract: [UX-02 v2.0 §3–§6](../../../design/responsive_navigation_contract.md) · Spec: [global_shell §4, §6.1, §6.3, §8](../specs/global_shell_spec.md) · ADR: R-8, R-9
      Files: `apps/web/src/components/shell/sidebar-nav.tsx`, `apps/web/src/components/shell/nav-link-row.tsx`, `apps/web/src/components/shell/nav-drawer.tsx`, `apps/web/src/components/shell/app-shell.tsx`, `apps/web/src/components/shell/shell-header.client.tsx`, `apps/web/src/components/shell/user-menu.tsx`, `apps/web/src/components/shell/dev-role-switcher.tsx`, `apps/web/src/components/shell/nav-badge.tsx`, `apps/web/src/components/shell/shell-navigation.client.tsx`, `apps/web/src/components/shell/top-nav.tsx`, `apps/web/src/lib/shell/nav-chrome-classes.ts`, `apps/web/src/lib/shell/nav-chrome-classes.test.ts`, `apps/web/src/components/shell/nav-link-row.test.tsx`, `apps/web/src/components/design-lab/**`, `apps/web/src/lib/design-lab/matrices.ts`, `apps/web/src/lib/messages/**`
      Acceptance: на `lg+` — сайдбар `w-64` слева с плоскими группами и всеми пунктами (без `aria-expanded` у пунктов); `< lg` — drawer как раньше; `top-nav.tsx` и `shellTopNavTriggerClass`/`SHELL_TOPNAV_TRIGGER` удалены, `Button size="nav"` не используется; сайдбар и drawer читают один `nav-config.ts`; `aria-current="page"` ровно у одного пункта (по `NAV_ALIAS`); бейдж у «Люди» и пунктов; шапка без навигации, бренд над сайдбаром; «Смотреть как» — группа в меню пользователя, только при `APP_ENV=dev`, в prod-бандле строки `dev-role-switcher` нет; выбор роли меняет только набор пунктов, права на сервере прежние; `main` без рамки фокуса после перехода; секция Lab `SidebarNav`
      Paths: H [admin на 1280: сайдбар, переход по пункту, бейдж; 1023→1024 переключение без перезагрузки] · N [пустые бейджи; длинная подпись переносится; JS не загрузился — ссылки сайдбара работают] · S [UX-02 §8 S: пункт, недоступный роли, не в DOM; ОК-5: переключатель отсутствует в prod; роль «смотреть как» не повышает права]

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify · Parity · prod-проверка бандла (`dev-role-switcher` отсутствует)

### P14-CU5 — feat(web): apply page container widths and form layouts · Review: reviewer · Commit: auto

Начинается после CU3 и CU4.

- [x] P14-T6 · T2 · Spec: [redesign §3.4](../../../design/redesign_v2_ui_spec.md) · UX-03: §7 · UX-06: F14 · ADR: R-4, R-11
      Files: `apps/web/src/app/(app)/groups/page.tsx`, `apps/web/src/app/(app)/groups/[groupId]/page.tsx`, `apps/web/src/app/(app)/year/page.tsx`, `apps/web/src/app/(app)/settings/page.tsx`, `apps/web/src/app/(app)/achievements/page.tsx`, `apps/web/src/app/(app)/users/page.tsx`, `apps/web/src/app/(app)/school/page.tsx`, `apps/web/src/app/profile/page.tsx`, `apps/web/src/components/admin/**`, `apps/web/src/components/analytics/SchoolPageContent.server.tsx`, `apps/web/src/components/analytics/SchoolGroupsTable.tsx`, `apps/web/src/components/analytics/SchoolGroupCards.tsx`, `apps/web/src/components/achievements/**`, `apps/web/src/components/**/profile/**`
      Acceptance: страницы используют `PageSection` (ширины по таблице §3.4); нет `max-w-*` и `mx-auto` на уровне страницы; кнопки отправки в карточках `w-auto` (на 390 px допустим `w-full`); `/groups/[groupId]` без вложенной карточки в карточке; «Добавить учителя»: поле и «Назначить» одной высоты в одну строку; `/year` — «Закрыть год» `variant="destructive"`; `/groups` — колонки ряда выровнены (`grid-cols-[minmax(0,1fr)_auto_auto]`), язык-бейдж в колонке названия; `/users` — полоса вкладок без вертикального скролла; `/school` — структура видна сразу, тяжёлые секции за `<Suspense>`, таблица групп по §3.4
      Paths: H [каждая страница открывается в своей ширине; кнопка «Сохранить» по размеру содержимого] · N [пустой список групп; нет активного года (D1) — баннер и страница на тех же ширинах; ошибка запроса секции `/school` — `error.tsx` секции, страница стоит] · S n/a — presentational; серверные проверки и guard-ы страниц не меняются
      UI-verify: localhost — `/groups`, `/groups/[id]`, `/year`, `/settings`, `/users`, `/school`, `/achievements`, `/profile`; роли **admin** и **teacher**; 390 / 768 / 1024 / 1280; §5.1: `html` 18px, `smallText` [], `mainOutline` none, без page scroll; `/users` вкладки без vertical overflow; расхождений 0, консоль чистая (dev pg SSL warning)
      Parity: `PageSection` §3.4 (manual) + `PageHeader` P-30 на 8 экранах — 9 строк сверено, расхождений 0

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify · Parity

### P14-CU6 — refactor(web): replace native selects with ui select · Review: reviewer · Commit: auto

Начинается после CU3.

- [x] P14-T7 · T2 · Spec: [redesign §3.7](../../../design/redesign_v2_ui_spec.md) · UX-06: F13 · ADR: R-7
      Files: `apps/web/src/components/admin/AuditFilterBar.tsx`, `apps/web/src/components/teacher/LessonForm.tsx`, `apps/web/src/components/achievements/ManualAwardDialogForm.client.tsx`, `apps/web/src/components/achievements/IssuePenaltyDialog.client.tsx`, `apps/web/src/components/teacher/VersePicker.tsx`, `apps/web/src/components/teacher/RosterTable.tsx`, `apps/web/src/components/teacher/LessonsGradeFilter.tsx`, `apps/web/src/components/teacher/CalendarEventForm.tsx`, `apps/web/src/components/admin/GroupSettingsForm.tsx`, `apps/web/src/lib/achievements/manual-award-types.ts`, `apps/web/src/**/*.tsx`
      Заметка к Files: глоб покрывает остальные места, найденные поиском нативных select в apps/web/src; конкретные файлы перечисляются в теле коммита
      Acceptance: `grep -rn "<select" apps/web/src` пуст; серверные формы отправляют то же значение под тем же `name`; `manualAwardSelectClass` удалён; `Select` с тем же набором опций и `defaultValue`; тесты форм (если есть) проходят без правок серверной части; в UI соседние контролы одной высоты
      Paths: H [выбор в фильтре и в форме сохраняется и отправляется] · N [пустой список опций — отключённый `Select` с подсказкой; значение по умолчанию отсутствует — placeholder] · S n/a — presentational; Zod-валидация сервера без изменений
      UI-verify: localhost — admin: `/school`, `/groups/[id]` (2× FormSelect, h-45), `/achievements` (диалог «Достижение», 1× FormSelect); teacher: `/lessons`, `/verses` (список без триггеров до контекста урока — FormSelect в формах по Files); 1280 + выборочно 390; `grep "<select" apps/web/src` пуст; §5.1 на `/school` и `/groups/[id]`: html 18px, smallText [], mainOutline none, nativeSelect 0; расхождений 0, консоль чистая (dev pg SSL warning; `/audit` error boundary — вне CU6)
      Parity: `FormSelect` → `Select` P-11 (auto, N-5) + P-12 panel/item (manual) — 2 строки сверено, расхождений 0

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify · Parity

### P14-CU7 — refactor(web): replace native checkboxes and date inputs · Review: reviewer · Commit: auto

Начинается после CU3.

- [x] P14-T8 · T2 · Spec: [redesign §3.7, §3.4 `/settings`](../../../design/redesign_v2_ui_spec.md) · UX-06: F13 · ADR: R-7
      Files: `apps/web/src/components/admin/RoleSelector.tsx`, `apps/web/src/components/teacher/RosterTable.tsx`, `apps/web/src/components/teacher/PupilCardForm.tsx`, `apps/web/src/components/admin/GroupSettingsForm.tsx`, `apps/web/src/components/achievements/ManualAwardEvidencePicker.client.tsx`, `apps/web/src/components/analytics/AnalyticsPeriodFilter.tsx`, `apps/web/src/components/admin/CreateYearForm.client.tsx`, `apps/web/src/components/admin/AuditFilterBar.tsx`, `apps/web/src/components/teacher/LessonForm.tsx`, `apps/web/src/components/teacher/CalendarEventForm.tsx`, `apps/web/src/components/bricks/**`, `apps/web/src/components/people/**`, `apps/web/src/app/(app)/settings/page.tsx`, `apps/web/src/**/*.tsx`
      Заметка к Files: глоб покрывает остальные места, найденные поиском нативных checkbox и date в apps/web/src; конкретные файлы перечисляются в теле коммита
      Acceptance: `grep -rnE 'type="(checkbox|date)"' apps/web/src` пуст; `Checkbox` отправляет значения как раньше (`name`, `value`); `DateField` отправляет ISO `YYYY-MM-DD`; часовой пояс в `/settings` — выбор через поисковый `Select`/`Combobox` (Q-02 закрыт записью в [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md) §6); формат даты в интерфейсе из `lib/i18n/format.ts`
      Paths: H [отметка роли/группы; ввод даты урока и года] · N [неверная дата; `min`/`max` года (INV-02); снятая последняя роль] · S [`RoleSelector`: набор ролей отправляется как раньше, сервер проверяет права (AZ-D3); UI не расширяет доступные роли]
      UI-verify: localhost — admin: `/users` (RoleSelector FormCheckbox), `/year` (CreateYearForm FormDateField), `/groups/[id]` (GroupSettingsForm), `/audit` (AuditFilterBar даты), `/settings` (TimezonePicker Select); teacher: `/lessons/new`, `/calendar` (CalendarEventForm), roster FormCheckbox на `/groups/[id]`; 1280 + выборочно 390; `grep -rnE 'type="(checkbox|date)"' apps/web/src` пуст; §5.1 на `/year` и `/lessons/new`: html 18px, smallText [], mainOutline none, nativeCheckbox 0, nativeDate 0; расхождений 0, консоль чистая (dev pg SSL warning; `type="month"` только в AnalyticsPeriodFilter — вне CU7 grep)
      Parity: `FormCheckbox` → `Checkbox` P-14 (manual) + `FormDateField` → `DateField` P-15 (manual, N-5) — 2 строки сверено, расхождений 0

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify · Parity

### P14-CU8 — feat(web): redesign analytics chips kpi and rating · Review: reviewer · Commit: auto

Начинается после CU5, CU6, CU7.

- [x] P14-T9 · T2 · Spec: [redesign §3.5, §3.4 `/rating`, `/calendar`, `/verses`](../../../design/redesign_v2_ui_spec.md) · Spec: [analytics v1.5 §4.1, §6.5](../specs/analytics_screens_spec.md) · ADR: R-5, R-10, R-12
      Files: `apps/web/src/components/analytics/AnalyticsGradeChips.tsx`, `apps/web/src/components/analytics/AnalyticsPeriodChips.tsx`, `apps/web/src/components/analytics/years/YearStrip.tsx`, `apps/web/src/components/analytics/AnalyticsPeriodKpiSection.tsx`, `apps/web/src/components/analytics/PupilAnalyticsKpiSection.tsx`, `apps/web/src/components/analytics/RatingTable.tsx`, `apps/web/src/components/analytics/RatingPageContent.server.tsx`, `apps/web/src/components/analytics/GroupAnalyticsTables.tsx`, `apps/web/src/components/analytics/ConductedLessonsTable.tsx`, `apps/web/src/components/analytics/SchoolGroupsTable.tsx`, `apps/web/src/components/analytics/years/**`, `apps/web/src/components/teacher/CalendarMonth.tsx`, `apps/web/src/components/teacher/VersePicker.tsx`, `apps/web/src/app/(app)/verses/page.tsx`
      Acceptance: чипы группы, периода, года — `SegmentedControl`, выбранный `bg-cobalt-soft`; KPI — главная метрика крупнее (`NumberDisplay size="kpi"`, `lg:col-span-2`), прочие стандартные; тело карточки аналитики `text-[1.25rem]`, мета `text-base`; рейтинг — место одного кегля во всех строках, фиксированная высота строки, имя `text-ink font-medium hover:text-cobalt-ink focus-visible:text-cobalt-ink`; календарь — число дня `text-ink`, сегодня `bg-ink text-surface`; `/verses` — ссылки «Урок N» `text-ink hover:text-cobalt-ink`; ячейки таблиц аналитики `text-base`, подписи динамики `text-sm`
      Paths: H [выбор года/периода/группы; рейтинг читается; календарь переключает месяц] · N [пустая выборка (N < 10) — состояния D19–D21 без изменений; закрытый год — только чтение] · S n/a — presentational; видимость годов и групп (AZ-44…AZ-50) на сервере не меняется
      UI-verify: localhost — admin+teacher: `/analytics`, `/analytics/years`, `/rating`, `/calendar`, `/verses`; 1280 + выборочно 390; чипы `SegmentedControl`/`SegmentedControlLinks`, KPI `NumberDisplay size="kpi"`, рейтинг `h-14`/`text-lg` место, календарь сегодня `bg-ink text-surface`; §5.1 на `/analytics` и `/rating`: html 18px, smallText [], mainOutline none; расхождений 0, консоль чистая (dev pg SSL warning)
      Parity: P-14…P-16 (auto) + P-33 chips (manual) + P-34 rating (manual) + P-35 calendar (manual) — 6 строк сверено, расхождений 0

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify · Parity

### P14-CU9 — fix(i18n): correct audit copy and plural forms · Review: diff-only · Commit: auto

- [x] P14-T10 · T1 · Spec: [redesign §3.8](../../../design/redesign_v2_ui_spec.md) · UX-06: F3 · ADR: [ADR-008](../../../prds/07_governance/adr_008_i18n_ru_en_dictionary_slices.md)
      Files: `apps/web/src/lib/messages/ru.ts`, `apps/web/src/lib/messages/en.ts`, `apps/web/src/lib/i18n/format.ts`, `apps/web/src/lib/i18n/format.test.ts`, `apps/web/src/components/analytics/SchoolAttentionList.tsx`, `apps/web/src/components/admin/**`, `apps/web/src/components/analytics/PupilAnalyticsPageContent.server.tsx`
      Acceptance: «Выключено с …» не выводит литеральное многоточие (дата или формулировка без неё); «N пользователей ждут роль» склоняется (`plural`); «Не всё 10/30» → «Проверено 10 из 30»; пустое имя в `/users` → «Без имени»; предупреждение «Ребёнок без семьи» — `StatusText kind="warn"` (иконка + текст); новые ключи есть в `ru.ts` и `en.ts`; клиентский бандл не получает полный словарь (ADR-008)
      Paths: n/a — copy и форматирование; регрессия plural — тест `format.test.ts` на 1, 2, 5, 11, 21

**CU DoD:** `typecheck` · `lint` · `test`

### P14-CU10 — docs(docs): sync p14 contracts and record measurements · Review: diff-only · Commit: auto

- [ ] P14-T11 · T0 · Spec: [redesign §5](../../../design/redesign_v2_ui_spec.md) · Audit: [ui_redesign_audit §5](../audits/ui_redesign_audit_2026-10-24.md) · Registry: [wave W12](../../../meta/documentation_creation_registry.md)
      Files: `docs/implementation/mvp/audits/ui_redesign_audit_2026-10-24.md`, `docs/implementation/mvp/README.md`, `docs/implementation/mvp/tasks/P14_tasks.md`, `docs/implementation/mvp/phases_tasks_descriptions/P14_phase_description.md`, `docs/design/prototype_route_mapping.md`, `docs/prds/architecture_master_index.md`, `AGENTS.md`, `.cursor/rules/project-context.mdc`, `.claude/rules/project-context.md`
      Acceptance: повторный замер §5.1 по 13 экранам записан в таблицу аудита §5 (`html: 18px`, `smallText: []`, `mainOutline: none`, `nativeControls: 0`, высоты контролов из D-9, число ширин контента 3: `full`, `wide`, `form`); `grep -rnE "top-nav|shellTopNavTriggerClass|<select|type=\"(checkbox|date)\"|Alegreya_Sans" apps/web/src` пуст; строки статуса фазы обновлены (P14 завершена); smoke H/N/S записан ниже; `.claude/rules/project-context.md` получен через `npm run rules:sync`, не вручную
      Paths: n/a — docs-only

**Smoke report:** заполняется при закрытии фазы (H — admin на 1280, teacher на 390; N — неверная дата, пустой список, JS отключён; S — prod-бандл без `dev-role-switcher`, пункт, недоступный роли, не в DOM).

**CU DoD:** `encoding:check` · `docs:links` · `typecheck` · `lint` · `rules:check`

## Verification (phase)

- [ ] Все CU закоммичены; у CU1…CU9 trace `Review: …`; у CU2…CU8 trace `UI-verify: …, расхождений 0, консоль чистая` и `Parity: …, расхождений 0`
- [ ] CU1 раньше остальных; CU3 раньше CU5…CU8
- [ ] Phase DoD из [`P14_phase_description.md`](../phases_tasks_descriptions/P14_phase_description.md)
- [ ] Docs sync — в CU10

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P14_phase_description.md`](../phases_tasks_descriptions/P14_phase_description.md) | DoD, UI-verify, smoke |
| [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md) | Что менять |
| [`prototype_class_parity_spec.md`](../specs/prototype_class_parity_spec.md) | Сверка классов |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-10-24 | v1.0 — Canonical (W12-05): CU1–CU10; CU3 (примитивы) раньше экранных CU; UI-verify и Parity для CU2…CU8 |
