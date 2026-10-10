# Fitness Platform — Page-by-Page Functional Specification

> **Framework**: Next.js **16.2.6** App Router · TypeScript  
> **Auth**: Auth.js v5, Credentials provider (email + password)  
> **ORM**: Prisma v7  
> **Database**: PostgreSQL v17 on Neon  
> **Hosting**: Vercel  
> **UI**: Shadcn UI + Tailwind CSS v4  
> **Video**: Daily.co — Post-MVP  
> **Payments**: Stripe Connect — Post-MVP

---

## Breakpoints & Responsive Philosophy

Приложение использует **mobile-first** подход. Три зоны поведения:

| Зона | Диапазон | Навигация | Ключевые отличия |
|---|---|---|---|
| **Mobile** | < 768px | Bottom Nav (sticky bottom) | 1 колонка, edge-to-edge контент, bottom sheets, thumb-zone CTA |
| **Tablet** | 768px – 1023px | Sidebar Nav | 2 колонки, sticky sidebar, centered dialogs вместо bottom sheets |
| **Desktop** | ≥ 1024px | Sidebar Nav (wider) | 2–4 колонки, filter sidebars, sticky booking summary |

```typescript
// Tailwind breakpoints (default)
sm:  640px   // landscape mobile
md:  768px   // tablet portrait → sidebar appears, bottom nav hidden
lg:  1024px  // desktop → filter sidebars, wider layout
xl:  1280px  // wide desktop
```

**Критическое правило из прототипа**:
- `md:hidden` на Bottom Nav → исчезает на tablet+
- `hidden md:flex` на Sidebar → появляется на tablet+
- `lg:hidden` на Filter button → исчезает на desktop (вместо него sidebar)
- `-mx-4 px-4` (edge-to-edge) — только mobile; `md:mx-0` возвращает нормальные отступы

---

## UX-принципы

| Принцип | Применение |
|---|---|
| **Progressive Disclosure** | Только нужное на текущем шаге. Детали — по запросу (Sheets, Tabs) |
| **Zero Dead Ends** | Каждый empty state содержит CTA. Ошибка = объяснение + выход |
| **Thumb Zone First** | Primary CTA на mobile — в нижней трети экрана (Bottom Nav, sticky CTA) |
| **Immediate Feedback** | Optimistic UI для toggles/фильтров. Toast для всех мутаций |
| **One Primary Action** | Один filled button на экран. Деструктивные — за confirm dialog |
| **Skeleton Loading** | Skeleton вместо спиннеров, повторяющий структуру контента |
| **Edge-to-Edge Mobile** | Важный контент (hero, cover photo, chips) выходит за padding страницы |

---

## Полная карта маршрутов

```
app/
├── (public)/
│   ├── page.tsx                          → / Landing
│   ├── trainers/
│   │   ├── page.tsx                      → /trainers Каталог
│   │   └── [id]/page.tsx                 → /trainers/[id] Профиль тренера
│   └── auth/
│       ├── login/page.tsx                → /auth/login
│       └── register/
│           ├── page.tsx                  → /auth/register
│           └── trainer/page.tsx          → /auth/register/trainer
│
├── (booking)/
│   └── book/[trainerId]/
│       ├── page.tsx                      → /book/[trainerId]
│       └── confirm/page.tsx              → /book/[trainerId]/confirm
│
├── (session)/
│   └── sessions/[sessionId]/page.tsx     → /sessions/[sessionId] (MVP: placeholder)
│
├── (client)/
│   ├── client/dashboard/page.tsx
│   ├── client/bookings/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── client/reviews/[bookingId]/page.tsx
│
├── (trainer)/
│   ├── trainer/dashboard/page.tsx
│   ├── trainer/profile/page.tsx
│   ├── trainer/services/page.tsx
│   ├── trainer/schedule/page.tsx
│   ├── trainer/clients/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── trainer/income/page.tsx
│
└── (admin)/
    ├── admin/dashboard/page.tsx
    ├── admin/trainers/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── admin/complaints/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── admin/refunds/page.tsx
    └── admin/reviews/page.tsx
```

---

## GLOBAL SHELL

---

### Top Bar

`sticky top-0 z-40`, `bg-bg/85 backdrop-blur-md`, `border-b border-surface-dim/60`

