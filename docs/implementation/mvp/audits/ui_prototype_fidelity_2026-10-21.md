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
| `apps/web/src/components/auth/LoginForm.client.tsx` · hero `h1` · `Heading` `level="hero"` · 390, 768, 1024 · **исправлено (CU4)** |
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
| P10-CU4 | реализовано (auth screens: `PageHeader`, `PendingStatusSteps`, `LoginForm` hero) |
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

## Проход 3 — CU3 Primitives

**Субагент:** implementer / composer-2.5  
**Эталоны:** прототип `BTN` (`h-10`), topnav `h-9` / `text-[0.9375rem]`, `H2` / `pageHead` (`mb-5` · `lg:mb-6`), UX-03 §8  
**Среда:** `http://localhost:3000` — `/login`, `/today`, `/lessons` (teacher, `.local/dev-secrets.json`)  
**Метод:** Playwright computed styles (`.local/primitives-measure-pass3.mjs`); повтор после правок

| Файл / узел | Ожидание | До | После (re-pass) | Ширины | Серьёзность |
|-------------|----------|-----|-----------------|--------|-------------|
| `button.tsx` `size="default"` | `h-10` (~42.5px @ 17px base) | совпадало | совпадало (`PageHeader` CTA на `/lessons`) | 390, 1024 | **нет отклонения** |
| `button.tsx` `size="nav"` | topnav `h-9` (~38.25px), не `text-sm` | дублирование в `nav-chrome-classes` | вариант `nav` + `SHELL_TOPNAV_TRIGGER` через `buttonVariants` | 1024 | **исправлено** |
| `button.tsx` vs shell | primary CTA ≠ nav chrome | `sm` = `h-9` + `text-sm` путали с nav | `nav` отдельно от `sm` | 1024 | **исправлено (каталог)** |
| `card.tsx` `CardTitle` | `text-[1.25rem]` как `H2` / `SectionTitle` | `text-lg` → ~19.1px | ~21.25px (= section `h2` на `/today`) | 390, 1024 | **исправлено** |
| `PageHeader.tsx` | `mb-5` / `lg:mb-6` как `pageHead` | совпадало | `marginBottom` 21.25px / 25.5px на `/today`, `/lessons` | 390, 1024 | **нет отклонения** |
| `nav-link-row.tsx` / `top-nav.tsx` | topnav через shared chrome | уже `shellTopNavTriggerClass` | без смены поведения; метрики topnav `h≈38.3px`, `15.9375px` | 1024 | **нет отклонения** |
| `PatternsGallery.tsx` / `matrices.ts` | Lab: `nav` size + CardTitle parity | не было | `BUTTON_SIZES` + блок CardTitle vs `SectionTitle` | n/a | **нет отклонения** |
| `/login` submit | отдельный паттерн | `h-12` (`FORM_SUBMIT_BUTTON_CLASS`) | без изменений (не `Button` default) | 390 | **сознательно** |

**Re-pass:** topnav и section `h2` на teacher matrix — в пределах прототипа; новых deviation-строк нет.

## Проход 3 — CU4 Auth screens

**Субагент:** implementer / composer-2.5  
**Эталоны:** прототип `#screen-login`, `vRegister`, `vPending`, `pageHead` · access spec §6–§10 · `PageHeader` / `Heading` hero  
**Ширины:** 390, 768, 820, 1024 (классы width-agnostic; `/login` без сессии — все ширины; register/pending — layout reading `max-w-2xl`)

