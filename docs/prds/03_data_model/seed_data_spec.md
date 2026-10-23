# Seed data spec — справочники, Библия, dev-фикстуры

**Тип:** PRD (данные)  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W6-03  
**Зависит от:** [`database_schema_v1.md`](./database_schema_v1.md) §5–§7, [`adr_001_stack_and_runtime.md`](../07_governance/adr_001_stack_and_runtime.md) §3.4, [`adr_005_schema_complete_post_mvp_tables.md`](../07_governance/adr_005_schema_complete_post_mvp_tables.md), [`adr_009_bible_translations_and_verse_numbering.md`](../07_governance/adr_009_bible_translations_and_verse_numbering.md), [`sunday_school_data_analytics_spec.md`](../../my_specs/sunday_school_data_analytics_spec.md) §15 (ОК-1…ОК-8), [`achievements_spec.md`](../../my_specs/achievements_spec.md) §9, [`Bible/README.md`](../../my_specs/Bible/README.md)  
**Связанные документы:** [`auth_runtime_spec.md`](../05_runtime/auth_runtime_spec.md) §4.2, §5.1, [`domain_invariants.md`](../02_domain_model/domain_invariants.md) INV-24, PKG-03, [`architecture_master_index.md`](../architecture_master_index.md)  
**Проверено по:** Prisma ORM v7, «Seeding» — prisma.io через WebFetch, 2026-10-11: команда задаётся в `prisma.config.ts` (`migrations.seed`), запускается только явным `prisma db seed`; `migrate dev` / `migrate reset` seed **не** запускают; `PrismaClient` требует driver adapter (`@prisma/adapter-pg`). Формат seed Библии и проверки — по скриптам владельца (`Bible/README.md`), без запуска. Context7 недоступен.

---

## 1. Purpose

Определить, **какие данные** попадают в пустую БД, **кем и в каком порядке** они загружаются и как seed защищён от запуска не в том окружении. Читают: исполнитель P01/P02 (`packages/db`), авторы W12 (`local_dev_setup`, runbook), `reviewer` (T3).

## 2. Scope / Out of scope

**В scope:** справочники, тексты Библии, каталог достижений и штрафов, настройки по умолчанию, dev-фикстуры, команды и защита окружения.  
**Вне scope:** перенос данных из старого приложения (W12-02, отдельная процедура); схема таблиц ([`database_schema_v1.md`](./database_schema_v1.md)); создание первого admin (поведение входа — [`auth_runtime_spec.md`](../05_runtime/auth_runtime_spec.md) §5.1).

## 3. Наборы данных

| Набор | Содержимое | dev | prod | Идемпотентность |
|-------|------------|:---:|:----:|-----------------|
| **A. Справочники** | `organization`, `app_setting` по умолчанию, `bible_translation`, `bible_book`, каталог `achievement` / `achievement_tier` и штрафы | ✔ | ✔ | upsert по естественному ключу, без `TRUNCATE` |
| **B. Библия** | `bible_verse` (RST, NIV), `bible_verse_map` | ✔ | ✔ (NIV — после лицензии) | upsert, одна транзакция на перевод |
| **C. Первый admin** | отдельная команда `db:seed:admin` (не справочник): email и пароль из `FIRST_ADMIN_EMAIL` / `ADMIN_PASSWORD` | ✔ | ✔ | один раз под блокировкой |
| **C2. Dev-учитель** | отдельная команда `db:seed:teacher`: email и пароль из `TEACHER_EMAIL` / `TEACHER_PASSWORD`; не входит в набор prod | ✔ | **никогда** | один раз под блокировкой; только `APP_ENV=dev` |
| **D. Dev-фикстуры** | вымышленные группы, люди, уроки, проверки, кирпичики, календарь, заявки, журнал | ✔ | **никогда** | пересоздаёт данные dev с нуля |

После развёртывания **prod содержит только A + B + C** (ОК-2): ни одной группы, ученика, учебного года, урока, проверки. Набор C2 (`db:seed:teacher`) в prod не входит.

## 4. Команды и порядок

