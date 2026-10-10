# Wireframe: Admin Complaints List

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/admin/complaints` · **Prototype:** `a.complaints`

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | Row → `/admin/complaints/[id]` |
| **Spec** | [`complaint_refund_spec.md`](../../../implementation/mvp/specs/complaint_refund_spec.md) |

## Components

Priority `Badge`, complaint row, filters stub, `Tabs` status, `Skeleton`.

## Regions

1. **Filters** — priority, status (optional MVP).
2. **List** — id, subject, priority badge, age, status.
3. **Badge** — open count on nav.

## States

| State | Description |
|-------|-------------|
| happy | List |
| empty | «No open complaints» |
| loading | Row skeletons |
| error | Retry |
| forbidden | Non-admin |

**Registry:** W10-26
