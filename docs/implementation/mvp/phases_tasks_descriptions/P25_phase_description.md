# P25 — Понятный интерфейс: термины, подсказки, форматы, устойчивые страницы

**Тип:** Phase Description  
**Статус:** Canonical  
**Прогресс фазы:** документы, прототип готовы (подготовка), реализация не начата  
**Версия:** 1.1  
**Дата:** 2026-11-03  
**Волна:** P25  
**Зависит от:** [`sentry_issues_2026-11-03_30m.md`](../../../reports/sentry_issues_2026-11-03_30m.md), [`adr_018_ui_terminology_and_term_hints.md`](../../../prds/07_governance/adr_018_ui_terminology_and_term_hints.md), [`usability_audit_2026-11-03.md`](../../../reports/usability_audit_2026-11-03.md), [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) §3.1, R-17…R-20, [`homework_check_flow_spec.md`](../specs/homework_check_flow_spec.md) R-18, [`global_shell_spec.md`](../specs/global_shell_spec.md) §8, R-14, [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) D-17, D-18, [`ui_states_contract.md`](../../../design/ui_states_contract.md) D22, [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md) §5.3  
**Связанные документы:** [`P25_tasks.md`](../tasks/P25_tasks.md), [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md), [`copy_and_messages.md`](../../../guidelines/react/copy_and_messages.md), [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md), [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md), [`prototype_class_parity_spec.md`](../specs/prototype_class_parity_spec.md)

---

## Purpose

1. Вернуть работоспособность страниц, которые падают на стенде: `/calendar`, `/bricks`, `/lessons` (функции в props клиентского компонента) и `/audit` (нет ключа словаря) — причины установлены по Sentry ([`sentry_issues_2026-11-03_30m.md`](../../../reports/sentry_issues_2026-11-03_30m.md)).
2. Исправить вывод «Явка» (доля 0–1 показывалась как `0.8%` вместо `80%`).
3. Заменить язык аналитика на язык учителя: «регулярно ходят», «26 детей», «+1% к прошлому году», «из 10» (ADR-018 §4 п. 1); убрать «IANA», «ADR», «N=», «п. п.» из интерфейса.
4. Дать паттерн `TermHint` («?») и расставить его у терминов; сворачиваемый блок «Как мы считали цифры».
5. Упростить рабочие экраны: проверка ДЗ, «Сегодня», «Ученики», «Заявки», рейтинг, группы, настройки, учебный год.
6. Сделать режим «Смотреть как» надёжным: cookie `view_as`, бейдж, пункты только по реальным правам.

## Причины проблем (контекст для CU1–CU3, CU9)

