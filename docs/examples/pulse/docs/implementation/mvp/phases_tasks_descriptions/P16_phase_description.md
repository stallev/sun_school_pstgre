# P16 — Public Landing v2

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 1.1  
**Дата:** 2026-05-25  
**Волна:** W22  
**Зависит от:** [`P14_phase_description.md`](./P14_phase_description.md), [`public_landing_spec.md`](../specs/public_landing_spec.md), [`global_shell_spec.md`](../specs/global_shell_spec.md)  
**Связанные документы:** [`P16_tasks.md`](../tasks/P16_tasks.md), [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md), wireframe [`public_landing.md`](../../../design/wireframes/mvp/public_landing.md) v2, prototype [`Pulse Landing Page -Standalone-.html`](../../../prototypes/Pulse Landing Page -Standalone-.html)

**Supersedes (visual):** P04 MVP landing — historical phase unchanged; **P16 = full replace** of P04 landing modules + route composition на catalog L3.

---

## Purpose

Фаза **P16** — пересборка публичного landing `/` в полном соответствии с standalone-прототипом: fixed nav, hero split + float cards, trust bar, how-it-works, specialties, featured trainers, testimonials, for-trainers, FAQ, final CTA, footer.

**Архитектурный принцип:** секции `components/landing/*` — **тонкая композиция**; повторяющаяся разметка — только через **Design Lab catalog** (`@/components/atoms`, `@/components/ui/*`, `@/components/catalog/*`). **MUST NOT** импортировать `@/components/design-lab/**` в product routes.

**Аудитория:** AI-агенты после P14 quality gate (или explicit product sign-off на post–quality-gate marketing rework).

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P16_tasks.md`](../tasks/P16_tasks.md) | Checklist |
| 2 | [`public_landing_spec.md`](../specs/public_landing_spec.md) | Sections, CTA, data, a11y |
| 3 | [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md) | Catalog layers; L3 Marketing section |
| 4 | [`public_landing.md`](../../../design/wireframes/mvp/public_landing.md) v2 | Wireframe W10-02 |
| 5 | [`Pulse Landing Page -Standalone-.html`](../../../prototypes/Pulse Landing Page -Standalone-.html) | Visual source of truth for `/` |
| 6 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P16 row only |
| 7 | [`global_shell_spec.md`](../specs/global_shell_spec.md) | Marketing layout vs AppShell |
| 8 | [`catalog_discovery_spec.md`](../specs/catalog_discovery_spec.md) | Featured trainers query |

**Prototype priority for `/`:** standalone landing HTML **over** `Fitness_Platform_Prototype_v1.html`.

**MUST NOT read** P18+ feature phase docs in the same session.

---

## Scope / Out of scope

### In scope

| Area | Deliverable |
|------|-------------|
| **Design Lab catalog (Wave A + L3 Marketing)** | Shared marketing primitives на `/design-system` → `#marketing` |
| Decommission | **DELETE** P04-only landing modules; **REPLACE** hero/featured/footer composition |
| Layout | `(marketing)/layout.tsx` — minimal shell; `(marketing)/auth/layout.tsx` — `PublicChrome`; `/` — `LandingNav` fixed |
| Static sections | Hero, trust bar, steps, specialties, testimonials, for-trainers, FAQ, final CTA, footer |
| Dynamic | Featured trainers (approved-only; Suspense + skeleton/error/empty) |
| Motion | `Reveal` + `StatsBar` count-up; `prefers-reduced-motion` guard |
| Copy | `@/lib/messages` namespace `landing.*` — use `getMessages()` when P17 landed; until then RU values in `ru.ts` |
| Locales | Full i18n infrastructure → **P17** (ADR-009); P16 MUST NOT block on EN copy if P17 follows |
| CTAs | Primary → `/trainers`; trainer apply → `/auth/register/trainer`; sign in → `/auth/login` |

### Out of scope

