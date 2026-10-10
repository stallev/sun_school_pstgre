# Wireframe: Trainer Client Detail

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/trainer/clients/[id]` · **Prototype:** —

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | Auto-save notes (debounced) — no separate submit |
| **Privacy** | [`privacy_data_handling.md`](../../../prds/04_authorization_privacy/privacy_data_handling.md) |

## Components

`Avatar`, session history list, `Textarea` private notes, `Badge`, `Skeleton`.

## Regions

1. **Client header** — display name only (no full PII beyond name).
2. **Session history** — past bookings with this trainer.
3. **Private notes** — trainer-only textarea; auto-save indicator.

## Guardrails

- Notes never public; not shown to client.
- IDOR — trainer must have relationship via bookings.

## States

| State | Description |
|-------|-------------|
| happy | History + notes |
| loading | Skeleton |
| error | Notes save toast.error |
| forbidden | No relationship → 403 |

**Registry:** W10-21
