# Wireframe: Trainer Registration (Onboarding)

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/auth/register/trainer` · **Prototype:** — (multi-step, not in HTML prototype)

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | Step «Далее» / final «Отправить заявку» |
| **Spec** | [`trainer_onboarding_spec.md`](../../../implementation/mvp/specs/trainer_onboarding_spec.md) |

## Components

Progress bar, `Form`, `PhotoSlot`, `Textarea`, multi-select chips, certificate repeater, service repeater, `Button` Back/Next.

## Regions (5 steps)

1. **Personal** — photo, timezone (required).
2. **Professional** — bio, specializations, experience.
3. **Certificates** — repeater + file upload slots.
4. **Services** — ≥1 service (name, duration, price).
5. **Preview** — summary + submit → pending status.

## Guardrails

- Timezone MUST be set (ADR-004).
- Blob upload per file_upload_contract.
- Success → `/trainer/dashboard` + «Under review» banner.

## States

| State | Description |
|-------|-------------|
| happy | Current step form |
| loading | Step transition / upload pending |
| error | Field + toast; upload failure |
| forbidden | Non-trainer role |

## Mobile

Full-screen step; progress `h-1`; Back/Next footer sticky.

## Desktop

`max-w-2xl mx-auto`; same step flow.

**Registry:** W10-07
