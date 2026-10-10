# P14 Tasks — Quality Gate

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 2.1  
**Дата:** 2026-05-25  
**Волна:** W16  
**Зависит от:** [`P14_phase_description.md`](../phases_tasks_descriptions/P14_phase_description.md)  
**Связанные документы:** [`accessibility_requirements.md`](../../../design/accessibility_requirements.md)

---

## Purpose

Чеклист **P14** — a11y, UI states, quality gate. **No new features.**

---

## 1. Accessibility

- [x] Keyboard navigation primary flows
- [x] Focus visible; touch ≥ 44px
- [x] Form labels + `aria-invalid`
- [x] Light/dark contrast (A1-MUST-1…3) — Warm Forest tokens unchanged; spot-check on primary routes
- [x] Skip link `#main-content` — `SkipToMainLink` in `AppShell`, `PublicChrome`, booking layout
- [x] Modals/sheets: focus trap + Esc — Radix/shadcn primitives (existing); no regressions

## 2. UI states audit

- [x] Routes vs [`ui_states_contract.md`](../../../design/ui_states_contract.md)
- [x] empty | loading | error | forbidden per async region
- [x] Forbidden route UI — `ForbiddenShell`; booking detail IDOR → forbidden (not 404)
- [x] Admin UI parity: `/admin/dashboard`, `/admin/complaints`, `/admin/refunds`, `/admin/reviews` — `loading.tsx`/`error.tsx`, shared queue components (P14 implementation)
- [x] Admin trainer detail parity: `/admin/trainers/[id]` — profile card, documents, sticky decision bar, processed/incomplete states
- [x] Admin complaint detail parity: `/admin/complaints/[id]` — detail card, sticky actions, close confirm, processed banners

**Segment `error.tsx` added:** `/client/bookings`, `/client/bookings/[id]`, `/trainer/services`, `/trainer/schedule`, `/book/[trainerId]`.

**Empty states:** catalog (`EmptyMedia`), trainer services, trainer schedule (zero intervals).

**Loading dedup:** `/trainers` Suspense fallback → skeleton only (S1-MUST-5); booking wizard Suspense → `BookingWizardSkeleton`.

## 3. Mutation UX audit

- [x] Pending + `aria-busy` on all mutations (gaps closed: service toggle, delete confirm, schedule rows, dialog triggers, onboarding skip)
- [x] Toasts per rules; optimistic rollback + `toast.error` (auth forms, service toggle network catch, iOS fallback paths)

## 4. Performance & docs

- [x] Lighthouse a11y ≥ 90 on `/`, `/trainers`, `/client/dashboard` — local smoke: **100**, **98**, **100** (2026-05-25)
- [x] Route tree vs [`canonical_routes.md`](../../../design/canonical_routes.md) — no drift; MVP routes unchanged
- [x] Re-verify P01–P13 DoD — no new feature scope; fixes only

## 5. Verification

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] Manual keyboard smoke recorded — see [`P14_phase_description.md`](../phases_tasks_descriptions/P14_phase_description.md) §Quality gate smoke

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P14_phase_description.md`](../phases_tasks_descriptions/P14_phase_description.md) | DoD |
| [`P21_tasks.md`](./P21_tasks.md) | Post-MVP email |

**Registry:** W16

---

## Implementation notes (2026-05-25)

| Area | Key files |
|------|-----------|
| A11y shell | `SkipToMainLink.tsx`, `PageContainer` `id="main-content"`, `globals.css` `prefers-reduced-motion` |
| Forbidden | `ForbiddenShell.tsx`, `resolveClientBookingAccess()` |
| Shared error | `RouteSegmentError.tsx` |
| Messages | `MESSAGES.common.*`, `MESSAGES.shell.skipToContent`, booking/schedule empty & forbidden copy |
