# Wireframe: Trainer Schedule

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/trainer/schedule` · **Prototype:** `t.schedule`

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | «Сохранить расписание» (weekly) |
| **Spec** | [`trainer_schedule_spec.md`](../../../implementation/mvp/specs/trainer_schedule_spec.md) |

## Components

Weekly grid, time pickers, exceptions calendar, `Button`, `Dialog` block day, `Badge` booked slots read-only.

## Regions

1. **Weekly template** — Mon–Sun rows, start/end blocks (trainer TZ).
2. **Exceptions** — calendar month view; tap day → block or override.
3. **Legend** — available / booked / blocked.

## Guardrails

- All times in `TrainerProfile.timezone` (ADR-004).
- Booked slots not deletable from grid.

## States

| State | Description |
|-------|-------------|
| happy | Grid + exceptions |
| loading | Grid skeleton |
| error | Save toast.error |
| forbidden | Non-trainer |

## Desktop

Side-by-side weekly + calendar md+. Mobile: tabs Weekly | Exceptions.

**Registry:** W10-19
