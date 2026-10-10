# User Flow — Trainer (MVP)

**Status:** Canonical PRD (migrated from interim)  
**Version:** 1.0 · Date: 2026-05-23  
**Role:** **TRAINER** — специалист, управляющий профилем, услугами, расписанием и клиентами  
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../../../meta/ai_first_project_methodology.md)  
**Interim source (archive):** [`docs/default_docs/user-flow-trainer.md`](../../../../default_docs/user-flow-trainer.md)  
**Routes canon:** [`docs/design/canonical_routes.md`](../../../../design/canonical_routes.md)  
**Visual reference:** HTML-прототип + Warm Forest design system  
**Platform:** Web (Next.js 16.2.6, Vercel) · Mobile-first · Tablet (md) · Desktop (lg)

> При изменении behavior обновлять этот файл в той же задаче (см. product-docs-alignment Cursor rule).

---

## Навигация по роли

### Mobile (< 768px)
**Bottom Navigation Bar** — 5 пунктов, равные колонки:

```
┌────────────────────────────────────────────────────┐
│  🏠 Today  📅 Schedule  💪 Services  👥 Clients  💰 Income │
└────────────────────────────────────────────────────┘
```

- `grid-cols-5` (все 5 пунктов в ряд)
- На очень узких экранах (< 360px): label скрывается, только иконки
- Active: pill `h-7 w-12 rounded-full bg-primary-container`
- Badge на любом пункте: `min-w-[16px] h-4 rounded-full bg-error text-white text-[10px]`

### Desktop (≥ 768px)
**Sidebar Navigation** — `hidden md:flex`, `w-52 lg:w-60`

```
┌─────────────────────────────────────────────────────────────┐
│ [TopBar: Pulse · fitness platform · EN · ☀ · 🔔 · Avatar] │
├──────────┬──────────────────────────────────────────────────┤
│ TRAINER  │                                                  │
│ 🏠 Today │         Main Content (fluid)                     │
│ 📅 Schedule│                                                │
│ 💪 Services│                                                │
│ 👥 Clients│                                                 │
│ 💰 Income │                                                  │
│          │                                                  │
│ [tip]    │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

---

## Поток 1: Регистрация тренера

```
/auth/register
    │ Выбирает "Я тренер" (TRAINER tile)
    ▼
Базовая форма (email + имя + пароль)
    ▼
/auth/register/trainer  ← Multi-step onboarding
    │
    ├── Шаг 1: Личные данные
    ├── Шаг 2: Профессиональные данные
    ├── Шаг 3: Сертификаты
    ├── Шаг 4: Услуги (хотя бы одна)
    └── Шаг 5: Preview + отправка
    ▼
Waiting screen: "Application submitted"
    ▼
/trainer/dashboard  ← status: PENDING, баннер «Under review»
```

### Onboarding Multi-step Form

**Layout**: Full-screen на mobile, `max-w-2xl mx-auto` на desktop.

**Progress Bar**:
```
[Шаг 1 из 5]
[█████░░░░░░░░░░░░░░░]  ← h-1, bg-primary, animated width
```

**Шаг 1: Личные данные**
```
[Photo upload — круглый placeholder 80px, tap to upload]
  Mobile: sheet снизу с опцией камеры / галереи
  Desktop: стандартный file input

[Timezone dropdown]  ← required (INV-01)
[← Back]           [Next →]
```

**Шаг 2: Профессиональные данные**
```
Bio  ← Textarea, 100–1000 символов (optional), counter
Specializations  ← Multi-select chips (Yoga · Strength · HIIT...)
Years of experience  ← number input

[← Back]           [Next →]
```

**Шаг 3: Сертификаты**
```
[+ Add certificate]
┌────────────────────────────────┐
│ Name              Organization │
│ Year              [📄 Upload]  │
│                   [✕ Remove]   │
└────────────────────────────────┘
[+ Add certificate]