| Проблема | Причина в коде (2026-11-03) | Исправление |
|----------|------------------------------|-------------|
| «Явка 1% / 0.8%» в таблицах аналитики | `analytics-compute.server.ts:237`, `get-pupil-analytics.ts:196` отдают долю 0–1; `GroupAnalyticsTables.tsx`, `PupilLayerCards.tsx` выводят её через `formatAnalyticsPercent` без ×100 (верхняя карточка верна: `×100` в `analytics-compute.server.ts` ~279). Тот же риск — `lib/analytics/build-birth-year-cohort-rows.ts:37` | Один форматтер доли → процент; тест на значения 0 / 0,8 / 1 / `null` (CU2) |
| «Что-то пошло не так» на `/bricks`, `/calendar`, `/lessons` (Sentry `SUN_SCHOOL_POSTGRES_DEV-1Y`, `-2C`, 135 событий) | Установлено: `pickTeacherLessonScreensMessages` (`lib/messages/pick-teacher-lesson-screens-messages.server.ts`) отдаёт объект с функциями-форматтерами (`listSubtitle`, `lessonCardTitle`, `assignedVersesHintNext`, …); он целиком передан prop `messages` в `"use client"`-компонент `LessonsGradeFilter`, которому нужны только `gradeFilterLabel` и `gradeFilterApply`. Вызовы: `BricksPageContent.server.tsx` (`lessonMessages`), `LessonsPageContent.server.tsx`, `CalendarPageContent.server.tsx` (`listMessages`). Условие `isAdmin && grades.length > 1` истинно на стенде, поэтому падает серверный рендер RSC (в т. ч. `POST`) | В `LessonsGradeFilter` передавать только две строки; guard: `assertSerializableMessages` на всех prop `messages` клиентских компонентов (CU1) |
| «Что-то пошло не так» на `/audit` (`-Q`, 2 события) | Установлено: `AuditPageContent.server.tsx` строит подписи фильтра `Object.values(AUDIT_ENTITY_TYPE).map(type => getMessage(adminDict, \`audit.entity_types.${type}\`))`; `getMessage` (`lib/messages/get-message.ts`) бросает `Missing message: audit.entity_types.achievement_award`. В `ru/admin.json` и `en/admin.json` нет ключей `achievement_award`, `achievement`, `achievement_suggestion`, `penalty`, `family`, `family_adult`, `weekly_digest` (последний — `analytics_snapshot`) | Добавить 7 ключей в ru и en; фильтр — через `safeAdminMessage(...) ?? type` (как `data/audit/audit-resolve-labels.server.ts`); тест паритета «каждое значение `AUDIT_ENTITY_TYPE` (и `AUDIT_ACTION`) имеет подпись» (CU1) |
| Клиентская ошибка без стека (`-3`, 9 событий на `/bricks`, `/lessons`, `/calendar`, `/audit`) | Не отдельный дефект: в production текст серверного исключения скрыт, остаётся digest — видимая сторона `-1Y`, `-2C`, `-Q` | Закрывается CU1; страница ошибки D22 показывает digest admin |
| Единичный `timeout exceeded when trying to connect` на `POST /profile` (`-2D`, 1 событие) | Наблюдение, не дефект P25: `pg-pool` не выдал соединение за 15 с (`POOL_CONNECTION_TIMEOUT_MS`, `max: 10` в `packages/db/src/client.ts`); клиент — синглтон, строка — pooled `DATABASE_URL`; всплеск совпал с падениями RSC. Устойчивой нехватки лимита Neon один случай не доказывает | Вне scope; после CU1 повторить выборку Sentry за 30 мин — если таймауты повторятся, отдельная задача (лимиты Neon / `max` пула) |
| Жаргон в тексте | `ru/analytics.json` (`sample.composition`, `kpi.with_n`, `years.diff_points_unit`), `admin.json` (`timezone_hint`), `AnalyticsPeriodKpiSection.tsx` и `PupilAnalyticsKpiSection.tsx` с `N=` прямо в JSX | Словарь по ADR-018, тест стоп-слов (CU3) |
| Режим «Смотреть как» сбрасывается | `shell-header.client.tsx:44` — `useState`; подпись роли берётся из реальной роли; пункты предпросмотра ведут на страницы, закрытые реальной ролью (`/group` — `requireRole(TEACHER)`) | Cookie `view_as`, бейдж, фильтр пунктов (CU9) |
| Дата в `/approvals` «11/3/2026» | `ApprovalRow.tsx:41` — `toLocaleDateString()` без локали | `formatDate` из `lib/i18n/format.ts` (CU3) |
| «Добрый вечер, …»; «Урок 5 · Урок 5»; лишний «x» | Фолбэк `"…"` в `TodayPageContent.server.tsx`; шаблон `lesson.detail.card_title` + название урока из фикстуры; источник «x» не найден в коде — проверить DOM | CU6 |

## Agent context budget

**MUST read (≤ 8):**

| # | Документ | Зачем |
|---|----------|-------|
| 1 | [`P25_tasks.md`](../tasks/P25_tasks.md) | Чек-лист и CU |
| 2 | [`adr_018_ui_terminology_and_term_hints.md`](../../../prds/07_governance/adr_018_ui_terminology_and_term_hints.md) | Термины, `TermHint`, форматы, `view_as` |
| 3 | [`usability_audit_2026-11-03.md`](../../../reports/usability_audit_2026-11-03.md) | Находки и предложения |
| 4 | [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) §3.1, §5, R-17…R-20 | Аналитика (CU2, CU3, CU5) |
| 5 | [`homework_check_flow_spec.md`](../specs/homework_check_flow_spec.md) §5.2–§5.3, R-18 | Проверка ДЗ (CU6) |
| 6 | [`global_shell_spec.md`](../specs/global_shell_spec.md) §8, R-14 | «Смотреть как» (CU9) |
| 7 | [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) D-17, D-18 | `TermHint`, форматы (CU4) |
| 8 | [`copy_and_messages.md`](../../../guidelines/react/copy_and_messages.md) | Срезы словаря, стоп-слова |

**MUST NOT read:** другие `P*_phase_description.md`, `docs/examples/pulse/**`.

## Scope / Out of scope

### In scope

