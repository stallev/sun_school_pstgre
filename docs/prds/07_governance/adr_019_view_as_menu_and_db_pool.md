# ADR-019 — Меню режима «Смотреть как», журнал на языке пользователя, единые форматы и нагрузка на пул БД

**Тип:** ADR  
**Статус:** ACCEPTED  
**Версия:** 1.0  
**Дата:** 2026-11-04  
**Волна:** P26  
**Зависит от:** [`adr_018_ui_terminology_and_term_hints.md`](./adr_018_ui_terminology_and_term_hints.md) §4 п. 3, 6, 8, [`adr_017_shell_container_toast_buttons.md`](./adr_017_shell_container_toast_buttons.md), [`adr_002_nextjs_vercel_runtime_policy.md`](./adr_002_nextjs_vercel_runtime_policy.md) §5, [`global_shell_spec.md`](../../implementation/mvp/specs/global_shell_spec.md) §8, [`change_log_contract.md`](../../implementation/mvp/contracts/change_log_contract.md) §4  
**Связанные документы:** [`usability_audit_2026-11-04.md`](../../reports/usability_audit_2026-11-04.md), [`sentry_issues_2026-11-04_30m.md`](../../reports/sentry_issues_2026-11-04_30m.md), [`sentry_issues_2026-11-03_30m.md`](../../reports/sentry_issues_2026-11-03_30m.md), [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md), [`P26_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P26_phase_description.md)  
**Проверено по:** повторный обход стенда `dev-sun-school-pstgre.vercel.app` под ролями admin и teacher (2026-11-04); повторная выборка Sentry (релиз `d8bfab0`, PR #33); код ветки `P25`: `apps/web/src/data/shell/build-shell-nav.server.ts`, `apps/web/src/lib/shell/filter-nav-by-route-access.ts`, `packages/policy/edge/src/route-table.ts`, `packages/db/src/client.ts`, `apps/web/src/lib/db.server.ts`, `apps/web/src/lib/auth/{require-user,load-session-policy.server}.ts`, `apps/web/src/data/audit/*`. Prisma `@prisma/adapter-pg` / `pg-pool` — версии по `package.json`; Context7 не вызывался: новых зависимостей нет, меры — настройки существующего пула и устранение дублей запросов.

---

## 1. Purpose

После P25 стенд стал заметно понятнее, но повторный аудит и Sentry показали четыре класса остатков: (1) режим «Смотреть как → Учитель» не показывает «Сегодня», «Все уроки», «Проверка ДЗ»; (2) журнал изменений выводит сырой JSON и технические коды; (3) форматы чисел, сравнений и дат всё ещё разные на разных экранах; (4) таймаут пула `pg-pool` повторился после выката (`SUN_SCHOOL_POSTGRES_DEV-2D`) на фоне медленного чтения `app_user` (`-11`). Нужно одно решение по каждому классу.

## 2. Scope / Out of scope

**В scope:** набор пунктов меню в режиме предпросмотра; вид записей журнала; единые форматеры; число и параллелизм запросов к БД на запрос, настройки пула, проверка строки подключения.  
**Вне scope:** политика доступа и таблица маршрутов (`route-table.ts`) — не меняются; схема БД и миграции; инфраструктура Neon (план, регион); расчёты аналитики; новые маршруты.

## 3. Context

- `build-shell-nav.server.ts:63-77` фильтрует пункты предпросмотра через `filterNavItemsByRealAccess` → `routeRoles(href)` из `@sunschool/policy-edge`. В `route-table.ts` `/today`, `/lessons`, `/check`, `/group` — `roles: TEACHER`; admin без роли TEACHER эти пункты теряет. При этом на стенде `/today`, `/lessons`, `/check` под admin **открываются** — страничный guard мягче таблицы (расхождение зафиксировано как наблюдение; какой из двух источников авторитетен, проверяет CU1).
- Журнал: детали — `JSON.stringify` (`audit-shared.server.ts:85`); сущность по умолчанию «`<тип> (<shortId>)`» (`audit-resolve-labels.server.ts:76`); часть значений `audit.actions.*` в `ru/admin.json` — на английском; в `AUDIT_ACTION` ~109 значений.
- Форматы: `toFixed(1)` в 10+ модулях, `mean.toFixed(1)` строкой с точкой в `load-school-analytics-page.server.ts:82`; ISO-даты в `YearCard.tsx:73`; разные шаблоны сравнения у явки и остальных метрик (`DiffBadge.tsx`); шаблон `lesson.subtitle` повторяет название урока.
- БД: `POOL_MAX=10`, `POOL_IDLE_TIMEOUT_MS=30_000`, `POOL_CONNECTION_TIMEOUT_MS=15_000`, без настроек под serverless; `DATABASE_URL` не проверяется на `-pooler`; два независимых `cache()` читают одну строку `app_user` (`loadPolicyContext`, `loadSessionPolicyContext`); на рендер админской страницы приходится 8–12 запросов, 5+ одновременно; `/profile` читает данные последовательно.

## 4. Decision

1. **Меню «Смотреть как».** Фильтр пунктов знает про режим просмотра, политика доступа **не меняется**. В режиме «Учитель» показываются все пункты teacher-меню, которые реально открываются у текущей роли; пункты, закрытые реальной ролью (`/group`), показываются **неактивными** с подсказкой «Нужна роль учителя в группе» (а не скрываются). Предикат «пункт доступен» — тот же, что решает доступ к странице (один источник; расхождение `route-table` ↔ страничный guard для `/today`, `/lessons`, `/check` разрешает CU1 чтением кода и фиксирует в Change log, не расширяя права). Тест: видимые и неактивные пункты соответствуют фактическому доступу.
2. **Журнал на языке пользователя.** В таблице журнала: действие — фраза («Исправил проверку ДЗ», «Подал заявку на доступ», «Система: сохранён снимок аналитики»); сущность — человек и контекст («Проверка ДЗ · Иванов Артём · урок 5», идентификатор — в подсказке или раскрытии); детали — список «что изменилось» («Присутствие: да», «Стих 1: 1», «Тетрадь: 9»); полная запись JSON — в свёрнутом блоке «Техническая запись». Все значения `audit.actions.*` и `audit.entity_types.*` на русском (паритет с enum уже проверяет тест P25-CU1). Записи системы (`seed.run`) помечены «Система» и скрыты фильтром по умолчанию.
3. **Единые форматы (развитие ADR-018 §4 п. 3).** Один форматтер на всё: дробные — `formatNumber` (запятая; `toFixed` + шаблон и числа-строки из DAL запрещены); сравнение — один шаблон для всех метрик («+1% к прошлому году», «+0,1 к прошлому году», «без изменений»); прогресс — «10 из 30» (не «10/30»); даты — `formatDate` («4 окт. 2026»), ISO-даты в UI запрещены; заголовок урока без повтора («Урок 5 · 4 октября», если название равно «Урок N»). Тест-страж: `toFixed(` и ISO-даты в `apps/web/src/components` и `lib/analytics`.
4. **Нагрузка на пул БД.** Меры без смены инфраструктуры: (а) одно чтение `app_user` на запрос — `loadSessionPolicyContext` использует `loadPolicyContext` (общий `cache()`), имя для шапки берётся из того же `select`; (б) `/profile` читает независимые данные параллельно; (в) флаги `appSetting` — одним `findMany`; (г) для serverless: `POOL_MAX` 3–5 на инстанс, `idleTimeoutMillis` ≈ 10 с, `connectionTimeoutMillis` ≈ 5 с с одним повтором в `getPrisma` (быстрый отказ вместо ожидания 15 с); (д) `DATABASE_URL` без `-pooler` → предупреждение в dev и отказ при старте prod. Значения (г) подтверждаются повторной выборкой Sentry; если `-2D` повторяется — отдельная задача (холодный Neon, лимиты).

## 5. Rejected alternatives

| Вариант | Почему отклонён |
|---------|-----------------|
| Расширить `route-table` до `ADMIN_OR_TEACHER` для `/today`, `/lessons`, `/check` | Меняет политику доступа (T3, AZ, ADR) ради удобства предпросмотра; владелец выбрал фильтр с учётом режима |
| Скрывать недоступные пункты предпросмотра | Администратор не видит, чего именно нет у учителя без роли; неактивный пункт с причиной понятнее |
| Оставить JSON в «Деталях» («журнал для программистов») | Журнал нужен администратору; аудит (F-2) назвал это главным препятствием |
| Увеличить `POOL_MAX` или таймаут | Больше параллельных соединений на инстанс — больше нагрузки на пулер Neon; ожидание 15 с не лечит причину |
| Кэшировать чтение `app_user` через `'use cache'` | Нарушает ADR-002 §5 и правило `auth-security`: права читаются из БД на каждый запрос |

## 6. Consequences

- `global_shell_spec` → v2.4 (§8, R-15); `ui_states_contract` → v1.7 (D23); `change_log_contract` → v1.8 (§4.1 человеческое представление); `analytics_screens_spec` → v1.7 (R-21…R-24); `visual_identity_contract` → v2.4 (D-17, D-18); `authorization_matrix` — наблюдение о расхождении таблицы и guard.
- Новые CU P26: CU1 (меню, T3-граница), CU2 (журнал), CU4 (форматы), CU10 (пул, T3). Прототип и документы обновлены в подготовке P26.
- Любой будущий пункт меню проверяется тестом доступности; любое новое действие журнала — русской подписью и тестом паритета.

## 7. Paths (H / N / S)

**H:** в режиме «Учитель» видны «Сегодня», «Все уроки», «Проверка ДЗ»; журнал читается без JSON; форматы едины; профиль и страницы открываются без таймаутов пула.  
**N:** пункт, закрытый реальной ролью, неактивен и объясняет причину; запись журнала неизвестного действия показывает код, а не падает; пустое значение — «—»; пул: первая попытка соединения не удалась — один повтор, затем понятная страница ошибки (D22); `DATABASE_URL` без `-pooler` — предупреждение/отказ.  
**S:** предпросмотр не меняет права (проверки по реальной роли, как P25); журнал не показывает лишних ПД в человеческом виде сверх уже доступных admin; детали «Техническая запись» — только admin; изменения пула и чтения `app_user` не ослабляют проверку статуса и ролей на каждый запрос (ADR-002 §5, `auth-security`).

## 8. Affected documents

| Документ | Правка |
|----------|--------|
| [`global_shell_spec.md`](../../implementation/mvp/specs/global_shell_spec.md) | §8, R-15 |
| [`ui_states_contract.md`](../../design/ui_states_contract.md) | D23 пункт меню неактивен |
| [`change_log_contract.md`](../../implementation/mvp/contracts/change_log_contract.md) | §4.1 человеческое представление записи |
| [`analytics_screens_spec.md`](../../implementation/mvp/specs/analytics_screens_spec.md) | R-21…R-24 |
| [`visual_identity_contract.md`](../../design/visual_identity_contract.md) | D-17, D-18 |
| [`homework_check_flow_spec.md`](../../implementation/mvp/specs/homework_check_flow_spec.md) | R-18: заголовок урока без повтора |
| [`design_system_lab_spec.md`](../../implementation/mvp/specs/design_system_lab_spec.md) | `TermHint`, `RowActionsMenu` |
| [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md) | наблюдение о расхождении таблицы маршрутов и guard; предпросмотр не меняет права |
| [`typography_text_guidelines.md`](../../guidelines/typography_text_guidelines.md), [`copy_and_messages.md`](../../guidelines/react/copy_and_messages.md) | запрет `toFixed`, ISO-дат, английских значений `audit.actions.*` |
| [`sunday_school_prototype.html`](../../prototypes/sunday_school_prototype.html) | «Сегодня» в календаре, «Техническая запись», фильтр по группе в «Ученики», подсказка у правого края |

## 9. Acceptance criteria

- [ ] В режиме «Учитель» видны все достижимые пункты teacher-меню, закрытые неактивны с причиной — исход: тест `build-shell-nav`.
- [ ] Журнал: нет сырого JSON и кодов вида `check.corrected` вне блока «Техническая запись»; русские значения всех `audit.actions.*` — исход: тест словаря и рендера.
- [ ] Нет `toFixed(` и ISO-дат в UI; одна форма сравнения — исход: тест-страж и тесты форматтера.
- [ ] Один `SELECT app_user` на запрос; `DATABASE_URL` без `-pooler` отклоняется в prod — исход: тесты DAL и env.
- [ ] Повторная выборка Sentry после выката: `-2D` не растёт — исход: отчёт.

## 10. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| Q-1 | Порядок золотых стихов: по книгам Библии или по урокам | По книгам Библии (Быт, Мф, Мк, Лк, Ин, …), переключатель «по урокам» | владелец | CU9, не блокирует остальные |
| Q-2 | Какой источник решает доступ admin к `/today`, `/lessons`, `/check`: таблица маршрутов или страничный guard | Страничный guard авторитетен (так работает стенд); таблица приводится в соответствие отдельным ADR при необходимости | architect | CU1 (чтение кода, без правки политики) |
| Q-3 | Значения пула (`POOL_MAX` 3–5, idle ≈ 10 с, connect ≈ 5 с) | Старт с 4 / 10 с / 5 с, корректировка по Sentry | владелец | нет |

## 11. Related documents

| Document | Relationship |
|----------|--------------|
| [`usability_audit_2026-11-04.md`](../../reports/usability_audit_2026-11-04.md) | Источник F-1…F-15 |
| [`sentry_issues_2026-11-04_30m.md`](../../reports/sentry_issues_2026-11-04_30m.md) | Q-4 P25, повтор `-2D` |
| [`adr_018_ui_terminology_and_term_hints.md`](./adr_018_ui_terminology_and_term_hints.md) | Предыдущее решение по терминам и форматам |
| [`P26_tasks.md`](../../implementation/mvp/tasks/P26_tasks.md) | Задачи реализации |

## 12. Agent notes

- Не менять `route-table.ts` и права ради меню предпросмотра.
- Не показывать JSON и коды действий в основной таблице журнала.
- Не форматировать числа и даты на месте (`toFixed`, `toLocaleDateString()`, `Number.toString()`): только `@/lib/i18n/format`.
- Не кэшировать чтение прав и статуса пользователя через `'use cache'`.
- Не увеличивать пул и таймаут как «лечение» таймаута соединения.

## Change log

| Date | Change |
|------|--------|
| 2026-11-04 | v1.0 — ACCEPTED (подготовка P26) |
