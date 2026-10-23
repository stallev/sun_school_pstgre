# Documentation Creation Registry — Sunday School

**Проект:** Sunday School — приложение воскресной школы: учителя и администратор ведут группы, уроки, проверку ДЗ, кирпичики и аналитику (замена действующего приложения)  
**Версия реестра:** 1.2 (canonical, профиль lean) — DoR-ready: §2.3.2a пути H/N/S, §2.3.6 checklist, commit units в phase tasks  
**Статус:** Canonical — адаптирован под Sunday School в P2 (2026-10-10); ожидает утверждения владельцем (gate G2). Полный образец волн W0–W14 (Pulse): `docs/examples/pulse/docs/meta/documentation_creation_registry.md`  
**Аудитория:** AI-агенты (Cursor, Claude, GPT)

**Связанные документы:**

- Методология: [`ai_first_project_methodology.md`](./ai_first_project_methodology.md)
- Карта архитектуры: [`architecture_master_index.md`](../prds/architecture_master_index.md)
- Точка входа monorepo: [`AGENTS.md`](../../AGENTS.md)
- Референс Pulse reference: [`pulse_project_reference.md`](../reference/pulse_project_reference.md)
- Прототип (визуальный эталон): [`sunday_school_prototype.html`](../prototypes/sunday_school_prototype.html)
- Interim brief и спецификации владельца (источник миграции): [`my_specs/`](../my_specs/)

> **Правило для агентов:** этот файл — **единственный источник порядка** создания документов.  
> Создавайте файлы **строго по волнам и номерам** внутри волны. Не перескакивайте вперёд без явного запроса пользователя.

---

## 1. Назначение

Реестр фиксирует:

1. **Полный перечень** документов PRD, ADR, contracts, specs, guides, wireframes и UX/UI-регламентов.
2. **Последовательность создания** — каждый файл опирается на предыдущие.
3. **Обратные ссылки** — по мере появления новых документов в уже созданные добавляются ссылки «→ см. также».
4. **Инструкции для AI-агентов** — как писать, верифицировать и не дублировать источники истины.

**Поставляются шаблоном или создаются до P2 (не создавать заново, только дополнять ссылками):**

| Файл | Статус |
|------|--------|
| `docs/meta/ai_first_project_methodology.md` | Канон (адаптирована в P2) |
| `docs/meta/project_quality_profile.md` | Канон — создаёт P00; уровень определяет набор волн (§5.0) |
| `docs/reference/pulse_project_reference.md` | Канон |
| `docs/my_specs/*` | Interim brief, спецификации, данные Библии — только читать при миграции (`default_docs/` в проекте не используется) |
| `docs/guidelines/**` | Канон реализации — ссылаться, не дублировать |
| `docs/claude-code-cursor-rules-sync.md` | Канон механизма Cursor `.mdc` → Claude `.md` (`npm run rules:sync`) — **не пересоздавать в P2** |

Фундаментальные документы, которые в Pulse существовали до реестра (ADR-001/002, `architecture_master_index`, user flows, `canonical_routes`, `database_schema_v1`, `01_architecture_overview`), в новом проекте создаются волнами — строки `W1-F*` и `W13-00`.

---

## 2. Обязательные требования при создании документации

### 2.1 Иерархия источников истины

Базовый порядок — канон: [`.cursor/rules/project-context.mdc`](../../.cursor/rules/project-context.mdc) § Source-of-truth order. Не дублировать список здесь.

Уточнения для документации (в рамках соответствующих уровней канона):
- **`AGENTS.md`** — включая `apps/web/AGENTS.md` для web-кода
- **Interim** (`docs/my_specs/`) — только до завершения миграции, на уровне PRD
- **ADR** (`docs/prds/07_governance/`) — на уровне PRD
- **Wireframes / prototype** — визуальный эталон, subordinate to canonical routes, на уровне HTML prototype канона

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
**Проверено по:** next@16.4.x, next-auth@5.x — Context7, YYYY-MM-DD

---
```

**`Проверено по`** — **MUST** для runtime/auth/data документов (темы §2.7): библиотека, пин версии, источник, дата сверки. Остальные типы — опускать. Пин в документе не совпадает с `package.json` → документ устарел для DoR ([§2.3.6](#236-implementation-ready-dor-ready-checklist)).

### 2.3 Структура тела документа (минимум для AI-readability)

#### 2.3.1 Базовые секции (все типы)

| Секция | Обязательность | Содержание |
|--------|----------------|------------|
| **Purpose** | ✅ | 2–4 предложения: зачем файл, кто читает |
| **Scope / Out of scope** | ✅ | Что покрывает и что явно не покрывает |
| **Definitions** | при domain/auth | Термины, enum-ы из `@sunschool/domain` |
| **Requirements / Rules** | ✅ | Нумерованный список MUST/SHOULD/MAY |
| **Flows / Diagrams** | при spec/contract | Mermaid или ASCII sequence |
| **Acceptance criteria** | ✅ | Чеклист верификации для агента; у каждого пункта — ожидаемый исход |
| **Open questions** | ✅ | `Q-NN · вопрос · владелец · блокирует (ID задач / §)`. Пусто = «—». Непустая секция блокирует DoR задач, ссылающихся на затронутые разделы |
| **Related documents** | ✅ | Таблица ссылок + «planned» placeholders |
| **Agent notes** | ✅ | Антипаттерны, частые ошибки агентов |

**Якоря разделов (MUST для PRD / contract / spec / ADR):** нумерованные заголовки `## 3. …` / `### 3.2 …`. Задачи в `P{N}_tasks.md` ссылаются на `§3.2`, не на файл целиком. Перенумерация существующих разделов — material change (bump версии + обновить ссылки из tasks).

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

#### 2.3.2a Критерии применимости путей H / N / S (канон)

**Единственный источник** критериев: матрица §2.3.3, Definition of Ready ([`ai_agent_model_routing.md`](./ai_agent_model_routing.md) § DoR), шаблон задач ([`phase_tasks.template.md`](./phase_tasks.template.md)) и `reviewer` ссылаются сюда, не копируют. Решение «нужен ли путь» принимается по признакам ниже, а не по ощущению «if applicable».