| Ключ / файл | Узел | Ожидание (прототип / UX-03) | Факт (после CU4) | Ширины | Серьёзность |
|-------------|------|----------------------------|------------------|--------|-------------|
| `login` · `LoginForm.client.tsx` | hero `h1` | `text-[2.25rem]` display | `Heading` `level="hero"` | 390–1024 | **нет отклонения** |
| `login` · `LoginForm` | brand row | `font-display text-2xl` | совпадает | 390–1024 | **нет отклонения** |
| `login` · `ProviderButton` | Telegram CTA | `h-12` submit (не `Button` default) | `FORM_SUBMIT_BUTTON_CLASS` | 390 | **сознательно** |
| `register` · `register/page.tsx` | заголовок | `pageHead` → `h1` page scale + `mb-5`/`lg:mb-6` | `PageHeader` | 390–1024 | **нет отклонения** |
| `register` · `RegisterForm` | карточки шагов | `CARD` `rounded-xl` `p-4 sm:p-5` | `border-line bg-surface` | 390–1024 | **нет отклонения** |
| `register` · footer actions | ghost + primary | `flex-col-reverse` / `sm:ml-auto` | совпадает | 390, 768 | **нет отклонения** |
| `pending` · `pending/page.tsx` | заголовок | `pageHead` + subtitle ФИО·дата | `PageHeader` + description | 390–1024 | **нет отклонения** |
| `pending` · `PendingStatusSteps` | список шагов | `ol` `space-y-5`, иконки ok/cobalt/muted | `CheckCircle`/`KeyRound`/`Circle` + `font-medium` | 390–1024 | **нет отклонения** |
| `pending` · rejected | карточка причины | `CARD` + border-t actions | section `rounded-xl` + `border-t` | 390–1024 | **нет отклонения** |
| `privacy` · `privacy/page.tsx` | заголовок | `pageHead` + версия | `PageHeader` + version description | 390–1024 | **нет отклонения** |

**Re-pass:** повтор по матрице auth не добавил новых deviation-строк; копирайт P09 и ссылка согласия на `/login` не менялись.

## Проход 4 — CU5 Profile screen

**Субагент:** implementer / composer-2.5  
**Эталоны:** прототип `vProfile` · access spec §9  
**Ширины:** 390, 768, 820, 1024 · роли: teacher, admin (ACTIVE)

| Ключ / файл | Узел | Ожидание (прототип / UX-03) | Факт (после CU5) | Ширины | Серьёзность |
|-------------|------|----------------------------|------------------|--------|-------------|
| `profile` · `page.tsx` | сетка | `max-w-5xl` `lg:grid-cols-2` `gap-4`, удаление `lg:col-span-2` | совпадает | 390–1024 | **нет отклонения** |
| `profile` · `ProfileNameForm` | ФИО | `sm:grid-cols-2`, отчество optional + `col-span-2` | совпадает | 390–1024 | **нет отклонения** |
| `profile` · `page.tsx` | роли/язык | в карточке ФИО, `text-sm text-ink-2` | `metaLines` в форме | 390–1024 | **нет отклонения** |
| `profile` · `LinkedIdentityRow` | способы входа | `divide-y`, outline «Подключить», ok-status | `ul divide-line`, `variant outline`, `StatusText` | 390–1024 | **нет отклонения** |
| `profile` · `page.tsx` | согласие + выход | в карточке входов, ghost «Выйти» | consent + `AuthSignOutLink` ghost | 390–1024 | **нет отклонения** |
| `profile` · `ProfileDeletionPanel` | удаление | danger CTA; P09 диалог/причина | без изменения мутаций | 390–1024 | **сознательно** (P09) |

**Re-pass:** матрица `profile` × ACTIVE teacher/admin × 4 ширины — новых deviation-строк нет; логика CTA/link/unlink/delete не менялась.

## Проход 5 — CU6 Today screen

**Субагент:** implementer / composer-2.5  
**Эталоны:** прототип `vToday` · P03 `/today`  
**Ширины:** 390, 768, 820, 1024 · роль: teacher (ACTIVE)

| Ключ / файл | Узел | Ожидание (прототип / UX-03) | Факт (после CU6) | Ширины | Серьёзность |
|-------------|------|----------------------------|------------------|--------|-------------|
| `today` · `page.tsx` | сетка фокуса | `grid gap-4 lg:gap-5`, неделя `mt-6` | совпадает | 390–1024 | **нет отклонения** |
| `today` · `TodayLessonCard` | карточка урока | `p-4 sm:p-5`, подпись muted, `mt-5` блоки | совпадает | 390–1024 | **нет отклонения** |
| `today` · `TodayLessonCard` | счётчик | `N из M`, progress, primary + ghost CTA | совпадает | 390–1024 | **нет отклонения** |
| `today` · `TodayWeekSection` | неделя | `H2 mb-3`, `dl` divide-y, `px-5 py-4` | совпадает | 390–1024 | **нет отклонения** |
| `today` · `page.tsx` | «Кого отметить» | второй столбец `vToday` | нет (P09 scope) | 390–1024 | **сознательно** (P09) |

