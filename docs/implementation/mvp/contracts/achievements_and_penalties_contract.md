# Achievements and penalties contract

**Тип:** Contract  
**Статус:** Canonical  
**Версия:** 1.1  
**Дата:** 2026-10-22  
**Волна:** W8-11  
**Зависит от:** [`adr_012_achievements_and_penalties.md`](../../../prds/07_governance/adr_012_achievements_and_penalties.md), [`achievements_spec.md`](../../../my_specs/achievements_spec.md) (ДС-1…ДС-15, ШТ-1…ШТ-10, §7, §9), [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §4, §6, [`bricks_ledger_contract.md`](./bricks_ledger_contract.md) §3, [`homework_check_contract.md`](./homework_check_contract.md) §5.5–§5.8, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) (AZ-52…AZ-57), [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) PKG-03, INV-17, INV-23  
**Связанные документы:** [`change_log_contract.md`](./change_log_contract.md), [`deletion_requests_contract.md`](./deletion_requests_contract.md), [`achievements_screens_spec.md`](../specs/achievements_screens_spec.md), [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** бизнес-правила — interim-спека достижений; транзакция — ADR-012 (Prisma v7, адаптер `pg`). Context7 в сессии написания не вызывался.  
**Migrated from:** [`docs/my_specs/achievements_spec.md`](../../../my_specs/achievements_spec.md)

---

## 1. Purpose

Контракт каталога, пересчёта, ручной выдачи, отзыва, режима группы и штрафов. Читают: исполнитель P12, `reviewer`. Правила ДС и ШТ не пересказываются целиком: канон поведения — этот файл, источник формулировок — спека.

## 2. Scope / Out of scope

**В scope:** `achievement`, `achievement_tier`, `achievement_award`, `achievement_evidence`, `penalty`, `grade_achievement_period`, флаг `features.achievements`, вклад в «набрано».  
**Вне scope:** роль `parent` и дайджест (волна 2); достижение `practice` и закрытие окна голоса (волна 3, триггер ДС-6 не подключается); рейтинг (бонус в метрику рейтинга не входит, ДС-10).

Пока `features.achievements = false`, операции §4 отказывают `ACHIEVEMENT_FLAG_OFF`, пересчёт не вызывается, бонус и штрафы в «набрано» равны 0.

## 3. Определения

| Термин | Значение |
|--------|----------|
| Факт | Проверенная запись ученика на уроке. Состояние для правила: засчитан / не засчитан / пропуск (спека §3, ДС-1, ДС-2, ДС-14, ДС-15) |
| Выдача | Строка `achievement_award`. Отзыв — `revoked_at`, строка не удаляется |
| Доказательства | Строки `achievement_evidence`. Пара «достижение + уровень + проверка» уникальна и остаётся занятой после отзыва (ДС-7, ДС-12) |
| Режим группы | `grade_settings.achievements_enabled` и периоды `grade_achievement_period` (ADR-012 §4 п. 6) |
| Бонус | Сумма `points` неотзванных выдач ученика за год |
| Штрафы в «набрано» | Сумма модулей `points` записей `penalty` со статусом `ACTIVE` за год |

Коды ошибок ниже **добавить в domain** до кода P12 (`ACHIEVEMENT_`, `PENALTY_` — новые префиксы `MUTATION_ERROR_CODE_PREFIXES`). Общие `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `CONFLICT` уже есть.

## 4. Операции

| Операция | Актор | Эффект | AZ |
|----------|-------|--------|----|
| `upsertAchievement` | `ADMIN` | каталог награды или штрафа | AZ-52 |
| `setAchievementActive` | `ADMIN` | вкл/выкл строки каталога | AZ-52 |
| `setGroupAchievementPoints` / `copyGroupAchievementPoints` | `TEACHER` (своя, активный год), `ADMIN` | баллы группы в году, [контракт](./achievement_group_points_contract.md) | AZ-65 |
| `setGroupAchievementMode` | `TEACHER` (своя), `ADMIN` | режим группы, период выключения | AZ-55 |
| `evaluatePupil` | система | новые выдачи одного ученика | AZ-56 |
| `recalculateAchievements` | `ADMIN` | пересчёт учеников года | AZ-52 |
| `awardManually` | `TEACHER` (своя), `ADMIN` | ручная выдача | AZ-53 |
| `revokeAward` | `ADMIN` | отзыв | AZ-54 |
| `issuePenalty` | `TEACHER` (своя), `ADMIN` | действующий штраф | AZ-53 |
| `cancelPenalty` | `TEACHER` (своя, год `ACTIVE`), `ADMIN` | снятие | AZ-53 |

«Своя группа» — как в контракте кирпичиков: зачисление ученика в году и назначение учителя на группу.

## 5. Входы

| Операция | Поле | Правило |
|----------|------|---------|
| `upsertAchievement` | `kind` | `REWARD` или `PENALTY`; после первой выдачи или штрафа не меняется |
| | тексты | `name` / `description` ru и en обязательны (ДС-9) |
| | `ruleType`, `metric`, `threshold`, уровни | только для `REWARD`; у штрафа их нет, один уровень с `points < 0` |
| | `points` уровня | награда: целое ≥ 0; штраф: целое < 0 |
| `setGroupAchievementMode` | `enabled` | включение пишет закрытие открытого периода и запускает пересчёт учеников группы; выключение открывает период с `starts_at` = сейчас |
| `awardManually` | `tier`, `points` | `points` ≤ баллов уровня каталога; причина обязательна |
| | `checkIds` | для правила — не меньше N фактов уровня; занятый факт этого уровня отклоняется; «не засчитан» отметить можно (ДС-13) |
| `revokeAward` | `reason` | обязательна; повторный отзыв отклонён |
| `issuePenalty` | `lessonId`, `points`, `reason` | `points` целое, по модулю ≤ каталога и < 0 в хранении; не больше одного `ACTIVE` на (ученик, урок) |
| `cancelPenalty` | `reason` | обязательна; в закрытом году — только admin (ШТ-10) |
| `recalculateAchievements` | `yearId` | по умолчанию активный год; admin может передать закрытый |

**Не принимается с клиента:** автор, время, `rule_snapshot`, признак «засчитан» для автопересчёта, `award_key`.

## 6. Happy path

### 6.1 Каталог

- Admin создаёт или правит строку. Вид после первой выдачи или первого штрафа не меняется. Смена баллов и порогов действует только на будущие выдачи; у уже выданного остаётся `rule_snapshot` (ДС-10).
- Баллы в каталоге — **значения по умолчанию**. Группа может переопределить баллы уровня и размер штрафа на год ([`achievement_group_points_contract.md`](./achievement_group_points_contract.md), ADR-015); решает `resolveEffectivePoints`. Пороги и условия глобальны. Seed не затирает баллы существующих строк.
- `practice` остаётся `is_active = false` до волны 3. Неактивная строка не участвует в `evaluate`.
- Журнал: `achievement.catalog_upserted`, `achievement.catalog_toggled`.

### 6.2 `evaluatePupil`

Чистая `evaluate(facts, rules, awards) → новые выдачи` (спека §7.2–§7.3):

- серия: максимальные серии засчитанных подряд; пропуск не рвёт и не продлевает (ДС-1); уровень выдаётся, если длина ≥ N и нет выдачи этого уровня (включая отозванную и ручную), чьи доказательства пересекают серию; доказательства — первые N фактов серии;
- накопление и разовое событие: не больше одной выдачи уровня за год (`award_key` = ученик + достижение + уровень + год);
- `hundred`: N — сумма баллов уроков, не число уроков; бонус в метрику не входит (ДС-10);
- обзорный урок — пропуск для стихов и теста, обычный факт для тетради, спевки и накопления «уроки с ДЗ», если оценена тетрадь (ДС-15).

Запись: транзакция, блокировка ученика, вставка выдач и доказательств. Нарушение уникальности — пропуск этой выдачи. Журнал одной записью `achievement.evaluated` со списком id новых выдач (без ФИО, INV-23). Возврат — только новые выдачи этого вызова («кого отметить», ДС-8).

### 6.3 Когда вызывается пересчёт

Только при `features.achievements = true` и включённом режиме группы на дату урока (урок периода выключения — пропуск, пересчёт учеников урока всё равно вызывается и не создаёт выдач за этот урок):

| Событие | Кого пересчитать |
|---------|------------------|
| `completeLessonCheck` | ученики урока с `homework_checked = true` |
| `correctCheck`, `overrideVerseScore` | ученик записи |
| `setGroupAchievementMode(enabled=true)` | ученики группы в этом году |
| `closeYear` | ученики года, у чьих групп режим включён |
| `recalculateAchievements` | ученики года с проверками |

Закрытие окна голоса (ДС-6) в этой волне не подключается.

### 6.4 Ручная выдача и отзыв

- Предусловия выдачи: флаг и режим включены, строка каталога активна, вид `REWARD`. Снимок правила пишется с сервера. Журнал `achievement.awarded`.
- Отзыв: только admin, причина, баллы выходят из бонуса, доказательства остаются. Журнал `achievement.revoked`. Повторная выдача того же уровня за те же проверки невозможна, в том числе вручную (ДС-7).

### 6.5 Штраф

- Только вручную, при флаге и режиме. Не меняет оценки, серии и выдачи (ШТ-5). Журнал `penalty.issued`.
- Снятие ставит `CANCELLED`, баллы возвращаются в «набрано». Журнал `penalty.cancelled`. Строка не удаляется.

### 6.6 «Набрано»

При включённом флаге бонус и штрафы входят в формулу [`bricks_ledger_contract.md`](./bricks_ledger_contract.md) §3. Отзыв и штраф могут сделать остаток отрицательным (INV-18). Кэш баланса сбрасывается из операций §4.

### 6.7 Удаление данных ребёнка

`achievement_award`, `achievement_evidence` и `penalty` ученика удаляются процедурой стирания ([`deletion_requests_contract.md`](./deletion_requests_contract.md) §6). Отдельной операции удаления выдачи нет.

## 7. Negative paths (business)

| Случай | Условие | Код | Ключ сообщения | Исход |
|--------|---------|-----|----------------|-------|
| Флаг выключен | любая операция §4 | `ACHIEVEMENT_FLAG_OFF` | `admin.achievements.flag_off` | данных нет |
| Режим выключен | ручная выдача, штраф, показ «кого отметить» | `ACHIEVEMENT_MODE_OFF` | `teacher.achievements.mode_off` | отказ |
| Вид зафиксирован | смена `kind` после выдачи | `ACHIEVEMENT_KIND_LOCKED` | `admin.achievements.kind_locked` | каталог не изменён |
| Строка выключена | выдача или штраф по неактивной | `ACHIEVEMENT_INACTIVE` | `teacher.achievements.inactive` | отказ |
| Баллы выше каталога | ручная выдача или штраф | `ACHIEVEMENT_POINTS_EXCEED` / `PENALTY_POINTS_EXCEED` | `teacher.achievements.points_exceed` | отказ |
| Мало уроков | отмечено < N | `ACHIEVEMENT_EVIDENCE_SHORT` | `teacher.achievements.evidence_short` | отказ |
| Урок занят | факт уже в доказательствах уровня | `ACHIEVEMENT_EVIDENCE_TAKEN` | `teacher.achievements.evidence_taken` | отказ |
| Повторный отзыв | `revoked_at` уже задан | `ACHIEVEMENT_ALREADY_REVOKED` | `teacher.achievements.already_revoked` | отказ |
| Второй штраф на урок | есть `ACTIVE` | `PENALTY_ONE_ACTIVE` | `teacher.penalty.one_active` | отказ |
| Снятие в закрытом году | actor — teacher | `PENALTY_YEAR_CLOSED` | `teacher.penalty.year_closed` | отказ |
| Уже снят | статус не `ACTIVE` | `PENALTY_ALREADY_CANCELLED` | `teacher.penalty.already_cancelled` | отказ |
| Нет причины | выдача, отзыв, штраф, снятие | `VALIDATION` | `teacher.achievements.reason_required` | форма сохранена |
| Чужой ученик | не своя группа | `NOT_FOUND` | `common.errors.not_found` | AZ-D4 |
| Параллельный пересчёт | уникальность или блокировка | `CONFLICT` | `common.errors.conflict` | одна выдача |

## 8. Security paths

| Путь | Требование | AZ |
|------|------------|----|
| S-1 | Каталог, ручной пересчёт и отзыв — только admin, проверка по БД | AZ-52, AZ-54 |
| S-2 | Выдача, штраф, снятие, режим — своя группа или admin | AZ-53, AZ-55, AZ-D4 |
| S-3 | Чтение выдач и штрафов — как баланс кирпичиков | AZ-57 |
| S-4 | Флаг проверяется в use-case, не только в UI | ADR-012 |
| S-5 | В журнале ссылки на ученика и урок; ФИО нет (INV-23) | — |
| S-6 | Teacher не открывает `/achievements` | AZ-D3, 403 |

## 9. Concurrency & idempotency

| Гонка | Защита | Исход |
|-------|--------|-------|
| Два пересчёта одного ученика | блокировка ученика в интерактивной транзакции; уникальность доказательств и `award_key` | одна выдача; вторая не создаёт дубль |
| Двойной клик выдачи | `disabled` на кнопке; тот же набор доказательств | вторая — `ACHIEVEMENT_EVIDENCE_TAKEN` |
| Два штрафа на один урок | частичный уникальный индекс одного `ACTIVE` | второй — `PENALTY_ONE_ACTIVE` |
| Правка проверки во время пересчёта | пересчёт читает факты внутри своей транзакции после блокировки | видит зафиксированную правку или предыдущее состояние, не смесь |

## 10. Drift & consistency

| Риск | Guard |
|------|-------|
| Баллы достижения вошли в метрику правила или рейтинг | тест ДС-10; `hundred` считает только баллы уроков |
| Отзыв освободил доказательства | тест §7.3: после отзыва пересчёт не выдаёт то же |
| Бонус записан в `brick_ledger` | тест: число строк журнала не растёт от выдачи |
| Пересчёт при выключенном флаге | тест ADR-012 |
| `practice` участвует в `evaluate` | строка каталога неактивна; тест пропуска |
| Код читает `family` или `recitation_attempt` | PKG-03 |

## 11. Policy & layer touchpoints

| Слой | Роль |
|------|------|
| `domain` | `evaluate`, состояние факта, схемы входов, коды `ACHIEVEMENT_` / `PENALTY_` |
| `policy-server` | своя группа, admin, флаг |
| DAL | транзакции §6, журнал, сброс кэша баланса |
| `homework_check` | вызов §6.3 из `completeLessonCheck`, `correctCheck`, `overrideVerseScore` |
| `closeYear` | вызов §6.3 |
| Роль БД | выдача и штраф не удаляются приложением, кроме процедуры стирания данных ребёнка |

## 12. Acceptance criteria

- [ ] Повтор `evaluate` на тех же фактах не создаёт выдач — исход: тест §7.3.
- [ ] Пересчёт после каждого урока и один пересчёт в конце дают один набор — исход: тест §7.3.
- [ ] Отзыв и ручная выдача занимают факты; следующий пересчёт не дублирует уровень — исход: тест §7.3.
- [ ] Обзорный урок не рвёт серию стихов и продлевает серию тетради — исход: тест §7.3.
- [ ] Уроки периода выключения — пропуск — исход: тест §7.3.
- [ ] Завершение проверки при выключенном флаге не пишет выдачу — исход: тест.
- [ ] Штраф не меняет оценки и не создаёт выдачу; второй `ACTIVE` на урок отклонён — исход: тест.
- [ ] Teacher не отзывает и не открывает каталог; чужой ученик — `NOT_FOUND` — исход: тест policy.
- [ ] Стирание данных ребёнка удаляет выдачи, доказательства и штрафы — исход: тест процедуры удаления.

## 13. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| — | — | — | — |

## 14. Related documents

| Document | Relationship |
|----------|--------------|
| [`achievements_spec.md`](../../../my_specs/achievements_spec.md) | Правила ДС и ШТ, каталог §9, тесты §7.3 |
| [`adr_012_achievements_and_penalties.md`](../../../prds/07_governance/adr_012_achievements_and_penalties.md) | Флаг, транзакция, режим существующих групп, UI |
| [`bricks_ledger_contract.md`](./bricks_ledger_contract.md) | Формула «набрано» |
| [`P12_phase_description.md`](../phases_tasks_descriptions/P12_phase_description.md) | Фаза |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W8-11

## 15. Agent notes

- Не реализовывать дайджест, роль `parent` и `practice`.
- Не удалять выдачу и штраф вне процедуры стирания данных.
- Не принимать баллы и снимок правила с клиента.
- Не вызывать `evaluate` вне интерактивной транзакции с блокировкой ученика.
- Коды `ACHIEVEMENT_` и `PENALTY_` добавить в domain до использования в DAL.

## Change log

| Date | Change |
|------|--------|
| 2026-10-22 | v1.0 — Canonical (W8-11, P12) |
| 2026-10-24 | v1.1 — баллы группы: §4, §6.1, ссылка на `achievement_group_points_contract` (ADR-015) |
