# database_schema_v1 — PostgreSQL (Neon) Canonical Schema v1 for Pulse

**Stack:** Next.js **16.2.6** on Vercel + Neon PostgreSQL 17 + Prisma v7 + Vercel Cron jobs  
**Runtime:** [ADR-002](../07_governance/adr_002_next162_vercel_runtime_policy.md)
**Based on:** [`fitness-platform-mvp.md`](../../default_docs/fitness-platform-mvp.md), [`fitness-platform-pages.md`](../../default_docs/fitness-platform-pages.md), user flows in [`../01_product_scope/user_flows/users_mvp/`](../01_product_scope/user_flows/users_mvp/), [`canonical_routes.md`](../../design/canonical_routes.md), [ADR-001](../07_governance/adr_001_stack_and_runtime.md)  
**Version:** 1.0 | Date: 2026-05-23  
**Status:** canonical domain schema for MVP + post-MVP nullable fields

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md) — этот файл является каноном DDL для `packages/db`. При scaffold Prisma schema должна соответствовать этому документу.

> **v1 purpose:** зафиксировать доменную модель маркетплейса фитнес-тренеров (discovery, booking без оплаты, trainer verification, admin moderation) как **управляемый инженерный контракт**, наследуя слоистую структуру из lampto [`database_schema_v3.md`](../../examples/lampto/docs/prds/03_data_model/database_schema_v3.md).

---

## Доменная карта (обзор)

### 0.A Стратификация схемы

1. **Canonical Domain Layer** — полная модель MVP + post-MVP nullable поля.
2. **MVP Core Physical Layer** — таблицы первой миграционной волны.
3. **Reserved / Deferred** — сущности, не обязательные в первом rollout UI, но допустимые в схеме.

### 0.B Карта доменов

| # | Домен | Таблицы | Deployment wave |
|---|-------|---------|-----------------|
| 1 | Identity / Auth | `user`, `password_reset_token` | Wave 1 (MVP Core) |
| 2 | Trainer profile | `trainer_profile`, `trainer_specialization`, `trainer_certificate`, `verification_document` | Wave 1 |
| 3 | Services & catalog | `trainer_service`, `specialization` (lookup) | Wave 1 |
| 4 | Schedule | `trainer_weekly_interval`, `trainer_schedule_exception` | Wave 1 |
| 5 | Booking | `booking`, `wishlist` | Wave 1 |
| 6 | Reviews | `review` | Wave 1 |
| 7 | Trainer ↔ Client | `trainer_client_note` | Wave 1 |
| 8 | Admin moderation | `complaint`, `refund_request` | Wave 1 |
| 9 | Media | `file_asset` | Wave 1 (schema-ready) |
| 10 | Ops | `job_execution`, `delivery_log`, `audit_log` | Wave 1 (минимально) |
| 11 | Payments / Video | nullable columns on `booking`, `trainer_profile` | Wave 1 schema (dormant) |

### 0.C MVP Core — первая миграция

**Обязательно в Wave 1:**

- `user`, `password_reset_token`
- `trainer_profile`, `trainer_specialization`, `trainer_certificate`, `verification_document`
- `specialization`, `trainer_service`
- `trainer_weekly_interval`, `trainer_schedule_exception`
- `booking`, `wishlist`
- `review`, `trainer_client_note`
- `complaint`, `refund_request`
- `file_asset`
- `job_execution`, `delivery_log`, `audit_log`

**Post-MVP columns (nullable, без UI на MVP):**

- `trainer_profile.stripe_account_id`
- `booking.stripe_payment_intent_id`, `booking.stripe_refund_id`
- `booking.daily_room_name`, `booking.daily_room_url`
- `refund_request.stripe_refund_id`

### 0.D Как читать этот документ

- SQL-канон — snake_case таблицы в PostgreSQL.
- Prisma — PascalCase модели с `@@map("table_name")`.
- Auth.js v5: модель `User` маппится на `user`; JWT session strategy — **без** таблицы `Session` на MVP.
- Если инвариант невозможно выразить в SQL — он фиксируется здесь и реализуется в `packages/domain` + `packages/policy/server`.

