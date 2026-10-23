# P13 Tasks — Семьи и родители

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-23  
**Волна:** W11-20  
**Зависит от:** [`P13_phase_description.md`](../phases_tasks_descriptions/P13_phase_description.md), [`families_and_parents_contract.md`](../contracts/families_and_parents_contract.md), [`families_and_parents_screens_spec.md`](../specs/families_and_parents_screens_spec.md), [`adr_013_families_and_parents.md`](../../../prds/07_governance/adr_013_families_and_parents.md)  
**Связанные документы:** [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) §7.9, [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) §8.4, [`deletion_requests_contract.md`](../contracts/deletion_requests_contract.md), [`access_requests_and_roles_contract.md`](../contracts/access_requests_and_roles_contract.md), [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) PKG-03

---

## Purpose

Реализовать волну 2 за флагом `features.parents`: семьи, роль родителя, согласие, запрос на удаление, контакты учителя, дайджест без почты и экраны по прототипу. DoD — [`P13_phase_description.md`](../phases_tasks_descriptions/P13_phase_description.md).

**Сид до UI.** CU7 выполняется и коммитится раньше CU8–CU10. Пока dev-БД не содержит семьи, взрослых, родителя, детей, согласий и строку дайджеста, UI-CU не начинаются.

**UI-CU (CU8, CU9, CU10): UX/UI verification loop** — описание фазы. CU не коммитится без строки `UI-verify: …, расхождений 0, консоль чистая`.

## Минимизация визуального дрифта (UI-CU: CU8, CU9, CU10)

Во время реализации UI держать минимальный визуальный дрифт относительно [`sunday_school_prototype.html`](../../../prototypes/sunday_school_prototype.html) и правил **ui-prototype-fidelity** / **ui-design-system-shadcn**.

**В конце каждого UI-CU** (перед review и коммитом):

1. Запустить приложение, открыть каждую затронутую страницу и ту же функцию прототипа (якоря — [`families_and_parents_screens_spec.md`](../specs/families_and_parents_screens_spec.md) §3).
2. Сверить **390 px**, **`md`**, **`lg`**.
3. Консоль без `error` и `unhandledrejection`.
4. Расхождение чинить на всей странице.
5. Trace: `UI-verify: <экраны>, <роли>, <viewport>, расхождений 0, консоль чистая`.

Для CU1–CU7 UI-verify не требуется. Блок голоса на `vChild` не переносится.

## Phase DoR audit (lean: оркестратор inline)

- [x] ADR-013, контракт W8-12, спека W9-10, AZ-58…AZ-64, PKG-03, набор сида §8.4 существуют — 2026-10-23
- [x] Open questions контракта, спеки, ADR и фазы пусты
- [x] Задачи ниже ссылаются на якоря § и называют Files, Acceptance и Paths

## Commit plan

### P13-CU1 — feat(domain): add family rules · Review: diff-only · Commit: auto

- [x] P13-T1 · T1 · Contract: [families §3, §7](../contracts/families_and_parents_contract.md) · ADR: [ADR-013 §4 п. 3](../../../prds/07_governance/adr_013_families_and_parents.md)
      Files: `packages/domain/src/families/` (правила СМ-1, СМ-3, СМ-5, СМ-7, СМ-10) + тесты, `packages/domain/src/constants/mutation-error-codes.ts` (префиксы `FAMILY_`, `CONSENT_` и коды контракта §7), экспорт из `index.ts`
      Acceptance: чистые проверки отклоняют вторую семью ребёнка, вторую мать или отца и пустую семью; исключение последнего взрослого не запрещено; коды — константы domain
      Paths: H [ребёнок в одной семье] · N [вторая мать, пустая семья, ребёнок уже в семье] · S n/a — чистая функция на фикстурах

**CU DoD:** `typecheck` · `lint` · `test`

### P13-CU2 — feat(families): persist family edits · Review: reviewer · Commit: auto

