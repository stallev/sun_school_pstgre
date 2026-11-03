# Sentry: issues за 30 минут — 2026-11-03

**Окно:** 23:16–23:46 МСК (события сгруппированы в 23:22–23:25 МСК).
**Проект:** `sun_school_postgres_dev` · организация `agencypartnerdev` · среда `dev`.
**Хост:** `https://dev-sun-school-pstgre.vercel.app` · релиз `1855b1af43a74e931d16c2f5eb9a56d312b999d3` · Vercel `iad1`, Node 24.22.2.
**Объём:** 5 issues, 147 событий. Все unresolved.
**Выборка:** [issues `lastSeen:-30m`](https://agencypartnerdev.sentry.io/issues/?project=sun_school_postgres_dev&query=lastSeen%3A-30m).

Счётчики — события за эти 30 минут, не за всю жизнь issue.

| Issue | События | Где упало | Класс |
|---|---:|---|---|
| [SUN_SCHOOL_POSTGRES_DEV-1Y](https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-1Y) | 90 | `POST /bricks` 60, `POST /lessons` 30 | функции в props клиентского компонента |
| [SUN_SCHOOL_POSTGRES_DEV-2C](https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-2C) | 45 | `POST /calendar` | тот же дефект, другая транзакция |
| [SUN_SCHOOL_POSTGRES_DEV-3](https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-3) | 9 | `/bricks` 3, `/lessons` 2, `/calendar` 2, `/audit` 2 | клиентское эхо серверных падений |
| [SUN_SCHOOL_POSTGRES_DEV-Q](https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-Q) | 2 | `POST /audit` | нет ключа словаря |
| [SUN_SCHOOL_POSTGRES_DEV-2D](https://agencypartnerdev.sentry.io/issues/SUN_SCHOOL_POSTGRES_DEV-2D) | 1 | `POST /profile` | таймаут соединения pg-pool |

Источники причин: код репозитория и Context7 — Next.js [`/vercel/next.js` v16.2.9](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/01-directives/use-client.mdx) (ближайшая опубликованная в Context7 ветка к используемому 16.4), Prisma [`/websites/prisma_io`](https://www.prisma.io/docs/postgres/database/connection-pooling).

## SUN_SCHOOL_POSTGRES_DEV-1Y и SUN_SCHOOL_POSTGRES_DEV-2C

Одна ошибка. Sentry развёл её по `transaction`, потому что culprit разный: `POST /bricks`, `POST /lessons` и `POST /calendar`. В теле каждого события один и тот же объект строк экранов урока. Подчёркнутая функция меняется от события к событию (`assignedVersesHintNext`, `versesPageSubtitle`, `listSubtitle`, `lessonCardTitle`, `lessonMetaLine`, `listOrdinalShort`, `listCheckFraction`) — сериализатор останавливается на первой функции, которую встретил.

**Локализация**

- Словарь с функциями собирается в `apps/web/src/lib/messages/pick-teacher-lesson-screens-messages.server.ts` (`pickTeacherLessonScreensMessages`). Функции: `listSubtitle`, `versesPageSubtitle`, `listOrdinalShort`, `listCheckFraction`, `lessonCardTitle`, `lessonMetaLine`, `assignedVersesHintNext`, `checkPartial`, `lessonUsageLink`, `todayPageSubtitle`, `todayGreeting` и соседние форматтеры. Тип — `TeacherLessonScreensMessages` в `apps/web/src/lib/messages/teacher-lesson-screens-messages.ts`.
- На клиент объект попадает целиком через `LessonsGradeFilter` (`apps/web/src/components/teacher/LessonsGradeFilter.tsx`, директива `"use client"`, prop `messages`). Фильтру нужны только строки `gradeFilterLabel` и `gradeFilterApply`.
- Вызовы:
  - `/bricks` — `BricksPageContent.server.tsx`, `lessonMessages` в `LessonsGradeFilter` (`actionPath="/bricks"`).
  - `/lessons` — `LessonsPageContent.server.tsx`, `messages` в `LessonsGradeFilter`.
  - `/calendar` — `CalendarPageContent.server.tsx`, `listMessages` в `LessonsGradeFilter` (`actionPath="/calendar"`).
- Фильтр рендерится при `data.isAdmin && data.grades.length > 1`. На стенде условие истинно, поэтому страницы падают при серверном рендере (в том числе при `POST` обновления RSC).

**Причина**

Props от Server Component к Client Component должны быть сериализуемы. Функция сериализуется только если это Server Action (`"use server"`). Обычный форматтер строк — нет: React не может отправить его в клиентский бандл как prop. Это прямо описано в документации Next.js по `'use client'` (Context7, v16.2.9): функция в props клиентского компонента несериализуема. То же правило уже зафиксировано в проекте: в срез, который уходит на клиент, кладут строки и объекты, а не функции-форматтеры (`ui-messages-bundle-splitting`, §3).

Стек в Sentry — только минифицированный `app-page-turbo.runtime.prod.js`, механизм `auto.function.nextjs.on_request_error`. Прикладного кадра нет, потому что исключение бросает рантайм сериализации RSC, а не код приложения.

## SUN_SCHOOL_POSTGRES_DEV-3

**Локализация**

Клиентское событие, платформа `javascript`, React `19.3.0-canary-278794d7-20261002`. Стека и прикладного файла нет. `handled: yes`, механизм `generic`. Транзакции за окно: `/bricks`, `/lessons`, `/calendar`, `/audit` — те же маршруты, что у 1Y, 2C и Q.

**Причина**

Это не отдельный дефект. Когда серверный рендер падает, браузер получает общую ошибку: в production-сборке Next.js скрывает текст серверного исключения и оставляет digest. Девять событий — видимая пользователю сторона падений из 1Y, 2C и Q. На `/bricks`, `/lessons`, `/calendar` исходная причина — функции в props. На `/audit` — отсутствующий ключ словаря.

## SUN_SCHOOL_POSTGRES_DEV-Q

**Локализация**

- Бросок: `apps/web/src/lib/messages/get-message.ts`, строка с `throw new Error(\`Missing message: ${path}\`)`. В событии путь `audit.entity_types.achievement_award`.
- Вызов: `apps/web/src/components/admin/AuditPageContent.server.tsx`. `Object.values(AUDIT_ENTITY_TYPE).map(...)` строит подписи фильтра и для каждого значения зовёт `getMessage(adminDict, \`audit.entity_types.${type}\`)`.
- Константа: `packages/domain/src/constants/audit-action.ts`, `AUDIT_ENTITY_TYPE.ACHIEVEMENT_AWARD = "achievement_award"`.
- Словари: `apps/web/src/lib/messages/ru/admin.json` и `en/admin.json`, объект `audit.entity_types`. Последний ключ там — `analytics_snapshot`. Дальше в enum, и в обоих словарях их нет: `achievement_award`, `achievement`, `achievement_suggestion`, `penalty`, `family`, `family_adult`, `weekly_digest`.
- Рядом уже есть безопасный путь: `apps/web/src/data/audit/audit-resolve-labels.server.ts` берёт подпись через `safeAdminMessage(...) ?? type` и не роняет страницу. Фильтр на странице журнала этим хелпером не пользуется.

**Причина**

`getMessage` считает отсутствующий ключ багом и бросает исключение, а не возвращает пустую строку. `Object.values(AUDIT_ENTITY_TYPE)` идёт в порядке объявления константы. После `analytics_snapshot` первый отсутствующий ключ — `achievement_award`, на нём рендер `/audit` останавливается. Остальные дыры словаря в этом проходе не достигаются, поэтому в Sentry виден только этот путь. Ключ появился в домене вместе с подтверждаемыми достижениями и не был добавлен в `admin.json` (ru и en).

## SUN_SCHOOL_POSTGRES_DEV-2D

**Локализация**

- Сообщение: `timeout exceeded when trying to connect`.
- Стек: `@prisma/adapter-pg` `PgQueryable.queryRaw` → `pg-pool`. Прикладного кадра нет.
- Таймаут задан в `packages/db/src/client.ts`: `PrismaPg({ connectionTimeoutMillis: POOL_CONNECTION_TIMEOUT_MS })`, `POOL_CONNECTION_TIMEOUT_MS = 15_000`, `max: 10`. Клиент создаётся один раз на процесс в `apps/web/src/lib/db.server.ts` (`client ??= createPrismaClient(env.DATABASE_URL)`), строка соединения — pooled `DATABASE_URL`.
- Маршрут: `POST /profile`, загрузка своего профиля (`apps/web/src/app/profile/page.tsx` → `getPrisma()` → `loadOwnProfile`). Событие одно, `handled: yes`, 23:23 МСК — внутри того же всплеска, что и падения страниц.

**Причина**

`pg-pool` не выдал соединение за `connectionTimeoutMillis` (15 с). Prisma ORM здесь только передаёт запрос в адаптер `@prisma/adapter-pg`. Документация Prisma по пулу (Context7) называет типичные условия такого исчерпания: новый клиент на каждый запрос, слишком много одновременных serverless-инстансов (у каждого свой пул) и приложение на direct-хосте вместо pooled. В этом коде клиент — синглтон процесса, а строка — pooled `DATABASE_URL`, так что первый и третий пункты к этому вызову не относятся. Остаётся ожидание свободного соединения дольше 15 с на инстансе Vercel. Одного события недостаточно, чтобы назвать это устойчивой нехваткой лимита Neon. Это единичный таймаут на фоне одновременных RSC-рендеров, а не ошибка логики профиля.
