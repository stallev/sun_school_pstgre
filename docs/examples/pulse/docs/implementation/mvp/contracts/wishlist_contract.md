# Wishlist Contract — Pulse MVP

**Тип:** Contract  
**Статус:** Deferred (post-MVP) — schema и `@pulse/domain` / `@pulse/policy-server` stubs сохранены; UI и `/api/client/wishlist` **не входят в MVP**.  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W8  
**Зависит от:** [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md), [`interaction_design_contract.md`](../../../design/interaction_design_contract.md), [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md)  
**Связанные документы:** [`authorization_policy_contract.md`](./authorization_policy_contract.md)

---

## Purpose

Контракт **wishlist toggle** для клиента: idempotent add/remove, optimistic UI contract, policy, errors. Implements [`FM-007`](../../../prds/02_domain_model/failure_modes_catalog.md#fm-007), [`FM-019`](../../../prds/02_domain_model/failure_modes_catalog.md#fm-019).

---

## Scope / Out of scope

**In scope:** `AddToWishlist`, `RemoveFromWishlist`, `ListWishlistTrainers`, heart toggle on catalog/profile.

**Out of scope:** Notifications when trainer available, sharing wishlist, trainer-side lists.

---

## Definitions

Composite PK: `(client_id, trainer_profile_id)` — no status enum.

```typescript
type ToggleWishlistInput = {
  trainerProfileId: string;
  action: "add" | "remove";
};
```

---

## Happy path

**Actor:** authenticated client on `/trainers` or `/trainers/[id]`.

**Preconditions:** `role=client`; trainer `approved` (for add).

**Sequence:**

```mermaid
sequenceDiagram
  participant UI as WishlistToggle (client)
  participant Opt as useOptimistic
  participant A as Server Action
  participant Pol as policy-server
  participant Db as db

  UI->>Opt: flip heart (startTransition)
  UI->>A: toggleWishlist
  A->>Pol: assertCanToggleWishlist
  A->>Db: INSERT or DELETE
  Db-->>A: ok
  A-->>UI: { ok: true, isWishlisted }
```

**Postconditions:** Row exists or removed; approved trainer only in list reads.

**Side effects:** Optional `revalidateTag` wishlist — optimistic UI may skip success toast.

---

## Negative paths (business)

| Condition | Code | Behavior |
|-----------|------|----------|
| Add unapproved trainer | `TRAINER_NOT_BOOKABLE` | Deny; optimistic rollback + toast.error |
| Trainer tries toggle | `FORBIDDEN` | policy deny |
| Guest toggle | `UNAUTHORIZED` | Redirect login |
| Duplicate add | — | **Success** idempotent (FM-007) |
| Remove not present | — | **Success** idempotent (FM-007) |

**MUST NOT** — toast.error on idempotent duplicate add/remove.

---

## Security paths

| Scenario | MUST | FM |
|----------|------|-----|
| Toggle for another client | Use session `userId` only | FM-004 pattern |
| Non-client role | Deny at policy | FM-005 |
| Wishlist trainer_id tampering | Validate trainer exists + approved on add | FM-003 |

---

## Concurrency & idempotency

### FM-007 — double tap

**MUST:**

- Add: `create` catch unique violation `P2002` → return `{ ok: true, isWishlisted: true }`
- Remove: `deleteMany` where composite key → `{ count: 0 }` still success

### FM-019 — optimistic failure

**MUST** (ui-optimistic-mutations):

1. `setOptimisticState` only inside `startTransition`
2. On server error: revert heart state
3. **`toast.error` always** on failure
4. `disabled` + `aria-busy` while pending

Success toast **optional** if visual change sufficient.

---

## Drift & consistency notes

| Risk | Guard |
|------|-------|
| Wishlist shows pending trainers | List query `trainer.status = approved` |
| Non-idempotent duplicate errors | Repository catches P2002 |
| Missing optimistic rollback | interaction_design_contract checklist |

---

## Policy & layer touchpoints

| Use-case | Policy | Db |
|----------|--------|-----|
| `AddToWishlist` | `assertCanToggleWishlist` | INSERT |
| `RemoveFromWishlist` | `assertCanToggleWishlist` | DELETE |
| `ListWishlistTrainers` | client session | JOIN approved trainers |

---

## Requirements

1. **MUST** — idempotent add/remove (FM-007).
2. **MUST** — optimistic UI per interaction_design_contract (FM-019).
3. **MUST** — only `client` role toggles.
4. **MUST** — add validates trainer approved.
5. **MAY** — omit success toast on toggle if heart state sufficient.

---

## Acceptance criteria

- [ ] Happy path with useOptimistic noted
- [ ] FM-007 idempotency explicit
- [ ] FM-019 rollback + toast.error required
- [ ] Security: session-only clientId
- [ ] Negative: unapproved trainer, wrong role
- [ ] Link to interaction_design_contract

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) | Wishlist rows |
| [`interaction_design_contract.md`](../../../design/interaction_design_contract.md) | Optimistic + toast |
| [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) | Wishlist semantics |
| [`failure_modes_catalog.md`](../../../prds/02_domain_model/failure_modes_catalog.md) | FM-007, FM-019 |
| [`../specs/catalog_discovery_spec.md`](../specs/catalog_discovery_spec.md) | Catalog UX (W9) |

**Registry:** [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W8-05

---

## Agent notes

- **UI phase P06:** optimistic heart on profile/catalog — `useOptimistic` + `toast.error` on rollback ([`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) P06).
- Heart icon on catalog cards — same Action as profile page.
- Do not use wishlist for «follow» notifications on MVP.
- List page `/client/dashboard` may show wishlist subset — read use-case only.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — wishlist contract |