- [x] P13-T2 · T3 · Contract: [families §6.1, §8, §9](../contracts/families_and_parents_contract.md) · AZ: AZ-58
      Files: `apps/web/src/data/families/` (`upsertFamily`, взрослые, `attachPupil`, `transferPupil`, `mergeFamilies`), `packages/policy/server`
      Acceptance: запись в транзакции; журнал `family.upserted`, `family.adult_changed`, `family.pupil_transferred`, `family.merged` без ФИО и телефонов; чужой вызов не от admin — `FORBIDDEN`; при выключенном флаге `FAMILY_FLAG_OFF`
      Paths: H [создание, взрослый, ребёнок, перенос, объединение] · N [пустая семья, занятый тип, ребёнок уже в семье] · S [AZ-58, AZ-D4, INV-23]

**CU DoD:** `typecheck` · `lint` · `test`

### P13-CU3 — feat(access): approve parent request · Review: reviewer · Commit: auto

- [x] P13-T3 · T3 · Contract: [families §6.2](../contracts/families_and_parents_contract.md) · Contract: [access §5.4](../contracts/access_requests_and_roles_contract.md) · AZ: AZ-59, AZ-P3
      Files: `approveParentRequest` рядом с `approveRequest`
      Acceptance: при флаге три способа связи (существующий взрослый, добавить в семью, создать семью); учётка `ACTIVE` с ролью `PARENT`; при выключенном флаге по-прежнему `ACCESS_ROLE_UNAVAILABLE` и семья не создаётся; «создать» для ребёнка, который уже в семье, недоступно
      Paths: H [одобрение создаёт семью] · N [ребёнок уже в семье; флаг выключен] · S [AZ-59, AZ-P3]

**CU DoD:** `typecheck` · `lint` · `test`

### P13-CU4 — feat(consent): add electronic child consent · Review: reviewer · Commit: auto

- [x] P13-T4 · T3 · Contract: [families §6.3](../contracts/families_and_parents_contract.md) · AZ: AZ-61
      Files: `apps/web/src/data/families/give-electronic-consent.ts`, `revoke-electronic-consent.ts`
      Acceptance: согласие `ELECTRONIC` с `guardian_adult_id` и версией с сервера; пока его нет, данные ребёнка родителю не отдаются; отзыв непоследнего снимает доступ и оставляет данные; отзыв последнего при `confirmDeletion` создаёт запрос и не вызывает стирание; без подтверждения — `CONSENT_LAST_REQUIRES_DELETION`
      Paths: H [дать и отозвать] · N [флажок не отмечен; последнее согласие без подтверждения] · S [AZ-61, чужой ребёнок — `NOT_FOUND`]

**CU DoD:** `typecheck` · `lint` · `test`

### P13-CU5 — feat(deletion): let parent request child erasure · Review: reviewer · Commit: auto

- [x] P13-T5 · T3 · Contract: [families §6.4](../contracts/families_and_parents_contract.md) · Contract: [deletion §3](../contracts/deletion_requests_contract.md) · AZ: AZ-62
      Files: `createOwnChildDeletionRequest`, `cancelOwnChildDeletionRequest`
      Acceptance: родитель создаёт и отменяет открытый запрос своего ребёнка; второй открытый — `CONFLICT`; выполнение по-прежнему только admin; при выключенном флаге родительский путь закрыт, admin-путь MVP сохранён; другие взрослые семьи видят открытый запрос в данных экрана
      Paths: H [создание и отмена] · N [повтор, уже выполнен] · S [AZ-62, AZ-D4]

**CU DoD:** `typecheck` · `lint` · `test`

### P13-CU6 — feat(families): show contacts and record digest · Review: reviewer · Commit: auto

- [x] P13-T6 · T3 · Contract: [families §6.5–§6.6](../contracts/families_and_parents_contract.md) · ADR: [ADR-013 §4 п. 6](../../../prds/07_governance/adr_013_families_and_parents.md) · AZ: AZ-63, AZ-64
      Files: `listFamilyContacts`, `ensureWeeklyDigest`; уникальность `(user_id, period_start)`, если её нет в схеме
      Acceptance: учитель получает ФИО, тип и телефоны учеников своей группы и не получает адрес, примечание и email; admin на странице семьи адрес видит; дайджест один на неделю, `sent_at` пуст, почта не вызывается; повтор — чтение той же строки
      Paths: H [контакты и первая строка недели] · N [повтор недели; чужая группа] · S [AZ-63, AZ-64, INV-23, INV-25]

