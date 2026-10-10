# Pulse Design Kit

Drop-in foundation for the **Pulse** fitness platform: design tokens, typography atoms, button system, link wrapper and card system. Built for **Next.js 15+ / React 19 / Tailwind CSS v4 / Shadcn UI**.

Palette: **Forest** (primary) · **Gold** (secondary) · **Cream** (surface). All tokens have light + dark mode values.

---

## Files

```
pulse-design-kit/
├── app/
│   ├── theme.css                   ← CSS variables (light + .dark)
│   └── globals.css                 ← Tailwind v4 entry · @theme inline
├── components/
│   ├── atoms/
│   │   ├── Heading/Heading.tsx
│   │   ├── SectionTitle/SectionTitle.tsx
│   │   ├── ContentText/ContentText.tsx
│   │   ├── AlertText/AlertText.tsx
│   │   ├── content-text-variants.ts
│   │   └── index.ts                ← barrel: @/components/atoms
│   └── ui/
│       ├── button.tsx              ← Button + buttonVariants (CVA)
│       ├── CustomLink.tsx          ← <a> wrapper · text · button · icon
│       └── card.tsx                ← shadcn Card primitives + BsfyCard
├── lib/
│   └── utils.ts                    ← cn() helper
└── README.md
```

---

## Install

```bash
pnpm add class-variance-authority clsx tailwind-merge @radix-ui/react-slot
pnpm add -D tailwindcss@^4
```

Your project should already use Tailwind v4. Shadcn UI components (Slot, Dialog, etc.) bring their own peer deps as you `shadcn add` them — none required up front beyond the four above.

---

## Wire-up

### 1. Copy files into your project

| From | To |
|---|---|
| `app/theme.css` | `apps/web/src/app/theme.css` |
| `app/globals.css` | `apps/web/src/app/globals.css` (replace if you only have a stub) |
| `components/atoms/**` | `apps/web/src/components/atoms/**` |
| `components/ui/button.tsx` | `apps/web/src/components/ui/button.tsx` |
| `components/ui/CustomLink.tsx` | `apps/web/src/components/ui/CustomLink.tsx` |
| `components/ui/card.tsx` | `apps/web/src/components/ui/card.tsx` |
| `lib/utils.ts` | `apps/web/src/lib/utils.ts` (skip if shadcn already created one) |

### 2. Confirm `tsconfig.json` paths

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3. Load fonts in `app/layout.tsx`

```tsx
import { JetBrains_Mono, Manrope, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const display = Source_Serif_4({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const body = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});
const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-monospace",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
```

The CSS variables `--font-display`, `--font-body`, `--font-monospace` are referenced by `@theme inline` in `globals.css` and will fall back to system fonts if absent.

### 4. Dark mode toggle

Toggle the `.dark` class on `<html>` and the theme switches instantly:

```ts
document.documentElement.classList.toggle("dark", isDark);
```

Persist via `localStorage` and hydrate from `prefers-color-scheme: dark` on first visit.

---

## Usage cheatsheet

### Typography atoms

```tsx
import { Heading, SectionTitle, ContentText, AlertText } from "@/components/atoms";

// Page H1 (app / admin)
<Heading as="h1">Dashboard</Heading>

// Hero — keep semantic h1 but use display scale
<Heading as="h1" visualLevel="display">Find your trainer</Heading>

// Marketing section title (centered)
<SectionTitle as="h2">How it works</SectionTitle>

// Body
<ContentText variant="body">Primary paragraph.</ContentText>
<ContentText variant="muted" as="span">Card meta · 2h ago</ContentText>
<ContentText variant="caption">NEXT SESSION</ContentText>

// Form error
{formError && <AlertText>{formError}</AlertText>}
```

**Golden rule:** if the same text role appears in many places, **add a variant in `content-text-variants.ts`** — do not override `text-*` from `className`. Reserve `className` for layout (`mt-2 max-w-prose`).

### Button

```tsx
import { Button } from "@/components/ui/button";

<Button>Book now</Button>                                  // primary
<Button variant="outline">Cancel</Button>
<Button variant="tonal" size="sm">View profile</Button>
<Button variant="ghost" size="icon" aria-label="Settings"><GearIcon/></Button>
<Button variant="destructive">Delete</Button>
<Button loading>Saving…</Button>

// As a Next.js link without losing semantics:
<Button asChild>
  <Link href="/trainers">Browse</Link>
</Button>
```

**Hierarchy:** one `default` (primary) CTA per screen / section → `outline / secondary / tonal` → `ghost` → `destructive` (only behind a confirm dialog).

### CustomLink