| Шаг | Команда | Что делает | Окружение |
|-----|---------|------------|-----------|
| 1 | `db:migrate` | применяет миграции (схема целиком, ADR-005) | dev, prod |
| 2 | `db:seed:reference` | набор A; записывает маркер окружения (§5) | dev, prod |
| 3 | `db:seed:bible` | набор B: RST; затем `db:seed:bible:niv` — NIV; строит `bible_verse_map`, проверяет счётчики | dev, prod |
| 3a | `db:seed:admin` | набор C: первый admin (`ACTIVE`, роль `ADMIN`, `login_identity` `CREDENTIALS` с хэшем scrypt); пароль и email — dev: `.local/dev-secrets.json` (`FIRST_ADMIN_EMAIL`, `ADMIN_PASSWORD`), prod: переменные окружения оператора на время запуска; идемпотентна, пароль меняет только `--reset-password`; журнал `access.first_admin_created`, `auth.password_set` (`SYSTEM`) | dev, prod |
| 3b | `db:seed:teacher` | набор C2, после 3a: один учитель (`ACTIVE`, роль `TEACHER`, `CREDENTIALS`, `privacy_consent` текущей `consent_text_version`); секреты `TEACHER_EMAIL` / `TEACHER_PASSWORD` — только dev (`.local/dev-secrets.json` или env на время запуска); при `APP_ENV` или маркере ≠ `dev` — отказ до записи; идемпотентна; `--reset-password` меняет только хэш; занятый email — отказ; журнал `access.dev_teacher_created`, `auth.password_set`; группу не создаёт | **только dev** |
| 4 | `db:seed:dev` | набор D | **только dev** |

Правила:

1. Команды **явные**: ни `migrate`, ни старт приложения seed не запускают (Prisma v7).
2. Каждая команда идемпотентна: повторный запуск не меняет число строк и не дублирует журнал сверх одной записи «запущено».
3. Запуск, изменивший данные (или записавший маркер), пишет одну запись в `audit_log`; повтор, ничего не изменивший, записи не создаёт ([change_log_contract L-6](../../implementation/mvp/contracts/change_log_contract.md)) (`source = SYSTEM`, `entity_type = 'seed'`, `action`, результат и счётчики в `new_value`; ПД нет — INV-23, ПБ-2).
4. Seed-код живёт в `packages/db`; `apps/web` seed не импортирует (PKG).
5. Prisma-клиент seed создаётся через driver adapter с `DIRECT_URL` (не pooled).

## 5. Защита окружения (S)

| Проверка | Правило |
|----------|---------|
| `APP_ENV` | Обязателен: `dev` или `prod`; иначе команда завершается до подключения к БД |
| Маркер БД | `app_setting.db_environment` ∈ {`dev`, `prod`}; записывается шагом 2 по `APP_ENV` при пустом значении и **не перезаписывается** |
| Сверка | Любая команда seed и старт приложения сравнивают `APP_ENV` с маркером; расхождение → завершение с понятной ошибкой, **ничего не записано** (ОК-1, INV-24) |
| `db:seed:dev` | Дополнительно: отказывается, если маркер ≠ `dev` или маркера нет; в сборке и в скриптах деплоя prod команды нет |
| `db:seed:teacher` | То же ограничение, что у `db:seed:dev`: `APP_ENV` и маркер должны быть `dev`, иначе отказ до записи |
| Хост строки подключения | Логируется (без пароля) для оператора; решение принимается по маркеру, не по хосту |

Маркер в БД выбран потому, что защищает от неверно скопированной строки подключения: переменные окружения можно перепутать, база — нет. **Статус: Proposed** (Q-01); ADR-001 §3.4 п. 2 («строка подключения не отмечена как dev») получает эту реализацию после подтверждения.

## 6. Набор A — справочники

