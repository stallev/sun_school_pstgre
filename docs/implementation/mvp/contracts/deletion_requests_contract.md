# Deletion requests contract

**Тип:** Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W8-08  
**Зависит от:** [`monorepo_boundaries_contract.md`](./monorepo_boundaries_contract.md), [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §5.1, §5.9, [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) INV-16, INV-17, INV-22, INV-23, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) (AZ-06, AZ-07, AZ-P1), [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §5.6 (`deletion_request`), §9, [`sunday_school_data_analytics_spec.md`](../../../my_specs/sunday_school_data_analytics_spec.md) §2.5 (УД-1…УД-11), СО-6  
**Связанные документы:** [`access_requests_and_roles_contract.md`](./access_requests_and_roles_contract.md) §5.9, [`change_log_contract.md`](./change_log_contract.md), [`bricks_ledger_contract.md`](./bricks_ledger_contract.md), [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md) §7.1, [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** бизнес-правила — спецификация (УД-1…УД-11, решение владельца: данные ребёнка удаляются полностью); срок 15 дней — **требует юридической проверки** (12.2 п. 26); окно восстановления Neon (УД-11) — по документации Neon, значение указывается в тексте согласия на P0x. `privacy_data_handling` (W5-04) на lean не создаётся: классификация данных — [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §9. Context7 недоступен.

---

## 1. Purpose

Контракт жизненного цикла запросов на удаление ПД и самой процедуры «удалить или обезличить». Читают: исполнитель P04/P07, авторы `/deletions`, `reviewer` (T3, sensitive).

## 2. Scope / Out of scope

**В scope:** запросы на удаление учётной записи и данных ребёнка, план и выполнение, обезличивание, сроки.  
**Вне scope:** электронный запрос опекуна и страница «Данные и согласия» (post-MVP); семьи, достижения, голос (post-MVP; процедура удаления дополняется при их включении).

## 3. Операции

| Операция | Актор | Переход | AZ |
|----------|-------|---------|----|
| `createDeletionRequest` (учётная запись) | пользователь (кроме `DELETED`) | `∅ → NEW` | AZ-06 |
| `createChildDeletionRequest` | `ADMIN` по обращению опекуна | `∅ → NEW` | AZ-07 |
| `takeRequest` | `ADMIN` | `NEW → IN_PROGRESS` | AZ-07 |
| `cancelRequest` | автор запроса | `NEW\|IN_PROGRESS → CANCELLED` | AZ-06 |
| `rejectRequest` | `ADMIN` | `NEW\|IN_PROGRESS → REJECTED` | AZ-07 |
| `previewDeletionPlan` | `ADMIN` | чтение плана | AZ-07 |
| `executeDeletion` | `ADMIN` | `IN_PROGRESS → DONE` | AZ-07 |
| `anonymizeUser` | внутренняя (из `executeDeletion`, `mergeUsers`) | `* → DELETED` | — |
| `eraseChildData` | внутренняя (из `executeDeletion`) | удаление данных ребёнка | — |

## 4. Входы

| Операция | Поле | Правило |
|----------|------|---------|
| `createDeletionRequest` | `reason` | необязательно, ≤ 500 |
| `createChildDeletionRequest` | `pupilId`, `guardianNote` | ребёнок существует; `guardianNote` — кто обратился (текстом, **без** ФИО в журнале — INV-23) |
| `rejectRequest` | `requestId`, `reason` | **обязательна**, ≤ 500; видна автору (УД-6) |
| `cancelRequest` | `requestId` | запрос `NEW`/`IN_PROGRESS`; автор |
| `executeDeletion` | `requestId`, `confirmWord`, `acknowledgePlan` | слово подтверждения — `admin.deletions.confirm_word` (ru «удалить», en «delete»); проверка `matchesDeletionConfirmWord` в `@sunschool/domain`; `acknowledgePlan = true` |

`due_on` = дата создания + 15 календарных дней в поясе школы (УД-5); вычисляется сервером.

## 5. Happy path

### 5.1 `createDeletionRequest` / `createChildDeletionRequest`

- **Предусловия:** у субъекта нет открытого запроса (`NEW`/`IN_PROGRESS`) — одна открытая запись на субъект (УД-2); субъект не `DELETED`.
- **Транзакция:** вставка `deletion_request` (`NEW`, `due_on`, `requested_by`); запись в журнале.
- **Журнал:** `deletion.requested`.
- **Поведение до исполнения:** учётная запись и данные работают как обычно (УД-4).

### 5.2 `takeRequest`, `cancelRequest`, `rejectRequest`

- `takeRequest`: исполнитель (`taken_by`). Журнал `deletion.taken`.
- `cancelRequest`: только автор, пока не выполнен (УД-3). Журнал `deletion.cancelled`.
- `rejectRequest`: причина обязательна и видна автору; удаление по закону не отклоняется по усмотрению (УД-6) — интерфейс подсказывает допустимые причины. Журнал `deletion.rejected`.

### 5.3 `previewDeletionPlan`

Показывает `admin` без изменений: сколько записей будет **удалено** и **обезличено** по категориям (§6), предупреждения (§7). Результат — вычисляется на момент просмотра; при выполнении план строится заново внутри транзакции.

### 5.4 `executeDeletion`

- **Предусловия:** запрос `IN_PROGRESS`; `confirmWord` верен; `acknowledgePlan`; для запроса **последнего admin** — назначен другой admin (УД-9); собственный запрос admin выполняет другой admin (если admin один — тот же, с отдельным подтверждением, УД-9).
- **Транзакция (одна):** блокировка запроса и субъекта → построить план → выполнить §6 → сохранить `summary` (счётчики по категориям, без ПД) → `DONE`, `resolved_by`, `resolved_at` → журнал.
- **Журнал:** `deletion.executed`; для пользователя дополнительно `deletion.user_anonymized`.
- **Постусловия:** субъект недоступен; аналитика пересчитывается при чтении (данные ребёнка исчезли); запись о запросе остаётся в обезличенном виде.

## 6. Что удаляется и что обезличивается (УД-7, схема §9)

### 6.1 Учётная запись взрослого (`anonymizeUser`)

| Данные | Действие |
|--------|----------|
| `login_identity` (идентификаторы Telegram, email и хэш пароля администратора) | удалить |
| `app_user.*_name`, `email` | стереть; `status = DELETED`; `deleted_ordinal = N` («Удалённый пользователь №N») |
| `user_role`, `teacher_assignment` | удалить (предупреждение §7, если назначен на группу активного года) |
| Авторство: уроки (`lead_teacher_id`), проверки (`checked_by`), выдачи (`issued_by`), `audit_log.actor_user_id` | **оставить**, ссылка ведёт на обезличенную запись |
| `privacy_consent`, `access_request` (решения, версия, даты) | оставить; `full_name_snapshot` стереть |
| Сам запрос на удаление | оставить: даты, кто запросил/выполнил, сводка |
| `audit_log` (ссылки на пользователя) | оставить; в свободном тексте (`reason`) ФИО заменяется обезличенным (INV-16 исключение) |

### 6.2 Данные ребёнка (`eraseChildData`) — **полное удаление**

| Данные | Действие |
|--------|----------|
| `pupil` (карточка) | удалить |
| `enrollment`, `child_data_consent` | удалить |
| `homework_check`, `homework_verse_score`, `homework_score_event` | удалить |
| `brick_ledger` | удалить (исключение INV-17) |
| `analytics_pupil_year_snapshot` | удалить все версии; затем пересчитать `analytics_group_year_snapshot` затронутых «группа + год» без ребёнка и удалить прежние версии этих пар — вклад ребёнка не остаётся в агрегатах (P08, [`analytics_year_snapshots_contract.md`](./analytics_year_snapshots_contract.md) §6.3, INV-22); выполняется **до** удаления `homework_check` |
| Post-MVP (`achievement_award`, `penalty`, `recitation_attempt`, голос, семья) | удалить / исключить при включении волн; в MVP таблицы пусты |
| `audit_log` записи о ребёнке | оставить; `old_value`/`new_value` стереть, ссылка — «ребёнок (данные удалены)» (исключение БП-8) |
| `deletion_request` | оставить: без ФИО ребёнка |

### 6.3 Последствия

Групповые средние и графики пересчитываются при следующем чтении; admin видит пометку «данные изменены: удаление по запросу опекуна» на экранах аналитики периода (спец. 9.1). Ранее выгруженные отчёты не меняются.

### 6.4 Категории плана (`DELETION_DATA_CATEGORY`)

Строки плана (`previewDeletionPlan`, `summary`) используют коды из `packages/domain/src/deletion/constants.ts` (`DELETION_DATA_CATEGORY`, `DELETION_PLAN_ACTION`). Ключи UI — `admin.deletions.category_*`.

| Код | Тип запроса | Действие по умолчанию |
|-----|-------------|------------------------|
| `login_identity`, `user_role`, `teacher_assignment`, `pupil`, `enrollment`, `child_data_consent`, `homework_*`, `brick_ledger`, `achievement_award`, `penalty`, `recitation_attempt` | account / child | `delete` (счётчик = число строк) |
| `app_user`, `privacy_consent`, `access_request`, `audit_log_user_text`, `audit_log_child` | account / child | `anonymize` |
| `deletion_request` | оба | `keep` (1) |

## 7. Предупреждения плана

| Условие | Предупреждение |
|---------|----------------|
| Пользователь — единственный `ADMIN` | выполнение невозможно, пока не назначен другой (УД-9) |
| Назначен на группу активного года | сначала назначить замену (по умолчанию — предупреждение, не запрет) |
| У пользователя есть уроки с незавершённой проверкой | напомнить передать ведение |
| У ребёнка в группе единственный контакт опекуна | показать (post-MVP, при наличии семей) |
| Запрос просрочен (`due_on` < сегодня) | подсветка (УД-5); статус не меняется автоматически |

## 8. Negative paths (business)

| Случай | Условие | Код | Ключ сообщения | Исход |
|--------|---------|-----|----------------|-------|
| Уже есть открытый запрос | на субъект | `DELETION_ALREADY_OPEN` | `common.deletion.already_open` | возвращается существующий |
| Субъект удалён | `DELETED` | `NOT_FOUND` | `common.errors.not_found` | — |
| Нет причины отказа | `reject` без `reason` | `VALIDATION` (`fields.reason`) | `common.errors.reason_required` | не отклонён |
| Неверное слово | `confirmWord` не совпало | `VALIDATION` (`fields.confirmWord`) | `admin.deletions.confirm_wrong` | не выполнено |
| План не подтверждён | `acknowledgePlan = false` | `VALIDATION` | `admin.deletions.plan_required` | — |
| Статус не позволяет | выполнение не из `IN_PROGRESS`; отмена выполненного | `DELETION_STATUS_INVALID` | `admin.deletions.status_invalid` | без изменений |
| Последний admin | субъект — единственный `ADMIN` | `DELETION_LAST_ADMIN` | `admin.deletions.last_admin` | отказ (УД-9) |
| Свой запрос выполняет тот же при двух admin | `resolved_by = requested_by` при наличии другого admin | `DELETION_SELF_EXECUTE` | `admin.deletions.self_execute` | отказ (УД-9) |
| Запрос изменён | параллельное действие | `CONFLICT` | `common.errors.conflict` | обновить |

## 9. Security paths

| Путь | Требование | AZ |
|------|------------|----|
| S-1 | Создать запрос на свою запись — любой не `DELETED` (в т.ч. `REQUEST_PENDING`, `REJECTED`; `REGISTRATION` — Q-01 матрицы) | AZ-06 |
| S-2 | Выполнить, взять, отклонить, просмотреть план — только `ADMIN`; по БД | AZ-07 |
| S-3 | Teacher не создаёт запрос на ребёнка; запрос по ребёнку — admin по обращению опекуна (до post-MVP кабинета родителя) | AZ-07 |
| S-4 | `executeDeletion` — sensitive (необратимо): подтверждение словом, одна транзакция, журнал; тест перед включением | INV-22 |
| S-5 | Процедура — единственное место, где разрешены `DELETE` над `brick_ledger` и правка `audit_log` | R-6, §7 [`change_log_contract.md`](./change_log_contract.md) |
| S-6 | ФИО в `deletion_request`, журнале и `summary` не сохраняются | INV-23 |

## 10. Concurrency & idempotency

| Гонка | Защита | Исход |
|-------|--------|-------|
| Два открытых запроса на субъект | partial unique `(subject) WHERE status IN (NEW, IN_PROGRESS)` | второй `DELETION_ALREADY_OPEN` |
| Два admin выполняют один запрос | блокировка строки запроса; проверка статуса внутри | один успех |
| Выполнение и отмена автором | блокировка запроса | второй `DELETION_STATUS_INVALID` |
| Выполнение и параллельная проверка ДЗ ребёнка | блокировка ученика; проверка завершена до удаления | согласовано; новая запись не создаётся (ученик удалён → `NOT_FOUND`) |
| Повтор `executeDeletion` | запрос `DONE` | идемпотентно возвращает сводку |
| Восстановление БД из бэкапа | список выполненных запросов хранится; процедура применяется повторно (УД-11) | данные снова удалены |

## 11. Drift & consistency

| Риск | Guard |
|------|-------|
| Новая таблица с ПД не включена в процедуру | при добавлении таблицы с ПД — строка в §6 и схеме §9 (review) |
| Журнал хранит ФИО текстом | INV-23, тест сериализации |
| Срок 15 дней изменён законом | `DELETION_DUE_CALENDAR_DAYS` в `@sunschool/domain`, не в UI; Q-01 |
| Обезличивание «Удалённый пользователь №N» нарушает уникальность | `deleted_ordinal` — последовательность в организации |
| Backup-окно не указано в согласии | чек-лист prod (P07) |

## 12. Policy & layer touchpoints

| Слой | Роль |
|------|------|
| `domain` | `computeDueOn`, `buildDeletionPlan` (чистая), `canExecute` |
| `policy-server` | `requireRole(ADMIN)`, «не свой запрос» |
| DAL (`src/data/deletions/**`) | единая транзакция, `anonymizeUser`, `eraseChildData`, запись журнала |
| Роль БД | `packages/db/src/deletion/*` + миграция `*_deletion_procedures`: `SECURITY DEFINER`, контекст `sunschool.deletion_privileged=1`; роль приложения без прямого `DELETE`/`UPDATE` (Q-03 ✔) |

## 13. Acceptance criteria

- [ ] Второй открытый запрос на субъект отклонён — исход: тест.
- [ ] План показывает число удаляемых и обезличиваемых записей по категориям — исход: тест `buildDeletionPlan`.
- [ ] `executeDeletion` без слова подтверждения отклонён — исход: тест.
- [ ] После удаления ребёнка нет его записей, остаток других учеников не меняется, журнал содержит ссылку без значений — исход: тест.
- [ ] После обезличивания пользователя его авторство отображается «Удалённый пользователь №N» — исход: тест.
- [ ] Запрос последнего admin не выполняется — исход: тест (УД-9).
- [ ] Выполнение — одной транзакцией (откат при сбое не оставляет частичного удаления) — исход: тест.
- [ ] Просрочка подсвечивается, статус не меняется — исход: тест (INV-25).

## 14. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| Q-01 | ✔ **Решено 2026-10-11.** Юридическая проверка срока 15 дней (12.2 п. 26) | Принять 15 дней до проверки; значение в константе домена | владелец | prod |
| Q-02 | ✔ **Решено 2026-10-11.** Слово подтверждения в английском интерфейсе | Ключ словаря: ru «удалить», en «delete» | architect | W9 |
| Q-03 | ✔ **Решено 2026-10-18 (P06-CU2).** Привилегированное `DELETE`/`UPDATE` при роли приложения без прав | Миграция `20261018120000_deletion_procedures`; `packages/db/src/deletion/*` | architect | — |
| Q-04 | Нужна ли пометка «данные изменены» в аналитике постоянно или временно | Постоянная заметка в периоде, где были данные | владелец | `analytics_screens_spec` |
| Q-05 | ✔ **Решено 2026-10-11 (P06-CU5).** Admin создаёт запрос на свою запись | Запрос разрешён; при ≥2 admin выполняет другой (`DELETION_SELF_EXECUTE`); единственный admin — выполняет сам с подтверждением (УД-9) | владелец | — |

## 15. Related documents

| Document | Relationship |
|----------|--------------|
| [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §5.9 | Статусы |
| [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §9 | Классификация ПД |
| [`change_log_contract.md`](./change_log_contract.md) | Исключения неизменяемости |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W8-08

## 16. Agent notes

- Не удалять данные ребёнка вне `executeDeletion`; не удалять частично (одна транзакция).
- Не писать ФИО в `summary`, журнал, `deletion_request`.
- Не менять статус запроса автоматически по сроку (INV-25).
- Не отклонять удаление без причины; не выполнять запрос последнего admin.
- Не добавлять таблицы с ПД без строки в §6 и схеме §9.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W8-08) |
| 2026-10-18 | v1.1 — §6.4 категории плана; Q-03/Q-05 закрыты; confirm word en; реализация БД (P06) |
| 2026-10-19 | v1.2 — §6.2: снимки итогов года ребёнка и их вклад в групповые версии (P08) |
