# Wireframe: Trainer Profile Edit

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/trainer/profile` · **Prototype:** —

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | «Сохранить изменения» |
| **Spec** | trainer_onboarding_spec (edit mode) |

## Components

`Form`, `PhotoSlot`, `Textarea`, chips, certificate list, `Button`, file upload.

## Regions

1. **Public fields** — photo, bio, city, timezone, specializations.
2. **Certificates** — list + add/remove (re-verification MAY trigger — contract).
3. **Save** — toast success or `?saved=1` redirect pattern.

## Guardrails

- Timezone change affects slots (warning copy).
- Pending trainers can edit; public listing still hidden.
- **`city`** — deferred (no DDL); not in P11 form.
- **Cert edit after approval** — MVP P11 does not auto-trigger re-verification or status change.

## States

| State | Description |
|-------|-------------|
| happy | Populated form |
| loading | Submit pending |
| error | Field / upload errors |
| forbidden | Non-owner trainer |

**Registry:** W10-17
