# Analytics year snapshots contract

**Тип:** Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-19  
**Волна:** W8-10  
**Зависит от:** [`multi_year_analytics.md`](../../../prds/01_product_scope/multi_year_analytics.md) §3–§8, [`school_year_and_groups_contract.md`](./school_year_and_groups_contract.md) (закрытие года), [`homework_check_contract.md`](./homework_check_contract.md) §6–§7 (корректировка, БП-12), [`bricks_ledger_contract.md`](./bricks_ledger_contract.md) §3, [`deletion_requests_contract.md`](./deletion_requests_contract.md), [`change_log_contract.md`](./change_log_contract.md) §4, [`monorepo_boundaries_contract.md`](./monorepo_boundaries_contract.md), [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §5.2–§5.7, [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) INV-02, INV-10, INV-16, INV-22, INV-23, INV-26, INV-27, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) (AZ-44, AZ-45, AZ-48…AZ-51, AZ-D4), [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §5.7, R-10, R-11  
**Связанные документы:** [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) v1.1, [`P08_phase_description.md`](../phases_tasks_descriptions/P08_phase_description.md), [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) §8.3, [`sunday_school_prototype.html`](../../../prototypes/sunday_school_prototype.html) (блок «ГОДЫ»)  
**Проверено по:** бизнес-правила — PRD «аналитика по годам» (2026-10-19) и спецификация владельца БП-1…БП-12; формулы KPI — `packages/domain/src/analytics/*` (P05). Prisma v7, PostgreSQL 17 (Neon) — по `package.json`; Context7 не требуется (стандартные таблицы и транзакции).

---

## 1. Purpose

Контракт **снимков итогов закрытого года**: что хранится, когда создаётся, как получает новую версию, как читается, какие годы и ученики видны роли и как считается разница с прошлым годом. Читают: исполнитель P08, `reviewer`, автор тестов DAL.

## 2. Scope / Out of scope

**В scope:** две таблицы снимков, создание при закрытии года, новая версия при правке закрытого года и при стирании данных ребёнка, чтение годовых итогов, год по умолчанию, пороги достоверности, видимость лет.  
**Вне scope:** экраны (→ [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) v1.1); формулы средних и слоёв выборки (P05, `packages/domain/src/analytics/*`); детальные графики по урокам (считаются по записям года, не из снимка); перенос исторических данных из старого приложения (вне проекта, [`P07_phase_description.md`](../phases_tasks_descriptions/P07_phase_description.md)); штрафы и достижения (post-MVP).

## 3. Определения

| Термин | Значение |
|--------|----------|
| Снимок группы | годовые итоги **основной выборки** (слой A, БП-1) группы за учебный год на момент создания версии |
| Снимок ученика | годовые итоги ученика за учебный год **по всем его группам года** (БП-7, БП-11) |
| Версия | целое ≥ 1; новая версия добавляется, старая не изменяется; читается максимальная |
| Методология | `ANALYTICS_METHODOLOGY_VERSION` — строка (`v1` в первом релизе); меняется при изменении формул P05; хранится в каждом снимке |
| Проверенный урок | как в [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) §3 (БП-1) |
| Порог достоверности | пара констант N (детей) и M (уроков) из `@sunschool/domain` (§5) |
| Год по умолчанию | год, который открывается без явного выбора (§6.5) |

## 4. Данные

Схема — [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §5.7. Здесь — смысл колонок.

### 4.1 `analytics_group_year_snapshot`

| Колонка | Смысл |
|---------|-------|
| `grade_id`, `academic_year_id`, `version` | ключ; `UNIQUE (grade_id, academic_year_id, version)` |
| `kids` | число детей основной выборки (слой A) |
| `lessons` | число проверенных уроков группы за год |
| `attendance` | средняя явка слоя A, доля 0…1 (`NULL` при `kids = 0`) |
| `verses` | среднее число рассказанных стихов за урок, 0…3 |
| `test`, `notebook` | средние баллы 0…10 |
| `methodology_version` | версия методологии на момент расчёта |
| `reason` | `CLOSE`, `CORRECTION`, `ERASURE`, `BACKFILL` |
| `created_at` | момент создания версии |

`verses`, `test`, `notebook` — среднее **личных средних** детей слоя A, как KPI-ряд в [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) §5.1; нет наблюдений → `NULL`.

### 4.2 `analytics_pupil_year_snapshot`

| Колонка | Смысл |
|---------|-------|
| `pupil_id`, `academic_year_id`, `version` | ключ; `UNIQUE (pupil_id, academic_year_id, version)` |
| `grade_ids` | группы года в порядке зачисления (`uuid[]`, ≥ 1; две — перевод внутри года) |
| `lessons` | проверенные уроки после зачисления (знаменатель явки) |
| `attendance`, `verses`, `test`, `notebook` | личные итоги за год по всем группам; `NULL` при `lessons = 0` |
| `bricks_earned` | набрано за год ([`bricks_ledger_contract.md`](./bricks_ledger_contract.md) §3) |
| `methodology_version`, `reason`, `created_at` | как в §4.1 |

**«Выдано» в снимке не хранится:** выдача кирпичиков в закрытом году остаётся доступной (БП-6), поэтому `bricks_issued` читается из `brick_ledger` в момент показа; замороженным остаётся только `bricks_earned`.

Снимки не содержат имён и контактов; ПД — только `pupil_id` (§9 схемы).

## 5. Константы и коды (`@sunschool/domain`)

| Что | Значение | Где |
|-----|----------|-----|
| `ANALYTICS_COMPARISON_MIN_PUPILS` (N) | `10` | `packages/domain/src/analytics/year-comparison.ts` |
| `ANALYTICS_COMPARISON_MIN_LESSONS` (M) | `4` | там же |
| `ANALYTICS_METHODOLOGY_VERSION` | `v1` | `packages/domain/src/analytics/methodology.ts` |
| `ANALYTICS_SNAPSHOT_REASON` | `CLOSE`, `CORRECTION`, `ERASURE`, `BACKFILL` | `packages/domain/src/constants/enums.ts` |
| Код ошибки `ANALYTICS_SNAPSHOT_MISSING` | закрытый год без снимка (дефект данных) | `MUTATION_ERROR_CODES` (префикс `ANALYTICS_`) |
| Audit | `analytics.snapshot_created`, `analytics.snapshot_versioned`; `entity_type` `analytics_snapshot` | [`change_log_contract.md`](./change_log_contract.md) §4 |

Значения N и M — стартовые (взяты в прототипе), утверждение владельцем — Q-01 §14. Менять только правкой константы и этого контракта.

## 6. Операции

| Операция | Актор | Эффект | AZ |
|----------|-------|--------|----|
| `createYearSnapshots(tx, yearId, reason)` | система внутри `closeYear` / `ensureYearSnapshots` | версия 1 для каждой группы года и каждого зачисленного ученика | AZ-51 |
| `recomputeYearSnapshots(tx, yearId, scope, reason)` | система внутри корректировки закрытого года | новая версия затронутых строк, если значения изменились | AZ-51 |
| `eraseChildSnapshots(tx, pupilId)` | система внутри стирания данных ребёнка | удаление строк ученика; пересчёт групповых снимков затронутых групп-лет | AZ-51, INV-22 |
| `ensureYearSnapshots(db, yearId)` | скрипт `seed:dev`, оператор | идемпотентно создаёт версию 1 (`BACKFILL`) там, где её нет | AZ-51 |
| `listGroupYearTotals(actor, gradeId)` | `TEACHER`, `ADMIN` | годовые итоги группы по доступным годам | AZ-48 |
| `listPupilYearRows(actor, pupilId)` | `TEACHER`, `ADMIN` | строки всех лет доступного ученика | AZ-49 |
| `listSchoolYearTotals(actor, yearId)` | `ADMIN` | итоги всех групп за выбранный год | AZ-44 |
| `resolveDefaultYear(actor, scope)` | `TEACHER`, `ADMIN` | год по умолчанию (§6.5) | AZ-48 |

Запись снимков **не доступна из UI и Route Handlers**: только перечисленные use-case (проверка по `grep`).

### 6.1 Создание при закрытии года

- В **той же транзакции**, что `closeYearInTransaction` ([`school_year_and_groups_contract.md`](./school_year_and_groups_contract.md)): после смены статуса на `CLOSED` и окончания зачислений — `createYearSnapshots(tx, yearId, CLOSE)`.
- Для каждой группы, у которой в году есть `grade_settings`, — строка снимка группы (даже при `kids = 0`; тогда метрики `NULL`). Для каждого ученика с зачислением в году — строка снимка ученика.
- Формулы — только `packages/domain/src/analytics/*` (те же, что для активного года): снимок и живой экран не расходятся при одной методологии.
- Журнал `analytics.snapshot_created` (одна запись на год: `{ groups, pupils, methodology }`, без имён).
- Ошибка расчёта откатывает **закрытие года целиком**: года без снимка не бывает (INV-26).

### 6.2 Новая версия при правке закрытого года

- Триггер: `correctCheck`, ручная правка балла стиха и другие admin-правки данных `CLOSED` года ([`homework_check_contract.md`](./homework_check_contract.md), БП-12) — в той же транзакции, после записи правки.
- Пересчитываются снимок группы затронутой пары «группа + год» и снимок затронутого ученика. Если значения не изменились — версия **не** создаётся. Иначе добавляется версия `n+1` (`CORRECTION`), `methodology_version` — текущая.
- Журнал `analytics.snapshot_versioned` (`{ gradeId?, pupilId?, version }`).
- Правка учителем в закрытом году запрещена (AZ-34) — снимок так не меняется.

### 6.3 Стирание данных ребёнка

- В той же транзакции, что `eraseChildDataInTransaction` ([`deletion_requests_contract.md`](./deletion_requests_contract.md)), **до** удаления проверок:
  1. удалить все версии снимков ученика;
  2. для каждой пары «группа + год» с зачислениями ребёнка — пересчитать снимок группы без него и **удалить прежние версии этой пары** (вклад ребёнка не должен остаться в агрегате), оставив одну версию `ERASURE`.
- Журнал: `deletion.executed` как сейчас; отдельный `analytics.snapshot_versioned` не пишется (INV-22, INV-23).
- Эти таблицы — **исключение из «только добавление»**: они не входят в R-6; удаление разрешено только из §6.3 и dev-скрипта `delete-academic-year`.

### 6.4 Чтение годовых итогов

- Закрытый год — из снимка (максимальная версия); активный год — вычисляется вживую теми же функциями domain (INV-26).
- `listGroupYearTotals`: по доступным годам (§7); для каждого — итоги и, если выполнены пороги §6.6, разница с предыдущим доступным годом.
- `listPupilYearRows`: по каждому году ученика — группы (имена), итоги, `bricks_earned` / `bricks_issued` (выдано — вживую), число проверенных уроков.
- Кэш: `'use cache'` с тегами `analytics:years:{gradeId}`, `analytics:pupil-years:{pupilId}`; сбрасываются `updateTag` из операций §6.1–§6.3, а `pupil-years` — ещё из `issueBricks` / `compensateBricks`. Авторизация в кэш не попадает.
- Нет снимка у закрытого года → `ANALYTICS_SNAPSHOT_MISSING`, экран показывает `error`-состояние региона, не пустые числа.

### 6.5 Год по умолчанию

1. активный год, если он доступен пользователю;
2. иначе последний (по дате начала) закрытый год из доступных;
3. иначе — состояние «нет доступных лет» (заглушка «учебный год не начался»).

Явный выбор (`?year=`) побеждает правило, если год доступен; недоступный → `NOT_FOUND` (AZ-D4). Правило — чистая функция `resolveDefaultYear` в domain.

### 6.6 Разница с прошлым годом

- «Прошлый год» — ближайший более ранний год **из доступных пользователю** (§7), у которого есть снимок (или это активный год).
- Для явки — разница в процентных пунктах (целое, округление к ближайшему); для стихов, теста, тетради — разница средних с одним знаком.
- Разница **не вычисляется и не показывается**, если у любого из двух лет `kids < N` или `lessons < M`; интерфейс показывает «мало данных для сравнения» (INV-27).
- Ученик: строка года с `lessons < M` показывает «—» вместо значений и пометку «мало уроков: k»; такой год не попадает в график по годам.
- Режима «сравнить два выбранных года» нет.

## 7. Видимость

| Данные | ADMIN | TEACHER | Прочие |
|--------|:-----:|:-------:|:------:|
| Годы группы | все годы со снимком | годы, в которых он назначен на группу (`teacher_assignment`); для активного года — как P05 | — |
| Сравнение групп школы (`/school`) | выбранный год | — | — |
| Строки лет ученика | все годы | **все годы** ученика, доступного по правилу P05 (AZ-45), включая группы до перевода | — |
| Аналитика группы вне назначения | любая | **не видит**; в строке года ученика — название группы без перехода в её аналитику | — |

Доступность самого ученика не расширяется: «чужой» ученик (вне доступа по AZ-45) → `NOT_FOUND`. Предыдущий год для разницы выбирается среди **видимых** пользователю лет — учитель не получает данные года, где он не назначен. Список групп учителя на экране аналитики — объединение `teacher_assignment` по всем годам назначения, а не только по последнему году школы (AZ-48).

## 8. Negative paths (business)

| Случай | Условие | Код / исход | Ключ сообщения |
|--------|---------|-------------|----------------|
| Год недоступен | `?year=` вне видимых | `NOT_FOUND` | `common.errors.not_found` |
| Закрытый год без снимка | дефект данных | `ANALYTICS_SNAPSHOT_MISSING` | `analytics.years.snapshot_missing` |
| Мало детей или уроков | `kids < N` или `lessons < M` | разница не показывается | `analytics.years.insufficient_for_comparison` |
| Нет доступных лет | у пользователя нет годов | заглушка | `analytics.years.none` |
| Первый год группы | нет предыдущего | разница пустая, значения показаны | — |
| Группа без проверенных уроков в году | `lessons = 0` | снимок с `NULL`, «—» | `analytics.empty.no_checked_lessons` |
| Правка без изменения значений | пересчёт равен текущей версии | версия не создаётся | — |
| Повторное закрытие года | год уже `CLOSED` | отказ закрытия; второго снимка нет | `SCHOOL_YEAR_STATUS_INVALID` |
| Чужая группа / чужой ученик | вне доступа | `NOT_FOUND` | `common.errors.not_found` |

## 9. Security paths

| Путь | Требование | AZ |
|------|------------|----|
| S-1 | Годы группы — по `teacher_assignment` на сервере; `?year=` не даёт доступа к году вне назначения | AZ-48, AZ-D4 |
| S-2 | Строки лет ученика только при доступе к ученику по AZ-45; чужой → 404 | AZ-49, AZ-D4 |
| S-3 | История ученика не раскрывает аналитику чужой группы: только имя группы в строке | AZ-50 |
| S-4 | Запись снимков — только системные use-case §6; нет Route Handler / Action для записи | AZ-51 |
| S-5 | Снимки и audit не содержат имён и контактов (INV-23) | — |
| S-6 | Стирание данных ребёнка удаляет его снимки и вклад из групповых агрегатов | INV-22 |

Проверки — в DAL на сервере (`packages/policy/server`), не скрытием ссылок в UI.

## 10. Concurrency & idempotency

| Гонка | Защита | Исход |
|-------|--------|-------|
| Закрытие года и правка проверки admin | оба берут блокировку строки года (`lockAcademicYearRow`) | правка видит либо активный год (снимка нет), либо закрытый (§6.2 после закрытия) |
| Два параллельных пересчёта одной пары | блокировка года + `UNIQUE (…, version)` | один успех, второй повторяет (`CONFLICT`) |
| Двойное закрытие | статус под блокировкой | второй отказ, второго снимка нет |
| Повторный `ensureYearSnapshots` | создаёт только отсутствующие версии 1 | идемпотентно |
| Выдача кирпичиков и чтение строки ученика | «выдано» читается вживую | устаревания нет |

## 11. Drift & consistency

| Риск | Guard |
|------|-------|
| Формулы в снимке и на живом экране разошлись | одни функции `packages/domain/src/analytics/*`; тест «живой расчёт активного года = расчёт снимка при закрытии» |
| Методология изменилась, прошлые годы пересчитаны | снимки не пересчитываются; экран показывает «посчитан по методологии vX» (INV-26) |
| Снимок хранит «выдано» и устаревает | колонки нет, §4.2 |
| Запись снимка из UI | S-4; grep по `analytics_*_snapshot` вне DAL-модуля |
| Вклад удалённого ребёнка остался | §6.3, тест после стирания |
| Пороги разошлись между экранами | константы только в `@sunschool/domain` |

## 12. Policy & layer touchpoints

| Слой | Роль |
|------|------|
| `packages/db` | миграция, модели, индексы ([`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §5.7, §8) |
| `domain` | `computeYearTotals`, `resolveDefaultYear`, `computeYearDiff`, `isComparisonReliable`, константы §5, схемы |
| `policy-server` | `canViewGroupYear`, `canViewPupilYears` (AZ-48…AZ-50) |
| DAL (`apps/web/src/data/analytics/years/**`) | операции §6; интеграция в `data/school/close-year.ts`, `data/checks/correct-check.ts`, `data/deletions/erase-child-data.ts` |
| Скрипты | `seed:dev` вызывает `ensureYearSnapshots`; `delete-academic-year` удаляет снимки года |
| UI | только чтение через DAL; запись недоступна |

## 13. Acceptance criteria

- [ ] Закрытие года создаёт снимки группы и ученика в одной транзакции; ошибка расчёта откатывает закрытие — исход: тест `closeYear` (INV-26).
- [ ] Живой расчёт активного года и снимок при закрытии дают одинаковые значения на одних данных — исход: тест.
- [ ] Правка admin закрытого года создаёт версию `n+1`, если значения изменились, и не создаёт при равенстве — исход: тест.
- [ ] Стирание данных ребёнка удаляет его снимки и убирает вклад из групповых версий — исход: тест.
- [ ] `kids < N` или `lessons < M` → разница не вычисляется (INV-27) — исход: unit domain.
- [ ] Год по умолчанию: активный → последний закрытый → «нет лет» — исход: unit domain.
- [ ] Teacher не видит год вне назначения и аналитику чужой группы; видит строки лет переведённого ребёнка — исход: тест policy/DAL (AZ-48…AZ-50).
- [ ] «Выдано» в строке ученика обновляется после выдачи в закрытом году — исход: тест.
- [ ] `ensureYearSnapshots` идемпотентен — исход: тест.
- [ ] Документ проходит checklist §2.3.6 реестра.

## 14. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| Q-01 | Утвердить пороги N=10 детей и M=4 урока | оставить как в прототипе | владелец | P08-CU2 (значения констант) |
| Q-02 | Хранить ли прежние версии групповых снимков после стирания данных ребёнка | нет: удалять (§6.3) | владелец | P08-CU5 |
| Q-03 | Нужен ли скрипт досоздания снимков для prod | нет: в prod закрытых лет до P08 нет; функция `ensureYearSnapshots` есть для оператора | architect | — |

## 15. Related documents

| Document | Relationship |
|----------|--------------|
| [`multi_year_analytics.md`](../../../prds/01_product_scope/multi_year_analytics.md) | Продуктовое описание |
| [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) | Экраны |
| [`school_year_and_groups_contract.md`](./school_year_and_groups_contract.md) | Закрытие года |
| [`change_log_contract.md`](./change_log_contract.md) | Action-коды |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W8-10

## 16. Agent notes

- Не пересчитывать закрытые годы при смене методологии — только новая версия при правке данных.
- Не хранить «выдано» в снимке; читать из `brick_ledger`.
- Не создавать снимок вне транзакции закрытия / правки / стирания / `ensureYearSnapshots`.
- Не писать имена в audit и снимки.
- Не показывать разницу при `kids < N` или `lessons < M`; не добавлять режим «сравнить два года».
- Учителю не отдавать годы вне назначения и аналитику чужой группы.

## Change log

| Date | Change |
|------|--------|
| 2026-10-19 | v1.0 — Canonical (W8-10, P08) |
