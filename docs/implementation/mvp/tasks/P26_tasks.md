# P26 Tasks — меню предпросмотра, журнал, форматы, остатки экранов, пул БД

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.1  
**Дата:** 2026-11-04  
**Волна:** P26  
**Зависит от:** [`P26_phase_description.md`](../phases_tasks_descriptions/P26_phase_description.md), [`adr_019_view_as_menu_and_db_pool.md`](../../../prds/07_governance/adr_019_view_as_menu_and_db_pool.md), [`usability_audit_2026-11-04.md`](../../../reports/usability_audit_2026-11-04.md), [`sentry_issues_2026-11-04_30m.md`](../../../reports/sentry_issues_2026-11-04_30m.md), [`global_shell_spec.md`](../specs/global_shell_spec.md) §8, R-15, [`change_log_contract.md`](../contracts/change_log_contract.md) §4.1, [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) R-21…R-24, [`homework_check_flow_spec.md`](../specs/homework_check_flow_spec.md) R-19, [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) D-17, D-18, [`ui_states_contract.md`](../../../design/ui_states_contract.md) D23  
**Связанные документы:** [`adr_018_ui_terminology_and_term_hints.md`](../../../prds/07_governance/adr_018_ui_terminology_and_term_hints.md), [`P25_tasks.md`](./P25_tasks.md), [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md) §5.3, [`copy_and_messages.md`](../../../guidelines/react/copy_and_messages.md), [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md), [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md), [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md), [`prototype_class_parity_spec.md`](../specs/prototype_class_parity_spec.md) §7

---

## Purpose

Сделать режим «Смотреть как» полноценным, журнал читаемым, форматы едиными, убрать остатки аудита и снизить риск таймаута пула соединений. DoD — [`P26_phase_description.md`](../phases_tasks_descriptions/P26_phase_description.md). Имена файлов в `Files:` — по разведке 2026-11-04; при расхождении исполнитель уточняет по факту и записывает в Change log.

**Порядок.** CU1 → CU2 → CU3 → CU4 → CU5 → CU6 → CU7 → CU8 → CU9 → CU10. CU4 (форматеры) раньше CU6–CU9. CU1 и CU10 — T3, каждый свой CU. Документы, ADR-019 и HTML-прототип обновлены в подготовительном шаге фазы, до CU1, вне commit units. Parity: базовые 11 расхождений (P-02…P-28) существовали до P25 — не ухудшать.

## Phase DoR audit (architect spec-gap, 2026-11-04)

- [x] ADR-019; shell §8, R-15; change log §4.1; analytics R-21…R-24; check flow R-19; UX-03 D-17, D-18; UI states D23; Lab §5.3 — существуют — 2026-11-04 · подготовка P26
- [x] Задачи ниже ссылаются на `§`-якоря, называют Files, Acceptance и Paths; T3 — свой CU; CU ≤ ~400 строк
- [x] `Проверено по`: `@base-ui/react` (`Popover`) — версия по `apps/web/package.json`; Next.js `16.4.4` (`cookies()`, `cache()`); `@prisma/adapter-pg` / `pg-pool` — по `package.json`; Context7 не вызывался: новых зависимостей нет
- [ ] Open questions: Q-1 (порядок стихов) нужен к CU9, по умолчанию «по книгам Библии»; Q-2 закрыт в CU1 (Change log); Q-3, Q-4 — не блокируют
- [x] Прототип обновлён: «Сегодня» в календаре, «Техническая запись» в журнале, фильтр по группе и «Показать ещё» в «Ученики», «Регулярно ходят: N из M», «Уроки 1, 3», подсказка у правого края

## Commit plan

### P26-CU1 — fix(web): show reachable teacher items and disabled reasons in view-as menu · Review: reviewer · Commit: auto

Tier T3: логика навигации по ролям в оболочке (S — role-scoped; чтение предиката доступа из `@sunschool/policy-edge`); права и `route-table.ts` не меняются.

