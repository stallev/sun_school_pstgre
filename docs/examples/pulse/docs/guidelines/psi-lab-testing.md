# Лабораторный PageSpeed Insights: переносимые принципы

**Тип:** Guideline  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-07  
**Pulse bindings:** [`docs/implementation/mvp/guides/ai_psi_lab_testing.md`](../implementation/mvp/guides/ai_psi_lab_testing.md)

Самодостаточный канон. Нет привязки к конкретным URL, стеку или агентским правилам проекта.

**Назначение:** мерить **задеплоенный** сайт с **локальной** машины через официальный REST PageSpeed Insights API v5. Не через браузерный UI, не через `localhost`, не через MCP как основной канал.

Официальные ссылки: [Get started](https://developers.google.com/speed/docs/insights/v5/get-started), [runPagespeed](https://developers.google.com/speed/docs/insights/rest/v5/pagespeedapi/runpagespeed).

---

## 1. Что считается «зелёной зоной»

- Категории Lighthouse: **Performance, Accessibility, Best Practices, SEO ≥ 90**. Категорию **PWA не включать**.
- Обе стратегии: **mobile и desktop**, если не попросили явно одну.
- Это **lab** (эмуляция Lighthouse на стороне Google), не полевые CWV. Порог категории 90 и порог CWV (например LCP 2.5s) — разные шкалы: lab может быть зелёным при «плохом» LCP.
- CrUX (`loadingExperience` / `originLoadingExperience`) — бонус, если Google вернул данные. Отсутствие CrUX — не регресс.

Нельзя называть зелёной зоной прогон `next dev`, Vite/webpack-dev-server или любой origin без CDN и production-бандла.

---

## 2. Где клиент и где цель

| Роль | Правило |
|------|---------|
| Клиент | Всегда локальный скрипт / `curl` / CI-job с ключом. |
| Цель | Только публичный HTTPS (или HTTP) **задеплоенного** origin. |
| Запрет | `localhost`, `127.0.0.1`, `*.localhost`, dev-сервер. |

Локальный production-сервер (`next start`, `nginx` без CDN) — только чтобы **воспроизвести** регресс, который уже виден на проде, и отделить «наш JS» от CDN. Это не замена PSI.

---

## 3. Почему прямой API, а не MCP / анонимный REST

Один `GET runPageSpeed` с четырьмя `category` возвращает в одном JSON:

- оценки категорий (`lighthouseResult.categories.*.score`, 0…1 → ×100);
- метрики (`audits`: `largest-contentful-paint`, `first-contentful-paint`, `speed-index`, `interactive`, `total-blocking-time`, `cumulative-layout-shift`);
- LCP-узел (`audits['largest-contentful-paint-element']`);
- failing audits;
- CrUX, если есть.

MCP-обёртки обычно режут это на несколько вызовов (сначала performance, потом «full audit»), таймаутят на пачках, не отдают LCP-узел и делят квоту с анонимным API (`429`).

**Не** вызывать MCP и REST одновременно.

---

## 4. Ключ и квота

1. В Google Cloud включить **PageSpeed Insights API**.
2. API key в query `key=`. Не класть в клиентский бандл (`NEXT_PUBLIC_*` и аналоги). Отдельный ключ от YouTube / Maps / прочих Google API.
3. Имя переменной по желанию; достаточно `PAGE_SPEED_API_KEY`.
4. С ключом квота **на проект**: порядка **25 000 запросов/сутки** и **~400 / 100 с**. Без ключа лимит крошечный и общий.
5. Узкое место — длительность Lighthouse (десятки секунд на URL), не QPS. Параллельность **2–3** запроса. Таймаут ожидания ответа **~180 с**. HTTP **429 и 5xx** — backoff и повтор (API периодически отдаёт 500 при живом ключе).

---

## 5. Контракт запроса

```
GET https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed
```

(Эквивалент из get-started: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`.)

| Параметр | Значение |
|----------|----------|
| `url` | Абсолютный URL страницы (обязательный). |
| `strategy` | `MOBILE` или `DESKTOP` (повтор: два запроса). |
| `category` | Повторять: `PERFORMANCE`, `ACCESSIBILITY`, `BEST_PRACTICES`, `SEO`. Без параметра Google гоняет только Performance. |
| `key` | API key. |
| `locale` | По желанию, например `en`. |

Тело запроса пустое. OAuth из справочника API Explorer для этого сценария не нужен.

Минимум:

```bash
curl -sS -G "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed" \
  --data-urlencode "url=https://example.com/" \
  --data-urlencode "strategy=MOBILE" \
  --data-urlencode "category=PERFORMANCE" \
  --data-urlencode "category=ACCESSIBILITY" \
  --data-urlencode "category=BEST_PRACTICES" \
  --data-urlencode "category=SEO" \
  --data-urlencode "key=${PAGE_SPEED_API_KEY}"
```

Оценки: `Math.round(lighthouseResult.categories.performance.score * 100)` (и `accessibility`, `best-practices`, `seo`). `runtimeError` в `lighthouseResult` — отчёт можно выбросить.

---

## 6. Какие URL гонять

Короткий **канон публичных** страниц, не вся карта сайта и не админка:

- главная и 5–8 маршрутов конверсии / IA верхнего уровня;
- 1–2 **деталки с картинкой** (типичный `[slug]`), чтобы поймать LCP героя, а не только списки.

Два режима:

1. **Один URL** — пользователь назвал страницу: только она, по умолчанию **mobile**.
2. **Suite** — явная просьба «прогнать список»: канон × mobile × desktop.

Не раздувать suite «на всякий случай». Коммит и зелёная зона **не** блокируют друг друга: PSI по требованию, правки кода — только если категория вышла из ≥90 и аудит назван в отчёте.

---

## 7. Прогрев CDN до Lighthouse

Googlebot PSI — «холодный» относительно вашего edge. Без прогрева вы мерите MISS/STALE, а не HIT.

Перед каждым URL:

1. `GET` той же страницы (следовать редиректам).
2. Записать статус и cache-заголовки хоста. На Vercel: `x-vercel-cache`, `age`, при PPR ещё `x-nextjs-prerender`. На других CDN — их аналоги (`cf-cache-status`, `x-cache`, …).
3. Если первый ответ `STALE` / устаревший — повторить GET, пока не `HIT` / свежий пререндер, с потолком попыток (2–3).
4. Не ломать cache policy (не форсировать BYPASS crawler), чтобы «улучшить hit rate» для отчёта.

Короткий `cacheLife` (таймеры на странице) даёт `STALE` на первом хите — это ожидаемо.

---

## 8. Порядок suite

1. Прогреть все URL канона.
2. Lab: все URL **mobile**, затем **desktop** (или пул задач «URL × strategy» с concurrency 2–3).
3. Один запрос = четыре категории.
4. Свести таблицу: путь, Perf/A11y/BP/SEO mobile/desktop, LCP/FCP/CLS mobile.
5. Зафиксировать дату, origin, заголовки прогрева, flake-повторы.

Exit code ≠ 0 удобен, если после ретрая какая-то категория < 90 — это сигнал, не обязанность чинить в том же коммите.

---

## 9. Lab flake

Lighthouse на чужих машинах Google шумит.

Повторить **тот же URL и strategy один раз**, если:

- Performance < 90, или
- Speed Index ≫ Time to Interactive / LCP при низком Perf (пример: SI 14s при TTI 2.7s).

Оба прогона писать в отчёт. Второй зелёный при том же LCP — **flake, не регресс**. Разовый Best Practices 88 («aspect ratio» / console) при повторе 100 — то же.

Не начинать оптимизацию по одному выбросу.

---

## 10. Как читать отчёт (не как чинить заранее)

| Тема | Как читать | Чего не делать |
|------|------------|----------------|
| Категория vs аудит | Чинить, только если категория **< 90** и PSI назвал аудит. | Чинить contrast / unused JS / «лишний preload», пока категория зелёная. |
| LCP | Узел из `largest-contentful-paint-element`. Один LCP-кандидат на документ (`priority` / fetchpriority). | Ставить `priority` на все герои. Выдумывать узел, если его нет в JSON. |
| CWV vs балл | Mobile LCP ~3s на полноэкранном изображении может оставить Perf ≥90. | Путать «бедный» LCP по CWV с провалом категории. |
| Картинки | Современные форматы, CDN/оптимизатор, не сырой object storage в waterfall. | |
| Шрифты | Не preload всей семьи; `font-display`; предсказуемый fallback (меньше CLS). | |
| JS | Unused в runtime-чанке фреймворка — часто не страница. | Резать приложение из‑за 20–50 KiB runtime. |
| TTFB | Соответствует HIT/пререндеру после прогрева, не `force-dynamic` на маркетинговых URL. | |
| Третьи стороны | Теги аналитики / плееры в lab видны как third-party. | |
| A11y/SEO | Heading order, contrast, metadata. | Менять дизайн из‑за fail внутри балла 95–99 без запроса. |

Поле `failed` у аудита с `score < 1` включает **метрики** (LCP «не прошёл» порог 2.5s) даже при Perf 95. Для действий фильтруйте: `scoreDisplayMode` не `notApplicable` / `manual` / `informative`, плюс вес в категории или бинарные аудиты, а не сырой список insights.

---

## 11. Чего не смешивать с PSI

- Dev-сервер и «зелёная зона».
- Playwright `instant()` / принудительный `prefetch={true}` «заодно» с прогоном.
- Категория PWA.
- Правки кэша/PPR ради цифры PSI, если пользователь просил только замер.
- Параллельный MCP и этот REST.

---

## 12. Чеклист внедрения

- [ ] GCP: PageSpeed Insights API + ключ в `.env`, не в git, не в клиент.
- [ ] Скрипт отказывается от localhost.
- [ ] Origin и список путей — константы **того** проекта.
- [ ] Прогрев GET + логирование cache-заголовков.
- [ ] `runPageSpeed` × 4 категории, concurrency 2–3, retry 429/5xx, timeout ~180 с.
- [ ] Повтор при Perf < 90 (и SI ≫ TTI); оба результата в отчёт.
- [ ] Таблица markdown (и опционально JSON без ключа).
- [ ] Канон URL короткий; режим одного пути vs suite.
- [ ] Результаты пишутся в журнал проекта (дата, origin, m/d, flake), код не трогают без выхода из зелёной зоны.

Язык скрипта не важен (`curl`, Node, Python). Важны контракт API и правила выше.
