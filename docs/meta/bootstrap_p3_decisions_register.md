# Bootstrap P3 — реестр решений и открытых вопросов

**Тип:** Register  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W14  
**Зависит от:** [`documentation_creation_registry.md`](./documentation_creation_registry.md), [`architecture_master_index.md`](../prds/architecture_master_index.md), [`project_quality_profile.md`](./project_quality_profile.md)  
**Связанные документы:** [`implementation/mvp/README.md`](../implementation/mvp/README.md), [`prompts/00-orchestration.md`](../../prompts/00-orchestration.md)

---

## 1. Purpose

Единое место, где видно: **что решено владельцем**, **что принято по умолчанию и ждёт подтверждения**, **что блокирует prod** и **что нужно сделать в P4–P6**. Заменяет разбросанные таблицы Open questions при планировании фаз. Источники — документы, на которые ссылается каждая строка.

## 2. Статус bootstrap

| Этап | Статус | Примечание |
|------|--------|------------|
| P00 Профиль качества | ✔ | `lean`, модули `auth`, `design_lab`, `sentry`, `i18n`, `ios_safari_transport` |
| P0 Bootstrap, P1 Прототип | ✔ | HTML-прототип приведён к UX-03 (D-6…D-8) |
| P2 Реестр документов | ✔ (gate G2) | реестр адаптирован; формальное утверждение владельцем — в шапке реестра |
| **P3 Волны W1–W9, W11, W12, W14, W15** | ✔ | см. индекс; W10, W13, часть W5/W6/W7/W9/W12 — «не требуется» на lean |
| P4 Rules + guidelines | ✔ | T0 + T1 активны (без `s3-file-asset-uploads`); auth-правило и гайд — OIDC; guidelines очищены |
| P5 Scaffold, P6 Design Lab | ⏳ следующий: P5 | gates G3–G5 |
| P7+ Фазы P01…P07 | ⏳ | [`implementation/mvp/README.md`](../implementation/mvp/README.md) |

Gate G3 (к P5): `database_schema_v1.md` canonical, контракты W8 и specs lean созданы — **выполнено**. Условие для P5: активные T1-правила (P4).

## 3. Решения владельца (подтверждены)