- [x] P26-T1 · T3 · Spec: [shell §8, R-15](../specs/global_shell_spec.md) · [UI states D23](../../../design/ui_states_contract.md) · ADR-019 §4 п. 1 · AZ без изменений
      Files: `apps/web/src/data/shell/build-shell-nav.server.ts` (+ тест), `apps/web/src/lib/shell/filter-nav-by-route-access.ts` (+ тест), `apps/web/src/components/shell/{sidebar-nav,nav-link-row}.tsx`, `apps/web/src/components/shell/nav-link-row.test.tsx`, `apps/web/src/components/design-lab/ShellMatrix.tsx`, `apps/web/src/lib/messages/{ru,en}/common.json`, `apps/web/src/lib/messages/shell-messages.ts`
      Acceptance: **Q-2:** прочитать, какой источник реально пускает admin на `/today`, `/lessons`, `/check` (`route-table.ts` — `TEACHER`; страничный guard — пускает), и записать вывод в Change log; право admin **не расширять**. Фильтр пунктов предпросмотра различает три состояния: достижим (виден), закрыт реальной ролью (виден **неактивным**: `aria-disabled="true"`, серый текст, подсказка «Нужна роль учителя в группе»; клик не навигирует), нет такого пункта у режима (нет). В режиме «Учитель» у admin видны «Сегодня», «Все уроки», «Проверка ДЗ», «Золотые стихи», «Кирпичики», «Рейтинг», «Календарь», «Аналитика»; «Состав группы» (`/group`, только TEACHER) — неактивен; предикат «достижим» один и тот же для меню и страницы; пустой набор → пояснение P25 остаётся; ключи `shell.nav_disabled_reason` в ru и en; секция Lab `SidebarNav`: активный / неактивный / с подсказкой; тест `build-shell-nav`: набор видимых и неактивных пунктов в режимах admin / teacher для ролей `{ADMIN}`, `{TEACHER}`, `{ADMIN,TEACHER}`
      Paths: H [shell R-15: admin в режиме «Учитель» видит «Сегодня», «Все уроки», «Проверка ДЗ»] · N [`/group` неактивен с причиной; режим вне `APP_ENV=dev` — переключателя нет; повреждённая cookie → реальная роль; клик по неактивному пункту не меняет URL] · S [тест: `view_as` не меняет доступ — admin без TEACHER на `/group` получает отказ реальной роли; меню не раскрывает данные; предикат доступа — чтение, не изменение политики]

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты `build-shell-nav`, `filter-nav-by-route-access`, `nav-link-row` · `npm run parity:check` не хуже базовых 11

### P26-CU2 — feat(web): show audit log in plain language with technical record on demand · Review: reviewer · Commit: auto

Tier T2: чтение журнала (admin-only), форматирование записей; хранение и состав записи не меняются.

- [x] P26-T2 · T2 · Contract: [change log §4, §4.1](../contracts/change_log_contract.md) · ADR-019 §4 п. 2 · AZ журнала (admin)
      Files: `apps/web/src/components/admin/{AuditPageContent.server,AuditTable,AuditEntryRow,AuditEntryCard,AuditTechnicalRecord}.tsx`, `apps/web/src/data/audit/{audit-shared.server,audit-resolve-labels.server,map-audit-rows.server}.ts` (+ тесты), `apps/web/src/lib/messages/{ru,en}/admin.json` (`audit.actions.*`, `audit.entity_types.*`, `audit.details.*`), `apps/web/src/lib/messages/audit-dictionary-parity.test.ts`
      Acceptance: действие — фраза из словаря («Исправил проверку ДЗ», «Подал заявку на доступ», «Система: сохранён снимок аналитики»); значения `audit.actions.*` и `audit.entity_types.*` в `ru` на русском, тест «нет английских значений в `ru`» и паритет с enum сохраняется; инвариант ADR-019 §4 п. 2: `entity_types.seed` — «Начальные данные», `seed.run` — «запущены начальные данные»; сущность — «тип · имя · контекст» (для проверки ДЗ — ученик и урок: «Проверка ДЗ · Иванов Артём · урок 5»), идентификатор — в подсказке/раскрытии, не в основном тексте; детали — список «что изменилось» («Присутствие: да», «Стих 1: 1», «Тетрадь: 9») из `old/new` с подписями полей из словаря, неизвестное поле — код как есть; полный JSON — в `<details>` «Техническая запись» (только admin; в мобильной карточке тоже); записи системы (`seed.run`, `analytics.snapshot_created`) помечены «Система» и скрыты фильтром «Показать системные» по умолчанию; даты — `formatDate`/`formatDateTime`; один компонент на файл, ≤ 140 строк
      Paths: H [читаемый журнал: фраза, имя, список изменений] · N [неизвестное действие / поле → код как есть, страница не падает; нет имени (удалённый ученик) → «Удалённый ученик»; пустые детали → «—»; длинный JSON не ломает вёрстку] · S [журнал и «Техническая запись» — только admin (AZ без изменений); имена резолвятся после проверки прав; в человеческом виде нет данных, которых admin не видит сейчас]

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `audit-resolve-labels`, `map-audit-rows`, `audit-dictionary-parity`, рендер журнала

