# Database schema v1 — Sunday School

**Тип:** PRD (data model)  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-10  
**Волна:** W1-F6  
**Зависит от:** [`mvp_scope.md`](../01_product_scope/mvp_scope.md), [`admin_flow.md`](../01_product_scope/user_flows/users_mvp/admin_flow.md), [`teacher_flow.md`](../01_product_scope/user_flows/users_mvp/teacher_flow.md), [`sunday_school_data_analytics_spec.md`](../../my_specs/sunday_school_data_analytics_spec.md) §3–§5, [`achievements_spec.md`](../../my_specs/achievements_spec.md) §7.1, [`Bible/README.md`](../../my_specs/Bible/README.md), [`adr_001_stack_and_runtime.md`](../07_governance/adr_001_stack_and_runtime.md)  
**Связанные документы:** [`architecture_master_index.md`](../architecture_master_index.md), [`post_mvp_deferrals.md`](../01_product_scope/post_mvp_deferrals.md)  
**Проверено по:** Prisma ORM v7 (`datasource.url` в `prisma.config.ts`, `PrismaClient` только с адаптером) — prisma.io, 2026-10-10; Neon PostgreSQL 17 pooled / direct URL — prisma.io (страница v6, Q-05). Context7 недоступен. Логическая модель — документ, физический DDL (Prisma schema) пишется на P01 по этому файлу.

---

## 1. Purpose

Единственный канон сущностей, полей, ключей и ограничений. User flows ссылаются на enum-ы отсюда (DB-first). Контракты W8 и Prisma schema выводятся из этого файла. Читают: авторы W3–W9, исполнитель P01.

## 2. Scope / Out of scope

**В scope:** вся схема целиком — таблицы MVP и post-MVP (спец. С-1…С-5), enum-ы, ключи, ограничения, ориентир индексов, классификация ПД.  
**Вне scope:** Prisma-синтаксис, миграции (W12), seed-данные (W6-03), права доступа (W5-02), алгоритмы (БП-1…БП-5, `achievements_spec` §7.2).

## 3. Конвенции (MUST)

1. Имена таблиц и колонок — `snake_case`, таблицы в единственном числе; пользовательская таблица — `app_user` (избежать зарезервированного слова).
2. PK — `id uuid`; у всех таблиц `created_at timestamptz`, у изменяемых — `updated_at`.
3. Внешние ключи указывают от post-MVP к MVP, не наоборот; из MVP на post-MVP — только `NULL`-able (С-1, С-2).
4. Enum-ы — Prisma enum / `@sunschool/domain` константы `UPPER_SNAKE`; значения — `UPPER_SNAKE`. Inline-строки в коде запрещены.
5. Люди в `audit_log` и в авторстве — **ссылки**, не текст (УД-10); удаление ПД — по правилам §9.
6. Даты уроков — `date` без времени; моменты — `timestamptz` (UTC); часовой пояс школы — Q-04.
7. `organization_id` есть в сущностях верхнего уровня (задел многопользовательности, спец. §11), сейчас одна запись.

## 4. Enum-ы

