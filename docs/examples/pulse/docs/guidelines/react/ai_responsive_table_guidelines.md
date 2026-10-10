# Responsive table guidelines — Pulse (admin)

**Applies to:** Admin moderation (pending trainers, bookings), dense lists  
**UI kit:** shadcn `Table`  
**Cursor rule:** **patterns-tables-dnd**

---

## 1. Principles

- **Desktop (`md+`):** full table with sortable columns where needed
- **Mobile:** card list fallback — same data, stacked layout
- Do not horizontal-scroll wide tables on phone unless unavoidable

---

## 2. Admin table pattern

```tsx
// Desktop: Table
// Mobile: Card with key fields + actions (Approve / Reject)
<div className="hidden md:block">
  <Table>…</Table>
</div>
<ul className="md:hidden space-y-3">
  {rows.map((row) => (
    <li key={row.id} className="rounded-xl border p-4">…</li>
  ))}
</ul>
```

---

## 3. Actions column

- Primary action visible; destructive behind `AlertDialog`
- **`aria-busy`** on row actions during mutation
- Toast on approve/reject (**ui-toast-mutations**)

---

## 4. Empty / loading / error

- **Empty:** illustration + CTA per admin_flow
- **Loading:** skeleton rows matching column layout
- **Error:** `Alert` + retry — not blank screen

---

## 5. Pagination

- Server-side pagination for large queues
- URL `?page=` for shareable admin views

**Reference:** lampto [`ai_responsive_table_guidelines.md`](../../examples/lampto/docs/guidelines/react/ai_responsive_table_guidelines.md)
