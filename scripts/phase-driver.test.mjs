import { describe, expect, it } from "vitest";
import {
  LOG_TAIL_LINES,
  assertCommitIndex,
  assertStagePaths,
  buildCommitMessage,
  classifyDirtyPaths,
  decidePhaseStep,
  logTail,
  parseCommitUnits,
  parseCuCommitArgs,
  parsePorcelain,
  parseRunPhaseArgs,
  partitionChangedPaths,
  renderSessionPrompt,
  summarizeSessionResult,
} from "./phase-driver.mjs";

const TASKS = `
## Phase DoR audit

- [x] Все задачи прошли DoR

## Commit plan

### P01-CU1 — feat(domain): add role constants · Review: diff-only · Commit: auto · ✔ выполнен 2026-10-11

- [x] P01-T1 · T1 · Files: \`packages/domain/src/constants/{user-role,account-status}.ts\`
      Acceptance: списки совпадают → тест зелёный
      Paths: n/a — константы без поведения

### P01-CU2 — feat(db): add audit writer · Review: reviewer · Commit: auto · Smoke: blocking

- [x] P01-T2 · T3 · Files: \`packages/db/src/audit/write-audit.ts\`, \`packages/policy/**\`
      Paths: S [change_log §5]

### P01-CU3 — feat(web): add shell · Review: diff-only · Commit: auto · Smoke: deferred · ✔ выполнен

- [ ] P01-T3 · T1 · Files: \`apps/web/src/app/layout.tsx\`
      Paths: H [shell §4]
- [x] P01-T4 · T0 · Files: \`apps/web/src/lib/messages/shell.ts\`
      Paths: n/a — copy
`;

describe("parseCommitUnits", () => {
  const units = parseCommitUnits(TASKS);

  it("reads the first open CU from checkboxes, not from the done mark in the header", () => {
    expect(units.map((unit) => [unit.id, unit.done, unit.review, unit.smoke])).toEqual([
      ["P01-CU1", true, "diff-only", "none"],
      ["P01-CU2", true, "reviewer", "blocking"],
      ["P01-CU3", false, "diff-only", "deferred"],
    ]);
    expect(decidePhaseStep(units)).toMatchObject({
      action: "smoke-blocking",
      blocking: { id: "P01-CU2" },
      next: { id: "P01-CU3" },
    });
  });

  it("expands brace paths and keeps glob paths", () => {
    expect(units[0].files).toEqual([
      "packages/domain/src/constants/user-role.ts",
      "packages/domain/src/constants/account-status.ts",
    ]);
    expect(units[1].files).toEqual(["packages/db/src/audit/write-audit.ts", "packages/policy/**"]);
  });

  it("runs the next CU when no earlier CU has blocking smoke", () => {
    const open = parseCommitUnits(`
### P02-CU1 — feat(web): add page · Review: reviewer · Commit: auto
- [ ] P02-T1 · T1 · Files: \`apps/web/src/app/page.tsx\`
`);
    expect(decidePhaseStep(open)).toMatchObject({ action: "run", unit: { id: "P02-CU1" } });
  });
});

describe("paths", () => {
  it("refuses secrets, parent segments, and an empty list", () => {
    expect(assertStagePaths([]).reason).toBe("empty");
    for (const filePath of [".env", ".env.local", "apps/web/.env.prod", ".local/dev-secrets.json", "../secrets"]) {
      expect(assertStagePaths([filePath]).ok).toBe(false);
    }
    expect(assertStagePaths(["apps/web/src/app/page.tsx"]).paths).toEqual(["apps/web/src/app/page.tsx"]);
  });

  it("requires the staged index to equal the allow-list", () => {
    expect(assertCommitIndex(["a.ts"], ["a.ts", "b.ts"]).reason).toBe("mismatch");
    expect(assertCommitIndex(["a.ts", ".env"], ["a.ts"]).extra).toEqual([".env"]);
    expect(assertCommitIndex(["a.ts"], ["a.ts"]).ok).toBe(true);
    expect(assertCommitIndex([], ["a.ts"]).reason).toBe("empty");
  });

  it("blocks dirty paths outside the CU file list and the tasks file", () => {
    const dirty = classifyDirtyPaths(
      ["apps/web/src/app/layout.tsx", "apps/web/src/app/page.tsx", "docs/implementation/mvp/tasks/P01_tasks.md"],
      ["apps/web/src/app/layout.tsx", "packages/policy/**"],
      "docs/implementation/mvp/tasks/P01_tasks.md",
    );
    expect(dirty.blocked).toEqual(["apps/web/src/app/page.tsx"]);
    expect(dirty.continuable).toEqual([
      "apps/web/src/app/layout.tsx",
      "docs/implementation/mvp/tasks/P01_tasks.md",
    ]);
    expect(classifyDirtyPaths(["packages/policy/server/src/context.ts"], ["packages/policy/**"], "tasks.md").blocked).toEqual(
      [],
    );
  });

  it("drops listed paths that git does not report as changed", () => {
    const changed = parsePorcelain(" M apps/web/src/a.ts\n?? .claude/rules/new-rule.md\n D docs/old.md\n");
    expect(
      partitionChangedPaths(
        ["docs/tasks.md", "apps/web/src/a.ts", "apps/web/src/b.ts", ".claude/rules/", "./docs/old.md"],
        changed,
      ),
    ).toEqual({
      kept: ["apps/web/src/a.ts", ".claude/rules/", "docs/old.md"],
      unchanged: ["docs/tasks.md", "apps/web/src/b.ts"],
    });
    expect(partitionChangedPaths(["apps/web/src/a"], ["apps/web/src/ab.ts"]).kept).toEqual([]);
  });

  it("reads a rename target from porcelain", () => {
    expect(parsePorcelain(' M apps/web/src/a.ts\nR  old.ts -> new.ts\n?? "docs/my file.md"\n')).toEqual([
      "apps/web/src/a.ts",
      "new.ts",
      "docs/my file.md",
    ]);
  });
});

