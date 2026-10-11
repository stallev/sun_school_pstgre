---
description: Browser rendering — animate transform/opacity only; no layout thrashing; will-change discipline
paths:
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/app/globals.css"
---
# UI animation & rendering performance

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](docs/meta/ai_first_project_methodology.md)  
**Guide:** [`docs/guidelines/react/ai_browser_rendering_performance.md`](docs/guidelines/react/ai_browser_rendering_performance.md)  
**Deep dive:** [`docs/general/05-browser-rendering.md`](docs/general/05-browser-rendering.md)  
**Lazy bundles:** **react-ui-components** + [`ai_client_lazy_loading.md`](docs/guidelines/nextjs/ai_client_lazy_loading.md)

## Pixel pipeline

- **Animate:** `transform`, `opacity` → Composite (GPU) ✅
- **Avoid animating:** `width`, `height`, `margin`, `padding`, `top`, `left` → Layout ❌

## MUST

- No `transition-all` where layout properties change
- `prefers-reduced-motion` global reset in `globals.css` (**ui-semantics-a11y**)
- DOM measurements → `useLayoutEffect` or `ResizeObserver`, never in render
- Dynamic animated values → CSS variables + `transform` in CSS
- Batch geometry reads/writes — no read/write alternation in loops (layout thrashing)

## will-change

- Only for persistently animated elements OR apply-before/remove-after one-shot animations
- **MUST NOT** blanket `will-change` on all cards/components

## Agent checklist

- [ ] Hover/enter animations use `translate`/`scale`/`opacity`
- [ ] No `offsetWidth`/`getBoundingClientRect` in render
- [ ] Tailwind: `transition-transform` not `transition-all` on interactive surfaces
- [ ] Heavy client libs lazy-loaded — smallest client bundle wins over micro-optimizations

Reference: Pulse (`docs/examples/pulse`) `globals.css` — **Guidelines override Pulse**.
