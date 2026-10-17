# Session-per-CU orchestration: portable reference

> **Status: INFORMATIONAL. NOT NORMATIVE.**
> This document describes an alternative way to run an implementation phase with AI agents. It is a reference you can study and compare. **Agents MUST NOT follow it instead of the project canon.** The normative protocol is [`agent-phase-orchestration.md`](agent-phase-orchestration.md) together with the project rules (`model-routing`, `agent-commit-pipeline`, `agent-code-review-subagent`). If this document conflicts with them, they win.
>
> **Статус: ознакомительный, не обязательный к исполнению.** Документ описывает альтернативный подход для изучения и сравнения. Агент не выполняет его вместо канона проекта.

Self-contained: it can be copied into a boilerplate repository as is. Project-specific values are marked `<placeholder>`.

---

## 1. The idea in one paragraph

Each commit unit (CU) runs in **its own fresh top-level agent session**. That session is the only LLM orchestrator for the CU: it reads the task, writes the code itself, runs the verification and commit **scripts**, calls a `reviewer` subagent when the CU needs one, and ends. There is no long-lived chat orchestrator above the sessions. The next CU is started either by a **deterministic script loop** (headless mode) or by **the human opening a new session** (manual mode). State lives only in the task file checkboxes and in git.

## 2. How it differs from the canonical approach

| Aspect | Canonical ([`agent-phase-orchestration.md`](agent-phase-orchestration.md)) | Session-per-CU (this document) |
|--------|-----------------------------------------------|--------------------------------|
| Who loops over CUs | A chat agent (thin orchestrator, Cursor) or a script (Claude Code) | Always a script, or the human |
| Who writes the code | An `implementer` subagent per CU (Cursor) | The CU session itself |
| LLM contexts per CU | Orchestrator chat + `implementer` (+ `reviewer`, `architect`) | One session (+ `reviewer`, `architect` when needed) |
| Orchestrator context growth | The chat accumulates short reports from every CU | None: nothing above the session |
| Token cost | Higher: extra cold start per CU, a chat that grows across the phase | Lower: one cold start per CU, no carry-over |
| Human involvement | One launch phrase per phase | Headless: one command per phase. Manual: one new session per CU |
| Needs a headless CLI | No (Cursor) | Yes for the unattended mode |
| Failure handling | The orchestrator chat can react (e.g. spawn a fixer `implementer`) | The session reacts inside its own budget. Otherwise the loop stops and the human decides |

**Trade-off:** session-per-CU is cheaper and simpler, but it either needs a headless CLI with a permission allowlist, or it asks the human to start every CU. The canonical approach keeps the whole phase inside one IDE chat at the cost of more tokens.

## 3. Roles

| Role | Model class | Writes code | Context |
|------|-------------|-------------|---------|
| CU session (main agent) | Workhorse coding model (Sonnet-class, Composer-class) | Yes | Fresh per CU |
| `reviewer` | Frontier reasoning model, read-only, preferably a different family | No | Fresh subagent |
| `architect` | Frontier reasoning model, high effort | Docs only | Fresh subagent |
| `implementer` | Workhorse | Yes | Only if reading for this CU would add > ~20k tokens of noise |
| Driver, verify, commit | **No LLM**: Node scripts | No | n/a |

One delegation level only: the CU session calls subagents, and subagents call nothing.

## 4. Flow

```text
driver (script) or human
  │  picks the first CU whose task checkboxes are not all [x]
  │  refuses to start if the tree is dirty outside that CU's Files
  │  writes .local/phase-runs/<CU>.paths, renders the session prompt (§6)
  ▼
fresh CU session (workhorse model)
  ├─ read only this CU's lines and the linked § sections; DoR inline
  │    DoR fails → one `architect` call (≤15 lines back), then code
  ├─ write code; tick this CU's checkboxes; prune the paths-file to changed files
  ├─ cu-verify [--full]          → log file; session sees exit code + 40-line tail
  │    fails → one retry with the tail → fails again → exit ≠ 0
  ├─ cu-commit stage             → index = paths-file
  ├─ review: `reviewer` subagent reads `git diff --staged` (≤15 lines)
  │          or diff-only by the session itself (one `Review:` line)
  │    blocker → fix → stage → one delta re-review → still blocked: exit ≠ 0
  ├─ cu-commit commit --subject  → hook: commitlint + typecheck + build
  └─ session ends, its context is discarded
  ▼
driver re-reads the task file: CU ticked → next CU · not ticked or exit ≠ 0 → stop
  ▼
all CUs ticked → P{NN}-smoke.md → human: deferred smoke checks, push / PR
```

