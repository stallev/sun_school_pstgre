# Visual identity contract (UX-03) — Sunday School

**Тип:** UX Contract  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-10-24  
**Волна:** W2-03 (v2.0 — W12, P14)  
**Зависит от:** [`sunday_school_prototype.html`](../prototypes/sunday_school_prototype.html) (token dump и `@theme static` в `<head>`), [`typography_text_guidelines.md`](../guidelines/typography_text_guidelines.md), [`ai_semantics_a11y_guidelines.md`](../guidelines/react/ai_semantics_a11y_guidelines.md), [`canonical_routes.md`](./canonical_routes.md), [`adr_014_app_redesign_v2.md`](../prds/07_governance/adr_014_app_redesign_v2.md)  
**Связанные документы:** [`responsive_navigation_contract.md`](./responsive_navigation_contract.md), [`prototype_route_mapping.md`](./prototype_route_mapping.md), [`redesign_v2_ui_spec.md`](./redesign_v2_ui_spec.md), [`prototype_class_parity_spec.md`](../implementation/mvp/specs/prototype_class_parity_spec.md), [`architecture_master_index.md`](../prds/architecture_master_index.md)  
**Проверено по:** Tailwind CSS v4.3 (`@theme`, `@theme inline`, `@theme static`) — tailwindcss.com/docs/theme через WebFetch, 2026-10-10; shadcn/ui theming (CSS-переменные `:root` / `.dark`, `@theme inline`, имена токенов) — ui.shadcn.com/docs/theming, 2026-10-10. Контраст рассчитан по формуле WCAG 2.1 (относительная яркость sRGB), 2026-10-10; v2.0 пары цветов не меняет. Source Sans 3 — fonts.google.com/specimen/Source+Sans+3 (variable, latin + cyrillic), 2026-10-24. Context7 недоступен.

---

## 1. Purpose

Единый визуальный канон: токены, типографика, формы, рецепты компонентов и правила доступности. Источник токенов — прототип (visual reference); этот контракт переводит их в нормы для `globals.css`, Design System Lab (P6) и review UI-кода. Читают: исполнитель P6, авторы UI-задач, reviewer.

## 2. Scope / Out of scope

**В scope:** цвет, типографика, радиусы, глубина, движение, рецепты базовых компонентов, shadcn-mapping, контраст.  
**Вне scope:** раскладка и навигация — [UX-02](./responsive_navigation_contract.md); состояния экранов и формы — UX-05 / UX-06 (W7); тёмная тема (вне MVP).

## 3. Decisions

