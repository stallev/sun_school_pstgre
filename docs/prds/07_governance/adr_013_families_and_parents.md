# ADR-013 — Волна 2: семьи и родители

**Тип:** ADR  
**Статус:** ACCEPTED  
**Версия:** 1.0  
**Дата:** 2026-10-23  
**Волна:** W11 (P13)  
**Зависит от:** [`post_mvp_deferrals.md`](../01_product_scope/post_mvp_deferrals.md) §3.2, [`adr_005_schema_complete_post_mvp_tables.md`](./adr_005_schema_complete_post_mvp_tables.md), [`database_schema_v1.md`](../03_data_model/database_schema_v1.md) §4, §6, [`sunday_school_data_analytics_spec.md`](../../my_specs/sunday_school_data_analytics_spec.md) §2.3–§2.6, §9.2, БП-9, [`domain_invariants.md`](../02_domain_model/domain_invariants.md) INV-25, PKG-03  
**Связанные документы:** [`families_and_parents_contract.md`](../../implementation/mvp/contracts/families_and_parents_contract.md), [`families_and_parents_screens_spec.md`](../../implementation/mvp/specs/families_and_parents_screens_spec.md), [`P13_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P13_phase_description.md), [`architecture_master_index.md`](../architecture_master_index.md)  
**Проверено по:** бизнес-правила — спецификация (СМ-1…СМ-10, СО-1…СО-7, УД-1, БП-9, §9.2). Почта не подключается: модуль `email_jobs` выключен профилем. Cron не вводится: INV-25. Context7 в этой сессии не вызывался: библиотечный контракт не меняется.

---

## 1. Purpose

Зафиксировать, как волна 2 (семьи и роль `parent`) входит в приложение, не ломая MVP при выключенном флаге, и как интерфейс этой волны сверяется с прототипом.

## 2. Scope / Out of scope

**В scope:** флаг `features.parents`, семьи и взрослые, одобрение заявки с ролью `parent`, электронное согласие на данные ребёнка, запрос родителя на удаление, контакты семьи у учителя, запись дайджеста без отправки, dev-фикстуры до UI, сверка UI с прототипом.  
**Вне scope:** голосовая проверка, маршруты `/verse*`, достижение `practice`, письма и Resend, медицинские поля и экстренный контакт (в схеме их нет; БП-9 в этой части не подтверждён).

## 3. Context

Таблицы `family`, `family_adult`, `weekly_digest` и ключ `features.parents = false` уже есть (ADR-005). В MVP согласие на данные ребёнка отмечает admin текстом; заявку с ролью `parent` отклоняют; запрос на удаление данных ребёнка создаёт admin.

Владелец 2026-10-23: спроектировать волну 2 документами по образцу P12; дайджест писать в базу и показывать родителю, письма не слать; перед UI в dev-БД должен быть набор семей и учётка родителя.

## 4. Decision

| # | Решение |
|---|---------|
| 1 | Волна 2 реализуется за флагом `features.parents`. Пока флаг выключен, роль `PARENT` при одобрении недоступна (`ACCESS_ROLE_UNAVAILABLE`), маршруты `/family`, `/child`, `/child/data`, `/child/consent` отвечают 404, учитель не видит контакты семьи, мутации волны отвечают `FAMILY_FLAG_OFF` |
| 2 | Включение флага в prod — действие владельца после условия [`post_mvp_deferrals.md`](../01_product_scope/post_mvp_deferrals.md) §3.2: бумажные согласия собраны, семьи внесены с нуля. Проектирование и код за флагом этому условию не противоречат |
| 3 | Правила семьи (одна семья у ребёнка, не больше одной матери и одного отца, пустая семья не сохраняется) — чистые функции в `@sunschool/domain`. Запись — в транзакции с журналом без ФИО |
| 4 | Родитель правит только свои телефон и email в `family_adult`. Оценки, посещаемость, баллы, достижения и кирпичики — чтение. Медицинские данные и экстренный контакт в эту волну не входят |
| 5 | Отзыв последнего действующего согласия на данные ребёнка создаёт запрос на удаление (СО-6). Если согласие другого взрослого действует, данные остаются, отозвавший теряет доступ к этому ребёнку. Выполняет запрос по-прежнему admin |
| 6 | Дайджест не отправляется. Строка `weekly_digest` создаётся лениво при открытии экрана родителя, одна на пользователя и `period_start`, `sent_at` остаётся пустым. Cron и `email_jobs` не включаются (INV-25) |
| 7 | UI волны обязан совпадать с прототипом [`sunday_school_prototype.html`](../../prototypes/sunday_school_prototype.html): `vFamily`, `vChild`, `vChildData`, `vChildConsent`, блок контактов у учителя, блок дайджеста. Блок голосовых попыток на экране ребёнка скрыт. Это критерий приёмки UI-CU фазы P13 |
| 8 | `db:seed:dev` при маркере БД `dev` создаёт семьи на детях фикстуры, взрослых, согласие бумажное и электронное, одну строку дайджеста и учётку родителя (`PARENT_EMAIL` / `PARENT_PASSWORD`, пароль в репозиторий не попадает) и выставляет `features.parents = true`. `db:seed:reference` флаг не включает и семей не создаёт. Этот набор — предусловие UI-CU |
| 9 | Код MVP и P12 по-прежнему не читает `family` и `recitation_attempt`. Код P13 читает и пишет семьи только за флагом (PKG-03) |

## 5. Rejected alternatives

| Альтернатива | Почему отклонена |
|--------------|------------------|
| Включить Resend и слать дайджест письмом | Модуль `email_jobs` выключен; владелец выбрал показ в интерфейсе |
| Cron раз в неделю | INV-25: в приложении нет фоновых задач; строка создаётся лениво и идемпотентно |
| Пустая семья как черновик | СМ-5: без детей и взрослых семья не сохраняется |
| Доступ parent без членства в семье ребёнка | СМ-2: видны только дети семей, где пользователь — взрослый |
| Медицинские поля в этой волне | В схеме нет колонок; БП-9 в этой части не подтверждён |
| Показать историю голоса на `/child` | Волна 3 |

## 6. Consequences

- Контракт и экранная спецификация волны 2, фаза P13.
- Строки прав AZ-58…AZ-64.
- Action-коды журнала семей, согласия и дайджеста.
- PKG-03 разрешает код P13 для `family` и `family_adult`.
- Уникальность `(user_id, period_start)` на `weekly_digest`, если её ещё нет в миграции, добавляется в CU записи дайджеста.
- UI-CU не коммитится без строки `UI-verify: …, расхождений 0, консоль чистая` и не начинается до CU сида.

## 7. Paths (H / N / S)

| Путь | Описание | Исход |
|------|----------|-------|
| **H** | Флаг включён, admin одобряет заявку и создаёт семью | Пользователь `ACTIVE` с ролью `PARENT`, при входе видит согласие по детям |
| **H** | Флаг выключен | Заявка с `PARENT` отклоняется как сейчас; маршрутов волны нет |
| **N** | Пустая семья, второй родитель того же типа, ребёнок уже в семье при «создать» | Отказ, данные не записаны |
| **N** | Повторное открытие экрана в ту же неделю | Вторая строка дайджеста не создаётся |
| **S** | Parent открывает чужого ребёнка | 404 |
| **S** | Teacher читает адрес семьи | Поля нет в ответе |
| **Drift** | MVP-код читает `family` | Review и PKG-03 |

## 8. Affected documents

| Документ | Что меняется |
|----------|--------------|
| [`families_and_parents_contract.md`](../../implementation/mvp/contracts/families_and_parents_contract.md) | Операции волны |
| [`families_and_parents_screens_spec.md`](../../implementation/mvp/specs/families_and_parents_screens_spec.md) | Экраны и сверка с прототипом |
| [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md) | AZ-58…AZ-64 |
| [`domain_invariants.md`](../02_domain_model/domain_invariants.md) | PKG-03 |
| [`seed_data_spec.md`](../03_data_model/seed_data_spec.md) | Набор D для волны 2 |
| [`post_mvp_deferrals.md`](../01_product_scope/post_mvp_deferrals.md) | Волна 2 спроектирована |
| [`P13_phase_description.md`](../../implementation/mvp/phases_tasks_descriptions/P13_phase_description.md) | Фаза, сид до UI, UI-verify |

## 9. Acceptance criteria

- [ ] При выключенном флаге одобрение с `PARENT` не создаёт семью — исход: тест use-case.
- [ ] Ребёнок не состоит в двух семьях; вторая мать в семье отклоняется — исход: тест domain.
- [ ] Отзыв последнего согласия создаёт запрос на удаление и не стирает данные сам — исход: тест.
- [ ] Повторный заход родителя в ту же неделю не дублирует `weekly_digest`; `sent_at` пуст — исход: тест.
- [ ] `seed:dev` на маркере `dev` создаёт семьи и включает флаг; `seed:reference` — нет — исход: тест сида.
- [ ] UI-CU P13 содержит trace `UI-verify: …, расхождений 0, консоль чистая` — исход: описание фазы.

## 10. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| — | — | — | — |

## 11. Related documents

| Document | Relationship |
|----------|--------------|
| [`adr_005_schema_complete_post_mvp_tables.md`](./adr_005_schema_complete_post_mvp_tables.md) | Таблицы и флаг уже созданы |
| [`adr_012_achievements_and_penalties.md`](./adr_012_achievements_and_penalties.md) | Волна 1 не читает семьи |
| [`post_mvp_deferrals.md`](../01_product_scope/post_mvp_deferrals.md) | Условие включения флага в prod |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — P13

## 12. Agent notes

- Не выдавать `PARENT` и не читать `family`, пока флаг выключен.
- Не слать письма и не заводить cron для дайджеста.
- Не показывать голосовые попытки и не включать `practice`.
- Не начинать UI-CU, пока dev-сид волны 2 не залит.
- Пароли `PARENT_PASSWORD` не копировать в документы, код, коммиты и логи.

## Change log

| Date | Change |
|------|--------|
| 2026-10-23 | v1.0 — ACCEPTED |