## 5. Building blocks

The same scripts as the canonical approach. Short contracts:

| Script | Contract |
|--------|----------|
| `phase-driver.mjs` | Pure helpers: parse CU headers (`### P{NN}-CU{k} — type(scope): subject · Review: reviewer\|diff-only · Smoke: none\|deferred\|blocking`), pick the next CU, classify dirty paths, validate paths and commit header. Unit-tested |
| `cu-verify.mjs [--full]` | `lint` + `test`; `--full` adds `typecheck` (only before `reviewer`). Full log to `.local/phase-runs/`, tail to stdout. Never runs the production build |
| `cu-commit.mjs stage\|commit --paths-file <f> [--subject …]` | The only index / commit entry. `stage` adds exactly the listed paths (no secrets, no `..`). `commit` checks index == list, builds `<branch>: <subject>`, commits through the hooks. Rejects `--amend`, `--no-verify`, `push` |
| `run-phase.mjs P{NN}` | Prints the next CU prompt, or (headless mode) loops a fresh CLI session per CU. Exit `0` phase done · `1` failure / dirty tree / CU not ticked · `2` `Smoke: blocking` |
| Git hooks | `pre-commit`: rule-mirror check, lint-staged, build check only when code is staged. `commit-msg`: commitlint |

`.local/` must be gitignored. The task file is the only state.

## 6. Session prompt (template)

The driver renders this per CU. The session gets nothing else.

```text
Execute <CU-ID> per <tasks-file>. Commit: auto is pre-approved; do not ask between steps.
Read only this CU's lines and the linked § sections. Check DoR yourself; if it fails, call `architect` once, then write the code.
Tick this CU's checkboxes in <tasks-file> before committing. Do not write the hash back.
Put exactly the changed paths into <paths-file>, including <tasks-file>. No globs, no secrets.
Run: node scripts/cu-verify.mjs <--full if Review: reviewer>
Run: node scripts/cu-commit.mjs stage --paths-file <paths-file>
<Review: reviewer> Call the `reviewer` subagent with the CU id and the tasks path only; it reads `git diff --staged` and answers in ≤15 lines.
<Review: diff-only> Review the staged diff yourself and print one `Review:` line.
On a blocker: fix, stage again with the same file, one delta re-review. Still blocked: stop with a non-zero result.
Run: node scripts/cu-commit.mjs commit --paths-file <paths-file> --subject "<subject>"
Never call raw git add / git commit / git push. Never run the production build: the hook does it.
If rule sources changed, run the rule-sync script before stage and list the generated mirror.
```

Note for the reference implementation (Sunday School): its driver renders prompts for the canonical approach (an `IMPLEMENTER` block that stops at `RESULT: staged`). To try this approach there, use the template above. Do not reuse the `IMPLEMENTER` block, because it leaves review and commit to an orchestrator.

## 7. Running it in Claude Code

### 7.1 Headless (unattended)

```bash
node scripts/run-phase.mjs P02 --environment claude-code > .local/phase-runs/driver.log 2>&1
```

- The driver spawns `claude -p --model <workhorse> --max-turns <N> --output-format json` per CU with the prompt on stdin. `--model` must be explicit, otherwise the session inherits the user's last pick (often a frontier model).
- Run it from a real terminal or as a background job. An agent's own shell tool caps foreground commands (around 10 minutes), and the inherited stdout would flood that agent's context.
- `--output-format json` gives per-CU usage and cost. Keep it next to the logs and compare CUs.
- Subagents come from `.claude/agents/{reviewer,architect,implementer}.md` (`model: opus` / `sonnet`, `reviewer` with read-only tools). Claude Code subagents cannot spawn subagents, which matches the one-level rule.

### 7.2 Manual (one interactive session per CU)

