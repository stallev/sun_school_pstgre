# 01 — Архитектура проекта Pulse: общий обзор

**Дата:** 2026-05-23  
**Стек MVP:** Next.js **16.2.6** (Vercel) + Neon PostgreSQL + Prisma v7 + Resend + **AWS S3**  
**Runtime:** [ADR-002](../prds/07_governance/adr_002_next162_vercel_runtime_policy.md) — `proxy.ts`, async APIs
**Референс:** этот snapshot самодостаточен. Исторический notice: [`lampto_project_reference.md`](../reference/lampto_project_reference.md) (дерева `docs/examples/lampto/` нет).

---

## 1) Что мы строим

**Pulse** — онлайн-маркetplace, соединяющий клиентов с фитнес-тренерами.

Три роли:

| Роль | Задачи в MVP |
|------|----------------|
| **Client** | Поиск тренеров, wishlist, бронирование слотов, управление сессиями, отзывы |
| **Trainer** | Профиль, услуги, расписание, клиенты, доходы (без Stripe на MVP) |
| **Admin** | Верификация тренеров, жалобы, возвраты (ручные), модерация отзывов |

Подробнее: [`fitness-platform-mvp.md`](../default_docs/fitness-platform-mvp.md), user flows в [`default_docs/`](../default_docs/).

**Визуальный эталон:** [`Fitness_Platform_Prototype_v1.html`](../prototypes/Fitness_Platform_Prototype_v1.html) — Warm Forest / Material You.

---

## 2) Почему двухконтурный MVP (Web + Jobs)

Модель **двухконтурная** (Web + Jobs) — деталь в этом overview. Не следовать отсутствующему дереву `docs/examples/lampto/`.

### Контур A — Web (Vercel)

- UI + **тонкий BFF** (Route Handlers / Server Actions)
- быстрый time-to-market, preview deployments из PR
- Auth.js Credentials, role-based **`proxy.ts`** gate (Next.js 16.2.6)
- Neon + Prisma v7 с connection pooling для serverless

### Контур B — Jobs

На MVP:
- Таблицы **`job_execution`**, **`delivery_log`** в schema (готовность к email)
- **Без** Resend, Cron email и записей delivery на MVP — см. [`mvp_scope.md`](../prds/01_product_scope/mvp_scope.md)

Post-MVP:
- **Vercel Cron** + Resend + `idempotency_key` + `delivery_log` — [`email_notifications_matrix.md`](../prds/01_product_scope/email_notifications_matrix.md)

**Правило:** никакой batch email / reminder logic в request path (актуально при включении post-MVP email).

---

## 3) Главный «скелет» данных

- **Neon PostgreSQL 17** — единственный источник истины
- **Prisma v7** — единственное DDL (`packages/db`)
- Web и Jobs используют **один и тот же** domain / policy / db код

Post-MVP поля (Stripe Connect, Daily.co room IDs) — **nullable с первого дня**.

---

## 4) Monorepo — слои

```
apps/web          → HTTP/UI адаптер (тонкий)
apps/workers      → Cron/job адаптер (тонкий)
packages/domain   → use-cases, ports, pure rules
packages/policy   → edge (JWT) + server (Prisma ACL)
packages/db       → Prisma, repositories
```

**Запрещено:** `packages/domain` → `packages/db`; **`proxy.ts` / `middleware.ts`** → `policy/server`.

Эталон реализации слоёв **в этом snapshot:** booking / verification / email jobs — learning pack ниже. Не открывать `docs/examples/lampto/**`.

**Для Pulse:** layer walkthroughs — learning pack W13:

| Документ | Flow |
|----------|------|
| [`02_booking_lifecycle_layers.md`](./02_booking_lifecycle_layers.md) | Create / Confirm / Complete / Cancel booking |
| [`03_trainer_verification_layers.md`](./03_trainer_verification_layers.md) | Submit / approve / reject / revoke trainer |
| [`04_email_jobs_layers.md`](./04_email_jobs_layers.md) | Enqueue vs Cron worker (MVP schema-ready) |

