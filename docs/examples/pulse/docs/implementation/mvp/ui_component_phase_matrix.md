# UI Component Phase Matrix

**Тип:** Implementation matrix  
**Статус:** Canonical  
**Версия:** 2.1  
**Дата:** 2026-05-25  
**Волна:** W22  
**Источник:** [`design_system_lab_spec.md`](specs/design_system_lab_spec.md) § Component inventory  
**Связанные документы:** [`_phase_template.md`](phases_tasks_descriptions/_phase_template.md), [`global_shell_spec.md`](specs/global_shell_spec.md)

---

## Purpose

Канон **Phase × Component × Route × Action (CREATE / USE)** для AI-агентов. Агент читает **только строки своей фазы** + shared USE primitives.

**Import paths:** `@/components/atoms`, `@/components/ui/*`, `@/components/shell/*`, `@/components/{catalog|booking|trainer|admin}/*`

**MUST NOT:** import from `@/components/design-lab/**` in product routes.

---

## Legend

| Action | Meaning |
|--------|---------|
| **CREATE** | New component or route-specific module in this phase |
| **USE** | Compose from existing catalog; tokenize/extend via CVA if needed |
| **MUST NOT** | Explicit anti-scope for this phase |

---

## P01 — Monorepo & Data Layer

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| — | — | — | **No product UI** — packages + Prisma only |

---

## P02 — Auth & Request Guards

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| `Button` | USE | `/auth/login`, `/auth/register` | Submit + pending |
| `Input`, `Field`, `Label` | USE | auth forms | Generic login errors |
| `Checkbox` | USE | `/auth/register` | Terms acceptance |
| `Container` | USE | auth pages | Mobile-first |
| `ContentText`, `AlertText` | USE | auth forms | `@/lib/messages` |
| `Heading` | USE | auth pages | One `h1` per view |
| Trainer wizard | MUST NOT | — | → **P10** |

---

## P03 — Design System & App Shell

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| `AppShell` | CREATE | all role groups | Landmarks `nav`, `main` |
| `AppTopBar` / `TopBar` | CREATE | authenticated | Sticky, safe-area |
| `BottomNav` | CREATE | `< md` client/trainer | `aria-current` |
| `SideNav` / `SidebarNav` | CREATE | `≥ md` | Distinct `aria-label` |
| `NavItem` | CREATE | shell | 44px touch |
| `PageContainer` | CREATE | shell wrapper | Per global_shell_spec |
| Typography atoms | USE | placeholders | Already in repo |
| `Button`, `PulseCard`, `CustomLink` | USE | placeholders | Verify Lab |
| `/design-system` | USE | dev-only | Lab QA 390px/md/light/dark |
| Domain molecules | MUST NOT | — | → P04+ |

---

## P04 — Public Landing

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| Landing section modules | CREATE | `/` | Hero, categories, featured |
| `SectionTitle`, `ContentText` | USE | `/` | Marketing copy |
| `PulseCard`, `Button`, `CustomLink` | USE | `/` | Primary CTA → `/trainers` |
| `SpecChip` | USE | `/` | Category chips |
| `TrainerCard` | USE | `/` | Featured row (fixture OK) |
| `SearchTrigger` | USE | `/` | Optional nav affordance |
| Catalog filters | MUST NOT | — | → **P05** |

---

## P05 — Catalog Discovery

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| `TrainerCard` | CREATE | `/trainers` | Wishlist slot stub → P06 |
| `FilterSheet` / filter sidebar | CREATE | `/trainers` | URL searchParams |
| `FilterChip` | USE | `/trainers` | Mobile chips |
| `RadioGroup` tile | USE | `/trainers` | Desktop filters |
| `Slider` | USE | `/trainers` | Max price |
| `Pagination` | USE | `/trainers` | Shareable page |
| `Empty`, `Skeleton` | USE | `/trainers` | FX-8 empty CTA |
| `Sheet` | USE | `/trainers` | Mobile filters `< md` |
| Profile tabs | MUST NOT | — | → **P06** |

---

