# P25 Tasks — понятный интерфейс: термины, подсказки, форматы, устойчивые страницы

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.1  
**Дата:** 2026-11-03  
**Волна:** P25  
**Зависит от:** [`sentry_issues_2026-11-03_30m.md`](../../../reports/sentry_issues_2026-11-03_30m.md), [`P25_phase_description.md`](../phases_tasks_descriptions/P25_phase_description.md), [`adr_018_ui_terminology_and_term_hints.md`](../../../prds/07_governance/adr_018_ui_terminology_and_term_hints.md), [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) §3.1, R-17…R-20, [`homework_check_flow_spec.md`](../specs/homework_check_flow_spec.md) R-18, [`global_shell_spec.md`](../specs/global_shell_spec.md) §8, R-14, [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) D-17, D-18, [`ui_states_contract.md`](../../../design/ui_states_contract.md) D22  
**Связанные документы:** [`usability_audit_2026-11-03.md`](../../../reports/usability_audit_2026-11-03.md), [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md) §5.3, [`copy_and_messages.md`](../../../guidelines/react/copy_and_messages.md), [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md), [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md), [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md), [`prototype_class_parity_spec.md`](../specs/prototype_class_parity_spec.md) §7

---

## Purpose

Починить страницы, падающие на стенде, исправить формат «Явка», заменить язык аналитика на язык учителя, ввести `TermHint` и единые форматы, упростить рабочие экраны и сделать надёжным режим «Смотреть как». DoD — [`P25_phase_description.md`](../phases_tasks_descriptions/P25_phase_description.md).

**Порядок.** CU1 → CU2 → CU3 → CU4 → CU5 → CU6 → CU7 → CU8 → CU9. CU3 (ключи словаря, форматтеры) раньше CU4–CU8; CU4 (`TermHint`) раньше CU5–CU8. Документы, HTML-прототип и ADR-018 обновлены в подготовительном шаге фазы, до CU1, вне commit units. Строки parity не менялись (11 расхождений P-02…P-28 существовали до P25).

## Phase DoR audit (architect spec-gap, 2026-11-03)

- [x] ADR-018; analytics spec §3.1, R-17…R-20; check flow R-18; shell §8, R-14; UX-03 D-17, D-18; UI states D22; Lab §5.3 (`TermHint`); copy guideline (стоп-слова) — существуют — 2026-11-03 · подготовка P25
- [x] Задачи ниже ссылаются на `§`-якоря, называют Files, Acceptance и Paths; T3 — свой CU; CU ≤ ~400 строк
- [x] `Проверено по`: `@base-ui/react` (`Popover`, используется в `ui/score-cell.tsx`) — версия по `apps/web/package.json`; Next.js `16.4.4` (`cookies()`); Context7 не вызывался: новых зависимостей нет
- [x] Open questions: Q-1 (причина падений) закрыт по Sentry 2026-11-03; Q-2, Q-3 — не блокируют (предложения по умолчанию в фазе); Q-4 — выборка Sentry после CU1
- [x] Прототип обновлён: `termHint()`, «регулярно ходят», «из 10», «% к прошлому году», сворачиваемый «Как мы считали», поиск учеников, подписи проверки ДЗ

## Commit plan

### P25-CU1 — fix(web): restore lessons, bricks, calendar and audit pages · Review: reviewer · Commit: auto

Tier T2: исправление серверного рендера четырёх маршрутов (Paths H · N); права и данные не меняются. Причины установлены по Sentry ([`sentry_issues_2026-11-03_30m.md`](../../../reports/sentry_issues_2026-11-03_30m.md)): `-1Y` / `-2C` (135 событий) — функции в props клиентского компонента; `-Q` — отсутствует ключ словаря; `-3` — клиентское эхо; `-2D` — наблюдение, вне CU.