```tsx
import { CustomLink } from "@/components/ui/CustomLink";

// 1) Plain text link
<CustomLink href="/legal/terms">Terms of service</CustomLink>

// 2) Muted footer/breadcrumb link
<CustomLink href="/help" variant="quiet">Help</CustomLink>

// 3) Link styled as a button (keeps <a> semantics)
<CustomLink href="/trainers" as="button" variant="default">
  Browse trainers
</CustomLink>

// 4) Icon-only link — aria-label is required
<CustomLink href="/profile" as="icon" aria-label="Open profile">
  <UserIcon/>
</CustomLink>
```

Never style a `<button>` as a link, and never style an `<a>` to look like a button by hand-rolled `className`. Use `Button` for actions, `CustomLink` for navigation.

### Card system

```tsx
import { BsfyCard } from "@/components/ui/card";

// Standard dashboard / form / summary card
<BsfyCard>
  …content…
</BsfyCard>

// Hero / Today / GroupSummary
<BsfyCard variant="elevated">
  <div className="px-5 py-3 bg-[color:var(--forest)] text-white">
    Today’s session
  </div>
  <div className="px-5 py-5">…body…</div>
</BsfyCard>

// Clickable item card
<BsfyCard variant="compact" interactive>
  …
</BsfyCard>

// Highlighted “your own” entry
<BsfyCard variant="compact" state="active">…</BsfyCard>

// Needs attention
<BsfyCard variant="compact" state="warning">…</BsfyCard>

// Disabled / completed item
<BsfyCard variant="row" interactive state="muted">…</BsfyCard>
```

The `Card / CardHeader / CardContent / CardFooter / CardTitle / CardDescription / CardAction` shadcn primitives are also exported from the same file for backward compatibility (used inside `Dialog`, `Sheet`, generated forms etc.).

---

## Token reference

Brand and semantic tokens come from `theme.css` and are usable everywhere via Tailwind utilities (`bg-primary`, `text-muted-foreground`, …) or as CSS variables (`var(--forest-mid)`).

| Group | Token | Light | Dark |
|---|---|---|---|
| Brand | `--forest-mid` | `#2D5A40` | `#6EA886` |
| Brand | `--gold` | `#C4973A` | `#E8C070` |
| Surface | `--cream` (bg) | `#F5F0E8` | `#0E1814` |
| Surface | `--white` (card) | `#FFFFFF` | `#1A2820` |
| Border | `--cream-border` | `#D8CCB4` | `#3D5A4A` |
| Text | `--ink` (fg) | `#1A3028` | `#F0EAD8` |
| Text | `--ink-secondary` | `#4A5A50` | `#B5C2B9` |
| Text | `--ink-tertiary` | `#8A8578` | `#7A857E` |
| Status | `--green-text` | `#1A5C32` | `#6EE7A0` |
| Status | `--error` | `#B23A3A` | `#FF8585` |
| Status | `--warning` | `#B07028` | `#F5C26B` |

Geometry (no dark variant):

| Token | Value | Used by |
|---|---|---|
| `--radius-sm` | `6px` | inputs |
| `--radius-md` | `12px` | most cards / dropdowns |
| `--radius-lg` | `16px` | hero cards |
| `--radius-xl` | `24px` | bottom sheets, hero blocks |
| `--card-radius-sm` | `10px` | row cards |
| `--card-radius-md` | `14px` | compact cards |
| `--card-radius-lg` | `16px` | base cards |
| `--card-radius-xl` | `20px` | elevated cards |
| `--card-p-sm` | `12px` | compact/row padding |
| `--card-p-md` | `16px` | base padding |
| `--card-p-lg` | `20px` | elevated body padding |

---

## Conventions & guardrails

1. **No raw hex / rgba in product code** — always reference tokens.
2. **One primary CTA per screen.** Hierarchy: `default → outline → ghost → destructive`.
3. **Touch targets ≥ 44 × 44 px** (any `size="default"+` Button satisfies this).
4. **Icon-only controls require `aria-label`** — Button and CustomLink both warn in dev when missing.
5. **Never override `text-*` / type scale from product code** — add a variant in `content-text-variants.ts` if the role repeats.
6. **Destructive actions** always behind a confirm dialog.
7. **Headings:** one primary `h1` per page; do not skip levels.
8. **Cards:** use `BsfyCard` with variants/state — don't hand-roll `rounded-2xl bg-card shadow-md` containers.
9. **Dark mode** flows entirely through CSS variables — no per-component `dark:` overrides needed.
10. **Lucide React** for UI icons; raw SVG only for brand assets.

---

## Extending

* **New body text role used in 2+ places** → add a new `variant` key in `content-text-variants.ts`.
* **New action context** (e.g. `coachAccept`) → add it to `buttonVariants.variants.variant` with a comment about where it's allowed.
* **New card semantic state** → add to `bsfyCardVariants.variants.state` and add a `compoundVariants` rule if it interacts with `interactive`.
* **New brand colour** → declare in `theme.css` for both `:root` and `.dark`, then optionally expose to Tailwind via `@theme inline` in `globals.css`.

---

## License

Internal use. Mirror the parent project's license when you copy these files in.
