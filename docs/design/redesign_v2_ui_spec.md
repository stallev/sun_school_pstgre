# Redesign v2 UI spec — что и в каком компоненте менять

**Тип:** UX Spec  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-24  
**Волна:** W12-02 (P14)  
**Зависит от:** [`adr_014_app_redesign_v2.md`](../prds/07_governance/adr_014_app_redesign_v2.md) (R-1…R-12), [`visual_identity_contract.md`](./visual_identity_contract.md) (UX-03 v2.0), [`responsive_navigation_contract.md`](./responsive_navigation_contract.md) (UX-02 v2.0), [`forms_and_validation_ux.md`](./forms_and_validation_ux.md) (F9, F13, F14), [`typography_text_guidelines.md`](../guidelines/typography_text_guidelines.md), [`global_shell_spec.md`](../implementation/mvp/specs/global_shell_spec.md), [`design_system_lab_spec.md`](../implementation/mvp/specs/design_system_lab_spec.md), [`prototype_class_parity_spec.md`](../implementation/mvp/specs/prototype_class_parity_spec.md), [`ui_redesign_audit_2026-10-24.md`](../implementation/mvp/audits/ui_redesign_audit_2026-10-24.md)  
**Связанные документы:** [`sunday_school_prototype.html`](../prototypes/sunday_school_prototype.html), [`prototype_route_mapping.md`](./prototype_route_mapping.md), [`P14_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P14_phase_description.md), [`P14_tasks.md`](../implementation/mvp/tasks/P14_tasks.md), [`architecture_master_index.md`](../prds/architecture_master_index.md)  
**Проверено по:** состояние `apps/web/src` на 2026-10-24 (чтение файлов, перечисленных в §3); Tailwind CSS v4 (шкала `text-*`, `h-*`, `max-w-*` — tailwindcss.com/docs); Base UI `Select`, `Checkbox`, `Popover` (`@base-ui/react`, версия в `apps/web/package.json`); `next/font/google` — `Alegreya`, `Source_Sans_3`. Размеры в px — при `html { font-size: 112.5% }` (18 px). Context7 недоступен.

---

## 1. Purpose

Один документ, по которому исполнитель P14 за один проход находит **файл**, **текущие классы**, **целевые классы**, **прототипный эталон** и **экраны-потребители** для каждого изменения редизайна. Решения (что и почему) — в [ADR-014](../prds/07_governance/adr_014_app_redesign_v2.md) и UX-03 v2.0; здесь — «где и как».

## 2. Scope / Out of scope

**В scope:** токены, шрифты, примитивы `components/ui`, оболочка `components/shell`, паттерны, экранные компоненты `components/{analytics,teacher,admin}`, страницы `app/**/page.tsx`, строки словарей `lib/messages` для исправления копирайта.  
**Вне scope:** палитра (UX-03 §4), радиусы, глубина, маршруты, права, модель данных, логика мутаций, Zod-схемы, тёмная тема.

## 3. Компонентная матрица

Условные обозначения: **P-NN** — строка [`prototype_class_parity_spec.md`](../implementation/mvp/specs/prototype_class_parity_spec.md) §7; **R-N** — решение ADR-014; **CU** — commit unit [`P14_tasks.md`](../implementation/mvp/tasks/P14_tasks.md).

### 3.1 Токены и шрифты (P14-CU1)

| Файл | Сейчас | Нужно | Эталон | R |
|------|--------|-------|--------|---|
| `apps/web/src/app/layout.tsx` | `next/font/google`: `Alegreya`, `Alegreya_Sans` (400/500/700), переменные `--font-alegreya`, `--font-alegreya-sans`; классы на `<html>` | Убрать `Alegreya_Sans`; добавить `Source_Sans_3` (`weight: ["400","500","600","700"]`, `subsets: ["latin","cyrillic"]`, `display: "swap"`, `variable: "--font-source-sans"`); `Alegreya` — `weight: ["500","700"]` + `style: ["normal","italic"]` для курсива 400 (`weight` курсива — отдельный запрос: `Alegreya({ style: "italic", weight: "400" })` либо общий набор `["400","500","700"]`) | P-39 | R-1 |
| `apps/web/src/app/globals.css` L121–124 | `--font-display: var(--font-alegreya)`, `--font-sans`/`--font-body`/`--font-heading` → `--font-alegreya-sans` | `--font-body`, `--font-sans` → `var(--font-source-sans)`; `--font-display` и `--font-heading` без изменений | P-39 | R-1 |
| `globals.css` L139 | `html { font-size: 106.25% }` | `html { font-size: 112.5% }`; тот же блок `@layer base`: `body { line-height: 1.5 }` если ещё не задан | P-38 | R-2 |
| `globals.css` (новое, `:root` или `@theme inline`) | нет | `--control-h: 2.5rem; --control-h-compact: 2.25rem; --control-h-touch: 2.75rem` | P-40 | R-6 |
| `globals.css` `@layer base` | нет правила для `main` | `main:focus:not(:focus-visible) { outline: none; }` | P-37 | R-9 |
| `apps/web/src/lib/design-lab/tokens.ts` `TYPE_SCALE` (L88), `SHAPES` (L99) | 17 px, `text-[0.9375rem]`, `h-10` | Переписать под таблицу UX-03 §6 (18 / 15.75 / 13.5; h1 31.5 → 38.25; кнопка `text-base`) и D-9 | UX-03 §6, §7 | R-2, R-6 |

Проверка CU1: `grep -R "Alegreya_Sans\|Alegreya Sans" apps/web/src` пуст; `getComputedStyle(document.documentElement).fontSize === "18px"`; `getComputedStyle(document.body).fontFamily` начинается с `"Source Sans 3"`.

### 3.2 Примитивы `components/ui` (P14-CU2, CU3)

| Файл | Сейчас | Нужно | Эталон | R |
|------|--------|-------|--------|---|
| `ui/button.tsx` | база `text-[0.9375rem]`; размеры `default h-10 px-4`, `nav h-9 px-3`, `sm h-9 px-3 text-sm`, `lg h-11 px-5`, `icon size-10`, `icon-sm size-9`, `icon-lg size-11` | База `text-base`. Размеры: `default h-10 px-3.5`; `compact h-9 px-3` (взамен `sm`; `text-sm` убрать); `touch h-11 px-5` (взамен `lg`); `icon size-10`; `icon-compact size-9`; `icon-touch size-11`. Размер `nav` удалить вместе с top-nav (CU4). Вариант `destructive-solid` — только `ConfirmDialog`: lint-правило `no-restricted-syntax` или комментарий JSDoc; потребители `variant="destructive-solid"` вне диалога заменить на `destructive` | P-01…P-07 | R-3, R-6, R-11 |
| `ui/input.tsx` | `h-10 w-full max-w-sm … border-input … text-base … focus-visible:border-cobalt-ink`; `file:h-7 file:text-sm` | Без изменений по высоте и кеглю (уже соответствует FIELD); `file:text-sm` → `file:text-base`; убедиться, что `py-1` не меняет высоту | P-10 | R-3, R-6 |
| `ui/textarea.tsx` | `min-h-16 … text-base` | Без изменений; `border-input`, `focus-visible:border-cobalt-ink` как у `Input` | P-10 | R-3 |
| `ui/label.tsx` | `flex items-center gap-2 text-sm leading-none font-medium` | `text-base font-medium` (убрать `text-sm`, `leading-none` → `leading-normal`); `mb-1.5` задаёт `Field` | P-13 | R-3 |
| `ui/field.tsx` | `FieldLabel` `text-sm`, `FieldLegend` `text-base`, `FieldError` `text-sm` | `FieldLabel` → `text-base font-medium`; `FieldDescription`, `FieldError` остаются `text-sm` (подсказка, пол 15.75) | P-13 | R-3 |
| `ui/select.tsx` | `SelectTrigger`: `w-fit … text-sm … data-[size=default]:h-10 data-[size=sm]:h-8 py-2 pr-2 pl-2.5`; `SelectItem`: `rounded-sm py-1.5 pr-8 pl-2 text-sm`; `SelectLabel`: `text-xs`; `SelectContent`: `rounded-md … shadow-float` | Триггер: `w-full`, `h-10` (`data-[size=compact]:h-9`, вместо `sm:h-8`), `px-3`, `text-base`, убрать `py-2 pr-2 pl-2.5`, `gap-2`; `max-w-sm` задаёт потребитель. Пункт: `min-h-10 rounded-lg px-2.5 pr-9 text-base`; выбранный — `bg-cobalt-soft text-cobalt-ink`. `SelectLabel` → `text-sm`. Панель: `rounded-xl border border-line bg-surface shadow-float p-1.5`. Проп `name` на `Select.Root` обязателен для form-submit (Base UI создаёт скрытый input) | P-11, P-12 | R-3, R-6, R-7 |
| `ui/checkbox.tsx` | `size-4 rounded-[4px] border-input`; индикатор `size-3.5`; `data-checked:border-primary data-checked:bg-primary` | `size-5 rounded border-input`; индикатор `size-4`; сохранить `after:-inset-x-3 after:-inset-y-2` (область касания ≥ 44 px); подпись рядом — `Field` + `Label` (`text-base`) | P-17 | R-3, R-7 |
| `ui/radio-group.tsx` | `size-4` | `size-5`; подпись `text-base` | P-17 | R-3 |
| `ui/switch.tsx` | размеры default/sm | Без смены размеров; убедиться, что подпись рядом `text-base` | P-18 | R-3 |
| `ui/segmented-control.tsx` | кнопка: `min-h-11 min-w-11 … text-[0.9375rem] font-medium hover:bg-paper`; выбранный `border-cobalt-ink bg-cobalt-soft text-cobalt-ink`; невыбранный `border-input` | `text-[0.9375rem]` → `text-base`; высота `h-10` (проп `size="compact"` → `h-9`); невыбранный `hover:border-ink-2` вместо `hover:bg-paper`; выбранный `font-bold`; новые пропсы: `mode: "radio" \| "toggle"` (в `toggle`: `role="button"` + `aria-pressed`, без roving-tabindex, независимые чипы) и `size`; контейнер `flex flex-wrap gap-2` без изменений. `min-w-11` оставить (цель касания) | P-14…P-16 | R-3, R-5, R-6 |
| `ui/score-pad.tsx`, `ui/score-cell.tsx`, `ui/score-selector.tsx` | `min-h-11 min-w-11 px-3 text-[0.9375rem]`, выбранный `border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink` | `text-[0.9375rem]` → `text-base`; остальное по parity (выбранный уже по D-10) | P-14 | R-3 |
| `ui/toggle.tsx`, `ui/toggle-group.tsx` | `h-9/h-8/h-10`, `text-sm`, `aria-pressed:bg-line` | Использовать только вне экранов (внутри `SegmentedControl mode="toggle"` вместо них); если импортов в продукте нет — удалить из каталога и Lab | — | R-5 |
| `ui/badge.tsx` | `h-5 … px-2 py-0.5 text-xs` | Без изменений: единственное разрешённое `text-xs` (13.5 px) | P-29 | R-2 |
| `ui/count-badge.tsx` | `text-xs` | Без изменений; фон `bg-cobalt-ink` (не `bg-cobalt`), текст `text-surface` | P-28 | R-2 |
| `ui/card.tsx` | `CardTitle` `font-display text-[1.25rem]` и `group-data-[size=sm]/card:text-sm`; `CardDescription` `text-sm` | `CardTitle` для `size="sm"` → `text-base`; `CardDescription` `text-sm` (мета, пол 15.75) без изменений | P-08, P-09 | R-3 |
| `ui/table.tsx` | `Table` `text-sm`; `TableHead` `h-10 px-2 font-medium text-foreground`; `TableCell` `p-2 whitespace-nowrap`; `TableCaption` `text-sm` | `Table` `text-base`; `TableHead` `px-3 py-3 text-sm font-normal text-muted-foreground` (колонка-заголовок как мета), без фиксированного `h-10`; `TableCell` `px-3 py-3` (первая и последняя колонки `px-5` — `first:px-5 last:px-5`); числа `tabular-nums` через проп/класс потребителя; `TableCaption` `text-sm` | P-31 | R-3 |
| `ui/status-text.tsx` | `text-sm` | Без изменений (мета) | P-32 | R-3 |
| `ui/dialog.tsx`, `ui/sheet.tsx` | `text-sm` описания, `closeLabel` проп | Заголовки `font-display`, описание `text-sm`; тело формы — `text-base` | UX-03 §8 | R-3 |
| **новый** `ui/date-field.tsx` | нет; в продукте 15 `<input type="date">` | Клиентский компонент: `Input` (`text-base`, `inputmode="numeric"`, плейсхолдер из формата локали) + кнопка-иконка календаря (`Button variant="outline" size="icon"`, `aria-label` из словаря) + `Popover` (Base UI) с сеткой месяца; значение наружу — ISO `YYYY-MM-DD`; скрытый `<input type="hidden" name>`; пропсы `value`, `onChange`, `min`, `max`, `name`, `disabled`, `invalid`; формат отображения — `formatDate` из `lib/i18n/format.ts`. Не импортировать `react-day-picker` статически (lazy: `next/dynamic`, [`ai_client_lazy_loading.md`](../guidelines/nextjs/ai_client_lazy_loading.md)) | P-19 | R-7 |
| **новый** `ui/page-section.tsx` | нет; `max-w-*`/`mx-auto` на страницах | Server-совместимый компонент: `width: "full" \| "wide" \| "form"` → `""` / `max-w-5xl` / `max-w-3xl`; всегда без `mx-auto` (влево); `as` проп (`section` по умолчанию) | UX-03 §7 | R-4 |

### 3.3 Оболочка `components/shell` и `lib/shell` (P14-CU4)

| Файл | Сейчас | Нужно | Эталон | R |
|------|--------|-------|--------|---|
| `shell/app-shell.tsx` L30–36 | `<main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1400px] px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-16 lg:pt-7">` внутри Fragment | `ShellHeader`, затем `<div className="flex-1 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">`: `<SidebarNav … />` (внутри `<aside>`) и `<main id="main" tabIndex={-1} className="min-w-0 px-4 pt-4 pb-28 sm:px-6 lg:px-8 lg:pt-7 lg:pb-16">` с контейнером `<div className="max-w-[1400px]">` вокруг `children`; корневой элемент оболочки `flex min-h-dvh flex-col`. Убрать `mx-auto` | P-24 | R-4, R-8 |
| **новый** `shell/sidebar-nav.tsx` | нет (`top-nav.tsx` 144 строки) | `<aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto border-r border-line bg-surface px-3 py-4 lg:block"><nav aria-label=…>`; для каждой группы `<div className="mt-5 first:mt-0"><p id=… className="flex items-center px-3 pb-1 text-sm font-medium text-muted">` + `<ul aria-labelledby=… className="space-y-0.5">` из `NavLinkRow density="sidebar"`; одиночные пункты — `<ul>` без заголовка; бейдж группы «Люди» = `NavBadge` справа в заголовке. Данные — те же `nav.navItems` / `previewNavItems` (общий список с drawer, `nav-config.ts`) | P-22, P-23 | R-8 |
| `shell/top-nav.tsx` | disclosure-группы, `SHELL_NAV_DROPDOWN_PANEL` | **Удалить файл**; убрать импорты | — | R-8 |
| `shell/shell-navigation.client.tsx` | рендерит `TopNav` + dev-switcher | Удалить, либо свести к клиентской обёртке `SidebarNav` (если нужен `usePathname` для `aria-current`); логика `previewRole` остаётся в `ShellHeader` | — | R-8 |
| `shell/nav-link-row.tsx` | `density: "drawer" \| "topnav"`; `text-[0.9375rem]`; drawer `h-11`; неактивный `text-ink-2 hover:bg-paper`; ветка topnav через `shellTopNavTriggerClass` | `density: "drawer" \| "sidebar"`. Общие классы: `flex w-full items-center gap-3 rounded-lg px-3 text-left text-base no-underline hover:no-underline`. `sidebar`: `min-h-10 py-1.5 leading-tight`; `drawer`: `h-11`. Активный — `bg-cobalt-soft font-bold text-cobalt-ink`; неактивный — `text-ink hover:bg-line/60` (а не `text-ink-2 hover:bg-paper`). `showDescription`/`description` удалить | P-20, P-21 | R-3, R-8 |
| `shell/nav-drawer.tsx` | заголовки групп `text-xs font-bold text-muted`; строки `h-11`; низ — имя и «Выйти» | Заголовок группы `text-sm font-medium text-muted`; строки через `NavLinkRow density="drawer"`; низ без изменений (`text-base`) | P-21 | R-3 |
| `shell/shell-header.client.tsx` L65–95 | `mx-auto flex h-14 max-w-[1400px] … lg:px-8`; бренд, `ShellNavigation`, блок справа (`DevRoleSwitcher` + `UserMenu`) | Внутренний контейнер `flex h-14 items-center gap-2 px-2 sm:px-4 lg:gap-0 lg:px-0` (без `max-w`, без `mx-auto`); ссылка бренда на `lg+` — `lg:w-64 lg:shrink-0 lg:self-stretch lg:border-r lg:border-line lg:px-5` (`BrandMark`); `ShellNavigation` убрать; блок справа `ms-auto flex shrink-0 items-center gap-1.5 lg:px-8`, `DevRoleSwitcher` убрать отсюда; `<span className="block truncate text-xs text-muted">` на мобильном → `text-sm` | P-25 | R-3, R-8 |
| `shell/user-menu.tsx` | триггер `h-9 max-w-[12rem] truncate px-1.5 text-[0.9375rem]`; панель `role="group"`; пункты «Профиль» (`min-h-11 px-3 py-2.5`), «Выйти» | Триггер `h-10 … text-base`; пункты `min-h-10 rounded-lg px-2.5 text-base hover:bg-paper`; новая группа «Смотреть как» (`role="group"` + `aria-label`, пункты `role="menuitemradio"`-подобные радио-кнопки) — рендерится **только** при `showDevSwitcher`, принимает `previewRole`, `onPreviewRoleChange` от `ShellHeader`; роль меню — `group`, не `menu` (UX-02 §6) | P-27 | R-8 |
| `shell/dev-role-switcher.tsx` | `SegmentedControl` admin/teacher, `hidden lg:flex`, подпись `text-xs` | Рендерить внутрь `UserMenu` (или оставить компонент как содержимое группы); подпись `text-sm`; `hidden lg:flex` убрать (в меню всегда виден); `dynamic import` по `APP_ENV=dev` сохранить (ОК-5) | P-27 | R-8 |
| `lib/shell/nav-chrome-classes.ts` | `SHELL_NAV_DROPDOWN_PANEL`, `SHELL_TOPNAV_TRIGGER` (`buttonVariants nav`), `shellTopNavTriggerClass` | Оставить `SHELL_NAV_DROPDOWN_PANEL` (для `UserMenu`); `SHELL_TOPNAV_TRIGGER` и `shellTopNavTriggerClass` удалить; тест `nav-chrome-classes.test.ts` заменить тестом классов `NavLinkRow` (sidebar/drawer) | P-26 | R-8 |
| `shell/nav-badge.tsx`, `ui/count-badge.tsx` | `text-xs`, фон cobalt | `bg-cobalt-ink`; `ml-auto`; остальное без изменений | P-28 | R-2 |
| `shell/ShellBanners.tsx`, `ConsentDeadlineBanner.tsx` | `text-sm` | Заголовок баннера `text-base font-bold`, текст `text-base`, подсказка `text-sm` | UX-03 D-8 | R-3 |

