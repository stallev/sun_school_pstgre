# ADR-015 — Баллы достижений и штрафов по группам

**Тип:** ADR  
**Статус:** ACCEPTED  
**Версия:** 1.0  
**Дата:** 2026-10-24  
**Волна:** W12-06 (P15)  
**Зависит от:** [`adr_012_achievements_and_penalties.md`](./adr_012_achievements_and_penalties.md), [`adr_005_schema_complete_post_mvp_tables.md`](./adr_005_schema_complete_post_mvp_tables.md), [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) §4, [`achievements_and_penalties_contract.md`](../../implementation/mvp/contracts/achievements_and_penalties_contract.md), [`domain_invariants.md`](../02_domain_model/domain_invariants.md) (инварианты 1–3)  
**Связанные документы:** [`achievement_group_points_contract.md`](../../implementation/mvp/contracts/achievement_group_points_contract.md), [`achievements_screens_spec.md`](../../implementation/mvp/specs/achievements_screens_spec.md), [`P15_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P15_phase_description.md), [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md)  
**Проверено по:** схема и код на ветке `P14` (2026-10-24): `achievement.threshold`, `achievement_tier.points` читаются из БД в `achievement-evaluate-context.server.ts`, `issue-penalty.ts`; стартовый каталог — `packages/db/src/seed/reference/achievement-catalog.ts`. Библиотечный контракт не меняется (Prisma v7, адаптер `pg`), Context7 не вызывался.

---

## 1. Purpose

Учитель должен менять стоимость достижений и штрафов для своей группы. Сейчас баллы глобальные и правит их только admin на `/achievements`. Нужно решение, как хранить различия по группам и откуда брать «сколько стоит».

## 2. Scope / Out of scope

**В scope:** переопределение **баллов** (награда по уровню, размер штрафа) на уровне «группа + учебный год»; правило эффективных баллов; права; seed.  
**Вне scope:** пороги серий (`length`), условия, названия, включение достижений по группам; баллы по отдельным ученикам; изменение уже выданного.

## 3. Context

- Группа в схеме — `grade`; настройки группы по годам — `grade_settings (grade_id, academic_year_id)`, там же `achievements_enabled` и периоды `grade_achievement_period`.
- Рабочий источник баллов — только БД. Копия — `ACHIEVEMENT_CATALOG` в seed; `ensureAchievementCatalog` при каждом запуске пишет в БД `points`, `length`, `threshold` и тем самым затирает правки интерфейса.
- Выданное хранит `achievement_award.points` и `rule_snapshot`, штраф — `penalty.points`; прошлое от смены каталога не зависит (ДС-10).

## 4. Decision

1. **Переопределения.** Новая таблица `grade_achievement_points (grade_settings_id, achievement_id, tier, points)`, уникальность `(grade_settings_id, achievement_id, tier)`. `tier = 0` для штрафа (NULL в уникальном индексе Postgres не уникален). Хранятся только отличия от глобального каталога.
2. **Эффективные баллы** = переопределение группы и года, иначе глобальное значение. Одна чистая функция `resolveEffectivePoints` в `@sunschool/domain`; других мест, где решается «сколько стоит», нет.
3. **Группа факта.** Выдача награды берёт баллы по группе урока **завершающей** проверки (последняя запись в `achievement_evidence` выдачи); штраф — по группе урока штрафа. Это согласуется с инвариантом 3 (отметки привязаны к уроку и группе).
4. **Только баллы.** `length` и условия глобальны. Переопределение уровня, которого нет в глобальном каталоге, недопустимо.
5. **Права.** Правит teacher своей группы в **активном** году и admin любой группы; в закрытом году — только admin с записью в журнал. Глобальный каталог по-прежнему правит только admin. Учитель по-прежнему не открывает `/achievements` (AZ-D3); редактор баллов живёт на отдельных маршрутах группы.
6. **Seed не затирает данные.** `ensureAchievementCatalog` для уже существующих строк не обновляет `points`, `length`, `threshold` (создаёт отсутствующее), как уже сделано с `is_active`. Названия и описания по-прежнему синхронизируются.
7. **Журнал.** `achievement.group_points_changed` с до/после по каждой строке (ссылки на группу и достижение, без ФИО).

## 5. Rejected alternatives

| Вариант | Почему отклонён |
|---------|-----------------|
| Полная копия каталога на группу | Дублирует условия и названия; новое достижение не появляется у групп само |
| JSON в `grade_settings.weights` | Нет внешних ключей и уникальности, нельзя показать «отличается от общего» запросом |
| Баллы на уровне школы с правкой учителем | Правка одного учителя меняла бы все группы; противоречит запросу |
| Пороги по группам | Серии и обзорные уроки считаются глобально (ДС); объём и риск несоразмерны запросу. Таблицу можно расширить колонкой `length` позже |

## 6. Consequences

- Одна новая таблица и миграция; читатели баллов (оценка, ручная выдача, штраф) переходят на `resolveEffectivePoints`.
- Изменение глобального каталога не трогает группы с переопределением; группы без него следуют за глобальным значением.
- Кирпичики считаются по ученику и году: награды из разных групп с разными ценами суммируются как есть (инвариант 3).
- Новый T3-контур прав: учитель пишет данные, влияющие на баланс кирпичиков.

## 7. Paths (H / N / S)

**H:** учитель меняет цену, следующая выдача и потолок штрафа берут её; сброс возвращает глобальное значение.  
**N:** уровень не из каталога, отрицательная награда, штраф ≥ 0, закрытый год у teacher, чужая группа, флаг выключен, пустой список.  
**S:** запись только своя группа или admin по БД, флаг в use-case, баллы не принимаются из клиента как «снимок», журнал на каждое изменение.

## 8. Affected documents

| Документ | Правка |
|----------|--------|
| [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) | таблица `grade_achievement_points` |
| [`achievements_and_penalties_contract.md`](../../implementation/mvp/contracts/achievements_and_penalties_contract.md) | §4, §6.1, §6.4–§6.5, §8, Change log |
| [`achievement_group_points_contract.md`](../../implementation/mvp/contracts/achievement_group_points_contract.md) | новый |
| [`achievements_screens_spec.md`](../../implementation/mvp/specs/achievements_screens_spec.md) | §5.7 редактор баллов группы |
| [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md) | AZ-65, маршруты |
| [`canonical_routes.md`](../../design/canonical_routes.md) | `/group/points`, `/groups/[groupId]/points` |
| [`change_log_contract.md`](../../implementation/mvp/contracts/change_log_contract.md) | код действия |
| [`README.md`](../../implementation/mvp/README.md) | фаза P15 |

## 9. Acceptance criteria

- [ ] Переопределение группы меняет баллы только следующих выдач этой группы — исход: тест `evaluate`.
- [ ] Без переопределения используется глобальное значение, смена глобального сразу видна группам без переопределения — исход: тест `resolveEffectivePoints`.
- [ ] Повторный seed не затирает баллы, изменённые в БД — исход: интеграционный тест seed.
- [ ] Teacher не пишет чужую группу и закрытый год — исход: тест policy.

## 10. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| — | — | — | — |

## 11. Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_012_achievements_and_penalties.md`](./adr_012_achievements_and_penalties.md) | База: флаг, пересчёт, снимок правила |
| [`P15_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P15_phase_description.md) | Фаза |

## 12. Agent notes

- Не копировать каталог в группу; хранить только отличия.
- Не принимать `rule_snapshot` и итоговые баллы выдачи с клиента.
- Баллы решает только `resolveEffectivePoints`; прямых чтений `tier.points` / `threshold` в DAL после P15-CU4 быть не должно.

## Change log

| Date | Change |
|------|--------|
| 2026-10-24 | v1.0 — ACCEPTED (W12-06, P15) |
