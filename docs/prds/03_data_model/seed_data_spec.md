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
| **C. Первый admin** | не seed: создаётся при первом входе по `FIRST_ADMIN_EMAIL` | ✔ | ✔ | один раз под блокировкой |
| **D. Dev-фикстуры** | вымышленные группы, люди, уроки, проверки, кирпичики, календарь, заявки, журнал | ✔ | **никогда** | пересоздаёт данные dev с нуля |

После развёртывания **prod содержит только A + B + C** (ОК-2): ни одной группы, ученика, учебного года, урока, проверки.

## 4. Команды и порядок

| Шаг | Команда | Что делает | Окружение |
|-----|---------|------------|-----------|
| 1 | `db:migrate` | применяет миграции (схема целиком, ADR-005) | dev, prod |
| 2 | `db:seed:reference` | набор A; записывает маркер окружения (§5) | dev, prod |
| 3 | `db:seed:bible` | набор B: RST; затем `db:seed:bible:niv` — NIV; строит `bible_verse_map`, проверяет счётчики | dev, prod |
| 4 | `db:seed:dev` | набор D | **только dev** |

Правила:

1. Команды **явные**: ни `migrate`, ни старт приложения seed не запускают (Prisma v7).
2. Каждая команда идемпотентна: повторный запуск не меняет число строк и не дублирует журнал сверх одной записи «запущено».
3. Каждый запуск пишет запись в `audit_log` (`source = SYSTEM`, `entity_type = 'seed'`, `action`, результат и счётчики в `new_value`; ПД нет — INV-23, ПБ-2).
4. Seed-код живёт в `packages/db`; `apps/web` seed не импортирует (PKG).
5. Prisma-клиент seed создаётся через driver adapter с `DIRECT_URL` (не pooled).

## 5. Защита окружения (S)

| Проверка | Правило |
|----------|---------|
| `APP_ENV` | Обязателен: `dev` или `prod`; иначе команда завершается до подключения к БД |
| Маркер БД | `app_setting.db_environment` ∈ {`dev`, `prod`}; записывается шагом 2 по `APP_ENV` при пустом значении и **не перезаписывается** |
| Сверка | Любая команда seed и старт приложения сравнивают `APP_ENV` с маркером; расхождение → завершение с понятной ошибкой, **ничего не записано** (ОК-1, INV-24) |
| `db:seed:dev` | Дополнительно: отказывается, если маркер ≠ `dev` или маркера нет; в сборке и в скриптах деплоя prod команды нет |
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
3. **Скрипты** владельца переносятся в `packages/db/seed/bible/` и поправляются под схему: пути, импорт env, имена таблиц, зависимости (Bible/README §4 п. 6). Они остаются источником алгоритма; расхождение с этим документом разрешается правкой скрипта.
4. **Проверки после загрузки** (падение = `status` перевода не `READY`):

| Проверка | Ожидание |
|----------|----------|
| Книг | 66 |
| Глав (по `max(chapter_number)` книг) | 1189 |
| Стихов RST / NIV | 31 166 / 31 103 |
| `SUM(verses_count)` по главам = число стихов | равенство |
| `verse_order` уникален в переводе | 0 дубликатов |
| `bible_verse_map`: сумма стихов по затронутой главе | совпадает с `verses_count` перевода |

5. **`bible_verse_map`** (ADR-009 §3.3): хранит только исключения; Псалмы — по правилу из разности `verses_count` (сдвиг главы, надписания как `verse_number = 0`), исключения и 27 остальных глав — по таблице версификации в `packages/db/seed/bible/versification.json`. Файл готовит architect на P02 и выборочно сверяет владелец до prod (ADR-009 Q-02). Пока файл не готов — `bible_verse_map` пуста, а перевод `en-niv` получает `status = LOADING` и **не** выбирается как язык группы (ЯГ-3, R-9).
6. **Лицензия:** NIV загружается в dev по решению владельца; в prod — после подтверждения лицензии Biblica ([ADR-009](../07_governance/adr_009_bible_translations_and_verse_numbering.md) §3.2). Команда `db:seed:bible:niv` в prod требует явного флага `--confirm-license`.

## 8. Набор D — dev-фикстуры

**Источник:** файл `packages/db/seed/dev/fixtures.ts` (TS-объекты, типизированы схемой), снятый с прототипа [`sunday_school_prototype.html`](../prototypes/sunday_school_prototype.html) (`GROUPS`, `USERS`, `PUPILS`, `LESSONS`, `VERSES`, `EVENTS`); случайной генерации нет (ОК-4).

