# User Flow — Admin (MVP)

**Status:** Canonical PRD (migrated from interim)  
**Version:** 1.0 · Date: 2026-05-23  
**Role:** **ADMIN** — модератор платформы, обрабатывающий верификации, жалобы и возвраты  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../../../meta/ai_first_project_methodology.md)  
**Interim source (archive):** [`docs/default_docs/user-flow-admin.md`](../../../../default_docs/user-flow-admin.md)  
**Routes canon:** [`docs/design/canonical_routes.md`](../../../../design/canonical_routes.md)  
**Visual reference:** HTML-прототип + Warm Forest design system  
**Platform:** Web (Next.js 16.2.6, Vercel) · Primarily Desktop — admin зона responsive

> При изменении behavior обновлять этот файл в той же задаче (см. product-docs-alignment Cursor rule).

---

## Навигация по роли

### Mobile (< 768px)
**Bottom Navigation Bar** — 4 пункта с badge-счётчиками:

```
┌──────────────────────────────────────────────┐
│  🏠 Overview  🛡 Trainers³  🚩 Complaints²  🔄 Refunds² │
└──────────────────────────────────────────────┘
```

- Badge: `absolute -top-0.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-error text-white text-[10px] font-bold`
- Badge видна поверх иконки — критически важно для admin, чтобы видеть pending задачи

### Desktop (≥ 768px)
**Sidebar Navigation** — `hidden md:flex`, `w-52 lg:w-60`

```
ADMINISTRATOR  ← font-mono uppercase text-ink-3

🏠 Overview
🛡 Trainers        [3]  ← badge в sidebar
🚩 Complaints      [2]
🔄 Refunds         [2]
```

- Badge в sidebar: `min-w-[20px] h-5 px-1.5 rounded-full bg-error text-white text-[11px]`
- Desktop sidebar + badge — позволяет админу всегда видеть очередь задач без перехода

---

## Поток 1: Admin Dashboard (Overview)

**Route**: `/admin/dashboard`

### Layout по брейкпоинтам

**Mobile**:
```
"Platform · last 30 days"  ← text-[13px] text-ink-2
"Control"                  ← font-display text-[26px]

[KPI Grid — grid-cols-2]
  [👥 142 signups]   [🛡 3 in queue]
  [🚩 2 complaints]  [💰 $42K GMV]

[Needs attention section]
  ─────────────────────────
  🛡  3 trainer applications    →
     oldest waiting 5 days
  ─────────────────────────
  🚩  2 complaints              →
     one high-priority
  ─────────────────────────
  🔄  2 refund requests         →
     $93 total

[Statistics section]
  Card: ключевые метрики
```

**Desktop**:
```
"Platform · last 30 days"
"Control"  ← font-display text-[40px]

[KPI Grid — md:grid-cols-4]
  [👥 New signups]  [🛡 In queue]  [🚩 Complaints]  [💰 GMV]

[Needs attention — full width card]

[Statistics — full width card]
```

### KPI Cards

```
Тоны:
  New signups  → info     (bg-info-container text-info)
  In queue     → primary  (bg-primary-container)
  Complaints   → secondary (bg-secondary-container)
  GMV          → success  (bg-success-container text-success)

Sub: "+12% vs last week", "oldest — 5 days", "+8.3%"
```

### Needs Attention Block

```
Card — action list:
  ┌─────────────────────────────────────────────────┐
  │ [🛡 icon, primary-container]                    │
  │ 3 trainer applications                          │
  │ oldest waiting 5 days               →           │
  ├─────────────────────────────────────────────────┤
  │ [🚩 icon, secondary-container]                  │
  │ 2 complaints                                    │
  │ one high-priority                   →           │
  ├─────────────────────────────────────────────────┤
  │ [🔄 icon, primary-container]                    │
  │ 2 refund requests                               │
  │ $93 total                           →           │
  └─────────────────────────────────────────────────┘

Каждый row: w-full, hover:bg-surface-variant, клик → соответствующий раздел
```

### Statistics Table

```
Card: p-4, space-y-3

Trainers (approved)   1 187
Trainers (pending)    3
Trainers (rejected)   42
Total clients         24 503
Sessions (30d)        6 412

Каждая строка: flex justify-between text-[14px]
  Label: text-ink-2
  Value: font-mono font-medium
```

---

## Поток 2: Верификация тренеров

**Route**: `/admin/trainers`

```
"Verification"  ← font-display text-[26px] md:text-[36px]

[Pending · 3] [Approved] [Rejected]  ← Pill tabs
```

### Список заявок (tab: Pending)

```
Mobile:  grid-cols-1
Desktop: md:grid-cols-2 xl:grid-cols-3
```

### Application Card

```
┌────────────────────────────────────────────────┐
│ [Avatar md]  Sergey Ivanov                     │
│              sergey@pulse.dev                    │
│              [Strength] [HIIT]  ← spec chips   │
│                                                │
│ Submitted: 5 days ago     ⏱ waiting 5 days    │
└────────────────────────────────────────────────┘
```