| Enum (домен) | Значения | Где |
|--------------|----------|-----|
| `USER_ROLE` | `ADMIN`, `TEACHER`, `PARENT` | `user_role.role` (в MVP выдаются `ADMIN`, `TEACHER`) |
| `ACCOUNT_STATUS` | `REGISTRATION`, `REQUEST_PENDING`, `REJECTED`, `ACTIVE`, `DISABLED`, `DELETED` | `app_user.status` |
| `LOGIN_PROVIDER` | `GOOGLE`, `TELEGRAM` | `login_identity.provider` |
| `ACCESS_REQUEST_STATUS` | `PENDING`, `APPROVED`, `REJECTED` | `access_request.status` |
| `ACADEMIC_YEAR_STATUS` | `DRAFT`, `ACTIVE`, `CLOSED` | `academic_year.status` |
| `LESSON_KIND` | `REGULAR`, `REVIEW` | `lesson.kind` |
| `LESSON_STATUS` | `HELD`, `CHECK_COMPLETED` | `lesson.status` |
| `SCORE_SOURCE` | `MANUAL`, `VOICE` | `homework_verse_score.source` |
| `GRADE_EVENT_TYPE` | `LESSON`, `TRIP`, `CANCELLATION` | `grade_event.type` |
| `CONSENT_CHANNEL` | `ELECTRONIC`, `PAPER` | `child_data_consent.channel` |
| `CONSENT_STATUS` | `ACTIVE`, `REVOKED`, `LEGACY_PENDING` | согласия; `LEGACY_PENDING` — перенесённый ребёнок, переходный период ([ADR-011](../07_governance/adr_011_transitional_child_consent.md)) |
| `DELETION_REQUEST_TYPE` | `ACCOUNT`, `CHILD_DATA` | `deletion_request.type` |
| `DELETION_REQUEST_STATUS` | `NEW`, `IN_PROGRESS`, `DONE`, `REJECTED`, `CANCELLED` | `deletion_request.status` |
| `BIBLE_TRANSLATION_STATUS` | `NO_DATA`, `LOADING`, `READY` | `bible_translation.status` |
| `APP_LOCALE` | `RU`, `EN` | `grade.language`, `bible_translation.locale`, `app_setting` |
| `ADULT_RELATION` | `MOTHER`, `FATHER`, `GUARDIAN` | post-MVP `family_adult.relation` |
| `ACHIEVEMENT_KIND` | `REWARD`, `PENALTY` | post-MVP `achievement.kind` |
| `AWARD_SOURCE` | `AUTO`, `MANUAL` | post-MVP `achievement_award.source` |
| `PENALTY_STATUS` | `ACTIVE`, `CANCELLED` | post-MVP `penalty.status` |
| `CONSENT_TYPE` | `PD_PROCESSING`, `CHILD_DATA`, `VOICE`, `PHOTO` | `privacy_consent` / `child_data_consent` |
| `RECITATION_STATUS` | `UPLOADED`, `PROCESSING`, `SCORED`, `FAILED` | post-MVP `recitation_attempt.status` |

## 5. Таблицы MVP

### 5.1 Организация, пользователи, доступ

| Таблица | Колонки (тип · null) | Ограничения |
|---------|----------------------|-------------|
| `organization` | `name text` | ровно одна запись |
| `app_user` | `organization_id`, `last_name text · null`, `first_name text · null`, `middle_name text · null`, `email text · null`, `status ACCOUNT_STATUS`, `first_login_at`, `last_login_at`, `deleted_ordinal int · null` (для «Удалённый пользователь №N») | `status` не `NULL`; ФИО обязательно при `ACTIVE` |
| `login_identity` | `user_id`, `provider LOGIN_PROVIDER`, `provider_account_id text`, `email · null`, `username · null` | `UNIQUE (provider, provider_account_id)`; у пользователя ≥ 1 |
| `user_role` | `user_id`, `role USER_ROLE` | `UNIQUE (user_id, role)`; роли только у `ACTIVE`; не снять последнего `ADMIN` |
| `privacy_consent` | `user_id`, `text_version text`, `accepted_at timestamptz`, `type CONSENT_TYPE` (`PD_PROCESSING`) | `UNIQUE (user_id, text_version)` |
| `access_request` | `user_id`, `consent_id`, `full_name_snapshot text`, `status`, `decided_by · null`, `decided_at · null`, `reject_reason · null`, `assigned_roles` (через `user_role`) | не более одной `PENDING` на пользователя |

### 5.2 Школа, группы, годы

