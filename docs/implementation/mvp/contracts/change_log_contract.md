# Change log contract

**Тип:** Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W8-07  
**Зависит от:** [`monorepo_boundaries_contract.md`](./monorepo_boundaries_contract.md) §6, §9, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) (AZ-08, AZ-P7), [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) INV-16, INV-22, INV-23, [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §5.6 (`audit_log`), R-6, §9, [`sunday_school_data_analytics_spec.md`](../../../my_specs/sunday_school_data_analytics_spec.md) (§3.16, БП-8, УД-10)  
**Связанные документы:** [`access_requests_and_roles_contract.md`](./access_requests_and_roles_contract.md), [`school_year_and_groups_contract.md`](./school_year_and_groups_contract.md), [`homework_check_contract.md`](./homework_check_contract.md), [`bricks_ledger_contract.md`](./bricks_ledger_contract.md), [`deletion_requests_contract.md`](./deletion_requests_contract.md), [`bible_seed_contract.md`](./bible_seed_contract.md), [`achievements_and_penalties_contract.md`](./achievements_and_penalties_contract.md), [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** бизнес-правила — спецификация (БП-8, §3.16, УД-10); библиотеки не затрагиваются. Context7 недоступен.

---

## 1. Purpose

Единый формат записи журнала изменений, **реестр action-кодов** и правила записи и чтения. Читают: исполнитель P01+ (DAL), авторы экрана `/audit`, `reviewer`.

## 2. Scope / Out of scope

**В scope:** `audit_log` — структура, action-коды, сериализация значений, чтение, неизменяемость.  
**Вне scope:** журнал выдачи кирпичиков ([`bricks_ledger_contract.md`](./bricks_ledger_contract.md)); логи приложения и Sentry (не содержат ПД, не относятся к журналу).

## 3. Структура записи

| Поле | Тип | Правило |
|------|-----|---------|
| `id` | uuid | — |
| `occurred_at` | `timestamptz` | серверное время (UTC) |
| `actor_user_id` | uuid · null | инициатор; `NULL` для `SYSTEM` |
| `source` | `USER` / `SYSTEM` | `SYSTEM` — ленивая очистка, seed, загрузка Библии |
| `entity_type` | текст из §5 | тип сущности |
| `entity_id` | uuid / текст | идентификатор сущности (для `seed` — имя набора) |
| `action` | текст из §4 | `<домен>.<событие>` |
| `old_value` | `jsonb · null` | значения **до**; только поля, не ПД |
| `new_value` | `jsonb · null` | значения **после** |
| `reason` | текст · null | причина (УД-6, БП-12); без ФИО третьих лиц |
| `request_id` | текст · null | идентификатор запроса для связи с логами |

Колонка `request_id` — расширение `database_schema_v1.md` §5.6 (необязательная; добавлена в том же CU, см. §10).

## 4. Реестр action-кодов

Новое действие — **сначала строка здесь**, затем код ([`domain-literals-and-codes`](../../../../.cursor/rules/tiers/t0-always/domain-literals-and-codes.mdc)). Колонка «Контракт» — первоисточник условий записи.

| Action | Событие | `entity_type` | Контракт |
|--------|---------|---------------|----------|
| `access.first_admin_created` | создан первый admin | `app_user` | W8-03 |
| `access.dev_teacher_created` | создан dev-учитель (`db:seed:teacher`, `SYSTEM`) | `app_user` | ADR-003 v1.3 |
| `access.registration_submitted` | регистрация отправлена | `access_request` | W8-03 |
| `access.registration_resubmitted` | повторная отправка | `access_request` | W8-03 |
| `access.request_approved` | заявка одобрена | `access_request` | W8-03 |
| `access.request_rejected` | заявка отклонена | `access_request` | W8-03 |
| `access.roles_changed` | роли пользователя изменены | `app_user` | W8-03 |
| `access.disabled` / `access.enabled` | доступ отключён / возвращён | `app_user` | W8-03 |
| `access.name_changed` | ФИО изменено admin | `app_user` | W8-03 |
| `access.users_merged` | пользователи объединены | `app_user` | W8-03 |
| `access.registration_purged` | просроченная регистрация удалена (`SYSTEM`) | `app_user` | W8-03 |
| `auth.identity_linked` / `auth.identity_unlinked` | способ входа привязан / отвязан | `login_identity` | auth_runtime_spec §7 |
| `school.year_created` / `school.year_activated` / `school.year_closed` | учебный год | `academic_year` | W8-04 |
| `school.group_created` / `school.group_updated` / `school.group_deactivated` | группа | `grade` | W8-04 |
| `school.group_language_changed` | язык группы | `grade` | W8-04 |
| `school.teacher_assigned` / `school.teacher_unassigned` | назначение | `teacher_assignment` | W8-04 |
| `school.settings_changed` | настройки оценивания | `grade_settings` | W8-04 |
| `school.pupil_created` / `school.pupil_updated` / `school.pupil_deactivated` | ученик | `pupil` | W8-04 |
| `school.consent_recorded` / `school.consent_revoked` | согласие по ребёнку | `child_data_consent` | W8-04 |
| `school.pupil_enrolled` / `school.pupil_unenrolled` / `school.pupil_transferred` | зачисление | `enrollment` | W8-04 |
| `lesson.created` / `lesson.updated` / `lesson.deleted` | урок | `lesson` | W8-05 |
| `lesson.lead_changed` | ведущий учитель | `lesson` | W8-05 |
| `lesson.check_completed` | проверка урока завершена | `lesson` | W8-05 |
| `calendar.event_created` / `calendar.event_updated` / `calendar.event_deleted` | событие календаря группы | `grade_event` | P03 §3.18 |
| `check.saved` | проверка сохранена итогово | `homework_check` | W8-05 |
| `check.corrected` | корректировка (БП-12) | `homework_check` | W8-05 |
| `check.verse_overridden` | ручная оценка стиха | `homework_check` | W8-05 |
| `bricks.issued` / `bricks.compensated` | выдача / компенсация | `brick_ledger` | W8-06 |
| `deletion.requested` / `deletion.taken` / `deletion.cancelled` / `deletion.rejected` / `deletion.executed` | запрос на удаление | `deletion_request` | W8-08 |
| `deletion.user_anonymized` | пользователь обезличен | `app_user` | W8-08 |
| `settings.language_changed` / `settings.timezone_changed` | настройки приложения | `app_setting` | seed_data_spec, ADR-004, ADR-008 |
| `bible.load_started` / `bible.load_finished` / `bible.load_failed` | загрузка перевода | `bible_translation` | W8-09 |
| `seed.run` | запуск `seed:reference` / `seed:bible` / `seed:dev` | `seed` | seed_data_spec |
| `analytics.snapshot_created` | созданы снимки итогов года при закрытии (`SYSTEM`/`USER` по инициатору; значения — только счётчики и версия методологии) | `analytics_snapshot` (`entity_id` = год) | analytics_year_snapshots_contract §6.1 |
| `analytics.snapshot_versioned` | новая версия снимка после правки закрытого года | `analytics_snapshot` | analytics_year_snapshots_contract §6.2 |
| `auth.password_set` | пароль администратора создан или сброшен командой `db:seed:admin` (`SYSTEM`; без пароля и хэша — INV-23) | `login_identity` | ADR-003 v1.1 |
| `migration.run` | запуск импорта владельца (необязательно: пишет скрипт владельца, если подключён к `writeAudit`); счётчики в `new_value` | `seed` | P07, ADR-011 |
| `school.legacy_deadline_extended` | продлён общий срок переходного периода согласий | `app_setting` | [ADR-011](../../../prds/07_governance/adr_011_transitional_child_consent.md) |
| `school.legacy_pupil_imported` | ребёнок перенесён с `LEGACY_PENDING` (необязательно: запись импорта владельца, `SYSTEM`) | `child_data_consent` | [ADR-011](../../../prds/07_governance/adr_011_transitional_child_consent.md) |
| `achievement.catalog_upserted` / `achievement.catalog_toggled` | каталог создан, изменён или включён | `achievement` | achievements_and_penalties_contract §6.1 |
| `achievement.mode_changed` | режим группы включён или выключен | `grade_settings` | achievements_and_penalties_contract §6.3 |
| `achievement.evaluated` | автопересчёт записал новые выдачи (id выдач, без ФИО) | `achievement_award` | achievements_and_penalties_contract §6.2 |
| `achievement.awarded` / `achievement.revoked` | ручная выдача / отзыв | `achievement_award` | achievements_and_penalties_contract §6.4 |
| `penalty.issued` / `penalty.cancelled` | штраф выдан / снят | `penalty` | achievements_and_penalties_contract §6.5 |
| `family.upserted` | семья создана или изменена (без адреса в тексте журнала, если в нём есть ПД) | `family` | families_and_parents_contract §6.1 |
| `family.adult_changed` | взрослый добавлен, изменён или исключён (ссылки, без ФИО и телефонов) | `family_adult` | families_and_parents_contract §6.1 |
| `family.pupil_transferred` | ребёнок включён, исключён или перенесён | `pupil` | families_and_parents_contract §6.1 |
| `family.merged` | семьи объединены | `family` | families_and_parents_contract §6.1 |
| `consent.given` / `consent.revoked` | электронное согласие дано или отозвано | `child_data_consent` | families_and_parents_contract §6.3 |
| `digest.recorded` | строка дайджеста создана (`sent_at` пуст) | `weekly_digest` | families_and_parents_contract §6.6 |

## 5. Правила записи

| ID | Правило |
|----|---------|
| L-1 | Запись создаётся **в той же транзакции**, что и изменение (TX-1); при откате изменения записи нет |
| L-2 | Для **итоговых** действий — одна запись на use-case; промежуточные сохранения (`savePartialCheck`) журнал не пишут |
| L-3 | `old_value` / `new_value` — только значения полей; **имена людей не записываются** — ссылка (`user_id`, `pupil_id`) (УД-10, INV-23) |
| L-4 | Свободный текст (`reason`, `comment`) не должен содержать ФИО третьих лиц: форма предупреждает (ПД-подсказка), при выполнении удаления имя заменяется обезличенным (единственная допустимая правка журнала) |
| L-5 | `source = SYSTEM` — только для ленивой очистки, загрузки Библии, seed |
| L-6 | Идемпотентный повтор use-case, не изменивший состояние, **не** создаёт записи |
| L-7 | Секреты, токены, значения `providerAccountId`, email в журнал не попадают |

## 6. Чтение

| Операция | Актор | Правила |
|----------|-------|---------|
| `listAuditLog(filter, page)` | `ADMIN` | фильтры: период, актор, `entity_type`, `action`, сущность; сортировка по `occurred_at` ↓; пагинация (курсор) |
| `getEntityHistory(entityType, entityId)` | `ADMIN` | записи сущности; используется в профиле пользователя и карточке ученика |

Имена подставляются **при показе** по ссылке; для удалённых — «Удалённый пользователь №N». Teacher журнал не видит (AZ-08). Экспорт и поиск по значениям — вне MVP.

## 7. Неизменяемость (INV-16, R-6)

- У приложения нет операций `UPDATE` / `DELETE` над `audit_log`; роль БД приложения — `INSERT`, `SELECT`.
- Исключения выполняет только процедура выполнения запроса на удаление ([`deletion_requests_contract.md`](./deletion_requests_contract.md)): обезличивание имён в свободном тексте и стирание значений в записях о ребёнке.
- Миграции, меняющие записи журнала, запрещены без ADR.

## 8. Happy path

| Операция | Результат |
|----------|-----------|
| Admin одобряет заявку | В той же транзакции запись `access.request_approved` (`actor`, `entity_id` заявки, роли в `new_value`) |
| Teacher корректирует оценку | `check.corrected`, `old_value` и `new_value` — значения полей, `reason` — «сдал позже» |
| Admin открывает `/audit` | Список по фильтру; имена подставлены по ссылкам |

## 9. Negative / Security / Concurrency

| Случай | Исход |
|--------|-------|
| Use-case не записал журнал | review: blocker; тест use-case |
| Teacher открывает `/audit` | 403 (AZ-D3); `listAuditLog` → `FORBIDDEN` |
| Попытка `UPDATE audit_log` | отказ БД (нет права); тест |
| ФИО попало в `reason` | допускается технически; при удалении субъекта заменяется (L-4) |
| Две операции в одной транзакции | каждая — своя запись, порядок по `occurred_at`, `id` |
| Журнал растёт | индексы `(entity_type, entity_id)`, `(occurred_at)`; архивирование — вне MVP |

## 10. Drift & consistency

| Риск | Guard |
|------|-------|
| Action вне реестра | тип `AuditAction` из `@sunschool/domain`; lint |
| Контракт добавил событие без строки §4 | review (`product-docs-alignment`) |
| `request_id` не в схеме | правка `database_schema_v1.md` §5.6 в том же CU |
| ПД в `old_value` | тест сериализации (INV-23) |

## 11. Policy & layer touchpoints

| Слой | Роль |
|------|------|
| `domain` | `AUDIT_ACTION`, `serializeAuditValues` (отбрасывает ПД-поля), типы |
| DAL (`src/data/audit/**`) | `writeAudit(tx, record)` — единственная точка записи; вызывается внутри транзакции use-case |
| `policy-server` | `requireRole(ADMIN)` для чтения |
| `packages/db/src/deletion/*` | единственное место `UPDATE` текстовых полей `audit_log` и `DELETE` по `brick_ledger` (привилегированный контекст; deletion_requests §12, change_log §9 S-2) |
| Запрещено | прямой `prisma.auditLog.create` вне `writeAudit`; иные `update`/`delete` над `audit_log` |

## 12. Acceptance criteria

- [ ] Каждый use-case из контрактов W8-03…W8-09 пишет запись с action из §4 — исход: тест use-case.
- [ ] Откат транзакции не оставляет записи — исход: тест.
- [ ] Teacher не читает журнал — исход: тест policy.
- [ ] `UPDATE`/`DELETE` над `audit_log` невозможны для роли приложения — исход: тест БД.
- [ ] Сериализация не включает ФИО, email, телефон, username, `providerAccountId`, пароль и хэш — исход: тест.
- [ ] Реестр §4 совпадает с `AUDIT_ACTION` в `domain` — исход: тест сверки.

## 13. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| Q-01 | Колонка `request_id` | Добавить (необязательная) | architect | P01 |
| Q-02 | Хранить ли в журнале IP / user-agent | Нет (ПД, не нужно) | владелец | — |
| Q-03 | Срок хранения журнала | Бессрочно (малый объём) | владелец | — |
| Q-04 | Показ изменения настроек оценивания на экране `/audit` (человекочитаемо) | Ключи → ярлыки в словаре `admin` | architect | W9 |

## 14. Related documents

| Document | Relationship |
|----------|--------------|
| [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) | AZ-08, AZ-P7 |
| [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) | `audit_log`, R-6 |
| [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) | INV-16, INV-23 |
| [`achievements_and_penalties_contract.md`](./achievements_and_penalties_contract.md) | Action-коды волны 1 |
| [`families_and_parents_contract.md`](./families_and_parents_contract.md) | Action-коды волны 2 |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W8-07

## 15. Agent notes

- Не писать в журнал имена и контакты — только ссылки.
- Не создавать записи вне транзакции use-case; не редактировать и не удалять записи.
- Не вводить action вне реестра §4.
- Не показывать журнал teacher.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W8-07) |
| 2026-10-17 | v1.1 — P03: реестр §4 сверен с `AUDIT_ACTION` (`lesson.*`, `calendar.*`, `bible.*`) |
| 2026-10-18 | v1.2 — §11: привилегированное изменение `audit_log` / `brick_ledger` через `packages/db/src/deletion` (P06) |
| 2026-10-19 | v1.3 — §4: `analytics.snapshot_created`, `analytics.snapshot_versioned`, сущность `analytics_snapshot` (P08) |
| 2026-10-22 | v1.4 — §4: action-коды достижений и штрафов (P12) |
| 2026-10-23 | v1.5 — §4: action-коды семьи, согласия и дайджеста (P13) |
