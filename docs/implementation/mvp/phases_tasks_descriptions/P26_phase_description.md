# P26 — Дожать понятность и устойчивость: меню предпросмотра, журнал, форматы, пул БД

**Тип:** Phase Description  
**Статус:** Canonical  
**Прогресс фазы:** документы и прототип готовы (подготовка), реализация не начата  
**Версия:** 1.0  
**Дата:** 2026-11-04  
**Волна:** P26  
**Зависит от:** [`adr_019_view_as_menu_and_db_pool.md`](../../../prds/07_governance/adr_019_view_as_menu_and_db_pool.md), [`usability_audit_2026-11-04.md`](../../../reports/usability_audit_2026-11-04.md), [`sentry_issues_2026-11-04_30m.md`](../../../reports/sentry_issues_2026-11-04_30m.md), [`global_shell_spec.md`](../specs/global_shell_spec.md) §8, R-15, [`change_log_contract.md`](../contracts/change_log_contract.md) §4.1, [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) R-21…R-24, [`homework_check_flow_spec.md`](../specs/homework_check_flow_spec.md) R-19, [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) D-17, D-18, [`ui_states_contract.md`](../../../design/ui_states_contract.md) D23  
**Связанные документы:** [`P26_tasks.md`](../tasks/P26_tasks.md), [`adr_018_ui_terminology_and_term_hints.md`](../../../prds/07_governance/adr_018_ui_terminology_and_term_hints.md), [`P25_phase_description.md`](./P25_phase_description.md), [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md), [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md), [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md), [`copy_and_messages.md`](../../../guidelines/react/copy_and_messages.md)

---

## Purpose

1. Сделать режим «Смотреть как → Учитель» полноценным: в меню «Сегодня», «Все уроки», «Проверка ДЗ»; закрытые реальной ролью пункты — неактивные с причиной (ADR-019 §4 п. 1).
2. Сделать журнал изменений читаемым для администратора: фразы действий, «тип · имя · контекст», детали списком, JSON — в «Технической записи».
3. Довести форматы: один шаблон сравнения для всех метрик, запятая везде, «10 из 30», русские даты, заголовок урока без повтора.
4. Убрать остатки: календарь без названия месяца, `/people` (панель согласий, фильтр по группе), `/deletions` (пустой «Запросил»), «x», «post-MVP», дубль «Москва (UTC+3)», двойное предупреждение на `/year`.
5. Снизить риск таймаута пула соединений (Sentry `-2D`): один запрос `app_user` на запрос, меньше параллельных запросов, настройки пула под serverless, проверка `-pooler`.

## Причины проблем (контекст для CU1–CU10)