- [x] P25-T1 · T2 · Spec: [ui states D22](../../../design/ui_states_contract.md) · ADR-018 §4 п. 7 · [`ui-messages-bundle-splitting`](../../../guidelines/react/copy_and_messages.md) §Срезы словаря · [canonical routes](../../../design/canonical_routes.md) `/calendar`, `/bricks`, `/audit`, `/lessons`
      Files: `apps/web/src/components/teacher/LessonsGradeFilter.tsx` (+ тест), `apps/web/src/components/teacher/{BricksPageContent.server,LessonsPageContent.server,CalendarPageContent.server}.tsx`, `apps/web/src/lib/messages/pick-teacher-lesson-screens-messages.server.ts`, `apps/web/src/lib/messages/teacher-lesson-screens-messages.ts`, `apps/web/src/lib/messages/assert-serializable-messages.ts` (+ тест), `apps/web/src/components/admin/AuditPageContent.server.tsx`, `apps/web/src/data/audit/audit-resolve-labels.server.ts`, `apps/web/src/lib/messages/{ru,en}/admin.json`, `apps/web/src/lib/messages/audit-dictionary-parity.test.ts`, `apps/web/src/app/(app)/error.tsx`, `apps/web/src/components/patterns/ErrorState.tsx`, `apps/web/src/lib/messages/{ru,en}/common.json`
      Acceptance: **(а) `-1Y`, `-2C`:** `LessonsGradeFilter` принимает только `gradeFilterLabel` и `gradeFilterApply` (строки), а не объект `TeacherLessonScreensMessages`; три вызова (`/bricks` `lessonMessages`, `/lessons` `messages`, `/calendar` `listMessages`) передают две строки; ни один `"use client"`-компонент не получает prop с функциями (grep по `messages=` у клиентских компонентов; `assertSerializableMessages` вызывается на срезах, уходящих на клиент, и покрыт тестом с функцией в значении → ошибка); страницы открываются при `isAdmin && grades.length > 1` (в т. ч. `POST` обновления RSC). **(б) `-Q`:** в `ru/admin.json` и `en/admin.json` добавлены `audit.entity_types.{achievement_award, achievement, achievement_suggestion, penalty, family, family_adult, weekly_digest}`; подписи фильтра `/audit` собираются через `safeAdminMessage(...) ?? type` (как `audit-resolve-labels.server.ts`), а не через бросающий `getMessage`; тест `audit-dictionary-parity.test.ts`: каждое значение `AUDIT_ENTITY_TYPE` (и `AUDIT_ACTION`) имеет подпись в ru и en. **(в)** страница ошибки по D22: «Не удалось открыть страницу», «Повторить», «На главную», digest виден только admin. **(г)** регрессионный тест рендера страницы журнала со всеми значениями `AUDIT_ENTITY_TYPE`. **(д) Q-4:** после выката повторить выборку Sentry `lastSeen:-30m` по проекту `sun_school_postgres_dev` и записать в Change log: `-1Y`, `-2C`, `-Q`, `-3` не растут; повтор `-2D` (таймаут пула) — отдельной задачей, не в этом CU
      Paths: H [D22: `/lessons`, `/bricks`, `/calendar`, `/audit` открываются под admin и teacher, фильтр по классам работает] · N [`grades.length ≤ 1` — фильтра нет; новое значение `AUDIT_ENTITY_TYPE` без подписи → фильтр показывает код типа, страница не падает; функция в props клиентского компонента → тест `assertSerializableMessages` падает до выката; digest скрыт для teacher] · S n/a — права и DTO не меняются; stack trace и digest не попадают в ответ teacher

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `LessonsGradeFilter`, `assert-serializable-messages`, `audit-dictionary-parity`, рендер журнала · grep: нет функций в props клиентских `messages` · повторная выборка Sentry (Q-4)

### P25-CU2 — fix(web): show attendance as a percentage in all analytics tables · Review: reviewer · Commit: auto

- [x] P25-T2 · T1 · Spec: [analytics §3.1, R-18](../specs/analytics_screens_spec.md) · ADR-018 §4 п. 3
      Files: `apps/web/src/lib/analytics/format-analytics-display.ts` (+ `format-analytics-display.test.ts`), `apps/web/src/components/analytics/{GroupAnalyticsTables,PupilLayerCards}.tsx`, `apps/web/src/lib/analytics/build-birth-year-cohort-rows.ts` (+ тест), `apps/web/src/data/analytics/{analytics-compute,get-pupil-analytics}.server.ts` (только если выбрана конвертация в DAL)
      Acceptance: доля 0–1 из домена выводится одним форматтером как целый процент (`1 → 100%`, `0.8 → 80%`, `0.5 → 50%`, `0.256 → 26%`), `null`/`NaN` → «—»; верхний KPI и таблицы совпадают; колонка «Явка» когорт по году рождения — тот же формат; `attendanceRate` в домене не меняется; тест форматтера и таблиц; другие потребители `formatAnalyticsPercent` проверены grep
      Paths: H [R-18: `80%` в таблицах учеников, групп, когорт] · N [`null` → «—»; 0 → `0%`; 1 → `100%`; округление] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `format-analytics-display`, `build-birth-year-cohort-rows`