| Сущность | Запись по умолчанию | Ключ upsert |
|----------|---------------------|-------------|
| `organization` | ровно одна; имя — константа seed (`Sunday School`), правится admin в интерфейсе | единственная строка |
| `app_setting` | `ui_locale = "ru"`; `school_timezone = "UTC"` (ADR-004); `features.achievements` / `features.parents` / `features.voice` = `false` (ADR-005); `consent_text_version`; `legacy_consent_deadline_on` создаётся только при миграции ([ADR-011](../07_governance/adr_011_transitional_child_consent.md)) = текущая версия текста `/privacy`; `db_environment` (§5) | `key` |
| `bible_translation` | `ru-synodal` (RST, `locale RU`, `is_default`, `source`, `license`); `en-niv` (NIV, `locale EN`, `license` = копирайт Biblica, `is_default`) | `code` |
| `bible_book` | 66 книг, `sort_order`, `testament`, названия ru/en, короткие названия, `chapters_count`; книги RST и NIV объединяются по `sort_order` (Bible/README §4 п. 3) | `sort_order` |
| `achievement`, `achievement_tier` | 8 достижений стартового каталога | `code`, `(achievement_id, tier)` |
| Штрафы | 3 вида; хранятся в `achievement` с `kind = PENALTY` (`ACHIEVEMENT_KIND`, схема §4, §6); `penalty.achievement_id` ссылается на них | `code` |

### 6.1 Каталог достижений и штрафов

Источник правил — [`achievements_spec.md`](../../my_specs/achievements_spec.md) §9; здесь только перечень кодов, который проверяет тест seed.

| Код | Тип | Уровни → баллы | `is_active` |
|-----|-----|----------------|:-----------:|
| `verses` | серия | 3→10 · 5→15 · 7→25 | ✔ |
| `notebook` | серия | 3→5 · 5→10 · 10→20 | ✔ |
| `test` | серия | 3→5 · 5→10 · 10→20 | ✔ |
| `practice` | накопление | 1→3 · 5→10 · 15→20 | **выкл** (до голосовой проверки) |
| `lessons` | накопление | 5→5 · 15→10 · 30→20 | ✔ |
| `first` | разовое | 1→2 | ✔ |
| `singing` | накопление | 5→5 · 15→10 | ✔ |
| `hundred` | накопление | 100→10 | ✔ |
| `behavior` | штраф | −3 | ✔ |
| `disrupt` | штраф | −2 | ✔ |
| `disrespect` | штраф | −5 | ✔ |

Названия и описания на ru и en — из §9 `achievements_spec`. Каталог загружается и в prod (решение по умолчанию, Q-02); при `features.achievements = false` он «спит»: нет интерфейса и выдач (ADR-005).

## 7. Набор B — Библия

1. **Модель:** тексты приводятся к схеме §5.4 (`bible_translation`, общий `bible_book`, `bible_verse`); таблицы `bible_edition` / `bible_chapter` из скриптов владельца не создаются; `verse_order` сохраняется.
2. **Источники:** RST — `Bible/data/RelSQLData/bible_*_seed.json` (в git); NIV — `.../niv/*.json`, собирается из `niv_src` (локально, **не в git**, ADR-009 §3.2).
3. **Скрипты** владельца переносятся в `packages/db/src/seed/bible/` и поправляются под схему: пути, импорт env, имена таблиц, зависимости (Bible/README §4 п. 6). Они остаются источником алгоритма; расхождение с этим документом разрешается правкой скрипта.
4. **Проверки после загрузки** (падение = `status` перевода не `READY`):

| Проверка | Ожидание |
|----------|----------|
| Книг | 66 |
| Глав (по `max(chapter_number)` книг) | 1189 |
| Стихов RST / NIV | 31 166 / 31 103 |
| `SUM(verses_count)` по главам = число стихов | равенство |
| `verse_order` уникален в переводе | 0 дубликатов |
| `bible_verse_map`: сумма стихов по затронутой главе | совпадает с `verses_count` перевода |

5. **`bible_verse_map`** (ADR-009 §3.3): хранит только исключения; Псалмы — по правилу из разности `verses_count` (сдвиг главы, надписания как `verse_number = 0`), исключения и 27 остальных глав — по `packages/db/src/seed/bible/versification.json` (`{ version, exceptions[] }`, P03). Выборочную сверку карты до prod выполняет владелец (ADR-009 Q-02). Перевод `en-niv` остаётся не `READY`, пока загрузка и сверка §7 не прошли (ЯГ-3, R-9).
6. **Лицензия:** NIV загружается в dev по решению владельца; в prod — после подтверждения лицензии Biblica ([ADR-009](../07_governance/adr_009_bible_translations_and_verse_numbering.md) §3.2). Команда `db:seed:bible:niv` в prod требует явного флага `--confirm-license`.

