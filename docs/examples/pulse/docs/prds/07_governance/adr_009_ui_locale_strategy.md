# ADR-009: UI Locale Strategy (P17)

**Тип:** ADR  
**Статус:** ACCEPTED  
**Версия:** 1.0  
**Дата:** 2026-05-25  
**Волна:** W24  
**Зависит от:** [`adr_002_next162_vercel_runtime_policy.md`](./adr_002_next162_vercel_runtime_policy.md), [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) §1.2, [`content_and_microcopy_contract.md`](../../design/content_and_microcopy_contract.md) §C8  
**Связанные документы:** [`adr_index.md`](./adr_index.md), [`i18n_runtime_spec.md`](../../implementation/mvp/contracts/i18n_runtime_spec.md), [`P17_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P17_phase_description.md)

---

## Purpose

Зафиксировать стратегию **UI internationalization** Pulse: локали **EN (default)** и **RU**, cookie-first resolution без URL prefix, интеграция с `user.locale`, отказ от next-intl routing middleware. Реализация — **P17**.

---

## Scope / Out of scope

**In scope:** UI copy, formatters, metadata, locale switcher, browser auto-detect, persist.

**Out of scope:** UGC translation; email (P21); URL `/en/` prefix; RTL; TMS/CMS.

---

## Context

1. MVP shipped **RU-only UI** via `@/lib/messages/ru.ts` (~1000+ keys) while DDL **`user.locale DEFAULT 'en'`** — intentional drift to resolve in P17.
2. P16 explicitly deferred i18n infrastructure; landing copy remains messages-based.
3. ADR-002: canonical **`proxy.ts`** (Node); many i18n libraries assume Edge **`middleware.ts`** locale redirects — conflict risk.
4. ~50+ routes, auth `callbackUrl`, iOS Safari dual transport — URL prefix i18n has high regression cost.
5. Content contract **C8** already mandates key-tree i18n readiness.

---

## Decision

### D1 — Locales and default

**MUST** support exactly **`en`** and **`ru`**.

**Default locale:** **`en`** — aligns with `user.locale` DDL default and product direction (international marketplace).

### D2 — Cookie-first resolution (no URL prefix on P17)

**MUST NOT** introduce App Router segment `/[lang]/…` in P17.

Active locale resolved via cookie `pulse_locale`, optional query `?lang=`, session `user.locale`, and `Accept-Language` — see [`i18n_runtime_spec.md`](../../implementation/mvp/contracts/i18n_runtime_spec.md).

**Rationale:** preserves canonical route inventory; avoids auth/booking/API path rewrites; compatible with `proxy.ts` auth-only scope.

### D3 — Custom messages resolver (not next-intl routing)

**MUST** extend existing `@/lib/messages` with `en.ts` + `ru.ts` and `getMessages(locale)`.

**MUST NOT** adopt **next-intl** App Router prefix routing or Edge middleware locale detection in P17.

**MAY** use ICU-style keyed plurals manually (`count.one`, `count.other`) per C8 — no runtime ICU library required for MVP locales.

**Rejected:** full next-intl migration — high churn, middleware coupling (ADR-002 trade-off note).

### D4 — Formatting layer mandatory

**MUST** centralize Intl/date-fns in `@/lib/i18n/format.ts`.

UI locale **MUST NOT** replace or conflate with **`TrainerProfile.timezone`** (ADR-004).

### D5 — Auto-detect Accept-Language

On first anonymous visit without cookie:

- Parse `Accept-Language`
- Map `ru*`, `uk*`, `be*` → **`ru`**
- Map `en*` → **`en`**
- Else → **`en`**
- **SHOULD** persist result in `pulse_locale` cookie

### D6 — Cookie wins on login

When authenticated user logs in:

- Valid **`pulse_locale` cookie** → UI uses cookie; **do not** overwrite cookie from `user.locale`
- No cookie → use **`user.locale`**; sync cookie to match

Profile/switcher change updates **both** cookie and DB.

**Rationale:** respects explicit guest language choice before login.

### D7 — Locale switcher placement

**MUST** ship:

1. **`LocaleSwitcher`** on marketing surfaces (nav/footer)
2. **Language row** on `/client/profile` and `/trainer/profile`
3. **TopBar** compact switcher on `md+` (optional on mobile if profile row present)

Design Lab catalog primitive before product import (**ui-warm-forest-shadcn**).

### D8 — Post-MVP URL prefix (deferred)

**MAY** (future ADR amendment) add optional prefix `/ru/` for marketing SEO + hreflang.

**MUST NOT** implement in P17. Cookie model remains source of truth for app shell.

---

## Consequences

**Positive:**

- Aligns UI with DDL default `en`.
- Minimal route/auth regression surface.
- Builds on existing messages discipline and C8 rules.
- Works with Next.js 16 `proxy.ts` without locale middleware.

**Trade-offs:**

- No locale in URL — weaker shareable language-specific links (mitigated by `?lang=`).
- Manual parity of `en.ts` / `ru.ts` — TypeScript `satisfies` required.
- EN copy requires product review — not machine-translate-only.

**Neutral:**

- Existing RU-first users: auto-detect preserves RU experience when browser prefers Russian.

---

## Rejected alternatives

| Alternative | Why rejected |
|-------------|--------------|
| URL prefix `/en/`, `/ru/` for all routes | Large migration; auth callback; matrix of redirects |
| next-intl + middleware | ADR-002 proxy model; Edge middleware exception |
| Default locale `ru` | Conflicts with DDL; product EN-first direction |
| DB-only locale (no cookie) | Poor guest UX before login |
| Translate trainer UGC | Out of product scope; trust/authenticity |

---

## Agent checklist

- [ ] Read ADR-009 before P17 implementation
- [ ] Implement per [`i18n_runtime_spec.md`](../../implementation/mvp/contracts/i18n_runtime_spec.md)
- [ ] No `/[lang]/` routes without new ADR
- [ ] Both locale files updated for every new message key
- [ ] No `@pulse/policy-server` in locale resolver

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_002_next162_vercel_runtime_policy.md`](./adr_002_next162_vercel_runtime_policy.md) | proxy.ts constraint |
| [`adr_004_timezone_scheduling_model.md`](./adr_004_timezone_scheduling_model.md) | TZ ≠ UI locale |
| [`P17_tasks.md`](../../implementation/mvp/tasks/P17_tasks.md) | Implementation checklist |

**Registry:** W24

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-25 | v1.0 — ACCEPTED; P17 i18n strategy |
