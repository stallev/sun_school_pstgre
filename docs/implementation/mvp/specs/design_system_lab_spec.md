# Design System Lab spec — каталог компонентов `/design-system`

**Тип:** Spec  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-10-24  
**Волна:** W15-01 (v2.0 — W12, P14)  
**Зависит от:** [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) (UX-03), [`ui_states_contract.md`](../../../design/ui_states_contract.md) (UX-05), [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md) (UX-06), [`global_shell_spec.md`](./global_shell_spec.md), [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md), [`canonical_routes.md`](../../../design/canonical_routes.md), [`project_quality_profile.md`](../../../meta/project_quality_profile.md) (D8, D10), [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md), [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) §8  
**Связанные документы:** [`sunday_school_prototype.html`](../../../prototypes/sunday_school_prototype.html) (`<head>`: token dump, gap-список; хелперы и константы), [`prototype_class_parity_spec.md`](./prototype_class_parity_spec.md) (сопоставление классов прототипа и компонентов), [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md), [`adr_014_app_redesign_v2.md`](../../../prds/07_governance/adr_014_app_redesign_v2.md), [`adr_001_stack_and_runtime.md`](../../../prds/07_governance/adr_001_stack_and_runtime.md), [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** shadcn/ui — ui.shadcn.com через WebFetch, 2026-10-11: `components.json` — `style` и `tailwind.cssVariables` **не меняются после init**; документация перечисляет только стиль `new-york`; страница установки для Next.js упоминает выбор «base» в мастере и команду `shadcn@latest init`, но **не документирует** флаг `-b base` и стиль `base-vega`, которые указаны в правиле `ui-design-system-shadcn.mdc`. Эти значения не были в документации — **подтверждены на preflight P6 (2026-10-11)** через CLI `shadcn@4.21.4`: `init -b base -p vega` → `"style": "base-vega"` (Q-01 закрыт). Токены, `@theme inline`, контраст — по [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) (Tailwind v4, WebFetch 2026-10-10). Route groups и `notFound()` — Next.js App Router (nextjs.org; по [`ui_states_contract.md`](../../../design/ui_states_contract.md)). Context7 недоступен.

---

## 1. Purpose

Определить **что и в каком порядке** строится на фазе P6 (Design System Lab): токены в `globals.css`, атомы, примитивы, страница-каталог `/design-system`, и **как каталог растёт** в продуктовых фазах. Читают: исполнитель P5–P6, авторы UI-задач всех фаз, `reviewer` UI.

## 2. Scope / Out of scope

| В scope (Phase 1, P6) | Вне scope |
|-----------------------|-----------|
| Токены темы и шрифты | Тёмная тема (UX-03 D-4) |
| Атомы и примитивы L1–L2 | Маркетинговые и публичные страницы |
| L3-паттерны из UX-05 / UX-06 | Storybook и визуальные регрессии (не на lean) |
| Страница `/design-system` (dev-only) | Продуктовые экраны (specs W9, фазы P01+) |
| Правила наращивания каталога | Компоненты post-MVP (достижения, штрафы, голос) — зарезервированы токенами |

Компоненты **доменного** слоя (L4) создаются в продуктовых фазах, но **секция в Lab добавляется первой** (§9).

## 3. Source of truth и расхождения

Иерархия: [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) (UX-03) → прототип (visual reference only, не код) → правила `ui-*` → shadcn по умолчанию.

| ID | Расхождение | Решение |
|----|-------------|---------|
| Drift-1 | Правило `ui-design-system-shadcn.mdc` описывает `:root` **и** `.dark` на `<html>` через `next-themes`; UX-03 D-4: тёмной темы нет | В P6 `.dark` и `next-themes` **не создаются**; правка правила — в P4 (T2 ещё не активирован) |
| Drift-2 | Правило указывало `shadcn init -b base`, `"style": "base-vega"` — документация shadcn этого не подтверждала | **Решено P6 (2026-10-11):** CLI `shadcn@4.21.4` — `init -b base -p vega` создаёт `"style": "base-vega"`; реестр `ui.shadcn.com/r/styles/base-vega/*` отвечает 200. Значение записано в `apps/web/components.json` |
| Drift-3 | Прототип рисует иконки SVG-спрайтом, правило `ui-icons-lucide` требует lucide | Использовать lucide; соответствие имён — таблица §5.5 |
| Drift-4 | `styleguide.md` (UX-09) на lean не создаётся | Рецепты компонентов — [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) §8; **не копировать** в этот документ |

## 4. Route и защита

| Свойство | Значение |
|----------|----------|
| URL | `/design-system` |
| Файлы | `apps/web/src/app/(dev)/design-system/layout.tsx`, `page.tsx` (группа `(dev)` не входит в URL) |
| Оболочка | **нет**: свой минимальный layout; `(app)`-оболочка не оборачивает |
| Доступ | только `APP_ENV=dev`; иначе `notFound()` (в prod и в preview без `dev`) |
| `proxy.ts` | в `APP_ENV=dev` маршрут разрешён без сессии (allowlist по значению env); в prod — как любой неизвестный маршрут (404). **Реализация P6:** `canVisitRoutePrefix` — заглушка «allow all» до P01-CU5, поэтому allowlist `/design-system` входит в таблицу статус × маршрут P01-CU5; доступ уже закрыт guard-ом `layout.tsx` (`process.env.APP_ENV !== "dev"` → `notFound()`; значение фиксируется при сборке, статическая пре-рендер-страница) |
| SEO | `noindex`, не в sitemap |
| Canonical routes | строка «dev-only» в [`canonical_routes.md`](../../../design/canonical_routes.md) §4.5 |
| Бандл | код `components/design-lab/**` не импортируется из продуктовых маршрутов; проверка — lint (§10) |

## 5. Каталог

### 5.1 Слои

| Слой | Путь | Импорт | Содержимое |
|------|------|--------|------------|
| Токены | `app/globals.css` | семантические классы Tailwind | цвета, радиусы, тени, шрифты |
| L1 Atoms | `components/atoms/` | `@/components/atoms` | типографика, иконка, подписи |
| L2 Primitives | `components/ui/` | `@/components/ui/*` | токенизированные shadcn / Base UI примитивы |
| L3 Patterns | `components/patterns/` | `@/components/patterns/*` | составные блоки без домена (empty state, banner, page header) |
| L4 Domain | `components/{domain}/` | `@/components/{domain}/*` | `lessons`, `check`, `people`, `bricks`, `admin` — по фазам |
| Shell | `components/shell/` | — | [`global_shell_spec.md`](./global_shell_spec.md) §4 |
| Lab | `components/design-lab/` | **только** `(dev)/design-system` | витрина |

### 5.2 Атомы (L1)

| Компонент | Назначение | Варианты | Источник (прототип) |
|-----------|------------|----------|---------------------|
| `Heading` | `h1`/`h2`/`h3` с визуальным уровнем отдельно от семантики | `level`, `as` | `font-display` классы, `H2` |
| `BodyText`, `MutedText` | основной (`text-base`, 18 px) и вспомогательный (`text-sm text-muted`, 15.75 px — пол кегля) текст; реализация — `ContentText` (`tone`: `body`, `secondary`, `muted`) | `ink`, `ink-2`, `muted` | `text-base`, `text-sm text-muted` |
| `NumberDisplay` | крупное число, `tabular-nums` | размеры | счётчики, баллы |
| `FieldError` / `AlertText` | текст ошибки: иконка + текст, `role="alert"` по контексту | — | `data-err`, `err_*` |
| `Icon` | lucide, `aria-hidden`, `size-4`/`size-5`, `stroke 1.75` | — | `ic()` |

### 5.3 Примитивы (L2)

| Компонент | Варианты / состояния | Рецепт | Прототип |
|-----------|----------------------|--------|----------|
| `Button` | `default` (cobalt-ink, hover cobalt-deep, D-6), `outline`, `ghost`, `destructive` (контур), `destructive-solid` (только `ConfirmDialog`); размеры `default` (`h-10`, D-9), `compact` (`h-9`, таблицы), `touch` (`h-11`), `icon` (`size-10`); текст `text-base font-medium`; `pending` (spinner + `aria-busy`), `disabled` | UX-03 §8 | `BTN`, `B_PRIMARY`, `B_OUTLINE`, `B_GHOST`, `B_DANGER` |
| `Card` | `p-4 sm:p-5`; без тени | UX-03 §7–§8 | `CARD` |
| `Input`, `Textarea` | границы `muted` (D-7), `h-10`, `text-base`; состояния `invalid`, `disabled` | UX-03 §8; UX-06 F3, F9 | `FIELD` |
| `Select` (Base UI; уже в `components/ui/select.tsx`) | триггер как `Input` (`w-full`, `h-10`, `text-base`), шеврон справа, панель `DD_PANEL`, пункт `min-h-10 text-base`; **нативный `<select>` запрещён** (UX-03 D-13). Для form-submit — проп `name` на `Select.Root` (Base UI рендерит скрытый input); размеры `default` и `compact` (`h-9`) | UX-03 §8; UX-06 F3, F9 | `FIELD`, `SEL` |
| `DateField` (v2.0) | поле + кнопка-календарь (`Popover`), ввод в формате локали из `lib/i18n/format.ts`, значение — ISO `YYYY-MM-DD` в `name`-input; **нативный `type=date` запрещён** | UX-03 §8 | `FIELD`, `type=date` |
| `Field`/`Label` | подпись над полем (`text-base font-medium`), ошибка, подсказка (`text-sm`) | UX-06 F1, F3 | `LABEL` |
| `Checkbox`, `Switch` | `Checkbox` `size-5`, подпись `text-base`, зона касания ≥ 44 px; `Switch` как есть | — | `toggle`, чекбокс согласия |
| Чип выбора (v2.0) = `SegmentedControl` | единый чип (UX-03 D-10): невыбранный `border-input`, выбранный `border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink`; высота `h-10` (`size="compact"` — `h-9`); режим `radio` (по умолчанию, `role="radiogroup"`) и `toggle` (`aria-pressed`, независимые чипы-фильтры); заменяет ручные кнопки в `AnalyticsGradeChips`, `AnalyticsPeriodChips`, `YearStrip` | UX-03 §8 | `CHIP`, `yearChips`, `groupChips`, `periodChips` |
| `PageSection` (v2.0) | ширина страницы: `full` (по умолчанию, контейнер 1400), `form` (`max-w-3xl`, 48rem), `wide` (`max-w-5xl`, 64rem); всегда влево; `(auth)` — `AuthScreen` | UX-03 §7 | `#view` |
| `SegmentedControl` | `role="radiogroup"`; 2–4 опции; выбранный по D-10 | UX-06 §5 | `seg()` |
| `ScoreSelector` | «— / 0…N», `radiogroup`, 4 или 12 кнопок, сетка 6 колонок на мобильном | [`homework_check_flow_spec.md`](./homework_check_flow_spec.md) §5.3 | `scoreRow()` |
| `ScorePad` | тихая ячейка сводной таблицы: стихи — сразу `— 0 1 2`; тест/тетрадь — цифра/`—` + панель «Не оценивалось» и сетка `0…5`/`6…10`; md+ — `Popover` (`@base-ui/react` 1.9.0, flip вверх); <md — разворот под полем; одна открытая панель. Состав: `score-pad`, `score-cell`, `ChoiceMatrix`. **Не** заменяет `ScoreSelector` / `ScoreGroup` | [`homework_check_flow_spec.md`](./homework_check_flow_spec.md) §7.1–§7.3 | `vLessonTable` (`data-tbl`) |
| `Badge` | ссылка на стих (`RefBadge`), статус | — | `ref()` |
| `CountBadge` | число у пункта меню; скрывается при нуле | — | `badge()` |
| `Progress` | трек `line`, заливка `cobalt`, подпись числом | — | `meter()` |
| `StatusText` | иконка + текст (ok / warn / danger) | UX-03 §9.5 | `status()` |
| `Skeleton` | повторяет геометрию (S1.2) | — | — |
| `Table` | `th scope="col"`, горизонтальная прокрутка, фикс. первый столбец | — | `vLessonTable` |
| `Dialog` | bottom-sheet; фокус по APG; `confirm` с danger | [`global_shell_spec.md`](./global_shell_spec.md) §6.5 | `openDialog`, `confirmDialog` |
| `Sheet` | drawer слева | UX-03 §8 | `#drawer` |
| `Disclosure` | кнопка `aria-expanded` + панель (меню пользователя); навигацию не строит (v2.0) | [`global_shell_spec.md`](./global_shell_spec.md) §6.3 | `DD_PANEL` |
| `Toast` | Sonner, 2000 ms, позиции | [`global_shell_spec.md`](./global_shell_spec.md) §6.5 | `toast()` |

Подсистема shadcn/Base UI подтверждается на preflight (Q-01); при расхождении имён — `components.json` и этот список корректируются вместе.

### 5.4 Паттерны (L3)

| Паттерн | Состав | Источник |
|---------|--------|----------|
| `PageHeader` | заголовок, подзаголовок, действия, `BackLink` | `pageHead`, `backLink` |
| `EmptyState` | иконка `muted`, объяснение, одно действие (S2.1, S2.2) | UX-05 |
| `ErrorState` | сообщение по коду, `retry`, «На главную» (S3) | UX-05 |
| `ForbiddenState` | 403 внутри оболочки (S4.3) | UX-05 |
| `Banner` | `info` / `warn` / `danger` (D-8: иконка `danger`, текст `ink` на `danger-soft`) | UX-03 D-8; D1, D3, D13 |
| `FormSection` | карточка с `h2`, полями, ошибкой формы, кнопками (F7, F8) | `vRegister` |
| `ConfirmDialog` | заголовок, что произойдёт, `danger`, фокус «Отмена»; вариант со словом подтверждения | UX-06 §7.1 |
| `ScoreGroup` | подпись + `ScoreSelector` + метка «сдано позже» + раскрытие текста стиха | `vCheck` |
| `CheckCardHeader` | ФИО, «N из M», итог баллов | `vCheck` |
| `TableRowStates` | «не проверен» / «не был» / «позже» (текст + фон) | `vLessonTable` |
| `NavDrawer`, `SidebarNav`, `UserMenu` | см. global_shell_spec (v2.0: `SidebarNav` вместо `TopNav`) | `#shell`, `sidebarHTML` |

### 5.5 Иконки (lucide)

| Прототип (`#i-*`) | lucide |
|-------------------|--------|
| `i-left`, `i-right`, `i-down` | `ChevronLeft`, `ChevronRight`, `ChevronDown` |
| `i-ok`, `i-circle`, `i-alert` | `CheckCircle2`, `Circle`, `AlertTriangle` |
| `i-person`, `i-logout`, `i-key` | `User`, `LogOut`, `KeyRound` |
| `i-grid`, `i-check`, `i-edit` | `Table2`, `CheckCheck`, `Pencil` |
| `i-globe`, `i-send`, `i-brick`, `i-undo` | `Globe`, `Send`, `Blocks`, `Undo2` |

Соответствие уточняется на P6; новая иконка — запись в этой таблице и Lab (`ui-icons-lucide`).

### 5.6 Доменные компоненты (L4, по фазам)

| Фаза (предв.) | Компоненты | Якорь прототипа |
|---------------|------------|-----------------|
| Вход, профиль | `ProviderButton`, `ConsentBlock`, `LinkedIdentityRow` | `login`, `vRegister`, `vProfile` |
| Школа, люди | `GroupCard`, `PupilRow`, `ApprovalRow`, `UserRow`, `YearCard` | `groups`, `people`, `approvals`, `year` |
| Уроки, проверка | `LessonCard`, `VerseRefList`, `CheckProgress`, `LessonTable` | `lessons`, `vCheck`, `lessonTable` |
| Кирпичики | `BalanceCard`, `LedgerRow`, `IssueForm` | `bricks` |
| Журнал, удаление | `AuditRow`, `DeletionRequestCard`, `DeletionPlan` | `audit`, `deletions` |

Фиксируется при написании W11; список — ориентир, не обязательство.

## 6. Токены и `globals.css`

| Правило | Значение |
|---------|----------|
| Источник | UX-03 §4 (цвета), §6 (типографика), §7 (форма), §9 (движение) |
| Структура | `:root` — семантические переменные (shadcn); `@theme inline` — маппинг на Tailwind v4; **без** `.dark` (D-4) |
| Основные соответствия | `background`=`paper`; `card`/`popover`=`surface`; `foreground`=`ink`; `primary`=`cobalt-ink`, hover=`cobalt-deep`; `ring`=`cobalt`; `input`/граница поля=`muted` (D-7); `border`=`line`; `destructive`=`danger`; `success`=`ok`; `warning`=`warn`/`amber`; `accent`=`cobalt-soft` |
| Зарезервировано (post-MVP) | `penalty`, `penalty-soft`, `tier-1..3` — объявлены, в компонентах MVP не используются |
| Шрифты | `next/font`: Alegreya (display), Source Sans 3 (body; v2.0, D-2), subsets `latin` + `cyrillic`; переменные `--font-display`, `--font-body` |
| Размер | `html { font-size: 112.5% }` (18 px), размеры в `rem` (D-5 v2.0) |
| Высоты контролов | `--control-h` (2.5rem), `--control-h-compact` (2.25rem), `--control-h-touch` (2.75rem) (D-9) |
| Фокус `main` | `main:focus:not(:focus-visible) { outline: none }` (D-12) |
| Кривая | `ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1)` |
| Кастомный вариант | `reduce-transparency` (`prefers-reduced-transparency`) |
| Запрещено | hex/`rgb()` и `style=""` в компонентах; `cobalt` как цвет текста; `line-strong` как граница поля |

## 7. Страница Lab

### 7.1 Структура

| Уровень | Содержимое | Данные |
|---------|------------|--------|
| **L1 Tokens** | Сетка цветов с названием токена и hex; таблица пар «текст / фон» с отношением контраста и вердиктом (UX-03 §5); шкала типографики (`h1`, `h2`, число, текст, подпись); радиусы, глубина (граница vs тень), движение | `lib/design-lab/tokens.ts` (из UX-03 §4–§5) |
| **L2 Primitives** | Для каждого примитива матрица «вариант × состояние» (default, hover, focus, disabled, pending, invalid) на 390 px | `lib/design-lab/matrices.ts` |
| **L3 Patterns** | Паттерны §5.4 в типичных контекстах, включая состояния UX-05 (D1, D3, D13, S2…S4) и формы UX-06 | `lib/design-lab/fixtures.ts` (вымышленные данные) |

Каждая секция: заголовок, список вариантов с подписью, **якорь прототипа** (`screen`/хелпер) и ссылка на раздел контракта.

### 7.2 Управление

| Контрол | Поведение |
|---------|-----------|
| Ширина | контейнеры 390 / 768 / 1024 / 1280 px (CSS container, не `window`; 1024 — граница сайдбара) |
| Навигация | липкая панель якорей L1 / L2 / L3 |
| Тема | **переключателя нет** (D-4) |
| Состояния | переключатели «disabled», «pending», «invalid» применяются к матрице |

### 7.3 Файловая раскладка

```
apps/web/src/
  app/(dev)/design-system/{layout,page}.tsx
  components/design-lab/            # только витрина, один компонент — один файл
    DesignLabSection.tsx · DesignLabTokens.tsx · DesignLabTypography.tsx
    DesignLabButtons.tsx · DesignLabFields.tsx · DesignLabScore.tsx
    DesignLabPatterns.tsx · DesignLabControls.client.tsx
  lib/design-lab/{tokens,matrices,fixtures,prototype-refs}.ts
```

Модули `lib/design-lab` — данные без JSX; секции ≤ ~140 строк, при превышении — разбиение.

## 8. Fidelity с прототипом

| Шаг | Правило |
|-----|---------|
| 1 | Открыть прототип во встроенном браузере: экран-источник (§5.3–§5.4) |
| 2 | Сверить размеры, веса, цвета по [UX-03](../../../design/visual_identity_contract.md), не копируя разметку и JS |
| 3 | Реализовать компонент по рецепту §8 UX-03; различия (disclosure вместо `menu`, `Link`, lucide) — по specs |
| 4 | Добавить секцию в Lab с якорем и проверить на 390 px и `md` |
| 5 | Если рецепт отсутствует — сначала правка UX-03, затем код |
| 6 (v2.0) | Сверить классы компонента со строкой таблицы [`prototype_class_parity_spec.md`](./prototype_class_parity_spec.md) §2 по протоколу §4 этого документа; результат — трасса `Parity: …` |

## 9. Правила наращивания каталога

| ID | Правило |
|----|---------|
| C-1 | Продуктовый экран собирается **только** из каталога (`atoms`, `ui`, `patterns`, домен); дублирование разметки примитива запрещено |
| C-2 | Новая вариация: вариант в CVA/атоме → секция Lab → использование на экране (в одном CU) |
| C-3 | Нельзя импортировать `components/design-lab/**` и `lib/design-lab/**` из продуктовых маршрутов |
| C-4 | Компонент не зависит от данных: props — DTO/view-model (SOLID, `ai-dry-deduplication`) |
| C-5 | Один компонент — один файл (`react-one-component-per-file`) |
| C-6 | Тексты — через словари (ADR-008): в каталоге демо-тексты из `lib/design-lab/fixtures.ts` не попадают в бандл продукта |

## 10. Шаги реализации (P6)

| Шаг | Работа | DoD |
|-----|--------|-----|
| 0 | Preflight: версии Next.js 16.4 / Tailwind v4 / shadcn; проверить `shadcn init` (Base UI) и стиль (Q-01) | `components.json` создан; Q-01 закрыт |
| 1 | Токены: `globals.css`, шрифты, `@theme inline`, утилиты | typecheck; нет `.dark`; контраст по таблице |
| 2 | Атомы L1 | Lab L1/L2 секции |
| 3 | Примитивы L2 (shadcn → токены → варианты) | матрицы в Lab, 390 px |
| 4 | Паттерны L3 | секции L3, состояния UX-05/06 |
| 5 | Страница Lab, guard, `proxy.ts` allowlist, `canonical_routes` | prod → 404 |
| 6 | Правила: lint на запрет hex, импорт `design-lab`, `radix` | `npm run lint` |
| 7 | Документация: `components.json`, список L2/L3, индекс | docs sync в том же CU |

## 11. Paths (H / N / S)

| Путь | Описание | Исход |
|------|----------|-------|
| **H** | Разработчик открывает `/design-system` в dev | Видит токены, матрицы и паттерны; ширины 390 / 768 / 1280 |
| **H** | Добавляется новая вариация `Button` | Секция в Lab обновлена, на экране используется из каталога |
| **N** | `/design-system` открыт в prod или preview | 404 |
| **N** | Компонент использует hex / `.dark` | lint отклоняет |
| **N** | Продуктовый маршрут импортирует `design-lab` | lint отклоняет |
| **S** | Lab раскрывает данные | N/A — только вымышленные фикстуры; нет доступа к БД и сессии |
| **a11y** | Клавиатура и фокус | Все интерактивные примеры достижимы, фокус виден (UX-03 §9) |

## 12. Acceptance criteria

- [ ] `/design-system` в `APP_ENV=dev` показывает L1, L2, L3 на 390 / 768 / 1280 px — исход: ручная проверка.
- [ ] В prod-сборке `/design-system` → 404 — исход: проверка маршрута.
- [ ] Таблица контраста Lab совпадает с UX-03 §5 — исход: сверка.
- [ ] В `globals.css` нет `.dark`, hex в компонентах нет — исход: grep / lint.
- [ ] Каждый компонент §5.3 имеет секцию Lab с вариантами и состояниями — исход: сверка списка.
- [ ] Основные кнопки: `cobalt-ink`, hover `cobalt-deep`; границы полей `muted` — исход: визуальная сверка и токены.
- [ ] `ScoreSelector` и `SegmentedControl` управляются клавиатурой (стрелки) — исход: ручной шаг.
- [ ] Продуктовые маршруты не импортируют `design-lab` — исход: lint.
- [ ] v2.0: в Lab есть секции `Select`, `DateField`, `SegmentedControl` (режимы `radio` / `toggle`, размеры), `PageSection`, `SidebarNav` с матрицей «вариант × состояние» на 390 / 1024 / 1280 — исход: сверка списка.
- [ ] v2.0: `grep` по `apps/web/src` на `<select`, `type="checkbox"`, `type="date"` пуст — исход: проверка.

## 13. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| Q-01 | ~~Подтвердить `shadcn init` с Base UI и значение `style`~~ — **решено P6 2026-10-11**: `shadcn init -b base -p vega` → `base-vega` (CLI 4.21.4) | — | — | — |
| Q-02 | Набор иконок: lucide vs спрайт | lucide (правило), таблица §5.5 | architect | P6 |
| Q-03 | Токены `penalty`/`tier-*` в `globals.css` сейчас или с волной 1 | Объявить сейчас (зарезервированы), не использовать | architect | P6 |
| Q-04 | Нужен ли в Lab показ состояний на `loading.tsx`/`error.tsx` | Имитация компонентами `EmptyState`/`ErrorState`, без реальных маршрутов | architect | P6 |
| Q-05 | Проверка контраста автоматически (скрипт) или ручной таблицей | Таблица из UX-03 + проверка скриптом на P6, если не затратно | architect | P6 |

## 14. Related documents

| Document | Relationship |
|----------|--------------|
| [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) | Токены, рецепты |
| [`ui_states_contract.md`](../../../design/ui_states_contract.md) | Состояния, паттерны |
| [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md) | Формы |
| [`global_shell_spec.md`](./global_shell_spec.md) | Оболочка |
| [`homework_check_flow_spec.md`](./homework_check_flow_spec.md) | `ScoreSelector`, `ScorePad` |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W15-01

## 15. Agent notes

- Не импортировать `components/design-lab/**` в продуктовые маршруты.
- Не добавлять `.dark`, `next-themes` и hex в компоненты.
- Не использовать Radix как слой примитивов shadcn без amend ADR и правила.
- Не дублировать рецепты UX-03 — ссылаться на §8.
- Не создавать продуктовый компонент без секции в Lab (сначала Lab).

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W15-01) |
| 2026-10-21 | v1.1 — P11: строка `ScorePad` (§5.3); `ScoreSelector` без изменений |
| 2026-10-24 | v2.0 — ADR-014 (P14): Source Sans 3, 18 px, высоты контролов; `Select` (Base UI) приведён к шкале v2; новые примитивы `DateField`, `PageSection`; `SegmentedControl` получил режим `toggle` и размер `compact` (вместо отдельного `Chip`); `SidebarNav` вместо `TopNav`; ширина Lab 1024; шаг 6 fidelity (parity-spec) |