---

## 0) Глобальные принципы

### 0.1 Типы и идентификаторы

- PK публичных сущностей — `uuid` (`gen_random_uuid()`).
- Время — `timestamptz` (UTC). Локальные «дни тренера» — `date` в TZ `trainer_profile.timezone`.
- Деньги — `integer` cents + `currency char(3) DEFAULT 'USD'` (MVP: одна валюта; multi-currency — post-MVP).
- Обязательные NOT NULL там, где null семантически неверен.

### 0.2 Инварианты (нельзя нарушать)

1. **`trainer_profile.timezone` (IANA)** — единственный источник истины для weekly schedule, slot generation, reminders, display клиенту. Не использовать timezone Vercel/UTC по умолчанию для бизнес-логики расписания. **Governance:** [ADR-004](../07_governance/adr_004_timezone_scheduling_model.md).

2. **Booking lifecycle** — переходы `pending` → `confirmed` → `completed` / `cancelled` только через documented use-cases в `packages/domain`. Прямой UPDATE из UI — баг.

3. **Trainer verification** — публичный listing и приём бронирований только при `trainer_profile.status = approved`.

4. **Slot uniqueness** — один активный booking не может пересекаться по времени с другим non-cancelled booking того же тренера (проверка в domain + partial unique index где возможно).

5. **Review immutability** — один review на booking; после publish не редактируется (только admin hide/delete).

6. **Idempotency jobs (post-MVP runtime)** — при включении email каждый send имеет `idempotency_key` UNIQUE в `delivery_log`; повторный запуск молча пропускается. **MVP:** таблицы `job_execution`, `delivery_log` в DDL, приложение **не** пишет delivery rows — см. [`mvp_scope.md`](../01_product_scope/mvp_scope.md).

7. **Post-MVP readiness** — Stripe/Daily.co поля nullable с первого дня; включение фичи не требует breaking DDL.

### 0.3 Prisma v7 + Neon (runtime)

Per Prisma v7 docs (Context7, May 2026):

- Runtime queries: pooled `DATABASE_URL` (Neon pgBouncer).
- Migrations CLI: `DIRECT_URL` в `prisma.config.ts` → `datasource.url` для migrate deploy.
- `url`, `directUrl` в `schema.prisma` datasource block — deprecated; конфигурация в `prisma.config.ts`.

```typescript
// packages/db/prisma.config.ts (target)
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: env("DIRECT_URL") }, // migrations
});
// Prisma Client at runtime uses DATABASE_URL (pooled) via driver adapter
```

---

## 1) Identity / Auth

### 1.1 Enums

```sql
CREATE TYPE user_role AS ENUM ('client', 'trainer', 'admin');
CREATE TYPE ui_theme AS ENUM ('light', 'dark', 'system');
```

### 1.2 user

```sql
-- Единая учётная запись. role хранится здесь для MVP Credentials + JWT.
-- password_hash: bcrypt (cost 12). NULL только для post-MVP OAuth-only accounts.
CREATE TABLE "user" (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text UNIQUE NOT NULL,
  email_verified  timestamptz,
  full_name       text NOT NULL,
  password_hash   text,
  role            user_role NOT NULL DEFAULT 'client',
  locale          text NOT NULL DEFAULT 'en',
  ui_theme        ui_theme NOT NULL DEFAULT 'system',
  avatar_url      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_role ON "user"(role);
```

**Prisma note:** `model User { @@map("user") }`. Auth.js Credentials: `authorize()` читает `passwordHash`, кладёт `role` в JWT callback.

### 1.3 password_reset_token

```sql
-- Schema-ready. MVP: forgot-password email flow NOT implemented (post-MVP + Resend).
CREATE TABLE password_reset_token (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token_hash  text NOT NULL,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_user ON password_reset_token(user_id);
CREATE UNIQUE INDEX idx_password_reset_token_hash ON password_reset_token(token_hash);
```

---

## 2) Trainer profile & verification

### 2.1 Enums