**CU DoD:** `typecheck` · `lint` · `test`

### P13-CU7 — feat(db): seed families for parent ui · Review: reviewer · Commit: auto

Предусловие UI-CU. CU8–CU10 не начинаются, пока этот CU не закоммичен и `db:seed:dev --replace` не выполнен на dev-БД.

- [x] P13-T7 · T3 · Spec: [seed §8.4](../../../prds/03_data_model/seed_data_spec.md) · ADR: [ADR-013 §4 п. 8](../../../prds/07_governance/adr_013_families_and_parents.md)
      Files: `packages/db/src/seed/dev/**`
      Acceptance: при маркере `dev` появляются не меньше двух семей на детях фикстуры, взрослый с учёткой родителя и взрослый без учётки, бумажное и электронное согласие, одна строка `weekly_digest` с пустым `sent_at`; учётка родителя входит по `PARENT_EMAIL` / `PARENT_PASSWORD` из env или `.local/dev-secrets.json` (пароль в репозиторий не попадает); `features.parents` становится `true` только здесь. `db:seed:reference` семей не создаёт и флаг не включает. Нет секретов — отказ до записи. `--replace` снимает семьи фикстуры и заливает набор заново
      Paths: H [после сида родитель и admin видят данные] · N [нет секретов; маркер не dev] · S [секреты не в git; prod-сид без семей]

**CU DoD:** `typecheck` · `lint` · `test`

### P13-CU8 — feat(web): add admin family screen · Review: reviewer · Commit: auto

Начинается после CU7.

- [x] P13-T8 · T3 · Spec: [screens §5.1, §6](../specs/families_and_parents_screens_spec.md) · AZ: AZ-58
      Files: секция Lab до маршрута, `apps/web/src/app/(app)/family/`, пункт меню admin, словарь `admin.family`, server actions семьи
      Acceptance: экран совпадает с `vFamily`; при выключенном флаге пункта нет и маршрут 404; teacher получает «Нет доступа»; toast и pending по правилам мутаций
      Paths: H [admin правит семью фикстуры] · N [пустой список; ошибка валидации сохраняет форму] · S [AZ-58, AZ-D3, флаг]
      UI-verify: браузер — `/family`; прототип — `vFamily`; роли **admin** / **teacher** / флаг выкл.; viewport 390 px / `md` / `lg`; данные сида CU7; DevTools без error/unhandledrejection; `расхождений 0, консоль чистая`

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify

### P13-CU9 — feat(web): add parent child screens · Review: reviewer · Commit: auto

Начинается после CU7.

- [x] P13-T9 · T3 · Spec: [screens §5.2–§5.4](../specs/families_and_parents_screens_spec.md) · AZ: AZ-60, AZ-61, AZ-62, AZ-64
      Files: `/child`, `/child/data`, `/child/consent`, секция дайджеста, календарь для parent, словарь `parent`, оболочка пунктов меню
      Acceptance: совпадение с `vChild` (без блока голоса), `vChildData`, `vChildConsent`; без согласия данные ребёнка скрыты; дайджест на странице; календарь только чтение по группам своих детей; фраз про письмо нет
      Paths: H [успехи, согласие, дайджест, календарь] · N [нет согласия; пустой дайджест] · S [AZ-60…AZ-62, AZ-64, чужой ребёнок — 404]
      UI-verify: браузер localhost — `/child`, `/child/data`, `/child/consent`, `/calendar`; прототип — `vChild`, `vChildData`, `vChildConsent`; роль **parent** (seed CU7 `--replace`, credentials env); viewport 390 / `md`768 / `lg`1024; foreign `?pupilId` (чужой ученик фикстуры) → notFound на `/child`, `/child/data`, `/child/consent`; расхождений 0, консоль чистая (только Next dev upgrade nudge)

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify

### P13-CU10 — feat(web): add teacher family contacts · Review: reviewer · Commit: auto

Начинается после CU7.

- [x] P13-T10 · T3 · Spec: [screens §5.4](../specs/families_and_parents_screens_spec.md) · AZ: AZ-63
      Files: блок на карточке ученика, словарь `teacher.family`
      Acceptance: ФИО, тип и телефоны взрослых своего ученика; адреса и примечания нет; чужой ученик — 404; при выключенном флаге блока нет
      Paths: H [контакты своей группы] · N [ученик без семьи] · S [AZ-63, AZ-D4]
      UI-verify: localhost `/analytics/pupils/[pupilId]` vs прототип `famContacts`; **teacher** — `c1` (18213d65…) N «Ребёнок без семьи…», `a2` seed (b5b55e28…) → 404 (нет карточки); **admin** — `a2` Card «Семья» + ссылка `/family?id=…`, взрослые ФИО·тип·телефоны; viewport 390 / `md`768 / `lg`1024; расхождений 0, консоль чистая (только Next dev upgrade nudge)

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify

### P13-CU11 — docs(docs): sync P13 routes and record smoke · Review: diff-only · Commit: auto

- [x] P13-T11 · T0 · Spec: [canonical_routes §5](../../../design/canonical_routes.md) · Phase: [P13 DoD](../phases_tasks_descriptions/P13_phase_description.md)
      Files: `docs/design/canonical_routes.md` (перенос `/family`, `/child`, `/child/data`, `/child/consent` в §4; `/verse*` остаются в §5), `docs/implementation/mvp/README.md`, этот файл (отчёт smoke). `AGENTS.md` и `project-context.mdc` — только если меняется строка текущей фазы, без расширения scope за пределы P13
      Acceptance: маршруты волны 2 описаны в §4 с ролями и флагом; `/verse*` остаются волной 3; smoke H/N/S записан ниже
      Paths: n/a — docs-only

**Smoke report (2026-10-23):** **H** — dev с `features.parents=true` после `db:seed:dev --replace`: admin `/family` (`vFamily`); parent `/child`, `/child/data`, `/child/consent`, `/calendar` (чтение); блок контактов на карточке ученика; UI-verify CU8–CU10 (390/`md`/`lg`), расхождений 0, консоль без error/unhandledrejection (только Next dev upgrade nudge). **N** — флаг выкл: нет пунктов меню parent, маршруты 404, блок teacher отсутствует; пустые семьи/дайджест, валидация форм, `FAMILY_FLAG_OFF`, отсутствие согласия, последнее согласие без подтверждения (тесты domain/DAL CU1–CU7 + Paths N CU8–CU10). **S** — AZ-58…AZ-64, AZ-D3/D4, INV-23/INV-25: teacher на `/family`/`/child` — forbidden; чужой ребёнок parent — 404; учитель без адреса/email; родительский запрос на удаление; `PARENT_EMAIL`/`PARENT_PASSWORD` не в git; prod-seed без семей.

**CU DoD:** `encoding:check` · `docs:links` · `typecheck` · `lint`

## Verification (phase)

- [ ] Все CU закоммичены; у CU2–CU10 trace `Review: …`; у CU8–CU10 trace `UI-verify: …, расхождений 0, консоль чистая`
- [ ] CU7 раньше CU8–CU10
- [ ] Phase DoD из [`P13_phase_description.md`](../phases_tasks_descriptions/P13_phase_description.md)
- [x] Docs sync — в CU11

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P13_phase_description.md`](../phases_tasks_descriptions/P13_phase_description.md) | DoD, сид до UI, UI-verify |
| [`families_and_parents_contract.md`](../contracts/families_and_parents_contract.md) | Операции |
| [`families_and_parents_screens_spec.md`](../specs/families_and_parents_screens_spec.md) | Экраны |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-10-23 | v1.0 — Canonical (W11-20): CU1–CU11; сид CU7 до UI; UI-verify для CU8–CU10 |
