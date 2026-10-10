# General engineering guides — deep dives

**Назначение:** фундаментальные материалы для Senior-разработчиков и AI-агентов (теория + примеры кода).  
**Операционный канон для агентов:** [`docs/guidelines/`](../guidelines/) + [`.cursor/rules/`](../../.cursor/rules/) — **имеют больший приоритет**, чем этот каталог.

**Референсная реализация паттернов:** [`docs/examples/pulse/`](../examples/pulse/) — read-only snapshot Pulse (fitapp). При конфликте следовать **Guidelines и Cursor Rules текущего проекта**.

---

## Индекс

| Файл | Тема | Операционный guideline | Cursor rule |
|------|------|------------------------|-------------|
| [`01-security-xss-csrf.md`](./01-security-xss-csrf.md) | XSS, CSRF, CSP, DOMPurify | [`docs/guidelines/security/ai_security_xss_csrf_guidelines.md`](../guidelines/security/ai_security_xss_csrf_guidelines.md) | **security-xss-csrf** |
| [`02-data-fetching.md`](./02-data-fetching.md) | Race conditions, dedup, retry, `'use cache'` | [`docs/guidelines/nextjs/ai_data_fetching_patterns.md`](../guidelines/nextjs/ai_data_fetching_patterns.md) | **data-server-actions-and-api**, **app-router-streaming-loading** |
| [`03-accessibility.md`](./03-accessibility.md) | ARIA, focus, keyboard, WCAG | [`docs/guidelines/react/ai_semantics_a11y_guidelines.md`](../guidelines/react/ai_semantics_a11y_guidelines.md) | **ui-semantics-a11y** |
| [`04-code-splitting.md`](./04-code-splitting.md) | Bundle, dynamic import, tree shaking | [`docs/guidelines/nextjs/ai_client_lazy_loading.md`](../guidelines/nextjs/ai_client_lazy_loading.md) | **react-ui-components** |
| [`05-browser-rendering.md`](./05-browser-rendering.md) | Reflow, repaint, GPU animations | [`docs/guidelines/react/ai_browser_rendering_performance.md`](../guidelines/react/ai_browser_rendering_performance.md) | **ui-animation-performance** |
| [`ai_agent_ui_ux_guideline.md`](./ai_agent_ui_ux_guideline.md) | FX-1–FX-10, overlay tree, pre-merge checklist | [`docs/guidelines/react/`](../guidelines/react/) + design contracts | T2 UI rules cluster |

---

## Как использовать

1. **Агент при реализации** — сначала Cursor Rule → Guideline → при необходимости deep dive здесь.
2. **При добавлении практики из `docs/general/`** — синтезировать в guideline/rule в том же PR; не оставлять только в general.
3. **Pulse reference** — grep `docs/examples/pulse/` для образцов структуры; не копировать домен и маршруты слепо.

---

## Связанные документы

- [`docs/reference/pulse_project_reference.md`](../reference/pulse_project_reference.md) — референсный проект и приоритеты
- [`docs/reference/stack_patterns_from_pulse.md`](../reference/stack_patterns_from_pulse.md) — извлечённые stack-паттерны
- [`docs/guidelines/README.md`](../guidelines/README.md) — индекс guidelines