### P25-CU3 — feat(i18n): replace analyst jargon with plain terms and unify formats · Review: reviewer · Commit: auto

Tier T2: словари ru/en во всех срезах, захардкоженный текст в JSX, форматы дат и чисел.

- [x] P25-T3 · T2 · Spec: [ADR-018 §4 п. 1, 3, 5](../../../prds/07_governance/adr_018_ui_terminology_and_term_hints.md) · [analytics §3.1, R-17](../specs/analytics_screens_spec.md) · [copy guideline](../../../guidelines/react/copy_and_messages.md)
      Files: `apps/web/src/lib/messages/{ru,en}/{analytics,admin,teacher,common}.json`, `apps/web/src/lib/messages/pick-analytics-messages.ts`, `apps/web/src/components/analytics/{AnalyticsPeriodKpiSection,PupilAnalyticsKpiSection}.tsx`, `apps/web/src/components/admin/ApprovalRow.tsx`, `apps/web/src/lib/i18n/format.ts` (+ тест), `apps/web/src/lib/messages/forbidden-terms.test.ts`
      Acceptance: названия по ADR-018 §4 п. 1 («регулярно ходят», «ходят редко», «26 детей», «+1% к прошлому году», «Был на уроках», «Проверка последнего урока», «Часовой пояс школы», «Кто лидирует и кому нужна помощь»); `N=` убран из JSX и словаря (`kpi.with_n` → «{count} детей»); `diffPointsUnit` удалён; `ApprovalRow` использует `formatDate` (локаль, «4 окт. 2026»), `toLocaleDateString()` без локали — grep пуст; десятичные в ru через `formatNumber` (запятая); тест `forbidden-terms.test.ts` ловит `выборка`, `N=`, `п. п.`, `IANA`, `ADR`, `LEGACY`, `DTO` в `ru/*.json` (и `sample`, `N=`, `IANA`, `ADR` в `en`), исключения — с причиной; паритет ключей ru/en
      Paths: H [стоп-слов в словаре нет; даты и десятичные в одном формате] · N [en-строки по тем же ключам; множественные числа («1 ребёнок», «2 ребёнка», «5 детей»); пустое значение → «—»] · S n/a — тексты, без данных

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `forbidden-terms`, `format`, паритет словарей · grep `N=` в `apps/web/src/components` пуст

### P25-CU4 — feat(ui): add TermHint popover and glossary · Review: reviewer · Commit: auto

Tier T2: новый примитив каталога (Lab раньше экранов, C-2).

- [x] P25-T4 · T2 · Spec: [UX-03 D-17](../../../design/visual_identity_contract.md) · [Lab §5.3 `TermHint`](../specs/design_system_lab_spec.md) · ADR-018 §4 п. 2 · Prototype: `termHint()`
      Files: `apps/web/src/components/ui/term-hint.tsx`, `apps/web/src/components/ui/term-hint.test.tsx`, `apps/web/src/lib/messages/{ru,en}/common.json` (`glossary.*`), `apps/web/src/lib/messages/pick-glossary-messages.ts`, `apps/web/src/components/design-lab/TermHintMatrix.tsx`, `apps/web/src/lib/design-lab/sections.ts`
      Acceptance: кнопка `CircleHelp` с `aria-label` = термин, `aria-expanded`, `aria-controls`; popover на `@base-ui/react/popover`: открытие по клику / Enter / Space, закрытие Esc и кликом вне, фокус возвращается на кнопку; область касания ≥ 44 px на < `md`; текст ≤ 200 знаков (тест длины словаря глоссария); `motion-reduce` без анимации; без hex; глоссарий: «регулярно ходят», «явка», «стихи за урок», «тест», «тетрадь», «обзорный урок», «кирпичики», «спевка / пел вместе с хором», «бонус», «серия»; секция Lab: закрыт / открыт / длинный текст / фокус; один компонент на файл, ≤ 140 строк
      Paths: H [D-17: «?» раскрывает определение клавиатурой и мышью] · N [Esc; клик вне; длинный термин переносится; два подсказки подряд — открыта одна; касание] · S n/a — presentational, тексты без ПД

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `term-hint` и длины глоссария · секция Lab `termHint`