| Таблица | Колонки | Ограничения |
|---------|---------|-------------|
| `academic_year` | `organization_id`, `name`, `starts_on date`, `ends_on date`, `status` | не более одного `ACTIVE`: partial unique по `organization_id` where `status = ACTIVE` (БП-6) |
| `grade` | `organization_id`, `name`, `description · null`, `age_min int · null`, `age_max int · null`, `is_active bool`, `language APP_LOCALE` (по умолчанию `RU`) | язык `EN` только при `bible_translation.status = READY` (ЯГ-3, проверка в приложении) |
| `grade_settings` | `grade_id`, `academic_year_id`, `use_verses`, `use_test`, `use_notebook`, `use_singing` (bool), `max_verses_per_lesson int`, `labels jsonb`, `weights jsonb`, `recitation_days_n int` (по умолчанию 3), `achievements_enabled bool` (по умолчанию `false`) | `UNIQUE (grade_id, academic_year_id)`; копируются из прошлого года |
| `teacher_assignment` | `user_id`, `grade_id`, `academic_year_id` | `UNIQUE (user_id, grade_id, academic_year_id)`; роль `TEACHER` |

### 5.3 Ученики

| Таблица | Колонки | Ограничения |
|---------|---------|-------------|
| `pupil` | `organization_id`, `last_name`, `first_name`, `middle_name · null`, `birth_date · null`, `photo_ref · null`, `is_active bool`, `family_id · null` (**post-MVP**, FK) | в MVP `family_id = NULL` |
| `enrollment` | `pupil_id`, `grade_id`, `academic_year_id`, `starts_on date`, `ends_on date · null` | не более одного активного (`ends_on IS NULL`) на `pupil_id`; зачисление — только при действующем `child_data_consent` (СО-4, проверка в приложении) |
| `child_data_consent` | `pupil_id`, `guardian_adult_id · null` (**post-MVP** FK `family_adult`), `signer_name text · null` (MVP: подписант текстом), `channel CONSENT_CHANNEL`, `text_version`, `signed_on date · null` (NULL только при `LEGACY_PENDING`; CHECK), `paper_storage_note text · null`, `marked_by user_id`, `status CONSENT_STATUS`, `revoked_at · null` | запись создаёт admin (СО-3) |

### 5.4 Библия и золотые стихи

Решение: **общий справочник книг** и стихи по переводам (спец. 3.10, ПБ-7); таблица `bible_chapter` из seed-скриптов **не вводится** (число стихов в главе вычисляется) — Q-01. Скрипты загрузки приводятся к этой модели (`bible_seed_contract`).

| Таблица | Колонки | Ограничения |
|---------|---------|-------------|
| `bible_translation` | `code text` (например `ru-synodal`), `locale APP_LOCALE`, `name`, `short_name`, `source text · null`, `license text · null`, `status BIBLE_TRANSLATION_STATUS`, `is_default bool` | `UNIQUE (code)`; один `is_default` на `locale` |
| `bible_book` | `sort_order int`, `testament text` (`OT` / `NT`), `title_ru`, `title_en`, `short_ru`, `short_en`, `chapters_count int` | `UNIQUE (sort_order)`; 66 записей |
| `bible_verse` | `translation_id`, `book_id`, `chapter_number int`, `verse_number int`, `text text`, `verse_order int` | `UNIQUE (translation_id, book_id, chapter_number, verse_number)`; индекс по тому же ключу (чтение на каждом экране урока) |
| `golden_verse` | `organization_id`, `book_id`, `start_chapter`, `start_verse`, `end_chapter`, `end_verse` (общая нумерация, ПБ-4), `label text · null` | уникален по диапазону; изменение ссылки у использованного запрещено |
| `bible_verse_map` | `translation_id`, `book_id`, `chapter_number`, `verse_number` (0 — надписание), `common_chapter`, `common_verse` | **обязательна** (ADR-009 §3.3): только исключения, нет строки = тождество; общая нумерация — Синодальная |

### 5.5 Уроки и проверка

