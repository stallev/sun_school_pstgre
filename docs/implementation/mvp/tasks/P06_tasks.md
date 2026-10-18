# P06 Tasks — Журнал изменений, запросы на удаление, локализация

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W11-12  
**Зависит от:** [`P06_phase_description.md`](../phases_tasks_descriptions/P06_phase_description.md), [`deletion_requests_contract.md`](../contracts/deletion_requests_contract.md), [`change_log_contract.md`](../contracts/change_log_contract.md), [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md)  
**Связанные документы:** [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md), [`adr_008`](../../../prds/07_governance/adr_008_i18n_ru_en_dictionary_slices.md), [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md), [`P05_tasks.md`](./P05_tasks.md)

---

## Purpose

Реализовать журнал, запросы на удаление и полную ru/en-локализацию. DoD — [`P06_phase_description.md`](../phases_tasks_descriptions/P06_phase_description.md).

## Phase DoR audit (lean: оркестратор inline)

- [ ] P05 DoD; данные ребёнка есть (проверки, кирпичики) для интеграционных тестов
- [ ] Q-01 (механизм привилегий БД) принят до CU2
- [ ] Задачи проходят DoR; процедура удаления сверена со схемой §9 (все таблицы с ПД перечислены)
- [ ] Словари P01–P05 существуют; сверка en/ru готова к CU9

## Commit plan

### P06-CU1 — feat(domain): add deletion plan, due date and codes · Review: diff-only · Commit: auto

- [x] P06-T1 · T2 · Contract: [deletion_requests §4–§7](../contracts/deletion_requests_contract.md)
      Files: `packages/domain/src/deletion/{build-plan,compute-due-on,can-execute}.ts`, коды `DELETION_*`, `AUDIT_ACTION` (`deletion.*`)
      Acceptance: план по категориям (удалить/обезличить) из описания данных; `due_on` = +15 календарных дней в поясе школы; `canExecute` — последний admin, свой запрос → unit-тесты
      Paths: H [§5.3] · N [последний admin, свой запрос, статус]

**CU DoD:** `typecheck` · `lint` · `test`

### P06-CU2 — feat(db): add privileged deletion procedures and migration · Review: reviewer · Commit: auto

- [x] P06-T2 · T3 · Contract: [deletion_requests §12, Q-03](../contracts/deletion_requests_contract.md) · Invariants: INV-16, INV-17, R-6
      Files: `packages/db/prisma/migrations/*_deletion_procedures/`, `packages/db/src/deletion/*`
      Acceptance: функции БД выполняют только `DELETE` по `brick_ledger` ребёнка и очистку значений/текста `audit_log`; роль приложения не имеет прямых `UPDATE`/`DELETE`; вызов возможен только из процедуры → тесты на БД (отказ прямого `DELETE`, успех процедуры)
      Paths: H · N [субъект не существует] · S [R-6: прямой `UPDATE audit_log` → отказ; `SECURITY DEFINER` с фиксированным `search_path`]

**CU DoD:** `typecheck` · `lint` · `test` (миграция на копии БД) · `deps:check`

### P06-CU3 — feat(deletion): add request lifecycle use-cases · Review: reviewer · Commit: auto

- [x] P06-T3 · T3 · Contract: [deletion_requests §5.1–§5.2, §8–§10](../contracts/deletion_requests_contract.md)
      Files: `apps/web/src/data/deletions/{create-request,create-child-request,take-request,cancel-request,reject-request}.ts`, `actions/deletions.ts`
      Acceptance: partial unique на открытый запрос на субъект; `due_on` серверный; причина отклонения обязательна; отмена только автором; журнал `deletion.*` → тесты по таблице отказов, гонка двух открытых
      Paths: H [§5.1–5.2] · N [§8: уже открыт, статус, нет причины] · S [AZ-06, AZ-07: teacher не создаёт запрос на ребёнка]

**CU DoD:** `typecheck` · `lint` · `test` (гонка) · smoke

### P06-CU4 — feat(deletion): add plan preview and user anonymization · Review: reviewer · Commit: auto

- [x] P06-T4 · T3 · Contract: [deletion_requests §5.3, §6.1](../contracts/deletion_requests_contract.md)
      Files: `data/deletions/{preview-plan,anonymize-user}.ts`
      Acceptance: план вычисляется по данным в транзакции; `anonymizeUser`: стереть `login_identity`, ФИО, email; `deleted_ordinal`; роли/назначения удалены; авторство сохранено; `privacy_consent`/`access_request` обезличены → тесты, проверка отображения «Удалённый пользователь №N»
      Paths: H · N [последний admin, назначен на группу — предупреждение] · S [INV-23: нет ФИО в журнале]
- [x] P06-T5 · T3 · Contract: [access_requests §5.9](../contracts/access_requests_and_roles_contract.md)
      Files: `data/access/merge-users.ts` (использует `anonymizeUser`)
      Acceptance: дубликат после `mergeUsers` обезличен единообразно; регрессия P01-тестов → тест
      Paths: H · N · S [AZ-04]

**CU DoD:** `typecheck` · `lint` · `test`

### P06-CU5 — feat(deletion): add child data erasure and request execution · Review: reviewer · Commit: auto

