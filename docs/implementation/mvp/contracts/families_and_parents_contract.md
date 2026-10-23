# Families and parents contract

**Тип:** Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-23  
**Волна:** W8-12  
**Зависит от:** [`adr_013_families_and_parents.md`](../../../prds/07_governance/adr_013_families_and_parents.md), [`sunday_school_data_analytics_spec.md`](../../../my_specs/sunday_school_data_analytics_spec.md) §2.3–§2.6, §9.2, БП-9, [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §4, §6, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) (AZ-58…AZ-64), [`deletion_requests_contract.md`](./deletion_requests_contract.md), [`access_requests_and_roles_contract.md`](./access_requests_and_roles_contract.md), [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) INV-23, INV-25, PKG-03  
**Связанные документы:** [`change_log_contract.md`](./change_log_contract.md), [`families_and_parents_screens_spec.md`](../specs/families_and_parents_screens_spec.md), [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) §8.4, [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** бизнес-правила — спецификация (СМ-1…СМ-10, СО-1…СО-7, УД-1…УД-3). Почта и cron не используются (ADR-013). Context7 в сессии написания не вызывался.  
**Migrated from:** [`docs/my_specs/sunday_school_data_analytics_spec.md`](../../../my_specs/sunday_school_data_analytics_spec.md) §2.3–§2.6

---

## 1. Purpose

Контракт семей, роли `parent`, электронного согласия, запроса родителя на удаление, контактов для учителя и дайджеста без отправки. Читают: исполнитель P13, `reviewer`. Правила СМ, СО и УД не пересказываются целиком: канон поведения — этот файл.

## 2. Scope / Out of scope

**В scope:** `family`, `family_adult`, `pupil.family_id`, электронное и бумажное `child_data_consent` с `guardian_adult_id`, роль `PARENT` при включённом флаге, запрос `CHILD_DATA` от родителя, чтение контактов учителем, `weekly_digest` без `sent_at`.  
**Вне scope:** голос и `/verse*` (волна 3); письма; cron; медицинские поля и экстренный контакт; выполнение удаления (остаётся [`deletion_requests_contract.md`](./deletion_requests_contract.md)).

Пока `features.parents = false`, операции §4 отвечают `FAMILY_FLAG_OFF`, кроме тех, что уже есть в MVP (бумажная отметка admin и запрос ребёнка, созданный admin).

## 3. Определения

| Термин | Значение |
|--------|----------|
| Семья | Строка `family`. Пустая (нет взрослых и детей) не сохраняется (СМ-5) |
| Взрослый | Строка `family_adult`. Тип `MOTHER`, `FATHER` или `GUARDIAN`. Учётная запись необязательна (СМ-4) |
| Свой ребёнок | Ученик, чья `family_id` указывает на семью, где текущий пользователь — `family_adult.user_id` |
| Действующее согласие | `child_data_consent` ребёнка со статусом действующим и без `revoked_at` |
| Дайджест | Строка `weekly_digest` на пользователя и `period_start`. `sent_at` в этой волне не заполняется |

Коды ошибок ниже **добавить в domain** до кода P13 (`FAMILY_`, `CONSENT_` — новые префиксы `MUTATION_ERROR_CODE_PREFIXES`). Общие `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `CONFLICT` уже есть. Отказ роли при выключенном флаге остаётся `ACCESS_ROLE_UNAVAILABLE`.

## 4. Операции

| Операция | Актор | Эффект | AZ |
|----------|-------|--------|----|
| `upsertFamily` | `ADMIN` | название, адрес, примечание | AZ-58 |
| `addFamilyAdult` / `updateFamilyAdult` / `removeFamilyAdult` | `ADMIN` | взрослый семьи | AZ-58 |
| `attachPupil` / `transferPupil` | `ADMIN` | ребёнок в семье; перенос | AZ-58 |
| `mergeFamilies` | `ADMIN` | дубликаты семей | AZ-58 |
| `approveParentRequest` | `ADMIN` | роль `PARENT` и связь с семьёй | AZ-59 |
| `updateOwnAdultContacts` | `PARENT` | свои телефон и email | AZ-60 |
| `giveElectronicConsent` | `PARENT` | согласие по своему ребёнку | AZ-61 |
| `revokeElectronicConsent` | `PARENT` | отзыв; при последнем согласии — запрос на удаление | AZ-61, AZ-62 |
| `createOwnChildDeletionRequest` / `cancelOwnChildDeletionRequest` | `PARENT` | запрос УД-1, отмена УД-3 | AZ-62 |
| `listFamilyContacts` | `TEACHER` (свои), `ADMIN` | ФИО, тип, телефоны | AZ-63 |
| `ensureWeeklyDigest` | система | строка дайджеста, если её нет | AZ-64 |

«Своя группа» учителя — как в контракте кирпичиков. Выполнение запроса и бумажная отметка admin остаются в контрактах удаления и учебного года.

## 5. Входы

| Операция | Поле | Правило |
|----------|------|---------|
| `upsertFamily` | `name` | непустое; адрес и примечание необязательны |
| `addFamilyAdult` | `relation`, ФИО, `phones`, `email` | не больше одной `MOTHER` и одного `FATHER` (СМ-3); `userId` необязателен |
| `attachPupil` | `pupilId`, `familyId` | у ребёнка ещё нет семьи (СМ-1) |
| `transferPupil` | `pupilId`, `targetFamilyId` | ребёнок покидает прежнюю семью в той же транзакции |
| `mergeFamilies` | `sourceFamilyId`, `targetFamilyId` | взрослые и дети переносятся; типы СМ-3 проверяются до записи; источник удаляется, если опустел |
| `approveParentRequest` | способ | один из трёх: связать с существующим взрослым без учётки; добавить в семью ребёнка; создать семью для детей без семьи. «Создать» недоступен, если ребёнок уже в семье |
| `updateOwnAdultContacts` | `phones`, `email` | только строка, где `user_id` — сессия; ФИО и тип с клиента не принимаются |
| `giveElectronicConsent` | `pupilId`, `accepted` | `accepted = true`; флажок по умолчанию выключен; версия текста — с сервера |
| `revokeElectronicConsent` | `pupilId`, `confirmDeletion` | если это последнее согласие, `confirmDeletion = true`, иначе отказ до создания запроса |
| `createOwnChildDeletionRequest` | `pupilId`, `reason` | причина необязательна; не больше одного открытого запроса на ребёнка |
| `ensureWeeklyDigest` | — | субъект из сессии; период — календарная неделя `school_timezone` |

**Не принимается с клиента:** автор, время, признак «своей» семьи, `sent_at`, канал согласия.

## 6. Happy path

### 6.1 Семья

- Admin создаёт семью вместе хотя бы с одним взрослым или ребёнком. Пустой черновик не пишется (`FAMILY_EMPTY`).
- Добавление ребёнка, у которого уже есть семья, — только `transferPupil`, не второе членство.
- Исключение ребёнка снимает `family_id`. Если взрослых не осталось, операция всё равно проходит и журнал фиксирует предупреждение (СМ-7), семью не удаляет само.
- Объединение и перенос пишут журнал `family.merged` / `family.pupil_transferred`.
- Удаление учётной записи взрослого стирает его ФИО и контакты в строке и оставляет тип (СМ-9) — это делает процедура удаления, не отдельная операция семьи.

### 6.2 Одобрение заявки

При флаге `approveParentRequest` расширяет `approveRequest`: пользователь становится `ACTIVE`, получает роль `PARENT`, связывается со взрослым или создаётся семья (название по умолчанию — фамилия). После входа родитель, у чьего ребёнка нет его электронного согласия, попадает на `/child/consent` и не видит данные этого ребёнка (СО-2).

При выключенном флаге путь прежний: `ACCESS_ROLE_UNAVAILABLE`, семьи нет.

### 6.3 Согласие

- Электронное: `channel = ELECTRONIC`, `guardian_adult_id` — взрослый сессии, версия и дата с сервера. Журнал `consent.given`.
- Бумажное по-прежнему отмечает admin (СО-3).
- Отзыв непоследнего согласия: строка получает `revoked_at`, родитель теряет доступ к ребёнку, данные остаются. Журнал `consent.revoked`.
- Отзыв последнего: в той же транзакции создаётся `deletion_request` типа данных ребёнка (`deletion.requested`). Данные не стираются до `executeDeletion`.

### 6.4 Запрос родителя

Родитель создаёт и отменяет запрос по своему ребёнку. Другие взрослые этой семьи с учётной записью видят открытый запрос на «Данных и согласиях». Письма нет. Выполнение, отказ и план — admin, контракт удаления.

Пока флаг выключен, запрос ребёнка создаёт только admin.

### 6.5 Контакты учителя

`listFamilyContacts` возвращает ФИО, тип связи и телефоны взрослых учеников своих групп. Адрес, примечание и email в ответ учителя не входят (СМ-8). Admin на странице семьи видит адрес и примечание.

### 6.6 Дайджест

`ensureWeeklyDigest` при открытии `/child`: если строки пользователя на `period_start` нет, вставить одну. Полезная нагрузка — идентификаторы новых выдач, действующих штрафов и проверок «сдано позже» за период, без ФИО в журнале. `sent_at` не ставится. Повтор в ту же неделю ничего не пишет (L-6). Уникальность `(user_id, period_start)` — в БД; гонка даёт `CONFLICT` и читает уже вставленную строку.

## 7. Negative paths (business)

| Случай | Условие | Код | Ключ сообщения | Исход |
|--------|---------|-----|----------------|-------|
| Флаг выключен | операция §4, которой нет в MVP | `FAMILY_FLAG_OFF` | `parent.flag_off` | данных нет |
| Пустая семья | нет ни взрослого, ни ребёнка | `FAMILY_EMPTY` | `admin.family.empty` | не сохранена |
| Ребёнок уже в семье | «создать семью» или повторный `attachPupil` | `FAMILY_CHILD_HAS_FAMILY` | `admin.family.child_taken` | отказ |
| Вторая мать или отец | тип занят | `FAMILY_RELATION_LIMIT` | `admin.family.relation_limit` | отказ |
| Нет членства | parent и чужой ребёнок | `NOT_FOUND` | `common.errors.not_found` | 404 |
| Согласие не отмечено | `accepted` не true | `VALIDATION` | `parent.consent.required` | форма на месте |
| Отзыв последнего без подтверждения | `confirmDeletion` не true | `CONSENT_LAST_REQUIRES_DELETION` | `parent.consent.confirm_deletion` | запрос не создан |
| Уже есть открытый запрос | тот же ребёнок | `CONFLICT` | `parent.deletion.already_open` | отказ |
| Повтор дайджеста | строка недели есть | — | — | чтение существующей |

## 8. Security paths

| Путь | Требование | AZ |
|------|------------|----|
| S-1 | Семью пишет только admin | AZ-58 |
| S-2 | Parent видит только детей своих семей; чужой id — 404 | AZ-60, AZ-D4 |
| S-3 | Согласие и запрос удаления — только свой ребёнок | AZ-61, AZ-62 |
| S-4 | Учитель не получает адрес, примечание и email семьи | AZ-63 |
| S-5 | Флаг проверяется в use-case, не только в UI | ADR-013 |
| S-6 | Журнал хранит ссылки, не ФИО и не телефоны | INV-23 |
| S-7 | Teacher и аноним на `/family` и `/child` | 404 при флаге выкл.; при флаге вкл. teacher — 403 (AZ-D3), кроме чтения контактов на карточке своего ученика |

## 9. Concurrency & idempotency

| Гонка | Защита | Исход |
|-------|--------|-------|
| Два admin привязывают одного ребёнка | блокировка строки ученика; одно `family_id` | второй — `FAMILY_CHILD_HAS_FAMILY` |
| Две матери в одной транзакции | частичный уникальный индекс `MOTHER` / `FATHER` | второй — `FAMILY_RELATION_LIMIT` |
| Два открытия дайджеста | уникальность `(user_id, period_start)` | одна строка |
| Два запроса удаления одного ребёнка | не больше одного открытого | второй — `CONFLICT` |

## 10. Drift & consistency

| Риск | Guard |
|------|-------|
| Семья создана при выключенном флаге | тест ADR-013 |
| Parent видит чужого ребёнка | тест policy, 404 |
| Учитель получил адрес | тест формы ответа |
| `sent_at` заполнен или ушло письмо | тест: поле пусто; нет вызова почты |
| Вторая строка дайджеста за неделю | тест уникальности |
| MVP читает `family` | PKG-03 |
| Голос на экране ребёнка | спека экранов §2 |

## 11. Policy & layer touchpoints

| Слой | Роль |
|------|------|
| `domain` | правила СМ-1, СМ-3, СМ-5, коды `FAMILY_` / `CONSENT_` |
| `policy-server` | флаг, admin, своя семья, своя группа учителя |
| DAL | транзакции §6, журнал |
| `approveRequest` | при флаге делегирует связь с семьёй в `approveParentRequest` |
| `createChildDeletionRequest` | при флаге родительский путь — §6.4; admin-путь MVP сохранён |

## 12. Acceptance criteria

- [ ] Ребёнок не оказывается в двух семьях — исход: тест domain.
- [ ] Вторая `MOTHER` отклоняется — исход: тест.
- [ ] Пустая семья не сохраняется — исход: тест.
- [ ] При выключенном флаге `PARENT` не выдаётся — исход: тест `approveRequest`.
- [ ] Отзыв последнего согласия создаёт запрос и не вызывает `eraseChildData` — исход: тест.
- [ ] Учитель не видит адрес семьи — исход: тест DTO.
- [ ] Вторая строка дайджеста за неделю не создаётся, `sent_at` пуст — исход: тест.
- [ ] Чужой ребёнок у parent — `NOT_FOUND` — исход: тест policy.

## 13. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| — | — | — | — |

## 14. Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_013_families_and_parents.md`](../../../prds/07_governance/adr_013_families_and_parents.md) | Флаг, дайджест без почты, сид до UI |
| [`deletion_requests_contract.md`](./deletion_requests_contract.md) | Выполнение запроса |
| [`access_requests_and_roles_contract.md`](./access_requests_and_roles_contract.md) | Одобрение без флага |
| [`P13_phase_description.md`](../phases_tasks_descriptions/P13_phase_description.md) | Фаза |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W8-12

## 15. Agent notes

- Не выдавать `PARENT` при выключенном флаге.
- Не слать письма и не ставить `sent_at`.
- Не принимать состав семьи и канал согласия с клиента как доказательство права.
- Не показывать родителю чужих детей и не отдавать учителю адрес.
- Коды `FAMILY_` и `CONSENT_` добавить в domain до использования в DAL.

## Change log

| Date | Change |
|------|--------|
| 2026-10-23 | v1.0 — Canonical (W8-12, P13) |
