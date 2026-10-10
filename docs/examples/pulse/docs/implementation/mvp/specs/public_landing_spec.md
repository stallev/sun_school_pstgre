# Public Landing Spec — Pulse (P16)

**Тип:** Spec  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-25  
**Волна:** W22  
**Фаза:** **P16** — Public Landing v2 (после P14 quality gate)  
**Зависит от:** [`pages_functional_spec.md`](../../../prds/01_product_scope/pages_functional_spec.md), [`global_shell_spec.md`](./global_shell_spec.md), [`catalog_discovery_spec.md`](./catalog_discovery_spec.md)  
**Связанные документы:** [`P16_phase_description.md`](../phases_tasks_descriptions/P16_phase_description.md), wireframe [`public_landing.md`](../../../design/wireframes/mvp/public_landing.md), prototype [`Pulse Landing Page -Standalone-.html`](../../../prototypes/Pulse Landing Page -Standalone-.html)

**Supersedes:** P04 landing section in `catalog_discovery_spec.md` for visual/structural truth — query rules remain in catalog spec.

---

## Purpose

Канонический functional + visual contract для публичного маршрута `/`: секции, CTAs, данные, состояния, a11y. Имплементация **заменяет** P04 landing components целиком.

**Аудитория:** AI-агенты P16; design QA.

---

## Route metadata

| Field | Value |
|-------|--------|
| **Path** | `/` |
| **Group** | `(marketing)` |
| **Role** | public (anonymous + optional session) |
| **Layout** | Dedicated marketing chrome — **not** authenticated `AppShell` |
| **Prototype** | [`Pulse Landing Page -Standalone-.html`](../../../prototypes/Pulse Landing Page -Standalone-.html) |
| **Locale (MVP)** | RU user-visible copy via `@/lib/messages` |

### SEO & social sharing

| Concern | Implementation |
|---------|----------------|
| **Title / description** | `MESSAGES.landing.meta.*` via `buildLandingMetadata()` in `(marketing)/page.tsx` |
| **Open Graph / Twitter** | `openGraph` + `twitter` (`summary_large_image`); canonical `/` |
| **OG image** | `app/opengraph-image.tsx` (1200×630, Warm Forest tokens) |
| **metadataBase** | Root `layout.tsx` → `getSiteUrl()` (`NEXT_PUBLIC_SITE_URL` or `VERCEL_URL`) |
| **JSON-LD** | `LandingJsonLd` — `@graph`: `WebSite`, `Organization`, `WebPage`, `FAQPage` (FAQ from `landing.faq.items`) |

---

## Section order (MUST)

Fixed top-to-bottom order matching prototype:

1. **LandingNav** — fixed; **56px** height on mobile (`< md`), **72px** on `≥ md`; scroll backdrop. Mobile: logo + primary CTA + theme toggle + menu (bottom Sheet: anchors, Sign in, locale); desktop: inline anchor links + locale + theme + Sign in + Get started
2. **LandingHero** — split grid `≥1024px`; float cards hidden `<1024px`
3. **LandingTrustBar** — dark forest stats row (optional toggle via product — default **on**)
4. **LandingHowItWorks** — `id="how"`, white background
5. **LandingSpecialtyPills** — cream background
6. **LandingFeaturedTrainers** — `id="trainers"`, white background
7. **LandingTestimonials** — `id="reviews"`, cream background
8. **LandingForTrainers** — dark forest full-bleed
9. **LandingFaq** — `id="faq"`, white background
10. **LandingFinalCta** — primary forest background
11. **LandingFooter** — cream-dk

**MUST NOT** include prototype **Tweaks Panel** in product builds.

---

## CTA matrix

| Control | Label (RU, messages key) | Target |
|---------|--------------------------|--------|
| Nav — Sign In | `landing.nav.signIn` | `/auth/login` |
| Nav — Get Started | `landing.nav.getStarted` | `/auth/register` |
| Hero primary | `landing.hero.primaryCta` | `/trainers` |
| Hero secondary | `landing.hero.secondaryCta` | `/auth/register/trainer` |
| Featured footer | `landing.featured.browseAll` | `/trainers` |
| For trainers CTA | `landing.forTrainers.cta` | `/auth/register/trainer` |
| Final CTA primary | `landing.final.primaryCta` | `/trainers` |
| Final CTA secondary | `landing.final.secondaryCta` | `/auth/register/trainer` |
| Specialty pill click | — | `/trainers` (+ optional `?specialty=` when FM wired) |
| Trainer card click | — | `/trainers/[id]` |

**Primary CTA rule:** one `Button` `default` variant per major section viewport; hero + final CTA may both use primary — distinct scroll regions OK per design system.

---

## Data dependencies

| Section | Source (MVP) | Notes |
|---------|--------------|-------|
| Hero float cards | Static fixture | Decorative; not live DB |
| Trust bar stats | Static constants | Aggregates post-MVP optional |
| Steps, benefits, testimonials, FAQ | Static `@/lib/messages` | MVP — no CMS |
| Specialty pills | Static list | Counts illustrative until catalog aggregate API |
| Featured trainers | DB: `approved` trainers, limit **3** | Same visibility as catalog (INV-03) |

### Featured trainers query

