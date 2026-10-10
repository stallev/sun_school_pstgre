# PSI lab journal (Pulse)

Сводки лабораторного PageSpeed Insights. Писать **после** `npm run psi:lab` по явной просьбе. Не коммитить API keys. Канон: [`ai_psi_lab_testing.md`](../implementation/mvp/guides/ai_psi_lab_testing.md).

Зелёная зона: Perf / A11y / Best Practices / SEO ≥ 90 (lab). Flake: второй прогон зелёный при том же LCP — не регресс.

---

## Template

```
### YYYY-MM-DD — origin

Command: `npm run psi:lab -- --suite` (or `--url`)

| Path | Warmup | M Perf | M A11y | M BP | M SEO | D Perf | D A11y | D BP | D SEO | M LCP | M FCP | M CLS | Flake |
|------|--------|--------|--------|------|-------|--------|--------|------|-------|-------|-------|-------|-------|
| / | HIT | | | | | | | | | | | | |

Notes:
```

---

## Entries

### 2026-10-07 — https://fitapp-web-ten.vercel.app

Command: `npm run psi:lab -- --suite` (8 public URLs × mobile/desktop; `PSI_TRAINER_PROFILE_ID=b9f13c28-9d92-4c87-a36c-8bf21b634fe2`). Warmup: all `HIT`. Flake retry: 9 runs.

| Path | Warmup | M Perf | M A11y | M BP | M SEO | D Perf | D A11y | D BP | D SEO | M LCP | M FCP | M CLS | Flake |
|------|--------|--------|--------|------|-------|--------|--------|------|-------|-------|-------|-------|-------|
| `/` | HIT | 81 | 91 | 88 | 100 | 94 | 91 | 100 | 100 | 3027ms | 2577ms | 0.000 | yes |
| `/how-it-was-built` | HIT | 90 | 96 | 100 | 100 | 93 | 96 | 100 | 100 | 3451ms | 1201ms | 0.000 | yes |
| `/features` | HIT | 91 | 96 | 100 | 100 | 98 | 96 | 100 | 100 | 3301ms | 1201ms | 0.000 | no |
| `/trainers` | HIT | 84 | 98 | 100 | 100 | 94 | 93 | 100 | 100 | 3751ms | 1201ms | 0.000 | yes |
| `/auth/login` | HIT | 84 | 100 | 100 | 100 | 96 | 100 | 100 | 100 | 3451ms | 1201ms | 0.000 | yes |
| `/auth/register` | HIT | 66 | 100 | 100 | 100 | 93 | 100 | 100 | 91 | 5551ms | 3342ms | 0.000 | yes |
| `/auth/register/trainer` | HIT | 93 | 100 | 100 | 100 | 86 | 100 | 100 | 100 | 2701ms | 1201ms | 0.000 | yes |
| `/trainers/[id]` | HIT | 86 | 98 | 100 | 100 | 92 | 99 | 100 | 100 | 2701ms | 1201ms | 0.000 | yes |

Notes:

- Зелёные (все 4 категории ≥90, m+d): `/how-it-was-built`, `/features`.
- `/` mobile SI 17s при TTI 3.0s / TBT 0 — lab-шум Speed Index; после retry Perf всё ещё 81 (FCP 2.6s / LCP 3.0s) и BP 88 (`image-aspect-ratio`, `image-size-responsive`, `errors-in-console`).
- Худший: `/auth/register` mobile Perf 66 (FCP 3.3s, LCP 5.6s) — клиентская форма без RSC-shell.
- Не чинить A11y-аудиты на страницах с A11y ≥90 (home `heading-order` / `target-size` / `aria-prohibited-attr` — запас, не блокер).

### 2026-10-07 (post-deploy) — https://fitapp-web-ten.vercel.app

Command: `npm run psi:lab -- --suite` (7 canon paths × mobile/desktop; `PSI_TRAINER_PROFILE_ID` не задан в `.env.local`). Дополнительно: `--url …/trainers/b9f13c28-9d92-4c87-a36c-8bf21b634fe2` mobile + desktop. Warmup: `PRERENDER` / `HIT`. Flake retry: 9 + 1 run.

| Path | Warmup | M Perf | M A11y | M BP | M SEO | D Perf | D A11y | D BP | D SEO | M LCP | M FCP | M CLS | Flake |
|------|--------|--------|--------|------|-------|--------|--------|------|-------|-------|-------|-------|-------|
| `/` | PRERENDER | 88 | 92 | 100 | 100 | 95 | 92 | 100 | 100 | 2701ms | 1201ms | 0.000 | yes |
| `/how-it-was-built` | PRERENDER | 89 | 96 | 100 | 100 | 91 | 96 | 100 | 100 | 3301ms | 1201ms | 0.000 | yes |
| `/features` | PRERENDER | 85 | 96 | 100 | 100 | 99 | 96 | 96 | 100 | 3301ms | 1201ms | 0.000 | yes |
| `/trainers` | PRERENDER | 62 | 98 | 100 | 100 | 96 | 96 | 96 | 100 | 5333ms | 1201ms | 0.000 | yes |
| `/auth/login` | PRERENDER | 80 | 100 | 100 | 100 | 96 | 100 | 100 | 100 | 5401ms | 1201ms | 0.015 | yes |
| `/auth/register` | PRERENDER | 96 | 100 | 100 | 100 | 97 | 100 | 100 | 100 | 2701ms | 1201ms | 0.000 | yes |
| `/auth/register/trainer` | PRERENDER | 65 | 100 | 100 | 100 | 95 | 100 | 100 | 100 | 5626ms | 3296ms | 0.000 | yes |
| `/trainers/[id]` | PRERENDER / HIT | 71 | 98 | 100 | 100 | 93 | 99 | 100 | 100 | 5101ms | 3128ms | 0.000 | yes |

