# Fitness Platform — Design System

> **Framework**: Next.js **16.2.6** App Router · TypeScript  
> **Auth**: Auth.js v5  
> **ORM**: Prisma v7  
> **Database**: PostgreSQL v17 on Neon  
> **Hosting**: Vercel  
> **UI**: Shadcn UI + Tailwind CSS v4  
> **Fonts**: Source Serif 4 · Manrope · JetBrains Mono *(runtime; see [`visual_identity_contract.md`](../design/visual_identity_contract.md) — supersedes latin-only DM pair in HTML prototype)*  
> **Direction**: Warm Forest — тёплый природный, энергичный, человечный  
> **Философия**: Material You (M3) — цвет как носитель смысла, выраженный характер компонентов

---

## 1. Концепция

- **Доверие**: тёплые лесные тона — природная надёжность, не холодный SaaS
- **Энергия**: Forest + Gold — рост и ценность
- **Читаемость**: высокий контраст, чёткая иерархия
- **Современность**: M3 elevation, rounded corners, expressive typography
- **Dark Mode**: полноценная тёмная тема, независимая CSS-переменная схема

---

## 2. Responsive Strategy

### Breakpoints

```typescript
// Tailwind CSS v4 defaults (используются в проекте как есть)
sm:  640px    // landscape smartphone
md:  768px    // tablet portrait → sidebar appears, bottom nav hidden
lg:  1024px   // desktop → filter sidebars, multi-column layouts
xl:  1280px   // wide desktop
2xl: 1536px   // ultra-wide
```

### Ключевые паттерны адаптации (из прототипа)

| Паттерн | Mobile | Tablet (md+) | Desktop (lg+) |
|---|---|---|---|
| **Навигация** | Bottom Nav sticky | Sidebar sticky | Sidebar wider (w-60) |
| **Контент** | 1 колонка | 2 колонки | 2–4 колонки |
| **Каталог** | chips scroll + Filter sheet | chips + Filter sheet | sidebar filters |
| **Trainer profile** | edge-to-edge portrait photo, bottom CTA | split layout, sidebar | split, bigger sidebar |
| **Booking** | full-screen wizard | wizard + sidebar | wizard + sidebar |
| **Modals/Sheets** | bottom sheet (slide up) | centered dialog | centered dialog |
| **Profile photo** | aspect 3/4, `rounded-none` | aspect 3/4, `w-72`, `rounded-3xl` | aspect 3/4, `w-72`, `rounded-3xl` |
| **Page title** | `text-[26–30px]` | `text-[36–40px]` | `text-[36–44px]` |
| **KPI grid** | `grid-cols-2` | `grid-cols-2` | `grid-cols-4` |

### Edge-to-Edge Mobile

Ряд паттернов из прототипа для создания «native mobile» ощущения:

```tsx
// Контент выходит за padding страницы
className="-mx-4 md:mx-0"       // Cover photo, trainer profile wrapper
className="-mx-4 px-4"          // Horizontal chip scroll
className="-mx-4 md:-mx-6 px-4 md:px-6"  // Chips с учётом tablet padding

// Overflow scroll без scrollbar
className="overflow-x-auto no-scrollbar"

// CSS для no-scrollbar
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }
```

### Safe Area (iPhone notch/home indicator)

```tsx
// Bottom Nav — учёт нижнего safe area
style={{ paddingBottom: "env(safe-area-inset-bottom)" }}

// Content padding над Bottom Nav
className="pb-6"  // минимум 24px над nav
```

---

## 3. Цветовая палитра

### Primary — Forest Green

| Token | Light | Dark | Использование |
|---|---|---|---|
| `--color-primary` | `#2D5A40` | `#6EA886` | Кнопки, active nav, акценты |
| `--color-primary-hover` | `#1A3028` | `#87C09F` | Hover state |
| `--color-primary-light` | `#3D7A58` | `#87C09F` | Декоративные акценты |
| `--color-primary-container` | `#E4F0E8` | `#1F3A2A` | Chips, badges, tonal кнопок, nav active bg |
| `--color-on-primary-container` | `#1A3028` | `#C5E0CE` | Текст на primary-container |

