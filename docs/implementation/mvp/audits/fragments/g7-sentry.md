# Sentry: падение журнала

Организация в MCP: `agencypartnerdev` (регион `https://de.sentry.io`). Проект `sun_school_postgres_dev`. Префикс short id: `SUN_SCHOOL_POSTGRES_DEV`. Окно: 2026-10-20, выборки 7d и 30d.

## Запросы

- `search_issues`, 7d и 30d: `url:*audit* lastSeen:-7d` / `lastSeen:-30d` — одни и те же 2 issue: `SUN_SCHOOL_POSTGRES_DEV-5` и `SUN_SCHOOL_POSTGRES_DEV-3`. Старше сегодняшних событий нет.
- `search_issues`, 7d и 30d: `2658301803` — совпадений нет. `search_errors` за 7d по той же строке тоже пустой: в сохранённом тексте клиентского события номер digest не записан (production скрывает конкретное сообщение).
- События именно `https://dev-sun-school-pstgre.vercel.app/audit`: два клиентских (`/audit`, 2026-10-20T11:56:04Z и 11:56:44Z) и два серверных (`POST /audit`, 11:56:06Z и 11:56:46Z).

## Совпадения

Стек M, N и 6 (функции словаря в клиент) на `/audit` не тот. Событий «Functions cannot be passed directly to Client Components» по этому URL нет.

### SUN_SCHOOL_POSTGRES_DEV-5

- **title:** Missing message: deletions.category_achievement_award
- **status:** unresolved (new). На URL журнала — 2 события.
- **route:** `POST /audit`. Событие `05da53c0`, 2026-10-20T11:56:46Z, environment `dev`, URL деплоя `/audit`. Кадры: `audit/page.tsx` `AuditPage` (вызов `pickAdminMessages`) → `pick-admin-messages.server.ts` `deletions.categoryLabels` → `get-message.ts:9`. Кадры совпадают с текущим кодом: `AuditPage` строка 40, `deletionCategoryLabels` строки 10–12, `get-message.ts` строка 9.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-5
- **причина:** `pickAdminMessages` обходит все значения `DELETION_DATA_CATEGORY` и требует ключ `deletions.category_<категория>`. В `en/admin.json` и `ru/admin.json` ряд обрывается на `category_audit_log_child`. Следующая категория в домене — `achievement_award`, строки нет, `getMessage` бросает ошибку. Журнал до таблицы не доходит: страница вызывает этот сборщик на каждом рендере.
- **как фиксить:** в `apps/web/src/lib/messages/en/admin.json` и `ru/admin.json` в блок `deletions` добавить строки для `achievement_award`, `penalty` и `recitation_attempt` (все три есть в `DELETION_DATA_CATEGORY` и отсутствуют в словаре). Иначе после первой починки бросит следующий отсутствующий ключ в том же цикле `pick-admin-messages.server.ts`.

### SUN_SCHOOL_POSTGRES_DEV-3

- **title:** An error occurred in the Server Components render. The specific message is omitted in production builds…
- **status:** unresolved (escalating). На URL журнала — 2 события, на 2 секунды раньше пары с issue 5.
- **route:** `/audit`. Событие `50c58097`, 2026-10-20T11:56:44Z, environment `production` (клиент), тот же URL деплоя. Стека нет. Digest `2658301803` в событии не виден.
- **ссылка:** https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-3
- **причина:** тот же short id, что у клиентского экрана «Something went wrong» / «Try again» на других маршрутах, но серверная причина на журнале — issue 5, не функции среза. Это клиентский digest скрытого падения Server Components.
- **как фиксить:** строки словаря из issue 5 убирают и этот экран на `/audit`. Отдельного клиентского дефекта в кадре нет.
