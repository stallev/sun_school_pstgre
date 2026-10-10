# Fitness Platform — MVP Functional Scope

## Overview

Online marketplace connecting fitness trainers with clients. Supports session discovery, booking, and training management.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js **16.2.6** App Router, TypeScript | Vercel-optimised — [ADR-002](../prds/07_governance/adr_002_next162_vercel_runtime_policy.md) |
| Hosting | **Vercel** | Preview deployments из каждого PR |
| Auth | **Auth.js v5**, Credentials (email + password) | JWT strategy |
| ORM | **Prisma v7** | directUrl для миграций, pooled URL для runtime |
| Database | **PostgreSQL v17 on Neon** | pgBouncer pooling для serverless |
| UI | Shadcn UI + Tailwind CSS v4 | Dark mode через CSS vars |
| Fonts | Source Serif 4 · Manrope · JetBrains Mono | next/font/google |
| Storage | AWS S3 | Фото профилей, сертификаты, verification docs |
| Email | Resend | Транзакционные письма |
| Video | Daily.co | **Post-MVP** |
| Payments | Stripe Connect | **Post-MVP** |

---

## Roles

- **Client** — ищет и бронирует тренеров, управляет сессиями
- **Trainer** — управляет профилем, услугами, расписанием и клиентами
- **Admin** — модерирует платформу: верификации, жалобы, возвраты

---

## Authentication (MVP)

- Email + password через Auth.js v5 Credentials provider
- Пароль: bcrypt hash хранится в поле `passwordHash` на `User`
- Role (`client` | `trainer` | `admin`) хранится в JWT token и session
- Middleware защищает маршруты по роли
- Seed script создаёт пользователей всех ролей для разработки
- Password reset через email (Resend) — MVP
- OAuth Google — **Post-MVP**

---

## Global UI Shell

- **Top Bar**: Logo, Language toggle (EN/RU), Dark/Light mode, Notifications popover, User avatar
- **Mobile (< 768px)**: Sticky Bottom Navigation (`md:hidden`)
- **Desktop (≥ 768px)**: Sticky Sidebar Navigation (`hidden md:flex`)
- Toast уведомления для всех мутаций

---

## Client — MVP

### Discovery & Booking
- Dashboard: приветствие, next session card, search bar, категории, топ тренеры, stats
- Каталог тренеров: фильтры (специализация, цена, рейтинг), сортировка, пагинация
- Профиль тренера: hero, tabs (About / Services / Schedule / Reviews), sticky CTA
- Wishlist / избранное (toggle, optimistic)
- Inline weekly schedule с выбором слота → booking flow
- 3-step booking flow: Service → Time slot → Confirm + message
- Booking создаётся со статусом `pending` (без оплаты на MVP)

### Управление
- История бронирований: Upcoming / Past / Cancelled tabs
- Отмена бронирования (до 24h)
- Оставить отзыв (rating + текст, только для completed)
- Профиль: настройки, безопасность, выход

---

## Trainer — MVP

### Профиль и услуги
- Публичный профиль: фото, bio, специализации, опыт, сертификаты, verified badge
- Status banner «Under review» до одобрения
- Управление услугами: CRUD + active/hidden toggle
- Редактирование профиля (bio, specs, сертификаты)

### Расписание
- Недельное расписание: включить/выключить день, управлять слотами
- Исключения (mini-calendar): блокировка дат

### Клиенты
- Список клиентов с поиском
- Приватные заметки по каждому клиенту (auto-save)

### Дашборд и доходы
- KPI: sessions, active clients, income, rating
- Сегодняшние сессии + последние отзывы
- История доходов (суммы без Stripe)

---

## Admin — MVP

- Overview dashboard с KPI и «Needs attention»
- Верификация тренеров: очередь Pending / Approved / Rejected, approval sheet
- Жалобы: список с приоритетами, смена статуса
- Возвраты: ручная обработка (approve/reject меняет статус в БД, не Stripe)
- Модерация отзывов: hide / delete

---

## Core Flows (MVP)

**Booking**: Search → Profile → Select service → Pick slot → Confirm → pending booking → email notifications

**Trainer onboarding**: Register → Multi-step profile → Submit → Admin approval → Go live

**Session lifecycle (manual MVP)**: Тренер отмечает сессию завершённой → клиент получает prompt для отзыва

---

## Email Notifications (Resend)

| Event | Recipient |
|---|---|
| Registration | Client / Trainer |
| Trainer app received | Trainer |
| App approved / rejected | Trainer |
| Booking confirmed | Client + Trainer |
| Reminder 24h | Client + Trainer |
| Session completed | Client + review request |

---

## Out of Scope (Post-MVP)

| Feature | Причина отложить |
|---|---|
| Video sessions (Daily.co) | Инфраструктура, room provisioning |
| Online payments (Stripe Connect) | Onboarding, webhooks, PCI compliance |
| Stripe refunds | Зависит от payment integration |
| Platform fee calculation | Зависит от payment |
| In-session chat | Зависит от video |
| No-show auto-refund | Зависит от video + payment |
| OAuth (Google) | Не критично для MVP |
| Subscription plans | Бизнес-решение post-validation |
| Multi-currency | Post product-market fit |
| Trainer analytics | Post product-market fit |

> **Важно**: все Post-MVP таблицы и поля (Stripe, Daily.co) **уже присутствуют** в схеме БД как nullable — запуск фичи не требует новых DDL-миграций.
