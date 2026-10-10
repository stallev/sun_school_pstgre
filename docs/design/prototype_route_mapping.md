# Prototype → route mapping (UX-08) — Sunday School

**Тип:** UX Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-10  
**Волна:** W2-05  
**Зависит от:** [`canonical_routes.md`](./canonical_routes.md), [`sunday_school_prototype.html`](../prototypes/sunday_school_prototype.html) (`VIEWS`, `#screen-<view>`), [`responsive_navigation_contract.md`](./responsive_navigation_contract.md)  
**Связанные документы:** [`visual_identity_contract.md`](./visual_identity_contract.md), [`architecture_master_index.md`](../prds/architecture_master_index.md)  
**Проверено по:** не применимо (документ о прототипе, не о runtime-библиотеках)

---

## 1. Purpose

Связать каждый экран прототипа с маршрутом приложения, ролями и будущими документами. Исполнитель UI-задач находит по ключу `#screen-<view>` маршрут, функцию-источник в прототипе и спецификацию. Wireframes на lean не создаются — прототип их заменяет.

## 2. Scope / Out of scope

**В scope:** все 35 экранов `VIEWS` и экран входа `login`.  
**Вне scope:** содержимое экранов (specs W9), права (матрица W5-02).

## 3. Правила

1. Ключ экрана = значение `S.view` = суффикс `id="screen-<view>"` в DOM прототипа.
2. Единственный список маршрутов — [`canonical_routes.md`](./canonical_routes.md); здесь маршрут продублирован только для навигации по документу.
3. Один ключ может обслуживать несколько маршрутов (`lessonForm`).
4. Статус post-MVP: экран остаётся референсом, маршрут в приложении не создаётся.

## 4. Таблица соответствия (MVP)

| Ключ экрана | Функция прототипа | Маршрут | Роли | Spec / contract (planned) |
|-------------|-------------------|---------|------|---------------------------|
| `login` | `loginHTML` | `/login` | аноним | `access_and_registration_spec` |
| `register` | `vRegister` | `/register` | статус «Регистрация» | `access_and_registration_spec` |
| `pending` | `vPending` | `/pending` | «Заявка…», «Отклонена» | `access_and_registration_spec` |
| `profile` | `vProfile` | `/profile` | все активные | `admin_users_and_deletions_spec` |
| `today` | `vToday` | `/today` | teacher | `global_shell_spec` |
| `lessons` | `vLessons` | `/lessons` | teacher | `lesson_form_and_golden_verses_spec` |
| `lessonForm` | `vLessonForm` | `/lessons/new`, `/lessons/[lessonId]/edit` | teacher | `lesson_form_and_golden_verses_spec` |
| `lesson` | `vLesson` | `/lessons/[lessonId]` | teacher | `lesson_form_and_golden_verses_spec` |
| `lessonTable` | `vLessonTable` | `/lessons/[lessonId]/table` | teacher | `homework_check_flow_spec` |
| `check` | `vCheck` | `/check`, `/lessons/[lessonId]/check` | teacher | `homework_check_flow_spec` |
| `group` | `vGroup` | `/group` | teacher | `group_and_pupils_spec` |
| `bricks` | `vBricks` | `/bricks` | teacher | `bricks_and_rating_spec` |
| `rating` | `vRating` | `/rating` | teacher, admin | `bricks_and_rating_spec` |
| `calendar` | `vCalendar` | `/calendar` | teacher, admin | `lesson_form_and_golden_verses_spec` |
| `verses` | `vVerses` | `/verses` | teacher, admin | `lesson_form_and_golden_verses_spec` |
| `analytics` | `vAnalytics` | `/analytics` | teacher, admin | `analytics_screens_spec` |
| `pupil` | `vPupil` | `/analytics/pupils/[pupilId]` | teacher, admin | `analytics_screens_spec` |
| `school` | `vSchool` | `/school` | admin | `analytics_screens_spec` |
| `approvals` | `vApprovals` | `/approvals` | admin | `admin_users_and_deletions_spec` |
| `users` | `vUsers` | `/users` | admin | `admin_users_and_deletions_spec` |
| `userProfile` | `vUserProfile` | `/users/[userId]` | admin | `admin_users_and_deletions_spec` |
| `people` | `vPeople` | `/people` | admin | `group_and_pupils_spec` |
| `groups` | `vGroups` | `/groups` | admin | `group_and_pupils_spec` |
| `groupEdit` | `vGroupEdit` | `/groups/[groupId]` | admin | `group_and_pupils_spec` |
| `year` | `vYear` | `/year` | admin | `group_and_pupils_spec` |
| `deletions` | `vDeletions` | `/deletions` | admin | `admin_users_and_deletions_spec` |
| `audit` | `vAudit` | `/audit` | admin | `admin_users_and_deletions_spec` |
| `settings` | `vSettings` | `/settings` | admin | `global_shell_spec` |

