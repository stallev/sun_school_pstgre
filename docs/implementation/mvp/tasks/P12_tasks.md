# P12 Tasks — Достижения и штрафы

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.2  
**Дата:** 2026-10-22  
**Волна:** W11-18  
**Зависит от:** [`P12_phase_description.md`](../phases_tasks_descriptions/P12_phase_description.md), [`achievements_and_penalties_contract.md`](../contracts/achievements_and_penalties_contract.md), [`achievements_screens_spec.md`](../specs/achievements_screens_spec.md), [`adr_012_achievements_and_penalties.md`](../../../prds/07_governance/adr_012_achievements_and_penalties.md)  
**Связанные документы:** [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) §7.8, [`bricks_ledger_contract.md`](../contracts/bricks_ledger_contract.md) §3, [`homework_check_contract.md`](../contracts/homework_check_contract.md) §5.6–§5.8, [`change_log_contract.md`](../contracts/change_log_contract.md) §4, [`domain_invariants.md`](../../../prds/02_domain_model/domain_invariants.md) PKG-03

---

## Purpose

Реализовать волну 1 за флагом `features.achievements`: пересчёт, ручные действия, штрафы, формулу кирпичиков и экраны по прототипу. DoD — [`P12_phase_description.md`](../phases_tasks_descriptions/P12_phase_description.md).

**UI-CU (CU7, CU8): UX/UI verification loop** — описание фазы, раздел «UX/UI verification loop». CU не коммитится без строки `UI-verify: …, расхождений 0, консоль чистая`.

## Минимизация визуального дрифта (UI-CU: CU7, CU8)

Во время реализации UI держать **минимальный визуальный дрифт** относительно [`sunday_school_prototype.html`](../../../prototypes/sunday_school_prototype.html) и правил **ui-prototype-fidelity** / **ui-design-system-shadcn** (токены Slate Cobalt, каталог Design Lab, без ad-hoc hex и «похожих» Tailwind-классов).

**В конце каждого UI-CU** (перед review и коммитом) — обязательная сверка:

1. Запустить приложение (`next dev`), открыть в браузере **каждую затронутую CU страницу** и параллельно — соответствующую функцию в HTML-прототипе (якоря — [`achievements_screens_spec.md`](../specs/achievements_screens_spec.md) §3).
2. Сверить на основных ширинах: **390 px** (mobile), **`md`**, **`lg`** — типографика, отступы, радиусы, цвета, порядок блоков, состояния empty/loading/error.
3. **Консоль браузера (DevTools):** на каждом маршруте, viewport и сценарии (включая открытие диалогов и успешные/ошибочные мутации) — **нет** `error` и необработанных `unhandledrejection`; предупреждения, указывающие на поломку UI (hydration, CSP, 404 ресурсов, React), устраняются до коммита. Допустимы только шумные info/debug сторонних скриптов, если они не связаны с затронутыми экранами.
4. Если стили или плотность вёрстки **расходятся с прототипом**, исправлять **не только** новый блок/диалог CU, но и **остальной UI на той же странице** (шапка, карточки, таблицы, кнопки, отступы между секциями), пока страница в целом не совпадает с эталоном по визуальным параметрам.
5. Повторять цикл «сверка → правка» до нулевых расхождений и чистой консоли; зафиксировать в trace CU: `UI-verify: <экраны>, <роли>, <viewport>, расхождений 0, консоль чистая`.

Для CU1–CU6 UI-verify не требуется (нет product UI). Если при проверке CU7/CU8 обнаружен дрифт на странице, не входящей в scope задачи, его всё равно устраняют в рамках того же UI-CU.

## Phase DoR audit (lean: оркестратор inline)

- [x] Контракт W8-11, спека W9-09, ADR-012, AZ-52…AZ-57, PKG-03, action-коды журнала, формула кирпичиков §3 существуют — 2026-10-22
- [x] Open questions контракта, спеки, ADR и фазы пусты
- [x] Задачи ниже ссылаются на якоря § и называют Files, Acceptance и Paths

## Commit plan

### P12-CU1 — feat(domain): add achievement evaluate · Review: diff-only · Commit: auto

- [x] P12-T1 · T1 · Contract: [achievements §6.2](../contracts/achievements_and_penalties_contract.md) · Spec rules: [achievements_spec §7.3](../../../my_specs/achievements_spec.md)
      Files: `packages/domain/src/achievements/evaluate.ts` + `evaluate.test.ts`, `packages/domain/src/constants/mutation-error-codes.ts` (префиксы `ACHIEVEMENT_`, `PENALTY_` и коды контракта §7), `packages/domain/src/constants/audit-action.ts` (коды журнала §4), экспорт из `index.ts`
      Acceptance: чистая `evaluate` проходит случаи §7.3 (идемпотентность, порядок событий, правка задним числом, отзыв, ручная выдача, обзорный урок, период выключения, `hundred` без бонуса в метрике); неактивный `practice` не даёт выдач; коды и action — константы domain, без строковых литералов на будущем call site
      Paths: H [серия выдаёт уровни один раз] · N [повтор, отзыв, занятые факты, обзорный урок, режим выключен] · S n/a — чистая функция на фикстурах

