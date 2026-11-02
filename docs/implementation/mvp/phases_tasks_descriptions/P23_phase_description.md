# P23 — Подтверждаемые достижения и разовые события

**Тип:** Phase Description  
**Статус:** Canonical  
**Прогресс фазы:** документы готовы (CU2), реализация не начата  
**Версия:** 1.0  
**Дата:** 2026-11-02  
**Волна:** P23  
**Зависит от:** [`adr_016_confirmable_achievements_and_events.md`](../../../prds/07_governance/adr_016_confirmable_achievements_and_events.md), [`achievement_suggestions_contract.md`](../contracts/achievement_suggestions_contract.md), [`achievements_and_penalties_contract.md`](../contracts/achievements_and_penalties_contract.md) §4–§9, [`achievements_screens_spec.md`](../specs/achievements_screens_spec.md) §5.4, §5.7, §5.8, [`families_and_parents_screens_spec.md`](../specs/families_and_parents_screens_spec.md) §5.2, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) AZ-60, AZ-66, [`project_quality_profile.md`](../../../meta/project_quality_profile.md) (lean, D4, D6)  
**Связанные документы:** [`P23_tasks.md`](../tasks/P23_tasks.md), [`P15_phase_description.md`](./P15_phase_description.md) (эффективные баллы), [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §6

---

## Purpose

1. Довести редактор баллов группы: год названием, бейдж «Неактивно», «Как зарабатывается», условие словами.
2. Уровни «Хранителя слова» (серия от 2 уроков) — сначала предложение, баллы только после подтверждения учителем; отложить и отклонить; родитель видит карточку «Ждёт подтверждения учителем» на `/child`.
3. Новое повторяемое достижение «Рассказал стихотворение на богослужении» (`worship_recital`, 6 баллов, правило `EVENT`), выдаётся вручную каждый раз.

## Agent context budget

**MUST read (≤ 8):**

| # | Документ | Зачем |
|---|----------|-------|
| 1 | [`P23_tasks.md`](../tasks/P23_tasks.md) | Чек-лист и CU |
| 2 | [`achievement_suggestions_contract.md`](../contracts/achievement_suggestions_contract.md) | Данные, операции, отказы |
| 3 | [`adr_016_confirmable_achievements_and_events.md`](../../../prds/07_governance/adr_016_confirmable_achievements_and_events.md) | Решение, Open questions |
| 4 | [`achievements_and_penalties_contract.md`](../contracts/achievements_and_penalties_contract.md) §4–§9 | Пересчёт, ручная выдача, событие |
| 5 | [`achievements_screens_spec.md`](../specs/achievements_screens_spec.md) §5.4, §5.7, §5.8 | Экраны учителя |
| 6 | [`families_and_parents_screens_spec.md`](../specs/families_and_parents_screens_spec.md) §5.2 | Карточка родителя |
| 7 | [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) AZ-60, AZ-66 | Права |
| 8 | [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §6 | Таблица и колонка |

**MUST NOT read** другие `P*_phase_description.md`, кроме P15 по ссылке.

---

## Scope / Out of scope

### In scope

| Область | Результат |
|---------|-----------|
| UI редактора баллов | `items` в `FormSelect`, бейдж, раскрытие описания, `conditionLabel` из `ruleType` + `length`, тексты seed |
| БД | `achievement_suggestion`, `achievement.requires_confirmation`, enum, миграция с `UPDATE … WHERE code = 'verses'` |
| Domain | `MIN_LESSONS_FOR_CONFIRMATION`, `requiresConfirmation`, `ACHIEVEMENT_SUGGESTION_STATUS`, `ACHIEVEMENT_RULE_TYPE.EVENT`, коды, действия журнала, сборка текстов серии |
| Seed | `worship_recital`; `requires_confirmation` не затирается |
| DAL | ветка `persistProposedAwards`, `confirm/defer/dismiss-suggestion`, ветка `EVENT` в `awardManually`, загрузчики учителя и родителя |
| Policy | AZ-66 |
| UI | панель ученика, счётчик группы, модалка, карточка родителя, событие в диалоге выдачи |

### Out of scope

- Подтверждение по отдельным текстам; подтверждение родителем; уведомления.
- Строка «ждут подтверждения» на `/today`.
- Изменение читателей баллов (рейтинг, «набрано», потолок штрафа).
- Новые маршруты.

## UI Catalog (эта фаза)

Без новых примитивов: `Select` (с `items`), `StatusText` / `CountBadge`, `Button`, `Dialog`, `ConfirmDialog`, `DateField`, `Banner`, иконки lucide. Список текстов серии — новый составной блок: сначала секция Design Lab (C-2), затем модалка учителя и карточка родителя (одна презентационная часть на оба экрана).

## UX/UI verification loop

Runtime-проверка (`next-dev-loop`) и скриншоты — **только по явной просьбе пользователя** (правила проекта). По умолчанию UI-CU (CU1, CU6, CU7, CU8) закрываются тестами компонентов и DTO.

## Cross-phase dependencies

| Фаза | Что нужно |
|------|-----------|
| P12 | Каталог, флаг, режим группы, `evaluatePupil`, `awardManually` |
| P13 | `/child`, согласие, `loadParentChildPage` |
| P15 | `resolveEffectivePoints`, редактор баллов, `assertSetGroupAchievementPointsAccess` |

## Implementation sequence

CU1 (редактор) → CU2 (docs) → CU3 (схема, domain, seed) → CU4 (движок) → CU5 (подтверждение, права) → CU6 (UI учителя) → CU7 (карточка родителя) → CU8 (событие). CU3, CU4, CU5, CU6, CU7, CU8 — T3, свой CU, `reviewer`.

## Happy path smoke

Ученик набирает 3 урока подряд со всеми стихами: выдачи нет, в панели ученика «Ждёт подтверждения», у родителя карточка со списком из 3 текстов. Учитель открывает модалку, «Подтвердить»: выдача +10 (или переопределение группы), карточка у родителя пропадает, бонус в кирпичиках растёт. Учитель выдаёт «Рассказал стихотворение на богослужении» в два разных воскресенья — две выдачи по 6.

## Negative path smoke

Повтор пересчёта; серия выросла до 5 при ожидающем уровне 1; «Отложить» оставляет запись; «Отклонить» убирает её и уровень не возвращается; закрытый год у teacher; флаг или режим выключен; событие на ту же дату.

## Security smoke

Teacher чужой группы — `NOT_FOUND`; parent вызывает подтверждение — `FORBIDDEN`; родитель видит только своего ребёнка с согласием; баллы с клиента не принимаются; в журнале нет ФИО.

## Concurrency & race check

Два подтверждения одного предложения — одно успешно, второе `ACHIEVEMENT_SUGGESTION_RESOLVED`; два пересчёта — одно предложение (`UNIQUE award_key`).

## Drift risks & guards

| Риск | Защита |
|------|--------|
| Неподтверждённые баллы попадают в рейтинг | отдельная таблица; `achievement-points-readers-grep-gate.test.ts` зелёный |
| Порог как магическое число | `MIN_LESSONS_FOR_CONFIRMATION` в domain, тест |
| Seed затирает `requires_confirmation` | интеграционный тест seed |

## Definition of done

- [ ] Все CU закоммичены; у каждого trace `Review: …`
- [ ] `typecheck` · `lint` · `test` · `rules:check` зелёные; `encoding:check` · `docs:links` для docs-CU
- [ ] Acceptance [контракта](../contracts/achievement_suggestions_contract.md) §12 и ADR-016 §9 закрыты тестами
- [ ] Open question ADR-016 Q-1 решён до CU8

## Open questions фазы

| ID | Вопрос | Предложение | Блокирует |
|----|--------|-------------|-----------|
| Q-1 | Ключ повторяемости события (ADR-016 §10 Q-1) | дата события | CU8 |
| Q-2 | Перевод ученика при ожидающем предложении (ADR-016 §10 Q-2) | группа предложения | нет |

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P23_tasks.md`](../tasks/P23_tasks.md) | Чек-лист |
| [`achievement_suggestions_contract.md`](../contracts/achievement_suggestions_contract.md) | Контракт |
| [`adr_016_confirmable_achievements_and_events.md`](../../../prds/07_governance/adr_016_confirmable_achievements_and_events.md) | Решение |

## Agent notes

- Не добавлять статус на `achievement_award`.
- Базовые утилиты не переписывать: `evaluatePupilInTransaction` / `persistProposedAwards`, `assertSetGroupAchievementPointsAccess`, `resolveRewardTierPoints`, `loadPupilAchievementPanel`, `loadParentChildPage`, `data/bible/get-verse-text.ts`, `get-group-translation.ts`.
- Перед CU8 прочитать `award-manually.ts` целиком.

## Acceptance criteria

См. [`achievement_suggestions_contract.md`](../contracts/achievement_suggestions_contract.md) §12 и DoD выше.

## Change log

| Date | Change |
|------|--------|
| 2026-11-02 | v1.0 — Canonical (P23-CU2): документы готовы; код не начат |