- Время ожидания: `text-warning` + Clock icon если > 3 дней
- Весь card кликабелен → Application Sheet

### Application Sheet

```
[drag handle — mobile]

Trainer application
─────────────────────────────────
[Avatar lg]  Sergey Ivanov
             sergey@pulse.dev
             [Pending review]  ← badge

Documents
─────────────────────────────────
✓ Trainer certificate (PDF)     [📥]
✓ ID document (JPG)             [📥]
✓ Experience proof              [📥]

Comment
─────────────────────────────────
[__________________________________]
[Reason for decision, if applicable]
[__________________________________]

[Reject ─────────] [Approve ────────]
  ↑ destructive       ↑ filled
```

**UX деталь**: кнопки Reject/Approve — рядом, но Reject — outlined/destructive, Approve — filled/primary. Случайный тап маловероятен.

После решения:
- Approve → toast «Trainer approved ✓», карточка исчезает из Pending
- Reject → toast «Application rejected», карточка исчезает из Pending

### Approved / Rejected tabs

```
[Empty state — секция в разработке]

[Shield icon 48px, text-ink-3]
"Section under development"
"Processed applications will appear here"
```

---

## Поток 3: Жалобы

**Route**: `/admin/complaints`

```
"Complaints"  ← font-display

[Open · 2] [In review]  ← Pill tabs
```

### Complaint Cards

```
Mobile:  grid-cols-1
Desktop: md:grid-cols-2
```

### Complaint Card

```
┌────────────────────────────────────────────────┐
│ [High]  · yesterday                            │
│                                                │
│ From: Client · Denis K.                        │
│ On:   Trainer · Artem K.                       │
│ Didn't show up                                 │
│                                                │
│ [Open details ──────────────] [Close]          │
└────────────────────────────────────────────────┘
```

**Priority badges**:
```
High   → status="cancelled" (bg-error-container text-error)
Medium → status="pending"   (bg-warning-container text-warning)
Low    → status="info"      (bg-info-container text-info)
```

### Пустой стейт (In review tab или всё обработано)

```
[CheckCircle icon 48px, text-success]
"All clear"
"No complaints in this category"
```

**UX rule**: зелёный empty state при отсутствии жалоб — позитивный фидбек, что очередь пуста.

### Complaint detail (P19)

**Route**: `/admin/complaints/[id]`

```
[← Back]  "Complaint"

[ℹ In review · assigned to Pulse Admin]   ← banner when in_review

┌─ Context ──────────────────────────────────────┐
│ Booking #A1B2 · 24 May · confirmed           │
│ Refund: none / Pending $38        [→ Refunds]│
└──────────────────────────────────────────────┘

┌─ Complaint ──────────────────────────────────┐
│ [Medium] [In review] · 1 day ago             │
│ From: Alex Client · On: Dmitry Strength      │
│ Description text…                            │
└──────────────────────────────────────────────┘

Audit timeline
  · Review started — Pulse Admin — today
  · Filed — Alex Client — yesterday

[Finish review ─────────────]  ← primary when in_review
```

**Finish review dialog:**

```
Resolution: [Select ▼]
Internal note: [________________________]
              max ~650px width

[Cancel]  [Confirm]
```

**Closed state:** resolution badge + internal note + closed by + date; no actions.

**Rules:**

- Quick «Close without review» only when status `open` (list or detail).
- `refund_recommended` shows link to `/admin/refunds` — does **not** auto-approve refund.
- Closing complaint ≠ approving refund.

---

## Поток 4: Возвраты

**Route**: `/admin/refunds`

> **MVP**: ручная обработка. Кнопки меняют статус в БД. Реальное движение денег — Post-MVP.

```
"Refunds"  ← font-display

[KPI Grid — grid-cols-2 / md:grid-cols-4]
  [⏱ 2 in progress]  [💰 $93 pending]
  [✓ 12 approved]     [⏱ 4h avg time]

[Refund cards grid]
Mobile:  grid-cols-1
Desktop: md:grid-cols-2
```

### Refund Card

```
┌────────────────────────────────────────────────┐
│ [Avatar sm]  Denis K.                          │
│              trainer: Artem K.                 │
│                              $38       [Pending]│
│ Reason: No-show                                │
│ yesterday                                      │
│                                                │
│ [Reject ──────────] [Approve ────────]         │
└────────────────────────────────────────────────┘
```

- Кнопки Reject/Approve → только для `status = pending`
- После действия: toast + статус меняется inline (оптимистично)
- Processed cards (approved/rejected) — отображаются без кнопок, только статус badge

**KPI Cards тоны**:
```
In progress → primary
Pending amt → secondary
Approved    → success
Avg time    → info
```

---

## Поток 5: Модерация отзывов

