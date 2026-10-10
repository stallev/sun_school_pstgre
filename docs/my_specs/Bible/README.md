# Данные и скрипты загрузки переводов Библии

**Статус:** вход для W3 (`database_schema_v1.md`) и скриптов `seed` — не канон схемы.
**Связанные документы:** [`mvp_scope.md`](../mvp_scope.md) (С-7), [`sunday_school_data_analytics_spec.md`](../sunday_school_data_analytics_spec.md) (3.10, ПБ-1…ПБ-7, 12.2 пп. 29–30).

Спецификация (ПБ-1) предполагала, что тексты переводов приходят скриптами владельца. Здесь лежат эти скрипты и подготовленные данные. Приложение тексты не пишет и не правит через интерфейс (ПБ-2).

## 1. Состав каталога

| Путь | Что это | В git |
|---|---|---|
| `data/RelSQLData/bible_{edition,book,chapter,verse}_seed.json` | Готовый seed **RST** (Синодальный, `ru`) | да |
| `data/RelSQLData/README_bible_seed.md` | Исходная инструкция по RST-seed | да |
| `data/RelSQLData/niv/*.json`, `niv/README.md` | Готовый seed **NIV** (`en`) | **нет** (см. § 5) |
| `data/niv_src/Bible-niv/` | Исходник NIV: 66 JSON-книг; клон git-репозитория со своим `.git` | **нет** |
| `seed_bible_postgres.mjs` | Загрузка RST в PostgreSQL | да |
| `build_niv_relational_seed.mjs`, `niv-book-short-titles.mjs` | Сборка NIV-seed из `niv_src` и короткие названия книг | да |
| `seed_bible_niv_postgres.mjs` | Загрузка NIV в PostgreSQL | да |

## 2. Формат seed (одинаков для RST и NIV)

Четыре файла, все ключи в `snake_case`, UTF-8:

| Файл | Поля |
|---|---|
| `bible_edition_seed.json` | `edition_code`, `locale_code`, `name`, `short_name`, `is_default` — ровно **одна** запись |
| `bible_book_seed.json` | `edition_code`, `title`, `short_title`, `testament` (`OT` / `NT`), `sort_order`, `chapters_count` |
| `bible_chapter_seed.json` | `edition_code`, `book_sort_order`, `chapter_number`, `verses_count` |
| `bible_verse_seed.json` | `edition_code`, `book_sort_order`, `chapter_number`, `verse_number`, `text`, `verse_order` |

`verse_order` — сквозной порядковый номер стиха **в масштабе издания** (не общая нумерация, см. § 4).

| Издание | `edition_code` | `locale_code` | Книг | Глав | Стихов | `is_default` |
|---|---|---|---|---|---|---|
| Синодальный перевод | `RST` | `ru` | 66 | 1189 | 31 166 | `true` |
| New International Version | `NIV` | `en` | 66 | 1189 | 31 103 | `false` |

Разница в 63 стиха — следствие различий нумерации (ПБ-4), а не потери данных.

## 3. Как загружать

Предусловия: Node.js 20+, пакет `pg`, переменная `DATABASE_URL`, созданные таблицы `bible_edition → bible_book → bible_chapter → bible_verse`.

| Шаг | Команда | Результат |
|---|---|---|
| RST: загрузка | `node seed_bible_postgres.mjs` | upsert всех четырёх уровней одной транзакцией; батч стихов — `BIBLE_SEED_VERSE_BATCH_SIZE` (по умолчанию 1000) |
| NIV: сборка JSON | `node build_niv_relational_seed.mjs` | собирает `niv/*.json` из `niv_src`; падает, если число книг / глав / стихов ≠ 66 / 1189 / 31 103 |
| NIV: загрузка | `node seed_bible_niv_postgres.mjs` | upsert NIV рядом с RST в той же БД |

Свойства (соответствуют ПБ-2):