**Глубина по профилю качества:** какие из путей ниже обязательны на уровне проекта — измерение D2 [`project_quality_profile.template.md`](./project_quality_profile.template.md) §3 (уровень — в `project_quality_profile.md`). Признак S выше уровня `prototype` не понижается (security floor профиля §5).

Пути описываются в contract / spec (в разделе с якорем `§N.M`); задача ссылается на раздел. Каждый путь — проверяемая строка Acceptance (smoke, тест или ручной шаг с ожидаемым исходом).

| Путь | Обязателен, если | Что описать |
|------|------------------|-------------|
| **H — Happy** | Документ/задача вводит или меняет **наблюдаемое поведение**: маршрут/страница, user flow, Server Action, API route, DAL-функция, фоновая задача, письмо | Предусловие → действие → исход: UI-состояние, redirect, toast-ключ `@/lib/messages`, запись в БД / side effect |
| **N — Negative** | **≥ 1 признак:** (1) внешний ввод — форма, query/route params, тело запроса, upload; (2) мутация данных или переход состояния (lifecycle, модерация); (3) I/O, который может упасть — БД, внешний API, email, storage; (4) данные, которых может не быть — not found, пустой список | Применимые случаи: validation · not found · conflict/duplicate · недопустимый переход · сбой I/O / timeout · empty. Для каждого: **код** (`MUTATION_ERROR_CODES` / `AUTH_MUTATION_ERROR_CODES` из `@sunschool/domain`) · **ключ сообщения** · **UI-состояние** (error / empty / forbidden / retry CTA) |
| **S — Security** | **≥ 1 признак:** (1) runtime-код в sensitive zone ([`agent-code-review-subagent.mdc`](../../.cursor/rules/agent-code-review-subagent.mdc) § Sensitive zones); (2) доступ к данным зависит от пользователя/роли — ownership, RBAC, кабинеты; (3) мутация пользовательских данных; PII, секреты, сессия/токены; (4) новый публичный endpoint, upload, redirect по пользовательскому URL, webhook | Применимые случаи: аноним → login / 401 · чужая роль → 403 / forbidden state · чужой ресурс (IDOR) → 404 / 403 · подмена id/полей в запросе → отказ **на сервере** (policy в Server Action / Route Handler, не только UI) · DTO не отдаёт лишних полей. Ссылка на строку `authorization_matrix` |

**Освобождены** (запись `Paths: n/a — <причина>` в задаче, `N/A — <причина>` в секции документа): T0 copy / CSS · docs-only · tooling · рефакторинг без изменения поведения · презентационный компонент без данных и мутаций. «N/A» **без** причины из этого списка = документ не complete.

**Следствия:**
- признак **S** → задача минимум task tier **T3** (отдельный commit unit, обязательный `reviewer`);
- требуемый путь не описан → задача не проходит DoR → spec-gap (`architect` дописывает путь в contract/spec, не в задачу);
- `reviewer` берёт перечисленные пути как ожидаемую форму (2b) и проверяет реализацию каждого (2c); пропуск — blocker.

#### 2.3.3 Матрица обязательности секций по типу документа

| Тип | Happy | Negative | Security | Races | Drift |
|-----|:-----:|:--------:|:--------:|:-----:|:-----:|
| User flow | ✅ | ✅ кратко | ссылка | ссылка | — |
| PRD scope / pages spec | ✅ | ✅ | high-level | ссылка | ✅ |
| `lifecycle_models` | ✅ | ✅ invalid transitions | — | ✅ | — |
| `failure_modes_catalog` | — | ✅ | ✅ | ✅ **канон-индекс** | ✅ |
| `authorization_matrix` | — | — | ✅ **канон** | — | — |
| **Contract** | ✅ | ✅ по §2.3.2a | ✅ по §2.3.2a | ✅ | ✅ |
| **Spec** | ✅ | ✅ по §2.3.2a | ✅ по §2.3.2a | ссылка | — |
| Wireframe | ✅ | перечислить states | forbidden state | — | — |
| ADR | decision path | rejected alternatives | ✅ при признаке S (§2.3.2a) | ✅ if jobs/data | — |
| Phase + tasks | `Paths` H на задачу | `Paths` N по §2.3.2a | `Paths` S по §2.3.2a → T3 | 1 race check | doc sync в CU DoD; Phase DoR audit |

Ячейка «по §2.3.2a» = секция обязательна, если сработал хотя бы один признак; иначе `N/A — <причина из списка освобождений>`.
| UX contract | ✅ | ✅ | a11y/forbidden UI | optimistic rollback | — |

#### 2.3.4 Шаблон тела — Contract (обязательные секции)

Каждый файл в `docs/implementation/mvp/contracts/` **MUST** включать секции в этом порядке:

```markdown
## N. Happy path
<!-- Актор, preconditions, sequence, postconditions, side effects. Один подраздел §N.M на операцию -->

## N. Negative paths (business)
<!-- Обязательность — §2.3.2a (N). Таблица на операцию: -->
| Случай | Условие | Код (`MUTATION_ERROR_CODES.*`) | Ключ сообщения | Исход / UI-состояние |
|--------|---------|--------------------------------|----------------|----------------------|

## N. Security paths
<!-- Обязательность — §2.3.2a (S). Аноним / чужая роль / IDOR / tampering; MUST deny на сервере.
     Ссылка на строку authorization_matrix. «N/A — <причина из списка освобождений §2.3.2a>» -->

## N. Concurrency & idempotency
<!-- Races, double-submit, cron overlap; UNIQUE keys, transactions, idempotency_key -->

## N. Drift & consistency notes
<!-- Schema vs domain, cache invalidation, timezone; guards for agents -->

## N. Policy & layer touchpoints
<!-- proxy.ts vs policy/server vs domain; forbidden imports; пакеты и модули, которые затрагивает реализация -->

## N. Acceptance criteria
<!-- Каждый пункт — проверка + ожидаемый исход. Минимум по 1 на каждый обязательный путь H / N / S -->

## N. Open questions
<!-- Q-NN · вопрос · владелец · блокирует (§ / задачи). «—», если пусто -->
```

Записи в [`failure_modes_catalog.md`](../prds/02_domain_model/failure_modes_catalog.md) для cross-cutting сценариев: **ID `FM-xxx`**, в contract — ссылка «implements FM-xxx».

