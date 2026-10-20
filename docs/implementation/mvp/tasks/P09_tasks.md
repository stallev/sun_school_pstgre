# P09 Tasks — Фиксы соответствия UI прототипу

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-20  
**Волна:** после P08  
**Зависит от:** [`P09_phase_description.md`](../phases_tasks_descriptions/P09_phase_description.md), [`ui_prototype_fidelity_2026-10-20.md`](../audits/ui_prototype_fidelity_2026-10-20.md)  
**Связанные документы:** [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md), [`global_shell_spec.md`](../specs/global_shell_spec.md), [`access_and_registration_spec.md`](../specs/access_and_registration_spec.md), [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md), [`homework_check_flow_spec.md`](../specs/homework_check_flow_spec.md)

---

## Purpose

Закрыть `blocker` и `deviation` аудита 2026-10-20. DoD — [`P09_phase_description.md`](../phases_tasks_descriptions/P09_phase_description.md). Профиль lean: DoR пункты 1–4 и 6.

Кластеры аудита разрезаны по экранам там, где один кластер не укладывается в ~400 строк: дом учителя — три экрана; рейтинг и стихи — два; аналитика — группа, ученик, школа. Класс A и класс B — отдельные CU.

## Phase DoR audit

- [x] Все задачи прошли DoR — 2026-10-20 · architect spec-gap · `P09_phase_description.md`, `P09_tasks.md`, UX-02 §4–§5, `global_shell_spec` §6.2, `access_and_registration_spec` §6, строка P09 в README и `architecture_master_index`
- [x] Open questions связанных документов не блокируют задачи этой фазы

## Commit plan

### P09-CU1 — fix(web): pass message strings to client · Review: reviewer · Commit: auto

- [x] P09-T1 · T3 · Spec: [P09 §4.1](../phases_tasks_descriptions/P09_phase_description.md) · Contract: [homework_check_flow_spec §4](../specs/homework_check_flow_spec.md)
      Files: `apps/web/src/lib/messages/pick-teacher-lesson-messages.server.ts`, `pick-teacher-check-messages.server.ts`, `pick-teacher-roster-messages.server.ts`, `pick-teacher-bricks-messages.server.ts`, `pick-teacher-calendar-messages.server.ts`, клиенты `LessonForm`, `LessonCheckTable`, `CheckScreen`, `RosterTable`, `BalanceTable`, `CalendarEventForm` · Acceptance: учитель на 390, 768 и 1024 открывает `/lessons/new`, `/lessons/[id]/edit`, `/lessons/[id]/table`, `/check`, `/lessons/[id]/check`, `/group`, `/bricks`, `/calendar` без «Something went wrong»; админ так же открывает `/bricks` и `/calendar` на 390 и 1024. В props этих клиентов нет функций: `editTitle`, `finishedProgress`, `selectPupil`, `issueDialogTitle`, `pageSubtitle` приходят строками (Sentry SUN_SCHOOL_POSTGRES_DEV-M, N, 3, 6). Права групп не меняются.
      Paths: H [P09 §4.1] · N [P09 §4.1: нет аргумента шаблона → строка, не граница ошибки] · S [P09 §4.1, AZ-21 / AZ-30 / AZ-32 / AZ-33 / AZ-40 / AZ-42: аноним → `/login`, чужая группа teacher → 404]

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke маршрутов §4.1

### P09-CU2 — fix(i18n): add admin category labels · Review: reviewer · Commit: auto

