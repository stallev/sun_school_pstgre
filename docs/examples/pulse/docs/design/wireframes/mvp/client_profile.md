# Wireframe: Client Profile

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 2.0 | **Дата:** 2026-05-25 | **Волна:** W24  
**Route:** `/client/profile` · **Prototype:** `c.profile`  
**Phase:** P17 — language row · **Contract:** [`i18n_runtime_spec.md`](../../implementation/mvp/contracts/i18n_runtime_spec.md)

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | Sign out (`messages.profile.client.signOut`) — or save if editable fields |
| **Secondary** | Language row — `LocaleSettingsRow` / inline `LocaleSwitcher` |
| **Flow** | client_flow § Profile |

## Components

`Card`, `Avatar`, `Button`, settings rows, `LocaleSettingsRow`, theme toggle (stub), sign out.

## Regions

1. **Profile header** — avatar, name, email (read-only MVP).
2. **Settings list**
   - Notifications prefs placeholder (post-MVP)
   - Theme toggle (stub — existing product behavior)
   - **Language (P17)** — row label from `messages.locale.settingsLabel`; control = segmented **EN | RU** (`LocaleSwitcher` variant `settingsRow`); active locale `aria-pressed`; pending: disabled + `aria-busy`
3. **Account** — sign out destructive outline.
4. **Wishlist link** — optional row → trainers with hearts (MAY defer).

## Language row behavior

| State | UI |
|-------|-----|
| happy | Shows current locale; tap other locale → `setLocaleAction` → refresh |
| pending | Switcher disabled; gerund optional on row |
| error | `toast.error` from `@/lib/messages`; locale unchanged |

On success: cookie `pulse_locale` + `user.locale` updated (authenticated).

## States

| State | Description |
|-------|-------------|
| happy | Settings list with language row |
| loading | Row skeletons |
| error | toast on signOut or setLocale fail |
| forbidden | Non-client |

## Layout

List-style mobile; desktop `max-w-lg` centered or full width in shell. Language row: label left, switcher right on `md+`; stacked on narrow mobile if needed.

## A11y

- Settings list: `<ul>` / `<li>` or `Fieldset` pattern
- Language control: accessible name includes «Language» / «Язык» from messages
- Sign out: remains primary destructive action in Account section

**Registry:** W10-15 (v2 W24 P17)
