# Wireframe: Admin Trainers Queue

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/admin/trainers` · **Prototype:** `a.trainers`

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | Card → `/admin/trainers/[id]` |
| **Spec** | [`admin_verification_spec.md`](../../../implementation/mvp/specs/admin_verification_spec.md) |

## Components

`Tabs` Pending | Approved | Rejected, application `Card`, waiting duration, `Badge`, `Skeleton`.

## Regions

1. **Tabs** — default Pending.
2. **Application grid** — avatar, name, email, specs, «waiting X days».
3. **Nav badge** — pending count on Trainers item.

## States

| State | Description |
|-------|-------------|
| happy | Tab grid |
| empty | «All caught up» positive empty |
| loading | Card skeletons |
| error | Alert + Retry |
| forbidden | Non-admin |

**Registry:** W10-24
