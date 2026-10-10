# Wireframe Route Index — Pulse MVP

**Тип:** Wireframe  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W10  
**Зависит от:** [`canonical_routes.md`](../canonical_routes.md), [`prototype_route_mapping.md`](../prototype_route_mapping.md)  
**Связанные документы:** [`_page_template.md`](./_page_template.md), [`pages_functional_spec.md`](../../prds/01_product_scope/pages_functional_spec.md)

---

## Purpose

Единый индекс: **canonical path** → **wireframe file** → **prototype screen** → **implementation phase**. Не дублирует полный route tree — см. [`canonical_routes.md`](../canonical_routes.md).

---

## Index

| Path | Wireframe | Prototype | Phase | Spec / flow |
|------|-----------|-----------|-------|-------------|
| `/` | [`mvp/public_landing.md`](./mvp/public_landing.md) | [`Pulse Landing Page -Standalone-.html`](../../prototypes/Pulse Landing Page -Standalone-.html) | P16 | [`public_landing_spec.md`](../../implementation/mvp/specs/public_landing_spec.md) |
| `/trainers` | [`mvp/public_trainers_catalog.md`](./mvp/public_trainers_catalog.md) | `c.catalog` | P02 | catalog_discovery_spec |
| `/trainers/[id]` | [`mvp/public_trainer_profile.md`](./mvp/public_trainer_profile.md) | `c.trainer` | P02 | catalog_discovery_spec |
| `/auth/login` | [`mvp/auth_login.md`](./mvp/auth_login.md) | — | P02 | auth_runtime_spec |
| `/auth/register` | [`mvp/auth_register_client.md`](./mvp/auth_register_client.md) | — | P02 | client_flow § Onboarding |
| `/auth/register/trainer` | [`mvp/auth_register_trainer.md`](./mvp/auth_register_trainer.md) | — | P04 | trainer_onboarding_spec |
| `/book/[trainerId]` | [`mvp/booking_wizard.md`](./mvp/booking_wizard.md) | `c.book` | P03 | booking_wizard_spec |
| `/book/[trainerId]/confirm` | [`mvp/booking_confirm.md`](./mvp/booking_confirm.md) | — | P03 | booking_wizard_spec (optional split) |
| `/sessions/[sessionId]` | [`mvp/session_placeholder.md`](./mvp/session_placeholder.md) | `c.session`* | P03 | mvp_scope (placeholder) |
| `/client/dashboard` | [`mvp/client_dashboard.md`](./mvp/client_dashboard.md) | `c.home` | P02 | client_flow |
| `/client/bookings` | [`mvp/client_bookings_list.md`](./mvp/client_bookings_list.md) | `c.bookings` | P03 | client_flow |
| `/client/bookings/[id]` | [`mvp/client_booking_detail.md`](./mvp/client_booking_detail.md) | — | P03 | booking_lifecycle_contract |
| `/client/reviews/[bookingId]` | [`mvp/client_review_form.md`](./mvp/client_review_form.md) | — | P03 | review_moderation_contract |
| `/client/profile` | [`mvp/client_profile.md`](./mvp/client_profile.md) | `c.profile` | P17 (language row) | client_flow |
| `/trainer/dashboard` | [`mvp/trainer_dashboard.md`](./mvp/trainer_dashboard.md) | `t.home` | P04 | trainer_flow |
| `/trainer/profile` | [`mvp/trainer_profile_edit.md`](./mvp/trainer_profile_edit.md) | — | P04 | trainer_onboarding_spec |
| `/trainer/services` | [`mvp/trainer_services.md`](./mvp/trainer_services.md) | `t.services` | P04 | trainer_flow |
| `/trainer/schedule` | [`mvp/trainer_schedule.md`](./mvp/trainer_schedule.md) | `t.schedule` | P04 | trainer_schedule_spec |
| `/trainer/clients` | [`mvp/trainer_clients_list.md`](./mvp/trainer_clients_list.md) | `t.clients` | P04 | trainer_flow |
| `/trainer/clients/[id]` | [`mvp/trainer_client_detail.md`](./mvp/trainer_client_detail.md) | — | P04 | privacy_data_handling |
| `/trainer/income` | [`mvp/trainer_income.md`](./mvp/trainer_income.md) | `t.income` | P04 | mvp_scope |
| `/admin/dashboard` | [`mvp/admin_dashboard.md`](./mvp/admin_dashboard.md) | `a.home` | P05 | admin_flow |
| `/admin/trainers` | [`mvp/admin_trainers_queue.md`](./mvp/admin_trainers_queue.md) | `a.trainers` | P05 | admin_verification_spec |
| `/admin/trainers/[id]` | [`mvp/admin_trainer_application.md`](./mvp/admin_trainer_application.md) (`pending`) · [`mvp/admin_trainer_approved_detail.md`](./mvp/admin_trainer_approved_detail.md) (`approved`) | — | P05 / **P18** | admin_verification_spec · admin_people_ops_spec |
| `/admin/clients` | [`mvp/admin_clients_registry.md`](./mvp/admin_clients_registry.md) | — | **P18** | admin_people_ops_spec |
| `/admin/clients/[id]` | [`mvp/admin_client_detail.md`](./mvp/admin_client_detail.md) | — | **P18** | admin_people_ops_spec |
| `/admin/complaints` | [`mvp/admin_complaints_list.md`](./mvp/admin_complaints_list.md) | `a.complaints` | P05 | complaint_refund_spec |
| `/admin/complaints/[id]` | [`mvp/admin_complaint_detail.md`](./mvp/admin_complaint_detail.md) | — | P05 | complaint_refund_spec |
| `/admin/refunds` | [`mvp/admin_refunds.md`](./mvp/admin_refunds.md) | `a.refunds` | P05 | complaint_refund_spec |
| `/admin/reviews` | [`mvp/admin_reviews_moderation.md`](./mvp/admin_reviews_moderation.md) | — | P05 | review_moderation_contract |

\* Prototype `c.session` = post-MVP video UI; MVP wireframe = text placeholder only.

---

## Template

New screens: copy [`_page_template.md`](./_page_template.md).

---

## Acceptance criteria

- [ ] Every MVP route in canonical_routes (✅) has wireframe row
- [ ] No duplicate path definitions outside canonical_routes
- [ ] Prototype gaps flagged with — in Prototype column

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`canonical_routes.md`](../canonical_routes.md) | Path inventory |
| [`prototype_route_mapping.md`](../prototype_route_mapping.md) | Prototype ↔ route |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W10-01