```sql
CREATE TYPE trainer_status AS ENUM ('pending', 'approved', 'rejected');
```

### 2.2 trainer_profile

```sql
CREATE TABLE trainer_profile (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  status              trainer_status NOT NULL DEFAULT 'pending',
  timezone            text NOT NULL,  -- IANA, e.g. 'America/New_York'
  bio                 text,
  photo_url           text,
  experience_years    smallint CHECK (experience_years IS NULL OR experience_years >= 0),
  rating_avg          numeric(3,2) NOT NULL DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  rating_count        integer NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  submitted_at        timestamptz,
  reviewed_at         timestamptz,
  reviewed_by_id      uuid REFERENCES "user"(id) ON DELETE SET NULL,
  rejection_reason    text,
  -- Post-MVP (dormant)
  stripe_account_id   text UNIQUE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trainer_profile_status ON trainer_profile(status);
CREATE INDEX idx_trainer_profile_rating ON trainer_profile(status, rating_avg DESC) WHERE status = 'approved';
```

**Invariant:** только `status = approved` попадает в public catalog и принимает bookings.

### 2.3 specialization (lookup)

```sql
CREATE TABLE specialization (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug  text UNIQUE NOT NULL,  -- cardio, pilates, strength, hiit, ...
  name  text NOT NULL
);
```

### 2.4 trainer_specialization

```sql
CREATE TABLE trainer_specialization (
  trainer_profile_id  uuid NOT NULL REFERENCES trainer_profile(id) ON DELETE CASCADE,
  specialization_id   uuid NOT NULL REFERENCES specialization(id) ON DELETE RESTRICT,
  PRIMARY KEY (trainer_profile_id, specialization_id)
);
```

### 2.5 trainer_certificate

```sql
-- Сертификаты в профиле (публичные после approval).
CREATE TABLE trainer_certificate (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_profile_id  uuid NOT NULL REFERENCES trainer_profile(id) ON DELETE CASCADE,
  title               text NOT NULL,
  file_asset_id       uuid,  -- FK added after file_asset
  sort_order          smallint NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trainer_certificate_profile ON trainer_certificate(trainer_profile_id);
```

### 2.6 verification_document

```sql
-- Документы заявки на верификацию (admin-only до решения).
CREATE TABLE verification_document (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_profile_id  uuid NOT NULL REFERENCES trainer_profile(id) ON DELETE CASCADE,
  doc_type            text NOT NULL,  -- certificate, id_document, experience_proof
  file_asset_id       uuid NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_doc_profile ON verification_document(trainer_profile_id);
```

---

## 3) Services

### 3.1 trainer_service

```sql
CREATE TABLE trainer_service (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_profile_id  uuid NOT NULL REFERENCES trainer_profile(id) ON DELETE CASCADE,
  name                text NOT NULL,
  description         text,
  duration_minutes    smallint NOT NULL CHECK (duration_minutes > 0),
  price_cents         integer NOT NULL CHECK (price_cents >= 0),
  currency            char(3) NOT NULL DEFAULT 'USD',
  is_active           boolean NOT NULL DEFAULT true,
  sort_order          smallint NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trainer_service_profile_active ON trainer_service(trainer_profile_id, is_active);
```

**Snapshot rule:** при создании booking копировать `duration_minutes`, `price_cents`, `currency`, `name` в booking — изменение услуги не меняет историю.

---

## 4) Schedule

### 4.1 trainer_weekly_interval

```sql
-- Интервалы рабочего дня в локальном времени тренера (trainer_profile.timezone).
-- day_of_week: 0 = Monday .. 6 = Sunday (ISO-style, application convention).
CREATE TABLE trainer_weekly_interval (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_profile_id  uuid NOT NULL REFERENCES trainer_profile(id) ON DELETE CASCADE,
  day_of_week         smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time          time NOT NULL,
  end_time            time NOT NULL CHECK (end_time > start_time),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_weekly_interval_profile_day ON trainer_weekly_interval(trainer_profile_id, day_of_week);
```

### 4.2 trainer_schedule_exception

