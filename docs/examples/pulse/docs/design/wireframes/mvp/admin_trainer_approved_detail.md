# Wireframe: Admin Trainer Approved Detail (Operational)

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-25 | **Волна:** W10 / P18  
**Route:** `/admin/trainers/[id]` (when `trainer_profile.status = approved`) · **Prototype:** —

## Metadata

| Field | Value |
|-------|--------|
| **Route group** | `(admin)` |
| **Role** | `admin` |
| **Primary CTA** | «Открыть в каталоге» → `/trainers/[id]` (`CustomLink` / `Button variant="default"`) |
| **Secondary** | «Отозвать одобрение» (destructive outline → AlertDialog) |
| **Spec** | [`admin_people_ops_spec.md`](../../../implementation/mvp/specs/admin_people_ops_spec.md) |
| **Pending review wireframe** | [`admin_trainer_application.md`](./admin_trainer_application.md) (W10-25) — same URL, `status=pending` |

## Components

`TrainerApplicationProcessedBanner` (extend with review metadata), `TrainerApplicationProfileCard`, `TrainerApplicationServicesSection`, `TrainerApplicationDocumentsCard` (collapsible), `TrainerOperationalActivityPanel`, `RevokeTrainerDialog`, `CustomLink`, `StatusBadge`, `PulseCard`.

## Layout shell

| Breakpoint | Chrome |
|------------|--------|
| Mobile `< md` | TopBar + BottomNav (admin) + sticky secondary actions if needed |
| Desktop `≥ md` | TopBar + Sidebar + PageContainer |

## Regions (top → bottom)

1. **Header** — `← Назад` → `/admin/trainers?tab=approved`; `h1` «Заявка тренера» (reuse) or «Профиль тренера» when approved.
2. **Processed banner** — success Alert: «Заявка одобрена» + subline «Тренер одобрен» + **review line:** «Проверил: {adminName} · {relativeDate}».
3. **Profile card** — avatar, name, email, spec chips, status badge «Заявка одобрена», bio, timezone, experience (reuse W10-25 card).
4. **Activity panel** (`PulseCard`) — heading «Активность на платформе»:
   - Row: «Жалобы» — count chip + link → `/admin/complaints?trainer={id}` (or filtered list when available).
   - Row: «Предстоящие брони» — count + muted list preview (max 3) or «Нет предстоящих».
   - Row: «Публичный профиль» — external-style link preview.
5. **Services** — list (reuse existing section).
6. **Documents** — collapsible `<details>` or accordion «Документы верификации» — download rows (admin policy).
7. **Management** (`PulseCard`, border muted) — heading «Управление»:
   - Helper text: «Отзыв скрывает тренера из каталога. При активных бронях операция недоступна.»
   - Button `variant="outline"` class destructive tokens — **«Отозвать одобрение»** → opens `RevokeTrainerDialog`.
8. **Primary CTA row (desktop)** — below activity or in header actions: **«Открыть в каталоге»** `Button default`.

**Mobile:** Primary CTA sticky above BottomNav optional; Revoke stays in Management section (FX-3 — rare action not in thumb zone primary).

## RevokeTrainerDialog

```
Отозвать одобрение?
────────────────────────────────────
Тренер исчезнет из каталога. Укажите причину.

[ Textarea — причина, max-w-[650px] ]

[ Отмена ]  [ Отозвать — destructive ]
```

- Reason min 10 chars — inline error.
- FM-014 error — inline under dialog description, keep open.

## Data dependencies

| Field | Source |
|-------|--------|
| Profile + services | `trainer_profile` + relations (existing loader) |
| `reviewedAt`, `reviewedBy` | `trainer_profile.reviewed_at`, `reviewed_by` → user.fullName |
| Complaint count | `complaint` where `target_trainer_profile_id` |
| Upcoming bookings | `booking` where trainer + status in (`pending`,`confirmed`) + `starts_at > now()` |
| Public profile URL | `/trainers/{trainerProfileId}` |

## Guardrails

- **No** Approve/Reject on this mode — `canModerate=false`.
- Revoke = `RevokeTrainerApproval`, not `RejectTrainer`.
- FM-014 — block with message, not silent fail.
- Do not show trainer income / Stripe fields (post-MVP).

## States

| State | Description |
|-------|-------------|
| happy | Full operational profile + catalog CTA |
| loading | Profile + activity skeleton |
| error | Section Alert + Retry |
| revoke pending | Dialog `aria-busy`; page buttons disabled |
| revoke blocked (FM-014) | Inline error in dialog |
| forbidden | Non-admin redirect |

## Desktop layout (ASCII)

```
┌──────────┬──────────────────────────────────────────────────┐
│ Sidebar  │ ← Назад    Заявка тренера    [Открыть в каталоге]│
│          ├──────────────────────────────────────────────────┤
│          │ ✓ Заявка одобрена · Проверил: Admin · 2 дня назад│
│          │ ┌─ Profile card ────────────────────────────────┐ │
│          │ │ Maria · maria@… · [Pilates]    [Одобрена]    │ │
│          │ └───────────────────────────────────────────────┘ │
│          │ ┌─ Активность ──────────────────────────────────┐ │
│          │ │ Жалобы (0)  ·  Брони (2)  ·  Каталог →       │ │
│          │ └───────────────────────────────────────────────┘ │
│          │ ┌─ Услуги ──────────────────────────────────────┐ │
│          │ └───────────────────────────────────────────────┘ │
│          │ ┌─ Управление ──────────────────────────────────┐ │
│          │ │ [Отозвать одобрение]                          │ │
│          │ └───────────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────┘
```

## Mobile layout (ASCII)

```
┌────────────────────────┐
│ TopBar                 │
├────────────────────────┤
│ ← Назад                │
│ Заявка тренера         │
│ [Открыть в каталоге]   │  ← full width primary
│ ✓ Banner               │
│ Profile card           │
│ Activity card          │
│ Services               │
│ Management + Revoke    │
├────────────────────────┤
│ BottomNav              │
└────────────────────────┘
```

## Acceptance criteria

- [ ] Same URL as W10-25; branching by `status` only
- [ ] FX-8: activity zero states have copy, not blank
- [ ] FX-10: revoke confirm before mutation
- [ ] One `Button default` on view (catalog link)

**Registry:** W10-30 · P18 planned
