# P27 Tasks — подсказки «?» везде и остатки третьего аудита

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-11-04  
**Волна:** P27  
**Зависит от:** [`P27_phase_description.md`](../phases_tasks_descriptions/P27_phase_description.md), [`adr_020_term_hints_everywhere_and_audit_polish.md`](../../../prds/07_governance/adr_020_term_hints_everywhere_and_audit_polish.md), [`usability_audit_2026-11-04_p26.md`](../../../reports/usability_audit_2026-11-04_p26.md), [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) D-17, D-19, [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md) §5.3, [`change_log_contract.md`](../contracts/change_log_contract.md) §4.1, [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) R-25, [`global_shell_spec.md`](../specs/global_shell_spec.md) R-16, [`ui_states_contract.md`](../../../design/ui_states_contract.md) D24  
**Связанные документы:** [`adr_018_ui_terminology_and_term_hints.md`](../../../prds/07_governance/adr_018_ui_terminology_and_term_hints.md), [`adr_019_view_as_menu_and_db_pool.md`](../../../prds/07_governance/adr_019_view_as_menu_and_db_pool.md), [`P26_tasks.md`](./P26_tasks.md), [`copy_and_messages.md`](../../../guidelines/react/copy_and_messages.md), [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md), [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md), [`prototype_class_parity_spec.md`](../specs/prototype_class_parity_spec.md) §7

---

## Purpose

Сделать подсказку «?» стандартом интерфейса и закрыть дефекты D-1…D-22 третьего аудита. DoD — [`P27_phase_description.md`](../phases_tasks_descriptions/P27_phase_description.md). Имена файлов в `Files:` — по разведке 2026-11-04; при расхождении исполнитель уточняет по факту и записывает в Change log. Каталог мест и ключей — в phase description § Каталог.

**Порядок.** CU1 → CU2 → CU3 → CU4 → CU5 → CU6 → CU7 → CU8. CU1 (компонент) и CU2 (словарь) — до экранов. T3 нет: права и инфраструктура не затрагиваются. Документы, ADR-020 и HTML-прототип обновлены в подготовительном шаге фазы, до CU1, вне commit units. Parity: базовые 11 расхождений (P-02…P-28) существовали до P25 — не ухудшать.

## Phase DoR audit (architect spec-gap, 2026-11-04)

- [x] ADR-020; UX-03 D-17, D-19; Lab §5.3; change log §4.1; analytics R-25; shell R-16; UI states D24 — существуют — 2026-11-04 · подготовка P27
- [x] Задачи ниже ссылаются на `§`-якоря, называют Files, Acceptance и Paths; CU ≤ ~400 строк
- [x] `Проверено по`: `@base-ui/react` (`Popover`) — версия по `apps/web/package.json`; Next.js `16.4.4`; новых зависимостей нет; Context7 не вызывался
- [ ] Open questions: Q-1 (формулировки) — черновики в phase description, правка не блокирует; Q-2 (источник «урок 0») закрывается в CU5; Q-3, Q-4 — не блокируют
- [x] Прототип обновлён: `termLabel()` в ключевых местах (см. Change log)

## Commit plan

### P27-CU1 — feat(ui): add term label and term header with visible term and reason variant · Review: reviewer · Commit: auto

Tier T2: общий UI-компонент (клиентский) и ESLint-правило; закрывает D-1.

- [x] P27-T1 · T2 · Spec: [UX-03 D-17, D-19](../../../design/visual_identity_contract.md) · [Lab §5.3](../specs/design_system_lab_spec.md) · ADR-020 §4 п. 1, 3 · [`ui-semantics-a11y`](../../../guidelines/react/ai_component_guidelines.md)
      Files: `apps/web/src/components/ui/{term-hint,term-label,term-header}.tsx` (+ тесты), `apps/web/src/components/teacher/BricksPageSummary.tsx`, `apps/web/src/components/analytics/{AnalyticsKpiMetricHeading,AnalyticsTableTermHeader,RatingTableMetricHeader,RatingPrivacyNote}.tsx`, `apps/web/src/components/teacher/{CheckCard,CheckVerseField,LessonTableFinishCheck}.tsx`, `apps/web/src/components/design-lab/TermHintMatrix.tsx`, `apps/web/src/lib/design-lab/sections.ts`, `apps/web/eslint.config.*`
      Acceptance: `TermLabel` выводит видимое слово (`term`) и значок «?» (`TermHint` внутри); `term` обязателен и непустой (тип + тест); `TermHeader` — `th scope="col"` со словом и значком, popover `side="top"`; вариант `reason` — для неактивных элементов: нажатие/Enter открывает причину, сам элемент остаётся `aria-disabled`, связь `aria-describedby`; `TermHint` экспортируется только для `TermLabel`/`TermHeader`/Lab (ESLint `no-restricted-imports` в `apps/web/src/components/**` и `app/**`, исключение — `components/ui/term-*` и `design-lab`); все существующие вызовы (Bricks, аналитика, рейтинг, проверка ДЗ) переведены на `TermLabel`/`TermHeader`; **D-1:** «К выдаче» видно слева от значка; Lab: состояния «в абзаце», «в таблице», «у правого края», «длинный текст», «reason»
      Paths: H [«К выдаче» + «?» + «: 1057» на `/bricks`] · N [пустой `term` → ошибка типа/теста; длинный текст — перенос; у правого края — влево; в таблице — вверх; открытие второго popover закрывает первый; Esc возвращает фокус на кнопку] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты `term-label`, `term-header`, `BricksPageSummary`; lint запрещает прямой импорт `TermHint` · секция Lab · `npm run parity:check` не хуже базовых 11

