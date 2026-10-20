# Sentry: падения учёбы

Организация в MCP: `agencypartnerdev` (регион `https://de.sentry.io`). Проект `sun_school_postgres_dev`. Префикс short id: `SUN_SCHOOL_POSTGRES_DEV`. Хост: `https://dev-sun-school-pstgre.vercel.app`. Окно: 2026-10-20, выборки 7d и 30d. Новых short id нет.

`/groups`, `/year`, `/settings` — стек issue 5 тот же, что на `/audit`: `pickAdminMessages` → `deletions.categoryLabels` → `get-message.ts:9`, ключ `deletions.category_achievement_award`. Отличается только кадр страницы. Стек M, N и 6 (функции словаря в клиент) на этих трёх URL не тот.

`/bricks` — стек M тот же: каретка на `issueDialogTitle`, кадры только `app-page-turbo.runtime.prod.js`. `/calendar` — стек N тот же: каретка на `pageSubtitle`, те же кадры Next. Issue 5 и 6 на этих двух URL нет. Отдельного админского маршрута кирпичиков и календаря в коде нет: админ открывает те же `/(app)/bricks` и `/(app)/calendar`.

## Запросы

- `search_issues`, 7d и 30d: `url:*groups*`, `url:*year*`, `url:*settings*` с `lastSeen:-7d` / `lastSeen:-30d` — на каждый запрос одни и те же 2 issue: `SUN_SCHOOL_POSTGRES_DEV-5` и `SUN_SCHOOL_POSTGRES_DEV-3`. Старше сегодняшних событий нет. Culprit у issue 5 плавает до `POST /settings`: это последнее событие общего issue.
- `search_issues`, 7d и 30d: `url:*bricks*` — `SUN_SCHOOL_POSTGRES_DEV-M` и `SUN_SCHOOL_POSTGRES_DEV-3`. `url:*calendar*` — `SUN_SCHOOL_POSTGRES_DEV-N` и `SUN_SCHOOL_POSTGRES_DEV-3`.
- `search_issues`, 7d, `url:*\/groups\/*` — совпадений нет. События карточки `/groups/[id]` нет: список падает раньше.
- События по точному URL (тег `url` issue 5, 7d): `/groups` — 4; `/year` — 3; `/settings` — 3. Клиентская пара issue 3: столько же транзакций. `/bricks` в issue 5 нет (в M — 25 событий URL, последнее 12:13Z). `/calendar` в issue 5 нет (в N — 5 событий URL, последнее 12:13Z).

## Совпадения

### /groups

- **short id:** `SUN_SCHOOL_POSTGRES_DEV-5` и клиентская пара `SUN_SCHOOL_POSTGRES_DEV-3`.
- **title:** Missing message: deletions.category_achievement_award. У issue 3 — скрытое сообщение Server Components render.
- **route:** `POST /groups`, environment `dev`, событие `3f260b59`, 2026-10-20T12:08:35Z. Кадры: `groups/page.tsx` `GroupsPage` строка 25 → `pick-admin-messages.server.ts` строки 10–12 → `get-message.ts` строка 9. Совпадают с текущим кодом. Клиент issue 3 — transaction `/groups`, 12:08:33Z, стека нет.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-5
- **причина:** список вызывает `pickAdminMessages` до `loadGroupsAdminList` и карточек. Сборщик обходит все `DELETION_DATA_CATEGORY` и требует `deletions.category_<категория>`. В `en/admin.json` и `ru/admin.json` ряд обрывается на `category_audit_log_child`; следующей в домене идёт `achievement_award`. Id группы в событии нет, потому что рендер обрывается на строке 25, до `GroupCard`. Прямой заход на `groups/[groupId]/page.tsx` строка 35 вызывает тот же `pickAdminMessages`.
- **как фиксить:** в блок `deletions` обоих `admin.json` добавить строки для `achievement_award`, `penalty` и `recitation_attempt`. Тот же пропуск, что роняет `/audit`. Отдельного дефекта карточки группы в Sentry нет.

### /year

- **short id:** `SUN_SCHOOL_POSTGRES_DEV-5` и клиентская пара `SUN_SCHOOL_POSTGRES_DEV-3`.
- **title:** тот же, что на `/groups`.
- **route:** `POST /year`, environment `dev`, событие `d04918ce`, 2026-10-20T12:14:09Z. Кадры: `year/page.tsx` `YearPage` строка 24 → те же `pick-admin-messages.server.ts` 10–12 и `get-message.ts` 9. Клиент issue 3 — `/year`, 12:14:06Z, стека нет.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-5
- **причина:** тот же отсутствующий ключ на рендере года, до списка лет.
- **как фиксить:** те же три строки словаря. Отдельного фикса экрана года нет.

### /settings

- **short id:** `SUN_SCHOOL_POSTGRES_DEV-5` и клиентская пара `SUN_SCHOOL_POSTGRES_DEV-3`.
- **title:** тот же.
- **route:** `POST /settings`, environment `dev`, событие `9274a13a`, 2026-10-20T12:14:17Z. Кадры: `settings/page.tsx` `SettingsPage` строка 24 → те же строки 10–12 и `get-message.ts` 9. Клиент issue 3 — `/settings`, 12:14:14Z, стека нет.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-5
- **причина:** тот же отсутствующий ключ. Форма языка и часового пояса не доходит до рендера.
- **как фиксить:** те же три строки словаря. После первой починки только `achievement_award` цикл бросит следующий отсутствующий ключ (`penalty`, затем `recitation_attempt`).

### /bricks

- **short id:** `SUN_SCHOOL_POSTGRES_DEV-M` и клиентская пара `SUN_SCHOOL_POSTGRES_DEV-3`.
- **title:** Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".
- **route:** `POST /bricks`, environment `dev`, событие `478608a5`, 2026-10-20T12:13:17Z, URL `/bricks`. Каретка на `issueDialogTitle`. Стек — только кадры `app-page-turbo.runtime.prod.js`, кадров приложения нет. Клиент issue 3 — `/bricks`, 12:13:14Z, стека нет.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-M
- **причина:** тот же класс, что у учителя. `apps/web/src/app/(app)/bricks/page.tsx` передаёт весь `pickTeacherBricksMessages` в клиент. Каретка по-прежнему на `issueDialogTitle`.
- **как фиксить:** в срезе кирпичиков на клиент передавать только строки. `issueDialogTitle` и соседние функции собирать на сервере или импортировать в клиентском модуле, не замыканием из server-only pick. Починка ключей `deletions` этот экран не поднимает.

### /calendar

- **short id:** `SUN_SCHOOL_POSTGRES_DEV-N` и клиентская пара `SUN_SCHOOL_POSTGRES_DEV-3`.
- **title:** та же ошибка «Functions cannot be passed directly to Client Components…».
- **route:** `POST /calendar`, environment `dev`, событие `58860b50`, 2026-10-20T12:13:27Z, URL `/calendar`. Каретка на `pageSubtitle`. Стек — те же кадры Next. Клиент issue 3 — `/calendar`, 12:13:25Z, стека нет.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-N
- **причина:** тот же класс, что у учителя. `apps/web/src/app/(app)/calendar/page.tsx` передаёт весь `pickTeacherCalendarMessages` в клиентский `CalendarEventForm`. Первая функция среза — `pageSubtitle`.
- **как фиксить:** на границе сервер→клиент оставить только строки. `pageSubtitle` для шапки уже можно вызвать в `page.tsx`; в объект `messages` для формы функцию не класть. Починка ключей `deletions` этот экран не поднимает.
