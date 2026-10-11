# Bricks ledger contract

**Тип:** Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W8-06  
**Зависит от:** [`monorepo_boundaries_contract.md`](./monorepo_boundaries_contract.md), [`homework_check_contract.md`](./homework_check_contract.md) §6, [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §5.8, [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) INV-10, INV-17, INV-18, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) (AZ-40, AZ-41), [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §5.5 (`brick_ledger`), R-6, R-7, [`sunday_school_data_analytics_spec.md`](../../../my_specs/sunday_school_data_analytics_spec.md) (БП-6, БП-11, §3.19)  
**Связанные документы:** [`school_year_and_groups_contract.md`](./school_year_and_groups_contract.md), [`ui_states_contract.md`](../../../design/ui_states_contract.md) D8, [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** бизнес-правила — спецификация (БП-11); блокировка строк и уровни изоляции PostgreSQL — стандарт, реализация и пересверка по Prisma v7 на P01. Context7 недоступен.

---

## 1. Purpose

Контракт учёта кирпичиков: как вычисляется остаток, как выдаются и исправляются записи журнала, что видит какая роль. Читают: исполнитель P04, авторы `bricks_and_rating_spec` (W9-06), `reviewer`.

## 2. Scope / Out of scope

**В scope:** `brick_ledger`, баланс «ученик + учебный год», выдача и компенсация.  
**Вне scope:** баллы за достижения и штрафы (post-MVP: в MVP слагаемые равны 0); рейтинг ([`analytics_screens_spec`](../../../prds/architecture_master_index.md)); расчёт `points_total` ([`homework_check_contract.md`](./homework_check_contract.md) §6).

## 3. Определения

| Термин | Значение |
|--------|----------|
| Набрано | Σ `points_total` записей проверки с `homework_checked = true` ученика за **учебный год** (по всем группам, БП-11, INV-10) |
| Выдано | Σ `quantity` записей `brick_ledger` ученика за год (отрицательные компенсации уменьшают) |
| Остаток | `набрано − выдано` |
| Журнал | таблица только добавления; запись не редактируется и не удаляется (INV-17, R-6) |

В MVP бонус за достижения и штрафы равен 0; формула расширяема без изменения контракта: `набрано = очки_проверок + очки_достижений − штрафы`.

## 4. Операции

| Операция | Актор | Эффект | AZ |
|----------|-------|--------|----|
| `getBalance(pupilId, yearId)` | `TEACHER` (своя группа ученика), `ADMIN` | чтение | AZ-41 |
| `listLedger(pupilId, yearId)` | `TEACHER` (своя), `ADMIN` | чтение журнала | AZ-41 |
| `issueBricks` | `TEACHER` (своя), `ADMIN` | запись `quantity > 0` | AZ-40 |
| `compensateBricks` | `TEACHER` (своя), `ADMIN` | запись `quantity < 0` с примечанием | AZ-40 |

«Своя группа ученика» — группа, в которой у ученика есть (или было в этом году) зачисление и в которой пользователь назначен в этом году.

## 5. Входы

| Операция | Поле | Правило |
|----------|------|---------|
| `issueBricks` | `pupilId`, `yearId` | год — по умолчанию `ACTIVE`; закрытый допускается (БП-6) |
| | `quantity` | целое **> 0** |
| | `issuedOn` | `date`; по умолчанию «сегодня» в поясе школы; не позже сегодня |
| | `note` | необязательно, ≤ 300 |
| `compensateBricks` | `pupilId`, `yearId` | как выше |
| | `quantity` | целое **< 0**, `|quantity|` ≤ выдано за год |
| | `note` | **обязательно**, ≤ 300 |
| | `compensatesId` | необязательно: запись, которую исправляют (ссылка) |

**Не принимается с клиента:** `issuedBy`, `balance`, `earned`.

## 6. Happy path

### 6.1 `getBalance`

- Вычисляется из `homework_check` и `brick_ledger` одним запросом (индексы `(pupil_id, academic_year_id)`); результат — `{ earned, issued, balance, needsAttention }` (`needsAttention = balance < 0`).
- Кэш: тег по ученику и году; сбрасывается `updateTag` из `saveChecked`, `correctCheck`, `issueBricks`, `compensateBricks`.

### 6.2 `issueBricks`

- **Предусловия:** ученик существует и (для teacher) в своей группе; `quantity > 0`; `quantity ≤ balance` на момент записи (R-7, INV-18).
- **Транзакция:** блокировка строки ученика (`SELECT … FOR UPDATE` по паре «ученик + год» либо advisory lock по ключу пары) → вычислить `balance` → проверить → вставить запись (`issued_by`, `issued_on`, `note`) → журнал.
- **Журнал `audit_log`:** `bricks.issued` (ученик, год, количество).
- **Постусловие:** `balance` уменьшился на `quantity`.

### 6.3 `compensateBricks`

- **Предусловия:** `quantity < 0`; `note` непусто; `|quantity| ≤ issued` за год (нельзя «вернуть» больше, чем выдано).
- **Транзакция:** как §6.2. Исходная запись остаётся. Журнал `bricks.compensated`.
- **Постусловие:** `issued` уменьшился, `balance` увеличился на `|quantity|`.

## 7. Видимость

| Данные | ADMIN | TEACHER | Прочие |
|--------|:-----:|:-------:|:------:|
| Остаток, журнал по ученику | все | свои группы | — |
| Отрицательный остаток / «требует внимания» | ✔ | ✔ | — (родитель — post-MVP: видит выданное и набранное, не отрицательное; INV-18) |

## 8. Negative paths (business)

| Случай | Условие | Код | Ключ сообщения | Исход |
|--------|---------|-----|----------------|-------|
| Превышение остатка | `quantity > balance` | `BRICKS_INSUFFICIENT` | `teacher.bricks.insufficient` | запись не создана, показан актуальный остаток |
| Нулевое количество | `quantity = 0` | `VALIDATION` (`fields.quantity`) | `teacher.bricks.quantity_nonzero` | форма сохранена |
| Нецелое / вне типа | не целое | `VALIDATION` | `teacher.bricks.quantity_integer` | — |
| Нужно примечание | компенсация без `note` | `VALIDATION` (`fields.note`) | `teacher.bricks.note_required` | — |
| Компенсация сверх выданного | `|q| > issued` | `BRICKS_COMPENSATE_EXCEEDS` | `teacher.bricks.compensate_exceeds` | отказ |
| Дата в будущем | `issuedOn > today` | `VALIDATION` (`fields.issuedOn`) | `teacher.bricks.date_future` | — |
| Чужой ученик | не своя группа | `NOT_FOUND` | `common.errors.not_found` | AZ-D4 |
| Правка / удаление записи | попытка `UPDATE`/`DELETE` | — | — | недоступно: нет такой операции (R-6) |
| Состояние изменилось | параллельная выдача | `CONFLICT` | `common.errors.conflict` | повторить |

## 9. Security paths

| Путь | Требование | AZ |
|------|------------|----|
| S-1 | Выдача и просмотр — своя группа (teacher) либо admin; проверка по БД | AZ-40, AZ-41, AZ-D4 |
| S-2 | `issuedBy` и время — только серверные | — |
| S-3 | У приложения нет операций `UPDATE`/`DELETE` над журналом; роль БД приложения без этих прав (R-6) | INV-17 |
| S-4 | Единственное исключение — полное удаление данных ребёнка | [`deletion_requests_contract.md`](./deletion_requests_contract.md) |
| S-5 | В журнале изменений — ссылка на ученика, количество; ФИО не пишется (INV-23) | — |

## 10. Concurrency & idempotency

| Гонка | Защита | Исход |
|-------|--------|-------|
| Две параллельные выдачи одному ученику | блокировка пары «ученик + год», проверка остатка внутри транзакции (R-7) | вторая видит уменьшенный остаток; при нехватке — `BRICKS_INSUFFICIENT` |
| Выдача и правка проверки (баллы уменьшились) | остаток считается внутри транзакции | допустим отрицательный остаток — только вследствие уменьшения баллов; виден teacher/admin (INV-18) |
| Двойной клик | блокировка кнопки; идемпотентный ключ запроса (`requestId` из формы) | одна запись |
| Выдача в год, закрываемый параллельно | `closeYear` не блокирует выдачу (БП-6) | допустима |

## 11. Drift & consistency

| Риск | Guard |
|------|-------|
| Остаток хранится колонкой и расходится | остаток **только вычисляется** (§3); колонки нет |
| Группа вошла в расчёт | тест: перевод не меняет остаток (INV-10) |
| Правка журнала миграцией/скриптом | роль БД; review |
| Выдача сверх остатка из-за кэша | проверка внутри транзакции по свежим данным, не по кэшу |
| Разные округления | все значения — целые |

## 12. Policy & layer touchpoints

| Слой | Роль |
|------|------|
| `domain` | `computeBalance(earned, issued)`, `canIssue`, схемы входов |
| `policy-server` | принадлежность ученика группе teacher |
| DAL (`src/data/bricks/**`) | запрос баланса, транзакции §6, журнал |
| Роль БД | `INSERT`/`SELECT` на `brick_ledger`, без `UPDATE`/`DELETE` (кроме процедуры удаления) |

## 13. Acceptance criteria

- [ ] Выдача сверх остатка отклонена; параллельные выдачи не дают отрицательного остатка по вине выдачи — исход: тест гонки (R-7, INV-18).
- [ ] Компенсация создаёт отрицательную запись, исходная остаётся — исход: тест (INV-17).
- [ ] Остаток после перевода ученика между группами не меняется — исход: тест (INV-10).
- [ ] Правка проверки в меньшую сторону даёт отрицательный остаток, видимый teacher/admin — исход: тест.
- [ ] Нулевое количество и компенсация без примечания отклоняются — исход: тест.
- [ ] Выдача за закрытый год допустима — исход: тест (БП-6).
- [ ] Каждая запись пишет журнал изменений — исход: тест.

## 14. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| Q-01 | ✔ **Решено 2026-10-11.** Разрешать ли выдачу в закрытом году только admin | Teacher тоже (БП-6: «выдача остаётся доступна»); без ограничения по давности | владелец | W9-06 |
| Q-02 | Массовая выдача группе одним действием | Нет в MVP; построчно | владелец | W9-06 |
| Q-03 | Дата `issuedOn` в прошлом (учёт задним числом) | Разрешена | architect | — |

## 15. Related documents

| Document | Relationship |
|----------|--------------|
| [`homework_check_contract.md`](./homework_check_contract.md) | Источник «набрано» |
| [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §5.8 | Операции |
| [`change_log_contract.md`](./change_log_contract.md) | Action-коды |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W8-06

## 16. Agent notes

- Не хранить остаток колонкой — только вычислять.
- Не добавлять `UPDATE`/`DELETE` для `brick_ledger`.
- Не использовать группу в расчёте остатка.
- Не выдавать по кэшированному остатку: проверка внутри транзакции.
- Не писать ФИО ученика в журнал изменений.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W8-06) |
