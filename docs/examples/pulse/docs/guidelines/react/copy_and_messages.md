# UI copy and messages — Pulse

All user-visible product copy for **`apps/web`** lives in **`apps/web/src/lib/messages`**. Keys use **English identifiers**; values are localized per active **`AppLocale`** (`en` | `ru`).

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Cursor rule:** **ui-messages-and-copy** (`.cursor/rules/ui-messages-and-copy.mdc`)  
**Locale strategy:** [`adr_009_ui_locale_strategy.md`](../../prds/07_governance/adr_009_ui_locale_strategy.md) · **Runtime:** [`i18n_runtime_spec.md`](../../implementation/mvp/contracts/i18n_runtime_spec.md)

---

## Why

- Single place to edit wording across locales.
- **Server Actions** and **components** must not diverge on the same validation or error text.
- TypeScript **`Messages`** type enforces key parity between locale files.

---

## Locales (P17)

| Locale | File | Role |
|--------|------|------|
| **`en`** | `en.ts` | **Default** — canonical key tree + English copy |
| **`ru`** | `ru.ts` | Russian copy — `satisfies Messages` |

**Default locale:** `en` (aligns with `user.locale` DDL).

**Resolution:** cookie `pulse_locale` → session → `Accept-Language` → `en`. See contract §3.

---

## Structure

Nested objects by domain:

| Namespace | Examples |
|-----------|----------|
| `site` | App name, default metadata |
| `auth` | Login, register, password reset |
| `booking` | Status labels, actions, errors |
| `trainer` | Onboarding, schedule, services |
| `admin` | Moderation, verification, reject reasons |
| `catalog` | Filters, empty states, wishlist |
| `locale` | Switcher labels, language names (P17) |

- **Validation** vs **server** errors separated where helpful (`booking.validation`, `booking.server`).
- **Enum/API values** (`client`, `pending`, `confirmed`) — `@pulse/domain` or `@/lib/...` constants; **labels** in `messages`.
- **Mutation pending labels** — short gerund-style per locale (“Saving…”, “Сохраняем…”). See [`ai_form_handling_pattern.md`](./ai_form_handling_pattern.md) §4.
- **Plurals** — keyed branches (`one`, `few`, `many`) per [`content_and_microcopy_contract.md`](../../design/content_and_microcopy_contract.md) §C8; no string concatenation with fixed word order.

---

## Import patterns (P17)

| Context | Import |
|---------|--------|
| Server Component / Action / DAL | `import { getMessages } from "@/lib/messages"` → `const messages = await getMessages()` |
| Client Component | `import { useMessages } from "@/components/i18n/LocaleProvider.client"` (after P17) |
| Types only | `import type { Messages } from "@/lib/messages/types"` |

**Legacy:** bare `MESSAGES` export from `ru.ts` — **deprecated** in P17; migrate to `getMessages()` / `useMessages()`.

**MUST** add new keys to **both** `en.ts` and `ru.ts` in the same change.

---

## Formatting (not in messages)

Dates, times, money, relative timestamps — **`@/lib/i18n/format.ts`** with explicit locale. Do not embed formatted dates inside message strings when values are dynamic — use placeholders: `` `{date}` ``.

**Trainer timezone** (ADR-004) is passed to formatters separately from UI locale.

---

## Agent rule

- No duplicate strings in DAL, actions, and UI for the same user-facing error.
- No inline Cyrillic/Latin user-visible strings in TSX — use messages.
- Deep links may use `?lang=en|ru` — see [`canonical_routes.md`](../../design/canonical_routes.md) §Locale query.

---

## Icons

Prefer **`lucide-react`** — **ui-icons-lucide** rule and [React README](./README.md).

**Reference:** lampto [`copy_and_messages.md`](../../examples/lampto/docs/guidelines/react/copy_and_messages.md)