Источники: аудит 2026-11-04 (F-1…F-15), Sentry (релиз `d8bfab0`, PR #33), разведка кода 2026-11-04.

| Проблема | Причина в коде | Исправление |
|----------|----------------|-------------|
| F-1: в режиме «Учитель» нет «Сегодня», «Все уроки», «Проверка ДЗ» | `build-shell-nav.server.ts:63-77` → `filterNavItemsByRealAccess` → `lib/shell/filter-nav-by-route-access.ts:10-16` берёт `routeRoles(href)` из `@sunschool/policy-edge`; в `packages/policy/edge/src/route-table.ts:42-48` `/today`, `/lessons`, `/check`, `/group` — `TEACHER`, у admin роли нет (коммит `930222a`); при этом страницы под admin открываются — страничный guard мягче таблицы | Фильтр знает про режим: достижимые пункты видны, закрытые — неактивные (D23); один предикат доступа; политику не менять (CU1) |
| F-2: журнал с JSON и кодами | `audit-shared.server.ts:85` (`JSON.stringify`), `AuditEntryRow.tsx:28`, `audit-resolve-labels.server.ts:76` (сущность «тип (shortId)»), английские значения `audit.actions.*` в `ru/admin.json` | Человеческий вид + «Техническая запись» (CU2) |
| F-3: нет названия месяца | `CalendarPageContent.server.tsx`: `PageHeader` + иконки prev/next без текста; `CalendarMonth.tsx` не рендерит заголовок | Заголовок «Ноябрь 2026», «Сегодня» (CU3) |
| F-4: форматы | `toFixed(1)` в 10+ модулях; `load-school-analytics-page.server.ts:82` отдаёт `mean.toFixed(1)` строкой с точкой; `YearCard.tsx:73` ISO; `DiffBadge.tsx` — разные шаблоны; `lesson.subtitle` «Урок {ordinal} · {title}» повторяет название | Один форматтер, тест-страж (CU4, CU6) |
| F-7, F-13: `/people`, `/deletions` | `LegacyConsentList` (`PeoplePageContent.server.tsx:75`) безусловно над списком; нет фильтра по группе; `DeletionRequestCard.tsx:44-46` + `load-deletion-admin-list.server.ts:145` (пустое имя) | CU5 |
| `-2D`: таймаут пула | `packages/db/src/client.ts`: `POOL_MAX=10`, idle 30 с, connect 15 с; два независимых `cache()` на `app_user` (`require-user.ts:20-28`, `load-session-policy.server.ts:8-20`); 8–12 запросов на рендер админской страницы, 5+ параллельно; `/profile` читает последовательно; `-pooler` не проверяется (`env.server.ts:11`). Гипотезы: H1 холодный Neon после idle; H2 веер запросов при `max=10`; H3 дубли чтений | CU10 |
| Sentry `-1Y`, `-2C`, `-Q`, `-3` | Закрыты P25-CU1; после выката не растут (0 событий за 30 мин) | Наблюдение; повторная выборка после P26 (Q-4) |

## Agent context budget

**MUST read (≤ 8):**

| # | Документ | Зачем |
|---|----------|-------|
| 1 | [`P26_tasks.md`](../tasks/P26_tasks.md) | Чек-лист и CU |
| 2 | [`adr_019_view_as_menu_and_db_pool.md`](../../../prds/07_governance/adr_019_view_as_menu_and_db_pool.md) | Решения |
| 3 | [`usability_audit_2026-11-04.md`](../../../reports/usability_audit_2026-11-04.md) | Находки F-1…F-15 |
| 4 | [`sentry_issues_2026-11-04_30m.md`](../../../reports/sentry_issues_2026-11-04_30m.md) | `-2D`, `-11` |
| 5 | [`global_shell_spec.md`](../specs/global_shell_spec.md) §8, R-14, R-15 | Меню предпросмотра (CU1) |
| 6 | [`change_log_contract.md`](../contracts/change_log_contract.md) §4, §4.1 | Журнал (CU2) |
| 7 | [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) D-17, D-18 | `TermHint`, форматы (CU4, CU7) |
| 8 | [`copy_and_messages.md`](../../../guidelines/react/copy_and_messages.md) | Срезы словаря, стоп-слова, форматы |

**MUST NOT read:** другие `P*_phase_description.md` (кроме [`P25`](./P25_phase_description.md) по ссылке), `docs/examples/pulse/**`.

## Scope / Out of scope

### In scope

- Фильтр меню предпросмотра и состояние D23; человеческое представление журнала; календарь; единые форматы и тест-страж; `/people`, `/deletions`, `/year`, `/settings`, `/approvals`, `/groups`, `/rating`, `/achievements`, `/verses`, `/bricks`, `/users`, `/family`; `TermHint` (`aria-label`, край окна); снижение нагрузки на пул БД.
- Правки `apps/web`, `packages/db`, `packages/policy/edge` — **только чтение** предиката доступа (без изменения политики); тесты.

### Out of scope

- Изменение `route-table.ts` и прав доступа; схема БД и миграции; план и регион Neon; расчёты аналитики; новые маршруты; мобильный прогон 390 px и английская локаль (отдельный проход после P26).

## UI Catalog (эта фаза)

| Компонент / паттерн | Статус | Где в Lab |
|---------------------|--------|-----------|
| Пункт меню `aria-disabled` + подсказка (D23) | новый (CU1) | `SidebarNav`: активный / неактивный / с подсказкой |
| `AuditEntryRow` человеческий вид + «Техническая запись» | расширение (CU2) | секция «Журнал» |
| `MonthHeader` («Ноябрь 2026», «Сегодня») | новый (CU3) | секция «Календарь» |
| `RowActionsMenu` («⋯») | существует (P25-CU7); расширение на `/bricks` (CU9) | секция меню действий |
| `TermHint` | расширение (CU7): `aria-label`, `align="end"` | существующая секция |
| `ShowMore` («Показать ещё») | новый (CU5) | секция списков |

## UX/UI verification loop

После каждого CU с UI: `npm run lint`, `npm run test`, `npm run parity:check` (11 расхождений P-02…P-28 были до P25 — не ухудшать); runtime dual-view (`next-dev-loop`) — только по явной просьбе; Design Lab `/design-system` — секция нового компонента до использования на экране.

## Cross-phase dependencies

| Зависимость | Что нужно |
|-------------|-----------|
| P25 (ADR-018) | `TermHint`, глоссарий, `forbidden-terms.test`, `view_as` cookie, `RowActionsMenu`, поиск `/people` |
| P24 (ADR-017) | cookie `sidebar_collapsed` (образец), оболочка |
| P08 / P11 | Форматеры и компоненты `components/analytics/*` |

## Implementation sequence

`CU1 (меню) → CU2 (журнал) → CU3 (календарь) → CU4 (форматы) → CU5 (/people, /deletions) → CU6 («Сегодня», урок) → CU7 (аналитика, TermHint) → CU8 (/year, /settings, /approvals, /groups, /rating) → CU9 (/achievements, /verses, /bricks, /users, /family) → CU10 (пул БД, T3)`. CU4 (форматеры) раньше CU6–CU9. CU1 и CU10 — T3, каждый свой CU, `reviewer` обязателен. Q-1 ADR-019 (порядок стихов) нужен к CU9.

## Happy path smoke

1. «Смотреть как → Учитель», F5: видны «Сегодня», «Все уроки», «Проверка ДЗ», «Золотые стихи», «Кирпичики», «Рейтинг», «Календарь», «Аналитика»; «Состав группы» неактивен с подсказкой.
2. `/audit`: действия фразами, сущность «Проверка ДЗ · Иванов Артём · урок 5», JSON — только в «Технической записи».
3. `/calendar`: «Ноябрь 2026», «Сегодня» возвращает к текущему месяцу.
4. Аналитика, `/year`, `/school`: «+0,1 к прошлому году», «86%», «1,9» (запятая везде), даты «1 сент. 2026».
5. `/people`: фильтр «Младшая», «Показать ещё (N)»; панель согласий только на своей вкладке; `/deletions`: «Запросил: Иванова Мария».
6. После выката: повторная выборка Sentry (30 мин) — `-2D` не растёт, нет новых `pg-pool` таймаутов.

## Negative path smoke

1. Пункт, закрытый реальной ролью, не открывается по клику и объясняет причину; прямой URL `/group` — отказ реальной роли.
2. Неизвестный код действия в журнале — показывается как есть, страница не падает.
3. Пустые значения — «—»; `NaN%` и `undefined` не показываются.
4. `DATABASE_URL` без `-pooler` — предупреждение в dev, отказ старта в prod.
5. Первая попытка соединения не удалась — один повтор, затем страница ошибки D22 с digest у admin.
6. Поиск без результатов — «Никого не нашли»; фильтр группы без учеников — пустое состояние.

## Security smoke

1. Предпросмотр «Смотреть как» не меняет доступ: реальная роль решает всё (тест: admin без TEACHER получает отказ на `/group` при любом `view_as`).
2. «Техническая запись» и имена в журнале и в `/deletions` видит только admin; teacher — свой доступ без изменений.
3. Чтение прав и статуса `app_user` остаётся на каждый запрос (нет `'use cache'`), но один раз на запрос.
4. Журнал не раскрывает больше ПД, чем уже доступно admin; «Системные» записи не содержат секретов.

## Concurrency & race check

- Одно чтение `app_user` на запрос — через общий `cache()` (React) на время запроса; параллельные потребители получают один и тот же promise.
- Параллельные чтения профиля (`Promise.all`) идут по одному пулу; повтор соединения — максимум один.
- Фильтр и «Показать ещё» на `/people` — серверный параметр; повторный запрос заменяет предыдущий.

## Drift risks & guards

| Риск | Страж |
|------|-------|
| `toFixed(` / ISO-даты возвращаются в UI | тест-страж по `components` и `lib/analytics` (CU4) |
| Новое действие журнала без русской подписи | тест паритета и «нет английских значений в ru» (CU2) |
| Меню предпросмотра расходится с фактическим доступом | тест соответствия `build-shell-nav` и предиката доступа (CU1) |
| Второй `cache()` на `app_user` | тест: один вызов `findUnique` на запрос (CU10) |
| `-pooler` пропал из `DATABASE_URL` | проверка в `env.server.ts` + тест (CU10) |

## Definition of done

- [ ] CU1–CU10 закоммичены с `Review: …`; Phase DoD в `P26_tasks.md`
- [ ] В режиме «Учитель» видны все достижимые пункты, закрытые — неактивны
- [ ] Журнал без сырого JSON вне «Технической записи»; русские `audit.actions.*`
- [ ] Нет `toFixed(` и ISO-дат в UI; один шаблон сравнения
- [ ] `/people`, `/deletions`, `/calendar`, `/year`, `/settings` — по F-3, F-7, F-10, F-11, F-13
- [ ] Один `SELECT app_user` на запрос; настройки пула применены; `-pooler` проверяется
- [ ] Повторная выборка Sentry после выката: `-2D` не растёт (Q-4 P26)
- [ ] Документы и прототип синхронны с кодом

## Open questions фазы

| ID | Вопрос | Предложение | Блокирует |
|----|--------|-------------|-----------|
| Q-1 | Порядок золотых стихов (ADR-019 Q-1) | По книгам Библии, переключатель «по урокам» | CU9 |
| Q-2 | Какой источник решает доступ admin к `/today`, `/lessons`, `/check` (ADR-019 Q-2) | Страничный guard; таблица маршрутов — отдельным ADR при необходимости | CU1 (чтение кода) |
| Q-3 | Значения пула (ADR-019 Q-3) | 4 / 10 с / 5 с | нет |
| Q-4 | Повторная выборка Sentry после CU10 | Выполнить по завершении P26, записать в Change log | нет |

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P26_tasks.md`](../tasks/P26_tasks.md) | Задачи и commit units |
| [`adr_019_view_as_menu_and_db_pool.md`](../../../prds/07_governance/adr_019_view_as_menu_and_db_pool.md) | Решение |
| [`usability_audit_2026-11-04.md`](../../../reports/usability_audit_2026-11-04.md) | Источник находок |
| [`sentry_issues_2026-11-04_30m.md`](../../../reports/sentry_issues_2026-11-04_30m.md) | Источник по пулу |

## Agent notes

- Не менять права и `route-table.ts` ради удобства меню.
- Не форматировать числа и даты на месте; не показывать JSON в основной таблице журнала.
- Не кэшировать права/статус через `'use cache'`; не лечить таймаут увеличением пула.
- Один компонент на файл, ≤ 140 строк; тексты — `@/lib/messages`; константы — `@sunschool/domain`.

## Acceptance criteria

См. [`adr_019_view_as_menu_and_db_pool.md`](../../../prds/07_governance/adr_019_view_as_menu_and_db_pool.md) §9 и DoD выше.

## Change log

| Date | Change |
|------|--------|
| 2026-11-04 | v1.0 — Canonical (подготовка P26): документы и прототип; реализация не начата |