**Re-pass:** матрица `today` × teacher × 4 ширины — новых deviation-строк нет; секция достижений и «Голосовая практика» не добавлялись (P09).

## Проход 5 — CU7 Lessons list

**Субагент:** implementer / composer-2.5  
**Эталоны:** прототип `vLessons` · P03 `/lessons`  
**Ширины:** 390, 768, 820, 1024 · роль: teacher (ACTIVE)

| Ключ / файл | Узел | Ожидание (прототип / UX-03) | Факт (после CU7) | Ширины | Серьёзность |
|-------------|------|----------------------------|------------------|--------|-------------|
| `lessons` · `page.tsx` | список `ol` | `CARD` divide-y, `rounded-xl` border | `ol` `rounded-xl border-line bg-surface divide-y` | 390–1024 | **нет отклонения** |
| `lessons` · `LessonListRow.tsx` | сетка строки | `px-5 py-4`, `sm:grid-cols-[4.5rem_…]`, hover `bg-paper/70` | совпадает | 390–1024 | **нет отклонения** |
| `lessons` · `LessonListRow.tsx` | дата / номер | `font-display text-2xl` + «урок N» muted | `NumberDisplay` `size="kpi"` + `listOrdinalShort` | 390–1024 | **нет отклонения** |
| `lessons` · `LessonListRow.tsx` | тема / стихи | title + стихи или subline обзорного | title, badge обзорного, `verseRefsLabel` / review subline | 390–1024 | **нет отклонения** |
| `lessons` · `LessonListRow.tsx` | статус проверки | `Проверено n/n` + chevron | `StatusText` + `listCheckFraction` + `ChevronRightIcon` | 390–1024 | **нет отклонения** |
| `lessons` · `format-lesson-display-date.ts` | краткая дата | `l.d` как `dd.MM` | `2-digit` day/month | 390–1024 | **нет отклонения** |

**Re-pass:** матрица `lessons` × teacher × 4 ширины — новых deviation-строк нет; подсветка drawer «Все уроки» — shell (CU2), не строка списка.

## Проход 6 — CU8 Lesson card and form

**Субагент:** implementer / composer-2.5  
**Эталоны:** прототип `vLesson` · `vLessonForm` · P03 lesson / lessonForm  
**Ширины:** 390, 768, 820, 1024 · роль: teacher (ACTIVE)

| Ключ / файл | Узел | Ожидание (прототип / UX-03) | Факт (после CU8) | Ширины | Серьёзность |
|-------------|------|----------------------------|------------------|--------|-------------|
| `lesson` · `page.tsx` | шапка | back «Все уроки», подпись группы · год | back link, затем subtitle | 390–1024 | **нет отклонения** |
| `lesson` · `LessonCard.tsx` | hero-карточка | meta muted, H1 тема, icon edit/delete | flex header, `Heading` page, `PencilIcon` / `XIcon` | 390–1024 | **нет отклонения** |
| `lesson` · `LessonCard.tsx` | проверка ДЗ | progress, primary/outline CTA, «Сводная таблица» | `Progress`, variant по завершению, outline table | 390–1024 | **нет отклонения** |
| `lesson` · `LessonDetailVersePanel.tsx` | стихи | `ol` space-y-2.5, italic `font-display` текст | совпадает | 390–1024 | **нет отклонения** |
| `lessonForm` · `LessonForm.tsx` | сетка | `max-w-5xl`, `lg:grid-cols-[1fr_22rem]`, `p-4 sm:p-5` | совпадает | 390–1024 | **нет отклонения** |
| `lessonForm` · `LessonForm.tsx` | номер / тип | `h-11` номер, locked kind в `bg-paper` | совпадает | 390–1024 | **нет отклонения** |
| `lessonForm` · `LessonForm.tsx` | обзорный блок | bullets с «—», `SectionTitle` | совпадает | 390–1024 | **нет отклонения** |
| `lessonForm` · `new`/`edit` `page.tsx` | заголовок | PageHeader + back link cobalt | `PageHeader` + `CustomLink` | 390–1024 | **нет отклонения** |

