---
description: Tables and drag-and-drop — responsive patterns and @dnd-kit
paths:
  - "apps/web/src/components/ui/table.tsx"
  - "apps/web/src/app/**/admin/**"
---
# Tables and DnD

When extending **tables**, **sortable rows**, or **drag-and-drop**, follow:

- [`ai_responsive_table_guidelines.md`](docs/guidelines/react/ai_responsive_table_guidelines.md) — responsive tables, dense list patterns (admin moderation queues).
- Drag & drop — **@dnd-kit** when dependencies installed (trainer schedule ordering — post-MVP if not in scope).

Do not copy HTML prototype pixel-perfect — **shadcn Table** and guides define structure.

**Admin surfaces** (Pulse: pending trainers, bookings list, user search) — mobile card fallback per guidelines.

Reference: Pulse (docs/examples/pulse) `patterns-tables-dnd.mdc`.
