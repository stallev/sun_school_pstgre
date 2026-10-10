# ADR-008 — Локализация интерфейса: ru / en, словари по областям

**Тип:** ADR  
**Статус:** ACCEPTED  
**Версия:** 1.0  
**Дата:** 2026-10-11  
**Волна:** W4-06  
**Зависит от:** [`adr_001_stack_and_runtime.md`](./adr_001_stack_and_runtime.md), [`adr_002_nextjs_vercel_runtime_policy.md`](./adr_002_nextjs_vercel_runtime_policy.md), [`adr_009_bible_translations_and_verse_numbering.md`](./adr_009_bible_translations_and_verse_numbering.md), [`sunday_school_data_analytics_spec.md`](../../my_specs/sunday_school_data_analytics_spec.md) §14 (ЛК-1…ЛК-10)  
**Связанные документы:** [`copy_and_messages.md`](../../guidelines/react/copy_and_messages.md), [`responsive_navigation_contract.md`](../../design/responsive_navigation_contract.md), [`architecture_master_index.md`](../architecture_master_index.md)  
**Проверено по:** Next.js App Router, руководство «Internationalization» — nextjs.org через WebFetch, 2026-10-11 (страница версии 16.3.8): словари как JSON с динамическим `import()`, `getDictionary` на сервере, словарь не попадает в клиентский бандл серверных компонентов. Руководство предлагает локаль в URL (`app/[lang]`) — **здесь осознанное отклонение** (§4.2). `Intl.PluralRules`, `Intl.DateTimeFormat`, `Intl.NumberFormat` — стандарт ECMAScript Intl. Context7 недоступен.

---

## 1. Purpose

Зафиксировать, как устроена локализация интерфейса: языки, словари, загрузка, формы слов, что не переводится. Читают: авторы `global_shell_spec`, исполнители UI-задач, reviewer.

## 2. Scope / Out of scope

**В scope:** язык интерфейса, структура и загрузка словарей, правила текста.  
**Вне scope:** язык группы и перевод Библии ([ADR-009](./adr_009_bible_translations_and_verse_numbering.md)); содержимое, которое вводят люди.

## 3. Context

Два языка (ru, en) с первого дня; пользователи разных ролей; родитель (post-MVP) не должен скачивать словарь admin. Язык интерфейса один на приложение и выбирается admin (решение владельца, ЛК-7).

## 4. Decision

### 4.1 Языки и словари

| # | Решение |
|---|---------|
| 1 | Языки интерфейса: `ru`, `en` (`APP_LOCALE`); у каждого namespace есть оба (ЛК-3) |
| 2 | Словарь — **часть кода**: JSON-файлы `messages/{ru,en}/<namespace>.json`; правка текста = изменение файла, review, деплой; переопределений в БД нет (ЛК-10) |
| 3 | Namespaces MVP: `common`, `auth`, `teacher`, `admin`, `analytics` (`parent` — post-MVP, ЛК-2) |
| 4 | Строка нужна двум областям — переезжает в `common`; дублировать в двух словарях нельзя |
| 5 | Ключи `en` проверяются типом `ru` (`en` удовлетворяет `typeof ru`): пропущенный ключ — ошибка сборки (ЛК-3) |
| 6 | Ключи — по экранам: `teacher.check.save_next`, `common.actions.cancel` (ЛК-9) |
| 7 | Строк в JSX/TSX нет — только ключи словаря (ЛК-1); пользовательский текст ошибок мутаций — по ключу от кода `@sunschool/domain` |

### 4.2 Язык не входит в URL

- Язык один на всё приложение и задаётся admin в `/settings` ([`canonical_routes.md`](../../design/canonical_routes.md)); URL не содержит префикса локали. Это **отклонение** от стандартного примера Next.js (`app/[lang]`): отдельных адресов по языкам, SEO и личного выбора языка у пользователя нет.
- Корневой layout (серверный) читает `ui_locale` из `app_setting` через кэшируемую функцию (`'use cache'` + `cacheTag('ui-locale')`); смена настройки вызывает `updateTag('ui-locale')` (ADR-002 §5); изменение вступает в силу при следующей загрузке страницы (ЛК-7).
- Атрибут `<html lang>` = текущий язык.

### 4.3 Загрузка

1. Корневой layout загружает `common` через динамический `import()` JSON.
2. Layout области (`(auth)`, `(app)` с учётом роли) загружает свой namespace; `analytics` — только на экранах аналитики; `auth` — на `/login`, `/register`, `/pending`, `/profile`.
3. Серверные компоненты получают словарь напрямую; в клиентские компоненты передаётся **только нужное подмножество ключей** (props), не весь словарь.
4. Функция `getDictionary(locale, namespace)` — `server-only`.
5. Teacher никогда не получает словарь admin и наоборот.

### 4.4 Формы слов, даты, числа