### 3.4 Страницы и их компоненты (P14-CU5)

Применить `PageSection` и убрать `max-w-*`/`mx-auto` на странице. Ширина — по таблице.

| Экран (`app/…/page.tsx`, внутренние компоненты) | Ширина (`PageSection`) | Что изменить |
|---|---|---|
| `/school` (`SchoolPageContent.server.tsx`, `SchoolGroupsTable`, `SchoolGroupCards`) | `full` | Скелетон `/school` держит экран ~8 с: вынести тяжёлые запросы за отдельные `<Suspense>` (структура страницы видна сразу), `loading.tsx` оставить для шапки. Таблица групп: колонки «Учителя», «Ученики», «Посещаемость», «Средний балл», «Последний урок» в `text-base`, подпись под значением — `text-sm`; «Не всё 10/30» → понятная подпись (см. §3.8) |
| `/groups` (`groups/page.tsx`) | `full` | Форма «Новая группа» в карточке: поле `w-full max-w-sm`, кнопка «Создать группу» `w-auto` (не растягивать, F14). Список: колонки «название + возраст», «язык», «учителей»; язык `RU` — `Badge` в той же колонке, что и название, а не посреди строки; ряд — CSS-grid `grid-cols-[minmax(0,1fr)_auto_auto]`, чтобы колонки выровнялись между рядами (T13). Подпись «6–8» `text-sm text-muted` |
| `/groups/[groupId]` (компоненты `admin/GroupSettingsForm`, блок «Достижения и штрафы», блок учителей) | `wide` | Убрать карточку-в-карточке: «Настройки оценивания» — одна карточка с `FormSection`, а не вложенная в колонку. Нативный `<select>` языка → `Select`; чекбоксы «Стихи/Тест/Тетрадь/Пение» → `Checkbox` + `Label`; числовые поля — `Input` `max-w-24`; «Добавить учителя»: `Select` + кнопка «Назначить» одной высоты `h-10`, в одну строку (`flex gap-2`) |
| `/year` (`admin/CreateYearForm.client.tsx`, `YearCard`) | `full` | `type="date"` → `DateField`; кнопка «Закрыть год» — `variant="destructive"` (контур); поле «Причина» и кнопка одной высоты; карточки лет: подпись дат `text-sm text-muted`, статус «Активен/Закрыт» — `StatusText`/`Badge` справа сверху с тем же кеглем |
| `/calendar` (`teacher/CalendarMonth.tsx`, `CalendarEventForm`) | `full` | Числа дней `text-base tabular-nums text-ink` (не cobalt); сегодня — `size-7 rounded-full bg-ink text-surface`; фильтр группы: `Select` + кнопка «Показать» одной высоты (кнопка убирается — `Select` применяет выбор сразу, если форма — GET, иначе `h-10`); поля дат события → `DateField` |
| `/users` (`admin/*` список, табы статусов) | `full` | Полоса табов: убрать вертикальный скролл (`overflow-y-hidden`, `overflow-x-auto` только на мобильном); статус в строке — `StatusText` (иконка + текст) в фиксированной колонке; пустое отображаемое имя → «Без имени» из словаря; различимость однофамильцев: вторая строка `text-sm text-muted` (роль или email-домен без ПД на скриншотах — решение владельца) |
| `/profile` (`app/profile/page.tsx`, карточки «Имя и фамилия», «Способы входа», «Удаление данных») | `wide` | Поля `max-w-sm`; кнопка «Сохранить» `w-auto`; «Выйти» — `variant="outline"`, а не безрамочный текст; «Запросить удаление» — `destructive` контур |
| `/settings` (`app/(app)/settings/page.tsx`) | `wide` | Кнопки «Сохранить язык/пояс» `w-auto`; переключатель языка — `SegmentedControl`; список часовых поясов — `Select` с поиском (Base UI `Combobox`/`Select` + `Input`) вместо нативного `<select size>`; подпись внизу `text-sm text-muted` |
| `/achievements` (`achievements/*`) | `wide` | Заголовок и «+ Достижение» в одном `PageHeader`; тир-точки (bronze/silver/gold) оставить, подпись уровня — `ink`, не цветом; тумблеры — `Switch` с подписью `text-base` |
| `/verses` (`teacher/VersePicker`, список стихов) | `full` | Текст стиха — `font-display italic text-base` (оставить как есть — характер экрана); ссылки «Урок N» — `text-ink underline-offset-2 hover:text-cobalt-ink` (R-10), без раскраски всех |
| `/rating` (`analytics/RatingTable.tsx`, `RatingPageContent.server.tsx`) | `full` | Место — одинаковый кегль `font-display text-lg tabular-nums` во всех строках (сейчас 1–3 и 4+ различаются); высота строки фиксирована (`h-14`); имя — `text-ink font-medium hover:text-cobalt-ink focus-visible:text-cobalt-ink`; фильтры «Группа/Школа» и группы — `SegmentedControl` одного размера |
| `/analytics`, `/analytics/pupils/[id]` (`AnalyticsGradeChips`, `AnalyticsPeriodChips`, `years/YearStrip`, `AnalyticsPeriodKpiSection`, `PupilAnalyticsKpiSection`) | `full` | См. §3.5 |

