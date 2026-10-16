# P5 — Next.js Monorepo Scaffold

## Роль
Senior Fullstack Developer (Next.js 16 + PostgreSQL + monorepo).

## Preconditions (Gate G3)
- [ ] `database_schema_v1.md` canonical
- [ ] `monorepo_boundaries_contract.md` (W8) or draft
- [ ] T0 + T1 cursor rules active
- [ ] `docs/meta/project_quality_profile.md` — модули (профиль §4) определяют, что скаффолдить
- [ ] ADR-001, ADR-002 ACCEPTED

## Inputs
- `docs/examples/pulse/` — apps/web, packages/ structure
- [`scaffold/`](../scaffold/) boilerplate dirs
- `apps/web/AGENTS.template.md`
- Context7: `/vercel/next.js`, `/websites/prisma_io`, `/websites/authjs_dev`

## Task
1. **Monorepo root:** package.json workspaces, `npm run typecheck`, `npm run lint`. **Keep** existing `rules:sync` / `rules:check` / `deps:check` (do not drop them when adding workspaces). Set `"engines": { "node": "24.x" }` (local, CI, Vercel). Copy [`scaffold/.npmrc`](../scaffold/.npmrc) → root `.npmrc` **before** the first `npm install`; all versions exact per **`.cursor/rules/dependency-pinning.mdc`**; commit `package-lock.json`; CI / Vercel install command — `npm ci`.
2. **Git commit tooling:** скопировать из [`scaffold/`](../scaffold/) → `commitlint.config.mjs`, `.husky/`; установить devDeps и scripts по **`.cursor/rules/agent-commit-pipeline.mdc` § Git tooling setup**. Optional: husky pre-commit also runs `npm run rules:check`.
3. **packages/db:** Prisma schema from `database_schema_v1.md`, Neon URLs
4. **packages/domain:** mutation codes scaffold, ports
5. **packages/policy/edge + server:** empty policy stubs
6. **apps/web:**
   - Next.js **current 16.4.x patch** — baseline **16.4**. Confirm with `npm view next version` + Context7 `/vercel/next.js`; if latest is still 16.4.x, pin **that** exact version. Align `@next/third-parties` and `eslint-config-next`. No `^16`.
   - `src/proxy.ts` (NOT middleware.ts for new code)
   - `src/data/`, `src/lib/`, `src/components/{atoms,ui,design-lab}/`
   - Auth.js v5 — модуль `auth`: **Telegram OIDC и Credentials администратора (с 2026-10-16; Google не используется), JWT без `@auth/prisma-adapter`**, каркас по [`auth_runtime_spec.md`](../docs/prds/05_runtime/auth_runtime_spec.md) §3–§5 и [ADR-003](../docs/prds/07_governance/adr_003_auth_oidc_jwt_rbac.md); **Credentials не добавлять** (в P5 — только конфигурация и заглушки, логика входа — фаза P01)
   - Sentry stub (`@sentry/nextjs`) — модуль `sentry`
   - `globals.css` with token placeholders