| Таблица | Колонки | Ограничения |
|---------|---------|-------------|
| `lesson` | `grade_id`, `academic_year_id`, `title`, `lesson_date date`, `ordinal int`, `lead_teacher_id`, `kind LESSON_KIND`, `body text · null`, `has_test bool`, `status LESSON_STATUS` | урок только в `ACTIVE` году; дата в границах года; `lead_teacher_id` назначен на группу (УЧ-1); обзорный — без стихов и теста |
| `lesson_golden_verse` | `lesson_id`, `golden_verse_id`, `position int` | `UNIQUE (lesson_id, position)`; ≤ `max_verses_per_lesson` |
| `homework_check` | `lesson_id`, `pupil_id`, `present bool` (по умолчанию `false`), `homework_checked bool`, `test_score int · null` (0–10), `notebook_score int · null` (0–10), `singing bool`, `comment text · null`, `late bool` (вычисляется), `points_total int · null`, `scoring_snapshot jsonb · null` (веса и переключатели на момент выставления, БП-5 вариант А), `checked_by`, `checked_at` | `UNIQUE (lesson_id, pupil_id)`; «не оценивалось» = `NULL`, не 0 (БП-4) |
| `homework_verse_score` | `check_id`, `lesson_verse_id` (стих, заданный на предыдущем уроке), `score int` (0–2), `source SCORE_SOURCE`, `scored_at`, `scored_by` | `UNIQUE (check_id, lesson_verse_id)` |
| `brick_ledger` | `pupil_id`, `academic_year_id`, `quantity int`, `issued_on date`, `issued_by`, `note text · null` | **только добавление** (БП-11); отрицательное количество — только корректировка с `note`; нулевое запрещено |

Для оценок `test_score`, `notebook_score`, спевки и стихов хранятся **дата выставления и автор** (3.12) — отдельная таблица `homework_score_event` (`check_id`, `field`, `value`, `set_at`, `set_by`, `reason · null`), из которой вычисляется `late`.

### 5.6 Календарь, журнал, удаление, настройки

| Таблица | Колонки | Ограничения |
|---------|---------|-------------|
| `grade_event` | `grade_id`, `event_date`, `type GRADE_EVENT_TYPE`, `title`, `description · null`, `lesson_id · null` | `lesson_id` только для типа `LESSON` |
| `audit_log` | `occurred_at`, `actor_user_id · null`, `source` (`USER` / `SYSTEM`), `entity_type`, `entity_id`, `action`, `old_value jsonb · null`, `new_value jsonb · null`, `reason · null`, `request_id text · null` | **только добавление**; ссылки, не имена; поля значений очищаются только при УД-7 |
| `deletion_request` | `type`, `subject_user_id · null`, `subject_pupil_id · null`, `requested_by`, `requested_at`, `reason · null`, `status`, `due_on date`, `taken_by · null`, `resolved_by · null`, `resolved_at · null`, `reject_reason · null`, `summary jsonb · null` | не более одного открытого на субъект; субъект — ровно один из двух |
| `app_setting` | `key text`, `value jsonb` | `UNIQUE (key)`; ключи: `ui_locale`, `school_timezone` (IANA, [ADR-004](../07_governance/adr_004_timezone_scheduling_model.md); до выбора — `UTC`), `features.achievements`, `features.parents`, `features.voice` ([ADR-005](../07_governance/adr_005_schema_complete_post_mvp_tables.md)), `consent_text_version`, `legacy_consent_deadline_on` (`date`, появляется при миграции; [ADR-011](../07_governance/adr_011_transitional_child_consent.md)) |

## 6. Таблицы post-MVP (создаются сразу, без UI)

