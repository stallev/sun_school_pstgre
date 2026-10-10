# Next.js Data Access: Server Actions vs Route Handlers (Pulse)

**Version:** 1.3 · **Stack:** Next.js **16.3.0** App Router, React 19, Prisma v7, Neon, Vercel  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Runtime:** [ADR-002](../../prds/07_governance/adr_002_next162_vercel_runtime_policy.md)  
**Reference:** lampto [`ai_nextjs_db_data_handle.md`](../../examples/lampto/docs/guidelines/nextjs/ai_nextjs_db_data_handle.md)  
**iOS Safari:** [`docs/incidents/ios-safari-mutation-transport-pattern.md`](../../incidents/ios-safari-mutation-transport-pattern.md) · cursor rule **ios-safari-mutation-transport**

AI agents **MUST** follow this when implementing data access or mutations.

---

## 1. Key difference: automatic re-render

### Server Action → re-renders Server Components on current page (cannot disable).

### Route Handler + `fetch()` → JSON only, no automatic RSC re-render.

---

## 2. When to use which

| Scenario | Prefer |
|----------|--------|
| Form submit; list/detail refresh | **Server Action** (+ iOS Safari fallback — §7) |
| Optimistic toggle (wishlist, service active) | **Route Handler** primary (Class A — §7) |
| JSON/polling | **Route Handler** |
| Frequent save / debounced field | **Route Handler** + retry — not Server Action |

---

## 3. DAL pattern

- Mutations → `apps/web/src/data/**` + `import "server-only"`
- Actions → thin wrappers + `revalidatePath` / `revalidateTag` / **`updateTag`** (read-your-own-writes in Server Actions, Next.js 16)

---

## 4. Async Request APIs (Next.js 16.3.0)

```ts
const cookieStore = await cookies();
const headersList = await headers();

export default async function Page(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
}
```

---

## 5. Request interception (not in DAL)

Route protection lives in **`proxy.ts`**, not in Server Actions. See [ADR-002](../../prds/07_governance/adr_002_next162_vercel_runtime_policy.md).

---

## 7. iOS Safari `Load failed` — dual transport

On **iOS Safari**, Server Action submits can fail with **`TypeError: Load failed`** (WebKit transport) without a server 5xx. Pulse is **mobile-first** — treat as platform risk on conversion-critical flows.

**Incident + pattern:** [`nextjs-server-actions-safari-load-failed.md`](../../incidents/nextjs-server-actions-safari-load-failed.md), [`ios-safari-mutation-transport-pattern.md`](../../incidents/ios-safari-mutation-transport-pattern.md).  
**Cursor rule:** **ios-safari-mutation-transport**

### Class A — frequent / toggle (Route Handler primary)

- Wishlist, service `isActive`, debounced profile fields.
- `POST /api/...` → same DAL → `MutationResult<T>`.
- Client: `resilientPostFetch` with retry on `Load failed` only.
- No automatic RSC re-render — update via optimistic UI or local state.

### Class B — critical submit (Server Action + fallback)

- Booking confirm (`/book/[trainerId]`), trainer onboarding (`/auth/register/trainer`), admin approve (`/admin/trainers`).
- **Default:** Server Action → DAL → `updateTag` / `redirect`.
- **Fallback:** `isIosSafari()` or post-failure → `POST /api/...` → same DAL → JSON `MutationResult` → `router.push` / query toast (I2).

### DAL contract (both classes)

```
apps/web/src/data/**/mutation.ts     ← server-only: auth, policy, domain, Prisma
apps/web/src/actions/**              ← thin: FormData → DAL → cache / redirect
apps/web/src/app/api/**/route.ts     ← thin: JSON → DAL → NextResponse.json(result)
```

- Return **`MutationResult<T>`** from `@pulse/domain` — no parallel error shapes.
- Shared Zod in `lib/validation/` or `@pulse/domain`.
- **Never** duplicate business logic between Action and Route Handler.

### Utilities (add with first Class B flow)

| Module | Path |
|--------|------|
| iOS Safari detect | `apps/web/src/lib/ui/is-ios-safari.ts` |
| Retry on Load failed | `apps/web/src/lib/ui/resilient-post-fetch.ts` |

### Observability

When Sentry is enabled: `Sentry.setTag('submit_transport', 'server-action' | 'route-handler-fallback' | 'route-handler-primary')`.

---

## 8. Related rules

- [`data-server-actions-and-api.mdc`](../../../.cursor/rules/data-server-actions-and-api.mdc)
- [`ios-safari-mutation-transport.mdc`](../../../.cursor/rules/ios-safari-mutation-transport.mdc)
- [`nextjs-vercel-app-router.mdc`](../../../.cursor/rules/nextjs-vercel-app-router.mdc)