- [x] P09-T2 · T3 · Spec: [P09 §4.2](../phases_tasks_descriptions/P09_phase_description.md) · Contract: [deletion_requests_contract](../contracts/deletion_requests_contract.md)
      Files: `apps/web/src/lib/messages/en/admin.json`, `apps/web/src/lib/messages/ru/admin.json` · Acceptance: админ на 390, 768 и 1024 открывает `/audit`, `/approvals`, `/users`, `/users/[id]`, `/people`, `/deletions`, `/groups`, `/groups/[id]`, `/year`, `/settings` без «Something went wrong». В en и ru есть ключи категорий `achievement_award`, `penalty`, `recitation_attempt` (Sentry SUN_SCHOOL_POSTGRES_DEV-5). Экранов достижений, штрафов и семьи нет. Teacher на `/users` получает 403.
      Paths: H [P09 §4.2] · N [P09 §4.2: отсутствующий ключ категории больше не роняет эти маршруты] · S [P09 §4.2, AZ-01 / AZ-02 / AZ-07 / AZ-08 / AZ-10 / AZ-12 / AZ-15 / AZ-20: teacher → 403]

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke маршрутов §4.2

### P09-CU3 — fix(ui): align app shell with prototype · Review: diff-only · Commit: auto

- [x] P09-T3 · T1 · Spec: [global_shell_spec §6.1–§6.2](../specs/global_shell_spec.md) · Contract: [UX-02 §4–§5.4](../../../design/responsive_navigation_contract.md)
      Files: `apps/web/src/components/shell/app-shell.tsx`, `nav-drawer.tsx`, `top-nav.tsx`, `shell-navigation.client.tsx`, срезы `messages` навигации · Acceptance: учитель и админ на 390, 768 и 1024 видят бренд «Воскресная школа» только с 1024; ниже — заголовок экрана и «имя · роль». Drawer без видимого «Меню» и без пункта «Профиль»; внизу имя ведёт на `/profile`, рядом «Выйти». В раскрытом topnav у пунктов есть короткие пояснения. Подписи «Заявки на доступ», «Ученики и семьи», «Аналитика групп». Пункта «Достижения и штрафы» и radio роли нет. На `/lessons` при 390 и 768 у «Все уроки» есть `aria-current="page"`. «Something went wrong» нет.
      Paths: H [P09 §4.3] · N n/a — copy/CSS, без мутации · S n/a — набор маршрутов и права UX-02 §5 не меняются

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke оболочки 390 / 768 / 1024

### P09-CU4 — fix(ui): align login copy with prototype · Review: diff-only · Commit: auto

- [x] P09-T4 · T1 · Spec: [access_and_registration_spec §6](../specs/access_and_registration_spec.md)
      Files: `apps/web/src/app/(auth)/login/page.tsx`, срезы `messages` входа · Acceptance: аноним на `/login` при 390, 768 и 1024 видит заголовок «Вход для учителей и родителей», подзаголовок про Telegram без пароля, блок «Вход для администратора» и текст «Пароль нужен только администратору.» Ссылка на согласие есть. При `APP_ENV=dev` есть «Тестовое окружение», в prod её нет. «Something went wrong» нет. Роль родителя не появляется.
      Paths: H [P09 §4.4] · N n/a — copy, проверки входа spec §6 не меняются · S n/a — `signIn` и callbackUrl не меняются

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke `/login` на трёх ширинах

### P09-CU5 — fix(ui): align teacher today · Review: diff-only · Commit: auto

- [x] P09-T5 · T1 · Spec: [P09 §4.5](../phases_tasks_descriptions/P09_phase_description.md) · Contract: [P03 экран `/today`](../phases_tasks_descriptions/P03_phase_description.md)
      Files: `apps/web/src/app/(app)/today/**` · Acceptance: учитель на `/today` при 390, 768 и 1024 видит приветствие, одну залитую «Продолжить проверку», незалитый «Новый урок», дату не в формате ГГГГ-ММ-ДД, без типа «Обычный» и без подписи «Проверка ДЗ», и секцию «На этой неделе». Нет «Кого отметить в классе» и нет «Голосовая практика». «Something went wrong» нет.
      Paths: H [P09 §4.5] · N n/a — copy/CSS, без новой мутации · S n/a — маршрут teacher AZ не меняется

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke `/today`

### P09-CU6 — fix(ui): align lesson list row · Review: diff-only · Commit: auto

