# Аудит соответствия UI прототипу — 2026-10-21 (проход 2)

**Среда:** `http://localhost:3000` (dev), сверка с [`sunday_school_prototype.html`](../../../prototypes/sunday_school_prototype.html)  
**Базовый аудит / P09:** [`ui_prototype_fidelity_2026-10-20.md`](./ui_prototype_fidelity_2026-10-20.md), [`P09_tasks.md`](../tasks/P09_tasks.md) (закрыт)  
**Ширины:** 390, 768, 1024; оболочка дополнительно **820**  
**Роли:** учитель и администратор (email, сессия до оболочки); формы не отправлялись, кроме входа/выхода  
**Вне scope:** повторное исправление копирайта/секций P09, падения класса A/B P09 (только фиксация), post-MVP экраны

## Симптомы (гипотезы → подтверждение)

| Симптом | Итог прохода 2 |
|--------|----------------|
| Меню «ломается» на 768 / ~820 | **Подтверждено:** порядок слотов шапки и `flex-1 justify-center` + dev role switcher (`sm+`) сжимают заголовок и имя пользователя |
| Кегль/вес не по шкале | **Частично:** атомы страницы в норме; разъезд в KPI, login hero, check header, активной навигации |
| Отступы | **Частично:** `PageHeader` / карточки близко к UX-03; шапка без `lg:gap-4` как в прототипе |
| Горизонтальный скролл на 390 | **`/analytics` и карточка ученика — нет** (после P09); таблицы в `overflow-x-auto` внутри карточки — ок |
| Таблица → карточки на 390 | По экранам P09; новых расхождений не выявлено |

## Таблица расхождений

Формат: **файл** · прототип/токен · код · ширины · **серьёзность**

### Atoms

| Строка |
|--------|
| `apps/web/src/components/atoms/Heading.tsx` · UX-03 §6 `h2` = `text-[1.25rem] font-medium leading-snug` · `level="section"` → `text-xl leading-snug` (эквивалент, но не явный токен) · все · **deviation** |
| `apps/web/src/components/atoms/Heading.tsx` · login hero `text-[2.25rem] leading-[1.05] tracking-[-0.015em]` (прототип `vLogin`) · нет варианта `display` / `hero` · `/login` · **deviation** |
| `apps/web/src/components/atoms/NumberDisplay.tsx` · KPI плитки `font-display text-2xl tabular-nums` (прототип `tile`) · дефолт `text-3xl` · экраны с KPI · **deviation** |
| `apps/web/src/components/atoms/ContentText.tsx` · `text-sm text-muted` для caption · `muted` = `text-sm text-muted` · все · ок |

### UI-примитивы

| Строка |
|--------|
| `apps/web/src/components/ui/button.tsx` · UX-03 §8 nav/topnav `h-9`, `text-[0.9375rem]` · default `h-10` · topnav/drawer ссылок · **deviation** |
| `apps/web/src/components/ui/card.tsx` · `CardTitle` как подзаголовок секции · `text-lg` (18px) vs UX-03 `h2` 20px · карточки с `CardTitle` · **deviation** |
| `apps/web/src/components/ui/button.tsx` · кегль кнопки 0.9375rem · совпадает с BTN прототипа · все · ок |

### Patterns

| Строка |
|--------|
| `apps/web/src/components/patterns/PageHeader.tsx` · отступ под шапкой экрана · `mb-5 lg:mb-6` (прототип — `space-y` внутри `#view`, без единого pattern) · все · **deviation** (низкий) |
| `apps/web/src/components/patterns/NavDrawer.tsx` · каталог Lab: drawer без лишнего заголовка в shell · в Lab обязателен `title` prop (только showcase) · n/a · ок (продукт использует `shell/nav-drawer.tsx`) |

### Shell

