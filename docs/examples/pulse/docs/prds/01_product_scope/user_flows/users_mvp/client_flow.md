# User Flow — Client (MVP)

**Status:** Canonical PRD (migrated from interim)  
**Version:** 1.0 · Date: 2026-05-23  
**Role:** **CLIENT** — пользователь, ищущий и бронирующий тренеров  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../../../meta/ai_first_project_methodology.md)  
**Interim source (archive):** [`docs/default_docs/user-flow-client.md`](../../../../default_docs/user-flow-client.md)  
**Routes canon:** [`docs/design/canonical_routes.md`](../../../../design/canonical_routes.md)  
**Visual reference:** HTML-прототип + Warm Forest design system  
**Platform:** Web (Next.js 16.2.6, Vercel) · Mobile-first · Tablet (md: 768px) · Desktop (lg: 1024px+)

> При изменении behavior обновлять этот файл в той же задаче (см. product-docs-alignment Cursor rule).

---

## Навигация по роли

### Mobile (< 768px)
**Bottom Navigation Bar** — `sticky bottom-0`, `bg-surface/95 backdrop-blur-md`, `border-t border-surface-dim/70`, `padding-bottom: env(safe-area-inset-bottom)`.

```
┌────────────────────────────────────┐
│  🏠 Home  🔍 Trainers  📅 Sessions  👤 Profile │
└────────────────────────────────────┘
```

- 4 равных колонки (`grid grid-cols-4`)
- Active: pill-highlight `h-7 w-12 rounded-full bg-primary-container text-on-primary-container` под иконкой
- Inactive: `text-ink-2`, иконка 20px `strokeWidth=1.75`
- Label: `text-[10.5px] font-medium`
- Весь контент прокручивается под фиксированной навигацией

### Tablet (768px – 1023px)
**Top Bar** — логотип + утилиты (lang/theme/notif/avatar)  
**Bottom Navigation** — остаётся, те же 4 пункта (bottom nav `md:hidden` не применяется до `lg`)

> Примечание: прототип использует `md:hidden` для Bottom Nav и `hidden md:flex` для Sidebar. Tablet (768px) видит Sidebar, но не Bottom Nav.

### Desktop (≥ 768px / lg: ≥ 1024px)
**Sidebar Navigation** — `hidden md:flex`, `w-52 lg:w-60`, sticky, `h-[calc(100dvh-4rem)]`

```
┌──────────────────────────────────────────────────────────┐
│ [TopBar: Logo · fitness platform · Lang · Theme · Bell · Avatar] │
├──────────┬───────────────────────────────────────────────┤
│ CLIENT   │                                               │
│ 🏠 Home  │          Main Content Area                    │
│ 🔍 Trainers│                                             │
│ 📅 Sessions│                                             │
│ 👤 Profile│                                              │
│          │                                               │
│ [tip card]│                                              │
└──────────┴───────────────────────────────────────────────┘
```

- Active item: `h-11 px-3 rounded-full bg-primary-container text-on-primary-container`
- Inactive: `text-ink-2 hover:bg-surface-variant hover:text-ink`
- Role label в mono: `text-[11px] font-mono uppercase tracking-[0.08em] text-ink-3`

---

## Поток 1: Онбординг и Регистрация

```
Landing (/)
    │
    ▼
Выбор роли (/auth/register)
    │ Выбирает "Я ищу тренера" (CLIENT tile)
    ▼
Форма регистрации
    │ Email + Имя + Пароль + Confirm + Checkbox условий
    ▼
/client/dashboard ──► [Welcome empty state]
```

### UX-детали по брейкпоинтам

**Mobile**: Форма на весь экран, один input в фокусе. Keyboard aware — контент не перекрывается виртуальной клавиатурой (CSS: `min-h-dvh`). CTA «Создать аккаунт» — fixed bottom или в конце scroll.

**Desktop**: Центрированная карточка `max-w-md`, логотип сверху. Два варианта тайлов роли — side by side горизонтально.