## P06 — Trainer Public Profile + Wishlist

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| Profile tab panels | CREATE | `/trainers/[id]` | Split ≤140 lines/file |
| Wishlist heart control | CREATE | `/trainers/[id]`, card | Optimistic per contract |
| `Tabs` | USE | profile | About / Services / Schedule / Reviews |
| `RatingStars`, `SpecChip`, `PhotoSlot` | USE | profile | |
| `StatusBadge`, `VerifiedBadge` | USE | profile | |
| `Button` | USE | profile | Primary «Book now» |
| Booking wizard | MUST NOT | — | → **P07** |

---

## P07 — Booking Wizard

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| `BookingWizard` | CREATE | `/book/[trainerId]` | 3 steps |
| Schedule grid wrapper | CREATE | wizard step 2 | TZ label |
| `WizardHeader`, `Progress` | USE | booking layout | Stripped chrome |
| `ChoiceCard`, `SummaryCard` | USE | wizard | |
| `SchedulePicker`, `DayPill`, `TimeSlotButton` | USE | step 2 | |
| `MetaRow`, `Textarea`, `Field` | USE | confirm step | |
| `RedirectToast` pattern | USE | post-booking | Query `?booked=1` |
| Payment UI | MUST NOT | — | ADR-005 |

---

## P08 — Client Bookings Hub

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| `BookingListItem` | CREATE | `/client/bookings` | Status + compact card |
| Dashboard widgets | CREATE | `/client/dashboard` | Next session, shortcuts |
| `PulseCardKpi` | USE | dashboard | |
| `StatusBadge` | USE | bookings | |
| `AlertDialog` | USE | booking detail | Cancel confirm |
| `Tabs` | USE | bookings list | Upcoming / Past / Cancelled |
| Review form | MUST NOT | — | → **P09** |

---

## P09 — Client Reviews

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| `ReviewForm` | CREATE | `/client/reviews/[bookingId]` | |
| `RatingStars` (interactive) | USE | review form | Required |
| `Textarea`, `Button` | USE | review form | Pending UI |
| Completed booking | USE (data) | — | Seed/manual from **P12** OK for smoke |

---

## P10 — Trainer Onboarding

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| Onboarding step components | CREATE | `/auth/register/trainer` | 5 steps, ≤140 lines |
| `WizardHeader`, `Progress` | USE | onboarding | |
| `PhotoSlot`, `FileUploadZone` | USE | steps 1, 3 | Blob contract |
| `Field`, `Select`, `Checkbox` | USE | all steps | **timezone required** |
| `ChoiceCard` / service draft | USE | step 4 | Skip allowed |
| Admin approve UI | MUST NOT | — | → **P13** |

---

## P11 — Trainer Profile & Services

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| `ServiceCard` | CREATE | `/trainer/services` | Active toggle |
| Blob upload flows | USE | `/trainer/profile` | Photo, certs |
| `Switch` | USE | services | Optimistic optional |
| `Field`, `Textarea` | USE | profile edit | |
| Schedule editor | MUST NOT | — | → **P12** |

---

## P12 — Trainer Schedule & Clients

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| `ClientListCard` | CREATE | `/trainer/clients` | Search + empty |
| Schedule editor modules | CREATE | `/trainer/schedule` | Weekly + exceptions |
| `ScheduleDayPickerRow`, `DayPill` | USE | schedule | |
| `Calendar` | USE | exceptions | |
| `KeyValueRow`, `PulseCardKpi` | USE | dashboard, income | |
| Mark booking `completed` | CREATE (action) | client detail | Enables **P09** |
| Admin queues | MUST NOT | — | → **P13** |

---