| Элемент | Mobile | Desktop |
|---|---|---|
| Логотип | Flame icon + «Pulse» wordmark | + «fitness platform» mono label |
| Lang toggle | `h-8 px-2 text-[11px]` | `h-9 px-2.5 text-[12px]` |
| Theme toggle | `h-8 w-8` | `h-9 w-9` |
| Bell + dot | `h-8 w-8` | `h-9 w-9`, dot `top-1.5 right-1.5` |
| Avatar | **hidden** (`hidden md:inline-flex`) | Visible, `size="sm"` |

```
Height: h-14 md:h-16
```

#### Notifications Popover

- `fixed top-[60px] md:top-[72px]` — подстраивается под высоту top bar
- `right-3 md:right-6`
- `w-[calc(100vw-1.5rem)] sm:w-96` — почти full-width на mobile
- `max-h-[70vh]`, scrollable
- `z-[56]`, overlay `z-[55]` для закрытия по клику вне
- Анимация: `animate-[popIn_.18s_cubic-bezier(0,0,0,1)]`

---

### Sidebar Navigation (Desktop, `md+`)

`hidden md:flex`, `sticky top-16`, `h-[calc(100dvh-4rem)]`, `w-52 lg:w-60`

```
[Role label — mono uppercase text-ink-3 px-4 mb-2]

[Nav item — h-11 px-3 rounded-full]
  Active:   bg-primary-container text-on-primary-container
  Inactive: text-ink-2 hover:bg-surface-variant hover:text-ink

[Badge — min-w-[20px] h-5 px-1.5 rounded-full bg-error]

[Bottom: tip card — mt-auto]
```

**CLIENT items**: Home / Trainers / Sessions / Profile  
**TRAINER items**: Today / Schedule / Services / Clients / Income  
**ADMIN items**: Overview / Trainers [badge] / Complaints [badge] / Refunds [badge]

---

### Bottom Navigation (Mobile, `< md`)

`md:hidden`, `sticky bottom-0 z-40`, `bg-surface/95 backdrop-blur-md`, `border-t border-surface-dim/70`
`padding-bottom: env(safe-area-inset-bottom)` — учёт iPhone notch

```
grid grid-cols-{n}  — где n = количество пунктов роли

Каждый пункт:
  flex flex-col items-center justify-center gap-0.5 py-2.5

Active icon container:
  h-7 w-12 rounded-full bg-primary-container text-on-primary-container

Inactive icon:
  text-ink-2, size=20px, strokeWidth=1.75

Label: text-[10.5px] font-medium
  Active:   text-ink
  Inactive: text-ink-2

Badge:
  absolute -top-0.5 right-1.5
  min-w-[16px] h-4 px-1 rounded-full bg-error text-white text-[10px] font-bold
```

---

## AUTH

---

### Auth.js v5 + Prisma v7 + Neon

```typescript
// auth.ts — split: auth.config.ts holds JWT callbacks; auth.ts adds authorize()
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { getPrisma } from '@pulse/db'
import bcrypt from 'bcryptjs'
import authConfig from '@/auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const user = await getPrisma().user.findUnique({
          where: { email: (credentials.email as string).toLowerCase() },
        })
        if (!user?.passwordHash) return null
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.fullName, role: user.role }
      },
    }),
  ],
})
```

```typescript
// lib/prisma.ts — Neon + Prisma v7 + connection pooling для Vercel serverless
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

```
# .env.local
DATABASE_URL="postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1"
# ↑ pooled connection (pgBouncer) для serverless Vercel functions

DIRECT_URL="postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require"
# ↑ direct connection для Prisma migrations
```

```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // Prisma v7 migrations используют direct URL
}
```

### Route protection — `proxy.ts` (Next.js 16.2.6)

> **Не используйте `middleware.ts` как канон.** Next.js 16 переименовал interception в `proxy.ts`. См. [ADR-002](../prds/07_governance/adr_002_next162_vercel_runtime_policy.md).

```typescript
// proxy.ts — target (apps/web/src/proxy.ts)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import authConfig from '@/auth.config'

const { auth } = NextAuth(authConfig)
const PUBLIC = ['/', '/trainers', '/auth']

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))
  const role = session?.user?.role

  if (!session && !isPublic)
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${pathname}`, request.url))

  if (pathname.startsWith('/client') && role !== 'client')
    return NextResponse.redirect(new URL('/auth/login', request.url))
  if (pathname.startsWith('/trainer') && role !== 'trainer')
    return NextResponse.redirect(new URL('/auth/login', request.url))
  if (pathname.startsWith('/admin') && role !== 'admin')
    return NextResponse.redirect(new URL('/auth/login', request.url))
  if (pathname.startsWith('/book') && role !== 'client')
    return NextResponse.redirect(new URL('/auth/login', request.url))

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
```