### Secondary — Gold

| Token | Light | Dark | Использование |
|---|---|---|---|
| `--color-secondary` | `#C4973A` | `#E8C070` | RatingStars, secondary accents |
| `--color-secondary-hover` | `#A37D28` | `#F5D89A` | Hover |
| `--color-secondary-container` | `#F5E6C8` | `#3D2E14` | KPI card tones, highlights |
| `--color-on-secondary-container` | `#5C4014` | `#F5E6C8` | Текст на secondary-container |

### Surface — Cream / Dark Forest

| Token | Light | Dark | Использование |
|---|---|---|---|
| `--color-bg` | `#F5F0E8` | `#0E1814` | Фон страниц |
| `--color-surface` | `#FFFFFF` | `#1A2820` | Карточки, inputs, modals |
| `--color-surface-variant` | `#EDE5D4` | `#243329` | Sidebar, tab bars, filled cards |
| `--color-surface-container` | `#E6DCC6` | `#2D4034` | Hover states на карточках |
| `--color-surface-dim` | `#D8CCB4` | `#3D5A4A` | Dividers, borders, empty stars |

### Text

| Token | Light | Dark | Использование |
|---|---|---|---|
| `--color-ink` | `#1A3028` | `#F0EAD8` | Headings, body |
| `--color-ink-2` | `#4A5A50` | `#B5C2B9` | Secondary text, labels |
| `--color-ink-3` | `#8A8578` | `#7A857E` | Placeholders, captions, disabled |

### Семантические

| Token | Light | Dark | Использование |
|---|---|---|---|
| `--color-success` | `#1A5C32` | `#6EE7A0` | Confirmed, verified, paid |
| `--color-success-container` | `#E4F0E8` | `#1F3A24` | KPI success tone |
| `--color-error` | `#B23A3A` | `#FF8585` | Error, cancelled, destructive |
| `--color-error-container` | `#F5E0E0` | `#3A1F1F` | Error backgrounds |
| `--color-warning` | `#B07028` | `#F5C26B` | Pending, review, attention |
| `--color-warning-container` | `#F5E6C8` | `#3A2F1A` | Warning backgrounds, status banner |
| `--color-info` | `#2D5A6E` | `#7AC4F0` | Neutral info, info KPI tone |
| `--color-info-container` | `#E0EAF0` | `#1A2E3A` | Info backgrounds |

### CSS (globals.css)

