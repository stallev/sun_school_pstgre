# Wireframe: Client Dashboard

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.1 | **Дата:** 2026-05-25 | **Волна:** W10  
**Route:** `/client/dashboard` · **Prototype:** `c.home`

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | «Найти тренера» or next session card tap |
| **Flow** | client_flow § Dashboard |

## Components

`Card`, search entry, category chips, next session row, `Skeleton`, BottomNav + Sidebar.

## Regions

1. **Greeting** — «Привет, {name}».
2. **Search** — pill affordance → `/trainers`.
3. **Main column (`lg:` 2/3)** — next session card; **Top trainers** grid (6 cards, `SectionHeader` + «Все →»).
4. **Sidebar (`lg:` 1/3)** — category tiles (`grid-cols-3` below `lg`, `grid-cols-2` in sidebar).
5. **Platform stats** — P1 (sidebar); tip card removed from default happy path.

## States

| State | Description |
|-------|-------------|
| happy | Greeting, search, next session (or empty CTA), top trainers, categories |
| empty session | Calendar icon + journey copy + «Найти тренера» |
| empty trainers | Section header + catalog CTA |
| loading | Region skeletons matching layout breakpoints |
| error | Section-level Retry |
| forbidden | Non-client redirect |

## Tablet (768–1023px)

Single column `space-y-6 pb-6` — **same flow as mobile** (categories after top trainers, not sidebar).  
App shell sidebar nav is visible (`md:`), but dashboard content stays one column until `lg:`.

**Note:** HTML prototype uses `md:grid-cols-3` in a full-width canvas without app sidebar — **do not** copy `md:` grid in authenticated shell.

## Desktop (`≥ lg`, 1024px)

`lg:grid lg:grid-cols-3 lg:gap-6` — main 2 col + sidebar 1 col.  
Top trainers: `lg:grid-cols-2` inside main column.

## Mobile (`< md`)

Single column `space-y-6 pb-6` above BottomNav.

**Registry:** W10-11