- [x] P06-T6 · T3 · Contract: [deletion_requests §5.4, §6.2, §10](../contracts/deletion_requests_contract.md) · Invariants: INV-22
      Files: `data/deletions/{erase-child-data,execute-deletion}.ts`
      Acceptance: одна транзакция: удалить карточку, зачисления, согласия, проверки, события оценок, кирпичики; в журнале значения стёрты, ссылка «ребёнок (данные удалены)»; `summary` без ФИО; слово подтверждения и подтверждение плана; повтор идемпотентен; откат при сбое → тесты, включая откат и гонку с проверкой ДЗ
      Paths: H [§5.4] · N [§8: слово, план, статус, последний admin, self-execute] · S [AZ-07, S-4…S-6 контракта]

**CU DoD:** `typecheck` · `lint` · `test` (откат, гонка, идемпотентность) · smoke на dev-БД

### P06-CU6 — feat(web): add audit log read use-cases and screen · Review: diff-only · Commit: auto

- [x] P06-T7 · T1 · Contract: [change_log §6](../contracts/change_log_contract.md) · Prototype: `audit`
      Files: `data/audit/{list-audit-log,get-entity-history}.ts`, `app/(app)/audit/page.tsx`, `components/admin/{AuditTable,AuditFilterBar,AuditEntryRow}.tsx`
      Acceptance: фильтры (период, актор, `entity_type`, `action`), курсорная пагинация, имена подставляются по ссылкам, «Удалённый пользователь №N»; teacher → 403 → ручной smoke, тест выборок
      Paths: H · N [пусто] · S [AZ-08: только admin; нет update/delete]
- [x] P06-T8 · T1 · Files: `components/admin/EntityHistoryList.tsx` в `/users/[userId]` и карточке ученика
      Acceptance: последние записи по сущности → ручной smoke
      Paths: H · N [нет записей] · S [AZ-08]

**CU DoD:** `typecheck` · `lint` · `test` · smoke 390 px

### P06-CU7 — feat(web): add deletions screen, profile block and pupil request action · Review: diff-only · Commit: auto

- [x] P06-T9 · T1 · Flow: [admin_flow §4.6](../../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md) · Prototype: `deletions`, `profile`
      Files: `app/(app)/deletions/page.tsx`, `components/admin/{DeletionRequestCard,DeletionPlanView,DeletionConfirmDialog}.tsx`, блок в `/profile`, действие в карточке ученика
      Acceptance: вкладки «Открытые / Выполненные / Отклонённые и отменённые»; срок с подсветкой просрочки; диалог выполнения со словом подтверждения и планом; блок профиля (создать/отменить) → ручной smoke H/N
      Paths: H [admin_flow §4.6] · N [UX-05; ошибки §8] · S [AZ-06, AZ-07]

**CU DoD:** `typecheck` · `lint` · `test` · smoke 390 px

### P06-CU8 — feat(analytics): add deleted-data note and update badge counters · Review: diff-only · Commit: auto

- [x] P06-T10 · T1 · Spec: [спец. §9.1 «Удалённые данные»](../../../my_specs/sunday_school_data_analytics_spec.md) · Matrix: AZ-07
      Files: `components/analytics/DeletedDataNote.tsx`, `data/analytics/*` (счётчик за период), `components/shell/nav-badge.tsx`
      Acceptance: пометка только admin, число детей скрыто при < 3; бейдж «Люди» = заявки + открытые запросы; «Заявки» — только заявки → тесты порога, ручной smoke
      Paths: H · N [< 3 детей] · S [admin only]

**CU DoD:** `typecheck` · `lint` · `test`

### P06-CU9 — feat(i18n): complete ru and en dictionaries · Review: diff-only · Commit: auto

- [ ] P06-T11 · T1 · ADR: [adr_008 §4.1, §4.4, §6](../../../prds/07_governance/adr_008_i18n_ru_en_dictionary_slices.md) · Rule: `ui-messages-and-copy`, `ui-messages-bundle-splitting`
      Files: `apps/web/src/lib/messages/{ru,en}/{common,auth,teacher,admin,analytics}.json`, `lib/messages/plural.ts`, lint-проверка запрета строк в JSX
      Acceptance: каждый namespace на двух языках с одинаковыми ключами (сборка падает при пропуске); формы множественного числа (`one/few/many/other`); даты и числа через `Intl` с поясом школы; клиентский бандл teacher не содержит ключей admin → тесты типа, анализ бандла
      Paths: H [adr_008 §7] · N [нет ключа → ошибка сборки; сбой загрузки → fallback `ru`] · S [смена языка только admin]
- [ ] P06-T12 · T0 · Files: словари `en`
      Acceptance: ручной просмотр ключевых экранов на `en` (вход, регистрация, проверка, кирпичики, журнал); запас длины +30 %
      Paths: n/a — copy

**CU DoD:** `typecheck` · `lint` · `test` · smoke `en`

### P06-CU10 — docs(docs): sync P06 docs · Review: diff-only · Commit: auto

- [ ] P06-T13 · T0 · Files: `docs/**` (deletion/change_log contracts, schema §9, ADR-008, ui_states)
      Acceptance: grep терминов; нет drift; закрытые Q записаны
      Paths: n/a — docs-only

## Verification (phase)

- [ ] Все CU закоммичены; trace `Review: …`
- [ ] Phase DoD из [`P06_phase_description.md`](../phases_tasks_descriptions/P06_phase_description.md)
- [ ] Docs sync — в CU10

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P06_phase_description.md`](../phases_tasks_descriptions/P06_phase_description.md) | DoD |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W11-12) |