| Правило | Значение |
|---------|----------|
| Люди | **только вымышленные**; email — `*@example.test`, Telegram — без реальных id |
| «Сегодня» | константа фикстур (`2026-10-31` по прототипу); тесты и скриншоты не зависят от системных часов |
| Идентификаторы | детерминированные (стабильные UUID из имени фикстуры) |
| Повтор | `db:seed:dev` пересоздаёт данные с нуля: удаляет строки с меткой фикстур, затем вставляет; справочники (A, B) не трогает |
| Запрещено | загрузка дампа prod, копий prod, данных из старого приложения (ОК-4) |

### 8.1 Состав

| Сущность | Объём (ориентир, по прототипу) | MVP |
|----------|-------------------------------|:---:|
| Учебный год | `2026–2027`, `ACTIVE` | ✔ |
| Группы | 3 (Младшая `RU`, Средняя `RU`, Старшая `EN`) + `grade_settings` | ✔ |
| Пользователи | 1 admin (+teacher), 4 teacher, 4 пользователя в статусах `REGISTRATION` / `REQUEST_PENDING` / `REJECTED` / `DISABLED` (в т.ч. «дубликат» второго входа) | ✔ |
| Ученики | ~16 в Средней + по группе в остальных, 1 неактивный, 2 без группы | ✔ |
| Согласие по ребёнку | бумажное, у зачисленных (R-5) | ✔ |
| Уроки | 9 в Средней (урок 5 — обзорный), золотые стихи по `VERSES` | ✔ |
| Проверки | уроки 1–7 завершены, урок 8 — частично; «сдано позже» в нескольких | ✔ |
| Кирпичики | журнал с выдачей и одной компенсирующей записью | ✔ |
| Календарь | события `EVENTS` (урок, выезд, отмена) | ✔ |
| Заявки и удаление | 2 заявки, 1 запрос на удаление | ✔ |
| Журнал | записи по прототипу `S.audit` | ✔ |
| Выданные достижения, штрафы, семьи, взрослые, голос | **не заполняются** (PKG-03); при необходимости — отдельный «спящий» набор `fixtures.post-mvp.ts`, не входящий в `db:seed:dev` по умолчанию | — |

### 8.2 Вход в dev

Вымышленные пользователи не имеют `login_identity`, которое проходит реальный OAuth. Для работы в dev используется переключатель роли «смотреть как» ([ОК-5](../../my_specs/sunday_school_data_analytics_spec.md), `responsive_navigation_contract` §8): он включён только при `APP_ENV=dev` и отсутствует в сборке prod. Реальный вход Google / Telegram в dev создаёт обычного `REGISTRATION` пользователя либо первого admin (`FIRST_ADMIN_EMAIL` dev).

## 9. Paths (H / N / S)

| Путь | Описание | Исход |
|------|----------|-------|
| **H** | Пустая dev-БД: `db:migrate` → `seed:reference` → `seed:bible` → `seed:dev` | Приложение стартует, под ролью «смотреть как» доступны данные прототипа |
| **H** | Пустая prod-БД: `db:migrate` → `seed:reference` → `seed:bible` | Справочники и Библия; первый admin входит по `FIRST_ADMIN_EMAIL`; больше ничего |
| **H** | Повторный `seed:reference` | Нет дублей, журнал +1 запись |
| **N** | `APP_ENV=dev`, маркер БД `prod` | Все команды и приложение завершаются, запись не выполнена |
| **N** | `seed:dev` без маркера | Отказ |
| **N** | Сверка счётчиков Библии не сошлась | `status` перевода не `READY`; перевод недоступен как язык группы |
| **N** | NIV в prod без `--confirm-license` | Отказ |
| **S** | Реальные ПД в фикстурах | Блокер review; тест: в фикстурах только `@example.test` |
| **S** | Seed вызывается из приложения / Route Handler | Запрещено; нет импорта `packages/db/seed` из `apps/web` |
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
| *(planned)* `local_dev_setup` (W12-05), `neon_prisma_migrations_guide` (W12) | Запуск команд |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W6-03

## 13. Agent notes

- Не запускать `seed:dev` против БД без маркера `dev`; не добавлять обход проверки флагом.
- Не класть реальные ФИО, email и данные детей в фикстуры, комментарии и логи.
- Не создавать `bible_chapter` и не переименовывать таблицы под скрипты — правится скрипт.
- Не заполнять post-MVP таблицы в `seed:dev` по умолчанию.
- Не коммитить NIV-данные (`niv_src`, `RelSQLData/niv`).

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W6-03) |
