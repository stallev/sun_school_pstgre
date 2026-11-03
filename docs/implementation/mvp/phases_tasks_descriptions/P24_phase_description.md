# P24 — UX-правки проверки ДЗ, оболочка, кнопки, toast, дни рождения

**Тип:** Phase Description  
**Статус:** Canonical  
**Прогресс фазы:** документы, прототип и parity готовы (подготовка), реализация не начата  
**Версия:** 1.0  
**Дата:** 2026-11-03  
**Волна:** P24  
**Зависит от:** [`adr_017_shell_container_toast_buttons.md`](../../../prds/07_governance/adr_017_shell_container_toast_buttons.md), [`homework_check_flow_spec.md`](../specs/homework_check_flow_spec.md) §5.2–§5.7, §10, R-11…R-14, [`global_shell_spec.md`](../specs/global_shell_spec.md) §5, §6.1а, §6.5, [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) D-14, D-15, [`school_year_and_groups_contract.md`](../contracts/school_year_and_groups_contract.md) §5.6a, §5.12, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) AZ-20a, [`project_quality_profile.md`](../../../meta/project_quality_profile.md) (lean, D4, D6)  
**Связанные документы:** [`P24_tasks.md`](../tasks/P24_tasks.md), [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md) §7.1, [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md) §3, [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md) §5.3–§5.4, [`redesign_v2_ui_spec.md`](../../../design/redesign_v2_ui_spec.md) §3.10, [`prototype_class_parity_spec.md`](../specs/prototype_class_parity_spec.md) §7, [`sunday_school_prototype.html`](../../../prototypes/sunday_school_prototype.html) (`vCheck`, `vCalendar`, `vGroup`, `sidebarHTML`, `toast()`)

---

## Purpose

1. Исправить баги последовательной проверки ДЗ: ошибка «Отметьте присутствие» не уходит после выбора и переезжает к следующему ученику; запись «самосохраняется»; при уходе с несохранёнными изменениями `window.confirm` с текстом «Сохранить?» по ОК уходит **без** сохранения.
2. Уплотнить карточку проверки на desktop: компактное «Присутствие», присутствие и спевка в строку, стихи и тест/тетрадь в две колонки, шкала 0–10 одной линией.
3. Один компактный размер кнопок (`h-9 px-3`, как «Выдать»); toast справа снизу с цветом и иконкой; сворачиваемый до иконок сайдбар и центрированный контейнер 1600 (ADR-017).
4. Учитель вносит дату рождения ученика своей группы на `/group`; дни рождения видны учителю и админу в `/calendar` (родителю — нет).

## Причины багов (контекст для CU1)

| Баг | Причина в коде (2026-11-03) | Исправление (документ) |
|-----|------------------------------|------------------------|
| Ошибка присутствия «прилипает» и переходит к следующему ученику | `presentError` в `use-sequential-check.ts` — одно состояние на экран; `updateActive` его не очищает при выборе «Да / Нет»; `handleSave` не очищает при переходе к следующему ученику | check flow §5.5 п. 2, R-11 |
| Самосохранение | Глобальный `keydown` (`use-sequential-check.ts`, обработчик Enter) пропускает только `input` / `textarea`: при фокусе на кнопке сегмента «Да / Нет» Enter вызывает `preventDefault()` и `handleSave()` — сохранение без нажатия «Сохранить и далее». Гипотеза подтверждается тестом в CU1 (Q-1) | check flow §5.7, R-12 |
| Диалог ухода с обратным смыслом | `window.confirm(messages.unsavedConfirmTitle)` (`use-sequential-check.ts`, ~стр. 104): ОК = переход **без** сохранения, Отмена = остаться; текст «Сохранить изменения перед переходом?» противоречит поведению; третьего действия нет | check flow §5.5 п. 5–7, R-13; UX-06 §7.1 |

## Agent context budget

**MUST read (≤ 8):**