**CU DoD:** `typecheck` · `lint` · `test`

### P12-CU2 — feat(achievements): persist awards and run evaluate on check events · Review: reviewer · Commit: auto

- [x] P12-T2 · T3 · Contract: [achievements §6.2–§6.3, §9](../contracts/achievements_and_penalties_contract.md) · ADR: [ADR-012 §4 п. 1–3](../../../prds/07_governance/adr_012_achievements_and_penalties.md) · AZ: AZ-56
      Files: `apps/web/src/data/achievements/evaluate-pupil.ts`, `recalculate-achievements.ts`, вызовы из `completeLessonCheck`, `correctCheck`, `overrideVerseScore`, `closeYear`; чтение флага `features.achievements`
      Acceptance: запись в интерактивной транзакции с блокировкой ученика; уникальность доказательств и `award_key` не даёт дубль; при выключенном флаге вызовов нет и мутация `recalculateAchievements` возвращает `ACHIEVEMENT_FLAG_OFF`; журнал `achievement.evaluated` без ФИО; кнопка пересчёта admin идемпотентна
      Paths: H [завершение проверки создаёт выдачи] · N [флаг выключен; повтор; конфликт уникальности] · S [AZ-56: нет публичного Action в обход use-case; AZ-52 на ручной пересчёт; audit без имён, INV-23]

**CU DoD:** `typecheck` · `lint` · `test`

### P12-CU3 — feat(achievements): add manual award and revoke · Review: reviewer · Commit: auto

- [x] P12-T3 · T3 · Contract: [achievements §6.4, §7](../contracts/achievements_and_penalties_contract.md) · AZ: AZ-53, AZ-54
      Files: `apps/web/src/data/achievements/award-manually.ts`, `revoke-award.ts`, `packages/policy/server` проверка своей группы
      Acceptance: ручная выдача занимает отмеченные проверки и пишет `rule_snapshot` с сервера; баллы выше каталога и короткий набор — отказ; отзыв только admin, баллы выходят из бонуса, доказательства остаются; teacher на отзыв — `FORBIDDEN`; чужой ученик — `NOT_FOUND`
      Paths: H [выдача и отзыв] · N [баллы, число уроков, занятый факт, повторный отзыв, режим выключен] · S [AZ-53, AZ-54, AZ-D4]

**CU DoD:** `typecheck` · `lint` · `test`

### P12-CU4 — feat(achievements): add penalties · Review: reviewer · Commit: auto

- [x] P12-T4 · T3 · Contract: [achievements §6.5](../contracts/achievements_and_penalties_contract.md) · AZ: AZ-53
      Files: `apps/web/src/data/achievements/issue-penalty.ts`, `cancel-penalty.ts`
      Acceptance: один `ACTIVE` на ученика и урок; модуль баллов не выше каталога; оценки и выдачи не меняются; снятие в закрытом году teacher отклоняется `PENALTY_YEAR_CLOSED`; журнал `penalty.issued` / `penalty.cancelled`
      Paths: H [выдача и снятие] · N [второй штраф, баллы выше каталога, уже снят, нет причины] · S [AZ-53, AZ-D4, ШТ-10]

**CU DoD:** `typecheck` · `lint` · `test`

### P12-CU5 — feat(achievements): add group achievement mode · Review: reviewer · Commit: auto

- [x] P12-T5 · T3 · Contract: [achievements §5, §6.3](../contracts/achievements_and_penalties_contract.md) · ADR: [ADR-012 §4 п. 6](../../../prds/07_governance/adr_012_achievements_and_penalties.md) · AZ: AZ-55
      Files: `apps/web/src/data/achievements/set-group-achievement-mode.ts`, период `grade_achievement_period`
      Acceptance: выключение открывает период и запрещает ручную выдачу и штраф; включение закрывает период и пересчитывает учеников группы; группа с `achievements_enabled = false` без периодов после включения флага не получает автовыдач; новая группа при включённом флаге создаётся с режимом включённым; журнал `achievement.mode_changed`
      Paths: H [включение и выключение] · N [выдача при выключенном режиме] · S [AZ-55: чужая группа — 404]

**CU DoD:** `typecheck` · `lint` · `test`

### P12-CU6 — feat(bricks): include awards and penalties in earned total · Review: reviewer · Commit: auto

- [x] P12-T6 · T3 · Contract: [bricks §3, §6.1](../contracts/bricks_ledger_contract.md) · Contract: [achievements §6.6](../contracts/achievements_and_penalties_contract.md)
      Files: расчёт баланса в `apps/web/src/data/bricks/**`, сброс кэша из операций CU2–CU5
      Acceptance: при флаге «набрано» = проверки + неотзванные выдачи − действующие штрафы; число строк `brick_ledger` не растёт; при выключенном флаге бонус и штрафы 0; отзыв может сделать остаток отрицательным
      Paths: H [бонус виден в балансе] · N [флаг выключен; отзыв; снятие штрафа] · S [AZ-41, AZ-57: чужой ученик — 404; в ответе нет лишних ПД]

**CU DoD:** `typecheck` · `lint` · `test`

