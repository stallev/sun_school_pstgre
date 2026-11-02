# ADR-016 — Подтверждаемые достижения и разовые события

**Тип:** ADR  
**Статус:** ACCEPTED  
**Версия:** 1.0  
**Дата:** 2026-11-02  
**Волна:** P23  
**Зависит от:** [`adr_012_achievements_and_penalties.md`](./adr_012_achievements_and_penalties.md), [`adr_015_group_achievement_points.md`](./adr_015_group_achievement_points.md), [`adr_013_families_and_parents.md`](./adr_013_families_and_parents.md), [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) §6, [`achievements_and_penalties_contract.md`](../../implementation/mvp/contracts/achievements_and_penalties_contract.md), [`domain_invariants.md`](../02_domain_model/domain_invariants.md) (инварианты 1–3)  
**Связанные документы:** [`achievement_suggestions_contract.md`](../../implementation/mvp/contracts/achievement_suggestions_contract.md), [`achievements_screens_spec.md`](../../implementation/mvp/specs/achievements_screens_spec.md) §5.4, §5.7, §5.8, [`families_and_parents_screens_spec.md`](../../implementation/mvp/specs/families_and_parents_screens_spec.md) §5.2, [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md) AZ-66, [`P23_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P23_phase_description.md)  
**Проверено по:** код ветки `P23` (2026-11-02): `packages/domain/src/achievements/{constants,award-key,evaluate}.ts`, `apps/web/src/data/achievements/{evaluate-pupil,award-manually}.ts`, `packages/db/src/seed/reference/achievement-catalog.ts`; Prisma `7.10.0` (`packages/db/package.json`, адаптер `pg`, интерактивная транзакция и `updateMany` с условием — без изменений API); `@base-ui/react` `1.9.0` — `Select.Root` prop `items` (`node_modules/@base-ui/react/select/root/SelectRoot.d.ts`: при заданном `items` `<Select.Value>` показывает label, а не сырое `value`). Context7 не вызывался.

---

## 1. Purpose

Достижения за серию выученных стихов («Хранитель слова», `verses`) сейчас выдаются автоматически. Владелец хочет, чтобы учитель сначала убедился, что ребёнок действительно помнит тексты, и только потом баллы шли в зачёт. Нужен способ хранить «предложенное, но не подтверждённое», не рискуя тем, что неподтверждённые баллы попадут в рейтинг и кирпичики. Отдельно — разовое повторяемое событие «Рассказал стихотворение на богослужении».

## 2. Scope / Out of scope

**В scope:** предложение выдачи (`achievement_suggestion`), признак каталога `achievement.requires_confirmation`, правило «когда нужно подтверждение», операции подтвердить / отложить / отклонить, права (AZ-66), карточка у родителя, новое правило `EVENT` и достижение `worship_recital`.  
**Вне scope:** подтверждение по отдельным текстам (чекбоксы), уведомления (push, email), подтверждение родителем, изменение читателей баллов, пороги по группам.

## 3. Context

- Баллы выдач читают рейтинг, «набрано», панель ученика, потолок штрафа; набор читателей защищён `achievement-points-readers-grep-gate.test.ts`.
- `evaluate` уже идемпотентен: `award_key` (ученик + достижение + уровень + год) уникален, P2002 пропускается (`persistProposedAwards`).
- Список текстов серии восстанавливается без новых данных: `achievement_evidence`/`evidence_check_ids` → `homework_check` → `lesson` → `lesson_golden_verse` → `golden_verse` → `bible_verse`.
- Push и email в проекте нет; родитель видит данные только на `/child` (ADR-013).
- Правило `MANUAL` в каталоге сейчас занято штрафами (`behavior`, `disrupt`, `disrespect`); `awardManually` для не-`MANUAL` требует доказательства (`checkIds`).

## 4. Decision

1. **Отдельная таблица `achievement_suggestion`**, а не статус на `achievement_award`. Неподтверждённое физически не лежит там, где читают баллы; ни один читатель баллов не меняется.
2. **Признак каталога** `achievement.requires_confirmation boolean default false`. Миграция ставит `true` для `code = 'verses'`. Seed только создаёт значение у новой строки и не затирает существующее (как `is_active`, ADR-015 §4 п. 6).
3. **Правило подтверждения** — чистая функция в `@sunschool/domain`: `requiresConfirmation(achievement, tierLength) = achievement.requiresConfirmation && tierLength >= MIN_LESSONS_FOR_CONFIRMATION`, `MIN_LESSONS_FOR_CONFIRMATION = 2`. Под правило попадают уровни «Хранителя слова» (3, 5, 7 уроков подряд); `first` (1 урок) и события — нет.
4. **Ядро `evaluate` не меняется.** `persistProposedAwards` для уровня, где `requiresConfirmation` истинно, пишет строку `achievement_suggestion` (статус `SUGGESTED`) вместо выдачи; P2002 по `award_key` — пропуск. Существующие предложения любого статуса считаются занятыми уровнями, повторно не предлагаются.
5. **Подтверждение** — один use-case в транзакции: блокировка ученика; условный `updateMany where id and status = SUGGESTED` (гонка → `count = 0` → `ACHIEVEMENT_SUGGESTION_RESOLVED`); затем настоящая `achievement_award` тем же путём, что и автовыдача (доказательства из `evidence_check_ids`, `source = AUTO`, `awarded_by` = подтвердивший). Баллы — `resolveEffectivePoints` на момент подтверждения по группе последней проверки (`grade_id` предложения), ADR-015 §4 п. 3.
6. **«Отложить» — не статус.** Пишется `deferred_at` и журнал; запись остаётся в «ждут подтверждения». **«Отклонить»** — `DISMISSED`: карточка уходит у учителя и родителя, уровень остаётся занятым на этот год.
7. **Права (AZ-66).** Teacher — группа предложения (`grade_id`) с назначением, только активный год; admin — любая группа, в закрытом году — с записью в журнал. Чужая группа → `NOT_FOUND`, иная роль → `FORBIDDEN`. Флаг `features.achievements` и режим группы проверяются в use-case.
8. **Родитель** (флаги `features.parents` и `features.achievements`, действующее согласие): карточка «Ждёт подтверждения учителем» на `/child` со списком текстов (ссылка и текст в переводе группы). Только чтение; в закрытом году карточка не показывается. Новых маршрутов нет.
9. **Журнал:** `achievement.suggested`, `achievement.suggestion_confirmed`, `achievement.suggestion_deferred`, `achievement.suggestion_dismissed` (ссылки, без ФИО).
10. **Разовое событие.** Новый тип правила `ACHIEVEMENT_RULE_TYPE.EVENT`: `evaluate` его пропускает, выдаётся только вручную, повторяемо. Строка каталога `worship_recital` («Рассказал стихотворение на богослужении»): `REWARD`, `EVENT`, категория `MEMORY`, один уровень `length = 1`, 6 баллов, `requires_confirmation = false`. Ветка `EVENT` в `awardManually` без доказательств; `award_key` дополняется ключом события (§10 Q-1); потолок — `resolveEffectivePoints`. Журнал — существующий `achievement.awarded`, отдельный код не нужен.
11. **Транспорт мутаций** подтвердить / отложить / отклонить / выдать событие — Server Action (`MutationResult`) без Route Handler fallback: это не критичный мобильный поток из списка `ios-safari-mutation-transport` (регистрация, одобрение заявки, сохранение проверки), повтор безопасен (условный апдейт, уникальный ключ). Если CU5 найдёт иное — правка этого пункта.

## 5. Rejected alternatives

| Вариант | Почему отклонён |
|---------|-----------------|
| Статус `SUGGESTED` на `achievement_award` | Все читатели баллов должны помнить фильтр; один пропущенный `where` — неподтверждённые баллы в рейтинге и кирпичиках |
| Чекбоксы по каждому тексту серии | Сложнее UI и модель; владелец подтверждает серию целиком |
| «Отложить» как отдельный статус | Состояния нет: «пока не готов» = по-прежнему ждёт подтверждения |
| Подтверждение родителем | Ответственность за оценку — у учителя; родитель только видит |
| Порог как свойство уровня в каталоге | Решение владельца — серия от 2 уроков; константа в domain проще и не требует UI каталога |
| Событие через `MANUAL` | `MANUAL` занят штрафами; повторяемость и отсутствие доказательств — отдельная семантика |

## 6. Consequences

- Одна новая таблица, одна колонка каталога, одна миграция; новый enum статуса предложения.
- Серия «Хранителя слова» перестаёт давать баллы до подтверждения: возможен лаг в кирпичиках, это ожидаемо.
- Новый T3-контур прав (учитель превращает предложение в баллы) и новый ролевой срез данных родителя.
- Стирание данных ребёнка и удаление учебного года удаляют и предложения.

## 7. Paths (H / N / S)

**H:** серия 3 урока → предложение; учитель подтверждает → выдача с эффективными баллами; родитель видит карточку до подтверждения; учитель выдаёт `worship_recital` дважды в разные дни.  
**N:** повтор пересчёта; серия выросла до 5 при ожидающем уровне 3; гонка двух подтверждений; закрытый год у teacher; флаг или режим выключен; строка каталога выключена; доказательство занято к моменту подтверждения; отклонённый уровень не предлагается повторно.  
**S:** чужая группа → `NOT_FOUND`; parent и иные роли → `FORBIDDEN`; родитель видит только своих детей с согласием; баллы и снимок формирует сервер; в журнале нет ФИО.

## 8. Affected documents

| Документ | Правка |
|----------|--------|
| [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) | `achievement_suggestion`, `achievement.requires_confirmation`, enum, §9 |
| [`achievements_and_penalties_contract.md`](../../implementation/mvp/contracts/achievements_and_penalties_contract.md) | §4, §6.2, §6.4, §7–§9, Change log |
| [`achievement_suggestions_contract.md`](../../implementation/mvp/contracts/achievement_suggestions_contract.md) | новый |
| [`achievements_screens_spec.md`](../../implementation/mvp/specs/achievements_screens_spec.md) | §5.4, §5.7, §5.8 |
| [`families_and_parents_screens_spec.md`](../../implementation/mvp/specs/families_and_parents_screens_spec.md) | §5.2 карточка |
| [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md) | AZ-66 |
| [`change_log_contract.md`](../../implementation/mvp/contracts/change_log_contract.md) | 4 кода |
| [`canonical_routes.md`](../../design/canonical_routes.md) | запись «новых маршрутов нет» |
| [`README.md`](../../implementation/mvp/README.md), [`P23_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P23_phase_description.md), [`P23_tasks.md`](../../implementation/mvp/tasks/P23_tasks.md) | фаза P23 |