**Re-pass:** матрица `lesson` + `lessonForm` × teacher × 4 ширины — новых deviation-строк нет; чекбокс «календарь» и rich-text план — post-MVP / Switch «тест» (продукт), не визуал CU8.

## Проход 7 — CU9 Check and lesson table

**Дата:** 2026-10-21 · **Субагент:** implementer · **Модель:** composer-2.5  
**Эталоны:** прототип `vCheck` · `vLessonTable` · [`homework_check_flow_spec`](../specs/homework_check_flow_spec.md)

| Ключ / файл | Узел | Ожидание (прототип / UX-03) | Факт (после CU9) | Ширины | Серьёзность |
|-------------|------|----------------------------|------------------|--------|-------------|
| `check` · `check-screen.client.tsx` | шапка | back «К уроку», H1, строка урока с датой, outline «Сводная таблица» + иконка | back link, `PageHeader`, дата в meta, `LayoutGridIcon` | 390–1024 | **нет отклонения** |
| `check` · `CheckProgress.tsx` | прогресс | полоса + счётчик справа | `mb-4 flex` meter + `checked / total` | 390–1024 | **нет отклонения** |
| `check` · `CheckCardHeader.tsx` | ФИО ученика | `h2` ~1.5rem, баллы 1.75rem | `Heading` section + `text-[1.5rem]`, `NumberDisplay` 1.75rem | 390–1024 | **нет отклонения** |
| `check` · layout | сетка | `lg:grid-cols-[16rem_…]`, mobile details, fixed bar | совпадает со spec §5.1 | 390–1024 | **нет отклонения** |
| `lessonTable` · `LessonCheckTable.tsx` | шапка | back «К уроку», H1 таблица, primary «Последовательная проверка» | back link, `PageHeader`, primary CTA с `CheckIcon` | 390–1024 | **нет отклонения** |
| `lessonTable` · `LessonCheckTableRow.tsx` | score select | `h-8 rounded-md` | совпадает | 390–1024 | **нет отклонения** |
| `lessonTable` · mobile cards | карточки `< md` | divide, warn/paper row tone | `ul` + grid полей | 390–1024 | **нет отклонения** |

**Re-pass:** матрица `check` + `lessonTable` × teacher × 4 ширины — новых deviation-строк нет; RSC-сериализация `TeacherCheckMessages` — строки + `fillMessage` на клиенте (не визуал CU9).

## Проход 8 — CU10 Teacher group roster

**Дата:** 2026-10-21 · **Субагент:** implementer · **Модель:** composer-2.5  
**Эталоны:** прототип `vGroup` · `groupYearSummary` · [`analytics_screens_spec`](../specs/analytics_screens_spec.md) §5.6  
**Ширины:** 390, 768, 820, 1024 · роль: teacher (ACTIVE)

| Ключ / файл | Узел | Ожидание (прототип / UX-03) | Факт (после CU10) | Ширины | Серьёзность |
|-------------|------|----------------------------|------------------|--------|-------------|
| `group` · `page.tsx` | шапка | H1 «Моя группа», подпись группа · возраст · N учеников | `PageHeader` title + `pageSubtitle` fillMessage | 390–1024 | **нет отклонения** |
| `group` · `GroupYearSummarySection.tsx` | итоги года | `mb-6`, H2 «Итоги года · {год}», outline «Все годы» + chevron, `kpiTiles` | `SectionTitle` h2, `KpiTiles`, `size="sm"` link + `ChevronRightIcon` | 390–1024 | **нет отклонения** |
| `group` · `KpiTiles.tsx` | KPI | `grid-cols-2 sm:grid-cols-4`, label `text-sm`, display `text-2xl` | совпадает | 390–1024 | **нет отклонения** |
| `group` · `RosterTable.tsx` | карточка состава | `CARD` rounded-xl, toolbar `px-5 py-3`, строки `flex items-center gap-3` | `bg-surface` border, `px-5`, destructive exclude | 390–1024 | **нет отклонения** |
| `group` · `RosterTable.tsx` | подсказка | `mt-3 text-sm text-muted` вне карточки | `unenrollHint` под карточкой | 390–1024 | **нет отклонения** |

**Re-pass:** матрица `group` × teacher × 4 ширины — новых deviation-строк нет; CTA «Добавить учеников» в шапке прототипа заменён формой внизу карточки (P09); статус согласия вместо явки/слоя B/D — продукт (СО-4), не визуал CU10.

