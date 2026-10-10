# Documentation Creation Registry — Pulse

**Проект:** Pulse — Fitness Trainer Marketplace  
**Версия реестра:** 1.1  
**Дата:** 2026-05-23  
**Статус:** Канонический план создания документации  
**Аудитория:** AI-агенты (Cursor, Claude, GPT) и команда разработки

**Связанные документы:**

- Методология: [`ai_first_project_methodology.md`](./ai_first_project_methodology.md)
- Карта архитектуры: [`architecture_master_index.md`](../prds/architecture_master_index.md)
- Точка входа monorepo: [`AGENTS.md`](../../AGENTS.md)
- Референс lampto: [`lampto_project_reference.md`](../reference/lampto_project_reference.md)
- Прототип (визуальный эталон): [`Fitness_Platform_Prototype_v1.html`](../prototypes/Fitness_Platform_Prototype_v1.html)
- Interim PRD (источник миграции): [`default_docs/`](../default_docs/)

> **Правило для агентов:** этот файл — **единственный источник порядка** создания документов.  
> Создавайте файлы **строго по волнам и номерам** внутри волны. Не перескакивайте вперёд без явного запроса пользователя.

---

## 1. Назначение

Реестр фиксирует:

1. **Полный перечень** документов PRD, ADR, contracts, specs, guides, wireframes и UX/UI-регламентов.
2. **Последовательность создания** — каждый файл опирается на предыдущие.
3. **Обратные ссылки** — по мере появления новых документов в уже созданные добавляются ссылки «→ см. также».
4. **Инструкции для AI-агентов** — как писать, верифицировать и не дублировать источники истины.

**Уже существуют (не создавать заново, только дополнять ссылками):**

| Файл | Статус |
|------|--------|
| `docs/meta/ai_first_project_methodology.md` | Канон |
| `docs/reference/lampto_project_reference.md` | Канон |
| `docs/prds/architecture_master_index.md` | Канон |
| `docs/prds/07_governance/adr_001_stack_and_runtime.md` | ACCEPTED |
| `docs/prds/07_governance/adr_002_next162_vercel_runtime_policy.md` | ACCEPTED |
| `docs/prds/03_data_model/database_schema_v1.md` | Канон |
| `docs/prds/01_product_scope/user_flows/users_mvp/*.md` | Канон |
| `docs/design/canonical_routes.md` | Канон |
| `docs/architecture_learning_pack/01_architecture_overview.md` | Канон |
| `docs/default_docs/*` | Interim archive — только читать при миграции |
| `docs/guidelines/**` | Канон реализации — ссылаться, не дублировать |

---

## 2. Обязательные требования при создании документации

### 2.1 Иерархия источников истины

При конфликте — порядок приоритета (не нарушать):

1. **Cursor Rules** (`.cursor/rules/*.mdc`)
2. **`AGENTS.md`** (+ `apps/web/AGENTS.md` для web-кода)
3. **Contracts** (`docs/implementation/mvp/contracts/`)
4. **PRD** (`docs/prds/`)
5. **Interim** (`docs/default_docs/`) — только до завершения миграции
6. **Guidelines** (`docs/guidelines/`)
7. **ADR** (`docs/prds/07_governance/`)
8. **Wireframes / prototype** — визуальный эталон, subordinate to canonical routes

### 2.2 Формат каждого нового файла (обязательный front matter)

Каждый создаваемый документ **начинается** с блока метаданных:

```markdown
# {Title}

**Тип:** PRD | ADR | Contract | Spec | Guide | Wireframe | UX Contract  
**Статус:** Draft | Canonical | ACCEPTED | DEPRECATED  
**Версия:** 1.0  
**Дата:** YYYY-MM-DD  
**Волна:** W{N}  
**Зависит от:** [список путей]  
**Связанные документы:** [список путей — обновлять по мере создания]

---
```

### 2.3 Структура тела документа (минимум для AI-readability)

#### 2.3.1 Базовые секции (все типы)

| Секция | Обязательность | Содержание |
|--------|----------------|------------|
| **Purpose** | ✅ | 2–4 предложения: зачем файл, кто читает |
| **Scope / Out of scope** | ✅ | Что покрывает и что явно не покрывает |
| **Definitions** | при domain/auth | Термины, enum-ы из `@pulse/domain` |
| **Requirements / Rules** | ✅ | Нумерованный список MUST/SHOULD/MAY |
| **Flows / Diagrams** | при spec/contract | Mermaid или ASCII sequence |
| **Acceptance criteria** | ✅ | Чеклист верификации для агента |
| **Related documents** | ✅ | Таблица ссылок + «planned» placeholders |
| **Agent notes** | ✅ | Антипаттерны, частые ошибки агентов |

#### 2.3.2 Секции покрытия путей (happy / negative / security / races / drift)

Документ **не считается complete**, если для его типа обязательна секция ниже, а она отсутствует или содержит только happy path.

| Секция | Содержание | Когда писать детально | Когда достаточно ссылки |
|--------|------------|------------------------|-------------------------|
| **Happy paths** | Основной успешный сценарий: актор → шаги → исход | User flows, specs, contracts | Wireframes (кратко) |
| **Negative paths** | Бизнес-отказы, validation errors, empty states, timeouts, недоступность ресурса | Specs, contracts, `ui_states_contract` | User flows (таблица + ссылка на spec/contract) |
| **Security paths** | 401/403, IDOR, role escalation, tampering, unauthorized mutation | `authorization_matrix`, auth/policy contracts, security-sensitive specs | PRD scope — только risk register |
| **Concurrency & races** | Два актора / двойной submit / cron overlap; expected resolution (unique constraint, idempotency, transaction) | Domain contracts, `lifecycle_models`, `failure_modes_catalog` | Specs — ссылка на contract |
| **Drift risks & guards** | Расхождение docs↔code, schema↔domain, cache↔DB, timezone; как обнаружить и предотвратить | `domain_invariants`, phase DoD, ops runbooks, cache policy | Guidelines — не дублировать |

