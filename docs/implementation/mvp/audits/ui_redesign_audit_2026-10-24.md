# UI redesign audit — дев-стенд, 13 экранов

**Тип:** Audit  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-24  
**Волна:** W12-03 (P14)  
**Зависит от:** [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) (UX-03 v1.1 на момент аудита), [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md) (UX-02 v1.2), [`sunday_school_prototype.html`](../../../prototypes/sunday_school_prototype.html)  
**Связанные документы:** [`adr_014_app_redesign_v2.md`](../../../prds/07_governance/adr_014_app_redesign_v2.md), [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md), [`P14_tasks.md`](../tasks/P14_tasks.md), [`ui_prototype_fidelity_2026-10-21.md`](./ui_prototype_fidelity_2026-10-21.md) (предыдущий аудит; не правится)  
**Проверено по:** живой просмотр `https://dev-sun-school-pstgre.vercel.app/` в Chrome (расширение Claude in Chrome), роль admin, окно браузера шириной 2560 CSS px (поэтому скриншоты выглядят мельче, чем на ноутбуке; замеры `getComputedStyle` от ширины не зависят); каталог проверок «design-anti-slop» (T1…T27). Мобильная ширина и роль teacher в этом аудите не проверялись — входят в UI-verify фазы P14.

---

## 1. Purpose

Зафиксировать входные данные редизайна v2: замеры, находки и соответствие решению ADR-014 и коммит-юниту P14. Каждая находка имеет R-номер ADR и CU фазы, который её закрывает.

## 2. Замеры

### 2.1 Размеры текста (`/groups`, `/groups/[id]`, `/analytics`, `/rating`)

| Размер, px | Откуда | Где встречается |
|-----------:|--------|-----------------|
| 12.75 | `text-xs` (0.75rem × 17) | «Смотреть как», счётчики, часть подписей |
| 14.9 | `text-sm` | подписи полей, мета, заголовки колонок, ячейки аналитики |
| 15.9 | `text-[0.9375rem]` | кнопки, чипы, пункты меню |
| 17 | `text-base` | абзацы (меньшинство) |
| 19–22 | `h2`, тело карточек аналитики P11 | заголовки секций |
| 36 | `h1` | заголовок страницы |

Около 70% текстовых узлов в `<main>` — ниже 17 px. На `/analytics` в замере 447 узлов стоят на 17 px, 237 — на 22 px (карточки P11), 86 — на 14.9 px: страница смешивает три шкалы.

Причина «мелко» двойная: (1) низкий x-height Alegreya Sans, 17 px читаются как ~15; (2) сам прототип собран из `text-sm` (337 вхождений) и `text-xs` (49).

### 2.2 Контейнер и ширины

| Экран | Ширина контента (CSS px при окне 2560) |
|-------|-----------------------------------------|
| `/groups`, `/analytics`, `/rating`, `/users`, `/year`, `/calendar`, `/school`, `/verses` | ~1330 (контейнер 1400) |
| `/profile` | ~1100, по центру |
| `/settings` | ~1100, прижат влево |
| `/achievements` | ~700, по центру |

### 2.3 Контролы

Высоты в `/groups/[id]` (замер `getBoundingClientRect`): 38, 43, 47 px (по 4–5 элементов); нативный `<select>` на `/calendar` ~28 px рядом с кнопкой выше. Нативные: `<select>` на `/calendar` и `/groups/[id]`, чекбоксы «Стихи/Тест/Тетрадь/Пение», `<input type="date">` с `mm/dd/yyyy` на `/year`.

### 2.4 Фокус

`main#main` после навигации получает `outline: 2px solid rgb(51,112,255)` (`tabindex=-1`, программный фокус) — вокруг всего контента рисуется синяя рамка на каждом экране.

## 3. Находки

Правила — каталог слоп-теллов T1…T27 (design-anti-slop). «Чисто» — проверено, находок нет.

