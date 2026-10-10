# Optimistic UI с `useOptimistic` (React 19) — Pulse

Немедленное обновление UI до подтверждения сервера. Работает с **ui-mutation-pending** и **ui-toast-mutations**.

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Cursor rule:** **ui-optimistic-mutations**

---

## 1. Суть

```
User clicks → UI обновляется (optimistic)
         → Server Action в фоне
   OK → без мигания (сервер подтвердил)
   ERROR → React откатывает молчаливо + toast.error обязателен
```

`setOptimisticState` — **только внутри `startTransition`**.

---

## 2. Когда применять (Pulse MVP)

| Паттерн | Пример | Почему |
|---|---|---|
| **Toggle** | Wishlist add/remove | Мгновенная смена иконки Heart |
| **Toggle** | Trainer service `isActive` | Switch без spinner |
| **List-append** | Quick note (post-MVP) | Элемент с `sending: true` |

---

## 3. Когда НЕ применять

| Сценарий | Альтернатива |
|---|---|
| Бронирование с redirect на confirmation | `useActionState` / `useTransition` |
| Отмена брони, reject trainer (destructive) | Confirm modal + `useTransition` |
| Нужен ID/slot из ответа сервера | `useActionState` |
| Валидация полей формы | `useActionState` |

---

## 4. Toggle (wishlist)

```tsx
'use client'

import { useOptimistic, useTransition } from 'react'
import { toast } from 'sonner'
import { Heart } from 'lucide-react'
import { PRODUCT_TOAST_DURATION_MS } from '@/lib/ui/product-toast'
import { MESSAGES } from '@/lib/messages'

export const WishlistButton = ({
  trainerId,
  initialInWishlist,
}: {
  trainerId: string
  initialInWishlist: boolean
}) => {
  const [inWishlist, setInWishlist] = useOptimistic(initialInWishlist)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      setInWishlist(!inWishlist)
      // const res = await toggleWishlist(trainerId)
      // if (!res.ok) {
      //   toast.error(MESSAGES.catalog.wishlistError, { duration: PRODUCT_TOAST_DURATION_MS })
      // }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending}
      aria-pressed={inWishlist}
    >
      <Heart className={inWishlist ? 'fill-primary' : ''} aria-hidden />
      <span className="sr-only">
        {inWishlist ? MESSAGES.catalog.removeWishlist : MESSAGES.catalog.addWishlist}
      </span>
    </button>
  )
}
```

---

## 5. Toast при optimistic

| Ситуация | toast |
|---|---|
| Успех, визуальная смена достаточна (heart filled) | `toast.success` опционален |
| Успех, нужно явное подтверждение | `toast.success` обязателен |
| Ошибка | `toast.error` **всегда** |

---

## 6. Антипаттерны

- Optimistic без `toast.error` → молчаливый откат
- Optimistic для cancel booking / admin reject
- `setOptimisticState` вне `startTransition`

**Reference:** lampto [`ai_optimistic_ui_pattern.md`](../../examples/lampto/docs/guidelines/react/ai_optimistic_ui_pattern.md)
