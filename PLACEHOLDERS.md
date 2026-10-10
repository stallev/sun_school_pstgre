# Placeholders — замена при bootstrap

Замените все вхождения **до** первого промпта P0. Рекомендуется `rg '{{'` для проверки.

| Placeholder | Пример | Где используется |
|-------------|--------|------------------|
| `{{PROJECT_NAME}}` | Acme Platform | AGENTS, project-context, prompts |
| `{{PROJECT_SLUG}}` | acme-platform | package names, URLs |
| `{{PACKAGE_SCOPE}}` | acme | `@acme/domain`, `@acme/db`, npm scope |
| `{{PRODUCT_DESCRIPTION}}` | B2B marketplace for … | project-context, AGENTS |
| `{{USER_ROLES}}` | client, vendor, admin | project-context, schema |
| `{{DESIGN_SYSTEM_NAME}}` | Warm Forest | project-context, design_system_lab_spec, UI rules |
| `{{MAIN_PROTOTYPE_HTML}}` | Acme_Prototype_v1.html | **единственный** канонический HTML-прототип: `docs/prototypes/{{MAIN_PROTOTYPE_HTML}}` (не `docs/prototype/`). Процесс: [`BOOTSTRAP.md`](BOOTSTRAP.md) §3.5; Claude Desktop: [`prompts/P1-html-prototype-claude-desktop.md`](prompts/P1-html-prototype-claude-desktop.md) |
| `{{INTERIM_DESIGN_SYSTEM_DOC}}` | acme-design-system.md | interim DS в `docs/default_docs/` (detail when contract silent) |
| `{{REFERENCE_EXAMPLE_COMPONENTS_REL_PATH}}` | examples/pulse/docs/example_components/ | optional pattern library relative to `docs/` — **не** default copy source |
| `{{DOMAIN_COMPONENT_FOLDER}}` | catalog | primary domain molecules folder under `components/` (adjust per project) |
| `{{DOMAIN_INVARIANT_1}}` | e.g. `Entity.timezone` source of truth | project-context §Domain invariants |
| `{{DOMAIN_INVARIANT_2}}` | … | … |
| `{{DOMAIN_INVARIANT_3}}` | … | … |
| `{{DOMAIN_INVARIANT_4}}` | idempotency_key + delivery_log | jobs invariant |
| `{{DOMAIN_INVARIANT_5}}` | Post-MVP nullable columns | schema readiness |
| `{{CURRENT_PHASE}}` | P01 — Monorepo scaffold | project-context §Repository status |
| `{{INTERIM_DOCS_GLOB}}` | docs/default_docs/ | interim PRD archive path |
| `{{S3_KEY_PREFIX}}` | acme/ | AWS S3 object key prefix (`FILE_UPLOAD_OBJECT_KEY_PREFIX`) |

**Прототип — не процесс в этой таблице.** Имя файла — `{{MAIN_PROTOTYPE_HTML}}`. Требование seed, ingest P1 и Claude Desktop — [`BOOTSTRAP.md`](BOOTSTRAP.md) §3.5 и [`prompts/P1-html-prototype-claude-desktop.md`](prompts/P1-html-prototype-claude-desktop.md). Опциональный второй файл (standalone landing) кладите рядом в `docs/prototypes/`; отдельный placeholder не обязателен.

## npm scopes

После замены `{{PACKAGE_SCOPE}}`:

- `packages/domain/package.json` → `"name": "@{{PACKAGE_SCOPE}}/domain"`
- `packages/db/package.json` → `"name": "@{{PACKAGE_SCOPE}}/db"`
- `packages/policy/edge` → `"@{{PACKAGE_SCOPE}}/policy-edge"`
- `packages/policy/server` → `"@{{PACKAGE_SCOPE}}/policy-server"`

## Файлы для переименования

| Template | Target |
|----------|--------|
| `AGENTS.template.md` | `AGENTS.md` (заменяет AGENTS.md сопровождения шаблона) |
| `.cursor/rules/tiers/t0-always/project-context.template.mdc` | `.cursor/rules/project-context.mdc` |
| `specs/design_system_lab_spec.template.md` | `docs/implementation/mvp/specs/design_system_lab_spec.md` (после P2) |
