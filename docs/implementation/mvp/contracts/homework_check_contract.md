# Homework check contract

**Тип:** Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W8-05  
**Зависит от:** [`monorepo_boundaries_contract.md`](./monorepo_boundaries_contract.md), [`school_year_and_groups_contract.md`](./school_year_and_groups_contract.md), [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §5.6–§5.7, [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) INV-02, INV-11…INV-15, INV-19…INV-21, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) (AZ-30…AZ-36, AZ-P5, AZ-P6), [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §5.4–§5.5, §7, [`adr_004_timezone_scheduling_model.md`](../../../prds/07_governance/adr_004_timezone_scheduling_model.md), [`adr_009_bible_translations_and_verse_numbering.md`](../../../prds/07_governance/adr_009_bible_translations_and_verse_numbering.md), [`sunday_school_data_analytics_spec.md`](../../../my_specs/sunday_school_data_analytics_spec.md) (§3.11, §3.12, БП-1…БП-5, БП-10, БП-12, УЧ-1…УЧ-4, ПБ-5)  
**Связанные документы:** [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md) §5, §7.2, [`ui_states_contract.md`](../../../design/ui_states_contract.md) D3…D7, D10, D14, [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** бизнес-правила — спецификация (БП-5 вариант А решён 2026-10-10) и lifecycle; `Intl.DateTimeFormat` с `timeZone` для вычисления «дня» — по ADR-004 (стандарт ECMAScript Intl); транзакции Prisma v7 — решение проекта, пересверка на P01. Context7 недоступен.

---

## 1. Purpose

Контракт операций с уроками и проверкой домашних заданий: создание урока, золотые стихи, частичное и итоговое сохранение проверки, корректировка (БП-12), вычисление «сдано позже» и замороженных баллов. Читают: исполнитель P03/P04, авторы `lesson_form_and_golden_verses_spec` (W9-03), `homework_check_flow_spec` (W9-04), `reviewer` (T3).

## 2. Scope / Out of scope

**В scope:** `lesson`, `lesson_golden_verse`, `golden_verse`, `homework_check`, `homework_verse_score`, `homework_score_event`, правила баллов и «сдано позже».  
**Вне scope:** кирпичики ([`bricks_ledger_contract.md`](./bricks_ledger_contract.md)); достижения и штрафы (post-MVP); голосовая проверка (post-MVP, источник оценки `VOICE` не используется); аналитические отчёты.

## 3. Операции

| Операция | Актор | Переход / эффект | AZ |
|----------|-------|------------------|----|
| `createLesson` | `TEACHER` (своя), `ADMIN` | `∅ → HELD` | AZ-30 |
| `updateLesson` | `TEACHER` (своя), `ADMIN` | поля урока | AZ-30 |
| `changeLeadTeacher` | `TEACHER` (своя), `ADMIN` | ведущий | AZ-31 |
| `deleteLesson` | `TEACHER` (без проверок), `ADMIN` | удаление | AZ-30 |
| `savePartialCheck` | `TEACHER` (своя), `ADMIN` | `∅/Partial → Partial` | AZ-33 |
| `saveChecked` | `TEACHER` (своя), `ADMIN` | `Partial → Checked`, баллы заморожены | AZ-33 |
| `correctCheck` | `TEACHER` (активный год), `ADMIN` | `Checked → Checked` | AZ-34 |
| `overrideVerseScore` | `TEACHER` (своя), `ADMIN` | ручная оценка стиха | AZ-35 |
| `completeLessonCheck` | `TEACHER` (своя), `ADMIN` | `HELD → CHECK_COMPLETED` | AZ-33 |

## 4. Входы операций

### 4.1 Урок

| Поле | Правило |
|------|---------|
| `gradeId` | группа; teacher — своя в активном году |
| `title` | 1–200 |
| `lessonDate` | `date`, в границах `ACTIVE` года (INV-02) |
| `kind` | `REGULAR` / `REVIEW`; сменить можно, пока нет проверок |
| `leadTeacherId` | назначен на группу в году урока (УЧ-1, R-4); по умолчанию — текущий пользователь (УЧ-2) |
| `body` | форматированный текст, необязательно |
| `hasTest` | bool; `false` для `REVIEW` |
| `verses` | 0..N диапазонов (`bookId`, `startChapter`, `startVerse`, `endChapter`, `endVerse`) в **общей (Синодальной)** нумерации; `REVIEW` → пусто; ≤ `maxVersesPerLesson` |

### 4.2 Проверка (одна запись = ученик на уроке)

| Поле | Правило |
|------|---------|
| `lessonId`, `pupilId` | ученик зачислен в группу урока на дату урока (или запись создаётся позже — БП-12) |
| `present` | bool; по умолчанию `false`, пока не отмечено |
| `homeworkChecked` | выставляет только `saveChecked` |
| `testScore` | целое 0–10 или `NULL` («не оценивалось»); запрещено на `REVIEW` |
| `notebookScore` | целое 0–10 или `NULL` |
| `verseScores[]` | по стихам **предыдущего обычного урока** (БП-2): `lessonVerseId`, `score` ∈ {0,1,2} или `NULL` |
| `singing` | bool |
| `comment` | ≤ 500, необязательно |
| `expectedUpdatedAt` | для оптимистичной блокировки (TX-3) |
| `reason` | обязательна: `correctCheck` admin в `CLOSED` году; необязательна иначе |

**Не принимается с клиента:** `late`, `pointsTotal`, `scoringSnapshot`, `checkedBy`, `checkedAt`, `setAt`, `setBy`, `status`.

## 5. Happy path

### 5.1 `createLesson`

- **Предусловия:** год группы `ACTIVE`; `lessonDate` в границах; `leadTeacherId` назначен (R-4); для `REGULAR` каждый диапазон стихов существует в переводе группы (R-9, ПБ-5); число стихов ≤ лимита.
- **Транзакция:** блокировка `academic_year`; найти или создать `golden_verse` по диапазону (уникален); вставить `lesson` (`HELD`), `lesson_golden_verse` с `position`; пересчитать `ordinal` уроков группы и года по дате; при отсутствии события — создать `grade_event` типа `LESSON`.
- **Журнал:** `lesson.created`.
- **Постусловие:** урок виден в «Сегодня» и календаре.

### 5.2 `updateLesson`, `changeLeadTeacher`

- Поля и стихи меняются, пока **нет проверок**; после первой проверки меняются название, содержание, ведущий; ссылка использованного золотого стиха не меняется — правка создаёт новый стих (INV-21). Смена `kind` — только без проверок.
- **Журнал:** `lesson.updated` / `lesson.lead_changed` (УЧ-4).

### 5.3 `deleteLesson`

- Teacher — урок без проверок; `ADMIN` — с проверками (с причиной, журнал, баллы по уроку исчезают из остатка — предупреждение). Каскад: `lesson_golden_verse`, связанное событие остаётся с очищенной ссылкой.
- **Журнал:** `lesson.deleted`.

### 5.4 `savePartialCheck`

- **Предусловия:** год `ACTIVE`; учитель имеет право на группу; запись не `Checked` (иначе `correctCheck`).
- **Транзакция:** upsert `homework_check` (`homework_checked = false`); для **каждого изменённого поля** — строка `homework_score_event` (`field`, `value`, `set_at = now`, `set_by`); `points_total` не вычисляется.
- **Журнал:** не пишется на каждое поле (промежуточные сохранения); итоговая запись — на `saveChecked`.

### 5.5 `saveChecked`

- **Предусловия:** отмечено присутствие; запись `Partial` или новая; год `ACTIVE`.
- **Транзакция:** блокировка записи; зафиксировать `homework_checked = true`; вычислить `points_total` и `scoring_snapshot` (§6); вычислить `late` (§7); записать `checked_by`, `checked_at`.
- **Журнал:** `check.saved` (урок, ученик — ссылки).
- **Постусловие:** баллы вошли в остаток кирпичиков ([`bricks_ledger_contract.md`](./bricks_ledger_contract.md)).

### 5.6 `correctCheck` (БП-12)

- **Предусловия:** запись существует либо создаётся для ученика, добавленного позже; teacher — год `ACTIVE`, группа своя; admin — любой год, в `CLOSED` — `reason` обязательна.
- **Транзакция:** проверка `expectedUpdatedAt`; применить изменения; для изменённых полей — события оценки (`set_at = now`); пересчитать `points_total` по **текущим** весам, новый `scoring_snapshot`; пересчитать `late`; **присутствие не меняется задним числом из-за поздней сдачи** (БП-12) — только если оно явно изменено учителем.
- **Журнал:** `check.corrected` (старое → новое значение по полям; причина).
- **Постусловие:** кирпичики «набрано» меняются сразу; статус урока не меняется.

### 5.7 `overrideVerseScore`

- Ручная оценка стиха (`source = MANUAL`) с `scored_at`, `scored_by`; пересчёт баллов записи по §6. Журнал `check.verse_overridden`.

### 5.8 `completeLessonCheck`

- **Предусловия:** у урока есть хотя бы одна запись с `homework_checked = true` (БП-1); год `ACTIVE`.
- **Транзакция:** `HELD → CHECK_COMPLETED`. Журнал `lesson.check_completed`. Повтор идемпотентен.
- **Постусловие:** урок попадает в аналитику как «проверенный» (БП-1); повторная проверка записей возможна через `correctCheck`.

## 6. Баллы (БП-5 вариант А, БП-10)

```
points_total = Σ(verseScore_i) × w_verses
             + testScore × w_test
             + notebookScore × w_notebook
             + (singing ? w_singing : 0)
```

| Правило | Значение |
|---------|----------|
| Веса | из `grade_settings` пары «группа + год» **на момент** сохранения; по умолчанию 1 (спевка — 1) |
| Переключатели `use*` | выключенный параметр не входит в сумму |
| `NULL` | вклад 0, но в среднее **не входит** (INV-11) |
| Присутствие | в сумму не входит (БП-10, INV-12) |
| Снимок | `scoring_snapshot` = веса + переключатели + максимумы на момент выставления; **не пересчитывается** при смене настроек (INV-13) |
| Пересчёт | только записи, правленной `correctCheck`, по текущим весам |
| `REVIEW` | сумма = `notebookScore × w_notebook + (singing ? w_singing : 0)` |

Функция `computePoints(scores, weights, switches)` — в `@sunschool/domain`, чистая.

## 7. «Сдано позже» (INV-14, ADR-004)

| Правило | Значение |
|---------|----------|
| База | момент выставления оценки (`set_at`, `timestamptz`) сравнивается с **датой следующего урока группы** |
| «Следующий урок» | ближайший по дате урок той же группы **после** даты текущего урока (в т.ч. обзорный); если его ещё нет — `late = false` |
| День | дата момента выставления в поясе школы (`school_timezone`) |
| Условие | `date(set_at in school_tz) > nextLessonDate` |
| Хранение | `late` на записи — вычисляется при `saveChecked` / `correctCheck` по событиям оценок; поле клиентом не вводится |
| Смена пояса | не пересчитывает `late` прошлых записей |

Функция `computeLate(setAt, nextLessonDate, schoolTimezone)` — в `domain`, тест границ полуночи и перехода на летнее время.

## 8. Negative paths (business)

| Случай | Условие | Код | Ключ сообщения | Исход |
|--------|---------|-----|----------------|-------|
| Год не активен | урок вне `ACTIVE` / дата вне границ | `CHECK_YEAR_NOT_ACTIVE` | `teacher.lesson.year_not_active` | урок не создан |
| Нет ведущего | не назначен (R-4) | `CHECK_LEAD_NOT_ASSIGNED` | `teacher.lesson.lead_not_assigned` | форма сохранена |
| Стих отсутствует | нет в переводе группы (R-9) | `CHECK_VERSE_MISSING` (`fields.verses`, список) | `teacher.lesson.verses_missing` | урок не сохранён, список недостающих |
| Лимит стихов | > `maxVersesPerLesson` | `CHECK_VERSES_LIMIT` | `teacher.lesson.verses_limit` | отказ |
| Обзорный урок | стихи или тест у `REVIEW` | `VALIDATION` | `teacher.lesson.review_no_verses` | отказ |
| Правка использованного стиха | диапазон уже в уроке | `CHECK_VERSE_LOCKED` | `teacher.lesson.verse_locked` | отказ |
| Оценка вне диапазона | тест/тетрадь не 0–10; стих не 0–2 | `VALIDATION` (`fields.*`) | `teacher.check.score_range` | форма сохранена |
| Нет присутствия | `saveChecked` без отметки | `VALIDATION` (`fields.present`) | `teacher.check.present_required` | не сохранено |
| Запись изменена | `expectedUpdatedAt` устарел | `CONFLICT` | `teacher.check.conflict` | «Загрузить актуальное» |
| Закрытый год | teacher правит год `CLOSED` | `FORBIDDEN` | `common.errors.year_closed` | AZ-P5 |
| Нет причины | admin правит `CLOSED` без `reason` | `VALIDATION` (`fields.reason`) | `common.errors.reason_required` | не сохранено |
| Нет изменений | `correctCheck` без отличий | `CHECK_NO_CHANGES` | `teacher.check.no_changes` | без записи |
| Удаление проверенного | teacher удаляет урок с проверками | `FORBIDDEN` | `common.errors.forbidden` | AZ-30 |
| Ученик не в группе | запись для чужого ученика | `NOT_FOUND` | `common.errors.not_found` | — |
| Завершить без проверок | `completeLessonCheck` без `Checked` записей | `CHECK_NOTHING_CHECKED` | `teacher.check.nothing_checked` | без изменений |

## 9. Security paths

| Путь | Требование | AZ |
|------|------------|----|
| S-1 | Уроки и проверки — только назначенный на группу в году урока teacher либо `ADMIN` | AZ-30…AZ-35, AZ-P6 |
| S-2 | Чужая группа / чужой урок / чужой ученик → `NOT_FOUND` | AZ-D4 |
| S-3 | `late`, `pointsTotal`, `scoringSnapshot`, автор и время — только серверные | — |
| S-4 | Закрытый год: teacher — только чтение; admin — с причиной | AZ-P5 |
| S-5 | В журнал значения оценок попадают как значения полей, без ФИО (ссылки) | INV-23 |
| S-6 | Тексты стихов не принимаются с клиента: берутся из БД по диапазону | R-9 |

## 10. Concurrency & idempotency

| Гонка | Защита | Исход |
|-------|--------|-------|
| Два учителя правят одну запись | `expectedUpdatedAt` + блокировка строки | проигравший — `CONFLICT` |
| Двойное «Сохранить» | блокировка кнопки; идемпотентность: повтор с теми же данными → без повторной записи события | один результат |
| `completeLessonCheck` + `savePartialCheck` | порядок: урок → запись; статус урока проверяется внутри | согласованно |
| Создание двух уроков одной даты | `ordinal` пересчитывается; допустимы два урока в день (Q-02) | без дубликатов номеров |
| `closeYear` во время сохранения | год блокируется `FOR SHARE` на время проверки | второе получает `FORBIDDEN` |

## 11. Drift & consistency

| Риск | Guard |
|------|-------|
| Баллы пересчитаны при смене весов | тест INV-13 |
| `NULL` превращён в 0 | тест INV-11 |
| `late` введён вручную | DTO без поля; тест |
| Присутствие повлияло на баллы | тест `computePoints` (INV-12) |
| Номера уроков «дырявые» | пересчёт `ordinal` в транзакции; тест |
| Золотой стих с неверным переводом после смены языка группы | текст собирается при показе по текущему переводу (ЯГ-4); оценки не меняются |

## 12. Policy & layer touchpoints

| Слой | Роль |
|------|------|
| `domain` (`packages/domain/src/check/**`) | `computePoints`, `computeLate`, `nextLessonDate`, `resolveVersesToRecite`, Zod-схемы входов, `CHECK_*` коды |
| `policy-server` | `requireAssignedTeacher`, статус года |
| DAL (`apps/web/src/data/checks/**`) | мутации §5.4–§5.8; чтение: `get-check-roster`, `get-check-record`, `get-lesson-table`, `get-lesson-progress`, `get-current-lesson`; общее: `check-read-shared.server.ts`, `check-shared.server.ts` |
| RSC loaders (`apps/web/src/data/checks/load-*-page.server.ts`) | сборка DTO для `/check`, `/lessons/[lessonId]/check`, `/lessons/[lessonId]/table` |
| Actions (`apps/web/src/actions/checks.ts`) | тонкие Server Actions → DAL |
| DAL уроков (`apps/web/src/data/lessons/**`) | `createLesson` и др. §5.1–§5.3, `ordinal` |
| Кэш | `updateTag` по уроку, группе, балансу ученика |
| Запрещено | вычисление баллов и `late` в компоненте или action |

## 13. Acceptance criteria

- [ ] Урок вне `ACTIVE` года отклонён; ведущий без назначения отклонён — исход: тест (INV-02, R-4).
- [ ] Диапазон без стиха в переводе группы блокирует сохранение, список недостающих показан — исход: тест (R-9).
- [ ] `saveChecked` замораживает `points_total` и `scoring_snapshot`; смена весов не меняет старые — исход: тест (INV-13).
- [ ] `NULL` не входит в среднее и не равен 0 — исход: тест (INV-11).
- [ ] Оценка после даты следующего урока даёт `late = true`; граница полуночи в поясе школы — исход: тест (INV-14, ADR-004).
- [ ] `correctCheck` teacher в закрытом году отклонён; admin требует причину — исход: тест (AZ-P5).
- [ ] Параллельная правка даёт `CONFLICT` — исход: тест.
- [ ] Присутствие не влияет на баллы — исход: тест (INV-12).
- [ ] Каждая итоговая мутация пишет журнал — исход: тест.

## 14. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| Q-01 | ✔ **Решено 2026-10-11.** `completeLessonCheck` — явная кнопка или автоматически | Явная (БП-1), с подсказкой «Проверено N из M» | владелец | W9-04 |
| Q-02 | ✔ **Решено 2026-10-11.** Может ли быть два урока группы в один день | Да (выезд, дополнительный); `ordinal` по `(date, created_at)` | владелец | W9-03 |
| Q-03 | ✔ **Решено 2026-10-11.** Удаление урока teacher без проверок (lifecycle §5.6) | Разрешено; журнал | владелец | — |
| Q-04 | Как учитывать `late` для оценки на обзорном уроке (спевка, тетрадь) | Так же: относительно следующего урока группы | architect | — |
| Q-05 | ✔ **Решено 2026-10-17 (P03).** Поле `updated_at` у `lesson` и `homework_check` для TX-3 | Колонки в Prisma и [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §5.4–§5.5; `expectedUpdatedAt` в мутациях проверки | architect | — |

## 15. Related documents

| Document | Relationship |
|----------|--------------|
| [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §5.6–§5.7 | Переходы |
| [`bricks_ledger_contract.md`](./bricks_ledger_contract.md) | Остаток |
| [`change_log_contract.md`](./change_log_contract.md) | Action-коды |
| [`adr_009_bible_translations_and_verse_numbering.md`](../../../prds/07_governance/adr_009_bible_translations_and_verse_numbering.md) | Нумерация стихов |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W8-05

## 16. Agent notes

- Не вычислять баллы и `late` вне `@sunschool/domain`; не принимать их с клиента.
- Не превращать «не оценивалось» в 0.
- Не пересчитывать старые баллы при смене весов.
- Не менять присутствие задним числом из-за поздней сдачи.
- Не принимать текст стиха с клиента; хранить диапазон в Синодальной нумерации.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W8-05) |
| 2026-10-17 | v1.1 — Docs sync P04: §12 пути реализации, Q-05 закрыт |