#### 2.3.5 Шаблон тела — Spec (обязательные секции)

Каждый файл в `docs/implementation/mvp/specs/` **MUST** включать:

```markdown
## N. Files / area touchpoints
<!-- Маршруты (ссылка на canonical_routes), route groups, feature-папки apps/web, Server Actions, DAL -->

## N. Happy path
<!-- Пошаговый UX + Server Action / Route Handler touchpoints; toast-ключи @/lib/messages -->

## N. Negative paths (UX)
<!-- Обязательность — §2.3.2a (N). Empty, loading, error, retry, Zero Dead Ends CTA; toast.error on mutation failure.
     Для каждого случая: код из contract · ключ сообщения · UI-состояние -->

## N. Security paths
<!-- Обязательность — §2.3.2a (S). Required role/session; 401/403 / forbidden UX; IDOR → 404.
     «N/A — <причина из списка освобождений §2.3.2a>», например public read-only экран -->

## N. Concurrency notes
<!-- Ссылка на contract + поведение UI (disabled, aria-busy, optimistic rollback) -->

## N. UI states matrix
<!-- empty | loading | error | forbidden — per async region -->

## N. Wireframe & prototype
<!-- Link to wireframes/mvp/*.md and prototype section -->

## N. Acceptance criteria
<!-- Smoke с ожидаемым исходом: happy + по 1 на каждый обязательный путь N / S -->

## N. Open questions
<!-- Q-NN · вопрос · владелец · блокирует (§ / задачи). «—», если пусто -->
```

**Запрещено:** описывать детали race resolution в spec, если они уже в contract — только UX-поведение при исходе race.

#### 2.3.6 Implementation-ready (DoR-ready) checklist

Автор документа выполняет **те же** проверки, которые потом проходит задача по Definition of Ready ([`ai_agent_model_routing.md`](./ai_agent_model_routing.md) § DoR). Документ, прошедший этот чеклист, даёт задачам DoR без spec-gap — это самый дешёвый момент закрыть пробел.

Применяется к PRD, contract, spec, ADR (для ADR — только пункты 1, 2, 6, 7):

1. **Якоря:** нумерованные разделы `§N.M` (§2.3.1) — на них ссылаются задачи.
2. **Нет неопределённости в MUST:** ни `TBD`, ни `?`, ни «уточнить позже» в Requirements / путях / Acceptance; всё нерешённое — в Open questions с владельцем.
3. **Пути H / N / S** — по признакам §2.3.2a; каждое `N/A` — с причиной из списка освобождений.
4. **Коды и тексты названы:** коды ошибок — из `@sunschool/domain` constants (новый код помечен «добавить в domain»), user-visible тексты — ключи `@/lib/messages`, не готовые строки.
5. **Acceptance проверяема:** у каждого пункта есть способ проверки (smoke / тест / ручной шаг) и ожидаемый исход.
6. **Версии сверены:** `Проверено по` заполнено для тем §2.7; пины совпадают с `package.json` (после P5).
7. **Touchpoints:** spec — Files / area; contract — Policy & layer touchpoints; ADR — Affected documents (§6.2).

### 2.4 Правила написания для AI-агентов

1. **Один канон — один файл.** Не дублировать маршруты вне [`canonical_routes.md`](../design/canonical_routes.md).
2. **MUST / SHOULD / MAY** — использовать RFC 2119 для однозначности.
3. **Короткие абзацы**, таблицы для матриц (role × resource, state × transition).
4. **Явные cross-links** — относительные пути Markdown: `[text](../path/file.md)`.
5. **Не копировать Pulse reference продуктовые правила** — только архитектурные паттерны; домен Sunday School из `docs/my_specs/` и user flows.
6. **Interim → canonical:** при миграции сохранять смысл; в новом файле указать `Migrated from: docs/my_specs/...`.
7. **Post-MVP:** таблицы и поля волн 1–3 (семьи, достижения и штрафы, голосовая проверка) присутствуют в схеме, но не описываются как MVP scope.
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
5. **Не** редактировать `docs/my_specs/` (interim) без явной задачи миграции обратно.

### 2.6 Верификация после каждого файла

- [ ] Front matter заполнен
- [ ] Все зависимости из колонки «Зависит от» процитированы или соблюдены
- [ ] Секции из §2.3.3 для данного типа документа присутствуют (или явное «N/A» с обоснованием)
- [ ] Contract/spec: шаблон §2.3.4 / §2.3.5 соблюдён
- [ ] Cross-cutting failure/race: запись в `failure_modes_catalog.md` или ссылка `FM-xxx`
- [ ] Backlinks добавлены в ранние файлы
- [ ] Нет второго списка маршрутов (только ссылка на `canonical_routes.md`)
- [ ] Пути H / N / S — по признакам §2.3.2a; каждое `N/A` с причиной из списка освобождений
- [ ] DoR-ready checklist §2.3.6 пройден (якоря, нет TBD в MUST, коды/ключи названы, Acceptance с исходом, `Проверено по`, touchpoints)
- [ ] Open questions пуст **или** каждый вопрос имеет владельца и список блокируемых § / задач
- [ ] `architecture_master_index.md` обновлён при добавлении canonical PRD

### 2.7 Context7 — когда обращаться

Перед написанием runtime/auth/data документов агент **обязан** сверить актуальные API через Context7:

| Тема | Library | Что проверить |
|------|---------|---------------|
| Next.js 16 | `/vercel/next.js` | `proxy.ts`, async `cookies`/`headers`/`params` |
| Auth.js v5 | `/websites/authjs_dev` | провайдеры (Telegram — custom OIDC; Credentials — администратор), JWT, role in token |
| Prisma + Neon | `/websites/prisma_io` | `DATABASE_URL`, `DIRECT_URL`, migrate deploy |

Версии, закреплённые при bootstrap (P2, 2026-10-10): Next.js 16.4.x, Auth.js v5, Prisma v7 — источник `project-context.mdc`; **сверка с Context7 при P2 не выполнялась** (инструмент недоступен в сессии) и обязательна при написании ADR-001 / ADR-002 / ADR-003 (W1-F1, W1-F2, W4-01).

