# PSI 90+ — public pages (wave 2)

**Origin:** `https://fitapp-web-ten.vercel.app`  
**Journal:** [`docs/ops/psi-lab-journal.md`](docs/ops/psi-lab-journal.md)  
**Baseline:** post-deploy wave2 **2026-10-07 (вечер)** — suite после деплоя; зелёные 4×4 (m+d): `/`, `/how-it-was-built`, `/auth/register`, `/auth/login`

Статусы: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Правило прогона PSI

**MUST NOT** запускать `npm run psi:lab` пока изменения wave2 **не задеплоены** на целевой `PSI_ORIGIN`.  
После деплоя: один полный `--suite`, запись в журнал; subset-прогоны только для затронутых URL.

---

## 0. Baseline

- [x] `PSI_TRAINER_PROFILE_ID` в `apps/web/.env.local.example` (уже был)
- [x] `--suite --json` после деплоя wave2 (2026-10-07; 7 canon paths, без `PSI_TRAINER_PROFILE_ID`)

## A. LCP cluster

### A1 `/trainers` (M Perf 62, LCP 5.3s)

- [x] Один `priority` на первую карточку; grid перед toolbar
- [x] `CatalogSortSelectLazy` (defer sort chunk)
- [ ] PSI subset `/trainers` mobile ≥90 — **68** (LCP **5.2s**, FCP **3.2s**; flake retry)

### A2 `/auth/login` (M Perf 80, LCP 5.4s, CLS 0.015)

- [x] `LoginPageFlow`: форма → RSC divider → lazy demo
- [x] `LoginDemoPanelLazy`; demo off на prod без `?demo=`
- [x] PSI subset login mobile ≥90 — **93** (LCP **2.6s**)

### A3 `/auth/register/trainer` (M Perf 65)

- [x] RSC `h1` на page; `TrainerOnboardingWizardLazy`
- [ ] PSI subset trainer-register mobile ≥90 — **79** (LCP **4.8s**; было 65 pre-wave2)

### A4 `/trainers/[id]` (M Perf 71)

- [x] Stream: `TrainerProfileHeader` + Suspense `TrainerProfileDetails`
- [x] Lazy tabs schedule/reviews (`TrainerProfileTabsShell` + `/api/public/trainers/...`)
- [ ] PSI subset profile mobile ≥90 — **66** (LCP **6.1s**, FCP **3.1s**; отдельный `--url`, id `b9f13c28-…`)

## H. Главная `/` — цель **95+** (все 4 категории, mobile **и** desktop)

**Сейчас (post-deploy wave2, suite 2026-10-07):** M **94** / **92** / **100** / **100** · D **93** / **92** / **100** / **100** · M LCP **2.6s**, FCP **1.2s** (`lcpElement`: null в JSON).  
**Цель:** Perf, A11y, Best Practices, SEO — **≥ 95** на mobile и desktop (lab, после flake-retry). **A11y 92** и **M Perf 94** — ещё не 95+.

**Не гнаться за:** Speed Index ~17s при TTI ~3s / TBT 0 — lab-шум; чинить только по именованным аудитам при score &lt; 95.

### H1. Critical path (above the fold)

Маршрут: [`apps/web/src/app/(marketing)/page.tsx`](apps/web/src/app/(marketing)/page.tsx) · hero [`LandingHero`](apps/web/src/components/landing/LandingHero.tsx) · nav [`MarketingNav.server.tsx`](apps/web/src/components/landing/MarketingNav.server.tsx).

- [x] `dynamic()` для `MarketingNavActions` + `MarketingNavDesktopLinks`
- [x] Hero: float column `ssr: false` (`LandingHeroFloatColumn`), без `Reveal` в RSC hero
- [x] `LandingTrustBarLazy` после hero
- [x] Подтвердить на PSI после деплоя (см. scores выше)

### H2. LCP / изображения

- [ ] Подтвердить LCP element в JSON после деплоя — **пока `null`** (hero `h1` vs featured photo)
- [x] Featured: один `priority`, RSC section header (без `MarketingSectionHeader` client)
- [x] Skeleton featured / section — `LandingFeaturedTrainersSkeleton`, `LandingSectionSkeleton`

### H3. Below the fold (Perf + unused JS)

- [x] `Suspense` + skeleton: HowItWorks, SpecialtyPills, Testimonials, ForTrainers, FinalCta
- [x] `LandingFaqLazy`; убран `Reveal` с landing секций; browse CTA → RSC
- [x] `LandingAuthenticatedRedirect` в `Suspense` + `fallback={null}`

### H4. A11y 92 → 95+ (только если категория &lt; 95 после деплоя)

Журнал (ранний прогон): `heading-order`, `target-size`, `aria-prohibited-attr` — запас, не блокер при A11y ≥90; **для 95+** править по аудитам из JSON.

- [ ] `target-size`: nav pills, locale, theme, hero dots — hit area ≥ 44px ([`LandingHero`](apps/web/src/components/landing/LandingHero.tsx), [`MarketingNavMobileMenu`](apps/web/src/components/landing/MarketingNavMobileMenu.client.tsx))
- [ ] `heading-order`: float cards — уже `LandingHeroFloatCard` price без `h3`; перепроверить остальные секции
- [ ] `aria-prohibited-attr`: точечно по узлу из PSI JSON, без массовых правок
- [ ] Icon-only: `aria-label` / `sr-only` ([`VerifiedBadge`](apps/web/src/components/ui/VerifiedBadge.tsx), nav)

### H5. Best Practices / SEO

- [ ] BP/SEO уже 100 на mobile — удержать; не ломать console (icon-only имена; warn только в dev)
- [ ] Desktop A11y **92** — те же H4 пункты на desktop viewport

### H6. Приёмка home

- [ ] `npm run typecheck` + `npm run lint`
- [ ] Ручной smoke: `/` 390px + desktop (nav, CTA, featured, FAQ)
- [ ] **После деплоя:** suite прогнан; **≥95** не достигнуто (A11y **92** m+d, M Perf **94**)
- [x] Запись в [`docs/ops/psi-lab-journal.md`](docs/ops/psi-lab-journal.md)

## B. Остальные near-green (≥90, не home)

- [x] `/features` — dynamic TOC mobile/desktop
- [x] `/how-it-was-built` M Perf ≥90 — **92**
- [ ] Прочие URL suite — см. волны A

## D. Discovery shell (LCP cluster — реализовано 2026-10-07)

- [x] `DiscoveryLayoutShell`: контент не ждёт `HybridAppShellGate` + `auth()`
- [x] `getSessionForShell` (`React cache`) для TopBar / role nav gates
- [x] Sidebar + bottom nav + trainer banner — параллельные Suspense

## C. Closure (весь suite)

- [~] `npm run typecheck` + `npm run lint` (локально после wave2/H)
- [x] **`npm run psi:lab -- --suite`** после деплоя wave2 + H (2026-10-07)
- [x] Зелёные пути (4×4 ≥90 m+d) в Notes журнала — см. запись wave2