[← Back]           [Next →]
```

**Шаг 4: Услуги**
```
[+ Add service]
┌────────────────────────────────┐
│ Service name                   │
│ Duration [30▾] Price [$]       │
│ Description (optional)         │
└────────────────────────────────┘

"Можно добавить позже"  ← ghost link «Skip»

[← Back]           [Next →]
```

**Шаг 5: Preview + отправка**
```
[Preview — как выглядит профиль для клиента]
  ← read-only TrainerProfile с текущими данными

"By submitting you agree to our Trainer Terms"

[← Back]      [Submit for review]  ← Button filled
```

**UX rule**: каждый шаг сохраняется автоматически при переходе «Next» (Server Action). Закрытие браузера не теряет прогресс — черновик восстанавливается.

---

## Поток 2: Главная тренера (Today)

**Route**: `/trainer/dashboard`

### Layout по брейкпоинтам

**Mobile**:
```
"Welcome back,"     ← text-[13px] text-ink-2
"Dmitry"            ← font-display text-[28px]

[Status Banner — если pending]

[KPI Grid — grid-cols-2 gap-2.5]
  [📅 14 sessions]  [👥 22 clients]
  [$1,240 income]   [★ 4.8 rating]

[Today section — full width]
  09:00  Ivan P.    Strength · 60 min   [▶]
  ──────────────────────────────────────
  11:30  Olga K.    Recovery · 45 min   [▶]
  ──────────────────────────────────────
  17:00  Alisa Sh.  Tone · 60 min       [▶]

[New reviews section — full width]
  [Avatar] Lena K.   ★★★★★
  "Clear programs, always on time..."
```

**Desktop**:
```
"Welcome back, Dmitry"  ← font-display text-[40px]

[Status Banner]

[KPI Grid — md:grid-cols-4]

md:grid md:grid-cols-2 md:gap-5:
  Left:  Today sessions list
  Right: New reviews card
```

### Status Banner (PENDING)
```
┌──────────────────────────────────────────────────────┐
│ ⏳  Profile under review                             │
│     Typically 1–3 business days. You won't appear   │
│     in search until approved.                        │
└──────────────────────────────────────────────────────┘
bg-warning-container, border-l-4 border-warning, p-3.5
```

### KPI Cards
```
Card: p-3.5, bg-surface, elevation-1

[Icon 36px, rounded-xl, toned bg] [Value font-display text-[20px]]
                                  [Label text-[12px] text-ink-2]
                                  [Sub text-[11px] text-ink-3]

Тоны:
  Sessions  → primary  (bg-primary-container)
  Clients   → info     (bg-info-container)
  Income    → success  (bg-success-container)
  Rating    → secondary (bg-secondary-container)
```

### Today Sessions List
```
Card (без внешних отступов):
  [09:00] [Ivan P.] [Strength · 60 min] [▶ tonal sm]
  ─────────────────────────────────────────────────
  [11:30] [Olga K.] [Recovery · 45 min] [▶ tonal sm]

  Время: font-mono text-[13px] text-primary w-14
  Имя:   text-[14px] font-medium
  Услуга: text-[12px] text-ink-2

  Кнопка [▶]: MVP → toast «Video coming soon»
               Post-MVP → Daily.co room
```

---

## Поток 3: Расписание

**Route**: `/trainer/schedule`  
**Max-width**: `md:max-w-4xl`

```
"Working schedule"
"UTC−5 · New York"  ← text-[12.5px] text-ink-2

[Regular] [Exceptions]  ← Pill tabs
```

### Regular — Weekly Schedule

```
Mobile / Desktop (одинаковая структура, desktop шире):

Card:
  ┌─────────────────────────────────────────────┐
  │ [Mon] Monday           2 interval(s)  [●─]  │ ← Switch ON
  │       09:00–13:00 ×   15:00–19:00 ×  [+Slot]│
  ├─────────────────────────────────────────────┤
  │ [Tue] Tuesday          2 interval(s)  [●─]  │
  │       09:00–13:00 ×   15:00–19:00 ×  [+Slot]│
  ├─────────────────────────────────────────────┤
  │ [Wed] Wednesday        1 interval(s)  [●─]  │
  │       10:00–14:00 ×               [+Slot]   │
  ├─────────────────────────────────────────────┤
  │ [Sat] Saturday         Day off        [─●]  │ ← Switch OFF
  └─────────────────────────────────────────────┘
