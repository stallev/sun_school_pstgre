# Migration: W11 P01–P07 → W16 P01–P15

**Тип:** Migration guide  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W16  

---

## Purpose

Карта перенумерации фаз имплементации Pulse MVP. Используй **этот документ**, если встречаешь ссылки на старые P01–P07 (W11) в внешних заметках, PR или чатах.

**Политика:** старые W11 phase/task файлы **заменены** P01–P15 (W16). Дубликаты не хранятся.

---

## Old → New mapping

| Старый ID (W11) | Новый ID (W16) | Содержание |
|-----------------|----------------|------------|
| P01 § Monorepo & packages & DB | **P01** Monorepo & Data Layer | workspaces, `@pulse/*`, Prisma migrate, seed skeleton, domain enums |
| P01 § Auth.js + register/login | **P02** Auth & Request Guards | Credentials, JWT role, `/auth/login`, `/auth/register`, `proxy.ts` |
| P01 § Shell + DS Lab + placeholders | **P03** Design System & App Shell | route groups, `AppShell`, nav, messages, toast, Lab QA |
| P02 § Landing `/` | **P04** Public Landing | hero, featured trainers, CTA → catalog |
| P02 § Catalog `/trainers` | **P05** Catalog Discovery | filters, `TrainerCard`, pagination |
| P02 § Profile + wishlist | **P06** Trainer Public Profile + Wishlist | `/trainers/[id]`, optimistic heart |
| P03 § Booking wizard | **P07** Booking Wizard | `/book/[trainerId]`, FM-002 |
| P03 § Client hub + profile | **P08** Client Bookings Hub | dashboard, bookings, cancel |
| P03 § Reviews | **P09** Client Reviews | `/client/reviews/[bookingId]` |
| P04 § Onboarding wizard | **P10** Trainer Onboarding | `/auth/register/trainer` 5-step |
| P04 § Profile + services | **P11** Trainer Profile & Services | CRUD services, Blob uploads |
| P04 § Schedule + clients + income | **P12** Trainer Schedule & Clients | schedule, mark completed |
| P05 Admin | **P13** Admin Moderation | verification, complaints, refunds, reviews |
| P07 Hardening | **P14** Quality Gate | a11y, UI states, perf smoke |
| P06 Email | **P15** Email & Jobs *(post-MVP)* | Resend, Cron, idempotency |

---

## Где искать контент (agent lookup)

| Тема | Было (W11) | Стало (W16) |
|------|------------|-------------|
| Prisma schema + seed | P01_tasks §2 | [`P01_tasks.md`](../tasks/P01_tasks.md) |
| Auth.js + proxy | P01_tasks §3–4 | [`P02_tasks.md`](../tasks/P02_tasks.md) |
| App shell + Design Lab | P01_tasks §5–5b | [`P03_tasks.md`](../tasks/P03_tasks.md) |
| Landing wireframe | P02_phase § routes `/` | [`P04_phase_description.md`](./P04_phase_description.md) |
| Catalog filters | P02_tasks §2 | [`P05_tasks.md`](../tasks/P05_tasks.md) |
| Wishlist FM-005 | P02_tasks §4 | [`P06_phase_description.md`](./P06_phase_description.md) |
| Booking wizard FM-002 | P03_tasks §2 | [`P07_tasks.md`](../tasks/P07_tasks.md) |
| Client bookings cancel | P03_tasks §3 | [`P08_tasks.md`](../tasks/P08_tasks.md) |
| Review submit | P03_tasks §4 | [`P09_tasks.md`](../tasks/P09_tasks.md) |
| Trainer onboarding TZ | P04_tasks §1 | [`P10_tasks.md`](../tasks/P10_tasks.md) |
| Services CRUD | P04_tasks §3 | [`P11_tasks.md`](../tasks/P11_tasks.md) |
| Mark booking completed | P04_tasks §6 | [`P12_tasks.md`](../tasks/P12_tasks.md) |
| Admin approve | P05_tasks §2 | [`P13_tasks.md`](../tasks/P13_tasks.md) |
| A11y gate | P07_phase | [`P14_phase_description.md`](./P14_phase_description.md) |
| Email jobs | P06_phase | [`P21_phase_description.md`](./P21_phase_description.md) *(was P15)* |

---

## Cross-reference updates (W16)

| File | Change |
|------|--------|
| [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) | Wave **W16** — P01–P15 × 2 |
| [`ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md) §2.5 | Table P01–P15 |
| [`implementation/mvp/README.md`](../README.md) | Phases table P01–P15 |
| [`AGENTS.md`](../../../AGENTS.md) | P01–P07 → P01–P15 |
| [`mvp_scope.md`](../../prds/01_product_scope/mvp_scope.md) | P01–P05 → P01–P13; hardening **P14** |
| [`cron_jobs_setup_guide.md`](../guides/cron_jobs_setup_guide.md) | P06 → **P21** *(was P15)* |
| [`seed_and_fixtures_guide.md`](../guides/seed_and_fixtures_guide.md) | P01–P02 split |

---

## Verification (W16 complete)

- [ ] `rg "P0[1-7]_phase_description"` — no stale W11-only references outside migration/history
- [ ] 15 × `P{N}_phase_description.md` + 15 × `P{N}_tasks.md` exist
- [ ] [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) present
- [ ] [`_phase_template.md`](./_phase_template.md) present

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | Phase × Component × Route |
| [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md) | Component inventory source |