## 5. Таблица соответствия (post-MVP, референс)

| Ключ экрана | Функция прототипа | Маршрут (резерв) | Роли | Волна |
|-------------|-------------------|------------------|------|-------|
| `achievements` | `vAchievements` | `/achievements` | admin | 1 |
| `child` | `vChild` | `/child` | parent | 2 |
| `childData` | `vChildData` | `/child/data` | parent | 2 |
| `childConsent` | `vChildConsent` | `/child/consent` | parent | 2 |
| `family` | `vFamily` | `/family` | admin, parent | 2 |
| `verse` | `vVerse` | `/verse` | parent | 3 |
| `verseDebts` | `vVerseDebts` | `/verse/debts` | parent | 3 |
| `verseLesson` | `vVerseLesson` | `/verse/debts/[lessonId]` | parent | 3 |

## 6. Алиасы подсветки меню

`NAV_ALIAS` прототипа (какой пункт меню подсвечивает экран) — контракт [UX-02](./responsive_navigation_contract.md) §5.4. Экраны `lesson`, `lessonForm`, `lessonTable` подсвечивают «Уроки»; `pupil` — «Аналитика»; `groupEdit` — «Группы»; `userProfile` — «Пользователи»; `family` — «Ученики».

## 7. Paths (H / N / S)

| Путь | Описание | Исход |
|------|----------|-------|
| **H** | Исполнитель по ключу находит маршрут и spec | Нет экрана без строки |
| **N** | В прототип добавлен экран без строки в таблице | Расхождение выявляется сверкой `VIEWS` ↔ таблица (§8) |
| **S** | N/A — документ навигационный; права определяет матрица W5-02 | — |

## 8. Acceptance criteria

- [ ] Множество ключей §4 ∪ §5 ∪ {`login`} равно множеству `VIEWS` ∪ {`login`} — исход: сверка скриптом даёт пустую разницу.
- [ ] Каждый маршрут §4 есть в [`canonical_routes.md`](./canonical_routes.md) §4 — исход: нет маршрута без строки там.
- [ ] Каждый MVP-экран имеет spec в колонке — исход: нет пустых ячеек.

## 9. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| Q-01 | Нужны ли отдельные URL для сводной таблицы и проверки конкретного ученика (`/lessons/[lessonId]/check?pupil=`) | владелец | `homework_check_flow_spec` |

## 10. Related documents

| Document | Relationship |
|----------|--------------|
| [`canonical_routes.md`](./canonical_routes.md) | Список маршрутов |
| [`responsive_navigation_contract.md`](./responsive_navigation_contract.md) | Меню и алиасы |
| [`visual_identity_contract.md`](./visual_identity_contract.md) | Визуальный канон |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W2-05

## 11. Agent notes

- Не создавать маршруты из §5 в MVP-задачах.
- Новый экран прототипа → сначала строка в `canonical_routes.md`, потом здесь.
- Функции `v*` — справочная привязка к коду прототипа, не API приложения.

## Change log

| Date | Change |
|------|--------|
| 2026-10-10 | v1.0 — Canonical (W2-05) |
