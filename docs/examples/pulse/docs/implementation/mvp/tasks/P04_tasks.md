# P04 Tasks — Public Landing

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P04_phase_description.md`](../phases_tasks_descriptions/P04_phase_description.md)  
**Связанные документы:** [`catalog_discovery_spec.md`](../specs/catalog_discovery_spec.md)

---

## Purpose

Чеклист **P04** — landing `/` only.

---

## 1. Landing `/`

- [x] Hero, value props, category chips per wireframe W10-02
- [x] Featured trainers section (approved only or fixture)
- [x] Primary CTA → `/trainers`
- [x] Landing section components (≤140 lines/file)
- [x] Responsive: mobile-first
- [x] `loading.tsx` skeleton where async
- [x] Copy from `@/lib/messages`

## 2. Verification

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] Smoke: CTA → `/trainers`
- [x] One primary CTA on page
- [x] **MUST NOT** implement `/trainers` catalog in this PR

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P04_phase_description.md`](../phases_tasks_descriptions/P04_phase_description.md) | DoD |
| [`P05_tasks.md`](./P05_tasks.md) | Next — catalog |

**Registry:** W16