- [ ] P09-T6 · T1 · Spec: [P09 §4.6](../phases_tasks_descriptions/P09_phase_description.md) · Contract: [P03 экран `/lessons`](../phases_tasks_descriptions/P03_phase_description.md)
      Files: `apps/web/src/app/(app)/lessons/page.tsx`, строка списка урока · Acceptance: учитель на `/lessons` при 390, 768 и 1024 видит в строке крупную дату, «урок N», стихи и «Проверено n/n». «Something went wrong» нет.
      Paths: H [P09 §4.6] · N n/a — подача уже загруженного списка · S n/a — AZ-32 не меняется

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke `/lessons`

### P09-CU7 — fix(ui): align profile actions · Review: diff-only · Commit: auto

- [ ] P09-T7 · T1 · Spec: [access_and_registration_spec §9](../specs/access_and_registration_spec.md) · Contract: [P09 §4.7](../phases_tasks_descriptions/P09_phase_description.md)
      Files: `apps/web/src/app/profile/**` · Acceptance: учитель на `/profile` при 390, 768 и 1024 видит прежние секции ФИО, согласие, язык, способы входа и удаление. Залита только «Сохранить». «Подключить» не залита. Удаление красное. Заголовок вкладки «Профиль — Воскресная школа». «Something went wrong» нет.
      Paths: H [P09 §4.7] · N n/a — кнопки и title, диалог удаления spec §9 не меняется · S n/a — AZ-05 / AZ-06 не меняются

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke `/profile`

### P09-CU8 — fix(ui): align lesson card · Review: diff-only · Commit: auto

- [ ] P09-T8 · T1 · Spec: [P09 §4.8](../phases_tasks_descriptions/P09_phase_description.md) · Contract: [P03 экран `/lessons/[id]`](../phases_tasks_descriptions/P03_phase_description.md)
      Files: `apps/web/src/app/(app)/lessons/[lessonId]/page.tsx`, карточка урока · Acceptance: учитель на `/lessons/[id]` при 390, 768 и 1024 видит «Урок N · дата» без ГГГГ-ММ-ДД, блоки «Задано» и «Рассказывают», «Сводная таблица», удаление, белую «Правка» и главную «Продолжить проверку» или «Начать проверку». Подписи «Проверка ДЗ» и одного блока «Золотые стихи» нет. «Something went wrong» нет.
      Paths: H [P09 §4.8] · N n/a — состав карточки, мутации урока не меняются · S n/a — AZ-30 / AZ-32 не меняются

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke карточки урока

### P09-CU9 — fix(ui): align rating chrome · Review: diff-only · Commit: auto

- [ ] P09-T9 · T1 · Spec: [P09 §4.9](../phases_tasks_descriptions/P09_phase_description.md) · Contract: [P05 экран `/rating`](../phases_tasks_descriptions/P05_phase_description.md)
      Files: `apps/web/src/app/(app)/rating/**` · Acceptance: учитель на `/rating` при 390, 768 и 1024 видит «Рейтинг группы» и рабочее пояснение. Админ на 390 и 1024 переключает группу чипами, без `select` и «Показать». Колонок «Бонус», «Достижений», «Штрафов» нет. «Something went wrong» нет.
      Paths: H [P09 §4.9] · N n/a — те же данные рейтинга · S n/a — AZ-47 не меняется

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke `/rating` teacher и admin

### P09-CU10 — fix(ui): align verse library · Review: diff-only · Commit: auto

- [ ] P09-T10 · T1 · Spec: [P09 §4.10](../phases_tasks_descriptions/P09_phase_description.md) · Contract: [P03 экран `/verses`](../phases_tasks_descriptions/P03_phase_description.md)
      Files: `apps/web/src/app/(app)/verses/**` · Acceptance: учитель на `/verses` при 390, 768 и 1024 видит подпись библиотеки, поиск и «Добавить стих». Админ на 390 и 1024 видит библиотеку, не выбор группы и «Показать». Ссылка урока без «Урок N · Урок N». В «Пс 22:1» нет `^^`. Пустой поиск даёт «Ничего не найдено». «Добавить стих» открывает существующий выбор диапазона формы урока, без нового endpoint. «Something went wrong» нет.
      Paths: H [P09 §4.10] · N [P09 §4.10: пустой поиск → «Ничего не найдено»] · S n/a — AZ-36, новой записи стиха нет

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke `/verses` teacher и admin

