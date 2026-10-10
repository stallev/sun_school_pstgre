# PRD — Product Requirements & Architecture (Pulse)

Каталог содержит канонические документы по продукту, данным, безопасности и runtime для **Pulse**.

**Точка входа:** [`architecture_master_index.md`](architecture_master_index.md)

**Методология:** [`docs/meta/ai_first_project_methodology.md`](../meta/ai_first_project_methodology.md)

**Реестр документации:** [`docs/meta/documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — волны W0–W14 **complete**

**Interim PRD (archive):** [`docs/default_docs/`](../default_docs/) — read-only; канон в `prds/`

**Референс архитектуры:** [`docs/reference/lampto_project_reference.md`](../reference/lampto_project_reference.md)

---

## Статус слоёв

| Слой | Каталог | Статус | Ключевые документы |
|------|---------|--------|-------------------|
| Product Scope | [`01_product_scope/`](01_product_scope/) | **Canonical** | `mvp_scope`, `pages_functional_spec`, user flows |
| Domain Model | [`02_domain_model/`](02_domain_model/) | **Canonical** | lifecycle, FM catalog, invariants, use cases |
| Data Model | [`03_data_model/`](03_data_model/) | **Canonical** | `database_schema_v1`, access patterns, indexes, seed |
| Authorization | [`04_authorization_privacy/`](04_authorization_privacy/) | **Canonical** | matrix, policy contract, privacy |
| Runtime | [`05_runtime/`](05_runtime/) | **Canonical** | backend, monorepo, auth runtime, cache |
| Operations | [`06_operations/`](06_operations/) | **Canonical** | migration runbook, observability, cron registry |
| Governance | [`07_governance/`](07_governance/) | **Canonical** | ADR-001–007 ACCEPTED, decision process |

**Design & implementation** (см. [`architecture_master_index.md`](architecture_master_index.md) §10–12): UX contracts, wireframes, contracts, specs, phases **P01–P14** MVP + **P16–P18, P21** post-P14, guides — **Canonical**.

---

## Созданные документы по волнам

| Волна | Содержимое |
|-------|------------|
| W1 | Product scope PRD, ADR index, decision process |
| W3 | Domain model (lifecycle, FM, invariants, use cases) |
| W4 | ADR-003–007 |
| W5 | Authorization + runtime PRD |
| W6 | Data model supplements |
| W8–W9 | Implementation contracts + specs |
| W10 | Wireframes MVP |
| W11 | Phase descriptions P01–P07 + tasks *(superseded by W16)* |
| W16 | Phase restructure P01–P15 + UI matrix + migration doc |
| W22 | P16 landing v2; renumber P15→P21, P20→P17; Admin People Ops → P18 |
| W23 | Complaint Resolution v2 P17→P19 |
| W24 | P17 UI i18n (EN/RU): ADR-009, i18n contract, phase/tasks |
| W12 | Operations + guides |
| W13 | Architecture learning pack (layer walkthroughs) |
| W14 | Final index sync (этот каталог + master index) |

---

## Следующий шаг

**P01 implementation** — [`../implementation/mvp/phases_tasks_descriptions/P01_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P01_phase_description.md) + [`P01_tasks.md`](../implementation/mvp/tasks/P01_tasks.md).

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W14 complete