**Legacy `middleware.ts`:** допустим только как временный шаг миграции. Codemod: `npx @next/codemod@canary middleware-to-proxy .`

---

### `/auth/login`

**Mobile**:
- Full-screen layout, `min-h-dvh flex flex-col justify-center`
- Логотип сверху, форма по центру
- CTA «Войти» — full-width, `h-12` (удобный thumb target)

**Desktop**:
- Центрированная карточка `max-w-md mx-auto`
- Автофокус на email input

```
Форма:
  Email      ← type="email", autocomplete="email"
  Password   ← type="password", show/hide toggle (Eye icon right)
  [Войти]    ← Button filled lg w-full
  Ссылка: "Нет аккаунта? Зарегистрироваться"
```

Ошибка: toast «Неверный email или пароль» (не раскрываем что именно).

---

### `/auth/register`

**Шаг 1**: Выбор роли

```
Mobile:  Tiles вертикально (stacked)
Desktop: Tiles горизонтально (side by side)

[🧍 Я ищу тренера]    [🏋 Я тренер]
 CLIENT tile             TRAINER tile

Selected: border-2 border-primary bg-primary-container/20
```

**Шаг 2**: Базовые данные — одна форма, все поля вертикально.

---

### `/auth/register/trainer`

Multi-step, 5 шагов. `max-w-2xl mx-auto` на desktop.

Progress bar: `h-1 bg-primary` с animated width при переходе.

Черновик сохраняется при каждом «Next» → Prisma update.

---

## PUBLIC ZONE

---

### `/` — Landing

Server Component (кроме hero-анимации). `generateMetadata()` для SEO.

Секции адаптируются под breakpoints стандартно (padding, колонки).

---

### `/trainers` — Каталог

#### Mobile (< 1024px)

```
[Header: "Catalog"  [Filter ⊡]]  ← Filter button lg:hidden

[Search input — full width, rounded-full]
  🔍 Search by name or specialty

[Chip scroll — edge-to-edge]
  -mx-4 md:-mx-6 px-4 md:px-6, overflow-x-auto no-scrollbar
  [All] [Yoga] [Strength] [HIIT] [Pilates] [Stretching] [Cardio]

[N trainers found · By rating ▾]

[Grid — grid-cols-1 md:grid-cols-2]
  [Trainer Card]
  [Trainer Card]
  ...
```

Filter button → Bottom Sheet (slide up от нижнего края).

#### Desktop (≥ 1024px)

```
lg:grid lg:grid-cols-[280px_1fr] lg:gap-6

[Filter Sidebar — hidden lg:block, sticky top-24]
  Card p-4:
    Filters          Clear
    ─────────────────────
    Max price: $80
    [range slider]

    Rating
    [Any] [★3+]
    [★4+] [★4.5+]

    Specialty
    > All
      Yoga
      Strength ...

[Main area]
  [Search input]
  [chips hidden — lg:hidden]
  [N found · sort]
  [Grid md:grid-cols-2]
```

Chip-фильтры скрыты на desktop (`lg:hidden`) — specialty выбирается через sidebar список.

---

### `/trainers/[id]` — Профиль тренера

#### Mobile

```
-mx-4 -mt-4  ← выходит за padding контейнера

[Cover photo — w-full, aspect 4/3, rounded-none]
  [← Back]  absolute top-3 left-3, h-10 w-10 rounded-full bg-surface/95
  [♥]       absolute top-3 right-3

[Name card — -mt-6 relative (overlap с фото)]
  px-4

[Tabs — overflow-x-auto -mx-4 px-4 no-scrollbar]
  About | Services | Schedule | Reviews

[Tab content — px-4]

[Sticky Bottom CTA — fixed bottom, above Bottom Nav]
  "from $40"  [Book now ────────────]
  bg-surface/95 backdrop-blur-md border-t border-surface-dim/70
```

#### Desktop

```
md:mx-0 md:mt-0  ← нормальные отступы

[Cover photo — w-full, md:rounded-3xl, aspect 16/6]
  [← Back]  [♥]

md:grid md:grid-cols-[1fr_360px] md:gap-6

Left:
  [Name card p-6] font-display text-[34px]
  [Tabs — не edge-to-edge]
  [Tab content]

Right (360px, sticky top-24):
  Card p-5:
    from
    $40 / session  ← font-display text-[36px]
    [Service select ▾]
    [Book now ──────]  ← filled lg
    ✓ Free cancellation 24h
    🎥 Online session
```