## Проход 9 — CU11 Bricks and calendar

**Дата:** 2026-10-21 · **Субагент:** implementer · **Модель:** composer-2.5  
**Эталоны:** прототип `vBricks` · `vCalendar` · P03 `/calendar` · P05 bricks  
**Ширины:** 390, 768, 820, 1024 · роли: teacher, admin

| Ключ / файл | Узел | Ожидание (прототип / UX-03) | Факт (после CU11) | Ширины | Серьёзность |
|-------------|------|----------------------------|-------------------|--------|-------------|
| `bricks` · `page.tsx` | шапка | H1 «Кирпичики», подпись группа · год | `PageHeader` + `pageSubtitle` | 390–1024 | **нет отклонения** |
| `bricks` · `BricksPageSummary.tsx` | сводка | правило 1:1, «К выдаче», минус | `summaryRule` / `summaryToIssue` / `summaryNegative` | 390–1024 | **нет отклонения** |
| `bricks` · `BalanceTable.tsx` | баланс | cobalt имя, bold числа, ring при минусе | `text-cobalt-ink`, `font-bold`, `ring-danger/40` | 390–1024 | **нет отклонения** |
| `bricks` · `BalanceTable.tsx` | layout | карточки `xl:grid-cols-2` | таблица + журнал + диалоги | 390–1024 | **продукт (P05)**, не визуал CU11 |
| `calendar` · `page.tsx` | шапка | prev/next + primary «Событие» | `PageHeader` actions: icon outline + primary | 390–1024 | **нет отклонения** |
| `calendar` · `CalendarMonth.tsx` | сетка | `xl:grid-cols-[1.6fr_1fr]`, ячейки `min-h-14 sm:min-h-24` | совпадает | 390–1024 | **нет отклонения** |
| `calendar` · `CalendarMonth.tsx` | легенда | типы под сеткой `text-sm text-ink-2` | иконки + подписи урок/выезд/отмена | 390–1024 | **нет отклонения** |
| `calendar` · `page.tsx` | заголовок | H1 = месяц · год | H1 «Календарь», группа в subtitle | 390–1024 | **продукт**, не визуал CU11 |

**Re-pass:** матрица `bricks` + `calendar` × teacher + admin × 4 ширины — новых deviation-строк нет; карточки кирпичиков vs таблица и Sheet формы — P05 UX, не P10 chrome.

## Проход 10 — CU12 Rating and verses

**Дата:** 2026-10-21 · **Субагент:** implementer · **Модель:** composer-2.5  
**Эталоны:** прототип `vRating` · `vVerses` · P05  
**Ширины:** 390, 768, 820, 1024 · роли: teacher, admin

| Ключ / файл | Узел | Ожидание (прототип / UX-03) | Факт (после CU12) | Ширины | Серьёзность |
|-------------|------|----------------------------|-------------------|--------|-------------|
| `rating` · `page.tsx` | шапка | H1 «Рейтинг группы» / «Рейтинг», описание инструмента | `PageHeader` title + `pageDescription` | 390–1024 | **нет отклонения** |
| `rating` · `page.tsx` | приватность | lock + `text-sm text-ink-2` | `LockIcon` + `ContentText` | 390–1024 | **нет отклонения** |
| `rating` · `page.tsx` | scope admin | чипы группа/школа + классы | `CustomLink` chips `h-11`, `border-line-strong` active | 390–1024 | **нет отклонения** (touch ≥44px) |
| `rating` · `RatingTable.tsx` | таблица | `min-w-[34rem]`, thead muted, px-5/py-3, top-3 place | совпадает + `tableCaption` sr-only | 390–1024 | **нет отклонения** |
| `rating` · `RatingTable.tsx` | колонки | бонус / достижения / штрафы | три колонки MVP | 390–1024 | **продукт (P05)**, не визуал CU12 |
| `verses` · `page.tsx` | шапка | H1, описание библиотеки, outline «Добавить стих» | `PageHeader` + `VersesAddVerseDialog` outline | 390–1024 | **нет отклонения** |
| `verses` · `VersesCatalog.client.tsx` | поиск | `max-w-xl`, icon left, `pl-10` | совпадает | 390–1024 | **нет отклонения** |
| `verses` · `VersesCatalog.client.tsx` | строка | grid ref / italic text / «Уроки:» или «Не использован» | `px-5`, `font-display` italic, inline links | 390–1024 | **нет отклонения** |