Результат сверки фиксировать в front matter: `**Проверено по:** <lib>@<pin> — Context7, YYYY-MM-DD` (§2.2). Без этой строки runtime/auth/data документ не проходит §2.3.6.

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

- HTML-прототип [`sunday_school_prototype.html`](../prototypes/sunday_school_prototype.html)
- Interim design system [`sunday_school_prototype.html`](../prototypes/sunday_school_prototype.html)
- UX-прinciples из interim pages doc в `docs/my_specs/` § UX-прinciples
- Cursor Rules: `ui-design-system-shadcn`, `ui-mobile-first`, `ui-prototype-fidelity`, `ui-semantics-a11y`, `ui-toast-mutations`, `ui-mutation-pending`, `ui-optimistic-mutations`
- Guidelines: [`typography_text_guidelines.md`](../guidelines/typography_text_guidelines.md), [`ai_semantics_a11y_guidelines.md`](../guidelines/react/ai_semantics_a11y_guidelines.md)

| ID | Файл | Назначение |
|----|------|------------|
| UX-01 | `docs/design/ux_ui_principles.md` | Канон UX-прinciples: Progressive Disclosure, Zero Dead Ends, Thumb Zone, One Primary Action |
| UX-02 | `docs/design/responsive_navigation_contract.md` | Bottom nav / sidebar, breakpoints md/lg, route groups |
| UX-03 | `docs/design/visual_identity_contract.md` | Slate Cobalt tokens, typography atoms, shadcn mapping |
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

> **Адаптация (P2).** Доменные строки Pulse (booking, trainer, wishlist, complaint …) заменены аналогами Sunday School. Какие волны и строки обязательны — по профилю [`project_quality_profile.md`](./project_quality_profile.md) (**lean**, §5.0). Строки с пометкой «не требуется на lean» сохранены для повышения уровня (профиль §8). Предварительные перечни W8 / W9 / W11 уточняются при подходе к волне.

### 5.0 Волны по уровню профиля качества

Уровень — из [`project_quality_profile.md`](./project_quality_profile.md) (D1; нет профиля → `standard`). Волна обязательна для отмеченных уровней; «часть» — только перечисленные строки. Документы выключенных модулей (профиль §4) пропускаются на любом уровне.

| Волна | Prototype | Lean | Standard | Strict |
|-------|-----------|------|----------|--------|
| W0 Meta | — | ✓ | ✓ | ✓ |
| W1 Governance + product canon | часть: W1-F4…F6, W1-03 | часть: W1-F1…F6, W1-03, W1-04 | ✓ | ✓ |
| W2 UX/UI foundation | — | часть: UX-03 (+ UX-02 при mobile-first) | ✓ | ✓ |
| W3 Domain model | — | часть: W3-02, W3-04 | ✓ | ✓ |
| W4 ADR (детализация) | — | только ADR включённых модулей | ✓ | ✓ |
| W5 Authorization + runtime | — | часть: authorization_matrix, auth_runtime_spec (модуль `auth`) | ✓ | ✓ |
| W6 Data model supplements | — | часть: seed_data_spec | ✓ | ✓ |
| W7 UX interaction | — | часть: UX-05 ui_states, UX-06 forms | ✓ | ✓ |
| W8 Contracts | — | часть: monorepo_boundaries + contracts мутаций с признаком S | ✓ | ✓ (+ Concurrency / Drift) |
| W9 Specs | — | часть: global_shell + многошаговые flows | ✓ | ✓ |
| W15 Design System Lab | если модуль включён | ✓ | ✓ | ✓ |
| W10 Wireframes | — | — (достаточно HTML-прототипа) | только ключевые маршруты | ✓ |
| W11 Phases + tasks | упрощённый список задач | ✓ | ✓ | ✓ |
| W12 Operations + guides | — | часть: local_dev_setup, vercel_deploy, neon_prisma_migrations | ✓ | ✓ |
| W13 Learning pack | — | — | часть: W13-00 | ✓ |
| W14 Index sync | — | облегчённый | ✓ | ✓ |

Легенда колонок:

- **ID** — порядковый номер внутри волны
- **Зависит от** — прочитать **до** написания
- **Обновить backlinks** — дополнить ссылками **после** создания

---

### Волна W0 — Meta (этот файл)

| ID | Файл | Статус |
|----|------|--------|
| W0-01 | `docs/meta/documentation_creation_registry.md` | ✅ Этот файл |
| W0-02 | `docs/meta/ai_agent_model_routing.md` | Канон маршрутизации моделей (task tier T0–T3). Runtime: `.cursor/rules/model-routing.mdc`. Вне волн PRD. |

**Обновить backlinks после W0:** [`ai_first_project_methodology.md`](./ai_first_project_methodology.md) §3 — добавить ссылку на реестр.

---

### Волна W1 — Governance + Product canon

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W1-F1 | `docs/prds/07_governance/adr_001_stack_and_runtime.md` | project-context, quality profile (модули) | architecture_master_index |
| W1-F2 | `docs/prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md` | шаблон `adr_002_nextjs_vercel_runtime_policy.template.md`, ADR-001 | adr_index |
| W1-F3 | `docs/prds/architecture_master_index.md` | ADR-001, ADR-002 | AGENTS.md |
| W1-F4 | `docs/prds/01_product_scope/user_flows/users_mvp/{role}_flow.md` — по одному на роль MVP (`admin`, `teacher`); [`parent_flow.md`](../prds/01_product_scope/user_flows/users_mvp/parent_flow.md) — волна 2 (P13) | interim brief (`docs/my_specs/`), prototype | architecture_master_index |
| W1-F5 | `docs/design/canonical_routes.md` — единственный инвентарь маршрутов | user flows, prototype | AGENTS.md, architecture_master_index |
| W1-F6 | `docs/prds/03_data_model/database_schema_v1.md` — **DB-first**, до W3 / W8; схема **целиком**, включая таблицы post-MVP (спец. С-1…С-7), Библия — по [`Bible/README.md`](../my_specs/Bible/README.md) | user flows, interim brief | architecture_master_index |
| W1-01 | `docs/prds/07_governance/adr_index.md` | ADR-001, ADR-002, registry | `07_governance/README.md`, `architecture_master_index.md` |
| W1-02 | `docs/prds/07_governance/decision_process.md` | adr_index | adr_index, methodology |
| W1-03 | `docs/prds/01_product_scope/mvp_scope.md` | interim MVP brief (`docs/my_specs/`), user flows, ADR-001 | architecture_master_index, methodology checklist |
| W1-04 | `docs/prds/01_product_scope/post_mvp_deferrals.md` | mvp_scope, database_schema_v1 | mvp_scope |
| W1-05 | `docs/prds/01_product_scope/pages_functional_spec.md` | mvp_scope, canonical_routes, interim pages doc (`docs/my_specs/`) | architecture_master_index, canonical_routes |
| W1-06 | `docs/prds/01_product_scope/email_notifications_matrix.md` | mvp_scope | **Не требуется:** модуль `email_jobs` выключен (post-MVP) |

