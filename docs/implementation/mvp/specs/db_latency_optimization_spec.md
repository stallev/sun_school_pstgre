# Спека для AI-агента: снижение latency запросов Prisma (таймаут 5 с)

> Статус: реализовано (2026-11-02, P23-CU9…CU14). Связанное правило: `docs/guidelines/nextjs/ai_nextjs_db_data_handle.md` §6 (DB latency).

## 1. Context

Prisma обрывает операции на 5-й секунде. Диагностика (замер скриптом к `DATABASE_URL`, pooler Neon `us-east-2`, dev-машина пользователя):

| Операция | Время |
|---|---|
| Первое подключение (TLS + пробуждение Neon) | ~3,2 с |
| `select 1` на тёплом соединении | ~260 мс |
| `BEGIN` + 2 запроса + `COMMIT` | ~1 с |

Вывод: стоимость запроса ≈ RTT (~260 мс), а не SQL. Интерактивная транзакция `prisma.$transaction(async (tx) => …)` имеет дефолты **`maxWait` 2 с / `timeout` 5 с**, то есть влезает ~19 обращений к БД. В `apps/web/src` ~140 вызовов `$transaction`, явный таймаут только в `close-year.ts`, `set-group-achievement-mode.ts`, `recalculate-achievements.ts`, `execute-deletion.ts`.

**Правило №1 для агента: время = число обращений к БД × RTT. Оптимизировать число обращений, а не SQL.**
**Правило №2: `Promise.all` на одном `tx` НЕ ускоряет** — внутри интерактивной транзакции одно соединение, запросы встают в очередь. Параллелить можно только запросы на `db` (разные соединения пула) вне транзакции.

Цель: самые частые пути укладываются в бюджет по числу обращений (§4), дефолт таймаутов транзакций поднят как страховка. Поведение, авторизация, аудит и блокировки не меняются.

## 2. Область (пути, подтверждённые чтением кода)

| # | Путь | Файлы | Что медленно |
|---|---|---|---|
| P1 | Меню (на каждой странице) | `data/shell/build-shell-nav.server.ts`, `data/achievements/achievement-feature.server.ts`, `data/families/family-feature.server.ts` | `$transaction` ради двух последовательных чтений флагов (BEGIN, 2 SELECT, COMMIT ≈ 1 с) |
| P2 | Кирпичики, страница | `data/bricks/load-bricks-page.server.ts`, `data/bricks/bricks-shared.server.ts` | Цикл по ученикам: на каждого 1–2 отдельные `$transaction`, внутри каждой чтение флага + 4 агрегата (в tx последовательно). 25 учеников ≫ 5 с |
| P3 | Выдача кирпичиков | `data/bricks/issue-bricks.ts`, `bricks-shared.server.ts`, `compensate-bricks.ts` | `assertBricksReadAccess` ≈ 5 последовательных запросов, баланс = флаг + 4 запроса, всё в одной tx |
| P4 | Создание/правка/удаление урока | `data/lessons/create-lesson.ts`, `update-lesson.ts`, `delete-lesson.ts`, `lesson-shared.server.ts` | `recalculateLessonOrdinals`: **по одному `UPDATE` на каждый урок класса в году** (30 уроков ≈ 8 с) |
| P5 | Проверка ДЗ (запись) | `data/checks/check-shared.server.ts` (`saveCheckInTransaction`, `finalizeCheckedRecord`, `correctCheckInTransaction`), `save-checked.ts`, `save-partial-check.ts`, `complete-lesson-check.ts`, `correct-check.ts` | `recordScoreEvent` и upsert стихов — по одному запросу в цикле; `loadSchoolTimeZone`, `gradeSettings`, список уроков — отдельные запросы в tx; после tx ещё `revalidate*CachesForLessonCheck(db…)` с запросами |
| P6 | `load-*` страницы (чтение) | `data/**/load-*.server.ts` (`load-check-entry-page`, `load-lesson-table-page`, `load-sequential-check-page`, `load-today-week-rows`, `load-calendar-page`, `load-lessons-list-page` …) | Последовательные `await` независимых запросов; `$transaction` ради одного чтения |

## 3. Задачи (commit units; порядок обязателен)

Tier: T2 для CU1–CU6 (data layer без смены контрактов). Если правка затрагивает авторизационные проверки (`assert*Access`, `assertLessonActor*`, `policy-server`) — это sensitive zone/T3: **проверки остаются внутри транзакции в прежнем порядке, их не выносить**.

