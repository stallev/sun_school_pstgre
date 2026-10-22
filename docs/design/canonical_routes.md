# Canonical routes — Sunday School

**Тип:** PRD (инвентарь маршрутов)  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-10  
**Волна:** W1-F5  
**Зависит от:** [`admin_flow.md`](../prds/01_product_scope/user_flows/users_mvp/admin_flow.md), [`teacher_flow.md`](../prds/01_product_scope/user_flows/users_mvp/teacher_flow.md), [`sunday_school_prototype.html`](../prototypes/sunday_school_prototype.html) (`VIEWS`, `NAV`, `#screen-<view>`)  
**Связанные документы:** [`architecture_master_index.md`](../prds/architecture_master_index.md), [`AGENTS.md`](../../AGENTS.md), [`adr_002_nextjs_vercel_runtime_policy.md`](../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md)

---

## 1. Purpose

**Единственный** инвентарь маршрутов приложения. Другие документы ссылаются на него и не повторяют список. Колонка «Экран» — ключ экрана прототипа (`#screen-<view>`), по которому строится `prototype_route_mapping.md` (UX-08).

## 2. Scope / Out of scope

**В scope:** маршруты `apps/web` (App Router): страницы, группы layout, роли, статус MVP / post-MVP.  
**Вне scope:** Route Handlers `/api/*` (контракты W8), внутренние компоненты, wireframes (на lean не требуются).

## 3. Правила

1. **MUST** одна страница = одна строка; новый маршрут сначала добавляется сюда.
2. Путь — kebab-case, на английском; динамические сегменты — `[lessonId]`, `[pupilId]`, `[groupId]`, `[userId]`.
3. Доступ определяет [`authorization_matrix.md`](../prds/04_authorization_privacy/authorization_matrix.md) (W5-02), здесь указаны только роли-кандидаты. Проверка — на сервере.
4. Пользователь без активной учётной записи видит только `/login`, `/register`, `/pending` и публичную `/privacy` (РГ-1).
5. Перенаправление после входа — по роли: `teacher` → `/today`, `admin` → `/school`, статус «Заявка…» → `/pending`, «Регистрация» → `/register`.
6. Layout-группы: `(auth)` — без оболочки; `(app)` — оболочка (header, drawer < `lg`, topnav ≥ `lg`).
7. Каждый маршрут имеет состояния loading / empty / error / forbidden — [`ui_states_contract.md`](./ui_states_contract.md) §7.

## 4. Инвентарь MVP

### 4.1 Вход и регистрация — группа `(auth)`

| Маршрут | Экран | Роли | Назначение |
|---------|-------|------|------------|
| `/login` | `login` | аноним | Вход через Telegram; форма email + пароль для администратора |
| `/privacy` | — (нет в прототипе) | все, без сессии | Текст согласия на обработку ПД; хранится в коде приложения, версия — `app_setting.consent_text_version` |
| `/register` | `register` | статус «Регистрация» | ФИО и согласие на обработку ПД |
| `/pending` | `pending` | статусы «Заявка на рассмотрении», «Отклонена» | Ожидание решения, причина отказа, повторная отправка |

### 4.2 Общие страницы — группа `(app)`

| Маршрут | Экран | Роли | Назначение |
|---------|-------|------|------------|
| `/profile` | `profile` | статусы «Заявка на рассмотрении», «Отклонена», «Активна» | Профиль, запрос на удаление своей учётной записи ([`authorization_matrix.md`](../prds/04_authorization_privacy/authorization_matrix.md) §6) |
| `/calendar` | `calendar` | teacher, admin | События группы (admin — в меню «Учёба») |
| `/rating` | `rating` | teacher, admin | Рейтинг группы / школы |
| `/verses` | `verses` | teacher, admin | Золотые стихи (справочник) |
| `/analytics` | `analytics` | teacher, admin | Аналитика группы; `?year=` — учебный год (по умолчанию: активный → последний закрытый), `?gradeId=` (admin) |
| `/analytics/pupils/[pupilId]` | `pupil` | teacher, admin | Аналитика ученика; «По годам»; `?pupilYear=`, `?metric=` ([`analytics_screens_spec`](../implementation/mvp/specs/analytics_screens_spec.md) §4, §6.5) |

### 4.3 Teacher

| Маршрут | Экран | Назначение |
|---------|-------|------------|
| `/today` | `today` | Прогресс проверки, «Новый урок» |
| `/lessons` | `lessons` | Список уроков |
| `/lessons/new` | `lessonForm` | Создание урока |
| `/lessons/[lessonId]` | `lesson` | Карточка урока |
| `/lessons/[lessonId]/edit` | `lessonForm` | Правка урока |
| `/lessons/[lessonId]/table` | `lessonTable` | Сводная таблица проверки |
| `/check` | `check` | Вход в проверку текущего урока (перенаправление) |
| `/lessons/[lessonId]/check` | `check` | Последовательная проверка ДЗ |
| `/group` | `group` | Моя группа, состав |
| `/bricks` | `bricks` | Баланс и журнал кирпичиков (teacher; admin — в меню «Люди») |

