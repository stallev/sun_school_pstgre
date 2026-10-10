# Референсный проект: Pulse (fitapp)

**Статус:** зафиксирован как эталон архитектуры, AI-first методологии и feature-паттернов  
**Расположение в boilerplate:** [`docs/examples/pulse/`](../examples/pulse/)  
**Не деплоится** как часть целевого продукта — **read-only reference** для AI-агентов.

---

## Назначение

Проект **Pulse** (fitness trainer marketplace) содержит отработанную систему:

- двухконтурной архитектуры (Web BFF + Jobs),
- monorepo с `packages/domain`, `packages/policy`, `packages/db`,
- AI-first документации (PRD → contracts → phases → tasks),
- 31 Cursor Rule + 27+ Guidelines,
- Design Lab (`/design-system`) и полный MVP (P01–P14).

Новый продукт на этом boilerplate **наследует подходы**, но имеет **свой домен, PRD, contracts и domain invariants**.

---

## Приоритет: корневые Rules и Guidelines > Pulse snapshot

> **Код референса (`docs/examples/pulse/`) не является безусловным эталоном.**  
> Pulse полезен для **архитектурных паттернов** (domain → policy → db → web, фазовая декомпозиция, contracts, Design Lab), но **не для слепого копирования** домена, маршрутов или UI.

**При разработке:**

Нумерованный SoT — канон: [`.cursor/rules/tiers/t0-always/project-context.template.mdc`](../../.cursor/rules/tiers/t0-always/project-context.template.mdc) § Source-of-truth order (после bootstrap: `project-context.mdc`). **Не дублировать список здесь.**

Над **Pulse snapshot** всегда выигрывают корневые Cursor Rules **и** корневые Guidelines (даже если Guidelines в SoT ниже PRD). Snapshot namesakes в `docs/examples/pulse/.cursor/rules/**` и `docs/examples/pulse/docs/guidelines/**` **не канон**. Дерева `docs/examples/lampto/` в этом репозитории **нет**.

1. **Код и docs Pulse** — read-only **reference for structure and flows**; при конфликте — **следовать Rules/Guidelines текущего проекта**.
2. **HTML prototype** целевого продукта — visual reference; subordinate to Rules/PRD.

Сводка stack-паттернов: [`stack_patterns_from_pulse.md`](./stack_patterns_from_pulse.md)

---

## Что брать из Pulse (принципы)

| Область | Эталон в Pulse | Применение |
|---------|----------------|------------|
| Методология AI-first | `docs/meta/ai_first_project_methodology.md` | Template → project canon |
| Doc registry (волны) | `documentation_creation_registry.md` | Адаптировать под домен |
| Monorepo boundaries | `monorepo_boundaries_contract.md` | Тот же паттерн импортов |
| Layered architecture | domain → policy → db → apps | Обязательно |
| Фазовая декомпозиция | `P{N}_phase_description.md` + tasks | Тот же формат |
| Contracts body | happy/negative/security/race/drift | §2.3.4 registry |
| AGENTS.md | корень + `apps/web/AGENTS.md` | Из template |
| Design Lab | `/design-system` + spec | После P6 |
| Request path | `proxy.ts` → DAL → Prisma | ADR-002 |

---

## Что не копировать слепо

| Аспект | Pulse | Новый проект |
|--------|-------|--------------|
| Продукт | Fitness marketplace | Свой домен (PRD) |
| Роли | client, trainer, admin | Свои роли |
| Domain invariants | timezone, booking, verification | project-context |
| Design tokens | Warm Forest (пример) | Свой design system |
| User flows / schema | Pulse-specific | W1–Wn registry |

---

## Ключевые файлы Pulse для изучения

### Архитектура

- `docs/examples/pulse/docs/prds/architecture_master_index.md`
- `docs/examples/pulse/docs/architecture_learning_pack/01_architecture_overview.md`
- `docs/examples/pulse/docs/implementation/mvp/contracts/monorepo_boundaries_contract.md`

### Реализация (patterns)

- `docs/examples/pulse/apps/web/src/proxy.ts` — request interception + CSP
- `docs/examples/pulse/packages/domain/` — pure business rules
- `docs/examples/pulse/apps/web/src/data/` — DAL naming
- `docs/examples/pulse/.cursor/rules/` — полный набор rules (diff с boilerplate)

### Документация

- `docs/examples/pulse/docs/meta/documentation_creation_registry.md`
- `docs/examples/pulse/docs/implementation/mvp/specs/design_system_lab_spec.md`
- `docs/examples/pulse/docs/guidelines/` — эталонные guides (сравнение с `guidelines/` boilerplate)

---

## Workflow для агента

1. **Перед изобретением паттерна** — grep в `docs/examples/pulse/`
2. **Проверить** соответствующий Guideline + Cursor Rule boilerplate
3. **При расхождении** — следовать boilerplate Rules; при необходимости обновить docs (product-docs-alignment)
4. **General deep dive** — `docs/general/` для теории (XSS, data fetching, a11y, bundle, rendering)

---

## Связанные документы

- [`docs/examples/pulse/README.md`](../examples/pulse/README.md) — snapshot layout
- [`docs/guidelines/README.md`](../guidelines/README.md) — канон реализации
- [`.cursor/rules/README.md`](../../.cursor/rules/README.md) — tier manifest
- [`docs/general/README.md`](../general/README.md) — deep dives → guidelines mapping
- [`docs/meta/ai_first_project_methodology.md`](../meta/ai_first_project_methodology.md)