```css
@theme {
  --color-primary:              #2D5A40;
  --color-primary-hover:        #1A3028;
  --color-primary-light:        #3D7A58;
  --color-primary-container:    #E4F0E8;
  --color-on-primary-container: #1A3028;

  --color-secondary:              #C4973A;
  --color-secondary-hover:        #A37D28;
  --color-secondary-light:        #E8C070;
  --color-secondary-container:    #F5E6C8;
  --color-on-secondary-container: #5C4014;

  --color-bg:               #F5F0E8;
  --color-surface:          #FFFFFF;
  --color-surface-variant:  #EDE5D4;
  --color-surface-container:#E6DCC6;
  --color-surface-dim:      #D8CCB4;

  --color-ink:   #1A3028;
  --color-ink-2: #4A5A50;
  --color-ink-3: #8A8578;

  --color-success:           #1A5C32;
  --color-success-container: #E4F0E8;
  --color-error:             #B23A3A;
  --color-error-container:   #F5E0E0;
  --color-warning:           #B07028;
  --color-warning-container: #F5E6C8;
  --color-info:              #2D5A6E;
  --color-info-container:    #E0EAF0;

  /* Landing brand bands — section backgrounds; not interchangeable with --color-primary-hover */
  --color-brand-band:        #1A3028;
  --color-on-brand-band:     #FFFFFF;
  --color-brand-band-muted:  /* ~#B8D4C4 on dark band */;
  --color-brand-cta-band:    #2D5A40;
  --color-on-brand-cta-band: #FFFFFF;
  --color-hero-glow:         #E4F0E8;

  --font-display: "Source Serif 4", ui-serif, Georgia, serif;
  --font-sans:    "Manrope", ui-sans-serif, system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;

  --radius-xs:   4px;
  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-full: 9999px;
}

.dark {
  --color-primary:              #6EA886;
  --color-primary-hover:        #87C09F;
  --color-primary-container:    #1F3A2A;
  --color-on-primary-container: #C5E0CE;

  --color-secondary:              #E8C070;
  --color-secondary-hover:        #F5D89A;
  --color-secondary-container:    #3D2E14;
  --color-on-secondary-container: #F5E6C8;

  --color-bg:               #0E1814;
  --color-surface:          #1A2820;
  --color-surface-variant:  #243329;
  --color-surface-container:#2D4034;
  --color-surface-dim:      #3D5A4A;

  --color-ink:   #F0EAD8;
  --color-ink-2: #B5C2B9;
  --color-ink-3: /* dark: 62% L for small-text AA */;

  --color-brand-band:        #1A2820;
  --color-on-brand-band:     #F0EAD8;
  --color-brand-band-muted:  #B5C2B9;
  --color-brand-cta-band:    #2D4034;
  --color-on-brand-cta-band: #F0EAD8;
  --color-hero-glow:         #6EA886;

  --color-success:           #6EE7A0;
  --color-success-container: #1F3A24;
  --color-error:             #FF8585;
  --color-error-container:   #3A1F1F;
  --color-warning:           #F5C26B;
  --color-warning-container: #3A2F1A;
  --color-info:              #7AC4F0;
  --color-info-container:    #1A2E3A;
}

html, body {
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  font-feature-settings: "ss01", "cv11";
}

p, h1, h2, h3, h4 { text-wrap: pretty; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 4. Типографика

### Шрифтовая пара

| Роль | Шрифт | Характер |
|---|---|---|
| Display / Headings | Source Serif 4 | Элегантные засечки из линии Source. Экспертность и доверие. |
| Body / UI | Manrope | Геометрический гротеск с кириллицей. Читаемый, современный. |
| Monospace | JetBrains Mono | Таймеры, ID, коды, timestamps |

### Next.js подключение

```typescript
// app/layout.tsx
import { JetBrains_Mono, Manrope, Source_Serif_4 } from 'next/font/google'

