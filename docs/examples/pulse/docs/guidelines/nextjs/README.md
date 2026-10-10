# Next.js Guidelines — Pulse

**Baseline:** Next.js **16.3.0** (pinned) App Router · **Vercel** · Turbopack · Neon + Prisma v7  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Runtime policy (mandatory):** [ADR-002](../../prds/07_governance/adr_002_next162_vercel_runtime_policy.md)  
**Stack:** [ADR-001](../../prds/07_governance/adr_001_stack_and_runtime.md)  
**Reference:** lampto [`docs/examples/lampto/docs/guidelines/nextjs/`](../../examples/lampto/docs/guidelines/nextjs/)

---

## Version pin

```json
"next": "16.3.0"
```

Agents must not use Next.js 15 docs/patterns for request interception or runtime policy.

---

## Next.js 16: `proxy.ts` vs `middleware.ts`

Per official Next.js 16 upgrade guide (Context7 `/vercel/next.js`):

| Legacy (v15) | Pulse canonical (v16.3.0) |
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
| [ai_loading_patterns.md](./ai_loading_patterns.md) | `loading.tsx`, Suspense, streaming shell, Instant Navigations / Partial Prefetching, `catchError`; **`'use cache'`** |
| [ai_vercel_runtime_compatibility.md](./ai_vercel_runtime_compatibility.md) | Vercel + Next 16.3 baseline |
| [ai_admin_interface_requirements.md](./ai_admin_interface_requirements.md) | Admin forms layout |
| [blob-upload-agent-instruction.md](./blob-upload-agent-instruction.md) | **Deprecated** — use [s3-upload-agent-instruction.md](./s3-upload-agent-instruction.md) |
| [s3-upload-agent-instruction.md](./s3-upload-agent-instruction.md) | S3 presigned + `file_asset` |

---

## Key principles

1. **Next.js 16.3.0 + Vercel** per ADR-001/ADR-002; async Request APIs.
2. **`proxy.ts`** for request interception; split Auth.js config.
3. **Cache reads:** **`'use cache'`** + `cacheTag()` / `cacheLife()` for cross-request data — not `unstable_cache`; **`cacheComponents: true`**.
4. **Instant Navigations (16.3):** **`partialPrefetching: true`** with `cacheComponents`; default Link warms App Shell; Suspense / `'use cache'` for instant routes; `export const instant = false` only with reason.
5. **Errors:** segment `error.tsx`; component-level **`catchError`** + prefer `retry()` when needed.
6. **Cache invalidation:** `updateTag` (Server Actions) / `revalidateTag` / `revalidatePath`.
7. **No `unstable_after`** for jobs — Vercel Cron + `delivery_log`.
8. **Server Components by default** — thin BFF to `packages/`.

---

## For AI assistants

1. Read [ADR-002](../../prds/07_governance/adr_002_next162_vercel_runtime_policy.md) before routing/auth.
2. Use MCP **Context7** (`/vercel/next.js`) for API wording after ADR-002; prefer `node_modules/next/dist/docs/`.
3. React: [React guidelines](../react/README.md).

**Cursor rules:** `nextjs-vercel-app-router.mdc`, `data-server-actions-and-api.mdc`, `ios-safari-mutation-transport.mdc`, `app-router-streaming-loading.mdc`, `s3-file-asset-uploads.mdc`, `admin-forms-layout.mdc`

---

**Last updated:** August 2026 · **Next.js:** 16.3.0 · **Hosting:** Vercel
