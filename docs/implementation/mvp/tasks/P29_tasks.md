# P29 Tasks — адаптивность, интервалы, высота полей и понятность (четвёртый аудит)

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.1  
**Дата:** 2026-11-13  
**Волна:** P29  
**Зависит от:** [`P29_phase_description.md`](../phases_tasks_descriptions/P29_phase_description.md), [`adr_022_responsive_shell_spacing_and_density.md`](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md), [`usability_audit_2026-11-13_p28.md`](../../../reports/usability_audit_2026-11-13_p28.md) (версия 2), [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) v2.6, [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md) v2.6 §5.3а, [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md), [`global_shell_spec.md`](../specs/global_shell_spec.md), [`ui_states_contract.md`](../../../design/ui_states_contract.md)  
**Связанные документы:** [`adr_017_shell_container_toast_buttons.md`](../../../prds/07_governance/adr_017_shell_container_toast_buttons.md), [`adr_020_term_hints_everywhere_and_audit_polish.md`](../../../prds/07_governance/adr_020_term_hints_everywhere_and_audit_polish.md), [`copy_and_messages.md`](../../../guidelines/react/copy_and_messages.md), [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md), [`homework_check_flow_spec.md`](../specs/homework_check_flow_spec.md), [`prototype_class_parity_spec.md`](../specs/prototype_class_parity_spec.md), [`P27_tasks.md`](./P27_tasks.md)

---

## Purpose

Исправить дефекты вёрстки, интервалов, высоты полей, «воздуха» и понятности, найденные четвёртым аудитом (версия 2). DoD — [`P29_phase_description.md`](../phases_tasks_descriptions/P29_phase_description.md). Имена файлов в `Files:` — по разведке 2026-11-13; при расхождении исполнитель уточняет по факту и записывает в Change log. Номер P28 в этой фазе не используется, документы P28 не менялись.

**Порядок.** CU1 → CU2 → CU3 → … → CU13; **CU2 до CU4** (D-23 использует высоты полей). T3 нет: права, auth и policy не затрагиваются; если исполнитель встречает такой путь (например, U-11 требует менять `lib/auth/**` или форму сессии) — остановиться и вынести в отдельный CU (T3). Документы, ADR-022, UX-03 v2.6, Lab v2.6, правила и HTML-прототип обновлены в подготовительном шаге, до CU1, вне commit units.

**Профиль качества — `lean` (D6).** `reviewer` — CU1 (явный выбор плана: серверное чтение cookie, раскладка оболочки) и CU2 (общие примитивы и ESLint-правило, затрагивают весь UI); остальные CU — `diff-only` (presentational, без логики и sensitive zones).

**Единицы.** Корень 18 px; «40,5» = `h-9`, «36» = `h-8`; допуск замеров ±1 px. Метод замера — phase description § Метод замера.

## Phase DoR audit (architect spec-gap, 2026-11-13)

- [x] ADR-022; UX-03 v2.6 (D-9, D-14, D-19, §7, §7а); Lab v2.6 §5.3а; UX-02 / global shell (граница `xl`); правила UI — существуют — 2026-11-13 · подготовка P29
- [x] Задачи ниже ссылаются на `§`-якоря, называют Files, Acceptance (измеримый) и Paths; CU ≤ ~400 строк
- [x] `Проверено по`: Tailwind v4 `--spacing-*` в `@theme` (по UX-03 v2.5); Next.js `16.4.4`; новых зависимостей нет; Context7 не вызывался
- [x] Open questions (закрыты умолчаниями владельцем 2026-11-13): Q-1 (значения токенов), Q-2 (порог проверки ДЗ), Q-3 (40,5 / 36), Q-5 (охват ESLint) — предложения по умолчанию в phase description; Q-4, Q-6 не блокируют (список блокирующих — в конце выполнения подготовки)
- [x] Прототип обновлён (см. Change log)
- [x] Phase DoR audit (architect, 2026-11-13, профиль `lean`): DoR 1–6 по T1–T51; трассировка — 49 дефектов + 2 инфра-строки, каждый номер ровно один раз; `Files` сверены с `apps/web/src` (исправлены T2–T4, T10, T12, T15, T19, T21, T22, T24, T31, T35, T41–T43, T45, T48; новые файлы помечены «новый»); ссылки `§` исправлены (T6 → check flow §5.1 v1.11, T8 → change log §6, T47 → global shell §4 / UX-02 §4, T50 → global shell §6.3); T13 согласована с T39 и ADR-022 §4.7 п. 1; T50 (U-11) — S-триггера нет (имя уже приходит в шапку пропом `displayName`), T1; расхождения ниже по приоритету исправлены: check flow v1.11 (`xl`), UX-06 F9 (`h-9`/`h-8`), global shell §4 и R-11 (`lg:w-16 xl:w-64`, `px-page`), Lab §5.3 (`compact` = `h-8`), parity P-24 (manual). T3-задач нет. Остаются открытыми Q-1, Q-2, Q-3, Q-5 (решения по умолчанию заданы; подтверждает владелец до CU2 / CU3)

## Commit plan

### P29-CU1 — fix(web): show expanded sidebar only from xl and default to rail on lg · Review: reviewer · Commit: auto

Tier T1: оболочка и серверное чтение cookie; закрывает R-1. `reviewer` — явный выбор плана (чтение cookie, SSR-раскладка), `Paths: H/N`.

