# Monorepo boundaries contract

**Тип:** Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W8-01  
**Зависит от:** [`adr_001_stack_and_runtime.md`](../../../prds/07_governance/adr_001_stack_and_runtime.md) §3.2, [`adr_002_nextjs_vercel_runtime_policy.md`](../../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md) §3–§5, [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) PKG-01…PKG-03, [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §4, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) §4, [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) §3, §10  
**Связанные документы:** [`AGENTS.md`](../../../../AGENTS.md), [`ai_typescript_monorepo_guidelines.md`](../../../guidelines/typescript/ai_typescript_monorepo_guidelines.md), [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** ADR-001 / ADR-002 (пины и политика `proxy.ts`); границы пакетов — решение проекта, не API библиотек. Проверка границ реализована на P5 (2026-10-11) встроенным правилом ESLint `no-restricted-imports` по группам файлов в `eslint.config.mjs` — без дополнительного плагина (решение: меньше зависимостей, правила читаются как таблица §4); негативный тест — импорт `next` и `@sunschool/db` из `packages/domain` даёт ошибку. Context7 недоступен.

---

## 1. Purpose

Единый канон: **какой код где живёт, что кому разрешено импортировать, как выглядит результат мутации и откуда берутся коды отказов**. Контракты W8-03…W8-09 ссылаются сюда и не повторяют правила. Читают: исполнитель P5 (scaffold), авторы контрактов, `reviewer`.

## 2. Scope / Out of scope

**В scope:** пакеты, слои, направления импорта, форма use-case, форма результата, реестр кодов.  
**Вне scope:** содержимое сущностей ([`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md)), права по действиям ([`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md)), конфигурация инструментов (P5).

## 3. Пакеты

| Пакет | Назначение | Содержит | Не содержит |
|-------|------------|----------|-------------|
| `@sunschool/domain` | Чистые бизнес-правила | enum-ы, константы (`USER_ROLE`, `ACCOUNT_STATUS`, `MUTATION_ERROR_CODES`), Zod-схемы входов, функции правил (`computeLate`, `computePoints`, `buildVerseText`), типы `MutationResult`, порты | Next, React, Prisma, `process.env`, I/O, `Date.now()` без аргумента |
| `@sunschool/policy-edge` | Проверки по JWT для `proxy.ts` | `canVisitRoutePrefix(session, path)`, перенаправления по статусу | БД, Prisma, `auth.ts` |
| `@sunschool/policy-server` | Проверки по БД | `PolicySessionContext`, принадлежность ресурса, `requireOwnedGroup(...)` | Next-типы (`Session` из `next-auth`), UI |
| `@sunschool/db` | Prisma schema, миграции, клиент с адаптером, seed | `schema.prisma`, `prisma.config.ts`, `seed/**`, фабрика клиента | бизнес-правила, импорт из `apps/web` |
| `apps/web` | Тонкий BFF и UI | `app/**`, `components/**`, `actions/**`, `data/**` (DAL), `lib/**`, `auth.ts`, `proxy.ts`, словари `messages/**` | сложные правила (живут в `domain`) |

## 4. Направление зависимостей

```
apps/web ──► policy-server ──► db ──► domain
   │               │
   │               └────────► domain
   ├──► policy-edge ───────► domain
   ├──► db ────────────────► domain
   └──► domain
```

| Откуда | Что разрешено | Что запрещено |
|--------|---------------|---------------|
| `domain` | только `zod`, стандартная библиотека | любой другой пакет проекта, Next, Prisma |
| `policy-edge` | `domain` | `db`, `policy-server`, `next-auth`-типы |
| `policy-server` | `domain`, `db` | `apps/web`, `next/*`, `next-auth` |
| `db` | `domain` (для enum-ов) | `policy-*`, `apps/web` |
| `apps/web` | все пакеты | импорт из `packages/*/src/**` (только публичный `index`) |
| `proxy.ts` | `policy-edge`, `auth.config.ts` | `auth.ts`, `policy-server`, `db`, Prisma ([`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) §3, PKG-02) |

Циклы между пакетами запрещены. Публичная поверхность пакета — `index.ts`; глубокие импорты запрещены.

## 5. Слои в `apps/web`

| Слой | Путь | Ответственность | Может вызывать |
|------|------|-----------------|----------------|
| Страница / компонент | `src/app/**`, `src/components/**` | рендер, состояния ([`ui_states_contract.md`](../../../design/ui_states_contract.md)) | DAL (чтение), actions (мутации) |
| Action (Server Action) | `src/actions/**` | тонкий адаптер: разобрать вход, вызвать use-case, вернуть `MutationResult` | DAL, `lib/auth/require-user` |
| DAL | `src/data/**` | запросы и транзакции Prisma, вызов правил `domain`, запись журнала | `db`, `domain`, `policy-server` |
| Auth | `src/lib/auth/**`, `src/auth*.ts` | callbacks, сессия, `requireActiveUser` | `db`, `policy-server` |
| Сообщения | `src/lib/messages` | ключи словарей (ADR-008) | — |

Правило: **бизнес-решение** (можно ли, сколько баллов, какой статус) принимает `domain` или DAL по правилам `domain`; action и компонент решений не принимают.

## 6. Use-case

Каждая мутация — именованный use-case ([`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §4 п. 1). Структура (порядок обязателен):

| Шаг | Что | Где |
|-----|-----|-----|
| 1 | `requireActiveUser()` / `requireRole()` — контекст по БД | action |
| 2 | Разбор и валидация входа схемой `domain` | action |
| 3 | Проверка принадлежности ресурса | `policy-server` |
| 4 | Транзакция: чтение с блокировкой при необходимости → правила `domain` → запись | DAL |
| 5 | Запись `audit_log` **в той же транзакции** | DAL |
| 6 | Инвалидация кэша (`updateTag`/`revalidateTag`, ADR-002 §5) | action, после commit |
| 7 | Результат `MutationResult` | action |

Побочные эффекты вне транзакции (email, фоновые задачи) в MVP отсутствуют (INV-25). Прямой `UPDATE status` вне use-case запрещён.

## 7. Результат мутации

Форма — канон [`ai_typescript_monorepo_guidelines.md`](../../../guidelines/typescript/ai_typescript_monorepo_guidelines.md) §3:

| Исход | Структура | Правила |
|-------|-----------|---------|
| Успех | `{ ok: true }` либо `{ ok: true, data }` | `data` — DTO без лишних полей (нет внутренних id, ПД чужих) |
| Отказ | `{ ok: false, code, message? }` | `code` — значение `MUTATION_ERROR_CODES`; `message` — **ключ** словаря, не текст; stack и детали не возвращаются |
| Поля | при `VALIDATION` — `fields: { <имя>: <ключ> }` | имена полей совпадают с именами формы ([`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md) F3) |

Исключения (`throw`) допустимы только для неожиданных сбоев (БД недоступна): их ловит `error.tsx`. Ожидаемый отказ — всегда `{ ok: false }`.

## 8. Реестр кодов отказов

Источник кода — `packages/domain/src/constants/mutation-error-codes.ts`. Новый код **сначала** добавляется туда, затем используется (`domain-literals-and-codes`). Именование: `UPPER_SNAKE`; модульные коды — с префиксом модуля. Таблицы «случай → код» каждого контракта — первоисточник до появления файла; сводка в [`change_log_contract.md`](./change_log_contract.md) не заменяет это.

### 8.1 Общие коды

| Код | Когда | HTTP-аналог | Ключ сообщения |
|-----|-------|-------------|----------------|
| `UNAUTHORIZED` | нет сессии / сессия недействительна | 401 | `common.errors.unauthorized` |
| `FORBIDDEN` | статус или роль не допускают действие | 403 | `common.errors.forbidden` |
| `NOT_FOUND` | ресурса нет **или** он чужой (AZ-D4) | 404 | `common.errors.not_found` |
| `VALIDATION` | вход нарушает схему или правило поля | 422 | ключи полей (`fields`) |
| `CONFLICT` | состояние изменилось, дубликат, устаревшая версия | 409 | `common.errors.conflict` |
| `RATE_LIMITED` | зарезервирован; в MVP не используется | 429 | — |
| `INTERNAL` | неожиданный сбой, обёрнутый в результат | 500 | `common.errors.internal` |

### 8.2 Модульные префиксы

| Префикс | Контракт |
|---------|----------|
| `ACCESS_` | [`access_requests_and_roles_contract.md`](./access_requests_and_roles_contract.md) |
| `SCHOOL_` | [`school_year_and_groups_contract.md`](./school_year_and_groups_contract.md) |
| `CHECK_` | [`homework_check_contract.md`](./homework_check_contract.md) |
| `BRICKS_` | [`bricks_ledger_contract.md`](./bricks_ledger_contract.md) |
| `DELETION_` | [`deletion_requests_contract.md`](./deletion_requests_contract.md) |
| `BIBLE_` | [`bible_seed_contract.md`](./bible_seed_contract.md) |
| `AUTH_` | [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) (`AUTH_LINK_CONFLICT`, `AUTH_LAST_IDENTITY`) |

## 9. Транзакции и конкуренция (общие правила)

| ID | Правило |
|----|---------|
| TX-1 | Use-case — одна транзакция Prisma; побочные записи (журнал) внутри |
| TX-2 | Инварианты, зависящие от нескольких строк (последний admin, остаток кирпичиков, активное зачисление), проверяются **внутри** транзакции с блокировкой (`SELECT … FOR UPDATE`) или уникальным индексом |
| TX-3 | Оптимистичная блокировка записи — по `updated_at`/версии, передаётся клиентом; несовпадение → `CONFLICT` |
| TX-4 | Повторный вызов того же use-case идемпотентен там, где это указано в контракте (возвращает текущее состояние, дубликат не создаёт) |
| TX-5 | Порядок блокировок фиксирован в контракте операции, чтобы исключить взаимные блокировки |
| TX-6 | `DIRECT_URL` (непулированный) — только миграции и seed; приложение работает через pooled `DATABASE_URL` |

## 10. Happy path

| Операция | Результат |
|----------|-----------|
| Teacher сохраняет проверку | action → `requireActiveUser` → схема → policy → DAL-транзакция (правила `domain`, запись, журнал) → `updateTag` → `{ ok: true }` |
| Добавлена новая мутация | сначала правка контракта и реестра кодов, затем код; `domain` не импортирует внешнее |

## 11. Negative paths

| Случай | Условие | Код | Исход |
|--------|---------|-----|-------|
| Импорт нарушает границу | `domain` импортирует Prisma | — (сборка) | ESLint падает, CI красный |
| Мутация без журнала | use-case меняет данные без записи `audit_log` | — | Review: blocker; тест use-case |
| Выброшено исключение вместо результата | ожидаемый отказ реализован `throw` | — | Review: blocker |
| Неизвестный код | `code` не из реестра | — | Ошибка типов `MutationErrorCode` |

## 12. Security paths

| Путь | Требование |
|------|------------|
| S-1 | Любой action вызывает `requireActiveUser()` до работы с данными ([`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) §10; AZ-D5) |
| S-2 | `policy-server` не импортируется в `proxy.ts` и в клиентские компоненты |
| S-3 | `domain` не читает `process.env`; конфигурация передаётся аргументами |
| S-4 | `message` и `fields` не содержат ПД и значений форм |
| S-5 | Server Action не принимает `userId`, `role`, `status` с клиента как доказательство прав |

## 13. Concurrency & idempotency

См. §9 (TX-1…TX-6). Конкретные гонки — в контрактах модулей (по строкам R-1…R-9 схемы и INV-05, INV-07, INV-18).

## 14. Drift & consistency

| Риск | Guard |
|------|-------|
| Код ошибки добавлен inline | `lint` (правило запрета строковых литералов кодов) + `domain-literals-and-codes` |
| Контракт расходится со схемой | правка схемы и контракта в одном CU (`product-docs-alignment`) |
| Логика ушла в компонент | review по §5; DRY (`ai-dry-deduplication`) |
| Контракт ссылается на несуществующий код | `docs:links` и review; реестр §8 |

## 15. Policy & layer touchpoints

Этот документ **задаёт** границы; touchpoints контрактов модулей описывают, какие слои затрагивает конкретная операция. Любое нарушение §4 — blocker в review (`reviewer`, T3 для sensitive zones: `packages/policy/**`, `packages/db/**`).

## 16. Acceptance criteria

- [ ] `domain` не импортирует `next`, `react`, `@prisma/*` — исход: `npm run lint` (boundaries).
- [ ] `proxy.ts` не импортирует `policy-server` и `@sunschool/db` — исход: `npm run lint`.
- [ ] Все мутации возвращают `MutationResult`, ожидаемые отказы — без `throw` — исход: review и тесты use-case.
- [ ] Все `code` — из `MUTATION_ERROR_CODES` — исход: проверка типов.
- [ ] Каждый use-case пишет журнал в своей транзакции — исход: тест use-case (контракты W8-03…W8-08).
- [ ] Циклов между пакетами нет — исход: проверка графа в CI.

## 17. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| Q-01 | Конкретный инструмент проверки границ (ESLint-плагин / `dependency-cruiser`) | Выбрать на P5 по документации версии; контракт фиксирует правила, не инструмент | architect | P5 |
| Q-02 | Нужен ли общий `RATE_LIMITED` в MVP | Нет; код зарезервирован | architect | — |
| Q-03 | `fields` в `MutationResult` — расширение канона guideline (`ok:false, code, message?`) | Принять; обновить guideline в P4 | architect | P4 |

## 18. Related documents

| Document | Relationship |
|----------|--------------|
| [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) | Use-case и переходы |
| [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) | Инварианты |
| [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) | Права |
| [`change_log_contract.md`](./change_log_contract.md) | Журнал и action-коды |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W8-01

## 19. Agent notes

- Не импортировать `policy-server` и `db` в `proxy.ts` и в клиентские компоненты.
- Не принимать решений в action и компонентах: правила — `domain`, транзакции — DAL.
- Не `throw` для ожидаемых отказов; возвращать `{ ok: false, code }`.
- Не создавать коды ошибок на месте использования.
- Не обходить журнал: каждая мутация данных пишет `audit_log` в той же транзакции.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W8-01) |