### P25-CU5 — feat(web): make analytics screens readable at first glance · Review: reviewer · Commit: auto

- [ ] P25-T5 · T1 · Spec: [analytics §3.1, §5, §8, R-17, R-19, R-20](../specs/analytics_screens_spec.md) · Prototype: `vAnalytics`, `vSchool`, `vPupil` · Lab: `TermHint`
      Files: `apps/web/src/components/analytics/{AnalyticsPeriodKpiSection,PupilAnalyticsKpiSection,GroupAnalyticsTables,MethodologyNote,DataQualityLine,CompositionLine}.tsx`, `apps/web/src/components/admin/SchoolAnalyticsTable.tsx`, `apps/web/src/lib/messages/{ru,en}/analytics.json` и pick/типы, `apps/web/src/components/analytics/*.test.tsx`
      Acceptance: три крупных числа с подписью («Явка 86%», «Стихов за урок», «Тест из 10», «Тетрадь из 10») и базой («26 детей»); `TermHint` у «Средняя явка», «Стихов за урок», «Тест», «Тетрадь»; «Как мы считали цифры» — свёрнутый `details`; строка состава — «Регулярно ходят 26 · Ходят редко 4 · …»; «Качество данных» — «Нет отметки в N записях проверенных уроков» + ссылка к уроку, диагностика переноса только admin; таблица `/school`: «Регулярно ходят / всего», «Проверка последнего урока»; блок «По году рождения» скрыт при одной строке; таблица учеников сортируется по колонке, строки «явка < 50%» и «оценка < 4» отмечены текстом и цветом
      Paths: H [R-17, R-20: экран понятен без чтения сносок] · N [нет данных → «—»; один год рождения; нет тестов; admin и teacher видят разный блок качества данных] · S n/a — presentational, DTO не меняются

**CU DoD:** `node scripts/cu-verify.mjs` · тесты компонентов аналитики · `npm run parity:check` не хуже базовых 11

### P25-CU6 — feat(web): clarify homework check and today screens · Review: reviewer · Commit: auto

- [ ] P25-T6 · T1 · Spec: [check flow §5.2–§5.3, R-18](../specs/homework_check_flow_spec.md) · [shell/teacher flow `/today`](../../../prds/01_product_scope/user_flows/users_mvp/teacher_flow.md) · Prototype: `vCheck`, `vToday`
      Files: `apps/web/src/components/teacher/{CheckCard,CheckScoresSection,CheckVerseField,CheckPupilList,CheckBottomBar,TodayPageContent.server,TodayLessonCard,TodayTeachingAlerts}.tsx` (имена — по факту), `apps/web/src/components/achievements/TodayAchievementMarkSection.server.tsx`, `apps/web/src/lib/messages/{ru,en}/teacher.json` и pick/типы, тесты компонентов
      Acceptance: «Пел вместе с хором» + `TermHint` (бывш. «Спевка»); «Не отвечал» (`aria-label` «Не оценивалось»); «Заполнено полей: K из N»; `TermHint` у шкалы стиха; при «Не был» поля оценок подписаны «Сдаст позже»; «Таблица всех оценок» и «Печатная ведомость»; статус «Сохранено» / «Не сохранено»; `/today`: приветствие без имени — «Добрый вечер!»; заголовок урока без дубля («Урок 5 · 4 октября»); лишний «x» устранён; блок «Кого отметить в классе» при выключенных достижениях скрыт для teacher или говорит «Достижения сейчас не ведутся. Включить может администратор»; «Сдали позже» — строка со ссылкой «Внести оценку», склонение по полу; состояние в `useSequentialCheck` и права не меняются
      Paths: H [R-18: подписи понятны без пояснений] · N [нет имени → без запятой; обзорный урок; «Не был» без `late`; ученик без пола в склонении] · S n/a — presentational

**CU DoD:** `node scripts/cu-verify.mjs` · тесты `check-scores-section`, `today` · `npm run parity:check` не хуже базовых 11

