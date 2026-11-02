# Achievement suggestions contract

**Тип:** Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-11-02  
**Волна:** P23  
**Зависит от:** [`adr_016_confirmable_achievements_and_events.md`](../../../prds/07_governance/adr_016_confirmable_achievements_and_events.md), [`achievements_and_penalties_contract.md`](./achievements_and_penalties_contract.md) §4–§9, [`achievement_group_points_contract.md`](./achievement_group_points_contract.md) §6.2–§6.3, [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §6, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) (AZ-57, AZ-60, AZ-66), [`families_and_parents_contract.md`](./families_and_parents_contract.md) §6.3  
**Связанные документы:** [`change_log_contract.md`](./change_log_contract.md), [`deletion_requests_contract.md`](./deletion_requests_contract.md), [`achievements_screens_spec.md`](../specs/achievements_screens_spec.md) §5.8, [`families_and_parents_screens_spec.md`](../specs/families_and_parents_screens_spec.md) §5.2  
**Проверено по:** код ветки `P23` (2026-11-02): `evaluate-pupil.ts` (`persistProposedAwards`, P2002 → пропуск), `award-key.ts`, `achievement-mutate-access.server.ts`, `load-pupil-achievement-panel.server.ts`, `load-parent-child-page.server.ts`, `data/bible/get-verse-text.ts`, `get-group-translation.ts`; Prisma `7.10.0` — интерактивная транзакция, `updateMany` возвращает `{ count }`, `PrismaClientKnownRequestError.code = "P2002"`. Context7 не вызывался.

---

## 1. Purpose

Контракт предложений выдачи достижений, требующих подтверждения учителем: данные, создание из пересчёта, подтвердить / отложить / отклонить, чтение у учителя и родителя. Читают: исполнитель P23 (CU3–CU7), `reviewer`.

## 2. Scope / Out of scope

**В scope:** `achievement_suggestion`, `achievement.requires_confirmation`, `requiresConfirmation()`, ветка пересчёта, три операции, загрузчики учителя и родителя, журнал.  
**Вне scope:** событие `worship_recital` ([`achievements_and_penalties_contract.md`](./achievements_and_penalties_contract.md) §6.4), подтверждение по отдельным текстам, уведомления, подтверждение родителем.

Пока `features.achievements = false`, операции отказывают `ACHIEVEMENT_FLAG_OFF`, предложения не создаются и не показываются.

## 3. Определения

| Термин | Значение |
|--------|----------|
| Предложение | Строка `achievement_suggestion`: уровень достижения, который пересчёт выдал бы, но требует подтверждения |
| Требует подтверждения | `requiresConfirmation(achievement, tier.length)` = `achievement.requiresConfirmation && tier.length >= MIN_LESSONS_FOR_CONFIRMATION` (2) |
| Ждёт подтверждения | `status = SUGGESTED` (в том числе отложенное: `deferred_at` задан) |
| Группа предложения | `grade_id` — группа урока последней проверки серии (как «группа факта», ADR-015 §4 п. 3) |
| Тексты серии | Золотые стихи уроков из `evidence_check_ids`: `homework_check` → `lesson` → `lesson_golden_verse` → `golden_verse` → `bible_verse` в переводе группы |

## 4. Данные

`achievement_suggestion`

| Поле | Тип | Правило |
|------|-----|---------|
| `id` | uuid | PK |
| `pupil_id` | uuid | FK `pupil` |
| `achievement_id` | uuid | FK `achievement` |
| `tier` | int | 1…3 |
| `academic_year_id` | uuid | FK `academic_year` |
| `grade_id` | uuid | FK `grade` — группа последней проверки |
| `award_key` | text | `UNIQUE`; тот же формат, что у выдачи (`buildAchievementAwardKey`) |
| `evidence_check_ids` | uuid[] | ≥ 1, порядок серии; длина = `tier.length` |
| `status` | `ACHIEVEMENT_SUGGESTION_STATUS` | `SUGGESTED` → `CONFIRMED` \| `DISMISSED`; обратных переходов нет |
| `suggested_at` | timestamptz | серверное время |
| `deferred_at` | timestamptz · null | последнее «Отложить» |
| `resolved_by` | uuid · null | FK `app_user`; задан ⇔ `status ≠ SUGGESTED` |
| `resolved_at` | timestamptz · null | задан ⇔ `status ≠ SUGGESTED` |
| `award_id` | uuid · null | FK `achievement_award`, `UNIQUE`; задан ⇔ `status = CONFIRMED` |

