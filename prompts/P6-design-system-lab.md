# P6 — Design System Lab

## Роль
Frontend Architect.

## Preconditions (Gate G4)
- [ ] P5 scaffold complete, build passes
- [ ] Профиль: модуль `design_lab` включён (обязателен с `lean`); на `prototype` без Lab — P6 пропустить, T2 активировать перед первой UI-задачей
- [ ] UX-03 `visual_identity_contract.md` exists
- [ ] HTML prototype in `docs/prototypes/{{MAIN_PROTOTYPE_HTML}}`

## Inputs
- [`specs/design_system_lab_spec.template.md`](../specs/design_system_lab_spec.template.md)
- Pulse spec: `docs/examples/pulse/docs/implementation/mvp/specs/design_system_lab_spec.md`
- Prototype + UX contracts (UX-01..UX-05)
- Context7: shadcn MCP, Tailwind v4

## Task
1. Create `docs/implementation/mvp/specs/design_system_lab_spec.md` from template
2. **Tokens:** `apps/web/src/app/globals.css` — `:root`, `.dark`, `@theme inline` per {{DESIGN_SYSTEM_NAME}}
3. **Atoms:** Heading, SectionTitle, ContentText, AlertText → `components/atoms/`
4. **shadcn Base UI:** `shadcn init -b base`; `components.json` `"style": "base-vega"`; `@base-ui/react`. Do not pass `-b radix`.
5. **Primitives:** tokenized Button, Card, CustomLink, PulseCard (rename per project)
6. **Design Lab:** route `/design-system` in `(dev)` group — L1 Tokens + L2 Primitives + L3 Patterns; объём — spec § «Минимальный объём по профилю» (с `lean`: все основные компоненты и все состояния)
7. Activate **T2 cursor rules** (манифест §T2) → `.cursor/rules/` — кроме правил выключенных модулей
8. `npm run rules:sync` (T0+T1+T2 `.mdc` ↔ `.claude/rules/*.md`, без `*.template.mdc`)
9. Update `canonical_routes.md` with `/design-system`
10. Fill project specifics (fonts, palette notes) in `tiers/t2-ui/ui-design-system-shadcn.mdc`, copy to root, `npm run rules:sync`

## Agent cycle
КОНТЕКСТ → ФАЗА (P01/P03) → КОНТРАКТ (this spec) → ЗАДАЧИ → ВЕРИФИКАЦИЯ

## Forbidden
- Product routes importing `@/components/design-lab/**`
- Generic shadcn colors bypassing semantic tokens
- `shadcn init -b radix`, style `radix-*`, `@radix-ui/*` as the primitive layer
- Feature molecules (TrainerCard etc.) — later phases

## Verification
- [ ] Design Lab renders on 390px and md
- [ ] Gate **G5**: минимальный объём по профилю — все компоненты и состояния из spec, light + dark
- [ ] Активны T0 + T1 + T2 по манифесту
- [ ] `npm run rules:check` pass
- [ ] Spec acceptance criteria pass
- [ ] `npm run lint` pass
- [ ] Prototype visual parity spot-check (3+ components)

## Next
→ Implementation phases P01+ per `docs/implementation/mvp/tasks/`
