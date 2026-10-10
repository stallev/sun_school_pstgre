# ADR Index — template

**Статус:** TEMPLATE — после волны W1 (`documentation_creation_registry.md` → W1-01) скопировать в `adr_index.md`; заполнить как минимум ADR-001, ADR-002.

**Проект:** {{PROJECT_NAME}}  
**Owner:** Architecture

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)

Канон SoT: [`.cursor/rules/tiers/t0-always/project-context.template.mdc`](../../../.cursor/rules/tiers/t0-always/project-context.template.mdc) (после bootstrap: `project-context.mdc`).

---

## Purpose

Единый реестр Architecture Decision Records (ADR) для {{PROJECT_NAME}}. Агенты **MUST** проверять этот индекс перед принятием архитектурных решений.

---

## Scope / Out of scope

**In scope:** нумерация ADR, статус, краткое решение, ссылки на файлы, planned ADR из реестра документации.

**Out of scope:** детали реализации (contracts, specs), продуктовые требования (PRD `01_product_scope/`), пошаговые runbooks.

---

## ADR registry

| ID | File | Status | Topic | Summary |
|----|------|--------|-------|---------|
| ADR-001 | `adr_001_stack_and_runtime.md` | **PLANNED** — создать в волне W1 | Stack & hosting | Зафиксировать дефолтный стек методологии (см. [`ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md) §1.1): Vercel, Neon PostgreSQL + Prisma, Auth.js Credentials JWT, S3, Sentry; monorepo `apps/*` + `packages/*` |
| ADR-002 | [`adr_002_nextjs_vercel_runtime_policy.template.md`](./adr_002_nextjs_vercel_runtime_policy.template.md) | **TEMPLATE ready** — скопировать в `adr_002_nextjs_vercel_runtime_policy.md` | Next.js runtime | Pin Next.js 16.4.x; канон `proxy.ts`; `cacheComponents` + `partialPrefetching` (Instant Navigations); `catchError`; async Request APIs |
| ADR-003+ | `adr_{NNN}_*.md` | **PLANNED** — домен-специфичные, волна W4 | Domain decisions | Auth-модель, timezone/scheduling, MVP scope boundaries, jobs idempotency, file storage lifecycle — конкретные темы зависят от домена {{PROJECT_NAME}} |

### Pulse reference (иллюстрация диапазона, не канон)

| Pulse ADR | Что иллюстрирует |
|-----------|-------------------|
| [ADR-001](../../examples/pulse/docs/prds/07_governance/adr_001_stack_and_runtime.md) | Пример ADR-001 на том же дефолтном стеке методологии |
| [ADR-002](../../examples/pulse/docs/prds/07_governance/adr_002_next162_vercel_runtime_policy.md) | Пример заполненного ADR-002 (Next.js runtime policy) |
| ADR-003–009 | Доменные решения Pulse (auth roles, timezone, booking, email, file storage, complaints, i18n) — **не копировать**, только формат/процесс |

---

## Naming convention

- Файл: `adr_{NNN}_snake_case_topic.md` (трёхзначный номер, ведущие нули).
- Новый ADR: следующий свободный номер в этой таблице + запись в Change log ниже.
- Процесс: [`decision_process.md`](./decision_process.md).

---

## Context7 verification (runtime ADR)

Перед изменением ADR-002 или auth ADR агент **MUST** сверить актуальные API:

| Topic | Context7 library | Проверить для {{PROJECT_NAME}} |
|-------|------------------|-------------------|
| `proxy.ts` | `/vercel/next.js` | `middleware.ts` deprecated; export `proxy`; Node runtime only в proxy |
| Instant Navigations / Partial Prefetching / `catchError` | `/vercel/next.js` | `cacheComponents` + `partialPrefetching`; App Shell prefetch; `catchError` из `next/error` |
| Auth.js JWT + roles | `/websites/authjs_dev` | Credentials `authorize`; `jwt` / `session` callbacks для ролей проекта |

---

## Requirements

1. **MUST** — любое архитектурное решение, меняющее стек, границы пакетов, auth, jobs или кэш — оформляется ADR или правкой существующего ACCEPTED ADR.
2. **MUST** — новый ADR добавляется в эту таблицу в той же сессии, что и файл ADR.
3. **MUST NOT** — дублировать полный текст ADR в `AGENTS.md` или contracts; только ссылка.
4. **SHOULD** — при PROPOSED статусе указать владельца review и блокируемые фазы implementation.

---

## Acceptance criteria

- [ ] ADR-001 и ADR-002 существуют и имеют статус ACCEPTED
- [ ] Все последующие ADR перечислены со статусом и ссылкой на файл
- [ ] `decision_process.md` и `07_governance/README.md` ссылаются на этот индекс (если README создан)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`decision_process.md`](./decision_process.md) | How to create/update ADRs |
| [`adr_002_nextjs_vercel_runtime_policy.template.md`](./adr_002_nextjs_vercel_runtime_policy.template.md) | Boilerplate ADR-002 |
| [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) | Wave W1/W4 ADR plan |
| [`architecture_master_index.md`](../architecture_master_index.md) | Navigation hub (после создания) |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W1-01

---

## Agent notes

- Не создавать `middleware.ts` как канон — только `proxy.ts` (ADR-002, Context7 `/vercel/next.js`).
- Planned ADR **не** реализовать в коде до статуса ACCEPTED.
- Доменные ADR Pulse (auth roles, booking, timezone, i18n) — иллюстрация процесса, не источник решений для {{PROJECT_NAME}}.
