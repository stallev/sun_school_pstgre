# Typography and text content — Pulse

Typography for **`apps/web`** using shared atoms (on scaffold), semantic HTML, Warm Forest font tokens, and accessibility.

**Design source:** [`visual_identity_contract.md`](../../design/visual_identity_contract.md), interim [`fitness-platform-design-system.md`](../../default_docs/fitness-platform-design-system.md) §typography  
**UI rule:** **ui-warm-forest-shadcn**

---

## Font stack (target)

| Role | Font | CSS token |
|------|------|-----------|
| Headings / display | **Source Serif 4** | `font-heading` |
| UI / body | **Manrope** | `font-sans` |
| Code / times / IDs | **JetBrains Mono** | `font-mono` |

Wire via `next/font/google` in root `layout.tsx`; map in `globals.css` `@theme inline`.

---

## Component policy (on scaffold)

Shared typography in `components/atoms/`:

| Component | Role |
|-----------|------|
| **Heading** | Semantic `h1`–`h6`, optional display scale |
| **SectionTitle** | Large marketing/hero blocks |
| **ContentText** | Body, lead, muted, caption variants |
| **AlertText** | Destructive inline alerts (`role="alert"`) |

Prefer atoms over duplicated Tailwind heading strings across routes. Until atoms exist, follow design system type scale directly.

---

## Heading usage

- **One `h1` per page** — page title or hero, not both competing
- App screens (client/trainer/admin): **`Heading as="h1"`** for page title
- Marketing landing (if any): **`SectionTitle`** for hero blocks

```tsx
<Heading as="h1">My bookings</Heading>
<Heading as="h2">Upcoming sessions</Heading>
```

---

## Responsive type scale

From design system — **mobile-first** (base = mobile, `md:`/`lg:` = desktop):

| Context | Mobile | Desktop |
|---------|--------|---------|
| Page title | `text-[26–30px]` | `text-[36–44px]` |
| Section title | `text-xl` | `text-2xl` |
| Body | `text-base` | `text-base` |
| Caption / meta | `text-sm text-muted-foreground` | same |

**Prototype parity:** match font family, weight, and size from [`Fitness_Platform_Prototype_v1.html`](../../prototypes/Fitness_Platform_Prototype_v1.html) — Cursor rule **ui-prototype-fidelity**.

---

## Accessibility

- Real heading hierarchy — do not skip levels for styling alone (`visualLevel` prop when atoms added)
- Semantic landmarks in layouts: `main`, `nav`, `header`, `footer` — **ui-semantics-a11y**
- Sufficient contrast per Warm Forest tokens (light + dark) — WCAG 2.1 AA
- `sr-only` for icon-only buttons with lucide icons; decorative icons — `aria-hidden`

---

## User-visible copy

All strings from **`@/lib/messages`** — not hardcoded in typography components except dev placeholders.

**Reference:** lampto [`typography_text_guidelines.md`](../../examples/lampto/docs/guidelines/typography_text_guidelines.md) — Calm Editorial → Warm Forest.
