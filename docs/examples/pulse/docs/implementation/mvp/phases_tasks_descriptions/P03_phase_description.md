# P03 — Design System & App Shell

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P02_phase_description.md`](./P02_phase_description.md), [`global_shell_spec.md`](../specs/global_shell_spec.md), [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md)  
**Связанные документы:** [`P03_tasks.md`](../tasks/P03_tasks.md)

---

## Purpose

Фаза **P03** — app shell, route groups, `@/lib/messages`, toast wiring, Design Lab QA, placeholder dashboards. **Значительная часть L2 UI уже в коде** — фаза = верификация + shell + placeholders, не rebuild.

**Аудитория:** AI-агенты после P02.

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P03_tasks.md`](../tasks/P03_tasks.md) | Checklist |
| 2 | [`global_shell_spec.md`](../specs/global_shell_spec.md) | Layout tree |
| 3 | [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md) | Lab + inventory |
| 4 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P03 row |
| 5 | [`canonical_routes.md`](../../../design/canonical_routes.md) | Route groups |
| 6 | [`fitness-platform-design-system.md`](../../../default_docs/fitness-platform-design-system.md) | Tokens |

**Wireframe:** shell regions per global_shell_spec.

**MUST NOT read** P04+ feature phase docs.

---

## Scope / Out of scope

### In scope

| Area | Deliverable |
|------|-------------|
| Shell | `AppShell`, TopBar, BottomNav, SidebarNav, `PageContainer` |
| Route groups | `(public)`, `(client)`, `(trainer)`, `(admin)`, `(booking)`, `(session)` |
| Providers | ThemeProvider, Toaster, fonts |
| Messages | `@/lib/messages`, `product-toast.ts` |
| Placeholders | Role dashboards empty states |
| Design Lab | `/design-system` QA 390px/md/light/dark |

### Out of scope

- Landing/catalog content (→ **P04–P06**)
- Booking/trainer feature UI (→ **P07+**)

---

## UI Catalog (this phase)

| Action | Component | Notes |
|--------|-----------|-------|
| **CREATE** | `AppShell`, `TopBar`, `BottomNav`, `SidebarNav`, `NavItem` | `components/shell/` |
| **USE** | Atoms, `Button`, `PulseCard`, `CustomLink`, shadcn baseline | Verify existing |
| **MUST NOT** | Import `@/components/design-lab/**` in product | Lab-only |
| **MUST NOT** | Domain molecules (`TrainerCard`, etc.) | → P04+ |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P02** auth + proxy | Yes | Protected groups |
| Existing L2 in repo | No | Verify, don't rewrite |

---

## In-scope routes

Shell + placeholders per [`canonical_routes.md`](../../../design/canonical_routes.md). Landing `/` — minimal hero (full **P04**).

---

## Happy path smoke

1. Login as client → shell visible (TopBar + BottomNav `< md`).
2. Trainer pending → banner slot on dashboard.
3. Admin → sidebar nav `≥ md`.
4. `/design-system` — Lab loads; production guard.
5. Theme toggle + Sonner on test path.

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| Missing fonts/tokens | Visual regression vs prototype |

---

## Security smoke

| Check | Expected |
|-------|----------|
| `/design-system` in production | Guarded/disabled per spec |

---

## Concurrency & race check

N/A — read-only shell phase.

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| design-lab imports in product | Grep CI |
| Prototype drift | Lab spot-check |
| Rebuild existing Button/PulseCard | P03 = verify only |
| Duplicate nav route lists | Nav config module only |

---

## Definition of done

- [x] Shell per global_shell_spec
- [x] All route groups + placeholder pages
- [x] Messages + toast wired
- [x] Design Lab QA passed
- [x] `typecheck` + lint pass

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P03_tasks.md`](../tasks/P03_tasks.md) | Checklist |
| [`P04_phase_description.md`](./P04_phase_description.md) | Next — landing |

---

## Agent notes

- **Одна сессия = P03 only.**
- Mark existing Lab checklist items done where already implemented.

---

## Acceptance criteria

- [x] Shell renders all roles
- [x] No feature catalog/booking UI in PR
