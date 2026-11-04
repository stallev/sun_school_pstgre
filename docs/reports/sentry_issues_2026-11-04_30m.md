# Sentry: повторная выборка за 30 минут — 2026-11-04 (Q-4)

**Окно:** около 10:30–11:00 МСК. Снято в 11:00 МСК.
**Проект:** `sun_school_postgres_dev` · организация `agencypartnerdev` · среда `dev`.
**Хост:** `https://dev-sun-school-pstgre.vercel.app`.
**Релиз на стенде:** `d8bfab0c5184c905705cd46fa4af7e5a0ac2481d` — merge PR #33 в `dev`, 10:46:51 МСК. В нём есть CU1 (`06223a2`, страницы уроков, кирпичиков, календаря и журнала). Окно захватывает и минуты до выката.
**Выборка:** [issues `lastSeen:-30m`](https://agencypartnerdev.sentry.io/issues/?project=sun_school_postgres_dev&query=lastSeen%3A-30m). Счётчики ошибок — [события за 30 минут](https://agencypartnerdev.sentry.io/explore/discover/homepage/?dataset=errors&queryDataset=error-events&query=&project=4512268100698192&field=issue&field=release&field=count%28%29&sort=-count%28%29&statsPeriod=30m&mode=aggregate&yAxis=count%28%29), не за всю жизнь issue.
**Сравнение:** [`sentry_issues_2026-11-03_30m.md`](sentry_issues_2026-11-03_30m.md) (релиз `1855b1a`, всплеск 23:22–23:25 МСК 3 ноября).

## Итог по issues CU1

| Issue | События за эти 30 минут | Последнее событие до окна | Вывод |
|---|---:|---|---|
| [SUN_SCHOOL_POSTGRES_DEV-1Y](https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-1Y) | 0 | 23:25 МСК 3 ноября, релиз `1855b1a`, `POST /bricks` | не растёт |
| [SUN_SCHOOL_POSTGRES_DEV-2C](https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-2C) | 0 | 23:25 МСК 3 ноября, релиз `1855b1a`, `POST /calendar` | не растёт |
| [SUN_SCHOOL_POSTGRES_DEV-Q](https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-Q) | 0 | всплеск 3 ноября, релиз `1855b1a`, `POST /audit` | не растёт |
| [SUN_SCHOOL_POSTGRES_DEV-3](https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-3) | 0 | 23:25 МСК 3 ноября, релиз `1855b1a`, `/bricks` | не растёт |
| [SUN_SCHOOL_POSTGRES_DEV-2D](https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-2D) | 1 | 23:23 МСК 3 ноября; новое — 10:59:59 МСК, релиз `d8bfab0`, `POST /profile` | повтор после выката |

`-1Y`, `-2C`, `-Q` и `-3` после выката CU1 не пополнились. За 24 часа их счётчики остаются событиями вчерашнего всплеска (90 / 45 / 2 / 12); лишние события `-3` относительно вчерашних 9 лежат раньше окна 23:16–23:46 МСК и не относятся к релизу `d8bfab0`.

## Повтор `-2D` — вне CU1

Одно событие в окне: `Error: timeout exceeded when trying to connect`, `handled: yes`, стек `@prisma/adapter-pg` → `pg-pool`, прикладного кадра нет. Маршрут `POST /profile`, Node 24.22.2, Vercel `iad1`. Это тот же класс, что в отчёте 3 ноября: пул не выдал соединение за 15 с. Всего у issue 2 события.

Рядом в том же окне и в том же trace (`6c743787b5bf4366b3ef4cee833cfe51`) — [SUN_SCHOOL_POSTGRES_DEV-11](https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-11), медленный `SELECT` статуса `app_user` на `POST /profile` (10:55 МСК, категория `db_query`, не ошибка). Процесс инстанса стартовал в 10:49 МСК.

Повтор таймаута — отдельное наблюдение. В CU1 и в остальные commit units P25 он не входит.
