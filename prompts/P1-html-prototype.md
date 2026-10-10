# P1 — HTML-прототип (visual reference)

## Роль
Senior UI Designer — single-file HTML prototype.

## Preconditions
- [ ] P0 complete
- [ ] Product brief или `docs/default_docs/` с scope, pages, roles
- [ ] Канонический каталог **`docs/prototypes/`** (не `docs/prototype/`)

## Inputs
- `docs/default_docs/*` — MVP scope, pages, roles
- Существующий seed (если есть): `docs/prototypes/{{MAIN_PROTOTYPE_HTML}}`
- Claude Desktop seed prompt: [`P1-html-prototype-claude-desktop.md`](P1-html-prototype-claude-desktop.md)
- Pulse prototype sample: `docs/examples/pulse/docs/prototypes/` (pattern only — не копировать UI)
- UX principles (если есть draft)
- Context7: Tailwind v4 Play CDN (`/websites/tailwindcss` — `@tailwindcss/browser@4`, `@theme`, `type="text/tailwindcss"`)

## Режимы

| Режим | Когда | Действие |
|--------|--------|----------|
| **Ingest** | Файл `docs/prototypes/{{MAIN_PROTOTYPE_HTML}}` уже есть | Не перезаписывать с нуля. Сверить с контрактом ниже; дописать экраны/`id`/role switcher; выписать token dump в HTML-комментарий, если его нет |
| **Create** | Файла нет | Создать `docs/prototypes/{{MAIN_PROTOTYPE_HTML}}` |

## Task

1. **Один файл:** inline CSS (только слой токенов) + JS, Tailwind v4 Play CDN:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
   <style type="text/tailwindcss">
     :root { /* semantic CSS variables */ }
     .dark { /* same names */ }
     @theme inline { --color-background: var(--background); /* … */ }
   </style>
   ```
2. **Разметка:** только утилиты Tailwind v4. **Запрещены** domain-specific CSS-классы (`.hero`, `.card-title`) и `style=""` на элементах.
3. **Mobile-first:** baseline 390px, проверка `md`
4. **Role switcher:** переключение видимых секций по ролям ({{USER_ROLES}})
5. **Компоненты:** shadcn/Material You aesthetic — rounded, elevation, semantic spacing (`bg-background`, `bg-primary`, …)
6. **Секции:** `id` на каждый экран для будущего `prototype_route_mapping.md`
7. **Token dump:** HTML-комментарий в `<head>` — вход для W2 `visual_identity_contract.md` и P6 `globals.css`

## Source-of-truth
Прототип = **visual reference only**. При конфликте с PRD/schema — побеждает PRD.

## Out of scope
- Next.js routes, API, real auth
- Copy-paste Pulse fitness UI verbatim
- Каталог `docs/prototype/` (ед. ч.)

## Verification
- [ ] Режим ingest: исходный seed не потерян (токены/шрифты сохранены, если не противоречат spec)
- [ ] Все MVP screens из pages brief представлены (или явный gap-список в комментарии)
- [ ] Role switcher работает
- [ ] 390px + md проверены
- [ ] Нет собственных CSS-классов кроме токенов в `type="text/tailwindcss"`
- [ ] Файл открывается локально без build (нужна сеть для Play CDN)

## Next
→ [`P2-doc-registry.md`](P2-doc-registry.md)
