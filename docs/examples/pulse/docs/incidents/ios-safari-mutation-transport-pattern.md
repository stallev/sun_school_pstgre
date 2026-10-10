# Architecture Pattern: iOS Safari `Load failed` — Pulse

**Тип:** Architecture / incident mitigation  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Stack:** Next.js **16.2.6** · Vercel · `@pulse/domain` `MutationResult`  
**Связан с:** [`nextjs-server-actions-safari-load-failed.md`](./nextjs-server-actions-safari-load-failed.md)  
**Guidelines:** [`ai_nextjs_db_data_handle.md`](../guidelines/nextjs/ai_nextjs_db_data_handle.md) §7, [`ai_form_handling_pattern.md`](../guidelines/react/ai_form_handling_pattern.md) §7  
**Cursor rule:** **ios-safari-mutation-transport**

**Source (read-only):** [`docs/examples/lampto/docs/incidents/safari-ios-load-failed-architecture-pattern.md`](../examples/lampto/docs/incidents/safari-ios-load-failed-architecture-pattern.md)

---

## Контекст

`TypeError: Load failed` на iOS Safari/WebKit при Server Actions — **класс инфраструктурных проблем**, не единичный баг формы.

### Pulse MVP — где применять

| Класс | Canonical routes (examples) | Паттерн |
|-------|----------------------------|---------|
| **B — critical submit** | `/book/[trainerId]`, `/auth/register/trainer`, `/admin/trainers` (approve/reject) | Server Action primary + Route Handler fallback |
| **A — frequent / toggle** | Wishlist on `/trainers/[id]`, service toggle `/trainer/services`, optimistic toggles | Route Handler primary + `resilientPostFetch` retry |

См. [`canonical_routes.md`](../design/canonical_routes.md).

### Корневые причины

1. WebKit прерывает in-flight `fetch()` при уходе в фон (app switcher, звонок) → `AbortError` → `TypeError: Load failed`.
2. `fetchServerAction` запускает **RSC re-render** после каждого POST — второй запрос на нестабильной сети обрывается.
3. Частые вызовы Server Action создают конкурентные POST/RSC пары — лишние точки сбоя.
4. Server Action там, где достаточно Route Handler (toggle, debounced save) — антипаттерн для mobile.

---

## Класс A — частые мутации без обязательного RSC re-render

**Признаки:**

- Чаще чем раз в ~3 секунды (toggle, debounced field)
- Результат нужен клиенту (optimistic state, timestamp)
- RSC re-render после каждого вызова избыточен

**Паттерн:** Route Handler primary + retry

```
Client
  └─ POST /api/client/wishlist  ──► Route Handler ──► DAL → MutationResult
       │ TypeError: Load failed?
       └─ resilientPostFetch retry (300ms, 600ms)
```

**Pulse examples:** wishlist toggle, trainer `service.isActive` switch — см. **ui-optimistic-mutations**.

---

## Класс B — critical submit (однократная значимая мутация)

**Признаки:**

- Booking confirm, trainer onboarding step, admin approve
- После успеха — redirect или осмысленный RSC refresh
- Потеря данных при сбое критична

**Паттерн:** Server Action primary + Route Handler fallback на iOS Safari

```
Client (isIosSafari() OR после Load failed на Server Action)
  ├─ primary:  form action → Server Action → DAL → updateTag / redirect
  └─ fallback: resilientPostFetch → POST /api/client/bookings → DAL → MutationResult JSON
                    └─ router.push('/client/bookings/[id]?booked=1') + toast query pattern (I2)
```

---

## Реализация (target paths)

### `isIosSafari`

Colocate when implementing first Class B flow:

```ts
// apps/web/src/lib/ui/is-ios-safari.ts
export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return (
    /iP(hone|od|ad)/.test(ua) &&
    /WebKit/.test(ua) &&
    !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua)
  )
}
```

### `resilientPostFetch`

```ts
// apps/web/src/lib/ui/resilient-post-fetch.ts
const LOAD_FAILED_RE = /load failed/i

export async function resilientPostFetch<T>(
  url: string,
  body: unknown,
  opts: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const { retries = 2, baseDelayMs = 300 } = opts

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw Object.assign(new Error('fetch_error'), { status: res.status, data })
      }
      return res.json() as Promise<T>
    } catch (err) {
      const isLoadFailed =
        err instanceof TypeError && LOAD_FAILED_RE.test(err.message)
      if (isLoadFailed && attempt < retries) {
        await new Promise((r) => setTimeout(r, baseDelayMs * (attempt + 1)))
        continue
      }
      throw err
    }
  }
  throw new Error('resilientPostFetch: exhausted retries')
}
```