describe("commit message", () => {
  it("prefixes the branch and rejects a subject commitlint would reject", () => {
    expect(buildCommitMessage("feature/P01", "feat(domain): add role constants")).toEqual({
      ok: true,
      message: "feature/P01: feat(domain): add role constants",
    });
    expect(buildCommitMessage("feature/P01", "Feat(domain): add role constants").reason).toBe("subject");
    expect(buildCommitMessage("feature/P01", "feat(domain): add role constants.").reason).toBe("subject");
    expect(buildCommitMessage("feature/P01", `feat(domain): ${"a".repeat(120)}`).reason).toBe("length");
    expect(buildCommitMessage("", "feat(domain): add role constants").reason).toBe("branch");
  });

  it("rejects amend and a raw commit mode", () => {
    expect(parseCuCommitArgs(["commit", "--paths-file", "paths.txt", "--subject", "feat: add", "--amend"]).reason).toBe(
      "forbidden",
    );
    expect(parseCuCommitArgs(["commit", "--no-verify", "--paths-file", "paths.txt"]).reason).toBe("forbidden");
    expect(parseCuCommitArgs(["stage", "--paths-file", "paths.txt"])).toMatchObject({ ok: true, mode: "stage" });
  });
});

describe("log tail", () => {
  it("keeps the last 40 lines", () => {
    const text = Array.from({ length: 45 }, (_, index) => `line ${index}`).join("\n");
    const tail = logTail(text).split("\n");
    expect(tail).toHaveLength(LOG_TAIL_LINES);
    expect(tail[0]).toBe("line 5");
    expect(tail[39]).toBe("line 44");
  });
});

describe("run-phase args", () => {
  it("defaults to cursor environment, 40 turns and the sonnet model", () => {
    expect(parseRunPhaseArgs(["P01"])).toEqual({
      ok: true,
      phase: "P01",
      harness: "cursor",
      environment: "cursor",
      maxTurns: 40,
      model: "sonnet",
    });
  });

  it("accepts print as an alias of cursor", () => {
    expect(parseRunPhaseArgs(["P01", "--harness", "print"]).harness).toBe("print");
  });

  it("maps --environment to harness", () => {
    expect(parseRunPhaseArgs(["P02", "--environment", "claude-code"]).harness).toBe("claude");
    expect(parseRunPhaseArgs(["P02", "--environment", "claude-code"]).environment).toBe("claude-code");
    expect(parseRunPhaseArgs(["P02", "--environment", "cursor"]).harness).toBe("cursor");
  });

  it("rejects conflicting --environment and --harness", () => {
    expect(parseRunPhaseArgs(["P01", "--environment", "cursor", "--harness", "claude"]).reason).toBe(
      "environment-harness",
    );
  });

  it("takes an explicit model and rejects a missing one", () => {
    expect(parseRunPhaseArgs(["P02", "--harness", "claude", "--model", "claude-sonnet-5-5"]).model).toBe(
      "claude-sonnet-5-5",
    );
    expect(parseRunPhaseArgs(["P02", "--model"]).reason).toBe("model");
    expect(parseRunPhaseArgs(["P02", "--model", "--max-turns", "5"]).reason).toBe("model");
    expect(parseRunPhaseArgs(["P02", "--model", "sonnet; rm -rf"]).reason).toBe("model");
  });
});

describe("session result", () => {
  it("summarizes usage from claude json output", () => {
    const stdout = JSON.stringify({
      type: "result",
      subtype: "success",
      is_error: false,
      num_turns: 12,
      total_cost_usd: 0.42,
      result: "P01-CU3 закоммичен",
      usage: { input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 30, cache_creation_input_tokens: 40 },
    });
    expect(summarizeSessionResult(stdout)).toEqual({
      subtype: "success",
      isError: false,
      turns: 12,
      costUsd: 0.42,
      tokens: { input: 10, output: 20, cacheRead: 30, cacheWrite: 40 },
      text: "P01-CU3 закоммичен",
    });
  });

  it("flags max-turns as an error and ignores non-json output", () => {
    expect(summarizeSessionResult(JSON.stringify({ type: "result", subtype: "error_max_turns" })).isError).toBe(true);
    expect(summarizeSessionResult("plain text")).toBeNull();
    expect(summarizeSessionResult("")).toBeNull();
  });
});

describe("session prompt", () => {
  it("asks for a full verify only when the CU review is reviewer", () => {
    const [diffOnly] = parseCommitUnits(`
### P03-CU1 — docs(docs): sync routes · Review: diff-only · Commit: auto
- [ ] P03-T1 · T0 · Files: \`docs/design/canonical_routes.md\`
`);
    const [reviewed] = parseCommitUnits(`
### P03-CU2 — feat(auth): add proxy · Review: reviewer · Commit: auto
- [ ] P03-T2 · T3 · Files: \`apps/web/src/proxy.ts\`
`);
    expect(renderSessionPrompt({ unit: diffOnly, tasksPath: "tasks.md", pathsFile: "paths.txt" })).toContain(
      "node scripts/cu-verify.mjs\n",
    );
    expect(renderSessionPrompt({ unit: diffOnly, tasksPath: "tasks.md", pathsFile: "paths.txt" })).not.toContain(
      "--full",
    );
    expect(renderSessionPrompt({ unit: reviewed, tasksPath: "tasks.md", pathsFile: "paths.txt" })).toContain(
      "node scripts/cu-verify.mjs --full",
    );
  });
});