### CU1 — Дефолты клиента + инструмент измерения
- `packages/db/src/client.ts`: `new PrismaClient({ adapter, transactionOptions: { maxWait: 10_000, timeout: 30_000 } })`; в `PrismaPg` передать `{ connectionString, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 15_000 }` (значения вынести в именованные константы; `connectionTimeoutMillis` учитывает холодный старт Neon ~3 с). Убедиться по `node_modules/@prisma/client` / Context7 `/prisma/docs`, что опция `transactionOptions` валидна для установленной версии (Prisma 7.10.0), не угадывать.
- Явные таймауты в `close-year.ts` и др. оставить как есть.
- Dev-диагностика: если `DB_QUERY_LOG=1` (только `APP_ENV=dev`), подписаться на `log: [{ emit: "event", level: "query" }]` и печатать `duration`+`query` (без значений параметров, PII). Включать опционально, по умолчанию выкл.
- Положить `scripts/db-latency.mjs` (замер select 1 / tx, переписать из рабочего варианта: `createRequire` для `pg`, `node --env-file=.env`). URL в выводе маскировать.
- Docs: правило «DB latency» (правила №1, №2 выше + бюджет §4) в `ai_nextjs_db_data_handle.md`.

### CU2 — Чтение без транзакции + меню (P1)
- `readFeaturesAchievementsEnabled` и `readFeaturesParentsEnabled` сейчас принимают `Tx`. Ввести общий тип (`DbReader = PrismaClient | Prisma.TransactionClient`, рядом с функциями или в `@sunschool/db`) и принимать его. Вызовы внутри существующих tx не менять.
- `build-shell-nav.server.ts`: убрать `$transaction`; `const [a, p] = await Promise.all([read…(prisma), read…(prisma)])` (две разные коннекции — параллельно).
- Опционально, только если замер после этого всё ещё > бюджета: кэш флагов (`'use cache'` + `cacheTag`, ключи в `lib/cache-tags.ts`, `cacheLife`); функция сама вызывает `getPrisma()` (аргументы `'use cache'` должны быть сериализуемы — клиент передавать нельзя). Инвалидация `updateTag` в action'ах, которые пишут `features.*` (найти по `FEATURES_ACHIEVEMENTS_KEY` / `appSetting` upsert). Не делать «на всякий случай».
- Аналогично заменить `db.$transaction((tx) => single read)` на прямое чтение во всех `load-*` (grep: `$transaction\(\(tx\) =>` с одним вызовом).

### CU3 — Кирпичики: страница без N+1 (P2)
- Новая функция в `bricks-shared.server.ts`: `loadBricksBalanceComponentsForPupils(db: DbReader, pupilIds: string[], yearId): Promise<Map<string, {checkPoints; achievementBonus; penaltiesTotal; issued}>>` — 4 запроса на **всех** учеников: `homeworkCheck.groupBy({ by: ["pupilId"], where: { pupilId: { in }, homeworkChecked: true, pointsTotal: { not: null }, lesson: { academicYearId } }, _sum })`, `brickLedger.groupBy`, `achievementAward.groupBy` (`revokedAt: null`), `penalty.findMany({ where: { pupilId: { in }, status: ACTIVE, lesson: { academicYearId } }, select: { pupilId, points } })` + суммирование `Math.abs`. Условия **идентичны** `loadBricksBalanceComponents`; отсутствующий ученик → нули.
- `load-bricks-page.server.ts`: флаг читать один раз (`db`), компоненты — одним вызовом, `buildBricksBalanceSnapshot(components, achievementsEnabled)` в памяти. Убрать циклы с `$transaction`.
- Независимые чтения (`getDefaultOrganizationId`, `userHasAdminRole`, активный год) — `Promise.all`, где нет зависимости.
- Тест: unit/integration — результат батча == результат старой функции на тех же данных (сид dev-года), включая ученика без записей.

### CU4 — Порядковые номера уроков (P4)
- `recalculateLessonOrdinals`: выбрать также текущий `ordinal`; считать `assignLessonOrdinals` как раньше; обновлять **только изменившиеся**; сами изменения — одним запросом: `tx.$executeRaw` с `UPDATE lesson SET ordinal = v.ordinal FROM unnest(${ids}::uuid[], ${ordinals}::int[]) AS v(id, ordinal) WHERE lesson.id = v.id` (имена таблицы/колонок взять из `schema.prisma` `@@map/@map`; проверить, нет ли `@updatedAt` у `Lesson` — raw его не обновит, тогда добавить `updated_at = now()`). Пустой список изменений → ни одного запроса.
- Поведение для `create/update/delete-lesson` не меняется; `ensureLessonGradeEvent` и `replaceLessonGoldenVerses` — просмотреть на такие же циклы и батчить (`createMany`/`deleteMany`).
- Тест: порядок и номера после вставки в середину/удаления идентичны старой реализации.

