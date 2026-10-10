# Migration — Phase Renumbering P17 → P19 (W23)

**Тип:** Migration note  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-25  
**Волна:** W23  
**Предшествует:** [`_migration_P15-P20_renumbering.md`](./_migration_P15-P20_renumbering.md)

---

## Purpose

Перенумеровать **Complaint Resolution v2** с **P17** на **P19**, освободив **P17** как slot между P16 (landing) и P18 (people ops). Slot **P17** allocated **W24** → UI i18n (EN/RU) — [`P17_phase_description.md`](./P17_phase_description.md).

**Аудитория:** AI-агенты, product, ops.

---

## Renumbering table

| Old ID | New ID | Title | Notes |
|--------|--------|-------|-------|
| **P17** | **P19** | Complaint Resolution v2 | ADR-008; checked tasks preserved |
| **P19** *(reserved)* | **P17** | UI i18n EN/RU *(W24)* | Was reserved W22–W23 |

**Unchanged:** P01–P16, P18, P21. Historical chain: P20 (W17) → P17 (W22) → **P19** (W23).

---

## File renames (git mv)

| From | To |
|------|-----|
| `P17_phase_description.md` | `P19_phase_description.md` |
| `P17_tasks.md` | `P19_tasks.md` |

---

## Cross-reference sweep (mandatory)

| Pattern | Replace with |
|---------|--------------|
| `P17_phase_description` / `P17_tasks` (complaints) | `P19_*` |
| Complaint scope «P17» in ADR/specs/flows | **P19** |
| «P19 reserved» (post-P14 slot) | **P17 reserved** |
| Matrix row «P17 — Complaint Resolution v2» | **P19** row |
| Matrix row «P19 — Reserved» | **P17** row |

**High-touch files:** `documentation_creation_registry.md`, `AGENTS.md`, `pulse-project-context.mdc`, `ui_component_phase_matrix.md`, `architecture_master_index.md`, `adr_008_complaint_resolution_model.md`, `complaint_refund_spec.md`, `admin_flow.md`, `admin_complaint_detail.md`, `ai_first_project_methodology.md`.

---

## Agent rules

1. **One session = one phase** — do not mix P16 landing replace with P19 complaint work.
2. **Branch/commit messages** mentioning P17 for complaints map to **P19** after W23.
3. **P17** — UI i18n (W24) — see [`P17_phase_description.md`](./P17_phase_description.md); slot was reserved W22–W23 after complaints moved to P19.

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P17_phase_description.md`](./P17_phase_description.md) | W24 — UI i18n (slot after W23 renumber) |
| [`P19_phase_description.md`](./P19_phase_description.md) | Was P17 (was P20) |
| [`P19_tasks.md`](../tasks/P19_tasks.md) | Was P17 tasks |
| [`_migration_P15-P20_renumbering.md`](./_migration_P15-P20_renumbering.md) | Prior W22 renumbering |

**Registry:** W23
