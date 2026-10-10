# Accessibility Requirements — Pulse MVP

**Тип:** UX Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W2  
**Зависит от:** [`ux_ui_principles.md`](./ux_ui_principles.md), [`ai_semantics_a11y_guidelines.md`](../guidelines/react/ai_semantics_a11y_guidelines.md)  
**Связанные документы:** [`visual_identity_contract.md`](./visual_identity_contract.md), [`responsive_navigation_contract.md`](./responsive_navigation_contract.md)

**Migrated from:** `fitness-platform-design-system.md` §15 Checklist; extends guidelines as **product-level WCAG contract**

---

## Purpose

Обязательные **требования доступности WCAG 2.1 AA** для Pulse MVP: perceivable, operable, understandable, robust. Product canon для wireframes (W10), QA (P07), и code review.

**Enforcement:** Cursor Rule `ui-semantics-a11y`; implementation details — [`ai_semantics_a11y_guidelines.md`](../guidelines/react/ai_semantics_a11y_guidelines.md).

---

## Scope / Out of scope

**In scope:** contrast, keyboard, touch targets, semantics, forms, motion, checklist per release.

**Out of scope:** formal VPAT/legal compliance audit; automated CI axe setup (→ P07); localization RTL (post-MVP).

---

## Target standard

| Standard | Level |
|----------|-------|
| WCAG | **2.1 AA** |
| Touch (mobile) | **44×44 CSS px** minimum (WCAG 2.5.5 target size) |
| Motion | `prefers-reduced-motion: reduce` respected |

---

## Requirements / Rules

### A1 — Perceivable

| ID | MUST/SHOULD | Rule |
|----|-------------|------|
| A1-MUST-1 | MUST | Text contrast ≥ **4.5:1**; large text (≥18pt / 14pt bold) ≥ **3:1** |
| A1-MUST-2 | MUST | UI components & graphical objects ≥ **3:1** against adjacent colors |
| A1-MUST-3 | MUST | Verify **light and dark** themes — Warm Forest tokens |
| A1-MUST-4 | MUST | Informative images — meaningful `alt`; decorative — `alt=""` |
| A1-SHOULD-1 | SHOULD | Status not by color alone — icon + text (booking status, badges) |

### A2 — Operable

| ID | MUST/SHOULD | Rule |
|----|-------------|------|
| A2-MUST-1 | MUST | All functionality operable via **keyboard** (except true path gestures) |
| A2-MUST-2 | MUST | **Focus visible** — `focus-visible:ring-*`; never remove outline without replacement |
| A2-MUST-3 | MUST | Touch targets ≥ **44×44px** on mobile — nav, icon buttons, toggles |
| A2-MUST-4 | MUST | Modals/sheets — Radix focus trap; Esc closes; restore focus on close |
| A2-MUST-5 | MUST | No keyboard trap outside intentional dialogs |
| A2-SHOULD-1 | SHOULD | Skip link to `#main-content` on authenticated layouts |

### A3 — Understandable

| ID | MUST/SHOULD | Rule |
|----|-------------|------|
| A3-MUST-1 | MUST | Every input — visible `<Label>` or `aria-label` from `@/lib/messages` |
| A3-MUST-2 | MUST | Errors — inline text + `aria-invalid` + `aria-describedby` / FieldError |
| A3-MUST-3 | MUST | Consistent nav order/labels per role across breakpoints |
| A3-MUST-4 | MUST | Auth errors — generic message (no account enumeration) |
| A3-SHOULD-1 | SHOULD | Page `<title>` reflects route purpose |

### A4 — Robust

| ID | MUST/SHOULD | Rule |
|----|-------------|------|
| A4-MUST-1 | MUST | Valid landmark structure: one `main`, labeled `nav` regions |
| A4-MUST-2 | MUST | One `h1` per route — [`typography_text_guidelines.md`](../guidelines/typography_text_guidelines.md) |
| A4-MUST-3 | MUST | Prefer shadcn/Radix for tabs, dialog, select — tested ARIA |
| A4-MUST-4 | MUST | No duplicate `id` on page |

### A5 — Motion & animation

| ID | MUST/SHOULD | Rule |
|----|-------------|------|
| A5-MUST-1 | MUST | `@media (prefers-reduced-motion: reduce)` — disable non-essential transitions |
| A5-SHOULD-1 | SHOULD | Sheet slide-up — instant or minimal when reduced motion |

Prototype CSS pattern (also in design system):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### A6 — Mutations & live regions