### CU5 — Проверка ДЗ и выдача кирпичиков (P3, P5)
- `check-shared.server.ts`: события оценок накапливать в массив и писать одним `homeworkScoreEvent.createMany` (одинаковый `setAt`, порядок полей сохранить); `applyVerseScores` — одним `deleteMany` для `score === null` и батчем для upsert (или `createMany`+`updateMany` по разнице); не терять запись в журнал событий (инвариант append-only).
- Чтения, не зависящие от блокировок, выполнять **до** `$transaction` на `db` параллельно и передавать внутрь: `organizationId` актёра (`loadActorOrganizationId`), `schoolTimeZone`. `gradeSettings` и список уроков класса читать внутри tx как сейчас, если иначе меняется семантика снимка; допустимо одним запросом объединить `findUnique homeworkCheck` + `verseScores` (уже так).
- `issue-bricks.ts` / `compensate-bricks.ts`: флаг достижений читать до tx; `loadBricksBalanceInTransaction` получает флаг параметром (перегрузка), остальное — без изменений. `assertBricksReadAccess` не менять по логике; можно слить `enrollment.findMany` + `teacherAssignment.findFirst` в один запрос (`teacherAssignment.findFirst` с условием `grade: { enrollments: { some: { pupilId, academicYearId } } }`) — только с тестом AZ allow / foreign-resource / wrong-role.
- Пост-коммитные `revalidate*CachesForLessonCheck(db, …)` измерить; если делают > 2 запросов — свести к одному (select pupil→grade→year одним `findFirst` с `select`-вложением).
- Блокировки (`lockPupilRow`, `FOR UPDATE`, `lockLessonYearAndAssertActive`) и порядок захвата не трогать.

### CU6 — Остальные `load-*` страницы (P6)
- Для каждого `load-*.server.ts` из списка §2: сгруппировать независимые `await` в `Promise.all`; одно-запросные `$transaction` убрать; `include/select`-вложения вместо запросов в цикле. Выполнять по одному-двум файлам, каждый — с измеренным числом запросов до/после (`DB_QUERY_LOG`).

## 4. Бюджет и Acceptance

Считать обращения к БД (счётчик в `DB_QUERY_LOG` / unit-тест с `$on("query")`):

| Путь | Цель |
|---|---|
| Меню | ≤ 2 запроса, параллельно, без BEGIN/COMMIT |
| Страница кирпичиков | число запросов **не зависит от числа учеников** (≤ ~10) |
| Создание урока | ≤ ~15 вне зависимости от числа уроков в классе |
| Сохранение проверки ДЗ | ≤ ~15 вне зависимости от числа стихов |
| Выдача кирпичиков | ≤ ~12 |

Общее: типизация и lint зелёные (`npm run typecheck`, `npm run lint`), существующие тесты (`complete-lesson-check.test`, `save-checked.test`, `correct-check.test`, `check-read-models.test`, integration-тесты на `DIRECT_URL`) проходят; результаты функций идентичны прежним; контракт `MutationResult` и коды ошибок не менялись; авторизационные проверки остались в tx в том же порядке.

## 5. Ограничения (проектные правила)

- Новых зависимостей нет (`dependency-pinning`). Литералы доменных значений — из `@sunschool/domain`. Тексты — `@/lib/messages`.
- Логика в `data/**`, `actions/**` — тонкие; `packages/policy/server` не импортировать из `proxy.ts`.
- Журналы (audit, кирпичики, события оценок) — только добавление; компенсации не заменять обновлениями.
- Коммиты по CU (`Commit: auto`, один CU = один коммит, префикс ветки `P23: …`), ревью `reviewer` для CU с runtime-кодом; `.claude/rules` вручную не править. `next-dev-loop` и PSI — только по явной просьбе.
- Не обещать результат без замера: после каждого CU приложить числа до/после (запросы и секунды на dev-БД).

## 6. Verification

1. `node scripts/db-latency.mjs` — базовая RTT (для сравнения, ожидаем ~260 мс на этой машине).
2. `DB_QUERY_LOG=1 npm run dev` → открыть: меню/страница кирпичиков (класс с ≥ 20 учениками), создание урока в классе с ≥ 20 уроками, сохранение проверки ДЗ, выдача кирпичиков; зафиксировать число запросов и время по §4.
3. `npm run typecheck && npm run lint && npm run test`; интеграционные тесты `*.integration.test.ts` (нужны `DIRECT_URL` и сид) для lessons/bricks/checks.
4. Регресс: ни одной ошибки «Transaction already closed / timeout 5000» при штатных сценариях.