#### ScheduleGrid (переиспользуемый компонент)

```
Все breakpoints — одна структура:

[This week  UTC−5]

Horizontal scroll days:
  [Mon]-[Tue]-[Wed]-[Thu]-[Fri]-[Sat]-[Sun]
   20    21    22    23    24    25    26

  Active day: bg-primary text-white, h-16 w-14

Slot grid — 3 columns:
  [07:00] [08:30] [10:00]
  [~~11:30~~] [~~13:00~~]  ← disabled, line-through, bg-surface-container

Mobile:  gap-2
Desktop: gap-2 (те же пропорции)
```

---

## BOOKING ZONE

---

### `/book/[trainerId]` — Booking Wizard (3 шага)

#### Stripped Header (всегда)

```
[← Back]  STEP X OF 3 / [Service/Time/Confirm]  [$price]

[progress bar h-1 bg-primary, animated width: 33% → 66% → 100%]

Mobile:  h-12, sticky top-14
Desktop: h-14, md:rounded-2xl md:border md:mb-4, sticky top-16
```

Нет боковой навигации в этом route group — фокус на шагах.

#### Layout

```
Mobile:  single column
Desktop: md:grid md:grid-cols-[1fr_340px]
         Wizard слева, Summary Sidebar справа (sticky top-32)
```

#### Шаг 1: Выбор услуги

```
[Avatar + Trainer name + Specs] ← всегда сверху

Radio cards:
  Selected:   border-2 border-primary bg-primary-container/30
  Unselected: border-2 border-surface-dim bg-surface

  [Service name         $40]
  [⏱ 60 min]

[Next ────────────────────]  ← Button filled lg w-full
```

#### Шаг 2: Выбор слота

```
[ScheduleGrid]

[Next] ← появляется после выбора слота (slot !== null)
```

#### Шаг 3: Подтверждение

```
[Confirmation]

Summary card:
  Trainer      Anna Romanova
  Service      Morning yoga
  Duration     60 min
  Date/time    Thu, May 23 · 10:00

Textarea (optional):
  "Message to trainer (optional)"
  placeholder: "Share your goals, constraints, experience…"
  maxLength=500, [0/500] counter mono right-aligned

[Confirm booking ────────]  ← Button filled lg w-full
```

#### Desktop Summary Sidebar

```
hidden md:block, sticky top-32

Summary
────────────────────────
[Avatar] Anna Romanova
         Yoga · Pilates
────────────────────────
Service    Morning yoga
Duration   60 min
Time       Not selected → Thu · 10:00
────────────────────────
Price      $40.00
────────────────────────
✓ Free cancellation 24h
```

---

### `/sessions/[sessionId]` — Placeholder (MVP)

```
[← Back to bookings]

[Video icon 48px, text-ink-3]
"Video sessions coming soon"

Session details:
  Trainer:  Anna Romanova
  Service:  Morning yoga
  Date:     Thu, May 23 · 10:00

[← Back to my sessions]  ← Button outlined
```

---

## CLIENT ZONE

---

### `/client/dashboard`

#### Mobile & tablet (`< lg`, `space-y-6 pb-6`)

```
"Good morning,"    text-[13px] text-ink-2
"Alyona 👋"       font-display text-[30px]

[Search bar — h-12, rounded-full, w-full]
  🔍 Find a trainer or specialty → /trainers

[Next session card] (if confirmed booking exists)
  p-4
  [Avatar lg] [Date primary] [Name] [Service]
  [🎥 Join session ──────] [✕]

[Top trainers section]
  grid-cols-1

[Categories section]
  grid-cols-3, aspect-square buttons

[Stats card]  ← post-P1
  grid-cols-3, text-center
  1 240+ trainers  |  52K sessions  |  ★ 4.8
```

#### Desktop (`≥ lg`, 3-column grid)

```
lg:grid lg:grid-cols-3 lg:gap-6

Left (col-span-2):
  [Search bar — h-14]
  [Next session card — p-5, h3 text-[22px]]
  [Top trainers — lg:grid-cols-2]

Right (1 col):
  [Categories — lg:grid-cols-2]
  [Stats card — lg:grid-cols-1, text-left]
```

**Tablet note:** 768–1023px uses the single-column stack above (categories in flow, not sidebar). App sidebar nav appears at `md:`; dashboard grid only at `lg:`.