## P13 — Admin Moderation

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| `ModerationQueueRow` | CREATE | `/admin/trainers` | Approve/Reject hierarchy |
| `TrainerApplicationDetailHeader`, `TrainerApplicationProfileCard`, `TrainerApplicationDocumentsCard`, `TrainerApplicationDecisionBar`, `TrainerApplicationProcessedBanner`, `TrainerApplicationServicesSection`, `TrainerApplicationIncompleteAlert`, `TrainerApplicationDetailSkeleton` | CREATE | `/admin/trainers/[id]` | Detail parity: sticky decision bar, doc sections, incomplete alert |
| `AdminPillTabs`, `AdminQueueEmptyState`, `AdminQueueGridSkeleton` | CREATE | admin queue routes | Shared pill tabs + empty/skeleton |
| `AdminPageError` | CREATE | admin routes | Segment `error.tsx` Retry |
| `AdminDashboardKpiGrid`, `AdminNeedsAttentionCard` | CREATE | `/admin/dashboard` | `PulseCardKpi` + attention card |
| `ComplaintQueueCard`, `ComplaintRowActions` | CREATE | `/admin/complaints` | Grid + quick close confirm |
| `ComplaintDetailHeader`, `ComplaintDetailCard`, `ComplaintDetailActionsBar`, `ComplaintProcessedBanner`, `CloseComplaintDialog`, `ComplaintDetailSkeleton` | CREATE | `/admin/complaints/[id]` | Detail parity: sticky actions, localized badges, close confirm |
| `AdminRefundsKpiGrid`, `RefundQueueCard` | CREATE | `/admin/refunds` | KPI tier-1 + queue card |
| `ReviewModerationCard`, `DeleteReviewDialog`, `HideReviewDialog` | CREATE | `/admin/reviews` | Tabs visible/hidden + confirms |
| `PageHeader` | USE | admin lists | |
| `PulseCardKpi`, `RatingStars`, `PulseCard` | USE | dashboard, refunds, reviews | Design Lab catalog |
| `StatusBadge`, `IconBadge` | USE | nav badges | |
| Confirm dialogs | USE | reject, hide, delete review, close complaint | |
| Admin forms layout | USE | detail pages | **admin-forms-layout** rule |
| Client complaint/refund entry | CREATE/USE | booking detail | If not in P08 |

---

## P14 — Quality Gate

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| All prior CREATE | USE (audit) | all P01–P13 routes | Fix gaps only |
| New components | MUST NOT | — | No new features |

---

## P16 — Public Landing v2

**Composition rule:** `components/landing/*` = thin route modules; markup from catalog only. **Design Lab:** `/design-system` → `#marketing`.

### CREATE — shared catalog (L3 Marketing)

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| `SectionEyebrow` | CREATE | catalog | `components/atoms/SectionEyebrow/` |
| `Container` variant `marketing` | CREATE | catalog | `components/ui/container.tsx` |
| `MarketingSectionHeader` | CREATE | catalog | Center / left align; optional `Reveal` |
| `TrustFeaturePill` | CREATE | catalog | Hero micro-badges |
| `StepCard` | CREATE | catalog | How-it-works |
| `DiscoveryPill` | CREATE | catalog | Specialty links |
| `TestimonialCard` | CREATE | catalog | Reviews |
| `StatMetricCell`, `StatsBar` | CREATE | catalog | Trust bar; `useCountUp` |
| `BenefitRow`, `DarkStatTile` | CREATE | catalog | For-trainers section |
| `BrandSection`, `CtaBand` | CREATE | catalog | Dark band + final CTA |
| `Reveal`, `MarketingAccordion` | CREATE | catalog | Motion + FAQ |
| `FeaturedTrainerCard` | CREATE | catalog | `components/catalog/` — vertical marketing card (≠ `TrainerCard`) |
| `DesignLabMarketing*` | CREATE | `/design-system` | Showcase only — **MUST NOT** import in product |