### P12-CU7 — feat(web): add achievements catalogue screen · Review: reviewer · Commit: auto

- [x] P12-T7 · T3 · Spec: [achievements_screens §4, §5.1, §6](../specs/achievements_screens_spec.md) · Contract: [achievements §6.1](../contracts/achievements_and_penalties_contract.md) · AZ: AZ-52, AZ-D3
      Files: секция Lab до маршрута, `apps/web/src/app/(app)/achievements/`, пункт меню admin, словарь `admin.achievements`, server actions каталога и пересчёта
      Acceptance: экран совпадает с `vAchievements`, `achDialog`, `penCatDialog`; `practice` подписан «Ждёт голосовой проверки» и не включается действием учителя; при выключенном флаге пункта нет и маршрут 404; teacher получает «Нет доступа»; toast и pending по правилам мутаций
      Paths: H [admin правит каталог и пересчитывает] · N [вид после выдачи не меняется; пустая секция; ошибка валидации сохраняет форму] · S [AZ-52, AZ-D3, флаг]
      UI-verify: браузер — `/achievements` и диалоги; прототип — `vAchievements`, `achDialog`, `penCatDialog`; роли **admin** / **teacher** / флаг выкл.; viewport 390 px / `md` / `lg`; при расхождении править **всю страницу каталога**, не только новые компоненты; DevTools без error/unhandledrejection; `расхождений 0, консоль чистая`

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify (браузер + прототип + консоль, page-wide)

### P12-CU8 — feat(web): add teacher achievement and penalty surfaces · Review: reviewer · Commit: auto

- [ ] P12-T8 · T3 · Spec: [achievements_screens §5.2–§5.6](../specs/achievements_screens_spec.md) · AZ: AZ-53, AZ-54, AZ-55, AZ-57
      Files: блоки на `/today`, `/group`, карточке ученика, `/bricks`, `/rating`; диалоги выдачи, отзыва, штрафа и снятия; словарь `teacher.achievements`
      Acceptance: совпадение с `achModeCard`, блоком «Кого отметить» в `vToday`, `awardDialog`, `awardList` в `vPupil`, `revokeDialog` (кнопка только у admin), `penaltyDialog`, `penOffDialog`, строкой «в том числе» в `vBricks`, колонкой штрафов в `vRating`; фраз про родителя нет; штраф — токен `penalty` и слово «Штраф»
      Paths: H [режим, список, выдача, штраф, бонус] · N [режим выключен; нет выдач; баллы выше каталога] · S [AZ-53…AZ-55, AZ-57, AZ-D4]
      UI-verify: браузер — `/today`, `/group`, карточка ученика, `/bricks`, `/rating` и диалоги; прототип — функции §3 спеки; роли **teacher** (своя группа) и **admin**; viewport 390 px / `md` / `lg`; при расхождении на странице править **весь экран**, не только блок достижений/штрафов; DevTools без error/unhandledrejection на всех сценариях; `расхождений 0, консоль чистая`

**CU DoD:** `typecheck` · `lint` · `test` · UI-verify (браузер + прототип + консоль, page-wide)

### P12-CU9 — docs(docs): sync P12 routes and record smoke · Review: diff-only · Commit: auto

- [ ] P12-T9 · T0 · Spec: [canonical_routes §5](../../../design/canonical_routes.md) · Phase: [P12 DoD](../phases_tasks_descriptions/P12_phase_description.md)
      Files: `docs/design/canonical_routes.md` (перенос `/achievements` в §4), `docs/implementation/mvp/README.md`, `AGENTS.md` и `.cursor/rules/project-context.mdc` (строка текущей фазы — только статус P12, без расширения scope), этот файл (отчёт smoke)
      Acceptance: маршрут `/achievements` описан в §4 с ролью admin и флагом; smoke H/N/S записан ниже; каталог сида не переписан; выдачи в prod-seed не появились
      Paths: n/a — docs-only

**CU DoD:** `encoding:check` · `docs:links` · `typecheck` · `lint`

## Verification (phase)

- [ ] Все CU закоммичены; у CU2–CU8 trace `Review: …`; у CU7 и CU8 trace `UI-verify: …, расхождений 0, консоль чистая`
- [ ] Phase DoD из [`P12_phase_description.md`](../phases_tasks_descriptions/P12_phase_description.md)
- [ ] Docs sync — в CU9

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P12_phase_description.md`](../phases_tasks_descriptions/P12_phase_description.md) | DoD и UI-verify |
| [`achievements_and_penalties_contract.md`](../contracts/achievements_and_penalties_contract.md) | Операции |
| [`achievements_screens_spec.md`](../specs/achievements_screens_spec.md) | Экраны |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, tiers, CU |

## Change log

| Date | Change |
|------|--------|
| 2026-10-22 | v1.0 — Canonical (W11-18): CU1–CU9; UI-verify для CU7 и CU8 |
| 2026-10-22 | v1.1 — Минимизация визуального дрифта; page-wide сверка в браузере на 390/`md`/`lg` в конце UI-CU |
| 2026-10-22 | v1.2 — Обязательная проверка консоли браузера (error/unhandledrejection) в UI-verify |
