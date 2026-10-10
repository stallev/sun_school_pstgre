# Privacy & Data Handling — Pulse MVP

**Тип:** PRD  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W5  
**Зависит от:** [`authorization_matrix.md`](./authorization_matrix.md), [`database_schema_v1.md`](../03_data_model/database_schema_v1.md)  
**Связанные документы:** [`policy_enforcement_contract.md`](./policy_enforcement_contract.md), [`../01_product_scope/mvp_scope.md`](../01_product_scope/mvp_scope.md)

---

## Purpose

Классификация данных Pulse MVP, правила видимости по ролям, retention boundaries и privacy-adjacent product rules. Дополняет [`authorization_matrix.md`](./authorization_matrix.md) ответами «какие поля показывать» и «что нельзя раскрывать». Не заменяет legal GDPR compliance (post-MVP formalization).

---

## Scope / Out of scope

**In scope:** PII в schema v1, trainer private notes, verification documents, public vs authenticated fields, MVP data minimization.

**Out of scope:** Cookie banner legal text, DPA with Vercel/Neon, account deletion flow (post-MVP — lampto reference pattern), cross-border data residency beyond Vercel fra1 + Neon region choice.

---

## Definitions

| Class | Examples | Default visibility |
|-------|----------|-------------------|
| **Public** | Trainer bio, services, public reviews, rating | Anonymous + all roles |
| **Authenticated self** | Own email, bookings, wishlist | Owner only |
| **Role-scoped** | Trainer's client list aggregates | Trainer owner + admin |
| **Private (trainer-only)** | `trainer_client_note` body | Trainer owner + admin; **never client** |
| **Sensitive admin** | Verification documents, complaint evidence | Admin + owning trainer (own docs) |
| **Internal** | `password_hash`, `password_reset_token`, cron secrets | Never exposed to UI/API |

---

## Data inventory (MVP tables)

| Table / field | Class | guest | client | trainer | admin |
|---------------|-------|:-----:|:------:|:-------:|:-----:|
| `user.email`, `full_name` | Authenticated self | — | own | own | all (support) |
| `user.password_hash` | Internal | ❌ | ❌ | ❌ | ❌ |
| `trainer_profile.bio`, `photo_url` | Public* | 🔒 | 🔒 | own edit | read |
| `trainer_profile.status` | Role-scoped | hidden | hidden | own | all |
| `verification_document.*` | Sensitive admin | ❌ | ❌ | own upload | review |
| `trainer_client_note.note` | Private | ❌ | ❌ | own | read |
| `booking` snapshot fields | Authenticated self | ❌ | own | trainer's | admin |
| `complaint.description` | Sensitive admin | ❌ | own file | ❌ | all |
| `file_asset.blob_url` | Varies | ❌ | own | own | moderation |
| `audit_log` | Internal | ❌ | ❌ | ❌ | read |

\*Public only when `trainer_profile.status = approved`.

---

## Requirements

1. **MUST** — client **MUST NOT** receive `trainer_client_note` content in any API/RSC payload ([`authorization_matrix`](./authorization_matrix.md)).
2. **MUST** — public catalog responses exclude `user.email`, internal IDs except public trainer profile id.
3. **MUST** — verification documents visible to admin and uploading trainer only until approved; not on public profile tabs.
4. **MUST** — booking detail for client shows trainer contact fields allowed by product (name, no private email unless product adds — MVP: in-app only).
5. **MUST NOT** — log passwords, reset tokens, or `CRON_SECRET` in application logs.
6. **SHOULD** — avatar/certificate URLs use non-guessable S3 object keys with project prefix ([ADR-007](../07_governance/adr_007_file_asset_blob_lifecycle.md)).
7. **MAY** — admin views full user email for moderation; audit optional.

---

## Happy paths

- Client views approved trainer public profile — bio, services, reviews only.
- Trainer opens `/trainer/clients/[id]` — sees booking history + private notes (self-authored).
- Admin opens verification queue — sees documents + applicant PII for decision.
- Client views own `/client/bookings/[id]` — no other client's data.

---

## Negative paths

| Scenario | Expected |
|----------|----------|
| Client API tamper `trainerId` on notes endpoint | Deny; FM-016 |
| Scrape pending trainer email via catalog | Not in public DTO |
| Direct Blob URL without auth for private cert | Deny or signed URL policy (W8 file contract) |
| Export admin list to client role | Deny FM-005 |

---

## Security paths

| Threat | Mitigation | FM |
|--------|------------|-----|
| IDOR on booking/notes | policy-server ownership | FM-004, FM-016 |
| PII in public RSC props | DTO mappers in apps/web | — |
| Password hash leak | Never select in queries; Internal class | — |
| JWT payload overshare | Role + id only in token | ADR-003 |

---

## Concurrency & races

Privacy rules apply per-request; no special race beyond authorization matrix. Concurrent note auto-save **SHOULD** last-write-wins with updated_at display (trainer UX).

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Prisma `include` pulls notes to client page | Code review; explicit select DTOs |
| Public profile shows pending certs | Query filter + FM-012 |
| Email in toast/console | Use `@/lib/messages`; no email in client logs |
| Schema adds phone field | Update this doc + matrix same PR |

---

## Retention (MVP)

| Data | MVP policy |
|------|------------|
| Bookings, reviews | Retain for product history |
| `password_reset_token` | Expire per `expires_at`; unused cleanup post-MVP job |
| `file_asset` failed uploads | Orphan cleanup post-MVP ([FM-012](../02_domain_model/failure_modes_catalog.md#fm-012)) |
| `delivery_log` | Empty on MVP runtime ([INV-12](../02_domain_model/domain_invariants.md)) |

Account deletion / export — **post-MVP**; follow lampto layered pattern when scoped.

---

## Acceptance criteria

- [ ] All sensitive MVP tables classified
- [ ] trainer_client_note client deny explicit
- [ ] Links to authorization_matrix and schema v1
- [ ] Security IDOR paths reference FM-004/FM-016
- [ ] No legal claims beyond product technical rules

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`authorization_matrix.md`](./authorization_matrix.md) | Access control |
| [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) | DDL source |
| [`adr_007_file_asset_blob_lifecycle.md`](../07_governance/adr_007_file_asset_blob_lifecycle.md) | Blob privacy |
| [`../02_domain_model/use_cases_index.md`](../02_domain_model/use_cases_index.md) | UpsertTrainerClientNote |
| [`../../implementation/mvp/contracts/file_upload_contract.md`](../../implementation/mvp/contracts/file_upload_contract.md) | W8 uploads |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W5-04

---

## Agent notes

- DTO types in `apps/web` — separate `PublicTrainerProfile` vs `TrainerProfileOwnerView`.
- Wireframes W10 trainer client detail must not show notes preview to wrong role.
- GDPR formal DPIA — out of MVP doc scope.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — MVP privacy classification |
