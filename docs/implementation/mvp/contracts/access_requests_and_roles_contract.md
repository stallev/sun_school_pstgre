# Access requests and roles contract

**Тип:** Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W8-03  
**Зависит от:** [`monorepo_boundaries_contract.md`](./monorepo_boundaries_contract.md), [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §5.1–§5.2, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) (AZ-01…AZ-05, AZ-P1…AZ-P4), [`adr_003_auth_oidc_jwt_rbac.md`](../../../prds/07_governance/adr_003_auth_oidc_jwt_rbac.md), [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) §5, [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §5.1–§5.2, [`sunday_school_data_analytics_spec.md`](../../../my_specs/sunday_school_data_analytics_spec.md) §2.4 (РГ-1…РГ-6)  
**Связанные документы:** [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) INV-04…INV-06, INV-25, [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md), [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** бизнес-правила — спецификация и lifecycle; механизм входа и callbacks — [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) (Auth.js, WebFetch 2026-10-11). Транзакции и `SELECT … FOR UPDATE` в Prisma v7 (`$queryRaw` внутри `$transaction`) — решение проекта, пересверка по prisma.io на P01. Context7 недоступен.

---

## 1. Purpose

Контракт операций регистрации, заявок на доступ, ролей, отключения и объединения пользователей. Читают: исполнитель P01 (auth, users), авторы `access_and_registration_spec` (W9-02), `reviewer` (T3).

## 2. Scope / Out of scope

**В scope:** use-case переходов `ACCOUNT_STATUS` и `ACCESS_REQUEST_STATUS`, роли, назначения при одобрении, правка ФИО, объединение дубликатов.  
**Вне scope:** сам вход и привязка способа входа ([`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) §5, §7); выполнение удаления ([`deletion_requests_contract.md`](./deletion_requests_contract.md)); роль `PARENT` и семьи (post-MVP).

## 3. Операции

| Операция | Актор | Переход | AZ |
|----------|-------|---------|----|
| `firstLogin` | система (callback входа) | `∅ → REGISTRATION` | — |
| `submitRegistration` | пользователь | `REGISTRATION → REQUEST_PENDING` | AZ-05 |
| `updateOwnName` | пользователь | — (ФИО) | AZ-05 |
| `resubmitRegistration` | пользователь | `REJECTED → REQUEST_PENDING` | AZ-05 |
| `approveRequest` | `ADMIN` | `REQUEST_PENDING → ACTIVE` | AZ-01 |
| `rejectRequest` | `ADMIN` | `REQUEST_PENDING → REJECTED` | AZ-01 |
| `changeRoles` | `ADMIN` | роли `ACTIVE` | AZ-03, AZ-P1 |
| `disableAccess` / `enableAccess` | `ADMIN` | `ACTIVE ↔ DISABLED` | AZ-03, AZ-P2 |
| `updateUserName` | `ADMIN` | — (ФИО) | AZ-03 |
| `mergeUsers` | `ADMIN` | дубликат → `DELETED` | AZ-04 |
| `purgeExpiredRegistration` | система (лениво) | `REGISTRATION → DELETED` | INV-25 |

## 4. Входы операций

| Операция | Поле | Тип · правило | Источник |
|----------|------|---------------|----------|
| `submitRegistration`, `resubmitRegistration` | `lastName`, `firstName` | текст 1–50, буквы / пробел / дефис / апостроф (РГ-3) | форма |
| | `middleName` | текст ≤ 50, необязательно | форма |
| | `consentAccepted` | bool, обязательно `true` (РГ-2) | форма |
| | `consentVersion` | = `app_setting.consent_text_version` | сервер |
| `updateOwnName` | `lastName`, `firstName`, `middleName` | как выше | форма |
| `approveRequest` | `requestId` | id заявки в `PENDING` | форма |
| | `roles` | непустое подмножество `{ADMIN, TEACHER}` | форма |
| | `gradeIds` | необязательно; если указаны — группы активного года; без групп `TEACHER` одобряется с предупреждением `NO_GROUPS` | форма |
| `rejectRequest` | `requestId`, `reason` | причина обязательна, ≤ 500 | форма |
| `changeRoles` | `userId`, `roles`, `gradeIds` | как при одобрении | форма |
| `disableAccess`, `enableAccess` | `userId` | пользователь `ACTIVE` / `DISABLED` | форма |
| `updateUserName` | `userId`, имена | как выше; `reason` необязательна | форма |
| `mergeUsers` | `keepUserId`, `mergeUserId` | разные пользователи, оба не `DELETED` | форма |

**Не принимается с клиента:** `status`, `consentVersion`, `userId` для операций «над собой», `actorId`, время.

## 5. Happy path

### 5.1 `firstLogin`

- **Предусловия:** вход провайдером подтверждён, `login_identity` не найдена ([`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) §5.1 п. 4).
- **Транзакция:** создать `app_user` (`REGISTRATION`, `first_login_at`) и `login_identity` (Telegram: `provider_account_id`). `firstLogin` выполняется только для Telegram.
- **Исключение — первый admin:** создаётся не входом, а командой `db:seed:admin` (seed_data_spec §4): `ACTIVE`, роль `ADMIN`, `login_identity` `CREDENTIALS` (email из `FIRST_ADMIN_EMAIL`, хэш пароля); **до начала работы он проходит экран согласия** (как РГ-5), после чего создаётся `privacy_consent` (решено 2026-10-11, Q-01); записи журнала `access.first_admin_created`, `auth.password_set` (решено 2026-10-16: Google не используется, ADR-003 v1.1).
- **Постусловия:** пользователь перенаправляется на `/register` (первый admin после входа по паролю — на экран согласия, затем `/school`).

### 5.2 `submitRegistration`

- **Предусловия:** статус `REGISTRATION`; ФИО валидно; `consentAccepted = true`.
- **Транзакция:** записать ФИО; создать `privacy_consent` (`PD_PROCESSING`, версия, момент); создать `access_request` (`PENDING`, `full_name_snapshot`); статус → `REQUEST_PENDING`.
- **Журнал:** `access.registration_submitted`.
- **Идемпотентность:** повтор при `REQUEST_PENDING` возвращает успех без новой заявки.

### 5.3 `resubmitRegistration`

- **Предусловия:** статус `REJECTED`; ограничений на число повторов нет (решение 2026-10-10).
- **Транзакция:** при необходимости обновить ФИО; новый `privacy_consent` только если версия текста изменилась; новая `access_request` (`PENDING`); статус → `REQUEST_PENDING`. Прежняя отклонённая заявка неизменна.
- **Журнал:** `access.registration_resubmitted`.

### 5.4 `approveRequest`

- **Предусловия:** заявка `PENDING`; `roles` непусто; роль `PARENT` недоступна (AZ-P3). Для `TEACHER` группы **не обязательны**: без групп заявка одобряется с предупреждением `NO_GROUPS` (решено 2026-10-11, как в [`admin_flow.md`](../../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md) §4.2); переданные `gradeIds` должны быть группами активного года.
- **Транзакция (порядок блокировок):** `access_request` → `app_user` пользователя заявки; записать `user_role`, `teacher_assignment` (UNIQUE `(user, grade, year)`); заявка → `APPROVED`, `decided_by`, `decided_at`; пользователь → `ACTIVE`.
- **Журнал:** `access.request_approved` (роли, группы — идентификаторы).

### 5.5 `rejectRequest`

- **Предусловия:** заявка `PENDING`; `reason` непуста.
- **Транзакция:** заявка → `REJECTED` с `reject_reason`; пользователь → `REJECTED`.
- **Журнал:** `access.request_rejected` (причина — в поле `reason`, без ФИО других людей, УД-10).

### 5.6 `changeRoles`

- **Предусловия:** пользователь `ACTIVE`; не `PARENT`; не снимает `ADMIN` у себя (AZ-P2) и у последнего admin (AZ-P1).
- **Транзакция:** блокировка строк `user_role` с ролью `ADMIN`; сравнить с целевым составом; добавить / удалить `user_role`; синхронизировать `teacher_assignment` активного года (добавить новые; снять назначения при снятии роли `TEACHER` — `ends` не требуется, строки года удаляются, уроки сохраняют ссылку на ведущего).
- **Журнал:** `access.roles_changed` (было → стало).
- **Постусловие:** новые права действуют при следующей серверной проверке (ADR-003 §4.3).

### 5.7 `disableAccess` / `enableAccess`

- **Предусловия:** `ACTIVE` → `DISABLED`: не себя при роли `ADMIN` (AZ-P2) и не последний `ADMIN` (AZ-P1); `DISABLED` → `ACTIVE`: —.
- **Транзакция:** сменить статус. Данные пользователя сохраняются.
- **Журнал:** `access.disabled` / `access.enabled`.

### 5.8 `updateUserName`, `updateOwnName`

- **Правила:** admin правит ФИО любого пользователя (AZ-03), пользователь — своё в статусах `REQUEST_PENDING`, `REJECTED`, `ACTIVE`. Заявка не меняется (РГ-4), `full_name_snapshot` остаётся на момент отправки.
- **Журнал:** `access.name_changed` (старое / новое значение — **ссылкой на поле**, не текстом ФИО: INV-23; значение хранится в самой записи пользователя).

### 5.9 `mergeUsers`

- **Предусловия:** `keepUserId ≠ mergeUserId`; оба не `DELETED`; объединяемый не `ADMIN`, если оставляемый не `ADMIN` (понижение прав запрещено без `changeRoles`).
- **Транзакция:** блокировка обоих пользователей в порядке возрастания id; перенести `login_identity`, `user_role` (объединение), `teacher_assignment` (UNIQUE-конфликты пропускаются), авторство (`lead_teacher_id`, `checked_by`, `issued_by`, `actor_user_id`) → `keepUserId`; дубликат → `DELETED` через обезличивание ([`deletion_requests_contract.md`](./deletion_requests_contract.md) §`anonymizeUser`).
- **Журнал:** `access.users_merged` (оба идентификатора). Операция не отменяется автоматически.

### 5.10 `purgeExpiredRegistration`

- **Условие:** `REGISTRATION`, с `first_login_at` > 30 дней, согласия нет (РГ-6, INV-25).
- **Вызывается:** при открытии admin экранов «Заявки» и «Пользователи» (по всем просроченным) и при входе того же пользователя ([`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §5.1).
- **Транзакция:** удалить `login_identity` и `app_user`; журнал `access.registration_purged` (`source = SYSTEM`).

## 6. Negative paths (business)

| Случай | Условие | Код | Ключ сообщения | Исход |
|--------|---------|-----|----------------|-------|
| Нет согласия | `consentAccepted ≠ true` | `VALIDATION` (`fields.consent`) | `auth.register.consent_required` | заявка не создана |
| ФИО невалидно | нарушены РГ-3 | `VALIDATION` (`fields.lastName`/`firstName`) | `auth.register.err_name` / `err_chars` | форма сохранена |
| Статус не подходит | `submitRegistration` не из `REGISTRATION` | `ACCESS_STATUS_INVALID` | `auth.errors.status_invalid` | без изменений |
| Уже есть заявка | у пользователя `PENDING` | `ACCESS_ALREADY_PENDING` | `auth.register.already_pending` | возвращается текущая |
| Заявка решена | `approve`/`reject` не `PENDING` | `ACCESS_REQUEST_DECIDED` | `admin.approvals.already_decided` | список обновляется |
| Роль недоступна | в `roles` есть `PARENT` | `ACCESS_ROLE_UNAVAILABLE` | `admin.approvals.parent_unavailable` | отказ с причиной «доступ родителей откроется позже» |
| Нет групп у `TEACHER` | `gradeIds` пусто | — (не отказ) | `admin.approvals.no_groups_warning` | одобрено; результат содержит `warnings: ["NO_GROUPS"]`, admin видит предупреждение и назначает группу позже в `/groups/[groupId]` |
| Группа не активного года | в `gradeIds` есть чужая/прошлая группа | `VALIDATION` (`fields.gradeIds`) | `admin.approvals.groups_invalid` | не одобрено |
| Нет причины | `rejectRequest` без `reason` | `VALIDATION` (`fields.reason`) | `common.errors.reason_required` | без изменений |
| Последний admin | снятие роли / отключение | `ACCESS_LAST_ADMIN` | `admin.users.last_admin` | без изменений |
| Себя | снять `ADMIN` / отключить себя | `ACCESS_SELF_FORBIDDEN` | `admin.users.self_forbidden` | без изменений |
| Объединение с собой | `keep = merge` | `VALIDATION` | `admin.users.merge_same` | без изменений |
| Пользователь удалён | операция над `DELETED` | `NOT_FOUND` | `common.errors.not_found` | — |
| Устаревшая версия | параллельное изменение | `CONFLICT` | `common.errors.conflict` | обновить и повторить |

## 7. Security paths

| Путь | Требование | AZ |
|------|------------|----|
| S-1 | Решения по заявкам, роли, отключение, объединение, правка чужого ФИО — только `ADMIN`; проверка по БД | AZ-01…AZ-04 |
| S-2 | `userId` «над собой» берётся из сессии, не из тела запроса | AZ-D5 |
| S-3 | Teacher вызывает `approveRequest` / `changeRoles` → `FORBIDDEN`; чужой пользователь не раскрывается | AZ-D3, AZ-D4 |
| S-4 | Пользователь не `ACTIVE` не может вызвать операции admin даже с устаревшим JWT | AZ-P4 |
| S-5 | Причины и ФИО не пишутся в URL и логи; в журнале — ссылки (INV-23) | — |
| S-6 | `FIRST_ADMIN_EMAIL` не раскрывается клиенту; создание первого admin — один раз под блокировкой | ADR-003 §4.4 |

## 8. Concurrency & idempotency

| Гонка | Защита | Исход |
|-------|--------|-------|
| Два admin решают одну заявку | блокировка строки `access_request` (`FOR UPDATE`), проверка статуса внутри | первый успех, второй `ACCESS_REQUEST_DECIDED` |
| Двойной первый вход / второй admin | `UNIQUE (provider, provider_account_id)`; проверка «нет admin» под блокировкой | один первый admin |
| Снятие `ADMIN` у двух последних одновременно | блокировка всех строк `user_role` с `ADMIN` (R-8) | не остаётся ноль admin |
| Двойной submit регистрации | проверка `PENDING`; кнопка заблокирована | одна заявка |
| `mergeUsers` параллельно с другой операцией над теми же | порядок блокировок по возрастанию id | один успех, второй `CONFLICT` |

## 9. Drift & consistency

| Риск | Guard |
|------|-------|
| `user_role` у пользователя не `ACTIVE` | CHECK/проверка в use-case; тест |
| `teacher_assignment` без роли `TEACHER` | синхронизация в `changeRoles`; тест |
| Поле статуса меняется мимо use-case | запрет прямого `UPDATE status` ([`monorepo_boundaries_contract.md`](./monorepo_boundaries_contract.md) §6) |
| Версия согласия в заявке ≠ текущая | сверка при `submitRegistration`; тест |
| Расхождение статусов `access_request` и `app_user` | тест переходов §5 lifecycle |

## 10. Policy & layer touchpoints

| Слой | Роль |
|------|------|
| `domain` | Zod-схемы входов, `canTransitionAccount`, `validatePersonName` |
| `policy-server` | `requireRole(ADMIN)`, владение «над собой» |
| DAL (`src/data/access/**`) | транзакции §5, запись журнала |
| `lib/auth` | `firstLogin`, ленивая очистка вызывается из callback (`auth_runtime_spec` §5.1 п. 7) |
| Запрещено | импорт DAL из `proxy.ts`; логика ролей в компонентах |

## 11. Acceptance criteria

- [ ] `submitRegistration` создаёт согласие, заявку и статус `REQUEST_PENDING` атомарно — исход: тест use-case.
- [x] `approveRequest` для `TEACHER` без групп успешен и возвращает `warnings: ["NO_GROUPS"]`; группа не активного года отклоняется (`VALIDATION`) — исход: тест (`approve-request.test.ts`, `access.integration.test.ts`).
- [x] Заявка с `PARENT` отклоняется — исход: тест (`approve-request.test.ts`).
- [ ] Параллельные решения по заявке дают один успех — исход: тест гонки.
- [ ] Нельзя снять `ADMIN` у последнего и у себя — исход: тест (AZ-P1, AZ-P2).
- [ ] Teacher не может вызвать операции admin — исход: тест policy.
- [ ] Каждая операция пишет запись журнала — исход: тест.
- [ ] `purgeExpiredRegistration` удаляет только просроченные `REGISTRATION` — исход: тест.

## 12. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| Q-01 | ✔ **Решено 2026-10-11.** Первый admin: показывать ли ему экран согласия при первом входе | Да, как РГ-5 (экран согласия до работы), запись `privacy_consent` создаётся | владелец | `access_and_registration_spec` |
| Q-02 | При снятии роли `TEACHER` назначения активного года удаляются или закрываются датой | Удаляются из активного года, прошлые годы не затрагиваются | architect | W8-04 |
| Q-03 | Можно ли объединять, когда у дубликата есть `ADMIN`, а у оставляемого нет | Нет, сначала `changeRoles` | architect | P01 |
| Q-04 | Нужен ли отдельный код `AUTH_STATUS_INVALID` вместо `ACCESS_STATUS_INVALID` | Один код `ACCESS_STATUS_INVALID` | architect | — |
| Q-05 | ✔ **Решено 2026-10-11.** Одобрение `TEACHER` без групп | Разрешено с предупреждением `NO_GROUPS`; код `ACCESS_GROUPS_REQUIRED` не используется | владелец | — |

## 13. Related documents

| Document | Relationship |
|----------|--------------|
| [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §5.1–§5.2 | Переходы |
| [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) | Права |
| [`change_log_contract.md`](./change_log_contract.md) | Action-коды журнала |
| [`deletion_requests_contract.md`](./deletion_requests_contract.md) | `anonymizeUser` |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W8-03

## 14. Agent notes

- Не менять `status` напрямую, только через use-case этого контракта.
- Не принимать роль, статус и `userId` «над собой» с клиента.
- Не выдавать `PARENT` и не создавать семейные записи.
- Не писать ФИО в журнал текстом — ссылки (INV-23).
- Не запускать фоновую очистку; только ленивая (INV-25).

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W8-03) |
