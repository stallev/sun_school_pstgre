# Client lazy loading (`next/dynamic`) — Pulse

## Document Version: 1.0 (Pulse)
**Created:** 28 May 2026  
**Project:** Pulse — `apps/web`  
**Stack:** Next.js **16.4** App Router, React 19, **Vercel**

> **Scope:** lazy loading of **Client Components** and heavy **client-only** dependencies. Complements server-side streaming in [`ai_loading_patterns.md`](./ai_loading_patterns.md) and RSC boundaries in [`ai_component_guidelines.md`](../react/ai_component_guidelines.md).

**Deep dive:** [`docs/general/04-code-splitting.md`](../../general/04-code-splitting.md) — bundle theory, tree shaking, preload/prefetch.

**Official API (verify via Context7 `/vercel/next.js`):** [Next.js: Lazy loading](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)

---

## 1. Two layers of “fast page”

| Layer | Mechanism | What it optimizes |
|-------|-----------|-------------------|
| **Server / RSC** | `loading.tsx`, `<Suspense>`, light `page.tsx` | Time to first useful **route shell** and streamed **data** |
| **Client JS** | `next/dynamic`, conditional render, route-level splits | **Download / parse / execute** of heavy client bundles |

These layers are **orthogonal**. Suspense does **not** defer `react-day-picker`, `recharts`, rich editors, or media players — they still ship in a client chunk unless you lazy-load them.

**Normative server contract:** [`ai_loading_patterns.md`](./ai_loading_patterns.md) — Cursor rule **app-router-streaming-loading**.  
**Normative client lazy contract:** **§5** below — Cursor rules **react-ui-components**, **react-logic-presentation**.

---

## 2. Route splitting vs `dynamic`

- **App Router** automatically code-splits **per route segment** for client code reachable only from that route’s import graph.
- **`next/dynamic`** adds a **separate async chunk** and optional **deferred execution** (especially with `ssr: false` or conditional `{open && <LazyPanel />}`).

Use route splitting by default (do not import heavy widgets from shared layouts or `components/shell/`). Use `dynamic` when:

1. **Within-route deferral** — heavy UI on one URL should not block initial client JS (charts, calendar panel, file preview).
2. **Shared parent imports** — a component in `components/ui/*` or a shared form would otherwise land in a **shared chunk** across many routes.
3. **Interaction-gated UI** — calendar popover, modal editor, complaint dialog content opens only on user action.
4. **`ssr: false`** — library breaks or is meaningless on the server (`window`, some media players, browser-only APIs).

Per Next.js 16 docs (Context7): load immediately in a separate bundle, **on demand when a condition is met**, or **client-only** with `ssr: false` — pick explicitly per scenario.

---

## 3. `'use client'` and `ssr: false`

**`'use client'` does not mean “server never renders this”.**  
By default, Client Components still participate in **SSR** for the initial HTML snapshot, then **hydrate**.

| Option | Server | Client |
|--------|--------|--------|
| `dynamic(() => import('./X'))` (default) | Renders `X` in HTML when parent renders on server | Hydrates + may load async chunk |
| `dynamic(..., { ssr: false })` | **No** render of `X`; `loading` placeholder only | Mounts `X` after chunk loads |

Use **`ssr: false`** only when SSR is harmful or unnecessary — not on every `dynamic` import.

**Do not** call `next/dynamic` from **async Server Component modules** (`*.server.tsx`) — Turbopack dev can throw streaming errors (`transformAlgorithm is not a function`). Prefer static imports in RSC; use `dynamic` from **sync** `page.tsx` / **client** parents (§4.4), or rely on route-level code splitting.

**Pulse naming:** client entry modules use **`.client.tsx`** suffix per **react-naming-conventions** (`DatePickerField.client.tsx`, `SchedulePicker.client.tsx`).

---

## 4. Patterns (choose by scenario)

### 4.1. Thin wrapper file (`*-lazy.client.tsx`)

**When:** reusable lazy entry used from server or client parents; heavy lib isolated from shared import graph.

```
CalendarPanelLazy.client.tsx   → dynamic(import heavy module), re-export props
calendar.tsx                   → normal 'use client' implementation (react-day-picker)
```

```tsx
"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

const CalendarPanel = dynamic(
  () =>
    import("@/components/ui/calendar-panel.client").then((m) => m.CalendarPanel),
  {
    loading: () => <Skeleton className="h-[280px] w-[280px] rounded-md" aria-hidden />,
  },
);

export function CalendarPanelLazy(props: CalendarPanelProps) {
  return <CalendarPanel {...props} />;
}
```

### 4.2. Lazy panel on interaction (reference: date picker)

**When:** shell is light (trigger, hidden input); heavy UI (calendar, popover content) loads **only when open**.

Split:

