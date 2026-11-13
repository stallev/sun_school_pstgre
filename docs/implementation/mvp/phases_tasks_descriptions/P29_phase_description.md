# P29 — Адаптивность, интервалы, высота полей и понятность (четвёртый аудит)

**Тип:** Phase Description  
**Статус:** Canonical  
**Прогресс фазы:** документы и прототип готовы (подготовка), реализация не начата  
**Версия:** 1.0  
**Дата:** 2026-11-13  
**Волна:** P29 (номер P28 фазой не используется: документы P28 не менялись)  
**Зависит от:** [`adr_022_responsive_shell_spacing_and_density.md`](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md), [`usability_audit_2026-11-13_p28.md`](../../../reports/usability_audit_2026-11-13_p28.md) (версия 2), [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) v2.6 (D-9, D-14, D-19, §7, §7а), [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md) v2.6 §5.3а, [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md), [`global_shell_spec.md`](../specs/global_shell_spec.md), [`ui_states_contract.md`](../../../design/ui_states_contract.md)  
**Связанные документы:** [`P29_tasks.md`](../tasks/P29_tasks.md), [`adr_017_shell_container_toast_buttons.md`](../../../prds/07_governance/adr_017_shell_container_toast_buttons.md), [`adr_018_ui_terminology_and_term_hints.md`](../../../prds/07_governance/adr_018_ui_terminology_and_term_hints.md), [`adr_020_term_hints_everywhere_and_audit_polish.md`](../../../prds/07_governance/adr_020_term_hints_everywhere_and_audit_polish.md), [`P27_phase_description.md`](./P27_phase_description.md), [`sunday_school_prototype.html`](../../../prototypes/sunday_school_prototype.html)

---

## Purpose

1. Убрать корневую причину сжатия контента на планшете: раскрытый сайдбар только с `xl`, на `lg` — rail (R-1); под контентом на 1024 px — ≥ 900 px.
2. Закрыть блокирующие дефекты вёрстки: «Таблица всех оценок», проверка ДЗ, журнал `/audit` (D-01…D-03, D-22, D-23).
3. Ввести шкалу интервалов, высоты полей 40,5 / 36 px, сетку форм и правила «воздуха» и применить их к экранам аудита (D-10, D-11, D-15…D-19, D-25…D-35).
4. Исправить дефекты `TermLabel` и копирайта (D-04…D-09, D-13, D-24, U-08) и довести понятность (U-01…U-12, D-27, D-36 и остаток D-12, D-14, D-20, D-21).

## Причины проблем (контекст для CU1–CU13)

- Раскрытый сайдбар `16rem` (288 px) с `lg` (ADR-017) оставляет контенту ~647 px на 1024 px; макеты рассчитаны на ≥ 960 px (R-1).
- Нет шкалы интервалов: `gap-1/1.5/2/3` при корне 18 px дают 4,5 / 6,75 / 9 / 13,5 px; отступы произвольные.
- Поле `h-10` = 45 px, кнопка `h-9` = 40,5 px: ряды форм рассинхронены, формы раздуты.
- Широкое содержимое не изолировано в обёртке: страница и flex-заголовки сжимаются.
- `TermLabel` вносит двоеточия, дубли подписи и кнопки, плейсхолдер `{term}`, раздувает строку.

## Agent context budget

**MUST read (≤ 8):**

| # | Документ | Зачем |
|---|----------|-------|
| 1 | [`P29_tasks.md`](../tasks/P29_tasks.md) | Чек-лист, CU, трассировка |
| 2 | [`adr_022_responsive_shell_spacing_and_density.md`](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) | Решения §4.1–§4.7 |
| 3 | [`usability_audit_2026-11-13_p28.md`](../../../reports/usability_audit_2026-11-13_p28.md) | Дефекты D-xx, U-xx, R-1 (разделы 2, 3, 4, 7) |
| 4 | [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) §7, §7а, §8 | Токены, высоты, рецепты |
| 5 | [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md) §5.3а | Секции Lab до использования |
| 6 | `.cursor/rules/ui-design-system-shadcn.mdc`, `ui-mobile-first.mdc` | Правила UI |
| 7 | [`sunday_school_prototype.html`](../../../prototypes/sunday_school_prototype.html) | Экран-эталон по задаче |
| 8 | Этот документ, § Метод замера | Критерии Acceptance |