Retry **только** для `TypeError: Load failed` / network abort — **не** для `4xx`/`5xx` без idempotency check.

### Shared DAL + `MutationResult`

```ts
// apps/web/src/data/client/create-booking.ts
import 'server-only'

import type { MutationResult } from '@pulse/domain'
import { getPrisma } from '@pulse/db'
// … policy-server, domain use-case …

export async function createBookingMutation(
  clientUserId: string,
  input: CreateBookingInput,
): Promise<MutationResult<{ id: string }>> {
  // auth + policy + prisma — single source of truth
}
```

```ts
// apps/web/src/actions/client/create-booking.ts
'use server'

import { redirect } from 'next/navigation'
import { updateTag } from 'next/cache'
import { auth } from '@/auth'
import { createBookingMutation } from '@/data/client/create-booking'

export async function createBookingAction(/* useActionState signature */) {
  const session = await auth()
  // … parse FormData …
  const result = await createBookingMutation(session!.user!.id, input)
  if (!result.ok) return result
  updateTag(`bookings:client:${session!.user!.id}`)
  updateTag(`booking:${result.data.id}`)
  redirect(`/client/bookings/${result.data.id}?booked=1`)
}
```

```ts
// apps/web/src/app/api/client/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createBookingMutation } from '@/data/client/create-booking'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, code: 'UNAUTHORIZED' } satisfies MutationResult,
      { status: 401 },
    )
  }
  const body = await req.json()
  const result = await createBookingMutation(session.user.id, body)
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}
```

### Client fallback (Class B)

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { isIosSafari } from '@/lib/ui/is-ios-safari'
import { resilientPostFetch } from '@/lib/ui/resilient-post-fetch'
import { createBookingAction } from '@/actions/client/create-booking'
import type { MutationResult } from '@pulse/domain'
import { MESSAGES } from '@/lib/messages'
import { PRODUCT_TOAST_DURATION_MS } from '@/lib/ui/product-toast'

export function useCreateBookingSubmit() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function submit(formData: FormData) {
    startTransition(async () => {
      try {
        if (isIosSafari()) {
          const payload = Object.fromEntries(formData.entries())
          const result = await resilientPostFetch<MutationResult<{ id: string }>>(
            '/api/client/bookings',
            payload,
          )
          if (!result.ok) {
            toast.error(result.message ?? MESSAGES.booking.error, {
              duration: PRODUCT_TOAST_DURATION_MS,
            })
            return
          }
          router.push(`/client/bookings/${result.data.id}?booked=1`)
          return
        }
        await createBookingAction(null, formData)
      } catch (err) {
        if (err instanceof TypeError && /load failed/i.test(err.message)) {
          // optional: one retry via Route Handler even on non-iOS
        }
        toast.error(MESSAGES.booking.error, { duration: PRODUCT_TOAST_DURATION_MS })
      }
    })
  }

  return { submit, pending }
}
```

Prefer **`useActionState`** when validation errors return in-band; wrap transport selection in a thin hook — **same pending/error UI** on both paths.

### Sentry

```ts
import * as Sentry from '@sentry/nextjs'

Sentry.setTag('submit_transport', 'route-handler-fallback')
// server-action | route-handler-fallback | route-handler-primary
```

Post-MVP when Sentry wired — see [`instrumentation-client.ts`](../../apps/web/src/instrumentation-client.ts) and [`pulse-tags.ts`](../../apps/web/src/lib/sentry/pulse-tags.ts).

---

## Критерии выбора класса

| Вопрос | Да → | Нет → |
|--------|------|-------|
| Вызывается чаще раза в ~3 секунды? | **Класс A** | **Класс B** |
| Нужен RSC re-render / redirect после каждого вызова? | **Класс B** | **Класс A** |
| Потеря данных при единичном сбое критична? | Fallback + retry | `toast.error` может быть достаточно |
| Mobile-first conversion flow? | **Обязателен** Class B fallback | Lower priority |

---

## Verification checklist

- [ ] iOS Safari: happy path, repeat submit, Network Link Conditioner / slow 3G
- [ ] Desktop: Server Action path not regressed
- [ ] `submit_transport` visible in Sentry (when enabled)
- [ ] `npm run typecheck`, `npm run lint -w web`
- [ ] Redirect + toast query per **interaction_design_contract** I2 (`?booked=1`)

---

## Operational notes

- Fallback **точечно** на critical flows — не глобальная замена Server Actions.
- Route Handler для toggles — **Safari fix + performance** (нет лишнего RSC flight).
- DAL duplication **запрещена** — **ai-dry-deduplication**, **data-server-actions-and-api**.
- Route Handlers: `auth()` + `@pulse/policy-server` — same as Actions (**auth-security**).