### 3.5 Аналитика и рейтинг (P14-CU8)

| Файл | Сейчас | Нужно | R |
|------|--------|-------|---|
| `analytics/AnalyticsGradeChips.tsx`, `AnalyticsPeriodChips.tsx`, `years/YearStrip.tsx` | ручные кнопки `h-11 min-w-11 text-sm`, выбранный `bg-ink text-surface` | Заменить на `SegmentedControl` (`mode="radio"`, `size="default"`); `YearStrip` — подпись «· идёт» остаётся в тексте опции; `aria-label` из словаря | R-5 |
| `analytics/AnalyticsPeriodFilter.tsx` | 2× `<input type="date">`, кнопка «Применить» | `DateField` ×2 + кнопка `h-10`; на 390 px — столбцом | R-7 |
| `analytics/AnalyticsPeriodKpiSection.tsx`, `PupilAnalyticsKpiSection.tsx` (8 и 7 вхождений `text-sm`/`text-xs`) | KPI-плитки одинакового размера | Первая плитка («Явка» / главная метрика) — `lg:col-span-2` и `NumberDisplay size="kpi"`; остальные — стандартный размер; подписи плиток `text-sm text-muted`, значения `text-base`+ | R-3 |
| `analytics/RatingTable.tsx` | см. §3.4 `/rating` | См. §3.4 | R-10, R-12 |
| `analytics/SchoolGroupsTable.tsx`, `GroupAnalyticsTables.tsx`, `ConductedLessonsTable.tsx` | `text-sm` в ячейках | Ячейки `text-base` (через `ui/table.tsx`), подписи «↓ на 2 п.п. ниже» `text-sm` | R-3 |
| `analytics/years/*` (`KpiTiles`, `YearTotalsTable`) | `text-xs` в пояснениях | `text-sm`; карточка периода — тело `text-[1.25rem]` (см. `analytics_screens_spec.md` §4.1 v1.5) | R-2 |
| Размер карточки аналитики (P11) | `text-[1.3125rem]` | `text-[1.25rem]` (22.5 px) — тот же визуальный размер при базе 18 px | R-2 |