### Состояния

| Состояние | Поведение |
|---|---|
| Email уже занят | Inline error под полем, debounce 500ms |
| Пароль слабый | Strength indicator (3 уровня: weak/fair/strong) |
| Успех | Redirect `/client/dashboard` + welcome toast |
| Сеть недоступна | Toast error "No connection, try again" |

---

## Поток 2: Вход

```
/auth/login
    │ Email + Password → signIn()
    ▼
role-based redirect: /client/dashboard
```

**Mobile**: Full-screen форма. Show/hide password — tap на иконку Eye в правой части input.  
**Desktop**: Центрированная карточка, автофокус на email input.

**Критический UX**: сообщение об ошибке — **никогда** не раскрываем что именно неверно. Toast: «Неверный email или пароль».

---

## Поток 3: Главная страница клиента

**Route**: `/client/dashboard`  
**Mobile layout**: `space-y-6`, одна колонка, `pb-6` (отступ над Bottom Nav)  
**Tablet layout (768–1023px)**: та же одна колонка и порядок секций, что на mobile; sidebar nav виден (`md:`), но dashboard **не** переключается в 3-col grid  
**Desktop layout (`≥ lg`)**: `lg:grid lg:grid-cols-3 lg:gap-6` — основной контент (2 col) + правая панель (1 col)

> **Prototype delta:** HTML-прототип `c.home` использует `md:grid-cols-3` без app sidebar. В Pulse 3-col grid только с **`lg:`** — см. design system §2 Responsive Strategy.

### Секции и адаптация

#### 1. Приветствие
```
Mobile/Desktop:
  "Good morning,"      ← text-[13px] text-ink-2
  "Alyona 👋"          ← font-display text-[30px] md:text-[44px]
```

#### 2. Hero Search Bar
```
Mobile:  h-12, px-4, text-[14px]
Desktop: h-14, px-5, text-[15px]
```
Кнопка-заглушка (не input). Клик → `/trainers`. Placeholder: «Find a trainer or specialty».

#### 3. Next Session (если есть confirmed booking)
```
Mobile:
  [Avatar lg] [Date primary] [Trainer name] [Service]
  [Join session ←flex-1→]    [✕]

Desktop:
  Те же элементы, p-5 md:gap-4, h3 text-[22px]
  "Join session" кнопка ← активна только если сессия начинается через < 5 мин
    (MVP: заглушка — кнопка видна но ведёт на placeholder)
```

**UX rule**: кнопка «Join» всегда видна в карточке, но на MVP показывает toast «Video sessions coming soon».

#### 4. Top Trainers (2/3 ширины desktop, `≥ lg`)
```
Mobile / tablet (< lg):  grid-cols-1 (список)
Desktop (≥ lg):        lg:grid-cols-2 (сетка 2 колонки в main column)
```
Заголовок «Top trainers» + link «All →» → `/trainers`.

#### 5. Categories (правая панель `≥ lg`, в общем потоке `< lg`)
```
< lg:   grid-cols-3 (3 иконки в ряд, aspect-square; секция после Top trainers)
≥ lg:   grid-cols-2 (в правой колонке sidebar)
```
Клик → `/trainers?specialization={id}`.

#### 6. Platform Stats
```
< lg:   grid-cols-3, text-center (в общем потоке, post-P1)
≥ lg:   grid-cols-1, text-left (в правой колонке)
```

### Empty State (новый клиент)
```
[Calendar icon, 48px, strokeWidth=1.2, text-ink-3]
"Start your fitness journey"      ← font-display text-[22px]
"Find the perfect trainer for you" ← text-ink-2

[Find a trainer]    ← Button filled size-md → /trainers
```

---

## Поток 4: Поиск и фильтрация тренеров

**Route**: `/trainers`

### Layout по брейкпоинтам

