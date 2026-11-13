# ADR-017 — Центрированный контейнер, сворачиваемый сайдбар, toast и компактные кнопки

**Тип:** ADR  
**Статус:** ACCEPTED (п. 2 и п. 4 — amended by [ADR-022](./adr_022_responsive_shell_spacing_and_density.md))  
**Версия:** 1.1  
**Дата:** 2026-11-03  
**Волна:** P24  
**Зависит от:** [`adr_014_app_redesign_v2.md`](./adr_014_app_redesign_v2.md) (R-4, R-6, R-8), [`visual_identity_contract.md`](../../design/visual_identity_contract.md) (UX-03), [`responsive_navigation_contract.md`](../../design/responsive_navigation_contract.md) (UX-02), [`global_shell_spec.md`](../../implementation/mvp/specs/global_shell_spec.md), [`adr_002_nextjs_vercel_runtime_policy.md`](./adr_002_nextjs_vercel_runtime_policy.md) §5  
**Связанные документы:** [`redesign_v2_ui_spec.md`](../../design/redesign_v2_ui_spec.md) §3.10, [`design_system_lab_spec.md`](../../implementation/mvp/specs/design_system_lab_spec.md) §5.3–§5.4, [`prototype_class_parity_spec.md`](../../implementation/mvp/specs/prototype_class_parity_spec.md), [`homework_check_flow_spec.md`](../../implementation/mvp/specs/homework_check_flow_spec.md) §5.2а, [`P24_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P24_phase_description.md)  
**Проверено по:** код ветки `P24` (2026-11-03): `apps/web/src/components/shell/{app-shell.tsx,shell-header.client.tsx,sidebar-nav.tsx,product-toaster.client.tsx}`, `apps/web/src/components/ui/{button.tsx,segmented-control.tsx,score-pad.tsx}`. Next.js `16.4.4` (`apps/web/package.json`): `cookies()` из `next/headers` — асинхронный динамический API; при `cacheComponents` чтение — внутри динамического сегмента за `<Suspense>` (ADR-002 §5). Sonner `2.0.8`: `Toaster` принимает `position`, `offset`, `mobileOffset`, `icons`, `toastOptions.classNames` (`node_modules/sonner/dist/index.d.ts`). `lucide-react` `1.55.0` — иконки `CircleCheck`, `CircleAlert`, `PanelLeftClose`, `PanelLeftOpen`, `Cake`. Context7 не вызывался: новых зависимостей нет.

---

## 1. Purpose

Пользователь на широком мониторе видит контент, прижатый влево, и пустую полосу справа; сайдбар занимает место, которое нужно экрану проверки ДЗ; toast внизу по центру тёмный и перекрывает полосу действий, успех не отличается от ошибки; кнопки разной высоты, сегменты «Да / Нет» растянуты на ширину карточки. Нужно одно решение для оболочки и размеров контролов.

## 2. Scope / Out of scope

**В scope:** контейнер шапки и контента, сворачивание сайдбара, вид и место toast, размер кнопок, чипов, сегментов и кнопок шкалы.  
**Вне scope:** палитра и пары контраста (UX-03 §4–§5 без изменений), набор пунктов меню (UX-02 §5), drawer на < `lg`, шрифты и кегль (ADR-014 R-1…R-3), маршруты.

## 3. Context

- ADR-014 R-4 зафиксировал `max-w-[1400px]`, «влево»: на 1920 px справа от контента пустая полоса до 250 px, на 2560 px — больше 800 px.
- Сайдбар `16rem` (288 px) постоянен; на экране проверки ДЗ 1920×1080 карточка не помещается без прокрутки.
- `ProductToaster` — два `Toaster` (сверху для < `lg`, снизу по центру для `lg+`), без вариантов цвета; UX-03 §8 расходился с кодом по длительности (2.8 с против 2000 мс).
- `Button` `default` — `h-10 px-3.5`; кнопка «Выдать» в списке кирпичиков (`h-9 px-3`, по ширине) владелец назвал эталоном.

## 4. Decision

1. **Контейнер.** Шапка (правая часть) и `#view` — в одном контейнере `max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8`, **по центру** области `main`. `PageSection` (`form` / `wide`) — по левому краю контейнера. Отменяет ADR-014 R-4 в части ширины и выравнивания.
2. **Сайдбар.** *(amended by ADR-022 §4.1: раскрытый по умолчанию — только с `xl` (≥ 1280); на `lg` — rail по умолчанию; cookie приоритетнее; причина — на 1024 px под контент оставалось ~647 px.)* На `lg+` два состояния: развёрнут (`16rem`) и rail (`4rem`, только иконки с `aria-label` и tooltip, бейдж-точка). Кнопка сворачивания — в шапке над колонкой сайдбара (`aria-expanded`, `aria-controls`). Состояние — cookie `sidebar_collapsed` (`1` / `0`, `Path=/`, `Max-Age=31536000`, `SameSite=Lax`, не `HttpOnly` — UI-предпочтение без ПД); `(app)/layout.tsx` читает её через `cookies()` и рендерит нужную сетку сразу, без мигания. < `lg` — drawer без изменений.
3. **Toast.** ≥ `lg` — справа снизу (`bottom-right`, отступ `bottom-6 right-6`), < `lg` — сверху по центру. Success — `ok-soft` / `ok` + `CircleCheck`; error — `danger-soft` / `danger` + `CircleAlert`; нейтральный — `surface` / `line`. 2000 мс (`PRODUCT_TOAST_DURATION_MS`). Иконка декоративна, смысл — в тексте.
4. **Кнопки.** Единый компактный размер `h-9 px-3 text-base rounded-lg`, ширина по содержимому — для `Button` всех вариантов, чипов, `SegmentedControl` (новый проп `fit`, по умолчанию по ширине содержимого) и кнопок `ScorePad` / `ScoreSelector`. `touch` (`h-11`) — только главное действие и нижняя панель на < `md`. Рядом с полем ввода кнопка выравнивается по полю (`size="field"`, `h-10`, F14). Поля ввода остаются `h-10` (ADR-014 R-6). *(amended by ADR-022 §4.3: поле `h-9` (40,5) / компактное `h-8` (36); `size="field"` упразднён — кнопка наследует высоту поля.)*

## 5. Rejected alternatives

| Вариант | Почему отклонён |
|---------|-----------------|
| Оставить контейнер 1400 влево, сайдбар шире | Пустая полоса справа остаётся на широких мониторах |
| Контейнер на всю ширину без ограничения | На 2560 px строки таблиц и форм растягиваются, читать тяжело |
| Скрывать сайдбар полностью (off-canvas на `lg+`) | Теряется постоянная навигация (ADR-014 R-8); rail сохраняет её одним кликом |
| Состояние сайдбара только в `localStorage` | Сервер не знает состояние — мигание ширины и hydration mismatch при первом рендере |
| Toast сверху справа на `lg+` | Перекрывает меню пользователя и заголовок экрана; снизу справа свободно |
| Кнопки `h-10` по умолчанию, `compact` по месту | Так было после P14: размеры расходились от экрана к экрану |

## 6. Consequences

- UX-03 → v2.1 (D-14, D-15, §7, §8); UX-02 → v2.1 (§3, §4, §6 п. 2b); `global_shell_spec` → v2.1 (§4, §5 шаг 4а, §6.1а, §6.5, R-9, R-11, R-12); `design_system_lab_spec` → v2.1; `redesign_v2_ui_spec` §3.10; ADR-014 R-4 superseded.
- Потребители `size="compact"` у `Button` и `size` у `SegmentedControl` переводятся на новый дефолт; поиск потребителей — часть CU3 P24.
- Чтение cookie делает `(app)/layout.tsx` зависимым от запроса — уже так из-за `requireActiveUser()`; Instant Navigations не ухудшаются (ADR-002 §5).
- HTML-прототип и строки `prototype_class_parity_spec.md` §7 обновлены в том же подготовительном шаге P24 (прототип подчинён контракту, UX-03 §10).

## 7. Paths (H / N / S)

**H:** на 1920 px контент и шапка по центру, ≤ 1600 px; сайдбар сворачивается и разворачивается, состояние переживает перезагрузку; toast success и error справа снизу на `lg`, сверху на 390 px; кнопки одной высоты `h-9`.  
**N:** cookie отсутствует или повреждена → развёрнут; `prefers-reduced-motion` → без анимации ширины; длинная подпись пункта в rail → только в tooltip и `aria-label`; кнопка рядом с полем → `field`.  
**S:** cookie — UI-предпочтение без ПД и без влияния на права; набор пунктов по-прежнему решает сервер (UX-02 §7); n/a для данных.

## 8. Affected documents

| Документ | Правка |
|----------|--------|
| [`adr_014_app_redesign_v2.md`](./adr_014_app_redesign_v2.md) | R-4 superseded; R-6, R-8 дополнены |
| [`visual_identity_contract.md`](../../design/visual_identity_contract.md) | v2.1: D-14, D-15, §7, §8, §9 п. 4, §10, §12 |
| [`responsive_navigation_contract.md`](../../design/responsive_navigation_contract.md) | v2.1: §3, §4, §6 п. 2b, §9 |
| [`global_shell_spec.md`](../../implementation/mvp/specs/global_shell_spec.md) | v2.1: §4, §5, §6.1а, §6.5, R-9, R-11, R-12, §16 |
| [`design_system_lab_spec.md`](../../implementation/mvp/specs/design_system_lab_spec.md) | v2.1: `Button`, `SegmentedControl`, `ScorePad`, `Toast`, `ConfirmDialog`, `SidebarNav` |
| [`redesign_v2_ui_spec.md`](../../design/redesign_v2_ui_spec.md) | §3.10, §5 п. (4) |
| [`prototype_class_parity_spec.md`](../../implementation/mvp/specs/prototype_class_parity_spec.md) | §7 строки кнопок, сегментов, оболочки, toast (вместе с прототипом) |
| [`sunday_school_prototype.html`](../../prototypes/sunday_school_prototype.html) | `BTN`, `seg()` `fit`, `#shellGrid` rail, контейнер 1600, `toast()` варианты |
| [`P24_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P24_phase_description.md), [`P24_tasks.md`](../../implementation/mvp/tasks/P24_tasks.md) | фаза P24 |

## 9. Acceptance criteria

- [ ] `#view` и правая часть шапки — `max-w-[1600px] mx-auto`; на 2560 px поля слева и справа равны — исход: замер.
- [ ] Cookie `sidebar_collapsed=1` → первый HTML с колонкой `4rem`; кнопка меняет состояние и cookie — исход: тест `app-shell` / `shell-header` + проверка DOM.
- [ ] Toast success / error различаются фоном и иконкой; на `lg` справа снизу — исход: тест `product-toaster`.
- [ ] `Button` `default` — `h-9 px-3`, `SegmentedControl` — `h-9` и `fit` — исход: тесты компонентов, parity.

## 10. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| — | Нет открытых вопросов: решения приняты владельцем 2026-11-03 | — | — | — |

## 11. Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_014_app_redesign_v2.md`](./adr_014_app_redesign_v2.md) | Предыдущее решение по оболочке и контролам |
| [`global_shell_spec.md`](../../implementation/mvp/specs/global_shell_spec.md) | Реализация оболочки |
| [`visual_identity_contract.md`](../../design/visual_identity_contract.md) | Нормы токенов и рецептов |

## 12. Agent notes

- Не возвращать контейнер «влево» и `max-w-[1400px]`.
- Не хранить состояние сайдбара только на клиенте.
- Не делать toast единственным носителем ошибки поля — ошибка остаётся у поля (UX-06).
- Не вводить новые размеры кнопок вне D-14.

## Change log

| Date | Change |
|------|--------|
| 2026-11-03 | v1.0 — ACCEPTED (подготовка P24) |
| 2026-11-13 | v1.1 — п. 2 и п. 4 amended by ADR-022 (граница сайдбара `xl`, высота полей) |