### 3.6 Миграция `text-sm` / `text-xs` (по ролям текста)

Всего в `apps/web/src` 396 строк с `text-sm` и 34 с `text-xs` (снимок 2026-10-24). Мигрировать **по роли текста**, а не по поиску и замене:

| Роль текста | Было | Стало |
|-------------|------|-------|
| Подпись поля (`<label>`) | `text-sm` | `text-base font-medium` (через `Label`/`FieldLabel`) |
| Ячейка таблицы, пункт списка, кнопка, чип, пункт меню | `text-sm`, `text-[0.9375rem]` | `text-base` |
| Заголовок колонки таблицы | `text-sm` | `text-sm text-muted` (без изменений) |
| Подпись под значением, подсказка, «из 10», пояснение к полю | `text-sm`, `text-xs` | `text-sm text-muted` |
| Бейдж, счётчик у пункта меню | `text-xs` | `text-xs` (без изменений) |
| Метаданные строки («Учителей: 1», «6–8») | `text-xs`/`text-sm` | `text-sm text-muted` |
| Сообщение об ошибке поля | `text-sm` | `text-sm` (`AlertText`), иконка + текст |
| Тело абзаца | `text-base` | `text-base` |

Файлы с наибольшим числом вхождений (правятся в CU соответствующего экрана): `family/FamilyDetailBoard.client.tsx` (20), `teacher/LessonForm.tsx` (12), `analytics/AnalyticsPeriodKpiSection.tsx` (8), `admin/AuditEntryRow.tsx` (8), `achievements/IssuePenaltyDialog.client.tsx` (8), `LessonCheckTableCards`, `ParentChildDataBoard.client`, `PupilAnalyticsKpiSection`, `RewardCatalogDialog.client`, `PupilAchievementPanelContent.client` (по 7), `CalendarMonth`, `CalendarEventForm`, `ParentAchievementsReadOnly`, `FamilyCreateDialog.client`, `GroupAnalyticsTables`, `ManualAwardDialogForm.client` (по 6).

