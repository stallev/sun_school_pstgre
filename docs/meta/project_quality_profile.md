# Профиль качества — Sunday School

**Тип:** Meta · **Статус:** Canonical · **Канон матрицы:** [`project_quality_profile.template.md`](./project_quality_profile.template.md)

```yaml
quality_profile: lean        # prototype | lean | standard | strict
overrides: {}
modules:
  auth: true                 # Telegram (OIDC) + email/пароль администратора, роли admin / teacher
  design_lab: true           # обязателен на lean / standard / strict
  sentry: true
  s3_uploads: false
  email_jobs: false
  i18n: true                 # ru / en, срезы словарей
  ios_safari_transport: true
```

## Выбранный уровень: Lean

Overrides не заданы — значения D1–D10 соответствуют колонке Lean матрицы [§3 шаблона](./project_quality_profile.template.md).

| # | Измерение | Значение для проекта |
|---|-----------|----------------------|
| D1 | Docs | Волны registry с отметкой `lean` ([registry §5.0](./documentation_creation_registry.md)) |
| D2 | Пути H / N / S | H + N для мутаций и внешнего ввода + S по признакам registry §2.3.2a |
| D3 | DoR / Phase audit | DoR проверяет оркестратор inline; без отдельного `architect` audit |
| D4 | Unit / integration | `packages/domain` + policy-проверки для S-путей; без порога покрытия |
| D5 | E2E | Нет (ручной smoke в Acceptance) |
| D6 | Review-гейт | `reviewer` только для CU с T3 / `Paths: S`; остальное — `diff-only` |
| D7 | Верификация и CI | typecheck + lint + `npm run test` локально перед коммитом |
| D8 | Доступность | Правило `ui-semantics-a11y` |
| D9 | Perf / observability | Sentry включён (выбор владельца) |
| D10 | Модули | Design Lab обязателен; `auth`, `sentry`, `i18n`, `ios_safari_transport` включены; `s3_uploads`, `email_jobs` выключены |

## Обоснование выбора

- Пользователи и нагрузка: учителя и администратор школы, малая нагрузка; MVP заменяет действующее приложение (`docs/my_specs/mvp_scope.md`). Родители и голосовая проверка — post-MVP.
- Персональные данные / платежи: платежей нет; есть ПД учителей и детей (ФИО, согласие на обработку, запросы на удаление). Правило P00 (§2 шаблона) рекомендует для чувствительных PII не ниже `standard`; **владелец осознанно выбрал `lean`** (бумажное согласие, малая аудитория, скорость выхода). Security floor (§5 шаблона) действует полностью; каждый CU с `Paths: S` или в sensitive zone проходит `reviewer`.
- Сроки и команда: скорость выхода в приоритете.
- Модули: `auth` — вход через Telegram и по email + паролю (администратор), роли admin / teacher; `i18n` — словари ru / en; `sentry` — выбор владельца; `ios_safari_transport` — включён владельцем (мобильный клиент учителей); `s3_uploads`, `email_jobs` — вне MVP.
- Входные материалы: `docs/my_specs/*`, `docs/prototypes/sunday_school_prototype.html`.

## Журнал

| Дата | Изменение | Кто |
|------|-----------|-----|
| 2026-10-10 | Профиль создан (P00): lean, без overrides; модули `auth`, `design_lab`, `sentry`, `i18n`, `ios_safari_transport` | пользователь |