| Волна | Таблица | Колонки (кратко) | Ограничения |
|-------|---------|------------------|-------------|
| 1 | `achievement` | `code`, `name_ru`, `name_en`, `description_ru`, `description_en`, `icon`, `category`, `kind ACHIEVEMENT_KIND`, `rule_type`, `metric`, `threshold`, `is_active` | `kind` не меняется после первой выдачи |
| 1 | `achievement_tier` | `achievement_id`, `tier`, `length`, `points` | `UNIQUE (achievement_id, tier)` |
| 1 | `achievement_award` | `pupil_id`, `achievement_id`, `tier`, `academic_year_id`, `points`, `rule_snapshot jsonb`, `source AWARD_SOURCE`, `awarded_by · null`, `reason · null`, `awarded_at`, `revoked_at/by/reason · null`, `award_key text · null` | `UNIQUE (award_key)` (ДС-11) |
| 1 | `achievement_evidence` | `award_id`, `achievement_id`, `tier`, `check_id` | `UNIQUE (achievement_id, tier, check_id)` (ДС-3, ДС-12) |
| 1 | `penalty` | `pupil_id`, `achievement_id`, `lesson_id`, `points`, `reason`, `issued_by`, `issued_at`, `status PENALTY_STATUS`, `cancelled_at/by/reason · null` | не более одного `ACTIVE` на `(pupil_id, lesson_id)` (ШТ-4) |
| 1 | `grade_achievement_period` | `grade_settings_id`, `starts_at`, `ends_at · null` | периоды выключения режима (ДС-14) |
| 2 | `family` | `organization_id`, `name`, `address · null`, `note · null` | не сохраняется пустой (СМ-5) |
| 2 | `family_adult` | `family_id`, `last_name`, `first_name`, `middle_name · null`, `relation ADULT_RELATION`, `phones jsonb`, `email · null`, `user_id · null` | ≤ одной `MOTHER` и одного `FATHER` на семью (СМ-3) |
| 2 | `weekly_digest` | `user_id`, `period_start`, `payload jsonb`, `sent_at · null` | дайджест (ДС-8, ШТ-8) |
| 3 | `recitation_attempt` | `pupil_id`, `lesson_verse_id`, `recorded_by`, `audio_ref · null`, `recorded_at`, `duration_s`, `audio_deleted_at · null`, `status RECITATION_STATUS`, `fail_reason · null`, `transcript · null`, `match_percent · null`, `word_markup jsonb · null`, `model_id`, `model_version`, `translation_id`, `quality int · null` | аудио удаляется по ВП-14 |
| 3 | `voice_photo_consent` | `pupil_id`, `given_by`, `type` (`VOICE` / `PHOTO`), `text_version`, `given_at`, `status` | без действующего согласия запись недоступна |

`pupil.family_id` — FK на `family` (nullable) — единственная колонка MVP-таблицы, ссылающаяся на post-MVP (С-2).

## 7. Межтабличные правила (MUST)

| № | Правило | Источник | Как проверять |
|---|---------|----------|---------------|
| R-1 | Не более одного активного учебного года | БП-6 | partial unique index |
| R-2 | У ученика не более одного активного зачисления | §3.8 | partial unique index `(pupil_id) where ends_on is null` |
| R-3 | Урок создаётся только в активном году, дата — в границах года | §3.11 | транзакция в приложении + `CHECK` по возможности |
| R-4 | Ведущий учитель назначен на группу в год урока | УЧ-1 | приложение, `teacher_assignment` |
| R-5 | Зачисление требует действующего согласия по ребёнку: `ACTIVE`, либо `LEGACY_PENDING` для перенесённого до `app_setting.legacy_consent_deadline_on` ([ADR-011](../07_governance/adr_011_transitional_child_consent.md)) | СО-4, СО-5 | приложение |
| R-6 | `brick_ledger` и `audit_log` — только добавление; в БД нет `UPDATE`/`DELETE` из приложения, кроме УД-7 | БП-8, БП-11 | роль БД / репозиторий без update |
| R-7 | Остаток кирпичиков = набрано − выдано; выдача не превышает остаток | БП-11 | транзакция с блокировкой строк ученика+года |
| R-8 | Не снять роль `ADMIN` у последнего admin и у себя | §2.4 | транзакция с `SELECT … FOR UPDATE` |
| R-9 | Золотой стих собирается из диапазона в переводе группы; нет стиха — урок не сохраняется | ПБ-5 | приложение |