## 8. Набор D — dev-фикстуры

**Источник:** `packages/db/src/seed/dev` (чистый генератор на сидированном PRNG — результат одинаковый при каждом запуске, ОК-4 по смыслу). Состав — §8.1 и §8.3, не отдельный файл `fixtures.ts`.

| Правило | Значение |
|---------|----------|
| Люди | **только вымышленные**; email — `*@example.test`, Telegram — без реальных id |
| «Сегодня» | урок со статусом `HELD` датирован `2026-10-04`, раньше обеих опорных дат (`2026-10-19` в §8.3 и `2026-10-31` в прототипе); тесты не читают системные часы |
| Идентификаторы | детерминированные (стабильные UUID из имени фикстуры) |
| Повтор | без флага `db:seed:dev` ничего не меняет, если год фикстуры уже есть. `--replace` (только `APP_ENV=dev` и маркер БД `dev`) удаляет строки фикстуры по известным id и пустые годы `Race-*` без уроков, зачислений и кирпичиков, затем вставляет набор заново. Справочники (A, B), Библия и пароли admin / `teacher@example.com` не трогает |
| Запрещено | загрузка дампа prod, копий prod, данных из старого приложения (ОК-4) |

### 8.1 Состав

| Сущность | Объём | MVP |
|----------|--------|:---:|
| Учебные годы | `2024–2025` и `2025–2026` — `CLOSED` (по 10 уроков, 2 обзорных, проверка завершена); `2026–2027` — `ACTIVE` (4 завершённых урока и 1 `HELD` с неполной проверкой) | ✔ |
| Группы | 3: «Младшая» и «Средняя» — `RU`, учитель-фикстура без пароля; «Старшая» — `EN`, если перевод `en-niv` уже `READY`, иначе `RU`, ведёт `teacher@example.com` | ✔ |
| Ученики | в активном году по 30 зачисленных в группе (допуск 28–32); часть переходит между годами и группами, несколько — в середине года; четверо с явкой ниже 50 %. Вне групп: двое с бумажным согласием, один без согласия, один неактивный. Один зачисленный — согласие `LEGACY_PENDING` | ✔ |
| Проверки | строка на каждого зачисленного на каждом завершённом уроке; на уроке `HELD` проверена только часть; несколько отметок «сдано позже» | ✔ |
| Кирпичики | выдачи и компенсирующие (отрицательные) записи | ✔ |
| Пользователи | вымышленные `*@example.test` без пароля; статусы `REGISTRATION`, `REQUEST_PENDING`, `REJECTED`, `ACTIVE`, `DISABLED`; пара с одинаковым ФИО. Admin и `teacher@example.com` сид не пересоздаёт | ✔ |
| Заявки | не меньше 4, все статусы (`PENDING`, `APPROVED`, `REJECTED`); одна отклонена с причиной про родителей | ✔ |
| Удаление | не меньше 4, оба типа (`ACCOUNT`, `CHILD_DATA`) и статусы очереди `NEW`, `IN_PROGRESS`, `CANCELLED`, `REJECTED`. `DONE` не ставится: он означает, что данные уже стёрты | ✔ |
| Календарь | событие `LESSON` на каждый урок; в активном году по одному `TRIP` и `CANCELLATION` на группу | ✔ |
| Журнал | пачкой не заполняется: одна запись о самом запуске сида | ✔ |
| Выданные достижения, штрафы, голос | **не заполняются** | — |
| Семьи, взрослые, родитель, согласия, дайджест | набор §8.4, только `db:seed:dev` при маркере `dev` | — |

### 8.2 Вход в dev

Вымышленные пользователи не имеют `login_identity`, которое проходит реальный OAuth. Для работы в dev используется переключатель роли «смотреть как» ([ОК-5](../../my_specs/sunday_school_data_analytics_spec.md), `responsive_navigation_contract` §8): он включён только при `APP_ENV=dev` и отсутствует в сборке prod. Реальный вход в dev: Telegram создаёт обычного `REGISTRATION` пользователя (только `provider_account_id`); администратор из `db:seed:admin` и учитель из `db:seed:teacher` входят по email и паролю. Учитель без назначения видит пустое состояние на `/today`. Родитель волны 2 входит по `PARENT_EMAIL` после `db:seed:dev` (§8.4).

