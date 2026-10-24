# Achievement group points contract

**Тип:** Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-24  
**Волна:** W12-06  
**Зависит от:** [`adr_015_group_achievement_points.md`](../../../prds/07_governance/adr_015_group_achievement_points.md), [`achievements_and_penalties_contract.md`](./achievements_and_penalties_contract.md) §4–§6, [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §4, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) (AZ-55, AZ-65), [`monorepo_boundaries_contract.md`](./monorepo_boundaries_contract.md)  
**Связанные документы:** [`change_log_contract.md`](./change_log_contract.md), [`school_year_and_groups_contract.md`](./school_year_and_groups_contract.md), [`achievements_screens_spec.md`](../specs/achievements_screens_spec.md)  
**Проверено по:** код ветки `P14` (2026-10-24): `achievement-evaluate-context.server.ts`, `issue-penalty.ts`, `award-manually.ts`, `upsert-achievement.ts`, `achievement-catalog.ts`. Context7 не вызывался.

---

## 1. Purpose

Контракт переопределения баллов достижений и штрафов для группы в учебном году и правила «эффективных баллов». Читают: исполнитель P15, `reviewer`.

## 2. Scope / Out of scope

**В scope:** таблица переопределений, `resolveEffectivePoints`, операции записи, потолки ручной выдачи и штрафа, снимок правила, seed.  
**Вне scope:** пороги `length`, условия, тексты, включение достижений по группам (остаётся в [`achievements_and_penalties_contract.md`](./achievements_and_penalties_contract.md)); пересчёт уже выданного.

Пока `features.achievements = false`, операции отказывают `ACHIEVEMENT_FLAG_OFF`.

## 3. Определения

| Термин | Значение |
|--------|----------|
| Глобальные баллы | `achievement_tier.points` (награда по уровню), `achievement.threshold` (штраф, отрицательное) |
| Переопределение | Строка `grade_achievement_points`: баллы одного уровня (штрафа — `tier = 0`) для `grade_settings` |
| Эффективные баллы | Переопределение, иначе глобальные |
| Группа факта | Группа урока завершающей проверки выдачи; для штрафа — группа урока штрафа |

## 4. Данные

`grade_achievement_points`

| Поле | Тип | Правило |
|------|-----|---------|
| `id` | uuid | PK |
| `grade_settings_id` | uuid | FK `grade_settings`; удаляется вместе с настройками года только процедурой удаления года |
| `achievement_id` | uuid | FK `achievement` |
| `tier` | int | 1…3 для `REWARD`, `0` для `PENALTY`; уникально `(grade_settings_id, achievement_id, tier)` |
| `points` | int | `REWARD`: ≥ 0; `PENALTY`: < 0 |
| `created_at`, `updated_at` | timestamptz | — |

Переопределение допустимо только для уровня, который есть в глобальном каталоге. Строк «как в глобальном» не хранят: при сохранении значение, равное глобальному, удаляет строку.

## 5. Операции

| Операция | Актор | Эффект | AZ |
|----------|-------|--------|----|
| `setGroupAchievementPoints` | `TEACHER` (своя группа, активный год), `ADMIN` (любая, любой год) | пакет `{ achievementId, tier, points \| null }`; `null` — сброс к глобальному | AZ-65 |
| `copyGroupAchievementPoints` | те же | копирует переопределения из группы-источника того же года, заменяя целевые | AZ-65 |

### Входы

| Поле | Правило |
|------|---------|
| `gradeId`, `academicYearId` | год по умолчанию — активный; teacher в закрытом году — `ACHIEVEMENT_YEAR_CLOSED` |
| `items[]` | ≥ 1, ≤ 64, без дублей `(achievementId, tier)`; неизвестное достижение или уровень — `VALIDATION` |
| `points` | целое; награда ≥ 0, штраф < 0 (в UI вводится модуль); иначе `ACHIEVEMENT_GROUP_POINTS_INVALID` |
| `sourceGradeId` (copy) | тот же год; источник тоже должен быть доступен актору |

**Не принимается с клиента:** автор, время, итоговые баллы выдачи, `rule_snapshot`.

## 6. Happy path

### 6.1 Запись

1. Проверка флага, актора по БД (admin или назначение на группу), года (teacher — только `ACTIVE`).
2. Блокировка `grade_settings` строки группы-года (`FOR UPDATE`), при отсутствии строки настроек отказ `NOT_FOUND`.
3. Для каждого элемента: значение равно глобальному или `null` → удалить строку; иначе upsert.
4. Один журнал `achievement.group_points_changed` на операцию: группа, год, список `{ achievementId, tier, before, after }` (без ФИО). Транзакция одна. Повтор с теми же данными — без изменений и без журнала.

### 6.2 Эффективные баллы

`resolveEffectivePoints(global, override)` — чистая функция в `@sunschool/domain`: переопределение, если есть, иначе глобальное. DAL загружает переопределения группы-года одним запросом и передаёт функции. Прямое чтение `tier.points` / `achievement.threshold` для решения о баллах вне этой функции запрещено.