---

### `/client/bookings`

`md:max-w-5xl`

```
"My sessions"   font-display text-[26px] md:text-[36px]

[Upcoming] [Past] [Cancelled]  ← Pill tabs

Grid:
  Mobile:  grid-cols-1
  Desktop: md:grid-cols-2

Booking card:
  [Avatar md] [Name] [Status badge]
              [Service]
              [Date — text-primary]

  Upcoming:   [🎥 Join sm] [Cancel outlined sm]
  Past:       [★ Leave a review tonal sm flex-1]
```

---

### `/client/bookings/[id]`

`md:max-w-2xl`

Full booking details + cancellation policy text.

---

### `/client/reviews/[bookingId]`

```
[Context: Trainer · Service · Date]

[★ ★ ★ ★ ★]  ← interactive, hover scale(1.1)

[Textarea — min 20, max 500]
  [0/500] mono right-aligned

[Publish review ─────────]  ← filled lg w-full

"This review cannot be edited after publishing"  text-[11px] text-ink-3
```

---

## TRAINER ZONE

---

### `/trainer/dashboard`

#### Mobile

```
"Welcome back,"  text-[13px] text-ink-2
"Dmitry"         font-display text-[28px]

[Status Banner — bg-warning-container border-l-4 border-warning]

[KPI Grid — grid-cols-2 gap-2.5]

[Today section — full width]
  [Time mono] [Client] [Service] [▶ tonal sm]

[New reviews — full width]
```

#### Desktop

```
"Welcome back, Dmitry"  font-display text-[40px]

[Status Banner]

[KPI Grid — md:grid-cols-4]

md:grid md:grid-cols-2 md:gap-5:
  Left:  Today sessions
  Right: New reviews card
```

---

### `/trainer/schedule`

`md:max-w-4xl`

**Tabs**: Regular / Exceptions

**Regular — Day rows**:

```
Mobile / Desktop:

Card (одна большая карточка с разделителями):
  ┌─────────────────────────────────────────────┐
  │ [Mon] Monday        2 intervals   [Switch]  │
  │       [09:00–13:00 ×] [15:00–19:00 ×] [+Slot]│
  ├─────────────────────────────────────────────┤
  │ [Sat] Saturday      Day off       [Switch]  │
  └─────────────────────────────────────────────┘

Day badge ON:  h-10 w-10 rounded-full bg-primary-container
Day badge OFF: bg-surface-variant text-ink-3
```

**Exceptions — Mini Calendar**:

```
Card "May 2026":
  [CalendarMini — 7 col grid]
  Today:   bg-primary text-white rounded-full
  Blocked: bg-error-container line-through

[Exception cards — blocked date + description + 🗑]

[+ Add exception]  ← Button tonal w-full
```

---

### `/trainer/services`

```
Header: [Services]  [+ New tonal sm]

Grid:
  Mobile:  grid-cols-1
  Desktop: md:grid-cols-2

Service card:
  [Name] [hidden badge?]            [Switch]
  [Description]
  [⏱ dur] [💰 price]
  [✎ Edit outlined sm flex-1] [🗑 ghost error-color]
```

Sheet «New/Edit service»:
- Mobile: `rounded-t-3xl`, slide up
- Desktop: `sm:rounded-3xl sm:max-w-md`, centered

---

### `/trainer/clients`

```
[Search — rounded-full md:max-w-md]

Grid:
  Mobile:  grid-cols-1
  Desktop: md:grid-cols-2

Client card:
  [Avatar md] [Name]      [N sessions]
              [Goal: ...]
              [Last — ...]

Клик → Client Sheet (Notes + mini KPIs)
```

---

### `/trainer/income`

```
[KPI Grid — grid-cols-2 md:grid-cols-4]

Transactions Card:
  Header: [Transactions]  [Export CSV]

  Mobile:  compact rows — Date/Client, Amount, Badge
  Desktop: wider — Date · Client · Service · Amount · Badge

  Statuses:
    Paid out  → completed badge
    Pending   → pending badge
    Refunded  → cancelled badge
```

---

## ADMIN ZONE

---

### `/admin/dashboard`

```
"Platform · last 30 days"
"Control"  font-display text-[26px] md:text-[40px]

[KPI Grid — grid-cols-2 md:grid-cols-4]
  info / primary / secondary / success tones

[Needs attention Card]
  Action list: trainers → complaints → refunds

[Statistics Card]
  Key/value pairs
```