```
DatePickerField.client.tsx           → Field, trigger, Popover chrome, hidden input
DatePickerCalendarPanel.client.tsx   → Calendar + react-day-picker (or lazy import)
```

- `dynamic` import in the **field** file (or dedicated `CalendarPanelLazy.client.tsx`).
- Render lazy child only when `open === true`.
- `loading` skeleton must match **panel** size (limit CLS) — not the whole page skeleton.
- Keep `aria-expanded` on trigger; panel region gets focus management via the shadcn Popover (Base UI).

**Current state:** [`DatePickerField.client.tsx`](../../../apps/web/src/components/ui/DatePickerField.client.tsx) lazy-loads [`DatePickerCalendarPanel.client.tsx`](../../../apps/web/src/components/ui/DatePickerCalendarPanel.client.tsx) when popover is open (§4.2).

### 4.3. Inline `dynamic` in a single client file

**When:** lazy target is used in one place only; no need for a separate wrapper export.

Same rules: `'use client'` file, `dynamic` at module top, `loading` + conditional mount if interaction-gated.

### 4.4. Dialog / Sheet content

**When:** heavy form or editor inside a shadcn Dialog/Sheet (Base UI).

- Keep Dialog/Sheet shell in parent; lazy-load **content body** when `open === true` (or on first open with `hasOpened` flag).
- Mobile: Sheet from bottom (**ui-mobile-first**); skeleton height ≈ final sheet content.

Pulse examples (candidates): admin complaint resolution panels, multi-step upload previews.

### 4.5. Charts and analytics widgets

**When:** `recharts` via [`chart.tsx`](../../../apps/web/src/components/ui/chart.tsx).

- Do **not** statically import `ChartContainer` from shared layouts or catalog cards used on many routes.
- Prefer route-local chart component + `dynamic(..., { ssr: false })` when charts ship.
- Design Lab may static-import for showcase; product routes must lazy-load.

### 4.6. With Suspense on the same page

**Allowed and common:**

```
loading.tsx / Suspense     → server data regions
  └─ Server content
       └─ Client shell
            └─ dynamic(panel) when open   → client JS chunk
```

Do **not** duplicate the **same** full-region skeleton on both Suspense and `dynamic.loading` for identical layout. Route navigation → **ai_loading_patterns**; button pending → **ui-mutation-pending** (§13 there).

---

## 5. Tree shaking & bundle hygiene (from docs/general/04)

**Server Components first** — лучший code split: код не попадает в client bundle вообще.

### MUST (icons & utilities)

```tsx
// ❌ Entire icon pack
import * as Icons from "lucide-react";

// ✅ Per-icon imports (+ optimizePackageImports in next.config.ts)
import { Search, User } from "lucide-react";
```

### SHOULD — next.config.ts

```typescript
experimental: {
  optimizePackageImports: ["lucide-react", "date-fns"],
},
```

### Bundle analysis (before adding heavy deps)