**Правило каноничности:** детали race/security описываются **один раз** в contract или `failure_modes_catalog.md`; остальные файлы **ссылаются** (FM-xxx), не копируют.

#### 2.3.3 Матрица обязательности секций по типу документа

| Тип | Happy | Negative | Security | Races | Drift |
|-----|:-----:|:--------:|:--------:|:-----:|:-----:|
| User flow | ✅ | ✅ кратко | ссылка | ссылка | — |
| PRD scope / pages spec | ✅ | ✅ | high-level | ссылка | ✅ |
| `lifecycle_models` | ✅ | ✅ invalid transitions | — | ✅ | — |
| `failure_modes_catalog` | — | ✅ | ✅ | ✅ **канон-индекс** | ✅ |
| `authorization_matrix` | — | — | ✅ **канон** | — | — |
| **Contract** | ✅ | ✅ | ✅ if applicable | ✅ | ✅ |
| **Spec** | ✅ | ✅ | ✅ if applicable | ссылка | — |
| Wireframe | ✅ | перечислить states | forbidden state | — | — |
| ADR | decision path | rejected alternatives | ✅ if auth/security | ✅ if jobs/data | — |
| Phase + tasks | smoke happy | smoke negative | smoke 403 | 1 race check | doc sync in DoD |
| UX contract | ✅ | ✅ | a11y/forbidden UI | optimistic rollback | — |

#### 2.3.4 Шаблон тела — Contract (обязательные секции)

Каждый файл в `docs/implementation/mvp/contracts/` **MUST** включать секции в этом порядке:

```markdown
## Happy path
<!-- Актор, preconditions, sequence, postconditions, side effects -->

## Negative paths (business)
<!-- Validation failures, illegal state, resource unavailable; expected error shape / UX -->

## Security paths
<!-- Unauthorized role, IDOR, bypass attempts; MUST deny behavior. «N/A» — только если обосновано -->

## Concurrency & idempotency
<!-- Races, double-submit, cron overlap; UNIQUE keys, transactions, idempotency_key -->

## Drift & consistency notes
<!-- Schema vs domain, cache invalidation, timezone; guards for agents -->

## Policy & layer touchpoints
<!-- proxy.ts vs policy/server vs domain; forbidden imports -->

## Acceptance criteria
<!-- Включая минимум 1 negative и 1 security check, если applicable -->
```

Записи в [`failure_modes_catalog.md`](../prds/02_domain_model/failure_modes_catalog.md) для cross-cutting сценариев: **ID `FM-xxx`**, в contract — ссылка «implements FM-xxx».

#### 2.3.5 Шаблон тела — Spec (обязательные секции)

Каждый файл в `docs/implementation/mvp/specs/` **MUST** включать:

```markdown
## Happy path
<!-- Пошаговый UX + Server Action / Route Handler touchpoints -->

## Negative paths (UX)
<!-- Empty, loading, error, retry, Zero Dead Ends CTA; toast.error on mutation failure -->

## Security paths
<!-- Required role/session; 401/403 UX; «N/A» — только если экран public read-only -->

## Concurrency notes
<!-- Ссылка на contract + поведение UI (disabled, aria-busy, optimistic rollback) -->

## UI states matrix
<!-- empty | loading | error | forbidden — per async region -->

## Wireframe & prototype
<!-- Link to wireframes/mvp/*.md and prototype section -->

## Acceptance criteria
<!-- Smoke: happy + минимум 1 negative UX + security, если applicable -->
```

**Запрещено:** описывать детали race resolution в spec, если они уже в contract — только UX-поведение при исходе race.

### 2.4 Правила написания для AI-агентов

1. **Один канон — один файл.** Не дублировать маршруты вне [`canonical_routes.md`](../design/canonical_routes.md).
2. **MUST / SHOULD / MAY** — использовать RFC 2119 для однозначности.
3. **Короткие абзацы**, таблицы для матриц (role × resource, state × transition).
4. **Явные cross-links** — относительные пути Markdown: `[text](../path/file.md)`.
5. **Не копировать lampto продуктовые правила** — только архитектурные паттерны; домен Pulse из `default_docs/` и user flows.
6. **Interim → canonical:** при миграции сохранять смысл; в новом файле указать `Migrated from: docs/default_docs/...`.
7. **Post-MVP:** nullable поля Stripe/Daily.co — не описывать как MVP scope.
8. **Язык:** русский для продуктового текста; идентификаторы кода, enum, пути — на английском.
9. **Размер:** PRD/contract ≤ ~400 строк; wireframe ≤ ~150 строк; при превышении — split по поддомену.
10. **Версионирование:** при material change — bump версии в front matter + строка в Change log.

### 2.5 Обратные ссылки (backlinks) — обязательный процесс

После создания файла **W{N}-XX** агент **в той же сессии**:

1. Открывает все файлы из колонки **«Обновить backlinks»** для этой строки.
2. Добавляет в секцию **Related documents** (или создаёт её) строку:  
   `| {новый файл} | {краткое назначение} |`
3. Если в раннем файле был placeholder `*(planned)*` — заменить на рабочую ссылку.
4. Обновить [`architecture_master_index.md`](../prds/architecture_master_index.md) — статус Planned → Canonical.
5. **Не** редактировать `docs/default_docs/` (archive) без явной задачи миграции обратно.

### 2.6 Верификация после каждого файла

- [ ] Front matter заполнен
- [ ] Все зависимости из колонки «Зависит от» процитированы или соблюдены
- [ ] Секции из §2.3.3 для данного типа документа присутствуют (или явное «N/A» с обоснованием)
- [ ] Contract/spec: шаблон §2.3.4 / §2.3.5 соблюдён
- [ ] Cross-cutting failure/race: запись в `failure_modes_catalog.md` или ссылка `FM-xxx`
- [ ] Backlinks добавлены в ранние файлы
- [ ] Нет второго списка маршрутов (только ссылка на `canonical_routes.md`)
- [ ] Acceptance criteria включают negative/security checks, если applicable
- [ ] `architecture_master_index.md` обновлён при добавлении canonical PRD