`achievement.requires_confirmation boolean not null default false` — миграция ставит `true` для `code = 'verses'`; seed создаёт значение только у новой строки.

Индексы: `(grade_id, academic_year_id, status)` — счётчик группы; `(pupil_id, academic_year_id, status)` — панель ученика и `/child`.

## 5. Операции

| Операция | Актор | Эффект | AZ |
|----------|-------|--------|----|
| ветка `evaluatePupil` | система | создаёт предложения | AZ-56 |
| `confirmAchievementSuggestion` | `TEACHER` (группа предложения, активный год), `ADMIN` | `CONFIRMED` + выдача | AZ-66 |
| `deferAchievementSuggestion` | те же | `deferred_at`, журнал | AZ-66 |
| `dismissAchievementSuggestion` | те же | `DISMISSED` | AZ-66 |
| чтение у учителя | `TEACHER` (свои), `ADMIN` | список и счётчик | AZ-57 |
| чтение у родителя | `PARENT` | ожидающие своего ребёнка | AZ-60 |

### Входы

| Поле | Правило |
|------|---------|
| `suggestionId` | uuid; нет или чужое → `ACHIEVEMENT_SUGGESTION_NOT_FOUND` / `NOT_FOUND` (§8 S-1) |
| `reason` (dismiss) | необязательна, ≤ 500 символов; пишется в `audit_log.reason` |

**Не принимается с клиента:** баллы, `award_key`, доказательства, группа, автор, время.

## 6. Happy path

### 6.1 Создание (ветка пересчёта)

Внутри существующей транзакции `evaluatePupil` (блокировка ученика), для каждой предложенной `evaluate` выдачи:

1. `requiresConfirmation(achievement, tier.length)` ложно → обычная автовыдача (без изменений).
2. Истинно → `create achievement_suggestion` (`status = SUGGESTED`, `grade_id` — группа урока последней проверки серии, `evidence_check_ids` — доказательства выдачи). P2002 по `award_key` — пропуск.
3. Перед `evaluate` существующие предложения ученика за год (любого статуса) передаются как занятые уровни наравне с выдачами — повторно уровень не предлагается; отклонённый уровень в этом году не возвращается.
4. Журнал одной записью `achievement.suggested` со списком id новых предложений (без ФИО), отдельно от `achievement.evaluated`. Новые предложения в «кого отметить» (`/today`) не входят.

Уровни серии независимы: пока ждёт уровень 1, рост серии до 5 создаёт отдельное предложение уровня 2.

### 6.2 Подтвердить

Одна интерактивная транзакция:

1. Флаг, актор по БД, группа предложения, год (teacher — только `ACTIVE`), режим группы на текущую дату, строка каталога активна.
2. Блокировка ученика (как в `evaluatePupil`).
3. `updateMany where { id, status: SUGGESTED } set { status: CONFIRMED, resolved_by, resolved_at }`; `count = 0` → `ACHIEVEMENT_SUGGESTION_RESOLVED`, откат.
4. Баллы — `resolveEffectivePoints` по `grade_id` и году на момент подтверждения.
5. Создание `achievement_award` тем же путём, что `persistProposedAwards`: `award_key` предложения, доказательства из `evidence_check_ids`, `source = AUTO`, `awarded_by` = актор, `rule_snapshot` с `pointsSource`, `gradeId` и `suggestionId`. P2002 (уровень или доказательство заняты) → `ACHIEVEMENT_EVIDENCE_TAKEN`, откат, предложение остаётся `SUGGESTED`.
6. `award_id` в предложение; журнал `achievement.suggestion_confirmed` (id предложения и выдачи, баллы). Сброс кэша баланса, как у выдачи.