**Mobile (< 768px)**:
```
[Header: "Catalog" + Filter icon button (lg:hidden)]
[Search input — full width, rounded-full]
[Horizontal chip scroll: All | Yoga | Strength | HIIT | Pilates | Stretching | Cardio]
  ← overflow-x-auto no-scrollbar, -mx-4 px-4 (edge-to-edge)
[N trainers found · By rating ▾]
[Grid 1 column — карточки тренеров]
[Filter icon] → Bottom Sheet (slide up)
```

**Tablet (768px – 1023px)**:
```
[Header: "Catalog" + Filter icon (lg:hidden)]
[Search input]
[Horizontal chips — по прежнему видны]
[Grid 2 columns — md:grid-cols-2]
[Filter sheet — по прежнему через кнопку]
```

**Desktop (≥ 1024px)**:
```
lg:grid lg:grid-cols-[280px_1fr] lg:gap-6

Sidebar (280px, sticky top-24):
  ┌─────────────────┐
  │ Filters   Clear │
  │ Max price: $80  │ ← range slider
  │ ████░░░░░░░░    │
  │ $20         $100│
  │ Rating          │
  │ [Any][★3+][★4+][★4.5+] ← 2×2 grid
  │ Specialty       │
  │ > All           │ ← active: bg-primary-container
  │   Yoga          │
  │   Strength      │
  │   HIIT          │
  └─────────────────┘

Main area:
  [Search input — full width]
  [chips hidden (lg:hidden)]
  [N trainers found · By rating ▾]
  [Grid 2 columns — md:grid-cols-2]
```

### Trainer Card — адаптация
```
Mobile / Tablet / Desktop — одинаковая структура:
  [Photo 80–96px wide, aspect-square] | [Name · Verified ✓]
                                       | [Tagline — 1 line clip]
                                       | [★★★★★ 4.9 · 124 reviews]
                                       | [Yoga · Pilates · +1]  [from $40]

Hover (desktop): shadow elevation-2, scale(0.99) transition-200ms
Active (touch):  scale(0.99) duration-200ms
```

### Filter Bottom Sheet (Mobile/Tablet)
```
[drag handle]
Filters
─────────────────────────
Max price: $80
[range slider ████░░]
$20                  $100

Minimum rating
[Any] [★3+] [★4+] [★4.5+] ← flex row

[Clear ─────] [Apply ─────]
```

### Empty State
```
[Search icon 48px, text-ink-3]
"No results"
"Try clearing filters"
[Clear]  ← Button tonal
```

---

## Поток 5: Профиль тренера

**Route**: `/trainers/[id]`

### Layout по брейкпоинтам

**Mobile (< 768px)**:
```
-mx-4 -mt-4  ← контент уходит за padding страницы, edge-to-edge

[Cover photo — full width, aspect 4:3, rounded-none]
  [← Back]        [♥ Favourite]  ← absolute overlay buttons

[Name card, -mt-6 relative — overlap с фото]
  "Anna Romanova  ✓ Verified"   font-display text-[26px]
  tagline                        text-[13px] text-ink-2
  ★★★★★ 4.9  · 124 reviews
  📍 New York · 8 years experience

[Tabs — overflow-x-auto, edge-to-edge scroll]
  About | Services | Schedule | Reviews

[Tab content — full width]

[Sticky Bottom CTA — fixed bottom, above bottom nav]
  "from $40"  [Book now ──────]
  bg-surface/95 backdrop-blur-md border-t
```

**Desktop (≥ 768px)**:
```
md:mx-0 md:mt-0  ← нормальные отступы

[Cover photo — full width, aspect 16/6, rounded-3xl]
  [← Back]  [♥] ← overlay

md:grid md:grid-cols-[1fr_360px] md:gap-6

Left column (fluid):
  [Name card, p-6]
    font-display text-[34px]
  [Tabs — не edge-to-edge]
  [Tab content]

Right column (360px, sticky top-24):
  ┌──────────────────────┐
  │ From                 │
  │ $40 / session        │ ← font-display text-[36px]
  │ Service [select ▾]   │
  │ [Book now ─────────] │ ← filled lg
  │ ✓ Free cancel 24h    │
  │ 🎥 Online session    │
  └──────────────────────┘
```