### P26-CU3 — feat(web): add month title and today button to calendar · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (не T3, без `Paths: S`, вне sensitive zones).

- [x] P26-T3 · T1 · Spec: [teacher flow §4.6](../../../prds/01_product_scope/user_flows/users_mvp/teacher_flow.md) · [canonical routes](../../../design/canonical_routes.md) `/calendar` · Prototype: `vCalendar`
      Files: `apps/web/src/components/teacher/{CalendarPageContent.server,CalendarMonth,CalendarMonthHeader}.tsx`, `apps/web/src/lib/messages/{ru,en}/teacher.json` и pick/типы, тесты
      Acceptance: между стрелками — заголовок месяца «Ноябрь 2026» (`aria-live="polite"`, `h2`); кнопка «Сегодня» ведёт к текущему месяцу (`aria-current` когда уже на нём); стрелки получают `aria-label` с названием месяца («Октябрь», «Декабрь»); месяц — по поясу школы (`getSchoolTimezone`), а не серверному `new Date()`; дни рождения и события не меняются
      Paths: H [заголовок месяца и «Сегодня»] · N [первый и последний месяц года; пустой месяц; невалидный `?month=` → текущий] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тест `CalendarMonthHeader`

### P26-CU4 — feat(i18n): unify number, comparison, progress and date formats · Review: reviewer · Commit: auto

Tier T2: форматеры во многих модулях, DAL школы отдаёт числа, а не строки.

- [ ] P26-T4 · T2 · Spec: [ADR-019 §4 п. 3](../../../prds/07_governance/adr_019_view_as_menu_and_db_pool.md) · [UX-03 D-18](../../../design/visual_identity_contract.md) · [analytics R-23](../specs/analytics_screens_spec.md) · [typography guideline](../../../guidelines/typography_text_guidelines.md)
      Files: `apps/web/src/lib/i18n/format.ts` (+ тест), `apps/web/src/lib/analytics/{format-analytics-display,analytics-metric-copy}.ts`, `apps/web/src/components/analytics/{AnalyticsPeriodKpiSection,PupilAnalyticsKpiSection,format-group-score}.ts(x)`, `apps/web/src/components/analytics/years/{DiffBadge,KpiTiles,PupilClosedYearKpiTiles,format-pupil-year-metric,format-year-metric-value}.ts(x)`, `apps/web/src/data/analytics/load-school-analytics-page.server.ts`, `apps/web/src/components/admin/YearCard.tsx`, `apps/web/src/lib/messages/{ru,en}/{analytics,admin,teacher}.json`, `apps/web/src/lib/format/no-raw-format.test.ts`
      Acceptance: все дробные — через `formatNumber` (запятая в ru); `toFixed(` в `components` и `lib/analytics` отсутствует (grep пуст, тест-страж); `load-school-analytics-page.server.ts` отдаёт числа, форматирует компонент; сравнение лет — один шаблон для явки и остальных метрик («+1% к прошлому году», «+0,1 к прошлому году», «без изменений»; `DiffBadge` берёт знак и единицу из метрики, не из разных строк); прогресс «10 из 30» везде (список уроков вместо «10/30»); даты `YearCard` и заголовков — `formatDate` («1 сент. 2026 — 31 мая 2027»), ISO-даты в UI отсутствуют (тест-страж по regex `\\d{4}-\\d{2}-\\d{2}` в отрисованных значениях компонентов); ключи ru/en в паритете
      Paths: H [R-23: одна форма сравнения; запятая везде; даты русские] · N [`null` → «—»; ноль → «без изменений»; отрицательная разница «−0,1»; en-локаль — точка и английские слова] · S n/a — форматирование отображения

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `format`, `DiffBadge`, `no-raw-format` · grep `toFixed(` и ISO-дат пуст