Notes:

- Зелёные (все 4 категории ≥90, m+d): **`/auth/register`** (единственный полный pass).
- Выигрыш после PSI-оптимизаций: `/auth/register` mobile Perf **66→96**, FCP **3.3s→1.2s**, LCP **5.6s→2.7s**; `/` mobile BP **88→100**, Perf **81→88**, LCP **3.0s→2.7s**.
- Регрессии / красная зона mobile Perf: `/trainers` **62** (LCP **5.3s**), `/auth/register/trainer` **65**, `/trainers/[id]` **71** (LCP **5.1s**, FCP **3.1s**), `/auth/login` **80** (LCP **5.4s**), `/features` **85**, `/how-it-was-built` **89** (на 1 pt до 90).
- Для полного suite с `/trainers/[id]` задать `PSI_TRAINER_PROFILE_ID` в `apps/web/.env.local` (см. example).

### 2026-10-07 (wave2 deploy) — https://fitapp-web-ten.vercel.app

Command: `npm run psi:lab -- --suite --json` (7 canon paths × mobile/desktop). Warmup: `HIT`. Flake retry: 4 runs. Доп.: `--url …/trainers/b9f13c28-9d92-4c87-a36c-8bf21b634fe2` mobile only.

| Path | Warmup | M Perf | M A11y | M BP | M SEO | D Perf | D A11y | D BP | D SEO | M LCP | M FCP | M CLS | Flake |
|------|--------|--------|--------|------|-------|--------|--------|------|-------|-------|-------|-------|-------|
| `/` | HIT | 94 | 92 | 100 | 100 | 93 | 92 | 100 | 100 | 2551ms | 1201ms | 0.000 | yes |
| `/how-it-was-built` | HIT | 92 | 96 | 100 | 100 | 98 | 96 | 100 | 100 | 3151ms | 1201ms | 0.000 | no |
| `/features` | HIT | 66 | 96 | 100 | 100 | 98 | 96 | 100 | 100 | 5630ms | 3156ms | 0.000 | yes |
| `/trainers` | HIT | 68 | 98 | 100 | 100 | 90 | 100 | 88 | 92 | 5176ms | 3176ms | 0.000 | yes |
| `/auth/login` | HIT | 93 | 100 | 100 | 100 | 90 | 96 | 96 | 91 | 2551ms | 1201ms | 0.000 | no |
| `/auth/register` | HIT | 93 | 100 | 100 | 100 | 98 | 100 | 100 | 100 | 2551ms | 1201ms | 0.000 | no |
| `/auth/register/trainer` | HIT | 79 | 100 | 100 | 100 | 90 | 100 | 100 | 100 | 4801ms | 1201ms | 0.000 | yes |
| `/trainers/[id]` | PRERENDER | 66 | 98 | 100 | 100 | — | — | — | — | 6076ms | 3104ms | 0.000 | yes |

Notes:

- Зелёные (все 4 категории ≥90, m+d): **`/`**, **`/how-it-was-built`**, **`/auth/login`**, **`/auth/register`**.
- Home wave H: M Perf **88→94**, BP **100**; цель **95+** не закрыта (A11y **92** m+d; `aria-prohibited-attr`, `color-contrast` в failing).
- LCP cluster: `/trainers` M **68** (LCP **5.2s**), `/trainers/[id]` M **66** (LCP **6.1s**), `/auth/register/trainer` M **79** (LCP **4.8s**, лучше 65).
- `/features` mobile Perf **66** при desktop **98** — сильный flake (другой прогон в тот же день давал M **94**); не чинить по одному красному без повтора.
- `lcpElement` в JSON для `/` — **null** (не подтвердили hero vs image).
- Suite без `PSI_TRAINER_PROFILE_ID` — профиль только отдельным `--url`.

### 2026-10-07 (redeploy) — https://fitapp-web-ten.vercel.app

Command: `npm run psi:lab -- --suite --json` (8 public URLs × mobile/desktop; `PSI_TRAINER_PROFILE_ID` задан). Warmup: all `PRERENDER`. Flake retry: 10 runs. Exit code 1 (есть категории &lt; 90).

