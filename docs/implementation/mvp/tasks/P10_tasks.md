# P10 Tasks — Визуальный дрейф UI (проход 3, замеры по матрице)

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-21  
**Волна:** post-P09  
**Зависит от:** [`ui_prototype_fidelity_2026-10-21.md`](../audits/ui_prototype_fidelity_2026-10-21.md), [`prototype_route_mapping.md`](../../../design/prototype_route_mapping.md), [`P09_tasks.md`](./P09_tasks.md) (закрыт)  
**Связанные документы:** [`visual_identity_contract.md`](../../../design/visual_identity_contract.md), [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md), [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md), [`global_shell_spec.md`](../specs/global_shell_spec.md)

---

## Purpose

Убрать **оставшийся визуальный дрейф** клиентского UI относительно HTML-прототипа и UX-03. Новых сценариев, прав, мутаций и seed нет. Каждая строка матрицы экранов проходит **одинаковую сверку** на живой странице; «похоже на прототип» и «в P09 уже было ок» не считаются проверкой.

**Отчёт (живой журнал):** [`ui_prototype_fidelity_2026-10-21.md`](../audits/ui_prototype_fidelity_2026-10-21.md) — матрица, таблица расхождений, повторный проход, ошибки страниц, субагент/модель на строку.

## Phase DoR audit

- [x] Задачи ссылаются на `prototype_route_mapping.md` §4 и аудит 2026-10-21 — 2026-10-21 · оркестратор
- [x] Open questions mapping Q-01 не блокирует визуальную сверку экранов

---

## Контракт оркестрации (обязательно для субагентов)

Оркестратор **не** читает прототип и исходники экранов целиком и **не** пишет код экранов. Ведёт матрицу, ставит задачи, принимает отчёты в audit md; в промпт субагенту — **путь, ключ матрицы, файлы, критерий приёмки**, без диффов и логов в контекст оркестратора.

| Субагент | Модель | Действие |
|----------|--------|----------|
| `explore` | встроенная Explore (не переопределять) | Блок экрана в прототипе (`#screen-<key>`) + файлы приложения. Только поиск, без правок. Параллельно по непересекающимся ключам. |
| `implementer` | `composer-2.5` (**fast=false**) | Один шаг: атомы **или** оболочка **или** один экран/семейство. В промпт: путь отчёта, строка матрицы, Files, что сверить/править, чего не копировать. Два implementer — только если Files не пересекаются. Следующий слой не стартовать, пока предыдущий записан в отчёт. |
| `architect` | `grok-4.7` effort=high (**fast=false**) | Только документы, если визуал прототипа расходится со спекой/правилом — поправить документ в **том же CU**, без кода продукта. Один вызов на документ. |
| `reviewer` | `grok-4.7` effort=high, readonly | **Один раз на CU** с runtime-кодом перед коммитом. Промпт: строка матрицы + файлы в stage. Не `bugbot` / `generalPurpose`. |

**Context7** — только при правке API Next.js / Tailwind / Base UI; для кегля и отступов не вызывать.

**Dev:** оркестратор поднимает `npm run dev` **один раз** (`http://localhost:3000`). Вход teacher/admin — субагент с живой страницей, учётки из `.local/dev-secrets.json` (**не** писать пароли в отчёт, коммит, логи, промпты). Формы продукта **не отправлять**.

**Падение маршрута:** причина в отчёт; при необходимости Sentry `sun_school_postgres_dev`; перейти к следующей строке матрицы. Падение одного экрана не останавливает остальные.

**Возврат субагента:** ≤15 строк оркестратору; полный разбор — в audit md.

---

## Источники визуала

| # | Документ / каталог | Назначение |
|---|-------------------|------------|
| 1 | [`sunday_school_prototype.html`](../../../prototypes/sunday_school_prototype.html), [`prototype_route_mapping.md`](../../../design/prototype_route_mapping.md) | Что сверять на экране (`#screen-<key>`) |
| 2 | [`visual_identity_contract.md`](../../../design/visual_identity_contract.md), [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md) | Токены и шкала |
| 3 | [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md) | Ширины оболочки |
| 4 | `@/components/atoms`, `@/components/ui/*`, `@/components/patterns/*` | Каталог; маршруты **не** импортируют `@/components/design-lab/**` |

Гарнитуры: **Alegreya / Alegreya Sans** (прототип и UX-03). Source Serif 4 / Manrope не переносить и не использовать как аргумент «шрифт другой».

Цвета — только семантические классы, без hex в компонентах.

---

## Что не делать (границы прохода)