- Исправление падений и формата «Явка»; словарь, `TermHint`, форматы; экраны из аудита (§Состав работ ниже); режим «Смотреть как»; страница ошибки с действием и кодом.
- Правки `apps/web` (UI, словари, DAL-чтение для формата), `packages/domain` — только форматирование отображения, если потребуется; тесты.

### Out of scope

- Таймаут пула соединений (`-2D`) — наблюдение, см. таблицу причин; расчётные правила аналитики (БП-1…БП-4, пороги N / M), схема БД и миграции, права доступа и политика (кроме подписи режима), палитра и шрифты (UX-03), новые маршруты.
- Моб. вёрстка 390 px как отдельный аудит — отмечена как рекомендация (после фазы).
- Реальные сессии тестирования с учителями.

## UI Catalog (эта фаза)

| Компонент / паттерн | Статус | Где в Lab |
|---------------------|--------|-----------|
| `TermHint` | новый (CU4) | «Подсказка термина»: закрыт / открыт / длинный текст / фокус / касание |
| `ConfirmDialog` danger | существует | без изменений (CU7 использует для «Исключить») |
| `RowActionsMenu` («⋯») | новый (CU7) | меню действий строки: основное действие + «⋯» |
| `ErrorState` с кодом и «На главную» | расширение (CU1/CU9) | состояние D22 |

## UX/UI verification loop

После каждого CU с UI: `npm run lint`, `npm run test`, `npm run parity:check` (расхождения P-02…P-28 существовали до P25 — не ухудшать); runtime dual-view (`next-dev-loop`) — только по явной просьбе пользователя; Design Lab `/design-system` — секция нового компонента до использования на экране.

## Cross-phase dependencies

| Зависимость | Что нужно |
|-------------|-----------|
| P08 / P11 (аналитика) | Форматтеры и компоненты `components/analytics/*` |
| P14 / P17 (редизайн, i18n) | Срезы словаря, `pick-*-messages`, ru/en паритет ключей |
| P24 (оболочка) | `shell-header.client.tsx`, `build-shell-nav.server.ts`, cookie `sidebar_collapsed` как образец для `view_as` |

## Implementation sequence

`CU1 (падения) → CU2 (Явка) → CU3 (словарь, форматы, стоп-слова) → CU4 (TermHint) → CU5 (аналитика) → CU6 (проверка ДЗ, Сегодня) → CU7 (Ученики, Заявки) → CU8 (рейтинг, группы, настройки, год) → CU9 (Смотреть как)`. CU3 раньше CU4–CU8 (ключи словаря); CU4 раньше CU5–CU8 (компонент подсказки). CU9 — T3, свой CU.

## Happy path smoke

1. Администратор открывает `/calendar`, `/bricks`, `/audit`, `/lessons` (в т. ч. фильтр по классам при `grades.length > 1`): страницы открываются, фильтр «Применить» не роняет RSC.
2. Аналитика: «Явка» в таблице учеников — `80%`; сверху «Регулярно ходят: 26 из 30»; «?» у «Средняя явка» раскрывает определение; блок «Как мы считали цифры» свёрнут.
3. Проверка ДЗ: подписи «Пел вместе с хором», «Не отвечал», «Заполнено полей: 0 из 5».
4. `/people`: поиск «Иванов» оставляет только однофамильцев; опасные действия — в меню «⋯».
5. «Смотреть как → Учитель», F5 — режим остался, бейдж «Режим: учитель» виден.

## Negative path smoke

1. Нет данных в аналитике → «—» и подсказка, не `NaN%`.
2. Подсказка на касании и с клавиатуры (Tab → Enter → Esc).
3. Новое значение `AUDIT_ENTITY_TYPE` без подписи → фильтр показывает код типа, страница не падает; падение страницы → «Не удалось открыть страницу», «Повторить», «На главную»; digest виден только admin.
4. Режим «Учитель» без назначения на группу → пояснение, пунктов без доступа нет.
5. Повреждённая `view_as` → реальная роль, без ошибки.
6. Поиск без результатов → «Никого не нашли».

## Security smoke

1. `view_as` не меняет доступ: admin в режиме «Учитель» по-прежнему получает отказ на `requireRole(TEACHER)` страницах — их просто нет в меню; прямой URL проверяется реальной ролью.
2. Подсказки и страница ошибки не раскрывают ПД и stack trace; digest — только admin.
3. Cookie `view_as` — без ПД, не auth, не `HttpOnly`-секрет; в prod переключатель не рендерится (`APP_ENV`).

## Concurrency & race check

