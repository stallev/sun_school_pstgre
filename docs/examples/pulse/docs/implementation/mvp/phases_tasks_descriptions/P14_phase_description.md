# P14 — Quality Gate

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.1  
**Дата:** 2026-05-25  
**Волна:** W16  
**Зависит от:** [`P13_phase_description.md`](./P13_phase_description.md), [`accessibility_requirements.md`](../../../design/accessibility_requirements.md), [`ui_states_contract.md`](../../../design/ui_states_contract.md)  
**Связанные документы:** [`P14_tasks.md`](../tasks/P14_tasks.md), [`ai_semantics_a11y_guidelines.md`](../../../guidelines/react/ai_semantics_a11y_guidelines.md)

---

## Purpose

Фаза **P14** — **quality gate** перед production MVP: WCAG 2.1 AA, UI states audit, performance smoke, doc↔code sync. **No new features** — fix gaps only.

**Аудитория:** AI-агенты финального polish; QA checklist.

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P14_tasks.md`](../tasks/P14_tasks.md) | Checklist |
| 2 | [`accessibility_requirements.md`](../../../design/accessibility_requirements.md) | A1–A4 |
| 3 | [`ui_states_contract.md`](../../../design/ui_states_contract.md) | State matrix |
| 4 | [`interaction_design_contract.md`](../../../design/interaction_design_contract.md) | Toast/pending |
| 5 | [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md) | Form a11y |
| 6 | [`canonical_routes.md`](../../../design/canonical_routes.md) | Route sync |

**Wireframe:** W10 as visual baseline (spot-check).

**MUST NOT read** P21 unless email unlock requested.

---

## Scope / Out of scope

### In scope

| Area | Deliverable |
|------|-------------|
| Accessibility | Keyboard, focus, labels, contrast, touch 44px |
| UI states | empty/loading/error/forbidden all routes P01–P13 |
| Mutation UX | Toast, pending, optimistic rollback audit |
| Performance | Lighthouse smoke: `/`, `/trainers`, `/client/dashboard` |
| Docs sync | Routes vs canonical_routes |

### Out of scope

- Formal VPAT / legal audit
- Full E2E suite
- P21 email (separate phase)

---

## UI Catalog (this phase)

| Action | Component | Notes |
|--------|-----------|-------|
| **USE (audit)** | All prior CREATE | Fix gaps only |
| **MUST NOT** | New domain components | No new features |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P01–P13** complete | Yes | Audit surface |

---

## Happy path smoke

1. Keyboard-only: login → catalog → book → logout — no traps.
2. Screen reader spot-check: one `h1` per route, labeled nav.
3. Theme toggle: contrast passes A1-MUST-3.
4. Primary flows: loading skeleton → content.

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| Network error on catalog | Error state + retry CTA |
| 403 forbidden | Dedicated forbidden UI |
| Form validation | `aria-invalid` + describedby |

---

## Security smoke

| Check | Expected |
|-------|----------|
| Auth error messages | Generic (A3-MUST-4) |
| No sensitive data in toast | |

---

## Concurrency & race check

| Scenario | Expected |
|----------|----------|
| Optimistic rollback | Focus returns; error announced |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Doc ↔ code routes | canonical_routes vs `apps/web/src/app` |
| Missing forbidden state | ui_states_contract audit |
| New features in P14 | Scope guard — fixes only |

---

## Definition of done

- [x] A1–A4 requirements addressed or logged
- [x] All P01–P13 routes have empty/loading/error/forbidden
- [x] Lighthouse a11y smoke ≥ 90 on key routes — local: `/` 100, `/trainers` 98, `/client/dashboard` 100
- [x] `canonical_routes.md` matches app tree
- [x] `typecheck` + lint pass

---

## Quality gate smoke (recorded 2026-05-25)

### Keyboard (happy path)

| Step | Expected | Status |
|------|----------|--------|
| Tab from load | Skip link visible on focus → `#main-content` | ✅ implemented |
| Login form | Labels, focus ring, submit `aria-busy` | ✅ |
| Catalog → profile | Nav landmarks, one `h1` per route | ✅ existing |
| Booking wizard | Step controls keyboard-operable | ✅ Radix/shadcn |
| Modals | Esc closes; focus trapped | ✅ Radix Dialog/Sheet |

### Negative / security

| Scenario | Expected | Status |
|----------|----------|--------|
| Booking detail IDOR | `ForbiddenShell` + CTA `/client/bookings` | ✅ |
| Segment fetch error | `error.tsx` + Retry | ✅ 5 routes added |
| Auth failure | Generic message + inline + `toast.error` | ✅ |
| Optimistic toggle network fail | Rollback + `toast.error` | ✅ |

### Known follow-ups

- Formal VPAT — out of MVP scope per contract.
- Re-run Lighthouse on **Vercel preview** before production promote (local scores: `/` 100, `/trainers` 98, `/client/dashboard` 100).

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P14_tasks.md`](../tasks/P14_tasks.md) | Checklist |
| [`P21_phase_description.md`](./P21_phase_description.md) | Post-MVP email |

---

## Agent notes

- **Одна сессия = P14 only.**
- Re-verify P01–P13 DoD checklists.

---

## Acceptance criteria

- [x] Quality gate smoke recorded
- [x] Known issues = 0 or logged in PR