- **Tweaks Panel** from prototype (dev-only demo widget)
- Catalog filters, profile, booking (→ P05–P07)
- Stripe checkout UI, video session UI, subscription billing (post-MVP / PRD guard)
- i18n infrastructure beyond messages tree → **P17** ([`adr_009_ui_locale_strategy.md`](../../../prds/07_governance/adr_009_ui_locale_strategy.md))
- Design Lab showcase imports in product routes

---

## UI Catalog (this phase)

### CREATE — shared catalog (Design Lab L3 Marketing; import in product)

| Layer | Component | Path |
|-------|-----------|------|
| Atom | `SectionEyebrow` | `components/atoms/SectionEyebrow/` |
| UI | `Container` variant `marketing` | `components/ui/container.tsx` |
| UI | `MarketingSectionHeader` | `components/ui/MarketingSectionHeader.tsx` |
| UI | `TrustFeaturePill` | `components/ui/TrustFeaturePill.tsx` |
| UI | `StepCard` | `components/ui/StepCard.tsx` |
| UI | `DiscoveryPill` | `components/ui/DiscoveryPill.tsx` |
| UI | `TestimonialCard` | `components/ui/TestimonialCard.tsx` |
| UI | `StatMetricCell`, `StatsBar` | `components/ui/StatMetricCell.tsx`, `StatsBar.client.tsx` |
| UI | `BenefitRow`, `DarkStatTile`, `BrandSection`, `CtaBand` | `components/ui/` |
| UI | `Reveal`, `MarketingAccordion` | `Reveal.client.tsx`, `MarketingAccordion.client.tsx` |
| Catalog | `FeaturedTrainerCard` | `components/catalog/FeaturedTrainerCard.tsx` |

**Hooks / helpers (non-JSX):** `lib/ui/use-reveal-on-scroll.ts`, `lib/ui/use-count-up.ts`, `lib/ui/use-landing-scrolled.ts`, `lib/landing/landing-hero-float-cards.ts`, `lib/landing/landing-trust-metrics.ts`.

**Token:** `--shadow-float-card` in `globals.css` (hero float cards).

**Design Lab:** `DesignLabMarketing*.client.tsx` — секция `#marketing` на `/design-system`.

### CREATE — route composition (`components/landing/`)

| Component | Server / Client | Route |
|-----------|-----------------|-------|
| `LandingNav` | client | `/` |
| `LandingHero`, `LandingHeroFloatCard` | server | `/` |
| `LandingTrustBar` | client | `/` |
| `LandingHowItWorks` | server | `/` |
| `LandingSpecialtyPills` | server | `/` |
| `LandingFeaturedTrainers` | server | `/` |
| `LandingFeaturedTrainersSkeleton` | server | `/` |
| `LandingFeaturedTrainersEmpty` | server | `/` |
| `LandingFeaturedTrainersError` | server | `/` |
| `LandingFeaturedTrainersRetryButton` | client | `/` |
| `LandingTestimonials` | server | `/` |
| `LandingForTrainers` | server | `/` |
| `LandingFaq` | client | `/` |
| `LandingFinalCta` | server | `/` |
| `LandingFooter` | server | `/` |

### USE (existing catalog)

`Button`, `CustomLink`, `Heading`, `ContentText`, `SectionTitle`, `RatingStars`, `VerifiedBadge`, `SpecChip`, `PhotoSlot`, `PulseCard`, `Skeleton`, `Empty`, `Alert`.

### KEEP

| Component | Notes |
|-----------|-------|
| `LandingAuthenticatedRedirect` | Redirect authed users to role home |

### DELETE (P04-only)

`LandingValueProps`, `LandingCategoryChips`, `SiteFooter`, `FeaturedTrainersSkeleton`, `FeaturedTrainersRetryButton.client.tsx` — заменены v2-модулями или catalog composition.

**MUST NOT:** `TweaksPanel`, `@/components/design-lab/**` in product routes.

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P14** complete | Yes (recommended) | Quality gate before marketing rework |
| **P05** seed / approved trainers | No | Empty state OK for featured row |
| **P03** fonts/tokens | Yes | Warm Forest tokens in `globals.css` |
| **Design Lab catalog** | Yes (for P16) | Marketing L3 на `/design-system` до дублирования markup на `/` |
| **P19** complaints | No | Independent |

