# Prototype class parity spec — сопоставление классов прототипа и UI-компонентов

**Тип:** Spec  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-24  
**Волна:** W12-01 (P14)  
**Зависит от:** [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) (UX-03 v2.0), [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md) (UX-02 v2.0), [`design_system_lab_spec.md`](./design_system_lab_spec.md) §5.3 и §8, [`adr_014_app_redesign_v2.md`](../../../prds/07_governance/adr_014_app_redesign_v2.md)  
**Связанные документы:** [`sunday_school_prototype.html`](../../../prototypes/sunday_school_prototype.html), [`prototype_route_mapping.md`](../../../design/prototype_route_mapping.md), [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md), [`ai_code_review_protocol.md`](../../../guidelines/ai_code_review_protocol.md), [`P14_phase_description.md`](../phases_tasks_descriptions/P14_phase_description.md), [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** Tailwind CSS v4.3 — порядок классов не влияет на результат, одинаковые утилиты дают одинаковый CSS; `cva` (class-variance-authority) — итоговая строка класса = база + вариант + размер; shadcn семантические алиасы — по `apps/web/src/app/globals.css` (`:root`, `@theme inline`). Размеры в px посчитаны от `html { font-size: 112.5% }` (18 px). Номера строк прототипа сняты 2026-10-24 после правок P14. Context7 недоступен.

---

## 1. Purpose

Дать `reviewer` и `implementer` **механический** способ ответить на вопрос «класс из прототипа и класс компонента — одно и то же?». Раньше это была ручная сверка по §5.3 Lab-спека и по `prototype-refs.ts`; автоматического соответствия не было, поэтому классы расходились (аудит 2026-10-24: `text-sm` вместо `text-base`, чипы `ink` против `cobalt-soft`, три высоты контролов).

Документ задаёт:

1. таблицу соответствия «символ прототипа → компонент → ожидаемые классы» (§2);
2. правила нормализации (§3);
3. протокол проверки для субагента (§4);
4. требования к скрипту `scripts/check-prototype-parity.mjs` (§6).

## 2. Scope / Out of scope

**В scope:** константы и билдеры прототипа, у которых есть компонент в `apps/web/src/components/{ui,atoms,patterns,shell}` или страничный фрагмент в `components/analytics`.  
**Вне scope:** JS-логика прототипа, тексты, данные, post-MVP экраны (`penalty`, достижения голосовой проверки), палитра (проверяется UX-03 §5).

## 3. Нормализация

Сравнение — **множеств классов**, а не строк.

| Правило | Что делать |
|---------|------------|
| N-1 Порядок | Порядок классов не важен |
| N-2 Алиасы токенов | Считать равными: `bg-cobalt-ink` = `bg-primary`; `text-cobalt-ink` = `text-accent-foreground`; `bg-cobalt-soft` = `bg-accent`; `border-muted` = `border-input`; `text-muted` = `text-muted-foreground`; `bg-paper` = `bg-background`; `text-ink` = `text-foreground`; `bg-surface` = `bg-card` = `bg-popover`; `border-line` = `border-border`; `text-danger` = `text-destructive`; `bg-danger` = `bg-destructive` |
| N-3 Единицы | `text-base` = 1rem = 18 px; `text-sm` = 15.75 px; `text-xs` = 13.5 px; `h-9` = 40.5 px; `h-10` = 45 px; `h-11` = 49.5 px. Произвольные `text-[0.9375rem]` и `h-[2.5rem]` приводить к ближайшей именованной утилите и считать **нарушением** (v2.0 запрещает `text-[0.9375rem]`) |
| N-4 Префиксы | `sm:`, `md:`, `lg:`, `hover:`, `focus-visible:`, `disabled:`, `aria-*:`, `data-*:` сравниваются попарно вместе с утилитой: `hover:bg-paper` ≠ `bg-paper` |
| N-5 Служебные классы | Классы, которых нет в прототипе, но которые добавляет Base UI или shadcn (`group/button`, `outline-none`, `select-none`, `[&_svg]:…`, `data-slot`, `aria-busy:…`, `has-data-[…]`), не считаются расхождением, если не меняют размер, цвет, границу, радиус, шрифт и отступ |
| N-6 Пропсы вместо классов | Если прототип фиксирует `max-w-sm` или `w-full`, а компонент оставляет это пропсом, это допустимо только при записи в `allowed_diff` строки |
| N-7 Эквиваленты | Равны по результату: `size-5` = `h-5 w-5`; `px-3.5` ≠ `px-4` (разные значения); `rounded-lg` ≠ `rounded-md` |
| N-8 Cva-варианты | Для сравнения брать итоговый набор: **база + выбранный `variant` + выбранный `size`** из `cva(...)`, с учётом `defaultVariants` |

## 4. Протокол проверки (для `reviewer` и `implementer`)

Выполнять для каждого изменённого файла в `components/ui/**`, `components/shell/**`, `components/patterns/**`, `components/atoms/**`, `components/analytics/**`, `app/globals.css`, `app/layout.tsx`.

| Шаг | Действие |
|-----|----------|
| 1 | Найти в §2 строки, где столбец «Компонент» = изменённый файл. Нет строки — это находка `suggestion`: добавить строку в §2 в том же CU (иначе механизм устареет) |
| 2 | Открыть прототип по символу из столбца «Прототип» (константа или функция; номер строки — ориентир, символ главнее) |
| 3 | Получить итоговый набор классов компонента (N-8) и прототипа; применить §3 |
| 4 | Сравнить. Классы, которых нет в одной из сторон, сверить со столбцом `allowed_diff`; вне списка — **blocker** «drift: <строка §2>, <лишний/недостающий класс>» |
| 5 | Для экрана: сопоставить функцию `v*` прототипа и `page.tsx` через [`prototype_route_mapping.md`](../../../design/prototype_route_mapping.md): порядок секций, ширина контейнера (R-4), размеры текста по роли (UX-03 §6), контролы только из каталога |
| 6 | Прогнать скрипт, если он есть: `node scripts/check-prototype-parity.mjs --component <id>` (§6); его вывод — тот же результат, не замена шагу 4 для строк с `check: "manual"` |
| 7 | Записать трассу `Parity: <N> строк сверено, расхождений <M>` (при M > 0 — перечень id). Без трассы UI-CU не коммитится |

**Если прототип и контракт расходятся** — прав контракт ([`ui-prototype-fidelity.mdc`](../../../../.cursor/rules/ui-prototype-fidelity.mdc), порядок источников): сначала правка прототипа и строки §2, затем код. Расхождение «код ≠ прототип» без записи в `allowed_diff` всегда blocker.

## 5. Как поддерживать таблицу

- Новая константа прототипа или новый компонент — строка в §2 **в том же CU**.
- Правка класса в компоненте или константе — правка строки §2 в том же CU.
- Номера строк прототипа обновляются при правке прототипа (в Change log — одна строка).
- Блок JSON в §2.2 — единственный источник для скрипта; Markdown-таблица §2.1 — его читаемое представление (сверяются одним diff).

## 6. Скрипт `scripts/check-prototype-parity.mjs` (создаётся в P14-CU1)

| Требование | Значение |
|------------|----------|
| Вход | Блок ```` ```json parity ```` из §2.2 этого файла; `docs/prototypes/sunday_school_prototype.html`; файлы компонентов по `component.path` |
| Прототип | Читает значение `const <ИМЯ> = '...'` или `'...' + …` для строк с `proto.kind = "const"`; для `kind = "fn"` — класс из шаблона по `proto.pick` (регэксп) |
| Компонент | Для `kind = "cva"` — собирает базу, `variant` и `size` из первого `cva(...)` файла; для `kind = "cn"` — литеральные аргументы `cn(...)` по `component.pick`; для `kind = "css"` — блок правила в `globals.css` |
| Сравнение | §3: нормализация N-1…N-8, затем разность множеств; вычитает `allowed_diff` |
| Вывод | По строке: `ok` / `drift` / `skip (manual)`; в конце `Parity: N строк, расхождений M`; exit-код 1 при M > 0 |
| Флаги | `--component <id>` (одна строка), `--all`, `--json` |
| Тесты | Vitest на нормализацию (алиасы N-2, единицы N-3, cva N-8) и на два реальных случая из §2 (BTN, SEG_ON) |
| Не делает | Не правит файлы; не читает ничего вне путей из §2.2 |

Скрипт не заменяет шаг 4 протокола: строки `check: "manual"` (экраны, shell-каркас) проверяются глазами по §4.

## 7. Таблица соответствия

Номера строк прототипа — на 2026-10-24.

### 7.1 Читаемая таблица (`check`: `auto` — скрипт, `manual` — по §4 шаг 5)

| ID | Прототип (символ · строка) | Компонент | Ожидаемые классы (v2.0, после N-1…N-8) | `allowed_diff` | `check` |
|----|----------------------------|-----------|-----------------------------------------|----------------|---------|
| P-01 | `BTN` · ~691 | `components/ui/button.tsx` (база + `size=default`) | `inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3.5 text-base font-medium whitespace-nowrap select-none active:scale-[0.97] motion-reduce:active:scale-100 disabled:opacity-45` | `border border-transparent`, `focus-visible:outline-*` (в app задаётся глобально), `transition-*` | auto |
| P-02 | `B_PRIMARY` · ~692 | `button.tsx` `variant=default` | `bg-cobalt-ink text-surface hover:bg-cobalt-deep` | — | auto |
| P-03 | `B_OUTLINE` · ~693 | `button.tsx` `variant=outline` | `border-line-strong bg-surface text-ink hover:bg-paper` | `border` (в базе) | auto |
| P-04 | `B_GHOST` · ~694 | `button.tsx` `variant=ghost` | `text-ink hover:bg-line/60` | `aria-expanded:bg-line/60` | auto |
| P-05 | `B_DANGER` · ~695 | `button.tsx` `variant=destructive` | `border-danger/60 bg-surface text-danger hover:bg-danger-soft` | `bg-surface` (в прототипе прозрачный) | auto |
| P-06 | `B_DANGER_FILL` · ~696 | `button.tsx` `variant=destructive-solid` | `bg-danger text-surface` | hover: `hover:opacity-90` (прототип) и `hover:bg-danger/90` (app) считаются равными | auto |
| P-07 | размер `compact` (таблицы) | `button.tsx` `size=sm` → переименовать в `compact` | `h-9 px-3 text-base` | — | auto |
| P-08 | `CARD` · ~699 | `components/ui/card.tsx` | `rounded-xl border border-line bg-surface` | `p-4 sm:p-5` (padding в компоненте), `text-base` | auto |
| P-09 | `H2` · ~700 | `components/atoms/Heading.tsx` (`level` 2) | `font-display text-[1.25rem] font-medium leading-snug` | — | auto |
| P-10 | `FIELD` · ~701 | `components/ui/input.tsx` | `h-10 w-full max-w-sm rounded-lg border border-muted bg-surface px-3 text-base focus:border-cobalt-ink` | `focus:border-cobalt-ink` ≡ `focus-visible:border-cobalt-ink`; `py-1`, `min-w-0`, `file:*`, `placeholder:*`, `aria-invalid:*` | auto |
| P-11 | `SEL` · ~702 | `components/ui/select.tsx` `SelectTrigger` | `h-10 w-full rounded-lg border border-muted bg-surface px-3 text-base` + шеврон `size-4 text-muted` | `max-w-sm` задаёт потребитель; `justify-between`, `gap-1.5`, `data-placeholder:*` | auto |
| P-12 | `SEL` панель, пункт · `DD_PANEL` ~1178 | `select.tsx` `SelectContent` / `SelectItem` | панель `rounded-xl border border-line bg-surface shadow-float`; пункт `min-h-10 rounded-lg px-2.5 text-base`; выбранный `bg-cobalt-soft text-cobalt-ink` | `animate-*`, `z-50`, `max-h-*` | manual |
| P-13 | `LABEL` · ~704 | `components/ui/label.tsx`, `field.tsx` (`FieldLabel`) | `mb-1.5 block text-base font-medium` | `mb-1.5` может задаваться `Field` | auto |
| P-14 | `SEG_ON` · ~706 | `components/ui/segmented-control.tsx` (выбранный) | `border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink` | `hover:bg-cobalt-soft` | auto |
| P-15 | `SEG_OFF` · ~707 | `segmented-control.tsx` (невыбранный) | `border-muted bg-surface text-ink hover:border-ink-2` | — (`hover:bg-paper` в `SegmentedControl` v1 — расхождение, в P14-CU3 приводится к `hover:border-ink-2`) | auto |
| P-16 | `CHIP` · ~708 | `segmented-control.tsx` (общая часть) | `h-10 rounded-lg border px-3 text-base transition-[background-color,border-color,color] duration-100`; `size=compact`: `h-9` | `min-w-11`, `font-medium`, `active:scale-[0.97]` | auto |
| P-17 | чекбокс (`<input type="checkbox" class="size-5 accent-cobalt-ink">`) · ~1356, ~2623 | `components/ui/checkbox.tsx` | `size-5 rounded border border-muted`; выбран `border-cobalt-ink bg-cobalt-ink text-surface` | область касания `after:-inset-*` | auto |
| P-18 | `toggle` · ~744 | `components/ui/switch.tsx` | трек `h-8 w-14 rounded-full`, включён `bg-ink`, выключен `bg-line-strong`; бегунок `size-6` | Base UI-атрибуты | manual |
| P-19 | поле даты (`FIELD` на `type=date`) · ~1343 | `components/ui/date-field.tsx` (новый) | как P-10 + кнопка календаря `size-10` | нативный глиф календаря в прототипе заменяется кнопкой | manual |
| P-20 | `SIDE_ROW` · ~1185 | `components/shell/nav-link-row.tsx` `density="sidebar"` | `flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-base leading-tight` | `no-underline hover:no-underline` | auto |
| P-21 | `SIDE_ROW_ON` / `SIDE_ROW_OFF` · ~1186–1187 | `nav-link-row.tsx` | активный `bg-cobalt-soft font-bold text-cobalt-ink`; неактивный `text-ink hover:bg-line/60` | — | auto |
| P-22 | `sidebarHTML` · ~1188 | `components/shell/sidebar-nav.tsx` | группа: заголовок `px-3 pb-1 text-sm font-medium text-muted`, список `space-y-0.5`, интервал групп `mt-5` | — | manual |
| P-23 | `#sidebar` (aside) · 194 | `components/shell/app-shell.tsx` | `sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto border-r border-line bg-surface px-3 py-4 lg:block` | — | manual |
| P-24 | `#shellGrid`, `#main`, `#view` · 193–198 | `app-shell.tsx` | сетка `lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]`; `main` `min-w-0 px-4 pt-4 pb-28 sm:px-6 lg:px-8 lg:pt-7 lg:pb-16`; контейнер `max-w-[1400px]` без `mx-auto` | `w-full` | manual |
| P-25 | `header` · 183 | `components/shell/shell-header.client.tsx` | `sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md`; внутри `flex h-14 items-center gap-2 px-2 sm:px-4 lg:gap-0 lg:px-0`; бренд на `lg+` `w-64 border-r border-line px-5` | — | manual |
| P-26 | `DD_PANEL` · ~1178 | `lib/shell/nav-chrome-classes.ts` `SHELL_NAV_DROPDOWN_PANEL` (оставить только для user-menu) | `absolute top-full z-50 mt-1.5 min-w-64 origin-top rounded-xl border border-line bg-surface p-1.5 shadow-float` | `shadow-float` ≡ `shadow-[0_10px_30px_rgba(15,23,42,0.12)]` | auto |
| P-27 | `rightHTML` · ~1195 | `components/shell/user-menu.tsx` | триггер `h-10 rounded-lg px-1.5 text-base`; пункты `h-10 rounded-lg px-2.5 text-base`; группа «Смотреть как» — только `APP_ENV=dev` | `max-w-[12rem]`, `truncate` | manual |
| P-28 | `badge` · ~1177 | `components/shell/nav-badge.tsx`, `ui/count-badge.tsx` | `ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-cobalt-ink px-1.5 text-xs font-bold tabular-nums text-surface` | — | auto |
| P-29 | `ref` · ~717 | `components/ui/badge.tsx` (ссылка на стих) | `inline-flex items-center rounded-md bg-paper px-1.5 py-px text-sm font-medium text-ink ring-1 ring-line` | `h-5` (в app) снять | auto |
| P-30 | `pageHead` · ~719 | `components/patterns/PageHeader.tsx` | `mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:mb-6`; `h1` `font-display text-[1.75rem] sm:text-[2.125rem] font-medium leading-[1.1] tracking-[-0.01em]`; подзаголовок `mt-1 text-ink-2` | — | auto |
| P-31 | таблица (`<table class="w-full text-left text-base">`, `thead … text-sm text-muted`, `td … px-3 py-3`) · ~960 и др. | `components/ui/table.tsx` | таблица `text-base`; заголовок колонки `text-sm text-muted font-normal px-3 py-3`; ячейка `px-3 py-3 tabular-nums` для чисел | `min-w-*` задаёт экран | auto |
| P-32 | `status` · 729 | `components/ui/status-text.tsx` | `inline-flex items-center gap-1.5 text-sm`; цвет по виду | — | manual |
| P-33 | `groupChips`, `yearChips`, `periodChips` · ~1775, ~943, ~1836 | `components/analytics/AnalyticsGradeChips.tsx`, `years/YearStrip.tsx`, `AnalyticsPeriodChips.tsx` | оболочка `flex flex-wrap gap-2` + `SegmentedControl` (P-14…P-16); собственных классов кнопок нет | — | manual |
| P-34 | `vRating` · ~1750 | `components/analytics/RatingTable.tsx` | место `px-5 py-3 font-display text-lg tabular-nums` (одинаково во всех строках), имя `font-medium text-ink hover:text-cobalt-ink focus-visible:text-cobalt-ink`, числа `tabular-nums` | цвет места первых трёх: `text-ink`, остальных `text-muted` | manual |
| P-35 | `vCalendar` · ~1782 | `components/calendar/CalendarMonth.tsx` | число дня `text-base tabular-nums text-ink`, сегодня `bg-ink text-surface rounded-full size-7`; ячейка `min-h-14 sm:min-h-24 p-1 sm:p-2` | — | manual |
| P-36 | `SUBMIT` · ~703 | кнопка отправки экрана `/login` (`components/auth/*`) | `BTN` + `h-11 w-full justify-center` | — | manual |
| P-37 | `main:focus` · 122 (`@layer base`) | `app/globals.css` | `main:focus:not(:focus-visible) { outline: none }` | — | auto (css) |
| P-38 | `html { font-size }` · 120 | `app/globals.css` | `html { font-size: 112.5% }` | — | auto (css) |
| P-39 | `--font-body`, `--font-display` · 109–110 | `app/globals.css`, `app/layout.tsx` | `--font-body` = Source Sans 3; `--font-display` = Alegreya | `fallback` в `next/font` | auto (css) |
| P-40 | `--control-h*` · 112–114 | `app/globals.css` | `--control-h: 2.5rem; --control-h-compact: 2.25rem; --control-h-touch: 2.75rem` | — | auto (css) |

### 7.2 Машиночитаемый блок (для `scripts/check-prototype-parity.mjs`)

Формат строки: `id`, `proto` (`kind`: `const` — значение константы; `fn` — класс из шаблона; `css` — правило CSS; `symbol`), `component` (`path`, `kind`: `cva` | `cn` | `css`, `variant`, `size`, `pick`), `expect` (нормализованный набор), `allowed_diff` (набор классов, допустимых только в одной из сторон), `check`.

```json parity
[
  { "id": "P-01", "proto": { "kind": "const", "symbol": "BTN" }, "component": { "path": "apps/web/src/components/ui/button.tsx", "kind": "cva", "size": "default" },
    "expect": "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3.5 text-base font-medium whitespace-nowrap select-none active:scale-[0.97] motion-reduce:active:scale-100 disabled:opacity-45",
    "allowed_diff": ["border", "border-transparent", "transition-[background-color,transform]", "duration-150", "ease-out-soft", "outline-none", "group/button", "shrink-0"], "check": "auto" },
  { "id": "P-02", "proto": { "kind": "const", "symbol": "B_PRIMARY" }, "component": { "path": "apps/web/src/components/ui/button.tsx", "kind": "cva", "variant": "default" },
    "expect": "bg-cobalt-ink text-surface hover:bg-cobalt-deep", "allowed_diff": [], "check": "auto" },
  { "id": "P-03", "proto": { "kind": "const", "symbol": "B_OUTLINE" }, "component": { "path": "apps/web/src/components/ui/button.tsx", "kind": "cva", "variant": "outline" },
    "expect": "border border-line-strong bg-surface text-ink hover:bg-paper", "allowed_diff": ["aria-expanded:bg-paper", "border"], "check": "auto" },
  { "id": "P-04", "proto": { "kind": "const", "symbol": "B_GHOST" }, "component": { "path": "apps/web/src/components/ui/button.tsx", "kind": "cva", "variant": "ghost" },
    "expect": "text-ink hover:bg-line/60", "allowed_diff": ["aria-expanded:bg-line/60"], "check": "auto" },
  { "id": "P-05", "proto": { "kind": "const", "symbol": "B_DANGER" }, "component": { "path": "apps/web/src/components/ui/button.tsx", "kind": "cva", "variant": "destructive" },
    "expect": "border border-danger/60 text-danger hover:bg-danger-soft", "allowed_diff": ["bg-surface", "border"], "check": "auto" },
  { "id": "P-06", "proto": { "kind": "const", "symbol": "B_DANGER_FILL" }, "component": { "path": "apps/web/src/components/ui/button.tsx", "kind": "cva", "variant": "destructive-solid" },
    "expect": "bg-danger text-surface", "allowed_diff": ["hover:opacity-90", "hover:bg-danger/90"], "check": "auto" },
  { "id": "P-07", "proto": { "kind": "const", "symbol": "BTN" }, "component": { "path": "apps/web/src/components/ui/button.tsx", "kind": "cva", "size": "compact" },
    "expect": "h-9 px-3 text-base", "allowed_diff": ["h-10", "px-3.5"], "check": "auto" },
  { "id": "P-08", "proto": { "kind": "const", "symbol": "CARD" }, "component": { "path": "apps/web/src/components/ui/card.tsx", "kind": "cn", "pick": "Card" },
    "expect": "rounded-xl border border-line bg-surface", "allowed_diff": ["p-4", "sm:p-5", "text-base", "flex", "flex-col", "gap-4"], "check": "auto" },
  { "id": "P-10", "proto": { "kind": "const", "symbol": "FIELD" }, "component": { "path": "apps/web/src/components/ui/input.tsx", "kind": "cn", "pick": "Input" },
    "expect": "h-10 w-full max-w-sm rounded-lg border border-muted bg-surface px-3 text-base focus:border-cobalt-ink", "allowed_diff": ["focus:outline-none", "focus-visible:border-cobalt-ink", "min-w-0", "py-1", "outline-none", "transition-[color,box-shadow]", "file:*", "placeholder:*", "disabled:*", "aria-invalid:*"], "check": "auto" },
  { "id": "P-11", "proto": { "kind": "const", "symbol": "SEL" }, "component": { "path": "apps/web/src/components/ui/select.tsx", "kind": "cn", "pick": "SelectTrigger" },
    "expect": "h-10 w-full rounded-lg border border-muted bg-surface px-3 text-base", "allowed_diff": ["max-w-sm", "sel", "focus:border-cobalt-ink", "focus-visible:border-cobalt-ink", "flex", "items-center", "justify-between", "gap-1.5", "py-2", "pr-2", "pl-2.5", "whitespace-nowrap", "data-*", "aria-invalid:*", "*:data-*", "[&_svg]:*", "transition-[color,box-shadow]", "outline-none", "disabled:*", "focus:outline-none"], "check": "auto" },
  { "id": "P-13", "proto": { "kind": "const", "symbol": "LABEL" }, "component": { "path": "apps/web/src/components/ui/label.tsx", "kind": "cn", "pick": "Label" },
    "expect": "mb-1.5 block text-base font-medium", "allowed_diff": ["flex", "items-center", "gap-2", "select-none", "leading-none", "group-*", "peer-*", "mb-1.5", "block"], "check": "auto" },
  { "id": "P-14", "proto": { "kind": "const", "symbol": "SEG_ON" }, "component": { "path": "apps/web/src/components/ui/segmented-control.tsx", "kind": "cn", "pick": "checked" },
    "expect": "border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink", "allowed_diff": ["hover:bg-cobalt-soft"], "check": "auto" },
  { "id": "P-15", "proto": { "kind": "const", "symbol": "SEG_OFF" }, "component": { "path": "apps/web/src/components/ui/segmented-control.tsx", "kind": "cn", "pick": "unchecked" },
    "expect": "border-muted bg-surface text-ink hover:border-ink-2", "allowed_diff": [], "check": "auto" },
  { "id": "P-16", "proto": { "kind": "const", "symbol": "CHIP" }, "component": { "path": "apps/web/src/components/ui/segmented-control.tsx", "kind": "cn", "pick": "base" },
    "expect": "h-10 rounded-lg border px-3 text-base transition-[background-color,border-color,color] duration-100", "allowed_diff": ["inline-flex", "items-center", "justify-center", "min-h-11", "min-w-11", "font-medium", "active:scale-[0.97]", "motion-reduce:*", "disabled:*", "ease-out-soft", "transition-[color,background-color,border-color,transform]", "hover:bg-paper", "bg-surface", "text-ink"], "check": "auto" },
  { "id": "P-20", "proto": { "kind": "const", "symbol": "SIDE_ROW" }, "component": { "path": "apps/web/src/components/shell/nav-link-row.tsx", "kind": "cn", "pick": "sidebar" },
    "expect": "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-base leading-tight", "allowed_diff": ["no-underline", "hover:no-underline", "transition-[background-color,color]", "duration-100"], "check": "auto" },
  { "id": "P-21", "proto": { "kind": "const", "symbol": "SIDE_ROW_ON" }, "component": { "path": "apps/web/src/components/shell/nav-link-row.tsx", "kind": "cn", "pick": "sidebar-active" },
    "expect": "bg-cobalt-soft font-bold text-cobalt-ink", "allowed_diff": [], "check": "auto" },
  { "id": "P-26", "proto": { "kind": "const", "symbol": "DD_PANEL" }, "component": { "path": "apps/web/src/lib/shell/nav-chrome-classes.ts", "kind": "cn", "pick": "SHELL_NAV_DROPDOWN_PANEL" },
    "expect": "absolute top-full z-50 mt-1.5 min-w-64 origin-top rounded-xl border border-line bg-surface p-1.5 shadow-float", "allowed_diff": ["shadow-[0_10px_30px_rgba(15,23,42,0.12)]"], "check": "auto" },
  { "id": "P-28", "proto": { "kind": "fn", "symbol": "badge" }, "component": { "path": "apps/web/src/components/shell/nav-badge.tsx", "kind": "cn", "pick": "NavBadge" },
    "expect": "ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-cobalt-ink px-1.5 text-xs font-bold tabular-nums text-surface", "allowed_diff": [], "check": "auto" },
  { "id": "P-37", "proto": { "kind": "css", "symbol": "main:focus:not(:focus-visible)" }, "component": { "path": "apps/web/src/app/globals.css", "kind": "css", "pick": "main:focus:not(:focus-visible)" },
    "expect": "outline: none", "allowed_diff": [], "check": "auto" },
  { "id": "P-38", "proto": { "kind": "css", "symbol": "html" }, "component": { "path": "apps/web/src/app/globals.css", "kind": "css", "pick": "html" },
    "expect": "font-size: 112.5%", "allowed_diff": ["-webkit-text-size-adjust"], "check": "auto" },
  { "id": "P-40", "proto": { "kind": "css", "symbol": "--control-h" }, "component": { "path": "apps/web/src/app/globals.css", "kind": "css", "pick": "--control-h" },
    "expect": "--control-h: 2.5rem; --control-h-compact: 2.25rem; --control-h-touch: 2.75rem", "allowed_diff": [], "check": "auto" }
]
```

Строки P-09, P-12, P-17…P-19, P-22…P-25, P-27, P-29…P-36, P-39 — `check: "manual"` или `css`; они остаются в §7.1 и проверяются по протоколу §4 шаг 5, пока скрипт их не поддерживает.

## 8. Open questions

| ID | Вопрос | Предложение по умолчанию | Блокирует |
|----|--------|--------------------------|-----------|
| Q-01 | Нужно ли расширять скрипт на `cn(...)` с условными ветками (`checked ? … : …`) | Да, `pick: "checked" \| "unchecked"` читает ветки тернарника; сложные случаи — `manual` | P14-CU1 |
| Q-02 | Хранить ли таблицу §7.2 отдельным `.json` | Нет: одно место (этот файл), скрипт читает блок | — |

## 9. Related documents

| Document | Relationship |
|----------|--------------|
| [`design_system_lab_spec.md`](./design_system_lab_spec.md) | Каталог компонентов и fidelity §8 |
| [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) | Рецепты §8 (ожидаемые классы) |
| [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md) | Матрица «что менять» |
| [`ai_code_review_protocol.md`](../../../guidelines/ai_code_review_protocol.md) | Проход 2b для UI |
| [`P14_phase_description.md`](../phases_tasks_descriptions/P14_phase_description.md) | Фаза, где протокол обязателен |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W12-01

## 10. Agent notes

- Не «исправлять» прототип под код: если код корректен по контракту v2.0, а прототип нет — правка прототипа и строки §7.
- Не добавлять в `allowed_diff` класс только ради зелёного скрипта: запись — решение с причиной в §7.1.
- `text-[0.9375rem]` и `text-xs` вне бейджей — всегда нарушение (N-3, UX-03 §6).
- Строка без компонента в репозитории (новый компонент P14) — не ошибка до CU, который его создаёт; после него обязателен `ok`.

## Change log

| Date | Change |
|------|--------|
| 2026-10-24 | v1.0 — Canonical (W12-01, P14): правила нормализации, протокол, таблица P-01…P-40, требования к скрипту |