### 6.3 Отложить

Проверки п. 1 §6.2; `updateMany where { id, status: SUGGESTED } set { deferred_at = now }`; `count = 0` → `ACHIEVEMENT_SUGGESTION_RESOLVED`. Журнал `achievement.suggestion_deferred`. Статус не меняется, запись остаётся в «ждут».

### 6.4 Отклонить

Проверки п. 1 §6.2 (режим группы не требуется); `updateMany where { id, status: SUGGESTED } set { status: DISMISSED, resolved_by, resolved_at }`; `count = 0` → `ACHIEVEMENT_SUGGESTION_RESOLVED`. Журнал `achievement.suggestion_dismissed` (причина в `reason`). Карточка уходит у учителя и родителя.

### 6.5 Чтение

| Загрузчик | Что отдаёт |
|-----------|------------|
| `loadPupilAchievementPanel` | ожидающие предложения ученика за год: достижение, уровень, `deferred_at`, тексты серии (ссылка + текст в переводе группы), флаг «можно действовать» по AZ-66 |
| счётчик группы | число `SUGGESTED` группы-года на карточке группы (`/group`, `/groups/[groupId]`) |
| `loadParentChildPage` | `pendingSuggestions` ребёнка: только `SUGGESTED`, только активный год, только при `features.parents` и `features.achievements` и действующем согласии; поля — название, уровень, тексты серии |

Строка на «Сегодня» не добавляется (решение CU2: достаточно панели ученика и счётчика группы).

## 7. Negative paths (business)

| Случай | Условие | Код | Ключ сообщения | Исход |
|--------|---------|-----|----------------|-------|
| Флаг выключен | любая операция | `ACHIEVEMENT_FLAG_OFF` | `admin.achievements.flag_off` | данных нет |
| Режим выключен | подтвердить, отложить | `ACHIEVEMENT_MODE_OFF` | `teacher.achievements.mode_off` | отказ |
| Нет предложения | id неизвестен | `ACHIEVEMENT_SUGGESTION_NOT_FOUND` | `teacher.achievements.suggestion_not_found` | отказ |
| Уже обработано | статус ≠ `SUGGESTED` или гонка | `ACHIEVEMENT_SUGGESTION_RESOLVED` | `teacher.achievements.suggestion_resolved` | отказ, данные не меняются |
| Закрытый год | actor — teacher | `ACHIEVEMENT_YEAR_CLOSED` | `common.errors.year_closed` | отказ |
| Строка выключена | подтвердить при `is_active = false` | `ACHIEVEMENT_INACTIVE` | `teacher.achievements.inactive` | отказ; отклонить можно |
| Доказательство занято | P2002 при создании выдачи | `ACHIEVEMENT_EVIDENCE_TAKEN` | `teacher.achievements.evidence_taken` | откат, предложение ждёт |
| Причина длиннее 500 | dismiss | `VALIDATION` | `common.errors.form` | форма сохранена |

Новые ключи `teacher.achievements.suggestion_not_found`, `teacher.achievements.suggestion_resolved` добавляются в ru и en (срез `teacher`) в P23-CU5; остальные уже есть.

## 8. Security paths

| Путь | Требование | AZ |
|------|------------|----|
| S-1 | Teacher — только предложения группы с назначением в году; чужое → `NOT_FOUND` (без различия «нет» и «чужое») | AZ-66, AZ-D4 |
| S-2 | Роль не teacher/admin → `FORBIDDEN` | AZ-66, AZ-D3 |
| S-3 | Закрытый год — только admin, с журналом | AZ-66 |
| S-4 | Флаг и режим проверяются в use-case | ADR-012 |
| S-5 | Баллы, `award_key`, доказательства и снимок формирует сервер | — |
| S-6 | Родитель видит только своих детей с действующим согласием; чужой ребёнок → 404; только чтение | AZ-60 |
| S-7 | В журнале ссылки, без ФИО (INV-23) | — |

