---
type: requirements
status: active
wave: P5-post
dependencies:
  - prompts/P5-nextjs-scaffold.md
  - .cursor/rules/ (T0+T1+T2 активны к моменту создания скилла)
  - docs/guidelines/react/
---

# Требования к проектному React-скиллу

> Контекст: плагин Vercel подключает `react-best-practices` (самообновляемый).
> В проекте активны Cursor Rules (T0+T1+T2 в `.cursor/rules/*.mdc`).
> Цель: проектный скилл, который **оркестрирует существующие cursor rules**
> и дополняет `react-best-practices`, не дублируя и не конфликтуя с ним.
>
> **Фаза создания:** P5 (Next.js scaffold) — после активации T1/T2 rules.
> **Обязательно:** перед созданием скилла устранить дубль источников (см. §0).
> **Обязательно:** после создания скилла добавить ссылку в `apps/web/AGENTS.md` и `AGENTS.md` (§ Agent skills).
> **RSC streaming:** patterns evaluated from [nextjs-app-architecture-skill](https://github.com/aurorascharff/nextjs-app-architecture-skill) — **in-repo only**, do not install; [`adr_010_nextjs_app_architecture_skill.md`](reference/adr_010_nextjs_app_architecture_skill.md).
> **Runtime dual-view verify:** отдельный Cursor **user** skill `next-dev-loop` (не часть `app-conventions`); запуск **только по явному запросу пользователя** — см. methodology §2.2 и [`docs/guidelines/nextjs/README.md`](guidelines/nextjs/README.md) § Agent runtime verification.

---

## 0. Пререквизит: один источник Vercel-правил

**Проблема.** `vercel-react-best-practices` (~/.cursor/skills/) и плагин Vercel
с `react-best-practices` — один и тот же контент, загружаемый дважды.
Это не дублирование токенов (скиллы дёшевы), но **две версии истины**
с разными циклами обновления: плагин обновится сам, глобальная копия — нет.
Через несколько месяцев они разойдутся и создадут противоречия.

**Решение (выполнить один раз, до P5):**

```powershell
# Убедиться, что плагиновый скилл активен:
Get-ChildItem "$HOME\.cursor\plugins" -Recurse -Filter "react-best-practices" | Select-Object FullName

# Удалить глобальный дубль:
Remove-Item -Recurse -Force "$HOME\.cursor\skills\vercel-react-best-practices"
```

**Правило:** единственный источник Vercel React-правил — **плагиновый `react-best-practices`**
(путь: `~/.cursor/plugins/*/react-best-practices/`).
Все ссылки в проектных документах используют имя **`react-best-practices`**.

---

## 1. Принцип разделения ответственности (главное правило)

| Зона | Владелец | Проектный скилл |
|---|---|---|
| Performance-правила React/Next.js (waterfalls, bundle size, re-renders, memoization, JS perf) | `react-best-practices` (плагин) | ❌ НЕ дублирует |
| Enforceable rules (RSC boundary, naming, mutations, a11y, DRY…) | `.cursor/rules/*.mdc` (T0–T2) | ❌ НЕ дублирует — **ссылается** |
| Архитектура проекта, структура папок, нейминг | Проектный скилл (+ ссылки на rules) | ✅ |
| Конвенции стека: Shadcn, слой данных (Prisma/Neon), Server Actions | Проектный скилл (+ ссылки на rules) | ✅ |
| Бизнес-правила домена, паттерны фич | Проектный скилл | ✅ |
| Осознанные отклонения от Vercel-правил | Проектный скилл (секция Deviations) | ✅ только здесь |

**Правило:** если совет звучит как «универсальная истина про React» — ему место в `react-best-practices`.
Если совет начинается с «в нашем проекте мы…» — ему место в проектном скилле.
Если совет уже покрыт cursor rule — скилл только **ссылается** на rule, не копирует содержимое.

---

## 2. Нейминг — без коллизий

- Имя НЕ должно начинаться с `react-` и не содержать `best-practices`.
- ✅ Хорошо: `app-conventions`, `<project-name>-conventions`, `project-architecture`
- ❌ Плохо: `react-rules`, `react-project-best-practices`, `nextjs-best-practices`
- Имя папки == поле `name` во frontmatter (lowercase, дефисы).

```
.cursor/skills/
└── app-conventions/
    ├── SKILL.md          # лёгкий: frontmatter, defer clause, cursor rules index, deviations
    ├── references/       # детали по разделам (data-layer.md, ui-shadcn.md, routing.md, ...)
    └── scripts/          # опционально
```

> **Ключевой принцип:** `SKILL.md` — оркестратор над `.cursor/rules/*.mdc`.
> Он **индексирует** существующие rules (таблица контекст → rule),
> добавляет **project structure** и **deviations**.
> Содержимое rules не переписывается — агент читает оба источника.

---

## 3. Description — непересекающиеся триггеры

Триггеры `react-best-practices` (плагин): *writing / reviewing / refactoring React or Next.js code,
performance, data fetching, bundle optimization*. Это широкая сеть.

Требования к description проектного скилла:

- **НЕ использовать** триггер-слова Vercel: `performance`, `optimization`,
  `bundle`, `refactoring for performance`.
- **Использовать** проектную лексику: имя проекта, имена доменных сущностей,
  «project conventions», «file structure», «where to put new code»,
  конкретные технологии конфигурации (Drizzle schema, Shadcn variants, Server Actions).
- Явно указать, КОГДА скилл срабатывает: «при создании новых фич, компонентов,
  роутов и схем БД в этом репозитории».

Пример:

```yaml
---
name: app-conventions
description: >
  Project-specific conventions for THIS repository: folder structure,
  naming, Shadcn component patterns, Drizzle/Neon data layer, Server
  Actions usage, and feature scaffolding. Use when creating new features,
  components, routes, or DB schemas in this project. Does NOT cover
  generic React performance — defer to react-best-practices (Vercel plugin).
---
```

Оба скилла (`react-best-practices` + `app-conventions`) МОГУТ срабатывать
одновременно на одну задачу — это нормально и желаемо,
если их содержимое не противоречит друг другу.

---

## 4. Явная декларация подчинённости (defer clause)

Первый раздел тела SKILL.md обязан содержать:

```markdown
## Relationship to other skills
- Performance rules (async, bundle, re-renders, memoization):
  OWNED by `react-best-practices` (Vercel plugin). Do not restate them here.
- This skill only defines project structure, conventions, and
  documented deviations (see Deviations section).
- On conflict: Deviations section of THIS skill wins; otherwise
  `react-best-practices` wins.
```

Это единственный механизм «разрешения конфликтов»: агент читает оба скилла,
поэтому приоритет задаётся текстом, а не системой.

---

## 5. Секция Deviations — единственное место противоречий

Если проект осознанно нарушает правило Vercel — фиксируем явно, с ID правила и причиной:

```markdown
## Deviations from react-best-practices
- `bundle-*`: мы НЕ выносим <конкретный модуль> в dynamic import,
  потому что он нужен на каждой странице (LCP-критичен).
  Reason: измерено в Lighthouse 2026-05-xx, выигрыша нет.
```

Требования:
- Каждое отклонение: ID/название правила + что делаем иначе + измеримая причина.
- Отклонение без причины с цифрами — не принимается в скилл.
- Раздел пуст по умолчанию. Пустой раздел — норма.

---

## 6. Запрет дублирования контента

- ❌ Не копировать формулировки правил из `SKILL.md` плагинового `react-best-practices`
  (даже «своими словами» — это создаёт две версии истины, которые разойдутся).
- ❌ Не копировать содержимое проектных `.cursor/rules/*.mdc` — только ссылки на них.
- ❌ Не писать общих советов уровня «используй Server Components где можно» —
  это уже покрыто (в `react-best-practices` или `react-ui-components.mdc`).
- ✅ Можно ССЫЛАТЬСЯ: «компоненты графиков рендерим на сервере
  (см. `react-best-practices`, server-* rules + `react-ui-components.mdc`),
  файл кладём в `features/<x>/server/`».

Тест на дубль: убери из правила название проекта — если оно осталось верным
для любого React-приложения, его место не здесь.

---

## 7. Структура и размер

- `SKILL.md` ≤ ~150 строк: frontmatter, defer clause, **cursor rules index**, project structure, deviations.
- Cursor rules index — таблица в теле `SKILL.md`: `контекст → .mdc файл` (без копирования содержимого rule).
- Детали — в `references/*.md`, подгружаются агентом по требованию
  (прогрессивная загрузка экономит контекст).
- Один файл = одна зона: `data-layer.md`, `ui-shadcn.md`, `routing.md`, `testing.md`.

Пример cursor rules index в `SKILL.md`:

```markdown
## Cursor rules index

| When | Rule | Key constraint |
|------|------|----------------|
| New React component | `react-one-component-per-file.mdc` | Named export, ≤140 lines |
| Naming hooks / vars | `react-naming-conventions.mdc` | `use*`, camelCase, SCREAMING_SNAKE |
| RSC vs client split | `react-ui-components.mdc` | `'use client'` only for hooks/browser APIs |
| Mutation pending UI | `ui-mutation-pending.mdc` | `disabled` + `aria-busy` обязательны |
| Toast after mutation | `ui-toast-mutations.mdc` | Sonner, 2000ms, из `@/lib/messages` |
| Domain strings/codes | `domain-literals-and-codes.mdc` | Из `@{{PACKAGE_SCOPE}}/domain`, без inline |
| UI tokens / Shadcn | `ui-design-system-shadcn.mdc` | `bg-primary`, Design Lab catalog |
| Accessibility | `ui-semantics-a11y.mdc` | WCAG 2.1 AA |
```

---

## 8. Чек-лист приёмки перед коммитом

- [ ] Имя не пересекается с установленными скиллами:
      `Get-ChildItem "$HOME\.cursor\skills"; Get-ChildItem ".cursor\skills"` (PowerShell)
      или `ls ~/.cursor/skills && ls .cursor/skills` (bash/zsh).
- [ ] В description нет слов `performance`/`optimization`/`bundle`.
- [ ] Есть defer clause (`## Relationship to other skills`) с правилом приоритета.
- [ ] Ни одно правило не повторяет содержимое `SKILL.md` плагинового `react-best-practices`.
- [ ] Cursor rules index содержит ссылки на `.mdc` файлы — без копирования их тела.
- [ ] Ни одно правило не повторяет содержимое существующих `.cursor/rules/*.mdc`.
- [ ] Все deviations имеют ID правила и измеримую причину.
- [ ] Проверено в чате: задача «создай новую фичу X» триггерит ОБА скилла;
      задача «оптимизируй ре-рендеры» триггерит только `react-best-practices`.
- [ ] Скилл закоммичен в `.cursor/skills/` (проектный уровень, не глобальный).
- [ ] Ссылка на скилл добавлена в `apps/web/AGENTS.md` и root `AGENTS.md` § Agent skills
- [ ] RSC patterns documented in-repo: [`adr_010_nextjs_app_architecture_skill.md`](reference/adr_010_nextjs_app_architecture_skill.md) — **no** external `npx skills install`

---

## 9. Поддержка (maintenance)

- При обновлении плагина Vercel (новая версия `react-best-practices`) — перепроверить
  секцию Deviations: ID правил могут измениться.
- Глобальный дубль `~/.cursor/skills/vercel-react-best-practices/` должен отсутствовать
  (удалён по §0). Проверять при онбординге новых машин.
- Раз в квартал: прогнать чек-лист §8 заново.
- Любое новое правило в проектный скилл проходит тест из §6.