Проверка CU: `getComputedStyle` каждого текстового узла внутри `main` ≥ 15.75 px, кроме `Badge`/`CountBadge`; скрипт-замер — в §5 acceptance.

### 3.7 Нативные контролы (P14-CU6, CU7)

**Select** (19 вхождений `<select>`): `admin/AuditFilterBar.tsx` (3), `teacher/LessonForm.tsx` (2), `achievements/ManualAwardDialogForm.client.tsx` (2), `achievements/IssuePenaltyDialog.client.tsx` (2), `teacher/VersePicker.tsx`, `teacher/RosterTable.tsx`, `teacher/LessonsGradeFilter.tsx`, `teacher/CalendarEventForm.tsx`, `admin/GroupSettingsForm.tsx` (язык группы) и остальные по `grep -rn "<select" apps/web/src`. Правило замены: `<Select name=… value/defaultValue=… onValueChange=…><SelectTrigger className="w-full max-w-sm"><SelectValue/></SelectTrigger><SelectContent>…<SelectItem value=…>`; серверные формы (без клиентского состояния) получают `defaultValue` и `name`. Константу `manualAwardSelectClass` (`lib/achievements/manual-award-types.ts` L22) удалить.

**Checkbox** (8): `admin/RoleSelector.tsx` (3), `teacher/RosterTable.tsx` (2), `teacher/PupilCardForm.tsx`, `admin/GroupSettingsForm.tsx`, `achievements/ManualAwardEvidencePicker.client.tsx`. Замена: `<Checkbox id name checked onCheckedChange>` + `<Label htmlFor>`; для серверных форм — `name` + `value` (Base UI рендерит скрытый input).

