# Testing — Vitest + Playwright

**Rule:** **testing** (`.cursor/rules/tiers/t1-implementation/testing.mdc`)  
**Объём по уровню:** [`project_quality_profile.template.md`](../../meta/project_quality_profile.template.md) §3 — D4 (unit / integration), D5 (e2e), D7 (где запускается). Уровень проекта — `docs/meta/project_quality_profile.md`; нет профиля → `standard`.  
**Заготовки:** [`scaffold/vitest.config.template.mjs`](../../../scaffold/vitest.config.template.mjs), [`scaffold/apps/web/playwright.config.template.ts`](../../../scaffold/apps/web/playwright.config.template.ts), [`scaffold/.github/workflows/ci.template.yml`](../../../scaffold/.github/workflows/ci.template.yml) — копирует P5.

---

## 1. Инструменты

| Слой | Инструмент | Где |
|------|------------|-----|
| Unit / integration | **Vitest** (`vitest`, `@vitest/coverage-v8`) | `packages/*`, `apps/web` (DAL, утилиты) |
| E2E | **Playwright** (`@playwright/test`) | `apps/web/e2e/` |
| A11y в e2e (`strict`) | `@axe-core/playwright` | `apps/web/e2e/` |
| Instant Navigations (`strict`) | `instant()` из `@next/playwright` | критичные навигации — [`ai_loading_patterns.md`](../nextjs/ai_loading_patterns.md) |

Версии — exact, определяются в P5 через `npm view <pkg> version` (**dependency-pinning**). В шаблоне версии не фиксируются.

## 2. Раскладка и имена

- Unit-тест лежит **рядом** с кодом: `format-booking-time.ts` → `format-booking-time.test.ts`.
- Root `vitest.config.mjs` — `test.projects` по workspace-пакетам; отдельный config в пакете — только если ему нужно своё окружение (например, `jsdom`).
- E2E: `apps/web/e2e/<flow>.spec.ts` — один файл на критичный flow; имя теста = путь из contract: `H: client creates booking`, `S: foreign booking → 404`.
- Скрипты root `package.json`: `test` (`vitest run`), `test:coverage` (`vitest run --coverage`), `test:e2e` (`playwright test` в `apps/web`).

## 3. Что тестировать по уровню

| Уровень | Unit / integration (D4) | E2E (D5) |
|---------|-------------------------|----------|
| `prototype` | — | — |
| `lean` | Чистые правила `packages/domain`; policy-проверки, которые закрывают S-пути (кто может / не может) | Ручной smoke в Acceptance задачи |
| `standard` | + критичный DAL (мутации, переходы состояний); порог 60 % lines для `packages/domain`, `packages/policy` | Smoke H для критичных flows |
| `strict` | Пороги 80 % domain / policy, 60 % DAL; тест на **каждый** N / S путь из contracts | H / N / S критичных flows + axe + `instant()` |

**Критичный flow** — путь, без которого продукт не выполняет основную задачу: вход, главная мутация каждой роли, оплата / запись, если есть. Список фиксирует phase description; не «все страницы».

## 4. Правила написания

1. **Тест следует contract, а не реализации.** Ожидаемый исход берётся из `§`-раздела contract / spec, на который ссылается задача; при расхождении — сначала docs (**product-docs-alignment**).
2. **N / S пути** — отдельные тесты с явным ожидаемым кодом: `MUTATION_ERROR_CODES.*` из `@{{PACKAGE_SCOPE}}/domain`, не строковый литерал (**domain-literals-and-codes**).
3. **Unit-тест не ходит в сеть и в реальную БД.** Внешние сервисы (S3, email, Auth.js) — через порты домена и фейки.
4. **DAL-интеграция** — один выбор на проект, фиксируется в P5 (ADR или `local_dev_setup`): отдельная Neon branch для тестов **или** моки Prisma-клиента. `import "server-only"` в тестах — `vi.mock("server-only", () => ({}))`.
5. **E2E** — локаторы по роли и доступному имени (`getByRole`, `getByLabel`), не по CSS-классам; тексты — из `@/lib/messages`, не дублировать строки.
6. **Без snapshot-only тестов** для логики; snapshot допустим для сериализуемых DTO.
7. **Флаки не лечатся ретраями.** `retries` в CI — только для диагностики (trace on first retry); причина флаки — задача.
8. Тесты — часть того же CU, что и код (**agent-commit-pipeline**); review уровня `diff-only` для CU, где изменены только тесты.

## 5. Запуск

| Где | Команды | С какого уровня (D7) |
|-----|---------|----------------------|
| Локально перед коммитом | `npm run test` (если CU затрагивает код с тестами) | `lean` |
| CI | `npm run test:coverage` (пороги D4) + `npm run test:e2e` smoke | `standard` |
| CI | + полный e2e (H / N / S), axe | `strict` |

CI запускается на **Node.js 24** (`node-version: "24"` в [`ci.template.yml`](../../../scaffold/.github/workflows/ci.template.yml)). Та же мажорная линия — локально и на Vercel (`engines.node`: `24.x`).

E2E в CI — против `next build && next start` (webServer в Playwright config) или preview-деплоя (`E2E_BASE_URL`).

## Related

- [`project_quality_profile.template.md`](../../meta/project_quality_profile.template.md) — уровни D4 / D5 / D7
- [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) §2.3.2a — пути H / N / S
- [`ai_semantics_a11y_guidelines.md`](../react/ai_semantics_a11y_guidelines.md) — axe
- [`ai_loading_patterns.md`](../nextjs/ai_loading_patterns.md) — `instant()`
