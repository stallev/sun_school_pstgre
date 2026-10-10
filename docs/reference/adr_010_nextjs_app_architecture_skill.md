# ADR-010 — RSC patterns from nextjs-app-architecture-skill (in-repo only)

**Дата:** 2026-06-19  
**Статус:** ACCEPTED  
**Тип:** Architecture / agent tooling  
**Promote to:** `docs/prds/07_governance/adr_010_nextjs_app_architecture_skill.md` (wave W4 governance)

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../meta/ai_first_project_methodology.md)

**Provenance (read-only, not installed):** [aurorascharff/nextjs-app-architecture-skill](https://github.com/aurorascharff/nextjs-app-architecture-skill)

---

## 1. Context

The community skill packages RSC composition patterns for Next.js 16+ (Suspense at page level, async server components, Cache Components, anti-waterfall). Our stack already documents overlapping patterns in Cursor Rules and `docs/guidelines/nextjs/`, plus monorepo boundaries, DAL/actions split, iOS Safari mutation transport, Design Lab, and phase contracts that the external skill does not cover.

Installing the external skill alongside project Cursor Rules creates **two competing sources of truth** (folder layout, skeleton placement, action file naming, page sync vs async).

---

## 2. Decision

| Policy | Value |
|--------|-------|
| **External skill install** | **Forbidden** — do not run `npx skills install` for nextjs-app-architecture-skill or similar third-party Next.js **architecture** skills |
| **Selected patterns** | **Imported into repo** — guidelines + `.cursor/skills/app-conventions/` + this ADR |
| **Provenance link** | External repo cited for attribution only; agents must not treat it as a loadable skill |
| **Conflict resolution** | Cursor Rules → `app-conventions` → guidelines → ADR-010 |
| **Workflow verification skills** | **Allowed** — Cursor user skill `next-dev-loop` (runtime dual-view: `/_next/mcp` + `agent-browser`) is **not** under this architecture-skill ban. **Opt-in by explicit user request only** — not auto after edits, DoD, or commit pipeline. Not part of `app-conventions`. Instant Navigations **shell without Instant Insights overlay is not confirmation**. |

---

## 3. Adopt (in project docs)

| Pattern | Where documented |
|---------|------------------|
| Page composes; heavy fetch in async children behind Suspense | `ai_loading_patterns.md` §4–§5 |
| Page owns Suspense boundary | `app-router-streaming-loading.mdc` |
| Server component awaits DAL; client as leaf | `react-logic-presentation.mdc` |
| React `cache()` per-request dedup | `ai_data_fetching_patterns.md` §2 |
| `'use cache'` + `cacheTag` cross-request | ADR-002, `ai_loading_patterns.md` §8 |
| Parent passes plain values; no child refetch | `ai_data_fetching_patterns.md` §7 |
| Region error boundary with `catchError` (16.3+) | `ai_loading_patterns.md` §12.1 |
| Sync page + `params.then()` for static shell | `ai_loading_patterns.md` §4.1 *(opt-in)* |
| Instant Navigations / `partialPrefetching` | ADR-002 template **§5.1** + `ai_loading_patterns.md` §8.1 — **required** |

---

## 4. Reject

| External skill pattern | Project canon | Reason |
|------------------------|---------------|--------|
| Installing external skill via `npx skills install` | In-repo only | Avoid dual agent instructions |
| `features/<domain>/` folders | `data/` + `actions/` + `components/{domain}/` + `packages/*` | Monorepo boundaries |
| Skeleton co-located in component file | `*-skeleton.tsx` sibling | `react-one-component-per-file.mdc` |
| `'use server'` in `domain-actions.ts` with inline DB | DAL `data/**` + thin `actions/**` | iOS Safari dual transport |
| Server Action for all mutations | Route Handler for Class A optimistic | `data-server-actions-and-api.mdc` |
| Ad-hoc action return shapes | `MutationResult<T>` from domain | `domain-literals-and-codes.mdc` |

---

## 5. Consequences

**Positive**

- Single agent instruction stack — no conflict with external skill folder layout or skeleton rules.
- Useful RSC patterns remain available in guidelines and `app-conventions`.

**Negative / tradeoffs**

- External skill updates are **not** auto-synced; revisit this ADR when Next.js RSC APIs change materially.

---

## 6. Related documents

| Document | Relationship |
|----------|--------------|
| [`.cursor/skills/app-conventions/SKILL.md`](../../.cursor/skills/app-conventions/SKILL.md) | Agent entry — **only** project skill for architecture |
| [`references/nextjs-rsc-streaming.md`](../../.cursor/skills/app-conventions/references/nextjs-rsc-streaming.md) | Detailed adopt/reject table |
| [`docs/project-react-skill-requirements.md`](../project-react-skill-requirements.md) | Skill authoring rules |
| [ADR-002 template](../prds/07_governance/adr_002_nextjs_vercel_runtime_policy.template.md) | Next **16.4** runtime pin; **§5.1** Instant Navigations required |

---

## Change log

| Date | Change |
|------|--------|
| 2026-08-16 | v1.5 — Instant Navigations → ADR-002 template §5.1; `next-dev-loop` remains opt-in; shell without Insights overlay is not confirmation |
| 2026-08-10 | v1.4 — clarify workflow skill `next-dev-loop` allowed (opt-in by user request); architecture-skill ban unchanged |
| 2026-06-19 | v1.1 — external skill install **forbidden**; patterns in-repo only |
| 2026-08-10 | v1.2 — `catchError` naming + Instant Navigations roadmap pointers (no pin change) |
| 2026-08-10 | v1.3 — Instant Navigations + `partialPrefetching` = best practice |
| 2026-06-19 | v1.0 — ACCEPTED; adopt/reject table from community skill evaluation |