**Re-pass:** матрица `rating` + `verses` × teacher + admin × 4 ширины — новых deviation-строк нет; упрощённая таблица рейтинга и ссылки «Урок N» при заголовке-заглушке — P05 данные/копирайт, не P10 chrome.

## Проход 11 — CU13 Group analytics

**Дата:** 2026-10-21 · **Субагент:** implementer · **Модель:** composer-2.5
**Эталоны:** прототип `vAnalytics` · [`analytics_screens_spec`](../specs/analytics_screens_spec.md) §5
**Ширины:** 390, 768, 820, 1024 · роли: teacher, admin

| Ключ / файл | Узел | Ожидание (прототип / UX-03) | Факт (после CU13) | Ширины | Серьёзность |
|-------------|------|----------------------------|-------------------|--------|-------------|
| `analytics` · `page.tsx` | контейнер | без page-level horizontal scroll | `min-w-0 max-w-full overflow-x-hidden` | 390–1024 | **нет отклонения** |
| `analytics` · `AnalyticsPeriodKpiSection.tsx` | главная цифра | `font-display` ~3.5rem | `NumberDisplay` `text-[3.5rem]` + KPI row `lg:grid` | 390–1024 | **нет отклонения** |
| `analytics` · `KpiTiles.tsx` | итоги года | `text-2xl`, label `text-sm` | `NumberDisplay size="kpi"`, `text-muted` | 390–1024 | **нет отклонения** |
| `analytics` · `YearStrip` / chips | touch | кнопки ≥44px | `min-h-11`, period chips `h-11` | 390–1024 | **нет отклонения** |
| `analytics` · `GroupAnalyticsTables.tsx` | таблицы | `overflow-x-auto`, thead muted, px-5/py-3 | min-w 36–40rem, RatingTable-паттерн | 390–1024 | **нет отклонения** |
| `analytics` · `ChartTableToggle.tsx` | графики | CARD `p-5`, H3 `text-lg` | `sm:p-5`, `SectionTitle` lg | 390–1024 | **нет отклонения** |
| `analytics` · `ConductedLessonsTable.tsx` | учителя | min-w 40rem, caption sr-only | совпадает + `table_caption` | 390–1024 | **нет отклонения** |
| `analytics` · `MethodologyNote.tsx` | методология | `mt-8`, border-t | совпадает | 390–1024 | **нет отклонения** |

**Re-pass:** матрица `analytics` × teacher + admin × 4 ширины — новых deviation-строк нет; ссылки на уроки в колонке «Уроки» — ordinals без deep link (P08), не P10 chrome.

## Проход 12 — CU14 Pupil analytics

**Дата:** 2026-10-21 · **Субагент:** implementer · **Модель:** composer-2.5
**Эталоны:** прототип `vPupil` · [`analytics_screens_spec`](../specs/analytics_screens_spec.md) §6
**Ширины:** 390, 768, 820, 1024 · роли: teacher, admin

| Ключ / файл | Узел | Ожидание (прототип / UX-03) | Факт (после CU14) | Ширины | Серьёзность |
|-------------|------|----------------------------|-------------------|--------|-------------|
| `pupil` · `page.tsx` | контейнер | без page-level horizontal scroll | `min-w-0 max-w-full overflow-x-hidden` | 390–1024 | **нет отклонения** |
| `pupil` · `PupilAnalyticsKpiSection.tsx` | KPI | `text-sm text-muted`, `font-display text-2xl` | `NumberDisplay size="kpi"`, equal-height grid | 390–1024 | **нет отклонения** |
| `pupil` · `PupilYearsRowsTable.tsx` | «По годам» | min-w 44rem, thead muted, px-5/py-3 | RatingTable-паттерн CU13 | 390–1024 | **нет отклонения** |
| `pupil` · `PupilYearsMetricPanel` | график лет | CARD `p-5`, seg `min-h-11` | `sm:p-5`, toggle `h-11` | 390–1024 | **нет отклонения** |
| `pupil` · `PupilClosedYearKpiTiles` | закрытый год | dl tiles `text-2xl` | `NumberDisplay size="kpi"`, `text-muted` labels | 390–1024 | **нет отклонения** |
| `pupil` · `PupilLessonTable.tsx` | по урокам | min-w 44rem, thead muted | совпадает + `hover:bg-transparent` | 390–1024 | **нет отклонения** |
| `pupil` · `DynamicsBlock.tsx` | динамика | CARD `p-4 sm:p-5`, H2 `text-lg` | без изменений CU14 (уже совпадает) | 390–1024 | **нет отклонения** |