| ID | MUST/SHOULD | Rule |
|----|-------------|------|
| A6-MUST-1 | MUST | Submit buttons — `aria-busy={pending}` during mutation |
| A6-MUST-2 | MUST | Icon-only buttons — `aria-label` (messages), icon `aria-hidden` |
| A6-MUST-3 | MUST | Toggle wishlist — `aria-pressed` |
| A6-SHOULD-1 | SHOULD | Toast (Sonner) for mutation feedback — not sole channel for critical errors on forms (inline too) |

---

## Semantic page shell (MUST)

```text
header     — app chrome
nav        — aria-label="Primary" (bottom or sidebar)
main#main-content — route content (one per view)
footer     — optional minimal
```

Multiple nav regions — distinct `aria-label`: `"Primary"`, `"Breadcrumb"`, `"Account"`.

---

## Role-specific checklist highlights

| Area | Requirement |
|------|-------------|
| **Catalog cards** | Entire card clickable — one focusable target or heading link; wishlist button separate labeled control |
| **Booking wizard** | Step indicator accessible name; date/slot grid keyboard selectable |
| **Trainer schedule** | Grid cells — name/role for screen readers |
| **Admin tables** | Column headers; sort `aria-sort`; row action `aria-label` |
| **Approve/Reject** | Distinct labels; confirm dialog traps focus |

---

## Happy paths

1. Keyboard-only user: login → catalog → profile → book → confirm — full path without mouse.
2. Screen reader: landmarks announce Client shell; active nav item discernible.
3. Reduced motion user: theme toggle and sheet open without long animations.

---

## Negative paths

| Scenario | Accessible UX |
|----------|---------------|
| Form validation fail | Focus first invalid field; error text associated |
| 403 forbidden | Clear heading + link — not blank page |
| Loading | Skeleton or `aria-busy` region — not silent empty |
| Toast error | Readable message; sufficient duration (`PRODUCT_TOAST_DURATION_MS`) |

---

## Security paths

| Scenario | A11y note |
|----------|-----------|
| Generic login error | Same message for wrong email/password — do not expose via `aria-live` detail |
| IDOR 404 | Page title «Not found» — no leaking private IDs in spoken text unnecessarily |

---

## Concurrency notes

`aria-busy` prevents double submit — pairs with visual disabled state (`ui-mutation-pending`).

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| div-onClick buttons | Guidelines forbid — review checklist |
| Contrast break on dark mode | Visual QA both themes before merge |
| Prototype non-semantic HTML | Production must use semantic/Radix patterns |

---

## Pre-merge agent checklist

- [ ] Page outline: one h1, logical heading order
- [ ] Tab through primary flow — focus visible
- [ ] Icon-only controls named
- [ ] Form errors: `aria-invalid` + visible text
- [ ] Mobile touch targets ≥ 44px on primary nav/actions
- [ ] Light + dark contrast spot-check on primary text/surfaces
- [ ] `prefers-reduced-motion` CSS present in globals

---

## Acceptance criteria

- [ ] WCAG 2.1 AA requirements table A1–A6 with MUST/SHOULD
- [ ] Touch 44px and reduced motion explicit
- [ ] Happy / negative / security sections present
- [ ] Links to guidelines as enforcement layer
- [ ] Backlink in `ux_ui_principles.md`

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`ux_ui_principles.md`](./ux_ui_principles.md) | UX principles reference a11y |
| [`visual_identity_contract.md`](./visual_identity_contract.md) | Contrast tokens |
| [`responsive_navigation_contract.md`](./responsive_navigation_contract.md) | Nav touch targets |
| [`ai_semantics_a11y_guidelines.md`](../guidelines/react/ai_semantics_a11y_guidelines.md) | Code patterns |
| [`typography_text_guidelines.md`](../guidelines/typography_text_guidelines.md) | Heading hierarchy |
| [`ai_form_handling_pattern.md`](../guidelines/react/ai_form_handling_pattern.md) | Form a11y |
| *(planned)* [`ui_states_contract.md`](./ui_states_contract.md) | State UX (W7) |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W2-04

---

## Agent notes

- WCAG AAA not required for MVP unless trivially achievable.
- Automated axe in CI — P07 scope; manual checklist still required per feature.
- Video room (post-MVP) will need captions/transcript ADR — out of W2.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-25 | P14 implementation — a11y shell, forbidden UI, segment errors, mutation UX audit |
| 2026-05-23 | v1.0 — accessibility requirements (W2-04) |