| # | Находка | Правило | Где | Решение | CU |
|---|---------|---------|-----|---------|----|
| F-01 | Основной текст мелкий: 70% узлов ≤ 15.9 px | T14 / читаемость | все | R-1, R-2, R-3 | CU1, CU2 |
| F-02 | Горизонтальная навигация с выпадашками над колонкой; 13+ разделов спрятаны в трёх группах | T27 | оболочка | R-8 | CU4 |
| F-03 | Три ширины контента | T18/T27 | `/profile`, `/settings`, `/achievements` | R-4 | CU5 |
| F-04 | Два вида выбранного чипа (`ink` и `cobalt-soft`) | T4 / T25 | `/analytics` против `/rating`, `/calendar`, `/settings` | R-5 | CU3, CU8 |
| F-05 | Высоты контролов 38 / 43 / 47 px; соседние контролы разной высоты | T25 | `/groups/[id]`, `/calendar` | R-6 | CU2 |
| F-06 | Нативные `select`, `checkbox`, `date` | T16 | `/calendar`, `/groups/[id]`, `/year` | R-7 | CU6, CU7 |
| F-07 | Рамка фокуса `main` | a11y | все | R-9 | CU1 |
| F-08 | Cobalt на именах рейтинга и числах календаря (акцент размазан) | T9 | `/rating`, `/calendar`, `/verses` | R-10 | CU8 |
| F-09 | «Закрыть год» — сплошная красная кнопка в одной строке с полем | T8 | `/year` | R-11 | CU5 |
| F-10 | Место в рейтинге: 1–3 одним кеглем, 4+ крупнее; строки разной высоты | T11 | `/rating` | R-12 | CU8 |
| F-11 | Карточка в карточке | T18 | `/groups/[id]`, `/year` | R-4 | CU5 |
| F-12 | Кнопки сохранения растянуты на всю карточку, блёклые disabled | T25 | `/settings`, `/profile` | F14 (UX-06) | CU5 |
| F-13 | Колонки списка не выровнены; «RU» посреди ряда | T13 | `/groups` | grid-колонки ряда (redesign §3.4) | CU5 |
| F-14 | `/school` долго показывает скелет (>8 с в замере) | perf/UX | `/school` | streaming по секциям | CU5 |
| F-15 | Копирайт: «Выключено с …», «2 пользователей ждут роль», «Не всё 10/30», пустое имя в списке | T21 | `/groups/[id]`, `/school`, `/users` | §3.8 redesign spec | CU9 |
| F-16 | Прокрутка вкладок статусов выглядит как вертикальный скроллбар | T11 | `/users` | вкладки без вертикального скролла (redesign §3.4) | CU5 |
| F-17 | «Ребёнок без семьи — контактов нет» оранжевым без иконки (цвет как единственный сигнал) | a11y | `/analytics/pupils/[id]` | `StatusText` | CU9 |
| Чисто | T6 (индиго), T2 (эмодзи), T3 (капс: 0 элементов `uppercase`), T5 (тени), T10, T23, T24 | — | — | — | — |

## 4. Следствия для прототипа

Прототип подчинён контракту (UX-03 §10). Расхождения прототипа с v2.0 исправлены в том же изменении, что и контракты: шрифт, база 18 px, сайдбар, константы `BTN` / `LABEL` / `SEG_ON` / `SEG_OFF` / `CHIP` / `SEL` / `SUBMIT`, меню пользователя с «Смотреть как», `main:focus`. Список строк — [`prototype_class_parity_spec.md`](../specs/prototype_class_parity_spec.md) §7.

## 5. Повторный замер (после P14)

Скрипт — [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md) §5.1. Замер на localhost после CU1…CU9 (admin и teacher, выборочно 390 / 768 / 1024 / 1280), 2026-10-24.

| Показатель | До (2026-10-24) | После |
|------------|-----------------|-------|
| `html` font-size | 17 px | 18 px |
| Доля узлов в `main` < 15.7 px | ~70% (ниже 17 px) | 0% (`smallText: []` на всех 13 экранах) |
| Нативные контролы | 19 select / 8 checkbox / 15 date | 0 (`nativeControls: 0`) |
| Число ширин контента | 4 | 3 (`PageSection`: `full`, `wide`, `form`) |
| Высоты контролов | 38, 43, 47 | 41, 45, 50 (D-9, `controlHeights ⊂ {41,45,50}`) |
| Рамка `main` | есть | нет (`mainOutline: none`) |

### 5.1 По экранам (§5.1 redesign spec)

Экраны — [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md) §5. На каждом: `html: "18px"`, `body` → `"Source Sans 3"`, `mainOutline: "none"`, `nativeControls: 0`, `smallText: []`, `controlHeights` из множества {41, 45, 50}.

| Экран | Роль | Ширина (px) | `controlHeights` (уник.) |
|-------|------|-------------|-------------------------|
| `/groups` | admin | 1280 | 41, 45, 50 |
| `/groups/[id]` | admin | 1280 | 41, 45, 50 |
| `/analytics` | admin | 1280 | 41, 45, 50 |
| `/analytics/pupils/[id]` | admin | 1280 | 41, 45 |
| `/rating` | admin, teacher | 1280 | 41, 45, 50 |
| `/school` | admin | 1280 | 41, 45 |
| `/users` | admin | 1280 | 41, 45, 50 |
| `/year` | admin | 1280 | 41, 45, 50 |
| `/calendar` | teacher | 1280 | 41, 45, 50 |
| `/achievements` | admin | 1280 | 41, 45, 50 |
| `/verses` | teacher | 1280 | 41, 45 |
| `/settings` | admin, teacher | 1280 | 41, 45, 50 |
| `/profile` | admin, teacher | 1280 | 41, 45 |

## 6. Related documents

| Document | Relationship |
|----------|--------------|
| [`ui_prototype_fidelity_2026-10-21.md`](./ui_prototype_fidelity_2026-10-21.md) | Прежний аудит (история) |
| [`adr_014_app_redesign_v2.md`](../../../prds/07_governance/adr_014_app_redesign_v2.md) | Решения |

## Change log

| Date | Change |
|------|--------|
| 2026-10-24 | v1.0 — Canonical (W12-03): замеры и находки F-01…F-17 |
| 2026-10-24 | v1.1 — §5–§5.1: повторный замер после P14-CU10 |
