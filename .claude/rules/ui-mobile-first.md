---
description: Mobile-first responsive UI — breakpoints, touch targets, native-feel patterns
paths:
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/**/*.css"
---
# Mobile-first (`apps/web`)

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](docs/meta/ai_first_project_methodology.md)  
**Design system:** [`sunday_school_prototype.html`](docs/prototypes/sunday_school_prototype.html) §2 Responsive Strategy  
**User flows:** [`docs/prds/01_product_scope/user_flows/users_mvp/`](docs/prds/01_product_scope/user_flows/users_mvp/) — по одному flow на роль из `admin, teacher`

## Контракт

Разработка UI **начинается с мобильного viewport** (320–390px). Breakpoints — **расширение**, не «урезание desktop».

## Breakpoints (Tailwind v4 defaults)

| Token | Min width | Поведение |
|-------|-----------|-----------------|
| default | 0 | Base layout, bottom nav, sheets |
| `md` | 768px | Sidebar вместо bottom nav; tablet padding |
| `lg` | 1024px | Sidebar as rail `4rem` by default (ADR-022); tables from `lg`, cards below |
| `xl` / `2xl` | 1280 / 1536px | Expanded sidebar `16rem` by default (ADR-022 §4.1); two-column check, audit table without inner scroll; shell container `max-w-[1600px] mx-auto` (ADR-017) |

## Обязательные паттерны

1. **Base styles = mobile** — без `max-md:` для того, что должно быть на телефоне; desktop через `md:`, `lg:`.
2. **Bottom nav** sticky `< md`; **sidebar** `≥ md` — per role layouts.
3. **Modals:** bottom **Sheet** на mobile; centered **Dialog** `≥ md`.
4. **Edge-to-edge mobile** — cover photos, chip scroll: `-mx-4 md:mx-0`, `overflow-x-auto no-scrollbar`.
5. **Touch targets** — интерактивные элементы **≥ 44×44px** (`min-h-11 min-w-11` или эквивалент padding).
6. **Safe area** — bottom nav: `paddingBottom: env(safe-area-inset-bottom)`; контент над nav: `pb-6` минимум.
7. **Горизонтальный скролл** — `scrollWidth` страницы == `innerWidth` на 360 / 768 / 1024 / 1440; широкое содержимое прокручивается внутри обёртки `overflow-x-auto min-w-0` (ADR-022 §4.5); списки и журнал до `lg` — карточки.
8. **Касание** — основное действие на `< md` — `touch` `h-11` (≥ 44 px); остальные интерактивные ≥ 36 px (`h-8`), зазор между соседними ≥ 8 px (`gap-chip`).
9. **Приёмка** — проверять экран на **390px**, затем `md` и `lg` перед merge UI-задачи.

## Антипаттерны

- Desktop-first: base = wide grid, `max-md:` «ломает» layout.
- Горизонтальный scroll всей страницы (кроме chip-рядов); внутренний scroll основной таблицы журнала на `xl+`.
- Hover-only affordances без tap-альтернативы на mobile.

## Связанные правила

- Tokens/states: **ui-design-system-shadcn**
- Prototype parity: **ui-prototype-fidelity**
- Shared nav/shell: **react-logic-presentation**

Reference: Pulse (docs/examples/pulse) mobile-first acceptance in EUI-V2-P1 tasks — Pulse adaptation.
