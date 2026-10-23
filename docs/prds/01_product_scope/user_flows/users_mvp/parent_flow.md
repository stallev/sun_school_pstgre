# User flow — Parent (волна 2)

**Тип:** PRD (user flow)  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-10-23  
**Волна:** W1-F4  
**Зависит от:** [`post_mvp_deferrals.md`](../../post_mvp_deferrals.md) §3.2, [`adr_013_families_and_parents.md`](../../../07_governance/adr_013_families_and_parents.md), [`families_and_parents_contract.md`](../../../../implementation/mvp/contracts/families_and_parents_contract.md), [`sunday_school_prototype.html`](../../../../prototypes/sunday_school_prototype.html)  
**Связанные документы:** [`admin_flow.md`](./admin_flow.md), [`teacher_flow.md`](./teacher_flow.md), [`canonical_routes.md`](../../../../design/canonical_routes.md), [`families_and_parents_screens_spec.md`](../../../../implementation/mvp/specs/families_and_parents_screens_spec.md)

---

## 1. Purpose

Описать путь родителя после включения `features.parents`. Читают: исполнитель P13. Правила — в контракте семей, не здесь.

## 2. Scope / Out of scope

**В scope:** одобрение заявки, экран согласия, успехи ребёнка, данные и согласия, свои контакты, дайджест на странице, календарь на чтение, запрос на удаление данных ребёнка.  
**Вне scope:** голос и `/verse*`; письма; страница семьи admin (её ведёт администратор); выполнение удаления.

Пока флаг выключен, этого пути нет: заявку с ролью родителя отклоняют.

## 3. Flows

### 3.1 Заявка и семья

| Шаг | Действие | Исход |
|-----|----------|-------|
| 1 | Пользователь отправляет заявку, как учитель | Статус «Заявка на рассмотрении» |
| 2 | Admin одобряет с ролью `parent` и выбирает связь: существующий взрослый, добавить в семью ребёнка или создать семью | Учётка активна, есть роль и членство в семье |
| 3 | Первый вход | Экран согласия по каждому ребёнку без электронного согласия этого взрослого |

### 3.2 Согласие и успехи

| Шаг | Действие | Исход |
|-----|----------|-------|
| 1 | Отмечает согласие (флажок по умолчанию снят) | Данные этого ребёнка открываются |
| 2 | Открывает успехи | Посещаемость, динамика, кирпичики; достижения и штрафы — если включён флаг достижений. Голоса нет |
| 3 | Открывает страницу в ту же неделю ещё раз | Дайджест тот же, письмо не уходит |

### 3.3 Данные, контакты, удаление

| Шаг | Действие | Исход |
|-----|----------|-------|
| 1 | Правит свои телефон и email | ФИО и тип связи не меняются |
| 2 | Отзывает согласие, и оно последнее | Подтверждает удаление; создаётся запрос; данные стирает admin |
| 3 | Отменяет запрос, пока он не выполнен | Запрос отменён |
| 4 | Открывает календарь | События групп своих детей, без правки |

*Negative:* чужой ребёнок — страница не найдена. Teacher этот поток не проходит.

## 4. Open questions

| ID | Вопрос | Владелец | Блокирует |
|----|--------|----------|-----------|
| — | — | — | — |

## 5. Related documents

| Document | Relationship |
|----------|--------------|
| [`families_and_parents_contract.md`](../../../../implementation/mvp/contracts/families_and_parents_contract.md) | Операции |
| [`P13_phase_description.md`](../../../../implementation/mvp/phases_tasks_descriptions/P13_phase_description.md) | Фаза |

**Registry:** [`documentation_creation_registry.md`](../../../../meta/documentation_creation_registry.md) — wave W1-F4

## Change log

| Date | Change |
|------|--------|
| 2026-10-23 | v1.0 — Canonical (волна 2, P13) |
