# Sentry: падения проверки

Организация в MCP: `agencypartnerdev` (регион `https://de.sentry.io`). Slug `sun_school_postgres_dev` как организация даёт 404; это slug проекта. Префикс short id: `SUN_SCHOOL_POSTGRES_DEV`. Окно: 2026-10-20, выборки 7d и 30d.

## Запросы

- `search_issues`, проект `sun_school_postgres_dev`, 7d: `url:*check* lastSeen:-7d` — 3 issue.
- `search_issues`, 30d: `transaction:*check* lastSeen:-30d` — те же 3 issue.
- `search_issues`, 30d: фраза «Something went wrong» не стала фильтром (Sentry оставил только `lastSeen:-30d`) и вернула 21 issue по проекту. К маршруту проверки относятся только N, 3 и 6. `SUN_SCHOOL_POSTGRES_DEV-1` — Auth.js `invalidcheck` на `GET /api/auth/[...nextauth]`, к экрану проверки ДЗ не относится.
- `search_errors`, 7d, `url:*dev-sun-school-pstgre.vercel.app*check*` — события только N и 3, URL `/lessons/54faf739-a89a-5a1e-b6d6-da3e8f6520a8/check`. Отдельного issue на `GET /check` нет: `/check` при уроке делает redirect на этот маршрут.

## Совпадения

### SUN_SCHOOL_POSTGRES_DEV-N

- **title:** Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".
- **status:** unresolved (escalating). Событий за окно: 108 (84 — `POST /lessons/[lessonId]/check`, 24 — `POST /lessons/[lessonId]/table`, 4 — `POST /group`).
- **route:** `POST /lessons/[lessonId]/check`. Последнее событие 2026-10-20T11:29:52Z, environment `dev`, хост деплоя, тот же урок. Стек — только кадры `next-server/app-page-turbo.runtime.prod.js` (`/var/task/node_modules/next/...`), кадров приложения нет. В тексте ошибки каретка на `finishedProgress`.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-N
- **причина:** тот же стек, что уже известен для `finishedProgress` (и соседний `editTitle` на других экранах). На проверке серверная страница `apps/web/src/app/(app)/lessons/[lessonId]/check/page.tsx` собирает `pickTeacherCheckMessages` и передаёт объект в клиентский `CheckScreen`. В объекте есть функции (`finishedProgress` и другие) из `apps/web/src/lib/messages/pick-teacher-check-messages.server.ts`. RSC такой объект не сериализует, рендер падает, пользователь видит «Something went wrong».
- **как фиксить:** в `pick-teacher-check-messages.server.ts` и типе `TeacherCheckMessages` оставить на границе сервер→клиент только строки (шаблоны с плейсхолдерами). Форматирование (`finishedProgress` и остальные функции среза) вызывать на сервере до пропса либо чистой функцией, которую клиент импортирует сам, а не получает замыканием с сервера. Пока функции лежат в объекте `messages`, `CheckScreen` не смонтируется.

### SUN_SCHOOL_POSTGRES_DEV-3

- **title:** An error occurred in the Server Components render. The specific message is omitted in production builds…
- **status:** unresolved (escalating). Событий: 18.
- **route:** `/lessons/:lessonId/check`. Последнее событие 2026-10-20T11:29:50Z, environment `production` (клиент), тот же URL деплоя и тот же урок, на 2 секунды раньше N. Стека нет.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-3
- **причина:** тот же инцидент, что N: клиентский digest скрытого падения Server Components. Это и есть экран «Something went wrong» / «Try again». Отдельно разбирать нечего.
- **как фиксить:** исправление N убирает и этот digest. Отдельного клиентского дефекта в кадре нет.

### SUN_SCHOOL_POSTGRES_DEV-6

- **title:** та же ошибка «Functions cannot be passed directly to Client Components…».
- **status:** unresolved (escalating). Событий: 78. На деплое в выборке `url:*…vercel.app*check*` этого issue нет.
- **route:** `GET /lessons/[lessonId]/check`. Последнее событие 2026-10-20T10:06:19Z, environment `dev`, хост `localhost:3000`, тот же урок. Раньше в этот issue попадали и `GET /analytics` на localhost. Каретка на `tableProgressHeader`. Стек — `app-page-turbo.runtime.dev.js` в локальном `node_modules/next`, кадров приложения нет.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-6
- **причина:** тот же объект `TeacherCheckMessages`, другая функция, на которую React поставил каретку. `tableProgressHeader` объявлен в `pick-teacher-check-messages.server.ts` и используется таблицей (`LessonCheckTable.tsx`); на последовательной проверке в клиент уходит весь срез, включая эту функцию.
- **как фиксить:** то же, что для N: не передавать функции среза в `CheckScreen`. После замены среза на строки закроются и N, и 6.

`SUN_SCHOOL_POSTGRES_DEV-M` в событиях проверки нет (culprit остаётся `POST /lessons/[lessonId]/edit`). Это соседний проход того же класса (`editTitle` / функции словаря), не стек экрана проверки.