```sql
CREATE TABLE trainer_schedule_exception (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_profile_id  uuid NOT NULL REFERENCES trainer_profile(id) ON DELETE CASCADE,
  exception_date      date NOT NULL,
  is_blocked          boolean NOT NULL DEFAULT true,
  reason              text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trainer_profile_id, exception_date)
);
```

**Slot generation:** materialize available slots from weekly intervals minus exceptions minus existing bookings — в `packages/domain`, не ad-hoc в UI.

---

## 5) Booking & wishlist

### 5.1 Enums

```sql
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
```

### 5.2 booking

```sql
CREATE TABLE booking (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id               uuid NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  trainer_profile_id      uuid NOT NULL REFERENCES trainer_profile(id) ON DELETE RESTRICT,
  trainer_service_id      uuid NOT NULL REFERENCES trainer_service(id) ON DELETE RESTRICT,
  status                  booking_status NOT NULL DEFAULT 'pending',
  starts_at               timestamptz NOT NULL,
  duration_minutes        smallint NOT NULL CHECK (duration_minutes > 0),
  price_cents             integer NOT NULL CHECK (price_cents >= 0),
  currency                char(3) NOT NULL DEFAULT 'USD',
  service_name_snapshot   text NOT NULL,
  client_message          text,
  cancelled_at            timestamptz,
  cancelled_by_id         uuid REFERENCES "user"(id) ON DELETE SET NULL,
  completed_at            timestamptz,
  completed_by_id         uuid REFERENCES "user"(id) ON DELETE SET NULL,
  -- Post-MVP (dormant)
  stripe_payment_intent_id text UNIQUE,
  stripe_refund_id         text,
  daily_room_name          text,
  daily_room_url           text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_client_status ON booking(client_id, status, starts_at DESC);
CREATE INDEX idx_booking_trainer_starts ON booking(trainer_profile_id, starts_at) WHERE status NOT IN ('cancelled');
CREATE INDEX idx_booking_trainer_day ON booking(trainer_profile_id, starts_at);
```

**MVP flow:** booking создаётся как `pending` (без оплаты). Trainer confirms → `confirmed`. Trainer marks done → `completed` → review prompt.

**Cancellation policy:** client may cancel if > 24h before `starts_at` — enforced in domain, not DB.

### 5.3 wishlist

```sql
CREATE TABLE wishlist (
  client_id           uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  trainer_profile_id  uuid NOT NULL REFERENCES trainer_profile(id) ON DELETE CASCADE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, trainer_profile_id)
);

CREATE INDEX idx_wishlist_trainer ON wishlist(trainer_profile_id);
```

---

## 6) Reviews

### 6.1 review

```sql
CREATE TABLE review (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid UNIQUE NOT NULL REFERENCES booking(id) ON DELETE RESTRICT,
  client_id           uuid NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  trainer_profile_id  uuid NOT NULL REFERENCES trainer_profile(id) ON DELETE RESTRICT,
  rating              smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body                text NOT NULL CHECK (char_length(body) BETWEEN 20 AND 500),
  is_hidden           boolean NOT NULL DEFAULT false,
  hidden_by_id        uuid REFERENCES "user"(id) ON DELETE SET NULL,
  hidden_at           timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_trainer_visible ON review(trainer_profile_id, created_at DESC) WHERE is_hidden = false;
```

**Trigger/application:** после INSERT review — пересчёт `trainer_profile.rating_avg` / `rating_count` в transaction.

---

## 7) Trainer client notes

### 7.1 trainer_client_note

```sql
-- Приватные заметки тренера о клиенте (auto-save на blur).
CREATE TABLE trainer_client_note (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_profile_id  uuid NOT NULL REFERENCES trainer_profile(id) ON DELETE CASCADE,
  client_id           uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  notes               text NOT NULL DEFAULT '',
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trainer_profile_id, client_id)
);
```

---

## 8) Admin moderation

### 8.1 Enums

```sql
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE complaint_status AS ENUM ('open', 'in_review', 'closed');
CREATE TYPE complaint_resolution AS ENUM (
  'no_action',
  'warning_to_trainer',
  'refund_recommended',
  'duplicate',
  'spam'
);
CREATE TYPE refund_status AS ENUM ('pending', 'approved', 'rejected');
```