- **Filter:** `TrainerProfile.status = approved`
- **Sort:** rating desc, then recent activity (match catalog default or documented stub)
- **Limit:** 3 (prototype grid)
- **Fallback:** fixture cards when seed empty (dev only — production prefers empty state)

---

## MVP guardrails (copy & claims)

FAQ and marketing copy **MUST NOT** promise MVP-out-of-scope behavior without «post-MVP» qualifier:

| Topic | MVP truth |
|-------|-----------|
| Payments | Booking without Stripe checkout |
| Video sessions | Placeholder `/sessions/[id]` — no Daily.co |
| Built-in video call in FAQ | Rephrase to scheduled session reminder / future video |
| Subscriptions | Per-session booking only |

Product/legal review **SHOULD** pass FAQ text before ship.

---

## Component inventory

| Component | Server / Client | Notes |
|-----------|-----------------|-------|
| `LandingNav` (`MarketingNav`) | client | `useScrolled`; mobile menu via `MarketingNavMobileMenu` (bottom Sheet) |
| `LandingHero` | server | composes float cards |
| `LandingHeroFloatCard` | server | presentational |
| `LandingTrustBar` | client | IO + count-up |
| `LandingHowItWorks` | server | |
| `LandingSpecialtyPills` | server | links |
| `LandingFeaturedTrainers` | server | Suspense child |
| `LandingFeaturedTrainersSkeleton` | server | |
| `LandingFeaturedTrainersError` | client | retry |
| `LandingFeaturedTrainersEmpty` | server | |
| `LandingTestimonials` | server | |
| `LandingForTrainers` | server | |
| `LandingFaq` | client | single-open accordion |
| `LandingFinalCta` | server | |
| `LandingFooter` | server | |
| `LandingAuthenticatedRedirect` | server | optional — redirect authed users to role home |

**DELETE (P04 legacy):** all prior `components/landing/*` not listed above.

---

## UI states

| Region | happy | loading | empty | error |
|--------|-------|---------|-------|-------|
| Static sections | always render | — | — | — |
| Featured trainers | 3-card grid | skeleton row | Empty + CTA `/trainers` | Alert + retry |
| Page-level | — | optional `loading.tsx` shell | — | segment `error.tsx` rare |

Hero and marketing sections **MUST** remain visible when featured block fails.

---

## Responsive breakpoints (from prototype)

| Breakpoint | Behavior |
|------------|----------|
| `<768px` | Single column; nav links hidden; trust bar 2×2 grid |
| `768–1023px` | Trainers 2-col; hero visual hidden |
| `≥1024px` | Hero split + float cards; trainers 3-col |

Padding: `sec` → `96px 56px` desktop, `64px 24px` mobile (tokenized equivalents).

---

## Motion & a11y

- Scroll-reveal: `.rv` pattern — opacity + translate; disabled when `prefers-reduced-motion: reduce`
- Trust counters: animate only when bar intersects; static final values when reduced motion
- FAQ: `<button type="button">` per item; `aria-expanded`; one panel open at a time (prototype behavior)
- **One `<h1>`** in hero; section titles `h2`
- Skip link to `#main` per shell spec
- Icon-only controls: `aria-label` from messages

---

## Design tokens

Map prototype CSS variables to Warm Forest semantic tokens in `globals.css` — **no raw hex** in product components.

| Prototype token | Semantic direction |
|-----------------|-------------------|
| `--forest` | `primary` / `bg-primary` |
| `--forest-dk` | `--color-brand-band` (stats bar, for-trainers); **not** `--color-primary-hover` |
| `--forest-cta` | `--color-brand-cta-band` (final CTA band) |
| `--cream` | `background` / section alt |
| `--gold` | `accent` / stars |
| `--ink` | `foreground` |

Typography: `font-heading` (Source Serif 4) for display titles; `font-sans` (Manrope) for UI.

---

## Authenticated visitors

**Default (MVP):** show landing to all; optional `LandingAuthenticatedRedirect` sends logged-in users to role dashboard — if enabled, document in phase tasks and keep single redirect point.

---

## Acceptance criteria (spec-level)

- [x] PL-MUST-1: Section order matches §Section order
- [x] PL-MUST-2: All CTAs resolve to canonical routes
- [x] PL-MUST-3: Featured trainers approved-only (`TRAINER_STATUS.APPROVED`, limit 3)
- [x] PL-MUST-4: P04 landing components removed
- [x] PL-MUST-5: RU copy via `@/lib/messages`
- [x] PL-MUST-6: No Tweaks Panel in production
- [x] PL-MUST-7: FAQ + motion meet **ui-semantics-a11y** (`prefers-reduced-motion` on Reveal + StatsBar)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P16_tasks.md`](../tasks/P16_tasks.md) | Implementation checklist |
| [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P16 CREATE/DELETE |
| [`design_system_lab_spec.md`](./design_system_lab_spec.md) | L3 marketing patterns |
| [`P04_phase_description.md`](../phases_tasks_descriptions/P04_phase_description.md) | Historical |

**Registry:** W22

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-25 | v2.2 — SEO: Open Graph, Twitter, JSON-LD, OG image contract |
| 2026-05-25 | v2.1 — PL-MUST acceptance criteria verified (P16 completion) |
| 2026-05-25 | v2.0 — P16 landing v2 spec; standalone prototype as visual source |
| 2026-05-23 | v1.0 — implicit in catalog_discovery_spec + P04 (superseded structurally) |