### P26-CU5 — feat(web): scope consents panel, add group filter and requester name to admin lists · Review: reviewer · Commit: auto

Tier T2: серверный фильтр и пагинация списка, чтение ПД заявителя (admin-only).

- [ ] P26-T5 · T2 · Spec: [forms UX](../../../design/forms_and_validation_ux.md) · [admin flow §4](../../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md) · ADR-019 §4 · AZ-D4 (admin only)
      Files: `apps/web/src/components/admin/{PeoplePageContent.server,PeopleListFilter,PeopleSearch.client,PupilRow,LegacyConsentList,ShowMore}.tsx`, `apps/web/src/lib/people/{parse-people-filter,parse-people-search}.ts` (+ тесты), `apps/web/src/data/people/*`, `apps/web/src/components/admin/DeletionRequestCard.tsx`, `apps/web/src/data/deletions/load-deletion-admin-list.server.ts` (+ тест), `apps/web/src/lib/messages/{ru,en}/admin.json`
      Acceptance: панель «Без согласия (перенесённые)» показывается только на своей вкладке (не над «Все ученики»), на «Все» — счётчик «Без согласия: N» ссылкой; фильтр по группе (`?group=`, значение проверяется по группам активного года), страница по 20 строк + «Показать ещё (N)» (`?page=`); в строке — группа бейджем; подсказка поиска «Введите не меньше двух букв» только при вводе одной буквы, иначе placeholder «Фамилия или имя»; `/deletions`: «Запросил: <ФИО>» всегда с именем (фолбэк «Пользователь без имени»), если запросил не сам субъект — роль; список сортируется по сроку (самый просроченный первым), просроченные — `StatusText` с цветом и словом; `q`, `group`, `page` проходят Zod и не попадают в журнал
      Paths: H [фильтр «Младшая» + «Показать ещё»; «Запросил: Иванова Мария»] · N [неизвестная группа → без фильтра; `page` вне диапазона → последняя; нет результатов → «Никого не нашли»; пустое имя заявителя → фолбэк] · S [`/people` и `/deletions` — только admin (AZ без изменений); `group` проверяется по данным активного года, не доверяется клиенту; имя заявителя — admin-only чтение]

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты `parse-people-filter`, `load-deletion-admin-list`, рендер `/people`

### P26-CU6 — feat(web): remove leftovers from today, lesson and check headers · Review: reviewer · Commit: auto

- [ ] P26-T6 · T1 · Spec: [check flow R-19](../specs/homework_check_flow_spec.md) · [teacher flow `/today`](../../../prds/01_product_scope/user_flows/users_mvp/teacher_flow.md) · Prototype: `vToday`, `vLessonTable`
      Files: `apps/web/src/components/teacher/{TodayLessonCard,LessonCard,LessonCheckTable,LessonCheckPageContent.server,LessonsList,LessonRow}.tsx` (имена — по факту), `apps/web/src/components/achievements/TodayAchievementMarkSection.server.tsx`, `apps/web/src/lib/messages/{ru,en}/teacher.json` и pick/типы, тесты
      Acceptance: заголовок урока без повтора — если `title` равен «Урок N», показывается «Урок 5 · 4 октября» (шаблон `lesson.subtitle` и `LessonCheckTable.tsx:113`); дата — `formatDate`; лишний «x» рядом с «Проверено 10 из 30» на `/today` и странице урока удалён (источник найден в DOM: `checkPartial(...)` / `NumberDisplay` — не `Progress`); в списке уроков — один заголовок «Урок 5» (без строчной «урок 5» над ним), прогресс «10 из 30»; кнопка и страница — «Таблица всех оценок»; колонки сводной таблицы «Стихи / Тест и тетрадь / Баллы»; «Кого отметить в классе» при выключенных достижениях: admin — «Включить в настройках группы» со ссылкой, teacher — «Достижения сейчас не ведутся. Включить может администратор.» (по реальной роли)
      Paths: H [R-19: заголовок без повтора, названия едины] · N [название урока не равно «Урок N» → «Урок 5 · Название»; обзорный урок; нет даты → без хвоста] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `LessonCheckTable`, `TodayLessonCard`