| Строка |
|--------|
| `docs/prototypes/sunday_school_prototype.html` `#shell` · `< lg`: **menuBtn → brand → hdrRight** · `shell-header.client.tsx`: **brand → ShellNavigation (menu внутри flex-1) → UserMenu** · 390, 768, 820 · **deviation** |
| `apps/web/src/components/shell/shell-navigation.client.tsx` · нет центрального блока навигации ниже `lg` · `flex flex-1 items-center justify-center` — иконка меню по центру шапки · 768, 820 · **deviation** |
| `apps/web/src/components/shell/shell-navigation.client.tsx` + `dev-role-switcher.tsx` · переключатель роли в прототипе не в шапке MVP · `SegmentedControl` в центре с `sm:flex` · 640–1023, особенно **820** · **deviation** |
| `apps/web/src/components/shell/shell-header.client.tsx` · `lg:gap-4` в строке шапки · `gap-2` без `lg:gap-4` · 1024+ · **deviation** |
| `apps/web/src/components/shell/nav-link-row.tsx` · активный пункт `font-bold` (прототип `navHTML` / topnav) · `font-medium` на всех состояниях · drawer + topnav · **deviation** |
| `apps/web/src/components/shell/top-nav.tsx` · выпадающая панель UX-03 §7 `rounded-xl` + shadow-float · `rounded-lg` · 1024+ · **deviation** |
| `apps/web/src/components/shell/top-nav.tsx` · пункты topnav `h-9` · `Button` default `h-10` · 1024+ · **deviation** |
| `apps/web/src/components/shell/user-menu.tsx` · аватар + имя на `xl` в прототипе hdr · только текст `displayName`, `max-w-[12rem]` · 768–1023 · **deviation** (низкий) |
| `apps/web/src/components/shell/app-shell.tsx` · `main` padding UX-02 · совпадает с прототипом `px-4 pb-28 … lg:px-8` · все · ок |

### Экраны (только визуальный дрейф после P09)

| Строка |
|--------|
| `apps/web/src/components/auth/LoginForm.client.tsx` · hero `h1` прототипа · сырой `h1` `text-[2.25rem]…`, не `Heading` · 390, 768, 1024 · **deviation** |
| `apps/web/src/components/teacher/CheckCardHeader.tsx` · заголовок проверки ~как page title или крупный display · `Heading` с `text-[1.5rem]` · `/check`, `/lessons/[id]/check` · **deviation** |
| `apps/web/src/components/analytics/AnalyticsPeriodKpiSection.tsx` · KPI `text-2xl` · дублирует разметку, не `NumberDisplay` size `2xl` · `/analytics` · **deviation** |
| `apps/web/src/app/layout.tsx` / metadata · заголовок вкладки «Название — Sunday School» (UX-02 §6) · в браузере **document title** `Sunday School` / `Login` (англ.) · все · **deviation** |
| Маршруты P09 (today, lessons, profile, rating, verses, analytics layout, school) · визуально по чек-листу P09 · локально без новых blocker/deviation вне таблицы выше · 390, 768, 1024 · ок |

## Что сознательно не копируем

| Элемент | Причина |
|---------|---------|
| Гарнитуры Source Serif / Manrope в rule-snippet ui-prototype-fidelity | **UX-03 D-2:** продукт — Alegreya / Alegreya Sans |
| Radio «Роль: Админ / Учитель» в шапке прототипа | **ОК-5:** только `APP_ENV=dev`, отдельный `DevRoleSwitcher`, не pixel-copy макета |
| Post-MVP секции (семья, штрафы, достижения) | MVP scope |
| Ссылка на согласие на `/login` | **access_and_registration_spec** — не убирать ради прототипа |

## Ошибки страниц (не чинить в проходе 2 по заданию)

| Маршрут | Роль | Ширины | Наблюдение |
|---------|------|--------|------------|
| `/audit` | admin | 820 (и др.) | **Something went wrong** после загрузки шапки; `/users` на той же сессии открывается. Sentry не проверялся в этом проходе (вне P09 class B). |

Остальные маршруты из матрицы P09 на учителе/админе в выборочной проверке **без** «Something went wrong» (в т.ч. `/school`, `/users`, `/analytics`).

## Commit units (фаза B)

| CU | Subject | Files (ориентир) | Зависимости |
|----|---------|------------------|-------------|
| **P10-CU1** | `fix(ui): align typography atoms with UX-03` | `Heading.tsx`, `NumberDisplay.tsx`, при необходимости экспорт вариантов в Design Lab section | первый |
| **P10-CU2** | `fix(ui): restore shell header layout at tablet widths` | `shell-header.client.tsx`, `shell-navigation.client.tsx`, `dev-role-switcher.tsx` | после CU1 не обязателен; логически следом |
| **P10-CU3** | `fix(ui): align nav chrome weights and sizes` | `nav-link-row.tsx`, `top-nav.tsx` | после CU2 |
| **P10-CU4** | `fix(ui): use typography atoms on login and check` | `LoginForm.client.tsx`, `CheckCardHeader.tsx`, `AnalyticsPeriodKpiSection.tsx` | после CU1 |
| **P10-CU5** | `fix(web): localized document titles` | metadata в `app/**/layout.tsx` или `page.tsx` (только title template) | независим |

