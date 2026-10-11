# ADR-011 — Переходный период согласий опекунов для перенесённых детей

**Тип:** ADR  
**Статус:** ACCEPTED  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W11 (follow-up по P07)  
**Зависит от:** [`sunday_school_data_analytics_spec.md`](../../my_specs/sunday_school_data_analytics_spec.md) СО-4, СО-5, СО-7, §13, [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) §4, §5.3, R-5, [`lifecycle_models.md`](../02_domain_model/lifecycle_models.md) §5.4–§5.5, [`domain_invariants.md`](../02_domain_model/domain_invariants.md) INV-08, [`school_year_and_groups_contract.md`](../../implementation/mvp/contracts/school_year_and_groups_contract.md) §5.7–§5.9  
**Связанные документы:** [`P07_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P07_phase_description.md), [`deletion_requests_contract.md`](../../implementation/mvp/contracts/deletion_requests_contract.md), [`seed_data_spec.md`](../03_data_model/seed_data_spec.md), [`architecture_master_index.md`](../architecture_master_index.md)  
**Проверено по:** бизнес-правила — спецификация (СО-5 «переходный период», 60 дней); библиотеки не затрагиваются. Юридическая сторона переходного периода не проверялась — **требует проверки владельцем до prod** (Q-01). Номер **ADR-011**: номер ADR-010 занят справочным [`adr_010_nextjs_app_architecture_skill.md`](../../reference/adr_010_nextjs_app_architecture_skill.md).

---

## 1. Purpose

Зафиксировать, как система обращается с детьми, перенесёнными из действующего приложения, у которых **нет** согласия опекуна на обработку данных. Инвариант INV-08 (R-5) запрещает зачислять без действующего согласия, а при переносе дети уже зачислены и работают.

## 2. Scope / Out of scope

**В scope:** статус согласия, срок, права, действия по истечении срока, отображение.  
**Вне scope:** электронное согласие опекуна (post-MVP), семьи и опекуны как сущности, юридическая оценка срока.

## 3. Context

- Старое приложение не хранило согласий опекунов (§13, СО-5); школа продолжает работать с детьми, которых переносят.
- В схеме `child_data_consent` есть только `ACTIVE` и `REVOKED`; `signed_on` обязателен; миграция не может создать честное «подписанное» согласие.
- Нужно сохранить работу школы **и** не нарушить смысл СО-4 для **новых** детей.

## 4. Decision

| # | Решение |
|---|---------|
| 1 | В `CONSENT_STATUS` добавляется значение **`LEGACY_PENDING`** — «согласие не получено, ребёнок перенесён; действует переходный период» |
| 2 | Миграция создаёт для каждого перенесённого ребёнка запись `child_data_consent`: `status = LEGACY_PENDING`, `channel = PAPER`, `signed_on = NULL`, `signer_name = NULL`, `text_version = 'legacy'`, `marked_by` = системный пользователь миграции |
| 3 | Единый срок хранится в `app_setting.legacy_consent_deadline_on` (`date`): дата импорта + **60 дней** (СО-5); ключа до миграции нет |
| 4 | `enrollPupil` допускает согласие `LEGACY_PENDING` **только** пока `today ≤ deadline` и только для детей с признаком перенесённого (запись `LEGACY_PENDING`); для остальных по-прежнему нужен `ACTIVE` (INV-08, R-5 сохраняются) |
| 5 | Существующие зачисления перенесённых детей **сохраняются**; работа (проверки, кирпичики) не блокируется в переходный период |
| 6 | Админ получает подсветку: список «без согласия (перенесён)», срок, оставшиеся дни; teacher видит только «согласия нет (перенесён)» (СО-7) |
| 7 | `recordPaperConsent` переводит `LEGACY_PENDING → ACTIVE` (подписант, дата, версия, место — обязательны) |
| 8 | Срок истёк, согласие не получено: **админ решает по каждому** ребёнку: продлить (`extendLegacyDeadline`, общий срок), записать согласие, либо создать запрос на удаление данных ребёнка ([`deletion_requests_contract.md`](../../implementation/mvp/contracts/deletion_requests_contract.md)). **Автоматического удаления нет** (INV-25) |
| 9 | После срока для `LEGACY_PENDING` **запрещены** новые зачисления и перевод; существующее зачисление остаётся до решения admin |
| 10 | Продление срока — отдельная операция admin с причиной и записью в журнале |

## 5. Rejected alternatives

| Альтернатива | Почему отклонена |
|--------------|------------------|
| Создать `ACTIVE` бумажные согласия при импорте | Фальсифицирует согласие; нарушает цель СО-4 |
| Не зачислять перенесённых, пока нет согласия | Школа не сможет работать после переноса |
| Отдельная таблица/флаг `pupil.legacy` | Размазывает состояние согласия; `child_data_consent` уже хранит статус и аудит |
| Автоудаление данных по сроку | Нарушает INV-25 и решение владельца: решение за admin |
| Временно отключить проверку согласия при зачислении | Лазейка в INV-08 для новых детей |

## 6. Consequences

- Схема: `CONSENT_STATUS` + `LEGACY_PENDING`; `child_data_consent.signed_on` nullable (только при `LEGACY_PENDING`; CHECK).
- `canEnroll` (domain) различает `ACTIVE` и `LEGACY_PENDING` с датой.
- Новые операции: `extendLegacyDeadline` (admin); `importLegacyPupil` — внутренний этап миграции.
- Аналитика и отчёты не меняются; дети учитываются как обычно.
- Экран `/people` получает фильтр и баннер срока; оболочка — баннер у admin.
- Юридическая сторона: перенос без согласия опирается на правовое основание школы — проверяет владелец до prod (Q-01).

## 7. Paths (H / N / S)

| Путь | Описание | Исход |
|------|----------|-------|
| **H** | Импорт создаёт ребёнка с `LEGACY_PENDING`; teacher работает | Проверки сохраняются, у admin подсветка и срок |
| **H** | Admin записывает бумажное согласие | `LEGACY_PENDING → ACTIVE`, запись в журнале |
| **H** | Срок истёк; admin продлевает | Новая дата, журнал с причиной |
| **N** | Новый ребёнок без согласия | `SCHOOL_CONSENT_REQUIRED` (INV-08) |
| **N** | Зачисление `LEGACY_PENDING` после срока | `SCHOOL_CONSENT_REQUIRED` |
| **N** | Срок истёк, действий нет | Данные не удаляются; подсветка «просрочено» |
| **S** | Teacher пытается записать согласие или продлить срок | `FORBIDDEN` |
| **S** | В журнале ФИО ребёнка | Нет: ссылки (INV-23) |
| **Drift** | Код считает `LEGACY_PENDING` равным `ACTIVE` | Тест `canEnroll` |

## 8. Affected documents

| Документ | Что меняется |
|----------|--------------|
| [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) | §4 `CONSENT_STATUS`; §5.3 `signed_on` nullable; §5.6 ключ `legacy_consent_deadline_on`; R-5 |
| [`lifecycle_models.md`](../02_domain_model/lifecycle_models.md) | §5.5 переходы |
| [`school_year_and_groups_contract.md`](../../implementation/mvp/contracts/school_year_and_groups_contract.md) | §3, §5.7–§5.9, коды |
| [`change_log_contract.md`](../../implementation/mvp/contracts/change_log_contract.md) | action-коды |
| [`seed_data_spec.md`](../03_data_model/seed_data_spec.md) | ключ `app_setting` |
| [`P07_tasks.md`](../../implementation/mvp/tasks/P07_tasks.md) | CU1 по этому ADR |

## 9. Acceptance criteria

- [ ] `enrollPupil` для `LEGACY_PENDING` допустим до срока и отклоняется после — исход: тест.
- [ ] Новый ребёнок без `ACTIVE` согласия не зачисляется — исход: тест (INV-08).
- [ ] `recordPaperConsent` переводит `LEGACY_PENDING → ACTIVE` — исход: тест.
- [ ] Автоудаления по сроку нет — исход: тест / grep cron.
- [ ] Teacher не видит деталей согласия — исход: тест DTO.

## 10. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| Q-01 | Юридическая проверка основания обработки данных перенесённых детей в переходный период | владелец | prod |
| Q-02 | Срок 60 дней — подтвердить (СО-5, 12.2 п. 28) | владелец | P07 |

## 11. Related documents

| Document | Relationship |
|----------|--------------|
| [`deletion_requests_contract.md`](../../implementation/mvp/contracts/deletion_requests_contract.md) | Решение по истечении срока |
| [`adr_005_schema_complete_post_mvp_tables.md`](./adr_005_schema_complete_post_mvp_tables.md) | Схема одной миграцией |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — follow-up W11 (P07)

## 12. Agent notes

- Не равнять `LEGACY_PENDING` и `ACTIVE`; не создавать фиктивные `ACTIVE` согласия.
- Не удалять данные по сроку автоматически.
- Не ослаблять зачисление для новых детей.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — ACCEPTED |