- Множественное число — `Intl.PluralRules` для языка интерфейса; ключи `lessons_count.one / .few / .many / .other` (в ru формы `one` / `few` / `many`).
- Даты, числа, проценты — `Intl.DateTimeFormat` / `Intl.NumberFormat` с языком интерфейса и поясом школы ([ADR-004](./adr_004_timezone_scheduling_model.md)); ручное форматирование строк запрещено.
- Запас длины +30 % (ЛК-8): вёрстка не ломается на английском и русском.

### 4.5 Что не переводится (ЛК-6)

Темы и планы уроков, комментарии, названия групп, ФИО; тексты золотых стихов (перевод — по языку **группы**); названия и описания достижений хранятся в каталоге на ru и en и показываются на языке приложения; тексты согласий — отдельные версии на каждом языке.

## 5. Rejected alternatives

| Альтернатива | Почему отклонена |
|--------------|------------------|
| Локаль в URL (`/ru/...`) | Один язык на приложение; ссылки и закладки не должны зависеть от языка; решение владельца |
| Личный выбор языка пользователем | Решение владельца (ЛК-7); не нужен |
| Редактирование текстов в интерфейсе, тексты в БД | Решение владельца (ЛК-10): тексты — код, review и деплой |
| Один общий словарь на всё приложение | Лишний вес для ролей; admin-тексты у teacher |
| Сторонняя i18n-библиотека на старте | Достаточно JSON + `Intl`; решение пересматривается ADR при росте числа языков |

## 6. Consequences

- Тесты: тип `en`, отсутствие русских строк в JSX (lint), снимки ключевых экранов на двух языках (ЛК-8).
- `ui-messages-and-copy` и `ui-messages-bundle-splitting` — рабочие правила; `copy_and_messages.md` — enforcement.
- Админ видит в «Настройках» язык интерфейса и (ADR-004) часовой пояс; изменения пишутся в журнал.
- Миграция: тексты старого приложения не переносятся (интерфейс новый).

## 7. Paths (H / N / S)

| Путь | Описание | Исход |
|------|----------|-------|
| **H** | Admin меняет язык на `en` | Следующая загрузка любой страницы — на английском у всех пользователей; запись в журнале |
| **N** | В `en` нет ключа, который есть в `ru` | Ошибка сборки (тип), не пустое место на экране |
| **N** | Загрузка словаря не удалась | Fallback на `ru`, ошибка в Sentry |
| **S** | Смена языка | Только `ADMIN`; серверная проверка роли |
| **Drift** | Строка вставлена в JSX | Lint и review |

## 8. Affected documents

| Документ | Что меняется |
|----------|--------------|
| [`admin_flow.md`](../01_product_scope/user_flows/users_mvp/admin_flow.md) §4.7 | Язык интерфейса в настройках |
| [`canonical_routes.md`](../../design/canonical_routes.md) | Нет языковых префиксов (без изменений) |
| `global_shell_spec.md` (W9-01) | Загрузка словарей оболочки |
| `ui-messages-and-copy.mdc`, `ui-messages-bundle-splitting.mdc` | Правила применяются в P6 |
| [`copy_and_messages.md`](../../guidelines/react/copy_and_messages.md) | Срезы словаря — по §4.3 |

## 9. Acceptance criteria

- [ ] Каждый namespace существует в `ru` и `en` с одинаковыми ключами — исход: сборка проходит; удаление ключа в `en` ломает сборку.
- [ ] Клиентский бандл роли `teacher` не содержит ключей `admin` — исход: анализ бандла.
- [ ] Смена языка в `/settings` меняет язык после перезагрузки у другого пользователя — исход: ручной smoke.
- [ ] Множественное число «1 урок / 2 урока / 5 уроков» корректно — исход: unit-тест `Intl.PluralRules`.
- [ ] `<html lang>` соответствует настройке — исход: проверка DOM.

## 10. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| Q-01 | Сверить использование кэша `'use cache'` + `cacheTag` / `updateTag` для `ui_locale` с документацией 16.4.x на P5 | исполнитель P5 | `global_shell_spec` |
| Q-02 | Имена и состав namespaces `analytics` (общий для teacher и admin) | architect | `analytics_screens_spec` |

## 11. Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_004_timezone_scheduling_model.md`](./adr_004_timezone_scheduling_model.md) | Пояс для форматирования дат |
| [`adr_009_bible_translations_and_verse_numbering.md`](./adr_009_bible_translations_and_verse_numbering.md) | Язык группы ≠ язык интерфейса |
| *(planned)* `global_shell_spec.md` | Оболочка и словари |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W4-06

## 12. Agent notes

- Не вставлять строки в JSX и не собирать фразы конкатенацией — только ключ и параметры.
- Не добавлять префикс локали в маршруты.
- Не передавать весь словарь в клиентский компонент.
- Текст золотого стиха не зависит от языка интерфейса.

## Change log

| Date | Change |
|------|--------|
| 2026-10-11 | v1.0 — ACCEPTED (W4-06) |