### 2.7 Context7 — когда обращаться

Перед написанием runtime/auth/data документов агент **обязан** сверить актуальные API через Context7:

| Тема | Library | Что проверить |
|------|---------|---------------|
| Next.js 16 | `/vercel/next.js` | `proxy.ts`, async `cookies`/`headers`/`params`, Instant Navigations |
| Auth.js v5 | `/websites/authjs_dev` | Credentials, JWT, role in token |
| Prisma + Neon | `/websites/prisma_io` | `DATABASE_URL`, `DIRECT_URL`, migrate deploy |

---

## 3. Workflow агента (пошагово)

```
READ registry → READ dependencies → DRAFT file → ADD backlinks → UPDATE master index → VERIFY checklist → NEXT file
```

**Одна сессия агента = одна волна или 1–3 файла внутри волны** (не смешивать unrelated волны).

**Запрещено:**

- Создавать implementation code одновременно с PRD (если пользователь явно не просит)
- Изобретать маршруты/статусы не из schema и user flows
- Писать `middleware.ts` как канон (только `proxy.ts` — ADR-002)

---

## 4. UX/UI документы (дополнительный блок)

Документы регламентируют UX/UI на основе:

- HTML-прототип [`Fitness_Platform_Prototype_v1.html`](../prototypes/Fitness_Platform_Prototype_v1.html)
- Interim design system [`fitness-platform-design-system.md`](../default_docs/fitness-platform-design-system.md)
- UX-прinciples из [`fitness-platform-pages.md`](../default_docs/fitness-platform-pages.md) § UX-прinciples
- Cursor Rules: `ui-warm-forest-shadcn`, `ui-mobile-first`, `ui-prototype-fidelity`, `ui-semantics-a11y`, `ui-toast-mutations`, `ui-mutation-pending`, `ui-optimistic-mutations`
- Guidelines: [`typography_text_guidelines.md`](../guidelines/typography_text_guidelines.md), [`ai_semantics_a11y_guidelines.md`](../guidelines/react/ai_semantics_a11y_guidelines.md)

| ID | Файл | Назначение |
|----|------|------------|
| UX-01 | `docs/design/ux_ui_principles.md` | Канон UX-прinciples: Progressive Disclosure, Zero Dead Ends, Thumb Zone, One Primary Action |
| UX-02 | `docs/design/responsive_navigation_contract.md` | Bottom nav / sidebar, breakpoints md/lg, route groups |
| UX-03 | `docs/design/visual_identity_contract.md` | Warm Forest tokens, typography atoms, shadcn mapping |
| UX-04 | `docs/design/interaction_design_contract.md` | Toast, optimistic UI, pending/busy, confirm dialogs |
| UX-05 | `docs/design/ui_states_contract.md` | Empty / loading / error / forbidden — first-class для каждого типа экрана |
| UX-06 | `docs/design/forms_and_validation_ux.md` | Field errors, labels, focus, submit pending |
| UX-07 | `docs/design/accessibility_requirements.md` | WCAG 2.1 AA checklist, touch targets 44px, reduced motion |
| UX-08 | `docs/design/prototype_route_mapping.md` | Секция прототипа → canonical route → wireframe file |
| UX-09 | `docs/design/styleguide.md` | Миграция design system в canonical (компоненты, elevation, spacing) |
| UX-10 | `docs/design/content_and_microcopy_contract.md` | Тон, `@/lib/messages`, toast copy rules |

**Guidelines не дублировать** — UX contracts ссылаются на `docs/guidelines/` как enforcement layer для кода.

---

## 5. Полный реестр документов по волнам

Легенда колонок:

- **ID** — порядковый номер внутри волны
- **Зависит от** — прочитать **до** написания
- **Обновить backlinks** — дополнить ссылками **после** создания

---

### Волна W0 — Meta (этот файл)

| ID | Файл | Статус |
|----|------|--------|
| W0-01 | `docs/meta/documentation_creation_registry.md` | ✅ Этот файл |

**Обновить backlinks после W0:** [`ai_first_project_methodology.md`](./ai_first_project_methodology.md) §3 — добавить ссылку на реестр.

---

### Волна W1 — Governance + Product canon

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W1-01 | `docs/prds/07_governance/adr_index.md` | ADR-001, ADR-002, registry | `07_governance/README.md`, `architecture_master_index.md` |
| W1-02 | `docs/prds/07_governance/decision_process.md` | adr_index | adr_index, methodology |
| W1-03 | `docs/prds/01_product_scope/mvp_scope.md` | `default_docs/fitness-platform-mvp.md`, user flows, ADR-001 | architecture_master_index, methodology checklist |
| W1-04 | `docs/prds/01_product_scope/post_mvp_deferrals.md` | mvp_scope, database_schema_v1 | mvp_scope |
| W1-05 | `docs/prds/01_product_scope/pages_functional_spec.md` | mvp_scope, canonical_routes, `default_docs/fitness-platform-pages.md` | architecture_master_index, canonical_routes |
| W1-06 | `docs/prds/01_product_scope/email_notifications_matrix.md` | mvp_scope | Post-MVP email spec; schema-ready on MVP *(→ email contract W8)* |

---

