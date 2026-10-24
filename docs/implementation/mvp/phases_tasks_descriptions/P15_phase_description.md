# P15 — Баллы достижений и штрафов по группам

**Тип:** Phase Description  
**Статус:** Canonical  
**Прогресс фазы:** реализована (2026-10-24)  
**Версия:** 1.0  
**Дата:** 2026-10-24  
**Волна:** W12-06  
**Зависит от:** [`adr_015_group_achievement_points.md`](../../../prds/07_governance/adr_015_group_achievement_points.md), [`achievement_group_points_contract.md`](../contracts/achievement_group_points_contract.md), [`achievements_and_penalties_contract.md`](../contracts/achievements_and_penalties_contract.md), [`achievements_screens_spec.md`](../specs/achievements_screens_spec.md) §5.7, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) AZ-65, [`project_quality_profile.md`](../../../meta/project_quality_profile.md) (lean, D4, D6)  
**Связанные документы:** [`P15_tasks.md`](../tasks/P15_tasks.md), [`P12_phase_description.md`](./P12_phase_description.md) (база волны), [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md)

---

## Purpose

Дать учителю (и admin) менять стоимость каждого достижения и штрафа **для своей группы** в учебном году на отдельной странице. Баллы хранятся как отличия от глобального каталога; одна функция `resolveEffectivePoints` решает, сколько стоит. Seed больше не затирает правки. Пороги, условия и тексты не меняются.

## Agent context budget

**MUST read (≤ 8):**

| # | Документ | Зачем |
|---|----------|-------|
| 1 | [`P15_tasks.md`](../tasks/P15_tasks.md) | Чек-лист и CU |
| 2 | [`achievement_group_points_contract.md`](../contracts/achievement_group_points_contract.md) | Данные, операции, читатели, пути |
| 3 | [`adr_015_group_achievement_points.md`](../../../prds/07_governance/adr_015_group_achievement_points.md) | Решение и отклонённые варианты |
| 4 | [`achievements_screens_spec.md`](../specs/achievements_screens_spec.md) §5.7 | Экран редактора |
| 5 | [`achievements_and_penalties_contract.md`](../contracts/achievements_and_penalties_contract.md) §4–§6 | Каталог, выдача, штраф |
| 6 | [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) AZ-55, AZ-65 | Права |
| 7 | [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §4 | Таблица |
| 8 | [`ui-design-system-shadcn.mdc`](../../../../.cursor/rules/ui-design-system-shadcn.mdc) | Каталог UI |

**MUST NOT read** другие `P*_phase_description.md`, кроме P12 по ссылке.

---

## Scope / Out of scope

### In scope

| Область | Результат |
|---------|-----------|
| БД | таблица `grade_achievement_points`, миграция |
| Domain | `resolveEffectivePoints`, схемы входов, коды ошибок, действие журнала |
| DAL | `setGroupAchievementPoints`, `copyGroupAchievementPoints`; читатели: `evaluatePupil`, `awardManually`, `issuePenalty`, форма штрафа, снимок правила |
| Policy | «своя группа», admin, активный год, флаг (AZ-65) |
| Seed | `ensureAchievementCatalog` не затирает `points`, `length`, `threshold` |
| UI | `/group/points` (teacher), `/groups/[groupId]/points` (admin), ссылки с карточек группы, секция Design Lab, сообщения ru/en |

### Out of scope

- Пороги `length`, условия, тексты, включение достижений по группам.
- Баллы по ученикам; пересчёт уже выданного.
- Глобальный каталог `/achievements` остаётся только для admin.

## UI Catalog (эта фаза)

Экран собирается из каталога без новых примитивов: `PageHeader`, `PageSection`, `Table`, `Input`, `Select` (группа, год), `Button`, `Banner`, `ConfirmDialog` (копирование), `CountBadge`. Новый паттерн, если понадобится, — сначала секция Design Lab (C-2). Прототипной функции нет: визуальный эталон — строки каталога `AchievementCatalogRow` и `vAchievements`.

## UX/UI verification loop (UI-CU: CU6)

В конце CU6: открыть `/group/points` (teacher) и `/groups/[id]/points` (admin) на 390, 768, 1024, 1280 px; консоль без `error`; замер [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md) §5.1; сверка с `AchievementCatalogRow`. Trace: `UI-verify: <экраны>, <роли>, <ширины>, расхождений 0, консоль чистая`.

## Cross-phase dependencies

| Фаза | Что нужно |
|------|-----------|
| P12 | Каталог, флаг, `evaluatePupil`, `awardManually`, `issuePenalty`, режим группы |
| P14 | Компоненты `Select`, `PageSection`, сайдбар |

## Implementation sequence

CU1 (docs sync) → CU2 (миграция) → CU3 (domain, seed) → CU4 (читатели) → CU5 (запись, права) → CU6 (UI) → CU7 (docs, smoke). CU2 и CU5 — T3, свой CU, `reviewer` обязателен.

## Happy path smoke

Teacher открывает `/group/points`, меняет «Верный ученик, Бронза» с +5 на +8, сохраняет; проверяет урок так, что серия закрывается: выдача на +8, в `rule_snapshot` `pointsSource: grade`; у другой группы осталось +5.

## Negative path smoke

Уровень вне каталога; штраф со знаком «+»; закрытый год под teacher; чужая группа; флаг выключен; сброс значения; значение, равное глобальному, строку не хранит.

## Security smoke

Teacher не открывает `/achievements` (403); чужая `groupId` в URL — `NOT_FOUND`; баллы выдачи с клиента не принимаются; в журнале нет ФИО.

## Concurrency & race check

Две одновременные записи одной группы — сериализуются блокировкой; правка во время `evaluatePupil` — снимок фиксирует применённое значение.

## Drift risks & guards

| Риск | Защита |
|------|--------|
| Читатель берёт `tier.points` напрямую | grep-гейт в CU4 |
| Seed затирает баллы | интеграционный тест CU3 |
| Схема Zod на форме и сервере расходится | одна схема в `@sunschool/domain` |

## Definition of done

- [ ] Все CU закоммичены; у CU2…CU6 trace `Review: …`; у CU6 `UI-verify: …`
- [x] `typecheck` · `lint` · `test` · `rules:check` зелёные; `encoding:check` · `docs:links` для docs-CU
- [x] Acceptance контракта §12 и ADR-015 §9 закрыты тестами
- [x] Docs sync (CU7): индексы, маршруты, матрица прав, схема БД

## Open questions фазы

| ID | Вопрос | Предложение | Блокирует |
|----|--------|-------------|-----------|
| — | — | — | — |

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P15_tasks.md`](../tasks/P15_tasks.md) | Чек-лист |
| [`achievement_group_points_contract.md`](../contracts/achievement_group_points_contract.md) | Контракт |
| [`adr_015_group_achievement_points.md`](../../../prds/07_governance/adr_015_group_achievement_points.md) | Решение |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W12-06

## Agent notes

- Хранить только отличия от глобального каталога.
- Не вводить пороги и условия по группам.
- Не принимать итоговые баллы и снимок правила с клиента.

## Acceptance criteria

См. [`achievement_group_points_contract.md`](../contracts/achievement_group_points_contract.md) §12 и DoD выше.

## Change log

| Date | Change |
|------|--------|
| 2026-10-24 | v1.0 — Canonical (W12-06): документы готовы; код не начат |
| 2026-10-24 | v1.1 — P15 реализована; smoke в `P15_tasks.md` (CU7) |