**Не входит в P10:** исправление `/audit` (отдельная фаза/баг, не визуальный дрейф).

---

**Review trace (этот документ):** Phase A only — `diff-only`, runtime не менялся до коммитов CU.

## Статус фазы B (2026-10-21, в работе)

| CU | Статус |
|----|--------|
| P10-CU1 | реализовано в коде (`Heading`, `NumberDisplay`) |
| P10-CU2 | реализовано (`shell-header`, порядок menu → brand → topnav → hdrRight) |
| P10-CU3 | реализовано (`nav-link-row`, `top-nav`, `dev-role-switcher` breakpoint) |
| P10-CU4 | реализовано (`LoginForm`, `CheckCardHeader`, `AnalyticsPeriodKpiSection`) |
| P10-CU5 | реализовано (`product-document-title`, root template, app/auth metadata, `x-pathname`) |

### Проход 2b (меню + hydration, 2026-10-21)

| Область | Было | Стало |
|--------|------|--------|
| Hydration `<html>` | расхождение атрибутов (расширения браузера) | `suppressHydrationWarning` на `<html>` и `<body>` |
| Topnav dropdown | `Button` ghost, `py-1`, `min-w-[14rem]`, без chevron / open state | триггер как в прототипе (`h-9`, `bg-paper` при open), панель `min-w-64 p-1.5`, пункты `px-2.5 py-2` + описание |
| Drawer | close поверх «Сегодня», секции `text-sm`, footer в одну строку | шапка `h-14` + close, секции `text-xs font-bold`, footer с аватаром и «Выйти» столбцом |
| Header clip | dropdown обрезался | `overflow-visible` на `<header>` |

Остаётся vs прототип (не в этом проходе): иконки в пунктах меню, role switcher внутри drawer (в продукте только dev switcher в шапке).

Коммиты по CU — по запросу (разбить paths-file на 4 коммита или один squash).

## Проход 3 — CU1 Atoms

**Субагент:** implementer / composer-2.5  
**Эталоны:** [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) §6, [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md), прототип `H2` / `vLogin` / KPI `tile`  
**Ширины:** 390, 768, 1024 (классы атомов width-agnostic)

| Файл | Узел / вариант | Ожидание (UX-03 / прототип) | Факт (после CU1) | Ширины | Серьёзность |
|------|----------------|----------------------------|------------------|--------|-------------|
| `Heading.tsx` | `level="page"` | `font-display text-[1.75rem] sm:text-[2.125rem] font-medium leading-[1.1] tracking-[-0.01em]` | совпадает | все | **нет отклонения** |
| `Heading.tsx` | `level="section"` | `font-display text-[1.25rem] font-medium leading-snug` | совпадает | все | **нет отклонения** |
| `Heading.tsx` | `level="hero"` | login `text-[2.25rem] leading-[1.05] tracking-[-0.015em]` | совпадает | все | **нет отклонения** |
| `SectionTitle.tsx` | default | делегирует `Heading` `section` | совпадает | все | **нет отклонения** |
| `ContentText.tsx` | `body` / `secondary` / `muted` | `text-base` / `text-ink-2` / `text-sm text-muted` + `font-body` | `font-body` явно на всех tone | все | **нет отклонения** |
| `NumberDisplay.tsx` | `size="score"` | `font-display text-3xl tabular-nums` | совпадает | все | **нет отклонения** |
| `NumberDisplay.tsx` | `size="kpi"` | KPI tile `text-2xl tabular-nums` | совпадает | все | **нет отклонения** |
| `AlertText.tsx` | `tone="error"` | `text-sm` + семантический цвет | `font-body text-sm text-danger`, `role="alert"` | все | **нет отклонения** |
| `Icon.tsx` | default | `size-4`, `stroke-width` 1.75, decorative `aria-hidden` | совпадает | все | **нет отклонения** |
| `.cursor/rules/ui-prototype-fidelity.mdc` (+ tier mirror) | таблица гарнитур | Alegreya / Alegreya Sans / `ui-monospace` | было Source Serif / Manrope — **исправлено** | n/a | **исправлено (док)** |
| `TypeScale.tsx` / `tokens.ts` | Lab L1 | шкала §6 + витрина вариантов атомов | добавлены hero/KPI строки и блок catalog atoms | n/a | **нет отклонения** |