---

## In-scope routes

| Path | Content |
|------|---------|
| `/` | Full landing v2 |
| `/auth/*` | Unchanged auth flows; `PublicChrome` via `(marketing)/auth/layout.tsx` |

---

## Happy path smoke

1. Anonymous opens `/` → all static sections render; one `h1` in hero.
2. Primary CTA «Найти тренера» → `/trainers`.
3. «Стать тренером» → `/auth/register/trainer`.
4. Sign In → `/auth/login`; Get Started → `/auth/register`.
5. Anchor links `#how`, `#trainers`, `#reviews`, `#faq` scroll smoothly (`scroll-smooth` on marketing layout).
6. Featured trainers: approved only, limit 3; empty state + CTA when none.
7. FAQ accordion: keyboard + `aria-expanded`.
8. Visual check 390px / 768px / 1280px vs standalone prototype.

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| No approved trainers | Featured empty + CTA → `/trainers` |
| Featured query error | Section error + retry; hero/static sections remain |
| `prefers-reduced-motion` | No scroll-reveal / counter animation required for comprehension |

---

## Security smoke

| Check | Expected |
|-------|----------|
| Pending trainer in featured query | Excluded (INV-03) |
| Auth-only data on public page | None |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Ad-hoc markup in `landing/*` | Compose from catalog; extend CVA in `ui/` + Design Lab first |
| Partial patch on P04 components | **DELETE** P04-only files; rewrite `page.tsx` |
| Prototype hex in product | Semantic Tailwind tokens only |
| EN copy left in UI | All strings in `@/lib/messages` RU |
| Post-MVP FAQ claims (Stripe/video) | Spec §MVP guardrails — copy aligned to MVP |
| Horizontal `TrainerCard` on landing featured | Use `FeaturedTrainerCard` (vertical marketing variant) |
| `PublicChrome` TopBar on `/` | Minimal `(marketing)/layout`; TopBar only on `/auth/*` |

---

## Definition of done

- [x] Marketing catalog + Design Lab `#marketing` (Wave A + L3 patterns)
- [x] Landing route sections composed from catalog imports
- [x] P04-only landing modules removed
- [x] `landing.*` messages (RU) + `getFeaturedTrainers` limit 3
- [x] `npm run typecheck` + `npm run lint`
- [x] Manual smoke paths above (390 / 768 / 1280 vs prototype)
- [x] Product sign-off on post–P14 landing rework (gate §0) — **skipped:** tech-only verification (2026-05-25)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P04_phase_description.md`](./P04_phase_description.md) | Historical MVP landing |
| [`P05_phase_description.md`](./P05_phase_description.md) | Catalog entry from CTAs |
| [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md) | Catalog contract + L3 Marketing |
| [`_migration_P15-P20_renumbering.md`](./_migration_P15-P20_renumbering.md) | W22 renumbering |

---

## Agent notes

- **Одна сессия = P16 only.**
- **Порядок:** catalog + Design Lab `#marketing` → `components/landing/*` composition → `(marketing)/page.tsx`.
- Open standalone prototype locally side-by-side with `/` at 390px and `md+`.
- Float cards — decorative fixture (`lib/landing/landing-hero-float-cards.ts`); hidden `< lg`.

**Registry:** W22

---

## Acceptance criteria

- [x] Landing sections use catalog imports (no `@/components/design-lab/**`)
- [x] Landing v2 visual parity with standalone prototype (structure + tokens) — manual QA (Playwright 390/768/1280)
- [x] P04-only landing modules removed
- [x] Smoke-ready: typecheck + lint pass

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-25 | v1.1 — Marketing catalog (Wave A + L3), landing composition paths, layout split, DoD status |
| 2026-05-25 | v1.0 — Initial P16 phase description |
