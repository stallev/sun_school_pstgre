# Typography and text content — Sunday School

Typography for **`apps/web`** using shared atoms (on scaffold), semantic HTML, Slate Cobalt font tokens, and accessibility.

**Design source:** [`visual_identity_contract.md`](../design/visual_identity_contract.md), interim [`sunday_school_prototype.html`](../prototypes/sunday_school_prototype.html) §typography  
**UI rule:** **ui-design-system-shadcn**

---

## Font stack (target)

| Role | Font | CSS token |
|------|------|-----------|
| Headings / display / стихи | **Alegreya** (500, 700, italic 400) | `font-display` |
| UI / body | **Source Sans 3** (400, 500, 600, 700; latin + cyrillic) | `font-body` |
| Code / times / IDs | system monospace (`ui-monospace`) — отдельный шрифт не подключается | `font-mono` |

Канон шрифтов и токенов — [`visual_identity_contract.md`](../design/visual_identity_contract.md) v2.0 (D-2, D-5) и [ADR-014](../prds/07_governance/adr_014_app_redesign_v2.md) R-1, R-2. Source Sans 3 заменил Alegreya Sans: у неё низкий x-height, основной текст читался мелко. Максимум два семейства на страницу.

Wire via `next/font/google` in root `layout.tsx` (`Alegreya`, `Source_Sans_3`, subsets `latin` и `cyrillic`, `display: "swap"`, CSS-переменные `--font-alegreya` и `--font-source-sans`); map in `globals.css` `@theme inline` (`--font-display`, `--font-body`, `--font-sans`). Базовый кегль — `html { font-size: 112.5% }` (18 px).

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

From design system — **mobile-first** (base = mobile, `md:`/`lg:` = desktop). База 18 px (v2.0), px в таблице — при ней:

| Context | Mobile | Desktop |
|---------|--------|---------|
| Page title | `text-[1.75rem]` (31.5 px) | `sm:text-[2.125rem]` (38.25 px) |
| Section title | `text-[1.25rem]` (22.5 px), `font-display` | same |
| Body, подписи полей, ячейки таблиц, кнопки, чипы, пункты меню | `text-base` (18 px) | `text-base` |
| Caption / meta (подпись под значением, подсказка) | `text-sm text-muted-foreground` (15.75 px) — **пол кегля** | same |
| Badge / CountBadge | `text-xs` (13.5 px) — единственное место `text-xs` | same |
| Analytics cards only | тело `text-[1.25rem] leading-snug` (22.5 px; v2.0 — `1.3125rem` пересчитан под базу 18 px, чтобы сохранить ~22 px P11); мета (`N=`, «из 10») `text-base` (18 px). KPI (`NumberDisplay size="kpi"`, hero `text-[3.5rem]`) и заголовок страницы не менять. Тело приложения остаётся `text-base` — это исключение типа карточки, не глобальная шкала | same |

**Правила v2.0 (ADR-014 R-3):**

- В содержимом `<main>` нет `text-xs` и `text-[…rem]` меньше `0.875rem`.
- `text-sm` — только подпись под значением, подсказка, метаданные строки; подпись поля, ячейка таблицы, пункт списка — `text-base`.
- Интерактив (кнопка, чип, сегмент, пункт меню, `Select`) — `text-base`, `font-medium` у кнопок и чипов.
- Тексты стихов — `font-display italic`, `text-base`.
- `line-height` основного текста — 1.5 (`leading-normal`); проза 45–75 символов в строке (`max-w-prose` или `PageSection width="form"`).
- Миграция существующих `text-sm`/`text-xs` — таблица ролей в [`redesign_v2_ui_spec.md`](../design/redesign_v2_ui_spec.md) §3.6.

**Prototype parity:** match font family, weight, and size from [`sunday_school_prototype.html`](../prototypes/sunday_school_prototype.html) — Cursor rule **ui-prototype-fidelity**.

---

## Accessibility

- Real heading hierarchy — do not skip levels for styling alone (`visualLevel` prop when atoms added)
- Semantic landmarks in layouts: `main`, `nav`, `header`, `footer` — **ui-semantics-a11y**
- Sufficient contrast per Slate Cobalt tokens (light + dark) — WCAG 2.1 AA
- `sr-only` for icon-only buttons with lucide icons; decorative icons — `aria-hidden`

---

## User-visible copy

All strings from **`@/lib/messages`** — not hardcoded in typography components except dev placeholders.

**Reference:** Pulse snapshot [`typography_text_guidelines.md`](../examples/pulse/docs/guidelines/typography_text_guidelines.md) — Calm Editorial → Slate Cobalt.
