# Sentry: падения урока

Код не менялся. Совпадения есть. Текст «Something went wrong» в issue не встречается: это подпись границы ошибки Next.js. В Sentry тот же сбой записан как ошибка рендера Server Components.

## Запросы

- Организация: `agencypartnerdev` (регион `https://de.sentry.io`).
- Проект: `sun_school_postgres_dev` (dev-хост приложения). Рядом есть `sun_school_post_prod`, его не смотрел: падения на dev-URL.
- `search_issues`, `is:unresolved`, окна `30d` и `7d`. Поиск с `OR`/`AND` Sentry отклонил, поэтому запросы шли по одному.
- URL и transaction: `*lessons/new*`, `*lessons*edit*`, `*lessons*table*`, плюс точные `GET /lessons/new` и `*lessons/[lessonId]/table*`.
- Текст: `"Something went wrong"` — 0 issue и за 30d, и за 7d.
- Уточнение событий (`search_errors`, 7d): `transaction` `*lessons/new*`, `*lessons/edit*`, `*lessons*table*`. Окна 30d и 7d дали одни и те же issue: активность 2026-10-20.

Кадры стека — только `node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js`. Файлов приложения в стеке нет. Имена функций из тела ошибки есть в репозитории (файлы ниже).

## Совпадения

### SUN_SCHOOL_POSTGRES_DEV-M

- Title: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server" (в теле ошибки указана функция `editTitle`).
- Status: unresolved (escalating).
- Environment: `dev`.
- Route: `POST /lessons/new` и `POST /lessons/[lessonId]/edit`. Последний разобранный запрос — edit на dev-хосте; отдельные события того же issue — на `/lessons/new`.
- Ссылка: https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-M
- Причина: `pickTeacherLessonFormMessages` кладёт функции (`editTitle`, `pageSubtitle`, `versesHint`, `versesRemove`, `missingVerseItem`) в объект, который страницы `/lessons/new` и `/lessons/[lessonId]/edit` передают в клиентский `LessonForm`. Next не сериализует функции в props Client Component, рендер обрывается, пользователь видит «Something went wrong». Файлы на месте: `apps/web/src/lib/messages/pick-teacher-lesson-messages.server.ts`, `apps/web/src/lib/messages/teacher-lesson-messages.ts`, `apps/web/src/components/teacher/LessonForm.tsx`, `apps/web/src/app/(app)/lessons/new/page.tsx`, `apps/web/src/app/(app)/lessons/[lessonId]/edit/page.tsx`.
- Как фиксить: оставить в props только строки. Шаблоны с `{n}`, `{group}`, `{year}`, `{ref}` подставлять на сервере до передачи в `LessonForm` либо передавать шаблон строкой и подставлять чистой функцией, объявленной в клиентском модуле, а не полем объекта с сервера.

### SUN_SCHOOL_POSTGRES_DEV-N

- Title: та же ошибка про функции в Client Components (в теле указана функция `finishedProgress`).
- Status: unresolved (escalating).
- Environment: `dev`.
- Route: `POST /lessons/[lessonId]/table`. Тот же issue группирует и `POST /lessons/[lessonId]/check` (последний разобранный запрос issue — check; события table есть отдельно).
- Ссылка: https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-N
- Причина: `pickTeacherCheckMessages` включает функции (`finishedProgress`, `finishedSubtitle`, `savedToast` и соседние форматтеры). Страница таблицы передаёт весь объект в клиентский `LessonCheckTable`. Файлы на месте: `apps/web/src/lib/messages/pick-teacher-check-messages.server.ts`, `apps/web/src/lib/messages/teacher-check-messages.ts`, `apps/web/src/components/teacher/LessonCheckTable.tsx`, `apps/web/src/app/(app)/lessons/[lessonId]/table/page.tsx`.
- Как фиксить: то же, что для M — в клиент уходят только строки. Для таблицы заранее собрать нужные подписи на сервере или держать шаблоны строками. Пока функции остаются в общем объекте проверки, упадёт и `/check`.

### SUN_SCHOOL_POSTGRES_DEV-3

- Title: An error occurred in the Server Components render. Сообщение в production-сборке скрыто, есть только digest. Стека нет.
- Status: unresolved (escalating).
- Environment: у клиентского события тег `production` (сборка Vercel), URL — dev-хост. Серверные M и N помечены `dev`.
- Route: транзакции `/lessons/new`, `/lessons/:lessonId/table` и `/lessons/:lessonId/check`. Последний разобранный запрос — check. Карточка `/lessons/[id]` в этих событиях не фигурирует.
- Ссылка: https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-3
- Причина: клиентский отголосок того же обрыва RSC, что M и N. Отдельного кадра приложения нет, чинить его как самостоятельный баг не из чего.
- Как фиксить: после правки передачи сообщений в M и N этот issue на `/lessons/new`, `/edit` и `/table` должен прекратиться. Отдельный патч под digest не нужен.