```

**Day badge**:
- ON: `h-10 w-10 rounded-full bg-primary-container text-on-primary-container font-display text-[16px]`
- OFF: `bg-surface-variant text-ink-3`

**Time slot chips**:
```
[09:00–13:00 ×]  ← bg-surface-variant, font-mono text-[12px], × removes slot
[+ Slot]         ← border-dashed, + adds slot via Sheet/popover
```

**Mobile UX**: Switch toggle достаточно большой для пальца (`h-7 w-12`). Chips горизонтально, wrappable.

### Exceptions — Calendar Override

```
Card: "May 2026"
[CalendarMini — grid 7 cols]

Mon  Tue  Wed  Thu  Fri  Sat  Sun
           1    2    3    4    5
 6    7    8    9   10   11   12
[13] [14] [15] [16] [17] [18] [19]
[20 today] ...

12 → bg-error-container line-through  ← blocked
20 → bg-primary text-white           ← today

[Blocked exception card]
  May 12  · Blocked · vacation  [🗑]

[+ Add exception]  ← Button tonal w-full
```

---

## Поток 4: Управление услугами

**Route**: `/trainer/services`

```
[Header row]
"Services"  ← font-display text-[26px] md:text-[36px]
                                                  [+ New]  ← Button tonal sm

[Service cards grid]
Mobile:  grid-cols-1
Desktop: md:grid-cols-2
```

### Service Card

```
┌────────────────────────────────────────────┐
│ Strength · basics        [badge: hidden?]  [●─] Switch
│ "Bench, row, squat — technique + volume."
│ ⏱ 60 min  💰 55
│
│ [✎ Edit ─────────────]  [🗑]
└────────────────────────────────────────────┘
```

- Switch toggle: включает/выключает `isActive` — мгновенный optimistic update
- Badge `hidden`: появляется когда `isActive = false`
- Edit → открывает Sheet с формой (те же поля что и при создании)
- Delete → confirm dialog: «Delete service? This cannot be undone.»

### Sheet «New / Edit service»

```
[drag handle — mobile only]
New service / Edit service
─────────────────────────
Name
[_________________________]

Duration                Price, $
[Select ▾]              [_______]

Description
[_________________________]
[_________________________]
[_________________________]

[Cancel ─────] [Save ─────]
```

**Mobile**: Sheet slide-up, `rounded-t-3xl`  
**Desktop**: Centered dialog, `sm:rounded-3xl sm:max-w-md`

После Save → toast «Service saved ✓», карточка обновляется оптимистично.

---

## Поток 5: Клиенты

**Route**: `/trainer/clients`

```
"Clients"  ← font-display

[Search input — rounded-full, md:max-w-md]
🔍 Search by name...

[Client cards grid]
Mobile:  grid-cols-1
Desktop: md:grid-cols-2
```

### Client Card

```
┌────────────────────────────────────────┐
│ [Avatar md] Ivan Petrov   12 sessions  │
│             Goal: Gain mass            │
│             Last — 2 days ago          │
└────────────────────────────────────────┘
```

Клик → Client Sheet

### Client Sheet

```
[drag handle]
Ivan Petrov
─────────────────────
[12 sessions] [3 mo] [★ 5.0]  ← mini KPI grid

Private notes  (visible only to you)
[_________________________________]
[_________________________________]
[Goal: Gain mass. Right shoulder  ]
[issue — no overhead pressing.    ]
[_________________________________]

"Saved automatically"  ← text-[11px] text-ink-3
```

**UX**: textarea auto-saves при blur (debounce 1s). Нет кнопки Save — снижает трение.

---

## Поток 6: Доходы

**Route**: `/trainer/income`  

> **MVP**: история бронирований + суммы. Без Stripe, без реального payout.

```
"Income"  ← font-display