### Tabs — содержимое

**About**:
- Карточка bio (`p-4 md:p-6`)
- `md:grid-cols-2`: Categories | Certificates

**Services**:
- `md:grid-cols-2` — карточки услуг
- Каждая: имя, описание, ⏱ длительность, цена, [Select] → booking flow

**Schedule** (`ScheduleGrid` component):
```
Mobile: горизонтальный scroll дней [Mon 20] [Tue 21]...
        Grid 3 col слотов: [07:00][08:30][10:00]...
        Недоступные: line-through, disabled, bg-surface-container

Desktop: те же пропорции, больше пространства
```

**Reviews**:
- Aggregate: крупный рейтинг `text-[42px] md:text-[56px]` + progress-bars
- `md:grid-cols-2` — карточки отзывов

---

## Поток 6: Booking Flow (3 шага)

**Route**: `/book/[trainerId]`

### Stripped Header
```
[← (back)]  STEP X OF 3 / [Service / Time / Confirm]  [$total]
[progress bar — animated fill, bg-primary]
```
**Mobile**: `h-12`, compact.  
**Desktop**: `md:h-14`, `rounded-2xl md:border md:mb-4`.  
Нет боковой навигации — фокус только на бронировании.

### Layout

**Mobile**: Весь wizard — full width, вертикально.  
**Desktop**: `md:grid md:grid-cols-[1fr_340px]` — wizard слева, Summary Sidebar справа (sticky).

### Шаг 1: Выбор услуги

```
Mobile / Desktop:
  [Avatar md] + [Trainer name] + [Specs]

  [Radio card — Morning yoga]
    "Morning yoga"
    ⏱ 60 min              $40
    border-2 border-primary bg-primary-container/30  ← selected

  [Radio card — Vinyasa flow]
    "Vinyasa flow"
    ⏱ 75 min              $55
    border-2 border-surface-dim  ← unselected

  [Next ─────────────────]  ← Button filled lg, w-full
```

### Шаг 2: Выбор слота

```
[Pick a time slot]

[ScheduleGrid]
  Horizontal day scroll: [Mon 20★][Tue 21][Wed 22]...
  Active day: bg-primary text-white

  3-col slot grid:
  [07:00] [08:30] [10:00]  ← доступные
  [~~11:30~~] [~~13:00~~]  ← занятые, line-through, disabled

[Next] — появляется после выбора слота
```

### Шаг 3: Подтверждение

```
[Confirmation]

Card: сводка
  Trainer     Anna Romanova
  Service     Morning yoga
  Duration    60 min
  Date/time   Thu, May 23 · 10:00

Textarea: "Message to trainer (optional)"
  placeholder: "Share your goals, constraints, experience…"
  [500/500]  ← mono counter, right-aligned

[Confirm booking ────────]  ← Button filled lg, w-full

Mobile: кнопка может быть sticky bottom на длинных формах
```

### Summary Sidebar (Desktop only)

```
hidden md:block, sticky top-32

┌──────────────────────────┐
│ Summary                  │
│ [Avatar] Anna Romanova   │
│          Yoga · Pilates  │
│ ──────────────────────── │
│ Service    Morning yoga  │
│ Duration   60 min        │
│ Time       Thu · 10:00   │
│ ──────────────────────── │
│ Price      $40.00        │
│ ──────────────────────── │
│ ✓ Free cancellation 24h  │
└──────────────────────────┘
```

### После подтверждения
```
toast "Booking confirmed ✓"
redirect → /client/bookings (tab: Upcoming)
```

---

## Поток 7: История бронирований

**Route**: `/client/bookings`  
**Max-width**: `md:max-w-5xl`

```
"My sessions"   ← font-display text-[26px] md:text-[36px]

[Upcoming] [Past] [Cancelled]  ← Pill tabs

Grid:
Mobile:  grid-cols-1
Desktop: md:grid-cols-2
```