- [x] P29-T1 · T1 · Spec: [ADR-022 §4.1](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [UX-02 §3–§4](../../../design/responsive_navigation_contract.md) · [global_shell_spec §6.1а, R-9, R-11](../specs/global_shell_spec.md) · Prototype: `#shellGrid`, `RAIL_KEY`
      Files: `apps/web/src/components/shell/{app-shell,shell-sidebar-toggle.client,shell-header.client,sidebar-nav}.tsx` (+ тесты `app-shell.test.tsx`, `shell-header.client.test.ts`), `apps/web/src/app/(app)/layout.tsx`, `apps/web/src/app/profile/layout.tsx` (тоже читает cookie), `apps/web/src/lib/shell/sidebar-collapsed-cookie.ts` (чтение: `0` / `1` / нет значения → «нет выбора»; повреждённое → «нет выбора»)
      Acceptance: **R-1:** первый HTML без cookie: колонка сайдбара `lg:w-16 xl:w-64` или эквивалент на сетке `app-shell` (`lg:grid-cols-[4rem_…] xl:grid-cols-[16rem_…]`; `data-rail` — третье значение «нет выбора», см. parity P-24) — rail на 1024–1279, развёрнут с ≥ 1280; cookie `sidebar_collapsed=0` на `lg` → развёрнут, `=1` на `xl+` → rail (cookie приоритетнее умолчания); drawer на `< lg` без изменений; под контентом на 1024 px (rail) ≥ 900 px — замер; кнопка сворачивания на `lg` отражает фактическое состояние (`aria-expanded`); на `lg` в rail подписи пунктов — tooltip и `aria-label`; нет мигания ширины (раскладка из CSS-классов и cookie, без чтения ширины окна на сервере)
      Paths: H [1024 px: rail и ≥ 900 px под контентом; 1280 px: развёрнут; явный выбор переживает перезагрузку] · N [cookie нет / повреждена → умолчание по ширине; `prefers-reduced-motion` → без анимации ширины; длинная подпись пункта в rail → только tooltip] · S n/a — UI-предпочтение без ПД, права и набор пунктов не меняются

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты `app-shell` (cookie × ширина → классы), `shell-header` · секция Lab `SidebarNav` («rail по умолчанию на `lg`») · `npm run parity:check` не хуже базовых

### P29-CU2 — feat(ui): add spacing tokens, spacing lint rule and field heights 40.5/36 · Review: reviewer · Commit: auto

Tier T1: общие примитивы (`Input`, `Select`, `DateField`, `Button`) и tooling; `reviewer` — явный выбор плана (затрагивает все экраны). Токены — **до** любого экрана.

- [x] P29-T2 · T1 · Spec: [ADR-022 §4.2](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [UX-03 §7а](../../../design/visual_identity_contract.md) · [Lab §5.3а «Spacing scale»](../specs/design_system_lab_spec.md)
      Files: `apps/web/src/app/globals.css` (`--space-*` в `:root`, `--spacing-*` в `@theme inline`), `apps/web/src/lib/design-lab/{tokens,sections}.ts`, `apps/web/src/components/design-lab/SpacingScale.tsx` (новый), `apps/web/src/components/shell/app-shell.tsx` (контейнер `px-page`)
      Acceptance: токены `--space-hint|label|chip|stack|card|section|page-x` заданы по ADR §4.2 (rem; `card`/`section`/`page-x` с `md`/`lg` значениями); утилиты `gap-chip`, `gap-stack`, `p-card`, `py-section`, `px-page`, `mb-label` собираются; контейнер оболочки использует `px-page`; секция Lab «Spacing scale» показывает плашки (rem и px) и антипример; тест `tokens` (все 7 токенов заданы)
      Paths: H [Lab показывает шкалу; утилиты работают] · N [токен без маппинга → тест падает] · S n/a — presentational

- [x] P29-T3 · T1 · Spec: [ADR-022 §4.2 (ESLint)](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [UX-03 §10](../../../design/visual_identity_contract.md)
      Files: `eslint.config.mjs` (корень монорепо — единственный конфиг; новый блок `NO_RAW_SPACING` через встроенный `no-restricted-syntax`, как `NO_RAW_COLOR`, без плагина — решение P5-CU8 и ADR-022 §4.2), `apps/web/eslint-spacing-baseline.json` (новый; список файлов передаётся в `ignores` этого блока), тест правила (новый, ESLint `Linter` API; место — по `vitest` include, имя — по факту)
      Acceptance: правило запрещает в `apps/web/src/components/**`, `app/**` (кроме `components/ui/**`, `components/design-lab/**`) утилиты `gap*-`, `space-x/y-`, `p/px/py/pt/pb/pl/pr-` с числом из шкалы Tailwind; токены, `0`, `px`, `auto` допустимы; файлы вне задач фазы — в `eslint-spacing-baseline.json` (правило их не проверяет; каждый CU фазы удаляет из baseline файлы, которые правит); тест правила: плохой пример (`gap-1.5`) → ошибка, токен → ок, файл из baseline → ок
      Отсрочка CU1/CU2 (2026-11-13): файлы оболочки (`shell/*`), `GroupPointsRow`, `TeacherAssignmentList`, `RosterTable` правились в CU1/CU2 только ради раскладки сайдбара и высоты кнопки; сырые `px-3 py-1.5`/`gap-2.5` в них совпадают с прототипом и остаются в baseline до CU10 (T32) / отдельного прохода по оболочке — файл вычищается из baseline тем CU, который переводит его на токены.
      Paths: H [`gap-chip` проходит, `gap-1.5` падает] · N [`cn()` / `cva()` / шаблонные строки с утилитой — ловятся; динамические классы — игнор, с комментарием в правиле] · S n/a — tooling

- [x] P29-T4 · T1 · **D-28** · Spec: [ADR-022 §4.3](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [UX-03 D-9, D-14, §8](../../../design/visual_identity_contract.md) · [Lab «Field heights»](../specs/design_system_lab_spec.md) · Prototype: `FIELD`, фильтры
      Files: `apps/web/src/components/ui/{input,select,date-field,date-field-calendar.client,form-select,form-date-field,field,label,button,textarea}.tsx` (+ `button.test.tsx`, `date-field.test.tsx`, `form-select.test.tsx`), `apps/web/src/app/globals.css` (`--control-h` 2.25rem, `--control-h-compact` 2rem), `apps/web/src/components/design-lab/FieldHeights.tsx` (новый), потребители `size="field"` (поиск `grep -rn 'size="field"' apps/web/src`), `docs/implementation/mvp/specs/prototype_class_parity_spec.md` (строки P-10 `FIELD`, P-11 `SEL` и их JSON `expect`: `h-10` → `h-9` — в этом же CU, вместе с кодом, иначе `parity:check` падает)
      Acceptance: поле/`Select`/`DateField` — `h-9` (40,5 ±1), проп `size="compact"` — `h-8` (36 ±1); `Button` без размера `field`: кнопка рядом с полем получает высоту поля (`h-9` или `h-8` в компактном ряду); потребители `size="field"` переведены, grep пуст; `Label` — `min-h-5`, значок «?» не меняет высоту подписи (ряд подписей со значком и без — поля на одной линии ±1 px — замер в Lab); `touch` `h-11` не меняется; секция Lab «Field heights» (две высоты, ряд фильтров, ряд подписей, 390 px)
      Paths: H [поле 40,5; компактное 36; кнопка той же высоты] · N [`size` не указан → 40,5; `invalid` / `disabled` — высота не меняется; `DateField` с иконкой — высота равна `Input`] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты `tokens`, правило `no-raw-spacing`, `button`, `date-field`, `form-select` · секции Lab «Spacing scale», «Field heights» · `grep -rn 'size="field"' apps/web/src` пуст · `npm run parity:check` (строки `FIELD` / `BTN` обновлены вместе с прототипом)

### P29-CU3 — fix(web): keep wide content inside wrapper on grades table and homework check · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (presentational; мутации и права не меняются).

- [x] P29-T5 · T1 · **D-01** · Spec: [ADR-022 §4.5 п. 1–2](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [check flow R-18, R-19](../specs/homework_check_flow_spec.md) · Prototype: `vLessonTable`
      Files: `apps/web/src/components/teacher/{LessonTableContent.server,LessonCheckTable,LessonCheckTableFilters,LessonTableFinishCheck,LessonTableFinishCheckButton}.tsx`, `apps/web/src/app/(app)/lessons/[lessonId]/table/page.tsx` (имена — по факту), `apps/web/src/components/patterns/PageHeader.tsx` (панель действий), тесты
      Acceptance: на 768 / 1024 / 1440 `scrollWidth` страницы == `innerWidth`; широкая таблица в обёртке `overflow-x-auto min-w-0`, у flex-родителей `min-w-0`; заголовок «Таблица всех оценок» и строка «Урок 5 · 4 октября» не ломаются в столбик (заголовок `basis-full`, панель «Завершить проверку» — отдельной строкой под ним, пока ширина контента < 960 px); на 360 таблица читаема (прокрутка внутри обёртки)
      Paths: H [768–1440 без скролла страницы; панель действий не сжимает заголовок] · N [очень длинная тема урока → перенос; 0 учеников → пустое состояние ≤ 24 px; нет оценок → «—»] · S n/a — presentational

- [x] P29-T6 · T1 · **D-02** · Spec: [ADR-022 §4.5 п. 4–5](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [check flow §5.1 (v1.11: две колонки с `xl`), §5.2а](../specs/homework_check_flow_spec.md) · Prototype: `vCheck` (390, 1024)
      Files: `apps/web/src/components/teacher/{LessonCheckPageContent.server,CheckEntryPageContent.server,check-screen.client,CheckPupilList,CheckScaleField,CheckScoresSection,CheckCard,CheckBottomBar}.tsx`, `apps/web/src/components/ui/{score-selector,score-pad,segmented-control}.tsx` (имена — по факту), тесты
      Acceptance: двухколоночный режим (список + карточка ученика) — с `xl` (≥ 1280; Q-2); на 1024 — одна колонка, список учеников — раскрывающийся блок; шкала «Тест 0–8» — `SegmentedControl` `h-9 min-w-9` с переносом на 2 ряда (0–4, 5–8) на ширинах < `xl`, кнопка ≥ 36 px; кнопки «Таблица всех оценок» и «Печатная ведомость» не сжимают заголовок «Проверка ДЗ» (заголовок в одну строку на 1024)
      Paths: H [1024: одна колонка, шкала теста нажимаема; `xl`: две колонки] · N [тест 0 баллов / 10 баллов → шкала не ломается; клавиши ←/→ работают, как раньше; длинное имя → перенос] · S n/a — presentational; запись оценок не меняется

- [x] P29-T7 · T1 · **D-03** · Spec: [ADR-022 §4.5 п. 4](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [check flow §5.2а](../specs/homework_check_flow_spec.md)
      Files: `apps/web/src/components/teacher/{CheckCardHeader,CheckProgress,CheckPupilList,check-screen.client}.tsx`, `apps/web/src/components/patterns/CheckCardHeader.tsx`, тесты
      Acceptance: 360–768: имя ученика — первая строка карточки на всю ширину, **без `truncate`** (перенос по словам); «15 баллов · Заполнено полей: 5 из 5» — отдельной строкой; зазор между строками списка в раскрывающемся блоке «Ученики · N из M» ≥ 8 px (`gap-chip`)
      Paths: H [имя «Борисова По…» показывается целиком] · N [имя из 40 знаков → перенос по словам, страница не шире окна; 0 заполненных полей → «0 из N»] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `LessonCheckTable`, `CheckCard`, `CheckPupilList`, `check-screen` · замер `scrollWidth` на 360 / 768 / 1024 / 1440 для `/lessons/[id]/table` и `/check` · файлы CU удалены из baseline ESLint

### P29-CU4 — fix(web): fit audit log table without scroll and put its filters on a 12-column grid · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (отображение; права и данные журнала не меняются — только вёрстка).

- [x] P29-T8 · T1 · **D-22** · Spec: [ADR-022 §4.5 п. 1, 3](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [change log §6 «Чтение»](../contracts/change_log_contract.md) (состав и права не меняются) · Prototype: `vAudit`
      Files: `apps/web/src/components/admin/{AuditTable,AuditEntryRow,AuditEntryCard,AuditTechnicalRecord,AuditPageContent.server}.tsx`, `apps/web/src/components/ui/table.tsx` (при необходимости), тесты
      Acceptance: на ≥ 1280 у обёртки журнала `scrollWidth <= clientWidth` (1440 и 1024 + rail: нет внутреннего скролла от `xl`); `table-layout: fixed`, доли колонок Когда 14 % · Кто 18 % · Действие 20 % · Сущность 24 % · Детали 24 %, перенос по словам; ниже `lg` — карточки (`AuditEntryCard`), на `lg` — таблица в обёртке `overflow-x-auto`; «Техническая запись» — `whitespace-pre-wrap break-all`, `max-h` с прокруткой по Y, без прокрутки по X; высота строки — по содержимому (без резерва под disclosure)
      Paths: H [1440: колонка «Детали» видна целиком; 390: карточки] · N [длинный JSON и длинное значение без пробелов → перенос; пустые «Детали» → строка без пустоты; пустой журнал → пустое состояние ≤ 24 px] · S n/a — вёрстка; журнал и «Техническая запись» — по-прежнему только admin (права не меняются)

- [x] P29-T9 · T1 · **D-23** · Spec: [ADR-022 §4.4](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [UX-03 D-9, §7а](../../../design/visual_identity_contract.md) · Prototype: `vAudit` (фильтры)
      Files: `apps/web/src/components/admin/{AuditFilterBar,AuditPageContent.server}.tsx`, `apps/web/src/components/patterns/FormSection.tsx` (сетка, при необходимости), тесты
      Acceptance: форма фильтров — `grid grid-cols-12 gap-x-stack gap-y-stack`: ряд 1 «С» / «По» / «Актор» поровну (4+4+4); ряд 2 «Тип сущности» / «Действие» (6+6; на ≥ `xl` все пять — компактные `h-8`-поля в одном-двух рядах); **верхние края полей в ряду совпадают ±1 px** при значках «?» в подписях (подпись `min-h-5`); поля 40,5 / 36 px (CU2); «Применить / Сбросить» — один ряд справа, одна высота; высота формы на 1440 заметно меньше 385 px (цель ≤ 260 px)
      Paths: H [ряд: края полей ±1 px; форма компактнее] · N [нет значения фильтра → поле пустое; узкая ширина → 1 колонка по `col-span-12`; значок «?» не меняет высоту подписи] · S n/a — вёрстка

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `AuditTable` (нет `overflow-x` у обёртки на `xl`), `AuditFilterBar` · замер: у обёртки журнала `scrollWidth <= clientWidth` на 1440 и 1280 · файлы CU удалены из baseline

### P29-CU5 — fix(ui): render term label inline without colon, fix placeholder in aria-label and bricks, school cards · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (presentational, словарь).

- [x] P29-T10 · T1 · **D-08** · Spec: [ADR-022 §4.7](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [UX-03 D-17, D-19 ж–и](../../../design/visual_identity_contract.md) · [Lab «TermLabel (позиция, без двоеточий)»](../specs/design_system_lab_spec.md)
      Files: `apps/web/src/components/ui/{term-label,term-hint,term-header}.tsx`, `apps/web/src/components/ui/non-empty-term.ts` (+ тесты `term-label.test.tsx`, `term-hint.test.tsx`), `apps/web/src/lib/messages/{ru,en}/*.json` (`glossary.*`, шаблон `aria-label`), `apps/web/src/lib/messages/{hints-dictionary-parity,forbidden-terms}.test.ts`, `apps/web/src/components/design-lab/TermHintMatrix.tsx`
      Acceptance: **D-08:** `aria-label` кнопки-подсказки — «Что значит «{term}»?» с подставленным термином (на `/verses` — «Что значит «По книгам»?»); тест: ни в одном `hint`/`term`/`aria-label` нет `{` и `}` (по всем срезам и локалям); `TermLabel` не добавляет двоеточий; значок `inline`, высота `1em`, `align-middle`: высота строки со значком == без значка (±1 px, тест рендера + Lab); значок не принимает `Button` в детях (тип/тест «TermLabel внутри кнопки — ошибка»); секция Lab «TermLabel (позиция, без двоеточий)» с антипримерами
      Paths: H [`/verses`: корректный `aria-label`; строка с «?» не выше строки без] · N [`term` с кавычками → экранирование; пустой `term` → ошибка типа/теста; `en` без подстановки → тест падает] · S n/a — тексты и presentational

- [x] P29-T11 · T1 · **D-05** · Spec: [ADR-022 §4.7](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [UX-03 D-19 з](../../../design/visual_identity_contract.md) · Prototype: `vBricks`
      Files: `apps/web/src/components/teacher/{BricksPageSummary,BalanceCards,BalanceTable,BricksPageContent.server,BricksLedgerPanel}.tsx` (+ `BricksPageSummary.test.tsx`)
      Acceptance: «К выдаче ? 1050» — слово, значок, значение (двоеточия после значка нет); подписи «Набрано / Выдано / Остаток» в карточке — одна строка из трёх статов (3 колонки) и кнопки справа на 768; кнопка «Выдать» отделена от «⋯» и от числа `gap-chip`; `tabular-nums`; тест рендера «К выдаче»
      Paths: H [`/bricks`: `К выдаче ? 1050`; 768: три стата в строке] · N [0 кирпичиков → «0»; отрицательный остаток → без поломки раскладки; 30+ карточек → без дублей значков] · S n/a — presentational

- [x] P29-T12 · T1 · **D-13** · Spec: [ADR-022 §4.7 п. 1](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [ADR-020 §4 п. 2](../../../prds/07_governance/adr_020_term_hints_everywhere_and_audit_polish.md) · Prototype: `vSchool`
      Files: `apps/web/src/components/analytics/{SchoolPageContent.server,SchoolGroupCards,SchoolGroupsTable,AnalyticsTableTermHeader}.tsx`, `apps/web/src/components/admin/SchoolAnalyticsTable.tsx`, `apps/web/src/lib/messages/{ru,en}/analytics.json`
      Acceptance: в режиме карточек (`< lg`) у метрик группы «Регулярно ходят», «Средний балл», «Посещаемость» значок «?» есть **один раз на экран** (у первой карточки, в шапке блока метрик) и берёт те же ключи словаря, что шапка таблицы на `≥ lg`; в таблице — только в шапке
      Paths: H [телефон: подсказки к тем же числам] · N [нет групп → пустое состояние; ключ отсутствует → тест] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `term-label`, `term-hint`, словарь без `{ }`, `BricksPageSummary` · секция Lab «TermLabel (позиция…)» · файлы CU удалены из baseline

### P29-CU6 — fix(web): fix term placement and copy on users, year, achievements, people and grades table · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (presentational и копирайт; права и данные не меняются).

- [ ] P29-T13 · T1 · **D-04** · Spec: [ADR-022 §4.7](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [ADR-020 §4 п. 2](../../../prds/07_governance/adr_020_term_hints_everywhere_and_audit_polish.md) · Prototype: `vUsers`
      Files: `apps/web/src/components/admin/{UserRow,UsersPageContent.server,UsersStatusFilter}.tsx` (+ `UserRow.test.tsx`)
      Acceptance: слово-термин «Статусы» и значок «?» в строках пользователей не выводятся (строка — только значение статуса: «Ожидает решения»); на экране ровно один «?» о статусах — у подписи группы табов статусов (ADR-022 §4.7 п. 1; содержимое подсказки — таблица «статус → что делать» — задача T39 U-05); тест `UserRow`: в строке нет «Статусы» и нет кнопки-подсказки
      Paths: H [строка: «Ожидает решения» без «Статусы» и без «?»; один «?» на экран у табов] · N [статус неизвестен → без значка; тёзки различимы (ADR-020) — не регрессия] · S n/a — presentational; только admin (права не меняются)

- [ ] P29-T14 · T1 · **D-06** · Spec: [ADR-022 §4.7 п. 4](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [ADR-020 §4 п. 2 (в)](../../../prds/07_governance/adr_020_term_hints_everywhere_and_audit_polish.md) · Prototype: `vYear`
      Files: `apps/web/src/components/admin/{YearCard,YearCloseButton,YearPageContent.server}.tsx` (+ `YearCloseButton.test.tsx`), `apps/web/src/lib/messages/{ru,en}/admin.json`
      Acceptance: подпись «Закрыть год ?» заменена заголовком секции «Закрыть учебный год» (значок — у заголовка); кнопка — «Закрыть 2026–2027» (глагол с объектом, период из данных); строка «15 уроков · 3 группы · 90 учеников» — без одинокого «?» (значок убран либо вынесен в «Состав года»); «Причина (необязательно) ?» — значок после слова, без разрыва
      Paths: H [нет дубля «Закрыть год» + «Закрыть год»] · N [нет периода → «Закрыть год»; нет учеников → «0 учеников»] · S n/a — presentational; диалог подтверждения и права не меняются

- [ ] P29-T15 · T1 · **D-07** · Spec: [ADR-022 §4.6, §4.7](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vAchievements`
      Files: `apps/web/src/components/achievements/{AchievementsPageContent.server,AchievementsRecalcBar.client,AchievementsRulesNote.client,AchievementCatalogRow,AchievementsPageHeaderActions.client}.tsx`
      Acceptance: карточка «Пересчёт идёт сам…» — текст на всю ширину, кнопка под ним (`< md`) / справа с `shrink-0` (`md+`); нет дубля подписи «Пересчитать достижения ?» и кнопки; абзац «Серия ? …» — значок `inline` `1em` `align-middle`, межстрочный отступ не раздут (высота строки с значком == без, ±1 px); на 768 левый текстовый столбец ≥ 280 px
      Paths: H [768: текст не ужат до ~130 px; один заголовок действия] · N [нет достижений → пустое состояние; длинные названия → перенос] · S n/a — presentational

- [ ] P29-T16 · T1 · **D-09** · Spec: [ADR-022 §4.2, §4.7](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vPeople`
      Files: `apps/web/src/components/admin/{PeoplePageContent.server,PeopleListFilter,PeopleGroupFilter,PupilRow,LegacyConsentList}.tsx` (+ `PupilRow.test.tsx`)
      Acceptance: вертикальный ритм «поиск → табы → пояснение → чипы групп → кнопка» — `--space-stack` (16,2 ±1 px) между блоками; «Без согласия: N» отступает от линии табов ≥ 8 px; «+ Добавить ученика» и «Согласие на бумаге ?» — на общей базовой линии, зазор ≥ `--space-chip`; одинокий «?» после «Перевести» в строках учеников убран (значок — у слова «Согласие на бумаге» один раз над списком)
      Paths: H [ритм 16 px; нет «?» после кнопки] · N [список пуст → пустое состояние ≤ 24 px; 0 «без согласия» → строка скрыта] · S n/a — presentational; только admin

- [ ] P29-T17 · T1 · **D-24** · Spec: [ADR-022 §4.2, §4.4, §4.7 п. 3](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vPeople`
      Files: `apps/web/src/components/admin/{PeopleSearch.client,PeopleListFilter,PupilRowActions.client,TransferDialog}.tsx`, `apps/web/src/components/ui/segmented-control-links.tsx`
      Acceptance: подпись «Найти ученика» над полем (расстояние `--space-label`), поле ≤ 480 px; контейнер табов — `overflow-y: hidden` (нет вертикального мини-скроллбара); «Без согласия: N» — счётчик внутри таба, не отдельная строка; в кнопке «Перевести» нет значка «?» (подсказка рядом, вне кнопки); поиск, табы и чипы групп — на одной левой оси
      Paths: H [нет мини-скроллбара; «Перевести» без значка] · N [узкая ширина → табы прокручиваются по X внутри обёртки; N = 0 → счётчик скрыт] · S n/a — presentational

- [ ] P29-T18 · T0 · **U-08** · Spec: [homework_check_flow_spec R-19](../specs/homework_check_flow_spec.md) · [ADR-018 (тексты)](../../../prds/07_governance/adr_018_ui_terminology_and_term_hints.md) · Prototype: `vLessonTable`
      Files: `apps/web/src/lib/messages/{ru,en}/teacher.json` (`lessons.table.finish*`), `apps/web/src/components/teacher/LessonTableFinishCheck.tsx`
      Acceptance: текст «Достижения начислятся после завершения достижения» → «Достижения начислятся после завершения проверки»; `en` — «Achievements are awarded after the check is finished»; «?» — по тексту один раз (после слова «достижения»)
      Paths: H [верный текст] · N [нет опечаток в `en`] · S n/a — тексты

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `UserRow`, `YearCloseButton`, `PupilRow` · grep `завершения достижения` пуст · файлы CU удалены из baseline

### P29-CU7 — fix(ui): enforce chip, tab and link-button size and gap with grouped segmented control · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (presentational).

- [ ] P29-T19 · T1 · **D-10** · Spec: [ADR-022 §4.3](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [UX-03 D-14](../../../design/visual_identity_contract.md)
      Files: `apps/web/src/components/ui/{custom-link,button,segmented-control-links}.tsx`, потребители: `apps/web/src/components/analytics/*` (чипы периода, «Ученик ↑», «Год рождения»), `apps/web/src/components/teacher/{LessonDetailPageContent.server,LessonsPageContent.server}.tsx`, `apps/web/src/components/family/{FamilyPageContent.server,FamilyListRow}.tsx`, `apps/web/src/components/admin/UserProfilePageContent.server.tsx` (имена — по факту), тесты
      Acceptance: ссылки-кнопки и чипы — высота ≥ 36 px (`min-h-8` + вертикальный `padding`): «2024–2025 / 2025–2026 / 2026–2027», «Ученик ↑», «Год рождения», «Все уроки», «К уроку», «Назначить семью», «Аналитика группы», «Добавить учителя»; ссылки внутри текста исключены; замер на `/analytics`, `/lessons/new`, `/lessons/[id]`, `/family`, `/analytics/pupils/[id]` — ни одного интерактивного элемента ниже 36 px
      Paths: H [все перечисленные ≥ 36 px] · N [длинная подпись → перенос, высота растёт, не обрезается; в тексте — ссылка исключена] · S n/a — presentational

- [ ] P29-T20 · T1 · **D-11** · Spec: [ADR-022 §4.2, §4.3](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: цепочки чипов
      Files: `apps/web/src/components/ui/{segmented-control,segmented-control-links,toggle-group}.tsx`, `apps/web/src/components/admin/{UsersStatusFilter,PeopleListFilter,DeletionAdminList.server}.tsx`, `apps/web/src/components/analytics/*` (табы), тесты
      Acceptance: зазор в цепочке чипов и табов — `gap-chip` по обеим осям (≥ 8 px), между цепочками — `gap-stack`; при переносе на 360–768 вертикальный зазор рядов ≥ 8 px; замер на `/users`, `/people`, `/deletions`, `/analytics`
      Paths: H [зазор ≥ 8 px] · N [один чип → без лишнего отступа; перенос на 3 ряда → ритм сохраняется] · S n/a — presentational

- [ ] P29-T21 · T1 · **D-15** · Spec: [UX-03 §8 (Чип / сегмент)](../../../design/visual_identity_contract.md) · [ADR-022 §4.3](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `seg()`
      Files: `apps/web/src/components/ui/segmented-control.tsx` (+ `segmented-control.test.tsx`), `apps/web/src/components/analytics/{ChartTableToggle,PupilAnalyticsPageContent.server}.tsx` (потребители «График / Таблица» на `/analytics` — по факту)
      Acceptance: «График / Таблица» — `SegmentedControl` с общей рамкой группы и разделителем (зазор внутри 0), снаружи `gap-stack` до соседних блоков; на `/analytics` и `/analytics/pupils/[id]`; тест рендера (общий контейнер `role="radiogroup"`)
      Paths: H [группа в одной рамке] · N [одна опция → без разделителя; `disabled` — различим по тексту/контрасту] · S n/a — presentational

- [ ] P29-T22 · T1 · **D-16** · Spec: [ADR-022 §4.2 (`--space-hint`)](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vRating`
      Files: `apps/web/src/components/analytics/{RatingTableMetricHeader,RatingPrivacyNote,RatingPageContent.server}.tsx`, `apps/web/src/app/(app)/rating/page.tsx`
      Acceptance: значок «?» на `/rating` отстоит от следующей подписи ≥ `--space-hint` (8 px); на 360 «Рейтинг видя…» и «Группа» не соприкасаются (зазор ≥ 8 px — замер)
      Paths: H [зазор ≥ 8 px] · N [длинная подпись → перенос] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `segmented-control`, `custom-link` · замер высот ≥ 36 px и зазоров ≥ 8 px · файлы CU удалены из baseline

### P29-CU8 — fix(web): unify label spacing, family and calendar headers and lesson form fields · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (presentational).

- [ ] P29-T23 · T1 · **D-17** · Spec: [ADR-022 §4.2 (`--space-label`, `--space-hint`)](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vYear`
      Files: `apps/web/src/components/admin/{YearCard,YearCloseButton,YearPageContent.server,CreateYearForm.client}.tsx`
      Acceptance: на `/year` одно значение «подпись → поле» (`--space-label`, 6,3 ±1 px) и одно «слово → значок» (`--space-hint`, 8,1 ±1 px); замер трёх связок («Причина → поле», «15 уроков · … ?», «Закрыть год ↔ кнопка») — значения из токенов
      Paths: H [три связки на токенах] · N [нет «Причины» → без пустого места] · S n/a — presentational

- [ ] P29-T24 · T1 · **D-18** · Spec: [ADR-022 §4.2 (`--space-card`)](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vFamily`
      Files: `apps/web/src/components/family/{FamilyPageContent.server,FamilyListRow}.tsx`, `apps/web/src/components/patterns/RecordCard.tsx`
      Acceptance: карточки семьи — зазор `--space-card` (≥ 16 px) на всех ширинах (был 1 px); список — один столбец до `xl`
      Paths: H [зазор между карточками ≥ 16 px] · N [одна семья → без лишнего отступа] · S n/a — presentational; только admin

- [ ] P29-T25 · T1 · **D-19** · Spec: [UX-03 §7а](../../../design/visual_identity_contract.md) · Prototype: `vCalendar`
      Files: `apps/web/src/components/teacher/{CalendarMonthHeader,CalendarMonth,CalendarPageContent.server}.tsx` (+ `CalendarMonthHeader.test.tsx`)
      Acceptance: шапка календаря `[‹] Ноябрь 2026 [›]` — по центру, стрелки `h-9 w-9` с зазором ≥ 8 px от названия месяца; «Сегодня» отдельной строкой справа/снизу на ширинах < 768 (на 360 — не ближе 8 px к стрелкам); название месяца не прижато к краю (боковой отступ ≥ `--space-page-x`)
      Paths: H [360: шапка читаема] · N [короткий и длинный месяц → без смещения стрелок; месяц без событий → без изменений] · S n/a — presentational

- [ ] P29-T26 · T1 · **D-29** · Spec: [ADR-022 §4.4](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vLessonForm`
      Files: `apps/web/src/components/teacher/{LessonForm,LessonDetailVersePanel,VersePicker}.tsx`, `apps/web/src/components/ui/{date-field,field}.tsx`, `apps/web/src/components/patterns/FormSection.tsx`, `apps/web/src/app/(app)/lessons/{new,[lessonId]/edit}/page.tsx` (имена — по факту)
      Acceptance: все поля формы урока (`Группа`, `Ведёт`, `Дата урока`, `Тема`) — `w-full` колонки, правый край общий; `DateField` со встроенной иконкой; один шаг между полями — `--space-stack` (16 ±1 px; прежние 18–24 / 30 px — нет); блок «Тип урока» — тот же шаг; на 1440 левая и правая карточки («Золотые стихи») — `items-start`, высоты независимы
      Paths: H [поля одной ширины, шаг 16 px] · N [ошибка поля → высота не «прыгает» (место под `AlertText`); узкая ширина → одна колонка] · S n/a — presentational; валидация и мутации не меняются

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `CalendarMonthHeader`, `LessonForm` · замеры токенов · файлы CU удалены из baseline

### P29-CU9 — fix(web): remove stretched cards and vertical checkbox lists on group, approvals, today and year · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (presentational).

- [ ] P29-T27 · T1 · **D-25** · Spec: [ADR-022 §4.6 п. 1–4](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vGroupEdit`
      Files: `apps/web/src/components/admin/{GroupDetailPageContent.server,GroupSettingsForm,TeacherAssignmentList}.tsx` (+ `TeacherAssignmentList.test.ts`), `apps/web/src/components/ui/{checkbox,form-checkbox}.tsx`
      Acceptance: `/groups/[id]` — один столбец до `xl`; на `xl+` — 8/4 («Учителя на год» `sticky`, `items-start`, пустой колонки на 450+ px нет); чекбоксы «Стихи / Тест / Тетрадь / Пение» — одна строка с переносом (`flex-wrap gap-x-stack gap-y-chip`, шаг ≤ 36 px); числовые настройки — сетка `auto-fit minmax(10rem, 1fr)`, подпись «Стихов за урок» в одну строку; карточка достижений — компактная строка «заголовок · статус · переключатель» с описанием под заголовком (нет 200+ px пустоты), «Настроить баллы для группы» — ссылка внутри этой карточки; доля пустоты карточек ≤ 30 %
      Paths: H [768–1440: нет пустой колонки; чекбоксы в строку] · N [ни одного учителя на год → пустое состояние ≤ 24 px; узкая ширина → перенос чекбоксов] · S n/a — presentational; права и мутации не меняются

- [ ] P29-T28 · T1 · **D-26** · Spec: [ADR-022 §4.6 п. 2–3](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vApprovals`
      Files: `apps/web/src/components/admin/{ApprovalRow,ApprovalRoleSelect,ApprovalsPageContent.server,ApproveRequestDialog.client}.tsx` (+ `approval-role-select.test.ts`)
      Acceptance: «Роли ?» и «Группы ?» — чипы-чекбоксы в строку с переносом (шаг 32–36 px), вместо списка с шагом ~48 px; метаданные заявки («Подана 3 нояб. · Версия согласия») — над ролями, не узкой левой колонкой; кнопки «Одобрить / Отклонить» — один ряд под ролями; карточка заявки ≤ 260 px на 1440 при пяти ролях/группах (замер)
      Paths: H [карточка ≤ 260 px] · N [много групп → перенос на новые строки; нет групп → «Группы» скрыты; заявка без роли → кнопка «Одобрить» неактивна, как раньше] · S n/a — presentational; решение по заявке и права не меняются

- [ ] P29-T29 · T0 · **D-30** · Spec: [ADR-022 §4.6 п. 4](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vToday`
      Files: `apps/web/src/components/teacher/{TodayLessonCard,TodayPageContent.server}.tsx` (+ `TodayLessonCard.test.tsx`)
      Acceptance: в карточке «Кого отметить в классе» кнопка «Включить в настройках группы» — по ширине содержимого, `variant="outline"`; пустое состояние — текст + ссылка; нет `w-full` на `md+`
      Paths: H [вторичная кнопка не баннер] · N [нет прав на настройки → без кнопки, как раньше] · S n/a — presentational

- [ ] P29-T30 · T1 · **D-31** · Spec: [ADR-022 §4.6 п. 1, 5](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vYear`
      Files: `apps/web/src/components/admin/{YearCard,YearPageContent.server,YearPageSkeleton}.tsx` (+ `YearCard.test.ts`)
      Acceptance: сетка `/year` — `items-start`; карточка закрытого года («2025–2026») — компактная, без опасной зоны, высота по содержимому (пустота снизу ≤ 30 %); список лет — один столбец до `xl`
      Paths: H [закрытый год без 316 px пустоты] · N [один год → без сетки; нет закрытых → только активный] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `TeacherAssignmentList`, `approval-role-select`, `TodayLessonCard`, `YearCard` · замер доли пустоты и шага чекбоксов · файлы CU удалены из baseline

### P29-CU10 — fix(web): use table rows for rating, token padding for cards and empty states, guide spacing · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (presentational).

- [ ] P29-T31 · T1 · **D-32** · Spec: [ADR-022 §4.5 п. 3, §4.6 п. 5](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vRating`
      Files: `apps/web/src/components/analytics/{RatingTable,RatingPageContent.server}.tsx` (сейчас `RatingTable` — карточки `RecordCard` до `lg`, `Card` с таблицей от `lg`), `apps/web/src/components/patterns/RecordCard.tsx` (при необходимости)
      Acceptance: на ≥ 768 рейтинг — строка-таблица (имя · баллы · …), карточка — только на `< 768` (граница `md` вместо нынешней `lg`); число баллов — по правому краю; свободного места справа 356 px нет (замер: колонка баллов у правого края контейнера)
      Paths: H [768: таблица] · N [пустой рейтинг → пустое состояние ≤ 24 px; одинаковые баллы → стабильный порядок, как раньше] · S n/a — presentational

- [ ] P29-T32 · T1 · **D-33** · Spec: [ADR-022 §4.2 (`--space-card`)](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [UX-03 §8 (Карточка)](../../../design/visual_identity_contract.md)
      Files: `apps/web/src/components/ui/card.tsx`, `apps/web/src/components/admin/{SettingsPageContent.server,SettingsLanguageForm,DeletionRequestCard}.tsx`, `apps/web/src/components/teacher/{CalendarMonth,CalendarBirthdayRow}.tsx` (+ `DeletionRequestCard.test.tsx`)
      Acceptance: `Card` по умолчанию — `p-card` (16,2 / 24,3 px); на `/settings`, `/deletions`, `/calendar` паддинг карточки ≤ 24,3 px, без «24 сверху и 42 по бокам»; «Язык интерфейса» — без пустоты справа (контент по ширине или карточка по ширине содержимого); карточка события календаря — вертикальный паддинг ≤ `--space-chip` + 2 px при одной строке
      Paths: H [паддинги по токену] · N [длинный заголовок → перенос] · S n/a — presentational

- [ ] P29-T33 · T0 · **D-34** · Spec: [ADR-022 §4.6 п. 5](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [ui_states_contract S2](../../../design/ui_states_contract.md)
      Files: `apps/web/src/components/patterns/EmptyState.tsx`, `apps/web/src/components/admin/{UserProfilePageContent.server,EntityHistoryList}.tsx`
      Acceptance: `EmptyState` — `padding` ≤ 24 px (был 45 px вертикально); «Записей пока нет» на `/users/[id]` — высота ≤ 96 px при двух строках; один вариант `EmptyState` на все экраны
      Paths: H [компактное пустое состояние] · N [без иконки / без действия → высота не «прыгает»] · S n/a — presentational

- [ ] P29-T34 · T0 · **D-35** · Spec: [ADR-022 §4.2 (`--space-section`)](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vGuide`
      Files: `apps/web/src/app/(app)/guide/page.tsx`, `apps/web/src/components/guide/*.tsx` (имена — по факту)
      Acceptance: зазор между разделами `/guide` — `--space-section` (32,4 / 39,6 px, был 45 px); `scroll-margin-top` у заголовков разделов = высота шапки (56 px) + 8 px
      Paths: H [зазор 32 px] · N [якорная ссылка на раздел → заголовок не под шапкой] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `DeletionRequestCard`, `EmptyState` · замер паддингов · файлы CU удалены из baseline

### P29-CU11 — feat(web): reduce hint noise and add consequence and status hints on bricks, approvals, deletions, year, users, people, achievements · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (копирайт и presentational; права, мутации и данные не меняются).

- [ ] P29-T35 · T1 · **U-01** · Spec: [ADR-022 §4.7 п. 1](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [ADR-020 §4 п. 2 (б)](../../../prds/07_governance/adr_020_term_hints_everywhere_and_audit_polish.md) · Prototype: `vBricks`
      Files: `apps/web/src/components/teacher/{BricksPageSummary,BalanceCards,BalanceTable,BalancePupilActions.client}.tsx`, `apps/web/src/lib/messages/{ru,en}/teacher.json` (`hints.t.bricks_*`), тесты
      Acceptance: один «?» у «К выдаче» с формулой «Набрано − Выдано = Остаток»; значки в карточках учеников убраны, подписи «Набрано / Выдано / Остаток» — обычным текстом (значок живёт в шапке/первой карточке); на `/bricks` значков ≤ 5 вместо ~94
      Paths: H [значков ≤ 5; формула в «К выдаче»] · N [нет учеников → без значков] · S n/a — presentational

- [ ] P29-T36 · T1 · **U-02** · Spec: [ADR-022 §4.7](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [ADR-020 каталог (`/approvals`)](../../../prds/07_governance/adr_020_term_hints_everywhere_and_audit_polish.md) · Prototype: `vApprovals`
      Files: `apps/web/src/components/admin/{ApprovalRow,ApprovalsPageContent.server}.tsx`, `apps/web/src/lib/messages/{ru,en}/admin.json` (`hints.a.approvals_*`)
      Acceptance: «Версия согласия v1» → «Согласие v1» + «?» («Версия текста согласия, с которой пользователь согласился при регистрации»); у «Группы (активный год)» подсказка «Роль учителя выдаётся вместе с группами»; ключи `ru` и `en`, ≤ 200 знаков
      Paths: H [подсказки по тексту] · N [нет версии согласия → «—»] · S n/a — presentational; только admin

- [ ] P29-T37 · T1 · **U-03** · Spec: [ADR-022 §4.7](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [ADR-020 каталог (`/deletions`)](../../../prds/07_governance/adr_020_term_hints_everywhere_and_audit_polish.md) · Prototype: `vDeletions`
      Files: `apps/web/src/components/admin/{DeletionRequestCard,DeletionTakeButton.client,DeletionPlanView}.tsx` (+ `DeletionRequestCard.test.tsx`), `apps/web/src/lib/messages/{ru,en}/admin.json`
      Acceptance: «?» у «Обезличим» («Имя и контакты заменяются на «Удалённый ученик»; записи в журнале остаются»); у «Взять в работу» — что меняется для заявителя (подсказка рядом с кнопкой, **не внутри**); один бейдж срока «Просрочен на 28 дн.» (D-20 — отдельной задачей, здесь только подсказка)
      Paths: H [подсказки у «Обезличим» и «Взять в работу»] · N [нет срока → без бейджа; подсказка вне кнопки] · S n/a — presentational; только admin

- [ ] P29-T38 · T1 · **U-04** · Spec: [ADR-022 §4.7 п. 4](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [ADR-020 §4 п. 2 (в)](../../../prds/07_governance/adr_020_term_hints_everywhere_and_audit_polish.md) · Prototype: `vYear`
      Files: `apps/web/src/components/admin/{YearCloseButton,YearPageContent.server}.tsx` (+ `YearCloseButton.test.tsx`), `apps/web/src/lib/messages/{ru,en}/admin.json`
      Acceptance: над кнопкой закрытия года — список «Что произойдёт» (3 пункта: учителя — только чтение; нельзя отменить; журнал сохраняется) и строка «Это нельзя отменить»; диалог подтверждения требует ввод «закрыть 2026–2027» (период из данных); `ConfirmDialog` остаётся
      Paths: H [список и подтверждение текстом] · N [неверный ввод → кнопка подтверждения неактивна; период не определён → «закрыть год»] · S n/a — presentational; мутация закрытия года и права не меняются

- [ ] P29-T39 · T1 · **U-05** · Spec: [ADR-022 §4.7](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vUsers`
      Files: `apps/web/src/components/admin/{UsersStatusFilter,UsersPageContent.server,UserRow}.tsx`, `apps/web/src/lib/messages/{ru,en}/admin.json`
      Acceptance: один «?» у заголовка группы табов с таблицей «статус → что делать» («Регистрация», «Ожидает решения», «Нужно: выдать роль», «Активен», «Отключён», «Отклонён»); в строке — только значение статуса (без значка)
      Paths: H [одна таблица статусов] · N [неизвестный статус → строка без значка] · S n/a — presentational; только admin

- [ ] P29-T40 · T1 · **U-06** · Spec: [ADR-022 §4.7](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vPeople`
      Files: `apps/web/src/components/admin/{PeoplePageContent.server,PeopleListFilter,LegacyConsentBadge,LegacyConsentList}.tsx`, `apps/web/src/lib/messages/{ru,en}/admin.json`
      Acceptance: «Перенесённые» без согласия и «Согласие на бумаге» — подсказки только через `TermLabel` (один стиль; других `title`/самодельных значков нет); grep по `LegacyConsentBadge` — только `TermLabel`
      Paths: H [один стиль подсказок] · N [нет перенесённых → строка скрыта] · S n/a — presentational; только admin

- [ ] P29-T41 · T1 · **U-07** · Spec: [ADR-022 §4.6, §4.7](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vAchievements`
      Files: `apps/web/src/components/achievements/{AchievementsPageContent.server,AchievementsRulesNote.client}.tsx`, `apps/web/src/lib/messages/{ru,en}/admin.json`
      Acceptance: плотный абзац про серии разбит на 3 пункта списка «Правила» с заголовком; «?» только у «Серия» и «Обзорный урок» (по одному на экран); левая колонка текста на 768 ≥ 280 px
      Paths: H [список из 3 пунктов] · N [нет правил → пустое состояние] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `DeletionRequestCard`, `YearCloseButton`, паритет `hints.*` ru/en, `forbidden-terms` · значков на `/bricks` ≤ 5 · файлы CU удалены из baseline

### P29-CU12 — fix(web): turn group points into cards below lg, compact achievement levels and fix remaining labels · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (presentational; редактор баллов, права и мутации не меняются).

- [ ] P29-T42 · T1 · **D-27** · Spec: [ADR-022 §4.5 п. 1, 3](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [ADR-015](../../../prds/07_governance/adr_015_group_achievement_points.md) (редактор баллов; не меняется) · Prototype: `/groups/[id]/points`
      Files: `apps/web/src/components/achievements/{GroupPointsTable.client,GroupPointsTableGrid.client,GroupPointsRow,AdminGroupPointsPageContent.server,TeacherGroupPointsPageContent.server}.tsx` (+ `GroupPointsRow.test.tsx`), `apps/web/src/app/(app)/groups/[groupId]/points/page.tsx`, `apps/web/src/app/(app)/group/points/page.tsx`; хук `use-group-points-editor-drafts.ts` не меняется
      Acceptance: до `lg` — список карточек (на строку достижения: название · уровень · условие · общее · поле группы); на `≥ lg` — таблица в обёртке; «Как зарабатывается» — отдельная строка раскрытия на всю ширину; поле «Как в общем» — `min-w-28`, плейсхолдер короче; колонка «Переопределение баллов» ≥ 112 px (не 1 px); на 390 нет внутреннего скролла
      Paths: H [768: карточки, поле видно; ≥ lg: таблица] · N [нет достижений → пустое состояние; значение вне диапазона — валидация как раньше; длинное название → перенос] · S n/a — presentational; сохранение баллов, права и `route-table.ts` не меняются

- [ ] P29-T43 · T1 · **D-36** · Spec: [ADR-022 §4.6 п. 3, 5](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vAchievements` · **требует визуальной проверки** живого экрана (отчёт §7.2)
      Files: `apps/web/src/components/achievements/{AchievementsPageContent.server,AchievementsCatalogBoard.client,AchievementCatalogRow,AchievementTierDot}.tsx` (+ `AchievementCatalogRow.test.tsx`)
      Acceptance: уровни достижения — таблица 3 строки × (уровень · условие · баллы), карточка достижения ≤ 260 px на 1440 при 3 уровнях (было 450–595); текстовые колонки на 768–1024 ≥ 280 px; перед правкой — визуальная проверка живого экрана записана в Change log (подтверждено / не подтверждено)
      Paths: H [карточки компактные] · N [один уровень → без таблицы; нет уровней → строка скрыта] · S n/a — presentational

- [ ] P29-T44 · T1 · **D-12** · Spec: [ADR-022 §4.7 п. 2–3](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vGroups`
      Files: `apps/web/src/components/admin/{GroupCard,GroupsPageContent.server}.tsx`, `apps/web/src/lib/messages/{ru,en}/admin.json`
      Acceptance: метаданные карточки группы — `ul` с разделителями через `li::before`, перенос по элементу (точка-разделитель не в начале строки на 360–1440); значок «?» — вплотную после слова «Русский» без собственных `margin`
      Paths: H [360: точка не в начале строки] · N [нет учителя → «Без учителя»; один элемент → без разделителя] · S n/a — presentational

- [ ] P29-T45 · T1 · **D-14** · Spec: [ADR-022 §4.2, §4.4](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vLessonForm`, `vLessons`
      Files: `apps/web/src/components/teacher/{LessonForm,LessonListRow,LessonsPageContent.server,LessonCard,LessonInlineProgress}.tsx` (+ `LessonsList.test.tsx` — тест строк списка; отдельного `LessonsList.tsx` нет)
      Acceptance: «Ведёт ?» — подпись над полем, значок через `--space-hint` (8 px до следующего поля больше нет «5 px плотно»); в списке уроков на 360 «Проверено 11 из 30» — один `Badge`-подобный элемент (одна высота строки), стрелка «›» не отрывается от строки
      Paths: H [подпись и значок в ритме; бейдж проверки одной высоты] · N [0 из 0 → «—»; 30 из 30 → «Проверено»] · S n/a — presentational

- [ ] P29-T46 · T0 · **D-20** · Spec: [ADR-022 §4.6](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md)
      Files: `apps/web/src/components/admin/{DeletionRequestCard,DeletionAdminList.server}.tsx`, `apps/web/src/lib/messages/{ru,en}/admin.json`
      Acceptance: «Просрочен» и «просрочен на 28 дн.» в одной карточке → один бейдж «Просрочен на 28 дн.» (склонение через `plural`); срок отсутствует → без бейджа
      Paths: H [один бейдж] · N [0 дн. → «Просрочен сегодня»; 1 / 2 / 5 дн. — склонения] · S n/a — presentational

- [ ] P29-T47 · T1 · **D-21** · Spec: [ADR-022 §4.5 п. 2](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · [global_shell_spec §4 (`shell-header.client.tsx`), §6.4](../specs/global_shell_spec.md) · [UX-02 §4 «Шапка»](../../../design/responsive_navigation_contract.md)
      Files: `apps/web/src/components/shell/shell-header.client.tsx`, `apps/web/src/components/patterns/PageHeader.tsx`, `apps/web/src/components/shell/{shell-navigation.client,shell-route-announcer.client}.tsx` (+ `shell-header.client.test.ts`)
      Acceptance: на мобильных заголовок шапки и `h1` страницы не дублируются: шапка показывает раздел/роль, `h1` — заголовок страницы; если `h1` совпадает с шапкой — на `< lg` `h1` `sr-only`; на `/school`, `/groups`, `/settings` — один видимый заголовок; объявление смены маршрута (`aria-live`) не меняется
      Paths: H [360: «Школа» один раз] · N [заголовок страницы ≠ шапка → оба видимы; длинный заголовок → перенос] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `LessonsList`, `GroupPoints*`, `DeletionRequestCard`, `shell-header` · замер: на 390 нет внутреннего скролла `/groups/[id]/points` · файлы CU удалены из baseline

### P29-CU13 — feat(web): add role-grouped guide, uniform action columns, user name in header and larger field labels · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (presentational; **U-11 не меняет `lib/auth/**` и форму сессии** — только отображение уже доступного имени, иначе — отдельный T3-CU).

- [ ] P29-T48 · T1 · **U-09** · Spec: [ADR-022 §4.2 (`--space-section`)](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) · Prototype: `vGuide`
      Files: `apps/web/src/app/(app)/guide/page.tsx`, `apps/web/src/components/guide/*.tsx` (имена — по факту), `apps/web/src/lib/messages/{ru,en}/guide.json` (`tocHeading`, `roles` — структура оглавления)
      Acceptance: оглавление `/guide` сгруппировано по ролям (администратор / учитель / общие), 13 пунктов не одним списком; активный пункт подсвечивается при прокрутке (`aria-current="location"`); на мобильных — плавающая кнопка «К оглавлению»; `reduced-motion` → без плавной прокрутки
      Paths: H [группы по ролям; подсветка] · N [нет JS → оглавление — обычные ссылки; пустая группа → скрыта] · S n/a — presentational; видимость руководства по ролям не меняется

- [ ] P29-T49 · T0 · **U-10** · Spec: [ADR-022 §4.3](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md)
      Files: `apps/web/src/components/admin/{UserRow,PupilRow,ApprovalRow,DeletionRequestCard}.tsx`, `apps/web/src/components/ui/{row-actions-menu,button}.tsx`
      Acceptance: колонка действий в списках («Профиль», «Выдать роль» и т. п.) — `min-w-28` (≈ 126 px), ширина не «прыгает» между строками (замер ±1 px по строкам списка на `/users`, `/people`)
      Paths: H [единая ширина колонки действий] · N [одно действие → та же ширина; длинная подпись → перенос] · S n/a — presentational

- [ ] P29-T50 · T1 · **U-11** · Spec: [global_shell_spec §6.3 «Меню пользователя» (отображаемое имя без email)](../specs/global_shell_spec.md) · [ADR-022 §4.7](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md)
      Files: `apps/web/src/components/shell/{user-menu,shell-header.client}.tsx` (+ `shell-header.client.test.ts`), `apps/web/src/lib/messages/{ru,en}/common.json`
      Acceptance: в шапке/меню профиля — отображаемое имя пользователя; роль — вторичной подписью («Иван Петров · администратор»); нет имени → «Пользователь · {роль}» (ключ `common.shell.display_name_fallback`, как сейчас); email в шапке не показывается; источник имени — проп `displayName`, который `app-shell.tsx` уже передаёт в `shell-header.client.tsx` и `UserMenu` (без изменений `lib/auth/**`, `(app)/layout.tsx`, сессии, маршрутов); тест `shell-header`: имя + роль, фолбэк при пустом имени, нет `@` в тексте шапки
      Paths: H [шапка: имя + роль] · N [пустое имя → фолбэк; длинное имя → `truncate` с `title` только в шапке (плотная строка, исключение ADR-022 §4.5 п. 4), в меню — перенос] · S n/a — новых данных нет: показывается то же отображаемое имя текущего пользователя, что уже приходит в шапку (`displayName`); email и чужие данные не выводятся; auth, сессия и policy не меняются. Если для имени понадобится менять `lib/auth/**` или форму сессии — S-триггер, отдельный CU T3

- [ ] P29-T51 · T0 · **U-12** · Spec: [UX-03 §6, §10 (`text-sm` — пол)](../../../design/visual_identity_contract.md)
      Files: `apps/web/src/components/ui/{label,field}.tsx`, `apps/web/src/components/admin/{UsersStatusFilter,PeopleGroupFilter}.tsx`, `apps/web/src/components/teacher/{LessonsGradeFilter,LessonCheckTableFilters}.tsx`
      Acceptance: подписи полей/секций в мобильных списках («Статусы», «Группа», «Период») ≥ 15,75 px (`text-sm` — нижний предел; не `text-xs`), вес `font-medium`; замер `getComputedStyle` ≥ 15,75 px на 360
      Paths: H [подписи ≥ 15,75 px] · N [локаль `en` — длиннее → перенос] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `shell-header`, `UserRow`, guide-оглавление · замер `getComputedStyle` · файлы CU удалены из baseline

## Verification (phase)

- [ ] Все CU закоммичены; у каждого trace `Review: …`
- [ ] CU2 до CU4; CU1 до CU3 (замеры ширины с rail)
- [ ] Phase DoD из [`P29_phase_description.md`](../phases_tasks_descriptions/P29_phase_description.md)
- [x] Docs sync, ADR-022, UX-03 v2.6, Lab v2.6, правила и прототип — подготовительный шаг фазы (до CU1)
- [ ] `grep -rn 'size="field"' apps/web/src` пуст; `grep -rn "h-10" apps/web/src/components/ui/{input,select,date-field}.tsx` пуст
- [ ] ESLint-правило `no-raw-spacing` включено; baseline уменьшается с каждым CU; остаток — перечень файлов вне фазы
- [ ] Замеры (phase description § Метод замера): `scrollWidth` страницы == `innerWidth` на 360 / 768 / 1024 / 1440; нет внутреннего скролла на `/audit` ≥ 1280 и на `/school`, `/analytics` при 1024; поле 40,5 / 36; зазор в цепочке чипов ≥ 8 px; края полей в ряду ±1 px; доля пустоты карточки с одним блоком ≤ 30 %; `aria-label` без `{ }`; под контентом на 1024 ≥ 900 px
- [ ] Повторный прогон аудита (Chrome): R-1, D-01…D-36, U-01…U-12 закрыты

## Трассировка «дефект → CU → задача»

| Дефект | CU | Задача | Приоритет |
|--------|----|--------|-----------|
| **R-1** сайдбар на 1024–1279 | CU1 | T1 | P0 |
| D-01 таблица оценок | CU3 | T5 | P0 |
| D-02 проверка ДЗ, 1024 | CU3 | T6 | P0 |
| D-03 имя обрезано, зазор 2 px | CU3 | T7 | P0 |
| D-22 `/audit` скролл таблицы | CU4 | T8 | P0 |
| D-23 `/audit` фильтры | CU4 | T9 | P0 |
| D-04 «Статусы» в `/users` | CU6 | T13 | P1 |
| D-05 `/bricks` двоеточие | CU5 | T11 | P1 |
| D-06 `/year` дубль подписи | CU6 | T14 | P1 |
| D-07 `/achievements` карточка | CU6 | T15 | P1 |
| D-08 `{term}` в `aria-label` | CU5 | T10 | P1 |
| D-09 `/people` ритм | CU6 | T16 | P1 |
| D-13 `/school` «?» в карточках | CU5 | T12 | P1 |
| D-24 `/people` поиск, табы, кнопка | CU6 | T17 | P1 |
| U-08 копирайт «после завершения проверки» | CU6 | T18 | P1 |
| токены интервалов + Lab (инфра) | CU2 | T2 | P2 |
| ESLint-правило интервалов (инфра) | CU2 | T3 | P2 |
| D-28 высота полей 40,5 / 36 | CU2 | T4 | P2 |
| D-10 интерактивные < 36 px | CU7 | T19 | P2 |
| D-11 зазор в цепочках чипов | CU7 | T20 | P2 |
| D-15 «График / Таблица» | CU7 | T21 | P2 |
| D-16 `/rating` зазор значка | CU7 | T22 | P2 |
| D-17 `/year` три связки | CU8 | T23 | P2 |
| D-18 `/family` карточки вплотную | CU8 | T24 | P2 |
| D-19 `/calendar` шапка | CU8 | T25 | P2 |
| D-29 форма урока | CU8 | T26 | P2 |
| D-25 `/groups/[id]` воздух | CU9 | T27 | P2 |
| D-26 `/approvals` воздух | CU9 | T28 | P2 |
| D-30 `/today` вторичная кнопка | CU9 | T29 | P2 |
| D-31 `/year` растянутые карточки | CU9 | T30 | P2 |
| D-32 `/rating` карточка 768 | CU10 | T31 | P2 |
| D-33 паддинги карточек | CU10 | T32 | P2 |
| D-34 `/users/[id]` пустое состояние | CU10 | T33 | P2 |
| D-35 `/guide` зазор разделов | CU10 | T34 | P2 |
| U-01 `/bricks` плотность значков | CU11 | T35 | P3 |
| U-02 `/approvals` термины | CU11 | T36 | P3 |
| U-03 `/deletions` термины | CU11 | T37 | P3 |
| U-04 `/year` последствия | CU11 | T38 | P3 |
| U-05 `/users` таблица статусов | CU11 | T39 | P3 |
| U-06 `/people` стиль подсказок | CU11 | T40 | P3 |
| U-07 `/achievements` правила | CU11 | T41 | P3 |
| D-27 `/groups/[id]/points` карточки | CU12 | T42 | P3 |
| D-36 `/achievements` уровни | CU12 | T43 | P3 |
| D-12 `/groups` метаданные | CU12 | T44 | P3 (не в §6, Q-4) |
| D-14 «Ведёт ?», «Проверено» | CU12 | T45 | P3 (не в §6, Q-4) |
| D-20 «Просрочен» дубль | CU12 | T46 | P3 (не в §6, Q-4) |
| D-21 «Школа» дубль в шапке | CU12 | T47 | P3 (не в §6, Q-4) |
| U-09 `/guide` оглавление | CU13 | T48 | P3 |
| U-10 ширина колонки действий | CU13 | T49 | P3 |
| U-11 имя в шапке | CU13 | T50 | P3 |
| U-12 подписи ≥ 15,75 px | CU13 | T51 | P3 |

Проверка полноты: R-1 (1) + D-01…D-36 (36) + U-01…U-12 (12) = 49 дефектов; в таблице 49 строк дефектов + 2 инфра-строки (T2, T3 — без дефекта; D-28 входит в 49), всего 51 строка. Каждый номер встречается ровно один раз.

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P29_phase_description.md`](../phases_tasks_descriptions/P29_phase_description.md) | DoD, метод замера, smoke |
| [`adr_022_responsive_shell_spacing_and_density.md`](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) | Решение |
| [`usability_audit_2026-11-13_p28.md`](../../../reports/usability_audit_2026-11-13_p28.md) | Источник находок |
| [`P27_tasks.md`](./P27_tasks.md) | Образец / предыдущая фаза с подсказками |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-11-13 | v1.0 — Canonical (подготовка P29): CU1–CU13, трассировка 49 дефектов; ADR-022, UX-03 v2.6, Lab v2.6, правила и прототип обновлены до CU1 |
| 2026-11-13 | v1.1 — Phase DoR audit: пути `Files` по факту, якоря `§`, T1 (cookie-модуль, `profile/layout`), T3 (корневой `eslint.config.mjs`, `no-restricted-syntax` + baseline в `ignores`), T4 (parity P-10/P-11 в том же CU), T13 ↔ T39, T50 (S n/a, фолбэк), счёт строк трассировки (2 инфра-строки) |
| 2026-11-13 | v1.2 — Q-1…Q-6 закрыты принятием умолчаний (токены ADR §4.2; проверка ДЗ в две колонки с `xl`; поля 40,5 / 36 ±1 px; ESLint-baseline; D-12/14/20/21 в CU12; `touch` `h-11` оставлен) |