## 8. Индексы (ориентир)

| Таблица | Индекс | Назначение |
|---------|--------|------------|
| `bible_verse` | `(translation_id, book_id, chapter_number, verse_number)` | чтение стихов на экранах |
| `homework_check` | `(lesson_id)`, `(pupil_id)` | сводная таблица, аналитика ученика |
| `lesson` | `(grade_id, academic_year_id, lesson_date)` | список уроков |
| `enrollment` | `(grade_id, academic_year_id)`, partial `(pupil_id) where ends_on is null` | состав группы |
| `audit_log` | `(entity_type, entity_id)`, `(occurred_at)` | журнал |
| `brick_ledger` | `(pupil_id, academic_year_id)` | баланс |
| `login_identity` | unique `(provider, provider_account_id)` | вход |

Подробности — `indexing_strategy` (W6-02, не требуется на lean).

## 9. Классификация ПД и удаление (S)

| Данные | Таблица · поля | Класс | При запросе на удаление (УД-7) |
|--------|----------------|-------|--------------------------------|
| Идентификаторы входа, email | `login_identity`, `app_user.email` | ПД взрослого | удалить |
| ФИО взрослого | `app_user.*_name` | ПД взрослого | удалить; «Удалённый пользователь №N» |
| Согласие на обработку ПД | `privacy_consent` | подтверждение | оставить обезличенным |
| Карточка ребёнка | `pupil.*` | ПД ребёнка | удалить полностью |
| Проверки, оценки, комментарии ребёнка | `homework_*` | ПД ребёнка | удалить |
| Кирпичики ребёнка | `brick_ledger` | ПД ребёнка | удалить (исключение из «только добавление») |
| Достижения и штрафы ребёнка | `achievement_award`, `penalty` | ПД ребёнка | удалить |
| Зачисления, согласия по ребёнку | `enrollment`, `child_data_consent` | ПД ребёнка | удалить |
| Журнал изменений | `audit_log` | служебные | оставить; значения о ребёнке стереть |
| Авторство уроков, проверок | `lesson.lead_teacher_id`, `*_by` | служебные | оставить, автор — обезличенный пользователь |

## 10. Paths (H / N / S)

| Путь | Описание | Исход |
|------|----------|-------|
| **H** | Миграция создаёт схему целиком; `seed` справочников и Библии проходит | пустая БД с таблицами и справочниками; приложение стартует |
| **N** | Нарушение ограничения (второй активный год, второе активное зачисление, отрицательный остаток) | операция отклоняется; данные не меняются; сообщение по коду из domain |
| **S** | ПД ребёнка читаются без согласия или чужой учитель читает группу | запрещено слоем policy; БД не заменяет авторизацию |
| **S** | Выполнение удаления нарушает неизменяемость журналов | допустимо только по УД-7 и только из процедуры удаления |
| **Race** | Две параллельные выдачи кирпичиков / снятия роли admin | блокировка строк (R-7, R-8) |
| **Drift** | Prisma schema ≠ этот файл | любое изменение схемы сначала правит этот файл (product-docs-alignment) |

## 11. Acceptance criteria

- [ ] Все сущности спецификации 3.1–3.21 присутствуют как таблицы MVP или post-MVP — исход: таблица соответствия в §5–§6 без пропусков.
- [ ] MVP-таблицы не имеют обязательных FK на post-MVP — исход: единственная ссылка — `pupil.family_id NULL`.
- [ ] Для каждого enum (§4) указана таблица-владелец — исход: нет «висящих» enum-ов.
- [ ] Каждое правило §7 имеет способ проверки — исход: колонка «Как проверять» заполнена.
- [ ] Классификация ПД (§9) покрывает все таблицы с ПД — исход: нет таблицы с ФИО вне §9.

