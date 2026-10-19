# P08 Tasks — Аналитика по учебным годам

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-19  
**Волна:** W11-16  
**Зависит от:** [`P08_phase_description.md`](../phases_tasks_descriptions/P08_phase_description.md), [`analytics_year_snapshots_contract.md`](../contracts/analytics_year_snapshots_contract.md), [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) v1.2, [`multi_year_analytics.md`](../../../prds/01_product_scope/multi_year_analytics.md), [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md)  
**Связанные документы:** [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §5.7, [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) (AZ-48…AZ-51), [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) (INV-26, INV-27), [`ui_states_contract.md`](../../../design/ui_states_contract.md) (D19–D21), [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) §8.3, [`P07_tasks.md`](./P07_tasks.md)

---

## Purpose

Реализовать аналитику по учебным годам: снимки итогов закрытого года, чтение по годам с порогами достоверности, экраны по прототипу и проверку UX/UI агентом под ролями teacher и admin. DoD — [`P08_phase_description.md`](../phases_tasks_descriptions/P08_phase_description.md).

**Общее требование ко всем UI-CU (CU7–CU10): UX/UI verification loop** — [`P08_phase_description.md`](../phases_tasks_descriptions/P08_phase_description.md) § «UX/UI verification loop». Агент сам проверяет экран в `next dev` против прототипа под teacher (`TEACHER_EMAIL` / `TEACHER_PASSWORD`) и admin (`FIRST_ADMIN_EMAIL` / `ADMIN_PASSWORD`) из `.env` / `.local/dev-secrets.json` на данных `db:seed:dev`, при расхождении правит код и повторяет проверку до нуля расхождений; пароли нигде не записываются. CU не коммитится без строки `UI-verify: …, расхождений 0` в trace.

## Phase DoR audit (lean: оркестратор inline)

- [x] P07 DoD выполнен (2026-10-19)
- [x] Документы: контракт снимков (W8-10), spec v1.2, схема §5.7 (R-10, R-11), AZ-48…AZ-51, INV-26 / INV-27, D19–D21, `change_log_contract` v1.3 существуют
- [x] Dev-набор залит (`npm run db:seed:dev`): 3 года, 2 группы, 46 учеников
- [ ] Q-01 пороги N=10 / M=4: значения по умолчанию заданы, подтверждение владельца не блокирует CU2
- [ ] В `.env` или `.local/dev-secrets.json` есть учётки teacher и admin (агент использует, не печатает)

## Commit plan

### P08-CU1 — feat(db): add analytics year snapshot tables · Review: reviewer · Commit: auto

- [x] P08-T1 · T3 · Contract: [snapshots §4](../contracts/analytics_year_snapshots_contract.md) · Schema: [§5.7](../../../prds/03_data_model/database_schema_v1.md) · Invariants: INV-26
      Files: `packages/db/prisma/schema.prisma`, `packages/db/prisma/migrations/*`, `packages/domain/src/constants/enums.ts` (`ANALYTICS_SNAPSHOT_REASON`)
      Acceptance: модели `analytics_group_year_snapshot` и `analytics_pupil_year_snapshot`, enum `analytics_snapshot_reason_enum`; `UNIQUE (grade_id, academic_year_id, version)` и `(pupil_id, academic_year_id, version)`; `CHECK` (`version ≥ 1`, `kids ≥ 0`, `lessons ≥ 0`, диапазоны метрик); индексы `(academic_year_id)`; FK без каскада; `prisma validate` и `migrate` на копии; Prisma-модели PascalCase с `@@map`
      Paths: H [создание версии 1] · N [дубликат версии, значение вне диапазона → ошибка БД] · S [нет ПД кроме id; нет `UPDATE` из приложения, R-11]

**CU DoD:** `typecheck` · `lint` · `test` · `prisma migrate` на копии

### P08-CU2 — feat(domain): add year comparison thresholds and default-year rules · Review: reviewer · Commit: auto

- [x] P08-T2 · T2 · Contract: [snapshots §5–§6.6](../contracts/analytics_year_snapshots_contract.md) · Invariants: INV-26, INV-27
      Files: `packages/domain/src/analytics/{year-comparison.ts,methodology.ts,default-year.ts,visible-years.ts,year-totals.ts}` + `*.test.ts`, `packages/domain/src/constants/{mutation-error-codes.ts,audit-action.ts}` (`ANALYTICS_SNAPSHOT_MISSING`, `analytics.snapshot_created`, `analytics.snapshot_versioned`, `ANALYTICS_SNAPSHOT`), экспорт из `index.ts`
      Acceptance: константы N=10, M=4, `ANALYTICS_METHODOLOGY_VERSION='v1'`; чистые функции `computeYearTotals` (те же формулы, что P05), `computeYearDiff` (явка — целые п. п., остальное — 1 знак), `isComparisonReliable` (`kids ≥ N` и `lessons ≥ M` у обоих лет), `resolveDefaultYear` (активный → последний закрытый → `none`), `filterVisibleYears` (teacher — годы назначения, admin — все); нет литералов порогов вне domain → unit-тесты, grep
      Paths: H [разница считается] · N [`kids < N`, `lessons < M`, `NULL`-значения, нет прошлого года, нет лет] · S n/a — чистые функции

**CU DoD:** `typecheck` · `lint` · `test`

### P08-CU3 — feat(policy): add analytics year access checks · Review: reviewer · Commit: auto

- [ ] P08-T3 · T3 · Contract: [snapshots §7, §9](../contracts/analytics_year_snapshots_contract.md) · AZ: AZ-48…AZ-50, AZ-D4
      Files: `packages/policy/server/src/analytics-year.ts` + `analytics-year.test.ts`, `packages/policy/server/src/index.ts`
      Acceptance: `canViewGroupYear` (teacher — только год назначения на группу; admin — любой), `canViewPupilYears` (доступ к ученику как P05/AZ-45; все годы), решение — типизированный результат без `redirect`/`notFound`; тесты allow / foreign-resource / wrong-role на каждую функцию; `@sunschool/policy-server` не импортируется из `proxy.ts`
      Paths: H [свой год, своя группа] · N [год вне назначения, чужой ученик → отказ] · S [AZ-48, AZ-49, AZ-50: переход в аналитику чужой группы запрещён]

**CU DoD:** `typecheck` · `lint` · `test`

### P08-CU4 — feat(school): create analytics snapshots on year close · Review: reviewer · Commit: auto

- [ ] P08-T4 · T3 · Contract: [snapshots §6.1, §6.4](../contracts/analytics_year_snapshots_contract.md) · Contract: [school_year §5.1](../contracts/school_year_and_groups_contract.md) · Invariants: INV-26
      Files: `apps/web/src/data/analytics/years/{compute-year-snapshots.server.ts,create-year-snapshots.ts,ensure-year-snapshots.ts}` + тесты, `apps/web/src/data/school/close-year.ts`, `apps/web/src/lib/cache-tags.ts`
      Acceptance: `createYearSnapshots(tx, yearId, CLOSE)` внутри `closeYearInTransaction` после смены статуса и окончания зачислений: строка группы для каждой группы с `grade_settings` и строка ученика для каждого зачисленного; расчёт теми же функциями domain; ошибка расчёта откатывает закрытие; `analytics.snapshot_created` одной записью с счётчиками; `ensureYearSnapshots` идемпотентно создаёт версию 1 (`BACKFILL`) только где её нет; `updateTag` для тегов `analytics:years:*`, `analytics:pupil-years:*` → тесты: закрытие создаёт снимки, откат при ошибке, равенство «живой расчёт активного года = снимок при закрытии», идемпотентность
      Paths: H [закрытие создаёт снимки] · N [ошибка расчёта → откат закрытия; повторное закрытие → `SCHOOL_YEAR_STATUS_INVALID`; группа без уроков → снимок с `NULL`] · S [запись только из use-case; нет Route Handler / Action; audit без имён, AZ-51]

**CU DoD:** `typecheck` · `lint` · `test`

### P08-CU5 — feat(analytics): version snapshots on closed-year corrections and child data erasure · Review: reviewer · Commit: auto

- [ ] P08-T5 · T3 · Contract: [snapshots §6.2–§6.3](../contracts/analytics_year_snapshots_contract.md) · Contract: [homework_check §5.6](../contracts/homework_check_contract.md), [deletion_requests §6.2](../contracts/deletion_requests_contract.md) · Invariants: INV-22, INV-26
      Files: `apps/web/src/data/analytics/years/{recompute-year-snapshots.ts,erase-child-snapshots.ts}` + тесты, `apps/web/src/data/checks/{correct-check.ts,override-verse-score.ts}`, `apps/web/src/data/deletions/erase-child-data.ts`
      Acceptance: правка admin записи `CLOSED` года в той же транзакции вызывает `recomputeYearSnapshots` (под блокировкой года): новая версия снимка группы и ученика только если итоги изменились; снимки ученика удаляются, групповые снимки затронутых пар пересчитываются без ребёнка с удалением прежних версий — **до** удаления проверок; в `erase-child-data` порядок по [deletion §6.2](../contracts/deletion_requests_contract.md); `analytics.snapshot_versioned` без имён → тесты: версия при изменении, нет версии при равенстве, вклад удалённого ребёнка исчез
      Paths: H [версия `n+1`] · N [правка без изменения итогов; teacher в закрытом году отклонён AZ-34] · S [удаление данных ребёнка полное, INV-22; нет ПД в audit, INV-23]

**CU DoD:** `typecheck` · `lint` · `test`

### P08-CU6 — feat(analytics): add year-aware read models · Review: reviewer · Commit: auto

- [ ] P08-T6 · T3 · Contract: [snapshots §6.4–§7](../contracts/analytics_year_snapshots_contract.md) · Spec: [analytics_screens §4, §5.5–§7.1](../specs/analytics_screens_spec.md)
      Files: `apps/web/src/data/analytics/years/{list-group-year-totals.ts,list-pupil-year-rows.ts,list-school-year-totals.ts,resolve-default-year.server.ts}` + тесты, `apps/web/src/data/analytics/{load-analytics-page.server.ts,load-pupil-analytics-page.server.ts,load-school-analytics-page.server.ts}`, `apps/web/src/data/school/*` (загрузчик `/group`), `apps/web/src/lib/cache-tags.ts`
      Acceptance: загрузчики экранов принимают `year` / `pupilYear` / `metric` (валидируются на сервере); год по умолчанию (активный → последний закрытый → `none`); закрытые годы — из снимков, активный — вживую; детали закрытого года (графики по урокам, таблицы A / B) — теми же функциями P05 с `academicYearId`; разница по порогам; `bricks_issued` вживую; `?year=` вне назначения → `NOT_FOUND`; закрытый год без снимка → `ANALYTICS_SNAPSHOT_MISSING`; теги кэша и `updateTag` из `issueBricks` / `compensateBricks` → тесты DAL (teacher: 2025–2026 и 2026–2027; admin: три; переведённый ребёнок — все годы; чужая группа — 404)
      Paths: H [`teacher@` открывает годы, разница, строки лет] · N [мало данных, нет предыдущего года, нет снимка, нет лет] · S [AZ-48, AZ-49, AZ-50: прошлый год среди видимых; чужой год и чужая группа недоступны; авторизация вне `'use cache'`]

**CU DoD:** `typecheck` · `lint` · `test`

### P08-CU7 — feat(ui): add year analytics components and Design Lab sections · Review: reviewer · Commit: auto

- [ ] P08-T7 · T2 · Spec: [analytics_screens §5.5, §6.5, §14](../specs/analytics_screens_spec.md) · Prototype: `yearChips`, `yearsTable`, `kpiTiles`, `diffBadge`, `pupilYearsSection`, `methodNote`, `readOnlyNote` · Rule: `ui-design-system-shadcn`
      Files: `apps/web/src/components/analytics/years/{YearStrip,YearTotalsTable,DiffBadge,KpiTiles,PupilYearsSection,ReadOnlyYearNote,MethodologyVersionNote}.tsx`, `apps/web/src/components/analytics/{BarChart,ChartTableToggle}.tsx` (`xLabel`), секции в `apps/web/src/app/(dev)/design-system/` и `components/design-lab/*`, `apps/web/src/lib/messages/{ru,en}/analytics*` (`years.*`, `pupil_years.*`, парити ru/en)
      Acceptance: один компонент на файл (≤140 строк); только токены Slate Cobalt, без hex; `radiogroup` + `aria-checked` у полос; `DiffBadge` — слова и стрелка, не только цвет; в Lab — все состояния (разница вверх / вниз / как в прошлом году / мало данных; год активный / закрытый; методология v1 / текущая) на 390 px и `lg`; ключи в `@/lib/messages`, срез `analytics`, парити ru/en
      Paths: H [компоненты рендерят состояния] · N [нет данных, одна строка, длинные названия] · S n/a — presentational
      UI-verify: секции Lab `/design-system` сверены с прототипом (структура, тексты, токены), 390 px / `md` / `lg`, консоль без ошибок; расхождения исправлены до коммита

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify

### P08-CU8 — feat(web): add year selector and closed-year view to group analytics · Review: reviewer · Commit: auto

- [ ] P08-T8 · T2 · Spec: [analytics_screens §5.5, §9, §12](../specs/analytics_screens_spec.md) · Prototype: `vAnalytics`, `analyticsClosedView`
      Files: `apps/web/src/app/(app)/analytics/{page.tsx,loading.tsx}`, `apps/web/src/components/analytics/*` (композиция), загрузчик из CU6
      Acceptance: порядок блоков по spec §5.5 (заголовок → группа (admin) → полоса лет → таблица итогов → пометки → KPI → графики → таблицы → блок учителей только в активном году); выбор года пишет `?year=`; закрытый год — read-only с `ReadOnlyYearNote` и, при другой версии, `MethodologyVersionNote`; после закрытия года открывается последний закрытый год; недоступный `?year=` → 404; `loading.tsx` без пустых оболочек
      Paths: H [teacher / admin выбирают год, разница, закрытый год] · N [мало данных, нет снимка → `error`, нет лет] · S [AZ-48, AZ-D4: teacher не открывает год и группу вне назначения]
      UI-verify: `/analytics` под **teacher** (годы 2025–2026, 2026–2027; разница; закрытый год read-only) и под **admin** (три года, переключатель группы, «мало данных» у 2025–2026 против 2024–2025, пометка методологии) против прототипа, 390 px / `md` / `lg`, консоль чистая; расхождения исправлены до коммита

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify

### P08-CU9 — feat(web): add year history to pupil analytics · Review: reviewer · Commit: auto

- [ ] P08-T9 · T2 · Spec: [analytics_screens §6.5](../specs/analytics_screens_spec.md) · Prototype: `vPupil`, `pupilYearsSection`, `pupilClosedYear`
      Files: `apps/web/src/app/(app)/analytics/pupils/[pupilId]/{page.tsx,loading.tsx}`, `apps/web/src/components/analytics/years/PupilYearsSection.tsx` (композиция), загрузчик из CU6
      Acceptance: «По годам» над карточкой: полоса лет, таблица (группа, при переводе «Группа 1 → Группа 2»; «—» и «мало уроков: k»; «Кирпичики: набрано / выдано» — выдано вживую), график столбцами по годам с переключателем показателя и таблицей к графику; активный год — карточка P05; закрытый год — read-only плитки и графики по урокам этого года; teacher видит все годы доступного ученика и название чужой группы без перехода; чужой ученик → 404; `?pupilYear=`, `?metric=`
      Paths: H [строки всех лет, раскрытие года] · N [один год, `lessons < M`, ребёнок без истории] · S [AZ-49, AZ-50: нет перехода в чужую группу; AZ-D4]
      UI-verify: под **teacher** карточка переведённого ребёнка из «Старшей 2» (строки лет, две группы в году 2025–2026, график, раскрытие закрытого года, примечание о чужой группе) и под **admin** — против прототипа, 390 px / `md` / `lg`, консоль чистая; расхождения исправлены до коммита

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify

### P08-CU10 — feat(web): add year view to school analytics and group summary · Review: reviewer · Commit: auto

- [ ] P08-T10 · T2 · Spec: [analytics_screens §5.6, §7.1](../specs/analytics_screens_spec.md) · Prototype: `vSchool`, `schoolClosedBlock`, `groupYearSummary`
      Files: `apps/web/src/app/(app)/school/page.tsx`, `apps/web/src/app/(app)/group/page.tsx`, `apps/web/src/components/analytics/*` (композиция), загрузчики из CU6
      Acceptance: `/school` — полоса лет (`?year=`), в закрытом году таблица групп из снимков с разницей; «В этом году группы не было»; блок «Требует внимания» не зависит от года; `/group` — «Итоги года · {год}», `KpiTiles` с разницей и «Все годы» → `/analytics`; роль `/school` только admin
      Paths: H [admin выбирает год; teacher открывает «Все годы»] · N [группы нет в году, мало данных, нет лет] · S [AZ-44: `/school` только admin; AZ-48]
      UI-verify: `/school` под **admin** (активный и закрытые годы) и `/group` под **teacher** (итоги года, разница, ссылка «Все годы») против прототипа, 390 px / `md` / `lg`, консоль чистая; расхождения исправлены до коммита

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify

### P08-CU11 — docs(docs): sync P08 docs, seed snapshots and record smoke · Review: diff-only · Commit: auto

- [ ] P08-T11 · T1 · Contract: [snapshots §6](../contracts/analytics_year_snapshots_contract.md) · Seed: [seed_data_spec §8.3](../../../prds/03_data_model/seed_data_spec.md)
      Files: `packages/db/src/seed/dev/index.ts` (вызов `ensureYearSnapshots` для закрытых лет), `packages/db/src/scripts/delete-academic-year.ts` (удаление снимков года и ученика), `docs/**`, `AGENTS.md` и `.cursor/rules/project-context.mdc` («Текущая фаза»), индексы
      Acceptance: `seed:dev` после заливки создаёт снимки закрытых лет (идемпотентно, `BACKFILL`); `delete-academic-year` не падает на FK снимков; smoke H/N/S пройден; статус проекта обновлён; нет drift
      Paths: n/a — docs-only и tooling (dev-скрипты, вне sensitive zone runtime)

**Smoke report (заполняется в CU11):** H · N · S по [`P08_phase_description.md`](../phases_tasks_descriptions/P08_phase_description.md) §Happy / Negative / Security.

**CU DoD:** `encoding:check` · `docs:links` · `typecheck` · `lint`

## Verification (phase)

- [ ] Все CU закоммичены; trace `Review: …`; у CU7–CU10 trace `UI-verify: …, расхождений 0`
- [ ] Phase DoD из [`P08_phase_description.md`](../phases_tasks_descriptions/P08_phase_description.md)
- [ ] Docs sync — в CU11

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P08_phase_description.md`](../phases_tasks_descriptions/P08_phase_description.md) | DoD, UX/UI verification loop |
| [`analytics_year_snapshots_contract.md`](../contracts/analytics_year_snapshots_contract.md) | Данные и правила |
| [`analytics_screens_spec.md`](../specs/analytics_screens_spec.md) | Экраны |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-10-19 | v1.0 — Canonical (W11-16): CU1–CU11; UX/UI verification loop для UI-CU |
