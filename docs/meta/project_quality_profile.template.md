# Профиль качества проекта — шаблон

**Тип:** Meta  
**Статус:** Template — промпт [`P00-quality-profile.md`](../../prompts/P00-quality-profile.md) создаёт по нему `docs/meta/project_quality_profile.md`  
**Канон:** этот файл — **единственный источник** уровней строгости, матрицы измерений D1–D10, модулей стека и security floor. Правила агента, registry и промпты ссылаются сюда и не копируют значения.

---

## 1. Зачем

Методология шаблона по умолчанию рассчитана на максимальную строгость: все волны документации, пути H/N/S на каждую задачу, независимый review каждого commit unit, полный стек. Для небольших и ненагруженных проектов это критически замедляет разработку. Профиль фиксирует **в начале проекта**, какой объём документации, тестов и проверок проект реально требует, — и агент дальше работает по выбранному уровню, а не по максимуму.

Выбор делает пользователь (промпт P00). Агент не повышает и не понижает уровень сам.

## 2. Уровни

| Уровень | Ключ | Для чего | Не подходит |
|---------|------|----------|-------------|
| **Prototype** | `prototype` | Демо, проверка гипотезы, одноразовый стенд | Реальные пользователи и их данные |
| **Lean** | `lean` | MVP, внутренний инструмент, малая нагрузка; максимум скорости при базовой надёжности | Платежи, чувствительные персональные данные |
| **Standard** | `standard` | Небольшой продакшн с реальными пользователями | Высоконагруженные и критичные системы |
| **Strict** | `strict` | Полный канон Pulse: все волны, все пути, полный review и тесты | — |

**Рекомендация уровня (P00):** платежи или чувствительные PII → не ниже `standard`; реальные пользователи → не ниже `lean`; `prototype` — только без реальных данных.

## 3. Матрица измерений

Ключ измерения используется в `overrides` (§6) и в ссылках правил («по профилю D4»).

| # | Измерение (ключ) | Prototype | Lean | Standard | Strict |
|---|------------------|-----------|------|----------|--------|
| D1 | Docs-волны registry (`docs`) | Минимальный набор: `mvp_scope`, `canonical_routes`, `database_schema_v1` | Волны с отметкой `lean` в [registry §5.0](./documentation_creation_registry.md) | Волны с отметкой `standard` | Все волны W0–W15 |
| D2 | Пути H / N / S в docs и задачах (`paths`) | Только H (Acceptance задачи) | H + N для мутаций и внешнего ввода + S по признакам registry §2.3.2a | Registry §2.3.2a полностью | §2.3.2a + Concurrency и Drift обязательны в каждом contract |
| D3 | DoR / Phase audit (`dor`) | DoR не проверяется; задача = Goal + Acceptance | DoR проверяет оркестратор inline; без отдельного `architect` audit | Phase DoR audit `architect` на фазу | + `architect` plan на каждую задачу T2 |
| D4 | Unit / integration — Vitest (`unit_tests`) | Нет | `packages/domain` + policy-проверки для S-путей; без порога покрытия | domain + policy + критичный DAL; ≥ 60 % lines в `packages/domain`, `packages/policy` | ≥ 80 % lines domain / policy, ≥ 60 % DAL; тест на каждый N / S путь contract |
| D5 | E2E — Playwright (`e2e`) | Нет | Нет (ручной smoke в Acceptance) | Smoke H критичных flows | H / N / S критичных flows + axe + `instant()` на критичных навигациях |
| D6 | Review-гейт (`review`) | Без `reviewer`; оркестратор `diff-only` | `reviewer` только для CU с T3 / `Paths: S`; остальное — `diff-only` | `reviewer` на каждый CU с runtime-кодом | Как Standard |
| D7 | Верификация и CI (`ci`) | typecheck + lint | + `npm run test` локально перед коммитом | + в CI: `test:coverage` с порогами D4, e2e smoke | + в CI: полный e2e (H / N / S) и axe |
| D8 | Доступность (`a11y`) | Семантичный HTML, labels | Правило `ui-semantics-a11y` | + WCAG 2.1 AA чек-лист ключевых экранов | + axe в CI |
| D9 | Perf / observability (`perf`) | — | Sentry по желанию | Sentry включён; PSI по запросу | Sentry + PSI ≥ 90 на release-suite перед релизом |
| D10 | Модули стека (`modules`) | Опциональные выключены | Design Lab обязателен; остальные — по потребности | Design Lab и Sentry включены; остальные — по потребности | По потребности продукта |

Детали тестов (раскладка, команды, что считать «критичным flow») — [`docs/guidelines/testing/ai_testing_guidelines.md`](../guidelines/testing/ai_testing_guidelines.md).

## 4. Модули стека

**Core — всегда:** Next.js (App Router, `proxy.ts`), Neon PostgreSQL + Prisma, shadcn/ui + Tailwind v4, Sonner, монорепо `apps/web` + `packages/{domain,policy,db}`, exact-pinning зависимостей.

