# Промпт: корректировка документации и прототипа, документы фазы P29

Вставить в новый чат целиком. Номер фазы — **P29** (P28 пропускается: в документах он остаётся «как есть», не переименовывать и не удалять).

```text
Задача: (1) внести корректировки в документацию проекта и HTML-прототип по результатам аудита docs/reports/usability_audit_2026-11-13_p28.md (версия 2), (2) создать документы фазы реализации P29 для исправления найденных недостатков. Номер фазы P29; P28 пропускаем (не трогать документы P28, не использовать его номер; если в навигаторах нужен порядок — вставить P29 после P28 без перенумерации). Код продукта не писать — только документы, прототип и правила (по docs/meta/ai_first_project_methodology.md и docs/meta/documentation_creation_registry.md, пути H/N/S).

Контекст (прочитать до работы):
- AGENTS.md, docs/meta/project_quality_profile.md, docs/meta/ai_agent_model_routing.md
- отчёт аудита: docs/reports/usability_audit_2026-11-13_p28.md — разделы 2 (дефекты D-01…D-21), 3 (отступы), 4 (понятность U-01…U-12), 6 (приоритеты), 7 (повторный проход: D-22…D-36, корневая причина R-1, правила «воздуха» 7.3, симметрия 7.4)
- образцы оформления: docs/implementation/mvp/tasks/P27_tasks.md, docs/implementation/mvp/phases_tasks_descriptions/P27_*.md, ADR-017 (оболочка), ADR-018 (термины и TermHint), ADR-019, ADR-020
- правила UI: .cursor/rules/ui-design-system-shadcn.mdc, ui-mobile-first.mdc, ui-semantics-a11y.mdc, ui-prototype-fidelity.mdc; docs/design/visual_identity_contract.md (UX-03), docs/design/ui_states_contract.md, docs/design/canonical_routes.md
- прототип: docs/prototypes/sunday_school_prototype.html

Шаг 1. Корректировка действующей документации (сначала каноны, потом нижестоящие по порядку источников истины из project-context.mdc):
 а) Новый ADR (следующий номер после ADR-020) в docs/prds/07_governance/ — решения: 
    1. R-1 оболочка: раскрытый сайдбар только с xl (≥1280), на lg — рейл 4rem по умолчанию (cookie sidebar_collapsed приоритетнее), ниже — drawer; это поправка к ADR-017 (в ADR-017 добавить пометку «amended by ADR-NNN», решение и отвергнутые альтернативы записать в новом ADR);
    2. токены интервалов --space-hint / label / chip / stack / card / section / page-x (значения из раздела 3.3 отчёта; сверь с UX-03, скорректируй при конфликте с обоснованием) и ESLint-правило против gap-* / space-y-* / p-* вне токенов в product-коде;
    3. высота полей: обычное 40 px (h-9), компактное 36 px (h-8) вместо 45 px (поправка к UX-03 D-9); кнопка рядом с полем наследует высоту поля; интерактивный элемент ≥ 36 px, на мобильных основное действие touch 44 px; зазор в цепочке чипов/табов 8 px;
    4. форма = 12-колоночная сетка, подпись поля фиксированной высоты, значок «?» не меняет высоту подписи, верхние края полей в ряду совпадают ±1 px;
    5. «широкое содержимое» (таблицы, шкалы, графики, pre) прокручивается внутри обёртки и не растягивает страницу; таблицы журнала/списков до lg превращаются в карточки;
    6. правила против «воздуха»: items-start у сеток карточек, чекбоксы/чипы в строку с переносом (шаг ≤ 36 px), вторичные кнопки по ширине содержимого, паддинг карточки по --space-card, пустые состояния ≤ 24 px;
    7. правила значка «?» (раздел 4.3 отчёта): один смысл — один раз на экран, значок после слова, без двоеточий и дублей подписи/кнопки, не внутри кнопки, не в каждой строке таблицы; тест «в словаре и aria-label нет { }».
 б) docs/design/visual_identity_contract.md (UX-03): разделы отступов, контролов (D-9/D-10/D-13/D-14), layout (UX-02 — граница сайдбара); обновить таблицу «Controls» и добавить «Spacing scale».
 в) .cursor/rules/ui-design-system-shadcn.mdc (и ui-mobile-first.mdc при необходимости) — править tier-копию и корень одинаково; затем npm run rules:sync, npm run rules:check.
 г) docs/implementation/mvp/specs/design_system_lab_spec.md: секции «Spacing scale», «Field heights», «TermLabel (позиция, без двоеточий)», «Responsive table → cards».
 д) docs/guidelines (react/ copy_and_messages, typography_text_guidelines) — только там, где расходятся с новыми правилами (grep по терминам «h-10», «gap-», «TermHint»).
 е) Прототип docs/prototypes/sunday_school_prototype.html: привести в соответствие новым правилам экраны /audit (таблица без скролла, форма на сетке, поля 40/36), /people, /groups/[id], /approvals, /year, /today, /bricks, /achievements, /lessons/[id]/table, /lessons/[id]/check (390 и 1024 px), /lessons/new, /groups/[id]/points (карточки до lg), /users; оболочка на 1024 (рейл). Прототип — визуальный референс, он подчинён контрактам.
 ж) docs/prds/02_domain_model и canonical_routes.md — не менять (маршруты не меняются; если окажется иначе — сообщить, а не править молча).

Шаг 2. Документы фазы P29:
 1. Phase DoR audit: один вызов субагента architect (spec-gap) по P29_tasks.md; закрыть найденные дыры в документах.
 2. docs/implementation/mvp/phases_tasks_descriptions/P29_*.md и docs/implementation/mvp/tasks/P29_tasks.md — commit units по приоритетам раздела 6 отчёта:
    P0: R-1, D-01…D-03, D-22, D-23; P1: D-04…D-09, D-13, D-24, U-08; P2: токены интервалов + Button/Chip/SegmentedControl/Field + D-10, D-11, D-15…D-19, D-28, D-29 и «воздух» D-25, D-26, D-30…D-35; P3: U-01…U-12, D-27, D-36.
    Для каждой задачи: Tier, CU, Paths (H/N/S), Goal, Acceptance, ссылки на §, Review: reviewer|diff-only. Acceptance с измеримыми критериями: «scrollWidth страницы == innerWidth на 360/768/1024/1440», «внутреннего скролла (scrollWidth > clientWidth у обёртки) нет на /audit ≥1280 и на /school, /analytics при 1024», «высота поля 40 / компактного 36 px», «зазор в цепочке чипов ≥ 8 px», «верхние края полей в ряду совпадают ±1 px», «доля пустоты карточки с одним блоком ≤ 30 %», «в aria-label нет { }», «под контентом на 1024 px ≥ 900 px».
    Каждый дефект D-xx / U-xx и R-1 — ровно в одной задаче; в конце P29_tasks.md — таблица трассировки «дефект → CU → задача». CU ≤ ~400 строк; T3-задач в фазе быть не должно (auth/policy не затрагиваются) — если появятся, вынести в отдельный CU.
 3. Обновить docs/implementation/mvp/README.md (навигатор: добавить P29, P28 не трогать), раздел «Repository status» в AGENTS.md и project-context.template.mdc (затем npm run rules:sync), при необходимости docs/meta/phase_tasks.template.md не менять.
 4. Прогон: npm run rules:check; grep изменённых терминов по docs/ на расхождения (особенно «45 px», «h-10», «288», «lg» применительно к сайдбару).

Ограничения:
- не расширять объём сверх отчёта; при противоречии контракта и решения — править документ-победитель по порядку источников истины и записывать решение в ADR (с отвергнутыми альтернативами);
- не менять product-код и не запускать dev-сервер; не коммитить без моего запроса (коммит документов — через scripts/cu-commit.mjs по agent-commit-pipeline);
- вопросы, блокирующие DoR (значения токенов, порог двухколоночной проверки ДЗ 1024 vs 1280, высота полей 40/36), задать одним списком в конце, не по одному.

Результат: список созданных/изменённых файлов; таблица трассировки «дефект → CU → задача»; список открытых вопросов; trace-блок «Review: diff-only …».
```
