# Pre-production checklist — запуск prod

**Тип:** PRD (operations)  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-19  
**Волна:** P07-CU8  
**Зависит от:** [`P07_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P07_phase_description.md), [`migration_runbook.md`](./migration_runbook.md) §8–§9, [ADR-009](../07_governance/adr_009_bible_translations_and_verse_numbering.md) §3.2, [ADR-011](../07_governance/adr_011_transitional_child_consent.md), [`deletion_requests_contract.md`](../../implementation/mvp/contracts/deletion_requests_contract.md), [`access_and_registration_spec.md`](../../implementation/mvp/specs/access_and_registration_spec.md) §10  
**Связанные документы:** [`vercel_deploy_guide.md`](../../implementation/mvp/guides/vercel_deploy_guide.md), [`bootstrap_p3_decisions_register.md`](../../meta/bootstrap_p3_decisions_register.md) §5  

---

## 1. Purpose

Закрыть пред-prod требования P07: юридические сроки, лицензия NIV, текст согласия `/privacy` v1, security review T3-зон и план отката с датами и ответственными. Читают: владелец, оператор релиза, `reviewer` при изменениях в sensitive zones.

## 2. Решения и сверка с кодом (P07-T11)

| # | Тема | Зафиксированное значение | Сверка | Подпись владельца / юриста |
|---|------|--------------------------|--------|----------------------------|
| L-1 | **Срок удаления ПД (УД-5)** | **15 календарных дней** с даты запроса | `DELETION_DUE_CALENDAR_DAYS` в `@sunschool/domain`; UI и прототип | ☐ Дата: ______ |
| L-2 | **Переходный период согласий детей (СО-5)** | **60 календарных дней** от даты импорта (`legacy_consent_deadline_on`) | ADR-011 §4 п. 3; правовое основание — вне проекта | ☐ Дата: ______ |
| L-3 | **Окно восстановления Neon (УД-11)** | **1 календарный день** point-in-time recovery на prod (платный тариф) | Текст в [`/privacy`](../../../apps/web/src/app/(auth)/privacy/content.ts); runbook §9 | ☐ Дата: ______ |
| L-4 | **Английский перевод Библии** | **NIV** — только при письменной лицензии Biblica и флаге `--confirm-license` в prod; **иначе BSB** (ADR-009 §3.2) | `load-niv.ts` блокирует prod без флага; BSB — запасной путь при отказе лицензии (seed отдельно) | ☐ NIV лицензия / ☐ выбран BSB · Дата: ______ |
| L-5 | **Текст согласия `/privacy` v1** | Версия `consent_text_version` = **`v1`** (ru/en) | `access_and_registration_spec` §10; страница `/privacy` | ☐ Дата: ______ |

## 3. Security review — T3 / sensitive zones

Проверка по списку sensitive zones ([`agent-code-review-subagent.mdc`](../../../.cursor/rules/agent-code-review-subagent.mdc) § Sensitive zones) и smoke P07 ([`P07_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P07_phase_description.md) § Security smoke).

| Зона | Что проверено | CU / артефакт | Дата | Ответственный |
|------|---------------|---------------|------|---------------|
| `auth/**`, `proxy.ts` | JWT, cookie `Secure`/`HttpOnly`, `callbackUrl`, нет утечки секретов в клиент | P02–P07, P07-CU7 | 2026-10-19 | reviewer (CU7) |
| env / CSP / `next.config.*` | Заголовки безопасности, CSP, нет `NEXT_PUBLIC_*` секретов | P07-CU7 | 2026-10-19 | reviewer (CU7) |
| `packages/db/**`, `**/migrations/**` | Forward-only миграции; роль без UPDATE/DELETE журналов; deletion procedures | P06, runbook §7 | 2026-10-19 | reviewer (T3 CU) |
| `packages/policy/**` | Object-level checks; teacher без деталей согласия (СО-7) | P01+ | 2026-10-19 | diff + тесты |
| `**/api/**` | Тонкие handlers, auth на сервере | P01+ | 2026-10-19 | reviewer (по CU) |
| Observability | Sentry `beforeSend`, без ПД в событиях | P07-CU6 | 2026-10-19 | reviewer (CU6) |
| Prod surface | `/design-system` 404, нет dev-переключателя роли | P07-CU7 | 2026-10-19 | smoke checklist |

**Итог security review (P07):** ☐ Подпись владельца · Дата: ______

## 4. План отката и релиз (даты и ответственные)

Политика отката — [`migration_runbook.md`](./migration_runbook.md) §9. Ниже — операционный календарь (заполняет оператор перед cut-over).

| Этап | Плановая дата | Ответственный | Действие / критерий готовности |
|------|---------------|---------------|--------------------------------|
| R-1 Репетиция миграций | ______ | Оператор | `migrate deploy` на ветке Neon-копии; `seed:reference` + `seed:bible` (RST; NIV только при L-4) |
| R-2 Preview smoke | ______ | Разработчик | `vercel_deploy_guide` §8 на preview с dev БД |
| R-3 Freeze схемы | ______ | Владелец | Нет pending миграций в main |
| R-4 Prod: миграции | ______ | CI / оператор | `migrate deploy` prod; маркер `db_environment` = prod |
| R-5 Prod: деплой приложения | ______ | CI / оператор | `APP_ENV=prod`; INV-24 |
| R-6 Prod: справочники | ______ | Оператор | `seed:reference` → `seed:bible` → `seed:admin` (пароль — env оператора) |
| R-7 Импорт данных владельца | ______ | Владелец | Вне репозитория; ADR-011 `LEGACY_PENDING` |
| **Откат приложения** | В течение ______ после R-5 | Оператор | Promote предыдущего deployment Vercel; схема без сужающих миграций |
| **Восстановление БД** | В пределах **1 суток** (L-3) | Владелец | Neon branch / PITR; затем повторное применение выполненных deletion (УД-11) |

## 5. Acceptance (CU8)

- [x] Чек-лист создан; сроки 15 / 60 дней сверены с доменом и ADR-011.
- [x] Окно Neon **1 сутки** указано в тексте `/privacy` v1.
- [x] Security review T3-зон задокументирован (§3).
- [x] План отката перенесён в таблицу §4 с ролями.
- [ ] Все ☐ в §2–§3 подписаны владельцем/юристом перед prod cut-over.

## 6. Change log

| Date | Change |
|------|--------|
| 2026-10-19 | v1.0 — P07-CU8 |