### Волна W2 — UX/UI foundation (до wireframes)

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W2-01 | UX-01 `docs/design/ux_ui_principles.md` | pages_functional_spec, prototype HTML | pages_functional_spec, design/README |
| W2-02 | UX-02 `docs/design/responsive_navigation_contract.md` | ux_ui_principles, canonical_routes, prototype | ux_ui_principles, canonical_routes |
| W2-03 | UX-03 `docs/design/visual_identity_contract.md` | ux_ui_principles, design-system interim, typography guidelines | ux_ui_principles, guidelines/README |
| W2-04 | UX-07 `docs/design/accessibility_requirements.md` | ux_ui_principles, ai_semantics_a11y guidelines | ux_ui_principles |
| W2-05 | UX-08 `docs/design/prototype_route_mapping.md` | canonical_routes, prototype HTML | canonical_routes, ux_ui_principles |

---

### Волна W3 — Domain model

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W3-01 | `docs/prds/02_domain_model/README.md` | mvp_scope | architecture_master_index |
| W3-02 | `docs/prds/02_domain_model/lifecycle_models.md` | mvp_scope, database_schema_v1, user flows | database_schema_v1, architecture_master_index |
| W3-03 | `docs/prds/02_domain_model/failure_modes_catalog.md` | lifecycle_models, user flows | lifecycle_models, architecture_master_index, AGENTS.md |
| W3-04 | `docs/prds/02_domain_model/domain_invariants.md` | lifecycle_models, failure_modes_catalog, ADR-001 | AGENTS.md *(ссылка в Related)*, lifecycle_models, failure_modes_catalog |
| W3-05 | `docs/prds/02_domain_model/use_cases_index.md` | lifecycle_models, failure_modes_catalog, mvp_scope | lifecycle_models, failure_modes_catalog |

**`failure_modes_catalog.md`** — канонический индекс сценариев `FM-xxx`:

| Колонка | Содержание |
|---------|------------|
| `FM-ID` | `FM-001`, `FM-002`, … |
| `Type` | race \| security \| negative UX \| drift |
| `Trigger` | Что инициирует сценарий |
| `Expected behavior` | Системный ответ (deny, idempotent skip, rollback, …) |
| `Owner doc` | Contract или spec, где детали |
| `Status` | documented \| implemented \| tested |

Создавать **после** `lifecycle_models.md` (W3-02), **до** contracts W8. При добавлении contract/spec — дополнять каталог и ставить backlink `implements FM-xxx`.

---

### Волна W4 — ADR domain/runtime (детализация)

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W4-01 | `docs/prds/07_governance/adr_003_auth_credentials_jwt_rbac.md` | ADR-001, domain_invariants | adr_index, auth guideline |
| W4-02 | `docs/prds/07_governance/adr_004_timezone_scheduling_model.md` | domain_invariants, lifecycle_models | adr_index, database_schema_v1 |
| W4-03 | `docs/prds/07_governance/adr_005_mvp_booking_without_payment.md` | lifecycle_models, mvp_scope | adr_index, mvp_scope |
| W4-04 | `docs/prds/07_governance/adr_006_idempotent_email_delivery.md` | email_notifications_matrix, domain_invariants | adr_index, ADR-001 |
| W4-05 | `docs/prds/07_governance/adr_007_file_asset_blob_lifecycle.md` | ADR-001, blob-upload guideline | adr_index |

---

### Волна W5 — Authorization + Runtime PRD

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W5-01 | `docs/prds/04_authorization_privacy/README.md` | adr_003 | architecture_master_index |
| W5-02 | `docs/prds/04_authorization_privacy/authorization_matrix.md` | user flows, canonical_routes, adr_003 | canonical_routes, pages_functional_spec |
| W5-03 | `docs/prds/04_authorization_privacy/policy_enforcement_contract.md` | authorization_matrix, ADR-002 | adr_003 |
| W5-04 | `docs/prds/04_authorization_privacy/privacy_data_handling.md` | authorization_matrix, database_schema_v1 | authorization_matrix |
| W5-05 | `docs/prds/05_runtime/README.md` | ADR-001, ADR-002 | architecture_master_index |
| W5-06 | `docs/prds/05_runtime/backend_requirements.md` | ADR-001, adr_006 | architecture_learning_pack/01 |
| W5-07 | `docs/prds/05_runtime/monorepo_packages.md` | ADR-001, lampto reference | AGENTS.md |
| W5-08 | `docs/prds/05_runtime/auth_runtime_spec.md` | adr_003, authorization_matrix, ADR-002 | auth guideline |
| W5-09 | `docs/prds/05_runtime/cache_revalidation_policy.md` | ADR-002, ai_loading_patterns | nextjs guidelines |

---

### Волна W6 — Data model supplements

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W6-01 | `docs/prds/03_data_model/data_access_patterns.md` | database_schema_v1, lifecycle_models | database_schema_v1 |
| W6-02 | `docs/prds/03_data_model/indexing_strategy.md` | data_access_patterns | database_schema_v1 |
| W6-03 | `docs/prds/03_data_model/seed_data_spec.md` | database_schema_v1, pages_functional_spec | pages_functional_spec |

---

### Волна W7 — UX interaction + styleguide

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W7-01 | UX-04 `docs/design/interaction_design_contract.md` | ux_ui_principles, ui-toast/mutation rules | ux_ui_principles, guidelines/react |
| W7-02 | UX-05 `docs/design/ui_states_contract.md` | ux_ui_principles, ai_loading_patterns | pages_functional_spec, ux_ui_principles |
| W7-03 | UX-06 `docs/design/forms_and_validation_ux.md` | ui_states_contract, ai_form_handling_pattern | interaction_design_contract |
| W7-04 | UX-10 `docs/design/content_and_microcopy_contract.md` | copy_and_messages guideline | interaction_design_contract |
| W7-05 | UX-09 `docs/design/styleguide.md` | visual_identity_contract, design-system interim | visual_identity_contract, design/README |

---

