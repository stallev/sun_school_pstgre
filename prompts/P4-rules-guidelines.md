# P4 — Cursor Rules + Guidelines activation

## Роль
Platform Architect.

## Preconditions
- [ ] W1 governance docs exist (ADR-001, ADR-002 minimum)
- [ ] `docs/meta/project_quality_profile.md` — список включённых модулей
- [ ] P0 T0 rules already active

## Inputs
- [`.cursor/rules/README.md`](../.cursor/rules/README.md) — tier manifest
- Boilerplate `.cursor/rules/tiers/t1-implementation/` (состав — манифест §T1)
- `docs/guidelines/` (verify paths)
- Pulse rules reference: `docs/examples/pulse/.cursor/rules/`
- `docs/meta/ai_first_project_methodology.md`

## Task
1. Copy **T1 rules** → `.cursor/rules/` — кроме правил выключенных модулей (манифест, колонка «Модуль»)
2. `npm run rules:sync` / `npm run rules:check`
3. Verify all rules link to methodology + correct `@{{PACKAGE_SCOPE}}/`
4. Update `docs/guidelines/README.md`:
   - Replace remaining `{{PLACEHOLDERS}}`
   - Map rules ↔ guidelines
5. Update `AGENTS.md` — cursor rules section
6. Review `docs/reference/pulse_project_reference.md` — adapt «Что не копировать слепо» to the project domain
7. **Адаптировать auth-слой под ADR-003:** правило `auth-security.mdc` и guideline [`ai_auth_implementation_guide.md`](../docs/guidelines/auth/ai_auth_implementation_guide.md) описывают Credentials (email + пароль, `passwordHash`) — заменить на OIDC Google + Telegram, JWT без адаптера, привязку без `@auth/prisma-adapter`; источник — [`auth_runtime_spec.md`](../docs/prds/05_runtime/auth_runtime_spec.md), [`telegram_authjs_oidc_portable_guide.md`](../docs/my_specs/telegram_authjs_oidc_portable_guide.md). Credentials и `passwordHash` из правил и гайдов удалить
8. **Do NOT** activate T2 UI rules yet

## Forbidden
- T2 rules before P6
- Pulse domain invariants in rules (use project-context placeholders)

## Verification
- [ ] Активны T0 + T1 по манифесту (`ls .cursor/rules/*.mdc` = §T0 + §T1 + `project-context.mdc`)
- [ ] `npm run rules:check` pass
- [ ] docs/guidelines/README indexes every guide file
- [ ] Each T1 rule references Context7 where applicable
- [ ] pulse_project_reference.md complete
- [ ] `auth-security.mdc` и `ai_auth_implementation_guide.md` без Credentials / `passwordHash` / `@auth/prisma-adapter` (ADR-003)

## Next
→ Continue P3 waves if incomplete, else [`P5-nextjs-scaffold.md`](P5-nextjs-scaffold.md) after G3