## 9. Acceptance criteria

- [ ] Серия `verses` от 3 уроков создаёт предложение, а не выдачу; читатели баллов не меняются — исход: тест `evaluate-pupil` + зелёный `achievement-points-readers-grep-gate`.
- [ ] Повтор пересчёта и рост серии не дублируют предложения — исход: тест.
- [ ] Подтверждение создаёт выдачу с эффективными баллами; второе подтверждение — `ACHIEVEMENT_SUGGESTION_RESOLVED` — исход: тест гонки.
- [ ] Teacher: чужая группа `NOT_FOUND`, закрытый год `ACHIEVEMENT_YEAR_CLOSED` — исход: тест policy.
- [ ] `worship_recital` выдаётся повторно без доказательств, потолок — эффективные баллы — исход: тест `awardManually`.

## 10. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| Q-1 | ~~Что такое «идентификатор события» в `award_key` `worship_recital`~~ **Закрыт (2026-11-02, CU8):** ключ события — дата события `eventOn` (`YYYY-MM-DD`, пояс школы). `award_key = ученик:достижение:1:год:YYYY-MM-DD`; выдача в ту же дату → `CONFLICT` (проверка по `award_key` до записи, без P2002 внутри транзакции); в разные даты — разные ключи, выдача повторяема. Отозванная выдача держит ключ: повтор в ту же дату тоже `CONFLICT` | решено (дефолт, владелец не возразил) | — |
| Q-2 | Ученик переведён в другую группу при ожидающем предложении: кто подтверждает? | Группа предложения (`grade_id`, последняя проверка); учитель новой группы не видит; admin видит всегда | владелец | нет (действует предложение) |

## 11. Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_012_achievements_and_penalties.md`](./adr_012_achievements_and_penalties.md) | База: флаг, пересчёт, снимок |
| [`adr_015_group_achievement_points.md`](./adr_015_group_achievement_points.md) | Эффективные баллы, группа факта |
| [`adr_013_families_and_parents.md`](./adr_013_families_and_parents.md) | Экран родителя, согласие |

## 12. Agent notes

- Не добавлять статус на `achievement_award`; не фильтровать читателей баллов.
- Порог подтверждения — только `MIN_LESSONS_FOR_CONFIRMATION`, не магическое число.
- Не принимать с клиента баллы, `award_key`, доказательства подтверждения.
- Перед правкой `award-manually.ts` (CU8) прочитать файл целиком.

## Change log

| Date | Change |
|------|--------|
| 2026-11-02 | v1.0 — ACCEPTED (P23-CU2) |
