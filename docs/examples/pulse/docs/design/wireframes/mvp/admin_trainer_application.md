# Wireframe: Admin Trainer Application Detail

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/admin/trainers/[id]` (when `trainer_profile.status = pending`) · **Prototype:** —

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | «Одобрить» (default Button) |
| **Secondary** | «Отклонить» (destructive outline + reason required) |
| **Spec** | [`admin_verification_spec.md`](../../../implementation/mvp/specs/admin_verification_spec.md) |
| **Approved / rejected ops** | [`admin_trainer_approved_detail.md`](./admin_trainer_approved_detail.md) (W10-30) — same URL, other statuses |

## Components

Profile summary, document download links, certificate list, `Textarea` admin comment, `Button`, `Form` rejection reason.

## Regions

1. **Applicant summary** — all onboarding fields read-only.
2. **Documents** — downloadable blobs (policy-gated).
3. **Decision panel** — Approve | Reject + reason field.
4. **Mobile** — MAY use full-page; desktop dedicated page.

## Guardrails

- Reject requires min-length reason.
- toast.success on approve; queue revalidation.

## States

| State | Description |
|-------|-------------|
| happy | Full application |
| loading | Action pending aria-busy |
| error | APPLICATION_INCOMPLETE Alert |
| forbidden | Non-admin |

**Registry:** W10-25