| # | Решение | Причина |
|---|---------|---------|
| D-1 | Палитра — **Slate Cobalt**: слэйтовые нейтрали + кобальт | Прототип владельца; действующее приложение |
| D-2 | ~~Шрифты: Alegreya (display) и Alegreya Sans (body)~~ — **superseded v2.0 (ADR-014 R-1)**: **Alegreya** (display: заголовки, крупные числа, тексты стихов) и **Source Sans 3** (body) | Alegreya Sans имеет низкий x-height — основной текст читался мелко; Source Sans 3 поддерживает кириллицу, веса 400–700, тон близок к Alegreya Sans. Максимум два семейства |
| D-3 | В `globals.css` токены задаются как CSS-переменные и мапятся через `@theme inline` (схема shadcn); прототипная запись `@theme static` — временная | Контракт P1; shadcn-компоненты ожидают семантические имена |
| D-4 | Тёмной темы нет — **вне MVP**; `.dark` не создаётся | Решение владельца (P1) |
| D-5 | ~~Базовый кегль 17 px (`html { font-size: 106.25% }`)~~ — **superseded v2.0 (ADR-014 R-2)**: **18 px** (`html { font-size: 112.5% }`), размеры — в `rem`; пол метаданных `text-sm` = 15.75 px | Читаемость; аудит 2026-10-24: 70% текста стояло на 12.75–15.9 px |
| D-6 | Основная кнопка — заливка `cobalt-ink` (6.70:1), hover — новый токен `cobalt-deep` | Решение владельца 2026-10-10; AA для текста кнопки |
| D-7 | Границы полей и чипов выбора — `muted` (4.76:1) | Решение владельца: нетекстовый контраст ≥ 3:1 |
| D-8 | Баннер ошибки: иконка `danger`, жирный заголовок, текст `ink` на `danger-soft` | Решение владельца; контраст текста 14.61:1 |
| D-9 | Шкала высот контролов: `default` `h-10` (45 px), `compact` `h-9` (40.5 px, только в таблицах), `touch` `h-11` (49.5 px); токены `--control-h`, `--control-h-compact`, `--control-h-touch` (ADR-014 R-6) | Аудит: 38 / 43 / 47 px вразнобой; соседние контролы одной высоты |
| D-10 | Выбранный чип и сегмент — `border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink`; solid `ink` как «выбрано» запрещён (ADR-014 R-5) | Аудит: два вида выбранного на разных экранах |
| D-11 | Бюджет акцента: `cobalt-ink` — основная кнопка, текущий пункт, ссылки в прозе, главная цифра экрана; имена в таблицах и числа календаря — `ink` (ADR-014 R-10) | Аудит: акцент размазан по именам рейтинга и числам календаря |
| D-12 | Программный фокус `main#main` без рамки; `:focus-visible` на интерактиве сохраняется (ADR-014 R-9) | Аудит: 2 px cobalt-рамка вокруг страницы после каждой навигации |
| D-13 | Нативные `select`, `checkbox`, `date` в продуктовом UI запрещены (ADR-014 R-7) | Аудит: системный вид, `mm/dd/yyyy` при русском интерфейсе |

## 4. Токены цвета

Имена `--color-*` — прототипные; целевое семантическое имя — для `globals.css` (shadcn).

| Токен | Hex | Семантическая роль (целевая) | Назначение |
|-------|-----|------------------------------|------------|
| `paper` | `#F8FAFC` | `background` | Фон страницы |
| `surface` | `#FFFFFF` | `card`, `popover`, `primary-foreground` | Карточки, поля, текст на `primary` |
| `ink` | `#0F172A` | `foreground` | Основной текст |
| `ink-2` | `#475569` | `secondary-foreground` | Второстепенный текст |
| `muted` | `#64748B` | `muted-foreground` | Подписи, метаданные |
| `line` | `#E2E8F0` | `border` | Разделители, границы карточек |
| `line-strong` | `#CBD5E1` | `input` | Границы полей и контурных кнопок |
| `cobalt` | `#3370FF` | `ring` | Фокус, декоративные акценты, графики; **не текст** |
| `cobalt-ink` | `#1D4ED8` | `primary`, `accent-foreground` | Заливка основной кнопки, ссылки, текст на `cobalt-soft` |
| `cobalt-deep` | `#1E40AF` | `primary` (hover) | Hover основной кнопки |
| `cobalt-soft` | `#EBF1FF` | `accent` | Активный пункт, выделение |
| `ruby`, `ruby-soft` | `#0F172A`, `#F1F5F9` | — (совпадает с `ink` / фоном) | В прототипе не обязательны; не переносить |
| `amber`, `amber-ink`, `amber-soft` | `#F59E0B`, `#B45309`, `#FEF3C7` | `warning` (custom) | Внимание, правка |
| `edit` | `#F97316` | — | Маркер «исправлено» (только не-текст) |
| `ok`, `ok-soft` | `#15803D`, `#DCFCE7` | `success` (custom) | Успех |
| `warn`, `warn-soft` | `#B45309`, `#FEF9C3` | `warning` (custom) | Предупреждение |
| `danger`, `danger-soft` | `#DC2626`, `#FEE2E2` | `destructive` | Ошибка, удаление |
| `penalty`, `penalty-soft` | `#1E3A8A`, `#E0E7FF` | `penalty` (custom, post-MVP) | Штрафы (тёмно-синий, не красный) |
| `bronze`, `silver`, `gold` | `#EA580C`, `#94A3B8`, `#EAB308` | `tier-1..3` (custom, post-MVP) | Уровни достижений |
| `series-1..3` | `#3370FF`, `#EA580C`, `#0D9488` | `chart-1..3` | Графики |