### P27-CU2 — feat(i18n): add hint dictionaries per route group with parity tests · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (словарь и чистые функции выбора, вне sensitive zones).

- [x] P27-T2 · T1 · Spec: [copy_and_messages](../../../guidelines/react/copy_and_messages.md) §Срезы словаря · ADR-020 §4 п. 4, 5 · phase description § Каталог и «Черновики текстов»
      Files: `apps/web/src/lib/messages/{ru,en}/{teacher,admin,analytics}.json` (`hints.*`), `apps/web/src/lib/messages/pick-hints-messages.ts` (+ тест), `apps/web/src/lib/messages/{teacher,admin,analytics}-hints-types.ts`, `apps/web/src/lib/messages/hints-dictionary-parity.test.ts`, `apps/web/src/lib/messages/forbidden-terms.test.ts`
      Acceptance: ключи из каталога phase description (≈ 40) добавлены в срез своей группы (`teacher`: `t.*`, `admin`: `a.*`, `analytics`: `n.*`; в JSON — `hints.<ключ>.term` и `hints.<ключ>.hint`); в `common` новых ключей нет; `pickHintsMessages(slice, keys)` возвращает только нужные ключи, типизированные; тест паритета ru/en (одинаковый набор ключей), `hint` ≤ 200 знаков, `term` непустой, нет повторов `term` в разных ключах без причины; тест покрытия: каждый ключ каталога приоритета A существует; `forbidden-terms` по-прежнему зелёный; тексты — из «Черновиков» (правка владельца в Change log)
      Paths: H [ключи доступны серверным компонентам и приходят пропсами в `TermLabel`] · N [отсутствующий ключ → тест падает, а не пустой UI; длинный текст → тест длины; `en` без перевода → тест паритета] · S n/a — тексты

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `hints-dictionary-parity`, `pick-hints-messages`, `forbidden-terms`

### P27-CU3 — feat(web): add hints and fix leftovers on school, lessons, check, bricks, calendar and rating · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (presentational; мутации и права не меняются).

- [x] P27-T3 · T1 · Spec: [teacher flow](../../../prds/01_product_scope/user_flows/users_mvp/teacher_flow.md) · ADR-020 §4 п. 2, 3 · [check flow R-18, R-19](../specs/homework_check_flow_spec.md) · Prototype: `vSchool`, `vLessonTable`, `vBricks`
      Files: `apps/web/src/components/{admin/SchoolPageContent.server,teacher/{TodayLessonCard,LessonCard,LessonRow,LessonsList,LessonForm,CheckCard,CheckVerseField,CheckScoreField,CheckStatusBadge,LessonCheckTable,BricksPageContent.server,BalanceTable,BalanceRow,CalendarLegend,RatingTable}}.tsx` (имена — по факту), `apps/web/src/lib/messages/{ru,en}/teacher.json` и pick/типы, тесты
      Acceptance: `TermHeader`/`TermLabel` по каталогу для `/school` («Регулярно ходят», «Посещаемость», «Средний балл»), `/today` и `/lessons` («Проверено N из M»), `/lessons/new` («Тип урока», «Ведёт»), `/check` (пороги «до 4» / «от 8», шкала 0/1/2, статусы, «Заполнено полей», «Таблица всех оценок»), `/bricks` («Набрано», «Выдано», «Остаток», «Выдать»), `/calendar` («Выезд», «Отмена»), `/rating` («Место»); абзац «1 балл = 1 кирпичик…» над таблицей `/bricks` заменён подсказкой на заголовках (формула остаётся в «Набрано»); **D-3:** подсказка «Выберите ученика в таблице, чтобы открыть журнал.» выводится один раз; **D-19:** список уроков — «4 октября» (`formatDate`) и «проверено 11 из 30»; **D-22:** страница `/lessons/<id>` содержит стихи урока и действия (если нет — исправить, записать в Change log); у «Только для учителей» на `/rating` для admin — «Рейтинг видят учителя и администратор»
      Paths: H [у каждого термина A есть «?»; D-3, D-19] · N [нет данных → «—»; обзорный урок без теста → подсказка про порог скрыта; popover в таблице открывается вверх и не перекрывает заголовок] · S n/a — presentational; права и мутации не меняются

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `LessonsList`, `BricksPageContent`, `CheckCard` (подписи) · `grep` по каталогу приоритета A для teacher-экранов