**DateField** (15): `analytics/AnalyticsPeriodFilter.tsx` (2), `admin/CreateYearForm.client.tsx` (2), `admin/AuditFilterBar.tsx` (2), `teacher/LessonForm.tsx`, `bricks/IssueBricksDialog`, `bricks/CompensateBricksDialog`, `teacher/CalendarEventForm.tsx`, `people/TransferDialog`, `admin/GroupSettingsForm.tsx`, `ExtendLegacyDeadlineDialog`, `people/EnrollDialog`, и остальные по `grep -rn 'type="date"' apps/web/src`. Серверные Zod-схемы не меняются (значение — ISO-строка, как сейчас).

Проверка: `grep -rnE '<select|type="checkbox"|type="date"' apps/web/src` пуст.

### 3.8 Копирайт и баги, найденные аудитом (P14-CU9)

Правки в `apps/web/src/lib/messages/{ru,en}.ts` (обе локали, ADR-008):

| Экран | Текст сейчас | Нужно |
|-------|--------------|-------|
| `/groups/[id]` | «Выключено с …. Полученные достижения…» (литеральное многоточие вместо даты) | Подставлять дату выключения (`formatDate`); если даты нет — формулировка без «с …»: «Выключено. Полученные достижения…» |
| `/school` «Требует внимания» | «2 пользователей ждут роль» | Форма с числом через `plural` (1 пользователь ждёт, 2–4 пользователя ждут, 5+ пользователей ждут) — функция `plural` из `lib/i18n/format.ts` |
| `/school` «Последний урок» | «Не всё 10/30» | Понятная метка: «Проверено 10 из 30» (текст + число) |
| `/users` | пустое имя в списке | «Без имени» |
| `/analytics/pupils/[id]` | «Ребёнок без семьи — контактов нет.» оранжевым текстом без иконки | `StatusText kind="warn"` (иконка + текст) |
| Даты `mm/dd/yyyy` | формат по локали браузера | Заменяется `DateField` (§3.2) |