| Запрет | Пояснение |
|--------|-----------|
| Переигрывать P09 и проходы 2026-10-20 / 2026-10-21 | Не чинить повторно копирайт, состав секций, падения «Something went wrong» классов A/B, если это не новый визуальный дрейф |
| Откатывать закрытые пункты аудита 2026-10-21 | Искать дрейф, который тот проход **не измерял** |
| Post-MVP UI | Семья, штрафы, достижения, голосовая практика, родитель; radio роли в шапке прототипа |
| Менять спеку там, где спор не про внешний вид | Маршруты, роли, MVP, согласие, мутации, seed — спека побеждает |
| Снимать согласие с `/login` | [`access_and_registration_spec`](../specs/access_and_registration_spec.md) |
| Править файлы вне строки матрицы / CU | «На всякий случай» не обходить |

Если визуал прототипа расходится с правилом или спекой экрана — код к прототипу и **в том же CU** обновить документ (без молчаливого разъезда).

---

## Матрица работ (строка = ключ × роль × ширины)

**Ширины на каждой строке:** 390, 768, 820, 1024.

**На каждом видимом блоке** замер на живой странице (не чтение классов):

- font-size, font-weight, line-height  
- padding, gap, margin секции  
- radius  
- цвет токеном (фон, текст, граница)  
- overflow: на 390 нет горизонтального скролла страницы; внутренний скролл таблицы — только как в прототипе  
- на 390 таблица → карточки только если так в прототипе для этого экрана  
- один primary CTA на экран; меню на 768 и 820 не обрезается и не прыгает в центр шапки  

**Расхождение в отчёт:** файл, узел, ожидаемое, фактическое, ширины, `blocker` | `deviation`. Нет строки — экран не пройден. Фраза «визуально ок» запрещена.

**Порядок слоёв (один раз на фазу):** (1) атомы и токены → (2) примитивы/patterns на матрице → (3) оболочка (отдельный CU до экранов в ней) → (4) экраны по одному, от простых к сложным; следующий экран только после записи всех расхождений на **всех четырёх** ширинах; (5) повторная сверка строки на localhost — экран закрыт, если повтор не добавил строк.

### Сводка статуса матрицы

| Ключ | Маршрут(ы) | Роль(и) | Слой | Статус прохода 3 |
|------|------------|---------|------|------------------|
| — | (shell) | teacher, admin | оболочка | [x] CU2–CU3 + delta (`96c5d70`, `d5c46b5`, `64ca12d`) |
| — | (atoms) | — | каталог | [x] CU1 (`2ea4f13`) |
| — | (Button, Card, PageHeader) | — | примитивы | [x] CU3 (`d5c46b5`, `64ca12d`) |
| `login` | `/login` | аноним | экран | [x] CU4 |
| `register` | `/register` | регистрация | экран | [x] CU4 |
| `pending` | `/pending` | заявка/отклонена | экран | [x] CU4 |
| `profile` | `/profile` | активные | экран | [x] CU5 |
| `today` | `/today` | teacher | экран | [x] CU6 |
| `lessons` | `/lessons` | teacher | экран | [x] CU7 |
| `lessonForm` | `/lessons/new`, `/lessons/[lessonId]/edit` | teacher | экран | [x] CU8 |
| `lesson` | `/lessons/[lessonId]` | teacher | экран | [x] CU8 |
| `lessonTable` | `/lessons/[lessonId]/table` | teacher | экран | [x] CU9 |
| `check` | `/check`, `/lessons/[lessonId]/check` | teacher | экран | [x] CU9 |
| `group` | `/group` | teacher | экран | [x] CU10 |
| `bricks` | `/bricks` | teacher, admin | экран | [x] CU11 |
| `calendar` | `/calendar` | teacher, admin | экран | [x] CU11 |
| `rating` | `/rating` | teacher, admin | экран | [ ] CU12 |
| `verses` | `/verses` | teacher, admin | экран | [ ] CU12 |
| `analytics` | `/analytics` | teacher, admin | экран | [ ] CU13 |
| `pupil` | `/analytics/pupils/[pupilId]` | teacher, admin | экран | [ ] CU14 |
| `school` | `/school` | admin | экран | [ ] CU15 |
| `approvals` | `/approvals` | admin | экран | [ ] CU16 |
| `users` | `/users` | admin | экран | [ ] CU16 |
| `userProfile` | `/users/[userId]` | admin | экран | [ ] CU16 |
| `people` | `/people` | admin | экран | [ ] CU17 |
| `groups` | `/groups` | admin | экран | [ ] CU17 |
| `groupEdit` | `/groups/[groupId]` | admin | экран | [ ] CU17 |
| `year` | `/year` | admin | экран | [ ] CU18 |
| `settings` | `/settings` | admin | экран | [ ] CU18 |
| `deletions` | `/deletions` | admin | экран | [ ] CU18 |
| `audit` | `/audit` | admin | экран | [ ] CU18 — **только визуал**; runtime «Something went wrong» не чинить в P10 |
| `privacy` | `/privacy` | аноним | экран | [x] CU4 (статика, без прототип-ключа) |

