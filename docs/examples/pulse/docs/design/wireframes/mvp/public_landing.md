# Wireframe: Public Landing

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 2.0 | **Дата:** 2026-05-25 | **Волна:** W22  
**Зависит от:** [`pages_functional_spec.md`](../../../prds/01_product_scope/pages_functional_spec.md), [`public_landing_spec.md`](../../implementation/mvp/specs/public_landing_spec.md)  
**Route:** `/` · **Group:** `(marketing)` · **Role:** public · **Phase:** **P16**  
**Prototype:** [`Pulse Landing Page -Standalone-.html`](../../../prototypes/Pulse Landing Page -Standalone-.html)

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | «Найти тренера» → `/trainers` |
| **Secondary CTA** | «Стать тренером» → `/auth/register/trainer` |
| **Nav CTA** | «Войти» → `/auth/login`; «Начать» → `/auth/register` |
| **Spec** | [`public_landing_spec.md`](../../implementation/mvp/specs/public_landing_spec.md) |
| **Supersedes** | v1.0 (P04 minimal landing) — historical only |

## Components

`LandingNav`, `LandingHero`, `LandingTrustBar`, `LandingHowItWorks`, `LandingSpecialtyPills`, `LandingFeaturedTrainers`, `LandingTestimonials`, `LandingForTrainers`, `LandingFaq`, `LandingFinalCta`, `LandingFooter` — see [`ui_component_phase_matrix.md`](../../implementation/mvp/ui_component_phase_matrix.md) P16.

## Regions (top → bottom)

1. **Nav (fixed)** — logo; **mobile:** primary CTA + theme toggle + menu (bottom Sheet: anchors, Sign in, locale); **desktop:** anchor links, Sign in + pill CTA; blurred backdrop on scroll. Heights: 56px mobile, 72px `≥ md`.
2. **Hero** — badge, `h1` with italic accent, subcopy, dual CTAs, trust chips, social proof row; right: stacked float trainer cards (desktop).
3. **Trust bar** — 4 stats on forest-dk (trainers, sessions, satisfaction, rating).
4. **How it works** — section label, `h2`, 3 step cards with large serif numbers.
5. **Specialties** — horizontal wrap of discipline pills with counts.
6. **Featured trainers** — 3-card grid; verified badge, price pill, tags; «Browse all» outline CTA.
7. **Testimonials** — 3 quote cards, stars, avatar initials.
8. **For trainers** — split: benefits list + CTA white button; right 2×2 stat cards on dark bg.
9. **FAQ** — accordion list, max-width ~720px centered.
10. **Final CTA** — full-width forest, decorative circles, dual CTAs, trust line.
11. **Footer** — logo, tagline, legal links, copyright.

## Data dependencies

| Section | Data |
|---------|------|
| Featured trainers | Approved trainers from DB (limit 3) or empty/fixture |
| All other sections | Static `@/lib/messages` (RU) |

## Guardrails

- No auth required; no role bottom nav.
- No payment/video/subscription UI (MVP).
- No prototype Tweaks Panel in product.

## States

| State | Description |
|-------|-------------|
| happy | Full page; featured grid populated |
| empty | Featured `Empty` + CTA → `/trainers`; static sections unchanged |
| loading | Featured skeleton only |
| error | Featured Alert + Retry; static sections unchanged |
| forbidden | N/A |

## Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────┐
│ [fixed Nav]  Logo   How·Trainers·Reviews·FAQ    SignIn [CTA] │
├──────────────────────────────────────────────────────────────┤
│ HERO split                          │  Float trainer cards   │
│ badge · h1 · sub · CTAs · chips     │  (stacked, rotated)    │
├──────────────────────────────────────────────────────────────┤
│ TRUST BAR (4 stats, forest-dk)                               │
├──────────────────────────────────────────────────────────────┤
│ HOW IT WORKS — 3 cards                                       │
├──────────────────────────────────────────────────────────────┤
│ SPECIALTIES — pill row                                       │
├──────────────────────────────────────────────────────────────┤
│ FEATURED TRAINERS — 3-col grid · [Browse all]                │
├──────────────────────────────────────────────────────────────┤
│ TESTIMONIALS — 3-col                                         │
├──────────────────────────────────────────────────────────────┤
│ FOR TRAINERS (dark) — benefits │ stat grid                  │
├──────────────────────────────────────────────────────────────┤
│ FAQ accordion                                                │
├──────────────────────────────────────────────────────────────┤
│ FINAL CTA (forest, centered)                                 │
├──────────────────────────────────────────────────────────────┤
│ FOOTER                                                       │
└──────────────────────────────────────────────────────────────┘
```

## Mobile (<768px)

```
┌────────────────────┐
│ Nav · logo ·CTA ☀ ≡│
│ (menu sheet)       │
├────────────────────┤
│ Hero stack         │
│ (no float cards)   │
├────────────────────┤
│ Trust 2×2          │
├────────────────────┤
│ Steps · 1 col      │
├────────────────────┤
│ Specialty pills    │
├────────────────────┤
│ Trainers · 1 col   │
├────────────────────┤
│ Testimonials · 1   │
├────────────────────┤
│ For trainers stack │
├────────────────────┤
│ FAQ                │
├────────────────────┤
│ Final CTA          │
├────────────────────┤
│ Footer stack       │
└────────────────────┘
```

## Acceptance criteria

- [ ] Section order matches prototype
- [ ] Primary CTA → `/trainers`
- [ ] Fixed nav + anchor scroll
- [ ] Semantic tokens only; 390px + md + lg QA
- [ ] P04 landing components removed (P16)

## Related documents

| Document | Relationship |
|----------|--------------|
| [`route_index.md`](../route_index.md) | Index |
| [`P16_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P16_phase_description.md) | Phase DoD |

**Registry:** W10-02 (v2 W22)

## Change log

| Date | Change |
|------|--------|
| 2026-05-25 | v2.0 — P16 full landing; standalone prototype reference |
| 2026-05-23 | v1.0 — P04 minimal hero + value props + chips |