| # | Документ | Зачем |
|---|----------|-------|
| 1 | [`P24_tasks.md`](../tasks/P24_tasks.md) | Чек-лист и CU |
| 2 | [`homework_check_flow_spec.md`](../specs/homework_check_flow_spec.md) §5.2–§5.7, §10, §13 | Проверка ДЗ (CU1, CU2) |
| 3 | [`adr_017_shell_container_toast_buttons.md`](../../../prds/07_governance/adr_017_shell_container_toast_buttons.md) | Решение по оболочке, toast, кнопкам |
| 4 | [`global_shell_spec.md`](../specs/global_shell_spec.md) §4–§6.5, §15–§16 | Оболочка, cookie, toast (CU4, CU5) |
| 5 | [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) D-14, D-15, §7, §8 | Размеры и рецепты (CU3, CU4) |
| 6 | [`school_year_and_groups_contract.md`](../contracts/school_year_and_groups_contract.md) §5.6a, §5.12, §6, §7 | Дата рождения, дни рождения (CU6, CU7) |
| 7 | [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) AZ-20a, AZ-43, AZ-60 | Права |
| 8 | [`design_system_lab_spec.md`](../specs/design_system_lab_spec.md) §5.3–§5.4 | Lab до экранов (C-2) |

**MUST NOT read** другие `P*_phase_description.md`.

---

## Scope / Out of scope

### In scope

| Область | Результат |
|---------|-----------|
| Проверка ДЗ (логика) | сброс ошибки присутствия, Enter-guard, модальный диалог из трёх действий + toast «Изменения сброшены» |
| Проверка ДЗ (раскладка) | §5.2а: присутствие + спевка в строку, 2 колонки, inline 0–10; компактный сегмент (`fit`) |
| Примитивы | `Button` компактный `default`, `field`, `touch`; `SegmentedControl` `h-9` и `fit`; `ScorePad` inline 0–10 |
| Toast | `bottom-right` на `lg`, сверху на mobile; success / error — цвет и иконка |
| Оболочка | rail `4rem`, cookie `sidebar_collapsed` (сервер), контейнер `max-w-[1600px] mx-auto` для шапки и контента |
| Дата рождения | `updatePupilBirthDate` (teacher своей группы, admin), журнал `school.pupil_birth_date_updated`; аудит смены даты в `updatePupil` |
| Календарь | дни рождения (read-model из `pupil.birth_date`), только teacher и admin |

### Out of scope

- Миграции и новые таблицы: схема не меняется (`database_schema_v1.md` §5.3); день рождения — не `GRADE_EVENT_TYPE`.
- Дни рождения у родителя, уведомления о днях рождения, возраст на экранах.
- Правка ФИО, активности и согласия учителем.
- Автосохранение формы проверки при переходе.
- Новые маршруты и query-параметры (`canonical_routes.md` §10).

## UI Catalog (эта фаза)

Без новых примитивов. Меняются `Button`, `SegmentedControl`, `ScorePad`, `ScoreSelector` (размер), `ConfirmDialog` (вариант `unsaved`), `SidebarNav` / `NavLinkRow` (rail), `ProductToaster`. Новые составные: `CheckUnsavedDialog`, `PupilBirthDateDialog`, `CalendarBirthdayRow` (из каталожных `Dialog`, `DateField`, `Button`, `Icon`). Порядок C-2: секция Lab → экран.

## UX/UI verification loop

Runtime-проверка (`next-dev-loop`) и скриншоты — **только по явной просьбе пользователя** (правила проекта). По умолчанию CU закрываются тестами компонентов, хуков и DTO и `npm run parity:check`. Эталон вида — обновлённый прототип (`vCheck` на 1920×1080, rail, toast, диалог несохранённых изменений, `vCalendar` с днём рождения, 390 px).

## Cross-phase dependencies

| Фаза | Что нужно |
|------|-----------|
| P03 | `/calendar`, `loadCalendarPage`, `CalendarMonth` |
| P04 | `use-sequential-check`, `saveChecked` / `correctCheck` |
| P11 | `ScorePad` |
| P13 | ветка `PARENT` в `loadCalendarPage` (исключить дни рождения) |
| P14 | сайдбар, шкала контролов, Lab, parity-гейт |

## Implementation sequence

CU1 (логика проверки) → CU2 (раскладка + `fit` + inline 0–10) → CU3 (единый размер кнопок) → CU4 (toast) → CU5 (rail + контейнер) → CU6 (дата рождения, T3) → CU7 (дни рождения в календаре, T3). CU6 и CU7 — свой CU, `reviewer`.