**MUST:** цвет в компонентах задаётся только токеном; hex и `rgb()` в коде компонентов запрещены. Красный — только ошибки и удаление (штрафы — `penalty`).

## 5. Контраст (WCAG 2.1 AA)

Порог: 4.5:1 для обычного текста, 3:1 для крупного (≥ 24 px или ≥ 18.66 px bold) и для границ/иконок интерфейса (1.4.11).

| Пара (текст / фон) | Отношение | Вердикт |
|--------------------|----------:|---------|
| `ink` / `paper` | 17.06 | ✔ |
| `ink` / `surface` | 17.85 | ✔ |
| `ink-2` / `surface` | 7.58 | ✔ |
| `ink-2` / `paper` | 7.24 | ✔ |
| `muted` / `surface` | 4.76 | ✔ (запас мал) |
| `muted` / `paper` | 4.55 | ✔ (запас мал) |
| `cobalt-ink` / `cobalt-soft` | 5.92 | ✔ |
| `ok` / `surface` | 5.02 | ✔ |
| `ok` / `ok-soft` | 4.57 | ✔ (запас мал) |
| `warn` / `warn-soft` | 4.68 | ✔ |
| `amber-ink` / `amber-soft` | 4.51 | ✔ (запас мал) |
| `danger` / `surface` | 4.83 | ✔ |
| `penalty` / `penalty-soft` | 8.41 | ✔ |
| `surface` / `penalty` | 10.36 | ✔ |
| `surface` / `cobalt-ink` | 6.70 | ✔ |
| `surface` / `cobalt-ink` (кнопка `B_PRIMARY`, D-6) | 6.70 | ✔ |
| `surface` / `cobalt-deep` (hover) | 8.72 | ✔ |
| `muted` / `surface` (граница поля, D-7) | 4.76 | ✔ нетекстовый ≥ 3 |
| `ink` / `danger-soft` (текст баннера, D-8) | 14.61 | ✔ |
| `surface` / `cobalt` | **4.28** | ✘ обычный текст — **не использовать** как фон с текстом |
| `cobalt` / `surface` (ссылка, текст) | **4.28** | ✘ — использовать `cobalt-ink` |
| `cobalt` / `paper` | **4.09** | ✘ — использовать `cobalt-ink` |
| `danger` / `danger-soft` | **3.95** | ✘ текст; ✔ только иконка и крупный жирный заголовок |
| `surface` / `bronze` | **3.56** | ✘ обычный текст — подпись уровня текстом `ink` |
| `line-strong` / `surface` | **1.48** | ✘ как граница поля — **не использовать**; допустим для контурной кнопки с текстом и разделителей |
| `edit` / `surface` (маркер) | **2.80** | ✘ нетекстовый — только вместе с текстовой меткой |

**Правила (решения владельца 2026-10-10):**
1. `cobalt` как цвет **текста** запрещён; ссылки и акценты — `cobalt-ink`.
2. Основная кнопка — `bg-cobalt-ink text-surface hover:bg-cobalt-deep` (D-6); `bg-cobalt` с белым текстом запрещён.
3. Баннер ошибки: иконка `danger`, заголовок жирный, текст сообщения `ink` на `danger-soft` (D-8); сообщение `danger` на `surface` допустимо.
4. Граница поля, текстовой области и чипа выбора — `muted` (D-7); `line-strong` — только контурные кнопки с текстом и разделители.
5. Маркер `edit` — только вместе с текстовой меткой; сам по себе информацию не несёт.

