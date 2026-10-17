# Agent phase orchestration: portable guide

Self-contained canon for running an implementation phase with AI agents, with no human confirmation between commit units. Copy this file into a boilerplate repository as is. Project-specific values are marked `<placeholder>`, and §12 lists what to adapt.

**Reference implementation:** Sunday School (`sun_school_pstgre`). Its scripts `scripts/run-phase.mjs`, `scripts/cu-verify.mjs`, `scripts/cu-commit.mjs`, `scripts/phase-driver.mjs` (pure helpers) and `scripts/phase-driver.test.mjs` implement the contracts in §6.

**Audience:** the agent that implements a phase, and the human who sets the repository up.

---

## 1. Goal and constraints

| Goal | How it is reached |
|------|-------------------|
| The human approves a phase once, not every step | Pre-approved `Commit: auto` in the task file; in Cursor — user rules + `agent-commit-pipeline` (§8) |
| No context build-up across a phase | One **fresh context per commit unit (CU)**: a headless session (Claude Code) or an `implementer` subagent under a thin chat orchestrator (Cursor). State lives in the task file and in git, not in a transcript |
| Low token cost | Deterministic work (verify, stage, commit) runs in **scripts**, not in LLM sessions. Logs go to files, and only a tail of about 40 lines reaches the agent |
| Quality gate kept | One independent `reviewer` per risky CU. Git hooks run the full build |
| Safe failure | Every abnormal state ends the driver with a non-zero exit code. Nothing loops, and nothing is pushed |

**Out of scope:** pushing, opening PRs, deploys, merging. The human does these after the phase.

## 2. Vocabulary

| Term | Meaning |
|------|---------|
| Phase | A set of tasks in `<tasks-dir>/P{NN}_tasks.md` that delivers one product increment |
| Commit unit (CU) | One logical commit: several small tasks on one topic, or one larger task. Risky (T3) work is always its own CU. Target size is ≤ ~400 hand-written lines |
| Task tier | T0 trivial · T1 ready · T2 spec gap · T3 risky (auth, permissions, secrets, migrations, destructive ops) |
| DoR | Definition of Ready: linked spec sections open, acceptance is testable, files are named, no blocking open questions, library versions match the pins |
| Paths H / N / S | Required behaviour descriptions: H happy path, N negative / failure, S security-sensitive |
| Sensitive zone | Path globs where every change counts as risky (`**/auth/**`, `**/api/**`, db, policy, proxy/middleware, env/security config) |
| Quality profile | `prototype` / `lean` / `standard` / `strict`. It sets DoR depth (D3), review depth (D6) and test scope (D7) |

## 3. Roles and model classes

The orchestration is model-agnostic. Pin models in agent definition files, never in prompts.

| Role | Model class | Context | Writes code | When |
|------|-------------|---------|-------------|------|
| **CU session** (main agent) | Workhorse coding model (Sonnet-class, Composer-class) | Fresh per CU | Yes | Every CU |
| `architect` | Frontier reasoning model, high effort (Opus-class, Grok-4.x high) | Fresh subagent | No, edits `docs/**` and the task line only | DoR fails, or the escalation ladder (§7.3) |
| `reviewer` | Frontier reasoning model, read-only tools. A different family from the writer is preferable | Fresh subagent | No | CUs that the profile marks `Review: reviewer` |
| `implementer` | Same as the CU session | Fresh subagent | Yes | **Cursor:** every CU (the chat is a thin orchestrator). **Claude Code:** only when reading for this CU would add > ~20k tokens of noise |
| Search / explore | Fast, cheap model (Haiku-class) | Fresh subagent | No | Broad codebase search |
| Driver | **Not an LLM**: a Node script | n/a | No | Gates each CU; **Cursor Agent** loops in chat |
| Verify / commit | **Not an LLM**: Node scripts | n/a | No | Every CU boundary |