### Волна W8 — Core contracts (P01–P03 foundation)

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W8-01 | `docs/implementation/mvp/contracts/monorepo_boundaries_contract.md` | monorepo_packages | AGENTS.md, methodology §2.6 |
| W8-02 | `docs/implementation/mvp/contracts/authorization_policy_contract.md` | policy_enforcement_contract, auth_runtime_spec | adr_003, policy rule |
| W8-03 | `docs/implementation/mvp/contracts/schedule_slots_contract.md` | adr_004, lifecycle_models, data_access_patterns | lifecycle_models |
| W8-04 | `docs/implementation/mvp/contracts/booking_lifecycle_contract.md` | lifecycle_models, adr_005, schedule_slots | lifecycle_models, domain_invariants |
| W8-05 | `docs/implementation/mvp/contracts/wishlist_contract.md` | authorization_matrix, interaction_design | authorization_matrix |
| W8-06 | `docs/implementation/mvp/contracts/trainer_verification_contract.md` | lifecycle_models, authorization_matrix | lifecycle_models |
| W8-07 | `docs/implementation/mvp/contracts/file_upload_contract.md` | adr_007, authorization_matrix | blob-upload guideline |
| W8-08 | `docs/implementation/mvp/contracts/review_moderation_contract.md` | lifecycle_models, authorization_matrix | lifecycle_models |
| W8-09 | `docs/implementation/mvp/contracts/email_notifications_contract.md` | email_notifications_matrix, adr_006 | email_notifications_matrix |

---

### Волна W9 — Implementation specs

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W9-01 | `docs/implementation/mvp/specs/global_shell_spec.md` | responsive_navigation_contract, visual_identity | ux_ui_principles |
| W9-02 | `docs/implementation/mvp/specs/password_reset_spec.md` | auth_runtime_spec, email_notifications_contract | auth_runtime_spec |
| W9-03 | `docs/implementation/mvp/specs/catalog_discovery_spec.md` | pages_functional_spec, wishlist_contract | pages_functional_spec |
| W9-04 | `docs/implementation/mvp/specs/trainer_onboarding_spec.md` | trainer_verification_contract, forms_and_validation_ux | trainer_flow, pages_functional_spec |
| W9-05 | `docs/implementation/mvp/specs/booking_wizard_spec.md` | booking_lifecycle_contract, schedule_slots, ui_states | client_flow, pages_functional_spec |
| W9-06 | `docs/implementation/mvp/specs/trainer_schedule_spec.md` | schedule_slots_contract, adr_004 | trainer_flow |
| W9-07 | `docs/implementation/mvp/specs/admin_verification_spec.md` | trainer_verification_contract, ui_states | admin_flow |
| W9-08 | `docs/implementation/mvp/specs/complaint_refund_spec.md` | lifecycle_models, authorization_matrix | admin_flow |
| W9-09 | `docs/implementation/mvp/specs/admin_people_ops_spec.md` | admin_verification_spec, trainer_verification_contract | admin_flow, canonical_routes |

---

### Волна W15 — Design System Lab

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W15-01 | `docs/implementation/mvp/specs/design_system_lab_spec.md` | visual_identity_contract, styleguide, example_components | P01_tasks, canonical_routes, implementation/mvp/README |

---

### Волна W10 — Wireframes MVP

**Предусловие:** W2, W7, W9-01, prototype_route_mapping.

| ID | Файл | Route | Зависит от |
|----|------|-------|------------|
| W10-00 | `docs/design/wireframes/_page_template.md` | — | ui_states_contract, styleguide |
| W10-01 | `docs/design/wireframes/route_index.md` | index | canonical_routes, prototype_route_mapping |
| W10-02 | `.../mvp/public_landing.md` | `/` | pages_functional_spec, prototype mapping; **v2 W22** → standalone landing prototype |
| W10-03 | `.../mvp/public_trainers_catalog.md` | `/trainers` | catalog_discovery_spec |
| W10-04 | `.../mvp/public_trainer_profile.md` | `/trainers/[id]` | pages_functional_spec |
| W10-05 | `.../mvp/auth_login.md` | `/auth/login` | auth_runtime_spec |
| W10-06 | `.../mvp/auth_register_client.md` | `/auth/register` | auth_runtime_spec |
| W10-07 | `.../mvp/auth_register_trainer.md` | `/auth/register/trainer` | trainer_onboarding_spec |
| W10-08 | `.../mvp/booking_wizard.md` | `/book/[trainerId]` | booking_wizard_spec |
| W10-09 | `.../mvp/booking_confirm.md` | `/book/[trainerId]/confirm` | booking_wizard_spec |
| W10-10 | `.../mvp/session_placeholder.md` | `/sessions/[sessionId]` | mvp_scope post_mvp |
| W10-11 | `.../mvp/client_dashboard.md` | `/client/dashboard` | client_flow |
| W10-12 | `.../mvp/client_bookings_list.md` | `/client/bookings` | client_flow |
| W10-13 | `.../mvp/client_booking_detail.md` | `/client/bookings/[id]` | booking_lifecycle_contract |
| W10-14 | `.../mvp/client_review_form.md` | `/client/reviews/[bookingId]` | review_moderation_contract |
| W10-15 | `.../mvp/client_profile.md` | `/client/profile` | pages_functional_spec |
| W10-16 | `.../mvp/trainer_dashboard.md` | `/trainer/dashboard` | trainer_flow |
| W10-17 | `.../mvp/trainer_profile_edit.md` | `/trainer/profile` | trainer_onboarding_spec |
| W10-18 | `.../mvp/trainer_services.md` | `/trainer/services` | trainer_flow |
| W10-19 | `.../mvp/trainer_schedule.md` | `/trainer/schedule` | trainer_schedule_spec |
| W10-20 | `.../mvp/trainer_clients_list.md` | `/trainer/clients` | trainer_flow |
| W10-21 | `.../mvp/trainer_client_detail.md` | `/trainer/clients/[id]` | privacy_data_handling |
| W10-22 | `.../mvp/trainer_income.md` | `/trainer/income` | mvp_scope |
| W10-23 | `.../mvp/admin_dashboard.md` | `/admin/dashboard` | admin_flow |
| W10-24 | `.../mvp/admin_trainers_queue.md` | `/admin/trainers` | admin_verification_spec |
| W10-25 | `.../mvp/admin_trainer_application.md` | `/admin/trainers/[id]` | admin_verification_spec |
| W10-26 | `.../mvp/admin_complaints_list.md` | `/admin/complaints` | complaint_refund_spec |
| W10-27 | `.../mvp/admin_complaint_detail.md` | `/admin/complaints/[id]` | complaint_refund_spec |
| W10-28 | `.../mvp/admin_refunds.md` | `/admin/refunds` | complaint_refund_spec |
| W10-29 | `.../mvp/admin_reviews_moderation.md` | `/admin/reviews` | review_moderation_contract |
| W10-30 | `.../mvp/admin_trainer_approved_detail.md` | `/admin/trainers/[id]` (approved) | admin_people_ops_spec |
| W10-31 | `.../mvp/admin_clients_registry.md` | `/admin/clients` | admin_people_ops_spec |
| W10-32 | `.../mvp/admin_client_detail.md` | `/admin/clients/[id]` | admin_people_ops_spec |