- Cookie `view_as` читается сервером в layout (как `sidebar_collapsed`); смена режима — client-side запись + `router.refresh()`; гонок записи нет.
- Поиск по `/people` — серверный параметр `?q=` с debounce клиента; повторный запрос заменяет предыдущий.

## Drift risks & guards

| Риск | Страж |
|------|-------|
| Жаргон возвращается в словарь | vitest по `lib/messages/ru/*.json` (стоп-слова, CU3) |
| `N=` в JSX | grep `N=` в `apps/web/src/components` в CU DoD CU3 |
| Дата / процент форматируются на месте | grep `toLocaleDateString()`, `toFixed(` в изменённых файлах; тест форматтера |
| Прототип расходится | `npm run parity:check` не хуже базовых 11 расхождений P-02…P-28 |
| `view_as` меняет права | тест: реальная роль решает доступ при любом значении cookie |
| Функции-форматтеры снова уходят в client-компонент | `assertSerializableMessages` на prop `messages` каждого `"use client"`-компонента + тест `LessonsGradeFilter` (получает две строки); правило `ui-messages-bundle-splitting` §3 |
| Новое значение `AUDIT_ENTITY_TYPE` / `AUDIT_ACTION` без подписи | тест паритета домен ↔ `ru/en admin.json`; фильтр журнала через `safeAdminMessage` |

## Definition of done

- [ ] CU1–CU9 закоммичены с `Review: …`; Phase DoD в `P25_tasks.md`
- [ ] Страницы `/calendar`, `/bricks`, `/audit`, `/lessons` открываются под admin и teacher
- [ ] В `ru/*.json` нет стоп-слов; `N=` нет в JSX
- [ ] «Явка» везде в процентах (`80%`)
- [ ] `TermHint` в Lab и на экранах аналитики, рейтинга, проверки ДЗ, достижений, кирпичиков
- [ ] «Смотреть как» переживает перезагрузку, права не меняются (тест)
- [ ] Документы и прототип синхронны с кодом (grep по docs: «основная выборка» только в доменных разделах и Change log)

## Open questions фазы

| ID | Вопрос | Предложение | Блокирует |
|----|--------|-------------|-----------|
| Q-1 | Причина падений CU1 | **Закрыт 2026-11-03** по Sentry: `-1Y`/`-2C` — функции в props `LessonsGradeFilter`; `-Q` — нет ключей `audit.entity_types.*`; `-3` — эхо | — |
| Q-4 | Повторить выборку Sentry за 30 мин после CU1 (проверить, что 1Y/2C/Q/3 не растут и нет новых таймаутов `-2D`) | Выполнить по завершении CU1 и записать в Change log | нет |
| Q-2 | Название слоя A и подпись шкалы стиха 0/1/2 (ADR-018 Q-1, Q-2) | «Регулярно ходят»; «0 — не знает, 1 — с подсказкой, 2 — наизусть» | нет |
| Q-3 | Показывать ли предупреждение «нет отметки у N учеников» учителю | Да, с действием «Показать, кого» (R-19) | CU5 |

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P25_tasks.md`](../tasks/P25_tasks.md) | Задачи и commit units |
| [`adr_018_ui_terminology_and_term_hints.md`](../../../prds/07_governance/adr_018_ui_terminology_and_term_hints.md) | Решение |
| [`usability_audit_2026-11-03.md`](../../../reports/usability_audit_2026-11-03.md) | Источник |

## Agent notes

- Не менять расчёт аналитики — только отображение.
- Не вводить новые термины без записи в глоссарий ADR-018 §4.
- Один компонент на файл, ≤ 140 строк; тексты — только `@/lib/messages`; константы — `@sunschool/domain`.
- `view_as` — UI-предпочтение; доступ решает реальная роль.

## Acceptance criteria

См. [`adr_018_ui_terminology_and_term_hints.md`](../../../prds/07_governance/adr_018_ui_terminology_and_term_hints.md) §9 и DoD выше.

## Change log

| Date | Change |
|------|--------|
| 2026-11-03 | v1.0 — Canonical (подготовка P25): документы и прототип; реализация не начата |
| 2026-11-03 | v1.1 — отчёт Sentry ([`sentry_issues_2026-11-03_30m.md`](../../../reports/sentry_issues_2026-11-03_30m.md)): точные причины падений (функции в props `LessonsGradeFilter`, нет ключей `audit.entity_types.*`), Q-1 закрыт, Q-4, наблюдение `-2D`, стражи в Drift risks |