**Lean:** W1-F1…F6, W1-03, W1-04 (§5.0). W1-01, W1-02, W1-05, W1-06 — не требуется на lean.

---

### Волна W2 — UX/UI foundation (до wireframes)

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W2-01 | UX-01 `docs/design/ux_ui_principles.md` | pages_functional_spec, prototype HTML | pages_functional_spec, design/README |
| W2-02 | UX-02 `docs/design/responsive_navigation_contract.md` | ux_ui_principles, canonical_routes, prototype | ux_ui_principles, canonical_routes |
| W2-03 | UX-03 `docs/design/visual_identity_contract.md` | ux_ui_principles, token dump прототипа (`<head>` прототипа), typography guidelines | ux_ui_principles, docs/guidelines/README |
| W2-04 | UX-07 `docs/design/accessibility_requirements.md` | ux_ui_principles, ai_semantics_a11y guidelines | ux_ui_principles |
| W2-05 | UX-08 `docs/design/prototype_route_mapping.md` | canonical_routes, prototype HTML (`#screen-<view>` ids) | canonical_routes, ux_ui_principles |

**Lean:** UX-03 (W2-03) + UX-02 (W2-02, mobile-first); W2-05 — рекомендуется (ключи экранов уже в прототипе); W2-01, W2-04 — не требуется на lean.

---

### Волна W3 — Domain model

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W3-01 | `docs/prds/02_domain_model/README.md` | mvp_scope | architecture_master_index |
| W3-02 | `docs/prds/02_domain_model/lifecycle_models.md` | mvp_scope, database_schema_v1, user flows | database_schema_v1, architecture_master_index |
| W3-03 | `docs/prds/02_domain_model/failure_modes_catalog.md` | lifecycle_models, user flows | lifecycle_models, architecture_master_index, AGENTS.md |
| W3-04 | `docs/prds/02_domain_model/domain_invariants.md` | lifecycle_models, failure_modes_catalog, ADR-001 | AGENTS.md *(ссылка в Related)*, lifecycle_models, failure_modes_catalog |
| W3-05 | `docs/prds/02_domain_model/use_cases_index.md` | lifecycle_models, failure_modes_catalog, mvp_scope | lifecycle_models, failure_modes_catalog |

**Lean:** W3-02 `lifecycle_models` (учебный год, заявка на доступ, проверка ДЗ и корректировка, запрос на удаление, выдача кирпичиков) и W3-04 `domain_invariants` (5 инвариантов из `project-context.mdc`). W3-01, W3-03, W3-05 — не требуется на lean.

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
| W4-01 | `docs/prds/07_governance/adr_003_auth_oidc_jwt_rbac.md` | ADR-001, domain_invariants, [`telegram_authjs_oidc_portable_guide.md`](../my_specs/telegram_authjs_oidc_portable_guide.md) | adr_index, auth guideline |
| W4-02 | `docs/prds/07_governance/adr_004_timezone_scheduling_model.md` — часовой пояс школы и даты уроков / проверок; создаётся, только если W3 подтвердит необходимость | domain_invariants, lifecycle_models | adr_index, database_schema_v1 |
| W4-03 | `docs/prds/07_governance/adr_005_schema_complete_post_mvp_tables.md` — схема создаётся целиком, таблицы post-MVP без UI | lifecycle_models, mvp_scope, database_schema_v1 | adr_index, mvp_scope |
| W4-04 | `docs/prds/07_governance/adr_006_idempotent_email_delivery.md` | email_notifications_matrix, domain_invariants | **не требуется:** модуль `email_jobs` выключен |
| W4-05 | `docs/prds/07_governance/adr_007_file_asset_blob_lifecycle.md` | ADR-001, s3-upload guideline | **не требуется:** модуль `s3_uploads` выключен |
| W4-06 | `docs/prds/07_governance/adr_008_i18n_ru_en_dictionary_slices.md` — модуль `i18n` включён | ADR-001, `ui-messages-and-copy`, [`copy_and_messages.md`](../guidelines/react/copy_and_messages.md) | adr_index |
| W4-07 | `docs/prds/07_governance/adr_009_bible_translations_and_verse_numbering.md` — общая нумерация (ПБ-4, 12.2 п. 29), лицензия NIV (п. 30), модель таблиц | [`Bible/README.md`](../my_specs/Bible/README.md), спец. 3.10, database_schema_v1 | adr_index, Bible/README.md |

**Lean:** только ADR включённых модулей — W4-01, W4-03, W4-06, W4-07 (+ W4-02 при необходимости). W4-04 и W4-05 — не требуется (модули выключены).

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
| W5-07 | `docs/prds/05_runtime/monorepo_packages.md` | ADR-001, Pulse reference | AGENTS.md |
| W5-08 | `docs/prds/05_runtime/auth_runtime_spec.md` | adr_003, authorization_matrix, ADR-002 | auth guideline |
| W5-09 | `docs/prds/05_runtime/cache_revalidation_policy.md` | ADR-002, ai_loading_patterns | nextjs guidelines |

**Lean:** W5-02 `authorization_matrix` (admin / teacher × ресурсы) и W5-08 `auth_runtime_spec` (OIDC callback, укорочение `state`, привязка провайдеров). Остальное — не требуется на lean.

---