---

## Commit plan

Один CU = одна тема, ≤ ~400 handwritten строк. **Commit: auto** на границе CU: `node scripts/cu-verify.mjs` (перед `reviewer` — `--full`) → `cu-commit stage` → `reviewer` → `cu-commit commit`. Subject `fix(ui): …` (lowercase). Не push. В stage нет `.env`, `.local`, секретов.

### P10-CU1 — fix(ui): align typography atoms with prototype scale · Review: reviewer · Commit: auto

- [x] P10-T1 · T1 · Spec: UX-03 §6 · [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md)  
      Files: `apps/web/src/components/atoms/**`, `TypeScale.tsx`, `tokens.ts`, `.cursor/rules/ui-prototype-fidelity.mdc` (+ tier, `rules:sync`)  
      Acceptance: атомы по шкале; правило гарнитур Alegreya; секция CU1 в audit md  
      Paths: H [визуал каталога] · N n/a · S n/a  
      **Коммит:** `2ea4f13`

**CU DoD:** lint · test · audit CU1

### P10-CU2 — fix(ui): restore shell header at tablet widths · Review: reviewer · Commit: auto

- [x] P10-T2 · T1 · Spec: [`global_shell_spec.md`](../specs/global_shell_spec.md) §6 · [`responsive_navigation_contract.md`](../../../design/responsive_navigation_contract.md)  
      Files: `apps/web/src/components/shell/**` (кроме правок в CU3)  
      Acceptance: матрица shell × teacher/admin × 390/768/820/1024 в audit; повтор без новых deviation  
      Paths: H · N n/a · S n/a  
      **Коммит:** `96c5d70`

### P10-CU3 — fix(ui): align button and card title with prototype · Review: reviewer · Commit: auto

- [x] P10-T3 · T1 · Spec: UX-03 §8 · прототип BTN / H2  
      Files: `button.tsx`, `card.tsx`, `nav-chrome-classes.ts`, Design Lab matrices/gallery  
      Acceptance: `nav` size; `CardTitle` 1.25rem; topnav ghost не primary-filled; тест `nav-chrome-classes.test.ts`  
      Paths: H · N n/a · S n/a  
      **Коммиты:** `d5c46b5`, `64ca12d`

### P10-CU4 — fix(ui): align auth screens visual chrome · Review: reviewer · Commit: auto

- [x] P10-T4 · T1 · Spec: [`access_and_registration_spec`](../specs/access_and_registration_spec.md) §6  
      Files: `apps/web/src/app/(auth)/**`, `LoginForm.client.tsx`, `privacy` при необходимости  
      Acceptance: матрица `login` / `register` / `pending` / `privacy` × роли × 4 ширины в audit; каждый UI-блок с замером; повтор без новых строк; **не** менять копирайт P09 и ссылку согласия  
      Paths: H · N n/a · S n/a

**CU DoD:** lint · test · smoke открытия маршрутов без нового class A/B

### P10-CU5 — fix(ui): align profile screen blocks · Review: diff-only · Commit: auto

- [x] P10-T5 · T1 · Spec: access spec §9  
      Files: `apps/web/src/app/profile/**`  
      Acceptance: матрица `profile` × активная роль × 4 ширины; кнопки/секции по прототипу (не переопределять P09 CTA-логику)  
      Paths: H · N n/a · S n/a

### P10-CU6 — fix(ui): align teacher today layout · Review: diff-only · Commit: auto

- [x] P10-T6 · T1 · Spec: P03 today · прототип `vToday`  
      Files: `apps/web/src/app/(app)/today/**`  
      Acceptance: матрица `today` × teacher × 4 ширины; все видимые блоки (карточки, типографика, отступы)  
      Paths: H · N n/a · S n/a

### P10-CU7 — fix(ui): align lessons list row · Review: diff-only · Commit: auto

- [x] P10-T7 · T1 · Spec: P03 `/lessons` · `vLessons`  
      Files: `apps/web/src/app/(app)/lessons/page.tsx`, строка списка  
      Acceptance: матрица `lessons` × teacher × 4 ширины  
      Paths: H · N n/a · S n/a

### P10-CU8 — fix(ui): align lesson card and form · Review: diff-only · Commit: auto

