# Design docs — Pulse

Канонический слой UX/UI: принципы, контракты, wireframes и маппинг прототипа.

**Prototype (visual reference):** [`../prototypes/Fitness_Platform_Prototype_v1.html`](../prototypes/Fitness_Platform_Prototype_v1.html)

**Routes (single inventory):** [`canonical_routes.md`](canonical_routes.md) — не дублировать маршруты в других файлах.

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — волны W2, W7, W10, **W14 complete**

---

## UX/UI contracts (Canonical)

| Document | Wave | Назначение |
|----------|------|------------|
| [`ux_ui_principles.md`](ux_ui_principles.md) | W2 | Progressive Disclosure, Zero Dead Ends, One Primary Action |
| [`responsive_navigation_contract.md`](responsive_navigation_contract.md) | W2 | Bottom nav / sidebar, breakpoints |
| [`visual_identity_contract.md`](visual_identity_contract.md) | W2 | Warm Forest tokens → shadcn |
| [`accessibility_requirements.md`](accessibility_requirements.md) | W2 | WCAG 2.1 AA |
| [`prototype_route_mapping.md`](prototype_route_mapping.md) | W2 | Prototype screen → canonical route |
| [`interaction_design_contract.md`](interaction_design_contract.md) | W7 | Toast, optimistic UI, confirm dialogs |
| [`ui_states_contract.md`](ui_states_contract.md) | W7 | Empty / loading / error / forbidden |
| [`forms_and_validation_ux.md`](forms_and_validation_ux.md) | W7 | Field errors, submit pending |
| [`content_and_microcopy_contract.md`](content_and_microcopy_contract.md) | W7 | Tone, `@/lib/messages` |
| [`styleguide.md`](styleguide.md) | W7 | shadcn component recipes (Warm Forest) |

**Interim archive:** [`../default_docs/fitness-platform-design-system.md`](../default_docs/fitness-platform-design-system.md) — superseded by `visual_identity_contract` + `styleguide`.

---

## Wireframes MVP (Canonical — W10)

| Document | Назначение |
|----------|------------|
| [`wireframes/route_index.md`](wireframes/route_index.md) | Path → wireframe mapping |
| [`wireframes/_page_template.md`](wireframes/_page_template.md) | Template for new screens |
| [`wireframes/mvp/`](wireframes/mvp/) | 28 MVP screen wireframes (public, auth, client, trainer, admin) |

---

## Enforcement layer

Cursor Rules + Guidelines — см. [`../guidelines/README.md`](../guidelines/README.md). UX contracts ссылаются на них; не дублировать нормы реализации в design docs.

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`../prds/01_product_scope/pages_functional_spec.md`](../prds/01_product_scope/pages_functional_spec.md) | Page behavior |
| [`../implementation/mvp/specs/global_shell_spec.md`](../implementation/mvp/specs/global_shell_spec.md) | App shell implementation |
| [`../prds/architecture_master_index.md`](../prds/architecture_master_index.md) | §10 Design layer |