## 12. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| Q-01 | Нужна ли `bible_chapter` (в seed-скриптах есть, в спец. нет) — принято «нет», подтвердить | владелец | `bible_seed_contract` §модель |
| Q-02 | ~~Общая нумерация~~ — **решено 2026-10-10**: нумерация Синодального перевода; `bible_verse_map` нужна и хранит только исключения (165 глав) — [ADR-009](../07_governance/adr_009_bible_translations_and_verse_numbering.md) §3.1, §3.3 | — | — |
| Q-03 | ~~Лицензия английского перевода~~ — **решено: NIV загружается** по решению владельца (ADR-009 §3.2); в `license` — копирайт Biblica; лицензию подтвердить до prod | владелец | prod-загрузка |
| Q-04 | ~~Часовой пояс школы~~ — **решено 2026-10-11**: единый пояс школы, выбирается admin в настройках (`app_setting.school_timezone`), [ADR-004](../07_governance/adr_004_timezone_scheduling_model.md) | — | — |
| Q-05 | Neon + Prisma 7: драйвер-адаптер и pooled URL — подтвердить по документации v7 | architect | P01 |
| Q-06 | ~~БП-5~~ — **решено 2026-10-10: вариант А** (баллы замораживаются при выставлении; `points_total` + `scoring_snapshot`), веса по умолчанию 1 | — | — |
| Q-08 | ~~Баллы за спевку по умолчанию~~ — **решено 2026-10-10: 1** (веса по умолчанию 1) | — | — |
| Q-07 | ~~Организация~~ — **решено 2026-10-10**: достаточно одной записи; таблица `organization` остаётся (задел, спец. §11) | — | — |

## 13. Related documents

| Document | Relationship |
|----------|--------------|
| [`mvp_scope.md`](../01_product_scope/mvp_scope.md) | Состав MVP, правила С-1…С-7 |
| [`admin_flow.md`](../01_product_scope/user_flows/users_mvp/admin_flow.md), [`teacher_flow.md`](../01_product_scope/user_flows/users_mvp/teacher_flow.md) | Потоки, ссылающиеся на enum-ы |
| [`Bible/README.md`](../../my_specs/Bible/README.md) | Данные и скрипты Библии (§ 4 — расхождения) |
| [`lifecycle_models.md`](../02_domain_model/lifecycle_models.md), [`domain_invariants.md`](../02_domain_model/domain_invariants.md) | Жизненные циклы и инварианты (W3) |
| [`migration_runbook.md`](../06_operations/migration_runbook.md) | Порядок миграций схемы (W12-02) |
| [`seed_data_spec.md`](./seed_data_spec.md) | Справочники и dev-фикстуры (W6-03) |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W1-F6

## 14. Agent notes

- Не создавать колонки и таблицы «на всякий случай» вне этого файла; сначала правка здесь.
- Не добавлять обязательные FK из MVP-таблицы на post-MVP.
- `NULL` в оценках значит «не оценивалось», не 0.
- Не использовать названия таблиц из seed-скриптов (`bible_edition`, `bible_chapter`) — модель приводится к §5.4.

## Change log

| Date | Change |
|------|--------|
| 2026-10-10 | v1.0 — Canonical (W1-F6), схема целиком |
| 2026-10-11 | Реализовано в `packages/db/prisma/schema.prisma` (P5): 39 таблиц, миграция `init`. Соглашения реализации: модели PascalCase с `@@map`, enum-типы БД с суффиксом `_enum`, модель таблицы `user_role` называется `UserRoleAssignment`; ограничения вне Prisma (partial unique R-1, R-2, один PENDING-запрос, один default на язык, открытый запрос на удаление, один активный штраф, МАТЬ/ОТЕЦ; CHECK: subject удаления, `signed_on` при `LEGACY_PENDING`, диапазоны оценок, `quantity <> 0`) — в SQL миграции; запрет UPDATE/DELETE (R-6) — репозиторием, роль БД — P07 |