### 3.9 Что не меняем

Палитра и контраст UX-03 §4–§5; радиусы (`rounded-lg` / `rounded-xl`); глубина границами; `font-display` на заголовках, крупных числах и стихах; маршруты; права; серверная логика; Design Lab как dev-инструмент (только расширение секций, §4).

## 4. Design Lab (`/design-system`)

Секции добавляются **раньше** использования (C-2). Данные матриц — `lib/design-lab/matrices.ts`.

| Секция | Содержимое |
|--------|-----------|
| `Select` | default / compact × default / hover / focus / disabled / invalid / placeholder; открытая панель; длинный список |
| `Checkbox` | размер, `checked`, `indeterminate`, `disabled`, `invalid`; в строке с подписью |
| `DateField` | пусто, значение, `min`/`max`, `invalid`, `disabled`; открытый календарь |
| `SegmentedControl` | `radio` и `toggle` × `default` / `compact`; выбранный, `disabled`, `invalid` |
| `PageSection` | `full` / `wide` / `form` на ширинах 390 / 1024 / 1280 |
| `SidebarNav` | роли admin и teacher; текущий пункт; бейдж; длинная подпись (перенос) |
| `Typography` | таблица §6 UX-03 в 18 px, примеры «пол кегля» и бейдж |
| `Button` | размеры `default` / `compact` / `touch`, `icon*`; варианты; `destructive-solid` отмечена «только в ConfirmDialog» |

Ширины витрины: 390 / 768 / 1024 / 1280.

## 5. Acceptance по экранам

Для каждого из 13 экранов аудита — ширины **390, 768, 1280, 1920**, роли **admin** и **teacher** (где экран доступен):