Rules:
- Never spawn a separate "router" or "CU orchestrator" agent. The CU session is the orchestrator.
- Subagents return at most 15 lines. The parent never receives a raw diff, a log or a review transcript.
- **Environment fork (human chooses at phase start):** **`Cursor AI`** — chat loops `run-phase.mjs` with `--environment cursor` (default) as a thin orchestrator and hands each CU to `implementer`. **`Claude Code`** — terminal runs `run-phase.mjs` with `--environment claude-code` (headless `claude -p` loop). See [`prompts/phase-implementation.md`](../../prompts/phase-implementation.md).
- Many headless harnesses do not let a subagent spawn subagents. Every delegation goes from the CU session, one level deep.

## 4. The flow

```text
human: launch phrase with **Среда: Cursor AI | Claude Code** (prompts/phase-implementation.md)
  │
  ├─ Cursor AI ─────────────────────────────────────────────
  ▼
loop until the first stdout line is not `STATUS: cu …`:
  run-phase.mjs P{NN} --environment cursor   ← one invocation per CU
    │  picks the first CU whose task checkboxes are not all [x]
    │  refuses a dirty tree outside that CU's Files (STATUS: dirty, exit 1)
    │  writes .local/phase-runs/<CU>.paths
    │  stdout: STATUS: cu <CU> · === IMPLEMENTER === block · === ORCHESTRATOR === block
    ▼
  same Cursor Agent chat = thin orchestrator (no code, no source / diff reads)
    ├─ `implementer` subagent, fresh per CU, gets the IMPLEMENTER block verbatim:
    │    ├─ read only this CU's lines and the linked § sections; DoR inline
    │    ├─ write code, tick this CU's checkboxes, prune the paths-file
    │    ├─ cu-verify.mjs [--full]   → log file; sees exit code + tail; one retry
    │    ├─ cu-commit.mjs stage      → index = paths-file, nothing else
    │    ├─ diff-only CU: self-review, one `Review:` line
    │    └─ returns ≤15 lines, first line RESULT: staged | dor-fail | verify-fail
    ├─ dor-fail → one `architect` spec-gap → one more `implementer`
    ├─ verify-fail → stop phase
    ├─ `reviewer` CU: `reviewer` subagent reads `git diff --staged` (≤15 lines)
    │    blocker → new `implementer` fixes only the blockers, stages → one delta re-review → still blocked: stop
    ├─ cu-commit.mjs commit --subject → hook: commitlint + typecheck + build
    │    hook fails → new `implementer` with the hook tail → commit again → fails again: stop
    └─ one line "<CU> — <hash>", run run-phase.mjs again (nothing else carries over)

Subagents are called only from the orchestrator (one level deep): nested subagents are not assumed.
  │
  ├─ Claude Code ───────────────────────────────────────────
  ▼
  run-phase.mjs P{NN} --environment claude-code   ← driver loop; fresh claude -p per CU
    (same CU steps inside each headless session; allowlist §8)
  │
  ▼
all CUs ticked → .local/phase-runs/P{NN}-smoke.md → human: smoke + push/PR
```

## 5. Task file contract

The driver parses the task file. The grammar is strict.

### 5.1 CU header

```markdown
### P01-CU3 — feat(auth): configure oidc provider · Review: reviewer · Smoke: deferred · Commit: auto
```

- `### P{NN}-CU{k} — ` starts a CU. Any `## ` heading ends it.
- The first ` · `-separated segment is the **commit subject**: `type(scope): subject`, lowercase, no trailing period. The full header with the branch prefix must be ≤ 120 characters.
- `Review: reviewer|diff-only`. Default `reviewer` (fail safe). Set it from the profile (§9).
- `Smoke: none|deferred|blocking`. Default `none`.
  - `deferred`: a manual check that later CUs do not depend on. Collected into the smoke list at the end of the phase.
  - `blocking`: once this CU is done, the driver stops with exit code 2 before starting the next CU.