**MUST NOT read:** другие `P*_phase_description.md` (кроме [`P27`](./P27_phase_description.md) по ссылке), `docs/examples/pulse/**`, `docs/reports/*` кроме четвёртого аудита.

## Scope / Out of scope

### In scope

Оболочка по ширине; токены интервалов и ESLint-правило; высоты полей и кнопок; сетка форм; изоляция широкого содержимого; таблицы → карточки; правила «воздуха»; дефекты D-01…D-36 и U-01…U-12 четвёртого аудита; секции Lab; тесты словаря (`{ }`).

### Out of scope

Маршруты ([`canonical_routes.md`](../../../design/canonical_routes.md) не меняется); права, `route-table.ts`, auth, policy, схема БД; роль «учитель» и родительский кабинет (не покрыты аудитом, возможна следующая фаза); печатная ведомость; английская локаль (кроме паритета ключей); палитра и контраст; данные другого размера (100+ записей). Миграция **всех** файлов на токены интервалов — только затронутые задачами P29 (остальные в baseline ESLint-правила).

## UI Catalog (эта фаза)

| Компонент / паттерн | Статус | Где в Lab |
|---------------------|--------|-----------|
| Токены `--space-*` и утилиты `gap-chip`, `p-card` … | новые (CU2) | «Spacing scale» (§5.3а) |
| `Input` / `Select` / `DateField` — `h-9` / `h-8`; `Button` без `size="field"` | изменение (CU2) | «Field heights» |
| `TermLabel` — позиция, без двоеточий, `inline` | изменение (CU5) | «TermLabel (позиция, без двоеточий)» |
| Таблица → карточки (журнал, баллы группы) | новый паттерн (CU4, CU12) | «Responsive table → cards» |
| `SegmentedControl` с рамкой группы | изменение (CU7) | `SegmentedControl` |
| `SidebarNav` rail по умолчанию на `lg` | изменение (CU1) | `SidebarNav` |

## UX/UI verification loop

После каждого CU с UI: `node scripts/cu-verify.mjs`, `npm run parity:check` (базовые расхождения не ухудшать); Design Lab — секция до использования на экране (C-2). Runtime dual-view (`next-dev-loop`) и замер на стенде — **только по явному запросу** владельца.

## Cross-phase dependencies

| Зависимость | Что нужно |
|-------------|-----------|
| P24 (ADR-017) | `app-shell`, cookie `sidebar_collapsed`, `Button`, `SegmentedControl` |
| P25–P27 (ADR-018, ADR-020) | `TermLabel`, `TermHeader`, словари `hints.*`, `forbidden-terms.test` |
| P28 | `/lessons/[id]/check`, `/audit` (журнал после исправления ролей); документы P28 не меняются |

## Implementation sequence

`CU1 (R-1 оболочка) → CU2 (токены, ESLint-правило, высоты полей) → CU3 (таблица оценок и проверка ДЗ) → CU4 (журнал) → CU5 (TermLabel, /bricks, /school) → CU6 (/users, /year, /achievements, /people, копирайт таблицы) → CU7 (чипы, табы, ссылки-кнопки) → CU8 (подписи, календарь, форма урока) → CU9 («воздух»: группа, заявки, /today, /year) → CU10 («воздух»: рейтинг, карточки, /guide) → CU11 (понятность U-01…U-07) → CU12 (баллы группы, достижения, остаток) → CU13 (U-09…U-12)`.