### 8.2 complaint

```sql
CREATE TABLE complaint (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id         uuid NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  target_trainer_id   uuid REFERENCES trainer_profile(id) ON DELETE SET NULL,
  target_booking_id   uuid REFERENCES booking(id) ON DELETE SET NULL,
  priority            complaint_priority NOT NULL DEFAULT 'medium',
  status              complaint_status NOT NULL DEFAULT 'open',
  resolution          complaint_resolution,
  reason              text NOT NULL,
  admin_notes         text,
  resolved_by_id      uuid REFERENCES "user"(id) ON DELETE SET NULL,
  resolved_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_complaint_status_priority ON complaint(status, priority, created_at DESC);
```

### 8.3 refund_request

```sql
-- MVP: ручная обработка admin; статус в БД без Stripe refund.
CREATE TABLE refund_request (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid NOT NULL REFERENCES booking(id) ON DELETE RESTRICT,
  client_id           uuid NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  amount_cents        integer NOT NULL CHECK (amount_cents >= 0),
  currency            char(3) NOT NULL DEFAULT 'USD',
  status              refund_status NOT NULL DEFAULT 'pending',
  reason              text,
  admin_comment       text,
  processed_by_id     uuid REFERENCES "user"(id) ON DELETE SET NULL,
  processed_at        timestamptz,
  stripe_refund_id    text UNIQUE,  -- post-MVP
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_refund_status ON refund_request(status, created_at DESC);
```

---

## 9) Media (AWS S3)

**Pattern:** upload → `pending` → client PUT to S3 (presigned) → HeadObject confirm → mark `ready`. FK from certificates/documents after ready.

**Object key:** `{FILE_UPLOAD_OBJECT_KEY_PREFIX}{ownerUserId}/{purpose}/{uuid}` — prefix constant `pulse/` in `@pulse/domain`. Stored in `blob_pathname`.

### 9.1 file_asset

```sql
CREATE TYPE file_upload_status AS ENUM ('pending', 'ready', 'failed');

CREATE TABLE file_asset (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  blob_url        text,
  blob_pathname   text NOT NULL,
  mime_type       text NOT NULL,
  size_bytes      integer CHECK (size_bytes IS NULL OR size_bytes >= 0),
  upload_status   file_upload_status NOT NULL DEFAULT 'pending',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_file_asset_owner ON file_asset(owner_user_id);
```

---

## 10) Ops

### 10.1 Enums

```sql
CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE delivery_channel AS ENUM ('email');
CREATE TYPE delivery_status AS ENUM ('pending', 'sent', 'failed');
```

### 10.2 job_execution

```sql
CREATE TABLE job_execution (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key  text UNIQUE NOT NULL,
  job_type         text NOT NULL,  -- booking_reminder_24h, registration_email, ...
  status           job_status NOT NULL DEFAULT 'pending',
  payload_json     jsonb,
  error            text,
  started_at       timestamptz,
  finished_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_status_type ON job_execution(status, job_type);
```

### 10.3 delivery_log

```sql
-- Resend delivery tracking. idempotency_key prevents duplicate emails.
CREATE TABLE delivery_log (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key      text UNIQUE NOT NULL,
  channel              delivery_channel NOT NULL DEFAULT 'email',
  user_id              uuid REFERENCES "user"(id) ON DELETE SET NULL,
  booking_id           uuid REFERENCES booking(id) ON DELETE SET NULL,
  target               text,  -- email — PII, retention policy required
  template_key         text NOT NULL,
  provider_message_id  text,
  status               delivery_status NOT NULL DEFAULT 'pending',
  error                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_delivery_user_created ON delivery_log(user_id, created_at DESC);
CREATE INDEX idx_delivery_booking ON delivery_log(booking_id);
```

**Email events (post-MVP):** E-01–E-09 — [`email_notifications_matrix.md`](../01_product_scope/email_notifications_matrix.md). **MVP:** DDL only; in-app UX per [`mvp_scope.md`](../01_product_scope/mvp_scope.md).