- Other segments (`Commit: auto`, completion notes) are ignored by the parser.

### 5.2 Tasks

```markdown
- [ ] P01-T7 · T3 · Spec: [auth_spec §4.2](…) · Contract: […](…)
      Files: `apps/web/src/lib/auth/{config,callbacks}.ts`, `packages/db/src/audit/**`
      Acceptance: <check → expected outcome> · Paths: H, N, S
```

- A CU is **done** only when it has at least one task and every task is `- [x]`. A "✔ done" note in the header does not close the CU.
- `Files:` takes backticked tokens or comma-separated paths. `{a,b}` braces expand. Globs (`*`, `**`) are allowed. They gate the dirty-tree check but never enter the paths-file.

## 6. Scripts

All scripts are Node ESM with no dependencies, cross-platform (`shell: true` on win32 for `npm`), and write logs to `.local/phase-runs/`. That folder **must be gitignored**. Keep the logic in a pure helper module (`phase-driver.mjs`) with unit tests, and keep the CLIs thin.

### 6.1 `phase-driver.mjs`: pure helpers (no git mutations, no network)

| Function | Contract |
|----------|----------|
| `parseCommitUnits(md)` | → `[{ id, subject, review, smoke, tasks, files, done }]` per §5 |
| `decidePhaseStep(units)` | → `complete` (no open CU) · `smoke-blocking` (a done CU before the first open one has `Smoke: blocking`) · `run` (first open CU) |
| `classifyDirtyPaths(dirty, patterns, tasksFile)` | → `{ blocked, continuable }`. A path is allowed if it matches the CU's `Files` or is the task file |
| `pathRefusalReason(p)` | Refuses absolute paths, `..`, `.env`, `.env.*`, and project secret files (`<secrets-file>`) |
| `assertStagePaths(list)` | Non-empty, no refused paths, deduplicated |
| `assertCommitIndex(staged, allowed)` | The index must **equal** the list: no extra, no missing |
| `buildCommitMessage(branch, subject)` | `<branch>: <subject>`. Validates type, scope, lowercase, no period, ≤ 120 characters |
| `renderSessionPrompt({unit, tasksPath, pathsFile, harness})` | The only prompt per CU (§7.1). `claude`: one session prompt. `cursor`: `=== IMPLEMENTER ===` block (code → verify → stage) + `=== ORCHESTRATOR ===` block (architect / reviewer / commit) |
| `renderStatusLine(state, id)` | `STATUS: cu\|complete\|smoke-blocking\|dirty <id>` — the first stdout line of the driver |
| `parseCuCommitArgs` / `parseRunPhaseArgs` | Strict argument parsing. `--amend`, `--no-verify`, `--force`, `push` are rejected outright |
| `logTail(text, 40)` | The last N lines, which are all an agent ever sees of a log |

### 6.2 `cu-verify.mjs [--full]`

- Always runs `lint` and `test`. `--full` adds `typecheck`.
- `--full` is used **only before `reviewer`**, so the reviewer never reads a red diff. Diff-only CUs leave typecheck to the hook.
- It does **not** run the production build. The pre-commit hook does.
- Stops at the first failing step. Output: `cu-verify: ok` plus the log path, or the failing label, a tail of 40 lines, the log path and a non-zero exit.

### 6.3 `cu-commit.mjs stage|commit --paths-file <f> [--subject "<type(scope): subject>"]`

- The **only** way an agent writes to the index or creates a commit.
- `stage`: validates the list (§6.1), resolves every path inside the repository, drops paths that `git status --porcelain --untracked-files=all` does not report as changed (a listed directory stays if anything under it changed), then runs `git add -- <paths>`.
- `commit`: applies the same drop, builds the header from `git branch --show-current` plus the subject, checks that the index equals the list, runs `git commit -m`, and prints the hash, the hook output tail and the log path.
- A hook failure gives exit 1 and a tail. The agent fixes the cause and runs `commit` again. Never `--amend`.

### 6.4 `run-phase.mjs P{NN} [--environment cursor|claude-code] [--harness cursor|print|claude] [--model <workhorse>] [--max-turns N]`

- **`--environment cursor` (default)** — **Cursor AI**: one CU per invocation (`harness cursor`). Decide → dirty-tree gate → paths-file → `STATUS: cu <CU>` and the two-block prompt on **stdout** → exit `0`. The chat orchestrates the CU through `implementer` and calls the driver again. Every outcome prints its `STATUS:` line first, so exit `0` for "phase complete" and for "next CU" is never ambiguous. Do **not** run a multi-hour foreground command in the agent shell (~10 min cap).
- **`--environment claude-code`** — **Claude Code**: sets `harness claude`; driver **loops** `claude -p` per CU until the phase ends or fails. Run from a real terminal or a **background** task with log redirect (see launch prompt). On Windows resolves `claude` via `where.exe`.
- **`--harness print`** — dry-run label; same as `cursor` for prompt output.
- Conflicting `--environment` and `--harness` (e.g. `cursor` + `claude`) → exit `1`, reason `environment-harness`.
- When the phase completes, the driver writes `P{NN}-smoke.md` with every `Smoke: deferred` CU.

**Headless command (Claude Code only, `--harness claude`):**

```bash
claude -p --model <workhorse> --max-turns <N> --output-format json < prompt.txt
```

Pass `--model` explicitly. `--output-format json` returns usage and cost; the driver saves `.local/phase-runs/<CU>-session-<time>.json`. **Cursor** does not use this path — token usage is visible in the Cursor UI, not in session JSON files.

### 6.5 Exit codes (driver)

| Code | Meaning | Human action |
|------|---------|--------------|
| 0 | Phase complete | Walk the smoke list, decide push / PR |
| 1 | Dirty tree outside the CU · CU not ticked after the CU work · Claude CLI not found (`--harness claude`) · session failed (verify failed twice, hook failed twice, reviewer blocker after delta re-review, `--max-turns` hit, blocking open question) | Read logs in `.local/phase-runs/`, fix, re-run `run-phase.mjs P{NN}` from the chat. It resumes from the first open CU |
| 2 | `Smoke: blocking` on a finished CU | Run the smoke check, change the header to `deferred`/`none`, re-run |

## 7. The CU session

### 7.1 Prompt (rendered by the driver; do not add more)

Below is the single-session form (`claude`). The `cursor` form splits the same steps: 1–4 and verify / stage go to the `IMPLEMENTER` block, review / commit / escalation to the `ORCHESTRATOR` block (§4).

1. `Execute <CU> per <tasks file>.` `Commit: auto` is pre-approved. Do not ask between steps.
2. Read only this CU's lines and the linked `§`. Check DoR yourself. If DoR fails, call `architect` once, then write the code.
3. Tick this CU's checkboxes **before** the commit. Do not write the hash back afterwards, because that would need a second commit.
4. Write the exact concrete paths into the paths-file, including the task file. No globs, no secrets.
5. `cu-verify` (`--full` if `Review: reviewer`) → `cu-commit stage` → review → `cu-commit commit --subject "<subject>"`.
6. Blocker: fix → `stage` with the same list → one delta re-review.
7. Never call raw `git add` / `git commit`. Never run the production build. If rule sources changed, run the rule-sync script before `stage` and list the generated mirror.

### 7.2 Review gate

- `reviewer` prompt: the CU id, the task file path, and "read `git diff --staged` yourself; answer ≤ 15 lines: blockers / suggestions / verified". **Do not** pass the author's summary or a draft commit message.
- Protocol: 2a **problem** (from the tasks, not from the diff) → 2b **expected shape** (before reading hunks: checklist rows plus every required H/N/S path) → 2c **diff** (findings must cite a defect or a canon rule. "I'd do it differently" is not a finding).
- Diff-only: the session itself checks the same three steps and prints one line, `Review: diff-only — <CU>, <n> lines`.
- Budget: one `reviewer` per CU, at most one delta re-review. Suggestions never trigger a re-review.

### 7.3 Escalation ladder

1. Verify / acceptance fails → retry once with the exact error tail.
2. Fails again → one `architect` call amends the spec or plan (docs only).
3. Re-apply once.
4. Still failing → exit non-zero. Never loop.

## 8. Permissions (the real source of "please confirm")

In **Cursor Agent**, follow user rules and **`agent-commit-pipeline`**: only `cu-commit.mjs` mutates git; no push; hooks always on. Enable auto-run for `node scripts/cu-verify.mjs`, `node scripts/cu-commit.mjs`, and read-only git commands where your team policy allows.

For **optional Claude Code CLI** (`--harness claude`), headless sessions cannot answer permission prompts — commit a settings file.

**Claude Code (`.claude/settings.json`) — optional CLI only:**

```json
{
  "permissions": {
    "allow": [
      "Bash(node scripts/cu-verify.mjs:*)",
      "Bash(node scripts/cu-commit.mjs:*)",
      "Bash(npm run lint:*)", "Bash(npm run test:*)", "Bash(npm run typecheck:*)",
      "Bash(npm run rules:sync:*)", "Bash(npm run rules:check:*)", "Bash(npm run deps:check:*)",
      "Bash(git status:*)", "Bash(git diff:*)", "Bash(git log:*)",
      "Edit", "Write", "Read", "Grep", "Glob"
    ],
    "deny": [
      "Bash(git push:*)", "Bash(git commit:*)", "Bash(git add:*)",
      "Bash(git reset --hard:*)", "Bash(git rebase:*)",
      "Read(./.env*)", "Edit(./.env*)", "Write(./.env*)"
    ]
  }
}
```

- Do **not** allow raw `git commit`. A prefix rule also allows `--amend` / `--no-verify`, and deny-by-substring is unreliable. The script refuses those flags itself.
- Do not allow raw `git add`, because `git add -- .` slips past a deny on `git add .`.
- **Cursor (canonical):** Shell for verify/commit scripts and read-only git; deny raw `git add` / `git commit` / `push` via discipline and `cu-commit.mjs`, not only UI toggles.

## 9. Required rules and docs

Each rule below is a file under `<rules-dir>` (for example `.cursor/rules/*.mdc`, mirrored to `.claude/rules/*.md` by a sync script). The clauses are mandatory. The wording is yours.

| Rule / doc | Must state |
|------------|------------|
| `model-routing` | Tier classification line `Tier: … · CU: …`; the DoR checklist; when to delegate (DoR fail, > 20k noise, parallel non-overlapping files, context near the limit, review); never spawn a router; escalation ladder; the phase-driver paragraph (fresh session per CU, scripts only, no build in session) |
| `agent-commit-pipeline` | Trigger: CU boundary (auto) or explicit request only; pipeline `cu-verify → cu-commit stage → review → cu-commit commit → hook`; guards (green verify, no blockers, only CU files staged, no secrets, subject = CU header); never push / amend / no-verify; commit header format `<branch>: type(scope): subject` |
| `agent-code-review-subagent` | Single sensitive-zone list; depth table `skip / diff-only / reviewer`; profile shift (D6); the three-pass protocol; budget (one reviewer per CU, one delta re-review); trace line `Review: …` always |
| `project_quality_profile` | D3 (DoR: inline vs architect audit), D6 (which CUs get `reviewer`), D7 (which checks run before commit) |
| `phase_tasks.template` | CU header grammar (§5.1) including `Review` and `Smoke`; task format (§5.2) |
| Agent definitions (`<agents-dir>/{architect,reviewer,implementer}.md`) | Pinned `model`; `reviewer` is read-only (tools: Read, Grep, Glob, Bash for git read commands); return ≤ 15 lines |
| Launch prompt (`prompts/phase-implementation.md`) | Start phrase **must** name environment (`Cursor AI` or `Claude Code`); matching `--environment`; commits pre-approved; no push |

Profile → `Review:` mapping:

| Profile | `reviewer` for |
|---------|----------------|
| `prototype` | none (diff-only, plus the T3 checklist on `Paths: S`) |
| `lean` | T3 / `Paths: S` / runtime code in a sensitive zone |
| `standard`, `strict` | any CU with runtime code |

## 10. Git hooks

- `pre-commit`: rule-mirror check → lint-staged → a build check that runs **only when code or build config is staged** (build isolation, typecheck, production build). Docs-only commits stay instant.
- `commit-msg`: commitlint that accepts an optional `<branch>: ` prefix before the conventional header.
- Hooks are the last deterministic gate. The session never re-runs what the hook runs.

## 11. Context budget rules

| Source | Rule |
|--------|------|
| Always-on rules / project instructions | Keep them lean. Every fresh session pays for them. Scope rules by `paths`/`globs` wherever possible |
| Task reading | Only the CU's lines plus the linked `§`, never whole PRDs |
| Logs | File plus a 40-line tail, never the full output |
| Diff | Only the `reviewer` reads it, in its own context |
| Subagent output | ≤ 15 lines |
| Across CUs | Nothing carries over. The next session reads the task file |
| Hard ceiling | Cursor: model/context limits per chat; optional `--max-turns` only for `--harness claude` |

## 12. Adapting to a new repository

1. Copy the five scripts and the test file. Set `<tasks-dir>`, the task-file name pattern, `<secrets-file>` and the commit type list.
2. Add `.local/` to `.gitignore`. Add the scripts to `npm` scripts (`cu:verify`, `cu:commit`, `phase:run`) and the test glob to the test runner.
3. Commit the permission settings (§8).
4. Create or adapt the rules and docs in §9. Set the quality profile.
5. Install the hooks (§10).
6. Write a phase task file with CU headers. Dry-run with `run-phase.mjs P01` and check the prompt on stdout.
7. Run one CU in Cursor Agent (driver once → implement → commit → driver again) before you trust a full phase.

## 13. Known pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Headless session fails on its first `npm`/`node` call | No allow rule. Headless sessions cannot prompt | §8 settings file |
| CU session runs on an expensive frontier model | No `--model` in the headless command | Pass the workhorse model explicitly |
| `cu-commit commit` fails with `missing=` | The paths-file lists a file that was not changed | `cu-commit` drops listed paths that `git status --porcelain` does not report (prints `unchanged: …`), and the session prompt asks to prune them. The driver pre-fill is a starting point, not the answer |
| Phase started as one long `run-phase --harness claude` in Cursor shell | Foreground cap ~10 min; wrong harness for Cursor | Use default `cursor` harness: **one** `run-phase.mjs P{NN}` per CU inside the chat, not a background Claude CLI loop |
| Context of the phase chat overflows after a few CUs (P02: 3 of 10) | The chat wrote code, read logs and review answers for every CU itself | Thin orchestrator (§4): each CU goes to a fresh `implementer`; the chat keeps only `RESULT` / `Review` / hash lines. A new chat with the same launch phrase resumes from the checkboxes if a limit is still hit |
| `claude.cmd` not found on Windows (`--harness claude`) | WinGet installs `claude.exe` without `.cmd` shim | Use Cursor harness (default), or let the driver resolve `claude` via `where.exe` |
| Commit has the build log in context | Raw `git commit` | Only `cu-commit.mjs` |
| Driver loops on the same CU | The session did not tick checkboxes | The driver already stops with exit 1. Fix the prompt or the task grammar |
| Reviewer approves its own style | The same model family as the writer, sharing the writer's context | Fresh context always. Prefer a different model family for `reviewer` |