const sourceSerif4 = Source_Serif_4({
  weight: ['400'], style: ['normal', 'italic'],
  subsets: ['latin', 'cyrillic'], variable: '--font-display', display: 'swap',
})
const manrope = Manrope({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'cyrillic'], variable: '--font-sans', display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin', 'cyrillic'], variable: '--font-mono', display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* suppressHydrationWarning — тема меняется клиентским JS до гидрации */}
      <body className={`${sourceSerif4.variable} ${manrope.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  )
}
```

### Шкала использования (из прототипа)

| Контекст | Mobile | Desktop | Класс |
|---|---|---|---|
| Page title | `text-[26px]` | `md:text-[36px]` | `font-display` |
| Dashboard greeting | `text-[28–30px]` | `md:text-[40–44px]` | `font-display` |
| Section title | `text-[22px]` | `text-[22px]` | `font-display` |
| Card / trainer name | `text-[17–19px]` | `md:text-[19–22px]` | `font-display` |
| Body / service desc | `text-[13–14px]` | `text-[14px]` | (Manrope default) |
| Button / label | `text-[13–15px]` | `text-[14–15px]` | `font-medium` |
| Caption / meta | `text-[11–12px]` | `text-[11–12px]` | `text-ink-3` |
| Monospace (time, ID) | `text-[11–13px]` | `text-[12–13px]` | `font-mono tabular-nums` |

---

## 5. Spacing

Базовая единица 4px. Ключевые значения:

| Использование | Tailwind | px |
|---|---|---|
| Inner padding small components | `p-3` | 12 |
| Card padding mobile | `p-4` | 16 |
| Card padding desktop | `md:p-5 md:p-6` | 20–24 |
| Grid gap cards | `gap-2.5` | 10 |
| Grid gap KPI desktop | `md:gap-3` | 12 |
| Section spacing | `space-y-5 space-y-6` | 20–24 |
| Page bottom padding | `pb-6` | 24 |

---

## 6. Border Radius

| Token | px | Использование |
|---|---|---|
| `radius-xs` (4px) | 4 | Inline badges |
| `radius-sm` (6px) | 6 | Inputs (`rounded-lg` = 8px в прототипе) |
| `rounded-2xl` | 16 | **Основной радиус карточек** (прототип использует `rounded-2xl`) |
| `radius-xl` | 24 | Bottom sheets, trainer profile cover desktop (`rounded-3xl` = 24px) |
| `radius-full` | 9999 | Avatars, pill buttons, nav items, chips, badges |

---

## 7. Elevation

| Level | Shadow | Использование |
|---|---|---|
| 0 | none | Фон страниц |
| 1 | `shadow-[0_1px_2px_rgba(26,48,40,0.08)]` | Карточки в покое |
| 2 | `shadow-[0_4px_16px_rgba(26,48,40,0.10)]` | Hover карточек |
| 3 | `shadow-[0_8px_32px_rgba(26,48,40,0.18)]` | Popover, Sheet, Bottom Nav |
| 4 | `shadow-[0_-8px_32px_rgba(26,48,40,0.18)]` | Bottom Sheet (upward shadow) |

```typescript
export const elevation = {
  1: "shadow-[0_1px_2px_rgba(26,48,40,0.08)]",
  2: "shadow-[0_4px_16px_rgba(26,48,40,0.10)]",
  3: "shadow-[0_8px_32px_rgba(26,48,40,0.18)]",
} as const
```

---

## 8. Компоненты

### Button

```typescript
const base = `inline-flex items-center justify-center gap-2 rounded-full font-medium
  transition-[transform,background-color,box-shadow,border-color] duration-200
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
  focus-visible:ring-offset-2 focus-visible:ring-offset-bg
  disabled:pointer-events-none disabled:opacity-40 select-none`

const variants = {
  filled:      "bg-primary text-white hover:bg-primary-hover hover:shadow-[0_2px_10px_rgba(26,48,40,0.35)] active:scale-[0.97]",
  tonal:       "bg-primary-container text-on-primary-container hover:bg-[#D4E5DA] active:scale-[0.97]",
  outlined:    "border border-surface-dim bg-transparent text-primary hover:bg-primary-container/60 active:scale-[0.97]",
  ghost:       "text-primary hover:bg-primary-container/60 active:scale-[0.97]",
  neutral:     "bg-surface-variant text-ink hover:bg-surface-container active:scale-[0.97]",
  destructive: "bg-error text-white hover:brightness-95 active:scale-[0.97]",
}

const sizes = {
  sm:       "h-9 px-4 text-[13px]",
  md:       "h-11 px-5 text-[14px]",
  lg:       "h-12 px-6 text-[15px]",
  icon:     "h-10 w-10 p-0",
  "icon-sm":"h-8 w-8 p-0",
}
```

**Использование**:

| Variant | Контекст |
|---|---|
| `filled` | Один primary CTA: «Book now», «Confirm», «Approve» |
| `tonal` | Secondary: «Leave review», «+ New», «Join (tonal)» |
| `outlined` | Tertiary: «Cancel», «Back», «Clear» |
| `ghost` | «All →», inline navigation |
| `destructive` | «Reject», «Delete» — только в подтверждающих контекстах |

---

### Card

```typescript
const cardVariants = {
  elevated: "bg-surface rounded-2xl shadow-[0_1px_2px_rgba(26,48,40,0.08)]",
  filled:   "bg-surface-variant rounded-2xl",
  outlined: "bg-surface rounded-2xl border border-surface-dim",
}

// Интерактивная
const interactive = "transition-all duration-200 hover:shadow-[0_4px_16px_rgba(26,48,40,0.10)] cursor-pointer active:scale-[0.99] overflow-hidden"
```

---

### Badge / Status Chip

```typescript
const badgeBase = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium leading-5"

const statuses = {
  confirmed: "bg-success-container text-success",
  completed: "bg-surface-variant text-ink-2",
  cancelled:  "bg-error-container text-error",
  pending:   "bg-warning-container text-warning",
  verified:  "bg-primary-container text-on-primary-container",
  info:      "bg-info-container text-info",
  no_show:   "bg-error-container/60 text-error",
  neutral:   "bg-surface-variant text-ink-2",
}
```

---

### Avatar

```typescript
const sizes = {
  xs:   "h-6 w-6 text-[10px]",
  sm:   "h-8 w-8 text-xs",
  md:   "h-10 w-10 text-sm",
  lg:   "h-14 w-14 text-base",
  xl:   "h-20 w-20 text-xl",
  "2xl":"h-28 w-28 text-2xl",
}
const base = "bg-primary-container text-on-primary-container rounded-full flex items-center justify-center font-semibold select-none overflow-hidden"
```

---

### Input / Textarea

```typescript
const inputBase = `w-full h-12 rounded-lg border bg-surface px-3.5 text-[15px] text-ink
  placeholder:text-ink-3 focus:outline-none focus:ring-1 transition-colors
  border-surface-dim focus:border-primary focus:ring-primary/30 hover:border-ink-2`

const textareaBase = `w-full rounded-lg border border-surface-dim bg-surface px-3.5 py-3
  text-[15px] text-ink placeholder:text-ink-3 focus:outline-none
  focus:border-primary focus:ring-1 focus:ring-primary/30
  hover:border-ink-2 transition-colors resize-none`
```

---

### Tabs (Pill Tabs)

```typescript
const container = "inline-flex rounded-full bg-surface-variant p-1"
const active    = "h-9 px-4 rounded-full text-[13px] font-medium bg-surface text-ink shadow-[0_1px_2px_rgba(26,48,40,0.08)] transition-colors"
const inactive  = "h-9 px-4 rounded-full text-[13px] font-medium text-ink-2 hover:text-ink transition-colors"
```

**Mobile**: Tabs прокручиваются если не помещаются: `overflow-x-auto -mx-4 px-4 no-scrollbar`.

---

### Switch

```
Container: relative h-7 w-12 rounded-full transition-colors
  ON:  bg-primary
  OFF: bg-surface-container

Thumb: absolute top-0.5 h-6 w-6 rounded-full bg-white
       shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[left]
  ON:  left-[22px]
  OFF: left-0.5
```

Touch target: родительский `button` всегда минимум `h-10` для надёжного тапа.

---

### KPI Card

```
Mobile:  p-3.5, flex row
Desktop: p-3.5, flex row (те же пропорции)

[Icon 36px h-9 w-9 rounded-xl, toned] | [Value font-display text-[20px]]
                                       | [Label text-[12px] text-ink-2]
                                       | [Sub text-[11px] text-ink-3] (optional)

Tones:
  primary   → bg-primary-container   text-on-primary-container
  secondary → bg-secondary-container text-on-secondary-container
  success   → bg-success-container   text-success
  info      → bg-info-container      text-info
```

---

### Sheet (Bottom Sheet / Centered Dialog)

```
Overlay: fixed inset-0 z-50 bg-black/40 animate-[fadeIn_.2s_ease]

Mobile (< sm: 640px):
  fixed bottom-0 inset-x-0
  bg-surface rounded-t-3xl p-5
  shadow-[0_-8px_32px_rgba(26,48,40,0.18)]
  animate-[slideUp_.25s_cubic-bezier(0,0,0,1)]
  Drag handle: mx-auto mb-3 h-1 w-10 rounded-full bg-surface-dim

Desktop (sm+):
  fixed inset-0 flex items-center justify-center
  bg-surface rounded-3xl p-5 sm:max-w-md
  shadow-[0_8px_32px_rgba(26,48,40,0.18)]
  animate-[slideUp_.25s_cubic-bezier(0,0,0,1)]
  NO drag handle
```

---

### PhotoSlot (Placeholder до реальных фото)

```
relative overflow-hidden rounded-2xl bg-surface-variant

Внутри:
  hatching pattern: repeating-linear-gradient(45deg, transparent 0 8px, rgba(45,90,64,0.07) 8px 9px)
  centered: icon (Camera/default) + label (mono uppercase)

Aspect ratios:
  "1/1"  → trainer card photo
  "3/4"  → trainer profile portrait (mobile edge-to-edge, desktop w-72)
  "4/3"  → generic cover placeholder
  "16/6" → banner / hero strip
```

---

### SpecChip

```
inline-flex items-center rounded-full bg-surface-variant text-ink-2 px-2.5 py-1 text-[12px] font-medium
```

---

### RatingStars

```
Filled:  text-secondary (gold #C4973A)
Empty:   text-surface-dim

Sizes:
  size={12} → compact (trainer cards)
  size={14} → standard (profile header)
  size={16} → large (reviews breakdown)

Interactive (review form):
  cursor-pointer transition-transform hover:scale-110 active:scale-95

Readonly:
  pointer-events-none
```

---

### Section Header

```
flex items-center justify-between gap-3 mb-3

Title: font-display text-[22px] leading-7 tracking-tight
Action: text-[13px] font-medium text-primary inline-flex items-center gap-0.5
  "All <ChevronRight size={14}/>"
```

---

## 9. Навигация — Детальная Spec

### Top Bar

```
sticky top-0 z-40
bg-bg/85 backdrop-blur-md
border-b border-surface-dim/60
height: h-14 md:h-16

Внутри: mx-auto max-w-[1400px] flex items-center justify-between px-4 md:px-6 lg:px-8

Left:
  [Flame icon h-8 w-8 bg-primary text-white rounded-lg]
  [«Pulse» font-display text-[20px]]
  [«fitness platform» hidden md:inline-block, font-mono text-[11px] uppercase text-ink-3]

Right:
  gap-1.5 md:gap-3

  Lang toggle:
    h-8 md:h-9, px-2 md:px-2.5
    bg-surface border border-surface-dim rounded-full
    font-mono text-[11px] md:text-[12px] uppercase
    Globe icon size={14}

  Theme toggle:
    h-8 w-8 md:h-9 md:w-9
    bg-surface border border-surface-dim rounded-full
    Sun (dark mode) / Moon (light mode), size={16}

  Bell:
    h-8 w-8 md:h-9 md:w-9 rounded-full
    bg-surface border border-surface-dim
    Bell icon size={16}
    Unread dot: absolute top-1 right-1 md:top-1.5 md:right-1.5, h-2 w-2, bg-primary rounded-full

  Avatar: hidden md:inline-flex, size="sm"
```

### Sidebar (Desktop, md+)

```
hidden md:flex flex-col
sticky top-16 self-start
h-[calc(100dvh-4rem)]
w-52 lg:w-60
shrink-0
px-3 py-6 gap-1
border-r border-surface-dim/60

Role label: px-4 mb-2 text-[11px] font-mono uppercase tracking-[0.08em] text-ink-3

Nav item:
  h-11 px-3 rounded-full flex items-center gap-3 text-[14px] font-medium
  Active:   bg-primary-container text-on-primary-container
  Inactive: text-ink-2 hover:bg-surface-variant hover:text-ink

Badge: min-w-[20px] h-5 px-1.5 rounded-full bg-error text-white text-[11px] font-bold leading-5

Bottom card (mt-auto):
  Card variant="filled" p-3.5
  Flame icon text-primary + «Prototype» label
  hint text
```

### Bottom Nav (Mobile, < md)

```
md:hidden
sticky bottom-0 z-40
bg-surface/95 backdrop-blur-md
border-t border-surface-dim/70
padding-bottom: env(safe-area-inset-bottom)

Grid: grid grid-cols-{n} (n = items count for role)
  CLIENT:  4 cols
  TRAINER: 5 cols
  ADMIN:   4 cols

Each tab item:
  flex flex-col items-center justify-center gap-0.5 py-2.5

Icon container:
  relative flex h-7 w-12 items-center justify-center rounded-full transition-colors
  Active:   bg-primary-container text-on-primary-container
  Inactive: text-ink-2 (group-hover:text-ink)

  Icon: size={20} strokeWidth={1.75}

Badge (over icon):
  absolute -top-0.5 right-1.5
  min-w-[16px] h-4 px-1 rounded-full
  bg-error text-white text-[10px] font-bold leading-4 text-center

Label:
  text-[10.5px] font-medium
  Active:   text-ink
  Inactive: text-ink-2
```

### Notifications Popover

```
fixed top-[60px] md:top-[72px]  ← под top bar (14*4=56px + border / 16*4=64px + border)
right-3 md:right-6
z-[56]
w-[calc(100vw-1.5rem)] sm:w-96
max-h-[70vh]

bg-surface rounded-2xl
shadow-[0_8px_32px_rgba(26,48,40,0.18)]
border border-surface-dim
flex flex-col overflow-hidden
animate-[popIn_.18s_cubic-bezier(0,0,0,1)]

Overlay (закрытие): fixed inset-0 z-[55]

Header:
  flex items-center justify-between px-4 h-12 border-b border-surface-dim/60
  Title: font-display text-[18px]
  Action: text-[12px] font-medium text-primary hover:underline

Notification item:
  w-full text-left flex items-start gap-3 px-4 py-3
  hover:bg-surface-variant border-t border-surface-dim/40

  Icon container: h-9 w-9 rounded-xl (toned by type)
  Content: title text-[13.5px] font-medium + body text-[12px] text-ink-2
  Time: font-mono text-[10.5px] text-ink-3
  Unread dot: h-2 w-2 rounded-full bg-primary mt-1.5

Footer:
  p-3 border-t bg-surface-variant/40
  «View all» button: h-9 w-full rounded-full text-[13px] text-primary
```

---

## 10. Dark Mode

```typescript
// components/layout/ThemeToggle.tsx
'use client'
import { useEffect, useState } from 'react'
import { SunIcon, MoonIcon } from 'lucide-react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('pulse.theme') as 'light' | 'dark' | null
    const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    apply(saved ?? system)
  }, [])

  function apply(next: 'light' | 'dark') {
    setTheme(next)
    localStorage.setItem('pulse.theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.documentElement.style.colorScheme = next
  }

  return (
    <button
      onClick={() => apply(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      className="inline-flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-surface border border-surface-dim text-ink-2 hover:text-ink transition-colors"
    >
      {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </button>
  )
}
```

**Важно**: `suppressHydrationWarning` на `<html>` — обязателен, т.к. тема меняется JS до React hydration.

---

## 11. Motion & Transitions

### Keyframes

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

@keyframes popIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}
```

### Длительности и применение

| Анимация | Duration | Easing | Где |
|---|---|---|---|
| Button hover | 200ms | ease | background, shadow |
| Button active | 200ms | ease | scale(0.97) |
| Card hover | 200ms | ease | shadow, scale(0.99) |
| Switch toggle | 200ms | ease | left, background |
| Sheet appear | 250ms | `cubic-bezier(0,0,0,1)` | slideUp |
| Popover appear | 180ms | `cubic-bezier(0,0,0,1)` | popIn |
| Toast appear | 200ms | ease | fadeIn |
| Progress bar | 300ms | ease | width |

---

## 12. Зоны приложения — Специфика

### Public Zone (Landing, Catalog, Profile)

- Крупная типографика (`font-display`)
- Больше whitespace между секциями
- Все CTA — `filled`, `size-lg`
- Hover elevation на карточках тренеров

### Booking Flow

- Stripped header (нет боковой навигации)
- Progress bar всегда виден
- Один CTA на шаг
- Summary sidebar sticky (desktop)

### Client / Trainer Dashboards

- KPI-сетки без скролла на desktop
- Sidebar nav — всегда видна (desktop)
- Bottom Nav + pb-6 (mobile)

### Admin Zone

- Более компактные отступы (`p-3.5` вместо `p-5`)
- Все статусные бейджи видны сразу
- Badge-счётчики в навигации — главный signal
- Деструктивные действия — `destructive` variant + confirm

### Session Room (Post-MVP)

При реализации Daily.co:
- Отдельный dark-only layout (`bg-[#0E1814]`), не наследует `bg-bg`
- Chat panel: `bg-[#1A2820]`
- Контролы: `bg-white/15` (glassmorphism), active: `bg-white text-[#0E1814]`
- End session: `bg-[#FF5C5C]`
- Timer: `font-mono tabular-nums`
- Компонент `VideoRoom` уже заготовлен в `components/features/session/`, не рендерится на MVP

---

## 13. Файловая структура

```
components/
├── ui/                           # Shadcn (не модифицируем)
│
├── design-system/
│   ├── tokens.ts                 # Все CSS vars как TS-константы
│   ├── elevation.ts
│   └── typography.ts
│
├── shared/
│   ├── TrainerCard/              # Responsive: compact/full
│   ├── Avatar/
│   ├── RatingStars/              # Interactive / readonly
│   ├── StatusBadge/
│   ├── SpecChip/
│   ├── KpiCard/
│   ├── EmptyState/
│   ├── SkeletonCard/
│   ├── SectionHeader/
│   ├── Switch/
│   ├── PhotoSlot/
│   ├── Sheet/                    # Responsive: bottom sheet / dialog
│   └── ScheduleGrid/             # Переиспользуется в Profile и Booking
│
├── layout/
│   ├── TopBar/
│   │   ├── index.tsx
│   │   ├── NotificationsPopover.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── LanguageToggle.tsx
│   ├── SidebarNav/               # hidden md:flex
│   ├── BottomNav/                # md:hidden
│   └── PageContainer/            # mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8
│
└── features/
    ├── booking/
    │   ├── BookingWizard/        # 3 steps
    │   ├── ScheduleGrid/
    │   └── BookingSummary/       # Desktop sidebar
    ├── catalog/
    │   ├── TrainerGrid/
    │   ├── FilterSidebar/        # Desktop (lg+)
    │   └── FilterSheet/          # Mobile/tablet (< lg)
    ├── trainer-profile/
    │   ├── ProfileHero/          # Responsive cover photo
    │   ├── ProfileTabs/
    │   └── BookingSidebar/       # Desktop sticky sidebar
    ├── session/
    │   ├── SessionPlaceholder/   # MVP
    │   └── VideoRoom/            # Post-MVP Daily.co (заготовлен, не активирован)
    └── admin/
        ├── ApplicationSheet/
        └── ComplaintCard/
```

---

## 14. Vercel + Neon + Prisma v7 — Инфраструктурные требования

```
Vercel Build:
  Build command:   prisma generate && next build
  Install command: npm ci
  Node version:    20.x

Environment variables:
  DATABASE_URL  — Neon pooled URL (pgBouncer), для runtime
  DIRECT_URL    — Neon direct URL, для Prisma migrations
  AUTH_SECRET   — random 32-byte string (openssl rand -base64 32)
  AUTH_URL      — https://your-domain.vercel.app (или NEXTAUTH_URL)

Neon:
  PostgreSQL v17
  Region: fra1 (Frankfurt) или ближайший к пользователям
  Branch: main (production), dev (preview deployments)
  Connection limit Serverless: connection_limit=1 в DATABASE_URL
```

---

## 15. Checklist перед каждым компонентом

- [ ] Контраст WCAG AA (4.5:1 для текста, 3:1 для UI элементов)
- [ ] Mobile layout (375px min-width)
- [ ] Tablet layout (768px)
- [ ] Desktop layout (1024px+)
- [ ] Hover, focus-visible, active, disabled состояния
- [ ] Dark mode (только CSS vars, без хардкода цветов)
- [ ] Skeleton для async данных
- [ ] Empty state с CTA
- [ ] `prefers-reduced-motion` уважается
- [ ] Safe area inset для bottom-fixed элементов
- [ ] Touch targets минимум 44×44px (WCAG 2.5.5)
- [ ] Нет hydration mismatch (theme/locale клиентские)