### Карточка бронирования
```
[Avatar md] [Trainer name]           [Status badge]
            [Service name]
            [Date — text-primary font-medium]

Upcoming:   [🎥 Join ────] [Cancel]  ← sm buttons
Past (no review): [★ Leave a review ────]  ← sm tonal → `/client/reviews/[bookingId]`
Past (reviewed):  [✓ Review submitted] + readonly stars  ← sm tonal disabled
Cancelled:  — (нет кнопок)
```

### Empty State
```
[Calendar 48px, text-ink-3]
"Nothing here yet"
"No sessions in this category"
```

---

## Поток 8: Оставить отзыв

**Route**: `/client/reviews/[bookingId]`  
**Доступна**: только для `status = completed` без существующего отзыва.

```
[Read-only контекст]
  "Anna Romanova — Morning yoga"
  "May 15, 2025"

[Star rating — interactive]
  ☆ ☆ ☆ ☆ ☆  ← hover: scale(1.1), selected: fill gold
  При hover — preview выбранного значения

[Textarea]
  placeholder: "Share your experience..."
  min 20 / max 500 символов
  [Characters: 0/500]  ← mono, right-aligned

[Publish review ─────────]  ← Button filled lg, w-full
"This review cannot be edited after publishing"  ← text-[11px] text-ink-3
```

После публикации → redirect `/client/bookings/[id]` + toast «Review published ✓».

---

## Поток 9: Профиль клиента

**Route**: `/client/profile` (mobile nav) / sidebar  
**Max-width**: `md:max-w-2xl`

```
"Profile"  ← font-display

[Avatar lg] [Alyona Sokolova]   [✎ edit button]
            [alyona@example.com]

Card — settings list:
  🔔 Notifications      →
  ──────────────────────
  💳 Payment methods    →   (Post-MVP)
  ──────────────────────
  🛡 Security           →
  ──────────────────────
  ⚙️ Settings           →

[Sign out ─────────────]  ← Button outlined w-full
```

---

## UX-принципы специфичные для Client role

### Thumb Zone (Mobile)
Все primary CTA — в нижней трети экрана:
- Bottom Nav — всегда в пределах большого пальца
- «Book now» sticky CTA — прилипает к нижнему краю
- Кнопки в карточках — в нижней части карточки

### Scroll Behavior
- Контент страницы: `pb-6` (отступ над Bottom Nav на mobile)
- Длинные списки тренеров: пагинация (12 карточек), не infinite scroll на MVP
- Горизонтальные scrolls (chips, дни расписания): `no-scrollbar`, edge-to-edge `-mx-4 px-4`

### Пустые состояния — никогда не тупик
Каждый пустой экран содержит CTA:
- Нет сессий → «Find a trainer»
- Нет результатов в каталоге → «Clear filters»
- Нет отзывов на странице тренера → показываем рейтинг без breakdown

### Оптимистичный UI
- Смена таба в бронированиях — мгновенная (данные уже загружены)
- Фильтры — мгновенный отклик на клик
- Кнопка «♥» избранное — optimistic toggle

### Feedback
- Все мутации (бронирование, отзыв, отмена) → toast уведомление
- Toast позиция: `fixed bottom-24 left-1/2 -translate-x-1/2` (выше Bottom Nav)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`pages_functional_spec.md`](../../pages_functional_spec.md) | Page-level behavior |
| [`catalog_discovery_spec.md`](../../../../implementation/mvp/specs/catalog_discovery_spec.md) | Catalog & profile UX (W9) |
| [`booking_wizard_spec.md`](../../../../implementation/mvp/specs/booking_wizard_spec.md) | Booking wizard UX (W9) |
| [`global_shell_spec.md`](../../../../implementation/mvp/specs/global_shell_spec.md) | Client shell (W9) |
| [`canonical_routes.md`](../../../../design/canonical_routes.md) | Route inventory |

**Registry:** [`documentation_creation_registry.md`](../../../../meta/documentation_creation_registry.md) — user flow client