### CREATE — route composition (`components/landing/`)

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| `LandingNav` | CREATE | `/` | Client; `useLandingScrolled`; fixed `h-[72px]` |
| `LandingHero`, `LandingHeroFloatCard` | CREATE | `/` | Split hero; float cards hidden `< lg`; fixture `lib/landing/landing-hero-float-cards.ts` |
| `LandingTrustBar` | CREATE | `/` | Wraps `StatsBar`; `lib/landing/landing-trust-metrics.ts` |
| `LandingHowItWorks` | CREATE | `/` | `#how` |
| `LandingSpecialtyPills` | CREATE | `/` | `DiscoveryPill` → `/trainers?specialty=` |
| `LandingFeaturedTrainers` | CREATE | `/` | Server + Suspense; approved-only; limit 3 |
| `LandingFeaturedTrainersSkeleton` | CREATE | `/` | Vertical featured-card skeleton |
| `LandingFeaturedTrainersEmpty` | CREATE | `/` | `Empty` + CTA |
| `LandingFeaturedTrainersError` | CREATE | `/` | `Alert` + retry |
| `LandingFeaturedTrainersRetryButton` | CREATE | `/` | Client refresh |
| `LandingTestimonials` | CREATE | `/` | `#reviews` |
| `LandingForTrainers` | CREATE | `/` | Dark `BrandSection` |
| `LandingFaq` | CREATE | `/` | Client; `MarketingAccordion` · `#faq` |
| `LandingFinalCta` | CREATE | `/` | `CtaBand` dual CTAs |
| `LandingFooter` | CREATE | `/` | |
| `(marketing)/layout`, `(marketing)/auth/layout` | CREATE | layout | Minimal shell on `/`; `PublicChrome` on `/auth/*` |

### USE / KEEP / DELETE

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| `Button`, `CustomLink`, typography atoms | USE | `/` | |
| `RatingStars`, `VerifiedBadge`, `SpecChip`, `PhotoSlot`, `PulseCard` | USE | `/` | Featured + float cards |
| `Skeleton`, `Empty`, `Alert` | USE | `/` | Featured states |
| `LandingAuthenticatedRedirect` | KEEP | `/` | Role home redirect |
| `LandingValueProps`, `LandingCategoryChips`, `SiteFooter` | **DELETE** | — | P04-only |
| `FeaturedTrainersSkeleton`, `FeaturedTrainersRetryButton` | **DELETE** | — | Replaced by `LandingFeaturedTrainers*` |
| `TweaksPanel` (prototype) | MUST NOT | — | Dev-only in HTML prototype |
| `@/components/design-lab/**` | MUST NOT | product | Showcase only |

**Spec:** [`public_landing_spec.md`](specs/public_landing_spec.md) · **Phase:** [`P16_phase_description.md`](phases_tasks_descriptions/P16_phase_description.md) · **Prototype:** [`Pulse Landing Page -Standalone-.html`](../../prototypes/Pulse Landing Page -Standalone-.html)

---

## P17 — UI Internationalization (EN/RU) — **Complete**

| Component | Action | Route / placement | Notes |
|-----------|--------|-------------------|-------|
| `LocaleSwitcher` | CREATE | Design Lab `#settings`; `LandingNav`, `LandingFooter`; `TopBar` `md+` | Segmented EN \| RU; `aria-pressed` |
| `LocaleProvider` | CREATE | Root / app shell layout | Seeds `useMessages()` |
| `LocaleQueryHandler` | CREATE | Root layout | `?lang=en\|ru` → cookie + strip query |
| `LocaleSettingsRow` | CREATE | `/client/profile`, `/trainer/profile` | Language row; wireframe v2 |
| `ProductQueryToast` | USE (extend) | Any route | Strip `?lang=` after cookie set (pattern) |
| Typography atoms, `Button`, `PulseCard` | USE | Profile settings | Settings list pattern |
| `@/lib/i18n/format.ts` | CREATE | — | Not a React component; formatter canon |
| `@/lib/messages/en.ts`, `ru.ts` | CREATE / USE | — | `satisfies Messages` parity |

**ADR:** [`adr_009_ui_locale_strategy.md`](../../../prds/07_governance/adr_009_ui_locale_strategy.md) · **Contract:** [`i18n_runtime_spec.md`](contracts/i18n_runtime_spec.md) · **Phase:** [`P17_phase_description.md`](phases_tasks_descriptions/P17_phase_description.md)

---