- [x] P10-T8 · T1 · Spec: P03 lesson / lessonForm  
      Files: `apps/web/src/app/(app)/lessons/[lessonId]/**`, `lessons/new/**`, `edit/**`  
      Acceptance: `lesson` + `lessonForm` × teacher × 4 ширины  
      Paths: H · N n/a · S n/a

### P10-CU9 — fix(ui): align check and lesson table · Review: diff-only · Commit: auto

- [x] P10-T9 · T1 · Spec: [`homework_check_flow_spec`](../specs/homework_check_flow_spec.md)  
      Files: check + lesson table routes/components  
      Acceptance: `check` + `lessonTable` × teacher × 4 ширины  
      Paths: H · N n/a · S n/a

### P10-CU10 — fix(ui): align teacher group roster · Review: diff-only · Commit: auto

- [x] P10-T10 · T1 · Spec: school_year contract · analytics §5.6 на `/group`  
      Files: `apps/web/src/app/(app)/group/**`  
      Acceptance: `group` × teacher × 4 ширины  
      Paths: H · N n/a · S n/a

### P10-CU11 — fix(ui): align bricks and calendar · Review: diff-only · Commit: auto

- [x] P10-T11 · T1 · Spec: P03 calendar · P05 bricks  
      Files: `bricks/**`, `calendar/**`  
      Acceptance: оба ключа × teacher + admin × 4 ширины  
      Paths: H · N n/a · S n/a

### P10-CU12 — fix(ui): align rating and verses · Review: diff-only · Commit: auto

- [ ] P10-T12 · T1 · Spec: P05  
      Files: `rating/**`, `verses/**`  
      Acceptance: оба ключа × teacher + admin × 4 ширины  
      Paths: H · N n/a · S n/a

### P10-CU13 — fix(ui): align group analytics · Review: diff-only · Commit: auto

- [ ] P10-T13 · T1 · Spec: [`analytics_screens_spec`](../specs/analytics_screens_spec.md) §5  
      Files: `analytics/**` (группа)  
      Acceptance: `analytics` × teacher + admin × 4 ширины; нет page-level horizontal scroll на 390  
      Paths: H · N n/a · S n/a

### P10-CU14 — fix(ui): align pupil analytics card · Review: diff-only · Commit: auto

- [ ] P10-T14 · T1 · Spec: analytics spec §6  
      Files: `analytics/pupils/**`  
      Acceptance: `pupil` × teacher + admin × 4 ширины  
      Paths: H · N n/a · S n/a

### P10-CU15 — fix(ui): align school summary · Review: diff-only · Commit: auto

- [ ] P10-T15 · T1 · Spec: analytics spec §7  
      Files: `school/**`  
      Acceptance: `school` × admin × 4 ширины  
      Paths: H · N n/a · S n/a

### P10-CU16 — fix(ui): align admin access screens · Review: diff-only · Commit: auto

- [ ] P10-T16 · T1 · Spec: access_requests contract  
      Files: `approvals/**`, `users/**`  
      Acceptance: `approvals`, `users`, `userProfile` × admin × 4 ширины  
      Paths: H · N n/a · S n/a

### P10-CU17 — fix(ui): align people and groups admin · Review: diff-only · Commit: auto

- [ ] P10-T17 · T1 · Spec: school_year contract · admin_flow  
      Files: `people/**`, `groups/**`  
      Acceptance: `people`, `groups`, `groupEdit` × admin × 4 ширины  
      Paths: H · N n/a · S n/a

### P10-CU18 — fix(ui): align year settings deletions audit · Review: diff-only · Commit: auto

- [ ] P10-T18 · T1 · Spec: contracts P02/P06 · shell settings  
      Files: `year/**`, `settings/**`, `deletions/**`, `audit/**`  
      Acceptance: четыре ключа × admin × 4 ширины; `/audit` — только визуал до загрузки ошибки  
      Paths: H · N n/a · S n/a

---

## Verification (phase)

- [ ] Все CU закоммичены; у каждого trace `Review: …`
- [ ] Матрица §4 полностью `[x]`; audit md без незакрытых экранов
- [ ] Phase DoD: нет незадокументированного визуального дрейфа на MVP-маршрутах §4 mapping

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`ui_prototype_fidelity_2026-10-21.md`](../audits/ui_prototype_fidelity_2026-10-21.md) | Журнал замеров |
| [`ai_agent_model_routing.md`](../../../meta/ai_agent_model_routing.md) | DoR, CU, субагенты |
| [`P09_tasks.md`](./P09_tasks.md) | Предыдущий функциональный/копирайт проход |