**Обновить backlinks после W10:** `canonical_routes.md` § Wireframe index, `design/README.md`, `prototype_route_mapping.md`.

---

### Волна W11 — Phase descriptions + tasks

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W11-01 | `docs/implementation/mvp/phases_tasks_descriptions/P01_phase_description.md` | W8 contracts (01–02), monorepo_packages, global_shell_spec | methodology §2.5 |
| W11-02 | `docs/implementation/mvp/tasks/P01_tasks.md` | P01_phase_description | — |
| W11-03 | `P02_phase_description.md` | P01, catalog_discovery_spec, wireframes public/* | methodology |
| W11-04 | `P02_tasks.md` | P02_phase | — |
| W11-05 | `P03_phase_description.md` | booking_*, client wireframes | methodology |
| W11-06 | `P03_tasks.md` | P03_phase | — |
| W11-07 | `P04_phase_description.md` | trainer specs/contracts | methodology |
| W11-08 | `P04_tasks.md` | P04_phase | — |
| W11-09 | `P05_phase_description.md` | admin specs | methodology |
| W11-10 | `P05_tasks.md` | P05_phase | — |
| W11-11 | `P06_phase_description.md` | email_notifications_contract, adr_006 | methodology |
| W11-12 | `P06_tasks.md` | P06_phase | — |
| W11-13 | `P07_phase_description.md` | accessibility_requirements, ui_states | methodology |
| W11-14 | `P07_tasks.md` | P07_phase | — |

*(W11 superseded by W16 — см. миграцию [`_migration_P01-P07_to_P01-P15.md`](../implementation/mvp/phases_tasks_descriptions/_migration_P01-P07_to_P01-P15.md))*

---

### Волна W16 — Phase restructure P01–P15 + UI matrix

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W16-01 | `_phase_template.md` | W11 phase docs | methodology §2.5 |
| W16-02 | `_migration_P01-P07_to_P01-P15.md` | W11 | AGENTS, README |
| W16-03 | `ui_component_phase_matrix.md` | design_system_lab_spec | phase docs, specs |
| W16-04 … W16-18 | `P01`…`P15_phase_description.md` | W11 split + new phases | methodology, mvp_scope |
| W16-19 … W16-33 | `P01`…`P15_tasks.md` | matching phase docs | — |
| W16-34 | Specs UI Catalog sections | ui_component_phase_matrix | global_shell, catalog, booking, onboarding, schedule, admin, complaint |
| W16-35 | Cross-ref sync | W16 phases | AGENTS, architecture_master_index, guides, observability |

*(Полные пути: `docs/implementation/mvp/`)*

---

### Волна W22 — Phase renumbering + P16 Landing v2

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W22-01 | `_migration_P15-P20_renumbering.md` | W16, W17 | AGENTS, README, methodology |
| W22-02 | `P21_phase_description.md`, `P21_tasks.md` | was P15 | cron guide, deferrals, email contract |
| W22-03 | `P19_phase_description.md`, `P19_tasks.md` | was P20 → P17 → P19 (W23) | ADR-008, complaint_refund_spec |
| W22-04 | `P16_phase_description.md`, `P16_tasks.md` | standalone landing prototype | route_index, wireframe |
| W22-05 | `specs/public_landing_spec.md` | pages_functional_spec, global_shell | catalog_discovery, design_system_lab |
| W22-06 | `wireframes/mvp/public_landing.md` v2 | public_landing_spec | prototype_route_mapping |
| W22-07 | `ui_component_phase_matrix.md` v2 | P16/P17/P18/P19/P21 rows | phase docs |
| W22-08 | Cross-ref sync | W22 | architecture_master_index, admin_flow, admin_people_ops P18, AGENTS, pulse-project-context |

*(Полные пути: `docs/implementation/mvp/` + design wireframes)*

---

### Волна W23 — Complaint phase P17 → P19

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W23-01 | `_migration_P17_to_P19.md` | W22 | AGENTS, README, methodology |
| W23-02 | `P19_phase_description.md`, `P19_tasks.md` | was P17 | ADR-008, complaint_refund_spec, matrix |
| W23-03 | Cross-ref sync | W23 | architecture_master_index, admin_flow, pulse-project-context, adr_index |

*(Полные пути: `docs/implementation/mvp/`)*

---

### Волна W24 — P17 UI Internationalization (EN/RU)

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W24-01 | `adr_009_ui_locale_strategy.md` | ADR-002, database_schema §1.2 | adr_index |
| W24-02 | `contracts/i18n_runtime_spec.md` | ADR-009 | canonical_routes, copy_and_messages |
| W24-03 | `P17_phase_description.md`, `P17_tasks.md` | P14, ADR-009, i18n contract | matrix, AGENTS |
| W24-04 | `wireframes/mvp/client_profile.md` v2 | i18n contract | route_index |
| W24-05 | Cross-ref sync | W24 | architecture_master_index, pulse-project-context, guidelines copy, matrix P17 row |

*(Полные пути: `docs/implementation/mvp/` + `docs/prds/07_governance/` + design wireframes)*

---

### Волна W25 — P22 Instant Navigations adoption (Next.js 16.3)

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W25-01 | `specs/instant_navigations_adoption_spec.md` | ADR-002 §5.1–§5.2, ai_loading_patterns, cache_revalidation_policy | architecture_master_index, mvp README |
| W25-02 | `P22_phase_description.md`, `P22_tasks.md` | P14, ADR-002, instant_navigations_adoption_spec | matrix, AGENTS, pulse-project-context |
| W25-03 | Cross-ref sync | W25 | architecture_master_index, mvp README, ui_component_phase_matrix P22 row |

*(Полные пути: `docs/implementation/mvp/`)*

---

### Волна W12 — Operations + guides

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W12-01 | `docs/prds/06_operations/README.md` | backend_requirements | architecture_master_index |
| W12-02 | `docs/prds/06_operations/migration_runbook.md` | database_schema_v1, ADR-001, Context7 Prisma | database_schema_v1 |
| W12-03 | `docs/prds/06_operations/observability_plan.md` | backend_requirements | backend_requirements |
| W12-04 | `docs/prds/06_operations/cron_jobs_registry.md` | email_notifications_contract, P21 | adr_006 |
| W12-05 | `docs/implementation/mvp/guides/local_dev_setup.md` | migration_runbook, seed_data_spec | implementation/mvp/README |
| W12-06 | `guides/vercel_deploy_guide.md` | ADR-001, auth_runtime_spec | ADR-001 |
| W12-07 | `guides/neon_prisma_migrations_guide.md` | migration_runbook | migration_runbook |
| W12-08 | `guides/seed_and_fixtures_guide.md` | seed_data_spec | seed_data_spec |
| W12-09 | `guides/cron_jobs_setup_guide.md` | cron_jobs_registry, P21 | cron_jobs_registry |

---

### Волна W13 — Architecture Learning Pack

| ID | File | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W13-01 | `docs/architecture_learning_pack/02_booking_lifecycle_layers.md` | booking_lifecycle_contract, data_access_patterns | 01_architecture_overview |
| W13-02 | `03_trainer_verification_layers.md` | trainer_verification_contract | 01_architecture_overview |
| W13-03 | `04_email_jobs_layers.md` | email_notifications_contract, cron_jobs_registry | 01_architecture_overview |

---

### Волна W14 — Final index sync (обязательный проход)

| ID | Действие |
|----|----------|
| W14-01 | Обновить [`architecture_master_index.md`](../prds/architecture_master_index.md) — все Planned → Canonical |
| W14-02 | Обновить [`docs/prds/README.md`](../prds/README.md) — статусы слоёв |
| W14-03 | Обновить [`docs/design/README.md`](../design/README.md) — UX + wireframes |
| W14-04 | Обновить [`ai_first_project_methodology.md`](./ai_first_project_methodology.md) § checklist — отметить выполненное |
| W14-05 | Обновить [`AGENTS.md`](../../AGENTS.md) — добавить ссылку на этот реестр в § Документация |
| W14-06 | Обновить [`implementation/mvp/README.md`](../implementation/mvp/README.md) — список contracts/specs/guides |

---

## 6. Инструкции агенту по типам документов

### 6.1 PRD

- Выводить **user-visible behavior**, не implementation details.
- Каждое требование трассируется к user flow или page spec.
- Post-MVP — отдельная секция «Deferred», не смешивать с MVP MUST.

### 6.2 ADR

- Формат: Context → Decision → Consequences → Alternatives rejected.
- Статус: PROPOSED → ACCEPTED (после review) или сразу ACCEPTED для MVP lock-in.
- Нумерация: `adr_{NNN}_snake_case_topic.md`; регистр в `adr_index.md`.

### 6.3 Contract

- Следовать **шаблону §2.3.4** (Happy / Negative / Security / Concurrency / Drift).
- Язык **между модулями**: inputs, outputs, errors, idempotency, policy touchpoints.
- Sequence diagram для cross-package flows.
- Explicit: что запрещено (например, policy/server в `proxy.ts`).
- Каждый race/security сценарий: запись `FM-xxx` в [`failure_modes_catalog.md`](../prds/02_domain_model/failure_modes_catalog.md) или ссылка на существующую.

### 6.4 Spec

- Следовать **шаблону §2.3.5** (Happy / Negative UX / Security / Concurrency notes / UI states matrix).
- Пошаговый UX + API/Action touchpoints + states (empty/loading/error/**forbidden**).
- Ссылка на wireframe file для каждого экрана.
- Primary CTA один на экран — из UX-01.
- Детали race resolution — только в contract; в spec — UX при исходе (toast.error, rollback, retry CTA).

### 6.5 Wireframe

- Markdown: regions, components, responsive deltas (mobile / md / lg).
- Не дублировать hex-цвета — ссылка на `visual_identity_contract.md`.
- States: перечислить empty/loading/error для async blocks.

### 6.6 UX Contract

- Принцип → правило → пример из прототипа → anti-pattern.
- Таблица «Cursor Rule / Guideline enforcement».
- Checklist для review агента перед merge UI-кода.

### 6.7 Phase + Tasks

- Phase: goal, in-scope paths, out-of-scope, contracts to read, definition of done.
- Tasks: checkbox list, verifiable (`npm run typecheck`, smoke route).

---

## 7. Шаблон секции Related documents (копировать в каждый файл)

```markdown
## Related documents

| Document | Relationship |
|----------|--------------|
| [`../path/doc.md`](../path/doc.md) | Dependency / Extends / Enforced by |
| *(planned)* [`../path/future.md`](../path/future.md) | Will define … — **replace when W{N}-XX created** |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W{N}-XX
```

---

## 8. Сводная статистика

| Категория | Новых файлов |
|-----------|--------------|
| PRD (01–06) | 25 |
| ADR (003–007) + governance index | 7 |
| UX/UI contracts + styleguide | 10 |
| Implementation contracts | 9 |
| Implementation specs | 8 |
| Wireframes + template + index | 30 |
| Phases + tasks | 30 (W16) + 14 (W11 superseded) |
| Operations + guides | 9 |
| Architecture learning pack | 3 |
| Meta sync (W14 — правки существующих) | 6 файлов |
| **Итого новых markdown файлов** | **~115** |

---

## 9. Быстрый старт для агента

**Следующий шаг:** **P01 implementation** (monorepo & data layer) — [`P01_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P01_phase_description.md) + [`P01_tasks.md`](../implementation/mvp/tasks/P01_tasks.md).

**Документация MVP-complete (W0–W25).** Core MVP: P01–P14 (W16). **Post-P14:** **P16** (Public Landing v2), **P17** (UI i18n EN/RU), **P19** (Complaint Resolution v2), **P18** (Admin People Ops spec), **P21** (Email, post-MVP), **P22** (Instant Navigations adoption / Next.js 16.3).

**После W25** имплементация post-P14: **P17 i18n complete**, P16 landing replace, P19 complaints (in progress), **P22 Instant Navigations** (docs ready — implement per tasks), P18 people ops, P21 email after deferral unlock.

---

## Change log

| Date | Change |
|------|--------|
| 2026-08-11 | **W25 complete** — P22 Instant Navigations adoption: `instant_navigations_adoption_spec`, P22 phase/tasks, matrix + cross-ref sync (Next.js 16.3 App Shell / Suspense / catchError) |
| 2026-05-25 | **P17 implementation complete** — cookie-first EN/RU i18n in `apps/web`; `getMessages`/`useMessages`; formatters; LocaleSwitcher; auth `user.locale` persist |
| 2026-05-25 | **W24 complete** — P17 UI i18n (EN/RU): ADR-009, i18n_runtime_spec, P17 phase/tasks, client_profile wireframe v2, matrix + cross-ref sync |
| 2026-05-25 | **W23 complete** — Complaint Resolution v2 P17→P19; P17 slot reallocated W24; `_migration_P17_to_P19.md`; matrix + cross-ref sync |
| 2026-05-25 | **W22 complete** — P16 landing v2 (`public_landing_spec`, phase/tasks, wireframe v2); renumber P15→P21, P20→P17; Admin People Ops P16→P18; `_migration_P15-P20_renumbering.md`; matrix + cross-ref sync |
| 2026-05-25 | **W18-01** — `admin_people_ops_spec.md` (P18 People Ops); wireframes W10-30…32; canonical routes `/admin/clients*` |
| 2026-05-25 | **W17-01** — ADR-008, complaint_refund_spec v2, P19 phase/tasks (was P20 → P17 → P19) |
| 2026-05-23 | **W16 complete** — P01–P15 phase restructure (30 phase/task files), `_phase_template.md`, `_migration_P01-P07_to_P01-P15.md`, `ui_component_phase_matrix.md`, UI Catalog sections in specs, cross-ref sync |
| 2026-05-23 | **W15-01** — `design_system_lab_spec.md` (shared UI primitives + Design Lab page) |
| 2026-05-23 | **W14 complete** — final index sync: `architecture_master_index`, `prds/README`, `design/README`, methodology checklist, `AGENTS.md`, `implementation/mvp/README` |
| 2026-05-23 | W13 complete — architecture learning pack: booking, trainer verification, email jobs layer walkthroughs |
| 2026-05-23 | W12 complete — 06_operations (README, migration_runbook, observability_plan, cron_jobs_registry) + 5 implementation guides |
| 2026-05-23 | W11 complete — P01–P07 phase descriptions + task checklists (14 files) |
| 2026-05-23 | W10 complete — wireframe template, route_index, 28 MVP screen wireframes (public, auth, booking, client, trainer, admin) |
| 2026-05-23 | W9 complete — 8 implementation specs (shell, password reset post-MVP, catalog, onboarding, booking wizard, schedule, admin verification, complaints/refunds) |
| 2026-05-23 | W8 complete — 9 core contracts (monorepo, auth policy, schedule, booking, wishlist, trainer verification, file upload, review, email) |
| 2026-05-23 | W7 complete — interaction_design, ui_states, forms_and_validation_ux, content_and_microcopy, styleguide |
| 2026-05-23 | W6 complete — 03_data_model supplements (data_access_patterns, indexing_strategy, seed_data_spec) |
| 2026-05-23 | W5 complete — 04_authorization_privacy (README, matrix, policy contract, privacy) + 05_runtime (README, backend, monorepo, auth spec, cache) |
| 2026-05-23 | W4 complete — ADR-003 auth, ADR-004 timezone, ADR-005 booking, ADR-006 email, ADR-007 blob |
| 2026-05-23 | W3 complete — 02_domain_model README, lifecycle_models, failure_modes_catalog, domain_invariants, use_cases_index |
| 2026-05-23 | W2 complete — ux_ui_principles, responsive_navigation_contract, visual_identity_contract, accessibility_requirements, prototype_route_mapping |
| 2026-05-23 | W1 complete — adr_index, decision_process, mvp_scope, post_mvp_deferrals, pages_functional_spec, email_notifications_matrix |
| 2026-05-23 | v1.1 — §2.3 path coverage (happy/negative/security/races/drift), contract/spec templates, `failure_modes_catalog` in W3 |
| 2026-05-23 | v1.0 — full wave plan, UX/UI block, agent requirements |
