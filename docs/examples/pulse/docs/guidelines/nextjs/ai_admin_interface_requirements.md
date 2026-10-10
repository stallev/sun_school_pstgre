# Admin Interface Requirements — Pulse

**Version:** 1.0 · **Applies to:** Admin surfaces (`/admin/**`)  
**User flow:** [`admin_flow.md`](../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md)  
**Cursor rule:** **admin-forms-layout**

---

## 1. Overview

Layout and styling requirements for admin UI — consistent, readable, mobile-capable moderation workflows.

---

## 2. Buttons

- **Width:** content-sized — `w-auto` / default `inline-flex`
- **No `w-full`** on Submit/Cancel/Approve/Reject unless narrow modal primary
- **Groups:** `flex flex-wrap gap-2`

---

## 3. Input fields

| Type | Max width |
|------|-----------|
| Short text (name, email, slug) | **300px** (`max-w-[300px]`) |
| Long text (rejection reason, notes) | **650px** (`max-w-[650px]`) |

Grid: `grid grid-cols-1 gap-4 sm:grid-cols-2` or `flex flex-wrap gap-4`.

---

## 4. Form layout

- Spacing: `space-y-4` / `space-y-6` between sections
- Group related fields (trainer verification checklist)
- Label + Control from shadcn Form primitives

---

## 5. Moderation UX

- **Approve:** single-step with toast confirmation
- **Reject:** require reason (textarea) + confirm dialog
- Destructive actions — **no optimistic UI**

---

## 6. Tables

See [ai_responsive_table_guidelines.md](../react/ai_responsive_table_guidelines.md) — card fallback on mobile.

---

## Summary

| Element | Rule |
|---------|------|
| Buttons | Content width, wrap groups |
| Short inputs | max 300px |
| Long inputs | max 650px |
| Destructive | Confirm + no optimistic |

**Reference:** lampto [`ai_admin_interface_requirements.md`](../../examples/lampto/docs/guidelines/nextjs/ai_admin_interface_requirements.md)