Порядок по зависимости, а не строго по приоритету отчёта: **CU2 (P2-основа) стоит перед CU4**, потому что D-23 (поля журнала 36–40 px) использует новые высоты. CU1, CU3, CU4 — P0; CU5, CU6 — P1; CU7–CU10 — P2; CU11–CU13 — P3.

## Метод замера (общий для Acceptance)

Те же средства, что в аудите: HTML страницы `fetch` с сессией → `iframe srcdoc` на 360 / 768 / 1024 / 1440 (+ 2560); Suspense-блоки вставлены на место; скрипт измеряет:

1. `document.scrollingElement.scrollWidth == innerWidth`;
2. элементы с `overflow-x` и `scrollWidth > clientWidth` (внутренний скролл);
3. `getBoundingClientRect().height` полей (40,5 ±1 / 36 ±1) и `top` соседей в ряду (±1 px);
4. зазор между соседними интерактивными элементами (≥ 8 px в цепочке чипов);
5. доля пустоты карточки с одним блоком (`1 − (высота содержимого / высота карточки)` ≤ 30 %);
6. `aria-label` и словарь без `{`/`}`;
7. ширина контента при 1024 px (≥ 900 px).

Состояния после гидратации (открытые меню, диалоги) в iframe не проверяются — ручной smoke. Код замеров — не продуктовый (в `docs/ops/` при необходимости), зависимостей не добавляет.

## Happy path smoke

1. 1024 px: сайдбар — rail; под контентом ≥ 900 px; cookie `sidebar_collapsed=0` раскрывает его и сохраняется.
2. `/lessons/[id]/table` на 768–1440: заголовок целиком, таблица прокручивается внутри обёртки, `scrollWidth == innerWidth`.
3. `/lessons/[id]/check` на 1024: одна колонка, имена целиком, шкала теста в 2 ряда; на `xl` — две колонки.
4. `/audit` ≥ 1280: таблица без внутреннего скролла; ниже — карточки; форма на сетке, верхние края ±1 px.
5. Поле — 40,5 px, компактное — 36 px, кнопка рядом — той же высоты; зазор в цепочке чипов ≥ 8 px.
6. `/bricks`: «К выдаче ?» без двоеточия после значка; `/verses`: `aria-label` без `{term}`.
7. `/year`: заголовок «Закрыть учебный год» и кнопка «Закрыть 2026–2027» (нет дубля).

## Negative path smoke

1. Cookie `sidebar_collapsed` повреждена → умолчание по ширине (rail на `lg`, развёрнут на `xl+`).
2. Длинное имя ученика (≥ 35 знаков) в карточке проверки → перенос, не обрезка, страница не шире окна.
3. Пустой журнал / пустой список → пустое состояние ≤ 24 px; нет ошибки вёрстки.
4. Ключ словаря с `{ }` в `hint`/`term` → тест падает.
5. Новый `gap-1.5` в файле вне baseline → ESLint ошибка.

## Security smoke

1. Права и `route-table.ts` не менялись (grep по diff); `/audit`, `/users`, `/people`, `/approvals`, `/deletions`, `/family` — по-прежнему только admin.
2. Cookie `sidebar_collapsed` — UI-предпочтение без ПД; в cookie ничего нового не добавляется.
3. U-11: в шапке — только отображаемое имя текущего пользователя (как уже в меню пользователя), без email; источник данных тот же (`lib/auth` не меняется).

## Concurrency & race check

- Вёрстка и словари — без новых мутаций; единственное состояние — `sidebar_collapsed` (читается на сервере, пишется клиентом, последний выигрывает). Гонок данных нет.

## Drift risks & guards

| Риск | Страж |
|------|-------|
| Возврат «сырых» отступов | ESLint-правило (CU2) + baseline |
| Раскрытый сайдбар на `lg` | тест `app-shell` (CU1) |
| Поле 45 px / `size="field"` | тест компонентов + grep `size="field"` |
| Плейсхолдер `{term}` | тест словаря и `aria-label` (CU5) |
| Страница шире окна | замер `scrollWidth` (Метод замера) |
| «?» в каждой строке / внутри кнопки | чек-лист review; тест «TermLabel в Button» (CU5) |
| Пустые карточки и растяжка | чек-лист `items-start`; замер доли пустоты |