| Модуль (ключ) | Prototype | Lean | Standard | Strict | Если выключен |
|---------------|-----------|------|----------|--------|---------------|
| Auth.js, роли (`auth`) | по потребности | по потребности | по потребности | по потребности | Не активировать `auth-security`, `policy-packages`; пропустить ADR-003, W5 auth-документы |
| Design System Lab (`design_lab`) | опционально | **обязателен** | **обязателен** | **обязателен** | (только Prototype) P6 и T2-правила по желанию |
| Sentry (`sentry`) | выкл. | по желанию | вкл. | вкл. | P5 не ставит `@sentry/nextjs`; BOOTSTRAP §10 пропустить |
| S3 uploads (`s3_uploads`) | выкл. | по потребности | по потребности | по потребности | Не активировать `s3-file-asset-uploads`; пропустить ADR-007, `file_upload_contract`; BOOTSTRAP §7 |
| Email + фоновые задачи (`email_jobs`) | выкл. | выкл. | по потребности | по потребности | Нет `apps/workers`, таблиц `job_execution` / `delivery_log`, ADR-006, email-контрактов; BOOTSTRAP §11 |
| i18n, срезы словаря (`i18n`) | выкл. | по потребности | по потребности | по потребности | Не активировать `ui-messages-bundle-splitting`; один локаль-словарь в `@/lib/messages` |
| iOS Safari dual transport (`ios_safari_transport`) | выкл. | выкл. | вкл. для mobile-first | вкл. для mobile-first | Не активировать `ios-safari-mutation-transport` |

«По потребности» — включается, если продукт этого требует (P00 спрашивает). Правила T1/T2, не привязанные к модулю, активируются всегда по манифесту [`.cursor/rules/README.md`](../../.cursor/rules/README.md) (колонка «Модуль»).

### 4.1 Design System Lab — обязателен начиная с Lean

`/design-system` не отключается через `overrides` на уровнях Lean / Standard / Strict. Минимальный объём (все основные компоненты и **все состояния**) — канон в [`specs/design_system_lab_spec.template.md`](../../specs/design_system_lab_spec.template.md) § «Минимальный объём по профилю».

## 5. Security floor — на всех уровнях, не понижается

Не зависит от уровня и не отменяется `overrides`:

1. Авторизация — на сервере (Server Action / Route Handler / DAL), не только в UI; чужой ресурс → 404 / 403.
2. Внешний ввод валидируется (Zod) до записи и до использования.
3. Секреты — только в server env; ничего секретного в `NEXT_PUBLIC_*` и в клиентском бандле.
4. Зависимости — exact-версии (`dependency-pinning`), lockfile в git.
5. Ключи S3 и прочие идентификаторы хранилища строятся на сервере.
6. Начиная с Lean: CU с `Paths: S` или в sensitive zone всегда проходит `reviewer`.

## 6. Overrides

Уровень задаёт значения D1–D9 целиком; отдельное измерение можно переопределить на соседний уровень (например, `e2e: standard` при уровне `lean`). Ограничения:

- `overrides` не ослабляют §5 и не отключают Design Lab на Lean+;
- каждое переопределение — с причиной в профиле.

## 7. Как агент применяет профиль

- Профиль читается вместе с `AGENTS.md` (КОНТЕКСТ) — указатель в `project-context.mdc`.
- Где правило или промпт говорит «по профилю Dn» — брать значение из `docs/meta/project_quality_profile.md`.
- **Профиля нет** (шаблон, или P00 не выполнен) → действует **Standard**.
- Сомнение между двумя трактовками уровня — спросить пользователя, не повышать молча.

## 8. Смена уровня

- **Повышение** — пользователь меняет `quality_profile`; новые требования действуют для новых CU. Покрытие существующих критичных путей (тесты, docs, review) — отдельные задачи в ближайшей фазе.
- **Понижение** — только через ADR (почему риск приемлем); security floor и Design Lab на Lean+ сохраняются.
- Каждое изменение — строка в журнале профиля.

---

## Шаблон заполненного профиля (P00 копирует в `docs/meta/project_quality_profile.md`)

````markdown
# Профиль качества — Sunday School

**Тип:** Meta · **Статус:** Canonical · **Канон матрицы:** [`project_quality_profile.template.md`](./project_quality_profile.template.md)

```yaml
quality_profile: lean        # prototype | lean | standard | strict
overrides: {}                # например: { e2e: standard }
modules:
  auth: true
  design_lab: true           # обязателен на lean / standard / strict
  sentry: false
  s3_uploads: false
  email_jobs: false
  i18n: false
  ios_safari_transport: false
```

## Выбранный уровень: Lean

| # | Измерение | Значение для проекта |
|---|-----------|----------------------|
| D1 | Docs | … (колонка выбранного уровня из матрицы §3 + overrides) |
| … | … | … |

## Обоснование выбора

- Пользователи и нагрузка: …
- Персональные данные / платежи: …
- Сроки и команда: …

## Журнал

| Дата | Изменение | Кто |
|------|-----------|-----|
| YYYY-MM-DD | Профиль создан (P00) | пользователь |
````