### P27-CU4 — feat(web): add analytics hints, chart axes from zero and number formatting · Review: reviewer · Commit: auto

Tier T1: логика шкалы графиков и форматирования; общие компоненты графиков — runtime-код, поэтому `reviewer` (явный выбор плана, `Paths: H/N`).

- [x] P27-T4 · T1 · Spec: [analytics R-25, R-23](../specs/analytics_screens_spec.md) · ADR-020 §4 п. 7 · [UX-03 D-18](../../../design/visual_identity_contract.md) · Prototype: `vAnalytics`
      Files: `apps/web/src/components/analytics/{LineChart,BarChart,ChartAxis,DataQualityLine,GroupAnalyticsTables,PupilAnalyticsTable,AnalyticsLessonsTable,YearTotalsTable}.tsx` (имена — по факту), `apps/web/src/lib/analytics/{chart-scale,format-analytics-display}.ts` (+ тесты), `apps/web/src/lib/messages/{ru,en}/analytics.json` и pick/типы
      Acceptance: **D-10:** подписи осей — только `formatNumber` (запятая в ru), ось «Стихи за урок» начинается с нуля, шаг «красивый» (0 / 0,5 / 1 / 1,5 / 2); `TermLabel`/`TermHeader` у «Нет отметки в N записях» (+ ссылка на журнал уроков с фильтром — R-24), у бейджа «низкий балл» (критерий порога), у «Не входят в средние: явка ниже 50%», у «Итоги по годам», у «по 5 урокам» («усреднено по N урокам»), у «Состав: регулярно ходят · ходят редко · …»; в `/analytics` у «Регулярно ходят» остаётся один значок; ключи `n.*` из CU2
      Paths: H [R-25: подсказки; оси без точек и без обрезки нуля] · N [все значения равны → шкала не схлопывается; нет данных → «—»; один урок — одна точка без деления на ноль] · S n/a — отображение

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `chart-scale`, `format-analytics-display`, рендер осей (нет точки как разделителя)

### P27-CU5 — feat(web): remove duplicates and identifiers from audit log and add filter hints · Review: reviewer · Commit: auto

Tier T2: чтение журнала (admin-only), форматирование; хранение и состав записи не меняются; `Paths: S`.

- [ ] P27-T5 · T2 · Contract: [change log §4.1](../contracts/change_log_contract.md) · ADR-020 §4 п. 6 · ADR-019 §4 п. 2 · AZ журнала (admin)
      Files: `apps/web/src/components/admin/{AuditEntryRow,AuditEntryCard,AuditFilters,AuditTechnicalRecord}.tsx`, `apps/web/src/data/audit/{audit-resolve-labels.server,audit-shared.server,map-audit-rows.server,audit-details-format}.ts` (+ тесты), `apps/web/src/lib/messages/{ru,en}/admin.json` (`audit.actions.*`, `audit.details.*`, `hints.a.audit_*`), `apps/web/src/lib/messages/audit-dictionary-parity.test.ts`
      Acceptance: **D-4:** если подпись типа сущности и подпись объекта совпали — одна («Заявка на доступ», «Способ входа»); для «Кирпичики», «Штраф», «Выдача достижения», «Настройки оценивания», «Достижение» добавлен контекст (ученик или группа из `*Id`, имя — после проверки прав); **D-5:** `*Id` и JSON (`verify: {...}`) в основном виде не показываются: ключи `pupilId`, `lessonId` заменяются подписями («Ученик: Борисов Тимофей», «Урок 5»), остальные — скрыты, полный список — только в «Технической записи»; **D-6:** «Кто: Система», действие без префикса «Система:»; **D-7/Q-2:** найти источник «урок 0» в записях «Проверка ДЗ · Удалённый ученик»; в UI — «урок не указан», факт записать в Change log; **D-8:** безымянный администратор — «Администратор (без имени)»; **D-9:** `achievement.catalog_toggled` → «Достижение включено» / «Достижение выключено» по `isActive`; `TermLabel` у «Показать системные», «Тип сущности», «Техническая запись»; парность `audit.actions.*` ru/en сохраняется
      Paths: H [строки читаются без UUID и дублей] · N [нет объекта → тип без «·»; неизвестное поле — скрыто в списке, видно в «Технической записи»; `isActive` отсутствует → нейтральная фраза; длинный JSON не ломает вёрстку] · S [журнал и «Техническая запись» — только admin; имена резолвятся после проверки прав; в основном виде нет данных, которых admin не видит сейчас]

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты `audit-resolve-labels`, `map-audit-rows`, `audit-details-format`, рендер журнала (нет UUID: regex в основной строке)

