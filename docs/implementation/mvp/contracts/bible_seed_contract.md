# Bible seed contract

**Тип:** Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W8-09  
**Зависит от:** [`adr_009_bible_translations_and_verse_numbering.md`](../../../prds/07_governance/adr_009_bible_translations_and_verse_numbering.md), [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) §4, §5, §7, [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) §5.10, [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) INV-19…INV-21, INV-24, [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §5.4, R-9, [`Bible/README.md`](../../../my_specs/Bible/README.md), [`sunday_school_data_analytics_spec.md`](../../../my_specs/sunday_school_data_analytics_spec.md) (ПБ-1…ПБ-7, ЯГ-3)  
**Связанные документы:** [`monorepo_boundaries_contract.md`](./monorepo_boundaries_contract.md), [`homework_check_contract.md`](./homework_check_contract.md) §5.1, [`change_log_contract.md`](./change_log_contract.md), [`architecture_master_index.md`](../../../prds/architecture_master_index.md)  
**Проверено по:** скрипты и данные владельца (`Bible/README.md`): форматы seed, ожидаемые счётчики RST 66 / 1189 / 31 166 и NIV 66 / 1189 / 31 103 — по README, **скрипты не запускались**; нумерация и надписания Псалмов — ADR-009 §3.3 (анализ на данных, 165 глав с расхождением). Prisma v7 (`$transaction`, upsert, `createMany`) — по документации на P01. Context7 недоступен.

---

## 1. Purpose

Контракт загрузки переводов Библии и работы с общей нумерацией: что делает скрипт, что проверяет, как строится `bible_verse_map`, как приложение собирает текст золотого стиха. Читают: исполнитель P02 (`packages/db/seed/bible`), авторы `lesson_form_and_golden_verses_spec` (W9-03), `reviewer`.

## 2. Scope / Out of scope

**В scope:** загрузка RST и NIV, сверка, карта нумерации, состояние перевода, сборка текста стиха.  
**Вне scope:** правка текстов через интерфейс (запрещена, ПБ-2); голосовая проверка; поиск по тексту; перевод интерфейса.

## 3. Операции

| Операция | Актор | Эффект |
|----------|-------|--------|
| `startLoad(translationCode)` | скрипт | `NO_DATA \| READY → LOADING` |
| `loadBooks()` | скрипт | upsert `bible_book` (66) |
| `loadVerses(translationCode, source)` | скрипт | upsert `bible_verse` пачками |
| `buildVerseMap(translationCode)` | скрипт | строки `bible_verse_map` (только исключения) |
| `verifyTranslation(translationCode)` | скрипт | сверка счётчиков и карты |
| `finishLoad` / `failLoad` | скрипт | `LOADING → READY` / `LOADING → NO_DATA` |
| `buildVerseText(range, translation)` | приложение (`domain`) | текст золотого стиха |
| `resolveGroupTranslation(grade)` | приложение | перевод группы по языку (ПБ-3) |

Актор скрипта — `SYSTEM`; запуск пишет `bible.load_started` / `bible.load_finished` / `bible.load_failed` и `seed.run` ([`change_log_contract.md`](./change_log_contract.md) §4).

## 4. Входные данные

| Источник | Файлы | В git |
|----------|-------|-------|
| RST | `docs/my_specs/Bible/data/RelSQLData/bible_{edition,book,chapter,verse}_seed.json` | да |
| NIV | `.../niv/*.json` (сборка из `niv_src`) | **нет** (ADR-009 §3.2) |
| Карта версификации | `packages/db/seed/bible/versification.json` | да (после сверки владельцем) |

Формат строк стиха: `edition_code`, `book_sort_order`, `chapter_number`, `verse_number`, `text`, `verse_order`. Таблица `bible_chapter` в БД **не создаётся**; `verses_count` главы вычисляется.

## 5. Happy path

### 5.1 Загрузка (одна команда на перевод)

1. **Предусловия (S):** `APP_ENV` и маркер БД совпадают ([`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) §5); NIV в prod — флаг `--confirm-license` (ADR-009 §3.2).
2. `startLoad`: статус `LOADING`; журнал.
3. Транзакция на перевод: upsert книг по `sort_order`; upsert стихов по `(translation_id, book_id, chapter_number, verse_number)`; `TRUNCATE` не используется.
4. `buildVerseMap`: см. §6.
5. `verifyTranslation`: проверки §7.
6. Успех — `finishLoad`: `READY`, `source`, `license` записаны; иначе `failLoad`: `NO_DATA`, статус не `READY`, транзакция откатывается, журнал с причиной.

### 5.2 `buildVerseText` (в приложении)

- **Вход:** диапазон `(bookId, startChapter, startVerse, endChapter, endVerse)` в Синодальной нумерации; перевод группы.
- **Алгоритм:** для каждого стиха диапазона по порядку: найти строку `bible_verse_map` для `(translation, book, common_chapter, common_verse)` (обратное отображение); нет строки — тождество; прочитать `bible_verse`; конкатенировать с разделителем пробел.
- **Результат:** строка текста либо список недостающих стихов (`missing[]`).
- **Постусловие:** при `missing ≠ ∅` урок не сохраняется ([`homework_check_contract.md`](./homework_check_contract.md) §5.1, R-9).

## 6. Карта нумерации (`bible_verse_map`)

| Правило | Значение |
|---------|----------|
| Общая нумерация | Синодальная (RST); для RST карта не нужна (тождество) |
| Что хранится | только исключения для других переводов: `(translation, book, chapter, verse) → (common_chapter, common_verse)` |
| Надписания | у стихов-надписаний без номера в переводе — `verse_number = 0` → общий номер (в RST надписание — стих 1) |
| Псалмы | по правилу из разности `verses_count` (сдвиг главы: `Ps. 23` NIV = `Пс. 22` RST; надписание — стих 0 или 1) |
| Прочие расхождения | 27 глав вне Псалмов и слияния/разбиения псалмов (Пс. 9–10 и др.) — по таблице версификации в `versification.json` |
| Источник | опубликованная таблица версификации; сверка выборочная владельцем до prod (ADR-009 Q-02) |
| Статус | `en-niv` остаётся `LOADING`/`NO_DATA`, пока карта не полна |

Обязательное свойство: для каждой затронутой главы сумма стихов по карте совпадает с `verses_count` перевода (INV-19).

## 7. Проверки загрузки

| Проверка | Ожидание | При нарушении |
|----------|----------|----------------|
| Число книг | 66 | `failLoad` |
| Число глав | 1189 | `failLoad` |
| Число стихов | RST 31 166; NIV 31 103 | `failLoad` |
| `SUM(verses_count)` главы = число стихов главы | равенство | `failLoad` |
| `verse_order` уникален в переводе | 0 дубликатов | `failLoad` |
| Карта: сумма стихов по затронутой главе | = `verses_count` | `failLoad` |
| Для каждого золотого стиха прототипа есть текст в RST | `missing = ∅` | предупреждение (dev), `failLoad` не вызывает |

## 8. Negative paths (business)

| Случай | Условие | Код / исход | Ключ / сообщение |
|--------|---------|-------------|------------------|
| Окружение не совпало | `APP_ENV` ≠ маркер БД | завершение скрипта, запись не выполнена | лог оператора |
| NIV в prod без флага | нет `--confirm-license` | завершение | лог оператора |
| Счётчики не сошлись | §7 | `BIBLE_VERIFY_FAILED`; перевод не `READY` | журнал `bible.load_failed` |
| Назначение языка группе | перевод не `READY` | `SCHOOL_LANGUAGE_UNAVAILABLE` ([`school_year_and_groups_contract.md`](./school_year_and_groups_contract.md)) | `admin.group.language_unavailable` |
| Правка текста через интерфейс | любая | операции нет (ПБ-2) | — |
| Нет стиха при сборке текста | пропуск в переводе группы | `CHECK_VERSE_MISSING` с `missing[]` ([`homework_check_contract.md`](./homework_check_contract.md) §8) | `teacher.lesson.verses_missing` |
| Диапазон в главе с расхождением без карты | нет строк `bible_verse_map` | `BIBLE_MAP_MISSING` — ошибка данных, не пользователя | `common.errors.internal`, Sentry |

## 9. Security paths

| Путь | Требование |
|------|------------|
| S-1 | Скрипты запускаются оператором с `DIRECT_URL`; из приложения и Route Handler не вызываются |
| S-2 | NIV в prod — только после подтверждения лицензии (ADR-009 §3.2); копирайт Biblica в `license` и интерфейсе |
| S-3 | Приложение читает `bible_*` только на чтение; нет мутаций текстов |
| S-4 | Запуск пишет журнал (`SYSTEM`); значения текста в журнал не попадают |

## 10. Concurrency & idempotency

| Гонка | Защита | Исход |
|-------|--------|-------|
| Повторный запуск | upsert по ключам; результат тот же | дублей нет |
| Два запуска одновременно | `pg_advisory_lock` на перевод | второй ждёт либо завершается |
| Загрузка во время чтения уроков | загрузка в транзакции; пока `LOADING` перевод не назначается новым группам; существующие читают прежние строки | чтение консистентно |
| `READY → LOADING` (перезагрузка) | группа с этим языком остаётся рабочей: статус влияет на назначение, не на чтение | без простоя |

## 11. Drift & consistency

| Риск | Guard |
|------|-------|
| Скрипты используют `bible_edition`/`bible_chapter` | приведены к модели схемы §5.4 при переносе; тест схемы |
| Счётчики `verses_count` расходятся с картой | §7 в скрипте; тест |
| Использованный `golden_verse` изменён | INV-21; DAL запрещает |
| Номера главы NIV/RST перепутаны в UI | подписи по языку группы (ЯГ-2); тест `Пс. 22` ↔ `Ps. 23` |
| NIV попал в git | `.gitignore` + проверка CI (`git ls-files` не содержит путей NIV) |

## 12. Policy & layer touchpoints

| Слой | Роль |
|------|------|
| `domain` | `buildVerseText`, `normalizeRange`, схемы диапазона; без I/O |
| `db` (`packages/db/seed/bible`) | загрузка, карта, сверка, журнал |
| `apps/web` DAL | чтение стихов по индексу, `resolveGroupTranslation`, кэш `'use cache'` с тегом перевода |
| Запрещено | загрузка из приложения; хранение текстов в JSON-полях |

## 13. Acceptance criteria

- [ ] Повторный запуск загрузки не меняет число строк — исход: тест идемпотентности.
- [ ] Загрузка RST проходит проверки §7 и ставит `READY` — исход: тест на копии БД.
- [ ] Провал сверки оставляет перевод не `READY` и ничего не записывает — исход: тест отката.
- [ ] `buildVerseText` для `Пс. 22:1–3` в группе `EN` возвращает `Ps. 23:1–3` через карту — исход: unit-тест (ADR-009 §7 H).
- [ ] Диапазон с пропуском даёт `missing[]`, урок не сохраняется — исход: тест (R-9).
- [ ] NIV в prod без флага не загружается — исход: тест CLI.
- [ ] Запуск пишет журнал — исход: тест.

## 14. Open questions

| ID | Вопрос | Предложение по умолчанию | Владелец | Блокирует |
|----|--------|--------------------------|----------|-----------|
| Q-01 | Формат `versification.json` (плоские строки или правила по диапазонам) | Плоские строки исключений + правило Псалмов в коде | architect | P02 |
| Q-02 | Кто и когда сверяет карту выборочно | Владелец до prod-загрузки NIV (ADR-009 Q-02) | владелец | prod |
| Q-03 | Нужна ли `bible_chapter` вместо вычисляемого `verses_count` | Нет (Q-01 схемы) | architect | — |
| Q-04 | Кэширование `buildVerseText` | `'use cache'` по `(translation, диапазон)`, тег перевода; пересверить по Next.js 16.4 на P5 | architect | W9-03 |

## 15. Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_009_bible_translations_and_verse_numbering.md`](../../../prds/07_governance/adr_009_bible_translations_and_verse_numbering.md) | Решения по нумерации и лицензии |
| [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) | Команды и защита окружения |
| [`Bible/README.md`](../../../my_specs/Bible/README.md) | Исходные скрипты и данные |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W8-09

## 16. Agent notes

- Не править тексты Библии через интерфейс или миграции вручную.
- Не коммитить NIV-данные; не загружать NIV в prod без `--confirm-license`.
- Не использовать `TRUNCATE`; только upsert.
- Не хранить золотой стих текстом — только диапазон в Синодальной нумерации.
- Не ставить `READY` без полной сверки (§7).

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — Canonical (W8-09) |