### Волна W6 — Data model supplements

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W6-01 | `docs/prds/03_data_model/data_access_patterns.md` | database_schema_v1, lifecycle_models | database_schema_v1 |
| W6-02 | `docs/prds/03_data_model/indexing_strategy.md` | data_access_patterns | database_schema_v1 |
| W6-03 | `docs/prds/03_data_model/seed_data_spec.md` — справочники (Библия: RST / NIV, см. [`Bible/README.md`](../my_specs/Bible/README.md)), каталог достижений, dev-фикстуры из прототипа, `seed:dev` с защитой от prod (С-6) | database_schema_v1, pages_functional_spec | pages_functional_spec |

**Lean:** W6-03. W6-01, W6-02 — не требуется на lean.

---

### Волна W7 — UX interaction + styleguide

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W7-01 | UX-04 `docs/design/interaction_design_contract.md` | ux_ui_principles, ui-toast/mutation rules | ux_ui_principles, docs/guidelines/react |
| W7-02 | UX-05 `docs/design/ui_states_contract.md` | ux_ui_principles, ai_loading_patterns | pages_functional_spec, ux_ui_principles |
| W7-03 | UX-06 `docs/design/forms_and_validation_ux.md` | ui_states_contract, ai_form_handling_pattern | interaction_design_contract |
| W7-04 | UX-10 `docs/design/content_and_microcopy_contract.md` | copy_and_messages guideline | interaction_design_contract |
| W7-05 | UX-09 `docs/design/styleguide.md` | visual_identity_contract, token dump прототипа (`<head>` прототипа) | visual_identity_contract, design/README |

---

### Волна W8 — Core contracts (P01–P03 foundation)

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W8-01 | `docs/implementation/mvp/contracts/monorepo_boundaries_contract.md` | monorepo_packages | AGENTS.md, methodology §2.6 |
| W8-02 | `docs/implementation/mvp/contracts/authorization_policy_contract.md` | policy_enforcement_contract, auth_runtime_spec | adr_003, policy rule |
| W8-03 | `docs/implementation/mvp/contracts/access_requests_and_roles_contract.md` — заявки на доступ, роли admin / teacher, отключение, объединение дубликатов (РГ-1…РГ-6) | adr_003, authorization_matrix, lifecycle_models | lifecycle_models, authorization_matrix |
| W8-04 | `docs/implementation/mvp/contracts/school_year_and_groups_contract.md` — учебный год, группы, зачисление и перевод (БП-6, БП-7) | lifecycle_models, domain_invariants | lifecycle_models, domain_invariants |
| W8-05 | `docs/implementation/mvp/contracts/homework_check_contract.md` — проверка ДЗ и корректировка (БП-1…БП-4, БП-10, БП-12) | lifecycle_models, school_year_and_groups_contract | lifecycle_models |
| W8-06 | `docs/implementation/mvp/contracts/bricks_ledger_contract.md` — журнал кирпичиков (БП-11) | homework_check_contract, domain_invariants | lifecycle_models |
| W8-07 | `docs/implementation/mvp/contracts/change_log_contract.md` — журнал изменений (БП-8, перечень 3.16) | authorization_matrix | authorization_matrix |
| W8-08 | `docs/implementation/mvp/contracts/deletion_requests_contract.md` — запросы на удаление (УД-1…УД-11) | lifecycle_models, privacy_data_handling | lifecycle_models |
| W8-09 | `docs/implementation/mvp/contracts/bible_seed_contract.md` — скрипты загрузки переводов (ПБ-1…ПБ-5) | adr_009, seed_data_spec, `Bible/README.md` | seed_data_spec |
| W8-10 | `docs/implementation/mvp/contracts/analytics_year_snapshots_contract.md` — снимки итогов учебного года, пороги достоверности, год по умолчанию (БП-6, БП-7, БП-11; `multi_year_analytics`) | school_year_and_groups_contract, homework_check_contract, bricks_ledger_contract, deletion_requests_contract | lifecycle_models, authorization_matrix |
| W8-11 | `docs/implementation/mvp/contracts/achievements_and_penalties_contract.md` — достижения и штрафы, пересчёт, флаг (волна 1, P12) | adr_012, achievements_spec, bricks_ledger_contract, homework_check_contract | authorization_matrix, change_log_contract, bricks_ledger_contract, post_mvp_deferrals |
| W8-12 | `docs/implementation/mvp/contracts/families_and_parents_contract.md` — семьи, роль parent, согласие, дайджест без почты (волна 2, P13) | adr_013, deletion_requests_contract, access_requests_and_roles_contract | authorization_matrix, change_log_contract, seed_data_spec, post_mvp_deferrals |

**Lean:** W8-01 + контракты мутаций с признаком S / N: W8-03…W8-08, W8-10, W8-11, W8-12; W8-09 — перед написанием скриптов загрузки. W8-02 — при необходимости (модуль `auth`). `file_upload_contract` и `email_notifications_contract` не требуются (модули `s3_uploads`, `email_jobs` выключены).

---

### Волна W9 — Implementation specs

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W9-01 | `docs/implementation/mvp/specs/global_shell_spec.md` — оболочка из прототипа (`#shell`, header, drawer, role switcher только в dev) | responsive_navigation_contract, visual_identity | ux_ui_principles |
| W9-02 | `docs/implementation/mvp/specs/access_and_registration_spec.md` — вход Telegram / email + пароль администратора, регистрация с согласием, ожидание заявки | auth_runtime_spec, access_requests_and_roles_contract, forms_and_validation_ux | auth_runtime_spec, admin_flow |
| W9-03 | `docs/implementation/mvp/specs/lesson_form_and_golden_verses_spec.md` | school_year_and_groups_contract, bible_seed_contract, forms_and_validation_ux | pages_functional_spec, teacher_flow |
| W9-04 | `docs/implementation/mvp/specs/homework_check_flow_spec.md` — последовательная проверка + сводная таблица | homework_check_contract, ui_states | teacher_flow, pages_functional_spec |
| W9-05 | `docs/implementation/mvp/specs/group_and_pupils_spec.md` | school_year_and_groups_contract, ui_states | admin_flow, teacher_flow |
| W9-06 | `docs/implementation/mvp/specs/bricks_and_rating_spec.md` | bricks_ledger_contract | teacher_flow |
| W9-07 | `docs/implementation/mvp/specs/analytics_screens_spec.md` — группа, ученик, школа (9.1…9.1.4, 9.5, 9.6) | homework_check_contract, bricks_ledger_contract | teacher_flow, admin_flow |
| W9-08 | `docs/implementation/mvp/specs/admin_users_and_deletions_spec.md` | access_requests_and_roles_contract, deletion_requests_contract, change_log_contract | admin_flow, canonical_routes |
| W9-09 | `docs/implementation/mvp/specs/achievements_screens_spec.md` — каталог, режим группы, выдача, штраф; обязательная сверка с прототипом (P12) | achievements_and_penalties_contract, adr_012, canonical_routes | P12_tasks, canonical_routes, design_system_lab_spec |
| W9-10 | `docs/implementation/mvp/specs/families_and_parents_screens_spec.md` — семья, экраны родителя, контакты учителя; сверка с прототипом (P13) | families_and_parents_contract, adr_013, canonical_routes | P13_tasks, canonical_routes, design_system_lab_spec |