### P26-CU7 — feat(web): finish analytics readability and term hint placement · Review: reviewer · Commit: auto

- [ ] P26-T7 · T1 · Spec: [analytics R-21…R-24](../specs/analytics_screens_spec.md) · [UX-03 D-17](../../../design/visual_identity_contract.md) · Lab: `TermHint` · Prototype: `vAnalytics`
      Files: `apps/web/src/components/analytics/{AnalyticsPeriodKpiSection,YearTotalsTable,PeriodFilter,DataQualityLine,GroupAnalyticsTables,LineChart,BarChart,AnalyticsLessonsTable}.tsx` (имена — по факту), `apps/web/src/components/ui/term-hint.tsx` (+ тест), `apps/web/src/lib/messages/{ru,en}/{analytics,common}.json`, `apps/web/src/lib/messages/pick-glossary-messages.ts`, `apps/web/src/components/design-lab/TermHintMatrix.tsx`
      Acceptance: под «Средняя явка» — «Регулярно ходят: 26 из 30»; `TermHint` у заголовка колонки «Регулярно ходят», «Обычных», «Обзорных», «Запланировано», «Баллы уроков» (ключ `lesson_points` из глоссария), «К выдаче» (кирпичики); один контрол «Период» (год / месяц / даты) вместо пяти (R-22); оси графиков явки — проценты, дробные — запятая (R-23), у карточки ученика ось явки `0%…100%`; «Нет отметки в N записях» — ссылка на журнал уроков с фильтром (R-24); `TermHint`: `aria-label` «Что значит «<термин>»?», у правого края окна раскрывается влево (`align="end"` по расчёту места), не перекрывает заголовок колонки; секция Lab: «у правого края»
      Paths: H [R-21: «Регулярно ходят: 26 из 30»; подсказки у новых заголовков] · N [нет данных → «—»; один год; подсказка у правого края не уходит за окно; Esc закрывает] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `term-hint`, `PeriodFilter`, графики · секция Lab

### P26-CU8 — feat(web): polish year, settings, approvals, groups and rating screens · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (не T3, без `Paths: S`, вне sensitive zones; серверная валидация и права не меняются).

- [ ] P26-T8 · T1 · Spec: [forms UX](../../../design/forms_and_validation_ux.md) · [analytics R-23](../specs/analytics_screens_spec.md) · ADR-019 · Prototype: `vYear`, `vSettings`, `vApprovals`, `vGroups`, `vRating`
      Files: `apps/web/src/components/admin/{YearCard,YearPageContent.server,SettingsTimezoneForm,ApprovalRow,ApprovalRoleSelect,GroupCard}.tsx`, `apps/web/src/lib/i18n/{iana-timezone-options.server,format-iana-timezone-option-label}.ts` (+ тесты), `apps/web/src/data/school/load-groups-admin-list.server.ts`, `apps/web/src/components/teacher/RatingTable.tsx`, `apps/web/src/lib/messages/{ru,en}/{admin,analytics}.json`
      Acceptance: `/year`: одно предупреждение о закрытии (`year.danger_zone_close_lead` **или** `year.close_confirm_description` — второе остаётся в диалоге подтверждения); даты по `formatDate`; закрытые годы без «0 групп · 0 учеников» — «Данные года в архиве» или числа из снимка; форма нового года свёрнута за кнопкой «Создать следующий год»; `/settings`: названия поясов по-русски с регионом («Москва, Россия (UTC+3)»), дубли (две «Москва (UTC+3)») различаются или убираются, популярные пояса (Москва, Киев, Минск, Алматы, Ташкент, Тбилиси, Ереван, Баку) сверху, остальное — по алфавиту; `/approvals`: роль из заявки предвыбрана, итог на кнопке («Одобрить как учителя · Младшая»), «Подана сегодня» вместо «Ожидает 0 дн.»; `/groups`: «Русский» вместо «RU» (`formatGroupLanguageLabel` — из словаря); `/rating`: «(штрафы — post-MVP)» удалено из сноски (`analytics.json:199`), в режиме «Школа» — колонка «Группа»; `TermHint` у «Баллы уроков»
      Paths: H [F-9…F-12: подписи и даты по-русски; один пояс «Москва»] · N [нет группы у ученика → «—»; пояс не найден → «Ничего не найдено»; года без снимка → «в архиве»] · S n/a — тексты и разметка; валидация пояса и права не меняются

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `format-iana-timezone-option-label`, `YearCard`

