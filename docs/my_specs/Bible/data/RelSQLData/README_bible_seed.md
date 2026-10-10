# Bible seed для PostgreSQL (RST)

Этот набор файлов подготавливает данные для таблиц:
- `bible_edition`
- `bible_book`
- `bible_chapter`
- `bible_verse`

## Файлы

- `bible_edition_seed.json` — издание (в текущем MVP: только RST).
- `bible_book_seed.json` — 66 книг.
- `bible_chapter_seed.json` — главы с вычисленным `verses_count`.
- `bible_verse_seed.json` — стихи с `verse_order` в масштабе всего издания.

## Предусловия

- PostgreSQL запущен.
- Таблицы созданы по схеме из `docs/prds/03_data_model/database_schema_v3.md`.
- Установлен Node.js 20+.
- Установлен пакет `pg`:

```bash
npm install pg
```

- Задана переменная окружения `DATABASE_URL`.

PowerShell:

```powershell
$env:DATABASE_URL="postgresql://user:password@localhost:5432/bsfy"
```

## 1) Генерация chapter/verse JSON из backup

Команда:

```bash
node scripts/seed/build_bible_relational_seed.mjs
```

Скрипт читает:
- `docs/data/RelSQLData/bible_book_seed.json`
- `docs/data/NoSQLData/bible_verses_backup_dev_2026-03-24T12-54-47-992Z.json`

И создает:
- `docs/data/RelSQLData/bible_chapter_seed.json`
- `docs/data/RelSQLData/bible_verse_seed.json`

## 2) Загрузка данных в PostgreSQL

Команда:

```bash
node scripts/seed/seed_bible_postgres.mjs
```

Что делает скрипт:
1. Открывает транзакцию.
2. Upsert в `bible_edition`.
3. Upsert в `bible_book`.
4. Upsert в `bible_chapter`.
5. Батчевый upsert в `bible_verse`.
6. Commit.

Для тюнинга размера батча стихов:

PowerShell:

```powershell
$env:BIBLE_SEED_VERSE_BATCH_SIZE="1000"
node scripts/seed/seed_bible_postgres.mjs
```

## 3) Проверки после seed

Проверка количества книг:

```sql
SELECT COUNT(*) AS books_count FROM bible_book;
```

Проверка количества глав:

```sql
SELECT COUNT(*) AS chapters_count FROM bible_chapter;
```

Проверка количества стихов:

```sql
SELECT COUNT(*) AS verses_count FROM bible_verse;
```

Проверка суммы `verses_count` по главам:

```sql
SELECT SUM(verses_count) AS sum_verses_count FROM bible_chapter;
```

Проверка уникальности `verse_order`:

```sql
SELECT verse_order, COUNT(*)
FROM bible_verse
GROUP BY verse_order
HAVING COUNT(*) > 1;
```

Если последний запрос вернул 0 строк, `verse_order` уникален.