| # | Решение | Дата | Источник |
|---|---------|------|----------|
| 1 | Уровень строгости **lean**; ревью — вариант (a): модель в чате, `reviewer` только для CU с runtime-кодом T3/`Paths: S` | 2026-10-10 | [`project_quality_profile.md`](./project_quality_profile.md) |
| 2 | Два проекта Neon (dev и prod); первый admin по `FIRST_ADMIN_EMAIL` из env | 2026-10-10 | [ADR-001](../prds/07_governance/adr_001_stack_and_runtime.md) §3.4 |
| 3 | Заявка с ролью `parent` в MVP отклоняется; повторная заявка без ограничений | 2026-10-10 | [`lifecycle_models.md`](../prds/02_domain_model/lifecycle_models.md) §5.1 |
| 4 | БП-5 вариант А: баллы замораживаются при выставлении | 2026-10-10 | спец. 12.2 п. 6 |
| 5 | Нумерация стихов — Синодальная; NIV загружается; лицензию Biblica подтвердить до prod | 2026-10-10 | [ADR-009](../prds/07_governance/adr_009_bible_translations_and_verse_numbering.md) |
| 6 | Часовой пояс школы выбирается в интерфейсе (`/settings`); язык — один на приложение | 2026-10-11 | [ADR-004](../prds/07_governance/adr_004_timezone_scheduling_model.md), [ADR-008](../prds/07_governance/adr_008_i18n_ru_en_dictionary_slices.md) |
| 7 | Очистка просроченной регистрации — лениво (без cron) | 2026-10-11 | INV-25 |
| 8 | Основная кнопка `cobalt-ink`; границы полей `muted` (3:1); баннер ошибки по D-8; админу «Календарь» и «Кирпичики» | 2026-10-10 | [`visual_identity_contract.md`](../design/visual_identity_contract.md) |
| 9 | Текст `/privacy` — в коде приложения; «Выйти» на `/register` и `/pending` | 2026-10-10 | [`canonical_routes.md`](../design/canonical_routes.md) |
| 10 | Срок удаления данных — 15 дней (юр. проверка до prod); авто-удаление регистрации — 30 дней | 2026-10-10 | [`deletion_requests_contract.md`](../implementation/mvp/contracts/deletion_requests_contract.md) |
| 11 | Явное завершение проверки урока; два урока в день; удаление урока без проверок teacher'ом | 2026-10-11 | [`homework_check_contract.md`](../implementation/mvp/contracts/homework_check_contract.md) |
| 12 | Первый admin проходит экран согласия; год не переоткрывается; деактивация группы с зачислениями — с подтверждением; teacher выдаёт кирпичики и в закрытом году; слово подтверждения удаления по языку | 2026-10-11 | контракты W8-03, W8-04, W8-06, W8-08 |
| 13 | Одобрение `TEACHER` без групп — с предупреждением `NO_GROUPS` | 2026-10-11 | [`access_requests_and_roles_contract.md`](../implementation/mvp/contracts/access_requests_and_roles_contract.md) §5.4 |
| 14 | Метрика рейтинга — сумма баллов за год; сдвиг оценок за стихи (поле i урока N → стих i урока N−1) | 2026-10-11 | спец. 12.2 п. 5, 15 |
| 15 | Переходный период согласий перенесённых детей: `LEGACY_PENDING`, 60 дней | 2026-10-11 | [ADR-011](../prds/07_governance/adr_011_transitional_child_consent.md) |
| 16 | **Перенос данных из действующего приложения реализует владелец** вне проекта | 2026-10-11 | [`P07_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P07_phase_description.md), [`migration_runbook.md`](../prds/06_operations/migration_runbook.md) §11 |

## 4. Принято по умолчанию, ждёт подтверждения владельца

| # | Вопрос → значение по умолчанию | Где |
|---|--------------------------------|-----|
| 1 | Срок JWT 14 суток, `updateAge` 1 сутки | ADR-003 Q-01 |
| 2 | Флаги `features.*` — в `app_setting`, проверка на сервере | ADR-005 Q-01 |
| 3 | Пояс по умолчанию не предлагается (только выбор в настройках) | ADR-004 Q-01 |
| 4 | `REGISTRATION`-пользователь не может запросить удаление; новая версия согласия — на `/register` | [`authorization_matrix.md`](../prds/04_authorization_privacy/authorization_matrix.md) Q-01, Q-02 |
| 5 | Перевод между группами делает только admin; admin открывает урок из карточки группы/аналитики | матрица Q-03, Q-04 |
| 6 | Первый admin: `email_verified` обязателен | [`auth_runtime_spec.md`](../prds/05_runtime/auth_runtime_spec.md) Q-04 |
| 7 | Маркер окружения в БД (`app_setting.db_environment`); каталог достижений в prod «спит»; «смотреть как» только в dev | [`seed_data_spec.md`](../prds/03_data_model/seed_data_spec.md) Q-01…Q-05 |
| 8 | `digest` ошибки показывается пользователю; нет локального черновика проверки; комментарий ≤ 500; дубликат ученика — предупреждение | UX-05 Q-02, UX-06 Q-01…Q-03 |
| 9 | «Сохранить и далее» = `saveChecked`; правки в таблице — сразу по ячейке; средних в таблице нет | [`homework_check_flow_spec.md`](../implementation/mvp/specs/homework_check_flow_spec.md) Q-01…Q-03 |
| 10 | Оболочка: бейдж «99+», динамика за Suspense; dev-вход фикстур; admin+teacher → NAV admin | [`global_shell_spec.md`](../implementation/mvp/specs/global_shell_spec.md) Q-01…Q-05 |
| 11 | Lab: lucide, токены `penalty`/`tier` объявлены, но не используются | [`design_system_lab_spec.md`](../implementation/mvp/specs/design_system_lab_spec.md) Q-02, Q-03 |
| 12 | Окно восстановления Neon prod — не менее 1 суток; релиз prod — GitHub Actions с protected environment | [`migration_runbook.md`](../prds/06_operations/migration_runbook.md) Q-02, Q-03 |

## 5. Блокеры prod (ждут владельца или юриста)

| # | Что | Блокирует | Источник |
|---|-----|-----------|----------|
| 1 | Лицензия Biblica на NIV (или переход на BSB) | загрузка NIV в prod | ADR-009 §3.2 |
| 2 | Юридическая проверка срока удаления 15 дней | prod | deletion contract Q-01 |
| 3 | Юридическая проверка основания обработки данных перенесённых детей в переходный период; подтверждение срока 60 дней | prod | ADR-011 Q-01, Q-02 |
| 4 | Окно восстановления Neon и его текст в согласии | prod, `/privacy` | runbook §9 |
| 5 | Prod-домен; приложения Google и Telegram prod | P07 | vercel_deploy_guide Q-04 |
| 6 | Финальный текст согласия `/privacy` v1 | P07 | access_and_registration_spec |

## 6. Работы bootstrap P4–P6 (вытекают из аудита W14)

| # | Работа | Фаза |
|---|--------|------|
| 1 | ✔ Активировать T1-правила; адаптировать `auth-security.mdc` и `docs/guidelines/auth/ai_auth_implementation_guide.md` (Credentials → OIDC, без адаптера) | P4 |
| 2 | ✔ `docs/guidelines/README.md` и `react/README.md`: убрать ссылки на не созданные `styleguide`, `accessibility_requirements`, `interaction_design_contract`, `content_and_microcopy_contract`, `client_flow`, `trainer_flow`; `next-themes` и `base-vega` в `react/ai_component_guidelines.md` — по решению P6 | P4 |
| 3 | ✔ `ai_loading_patterns.md`: реестр тегов кэша — в коде; `ai_form_handling_pattern.md`: адаптация под пояс школы и `MutationResult` | P4 |
| 4 | Проверить `shadcn init` Base UI и стиль; обновить правило `ui-design-system-shadcn` (без `.dark`) и ADR-001 при расхождении | P6 |
| 5 | Сверить Prisma `migrate dev/status`, shadow DB; Vercel Root Directory для монорепо | P5 |
| 6 | Написать `analytics_screens_spec` (P05-CU0) до реализации аналитики | P05 |
| 7 | Выбрать инструмент проверки границ пакетов (ESLint boundaries / dependency-cruiser) | P5 |

## 7. Что сознательно не создавалось (lean)

W1-01/02 шаблоны ADR-индекса; W5-01/03…07/09; W6-01/02; W7-01/04/05 (UX-04, UX-09, UX-10); W9-03, W9-05…W9-08; W10 wireframes; W12-01/03/04/08/09; W13 learning pack; UX-01, UX-07. Причины — [`architecture_master_index.md`](../prds/architecture_master_index.md) и [`project_quality_profile.md`](./project_quality_profile.md).

## 8. Acceptance criteria

- [ ] Каждое решение §3 имеет источник — исход: ссылки открываются (`docs:links`).
- [ ] Пункты §4–§5 не противоречат Open questions документов — исход: сверка при каждом новом решении.
- [ ] После каждого решения владельца строка переносится из §4/§5 в §3 в том же коммите.

## 9. Agent notes

- Не трактовать §4 как решения владельца: это значения по умолчанию.
- Новое решение владельца — сначала в источнике (документ), затем строка здесь.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — создан по итогам W14 |
| 2026-10-11 | P4 завершена: статус этапа и работы §6 п. 1–3 отмечены выполненными |