**Lean:** global_shell (W9-01) + многошаговые flows: W9-04 (проверка ДЗ), W9-02 (вход / регистрация), W9-09 (достижения и штрафы, P12), W9-10 (семьи и родители, P13). Остальное — не требуется на lean.

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
| W10-02 | `.../mvp/public_landing.md` | `/` | pages_functional_spec, prototype mapping |
| W10-03… | `.../mvp/public_{screen}.md` | публичные маршруты из `canonical_routes` | pages_functional_spec, профильный spec |
| W10-… | `.../mvp/auth_{login,register…}.md` | `/auth/*` | auth_runtime_spec |
| W10-… | `.../mvp/{role}_{screen}.md` | кабинет каждой роли из `admin, teacher` (dashboard, списки, детали, формы) | `{role}_flow`, профильный spec / contract |
| W10-… | `.../mvp/admin_{screen}.md` | `/admin/*` (если есть роль admin) | admin_flow, профильный spec |

**Lean:** не требуется — достаточно HTML-прототипа (ключи экранов `#screen-<view>`, см. UX-08). Один wireframe на маршрут из `canonical_routes.md` — на standard+; нумерация — сквозная в порядке route_index. Пример полного списка (32 экрана) — Pulse registry W10.

**Обновить backlinks после W10:** `canonical_routes.md` § Wireframe index, `design/README.md`, `prototype_route_mapping.md`.

---

### Волна W11 — Phase descriptions + tasks

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W11-01 | `docs/implementation/mvp/phases_tasks_descriptions/P01_phase_description.md` — scaffold, БД, auth (Telegram / Credentials администратора), оболочка | W8-01…03, monorepo_packages, global_shell_spec | methodology §2.5 |
| W11-02 | `docs/implementation/mvp/tasks/P01_tasks.md` | P01_phase_description | — |
| W11-03 | `P02_phase_description.md` — учебный год, группы, ученики | P01, school_year_and_groups_contract, group_and_pupils_spec | methodology |
| W11-04 | `P02_tasks.md` | P02_phase | — |
| W11-05 | `P03_phase_description.md` — уроки и золотые стихи | lesson_form_and_golden_verses_spec, bible_seed_contract | methodology |
| W11-06 | `P03_tasks.md` | P03_phase | — |
| W11-07 | `P04_phase_description.md` — проверка ДЗ | homework_check_contract, homework_check_flow_spec | methodology |
| W11-08 | `P04_tasks.md` | P04_phase | — |
| W11-09 | `P05_phase_description.md` — кирпичики, рейтинг, аналитика | bricks_ledger_contract, bricks_and_rating_spec, analytics_screens_spec | methodology |
| W11-10 | `P05_tasks.md` | P05_phase | — |
| W11-11 | `P06_phase_description.md` — журнал изменений, запросы на удаление, локализация | change_log_contract, deletion_requests_contract, adr_008 | methodology |
| W11-12 | `P06_tasks.md` | P06_phase | — |
| W11-13 | `P07_phase_description.md` — переходный период согласий, prod-готовность (**перенос данных из действующего приложения вне проекта**, решение владельца 2026-10-11) | migration_runbook, seed_data_spec, adr_011, accessibility (правило `ui-semantics-a11y`) | methodology |
| W11-14 | `P07_tasks.md` | P07_phase | — |
| W11-15 | `P08_phase_description.md` — аналитика по учебным годам (снимки, год по умолчанию, разница, закрытый год, UX/UI verification loop) | analytics_year_snapshots_contract, analytics_screens_spec v1.2, `multi_year_analytics` | methodology |
| W11-16 | `P08_tasks.md` | P08_phase | — |
| W11-17 | `P12_phase_description.md` — достижения и штрафы (волна 1, флаг, UI-verify против прототипа) | achievements_and_penalties_contract, achievements_screens_spec, adr_012 | methodology |
| W11-18 | `P12_tasks.md` | P12_phase | — |
| W11-19 | `P13_phase_description.md` — семьи и родители (волна 2, флаг, сид до UI, UI-verify) | families_and_parents_contract, families_and_parents_screens_spec, adr_013 | methodology |
| W11-20 | `P13_tasks.md` | P13_phase | — |

Деление на фазы **предварительное**, фиксируется при написании W11; нумерация фаз реализации (P01…) не путается с промптами bootstrap P0…P6.

---

### Волна W12 — Operations + guides

| ID | Файл | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W12-01 | `docs/prds/06_operations/README.md` | backend_requirements | architecture_master_index |
| W12-02 | `docs/prds/06_operations/migration_runbook.md` | database_schema_v1, ADR-001, Context7 Prisma | database_schema_v1 |
| W12-03 | `docs/prds/06_operations/observability_plan.md` | backend_requirements | backend_requirements |
| W12-04 | `docs/prds/06_operations/cron_jobs_registry.md` | email_notifications_contract | **не требуется:** модуль `email_jobs` выключен |
| W12-05 | `docs/implementation/mvp/guides/local_dev_setup.md` | migration_runbook, seed_data_spec | implementation/mvp/README |
| W12-06 | `guides/vercel_deploy_guide.md` | ADR-001, auth_runtime_spec | ADR-001 |
| W12-07 | `guides/neon_prisma_migrations_guide.md` | migration_runbook | migration_runbook |
| W12-08 | `guides/seed_and_fixtures_guide.md` | seed_data_spec | seed_data_spec |
| W12-09 | `guides/cron_jobs_setup_guide.md` | cron_jobs_registry | **не требуется:** модуль `email_jobs` выключен |