Прототип приведён к этим правилам (кнопка, граница полей, токен `cobalt-deep`).

## 6. Типографика

База — 18 px (`html { font-size: 112.5% }`, D-5 v2.0). Размеры — в `rem`; px ниже — при базе 18.

| Роль | Класс | Размер | Примечание |
|------|-------|--------|------------|
| Заголовок страницы (`h1`) | `font-display text-[1.75rem] sm:text-[2.125rem] font-medium leading-[1.1] tracking-[-0.01em]` | 31.5 → 38.25 px | Один на экран |
| Заголовок секции (`h2`) | `font-display text-[1.25rem] font-medium leading-snug` | 22.5 px | `H2` |
| Крупное число | `font-display text-3xl tabular-nums` | 33.75 px | Счётчики, баллы |
| Основной текст, подписи полей, ячейки таблиц, пункты меню | `text-base` (`font-body`), `leading-normal` (1.5) | 18 px | Всё содержимое `<main>` по умолчанию |
| Подпись под значением, подсказка, метаданные | `text-sm text-muted` | 15.75 px | **Пол кегля.** `muted` / `ink-2` |
| Кнопка, чип, сегмент | `text-base font-medium` | 18 px | Было `text-[0.9375rem]` |
| Бейдж, счётчик | `text-xs font-medium` | 13.5 px | **Единственное** место `text-xs` (`Badge`, `CountBadge`) |
| Текст стиха | `font-display italic text-base` | 18 px | Alegreya курсив |

**MUST:**
- числа в таблицах и счётчиках — `tabular-nums`; русские и английские тексты — запас +30 % по ширине (ЛК-8); заголовки — через атом `Heading`, не сырой `h1` с классами;
- в содержимом `<main>` нет `text-xs` и произвольных `text-[…rem]` меньше `0.875rem`; `text-sm` — только подпись под значением, подсказка, метаданные строки (ADR-014 R-3);
- интерактивные элементы и ячейки таблиц — не меньше `text-base`.

**Контраст и размер.** Порог «крупного текста» WCAG (≥ 24 px либо ≥ 18.66 px жирным) не достигается ни одним размером тела; для всего текста действует 4.5:1 (§5). Пары цветов v2.0 не менялись.

## 7. Форма и глубина

| Элемент | Правило |
|---------|---------|
| Поля, кнопки, `Select`, `DateField`, чипы | `rounded-lg`; высота — шкала D-9: `h-10` по умолчанию, `h-9` только внутри таблиц, `h-11` для главного действия на мобильном. Соседние контролы одного ряда одной высоты |
| Контейнер страницы | `max-w-[1400px]`, `px-4 sm:px-6 lg:px-8`, влево; узкая страница — `PageSection width="form"` (`max-w-3xl`, 48rem) или `"wide"` (`max-w-5xl`, 64rem), тоже влево (ADR-014 R-4); экраны `(auth)` используют свою рамку `AuthScreen` |
| Сайдбар (`lg+`) | `w-64` (16rem = 288 px при базе 18), `border-r border-line bg-surface`, высота `100dvh` минус шапка, прокрутка внутри; строка пункта `min-h-10 rounded-lg px-3 py-1.5 text-base leading-tight` (длинная подпись переносится на вторую строку, не усекается) |
| Карточки | `rounded-xl border border-line bg-surface`; без тени |
| Bottom-sheet | `rounded-t-2xl`, `max-h-[92dvh]`, нижний отступ `env(safe-area-inset-bottom)` |
| Выпадающие панели | `rounded-xl border border-line` + одна тень `shadow-[0_10px_30px_rgba(15,23,42,0.12)]` |
| Иконки | `size-4` / `size-5`, `stroke-width 1.75`, декоративные — `aria-hidden` |

Глубина — границами, не тенями; тень только у плавающих панелей (dropdown, toast).