| Path | Warmup | M Perf | M A11y | M BP | M SEO | D Perf | D A11y | D BP | D SEO | M LCP | M FCP | M CLS | Flake |
|------|--------|--------|--------|------|-------|--------|--------|------|-------|-------|-------|-------|-------|
| `/` | PRERENDER | 91 | 92 | 100 | 100 | 91 | 92 | 100 | 100 | 2701ms | 1201ms | 0.000 | yes |
| `/how-it-was-built` | PRERENDER | 96 | 96 | 100 | 100 | 98 | 96 | 100 | 100 | 2551ms | 1201ms | 0.000 | yes |
| `/features` | PRERENDER | 94 | 96 | 100 | 100 | 92 | 96 | 100 | 100 | 2401ms | 1201ms | 0.000 | yes |
| `/trainers` | PRERENDER | 74 | 98 | 100 | 100 | 93 | 91 | 100 | 100 | 5176ms | 1201ms | 0.000 | yes |
| `/auth/login` | PRERENDER | 95 | 100 | 100 | 100 | 90 | 100 | 100 | 100 | 2701ms | 1201ms | 0.000 | no |
| `/auth/register` | PRERENDER | 88 | 100 | 100 | 100 | 90 | 100 | 100 | 100 | 2551ms | 1201ms | 0.000 | yes |
| `/auth/register/trainer` | PRERENDER | 91 | 100 | 100 | 100 | 96 | 100 | 100 | 100 | 2551ms | 1201ms | 0.000 | no |
| `/trainers/[id]` | PRERENDER | 73 | 98 | 100 | 100 | 91 | 99 | 100 | 100 | 3751ms | 1201ms | 0.000 | yes |

Notes:

- Зелёные (все 4 категории ≥90, m+d): **`/`**, **`/how-it-was-built`**, **`/features`**, **`/auth/login`**, **`/auth/register/trainer`**.
- Ниже 90 только mobile Perf: `/trainers` **74** (LCP **5.2s**, TBT **297ms**), `/trainers/[id]` **73** (LCP **3.8s**, TBT **621ms**), `/auth/register` **88** (SI **6.9s** при LCP **2.6s** / TTI **4.8s**).
- Home цель **95+** не закрыта: M/D Perf **91**, A11y **92** (`aria-prohibited-attr`, `color-contrast`). `lcpElement` снова **null**.
- Против wave2: `/features` M Perf **66→94**, `/auth/register/trainer` M **79→91**, `/trainers` M **68→74**, профиль M **66→73** (desktop впервые **91**). `/` M Perf **94→91**. `/auth/register` M Perf **93→88**.

### 2026-10-07 (post LCP/a11y commit) — https://fitapp-web-ten.vercel.app

Command: `npm run psi:lab -- --suite --json` (8 URLs × m+d; `PSI_TRAINER_PROFILE_ID` задан). Warmup: all `PRERENDER`. Первый запуск оборвался PSI HTTP 400 `FAILED_DOCUMENT_REQUEST` / `ERR_TIMED_OUT`; повтор ~4.3 min, exit code 1.

| Path | Warmup | M Perf | M A11y | M BP | M SEO | D Perf | D A11y | D BP | D SEO | M LCP | M FCP | M CLS | Flake |
|------|--------|--------|--------|------|-------|--------|--------|------|-------|-------|-------|-------|-------|
| `/` | PRERENDER | 90 | 92 | 100 | 100 | 98 | 92 | 100 | 100 | 2551ms | 1201ms | 0.000 | yes |
| `/how-it-was-built` | PRERENDER | 72 | 96 | 100 | 100 | 98 | 96 | 100 | 100 | 5494ms | 3122ms | 0.000 | yes |
| `/features` | PRERENDER | 95 | 96 | 100 | 100 | 99 | 96 | 100 | 100 | 2401ms | 1201ms | 0.000 | no |
| `/trainers` | PRERENDER | 69 | 100 | 100 | 100 | 96 | 93 | 100 | 100 | 5101ms | 1201ms | 0.000 | yes |
| `/auth/login` | PRERENDER | 90 | 100 | 100 | 100 | 90 | 100 | 100 | 100 | 2701ms | 1201ms | 0.000 | yes |
| `/auth/register` | PRERENDER | 89 | 100 | 100 | 100 | 96 | 100 | 100 | 100 | 2551ms | 1201ms | 0.000 | yes |
| `/auth/register/trainer` | PRERENDER | 90 | 100 | 100 | 100 | 99 | 100 | 100 | 100 | 2551ms | 1201ms | 0.000 | no |
| `/trainers/[id]` | PRERENDER | 84 | 100 | 100 | 100 | 91 | 100 | 100 | 100 | 3601ms | 1201ms | 0.000 | yes |

Notes:

- Зелёные (4×4 ≥90 m+d): **`/`**, **`/features`**, **`/auth/login`**, **`/auth/register/trainer`**.
- Красная зона mobile Perf: `/trainers` **69** (LCP **5.1s**), `/how-it-was-built` **72** (LCP **5.5s** — вероятный flake), `/auth/register` **89**, `/trainers/[id]` **84** (было **73**, +11 pt).
- Home A11y **92** без изменений; M Perf **90** (граница зелёной зоны). Desktop `/` Perf **98**.
- `/trainers` M Perf **74→69** при том же LCP ~5.1s — регресс score, не обязательно LCP; нужен subset-повтор.