[KPI Grid]
Mobile:  grid-cols-2
Desktop: md:grid-cols-4

  [📅 Sessions / month]  [⏱ Pending payout]
  [📅 Last month]        [✓ Total paid out]
```

### Transactions List

```
Card: "Transactions"              [Export CSV]
─────────────────────────────────────────────
May 12  Ivan P.    60 min session  $54.00  [Paid out]
May 11  Olga K.    Recovery 45m   $34.20  [Paid out]
May 10  Alisa Sh.  HIIT 30         $22.50  [Pending]
May 8   Kirill N.  60 min session  $54.00  [Paid out]
May 3   Lena K.    Functional      $36.00  [Refunded]
```

**Строка транзакции**:
```
[Date mono text-[11px]] [Client · Service, 2 lines]  [Net $  Badge]

Badge statuses:
  Paid out  → completed (bg-surface-variant)
  Pending   → pending   (bg-warning-container text-warning)
  Refunded  → cancelled (bg-error-container text-error)
```

**Desktop**: таблица читается лучше — колонки выровнены.  
**Mobile**: карточный вид, дата + клиент + сумма + badge.

---

## Поток 7: Редактирование профиля

**Route**: `/trainer/profile`

```
"Edit profile"  ← font-display

[Photo upload — large, circle/rounded]
Mobile:  центрирован, tap → sheet (камера / галерея)
Desktop: left-aligned, стандартный file input

[Form fields]
Bio     ← Textarea 100–1000, counter
Specializations  ← Multi-select chips
Years of experience  ← number
City  ← text
Timezone  ← Select

[Certificates section — dynamic list]
  ✓ RYT-500 Yoga Alliance · 2019  [✕]
  ✓ Pilates Method · 2021         [✕]
  [+ Add certificate]

[Save changes]  ← Button filled w-full
```

---

## UX-принципы специфичные для Trainer role

### Плотность информации vs читаемость
Тренер работает с данными оперативно. Дашборд — плотный, но не перегруженный:
- KPI cards: 2×2 mobile, 4 в ряд desktop — вся ключевая информация без скролла
- Today sessions: монопространственное время, чёткие имена, минимальный chrome

### Оптимистичный UI для управляющих действий
- Switch активности услуги → мгновенно, rollback при ошибке сети
- Switch дня расписания → мгновенно
- Private notes → auto-save при blur

### Предупреждение о статусе
Status Banner — всегда первый элемент на дашборде если `status = pending`. Тренер должен знать что он невидим в поиске. Banner не скрывается — только исчезает когда статус меняется.

### Mobile: управление расписанием
Самая сложная задача на мобиле. Решения:
- Switch достаточно крупный (`h-7 w-12`) для надёжного тапа
- Chips со слотами — wrappable, не горизонтальный scroll (они короткие)
- Мини-календарь — `h-9 w-9` кнопки дней, достаточно для пальца

### Навигация к клиенту
Из Client Sheet нет глубокой навигации. Все действия (заметки) — прямо в Sheet. Не нужна отдельная страница клиента на MVP.

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`pages_functional_spec.md`](../../pages_functional_spec.md) | Page-level behavior |
| [`trainer_onboarding_spec.md`](../../../../implementation/mvp/specs/trainer_onboarding_spec.md) | Registration wizard UX (W9) |
| [`trainer_schedule_spec.md`](../../../../implementation/mvp/specs/trainer_schedule_spec.md) | Schedule editor UX (W9) |
| [`global_shell_spec.md`](../../../../implementation/mvp/specs/global_shell_spec.md) | Trainer shell (W9) |
| [`canonical_routes.md`](../../../../design/canonical_routes.md) | Route inventory |

**Registry:** [`documentation_creation_registry.md`](../../../../meta/documentation_creation_registry.md) — user flow trainer