### 8.3 Набор dev (`packages/db/src/seed/dev`)

Это и есть набор D. Запуск: `npm run db:seed:dev` (нужны `seed:reference` и `seed:teacher`; другого активного года быть не должно). Повторная заливка: `npm run db:seed:dev -- --replace` — только при `APP_ENV=dev` и маркере БД `dev`. Флаг удаляет строки фикстуры по детерминированным id (включая прежний набор из двух «Старших»), пустые годы `Race-*` без уроков, зачислений и кирпичиков, и вставляет набор заново. Кирпичики и текст журнала по ученикам стираются привилегированными функциями, как в `delete-academic-year`. Справочники, Библия и пароли admin / `teacher@example.com` остаются.

Состав — таблица §8.1. Возраст когорт на `2026-10-19`: младшая около 8 лет, средняя около 11, старшая около 14. В 2025–2026 несколько учеников числятся в двух группах (перевод после 5-го урока). Новички `n11`–`n12` приходят поздно и имеют меньше 4 уроков.

После вставки `seed:dev` вызывает `ensureYearSnapshots` для закрытых лет (идемпотентно, `BACKFILL`; [`analytics_year_snapshots_contract.md`](../../implementation/mvp/contracts/analytics_year_snapshots_contract.md) §6). `delete-academic-year` по-прежнему удаляет снимки года.

### 8.4 Семьи для проверки UI волны 2 (P13)

Только `db:seed:dev` при `APP_ENV=dev` и маркере БД `dev`. `db:seed:reference` семьи не создаёт и `features.parents` не включает.

| Что | Объём |
|-----|--------|
| Семьи | не меньше двух, на детях уже существующей фикстуры активного года |
| Взрослые | в одной семье — мать со связью на учётку родителя и отец без учётки |
| Согласия | одно бумажное и одно электронное (`ELECTRONIC`) |
| Дайджест | одна строка `weekly_digest` этого родителя, `sent_at` пуст |
| Учётка | `ACTIVE`, роль `PARENT`, вход email + пароль. Секреты `PARENT_EMAIL` / `PARENT_PASSWORD` — как у учителя: `.local/dev-secrets.json` или env на время запуска. Пароль в репозиторий не попадает. Нет секретов — отказ до записи |
| Флаг | `features.parents = true` только в этой команде и только при маркере `dev` |

`--replace` удаляет семьи фикстуры (и взрослых, если к семье не привязаны ученики вне фикстуры) и заливает набор заново. Голос и выданные достижения по-прежнему не заполняются.

**Registry:** этот подраздел — предусловие UI-CU [`P13_tasks.md`](../../implementation/mvp/tasks/P13_tasks.md) CU8–CU10.

## 9. Paths (H / N / S)

| Путь | Описание | Исход |
|------|----------|-------|
| **H** | Пустая dev-БД: `db:migrate` → `seed:reference` → `seed:bible` → `seed:dev` | Приложение стартует, под ролью «смотреть как» доступны данные прототипа |
| **H** | Пустая prod-БД: `db:migrate` → `seed:reference` → `seed:bible` | Справочники и Библия; первый admin входит по `FIRST_ADMIN_EMAIL`; больше ничего |
| **H** | `seed:dev` при маркере `dev` и секретах родителя | Есть семьи §8.4, учётка `PARENT`, `features.parents = true` |
| **N** | `seed:reference` на prod или dev | Семей нет, `features.parents` остаётся `false` |
| **H** | Повторный `seed:reference` | Нет дублей; журнал без новых записей (L-6) |
| **N** | `APP_ENV=dev`, маркер БД `prod` | Все команды и приложение завершаются, запись не выполнена |
| **N** | `seed:dev` без маркера | Отказ |
| **N** | Сверка счётчиков Библии не сошлась | `status` перевода не `READY`; перевод недоступен как язык группы |
| **N** | NIV в prod без `--confirm-license` | Отказ |
| **S** | Реальные ПД в фикстурах | Блокер review; тест: в фикстурах только `@example.test` |
| **S** | Seed вызывается из приложения / Route Handler | Запрещено; нет импорта `packages/db/src/seed` из `apps/web` |
| **Race** | Два `seed:reference` одновременно | Блокировка (`pg_advisory_lock`) или upsert по ключу; дублей нет |
| **Drift** | Каталог в БД ≠ §6.1 | Тест seed падает |

