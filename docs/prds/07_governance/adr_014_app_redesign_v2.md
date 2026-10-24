# ADR-014 — Редизайн v2: шрифт, шкала кегля, оболочка и контролы

**Тип:** ADR  
**Статус:** ACCEPTED  
**Версия:** 1.0  
**Дата:** 2026-10-24  
**Волна:** W12 (P14)  
**Зависит от:** [`visual_identity_contract.md`](../../design/visual_identity_contract.md) (UX-03), [`responsive_navigation_contract.md`](../../design/responsive_navigation_contract.md) (UX-02), [`typography_text_guidelines.md`](../../guidelines/typography_text_guidelines.md), [`ui_redesign_audit_2026-10-24.md`](../../implementation/mvp/audits/ui_redesign_audit_2026-10-24.md)  
**Связанные документы:** [`redesign_v2_ui_spec.md`](../../design/redesign_v2_ui_spec.md), [`prototype_class_parity_spec.md`](../../implementation/mvp/specs/prototype_class_parity_spec.md), [`global_shell_spec.md`](../../implementation/mvp/specs/global_shell_spec.md), [`design_system_lab_spec.md`](../../implementation/mvp/specs/design_system_lab_spec.md), [`P14_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P14_phase_description.md), [`architecture_master_index.md`](../architecture_master_index.md)  
**Проверено по:** Source Sans 3 — fonts.google.com/specimen/Source+Sans+3: variable-шрифт, кириллица и latin в наборе, веса 200–900. `next/font/google` экспортирует его как `Source_Sans_3`, подмножества `latin` и `cyrillic`. Размеры и высоты в px посчитаны от `html { font-size: 112.5% }` (18 px) и шкалы Tailwind v4 (`text-sm` = 0.875rem, `text-xs` = 0.75rem, `h-9`/`h-10`/`h-11` = 2.25/2.5/2.75rem). Живой аудит дев-стенда: [`ui_redesign_audit_2026-10-24.md`](../../implementation/mvp/audits/ui_redesign_audit_2026-10-24.md). Context7 в этой сессии не вызывался: библиотечный контракт Next.js не меняется.

---

## 1. Purpose

Зафиксировать решения редизайна v2, которые меняют UX-02 и UX-03: гарнитуру основного текста, базовый кегль и его пол, единый контейнер страницы, один вид выбранного чипа, шкалу высот контролов, запрет нативных select / checkbox / date, левый сайдбар на `lg+`. Решения владельца 2026-10-24 по итогам аудита.

## 2. Scope / Out of scope

**В scope:** шрифты, кегль, контейнер, контролы, навигация `lg+`, фокус `main`, бюджет акцента, копирайт-исправления, обновление HTML-прототипа.  
**Вне scope:** палитра и контраст токенов (фон остаётся `paper #F8FAFC`, холодный slate), радиусы и глубина, тёмная тема (D-4), маршруты ([`canonical_routes.md`](../../design/canonical_routes.md) не меняется), бизнес-логика, модель данных, права.

## 3. Context

Аудит дев-стенда `dev-sun-school-pstgre.vercel.app` (13 экранов, роль admin, замеры `getComputedStyle`):

- Основной текст читается мелко. Около 70% текстовых узлов в `<main>` стоят на 12.75, 14.9 и 15.9 px, на `text-base` (17 px) — меньшинство. У Alegreya Sans низкий x-height, поэтому 17 px выглядят как ~15 px у гарнитуры с обычным x-height.
- Внутренний дрейф: три ширины контента (`/groups` ~1330 px, `/profile` ~1100 px по центру, `/achievements` ~700 px по центру); два вида выбранного чипа (solid `ink` в аналитике, `cobalt-soft` в рейтинге, календаре и настройках); высоты контролов 38 / 43 / 47 px и нативный select ~28 px; нативные `<select>`, чекбоксы и `<input type=date>` (формат `mm/dd/yyyy` при русском интерфейсе); 2 px cobalt-рамка вокруг всего `<main>` после навигации (программный фокус `tabindex=-1`).
- Оболочка: горизонтальная навигация с выпадашками над колонкой контента — шаблон лёгкого веб-приложения. 13+ разделов админа спрятаны в трёх выпадашках.

Прототип сам собран из `text-sm` (337 вхождений) и `text-xs` (49), поэтому часть проблем унаследована из эталона; прототип правится вместе с контрактами.

## 4. Decision

| # | Решение |
|---|---------|
| R-1 | `font-body` — **Source Sans 3** (веса 400, 500, 600, 700; latin + cyrillic; `next/font/google`). `font-display` — Alegreya (500, 700, курсив 400): заголовки, крупные числа, тексты стихов. Alegreya Sans удаляется. Семейств на странице — два. Отменяет UX-03 D-2 |
| R-2 | Базовый кегль **18 px** (`html { font-size: 112.5% }`), размеры — в `rem`. `text-base` = 18 px, `text-sm` = 15.75 px (пол для метаданных), `text-xs` = 13.5 px — **только** в `Badge` и `CountBadge`. `line-height` основного текста 1.5. Отменяет UX-03 D-5 |
| R-3 | В содержимом `<main>`: подписи полей, ячейки таблиц, пункты списков, кнопки, чипы, пункты меню — `text-base`. `text-sm` — только подпись под значением, подсказка, метаданные строки. `text-xs` и произвольные `text-[…rem]` меньше 0.875rem в `<main>` запрещены |
| R-4 | Один контейнер страницы: `max-w-[1400px]`, `px-4 sm:px-6 lg:px-8`, выравнивание влево. Узкие страницы (форма, текст) — только через компонент `PageSection` с `width="form"` (`max-w-3xl`, 48rem) или `width="wide"` (`max-w-5xl`, 64rem), прижатый влево, не по центру. Экраны `(auth)` остаются на `AuthScreen` |
| R-5 | Один вид выбранного чипа и сегмента: `border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink`; невыбранный — `border-input bg-surface text-ink hover:border-ink-2`. Solid `ink` как «выбрано» запрещён. Единый компонент — существующий `SegmentedControl` (расширяется режимом `toggle` с `aria-pressed` и размером `compact`); ручные кнопки-чипы аналитики заменяются им |
| R-6 | Шкала высот контролов: `default` = `h-10` (45 px), `compact` = `h-9` (40.5 px, только внутри таблиц), `touch` = `h-11` (49.5 px, главное действие на мобильном). Рядом стоящие контролы одной высоты. Шкала в токенах `--control-h`, `--control-h-compact`, `--control-h-touch` |
| R-7 | В продуктовом UI нет нативных `<select>`, `<input type="checkbox">` и `<input type="date">`. Используются `Select` (Base UI, уже есть в `components/ui/select.tsx`, доводится до шкалы v2), `Checkbox` (уже есть, `size-5`), `DateField` (новый: текстовое поле с вводом даты и календарём). Формат даты — из `lib/i18n/format.ts`, не из локали браузера |
| R-8 | Навигация `lg+` — **постоянный левый сайдбар** `w-64` (16rem) с плоским списком разделов и заголовками групп; выпадающих панелей нет. Контент занимает остаток (контейнер R-4). Шапка `lg+` содержит только меню пользователя (профиль, «Смотреть как» в dev, «Выйти»). `< lg` — drawer и заголовок экрана без изменений. Брейкпоинт 1024 px сохраняется |
| R-9 | Программный фокус `main#main` не рисует рамку: `main:focus:not(:focus-visible) { outline: none }`. `:focus-visible` на интерактивных элементах остаётся (cobalt, 2 px, смещение 2 px) |
| R-10 | Бюджет акцента: имя ученика в таблице рейтинга — `text-ink font-medium`, cobalt только при `hover` и `focus-visible`; числа дней календаря — `text-ink`; `cobalt-ink` — основная кнопка, текущий пункт, ссылки в прозе, главная цифра экрана |
| R-11 | Опасное действие в строке с полем — контурная `destructive`; сплошная `destructive-solid` — только внутри `ConfirmDialog` |
| R-12 | Рейтинг: колонка места одного кегля (`font-display text-lg tabular-nums`) во всех строках, фиксированная высота строки |

## 5. Rejected alternatives

| Альтернатива | Почему отклонена |
|--------------|------------------|
| Тёплый «бумажный» фон | Отклонено владельцем 2026-10-24: `paper #F8FAFC` остаётся; палитра UX-03 §4 не меняется |
| PT Sans | В семействе нет веса 500; кнопкам и чипам нужен `font-medium` |
| Golos Text | Холоднее и «интерфейснее» по рисунку; сильнее расходится с Alegreya по тону, чем Source Sans 3 |
| Оставить Alegreya Sans и поднять только кегль | Кегль 19–20 px ломает плотные таблицы аналитики; причина — x-height, а не размер |
| Оставить 17 px при новой гарнитуре | Пол метаданных `text-sm` стал бы 14.9 px; выбранный пол 15.75 px читается лучше при тех же таблицах |
| Оставить topnav, переработать только выпадашки | Не снимает проблему шаблона «шапка + центральная колонка» и скрытых разделов |
| Сворачиваемый сайдбар до иконок | Усложняет оболочку; в MVP не нужен (YAGNI). Пересматривается, если число разделов вырастет |
| Тёмная тема | Вне MVP (UX-03 D-4) |

## 6. Consequences

- Обновляются [UX-03 → v2.0](../../design/visual_identity_contract.md) и [UX-02 → v2.0](../../design/responsive_navigation_contract.md); прежние D-2 и D-5 помечены superseded.
- Компонентная матрица «что менять» — [`redesign_v2_ui_spec.md`](../../design/redesign_v2_ui_spec.md); сопоставление классов прототипа и компонентов — [`prototype_class_parity_spec.md`](../../implementation/mvp/specs/prototype_class_parity_spec.md); исполнение — фаза [P14](../../implementation/mvp/phases_tasks_descriptions/P14_phase_description.md).
- Шрифт Source Sans 3 заменяет Alegreya Sans в бандле шрифтов: число семейств остаётся два. Source Sans 3 шире Alegreya Sans по рисунку, поэтому запас ширины +30% на ru/en (ЛК-8) проверяется на 390 px.
- Меняется только слой представления: маршруты, права, данные и сообщения мутаций не затронуты.
- Контраст пар цветов UX-03 §5 не меняется. Порог крупного текста WCAG (≥ 24 px или ≥ 18.66 px жирным) остаётся прежним: 18 px и 15.75 px — обычный текст, требуется 4.5:1.
- HTML-прототип обновляется в одном изменении с этим ADR (прототип подчинён контракту, UX-03 §10).