---

## 5) Основные потоки данных

### 5.1 Discovery → Booking

```
Client UI → apps/web (BFF) → policy/server → domain (CreateBooking) → db → Neon
```

Статус booking на MVP: **`pending`** (без оплаты). Обратная связь: **toast + in-app**; email E-06 — post-MVP.

### 5.2 Trainer schedule → Available slots

```
Catalog/Profile UI → BFF → domain (GetAvailableSlots)
  → reads TrainerProfile.timezone + weekly schedule + exceptions
```

**Invariant:** `TrainerProfile.timezone` — единственный источник истины для слотов и отображения времени.

### 5.3 Trainer onboarding → Admin approval

```
Register (multi-step) → TrainerProfile status=pending
Admin approves → status=approved → public listing + booking enabled
```

### 5.4 Email reminders (24h) — post-MVP

```
Vercel Cron → workers handler → domain (EnqueueReminders)
  → idempotency_key per booking+type → Resend → delivery_log
```

Не реализуется на MVP; DDL `delivery_log` уже в schema.

---

## 6) Что важно не сломать (инварианты Pulse)

1. **`TrainerProfile.timezone`** — source of truth для расписания и уведомлений  
2. **Booking lifecycle** — только documented transitions в domain  
3. **Trainer verification** — публичный профиль только при `approved`  
4. **Jobs идемпотентны** — повторный cron не дублирует email  
5. **Post-MVP schema readiness** — Stripe/Daily nullable, no breaking DDL later  

---

## 7) UI и responsive (кратко)

- **Mobile-first**, breakpoints: md 768, lg 1024
- Mobile: Bottom Nav (`md:hidden`)
- Tablet+: Sidebar (`hidden md:flex`)
- Design tokens: Warm Forest — [`fitness-platform-design-system.md`](../default_docs/fitness-platform-design-system.md)
- Маршруты: [`canonical_routes.md`](../design/canonical_routes.md)

---

## 8) Когда выносить отдельный backend

Как в lampto — когда появляются:
- мобильный клиент / public API
- команда > 5–7 человек
- тяжёлая аналитика
- realtime (video chat post-MVP)

MVP строится так, чтобы шаг был **механическим**.

---

## 9) Architecture Learning Pack (W13)

| Документ | Задача |
|----------|--------|
| [`02_booking_lifecycle_layers.md`](./02_booking_lifecycle_layers.md) | Слои booking mutations (P03) |
| [`03_trainer_verification_layers.md`](./03_trainer_verification_layers.md) | Слои trainer moderation (P04–P05) |
| [`04_email_jobs_layers.md`](./04_email_jobs_layers.md) | Web vs jobs contour (P06 post-MVP) |

Дальше: [`implementation/mvp/phases_tasks_descriptions/P01_phase_description.md`](../implementation/mvp/phases_tasks_descriptions/P01_phase_description.md) + contracts для активной фазы.

---

## 10) Быстрые ссылки

| | |
|---|---|
| Методология | [`ai_first_project_methodology.md`](../meta/ai_first_project_methodology.md) |
| Карта архитектуры | [`architecture_master_index.md`](../prds/architecture_master_index.md) |
| Agent entry | [`AGENTS.md`](../../AGENTS.md) |
| Historical notice | [`lampto_project_reference.md`](../reference/lampto_project_reference.md) |
| [`authorization_matrix.md`](../prds/04_authorization_privacy/authorization_matrix.md) | Access control |
| [`backend_requirements.md`](../prds/05_runtime/backend_requirements.md) | Runtime detail |
| [`02_booking_lifecycle_layers.md`](./02_booking_lifecycle_layers.md) | Booking layer map |
| [`03_trainer_verification_layers.md`](./03_trainer_verification_layers.md) | Verification layer map |
| [`04_email_jobs_layers.md`](./04_email_jobs_layers.md) | Email jobs layer map |

---

*Architecture Learning Pack для Pulse (01 overview + W13 layer walkthroughs). Обновлять при существенных архитектурных изменениях.*