### P25-CU7 — feat(web): add pupil search and row action menu, role choice on approvals · Review: reviewer · Commit: auto

Tier T2: серверный параметр поиска, новое меню действий строки, изменение формы заявки.

- [ ] P25-T7 · T2 · Spec: [forms UX](../../../design/forms_and_validation_ux.md) · [admin flow §4.5](../../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md) · AZ-D4 · Prototype: `vPeople`
      Files: `apps/web/src/components/admin/{PeoplePageContent.server,PeopleSearch.client,PeopleListFilter,PupilRow,PupilRowActions.client,ApprovalRow,ApprovalRoleSelect}.tsx`, `apps/web/src/components/ui/row-actions-menu.tsx` (+ тест), `apps/web/src/components/design-lab/RowActionsMenuMatrix.tsx`, `apps/web/src/lib/people/parse-people-search.ts` (+ тест), `apps/web/src/lib/messages/{ru,en}/admin.json`
      Acceptance: `/people?q=` — поиск по ФИО (регистронезависимый, ≥ 2 знаков) в серверном запросе в рамках прав admin; поле «Найти ученика» с debounce; «Никого не нашли»; в строке — одно главное действие (по состоянию: «Зачислить», «Перевести» или «Изменить»), остальное в меню «⋯» (`aria-haspopup`, фокус, Esc); «Исключить» и «Запрос на удаление…» — в меню, красные, через `ConfirmDialog`; «Бумажное согласие» → «Отметить, что согласие получено»; форма «Новый ученик» — в диалоге «+ Добавить ученика»; в карточке заявки выбор роли (по умолчанию из заявки), «Одобрить» выдаёт выбранную; секция Lab «Меню действий строки»
      Paths: H [поиск «Иванов» → только однофамильцы; одобрение с выбором роли] · N [запрос < 2 знаков; нет результатов; спецсимволы в `q` экранируются; «Исключить» без подтверждения невозможно] · S [поиск и список — только для admin по существующей политике; `q` валидируется Zod и не попадает в журнал; выданная роль проверяется на сервере из допустимого набора (`USER_ROLE`)]

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты `parse-people-search`, `row-actions-menu`, одобрения с ролью

### P25-CU8 — feat(web): simplify rating, groups, settings and year screens · Review: diff-only · Commit: auto

Review `diff-only`: профиль `lean` D6 (не T3, без `Paths: S`, вне sensitive zones; `settings` — только UI-выбор пояса, серверная валидация не меняется).

- [ ] P25-T8 · T1 · Spec: [analytics R-17](../specs/analytics_screens_spec.md) · ADR-018 §4 п. 1, 3 · Prototype: `vRating`, `vGroups`, `vSettings`, `vYear`
      Files: `apps/web/src/components/teacher/RatingTable.tsx`, `apps/web/src/components/admin/{GroupsList,GroupSettingsForm,SettingsTimezoneForm,YearPageContent.server}.tsx` (имена — по факту), `apps/web/src/lib/i18n/iana-timezone-options.server.ts`, `apps/web/src/lib/messages/{ru,en}/{teacher,admin,analytics}.json`, тесты
      Acceptance: рейтинг — колонки «Бонус / Достижения / Штрафы» скрыты, пока функция выключена в группе, колонка «Группа» при режиме «Школа»; «Баллы уроков» с `TermHint`; предупреждение о приватности — значок «Только для учителей» + подсказка; группы: «Русский · 6–8 лет · 1 учитель»; на странице группы «Включить достижения» и «Настроить баллы» названы по-разному; подпись «Стихов за урок» вместо «Укажите число стихов от 0 до 10» и пояснение «Дней на заучивание»; настройки: «Часовой пояс школы», поиск «Найти город или пояс», варианты «Москва (UTC+3)», кнопки неактивны без изменений; год: сводка («5 уроков · 3 группы · 100 учеников»), зона «Опасные действия» с описанием последствий закрытия
      Paths: H [R-17: подписи понятны; пояс выбирается по названию города] · N [достижения выключены → пустых колонок нет; пояс не найден; закрытие года — последствия показаны до подтверждения] · S n/a — тексты и разметка; серверная валидация пояса и права не меняются

