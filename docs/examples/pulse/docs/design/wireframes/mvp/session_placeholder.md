# Wireframe: Session Placeholder

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/sessions/[sessionId]` · **Group:** `(session)` · **Prototype:** `c.session` (MVP ≠ video UI)

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | «К деталям бронирования» → `/client/bookings/[id]` |
| **Scope** | MVP placeholder — Daily.co post-MVP |

## Components

`Card`, `Badge` status, `Button`, minimal session header.

## Regions

1. **Session info** — trainer name, service, scheduled time, status badge.
2. **Placeholder panel** — «Видеосессии скоро» — no video player, no Daily.co embed.
3. **CTA** — link to booking detail.

## Guardrails

- **MUST NOT** ship prototype VideoSession UI.
- Owner client only (booking match).

## States

| State | Description |
|-------|-------------|
| happy | Text placeholder |
| loading | Card skeleton |
| error | notFound / Alert |
| forbidden | Non-owner → 403 card |

## Layout

Minimal `(session)` layout — no role bottom nav.

**Registry:** W10-10