## Definition of done

- [ ] CU1–CU13 закоммичены с `Review: …`; Phase DoD в `P29_tasks.md`
- [ ] R-1: на 1024 px rail и ≥ 900 px под контентом
- [ ] На 360 / 768 / 1024 / 1440 нет горизонтального скролла страницы; внутреннего скролла нет на `/audit` ≥ 1280 и на `/school`, `/analytics` при 1024
- [ ] Поля 40,5 / 36 px; `size="field"` и `h-10` у полей удалены; ряды ±1 px
- [ ] ESLint-правило интервалов включено; baseline документирован
- [ ] Все D-01…D-36, U-01…U-12 и R-1 закрыты (таблица трассировки в `P29_tasks.md`) или причина в Change log
- [ ] Секции Lab «Spacing scale», «Field heights», «TermLabel (позиция…)», «Responsive table → cards» есть
- [ ] Документы и прототип синхронны с кодом

## Open questions фазы

| ID | Вопрос | Предложение | Блокирует |
|----|--------|-------------|-----------|
| Q-1 | Значения токенов (rem по ADR-022 §4.2) | Как в ADR | CU2 (до начала) **Закрыт 2026-11-13: принято умолчание (владелец).** |
| Q-2 | Порог двухколоночной проверки ДЗ: `xl` (1280) или 1024 | `xl` | CU3 T6 **Закрыт 2026-11-13: принято умолчание (владелец).** |
| Q-3 | Высота поля: 40,5 / 36 (классы) или буквально 40 / 36 | классы, допуск ±1 px | CU2 **Закрыт 2026-11-13: принято умолчание (владелец).** |
| Q-4 | D-12, D-14, D-20, D-21 не перечислены в приоритетах отчёта §6 | CU12, P3 | нет **Закрыт 2026-11-13: принято умолчание (владелец).** |
| Q-5 | ESLint-правило — на весь `apps/web` или только файлы, тронутые фазой | baseline (только тронутые) | CU2 **Закрыт 2026-11-13: принято умолчание (владелец).** |
| Q-6 | `touch` `h-11` = 49,5 px при цели ≥ 44 px — оставить | оставить | нет **Закрыт 2026-11-13: принято умолчание (владелец).** |

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P29_tasks.md`](../tasks/P29_tasks.md) | Задачи, CU, трассировка |
| [`adr_022_responsive_shell_spacing_and_density.md`](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) | Решение |
| [`usability_audit_2026-11-13_p28.md`](../../../reports/usability_audit_2026-11-13_p28.md) | Источник находок |

## Agent notes

- Не писать сырые `gap-*`, `space-y-*`, `p-N` в product-коде — токены (`gap-chip`, `p-card`).
- Не возвращать `h-10` у полей, `size="field"`, раскрытый сайдбар на `lg` по умолчанию, `truncate` на имени ученика в заголовке.
- Широкое — в обёртку `overflow-x-auto min-w-0`; сетки карточек — `items-start`.
- Значок «?» — через `TermLabel`/`TermHeader`: после слова, не в кнопке, один раз на смысл.
- Один компонент на файл, ≤ 140 строк; тексты — `@/lib/messages`; права и маршруты не трогать.

## Acceptance criteria

См. [`adr_022_responsive_shell_spacing_and_density.md`](../../../prds/07_governance/adr_022_responsive_shell_spacing_and_density.md) §9 и DoD выше.

## Change log

| Date | Change |
|------|--------|
| 2026-11-13 | v1.0 — Canonical (подготовка P29): ADR-022, UX-03 v2.6, Lab v2.6, прототип; реализация не начата |
