---
description: UI pixel parity — typography, colors, spacing from HTML prototype and design system
paths:
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/**/*.css"
---
# Prototype & design-system fidelity

**Visual source (subordinate to Cursor Rules / PRD):** [`docs/prototypes/sunday_school_prototype.html`](docs/prototypes/sunday_school_prototype.html)  
**Optional landing HTML:** additional file in `docs/prototypes/` if product has a standalone marketing page (map in `prototype_route_mapping.md`)  
**Token canon:** [`docs/prototypes/sunday_school_prototype.html`](docs/prototypes/sunday_school_prototype.html) (until UX-03 `visual_identity_contract.md`)  
**Typography:** [`typography_text_guidelines.md`](docs/guidelines/typography_text_guidelines.md)

## Контракт

При создании UI **точно воспроизводим** визуальные параметры из прототипа и design system — не «похожий» произвольный Tailwind.

## Что копировать из прототипа / design system

| Параметр | Источник | Реализация |
|----------|----------|------------|
| **Гарнитуры** | Alegreya, Source Sans 3, `ui-monospace` (UX-03 v2.0 D-2) | `next/font` + `font-display` / `font-body` (`font-sans`) / `font-mono` |
| **Кегль** | Type scale UX-03 §6 (база 18 px; пол 15.75 px; `text-xs` только бейдж) | Atoms (`Heading`, `ContentText`) или утилиты `text-base` / `text-sm`; `text-[0.9375rem]` запрещён |
| **Начертание / вес** | `font-normal`, `font-medium`, `font-semibold`, `font-bold` | Как в прототипе для каждого контекста |
| **Цвета** | Slate Cobalt CSS variables | Semantic tokens: `text-foreground`, `bg-primary`, `text-muted-foreground` — **не** ad-hoc hex |
| **Spacing / radius** | M3 elevation, padding, `rounded-*` | Из design system §components |
| **Section order** | HTML structure прототипа | Порядок блоков, sticky footers, chip rows |

## Workflow для агента

1. Открыть соответствующий экран в **HTML prototype** + секцию в **design system**.
2. Сверить вариант на **Design Lab** `/design-system` — импорт только из каталога `@/components/atoms`, `@/components/ui/*` (**ui-design-system-shadcn** §Design Lab catalog).
3. Сверить **структуру DOM**, class names / token mapping, порядок секций.
4. Реализовать через **shared components** (`components/ui/`, `components/atoms/`, feature folders) — не one-off стили на route.
5. Responsive: mobile значения из прототипа = base; desktop — через `md:` / `lg:` per design system §2.
6. **Parity (P14, UX-03 v2.0):** для каждого изменённого файла в `components/{ui,shell,patterns,atoms,analytics}`, `app/globals.css`, `app/layout.tsx` выполнить протокол [`prototype_class_parity_spec.md`](docs/implementation/mvp/specs/prototype_class_parity_spec.md) §4 (строка таблицы §7 → символ прототипа → итоговые классы компонента → нормализация §3 → `node scripts/check-prototype-parity.mjs --component <id>`). Расхождение вне `allowed_diff` — blocker. Trace: `Parity: <N> строк сверено, расхождений 0`.

## Исключения

- Прототип противоречит **Cursor Rules**, **PRD** или **canonical routes** — побеждает более высокий источник истины (см. **project-context** §Source-of-truth).
- **Runtime fonts:** if the HTML prototype names different families than the product design system, match **type scale and tokens**, not prototype `font-family` strings.
- Третьи стороны (rich text, maps) — documented exception в PR/commit.

## Связанные правила

- **ui-design-system-shadcn**, **react-one-component-per-file**, **ui-icons-lucide**

Reference: Pulse snapshot `docs/examples/pulse/docs/prototypes/` — pattern only. This project: `docs/prototypes/sunday_school_prototype.html`.