1. `node scripts/run-phase.mjs P02` prints the prompt for the next CU (or use the §6 template).
2. Start a new `claude` session (or `/clear` in the current one) with the workhorse model selected.
3. Paste the prompt. The session finishes the CU and commits.
4. Repeat. `/clear` between CUs is what keeps the context fresh. Do **not** carry on in the same conversation.

### 7.3 Permissions (`.claude/settings.json`)

A headless session cannot answer a permission prompt, so a missing allow rule fails the tool call.

```json
{
  "permissions": {
    "allow": [
      "Bash(node scripts/cu-verify.mjs:*)", "Bash(node scripts/cu-commit.mjs:*)",
      "Bash(npm run lint:*)", "Bash(npm run test:*)", "Bash(npm run typecheck:*)",
      "Bash(npm run rules:sync:*)", "Bash(git status:*)", "Bash(git diff:*)", "Bash(git log:*)",
      "Read", "Edit", "Write", "Grep", "Glob"
    ],
    "deny": [
      "Bash(git push:*)", "Bash(git commit:*)", "Bash(git add:*)", "Bash(git reset --hard:*)",
      "Read(./.env*)", "Edit(./.env*)", "Write(./.env*)"
    ]
  }
}
```

Raw `git commit` / `git add` stay denied: a prefix allow rule would also pass `--amend` / `--no-verify`, and `git add -- .` slips past a deny on `git add .`.

## 8. Running it in Cursor

### 8.1 Manual (one Agent chat per CU)

1. `node scripts/run-phase.mjs P02` in the terminal, then copy the prompt (or fill in the §6 template).
2. **New Agent chat** (not a continuation), workhorse model selected (Composer, not fast).
3. Paste the prompt. The chat does the whole CU: code, `cu-verify`, `stage`, `reviewer` subagent when needed, `commit`.
4. Close the chat and open a new one for the next CU. One chat per CU is the whole point.

Subagents come from `.cursor/agents/{reviewer,architect,implementer}.md`, with `model` pinned in frontmatter and `readonly: true` for `reviewer`. Grant the same permissions as §7.3 through Cursor's auto-run allow / deny lists (or approve the script commands once per chat).

### 8.2 Headless (unattended, optional)

If your Cursor version ships the Cursor Agent CLI with a non-interactive print mode, the driver can call it instead of `claude -p`, one process per CU, with an explicit model and the prompt on stdin. Check the current CLI docs for the exact command name, the flags for model, output format and permissions, and whether project subagents are loaded in that mode. Until this is verified, use the manual mode. The script contract does not change: one process per CU, exit code ≠ 0 stops the loop.

## 9. Stops (both environments)

| Condition | Result |
|-----------|--------|
| Dirty tree outside the CU's Files | Driver refuses to start (exit 1) |
| Blocking open question in the linked spec | Session stops, exit ≠ 0 |
| Verify failed after one retry and one `architect` amendment | Session stops |
| Reviewer blocker after one delta re-review | Session stops, nothing committed |
| Hook failed twice | Session stops |
| Turn / budget limit reached (`--max-turns`) | Session stops |
| CU not ticked after the session | Driver stops (exit 1) |
| `Smoke: blocking` on a finished CU | Driver stops before the next CU (exit 2) |

Re-running the driver resumes from the first CU that is not ticked. Nothing else has to be remembered.

## 10. Context budget per CU (orders of magnitude)

| Item | Enters the session context |
|------|----------------------------|
| Always-on rules + harness prompt | The fixed tax of every fresh session (cached prefix). Keep always-on rules short |
| CU lines + linked § sections | ~5–15k tokens |
| Sources read and edited | ~10–40k tokens |
| `cu-verify`, `cu-commit` | 2 lines, or about 40 lines on failure |
| `reviewer` / `architect` | ≤15 lines each; their own reading stays in their own contexts |
| Previous CUs | 0 |

## 11. When to consider it

- You run phases from Claude Code (or a headless CLI) and token cost matters more than staying in one IDE chat.
- CUs are small and well specified (DoR passes inline), so a single session rarely needs outside help.
- You accept that a failure stops the loop and waits for you, instead of an orchestrator chat attempting a recovery.

Prefer the canonical approach when the phase must run inside a single Cursor chat without a CLI, or when you want the orchestrator to recover from a failed CU automatically.
