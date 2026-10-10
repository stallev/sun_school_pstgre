# Semantic markup & accessibility — Pulse

Norms for **semantic HTML** and **WCAG 2.1 AA** in `apps/web`.  
**Cursor rule:** **ui-semantics-a11y**  
**Deep dive:** [`docs/general/03-accessibility.md`](../../general/03-accessibility.md)  
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
  {/* Skip link — first focusable element (docs/general/03-accessibility) */}
  <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 ...">
    Skip to main content
  </a>
  <header>{/* app chrome */}</header>
  <nav aria-label="Primary">{/* bottom nav or sidebar */}</nav>
  <main id="main-content" tabIndex={-1}>{children}</main>
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

- **Contrast:** text ≥ **4.5:1**, large text (≥ 18px regular or ≥ 14px bold) ≥ **3:1**, UI components ≥ **3:1** — {{DESIGN_SYSTEM_NAME}} semantic tokens; verify light **and** dark.
- **Marketing bands:** text on `bg-brand-cta-band` / `bg-brand-band` uses solid `text-on-brand-*` tokens — **not** opacity below **0.88** for body-sized copy or **11px** eyebrow labels (PageSpeed / axe fail below that).
- **Tertiary copy:** `text-subtle-foreground` (`--color-ink-3`) MUST meet **4.5:1** on `--color-bg` and `--color-surface`; above-the-fold stats use `text-muted-foreground` when subtle tone fails audit.
- **Images:** informative `alt`; decorative `alt=""`.
- **Motion:** respect `prefers-reduced-motion` for non-essential animation.

### Operable

- **Keyboard:** all functionality available without pointer (except path-dependent gestures if any).
- **Focus visible:** `focus-visible:ring-*` — never `outline-none` without replacement.
- **Touch targets:** ≥ **44×44px** on mobile (**ui-mobile-first**).
- **No keyboard trap** except intentional modal focus trap (shadcn Dialog/Sheet on Base UI).

### Understandable

- **Labels:** every input has visible or programmatic name.
- **Errors:** inline text + `aria-invalid` + association via `FieldError` / `aria-describedby`.
- **Consistent navigation** across role shells.

### Robust

- Valid HTML structure; avoid duplicate IDs.
- Prefer shadcn (Base UI) for complex widgets (tabs, combobox, dialog) — tested ARIA patterns.

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
| Readonly star rating (no visible text) | `role="img"` + `aria-label` on wrapper — **never** bare `aria-label` on `<span>` without role |
| Decorative star row (rating duplicated in text nearby) | `aria-hidden="true"` on wrapper; icons `aria-hidden` |

### Prohibited ARIA attributes (PageSpeed / axe)

Assistive tech ignores or mis-announces **prohibited** ARIA on elements without a valid implicit/explicit role.

| Anti-pattern | Fix |
|--------------|-----|
| `<span aria-label="5 of 5 stars">` (no role) | `role="img"` + `aria-label`, **or** visible text + `aria-hidden` on stars |
| `aria-label` on generic `<div>` / `<span>` wrappers | Add semantic role (`img`, `group`, …) **or** use native element with name |
| Redundant `role="button"` on `<button>` | Remove role; keep visible label |

**Catalog example:** `RatingStars` readonly — `role="img"` when `aria-label` is passed; `aria-hidden` when decorative. Interactive mode uses `role="group"` (already valid for `aria-label`).

---

## 5. Forms

Follow [`ai_form_handling_pattern.md`](./ai_form_handling_pattern.md):

- `Label` + `Input` / `Select` pairing
- `aria-invalid={!!error}` when server/client validation fails
- Submit: `disabled` + `aria-busy` during mutation
- Error summary for multi-field forms when UX requires it

---

## 6. shadcn/ui (Base UI)

Install primitives via shadcn MCP — they ship focus management, dialog semantics, and keyboard handlers. **Do not reimplement** modal focus trap by hand unless extending with documented reason.

### inert vs aria-hidden (modals)

- **`aria-hidden="true"`** — декоративные элементы; фокус всё ещё может попасть внутрь
- **`inert`** — фон за модалкой: блокирует фокус, клики и скринридеры (предпочтительно для overlay backdrop)

shadcn Dialog/Sheet (Base UI) обеспечивают focus trap, Escape, focus return — используй их (**ui-mobile-first** Sheet `< md` / Dialog `≥ md`).

---

## 7. Automated a11y testing (SHOULD)

```bash
npm install --save-dev @axe-core/playwright
```

Playwright + `@axe-core/playwright` в CI для critical routes. Automated tools находят ~30–40% проблем — **дополнять** ручным keyboard + screen reader pass.

---

## 8. Agent checklist

Before finishing a UI task:

- [ ] View page outline (headings + landmarks) makes sense
- [ ] Tab through primary flow without mouse
- [ ] Screen reader names on icon-only controls (manual or axe spot-check when scaffold exists)
- [ ] **No prohibited ARIA** — readonly ratings use `role="img"`; no orphan `aria-label` on unlabeled generics
- [ ] **Contrast AA** on light + dark — especially `text-subtle-foreground`, marketing band eyebrows, footnote pills on `bg-brand-cta-band`
- [ ] Error and empty states readable and labeled
- [ ] Design system §15 checklist applied where relevant
- [ ] Public landing: sync `page.tsx`; hero via `LandingHomeAboveFoldFallback` / `LandingHomeAboveFold` — [`ai_loading_patterns.md`](../nextjs/ai_loading_patterns.md) §14.1
- [ ] Skip link to `#main-content` in root layout
- [ ] Modals: shadcn (Base UI) — не hand-roll focus trap

---

## 9. Related documents

| Document | Role |
|----------|------|
| [`typography_text_guidelines.md`](../typography_text_guidelines.md) | Heading hierarchy, atoms |
| [`ai_component_guidelines.md`](./ai_component_guidelines.md) | Component structure |
| [`ai_form_handling_pattern.md`](./ai_form_handling_pattern.md) | Form a11y |
| [`accessibility_requirements.md`](../../design/accessibility_requirements.md) | Product WCAG canon |
| [`docs/general/03-accessibility.md`](../../general/03-accessibility.md) | Deep dive — focus trap, keyboard patterns |
| [`ai_browser_rendering_performance.md`](./ai_browser_rendering_performance.md) | Motion / prefers-reduced-motion |
| [`visual_identity_contract.md`](../../design/visual_identity_contract.md) | Contrast tokens |
| [`ui-mobile-first.mdc`](../../../.cursor/rules/ui-mobile-first.mdc) | Touch targets |

**Reference:** Pulse [`docs/examples/pulse/`](../../examples/pulse/) — a11y patterns; **Guidelines override Pulse reference code**.