## 8. Рецепты компонентов

| Компонент | Рецепт (прототип) | shadcn |
|-----------|-------------------|--------|
| Кнопка основная | `BTN` (`h-10 px-3.5 text-base font-medium`) + `bg-cobalt-ink text-surface hover:bg-cobalt-deep` (D-6) | `Button` `default` |
| Кнопка контурная | `border border-line-strong bg-surface text-ink hover:bg-paper` | `Button` `outline` |
| Кнопка текстовая | `text-ink hover:bg-line/60` | `Button` `ghost` |
| Кнопка опасная | `border border-danger/60 text-danger hover:bg-danger-soft`; заливка `bg-danger text-surface` — только в `ConfirmDialog` (R-11) | `Button` `destructive` / `destructive-solid` |
| Кнопка штрафа (post-MVP) | `bg-penalty text-surface` | custom |
| Поле | `h-10 w-full rounded-lg border border-muted bg-surface px-3 text-base focus:border-cobalt-ink` + `label` над полем (`mb-1.5 text-base font-medium`) | `Input`, `Label` |
| Select | Триггер как поле: `h-10 w-full rounded-lg border border-muted bg-surface px-3 text-base`, справа шеврон `size-4 text-muted`; панель `DD_PANEL`, пункт `h-10 rounded-lg px-2.5 text-base`, выбранный `bg-cobalt-soft text-cobalt-ink` (D-13) | `Select` |
| Checkbox | `size-5 rounded border border-muted bg-surface`; выбран `border-cobalt-ink bg-cobalt-ink`, галочка `text-surface`; подпись `text-base` рядом, область касания ≥ 44 px | `Checkbox` |
| DateField | Как поле, `inputmode="numeric"`, ввод `ДД.ММ.ГГГГ` / ISO по локали из `lib/i18n/format.ts`, справа кнопка-иконка календаря `size-10`; панель календаря `DD_PANEL` | `DateField` (+ `Popover`) |
| Чип / сегмент | Невыбранный `h-10 rounded-lg border border-input bg-surface px-3 text-base hover:border-ink-2`; выбранный `border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink` (D-10); `role="radio"` / `aria-pressed` | `SegmentedControl` (режимы `radio`, `toggle`) |
| Карточка | `rounded-xl border border-line bg-surface p-4 sm:p-5` | `Card` |
| Пункт сайдбара | `min-h-10 rounded-lg px-3 py-1.5 text-base leading-tight text-ink hover:bg-line/60`; текущий `bg-cobalt-soft font-bold text-cobalt-ink` + `aria-current="page"`; заголовок группы `px-3 pt-4 pb-1 text-sm font-medium text-muted` | `SidebarNav` |
| Меню (drawer) | панель слева `w-[min(20rem,86vw)]`, `bg-surface`, затемнение `bg-ink/40` | `Sheet` |
| Диалог | bottom-sheet `bg-surface`, затемнение `bg-ink/45`, `role="dialog" aria-modal` | `Dialog` / `Drawer` |
| Toast | `bg-ink text-surface rounded-lg`, 2.8 с, `aria-live="polite"` | `Sonner` |
| Бейдж-ссылка на стих | `rounded-md bg-paper px-1.5 ring-1 ring-line text-sm font-medium` | `Badge` |
| Метр прогресса | трек `bg-line`, заливка `bg-cobalt`, подпись числом | `Progress` |
| Выпадающее меню | `DD_PANEL`, пункты `rounded-lg px-2.5 py-2`, активный `bg-cobalt-soft text-cobalt-ink` | `DropdownMenu` |

Состояния кнопок: `hover`, `active:scale-[0.97]` (не при `motion-reduce`), `focus-visible:outline-2 outline-offset-2 outline-cobalt`, `disabled:opacity-45`.

## 9. Движение и доступность

