# Sentry: падения группы

Организация в MCP: `agencypartnerdev` (регион `https://de.sentry.io`). Slug `sun_school_postgres_dev` как организация даёт 404; это slug проекта. Префикс short id: `SUN_SCHOOL_POSTGRES_DEV`. Хост: `https://dev-sun-school-pstgre.vercel.app`. Окно: 2026-10-20, выборки 7d и 30d. Новых short id нет.

Стек тот же класс, что у уже известных M, N, 3, 6: «Functions cannot be passed directly to Client Components», кадры только `next-server/app-page-turbo.runtime.prod.js`, кадров приложения нет. Функции не те, что на уроке и проверке (`editTitle`, `finishedProgress`, `tableProgressHeader`). На этих маршрутах каретка стоит на других полях того же приёма: срез словаря с функциями-форматтерами передаётся в клиентский компонент.

`SUN_SCHOOL_POSTGRES_DEV-6` в выборках `/group`, `/bricks`, `/calendar` нет.

## Запросы

- `find_organizations`: доступна только `agencypartnerdev`. Проект: `sun_school_postgres_dev`.
- `search_issues`, 7d и 30d, `url:*\/group* is:unresolved` — одни и те же 2 issue: N и 3.
- `search_issues`, 7d и 30d, `url:*\/bricks* is:unresolved` — M и 3.
- `search_issues`, 7d и 30d, `url:*\/calendar* is:unresolved` — N и 3.
- `search_errors`, 30d, `url:*/group* OR transaction:*/group*` — события N (`POST /group`, объект начинается с `selectAll`) и 3 (culprit `/group`). Точный `transaction` с полным URL хоста за 7d событий не дал: в теге путь относительный.
- `search_errors`, 30d, `url:*\/bricks* OR transaction:*\/bricks*` — события M (`POST /bricks`) и 3 (culprit `/bricks`).
- `search_errors`, 7d, `url:"https://dev-sun-school-pstgre.vercel.app/calendar"` — события N (`POST /calendar`) и 3 (culprit `/calendar`).

## Совпадения

### SUN_SCHOOL_POSTGRES_DEV-N

- **title:** Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".
- **status:** unresolved (escalating). Событий: 127. Пользователей в issue: 0.
- **route:** один issue на два экрана. Последнее событие 2026-10-20T11:38:52Z — `POST /calendar`, environment `dev`, URL `https://dev-sun-school-pstgre.vercel.app/calendar`, `request_path` `/calendar`. Каретка на `pageSubtitle`. Отдельные события того же issue — `POST /group` (превью объекта с `selectAll`, 2026-10-20T11:38:00Z). Стек — только кадры Next на `/var/task/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js`.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-N
- **причина:** тот же класс, другие функции. Календарь: `apps/web/src/app/(app)/calendar/page.tsx` передаёт весь `pickTeacherCalendarMessages` в клиентский `CalendarEventForm`. Первая функция среза — `pageSubtitle` в `apps/web/src/lib/messages/pick-teacher-calendar-messages.server.ts`; форма её не вызывает, но проп всё равно не сериализуется. Группа: `apps/web/src/app/(app)/group/page.tsx` передаёт `pickTeacherRosterMessages` в клиентский `RosterTable`. В срезе функции `selectPupil`, `removeSelected`, `enrolledSince` и `pageSubtitle` (`pick-teacher-roster-messages.server.ts`); таблица вызывает первые три. RSC обрывает рендер, экран падает в «Something went wrong».
- **как фиксить:** на границе сервер→клиент оставить только строки. В `TeacherCalendarMessages` и `TeacherRosterMessages` заменить функции на шаблоны с плейсхолдерами; подстановку делать на сервере до пропса или чистой функцией, которую клиент импортирует сам. `pageSubtitle` для шапки уже вызывается в `page.tsx` и в клиент уходить не должен. Пока функции лежат в объекте `messages`, `CalendarEventForm` и `RosterTable` не смонтируются.

### SUN_SCHOOL_POSTGRES_DEV-M

- **title:** та же ошибка «Functions cannot be passed directly to Client Components…».
- **status:** unresolved (escalating). Событий: 30.
- **route:** `POST /bricks`. Последнее событие 2026-10-20T11:38:16Z, environment `dev`, URL `https://dev-sun-school-pstgre.vercel.app/bricks`, `request_path` `/bricks`. Каретка на `issueDialogTitle`, не на `editTitle`. Стек — те же кадры `app-page-turbo.runtime.prod.js`, кадров приложения нет.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-M
- **причина:** тот же класс. `apps/web/src/app/(app)/bricks/page.tsx` передаёт весь `pickTeacherBricksMessages` в клиентский `BalanceTable`, дальше в `IssueBricksDialog` и `CompensateBricksDialog`. Каретка стоит на `issueDialogTitle`; в том же объекте ещё функции `pageSubtitle`, `ledgerTitle`, `compensateDialogTitle`, `balanceHint` (`pick-teacher-bricks-messages.server.ts`, тип `TeacherBricksMessages`).
- **как фиксить:** в срезе кирпичиков на клиент передавать только строки-шаблоны. `issueDialogTitle(name)`, `compensateDialogTitle`, `ledgerTitle` и `balanceHint` собирать на сервере или импортировать форматтер в клиентском модуле, не замыканием из server-only pick. Исправление `editTitle` на экране урока этот проп не убирает.

### SUN_SCHOOL_POSTGRES_DEV-3

- **title:** An error occurred in the Server Components render. The specific message is omitted in production builds…
- **status:** unresolved (escalating). Событий: 28. Стека нет.
- **route:** клиентский digest тех же падений. Последнее событие 2026-10-20T11:38:49Z — transaction `/calendar`, environment `production` (клиент), URL `https://dev-sun-school-pstgre.vercel.app/calendar`, на несколько секунд раньше серверного N. В той же выборке есть culprit `/group` и `/bricks`.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-3
- **причина:** тот же инцидент, что N и M: браузер показывает скрытое падение Server Components. Это экран «Something went wrong» / «Try again». Отдельной клиентской причины в кадре нет.
- **как фиксить:** исправление срезов календаря, группы и кирпичиков убирает и этот digest. Отдельного фикса для issue 3 нет.
