# School year and groups contract

**Тип:** Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W8-04  
**Зависит от:** [`monorepo_boundaries_contract.md`](./monorepo_boundaries_contract.md), [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §5.3–§5.5, [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) INV-01, INV-02, INV-07…INV-10, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) (AZ-10…AZ-14, AZ-20…AZ-23, AZ-P5, AZ-P6), [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §5.2–§5.3, §7, [`adr_004_timezone_scheduling_model.md`](../../../prds/07_governance/adr_004_timezone_scheduling_model.md), [`sunday_school_data_analytics_spec.md`](../../../my_specs/sunday_school_data_analytics_spec.md) (БП-6, БП-7, ЯГ-1…ЯГ-4, СО-3…СО-7, §3.3–§3.8)  
**Связанные документы:** [`adr_009_bible_translations_and_verse_numbering.md`](../../../prds/07_governance/adr_009_bible_translations_and_verse_numbering.md), [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md), [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** бизнес-правила — спецификация и lifecycle; частичный уникальный индекс Postgres (`CREATE UNIQUE INDEX … WHERE`) — стандарт PostgreSQL, пересверка на P01 по документации Prisma v7 (в схеме Prisma частичные индексы задаются сырой миграцией SQL). Context7 недоступен.

---

## 1. Purpose

Контракт операций над учебным годом, группами, назначениями учителей, настройками оценивания, учениками, зачислением и бумажным согласием. Читают: исполнитель P02/P03, авторы `group_and_pupils_spec` (W9-05), `reviewer`.

## 2. Scope / Out of scope

**В scope:** `academic_year`, `grade`, `grade_settings`, `teacher_assignment`, `pupil`, `enrollment`, `child_data_consent`, язык группы.  
**Вне scope:** уроки и проверки ([`homework_check_contract.md`](./homework_check_contract.md)); кирпичики ([`bricks_ledger_contract.md`](./bricks_ledger_contract.md)); семьи и электронное согласие опекуна (post-MVP).

## 3. Операции

| Операция | Актор | AZ |
|----------|-------|----|
| `createYear`, `activateYear`, `closeYear` | `ADMIN` | AZ-12 |
| `createGroup`, `updateGroup`, `deactivateGroup`, `activateGroup` | `ADMIN` | AZ-10 |
| `setGroupLanguage` | `ADMIN` | AZ-13 |
| `assignTeacher`, `unassignTeacher` | `ADMIN` | AZ-11 |
| `updateGradeSettings` | `ADMIN` | AZ-10 |
| `createPupil`, `updatePupil`, `deactivatePupil` | `ADMIN` | AZ-20 |
| `recordPaperConsent`, `revokeConsent` | `ADMIN` | AZ-22 |
| `enrollPupil`, `unenrollPupil` | `ADMIN`, `TEACHER` (своя группа) | AZ-23 |
| `transferPupil` | `ADMIN` | AZ-23 (Q-03 матрицы) |

## 4. Входы операций

| Операция | Поле | Правило |
|----------|------|---------|
| `createYear` | `name`, `startsOn`, `endsOn` | `startsOn < endsOn`; не пересекается с другими годами |
| `activateYear` | `yearId` | статус `DRAFT` |
| `closeYear` | `yearId`, `reason` необязателен | статус `ACTIVE` |
| `createGroup`, `updateGroup` | `name` (1–100), `description`, `ageMin`, `ageMax`, `isActive` | `ageMin ≤ ageMax`; имя уникально среди активных |
| `setGroupLanguage` | `gradeId`, `language` ∈ {`RU`,`EN`} | `EN` — только при `bible_translation.status = READY` для `en` (ЯГ-3) |
| `assignTeacher` | `userId`, `gradeId`, `yearId` | пользователь `ACTIVE` с ролью `TEACHER`; год `DRAFT` или `ACTIVE` |
| `updateGradeSettings` | `gradeId`, `yearId`, `useVerses`, `useTest`, `useNotebook`, `useSinging`, `maxVersesPerLesson`, `labels`, `weights`, `recitationDaysN` | `maxVersesPerLesson` 0–10; веса — целые ≥ 0; год не `CLOSED` |
| `createPupil`, `updatePupil` | `lastName`, `firstName`, `middleName`, `birthDate`, `isActive` | как РГ-3; дата рождения в прошлом |
| `recordPaperConsent` | `pupilId`, `signerName`, `signedOn`, `textVersion`, `storageNote` | подписант и дата обязательны; версия текста существует |
| `revokeConsent` | `consentId`, `reason` | согласие `ACTIVE` |
| `enrollPupil` | `pupilId`, `gradeId`, `startsOn` | см. §5.9 |
| `unenrollPupil` | `pupilId`, `endsOn` | активное зачисление есть |
| `transferPupil` | `pupilId`, `toGradeId`, `onDate` | см. §5.11 |

**Не принимается с клиента:** `yearId` текущего года (берётся сервером), `status`, `organizationId`.

## 5. Happy path

### 5.1 `createYear` / `activateYear` / `closeYear`

- `createYear`: статус `DRAFT`; для каждой активной группы копируются `grade_settings` и назначения прошлого года (admin правит до активации). Журнал `school.year_created`.
- `activateYear`: блокировка строк `academic_year` организации; нет другого `ACTIVE` (R-1, INV-01) → `ACTIVE`. Журнал `school.year_activated`. Пока год не активен, уроки создавать нельзя.
- `closeYear`: статус `CLOSED`; активные зачисления и назначения получают дату окончания года (группа остаётся активной); для teacher данные года — только чтение (AZ-P5). Журнал `school.year_closed`. Год **не** переоткрывается (Q-01 lifecycle).
- **Постусловие:** после `closeYear` нет `ACTIVE` года до следующей `activateYear` (экраны показывают D1, [`ui_states_contract.md`](../../../design/ui_states_contract.md)).

### 5.2 `createGroup` / `updateGroup` / `deactivateGroup`

- Создание: `language = RU`, `is_active = true`; `grade_settings` создаются для активного года (или `DRAFT`) значениями по умолчанию: все параметры включены, `maxVersesPerLesson = 3`, веса 1, `recitationDaysN = 3`. Журнал `school.group_created`.
- `deactivateGroup`: допустима, если у группы нет активных зачислений **или** admin подтвердил исключение (Q-02); уроки и история остаются. Журнал `school.group_deactivated`.

### 5.3 `setGroupLanguage`

- Предупреждение интерфейса (ЯГ-4): тексты стихов во всех уроках группы будут показаны в новом переводе; сохранённые оценки не меняются. Журнал `school.group_language_changed` (было → стало).

### 5.4 `assignTeacher` / `unassignTeacher`

- UNIQUE `(user, grade, year)`; повтор идемпотентен. Снятие назначения не удаляет уроков и проверок: ссылки на ведущего и автора сохраняются (УЧ-4). Если у учителя остались уроки с незавершённой проверкой — предупреждение, не запрет. Журнал `school.teacher_assigned` / `school.teacher_unassigned`.

### 5.5 `updateGradeSettings`

- Настройки принадлежат паре «группа + год»; изменение веса действует на **новые** проверки, прошлые баллы заморожены (INV-13). Журнал `school.settings_changed` (изменённые ключи, без ПД).

### 5.6 `createPupil` / `updatePupil` / `deactivatePupil`

- Карточку можно создать без согласия (СО-4); зачислить — нельзя. Карточка без группы — в списке «неназначенные». `deactivatePupil` закрывает активное зачисление. Журнал `school.pupil_created` / `school.pupil_updated` / `school.pupil_deactivated`.

### 5.7 `recordPaperConsent`

- Создаётся `child_data_consent` (`channel = PAPER`, `ACTIVE`, `marked_by`). Журнал `school.consent_recorded` (ссылка на ребёнка и согласие; подписант — **не** в журнале текстом, он хранится в записи согласия).

### 5.8 `revokeConsent`

- `ACTIVE → REVOKED`, `revoked_at`. Если у ребёнка не остаётся действующих согласий — admin уведомляется и создаёт запрос на удаление ([`deletion_requests_contract.md`](./deletion_requests_contract.md)); зачисление блокируется (R-5). Журнал `school.consent_revoked`.

### 5.9 `enrollPupil`

- **Предусловия:** есть действующее согласие (R-5, INV-08); нет активного зачисления (R-2, INV-07); группа активна; год `DRAFT`/`ACTIVE`; teacher — группа своя (AZ-P6).
- **Транзакция:** блокировка строки ученика; проверка; создание `enrollment` (`ends_on = NULL`). Журнал `school.pupil_enrolled`.

### 5.10 `unenrollPupil`

- Закрывает активное зачисление (`ends_on`); история проверок остаётся (INV-09, БП-7); ученик — «без группы». Teacher — только в своей группе и в активном году. Журнал `school.pupil_unenrolled`.

### 5.11 `transferPupil`

- Только `ADMIN`. Транзакция: блокировка ученика → закрыть активное зачисление датой `onDate − 1` (если `onDate` позже `startsOn`) → создать новое в `toGradeId`. Отметки ДЗ и кирпичики не меняются (INV-09, INV-10). Журнал `school.pupil_transferred` (из группы → в группу).

## 6. Negative paths (business)

| Случай | Условие | Код | Ключ сообщения | Исход |
|--------|---------|-----|----------------|-------|
| Второй активный год | на `activateYear` уже есть `ACTIVE` | `SCHOOL_YEAR_ACTIVE_EXISTS` | `admin.year.active_exists` | без изменений |
| Пересечение дат года | интервалы пересекаются | `SCHOOL_YEAR_OVERLAP` | `admin.year.overlap` | форма сохранена |
| Год не в нужном статусе | `activateYear` не из `DRAFT`, `closeYear` не из `ACTIVE` | `SCHOOL_YEAR_STATUS_INVALID` | `admin.year.status_invalid` | без изменений |
| Язык недоступен | `EN` без `READY` перевода | `SCHOOL_LANGUAGE_UNAVAILABLE` | `admin.group.language_unavailable` | отказ |
| Назначение не `TEACHER` | у пользователя нет роли | `SCHOOL_NOT_A_TEACHER` | `admin.group.not_teacher` | отказ |
| Нет согласия | зачисление без `ACTIVE` согласия | `SCHOOL_CONSENT_REQUIRED` | `admin.people.consent_required` | не зачислен |
| Второе зачисление | есть активное | `SCHOOL_ALREADY_ENROLLED` | `admin.people.already_enrolled` | предложить перевод |
| Нет активного зачисления | `unenroll`/`transfer` без него | `SCHOOL_NOT_ENROLLED` | `admin.people.not_enrolled` | без изменений |
| Закрытый год | teacher изменяет данные закрытого года | `FORBIDDEN` | `common.errors.year_closed` | AZ-P5 |
| Группа неактивна | зачисление в неактивную | `SCHOOL_GROUP_INACTIVE` | `admin.group.inactive` | отказ |
| Чужая группа | teacher вне назначения | `NOT_FOUND` | `common.errors.not_found` | AZ-D4 |
| Дубликат имени группы | совпадает с активной | `VALIDATION` (`fields.name`) | `admin.group.name_taken` | форма сохранена |
| Параллельное изменение | зачисление изменено между чтением и записью | `CONFLICT` | `common.errors.conflict` | обновить |

## 7. Security paths

| Путь | Требование | AZ |
|------|------------|----|
| S-1 | Год, группы, назначения, карточки учеников, согласия — только `ADMIN` | AZ-10…AZ-12, AZ-20, AZ-22 |
| S-2 | Teacher зачисляет / исключает только в своей группе активного года | AZ-23, AZ-P6 |
| S-3 | Teacher видит о согласии только «есть / нет» (СО-7); подписант и место хранения — admin | AZ-21 |
| S-4 | Идентификаторы группы и ученика не доказывают права: принадлежность — по `teacher_assignment` в БД | AZ-D4 |
| S-5 | Данные ребёнка (ФИО, дата рождения) не попадают в журнал текстом; в журнале — ссылки (INV-23) | — |

## 8. Concurrency & idempotency

| Гонка | Защита | Исход |
|-------|--------|-------|
| Две активации годов | partial unique index (R-1) + блокировка | один успех |
| Два зачисления одного ученика | partial unique index `(pupil_id) WHERE ends_on IS NULL` (R-2) | второй `SCHOOL_ALREADY_ENROLLED` |
| Перевод и исключение параллельно | блокировка строки ученика; порядок: ученик → зачисление | второй `CONFLICT` |
| Двойное назначение учителя | UNIQUE `(user, grade, year)` | идемпотентно |
| `closeYear` во время проверки | блокировка года; проверка в use-case проверки читает статус внутри транзакции | сохранение проверки получает `FORBIDDEN` |

## 9. Drift & consistency

| Риск | Guard |
|------|-------|
| Урок создан вне `ACTIVE` года | R-3, [`homework_check_contract.md`](./homework_check_contract.md) §5.1 |
| `lead_teacher_id` без назначения | R-4; тест при `unassignTeacher` |
| Группа `EN` без `READY` перевода после перезагрузки | тест; предупреждение admin (D9) |
| Зачисление в закрытый год | проверка статуса года в `enrollPupil` |
| Настройки года не скопированы | тест `createYear` |

## 10. Policy & layer touchpoints

| Слой | Роль |
|------|------|
| `domain` | `canActivateYear`, `validateYearDates`, `canEnroll`, схемы входов |
| `policy-server` | `requireRole(ADMIN)`, `requireAssignedTeacher(gradeId, yearId)` |
| DAL (`src/data/school/**`) | транзакции §5, журнал |
| Запрещено | прямой `UPDATE academic_year.status`; логика согласий в компонентах |

## 11. Acceptance criteria

- [ ] `activateYear` при существующем `ACTIVE` отклоняется; параллельные активации дают один успех — исход: тест (INV-01).
- [ ] `closeYear` закрывает зачисления и назначения датой; teacher получает только чтение — исход: тест.
- [ ] Зачисление без согласия отклонено; второе активное зачисление отклонено — исход: тесты (INV-07, INV-08).
- [ ] Перевод не меняет отметки ДЗ и остаток кирпичиков — исход: тест (INV-09, INV-10).
- [ ] `EN` недоступен, пока перевод не `READY` — исход: тест.
- [ ] Teacher не зачисляет в чужую группу — исход: тест policy.
- [ ] Каждая операция пишет журнал — исход: тест.

## 12. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| Q-01 | Можно ли переоткрыть закрытый год (lifecycle Q-01) | Нет в MVP; ошибки правит admin с причиной | владелец | — |
| Q-02 | Деактивация группы с активными зачислениями | Разрешена с подтверждением; ученики становятся «без группы» | владелец | W9-05 |
| Q-03 | Перевод между группами в течение года и момент учёта в аналитике (БП-7) | `onDate` — граница; аналитика по зачислению (БП-1) | architect | `analytics_screens_spec` |
| Q-04 | Срок напоминания о карточке без согласия (30 дней, СО-4) | Подсветка в «Школа», без автоудаления | владелец | W9-05 |

## 13. Related documents

| Document | Relationship |
|----------|--------------|
| [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §5.3–§5.5 | Переходы |
| [`homework_check_contract.md`](./homework_check_contract.md) | Уроки и проверка |
| [`deletion_requests_contract.md`](./deletion_requests_contract.md) | Отзыв согласия → удаление |
| [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) | Права |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W8-04

## 14. Agent notes

- Не создавать зачисление без проверки согласия и активного зачисления.
- Не переоткрывать закрытый год и не создавать уроки вне `ACTIVE`.
- Не менять статус года мимо use-case.
- Не писать ФИО детей в журнал текстом.
- Не менять `weights` задним числом: прошлые баллы заморожены.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W8-04) |
