# Wireframe: Admin Dashboard

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/admin/dashboard` · **Prototype:** `a.home`

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | Needs-attention row → queue route |
| **Flow** | admin_flow § Overview |

## Components

KPI grid (4), needs-attention action list, statistics card, nav badges.

## Regions

1. **Title** — «Control» + period sublabel.
2. **KPI grid** — signups, queue, complaints, GMV (semantic container colors).
3. **Needs attention** — rows with chevron to trainers/complaints/refunds.
4. **Statistics** — secondary metrics card.

## States

| State | Description |
|-------|-------------|
| happy | KPI + attention list |
| empty | Zero queues — positive copy |
| loading | KPI skeleton |
| error | Section Retry |
| forbidden | Non-admin |

## Desktop

KPI `md:grid-cols-4`; full-width attention card.

**Registry:** W10-23
