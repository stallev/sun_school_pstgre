# P16 Tasks — Public Landing v2

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.1  
**Дата:** 2026-05-25  
**Волна:** W22  
**Зависит от:** [`P16_phase_description.md`](../phases_tasks_descriptions/P16_phase_description.md)  
**Связанные документы:** [`public_landing_spec.md`](../specs/public_landing_spec.md), [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md), [`Pulse Landing Page -Standalone-.html`](../../../prototypes/Pulse Landing Page -Standalone-.html)

---

## Purpose

Чеклист **P16** — full replace публичного landing `/` по standalone-прототипу: **сначала** shared marketing catalog на Design Lab, **затем** тонкая композиция `components/landing/*`.

---

## 0. Gate

- [x] P14 DoD complete **or** product sign-off on post–quality-gate landing rework — **skipped:** tech-only verification per product decision (2026-05-25)
- [x] [`public_landing_spec.md`](../specs/public_landing_spec.md) + wireframe v2 reviewed
- [x] Standalone prototype available at `docs/prototypes/Pulse Landing Page -Standalone-.html`

## 1. Design Lab — marketing catalog (Wave A + L3)

**Showcase:** `/design-system` → `#marketing` · **Product import:** `@/components/atoms`, `@/components/ui/*`, `@/components/catalog/*` only.

- [x] `SectionEyebrow` — `components/atoms/SectionEyebrow/`
- [x] `Container` variant `marketing` — `components/ui/container.tsx`
- [x] `MarketingSectionHeader` — `components/ui/MarketingSectionHeader.tsx`
- [x] `TrustFeaturePill`, `StepCard`, `DiscoveryPill`, `TestimonialCard`
- [x] `StatMetricCell`, `StatsBar.client.tsx`
- [x] `BenefitRow`, `DarkStatTile`, `BrandSection`, `CtaBand`
- [x] `Reveal.client.tsx`, `MarketingAccordion.client.tsx`
- [x] `FeaturedTrainerCard` — `components/catalog/FeaturedTrainerCard.tsx`
- [x] Hooks: `lib/ui/use-reveal-on-scroll.ts`, `lib/ui/use-count-up.ts`
- [x] Token `--shadow-float-card` in `globals.css`
- [x] `DesignLabMarketing*.client.tsx` + `lib/design-lab/marketing-fixtures.ts`

## 2. Decommission (DELETE P04-only)

- [x] Remove `LandingValueProps.tsx`
- [x] Remove `LandingCategoryChips.tsx`
- [x] Remove `SiteFooter.tsx` → replaced by `LandingFooter.tsx`
- [x] Remove `FeaturedTrainersSkeleton.tsx` → `LandingFeaturedTrainersSkeleton.tsx`
- [x] Remove `FeaturedTrainersRetryButton.client.tsx` → `LandingFeaturedTrainersRetryButton.client.tsx`
- [x] **Replace** P04 `LandingHero` / featured modules with v2 catalog-based implementations (same route, new composition)
- [x] Keep `LandingAuthenticatedRedirect.server.tsx`
- [x] Rewrite `(marketing)/page.tsx` — full P16 section order; no P04 imports

## 3. Layout & shell

- [x] `(marketing)/layout.tsx` — minimal shell (`SkipToMainLink` + `<main>`, `scroll-smooth`); **no** `TopBar` on `/`
- [x] `(marketing)/auth/layout.tsx` — `PublicChrome` for `/auth/*`
- [x] `LandingNav.client.tsx` — fixed `h-[72px]`, scroll backdrop, anchor links `≥ md`, auth CTAs
- [x] Mobile: hide inline nav links `< md`; preserve Sign In + Get Started
- [x] `prefers-reduced-motion`: `Reveal` + `StatsBar` / `useCountUp` static fallback

## 4. Static sections (CREATE — catalog composition)

| Task | Landing module | Primary catalog |
|------|----------------|-----------------|
| [x] | `LandingHero.tsx` + `LandingHeroFloatCard.tsx` | `SectionEyebrow`, `Heading`, `Button`, `TrustFeaturePill`, `Reveal`, `Container`; float fixture `lib/landing/landing-hero-float-cards.ts`; visual hidden `< lg` |
| [x] | `LandingTrustBar.client.tsx` | `StatsBar` + `getLandingTrustMetrics()` |
| [x] | `LandingHowItWorks.tsx` | `MarketingSectionHeader`, `StepCard` · `#how` |
| [x] | `LandingSpecialtyPills.tsx` | `DiscoveryPill` → `/trainers?specialty=` |
| [x] | `LandingTestimonials.tsx` | `TestimonialCard` · `#reviews` |
| [x] | `LandingForTrainers.tsx` | `BrandSection`, `BenefitRow`, `DarkStatTile`, `Button` |
| [x] | `LandingFaq.client.tsx` | `MarketingAccordion` · `#faq` |
| [x] | `LandingFinalCta.tsx` | `CtaBand`, `Button`, `TrustFeaturePill` |
| [x] | `LandingFooter.tsx` | `Container`, `CustomLink`, `ContentText` |

## 5. Dynamic section

- [x] `LandingFeaturedTrainers.server.tsx` + Suspense on `page.tsx`
- [x] `LandingFeaturedTrainersSkeleton` / `Empty` / `Error` + retry button
- [x] Approved trainers only; `getFeaturedTrainers` limit **3**; card → `/trainers/[id]` via `FeaturedTrainerCard`
- [x] «Browse all» → `/trainers` (`landing.featured.browseAll`)

## 6. Hooks & client boundaries

- [x] `lib/ui/use-landing-scrolled.ts` — `LandingNav`
- [x] `lib/ui/use-reveal-on-scroll.ts` — `Reveal`
- [x] `lib/ui/use-count-up.ts` — `StatsBar`
- [x] Client modules: `LandingNav`, `LandingTrustBar`, `LandingFaq`, retry button; ≤140 lines/file

## 7. Tokens, catalog & messages

- [x] Semantic tokens only — no prototype hex in product JSX
- [x] Full `landing.*` namespace in `@/lib/messages/ru.ts` (RU; FAQ MVP guardrails)
- [x] Lucide icons per **ui-icons-lucide**
- [x] Design Lab L3 `#marketing` (required, not optional)

## 8. Verification

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] Smoke: all CTAs and anchor links (Playwright anonymous `/` — `/trainers`, `/auth/*`, `#how`/`#trainers`/`#reviews`/`#faq`)
- [x] Smoke: featured empty/error paths (code: `try/catch` → `LandingFeaturedTrainersError` + retry `router.refresh()`; empty → `LandingFeaturedTrainersEmpty`; happy path with 3 approved cards verified)
- [x] Visual: 390px, 768px, 1280px vs prototype (nav hidden `< md`; hero split `≥ lg`; section order `#how` → `#trainers` → `#reviews` → `#faq`)
- [x] A11y: one `h1`, FAQ `aria-expanded` + keyboard click, `prefers-reduced-motion` (Reveal + StatsBar)
- [x] **MUST NOT** ship Tweaks Panel to production

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P16_phase_description.md`](../phases_tasks_descriptions/P16_phase_description.md) | DoD |
| [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P16 row — catalog + landing synced v2.1 |
| [`P04_tasks.md`](./P04_tasks.md) | Historical — superseded |

**Registry:** W22

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-25 | v1.2 — §0 gate skipped (tech-only); §8 verification complete; `use-prefers-reduced-motion` polish |
| 2026-05-25 | v1.1 — §1 marketing catalog; landing composition table; layout split; implementation status |
| 2026-05-25 | v1.0 — Initial P16 task checklist |