### 6.3 Читатели

| Где | Что делает |
|-----|------------|
| `evaluatePupil` | эффективные баллы по группе урока завершающей проверки; пороги `length` глобальные |
| `awardManually` | потолок `points` — эффективные баллы группы ученика на день урока выдачи |
| `issuePenalty`, форма штрафа | потолок по модулю — эффективный размер группы урока |
| Снимок выдачи | в `rule_snapshot` добавить `pointsSource` (`global` / `grade`) и `gradeId`; прошлые выдачи не меняются |

### 6.4 Seed

`ensureAchievementCatalog` для существующей строки каталога не обновляет `points`, `length`, `threshold`; создаёт отсутствующее. Переопределений seed не трогает.

## 7. Negative paths (business)

| Путь | Исход |
|------|-------|
| Уровня нет в каталоге | `VALIDATION`, пакет не применяется |
| Закрытый год, teacher | `ACHIEVEMENT_YEAR_CLOSED` |
| Штраф ≥ 0 или награда < 0 | `ACHIEVEMENT_GROUP_POINTS_INVALID` |
| Пустой пакет или > 64 | `VALIDATION` |
| Источник copy из другого года | `VALIDATION` |

Пакет атомарен: при любой ошибке не меняется ни одна строка.

## 8. Security paths

| Путь | Требование | AZ |
|------|------------|----|
| S-1 | Teacher пишет только группы с назначением, проверка по БД; чужая группа — `NOT_FOUND` | AZ-65, AZ-D4 |
| S-2 | Закрытый год — только admin | AZ-65 |
| S-3 | Флаг проверяется в use-case | ADR-012 |
| S-4 | Баллы выдачи и `rule_snapshot` формирует сервер | — |
| S-5 | В журнале нет ФИО (INV-23) | — |
| S-6 | Teacher не получает доступа к `/achievements` и глобальному каталогу | AZ-52, AZ-D3 |

## 9. Concurrency & idempotency

- Две одновременные записи одной группы сериализуются блокировкой `grade_settings`; побеждает последняя, обе в журнале.
- Правка баллов во время `evaluatePupil` не ломает выдачу: `evaluate` читает переопределения внутри своей транзакции, снимок фиксирует применённое значение.
- Повтор запроса идемпотентен (§6.1 п. 4).

## 10. Drift & consistency

- Схема БД ↔ [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md); добавлять таблицу сначала в документ.
- Серверная проверка `points` ↔ схема Zod в `@sunschool/domain` (одна схема на сервер и форму).
- Список читателей §6.3 ↔ тест, который падает при чтении `tier.points` / `threshold` в `apps/web/src/data/**` вне `resolveEffectivePoints` (grep-гейт в CU4).

## 11. Policy & layer touchpoints

| Слой | Роль |
|------|------|
| `domain` | `resolveEffectivePoints`, схемы входов, коды `ACHIEVEMENT_GROUP_POINTS_INVALID`, `ACHIEVEMENT_YEAR_CLOSED`, действие журнала |
| `policy-server` | «своя группа», admin, год, флаг |
| DAL | транзакция §6.1, загрузка переопределений, читатели §6.3 |
| `packages/db` | таблица, миграция, seed |
| `apps/web` | Server Actions и страницы-тонкие адаптеры |

## 12. Acceptance criteria

- [ ] `resolveEffectivePoints` — переопределение, иначе глобальное; граничные значения — исход: unit-тест.
- [ ] Смена баллов группы влияет только на следующие выдачи этой группы, прошлые не меняются — исход: тест `evaluate`.
- [ ] Группа без переопределения следует за глобальным изменением — исход: тест.
- [ ] Значение, равное глобальному, удаляет строку — исход: тест DAL.
- [ ] Teacher: чужая группа `NOT_FOUND`, закрытый год `ACHIEVEMENT_YEAR_CLOSED` — исход: тест policy.
- [ ] Потолок ручной выдачи и штрафа берётся из эффективных баллов — исход: тесты `awardManually`, `issuePenalty`.
- [ ] Повторный seed не затирает баллы — исход: интеграционный тест seed.
- [ ] Журнал содержит до/после и не содержит ФИО — исход: тест.

## 13. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| — | — | — | — |

## 14. Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_015_group_achievement_points.md`](../../../prds/07_governance/adr_015_group_achievement_points.md) | Решение и отклонённые варианты |
| [`achievements_and_penalties_contract.md`](./achievements_and_penalties_contract.md) | Каталог, выдача, штраф |
| [`achievements_screens_spec.md`](../specs/achievements_screens_spec.md) | Экран редактора |
| [`P15_phase_description.md`](../phases_tasks_descriptions/P15_phase_description.md) | Фаза |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W12-06

## 15. Agent notes

- Хранить только отличия; не копировать каталог.
- Не вводить пороги и условия по группам.
- Баллы решает только `resolveEffectivePoints`.
- Коды и действие журнала добавить в domain до использования в DAL.

## Change log

| Date | Change |
|------|--------|
| 2026-10-24 | v1.0 — Canonical (W12-06, P15) |