### P26-CU9 — feat(web): lighten achievements, verses, bricks, users and family pages · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (presentational, вне sensitive zones; действия строк используют существующие мутации).

- [ ] P26-T9 · T1 · Spec: [forms UX](../../../design/forms_and_validation_ux.md) · ADR-019 Q-1 · Prototype: `vAchievements`, `vVerses`, `vBricks`, `vUsers`, `vFamily`
      Files: `apps/web/src/components/admin/{AchievementsPageContent.server,AchievementRuleCard,UsersPageContent.server,UserRow,FamilyPageContent.server}.tsx`, `apps/web/src/components/teacher/{VersesPageContent.server,VersesCatalog.client,BalanceTable,BalanceRow}.tsx`, `apps/web/src/data/bible/bible-data.server.ts`, `apps/web/src/lib/messages/{ru,en}/{admin,teacher}.json`, тесты
      Acceptance: `/achievements`: правило каждого достижения — один короткий абзац, подробности в `details` «Как считается»; уровни «Бронза: после 5 уроков → +5 кирпичиков» (человеческая фраза вместо «Бронза — 5 · +5»); «Ждёт голосовой проверки» → «Появится вместе с голосовой проверкой»; `/verses`: порядок по книгам Библии (Быт, Мф, Мк, Лк, Ин, Рим, Пс, Притч …) + переключатель «по урокам» (Q-1), подпись «Уроки 1, 3» по возрастанию; `/bricks`: «Исправить» в меню «⋯» (`RowActionsMenu`), у «К выдаче: N» — `TermHint`; `/users`: подсказка статуса («Нужно: выдать роль») и основное действие в строке; `/family`: «Учеников без семьи: 97» + пояснение и ссылка «Назначить семью» (массовое действие — вне фазы)
      Paths: H [F-14: страницы короче и понятнее; порядок стихов по Библии] · N [книга вне списка → в конец по алфавиту; пустые уровни; ученик без семьи] · S n/a — presentational; мутации и права не меняются

**CU DoD:** `node scripts/cu-verify.mjs` · тесты порядка стихов, `AchievementRuleCard`

### P26-CU10 — perf(db): reduce app_user reads and pool pressure for serverless · Review: reviewer · Commit: auto

Tier T3: `packages/db` и `lib/auth` — sensitive zones; чтение прав и статуса остаётся на каждый запрос (ADR-002 §5, `auth-security`); `Paths: S`.