## 10. Acceptance criteria

- [ ] `seed:reference` на пустой БД создаёт 1 организацию, ключи `app_setting` §6, 66 книг, 8 достижений и 3 штрафа — исход: тест счётчиков.
- [ ] Повторный запуск не меняет число строк — исход: тест идемпотентности.
- [ ] `seed:bible` проверяет 66 / 1189 / 31 166 (RST) и ставит `READY` только после сверки — исход: тест.
- [ ] `seed:dev` при `APP_ENV=prod` или маркере `prod` ничего не пишет — исход: тест (INV-24).
- [ ] Prod после seed не содержит групп, учеников, уроков — исход: запрос счётчиков.
- [ ] В фикстурах нет реальных email и ПД — исход: тест по маске `@example.test`.
- [ ] Post-MVP таблицы после `seed:dev` пусты — исход: запрос счётчиков (PKG-03).

## 11. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| Q-01 | Маркер окружения в БД (`app_setting.db_environment`) вместо проверки хоста | Принять маркер (§5) | владелец | P01 `packages/db` |
| Q-02 | Каталог достижений и штрафов — в prod (12.2 п. 33) | Да, загружать; «спит» при выключенном флаге | владелец | P01 |
| Q-03 | Подтвердить переключатель «смотреть как» только в dev (12.2 п. 35, ОК-5) | Да | владелец | `global_shell_spec` |
| Q-04 | У штрафа в каталоге нет `rule_type` / `threshold` / уровней: как заполнять эти колонки в `achievement` для `kind = PENALTY` (`NULL` или маркер) — и сколько баллов хранится (`achievement_tier` с одним уровнем) | `NULL`; один `achievement_tier` с отрицательными `points` | architect | P01 |
| Q-05 | Файл `versification.json` и его сверка до prod | architect готовит на P02, владелец сверяет выборочно | architect | prod-загрузка NIV |

## 12. Related documents

| Document | Relationship |
|----------|--------------|
| [`database_schema_v1.md`](./database_schema_v1.md) | Таблицы и ограничения |
| [`adr_001_stack_and_runtime.md`](../07_governance/adr_001_stack_and_runtime.md) | Правила окружений §3.4 |
| [`adr_009_bible_translations_and_verse_numbering.md`](../07_governance/adr_009_bible_translations_and_verse_numbering.md) | Нумерация, лицензия |
| [`local_dev_setup.md`](../../implementation/mvp/guides/local_dev_setup.md), [`neon_prisma_migrations_guide.md`](../../implementation/mvp/guides/neon_prisma_migrations_guide.md) | Запуск команд |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W6-03

## 13. Agent notes

- Не запускать `seed:dev` против БД без маркера `dev`; не добавлять обход проверки флагом.
- Не класть реальные ФИО, email и данные детей в фикстуры, комментарии и логи.
- Не создавать `bible_chapter` и не переименовывать таблицы под скрипты — правится скрипт.
- Не заполнять голос и выданные достижения в `seed:dev`. Семьи — только набор §8.4 и только при маркере `dev`.
- Не коммитить NIV-данные (`niv_src`, `RelSQLData/niv`).

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W6-03) |
| 2026-10-17 | v1.1 — Пути `packages/db/src/seed/bible`; versification.json (P03) |
| 2026-10-19 | §8.3: набор «аналитика по годам»; с P08 сид досоздаёт снимки закрытых лет |
| 2026-10-19 | §8.1 и §8.3: полный dev-набор (3 группы, очереди, календарь) и флаг `--replace` |
| 2026-10-23 | §8.4: семьи, родитель, согласия и дайджест в `seed:dev` (P13); флаг `features.parents` только при маркере `dev` |