**Lean:** W12-05 `local_dev_setup`, W12-06 `vercel_deploy_guide`, W12-07 `neon_prisma_migrations_guide`; W12-02 `migration_runbook` — как зависимость W12-05 / W12-07 и для фазы миграции из старого приложения.

---

### Волна W13 — Architecture Learning Pack

| ID | File | Зависит от | Обновить backlinks |
|----|------|------------|-------------------|
| W13-00 | `docs/architecture_learning_pack/01_architecture_overview.md` | architecture_master_index, monorepo_boundaries_contract | AGENTS.md |
| W13-01 | `docs/architecture_learning_pack/02_homework_check_layers.md` | homework_check_contract, data_access_patterns | 01_architecture_overview |
| W13-02 | `03_bricks_ledger_layers.md` | bricks_ledger_contract | 01_architecture_overview |
| W13-03 | `04_bible_seed_and_numbering.md` | bible_seed_contract, adr_009 | 01_architecture_overview |

**Lean:** не требуется (W13 — с уровня standard: W13-00; strict — все).

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

**Lean:** облегчённый — W14-01, W14-04, W14-05; остальное — по факту созданных документов.

---

## 6. Инструкции агенту по типам документов

### 6.1 PRD

- Выводить **user-visible behavior**, не implementation details.
- Каждое требование трассируется к user flow или page spec.
- Каждое требование имеет ID `PRD-<area>-NN` — на него ссылаются specs, contracts и задачи.
- Требование, влияющее на доступ (роль, ownership, PII), помечается `S` и ссылается на строку `authorization_matrix` (§2.3.2a).
- Post-MVP — отдельная секция «Deferred», не смешивать с MVP MUST.

### 6.2 ADR

- Формат: Context → Decision → Consequences → Alternatives rejected → **Affected documents**; полный шаблон — [`decision_process.template.md`](../prds/07_governance/decision_process.template.md).
- **Affected documents** (MUST): contracts / specs / PRD, которые меняются из-за решения, — правятся **в том же изменении**, что и ADR (product-docs-alignment).
- **Security consequences** — при признаке S (§2.3.2a).
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

- Phase: goal, in-scope paths, out-of-scope, contracts to read, definition of done. Commit plan **не** дублировать — ссылка на `P{N}_tasks.md` § Commit plan.
- Tasks: по шаблону [`phase_tasks.template.md`](./phase_tasks.template.md) — задачи сгруппированы в **commit units** (CU); у задачи `Tier`, ссылки на `§N.M` spec / contract / ADR / PRD, `Files`, `Acceptance` с исходом, `Paths` H / N / S по §2.3.2a.
- Задачи пишутся **только** по документам, прошедшим §2.3.6; иначе — сначала дописать документ.
- До старта реализации фазы — **Phase DoR audit** (один вызов `architect` в режиме spec-gap на всю фазу; [`ai_agent_model_routing.md`](./ai_agent_model_routing.md) § DoR).

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

Ориентир для профиля **lean** (после адаптации в P2); точный состав уточняется при подходе к волне. Ориентир Pulse (профиль Strict): ~115 файлов.

| Волна | Файлов (lean) | Состав |
|-------|---------------|--------|
| W0 | 2 | registry, model routing (уже есть) |
| W1 | 8 | F1–F6, mvp_scope, post_mvp_deferrals |
| W2 | 2–3 | UX-03, UX-02, (UX-08) |
| W3 | 2 | lifecycle_models, domain_invariants |
| W4 | 4–5 | ADR-003, 005, 008, 009 (+004) |
| W5 | 2 | authorization_matrix, auth_runtime_spec |
| W6 | 1 | seed_data_spec |
| W7 | 2 | UX-05, UX-06 |
| W8 | 10–12 | monorepo_boundaries, W8-03…W8-12 |
| W9 | 4 | global_shell, homework_check_flow, achievements_screens, families_and_parents_screens |
| W15 | 1 | design_system_lab_spec |
| W11 | 20 | фазы P01…P08, P12 и P13 × (description + tasks); P09…P11 вне этой строки реестра |
| W12 | 4 | migration_runbook, local_dev_setup, vercel_deploy, neon_prisma_migrations |
| W14 | — | облегчённый проход |

Итого ≈ 50 файлов (против ~115 на strict).

---

## 9. Быстрый старт для агента

1. Прочитать §2 (требования к документам) и профиль качества проекта.
2. Найти первую незавершённую волну в §5 (до утверждения registry пользователем — gate G2 — волны не начинать).
3. Выполнить волну через [`P3-wave-executor.md`](../../prompts/P3-wave-executor.md): одна сессия = одна волна или 1–3 файла.
4. После волны — backlinks (§2.5), верификация (§2.6), строка в Change log.

---

## Change log

| Date | Change |
|------|--------|
| 2026-10-23 | W8-12, W9-10, W11-19 / W11-20: семьи и родители (ADR-013, P13); дайджест без почты |
| 2026-10-22 | W8-11, W9-09, W11-17 / W11-18: достижения и штрафы (ADR-012, P12) |
| 2026-10-19 | W8-10 `analytics_year_snapshots_contract`; W11-15 / W11-16 `P08_phase_description` и `P08_tasks` (аналитика по учебным годам); статистика W8 / W11 |
| 2026-10-10 | v1.2 — P2: Canonical для Sunday School (lean); Pulse-строки W4 / W8 / W9 / W11 / W13 заменены доменными; `default_docs` → `my_specs`; добавлены ADR-008 (i18n), ADR-009 (Bible); ADR-003 → `adr_003_auth_oidc_jwt_rbac.md` |
| 2026-10-10 | Template cleanup — removed Pulse project history (waves W16, W22–W24, completion log, MVP status); W10 as generic patterns; domain rows marked as Pulse examples |
| 2026-05-23 | v1.1 — §2.3 path coverage (happy/negative/security/races/drift), contract/spec templates, `failure_modes_catalog` in W3 |
| 2026-05-23 | v1.0 — full wave plan, UX/UI block, agent requirements |