## 9. Concurrency & idempotency

| Гонка | Защита | Исход |
|-------|--------|-------|
| Два пересчёта | блокировка ученика; `UNIQUE (award_key)` | одно предложение |
| Два подтверждения | условный `updateMany` | второе — `ACHIEVEMENT_SUGGESTION_RESOLVED` |
| Подтвердить и отклонить одновременно | тот же условный апдейт | выигрывает первое |
| Ручная выдача того же уровня до подтверждения | уникальность `award_key` / доказательств | подтверждение — `ACHIEVEMENT_EVIDENCE_TAKEN` |

## 10. Drift & consistency

- Читатели баллов не читают `achievement_suggestion`; `achievement-points-readers-grep-gate.test.ts` остаётся зелёным без правок списка.
- Порог — только `MIN_LESSONS_FOR_CONFIRMATION`; коды и статусы — из `@sunschool/domain`.
- Схема ↔ [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md): сначала документ.
- Стирание данных ребёнка и удаление учебного года удаляют предложения (до выдач — FK `award_id`).

## 11. Policy & layer touchpoints

| Слой | Роль |
|------|------|
| `domain` | `MIN_LESSONS_FOR_CONFIRMATION`, `requiresConfirmation`, `ACHIEVEMENT_SUGGESTION_STATUS`, коды `ACHIEVEMENT_SUGGESTION_RESOLVED` / `_NOT_FOUND`, действия журнала, чистая сборка списка текстов серии |
| `policy-server` | AZ-66: группа предложения, роль, год |
| DAL | ветка `persistProposedAwards`, `confirm/defer/dismiss-suggestion.ts`, загрузчики §6.5 |
| `packages/db` | таблица, колонка, enum, миграция с `UPDATE … WHERE code = 'verses'` |
| `apps/web` | Server Actions — тонкие адаптеры, `MutationResult` |

## 12. Acceptance criteria

- [ ] Серия `verses` ≥ 3 → предложение, не выдача; `first` и прочие — автовыдача — исход: тест `evaluate-pupil`.
- [ ] Повтор пересчёта и рост серии: нет дублей, уровни независимы; отклонённый не возвращается — исход: тест.
- [ ] Подтверждение: выдача с эффективными баллами группы предложения, `award_id` задан; гонка — `ACHIEVEMENT_SUGGESTION_RESOLVED` — исход: тест DAL.
- [ ] Отложить не меняет статус, пишет `deferred_at` и журнал — исход: тест.
- [ ] Teacher: чужая группа `NOT_FOUND`, закрытый год `ACHIEVEMENT_YEAR_CLOSED`; parent `FORBIDDEN`; флаг выкл. `ACHIEVEMENT_FLAG_OFF` — исход: тест policy.
- [ ] Родитель видит карточку только своего ребёнка с согласием, в активном году — исход: тест загрузчика.
- [ ] Grep-гейт читателей баллов зелёный — исход: тест.

## 13. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| Q-1 | Перевод ученика при ожидающем предложении — см. [ADR-016](../../../prds/07_governance/adr_016_confirmable_achievements_and_events.md) §10 Q-2 (действует: группа предложения) | владелец | нет |

## 14. Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_016_confirmable_achievements_and_events.md`](../../../prds/07_governance/adr_016_confirmable_achievements_and_events.md) | Решение |
| [`achievements_and_penalties_contract.md`](./achievements_and_penalties_contract.md) | Пересчёт, выдача |
| [`P23_phase_description.md`](../phases_tasks_descriptions/P23_phase_description.md) | Фаза |

## 15. Agent notes

- Не добавлять статус на `achievement_award`.
- Не вызывать подтверждение вне интерактивной транзакции с блокировкой ученика.
- Коды, статусы и действия журнала — в domain до использования в DAL.

## Change log

| Date | Change |
|------|--------|
| 2026-11-02 | v1.0 — Canonical (P23-CU2, ADR-016) |