| Экран | Проверки |
|-------|----------|
| `/groups/[id]`, `/analytics`, `/rating`, `/analytics/pupils/[id]`, `/school`, `/users`, `/groups`, `/year`, `/calendar`, `/achievements`, `/verses`, `/settings`, `/profile` | (1) Все текстовые узлы в `main` ≥ 15.75 px, кроме `Badge`/`CountBadge`; кнопки, чипы, ячейки, подписи полей = 18 px. (2) Нет горизонтальной прокрутки страницы. (3) `getComputedStyle(main).outlineStyle === "none"` после перехода. (4) Контейнер: ширина `#view` ≤ 1400 px, прижат влево, у `form`/`wide` — по таблице §3.4. (5) Соседние контролы одной высоты (`getBoundingClientRect().height` в ряду). (6) Нет нативных `select`/`checkbox`/`date`. (7) Выбранный чип — `bg-cobalt-soft`. (8) Сайдбар виден на ≥ 1024 px и скрыт < 1024; `aria-current` ровно у одного пункта. (9) Консоль без `error`/`unhandledrejection`. (10) `Parity: N строк, расхождений 0` |
| `/rating` | Место одного кегля во всех строках; высота строк равна |
| `/calendar` | Числа дней `text-ink`; `Select` и кнопка одной высоты |
| `/school` | Структура страницы видна < 1 с (скелет по секциям), затем данные |

### 5.1 Скрипт-замер (для UI-verify, выполнять в консоли страницы или через браузерный инструмент)

```js
(() => {
  const main = document.querySelector("main");
  const small = [...main.querySelectorAll("*")]
    .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
    .filter((e) => !e.closest("[data-slot=badge],[data-slot=count-badge],svg"))
    .map((e) => ({ t: e.textContent.trim().slice(0, 24), px: parseFloat(getComputedStyle(e).fontSize) }))
    .filter((x) => x.px < 15.7);
  const ctrl = [...main.querySelectorAll("button,input,[role=combobox]")]
    .map((e) => Math.round(e.getBoundingClientRect().height)).filter(Boolean);
  return {
    html: getComputedStyle(document.documentElement).fontSize,
    body: getComputedStyle(document.body).fontFamily.slice(0, 20),
    mainOutline: getComputedStyle(main).outlineStyle,
    nativeControls: main.querySelectorAll("select,input[type=checkbox],input[type=date]").length,
    smallText: small.slice(0, 8),
    controlHeights: [...new Set(ctrl)],
  };
})();
```

Подписи осей графиков (текст внутри `<svg>`, 12 px) в замер не входят: они вне scope типографики v2.0 (как и в [`analytics_screens_spec.md`](../implementation/mvp/specs/analytics_screens_spec.md) §4.1 «подписи осей графиков»); их размер — отдельное решение, если владелец потребует.

Ожидание: `html: "18px"`, `body` начинается с `"Source Sans 3"`, `mainOutline: "none"`, `nativeControls: 0`, `smallText: []`, `controlHeights ⊂ {41, 45, 50}` (40.5 / 45 / 49.5 с округлением).

### 5.2 Контраст на новом кегле

Пары цветов не менялись (UX-03 §5). Дополнительно проверить, что `text-muted` (4.76:1 на `surface`, 4.55:1 на `paper`) не применяется к тексту, несущему смысл, без пары иконка/текст; метки `edit` и `bronze` по-прежнему только с текстовой подписью.

## 6. Open questions

| ID | Вопрос | Предложение по умолчанию | Блокирует |
|----|--------|--------------------------|-----------|
| Q-01 | `DateField`: собственная сетка календаря или `react-day-picker` | `react-day-picker` через `next/dynamic` (по [`ai_client_lazy_loading.md`](../guidelines/nextjs/ai_client_lazy_loading.md)); добавление зависимости — T2-задача, `deps:check`, версия с `npm view` | P14-CU3 |
| Q-02 | Список часовых поясов в `/settings`: `Select` с поиском или `Combobox` | Base UI `Combobox`, если есть в установленной версии, иначе `Input` + список под ним как сейчас, но на `Select` | P14-CU7 |
| Q-03 | Бейдж у группы «Люди» в сайдбаре дублирует бейджи пунктов | Оставить (прототип), число = сумма (как в UX-02 §5.4) | — |

## 7. Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_014_app_redesign_v2.md`](../prds/07_governance/adr_014_app_redesign_v2.md) | Решения R-1…R-12 |
| [`prototype_class_parity_spec.md`](../implementation/mvp/specs/prototype_class_parity_spec.md) | Строки P-NN и протокол сверки |
| [`P14_tasks.md`](../implementation/mvp/tasks/P14_tasks.md) | Commit units по этой матрице |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W12-02

## 8. Agent notes

- Не менять палитру и не вводить новые цвета ради редизайна.
- Сначала секция Lab, затем экран (C-2); каждая правка файла из §3 сопровождается проверкой строки parity-spec.
- Не заменять `text-sm` массовым поиском: сверяться с таблицей ролей §3.6.
- Не добавлять `mx-auto` на страницу; не вводить новый `max-w-*` вне `PageSection`.
- Не возвращать `top-nav.tsx`, `size="nav"` у `Button` и `shellTopNavTriggerClass`.
- Зависимость для календаря (Q-01) — отдельное решение с `npm view` и `npm run deps:check`.

## Change log

| Date | Change |
|------|--------|
| 2026-10-24 | v1.0 — Canonical (W12-02, P14): компонентная матрица §3, Lab §4, acceptance §5, замер §5.1 |
