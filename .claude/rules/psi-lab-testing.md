---
description: Lab PageSpeed Insights on a deployed origin via REST runPagespeed (not localhost, not MCP). Trigger on PSI / PageSpeed / prod lab score requests.
---
# Lab PageSpeed Insights (deployed origin)

**Canon (portable):** [`docs/guidelines/psi-lab-testing.md`](docs/guidelines/psi-lab-testing.md)  
**Project HOW:** [`docs/guidelines/nextjs/ai_psi_lab_testing.md`](docs/guidelines/nextjs/ai_psi_lab_testing.md)  
**CLI:** `npm run psi:lab` → [`scripts/psi-lab/run-pagespeed.mjs`](scripts/psi-lab/run-pagespeed.mjs)

## Trigger

**Only** when the user explicitly asks (PSI, PageSpeed, «прогони прод», lab scores on the deployed site).

**Do not** run after UI diffs, before DoD, or in the commit pipeline. Orthogonal to **`next-dev-loop`** (live `next dev`).

## Do

1. Client = local script. Target = public HTTPS (or HTTP) **deployed** origin.
2. Key: `PAGE_SPEED_API_KEY` from `.env` / `.env.local`. Never `NEXT_PUBLIC_*`.
3. Channel: REST `GET …/v5/runPagespeed` with four `category` values: `PERFORMANCE`, `ACCESSIBILITY`, `BEST_PRACTICES`, `SEO`. No PWA.
4. Default one named URL → **mobile**. Suite (`--suite`) → canon paths × mobile × desktop.
5. Warm CDN first; flake-retry when Perf &lt; 90 (or SI ≫ TTI); write both runs.
6. Append a short row to [`docs/ops/psi-lab-journal.md`](docs/ops/psi-lab-journal.md) when reporting.

Green zone: all four categories ≥ 90 (lab). CrUX optional. Lab ≠ CWV thresholds.

## Do not

- Measure `localhost`, `127.0.0.1`, `*.localhost`, or `next dev`.
- Use MCP `pagespeed` / `user-pagespeed` as the primary channel, or run MCP and REST in parallel.
- Change product code unless a category is &lt; 90 **and** PSI named the audit (after flake retry).
- Mix Playwright `instant()` / forced `prefetch={true}` into the lab run.
- Treat a missing CrUX payload as a regression.

## Env

```
PAGE_SPEED_API_KEY=
PSI_ORIGIN=https://example.com
```
