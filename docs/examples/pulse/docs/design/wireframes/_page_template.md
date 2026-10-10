# Wireframe Template — Pulse MVP

**Тип:** Wireframe  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W10  
**Зависит от:** [`ui_states_contract.md`](../ui_states_contract.md), [`styleguide.md`](../styleguide.md)  
**Связанные документы:** [`route_index.md`](./route_index.md), [`visual_identity_contract.md`](../visual_identity_contract.md)

---

## Purpose

Шаблон для копирования при создании wireframe экрана Pulse. Обеспечивает единообразие регионов, states и ссылок на UX contracts.

**Аудитория:** design, AI-агенты W10 и фаз P02–P05.

---

## How to use

1. Скопировать этот файл в `wireframes/mvp/{screen_name}.md`.
2. Заменить `{Screen title}`, route, role, CTA, prototype ID.
3. Удалить секции с пометкой **N/A** с обоснованием.
4. Не дублировать hex — ссылка на [`visual_identity_contract.md`](../visual_identity_contract.md).
5. Добавить строку в [`route_index.md`](./route_index.md).

---

## Metadata (copy block)

| Field | Value |
|-------|--------|
| **Route** | e.g. `/client/dashboard` |
| **Route group** | e.g. `(client)` |
| **Role** | `public` \| `client` \| `trainer` \| `admin` |
| **Prototype screen** | e.g. `c.home` or *none* |
| **MVP** | ✅ \| ⚠️ placeholder |
| **Primary CTA** | One `Button default` per screen |
| **Spec / flow** | Link to spec or user flow section |

---

## Layout shell

| Breakpoint | Chrome |
|------------|--------|
| Mobile `< md` | TopBar + content + BottomNav (role routes) or stripped (booking) |
| Desktop `≥ md` | TopBar + SidebarNav + PageContainer |

Canon: [`responsive_navigation_contract.md`](../responsive_navigation_contract.md), [`global_shell_spec.md`](../../implementation/mvp/specs/global_shell_spec.md).

---

## Components (shadcn/ui)

List planned primitives: `Button`, `Card`, `Tabs`, `Dialog`, `Sheet`, `Form`, `Input`, `Skeleton`, `Badge`, `Alert`, etc.

Recipe reference: [`styleguide.md`](../styleguide.md).

---

## Regions

Describe content blocks top → bottom. One bullet per region; note responsive delta.

---

## Data dependencies

Server data / RSC loaders: entities, filters, badge counts. No business logic in client beyond UX state.

---

## Guardrails

- **Auth:** route prefix + object-level policy (→ contracts); no role toggle in production.
- **Privacy:** fields that MUST NOT appear on this screen.
- **Post-MVP:** Stripe, Daily.co, email flows — do not wireframe as MVP UI.

---

## States

| State | Description |
|-------|-------------|
| **happy** | Default success path |
| **empty** | Zero items — icon + heading + CTA (Zero Dead Ends) |
| **loading** | Skeleton matching final layout |
| **error** | Alert + Retry or toast.error on mutation |
| **forbidden** | Redirect login or forbidden card |

Canon: [`ui_states_contract.md`](../ui_states_contract.md).

---

## Desktop layout

```
┌────────────────────────────────────────────────────────┐
│ TopBar · logo · utilities                              │
├──────────┬─────────────────────────────────────────────┤
│ Sidebar  │ Page title (font-heading)                   │
│ (md+)    │ [Primary content regions]                   │
│          │ [Primary CTA if sticky — bottom-right md+]  │
└──────────┴─────────────────────────────────────────────┘
```

---

## Mobile layout

```
┌──────────────────────┐
│ TopBar               │
├──────────────────────┤
│ Content (edge-to-edge│
│  where spec says)    │
│                      │
│ [Sticky CTA bar]     │
├──────────────────────┤
│ BottomNav (role)     │
└──────────────────────┘
```

---

## Acceptance criteria

- [ ] Route matches [`canonical_routes.md`](../canonical_routes.md) only
- [ ] Primary CTA один; states перечислены
- [ ] Prototype mapping noted or gap documented
- [ ] Spec/contract linked for implementation phase

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`route_index.md`](./route_index.md) | Index |
| [`prototype_route_mapping.md`](../prototype_route_mapping.md) | Prototype ↔ route |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W10-00
