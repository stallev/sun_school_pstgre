# Lab PageSpeed Insights (Pulse)

**Тип:** Guide  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-07  
**Волна:** ops (вне PRD-волн)  
**Зависит от:** [`docs/guidelines/psi-lab-testing.md`](../../../guidelines/psi-lab-testing.md)  
**Связанные документы:** Cursor Rule `psi-lab-testing.mdc` · [`docs/ops/psi-lab-journal.md`](../../../ops/psi-lab-journal.md) · [`canonical_routes.md`](../../../design/canonical_routes.md)

---

## Purpose

Привязать переносимый канон лабораторного PSI к Pulse: ключ, CLI, origin, журнал. Агент измеряет **задеплоенный** origin с локальной машины. Принципы API, flake и чтение отчёта **не дублируются** — только [`psi-lab-testing.md`](../../../guidelines/psi-lab-testing.md).

## Scope / Out of scope

**Scope:** `npm run psi:lab`, env `PAGE_SPEED_API_KEY` / `PSI_ORIGIN` / `PSI_TRAINER_PROFILE_ID`, канон путей, журнал, отличие от `next dev`.

**Out of scope:** правки продукта «на всякий случай»; Playwright `instant()`; категория PWA; обязательный CI gate; MCP PageSpeed как основной канал; глобальный `ensureStatic` ради цифры PSI.

## Definitions

| Термин | Значение здесь |
|--------|----------------|
| Lab PSI | Lighthouse на машинах Google через REST v5 `runPagespeed` |
| Origin | Публичный HTTPS (или HTTP) продакшен/preview URL, не `localhost` |
| Suite | Канон путей × mobile × desktop |
| Зелёная зона | Perf / A11y / Best Practices / SEO ≥ 90 (lab), не пороги CWV |

## Requirements

1. **MUST** запускать PSI **только по явной просьбе** пользователя. Не auto после UI-diff, не в commit pipeline.
2. **MUST** звать [`scripts/psi-lab/run-pagespeed.mjs`](../../../../scripts/psi-lab/run-pagespeed.mjs) (`npm run psi:lab`). **MUST NOT** использовать MCP `pagespeed` / `user-pagespeed` как основной канал и **MUST NOT** параллелить MCP и REST.
3. **MUST** хранить ключ в `apps/web/.env.local` как `PAGE_SPEED_API_KEY`. **MUST NOT** `NEXT_PUBLIC_*`.
4. **MUST** отказывать, если URL — `localhost` / `127.0.0.1` / `*.localhost` / dev-сервер.
5. **MUST** передавать четыре категории в одном запросе; PWA не включать.
6. **SHOULD** прогревать CDN до lab (скрипт делает GET + cache-заголовки).
7. **SHOULD** дописывать сводку в [`docs/ops/psi-lab-journal.md`](../../../ops/psi-lab-journal.md) после прогона по запросу.
8. **MAY** чинить код в той же сессии **только** если категория < 90 и аудит назван в JSON после flake-повтора.

## Project bindings

| Binding | Значение |
|---------|----------|
| API | `GET https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed` |
| Env | `PAGE_SPEED_API_KEY`, `PSI_ORIGIN`, optional `PSI_TRAINER_PROFILE_ID` — [`apps/web/.env.local.example`](../../../../apps/web/.env.local.example) |
| CLI | `npm run psi:lab -- --url https://…` (default **mobile**) или `--suite`; `--no-dotenv` пропускает `.env.local` |
| Paths | [`scripts/psi-lab/canon-paths.mjs`](../../../../scripts/psi-lab/canon-paths.mjs) — публичные маршруты из [`canonical_routes.md`](../../../design/canonical_routes.md) |
| Journal | [`docs/ops/psi-lab-journal.md`](../../../ops/psi-lab-journal.md) |
| vs `next dev` | Dual-view **live `next dev`**. PSI — **задеплоенный** origin. Не смешивать. |

Канон suite (короткий, без админки / кабинетов):

- `/`, `/how-it-was-built`, `/features`, `/trainers`, `/auth/login`, `/auth/register`
- `/trainers/[id]` — только если задан `PSI_TRAINER_PROFILE_ID` (UUID прода/preview, не хардкод seed)

## Happy / negative / drift

| Секция | Содержание |
|--------|------------|
| Happy | Ключ есть → прогрев HIT → lab × 4 категории → таблица; категории ≥ 90 |
| Negative | Нет ключа; localhost; HTTP 429/5xx (retry); `runtimeError` (отчёт выбросить); flake (второй прогон) |
| Security | Ключ только local/CI env; не в git, не в JSON-отчёте, не в клиентском бандле |
| Drift | Канон путей устарел vs `canonical_routes.md` — править `canon-paths.mjs`, не раздувать suite |

## Acceptance criteria

- [ ] Portable-канон не содержит проектных URL/env.
- [ ] `npm run psi:lab` без ключа или с localhost завершается с ошибкой.
- [ ] Один lab-запрос = четыре категории; concurrency 2–3; timeout ~180 с.
- [ ] MCP не используется как основной канал.
- [ ] Commit pipeline не требует PSI.

## Agent notes

- Не оптимизировать contrast / unused JS / preload, пока категория зелёная.
- Второй зелёный прогон при том же LCP — flake, не регресс.
- CrUX отсутствует — не регресс.
- JSON через `--json` не должен содержать API key.