**Вне CU1 (экраны):** потребители `NumberDisplay` с `className` override (`text-5xl`, `text-lg`) — норма до CU4; не менялись в этом шаге.

## Проход 3 — CU2 Shell

**Субагент:** implementer / composer-2.5  
**Эталоны:** прототип `#shell` (`gap-2 lg:gap-4 lg:px-8`, topnav `h-9` / `text-[0.9375rem]`, active `font-bold`, DD `rounded-xl` + shadow-float), [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md)  
**Среда:** `http://localhost:3000`, сессии teacher/admin (`.local/dev-secrets.json`, без логирования учёток)  
**Метод:** Playwright computed styles + slot geometry (`.local/shell-measure-pass3.mjs`); повтор после правок — **без новых deviation-строк**

### Матрица `shell` (после правок)

| Роль | Ширина | Порядок слотов (&lt;lg: menu→brand→hdrRight) | menu по центру | row gap | row padding (L/R) | topnav (≥lg) | active weight | dropdown (≥lg, open) | mobile title |
|------|--------|-----------------------------------------------|----------------|---------|-------------------|--------------|---------------|----------------------|--------------|
| teacher | 390 | menu `left≈9` → brand `64` → hdrRight `228` | нет | `8.5px` (`gap-2`) | `8.5px` / `8.5px` | скрыт | n/a | n/a | `19.125px` / `500` |
| teacher | 768 | `17` → `72` → `598` | нет | `8.5px` | `17px` / `17px` | скрыт | n/a | n/a | `19.125px` / `500` |
| teacher | 820 | `17` → `72` → `650` | нет | `8.5px` | `17px` / `17px` | скрыт | n/a | n/a | `19.125px` / `500` |
| teacher | 1024 | brand `34` → topnav `256` → hdrRight `837`; menu `display:none` | нет | `17px` (`lg:gap-4`) | `34px` / `34px` | `h≈38.25px`, `15.9375px`, active `700` | `700` | `radius≈12.75px` (`rounded-xl`), shadow-float | n/a (brand) |
| admin | 390 | menu `9` → brand `64` → hdrRight `257` | нет | `8.5px` | `8.5px` / `8.5px` | скрыт | n/a | n/a | `19.125px` / `500` |
| admin | 768 | `17` → `72` → hdrRight `647` (было `326` + switcher **425px** до fix) | нет | `8.5px` | `17px` / `17px` | скрыт | n/a | n/a | `19.125px` / `500` |
| admin | 820 | `17` → `72` → hdrRight `699` (switcher убран с `md`) | нет | `8.5px` | `17px` / `17px` | скрыт | n/a | n/a | `19.125px` / `500` |
| admin | 1024 | brand `34` → topnav `256` → hdrRight `565` (+ dev switcher в hdrRight) | нет | `17px` | `34px` / `34px` | `h≈38.25px`, `15.9375px`, active `700` | `700` | `radius≈12.75px`, shadow-float | n/a |

**Общее:** высота шапки `≈61px` (`h-14` + `border-b` при base 17px); drawer не открывался в автомате — layout footer/секций сверен с прототипом в коде (`nav-drawer.tsx`: `h-14` close, `text-xs font-bold` group labels, footer avatar column).

### Исправления в этом проходе

| Файл | Отклонение (до) | После |
|------|-----------------|-------|
| `dev-role-switcher.tsx` | `md:flex` сжимал hdrRight на 768–820 (admin hdrRight ~425px) | `lg:flex` — switcher только с topnav |
| `shell-header.client.tsx` | `backdrop-blur-sm`, без `reduce-transparency:backdrop-blur-none` | как прототип: `backdrop-blur-md` + reduce-transparency pair |
| `user-menu.tsx` | trigger `min-h-11` (44px) vs hdr `h-9` | `h-9` + `text-[0.9375rem]` + `px-1.5 hover:bg-paper` |

**Уже соответствовало (код CU2/CU3):** `shell-header` порядок `NavDrawer` → brand → `ShellNavigation` (только `lg`) → hdrRight; `nav-chrome-classes` (`h-9`, active `font-bold`, `rounded-xl` panel); topnav без `justify-center` на tablet.

**Сознательно не копируем:** иконки в пунктах drawer/topnav; role switcher внутри drawer (продукт — dev-only в hdrRight ≥lg).