### P27-CU6 — feat(web): add hints and disambiguate people, users, approvals, deletions and family lists · Review: reviewer · Commit: auto

Tier T2: списки с ПД (имя, email) — только admin; `Paths: S`.

- [ ] P27-T6 · T2 · Spec: [admin flow](../../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md) · ADR-020 §4 п. 2, 7 · AZ-D4 (admin only) · Prototype: `vPeople`, `vApprovals`, `vUsers`
      Files: `apps/web/src/components/admin/{PeoplePageContent.server,PupilRow,LegacyConsentList,ApprovalRow,ApprovalRoleSelect,UsersPageContent.server,UserRow,UserStatusBadge,DeletionRequestCard,FamilyPageContent.server,FamilyRow}.tsx` (имена — по факту), `apps/web/src/data/{people,users,deletions,approvals,family}/*` (+ тесты), `apps/web/src/lib/i18n/relative-day.ts` (+ тест), `apps/web/src/lib/messages/{ru,en}/admin.json`
      Acceptance: `TermLabel`/`TermHeader` по каталогу: `/people` («Без согласия (перенесённые)», один значок «Согласие на бумаге» над списком вместо метки у каждой строки, «Перевести», «Без группы», «Неактивные»), `/approvals` («Роли», «Группы (активный год)», «Версия согласия»), `/users` (статусы, «Нужно: выдать роль»), `/deletions` («Удалим», «Обезличим», «Взять в работу», «Выполнить удаление…»), `/family` («входит» → «может входить», «без аккаунта» → «без входа»); **D-17:** группа выводится один раз (бейдж), метка согласия — только у исключений; **D-15:** одна шкала статусов (Регистрация → Ожидает решения → Активен → Отключён / Отклонён) во вкладках и в строках; у тёзок виден email (admin-only) или роль; «Без имени — Админ» → «Администратор (без имени)»; **D-16:** «Запросил» без имени — роль и email; **D-14:** «Подана сегодня / вчера / N нояб.» считается по поясу школы (`relative-day`); **D-21:** «входит» заменено; тестовые названия не менялись
      Paths: H [подсказки; тёзки различимы; дата подачи верна] · N [нет email → без различителя; около полуночи в поясе школы → «вчера»; пустое имя заявителя → фолбэк; нет согласия у ученика → метка у строки] · S [все экраны — только admin (AZ без изменений); email виден только admin; роль и данные других пользователей не попадают в подсказки]

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты `relative-day`, `PupilRow`, `UserRow`, `DeletionRequestCard`, рендер `/people`

### P27-CU7 — feat(web): add hints and russian time zones to year, settings, profile and groups · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (presentational и списки; валидация пояса, права и мутации не меняются).

- [ ] P27-T7 · T1 · Spec: [forms UX](../../../design/forms_and_validation_ux.md) · ADR-020 §4 п. 2, 8 · Prototype: `vYear`, `vSettings`
      Files: `apps/web/src/components/admin/{YearCard,YearPageContent.server,YearCloseButton,SettingsTimezoneForm,GroupCard}.tsx`, `apps/web/src/components/profile/{ProfileLoginMethods,ProfileForm}.tsx` (имена — по факту), `apps/web/src/lib/i18n/{iana-timezone-options.server,timezone-ru-labels,format-iana-timezone-option-label}.ts` (+ тесты), `apps/web/src/lib/messages/{ru,en}/{admin,common}.json`
      Acceptance: **D-2:** в списке `/settings` нет латинских названий без перевода: ≈ 40 заранее переведённых («Город, Страна (UTC+h)»; порядок — популярные, затем по смещению), остальные IANA-пояса находятся только поиском по русскому названию региона; тест — ни одна подпись списка не содержит латиницы (кроме «UTC»); `TermLabel` у «Часовой пояс школы» (влияние на время уроков), у «Закрыть год» (последствия: только чтение для учителей, нельзя отменить; рядом с кнопкой, диалог подтверждения остаётся), у «15 уроков · 3 группы · 90 учеников» (расшифровка), у «Способы входа» в `/profile`, у «Русский» в `/groups` (язык группы); `/year`: «Причина (необязательно)» — подсказка «Попадёт в журнал»
      Paths: H [D-2: все пояса по-русски; «Закрыть год» объяснён] · N [пояс не найден → «Ничего не найдено»; регион без перевода → не показывается; текущий сохранённый пояс не из списка → остаётся выбранным с подписью «UTC+h»] · S n/a — тексты и списки; валидация пояса и права не меняются

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `timezone-ru-labels`, `format-iana-timezone-option-label`, `YearCloseButton`