**CU DoD:** `node scripts/cu-verify.mjs` · тесты изменённых компонентов

### P25-CU9 — feat(auth): persist view-as mode and show only reachable menu items · Review: reviewer · Commit: auto

Tier T3: cookie режима предпросмотра и фильтрация меню по реальным правам (sensitive zone `**/auth/**`, shell); права и DTO не меняются (S-проверка отсутствия повышения).

- [ ] P25-T9 · T3 · Spec: [shell §8, R-14](../specs/global_shell_spec.md) · ADR-018 §4 п. 6 · [authorization matrix](../../../prds/04_authorization_privacy/authorization_matrix.md) · UX-02 §7
      Files: `apps/web/src/lib/shell/view-as-cookie.ts` (+ `view-as-cookie.test.ts`), `apps/web/src/components/shell/{shell-header.client,dev-role-switcher,user-menu,ViewAsBadge}.tsx`, `apps/web/src/data/shell/build-shell-nav.server.ts` (+ тест), `apps/web/src/app/(app)/layout.tsx`, `apps/web/src/lib/messages/{ru,en}/common.json`, тесты оболочки
      Acceptance: выбор режима пишет cookie `view_as` (`admin` | `teacher`; `Path=/`, `Max-Age=2592000`, `SameSite=Lax`) и делает `router.refresh()`; layout читает cookie через `cookies()` (как `sidebar_collapsed`), значение проходит через type guard, всё иное → реальная роль; переключатель виден только `APP_ENV=dev` и реальной роли admin (как сейчас), в prod не рендерится; в шапке при режиме ≠ реальной роли — бейдж «Режим: учитель»; `previewNavItems` фильтруются так, что остаются только пункты, на маршруты которых реальная роль имеет доступ (например `/group` исключён для admin без `TEACHER`); если пунктов нет — пояснение «Для режима учителя назначьте себя на группу»; серверные проверки доступа не читают `view_as`
      Paths: H [выбрать «Учитель», перезагрузить — режим и бейдж сохранены] · N [cookie повреждена / неизвестное значение → реальная роль; режим без доступных пунктов → пояснение; prod → переключателя нет; teacher (не admin) переключателя не видит] · S [тест: при любом значении `view_as` `requireRole` и `canAccess` решают по реальной роли — admin без TEACHER по-прежнему получает отказ на `/group`; cookie без ПД; бейдж и подпись не раскрывают данных; в prod-сборке нет строки `dev-role-switcher`]

**CU DoD:** `node scripts/cu-verify.mjs --full` · тесты `view-as-cookie`, `build-shell-nav`, доступ при `view_as` ≠ реальной роли

## Verification (phase)

- [ ] Все CU закоммичены; у каждого trace `Review: …`
- [ ] CU3 раньше CU4–CU8; CU4 раньше CU5–CU8
- [ ] Phase DoD из [`P25_phase_description.md`](../phases_tasks_descriptions/P25_phase_description.md)
- [x] Docs sync, ADR-018 и прототип — подготовительный шаг фазы (до CU1)
- [ ] `grep -ri "основная выборка" apps/web/src/lib/messages` пуст; `N=` в JSX нет

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P25_phase_description.md`](../phases_tasks_descriptions/P25_phase_description.md) | DoD, smoke, причины проблем |
| [`adr_018_ui_terminology_and_term_hints.md`](../../../prds/07_governance/adr_018_ui_terminology_and_term_hints.md) | Решение |
| [`usability_audit_2026-11-03.md`](../../../reports/usability_audit_2026-11-03.md) | Источник находок |
| [`sentry_issues_2026-11-03_30m.md`](../../../reports/sentry_issues_2026-11-03_30m.md) | Причины падений CU1 |
| [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) | Аналитика |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-11-03 | v1.0 — Canonical (подготовка P25): CU1–CU9, Phase DoR audit; документы, ADR-018 и прототип обновлены до CU1 |
| 2026-11-03 | v1.1 — отчёт Sentry ([`sentry_issues_2026-11-03_30m.md`](../../../reports/sentry_issues_2026-11-03_30m.md)): CU1 переписан по установленным причинам (функции в props `LessonsGradeFilter`, нет ключей `audit.entity_types.*`), добавлены стражи и повторная выборка Sentry; DoR: Q-1 закрыт |