1. Длительности 100–300 мс, кривая `ease-out-soft` (`cubic-bezier(0.22,1,0.36,1)`).
2. `motion-reduce:` отключает масштабирование и переходы панелей; `reduce-transparency:` убирает размытие шапки.
3. Фокус всегда виден (`focus-visible`), контур `cobalt` 2 px со смещением.
4. Цель касания ≥ 44 px: `h-10` при базе 18 px = 45 px подходит для всех контролов; `h-9` (40.5 px) только в плотных таблицах с увеличенной областью касания (псевдоэлемент или `min-h-11` у строки-ссылки).
5. Информация не передаётся только цветом: у статуса есть текст или иконка.
6. Текущий пункт меню — `aria-current="page"`, раскрываемое — `aria-expanded`.

## 10. Rules / anti-patterns

| Принцип | Правило | Anti-pattern |
|---------|---------|--------------|
| Токены | Только токены темы | `bg-[#3370FF]`, `style=""` |
| Утилиты | Только Tailwind-утилиты в разметке | Доменные классы `.lesson-card` |
| Шрифт | `font-display` (Alegreya) для заголовков, чисел-акцентов и текстов стихов, `font-body` (Source Sans 3) для остального | Третий шрифт; Alegreya Sans |
| Кегль | В `<main>` — `text-base`; `text-sm` только метаданные; `text-xs` только `Badge` / `CountBadge` | `text-xs` и `text-[0.75rem]` в таблицах и подписях полей |
| Контролы | `Select`, `Checkbox`, `DateField`, `SegmentedControl` из каталога | Нативные `<select>`, `type="checkbox"`, `type="date"`; ручные кнопки-чипы с `bg-ink` как «выбрано» |
| Контейнер | Один контейнер R-4, узкие — `PageSection` | `max-w-*` и `mx-auto` на странице |
| Акцент | `cobalt-ink` на действиях, текущем пункте, ссылках в прозе | Cobalt на именах в таблицах и числах календаря |
| Красный | Ошибки и удаление | Штраф или «минус» красным |
| Декор | Без градиентов и эмодзи в интерфейсе | Эмодзи в кнопках |
| Прототип | Эталон внешнего вида, не кода | Копирование JS-шаблонов в приложение |

Реализация каталога компонентов и страницы `/design-system` — [`design_system_lab_spec.md`](../implementation/mvp/specs/design_system_lab_spec.md) (W15).

## 11. Paths (H / N / S)

| Путь | Описание | Исход |
|------|----------|-------|
| **H** | Рецепты §8 воспроизводят экраны прототипа на 390 px и `md` | Сравнение со скриншотом/DOM прототипа без видимых расхождений |
| **N** | Состояния `disabled`, ошибка поля, загрузка | Визуально различимы по тексту/иконке и контрасту ≥ AA |
| **a11y** | Клавиатура и фокус | Все интерактивные элементы достижимы и видимы |
| **S** | — | N/A — контракт визуальный, данные и доступ не затрагивает |
| **Rollback** | Optimistic UI | N/A — правила в UX-04 (W7, не требуется на lean) |

## 12. Acceptance criteria