### P27-CU8 — feat(web): fix achievements wording and plurals, verse dashes and forbidden role message · Review: reviewer · Commit: auto

Tier T1 с затрагиванием `ForbiddenState` (текст отказа; права не меняются); `Paths: H/N`.

- [ ] P27-T8 · T1 · Spec: [UI states D24](../../../design/ui_states_contract.md) · [typography guideline](../../../guidelines/typography_text_guidelines.md) · ADR-020 §4 п. 7, 9 · Prototype: `vAchievements`
      Files: `apps/web/src/components/{admin/{AchievementsPageContent.server,AchievementRuleCard,AchievementRecalcPanel},achievements/AchievementCatalogRow,patterns/ForbiddenState,teacher/VersesCatalog.client}.tsx` (имена — по факту), `apps/web/src/lib/achievements/format-achievement-rule.ts` (+ тест), `apps/web/src/data/bible/normalize-verse-text.ts` (+ тест), `apps/web/src/lib/messages/{ru,en}/{admin,common,teacher}.json`, `apps/web/src/app/(app)/group/**` (только текст отказа)
      Acceptance: **D-11:** «Сто кирпичиков»: «после 100 баллов» (единица условия берётся из типа достижения: уроки или баллы); **D-12:** склонения через `plural` из `@/lib/i18n/format`: «после 1 урока / 3 уроков / 5 уроков» и «+1 кирпичик / +3 кирпичика / +5 кирпичиков» (фраза уровня «Бронза: после 5 уроков → +5 кирпичиков»); **D-13:** «в три разных дня окна» → «в три разных дня в течение недели»; `TermLabel` у «Накопительно», «Серия», «Пересчитать достижения» (рядом с кнопкой), «Бронза / Серебро / Золото», «Обзорные уроки» (ключи CU2); **D-20:** в тексте стиха «--» → «—» при выводе (`normalize-verse-text`, исходные данные не меняются); `/verses`: у «По книгам / По урокам» подсказка; **D-18:** `ForbiddenState` на `/group` и `/group/points` — «Страница для учителя группы. Вы вошли как администратор» + ссылки «К списку групп», «На главную»; для других ролей — прежний текст
      Paths: H [D-11…D-13, D-18, D-20] · N [0 уроков/кирпичиков → «0 уроков», «+0 кирпичиков»; единица условия не задана → «после N»; текст стиха без «--» без изменений; пользователь без роли → прежний текст отказа] · S [права и `route-table.ts` не менялись; текст отказа не раскрывает данные]

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `format-achievement-rule`, `normalize-verse-text`, `ForbiddenState`

## Verification (phase)

- [ ] Все CU закоммичены; у каждого trace `Review: …`
- [ ] CU1 и CU2 — до CU3–CU8
- [ ] Phase DoD из [`P27_phase_description.md`](../phases_tasks_descriptions/P27_phase_description.md)
- [x] Docs sync, ADR-020 и прототип — подготовительный шаг фазы (до CU1)
- [ ] `grep -rn "TermHint" apps/web/src/components apps/web/src/app` — только `components/ui/term-*` и `design-lab`
- [ ] Повторный прогон аудита (Chrome): ни одного термина приоритета A без подсказки; D-1…D-22 закрыты

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P27_phase_description.md`](../phases_tasks_descriptions/P27_phase_description.md) | DoD, каталог, smoke, тексты |
| [`adr_020_term_hints_everywhere_and_audit_polish.md`](../../../prds/07_governance/adr_020_term_hints_everywhere_and_audit_polish.md) | Решение |
| [`usability_audit_2026-11-04_p26.md`](../../../reports/usability_audit_2026-11-04_p26.md) | Источник находок |
| [`P26_tasks.md`](./P26_tasks.md) | Предыдущая фаза |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-11-04 | v1.0 — Canonical (подготовка P27): CU1–CU8, Phase DoR audit; документы, ADR-020 и прототип обновлены до CU1 |