1. Check [bundlephobia.com](https://bundlephobia.com) — gzipped size, tree-shakeable flag
2. `ANALYZE=true npm run build` with `@next/bundle-analyzer`
3. DevTools CPU **4x slowdown** — parse cost on mobile

### Preload / prefetch

- `Link` prefetches routes in viewport — `prefetch={false}` for rare heavy admin pages
- `dynamic().preload()` on hover for interaction-gated modals
- `rel="preload"` only for LCP fonts/images — unused preload wastes bandwidth

### Error boundaries for lazy chunks

Wrap `Suspense` + lazy components in Error Boundary — chunk load failure (offline) needs retry UX.

---

## 6. AI assistant contract (client lazy)

Apply when adding or materially changing:

- `'use client'` modules that import **`react-day-picker`**, **`recharts`**, **`@dnd-kit/*`**, rich text editors, maps, or media players; or
- shared `components/ui/*` client primitives used across many routes (`DatePickerField`, `Calendar`, `chart.tsx`).

### 6.1 Rules

1. **Prefer Server Components** for data; keep client islands small ([`ai_component_guidelines.md`](../react/ai_component_guidelines.md)).
2. **Do not** statically import heavy libs in **shared** client modules used by unrelated routes — split + `dynamic` or interaction-gated import.
3. **`dynamic` placement:** as **low** in the tree as possible (page / form / field), not root layout — unless the widget is truly global (exception: global `Toaster` / `sonner` is lightweight).
4. **`ssr: false`:** document in code comment **why** (browser API, library SSR break, intentional client-only).
5. **`loading`:** provide a sized placeholder for `dynamic`; use `aria-hidden` when decorative during chunk load; match Slate Cobalt skeletons (`@/components/ui/skeleton`).
6. **One primary component per file** ([`react-one-component-per-file.mdc`](../../../.cursor/rules/react-one-component-per-file.mdc)); lazy **wrapper** may be a thin second file named `*-lazy.client.tsx` or colocated `dynamic` in the parent client file.
7. **Design Lab catalog:** new heavy primitive → implement lazy pattern in catalog section **before** product routes import it ([`design_system_lab_spec.md`](../../implementation/mvp/specs/design_system_lab_spec.md)).

### 6.2 Checklist

- [ ] Heavy dependency isolated in its own client module.
- [ ] `dynamic` + conditional mount if interaction-gated.
- [ ] `ssr: false` only with a reason (comment).
- [ ] Skeleton / `loading` matches final control dimensions (CLS < 0.1).
- [ ] Server route still follows **ai_loading_patterns** checklist (§16) if the page fetches data.
- [ ] lucide-react — per-icon import; no namespace import
- [ ] User-visible strings from `@/lib/messages` — not in lazy wrapper only.

---

## 7. Audit backlog (Pulse — May 2026)

Prioritized by impact. Re-run after major UI deps or new shared client primitives. Verify shared-chunk bleed with production `npm run build` output (Pulse snapshot: [`ai_client_lazy_loading.md`](../../examples/pulse/docs/guidelines/nextjs/) — `ai_bundle_analyze_steps.md` is not in this snapshot; use this guideline + `npm run build` chunk report).

| Priority | Surface | Issue | Suggested approach |
|----------|---------|-------|-------------------|
| **High** | `DatePickerField.client.tsx` | static `Calendar` → `react-day-picker` in shared UI | **Done:** §4.2 lazy panel when `open`; [`DatePickerCalendarPanel.client.tsx`](../../../apps/web/src/components/ui/DatePickerCalendarPanel.client.tsx) |
| **High** | `components/ui/calendar.tsx` | heavy primitive in Design Lab + product import graph | keep implementation; consumers use lazy panel wrapper |
| **Medium** | `TrainerScheduleExceptionsTab.client.tsx` | static `Calendar` on trainer schedule route | route split limits blast radius; optional lazy if tab is not default active |
| **Medium** | `components/ui/chart.tsx` | `recharts` in shared UI | lazy-wrap before any product dashboard chart ships |
| **Low** | `@dnd-kit/*` (post-MVP) | schedule ordering DnD | route-local `dynamic` on editor mount — **patterns-tables-dnd** |
| **Low** | `FileUploadZone.client.tsx` | client upload UX | already route/form scoped; monitor if moved to shared layout |

**Baseline:** Pulse uses `next/dynamic` for `DatePickerField` calendar panel (May 2026) — extend §4 patterns for other heavy shared primitives.

---

## 8. Pulse route notes

| Route / surface | Server loading | Client lazy candidate |
|-----------------|----------------|------------------------|
| `/book/[trainerId]` | Suspense per wizard step | `SchedulePicker` is light (no day-picker); keep route-local |
| `/trainer/schedule` | Suspense slot grid | Calendar on exceptions tab — §6 |
| `/trainer/onboarding/*` | Step shells | `DatePickerField` on personal step — benefits from §4.2 |
| `/admin/*` dialogs | N/A | Dialog content on open — §4.4 |
| `/design-system` | Dev-only | May static-import for showcase; documents lazy variant in Lab |
| `/` (landing) | Suspense above/below fold — [`ai_loading_patterns.md`](./ai_loading_patterns.md) §14.1 | **No** `dynamic()` in `LandingPageRest.server.tsx`; static client imports |

---

## 9. Cross-references

| Document | Topic |
|----------|-------|
| [`ai_loading_patterns.md`](./ai_loading_patterns.md) | `loading.tsx`, Suspense, streaming shell |
| [`ai_component_guidelines.md`](../react/ai_component_guidelines.md) | RSC/client boundaries |
| [`ai_form_handling_pattern.md`](../react/ai_form_handling_pattern.md) | Mutation pending vs route loading |
| [`design_system_lab_spec.md`](../../implementation/mvp/specs/design_system_lab_spec.md) | Catalog before product import |
| [`docs/general/04-code-splitting.md`](../../general/04-code-splitting.md) | Full bundle theory |
| [`ai_browser_rendering_performance.md`](../react/ai_browser_rendering_performance.md) | TBT, animations |
| Pulse reference | `docs/examples/pulse/docs/guidelines/nextjs/` — bundle patterns |
| [Next.js: Lazy loading](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading) | Official API |
| [Next.js: Loading UI and Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming) | Suspense (server layer) |
| Index: [`README.md`](./README.md) | Next.js guidelines |

**Cursor rules:** `app-router-streaming-loading`, `react-ui-components`, `react-logic-presentation`, `react-one-component-per-file`, **ui-animation-performance**

---

**Next.js Version:** 16.4 · **Hosting:** Vercel · **Reference adapted from:** Pulse reference BSFY `ai_client_lazy_loading.md`
