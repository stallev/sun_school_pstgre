# P3 — Wave Executor (W{N})

## Роль
По типу волны: **PM** (W1 product) · **Domain Architect** (W3–W4) · **UX Writer** (W2/W7) · **Security** (W5)

## Parameter
`{N}` = номер волны (1, 2, 3, … 14). **Одна сессия = одна волна.**

## Preconditions
- [ ] P2 registry canonical
- [ ] Волна W{N} обязательна для уровня профиля (registry §5.0); строки выключенных модулей пропускаются
- [ ] Все файлы из «Зависит от» для W{N} существуют
- [ ] Gate G2 passed for W1

## Inputs (READ FIRST)
- `docs/meta/documentation_creation_registry.md` — секция W{N}
- Все dependencies из колонки «Зависит от»
- HTML prototype (visual reference)
- Pulse example files for same wave (pattern): `docs/examples/pulse/docs/`
- **Context7** для runtime/auth/data файлов (registry §2.7)

## Task
For each row W{N}-XX **in order**:

1. Draft file with front matter (§2.2 registry)
2. Body sections per §2.3.3 matrix (type-specific)
3. Contracts: §2.3.4 template · Specs: §2.3.5 template — numbered sections `§N.M`
4. Paths H / N / S — decide by **triggers** in registry §2.3.2a (not «if applicable»), depth per profile D2; every `N/A` needs an exemption reason
5. Run the **DoR-ready checklist** (registry §2.3.6); unresolved items → `Open questions` with owner, never `TBD` in MUST sections
6. Phase tasks (`P{N}_tasks.md`) — from [`phase_tasks.template.md`](../docs/meta/phase_tasks.template.md): commit units, `Tier`, `§` links, `Paths`
7. **Backlinks** in earlier files (same session)
8. Update `architecture_master_index.md` status
9. Add FM-xxx to `failure_modes_catalog.md` when applicable

## Special: W3 priority (DB-first)
If W{N} includes `database_schema_v1.md`:
- Derive from specs + prototype + interim docs
- User flows reference schema enums — not vice versa

## Special: W3 user flows
Create `docs/prds/01_product_scope/user_flows/users_mvp/*.md` from interim docs.

## Forbidden
- Skip files within wave
- Implementation code
- Second route list outside `canonical_routes.md`
- Inline domain magic strings

## Verification (per file — §2.6 registry)
- [ ] Front matter complete
- [ ] Paths H / N / S per registry §2.3.2a triggers (race per matrix); `N/A` only with exemption reason
- [ ] Acceptance criteria: expected outcome per item, ≥ 1 per required path
- [ ] DoR-ready checklist §2.3.6: anchors, no `TBD` in MUST, error codes + message keys named, `Проверено по`, touchpoints
- [ ] Open questions empty or each has owner + blocked § / tasks
- [ ] Backlinks added
- [ ] No silent drift with dependencies

## Output
At end: summary table of created files + **next wave number** + gate status.

## Next
→ P3 with `{N+1}` until W14 complete, then [`P4-rules-guidelines.md`](P4-rules-guidelines.md)
