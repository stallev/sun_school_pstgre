# Next.js Guidelines — {{PROJECT_NAME}}

**Baseline:** Next.js **16.4** (pinned) App Router · **Vercel** · Turbopack · Neon + Prisma v7  
**Upstream:** [Next.js 16.4](https://nextjs.org/blog/next-16-3) — Instant Navigations **required** ([ADR-002 template §5.1](../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.template.md))  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Runtime policy (mandatory):** [ADR-002 template](../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.template.md)  
**Stack:** [ADR-001](../../prds/07_governance/adr_001_stack_and_runtime.md) (после W4)  
**Reference:** Pulse [`docs/examples/pulse/docs/guidelines/nextjs/`](../../examples/pulse/docs/guidelines/nextjs/)

---

## Version pin

```json
"next": "16.4"
```

Baseline is the **current 16.4.x patch** (exact pin, no `^16`). At P5 confirm with `npm view next version` + Context7 `/vercel/next.js`; if latest is still 16.4.x, pin that patch and align `@next/third-parties` / `eslint-config-next`. 16.5+ needs an ADR amend.

---

## Next.js 16: `proxy.ts` vs `middleware.ts`

Per official Next.js 16 upgrade guide (Context7 `/vercel/next.js`):

| Legacy (v15) | Canonical (v16.4) |
|--------------|---------------------------|
| `middleware.ts` | **`proxy.ts`** |
| `export function middleware()` | **`export function proxy()`** |
| Edge runtime typical | **`proxy` = Node.js runtime** |

- **Do not** add new auth/route logic to `middleware.ts`.
- **Codemod:** `npx @next/codemod@canary middleware-to-proxy .`
- **Auth:** `proxy.ts` imports **`auth.config.ts`** only (no Prisma).

---

## Available guidelines

| Document | Topic |
|----------|--------|
| [ai_nextjs_db_data_handle.md](./ai_nextjs_db_data_handle.md) | Server Actions vs Route Handlers, DAL, iOS Safari §7 |
| [ai_data_fetching_patterns.md](./ai_data_fetching_patterns.md) | Race conditions, `React.cache()`, `'use cache'`, dedup, retry |
| [ai_loading_patterns.md](./ai_loading_patterns.md) | `loading.tsx`, Suspense, streaming shell, page performance; **`'use cache'`** / **`'use cache: private'`** (browser); **§8.1** Instant Navigations; **§8.1.1** Instant Insights (dev warning); Playwright `instant()` SHOULD; **§14.1** landing LCP |
| [ai_client_lazy_loading.md](./ai_client_lazy_loading.md) | `next/dynamic`, heavy client deps (`react-day-picker`, `recharts`), interaction-gated panels |
| [ai_vercel_runtime_compatibility.md](./ai_vercel_runtime_compatibility.md) | Vercel + Next 16 baseline |
| [ai_admin_interface_requirements.md](./ai_admin_interface_requirements.md) | Admin forms layout |
| [ai_s3_file_upload_guidelines.md](./ai_s3_file_upload_guidelines.md) | **AWS S3** — bucket/IAM/CORS, presigned PUT/GET, FileAsset lifecycle |
| [s3-upload-agent-instruction.md](./s3-upload-agent-instruction.md) | S3 implementation detail + code samples |
| [blob-upload-agent-instruction.md](./blob-upload-agent-instruction.md) | **Deprecated** — Vercel Blob; use S3 guides above |
| [ai_psi_lab_testing.md](./ai_psi_lab_testing.md) | Lab PSI on **deployed** origin (`npm run psi:lab`); portable canon [`psi-lab-testing.md`](../psi-lab-testing.md) |

---

## Key principles

1. **Next.js 16.4 + Vercel** per ADR-001/ADR-002; async Request APIs.
2. **`proxy.ts`** for request interception; split Auth.js config.
3. **Cache reads:** **`'use cache'`** + `cacheTag()` / `cacheLife()` for cross-request data — not `unstable_cache`; **`cacheComponents: true`** when enabled.
4. **Cache invalidation:** `updateTag` (Server Actions) / `revalidateTag` / `revalidatePath`.
5. **No `unstable_after`** for jobs — Vercel Cron + `delivery_log`.
6. **Server Components by default** — thin BFF to `packages/`.
7. **Instant Navigations / `partialPrefetching`:** **required** — Cache Components first, then Partial Prefetching; Stream / Cache / Block (ADR-002 §5.1); Instant Insights — [`ai_loading_patterns.md`](./ai_loading_patterns.md) §8.1.1. Playwright `instant()` SHOULD.
8. **No self-fetch from RSC** — DAL direct calls; client fetch only when necessary — [`ai_data_fetching_patterns.md`](./ai_data_fetching_patterns.md).
9. **Deep dive:** [`docs/general/02-data-fetching.md`](../../general/02-data-fetching.md) — theory; operational norms in guideline above.

---

## Agent runtime verification (on user request only)

Skill **`next-dev-loop`** confirms a feature works in a live `next dev` by cross-checking **two views** of the same app:

| View | Tool | Knows |
|------|------|--------|
| Next.js | `/_next/mcp` | routes, segments, RSC, server actions, server logs, Turbopack compile issues |
| Browser | `agent-browser` | DOM, console, network, React fiber/props/state, vitals |

**Loop (when the skill is running):** narrow scope via runtime → edit → 4 layers — (1) compilation, (2) runtime errors, (3) browser UX, (4) React behavior — then cross-check both views.

**Trigger:** start **only** when the user explicitly asks (e.g. «проверь в runtime», «next-dev-loop», «verify in browser / live»). Do **not** auto-start after UI edits, before DoD, or in the commit pipeline. Default verification remains `typecheck` + `lint`.

**Instant Insights ≠ `next-dev-loop`:** Instant Insights is the Next.js **dev overlay** for Instant Navigations blocking routes (Stream / Cache / Block) — see [`ai_loading_patterns.md`](./ai_loading_patterns.md) §8.1.1. It is not a substitute for dual-view runtime verification and is not part of the commit pipeline.

Requires Next **16.3+** Turbopack and `agent-browser` = 0.31.1. Protocol details live in the user skill — do not invent a second browser protocol (e.g. Playwright MCP) as a substitute.

See: methodology §2.2 · `agent-commit-pipeline.mdc` §1 · [ADR-010](../../reference/adr_010_nextjs_app_architecture_skill.md) (workflow vs architecture skills).

### Lab PageSpeed Insights (on user request only)

**Orthogonal** to `next-dev-loop`. Dual-view measures **live `next dev`**. Lab PSI measures a **public deployed** origin via REST `runPagespeed` (`npm run psi:lab`, key `PAGE_SPEED_API_KEY`). Do **not** use MCP PageSpeed as the primary channel. Do **not** treat `localhost` as green zone.

Trigger: only when the user asks (PSI, PageSpeed, «прогони прод»). Not auto, not commit pipeline. Rule: **`psi-lab-testing.mdc`**. HOW: [`ai_psi_lab_testing.md`](./ai_psi_lab_testing.md).

---

## For AI assistants

1. Read [ADR-002 template](../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.template.md) before routing/auth (incl. §5.1 Instant Navigations).
2. Use MCP **Context7** (`/vercel/next.js`) for API wording after ADR-002; prefer version-matched docs under `node_modules/next/dist/docs/` when available.
3. React: [React guidelines](../react/README.md).

**Cursor rules:** `nextjs-vercel-app-router.mdc`, `data-server-actions-and-api.mdc`, `ios-safari-mutation-transport.mdc`, `app-router-streaming-loading.mdc`, `react-ui-components.mdc`, `s3-file-asset-uploads.mdc`, `admin-forms-layout.mdc`, `psi-lab-testing.mdc` (requestable)

---

**Last updated:** August 2026 · **Next.js:** 16.4 (pinned) · **Hosting:** Vercel
