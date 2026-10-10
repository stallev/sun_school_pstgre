# P17 Tasks — UI Internationalization (EN/RU)

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-25  
**Волна:** W24  
**Зависит от:** [`P17_phase_description.md`](../phases_tasks_descriptions/P17_phase_description.md)  
**Связанные документы:** [`adr_009_ui_locale_strategy.md`](../../../prds/07_governance/adr_009_ui_locale_strategy.md), [`i18n_runtime_spec.md`](../contracts/i18n_runtime_spec.md), [`copy_and_messages.md`](../../../guidelines/react/copy_and_messages.md)

---

## Purpose

Чеклист **P17** — locale platform: resolver, messages EN/RU, formatters, switcher UX, verification.

---

## 0. Gate

- [x] ADR-009 status **ACCEPTED**
- [x] P14 DoD complete (`npm run typecheck`, `npm run lint`, UI states audit)
- [x] Read [`i18n_runtime_spec.md`](../contracts/i18n_runtime_spec.md) + [`P17_phase_description.md`](../phases_tasks_descriptions/P17_phase_description.md)

---

## Wave A — Foundation

- [x] Create `@/lib/i18n/constants.ts` — `DEFAULT_LOCALE`, `SUPPORTED_LOCALES`, `AppLocale` type
- [x] Create `@/lib/i18n/resolve-locale.ts` — priority chain per contract §3
- [x] Create `@/lib/i18n/cookie.ts` — read/write `pulse_locale` (1y, `SameSite=Lax`, path `/`)
- [x] Create `@/lib/messages/types.ts` — export `Messages` type from `en.ts` tree
- [x] Create `@/lib/messages/en.ts` — canonical keys + EN values (pilot namespaces: `site`, `auth`, `nav`, `landing`)
- [x] Refactor `@/lib/messages/ru.ts` — `satisfies Messages`
- [x] Update `@/lib/messages/index.ts` — `getMessages(locale)`, deprecate bare `MESSAGES` export with migration note
- [x] Root `layout.tsx` — `await resolveLocale()`; dynamic `<html lang={locale}>`
- [x] Handle `?lang=en|ru` — set cookie + strip query (layout or dedicated helper)
- [x] Pilot routes: `/`, `/auth/login` use `getMessages()`

---

## Wave B — Full copy

- [x] Complete `en.ts` parity with `ru.ts` (all namespaces)
- [x] Add `messages.locale.*` keys (switcher labels, settings row, language names)
- [x] Grep audit: no inline Cyrillic user-visible strings in `apps/web/src` (exclude `ru.ts`, tests, seed)
- [x] Migrate high-traffic imports: shell, booking, catalog, admin, trainer (batch by domain folder)
- [x] Server Actions / DAL errors — `getMessages(locale)` or pass message key + resolve in UI
- [x] Update `opengraph-image.tsx`, `landing-metadata.ts`, `landing-json-ld.ts` for per-locale metadata

---

## Wave C — Formatters

- [x] Create `@/lib/i18n/format.ts` — `formatMoney`, `formatDateTime`, `formatRelative`, `getDateFnsLocale`, `getIntlLocale`
- [x] Replace hardcoded `"ru-RU"` / `date-fns/locale/ru` in product code with formatter calls
- [x] `DatePickerField.client.tsx` — locale from context/props
- [x] Booking slot display — **UI locale** + **trainer timezone** (INV-01 unchanged)
- [x] `format-money.ts` — delegate to `@/lib/i18n/format.ts` or merge

---

## Wave D — UX & persist

- [x] Design Lab section — `LocaleSwitcher` variants (segmented EN|RU)
- [x] `LocaleSwitcher.client.tsx` — `aria-pressed`, calls `setLocaleAction`
- [x] Server Action `setLocaleAction` — validate locale; set cookie; update `user.locale` if session
- [x] `LocaleProvider.client.tsx` + `useMessages()` for client components
- [x] Marketing: `LandingNav` + `LandingFooter` — embed switcher
- [x] App shell: `TopBar` `md+` — compact switcher (MAY hide on mobile; profile row required)
- [x] `LocaleSettingsRow` — `/client/profile`, `/trainer/profile`
- [x] Register client/trainer — persist `user.locale` from active locale at signup
- [x] Login — cookie wins over DB for display (ADR-009 D6); no silent DB overwrite on login

---

## Wave E — Verification & docs

- [x] `npm run typecheck` (root)
- [x] `npm run lint` (root)
- [x] Smoke: guest RU auto-detect (`Accept-Language: ru-RU`)
- [x] Smoke: guest EN default (`Accept-Language: en-US`)
- [x] Smoke: switcher EN ↔ RU on landing
- [x] Smoke: `?lang=ru` deep link → cookie + stripped URL
- [x] Smoke: client booking list + detail — dates/money both locales
- [x] Smoke: trainer schedule — slot labels locale-aware, timezone correct
- [x] Smoke: admin complaint detail — resolution labels EN/RU
- [x] Smoke: profile language change persists after re-login
- [x] Docs: matrix, canonical_routes, copy guide, wireframe, registry synced

---

## Agent anti-patterns (P17)

- **MUST NOT** introduce `/[lang]/` App Router segment without new ADR amendment
- **MUST NOT** add next-intl full routing without ADR amendment
- **MUST NOT** import `@pulse/policy-server` in locale resolver (server layout only; no proxy change required)
- **MUST NOT** mix UI locale with `TrainerProfile.timezone`
- **MUST** add new user-visible strings to **both** `en.ts` and `ru.ts` in same PR

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P17_phase_description.md`](../phases_tasks_descriptions/P17_phase_description.md) | DoD |
| [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P17 row |

**Registry:** W24