- [ ] Каждый токен §4 присутствует в token dump прототипа — исход: нет «лишних» и пропущенных значений.
- [ ] В `globals.css` (P6) все токены §4 заданы переменными и доступны как utility (`bg-primary`, `text-muted-foreground`) — исход: `/design-system` показывает палитру.
- [ ] Для каждой используемой пары текст/фон есть значение в §5 — исход: нет пары без числа.
- [ ] Пары со статусом ✘ запрещены правилом §5 — исход: в прототипе и коде нет таких пар (grep `bg-cobalt text-surface`, `border-line-strong` у полей).
- [ ] В коде нет hex и `style=""` — исход: grep и lint пусты.
- [ ] v2.0: `html` 112.5%, `font-body` — Source Sans 3, Alegreya Sans нет в `layout.tsx` и `globals.css` — исход: grep `Alegreya_Sans|Alegreya Sans` пуст вне Change log.
- [ ] v2.0: в содержимом `<main>` computed `font-size` любого текстового узла ≥ 15.75 px, у кнопок, чипов, пунктов меню, ячеек таблиц — 18 px — исход: проверка `getComputedStyle` по 13 экранам (P14 UI-verify).
- [ ] v2.0: нет нативных `<select>`, `type="checkbox"`, `type="date"` в `apps/web/src` — исход: grep пуст (исключения — только Design Lab-витрина «нативный антипример», если есть).
- [ ] v2.0: у соседних контролов одной строки высоты равны; значения только из D-9 — исход: замер `getBoundingClientRect().height`.
- [ ] v2.0: выбранный чип везде D-10 — исход: grep `bg-ink` в компонентах чипов пуст.
- [ ] v2.0: `getComputedStyle(main).outlineStyle === "none"` после навигации; `:focus-visible` на кнопке виден (D-12).
- [ ] v2.0: сверка классов прототипа и компонентов по [`prototype_class_parity_spec.md`](../implementation/mvp/specs/prototype_class_parity_spec.md) — исход: трасса `Parity: N строк, расхождений 0`.

## 13. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| — | Вопросы Q-01…Q-03 (кнопка, границы полей, баннер) закрыты решениями владельца 2026-10-10: D-6, D-7, D-8 | — | — |

## 14. Related documents

| Document | Relationship |
|----------|--------------|
| [`responsive_navigation_contract.md`](./responsive_navigation_contract.md) | Оболочка и навигация |
| [`prototype_route_mapping.md`](./prototype_route_mapping.md) | Экран прототипа → маршрут |
| [`typography_text_guidelines.md`](../guidelines/typography_text_guidelines.md) | Enforcement слой для текста |
| [`design_system_lab_spec.md`](../implementation/mvp/specs/design_system_lab_spec.md) | Витрина компонентов (W15) |
| [`adr_014_app_redesign_v2.md`](../prds/07_governance/adr_014_app_redesign_v2.md) | Решения v2.0 (R-1…R-12) |
| [`redesign_v2_ui_spec.md`](./redesign_v2_ui_spec.md) | Что и в каком компоненте менять |
| [`prototype_class_parity_spec.md`](../implementation/mvp/specs/prototype_class_parity_spec.md) | Сопоставление классов прототипа и компонентов |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W2-03

## 15. Agent notes

- Не «исправлять» значения из прототипа молча: расхождения с AA — через Q-01…Q-03.
- Не вводить `.dark` и тёмные токены.
- Не использовать `cobalt` как цвет текста; ссылки — `cobalt-ink`.
- Нестандартный размер — только из таблицы §6; новый — сначала правка контракта.
- v2.0: не писать `text-xs` и `text-[0.9375rem]` в содержимом экрана; не создавать нативные `select` / `checkbox` / `date`; не вводить собственный контейнер ширины на странице (§7).
- v2.0: старые D-2 и D-5 не применять — действуют версии из таблицы §3.

## Change log

| Date | Change |
|------|--------|
| 2026-10-10 | v1.0 — Canonical (W2-03); контраст рассчитан; шрифты Alegreya |
| 2026-10-10 | v1.1 — решения владельца: D-6 (primary = cobalt-ink, hover cobalt-deep), D-7 (границы полей muted), D-8 (баннер ошибки); прототип приведён |
| 2026-10-24 | v2.0 — ADR-014 (P14): D-2 → Source Sans 3, D-5 → 18 px; D-9…D-13 (высоты контролов, выбранный чип, бюджет акцента, фокус `main`, запрет нативных контролов); §6 шкала на 18 px с полом 15.75 px; §7 контейнер и сайдбар; §8 рецепты Select / Checkbox / DateField / Chip / SidebarNav; §10 и §12 дополнены. Палитра §4 и пары §5 не менялись |