7. Root `AGENTS.md` уже создан в P0. Скопировать `scaffold/apps/web/AGENTS.template.md` → `apps/web/AGENTS.md` (заменить placeholders); скопировать `scaffold/apps/web/CLAUDE.md` → `apps/web/CLAUDE.md` (статичный `@AGENTS.md`-импорт, без изменений). Корневой `CLAUDE.md` не дублировать MUST — зеркало `.claude/rules/`.
8. Env example: `DATABASE_URL`, `DIRECT_URL`; по модулям — `AUTH_SECRET` (`auth`), S3 (`AWS_IAM_*`, `S3_BUCKET_*`; `s3_uploads`), Sentry vars (`sentry`) — см. [`BOOTSTRAP.md`](../BOOTSTRAP.md) §6–§10, [`ai_s3_file_upload_guidelines.md`](../docs/guidelines/nextjs/ai_s3_file_upload_guidelines.md)
9. **Тесты и CI по профилю** (D4 / D5 / D7; [`ai_testing_guidelines.md`](../docs/guidelines/testing/ai_testing_guidelines.md)):
   - `lean`+: Vitest (`vitest`, `@vitest/coverage-v8`, exact versions) + [`scaffold/vitest.config.template.mjs`](../scaffold/vitest.config.template.mjs) → `vitest.config.mjs` (оставить блок порогов своего уровня); root scripts `test`, `test:coverage`; один пример теста в `packages/domain`
   - `standard` / `strict`: Playwright (`@playwright/test`) + [`scaffold/apps/web/playwright.config.template.ts`](../scaffold/apps/web/playwright.config.template.ts) → `apps/web/playwright.config.ts`; `apps/web/e2e/`; root script `test:e2e`; `strict` — + `@axe-core/playwright`
   - [`scaffold/.github/workflows/ci.template.yml`](../scaffold/.github/workflows/ci.template.yml) → `.github/workflows/ci.yml` — только jobs своего уровня (шапка файла)
   - Зафиксировать способ DAL-тестов (Neon test branch или моки Prisma) в `local_dev_setup` / ADR
10. Создать `.cursor/skills/app-conventions/SKILL.md` — **проектный скилл поверх cursor rules**:
   - Frontmatter: `name: app-conventions`; description без слов `performance`/`optimization`/`bundle`
   - Раздел `## Relationship to other skills` (defer-clause — обязателен, см. §4)
   - Раздел `## Cursor rules index` — таблица `контекст → существующий .mdc файл` (не копировать содержимое rules, только ссылки)
   - Раздел `## Project structure` — папки из Directory conventions AGENTS.md
   - Раздел `## Deviations from vercel-react-best-practices` (пустой по умолчанию)
   - Spec: [`docs/project-react-skill-requirements.md`](../docs/project-react-skill-requirements.md)

## Stack
Core: Next.js 16.4 · Node.js 24.x · Vercel · Neon · Prisma v7 · shadcn (Base UI) · Tailwind v4 · Sonner.
Модули по профилю (§4): Auth.js v5 (`auth`) · AWS S3 (`s3_uploads`) · Resend + `apps/workers` (`email_jobs`) · Sentry (`sentry`). Выключенный модуль — не ставить пакеты, не создавать env и каталоги.

## Forbidden
- Business feature screens (→ P01+ phases)
- T2 UI rules / Design Lab (→ P6)
- `@{{PACKAGE_SCOPE}}/policy-server` in proxy.ts

## Verification
- [ ] `next` in `apps/web/package.json` is exact current 16.4.x (baseline 16.4; verified via `npm view next version`)
- [ ] root `package.json` still has `rules:sync` / `rules:check` / `deps:check`
- [ ] root `.npmrc` with `save-exact=true`; `npm run deps:check` pass; `package-lock.json` committed
- [ ] `npm run typecheck` pass
- [ ] Тесты по профилю: `lean`+ — `npm run test` pass; `standard`+ — `npm run test:coverage` (пороги D4) и `npm run test:e2e` pass; `.github/workflows/ci.yml` содержит jobs своего уровня
- [ ] `npm run lint` pass
- [ ] `next build` pass (minimal pages OK)
- [ ] `proxy.ts` uses nodejs runtime
- [ ] Prisma migrate dev succeeds
- [ ] `.cursor/skills/app-conventions/SKILL.md` создан, содержит defer-clause и cursor rules index
- [ ] Скилл ссылается на `.cursor/rules/*.mdc`, не дублирует их содержимое
- [ ] `apps/web/AGENTS.md` содержит секцию `## Skills` со ссылкой на `app-conventions`
- [ ] `apps/web/CLAUDE.md` exists, содержит `@AGENTS.md`
- [ ] `npm run rules:check` pass
- [ ] commitlint + husky: `echo "main: chore: test" | npx commitlint` pass; `.husky/commit-msg` в репо

## Next
→ [`P6-design-system-lab.md`](P6-design-system-lab.md)