### P09-CU11 — fix(ui): align group analytics layout · Review: diff-only · Commit: auto

- [ ] P09-T11 · T1 · Spec: [analytics_screens_spec §5](../specs/analytics_screens_spec.md) · Contract: [P09 §4.11](../phases_tasks_descriptions/P09_phase_description.md)
      Files: `apps/web/src/app/(app)/analytics/page.tsx`, компоненты аналитики группы · Acceptance: учитель на `/analytics` при 390 не прокручивает страницу по горизонтали; на 390, 768 и 1024 видит «N уроков», чипы периода, «основной выборки», полный состав, графики без четырёх залитых «График», «Кто какие уроки провёл» после года рождения, таблицу «По году рождения» и секцию «Как мы считали». Админ на 390 и 1024 видит чипы группы и строку про удалённые дубли, без `select` + «Показать». «Something went wrong» нет.
      Paths: H [P09 §4.11] · N n/a — те же выборки spec §5 · S n/a — AZ-44 / AZ-45 / AZ-48 не меняются

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke `/analytics` teacher и admin

### P09-CU12 — fix(ui): align pupil card layout · Review: diff-only · Commit: auto

- [ ] P09-T12 · T1 · Spec: [analytics_screens_spec §6](../specs/analytics_screens_spec.md) · Contract: [P09 §4.12](../phases_tasks_descriptions/P09_phase_description.md)
      Files: `apps/web/src/app/(app)/analytics/pupils/[pupilId]/**` · Acceptance: учитель на карточке ученика при 390 не прокручивает страницу по горизонтали. На 390, 768 и 1024 в шапке есть год рождения и «активен»; динамика выше присутствия и графиков; нет плиток «Средняя явка» / «Стихи» вместо ряда показателей; нет трёх залитых «График»; у прошедшей строки есть «Исправить» в существующую правку проверки. Секций «Семья», «Штрафы», «Достижения» нет. «Something went wrong» нет.
      Paths: H [P09 §4.12] · N n/a — переход «Исправить» в существующий маршрут проверки · S n/a — AZ-34 / AZ-45 / AZ-49 не меняются

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke карточки ученика

### P09-CU13 — fix(ui): align school summary · Review: diff-only · Commit: auto

- [ ] P09-T13 · T1 · Spec: [analytics_screens_spec §7](../specs/analytics_screens_spec.md) · Contract: [P09 §4.13](../phases_tasks_descriptions/P09_phase_description.md)
      Files: `apps/web/src/app/(app)/school/**` · Acceptance: админ на `/school` при 390, 768 и 1024 видит график посещаемости групп вместо кнопки «Показать», явку с обычным округлением процентов, без колонки «Ср. тест» и без лишних блоков «Кто какие уроки провёл». «Требует внимания» не подменяет сводку одним пунктом в начале. «Something went wrong» нет.
      Paths: H [P09 §4.13] · N n/a — те же сводки spec §7 · S n/a — AZ-16 не меняется

**CU DoD:** `npm run typecheck` · `npm run lint` · `npm run test` · smoke `/school`

## Verification (phase)

- [ ] Все CU закоммичены; у каждого trace `Review: …`
- [ ] Phase DoD из `P09_phase_description.md`
- [ ] Docs sync — правки UX-02, shell spec и login spec уже в документах фазы

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P09_phase_description.md`](../phases_tasks_descriptions/P09_phase_description.md) | DoD фазы |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, task tiers, commit units |
| [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) §2.3.2a | Пути H / N / S |
