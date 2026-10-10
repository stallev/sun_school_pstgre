# P1 seed — HTML-прототип (Claude Desktop)

**Куда:** вставить целиком в **Claude Desktop** (не Cursor). Результат сохранить в репозитории как `docs/prototypes/{{MAIN_PROTOTYPE_HTML}}`.  
**Канон пути:** только `docs/prototypes/` (не `docs/prototype/`).  
**Дальше в репо:** [`P1-html-prototype.md`](P1-html-prototype.md) (ingest) → W2 UX-03 → P6 Design Lab.  
**Bootstrap:** [`BOOTSTRAP.md`](../BOOTSTRAP.md) §3.5.

Play CDN и `@theme`: [Tailwind CSS v4 — Using Play CDN](https://tailwindcss.com/docs/installation/play-cdn).  
Промпт ниже явно запрещает **AI slop** (generic SaaS/Inter/фиолетовые градиенты) — приоритет у референса DS и spec.

---

## Как запустить

1. Прикрепите файл спецификации продукта (PDF/MD: роли, экраны MVP, IA, ключевые CTA).
2. Подставьте URL референса **дизайн-системы / визуала** в блок INPUTS ниже (сайт, Figma Dev Mode, живой продукт, гайд).
3. Скопируйте **весь блок «ПРОМПТ»** в Claude Desktop.
4. Сохраните единственный ответ-файл HTML в `docs/prototypes/` под именем `{{MAIN_PROTOTYPE_HTML}}`.

---

## ПРОМПТ (копировать отсюда)

```
Роль: Senior product UI designer. Сгенерируй ОДИН статический HTML-файл прототипа (visual seed / полный MVP-набор экранов, если спецификация это позволяет).

INPUTS (обязательно)
1) Прикреплённый файл спецификации продукта — источник экранов, ролей, IA, копирайта. Не выдумывай сущности вне spec.
2) Референс дизайн-системы (открой URL, извлеки визуал):
   DESIGN_REFERENCE_URL: <paste design-system or visual reference URL>
3) Метаданные проекта:
   PROJECT_NAME: {{PROJECT_NAME}}
   PROJECT_SLUG: {{PROJECT_SLUG}}
   USER_ROLES: {{USER_ROLES}}
   DESIGN_SYSTEM_NAME: {{DESIGN_SYSTEM_NAME}}

ЧТО ВЗЯТЬ С URL (только визуал)
- Семантические роли цвета (фон, поверхность, текст, muted, primary, accent, destructive, border, ring) — не копируй чужие логотипы/скриншоты экранов продукта.
- Гарнитуры (display / UI / mono), type scale (размеры заголовков и body), вес.
- Радиусы, плотность (padding), elevation/тени, характер кнопок и карточек.
- Светлая и тёмная тема, если референс их показывает.
ЗАПРЕЩЕНО: копировать структуру чужого продукта, чужие экраны, чужой домен, чужой копирайт. Референс = токены и ритм, не клон.

ANTI AI SLOP (MUST)
Не генерируй generic «AI slop» UI. Если DESIGN_REFERENCE_URL задаёт характер — следуй ему, не подменяй шаблонным SaaS. Если референс молчит о детали — выбери осознанный характер продукта из spec (не «нейтральный стартап»).
ЗАПРЕЩЕНО как дефолт:
- Шрифты: Inter, Roboto, Arial, system-ui, «Space Grotesk как всегда», одинаковые Google Fonts из прошлых генераций.
- Палитра: фиолетово-индиго градиенты на белом, равномерно блеклые pastel без доминирующего цвета, случайный dark-navy + cyan «AI dashboard».
- Композиция: одинаковые три карточки в ряд, hero «крупный заголовок + две кнопки + три колонки фич», карточки с равным padding и нулевой иерархией.
- Декор: декоративные blur-орбы, mesh-gradient фон «для красоты», стеклянный glassmorphism без роли, фейковые avatars/метрики «wow».
- Копирайт: lorem ipsum, «Unlock your potential», «Seamless experience», пустые placeholder-тексты вместо spec.
ДЕЛАТЬ: одна визуальная идея (типографика + цвет + плотность) на весь файл; иерархия type scale; реальный копирайт из spec; состояния empty/error выглядят спроектированными, не «серый ящик». Не добавляй анимации ради анимаций, если референс спокойный.

ВЫХОД
- Ровно один файл: полный HTML5 document. Никаких отдельных .css/.js.
- Имя файла для сохранения: {{MAIN_PROTOTYPE_HTML}} (каталог docs/prototypes/).
- В начале <head> HTML-комментарий TOKEN DUMP для будущего visual_identity_contract:
  список :root переменных, шрифтов, radius, теней, соответствия «роль → utility» (bg-background, text-foreground, bg-primary, …).

ТЕХНИЧЕСКИЙ КОНТРАКТ (Tailwind CSS v4 Play CDN)
- В <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
- Тема ТОЛЬКО в <style type="text/tailwindcss">:
  - :root { --background: …; --foreground: …; --primary: …; и остальные семантические токены }
  - .dark { те же имена, тёмные значения }
  - @theme inline { --color-background: var(--background); --color-foreground: var(--foreground); … }
    (паттерн Tailwind v4: CSS variables в :root + @theme inline → утилиты bg-background / text-primary; Play CDN: type="text/tailwindcss")
- Тёмная тема: class "dark" на <html> (переключатель в UI).
- Шрифты: @theme --font-* + Google Fonts <link> при необходимости. Не пиши font-family в произвольных CSS-классах.

СТИЛИЗАЦИЯ РАЗМЕТКИ
- Только утилиты Tailwind v4 на элементах (включая md:, dark:, произвольные значения text-[15px] при необходимости).
- ЗАПРЕЩЕНО: собственные CSS-классы (.hero, .card-title), style="", JS который пишет element.style.*, CSS-in-JS.
- Допускается ТОЛЬКО слой токенов в type="text/tailwindcss" (:root, .dark, @theme). Никаких других селекторов.

JS (inline <script> в конце body)
- Роутер экранов по id секций (data-screen / id) для будущего prototype_route_mapping.
- Role switcher по USER_ROLES (dev-only, не продакшен-auth).
- Переключатель .dark.
- Без фреймворков, без сборки, без npm.

UX
- Mobile-first: база 390px, оболочка на md (sidebar vs bottom nav, если это следует из spec).
- Каждый экран: стабильный id (латиница, точки допустимы: c.home).
- Состояния: хотя бы на одном списке покажи empty; скелет/loading — опционально как отдельный экран.
- Один primary CTA на главный экран.
- Семантика: кнопки = button, ссылки = a, подписи полей, контраст AA на тексте.

ОБЪЁМ
- Если spec полный — все MVP-экраны из spec.
- Если spec тонкий — минимум: shell + главная + 1–2 ключевых паттерна (карточка, форма, список) с токенами. Пометь в комментарии, какие экраны не покрыты.

Source of truth: этот HTML — только visual reference. Не утверждай продуктовые правила, которых нет в spec.
```
