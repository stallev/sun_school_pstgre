# Sentry: падения людей

Организация в MCP: `agencypartnerdev` (регион `https://de.sentry.io`). Проект `sun_school_postgres_dev`. Префикс short id: `SUN_SCHOOL_POSTGRES_DEV`. Хост: `https://dev-sun-school-pstgre.vercel.app`. Окно: 2026-10-20, выборки 7d и 30d. Новых short id нет.

Стек M, N и 6 (функции словаря в клиент) на этих URL не тот. Событий «Functions cannot be passed directly to Client Components» по `/approvals`, `/users`, `/people` и `/deletions` нет.

Стек issue 5 тот же, что на `/audit`: `pickAdminMessages` → `deletions.categoryLabels` → `get-message.ts:9`, ключ `deletions.category_achievement_award`. Отличается только кадр страницы.

## Запросы

- `search_issues`, 7d и 30d: `url:*approvals*`, `url:*users*`, `url:*people*`, `url:*deletions*` с `lastSeen:-7d` / `lastSeen:-30d` — на каждый запрос одни и те же 2 issue: `SUN_SCHOOL_POSTGRES_DEV-5` и `SUN_SCHOOL_POSTGRES_DEV-3`. Старше сегодняшних событий нет. Culprit у issue 5 плавает (`POST /approvals`, затем `POST /groups`): это последнее событие общего issue, не отдельный баг маршрута.
- `search_issues`, 7d и 30d, по одному: `1324653242`, `1069851949`, `3755628905`, `1862521894` — совпадений нет. В сохранённом тексте клиентского события номер digest не записан.
- События по точному URL (7d): `/approvals` — 10 (5 пар сервер/клиент, первое в 06:45Z); `/users` — 6; `/people` — 6; `/deletions` — 4. Запрос `url:…/users/*` пустой: отдельного события профиля `/users/[id]` нет.

## Совпадения

### /approvals

- **short id:** `SUN_SCHOOL_POSTGRES_DEV-5` и клиентская пара `SUN_SCHOOL_POSTGRES_DEV-3`.
- **title:** Missing message: deletions.category_achievement_award. У issue 3 — скрытое сообщение Server Components render.
- **route:** `POST /approvals`, environment `dev`, событие `5674dc3a`, 2026-10-20T12:04:10Z. Кадры: `approvals/page.tsx` `ApprovalsPage` строка 27 → `pick-admin-messages.server.ts` строки 10–12 → `get-message.ts` строка 9. Совпадают с текущим кодом. Клиент issue 3 — transaction `/approvals`, environment `production`, на 2 секунды раньше (12:04:08Z), стека нет. Digest `1324653242` в событии не виден.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-5
- **причина:** страница вызывает `pickAdminMessages` до загрузки списка. Сборщик обходит все `DELETION_DATA_CATEGORY` и требует `deletions.category_<категория>`. В `en/admin.json` и `ru/admin.json` ряд обрывается на `category_audit_log_child`; следующей в домене идёт `achievement_award`.
- **как фиксить:** в блок `deletions` обоих `admin.json` добавить строки для `achievement_award`, `penalty` и `recitation_attempt`. Тот же пропуск, что роняет `/audit`. Отдельного дефекта экрана заявок нет.

### /users

- **short id:** `SUN_SCHOOL_POSTGRES_DEV-5` и клиентская пара `SUN_SCHOOL_POSTGRES_DEV-3`.
- **title:** тот же, что на `/approvals`.
- **route:** `POST /users`, environment `dev`, событие `5fa977bb`, 2026-10-20T12:04:02Z. Кадры: `users/page.tsx` `UsersPage` строка 28 → те же `pick-admin-messages.server.ts` 10–12 и `get-message.ts` 9. Клиент issue 3 — `/users`, 12:04:00Z, environment `production`, стека нет. Digest `1069851949` не виден. Событий `POST /users/[id]` нет: список падает раньше, чем открывается профиль. `users/[userId]/page.tsx` строка 36 вызывает тот же `pickAdminMessages`, прямой заход на профиль упадёт так же.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-5
- **причина:** тот же отсутствующий ключ `deletions.category_achievement_award` на рендере списка.
- **как фиксить:** те же три строки словаря. Отдельного фикса списка пользователей нет.

### /people

- **short id:** `SUN_SCHOOL_POSTGRES_DEV-5` и клиентская пара `SUN_SCHOOL_POSTGRES_DEV-3`.
- **title:** тот же.
- **route:** `POST /people`, environment `dev`, событие `842a9d61`, 2026-10-20T12:04:06Z. Кадры: `people/page.tsx` `PeoplePage` строка 43 → те же строки 10–12 и `get-message.ts` 9. Клиент issue 3 — `/people`, 12:04:04Z, environment `production`, стека нет. Digest `3755628905` не виден.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-5
- **причина:** тот же отсутствующий ключ на рендере списка людей.
- **как фиксить:** те же три строки словаря.

### /deletions

- **short id:** `SUN_SCHOOL_POSTGRES_DEV-5` и клиентская пара `SUN_SCHOOL_POSTGRES_DEV-3`.
- **title:** тот же.
- **route:** `POST /deletions`, environment `dev`, событие `4a878412`, 2026-10-20T12:03:47Z. Кадры: `deletions/page.tsx` `DeletionsPage` строка 34 → те же строки 10–12 и `get-message.ts` 9. Клиент issue 3 — `/deletions`, 12:03:45Z, environment `production`, стека нет. Digest `1862521894` не виден.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-5
- **причина:** тот же отсутствующий ключ. Экран удаления падает в сборщике подписей категорий, до таблицы заявок.
- **как фиксить:** те же три строки словаря. После первой починки только `achievement_award` цикл бросит следующий отсутствующий ключ (`penalty`, затем `recitation_attempt`).