## P19 — Complaint Resolution v2

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| `ComplaintContextPanel` | CREATE | `/admin/complaints/[id]` | Booking snippet + refund link |
| `ComplaintAuditTimeline` | CREATE | `/admin/complaints/[id]` | Read-only audit entries |
| `ResolveComplaintDialog` | CREATE | `/admin/complaints/[id]` | Resolution select + notes; replaces bare close on in_review |
| `ComplaintClosedSummary` | CREATE | `/admin/complaints/[id]` | Resolution badge + notes when closed |
| `ComplaintDetailActionsBar` | USE (extend) | `/admin/complaints/[id]` | «Finish review» label on in_review |
| `ComplaintProcessedBanner` | USE (extend) | `/admin/complaints/[id]` | Assignee in in_review banner |
| `ComplaintRowActions` | USE (extend) | `/admin/complaints` | Quick close open-only |
| `CloseComplaintDialog` | USE | `/admin/complaints` | Delegates to resolve dialog or quick path |
| `ComplaintDetailCard`, `ComplaintDetailHeader`, `ComplaintDetailSkeleton` | USE | `/admin/complaints/[id]` | P13 base |
| `StatusBadge`, `Button`, `CustomLink` | USE | admin complaints | Design Lab catalog |

**ADR:** [`adr_008_complaint_resolution_model.md`](../../../prds/07_governance/adr_008_complaint_resolution_model.md)

---

## P18 — Admin People Ops *(planned)*

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| Client registry + detail surfaces | CREATE | `/admin/clients`, `/admin/clients/[id]` | Spec: `admin_people_ops_spec.md` |
| Trainer post-approval ops | USE (extend) | `/admin/trainers/[id]` | Revoke + cross-links |
| Phase docs | — | — | Pending P18 phase/tasks files |

---

## P21 — Email & Jobs *(post-MVP)*

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| Password reset UI | CREATE (optional) | `/auth/forgot-password` | Per password_reset_spec |
| Product UI otherwise | MUST NOT | — | Backend jobs only |

**Former ID:** P15 (W16) — [`_migration_P15-P20_renumbering.md`](phases_tasks_descriptions/_migration_P15-P20_renumbering.md)

---

## P22 — Instant Navigations Adoption *(Next.js 16.3)*

| Component | Action | Route | Notes |
|-----------|--------|-------|-------|
| Route-local `*-skeleton.tsx` | CREATE (as needed) | P0/P1 product routes | Suspense fallbacks; catalog `<Skeleton />` |
| Region error fallback (client) | CREATE (as needed) | Multi-region pages | `catchError` + `retry()`; messages from `@/lib/messages` |
| `Skeleton`, `Container`, `Empty`, `Button` | USE | All P22 routes | Existing catalog |
| `AppShellFallback` | USE | Role layouts | Do not regress |
| `@/components/design-lab/**` | MUST NOT | Product routes | Showcase only |
| Composition only | — | See `instant_navigations_adoption_spec.md` | No new product features |

**Spec:** [`instant_navigations_adoption_spec.md`](specs/instant_navigations_adoption_spec.md) · **Phase:** [`P22_phase_description.md`](phases_tasks_descriptions/P22_phase_description.md)

---

## Shared USE primitives (all product phases)

Available from P03 onward unless phase table says **MUST NOT**:

| Layer | Examples |
|-------|----------|
| Atoms | `Heading`, `SectionTitle`, `ContentText`, `AlertText`, `SectionEyebrow` (P16+) |
| UI | `Button`, `CustomLink`, `PulseCard`, `Container`, `Skeleton`, `Empty` |
| Shell | `AppShell`, nav components (P03+) |
| Messages | `@/lib/messages`, `product-toast.ts` |

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`design_system_lab_spec.md`](specs/design_system_lab_spec.md) | Full inventory + FAANG contract |
| [`_migration_P01-P07_to_P01-P15.md`](phases_tasks_descriptions/_migration_P01-P07_to_P01-P15.md) | Phase renumbering |
| [`global_shell_spec.md`](specs/global_shell_spec.md) | Shell CREATE details (P03) |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — W25