### 10.4 audit_log

```sql
CREATE TABLE audit_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  uuid REFERENCES "user"(id) ON DELETE SET NULL,
  action         text NOT NULL,  -- TRAINER_APPROVED, BOOKING_CANCELLED, REVIEW_HIDDEN, ...
  target_type    text NOT NULL,
  target_id      uuid NOT NULL,
  metadata_json  jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor_created ON audit_log(actor_user_id, created_at DESC);
CREATE INDEX idx_audit_target ON audit_log(target_type, target_id);
```

---

## 11) FK completion (file_asset)

```sql
ALTER TABLE trainer_certificate
  ADD CONSTRAINT fk_trainer_certificate_file
  FOREIGN KEY (file_asset_id) REFERENCES file_asset(id) ON DELETE SET NULL;

ALTER TABLE verification_document
  ADD CONSTRAINT fk_verification_document_file
  FOREIGN KEY (file_asset_id) REFERENCES file_asset(id) ON DELETE RESTRICT;
```

---

## 12) Prisma mapping summary (target)

| SQL table | Prisma model | Notes |
|-----------|--------------|-------|
| `user` | `User` | `passwordHash`, `role`, Auth.js integration |
| `trainer_profile` | `TrainerProfile` | **`timezone`** invariant |
| `booking` | `Booking` | status enum, snapshots |
| `delivery_log` | `DeliveryLog` | idempotency |
| … | … | all tables `@@map` |

Package: `packages/db/prisma/schema.prisma` — единственное DDL в репозитории.

---

## 13) Wave 1 migration checklist

```
[x] All enums created
[x] user + password_reset_token
[x] trainer_profile + specializations + certificates + verification_document
[x] trainer_service
[x] trainer_weekly_interval + trainer_schedule_exception
[x] booking + wishlist
[x] review + trainer_client_note
[x] complaint + refund_request
[x] file_asset + FKs
[x] job_execution + delivery_log + audit_log
[x] Nullable Stripe/Daily.co columns present
[x] Seed: admin@pulse.dev, client@pulse.dev, 3 approved trainers + pending (see seed_data_spec.md)
[x] prisma migrate deploy on Neon via DIRECT_URL
```

---

## 14) Related documents

| Document | Purpose |
|----------|---------|
| [`ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md) | Doc hierarchy, agent cycle |
| [`02_domain_model/README.md`](../02_domain_model/README.md) | Domain layer entry |
| [`lifecycle_models.md`](../02_domain_model/lifecycle_models.md) | Booking/verification state machines |
| [`failure_modes_catalog.md`](../02_domain_model/failure_modes_catalog.md) | FM-xxx race/security index |
| [`domain_invariants.md`](../02_domain_model/domain_invariants.md) | INV-01 … cross-schema rules |
| [`data_access_patterns.md`](./data_access_patterns.md) | Hot path query patterns |
| [`indexing_strategy.md`](./indexing_strategy.md) | Index canon + Wave 1 additions |
| [`seed_data_spec.md`](./seed_data_spec.md) | Dev/CI seed fixtures |
| [`adr_004_timezone_scheduling_model.md`](../07_governance/adr_004_timezone_scheduling_model.md) | Timezone & schedule ADR |
| [`adr_007_file_asset_blob_lifecycle.md`](../07_governance/adr_007_file_asset_blob_lifecycle.md) | `file_asset` + S3 |
| [`../06_operations/migration_runbook.md`](../06_operations/migration_runbook.md) | Migrate deploy procedures (W12) |
| [`../../implementation/mvp/guides/neon_prisma_migrations_guide.md`](../../implementation/mvp/guides/neon_prisma_migrations_guide.md) | Neon + Prisma how-to |
| Lampto reference | [`database_schema_v3.md`](../../examples/lampto/docs/prds/03_data_model/database_schema_v3.md) |

---

*Schema v1 derived from Pulse MVP product docs and lampto schema layering pattern. Update this file when DDL changes — same PR as Prisma migration.*