**Route**: `/admin/reviews`  
(Минимальный MVP экран)

```
"Review moderation"

[Список отзывов — flagged или rating ≤ 2]

Review card:
  [Avatar] Анонимный клиент   ★★☆☆☆  · 2 weeks ago
           Trainer: Igor S.
  "Poor communication, session was cut short..."
  
  [Approve] [Hide] [Delete]
               ↑ с confirm dialog
```

---

## Поток 6: Реестр клиентов (P18)

**Route**: `/admin/clients`  
**Spec**: [`admin_people_ops_spec.md`](../../../../implementation/mvp/specs/admin_people_ops_spec.md) · Wireframe W10-31

```
"Clients"  ← font-display text-[26px] md:text-[36px]
"Registered clients registry"  ← text-muted-foreground text-[13px]

[ 🔍 Search by name or email ]  ← max-w-[300px] md
```

### Client list

```
Mobile:  grid-cols-1 cards
Desktop: table or md:grid-cols-2 cards

┌────────────────────────────────────────────────┐
│ [Avatar sm]  Alex Client                       │
│              alex@pulse.dev                    │
│              Joined 3 mo ago · 12 bookings  → │
└────────────────────────────────────────────────┘
```

- **No nav badge** — registry, not queue.
- Empty search → «No clients found» + reset link.

---

## Поток 7: Карточка клиента (P18)

**Route**: `/admin/clients/[id]`  
**Wireframe**: W10-32

```
[← Back]  "Alex Client"

[Summary card]
  avatar · email · member since · total bookings

[Bookings] [Complaints] [Refunds]  ← Pill tabs

Tab content: read-only rows with links to
  /admin/complaints/[id]  /admin/refunds  (where applicable)
```

**UX rules:**

- **Read-only** — no suspend/ban in P18.
- Deep link from complaint detail: «Client profile» → this route.
- **MUST NOT** show trainer private notes.

---

## Поток 8: Операционный профиль тренера (approved)

**Route**: `/admin/trainers/[id]` when `status = approved`  
**Wireframe**: W10-30 · same URL as verification detail (W10-25)

```
[← Back]  "Trainer application"   [Open in catalog →]  ← primary CTA

[✓ Approved banner + reviewer metadata]

[Profile card — reuse]

[Platform activity]
  Complaints (N) →
  Upcoming bookings (N)
  Public profile →

[Services — reuse]

[Management]
  Helper: revoke hides from catalog; blocked if active bookings
  [Revoke approval]  ← destructive outline → AlertDialog + reason
```

После `pending` review (Поток 2) admin возвращается сюда через tab **Approved**.

---

## UX-принципы специфичные для Admin role

### Информационная плотность
Admin работает с данными эффективно. Меньше визуального декора, больше данных:
- KPI grid сразу на дашборде — без скролла на desktop
- Карточки плотнее: меньше padding, больше данных в строке
- Timestamps — всегда видны, не скрыты под hover

### Деструктивные действия — никогда без контекста
- Reject тренера: поле Comment обязательно перед кнопкой (или рекомендовано)
- Delete отзыва: confirm dialog «Удалить отзыв? Это действие необратимо»
- Approve возврата: мгновенно, но с toast подтверждением

### Badge как главный UX сигнал
Admin определяет приоритеты по badge-счётчикам в навигации. Они всегда актуальны:
- После Approve тренера → badge на /admin/trainers уменьшается на 1
- После обработки refund → badge на /admin/refunds уменьшается

### Mobile admin — не основной сценарий
Admin преимущественно работает с desktop. Mobile — для срочных действий:
- Bottom Nav с badge всегда виден
- Application Sheet на mobile работает через bottom sheet
- Большие touch-таргеты для Approve/Reject: `h-9 min-w-[80px]`

### Empty State как положительный сигнал
В admin зоне пустой список — хорошая новость:
- Нет жалоб → зелёный «All clear» с CheckCircle
- Нет pending trainers → нейтральный с объяснением
- Нет pending refunds → позитивный

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`pages_functional_spec.md`](../../pages_functional_spec.md) | Page-level behavior |
| [`admin_verification_spec.md`](../../../../implementation/mvp/specs/admin_verification_spec.md) | Trainer queue UX (W9) |
| [`admin_people_ops_spec.md`](../../../../implementation/mvp/specs/admin_people_ops_spec.md) | Client registry + approved trainer ops (P18) |
| [`complaint_refund_spec.md`](../../../../implementation/mvp/specs/complaint_refund_spec.md) | Complaints & refunds UX (W9) |
| [`global_shell_spec.md`](../../../../implementation/mvp/specs/global_shell_spec.md) | Admin shell & badges (W9) |
| [`canonical_routes.md`](../../../../design/canonical_routes.md) | Route inventory |

**Registry:** [`documentation_creation_registry.md`](../../../../meta/documentation_creation_registry.md) — user flow admin