- **идемпотентность** — `INSERT … ON CONFLICT DO UPDATE`: edition по `(locale_code, name)`, book по `(edition_id, sort_order)`, chapter по `(book_id, chapter_number)`, verse по `(chapter_id, verse_number)`; `TRUNCATE` нет;
- **атомарность RST** — `BEGIN` / `COMMIT`; при общей БД перед повторной загрузкой делать бэкап или Neon-ветку;
- **сверка счётчиков** — в сборке NIV (ожидаемые 66 / 1189 / 31 103); для RST — SQL-проверки ниже.

Проверки после загрузки (из `README_bible_seed.md`): число книг, глав, стихов; `SUM(verses_count)` по главам равна числу стихов; `verse_order` уникален (запрос с `GROUP BY verse_order HAVING COUNT(*) > 1` возвращает 0 строк).

## 4. Расхождения с спецификацией и открытые вопросы

> Модель таблиц принята в [`database_schema_v1.md`](../../prds/03_data_model/database_schema_v1.md) §5.4: общий `bible_book`, `bible_translation`, `bible_verse`; `bible_chapter` не вводится (Q-01).

Эти пункты нужно закрыть до написания финальных скриптов в проекте (W3, `packages/db`).

| # | Расхождение | Что делать |
|---|---|---|
| 1 | Таблицы скриптов `bible_edition` / `bible_book` / `bible_chapter` / `bible_verse`; в спецификации 3.10 — `BibleTranslation` / `BibleBook` / `BibleVerse`. Таблицы `chapter` в спецификации нет | В W3 выбрать одну модель и привести скрипты к ней |
| 2 | В seed нет статуса перевода (нет данных / загружается / готов, ЯГ-3), источника и лицензии (3.10, ПБ-6) | Поля добавляет схема; скрипт ставит статус «готов» только после сверки счётчиков |
| 3 | В одной таблице книг названия на одном языке (`title`, `short_title`); спецификация требует справочник книг, общий для переводов, с названиями ru и en | Объединить книги двух изданий по `sort_order` (в обоих 66 книг в одном порядке) |
| 4 | Нумерация стихов — своя у каждого издания; расходится в 165 из 1189 глав (138 — Псалмы). **Решено (ADR-009):** общая нумерация — Синодальная, `bible_verse_map` хранит только исключения | Построить карту: Псалмы — по правилу из разности `verses_count`, исключения и 27 остальных глав — по таблице версификации; сверка сумм по главам |
| 5 | NIV — лицензируемый перевод (© Biblica, Inc.); цитирование без разрешения — до 500 стихов, полный текст в приложении требует лицензии | NIV не коммитится и не загружается; английский перевод по умолчанию — выбор владельца (рекомендуется BSB, общественное достояние) — ADR-009 Q-01 |
| 6 | В скриптах устаревшие пути и зависимости: `docs/data/...`, `scripts/seed/`, `docs/prds/03_data_model/database_schema_v3.md`, `docs/implementation/mvp/bible_domain_mapping.md`; `seed_bible_niv_postgres.mjs` импортирует `load-apps-web-local-env.mjs`, которого в каталоге нет; npm-команды из `niv/README.md` (`build:bible-seed:niv`, `db:seed:bible:niv`, …) в этом репозитории не определены | Поправить пути и добавить скрипты в `package.json` при переносе скриптов в монорепо |
| 7 | Запуск скрипта должен попадать в журнал (ПБ-2), а `dev` / `prod` различаются защитой (С-6) | Заложить в скрипт проверку окружения и запись в журнал |

## 5. Что хранится в git

Решение владельца: **скрипты и RST JSON — в git; NIV — только локально**, пока не решён вопрос с лицензией (12.2 п. 30).

- в `.gitignore`: `docs/my_specs/Bible/data/niv_src/` и `docs/my_specs/Bible/data/RelSQLData/niv/`;
- вложенный `.git` в `niv_src/Bible-niv/` не должен попадать в репозиторий проекта;
- после решения по лицензии — либо убрать правила `.gitignore` и закоммитить NIV-seed, либо заменить английский перевод другим и повторить сборку.

## 6. Что дальше

- W3: модель таблиц Библии в `database_schema_v1.md` с учётом § 4.
- W8: контракт скриптов загрузки (идемпотентность, сверка, журнал, защита окружения).
- До этого MVP разрабатывается на небольшом наборе стихов из прототипа в dev (С-7).
