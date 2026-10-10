# Vercel runtime compatibility for Next.js 16.4

**Project:** Pulse — `apps/web`  
**Technologies:** Next.js **16.4**, React 19, TypeScript, **Vercel**, Neon PostgreSQL  
**Canonical policy:** [ADR-002 template](../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.template.md), [ADR-001](../../prds/07_governance/adr_001_stack_and_runtime.md) (после W4)

---

## 1. Why this document exists

The web app deploys on **Vercel**. Framework and hosting choices must align with ADR-001/ADR-002 and Next.js 16 capabilities on Vercel.

**Project standard:**

- **Next.js:** `16.4` (pinned in `apps/web/package.json`)
- **Hosting:** Vercel
- **Bundler:** Turbopack (default)
- **Request interception:** **`proxy.ts`** canonical; `middleware.ts` temporary migration only
- **Jobs:** Vercel Cron + serverless — not `unstable_after`

---

## 2. Supported baseline (App Router on Vercel)

- Server Components, Client Components, Route Handlers
- Static, dynamic, and incremental caching (Next.js 16 cache APIs)
- **Streaming** with Suspense — first-class on Vercel
- **`next/image`** via Vercel Image Optimization
- Cache invalidation: **`revalidatePath`**, **`revalidateTag`**, **`updateTag`** (Server Actions only for `updateTag` — Context7 `/vercel/next.js`)

---

## 3. Policies (from ADR-002)

1. **Async Request APIs** — `await cookies()`, `await headers()`, `await params`, `await searchParams`
2. **Read-your-own-writes** — `updateTag` in Server Actions after mutations
3. **Stale-while-revalidate** — `revalidateTag` in Actions or Route Handlers
4. **Background work** — Vercel Cron + `delivery_log` + `idempotency_key` — not request path
5. **Webpack** — only when explicitly documented (`next build --webpack`)
6. **Instant Navigations (best practice)** — `cacheComponents: true` and `partialPrefetching: true`; Stream / Cache / Block — ADR-002 §9

---

## 4. Practical guidance for AI agents

- Assume **Vercel + Next.js 16.4** per ADR-002
- New interception → **`proxy.ts`** with `@{{PACKAGE_SCOPE}}/policy-edge` + `auth.config.ts` only
- Use **Suspense** / **`loading.tsx`** for UX (Instant Navigations Stream — ADR-002 §9)
- Do **not** apply Netlify-only or AWS Amplify SSR caveats to this codebase
- Hosting limits → [Vercel docs](https://vercel.com/docs), not legacy Amplify limits

---

## 5. Summary

| Area | Choice |
|------|--------|
| Hosting | **Vercel** |
| Framework | Next.js **16.4** |
| Interception | **`proxy.ts`** |
| Database | Neon PostgreSQL 17 |
| Async / heavy work | Cron + jobs, not `unstable_after` |
| Storage | AWS S3 |
| Email | Resend |

**Reference:** Pulse snapshot [`ai_vercel_runtime_compatibility.md`](../../examples/pulse/docs/guidelines/nextjs/ai_vercel_runtime_compatibility.md) — Netlify baseline replaced per ADR-001.
