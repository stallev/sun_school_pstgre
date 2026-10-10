# Semantic markup & accessibility — Pulse

Norms for **semantic HTML** and **WCAG 2.1 AA** in `apps/web`.  
**Cursor rule:** **ui-semantics-a11y**  
**Design system checklist:** [`visual_identity_contract.md`](../../design/visual_identity_contract.md), [`accessibility_requirements.md`](../../design/accessibility_requirements.md)

---

## 1. Why it matters

Pulse serves clients, trainers, and admins on mobile and desktop. Semantic structure improves SEO, screen readers, and keyboard-only use. Non-semantic shortcuts (`div` as button) create maintenance and compliance debt.

---

## 2. Semantic structure

### Page shell

```tsx
// Target pattern (root layout + role layouts)
<body>
  <header>{/* app chrome, skip link optional */}</header>
  <nav aria-label="Primary">{/* bottom nav or sidebar */}</nav>
  <main id="main-content">{children}</main>
  <footer>{/* legal, minimal */}</footer>
</body>
```

- **`main`** — one per page view; route content lives here.
- **Multiple `nav`** — distinct `aria-label` (`"Primary"`, `"Account"`, `"Breadcrumb"`).
- **`section`** — thematic grouping with visible heading when helpful for SR users.

### Headings

- **One `h1`** per route — page title (**typography_text_guidelines**).
- Do not pick `h3` because it “looks right” — use typography atoms / `visualLevel` when scaffolded.
- Marketing blocks may use `SectionTitle` with correct underlying level.

### Interactive elements

| Do | Don't |
|----|-------|
| `<button type="submit">` | `<div onClick={submit}>` |
| `<Link href="…">` / `<a href="…">` | `<span onClick={() => router.push}>` without role |
| `<label htmlFor="email">` | Placeholder-only “label” |
| `<ul>` / `<li>` for nav lists | Div stacks pretending to be lists |

### Data tables (admin)

- Use shadcn `Table` with semantic `<table>` or ensure admin responsive patterns expose row/column headers.
- Sortable columns: indicate state (`aria-sort` where applicable).
- Row actions: accessible name on icon buttons (`aria-label` from `@/lib/messages`).

---

## 3. WCAG 2.1 AA requirements

### Perceivable

- **Contrast:** text ≥ **4.5:1**, large text/UI ≥ **3:1** — Warm Forest semantic tokens; verify light **and** dark.
- **Images:** informative `alt`; decorative `alt=""`.
- **Motion:** respect `prefers-reduced-motion` for non-essential animation.

### Operable

- **Keyboard:** all functionality available without pointer (except path-dependent gestures if any).
- **Focus visible:** `focus-visible:ring-*` — never `outline-none` without replacement.
- **Touch targets:** ≥ **44×44px** on mobile (**ui-mobile-first**).
- **No keyboard trap** except intentional modal focus trap (Radix Dialog/Sheet).

### Understandable

- **Labels:** every input has visible or programmatic name.
- **Errors:** inline text + `aria-invalid` + association via `FieldError` / `aria-describedby`.
- **Consistent navigation** across role shells.

### Robust

- Valid HTML structure; avoid duplicate IDs.
- Prefer Radix/shadcn for complex widgets (tabs, combobox, dialog) — tested ARIA patterns.

---

## 4. ARIA usage (minimal necessary)

**First rule:** if native HTML suffices, **do not add ARIA**.

| Pattern | Approach |
|---------|----------|
| Icon button | `aria-label={messages…}`; icon `aria-hidden` |
| Toggle (wishlist) | `aria-pressed` + visible state (**ui-optimistic-mutations** example) |
| Loading button | `aria-busy={pending}` (**ui-mutation-pending**) |
| Live updates | `aria-live="polite"` sparingly — prefer toast (Sonner) for mutations |
| Decorative icon | `aria-hidden="true"` |

Anti-pattern: redundant ARIA on native elements (`role="button"` on `<button>`).

---

## 5. Forms

Follow [`ai_form_handling_pattern.md`](./ai_form_handling_pattern.md):

- `Label` + `Input` / `Select` pairing
- `aria-invalid={!!error}` when server/client validation fails
- Submit: `disabled` + `aria-busy` during mutation
- Error summary for multi-field forms when UX requires it

---

## 6. shadcn/ui & Radix

Install primitives via shadcn MCP — they ship focus management, dialog semantics, and keyboard handlers. **Do not reimplement** modal focus trap by hand unless extending with documented reason.

---

## 7. Agent checklist

Before finishing a UI task:

- [ ] View page outline (headings + landmarks) makes sense
- [ ] Tab through primary flow without mouse
- [ ] Screen reader names on icon-only controls (manual or axe spot-check when scaffold exists)
- [ ] Error and empty states readable and labeled
- [ ] Design system §15 checklist applied where relevant

---

## 8. Related documents

| Document | Role |
|----------|------|
| [`typography_text_guidelines.md`](../typography_text_guidelines.md) | Heading hierarchy, atoms |
| [`ai_component_guidelines.md`](./ai_component_guidelines.md) | Component structure |
| [`ai_form_handling_pattern.md`](./ai_form_handling_pattern.md) | Form a11y |
| [`accessibility_requirements.md`](../../design/accessibility_requirements.md) | Product WCAG canon |
| [`visual_identity_contract.md`](../../design/visual_identity_contract.md) | Contrast tokens |
| [`ui-mobile-first.mdc`](../../.cursor/rules/ui-mobile-first.mdc) | Touch targets |

**Reference:** lampto [`ux_ui_faang_principles_for_agents.md`](../../examples/lampto/docs/design/ux_ui_faang_principles_for_agents.md) §2.5
