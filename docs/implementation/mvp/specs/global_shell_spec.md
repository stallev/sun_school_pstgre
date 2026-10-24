# Global shell spec — оболочка приложения

**Тип:** Spec  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-10-24  
**Волна:** W9-01 (v2.0 — W12, P14)  
**Зависит от:** [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md) (UX-02), [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) (UX-03), [`canonical_routes.md`](../../../design/canonical_routes.md), [`ui_states_contract.md`](../../../design/ui_states_contract.md) (UX-05), [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) §6, [`auth_runtime_spec.md`](../../../prds/05_runtime/auth_runtime_spec.md) §10, [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md) §5, [`adr_002_nextjs_vercel_runtime_policy.md`](../../../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md) §3–§5.2, [`adr_008_i18n_ru_en_dictionary_slices.md`](../../../prds/07_governance/adr_008_i18n_ru_en_dictionary_slices.md), [`adr_004_timezone_scheduling_model.md`](../../../prds/07_governance/adr_004_timezone_scheduling_model.md)  
**Связанные документы:** [`sunday_school_prototype.html`](../../../prototypes/sunday_school_prototype.html) (`#shell`, `NAV`, `render`, `sidebarHTML`), [`adr_014_app_redesign_v2.md`](../../../prds/07_governance/adr_014_app_redesign_v2.md), [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md), [`prototype_class_parity_spec.md`](./prototype_class_parity_spec.md), [`prototype_route_mapping.md`](../../../design/prototype_route_mapping.md), [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** WAI-ARIA Authoring Practices (w3.org, WebFetch 2026-10-11): модальный диалог — фокус внутрь при открытии, цикл Tab внутри, Esc закрывает, возврат фокуса на вызвавший элемент, `role="dialog"` + `aria-modal` + имя; навигация сайта — **disclosure-кнопки с `aria-expanded` и `aria-controls`**, а не `role="menu"` (роль `menu` подразумевает сложное клавиатурное поведение, которое навигации не нужно), `aria-current="page"` у ссылки текущей страницы, Esc закрывает раскрытый список и возвращает фокус. Next.js 16.4 layouts / `loading.tsx` / `error.tsx` — [`ui_states_contract.md`](../../../design/ui_states_contract.md) (WebFetch 2026-10-11). `'use cache'`, `partialPrefetching` и Instant Navigations — по ADR-002 §5; значения в проекте не пересверялись, остаются Open question до P5. Context7 недоступен.

---

## 1. Purpose

Описать **реализацию** оболочки по [UX-02](../../../design/responsive_navigation_contract.md): файловую раскладку, серверные и клиентские обязанности, состояния, доступность. Читают: исполнитель P5–P6 (scaffold, Design System Lab), P01 (оболочка), `reviewer`.

## 2. Scope / Out of scope

**В scope:** root layout, группы `(auth)` / `(app)`, header, drawer, сайдбар `lg+`, меню пользователя, бейджи, баннеры уровня оболочки, dev-переключатель роли, словари оболочки, состояния оболочки.  
**Вне scope:** содержимое экранов (specs W9, контракты), токены (UX-03), состав пунктов и маршруты — только по UX-02 §5 и `canonical_routes`.

## 3. Definitions

| Термин | Значение |
|--------|----------|
| Оболочка | `header` + навигация + `main#main` + слот поверхностей (drawer, диалог, toast) |
| NAV | список пунктов роли из UX-02 §5; **статичен** для роли, не зависит от данных |
| Бейдж | счётчик ожидающих (заявки, запросы на удаление) |
| Dev-переключатель | селектор «смотреть как» (ОК-5), есть только при `APP_ENV=dev` |

## 4. Раскладка файлов (`apps/web/src`)

| Путь | Тип | Содержимое |
|------|-----|------------|
| `app/layout.tsx` | Server | `<html lang>` (из `ui_locale`), шрифты (`Alegreya`, `Source_Sans_3`, v2.0), провайдеры: словарь `common`, `Toaster` (Sonner), Sentry-инициализация; нет оболочки |
| `app/global-error.tsx` | Client | свой `<html>`/`<body>`, минимальный стиль, «Повторить» (UX-05 S3.6) |
| `app/not-found.tsx` | Server | 404 без раскрытия причин (AZ-D4) |
| `app/(auth)/layout.tsx` | Server | словарь `auth`, без шапки; рамка экрана — `AuthScreen` на каждой странице (`narrow` для `/login`, `reading` для `/register`, `/pending`, `/privacy`) |
| `app/(app)/layout.tsx` | Server | `requireActiveUser()`, выбор NAV, бейджи (Suspense), оболочка |
| `app/(app)/loading.tsx` | Server | skeleton области контента (не навигации) |
| `app/(app)/error.tsx` | Client | ошибка внутри оболочки, `retry()` |
| `components/shell/app-shell.tsx` | Server | каркас: skip-link, header, на `lg+` сетка `grid-cols-[16rem_minmax(0,1fr)]` (сайдбар + `main#main`), слоты; контейнер `#view` (R-4) |
| `components/shell/app-header.tsx` | Server | бренд, слот пользователя (слота навигации нет, v2.0) |
| `components/shell/nav-config.ts` | модуль | `NAV_BY_ROLE`, `NAV_ALIAS` (данные, без JSX); единственный источник для сайдбара и drawer |
| `components/shell/sidebar-nav.tsx` | Server/Client | сайдбар (≥ `lg`): плоские группы ссылок, `aria-current`; заменил `top-nav.tsx` (удаляется) |
| `components/shell/nav-link-row.tsx` | Server | строка пункта; варианты `sidebar` и `drawer` |
| `components/shell/nav-drawer.tsx` | Client | drawer (< `lg`), диалог |
| `components/shell/user-menu.tsx` | Client | «Профиль», «Смотреть как» (только dev), «Выйти»; язык — не показывается |
| `components/shell/nav-badge.tsx` | Server | бейдж (Suspense-регион) |
| `components/shell/dev-role-switcher.tsx` | Client | **только dev** (§8); рендерится внутри `user-menu.tsx`, отдельной кнопки в шапке нет (v2.0) |
| `lib/shell/nav-resolver.ts` | модуль | пункты по ролям пользователя (admin ∪ teacher → приоритет admin) |

Один компонент — один файл (`react-one-component-per-file`); логика выбора пунктов — в `lib/shell`, не в JSX.

## 5. Серверные обязанности

| Шаг | Что | Правило |
|-----|-----|---------|
| 1 | `requireActiveUser()` в `(app)/layout.tsx` | неактивный статус → перенаправление (authorization_matrix §6); layout **не** полагается на `proxy.ts` |
| 2 | Определить роль оболочки | `ADMIN`, иначе `TEACHER`; при двух ролях — NAV admin + пункт «Группа» не добавляется (admin видит группы через «Учёба») |
| 3 | Передать NAV и текущий путь клиентским компонентам | в props — только список `{key, label key, href, group}`; без ПД и без полного словаря (срез `common`, ADR-008 §4.3) |
| 4 | Бейджи | значения `pendingRequests`, `openDeletions` — отдельные `<Suspense>`-регионы с запросами count; сбой бейджа не ломает оболочку (показывается без числа) |
| 5 | Баннеры уровня оболочки | D1 (нет активного года) и D13 (пояс не выбран) — для admin; D3 (год закрыт) — для teacher на экранах с данными года; решение — сервер, значения из кэшируемых функций |
| 6 | Заголовок документа | «Название экрана — Sunday School»; каждая страница задаёт `metadata.title` по ключу словаря |

## 6. Клиентские обязанности

### 6.1 Навигация (≥ `lg`, сайдбар; v2.0)

- Контейнер `<nav aria-label>` со списками ссылок; группа — видимый подзаголовок (`text-sm font-medium text-muted`) и `<ul aria-labelledby>` с пунктами; **раскрытия и disclosure-кнопок у пунктов нет** — все пункты видны всегда (ADR-014 R-8). Одиночные пункты («Школа», «Сегодня», «Аналитика» у teacher) — ссылка без подзаголовка.
- У каждого пункта сайдбара и drawer — иконка из прототипа (`NAV`), `size-5`, `aria-hidden`; при наведении текст не подчёркивается. Описание пункта (`desc`) не выводится.
- Строка пункта: `min-h-10 rounded-lg px-3 py-1.5 text-base leading-tight` (длинная подпись переносится); текущий `bg-cobalt-soft font-bold text-cobalt-ink`; бейдж справа (`CountBadge`), скрыт при нуле.
- Пункт текущей страницы — `aria-current="page"`; подсветка пункта по `NAV_ALIAS` (UX-02 §5.4). Подсвечивается ровно один пункт.
- Прокрутка сайдбара — внутри `aside` (`overflow-y-auto`), страница при этом не прыгает; высота `calc(100dvh - 3.5rem)`.
- `role="menu"` / `menuitem` не используется (по APG навигация сайта — список ссылок); пункты — настоящие ссылки (`<Link>`), доступные для prefetch и открытия в новой вкладке.
- Disclosure остаётся только у меню пользователя (§6.3): `aria-expanded`, `aria-controls`, `Esc` и клик снаружи закрывают.

### 6.2 Drawer (< `lg`)

| Аспект | Правило |
|--------|---------|
| Открытие | кнопка меню `aria-expanded`, `aria-controls="nav-drawer"` |
| Роль | `role="dialog"`, `aria-modal="true"`, доступное имя «Меню» (`aria-label`). Видимого заголовка «Меню» нет |
| Фокус | при открытии — на первый пункт NAV; Tab цикличен внутри; `Esc`, клик по затемнению, выбор пункта закрывают; возврат фокуса на кнопку |
| Прокрутка | `body` не прокручивается, пока открыт |
| Содержимое | NAV роли (группы раскрыты списком). Радио «Администратор» / «Учитель» из прототипа не копируется. Внизу — имя (ссылка на `/profile`) и «Выйти»; отдельного пункта «Профиль» нет |
| Ширина | `min(20rem, 86vw)`; закрывается при переходе |

### 6.3 Меню пользователя

Disclosure-кнопка с `aria-label` (имя пользователя — только отображаемое, без email), `h-10`: «Профиль» (ссылка `/profile`), «Смотреть как» (группа радио-пунктов из `dev-role-switcher`, **только `APP_ENV=dev`**, §8), «Выйти» (кнопка → `signOut`). Панель — `DD_PANEL` (UX-03 §8). Язык интерфейса не переключается (ADR-008).

### 6.4 Переход между экранами

- Прокрутка в начало и фокус на `main#main` (`tabindex="-1"`) после навигации; без «прыжка» при возврате назад (восстановление прокрутки браузером). Рамка фокуса `main` не рисуется: `main:focus:not(:focus-visible) { outline: none }` (UX-03 D-12; проверка — `outlineStyle === "none"`).
- `aria-live="polite"` область для объявления заголовка нового экрана.
- Skip-link «К содержимому» — первый фокусируемый элемент, виден при фокусе.

### 6.5 Toast и поверхности

| Поверхность | Позиция | Правила |
|-------------|---------|---------|
| Toast (Sonner) | < `lg`: сверху `top-16`, ≥ `lg`: снизу `bottom-6` по центру | 2000 ms (`PRODUCT_TOAST_DURATION_MS`); `role="status"`; ошибки — `aria-live="assertive"` |
| Диалог | bottom-sheet `max-h-[92dvh]` | APG: фокус внутрь, Esc, возврат; опасные — фокус на «Отмена» (UX-06 §7.1) |
| Drawer | см. §6.2 | — |

## 7. Состояния (UX-05)

| Ситуация | Поведение оболочки |
|----------|--------------------|
| Загрузка данных страницы | оболочка и NAV видны сразу; skeleton только в `main` (S1.1) |
| Бейдж загружается / сбой | показывается пункт без числа (S1.6, S3.2) |
| Ошибка сегмента | `error.tsx` внутри оболочки; `retry()` |
| Ошибка корневого layout | `global-error.tsx` |
| Нет доступа (роль) | 403 внутри оболочки роли, «На главную» (S4.3) |
| Сессия истекла | перенаправление на `/login` (S4.5), оболочка не рендерится |
| Нет активного года (admin) | баннер D1 с действием «Создать учебный год» |
| Пояс не выбран (admin) | баннер D13 с действием «Выбрать часовой пояс» (не блокирует) |
| Год закрыт (teacher) | баннер D3 «только чтение» на экранах данных года |

## 8. Dev-переключатель роли «смотреть как» (ОК-5)

| Правило | Значение |
|---------|----------|
| Где виден | только `APP_ENV=dev` |
| Как исключается из prod | **не рендерится на сервере** и не попадает в клиентский бандл prod (условный динамический импорт по `APP_ENV`, проверка при сборке); CSS-скрытия недостаточно |
| Где в интерфейсе | v2.0: группа радио-пунктов «Смотреть как» внутри меню пользователя (§6.3); отдельного блока кнопок в шапке нет |
| Что делает | подменяет **набор ролей для отображения** текущему dev-пользователю на время сессии; **не** повышает права на сервере: операции проверяются по реальным ролям БД (иначе переключатель — дыра, S) |
| Данные | фикстуры `seed:dev` ([`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) §8): вымышленные пользователи; вход «как» пользователь — через dev-вход фикстур, не через OAuth |
| Тест | в prod-сборке нет строки `dev-role-switcher` (проверка бандла) |

Конкретный механизм (dev-вход фикстур, dev-cookie) — Q-03; **до решения** переключатель допускается только как смена NAV для просмотра оболочки.

## 9. Instant Navigations и кэш (требования, пересверить на P5)

| Элемент | Требование |
|---------|------------|
| NAV по роли | статичный модуль, без запросов; не требует кэша |
| `requireActiveUser()` | один раз на запрос (`React.cache`); не `'use cache'` (данные пользователя) |
| Бейджи | динамика за `<Suspense>`; допустимо короткое кэширование с тегом (`updateTag` из `approveRequest`, `createDeletionRequest`) — решение Q-02 |
| `ui_locale`, `school_timezone` | `'use cache'` + `cacheTag`, сброс `updateTag` при смене (ADR-008 §4.2) |
| Prefetch | ссылки NAV — `<Link>` с prefetch по умолчанию; `partialPrefetching` включён (ADR-002 §5.1) |

## 10. Happy path

| Сценарий | Результат |
|----------|-----------|
| Teacher на 390 px открывает меню, выбирает «Проверка ДЗ» | Drawer закрывается, открыт `/check`, пункт «Уроки» подсвечен, фокус на `main` |
| Admin на `lg` в сайдбаре нажимает «Заявки на доступ» в группе «Люди» | Открыт `/approvals`, пункт подсвечен, у группы и пункта бейдж |
| Любой пользователь Tab-ом проходит оболочку | Skip-link → бренд → меню пользователя → сайдбар (по порядку пунктов) → `main` |
| Смена ширины 1023 → 1024 px | Сайдбар заменяет drawer без перезагрузки страницы |

## 11. Negative paths

| Случай | Исход |
|--------|-------|
| Teacher по прямой ссылке открывает `/users` | 403 внутри оболочки teacher; NAV роли сохранён |
| Запрос бейджа упал | Оболочка и страница работают; бейдж без числа; событие в Sentry |
| JS отключён / не загрузился | Ссылки NAV работают как обычные `<a>`; на `lg+` сайдбар виден как статичный список (progressive enhancement, SHOULD), на `< lg` drawer недоступен |
| Нет активного года (teacher) | Оболочка нормальная; контент — D1; пункты видны |
| Длинное ФИО | усекается, полное — в `title`/меню |

## 12. Security paths

| Путь | Требование | AZ |
|------|------------|----|
| S-1 | Пункт, недоступный роли, **не рендерится на сервере** | AZ-D3, UX-02 §8 |
| S-2 | Оболочка не показывает ПД чужих пользователей; в props клиента — только отображаемое имя текущего | — |
| S-3 | Бейджи — агрегаты (числа), без списков; считаются только для `ADMIN` | AZ-01, AZ-07 |
| S-4 | Dev-переключатель отсутствует в prod (бандл и сервер) | ОК-5 |
| S-5 | `callbackUrl`/возврат после входа — только из `canonical_routes` | auth_runtime_spec §5.4 |

## 13. UI states matrix

Состояния — [`ui_states_contract.md`](../../../design/ui_states_contract.md) §4–§6; оболочечные D1, D3, D13 — §7 этого документа. Отдельные состояния компонентов:

| Компонент | default | open | busy | error | disabled |
|-----------|:-------:|:----:|:----:|:-----:|:--------:|
| Кнопка меню / drawer | ● | ● | — | — | — |
| Группа сайдбара (подзаголовок + список) | ● | — | — | — | — |
| Пункт сайдбара | ● (default, hover, current, focus-visible) | — | — | — | — |
| Бейдж | ● | — | ● (без числа) | ● (без числа) | — |
| Меню пользователя | ● | ● | ● («Выход…» на `signOut`) | ● | — |

## 14. Wireframe & prototype

| Элемент | Прототип |
|---------|----------|
| Шапка, бренд, user-menu | `#shell`, `header`, `rightHTML`, `brandHTML`, `render` (номера строк — [`prototype_class_parity_spec.md`](./prototype_class_parity_spec.md) §2, они сдвигаются при правке прототипа) |
| Сайдбар | `sidebarHTML` (из `NAV`), контейнер `#shellGrid` |
| Drawer | `#drawer`, `navHTML` |
| Токены | `<head>` прототипа, UX-03 v2.0 |

Отличия реализации от прототипа: пункты — ссылки; нет переключателя языка; dev-переключатель только dev; описание пункта (`desc`) не показывается.

## 15. Requirements

| ID | MUST / SHOULD |
|----|---------------|
| R-1 | MUST: оболочка рендерится сервером; NAV по роли — статичен |
| R-2 | MUST: каждый пункт — `<Link>`; текущий — `aria-current="page"` |
| R-3 | MUST: drawer и диалоги соответствуют APG (фокус, Esc, возврат) |
| R-4 | MUST: `main#main` получает фокус при навигации; skip-link первый |
| R-5 | MUST: `requireActiveUser()` в `(app)/layout.tsx` |
| R-6 | MUST: dev-переключатель отсутствует в prod-сборке |
| R-7 | SHOULD: бейдж не ломает оболочку при сбое запроса |
| R-8 | SHOULD: touch-цели ≥ 44 px в drawer и сайдбаре (`h-10` при базе 18 px = 45 px; UX-03 D-9) |
| R-9 | MUST: на `lg+` сайдбар — единственная навигация; выпадающих панелей навигации нет; список пунктов сайдбара и drawer — из одного `nav-config.ts` |
| R-10 | MUST: `main#main` без видимой рамки при программном фокусе |

## 16. Acceptance criteria

- [ ] Набор пунктов teacher / admin совпадает с UX-02 §5 и `canonical_routes.md` — исход: сверка таблицы.
- [ ] На 390 px и 768 px нет горизонтальной прокрутки; на `lg` сайдбар заменяет drawer — исход: ручная проверка.
- [ ] Клавиатура: Esc закрывает drawer и меню пользователя, фокус возвращается — исход: ручной шаг.
- [ ] У текущей страницы `aria-current="page"`, у пунктов сайдбара нет `aria-expanded` — исход: проверка DOM.
- [ ] Ширина `main` на 1920 px = остаток после `w-64`, контент `#view` ≤ 1400 px, прижат влево — исход: замер.
- [ ] В prod-сборке нет dev-переключателя и его кода — исход: проверка бандла.
- [ ] Бейдж «Люди» = заявки + запросы на удаление; скрыт при нуле — исход: сверка с данными.
- [ ] Teacher не получает пунктов admin в DOM — исход: проверка рендера.

## 17. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| Q-01 | Дизайн бейджа > 99 | «99+» | architect | P6 |
| Q-02 | Кэшировать ли бейджи с тегом или всегда динамика | Динамика за Suspense; кэш — после замера на P5 | architect | P5 |
| Q-03 | Механизм dev-входа «смотреть как» без реального OAuth (dev-cookie, dev-вход фикстур) | Dev-вход фикстур по `APP_ENV=dev`; переключатель роли — просмотр NAV; решение в P01 | architect | P01 |
| Q-04 | Сессия оборвалась при открытом drawer | Следующий запрос → `/login`; drawer закрывается при навигации | architect | — |
| Q-05 | Пользователь с двумя ролями (admin + teacher): показывать ли пункты teacher | Нет; admin получает доступ к урокам через «Учёба»/аналитику (authorization_matrix §8) | владелец | P01 |

## 18. Related documents

| Document | Relationship |
|----------|--------------|
| [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md) | Состав и поведение навигации |
| [`ui_states_contract.md`](../../../design/ui_states_contract.md) | Состояния |
| [`homework_check_flow_spec.md`](./homework_check_flow_spec.md) | Экран внутри оболочки |
| [`access_and_registration_spec.md`](./access_and_registration_spec.md) | `(auth)` экраны |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W9-01

## 19. Agent notes

- Не использовать `role="menu"` для навигации; пункты — ссылки.
- v2.0: не возвращать `top-nav.tsx` и выпадающие панели навигации; не дублировать список пунктов в сайдбаре и drawer — оба читают `nav-config.ts`.
- Не скрывать пункт CSS-ом: он не должен попадать в DOM, если роль не допускает.
- Не класть ПД и полные словари в props клиентских компонентов оболочки.
- Не включать dev-переключатель в prod и не давать ему серверных прав.
- Не добавлять `middleware.ts`; перенаправления — `proxy.ts` и `requireActiveUser()`.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W9-01) |
| 2026-10-20 | v1.1 — P09: drawer без видимого «Меню» и без пункта «Профиль»; внизу имя → `/profile` и «Выйти» |
| 2026-10-24 | v2.0 — ADR-014 (P14): `top-nav.tsx` заменён `sidebar-nav.tsx`; §6.1 сайдбар вместо disclosure-групп; «Смотреть как» внутри меню пользователя; фокус `main` без рамки; R-9, R-10. Раздел «Проверено по» про disclosure относится теперь только к меню пользователя |