- [ ] P26-T10 · T3 · Spec: [ADR-019 §4 п. 4](../../../prds/07_governance/adr_019_view_as_menu_and_db_pool.md) · [`sentry_issues_2026-11-04_30m.md`](../../../reports/sentry_issues_2026-11-04_30m.md) `-2D`, `-11` · [ADR-002 §5](../../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md) · `auth-security`
      Files: `apps/web/src/lib/auth/{require-user,load-session-policy.server}.ts` (+ тесты), `apps/web/src/data/shell/{get-shell-user,build-shell-nav.server,load-shell-banners.server,get-nav-badge-counts.server}.ts`, `apps/web/src/app/(app)/layout.tsx`, `apps/web/src/app/profile/{layout,page}.tsx`, `apps/web/src/data/profile/*`, `packages/db/src/client.ts` (+ тест), `apps/web/src/lib/{db.server,env.server}.ts` (+ тесты)
      Acceptance: **(а)** `loadSessionPolicyContext` использует тот же `cache()` и `select`, что `loadPolicyContext`; тест: один `appUser.findUnique` на запрос при вызове обоих; **(б)** имя пользователя для шапки берётся из того же `select` (без отдельного `getShellUser`-запроса); **(в)** `loadOwnProfile` и `loadOwnDeletionRequest` на `/profile` — параллельно (`Promise.all`) или одним запросом; флаги `appSetting` — один `findMany` вместо двух `findUnique`; **(г)** `packages/db/src/client.ts`: `POOL_MAX` 4 (константа с комментарием — Q-3 ADR-019), `POOL_IDLE_TIMEOUT_MS` ≈ 10 000, `POOL_CONNECTION_TIMEOUT_MS` ≈ 5 000; `getPrisma` — один повтор при ошибке соединения (только `timeout exceeded when trying to connect` / `ECONNRESET`), затем исключение → D22; **(д)** `env.server.ts`: `DATABASE_URL` без `-pooler` в хосте → `console.warn` в dev и ошибка старта в prod (флаг-исключение `ALLOW_DIRECT_DATABASE_URL=1` для миграций и сида, задокументирован в `.env.example`); **(е)** права и статус проверяются на каждый запрос (нет `'use cache'` на auth и shell), число запросов на рендер админской страницы снижено (записать «до / после» в Change log по счётчику Prisma-запросов в тесте); **(ж)** после выката — повторная выборка Sentry за 30 мин (Q-4) и запись в Change log
      Paths: H [`/profile` и админская страница открываются без таймаута; один `SELECT app_user` на запрос] · N [первая попытка соединения не удалась → один повтор → D22; `DATABASE_URL` без `-pooler`: dev warn / prod fail; исключение для миграций; пул занят → ожидание ≤ 5 с, затем ошибка] · S [права и статус читаются из БД на каждый запрос (тест: смена статуса пользователя действует на следующем запросе); `cache()` — только на время запроса; изменения пула не логируют строку подключения; env-проверка не печатает секрет]

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты `require-user` / `load-session-policy` (один запрос), `client` (пул), `env.server` (`-pooler`) · повторная выборка Sentry (Q-4)

## Verification (phase)

- [ ] Все CU закоммичены; у каждого trace `Review: …`
- [ ] CU4 раньше CU6–CU9; CU1 и CU10 — отдельные T3-CU
- [ ] Phase DoD из [`P26_phase_description.md`](../phases_tasks_descriptions/P26_phase_description.md)
- [x] Docs sync, ADR-019 и прототип — подготовительный шаг фазы (до CU1)
- [ ] `grep -rn "toFixed(" apps/web/src/components apps/web/src/lib/analytics` пуст; ISO-дат в UI нет
- [ ] Повторная выборка Sentry после CU10: `-2D` не растёт (Q-4)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P26_phase_description.md`](../phases_tasks_descriptions/P26_phase_description.md) | DoD, smoke, причины проблем |
| [`adr_019_view_as_menu_and_db_pool.md`](../../../prds/07_governance/adr_019_view_as_menu_and_db_pool.md) | Решение |
| [`usability_audit_2026-11-04.md`](../../../reports/usability_audit_2026-11-04.md) | Источник находок |
| [`sentry_issues_2026-11-04_30m.md`](../../../reports/sentry_issues_2026-11-04_30m.md) | Источник по пулу |
| [`P25_tasks.md`](./P25_tasks.md) | Предыдущая фаза |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-11-04 | v1.0 — Canonical (подготовка P26): CU1–CU10, Phase DoR audit; документы, ADR-019 и прототип обновлены до CU1 |
| 2026-11-04 | v1.1 — P26-T2: инвариант русских подписей `seed` / `seed.run` (ADR-019 §4 п. 2) |
| 2026-11-04 | CU1 Q-2: доступ к `/today`, `/lessons`, `/check` у admin — страничный `requireRole(TEACHER, ADMIN)` в `*PageContent.server.tsx`; `canVisitRoutePrefix` для `ACTIVE` не режет по роли; меню — карта page-guard в `filter-nav-by-route-access.ts`, не `route-table.ts` |
