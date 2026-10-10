# Authorization Matrix — Pulse MVP

**Тип:** PRD  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W5  
**Зависит от:** [`user flows`](../01_product_scope/user_flows/users_mvp/), [`canonical_routes.md`](../../design/canonical_routes.md), [`adr_003_auth_credentials_jwt_rbac.md`](../07_governance/adr_003_auth_credentials_jwt_rbac.md)  
**Связанные документы:** [`policy_enforcement_contract.md`](./policy_enforcement_contract.md), [`pages_functional_spec.md`](../01_product_scope/pages_functional_spec.md)

---

## Purpose

**Единственный канон** матрицы доступа Pulse MVP: role × route × resource × action. Определяет MUST/MAY/DENY для perimeter (`proxy.ts`) и object-level (`policy/server`). Security paths ([`FM-004`](../02_domain_model/failure_modes_catalog.md#fm-004), [`FM-005`](../02_domain_model/failure_modes_catalog.md#fm-005), [`FM-016`](../02_domain_model/failure_modes_catalog.md#fm-016)) трассируются к строкам этой таблицы.

---

## Scope / Out of scope

**In scope:** три роли MVP, все MVP routes и domain resources из [`use_cases_index.md`](../02_domain_model/use_cases_index.md).

**Out of scope:** post-MVP OAuth identities, Stripe/Daily.co admin surfaces, fine-grained ABAC beyond owner/admin.

---

## Definitions

| Symbol | Meaning |
|--------|---------|
| ✅ | Allowed (after object check if applicable) |
| ✅* | Allowed only for **owner** or relationship (see Notes) |
| 🔒 | Public read with domain filter (e.g. approved trainers only) |
| ❌ | Deny — redirect login, 403, or 404 per policy |
| — | Not applicable / route absent on MVP |

**Roles:** `guest` (unauthenticated), `client`, `trainer`, `admin`.

---

## Route perimeter matrix (Layer 1 — `proxy.ts`)

Маршруты — только из [`canonical_routes.md`](../../design/canonical_routes.md).

| Route prefix | guest | client | trainer | admin | Enforcement |
|--------------|:-----:|:------:|:-------:|:-----:|-------------|
| `/`, `/trainers`, `/trainers/[id]` | ✅ | ✅ | ✅ | ✅ | Public; catalog filters in domain |
| `/auth/*` | ✅ | ✅ | ✅ | ✅ | Public auth pages |
| `/book/*` | ❌→login | ✅ | ❌ | ❌ | JWT `role=client` |
| `/client/*` | ❌→login | ✅ | ❌ | ❌ | JWT `role=client` |
| `/trainer/*` | ❌→login | ❌ | ✅ | ❌ | JWT `role=trainer` |
| `/admin/*` | ❌→login | ❌ | ❌ | ✅ | JWT `role=admin` |
| `/sessions/[sessionId]` | ❌→login | ✅* | ❌ | ✅ | Layer 4: booking owner or admin |
| `/api/auth/[...nextauth]` | ✅ | ✅ | ✅ | ✅ | Auth.js handlers |
| `/api/jobs/*` | ❌ | ❌ | ❌ | ❌ | Cron secret / internal only |
| `/api/upload` | ❌→login | ✅ | ✅ | ✅ | Layer 4: authenticated user |

**MUST** — unauthenticated access to protected prefix → redirect `/auth/login?callbackUrl={path}`.

**MUST** — wrong role on protected prefix → redirect to role home (`/client/dashboard`, `/trainer/dashboard`, `/admin/dashboard`) or login.

---

## Resource × action matrix (Layer 4 — `policy/server`)

Ownership rules use `user.id` from session, never from request body.

### Identity (`user`)

| Action | guest | client | trainer | admin | Notes |
|--------|:-----:|:------:|:-------:|:-----:|-------|
| Register (client) | ✅ | — | — | — | Server sets `role=client` |
| Register (trainer) | ✅ | — | — | — | Server sets `role=trainer` + pending profile |
| Login | ✅ | ✅ | ✅ | ✅ | Credentials |
| Read own profile | ❌ | ✅* | ✅* | ✅* | `/client/profile`, settings |
| Update own profile | ❌ | ✅* | ✅* | ✅* | Not `role` field |
| Assign `admin` role | ❌ | ❌ | ❌ | ❌ | Seed/manual only MVP |

### Trainer profile & verification

| Action | guest | client | trainer | admin | Notes |
|--------|:-----:|:------:|:-------:|:-----:|-------|
| List catalog (approved) | 🔒 | 🔒 | 🔒 | 🔒 | [INV-03](../02_domain_model/domain_invariants.md) |
| Read public profile | 🔒 | 🔒 | 🔒 | 🔒 | Pending/rejected: limited or 404 |
| Read own trainer profile (full) | ❌ | ❌ | ✅* | ✅ | Includes pending status |
| Update own trainer profile | ❌ | ❌ | ✅* | ❌ | FM-016 ownership |
| Submit / resubmit application | ❌ | ❌ | ✅* | ❌ | Own profile only |
| Approve / reject / revoke | ❌ | ❌ | ❌ | ✅ | FM-005, FM-010 |
| View verification queue | ❌ | ❌ | ❌ | ✅ | Admin routes |

### Services & schedule

| Action | guest | client | trainer | admin | Notes |
|--------|:-----:|:------:|:-------:|:-----:|-------|
| Read active services (public) | 🔒 | 🔒 | 🔒 | 🔒 | Approved trainer only |
| CRUD own services | ❌ | ❌ | ✅* | ❌ | FM-016 |
| Toggle service active | ❌ | ❌ | ✅* | ❌ | Optimistic UI |
| Read/write own schedule | ❌ | ❌ | ✅* | ❌ | Weekly + exceptions |
| Read available slots | 🔒 | ✅ | ✅ | ✅ | Public on approved profile |

### Booking

| Action | guest | client | trainer | admin | Notes |
|--------|:-----:|:------:|:-------:|:-----:|-------|
| Create booking | ❌ | ✅ | ❌ | ❌ | Approved trainer; FM-003 |
| List own bookings (client) | ❌ | ✅* | ❌ | ✅ | Admin: all |
| List trainer bookings | ❌ | ❌ | ✅* | ✅ | Trainer's clients |
| Read booking detail | ❌ | ✅* | ✅* | ✅ | FM-004 IDOR |
| Confirm / complete | ❌ | ❌ | ✅* | ✅ | Trainer of booking |
| Cancel | ❌ | ✅* | ✅* | ✅ | FM-002 window for client |

### Wishlist

| Action | guest | client | trainer | admin | Notes |
|--------|:-----:|:------:|:-------:|:-----:|-------|
| Toggle wishlist | ❌ | ✅* | ❌ | ❌ | Own wishlist only |
| Read own wishlist | ❌ | ✅* | ❌ | ✅ | Admin read optional |

### Reviews

| Action | guest | client | trainer | admin | Notes |
|--------|:-----:|:------:|:-------:|:-----:|-------|
| Read visible reviews | 🔒 | 🔒 | 🔒 | 🔒 | Hidden excluded |
| Publish review | ❌ | ✅* | ❌ | ❌ | Completed booking owner |
| Hide / delete review | ❌ | ❌ | ❌ | ✅ | FM-005 |

### Trainer client notes (private)

| Action | guest | client | trainer | admin | Notes |
|--------|:-----:|:------:|:-------:|:-----:|-------|
| Read notes | ❌ | ❌ | ✅* | ✅ | Client **cannot** read notes |
| Upsert notes | ❌ | ❌ | ✅* | ❌ | Privacy — see privacy doc |

### Complaints & refunds

| Action | guest | client | trainer | admin | Notes |
|--------|:-----:|:------:|:-------:|:-----:|-------|
| File complaint | ❌ | ✅* | ❌ | ❌ | Own booking context |
| Manage complaints | ❌ | ❌ | ❌ | ✅ | FM-005 |
| Request refund | ❌ | ✅* | ❌ | ❌ | Own booking |
| Approve/reject refund | ❌ | ❌ | ❌ | ✅ | FM-013 |

### File assets

| Action | guest | client | trainer | admin | Notes |
|--------|:-----:|:------:|:-------:|:-----:|-------|
| Initiate upload | ❌ | ✅* | ✅* | ✅* | Own assets |
| Confirm upload | ❌ | ✅* | ✅* | ✅* | FM-012 ready state |
| Link certificate to profile | ❌ | ❌ | ✅* | ❌ | Ready assets only |

### Jobs & email (MVP boundary)

| Action | guest | client | trainer | admin | Notes |
|--------|:-----:|:------:|:-------:|:-----:|-------|
| Write `delivery_log` | ❌ | ❌ | ❌ | ❌ | [INV-12](../02_domain_model/domain_invariants.md) post-MVP |
| Trigger Cron email jobs | ❌ | ❌ | ❌ | ❌ | Internal cron secret only |

---

## Security paths (canonical)

| ID | Scenario | Matrix row | Expected behavior |
|----|----------|------------|-------------------|
| FM-004 | Client A reads Client B booking by ID | Booking read | Deny; 404 preferred |
| FM-005 | Client calls admin approve | Trainer approve | Deny before domain; 403 |
| FM-016 | Trainer A edits Trainer B service | Services CRUD | Deny ownership |
| FM-003 | Book non-approved trainer | Create booking | Deny at domain + catalog filter |
| — | Tamper `role` in registration POST | Identity register | Ignore client; server assigns |
| — | Access `/api/jobs/*` without secret | Jobs | 401/403 |

---

## Negative paths

| Attempt | Response |
|---------|----------|
| Expired / missing session on protected route | Redirect login |
| Valid session, wrong role prefix | Redirect role home |
| Valid client, foreign booking ID | 404 shell (no leak) |
| Trainer pending expects public listing | Empty catalog / not bookable |
| Double admin action on processed entity | Stale state error FM-010/FM-013 |

---

## Concurrency & races

Matrix permissions **do not** replace transactional guards. Admin approve + reject concurrent → one wins ([`FM-010`](../02_domain_model/failure_modes_catalog.md#fm-010)). Policy **MUST** re-read entity status inside transaction.

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| New MVP route without row | Block merge until matrix updated |
| Spec invents new permission | Trace to use-case + matrix |
| proxy-only protection | Code review: Layer 4 for all mutations |
| 403 vs 404 inconsistency | Booking detail: 404; admin areas: 403 shell |

---

## Requirements

1. **MUST** — W8 `authorization_policy_contract.md` encode enforceable rows from this matrix (no conflicting rules).
2. **MUST** — public catalog queries enforce approved-only at SQL/domain ([INV-03](../02_domain_model/domain_invariants.md)).
3. **MUST NOT** — expose trainer `pending` documents in public API.
4. **SHOULD** — audit_log on admin mutations (schema-ready).
5. **MUST** — client never reads `trainer_client_note` content.

---

## Acceptance criteria

- [ ] All MVP routes from canonical_routes covered in perimeter table
- [ ] All mutating use-cases from use_cases_index mapped to resource table
- [ ] FM-004, FM-005, FM-016 explicitly tied to rows
- [ ] No duplicate full route list outside canonical_routes
- [ ] Guest/client/trainer/admin columns complete for MVP resources

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`canonical_routes.md`](../../design/canonical_routes.md) | Route inventory |
| [`pages_functional_spec.md`](../01_product_scope/pages_functional_spec.md) | Page-level auth UX |
| [`policy_enforcement_contract.md`](./policy_enforcement_contract.md) | Where matrix is enforced |
| [`privacy_data_handling.md`](./privacy_data_handling.md) | Private notes, PII |
| [`adr_003_auth_credentials_jwt_rbac.md`](../07_governance/adr_003_auth_credentials_jwt_rbac.md) | JWT RBAC |
| [`../02_domain_model/use_cases_index.md`](../02_domain_model/use_cases_index.md) | Use-case names |
| [`../02_domain_model/failure_modes_catalog.md`](../02_domain_model/failure_modes_catalog.md) | FM index |
| [`../../implementation/mvp/contracts/authorization_policy_contract.md`](../../implementation/mvp/contracts/authorization_policy_contract.md) | W8 implementation |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W5-02

---

## Agent notes

- ✅* = always verify `userId` / `trainer_profile.user_id` / `booking.client_id` in policy-server.
- Do not add `/api/*` routes without matrix row + ADR if security-sensitive.
- Lampto matrix — pattern only; Pulse roles and resources differ.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — MVP authorization matrix (route + resource) |
