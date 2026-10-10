# Browser rendering performance — React / Tailwind v4

**Stack:** Next.js **16.4**, React 19, Tailwind CSS v4  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Deep dive:** [`docs/general/05-browser-rendering.md`](../../general/05-browser-rendering.md)  
**Cursor rule:** **ui-animation-performance**  
**Lazy loading:** [`ai_client_lazy_loading.md`](../nextjs/ai_client_lazy_loading.md)

---

## 1. Pixel pipeline (know this)

```
JS → Style → Layout → Paint → Composite
```

| Change type | Pipeline stages | Performance |
|-------------|-----------------|-------------|
| `transform`, `opacity` | Composite only | ✅ Best for animations |
| `color`, `background` | Paint → Composite | OK for rare transitions |
| `width`, `height`, `margin` | Layout → Paint → Composite | ❌ Avoid in animations |

---

## 2. Agent contract (MUST)

| Rule | Detail |
|------|--------|
| **Animate transform/opacity** | Hover, enter/exit, progress — не `width`/`height`/`top`/`left` |
| **No transition-all on layout** | Запрет `transition-all` где меняются layout-свойства |
| **prefers-reduced-motion** | Global reset in `globals.css` — см. **ui-semantics-a11y** |
| **useLayoutEffect for measure** | DOM reads before paint (tooltip position) — не `useEffect` |
| **No getBoundingClientRect in render** | Только effects / event handlers |
| **CSS variables for dynamic values** | React sets `--progress`; CSS animates via `transform` |

### Scale instead of width

```css
/* ❌ Reflow every frame */
.card { transition: width 0.3s; }

/* ✅ Composite only */
.card { transition: transform 0.3s; }
.card:hover { transform: scaleX(1.05); }
```

---

## 3. Layout thrashing (MUST avoid)

Не чередовать read/write геометрии в цикле:

```javascript
// ❌ N reflows
boxes.forEach((box) => {
  const w = box.offsetWidth; // read
  box.style.width = w * 2 + "px"; // write
});

// ✅ Batch reads, then writes
const widths = [...boxes].map((b) => b.offsetWidth);
boxes.forEach((box, i) => { box.style.width = widths[i] * 2 + "px"; });
```

In React: prefer **ResizeObserver** over repeated `offsetHeight` in effects.

---

## 4. will-change (SHOULD — sparingly)

- Подсказка браузеру создать GPU layer **перед** анимацией
- **MUST NOT** на `*` или всех статичных карточках — VRAM cost
- Pattern: set before animation → remove (`will-change: auto`) after finish
- OK for always-spinning loaders

---

## 5. React 19 interaction

- State updates batch automatically (including async `startTransition`)
- `startTransition` for non-urgent UI updates (search filtering)
- Mutation pending: `aria-busy` — **ui-mutation-pending**

### useLayoutEffect vs useEffect

| Hook | Use for |
|------|---------|
| `useLayoutEffect` | Measure DOM, prevent flicker (tooltip, scroll sync) |
| `useEffect` | Subscriptions, logging, fetch side effects |

---

## 6. Tailwind patterns

```tsx
// ✅ GPU-friendly hover
className="transition-transform duration-200 ease-out hover:-translate-y-1"

// ✅ Reduced motion
className="motion-safe:animate-in motion-safe:fade-in-0"

// ❌ Avoid
className="transition-all duration-300" // may animate layout props
```

---

## 7. Profiling (SHOULD before ship heavy UI)

1. DevTools → Performance → CPU **4x slowdown**
2. Paint flashing (Rendering tab) — no full-page green flashes on scroll
3. Lighthouse TBT < 300ms target on critical routes

---

## 8. Agent checklist

- [ ] Animations use `transform` / `opacity` only
- [ ] No layout property transitions on hot paths
- [ ] `prefers-reduced-motion` respected globally
- [ ] DOM measurements in `useLayoutEffect` or ResizeObserver
- [ ] Dynamic styles via CSS variables where animating
- [ ] Heavy JS deferred — **ai_client_lazy_loading** + Server Components first

---

## 9. Related

| Document | Topic |
|----------|--------|
| [`docs/general/05-browser-rendering.md`](../../general/05-browser-rendering.md) | FLIP technique, full pipeline theory |
| [`docs/general/04-code-splitting.md`](../../general/04-code-splitting.md) | TBT, bundle size |
| [`ai_client_lazy_loading.md`](../nextjs/ai_client_lazy_loading.md) | Client bundle |
| [`ai_semantics_a11y_guidelines.md`](./ai_semantics_a11y_guidelines.md) | Motion a11y |

**Reference:** Pulse (docs/examples/pulse) — `globals.css` motion tokens; **Guidelines override Pulse**.