### 4.4 Admin

| Маршрут | Экран | Назначение |
|---------|-------|------------|
| `/school` | `school` | Школа: показатели, строка качества данных; `?year=` — учебный год (admin) |
| `/approvals` | `approvals` | Заявки на доступ |
| `/users` | `users` | Пользователи |
| `/users/[userId]` | `userProfile` | Профиль пользователя |
| `/people` | `people` | Ученики (карточки, зачисление, согласие) |
| `/groups` | `groups` | Группы |
| `/groups/[groupId]` | `groupEdit` | Группа: язык, настройки, назначения |
| `/year` | `year` | Учебный год |
| `/deletions` | `deletions` | Запросы на удаление |
| `/audit` | `audit` | Журнал изменений |
| `/settings` | `settings` | Настройки приложения (язык интерфейса) |

### 4.5 Dev-only

| Маршрут | Экран | Назначение |
|---------|-------|------------|
| `/design-system` | — | Каталог компонентов (Design System Lab); только `APP_ENV=dev`, в prod — 404; без оболочки; [`design_system_lab_spec.md`](../implementation/mvp/specs/design_system_lab_spec.md) |

## 5. Инвентарь post-MVP (референс волны 2–3, без реализации в MVP)

| Маршрут | Экран | Волна | Назначение |
|---------|-------|-------|------------|
| `/achievements` | `achievements` | 1 | Достижения и штрафы (admin). Реализует фаза P12 при `features.achievements = true`; до страницы строка остаётся здесь. Перенос в §4 — задача P12 |
| `/child` | `child` | 2 | Успехи ребёнка (parent) |
| `/child/data` | `childData` | 2 | Данные и согласия (parent) |
| `/child/consent` | `childConsent` | 2 | Согласие по ребёнку (parent) |
| `/family` | `family` | 2 | Семья (admin, parent) |
| `/verse` | `verse` | 3 | Стих недели, голосовая проверка (parent) |
| `/verse/debts` | `verseDebts` | 3 | Невыученные стихи (parent) |
| `/verse/debts/[lessonId]` | `verseLesson` | 3 | Стихи урока (parent) |

Маршруты post-MVP не создаются в `apps/web` до начала соответствующей волны.

## 6. Защищённые зоны

Для `proxy.ts`: публичны только `/login` и `/privacy` (и `/design-system` при `APP_ENV=dev`); остальные требуют сессии. Оптимистичная проверка роли по префиксу — в `proxy.ts` ([ADR-002](../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md) §3); окончательная — на сервере (security floor).

## 7. Acceptance criteria

- [ ] Каждый экран прототипа из `NAV` (admin, teacher) имеет строку в §4 — исход: нет экрана без маршрута.
- [ ] Каждый маршрут §4 имеет роль и экран — исход: пустых ячеек нет.
- [ ] Post-MVP маршруты вынесены в §5 — исход: в MVP-задачи не попадают.

## 8. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| Q-01 | Нужен ли общий `/people` как «Ученики и семьи» в MVP или только `/people` (ученики) | владелец | `group_and_pupils_spec` |
| Q-02 | ~~Публичная страница согласия~~ — **решено: `/privacy`**, текст в коде приложения | — | — |

## 9. Related documents

| Document | Relationship |
|----------|--------------|
| [`admin_flow.md`](../prds/01_product_scope/user_flows/users_mvp/admin_flow.md) | Потоки admin |
| [`teacher_flow.md`](../prds/01_product_scope/user_flows/users_mvp/teacher_flow.md) | Потоки teacher |
| [`prototype_route_mapping.md`](./prototype_route_mapping.md) | Экран прототипа → маршрут (UX-08) |
| [`responsive_navigation_contract.md`](./responsive_navigation_contract.md) | Оболочка и навигация по ролям (UX-02) |
| [`visual_identity_contract.md`](./visual_identity_contract.md) | Визуальный канон (UX-03) |
| [`architecture_master_index.md`](../prds/architecture_master_index.md) | Карта документов |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W1-F5

## 10. Agent notes

- Не создавать маршруты вне этого списка; новый — сначала строка здесь.
- Не дублировать список маршрутов в specs и задачах — ссылаться на § этого файла.
- Один экран `lessonForm` обслуживает `/lessons/new` и `/lessons/[lessonId]/edit`.

## Change log

| Date | Change |
|------|--------|
| 2026-10-10 | v1.0 — Canonical (W1-F5) |
| 2026-10-19 | §4.2: query-параметры года для `/analytics`, `/analytics/pupils/[pupilId]` (P08); `/school` — `?year=`; новых путей нет |
| 2026-10-22 | §5: `/achievements` помечен фазой P12; в §4 переносится, когда страница появится |
