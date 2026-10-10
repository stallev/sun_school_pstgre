# Incident Report: Next.js Server Actions + iOS Safari `Load failed` (Pulse)

**Тип:** Incident (adapted from lampto BSFY)  
**Статус:** Canonical mitigation pattern — apply to new critical mutations  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Stack:** Next.js **16.2.6** · Vercel · `@pulse/domain` `MutationResult`  
**Architecture pattern:** [`ios-safari-mutation-transport-pattern.md`](./ios-safari-mutation-transport-pattern.md)  
**Cursor rule:** **ios-safari-mutation-transport**

**Source (read-only):** [`docs/examples/lampto/docs/incidents/nextjs-server-actions-safari-load-failed.md`](../examples/lampto/docs/incidents/nextjs-server-actions-safari-load-failed.md)

---

## Summary

On **iOS Safari**, submitting a form backed by Next.js **Server Actions** can fail with:

- `TypeError: Load failed`
- stack frame in `next/.../server-action-reducer.ts` (`fetchServerAction`)
- failed `POST` to the page route (for example, `/book/[trainerId]` or `/auth/register/trainer`)

This can happen **without** a clear backend exception in Vercel logs or Sentry — the failure looks like a random client-side network error.

---

## Impact (Pulse MVP)

| Risk | Routes / flows |
|------|----------------|
| **Conversion loss** | `/book/[trainerId]` — booking wizard confirm |
| **Onboarding blocked** | `/auth/register/trainer` — trainer registration steps |
| **Admin ops** | `/admin/trainers` — approve/reject application |
| **Profile edits** | `/trainer/profile`, `/client/profile` — save forms |

Mobile-first product → **assume iOS Safari** for all Class B critical submits.

---

## Signals

- Sentry events on **Mobile Safari / iOS only**
- No stable **5xx** for the failed submit on Vercel
- Persists after unrelated UI fixes (controlled/uncontrolled warnings, etc.)

---

## Root cause (practical)

Not a single proven business-logic bug. **Platform compatibility risk:** Safari/WebKit transport instability around Server Action POST + follow-up RSC payload.

Treat as **infrastructure class**, not only form-state bugs.

---

## Minimal safe mitigation (Pulse)

1. Keep **Server Action** as default on desktop and non-iOS browsers.
2. Add scoped **`POST /api/...`** Route Handler fallback for the same mutation.
3. **Single DAL** in `apps/web/src/data/**` — both transports call it (`MutationResult<T>` from `@pulse/domain`).
4. Client: fallback on **iOS Safari detect** and/or **retry after `Load failed`**.
5. Preserve **ui-mutation-pending** + **ui-toast-mutations** UX contract on both paths.
6. Sentry tag: `submit_transport=server-action | route-handler-fallback | route-handler-primary`.

Full patterns: [`ios-safari-mutation-transport-pattern.md`](./ios-safari-mutation-transport-pattern.md).

---

## AI agent task template

```md
Task: Prevent iOS Safari submit failures for a Pulse critical mutation.

Context:
- App Router + Server Actions + useActionState on a canonical route (see canonical_routes.md).
- Production class: TypeError: Load failed on Mobile Safari.

Requirements:
1. Server Action remains primary (non-iOS Safari).
2. POST Route Handler at apps/web/src/app/api/.../route.ts — same DAL, same MutationResult.
3. Client: isIosSafari() OR resilientPostFetch retry on Load failed.
4. pending / disabled / aria-busy unchanged (ui-mutation-pending).
5. Toasts / redirect query unchanged (ui-toast-mutations, interaction_design_contract I2).
6. updateTag / revalidatePath in Action; Route Handler success → manual router.refresh() or router.push() as needed.
7. Sentry submit_transport tag.
8. Verify: npm run typecheck, npm run lint -w web.

Deliverables:
- Code diff
- Note which class (A or B) applies
- iOS Safari verification summary
```

---

## Verification checklist

- [ ] **iOS Safari** (device or BrowserStack): happy path, repeat submit, weak network
- [ ] **Desktop Chrome/Firefox:** Server Action path unchanged
- [ ] **Sentry:** `submit_transport` separates traffic; no new `Load failed` for closed flow
- [ ] **`npm run typecheck`** (root) passes

---

## Operational notes

- Do **not** duplicate mutation logic across transports.
- Do **not** remove Server Actions globally — scoped fallback per critical flow.
- Optional feature flag for fallback rollback on Vercel.