**Re-pass:** матрица `pupil` × teacher + admin × 4 ширины — новых deviation-строк нет; штрафы/достижения из прототипа вне MVP (spec §6).

## Проход 13 — CU15 School summary

**Дата:** 2026-10-21 · **Субагент:** implementer · **Модель:** composer-2.5
**Эталоны:** прототип `vSchool` · [`analytics_screens_spec`](../specs/analytics_screens_spec.md) §7

| Ключ / файл | Узел | Ожидание (прототип / UX-03) | Факт (после CU15) | Ширины | Серьёзность |
|-------------|------|----------------------------|-------------------|--------|-------------|
| `school` · `page.tsx` | контейнер | без page-level horizontal scroll | `min-w-0 max-w-full overflow-x-hidden` | 390–1024 | **нет отклонения** |
| `school` · `SchoolGroupsTable.tsx` | таблица групп | CARD, `min-w-[46rem]`, meter + %, hint снизу | sr-only caption, thead muted, progressbar, hint под таблицей | 390–1024 | **нет отклонения** |
| `school` · `page.tsx` | график | CARD `p-4 sm:p-5`, H2 `text-lg`, `mt-8` | `mt-4` внутри card, `sm:p-5`, hint `text-ink-2` | 390–1024 | **нет отклонения** |
| `school` · `SchoolAttentionList.tsx` | внимание | CARD rows, status + chevron, `hover:bg-paper/70` | `StatusText`, `ChevronRight`, `mt-8` | 390–1024 | **нет отклонения** |
| `school` · `SchoolClosedGroupsTable.tsx` | закрытый год | таблица как `schoolClosedBlock` | `p-0` card, `min-w-[46rem]` (без изменений логики) | 390–1024 | **нет отклонения** |

**Re-pass:** матрица `school` × admin × 390, 768, 820, 1024 — новых deviation-строк нет.

## Проход 14 — CU16 Admin access screens

**Дата:** 2026-10-21 · **Субагент:** implementer · **Модель:** composer-2.5
**Эталоны:** прототип `vApprovals` / `vUsers` / `vUserProfile` · [`access_requests_and_roles_contract.md`](../contracts/access_requests_and_roles_contract.md)

| Ключ / файл | Узел | Ожидание (прототип / UX-03) | Факт (после CU16) | Ширины | Серьёзность |
|-------------|------|----------------------------|-------------------|--------|-------------|
| `approvals` · `page.tsx` | контейнер | subtitle + footer note, `space-y-3` | `PageHeader` + `overflow-x-hidden`, footer `text-sm text-muted` | 390–1024 | **нет отклонения** |
| `approvals` · `ApprovalRow.tsx` | карточка заявки | CARD grid `sm:p-5`, cobalt name, meta `text-ink-2` | grid `1.3fr/1fr/auto`, `text-cobalt-ink` title | 390–1024 | **нет отклонения** |
| `users` · `UsersStatusFilter.tsx` | вкладки | `border-b`, `h-11`, counts | tablist как `/deletions`, registration/rejected | 390–1024 | **нет отклонения** |
| `users` · `UserRow.tsx` | строка | `px-5 py-4`, chevron, `hover:bg-paper/70` | grid + `ChevronRight`, `StatusText` | 390–1024 | **нет отклонения** |
| `userProfile` · `page.tsx` | сетка | `lg:grid-cols-2`, CARD sections | двухколоночный layout `FormSection` | 390–1024 | **нет отклонения** |

**Re-pass:** матрица `approvals`, `users`, `userProfile` × admin × 390, 768, 820, 1024 — новых deviation-строк нет; expand-in-row на `/approvals` вне MVP (диалоги одобрения/отклонения).