## Happy path smoke

Учитель на `/lessons/<id>/check` пытается сохранить без присутствия — ошибка; выбирает «Да» — ошибка исчезает; Enter на кнопке «Да» не сохраняет; ставит оценки, выбирает другого ученика — диалог; «Сохранить и перейти» — сохранено, открыт выбранный. Снова правит, выбирает другого — «Не сохранять» — toast «Изменения сброшены». На 1920×1080 карточка без прокрутки. Сворачивает сайдбар, перезагружает — rail. Toast справа снизу зелёный. На `/group` вносит дату рождения — toast; в `/calendar` в этот день строка «День рождения: <имя>».

## Negative path smoke

«Сохранить и перейти» без присутствия — перехода нет, ошибка у поля; «Остаться» / Esc — ничего не меняется; дата рождения в будущем — ошибка поля; 29 февраля в невисокосном году — 28 февраля; нет cookie — сайдбар развёрнут; < `lg` — drawer.

## Security smoke

Teacher меняет дату ученику чужой группы — `NOT_FOUND`; в закрытом году — `FORBIDDEN`; parent вызывает action — `FORBIDDEN`; parent на `/calendar` не получает дней рождения (DTO); в журнале нет значения даты и ФИО.

## Concurrency & race check

Двойное «Сохранить и перейти» — кнопки `disabled`, один запрос; ответ сохранения не перезаписывает форму другого ученика (ключ по `pupilId`, §12); две правки даты рождения — последняя побеждает, журнал по каждой смене.

## Drift risks & guards

| Риск | Защита |
|------|--------|
| Возврат `window.confirm` | grep в CU1 DoD; R-13 |
| Размеры кнопок снова расходятся | `size="compact"` удалён, parity-гейт, тест `button` |
| Дни рождения утекут родителю | тест загрузчика на ветку `PARENT` (CU7) |
| Состояние сайдбара мигает при SSR | cookie читается сервером, тест парсера |
| Дата рождения в журнале | тест DAL: `new_value = { fields: ["birthDate"] }` |

## Definition of done

- [ ] Все CU закоммичены; у каждого trace `Review: …`
- [ ] `typecheck` · `lint` · `test` · `rules:check` · `parity:check` зелёные
- [ ] Acceptance spec проверки §14 (пункты P24), оболочки §16, ADR-017 §9, контракта школы §11 (пункты P24) закрыты тестами
- [ ] Q-1 закрыт тестом CU1

## Open questions фазы

| ID | Вопрос | Предложение | Блокирует |
|----|--------|-------------|-----------|
| Q-1 | Самосохранение вызывает только Enter на сфокусированной кнопке или есть второй путь | Воспроизвести тестом хука в CU1; если найден иной путь — правка §5.5 п. 7 через `architect` | нет (CU1 закрывает) |

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P24_tasks.md`](../tasks/P24_tasks.md) | Чек-лист |
| [`adr_017_shell_container_toast_buttons.md`](../../../prds/07_governance/adr_017_shell_container_toast_buttons.md) | Решение |
| [`homework_check_flow_spec.md`](../specs/homework_check_flow_spec.md) | Экран проверки |
| [`school_year_and_groups_contract.md`](../contracts/school_year_and_groups_contract.md) | Дата рождения, календарь |

## Agent notes

- Мутации проверки (`saveChecked`, `correctCheck`, `savePartialCheck`) не менять; правится только клиентский поток.
- Не добавлять тип события календаря и миграцию для дней рождения.
- Не хранить состояние сайдбара только в `localStorage`.
- Перед CU3 найти всех потребителей `size="compact"` и `SegmentedControl size` (grep), перевести в том же CU.
- Перед CU6 прочитать `update-pupil.ts` и `school-pupil-shared.server.ts` целиком.

## Acceptance criteria

См. DoD выше и Acceptance задач в [`P24_tasks.md`](../tasks/P24_tasks.md).

## Change log

| Date | Change |
|------|--------|
| 2026-11-03 | v1.0 — Canonical (подготовка P24): документы, прототип и parity готовы; код не начат |