---

### `/admin/trainers`

```
[Pending · N] [Approved] [Rejected]  ← Tabs

Grid:
  Mobile:  grid-cols-1
  Tablet:  md:grid-cols-2
  Desktop: xl:grid-cols-3

Application Card → Application Sheet
  Sheet содержит: Documents checklist, Comment field, Reject/Approve
```

---

### `/admin/complaints`

```
[Open · N] [In review]  ← Tabs

Grid:
  Mobile:  grid-cols-1
  Desktop: md:grid-cols-2

Priority badges:
  High   → error colors
  Medium → warning colors
  Low    → info colors
```

---

### `/admin/refunds`

```
[KPI Grid — grid-cols-2 md:grid-cols-4]

Grid:
  Mobile:  grid-cols-1
  Desktop: md:grid-cols-2

Refund Card (pending): [Reject] [Approve] inline
Refund Card (processed): only status badge, no buttons
```

---

## Общие компоненты — Responsive Spec

### Sheet

```
Mobile (< sm):
  fixed inset-x-0 bottom-0
  rounded-t-3xl
  animate-[slideUp_.25s_cubic-bezier(0,0,0,1)]
  drag handle: mx-auto mb-3 h-1 w-10 rounded-full bg-surface-dim

Desktop (sm+):
  fixed inset-0, centered
  sm:max-w-md, sm:rounded-3xl
  sm:items-center sm:justify-center
  no drag handle
```

### Toast

```
fixed bottom-24 left-1/2 -translate-x-1/2 z-[60]
↑ bottom-24: над Bottom Nav (56px) + отступ (16px) = 72px → 24*3=72px ≈ right

bg-primary text-white rounded-full px-4 py-2.5 text-[13px]
shadow-[0_4px_16px_rgba(26,48,40,0.3)]
auto-dismiss 2.2s
animate-[fadeIn_.2s_ease]
```

### Tabs (Pill Tabs)

```
inline-flex rounded-full bg-surface-variant p-1

Active:   h-9 px-4 rounded-full text-[13px] font-medium
          bg-surface text-ink shadow-[0_1px_2px_rgba(26,48,40,0.08)]
Inactive: h-9 px-4 rounded-full text-[13px] font-medium
          text-ink-2 hover:text-ink transition-colors
```

Прокрутка tabs: `overflow-x-auto -mx-4 px-4 no-scrollbar` (mobile).

---

## Vercel Deployment Config

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["fra1"],
  "env": {
    "DATABASE_URL": "@database-url",
    "DIRECT_URL": "@direct-url",
    "AUTH_SECRET": "@auth-secret",
    "AUTH_URL": "@auth-url"
  }
}
```

```
# Neon connection strings
DATABASE_URL  → pooled (pgBouncer) — для runtime Vercel serverless functions
DIRECT_URL    → direct — для Prisma migrations (npx prisma migrate deploy)

Vercel build command:  prisma generate && next build
Vercel install command: npm ci
```

---

## Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const hash = (p: string) => bcrypt.hash(p, 12)

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@pulse.dev' },
    update: {},
    create: {
      email: 'admin@pulse.dev', fullName: 'Platform Admin',
      passwordHash: await hash('admin123'), role: 'admin',
    },
  })

  await prisma.user.upsert({
    where: { email: 'client@pulse.dev' },
    update: {},
    create: {
      email: 'client@pulse.dev', fullName: 'Alyona Sokolova',
      passwordHash: await hash('client123'), role: 'client',
    },
  })

  const trainerData = [
    { email: 'anna@pulse.dev',   name: 'Anna Romanova',  specs: ['yoga', 'pilates'] },
    { email: 'dmitry@pulse.dev', name: 'Dmitry Sokolov', specs: ['strength', 'hiit'] },
    { email: 'maria@pulse.dev',  name: 'Maria Lebedeva', specs: ['pilates', 'stretching'] },
  ]

  for (const t of trainerData) {
    const user = await prisma.user.upsert({
      where: { email: t.email }, update: {},
      create: {
        email: t.email, fullName: t.name,
        passwordHash: await hash('trainer123'), role: 'trainer',
      },
    })
    await prisma.trainerProfile.upsert({
      where: { userId: user.id }, update: {},
      create: {
        userId: user.id, specializations: t.specs,
        status: 'approved', ratingAvg: 4.8, ratingCount: 42,
      },
    })
  }
  console.log('✓ Seed complete')
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

```json
// package.json
"prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }
```
