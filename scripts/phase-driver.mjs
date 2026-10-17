/**
 * Pure helpers for the phase driver and CU boundary scripts.
 * No git mutations and no network. CLIs in cu-verify.mjs, cu-commit.mjs, run-phase.mjs.
 */

export const LOG_TAIL_LINES = 40;
export const HEADER_MAX_LENGTH = 120;
export const DEFAULT_MAX_TURNS = 40;
/** Workhorse model for a CU session; passed explicitly so it never inherits the last picked model. */
export const DEFAULT_MODEL = "sonnet";
const MODEL_PATTERN = /^[a-z0-9][a-z0-9.\-[\]]*$/i;

const COMMIT_TYPES = "feat|fix|refactor|perf|docs|test|chore|ci|revert|style";
const SUBJECT_PATTERN = new RegExp(`^(?:${COMMIT_TYPES})(?:\\([a-z0-9-]+\\))?(!)?: (.+)$`);

export function logTail(text, lineCount = LOG_TAIL_LINES) {
  const lines = String(text ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.slice(-lineCount).join("\n");
}

export function expandBraces(token) {
  const match = token.match(/^(.*)\{([^{}]+)\}(.*)$/);
  if (!match) return [token];
  const [, prefix, inner, suffix] = match;
  return inner.split(",").flatMap((part) => expandBraces(`${prefix}${part.trim()}${suffix}`));
}

function extractFiles(body) {
  const files = [];
  for (const line of body.split("\n")) {
    const marker = line.indexOf("Files:");
    if (marker === -1) continue;
    const rest = line.slice(marker + "Files:".length);
    const ticked = [...rest.matchAll(/`([^`]+)`/g)].map((item) => item[1].trim());
    const tokens = ticked.length > 0 ? ticked : rest.split(",").map((item) => item.trim()).filter(Boolean);
    for (const token of tokens) files.push(...expandBraces(token));
  }
  return files;
}

function parseHeader(id, rest) {
  const parts = rest.split(" · ").map((part) => part.trim());
  let review = "reviewer";
  let smoke = "none";
  for (const part of parts.slice(1)) {
    const reviewMatch = part.match(/^Review:\s*(reviewer|diff-only)$/);
    if (reviewMatch) review = reviewMatch[1];
    const smokeMatch = part.match(/^Smoke:\s*(none|deferred|blocking)$/);
    if (smokeMatch) smoke = smokeMatch[1];
  }
  return { id, subject: parts[0], review, smoke, tasks: [] };
}

export function parseCommitUnits(markdown) {
  const units = [];
  let current = null;
  let task = null;

  const finishTask = () => {
    if (current && task) current.tasks.push(task);
    task = null;
  };
  const finishUnit = () => {
    finishTask();
    if (current) units.push(current);
    current = null;
  };

  for (const line of String(markdown).split(/\r?\n/)) {
    const heading = line.match(/^### (P\d+-CU\d+) — (.+)$/);
    if (heading) {
      finishUnit();
      current = parseHeader(heading[1], heading[2]);
      continue;
    }
    if (/^## /.test(line)) {
      finishUnit();
      continue;
    }
    if (!current) continue;
    const checkbox = line.match(/^- \[([ xX])\] (.+)$/);
    if (checkbox) {
      finishTask();
      task = { checked: checkbox[1].toLowerCase() === "x", title: checkbox[2].trim(), body: line };
      continue;
    }
    if (task) task.body += `\n${line}`;
  }
  finishUnit();

  return units.map((unit) => {
    const files = [...new Set(unit.tasks.flatMap((item) => extractFiles(item.body)))];
    const done = unit.tasks.length > 0 && unit.tasks.every((item) => item.checked);
    return { ...unit, files, done };
  });
}

export function decidePhaseStep(units) {
  const deferred = units.filter((unit) => unit.done && unit.smoke === "deferred");
  const openIndex = units.findIndex((unit) => !unit.done);
  if (openIndex === -1) return { action: "complete", deferred };
  const blocking = units.slice(0, openIndex).find((unit) => unit.done && unit.smoke === "blocking");
  if (blocking) return { action: "smoke-blocking", blocking, next: units[openIndex], deferred };
  return { action: "run", unit: units[openIndex], deferred };
}

export function globToRegExp(pattern) {
  let expression = "";
  let index = 0;
  while (index < pattern.length) {
    if (pattern.startsWith("**/", index)) {
      expression += "(?:.*/)?";
      index += 3;
      continue;
    }
    if (pattern.startsWith("**", index)) {
      expression += ".*";
      index += 2;
      continue;
    }
    if (pattern[index] === "*") {
      expression += "[^/]*";
      index += 1;
      continue;
    }
    const char = pattern[index];
    expression += /[\\^$+?.()|[\]{}]/.test(char) ? `\\${char}` : char;
    index += 1;
  }
  return new RegExp(`^${expression}$`);
}

export function pathMatchesPattern(filePath, pattern) {
  const file = filePath.replace(/\\/g, "/");
  return expandBraces(pattern.replace(/\\/g, "/")).some((variant) => {
    if (globToRegExp(variant).test(file)) return true;
    if (!variant.includes("*")) return file === variant || file.endsWith(`/${variant}`);
    return false;
  });
}

export function parsePorcelain(porcelain) {
  const paths = [];
  for (const line of String(porcelain).split(/\r?\n/)) {
    if (!line.trim()) continue;
    const rest = line.slice(3);
    const renamed = rest.split(" -> ");
    const target = renamed[renamed.length - 1].trim().replace(/^"|"$/g, "");
    if (target) paths.push(target.replace(/\\/g, "/"));
  }
  return paths;
}

export function classifyDirtyPaths(dirtyPaths, allowedPatterns, tasksFile) {
  const tasks = tasksFile.replace(/\\/g, "/");
  const blocked = [];
  const continuable = [];
  for (const dirty of dirtyPaths) {
    const normalized = dirty.replace(/\\/g, "/");
    const allowed =
      normalized === tasks || allowedPatterns.some((pattern) => pathMatchesPattern(normalized, pattern));
    if (allowed) continuable.push(normalized);
    else blocked.push(normalized);
  }
  return { blocked, continuable };
}

export function pathRefusalReason(relativePath) {
  const normalized = String(relativePath).replace(/\\/g, "/").replace(/^\.\//, "");
  if (!normalized || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized)) return "absolute";
  if (normalized.split("/").includes("..")) return "parent";
  const base = normalized.slice(normalized.lastIndexOf("/") + 1);
  if (base === ".env" || base.startsWith(".env.")) return "secret";
  if (normalized === ".local/dev-secrets.json") return "secret";
  return null;
}

export function parsePathsFile(text) {
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

export function assertStagePaths(paths) {
  if (!paths.length) return { ok: false, reason: "empty" };
  const refused = [];
  const normalized = [];
  for (const filePath of paths) {
    const reason = pathRefusalReason(filePath);
    if (reason) refused.push({ path: filePath, reason });
    else normalized.push(filePath.replace(/\\/g, "/").replace(/^\.\//, ""));
  }
  if (refused.length > 0) return { ok: false, reason: "refused", refused };
  return { ok: true, paths: [...new Set(normalized)] };
}

export function assertCommitIndex(staged, allowed) {
  const normalize = (filePath) => filePath.replace(/\\/g, "/").replace(/^\.\//, "");
  const stagedSet = [...new Set(staged.map(normalize))];
  const allowedSet = new Set(allowed.map(normalize));
  const extra = stagedSet.filter((filePath) => !allowedSet.has(filePath));
  const missing = [...allowedSet].filter((filePath) => !stagedSet.includes(filePath));
  if (stagedSet.length === 0) return { ok: false, reason: "empty", extra, missing };
  if (extra.length > 0 || missing.length > 0) return { ok: false, reason: "mismatch", extra, missing };
  return { ok: true, extra, missing };
}

export function buildCommitMessage(branch, subject) {
  const trimmedBranch = String(branch ?? "").trim();
  const trimmedSubject = String(subject ?? "").trim();
  if (!trimmedBranch || trimmedBranch.includes(":") || /\s/.test(trimmedBranch)) {
    return { ok: false, reason: "branch" };
  }
  const match = trimmedSubject.match(SUBJECT_PATTERN);
  if (!match || trimmedSubject.endsWith(".")) return { ok: false, reason: "subject" };
  const subjectText = match[2];
  if (subjectText !== subjectText.toLowerCase()) return { ok: false, reason: "subject" };
  const message = `${trimmedBranch}: ${trimmedSubject}`;
  if (message.length > HEADER_MAX_LENGTH) return { ok: false, reason: "length" };
  return { ok: true, message };
}

export function concreteAllowPaths(unit, tasksFile) {
  const concrete = unit.files.filter((filePath) => !/[*?]/.test(filePath));
  return [...new Set([tasksFile.replace(/\\/g, "/"), ...concrete])];
}

export function renderSmokeList(phaseId, deferredUnits) {
  const lines = [`# ${phaseId} smoke`, ""];
  if (deferredUnits.length === 0) lines.push("Нет отложенных smoke.");
  else {
    for (const unit of deferredUnits) lines.push(`- ${unit.id} — ${unit.subject} — Smoke: deferred`);
  }
  return `${lines.join("\n")}\n`;
}

export function renderSessionPrompt({ unit, tasksPath, pathsFile }) {
  const verifyCommand = unit.review === "reviewer" ? "node scripts/cu-verify.mjs --full" : "node scripts/cu-verify.mjs";
  const reviewStep =
    unit.review === "reviewer"
      ? "Вызови субагента reviewer. В промпте только идентификатор CU и путь к задачам, и просьба прочитать git diff --staged. Ответ не длиннее 15 строк."
      : "Сделай diff-only сам и оставь одну строку Review:.";
  return [
    `Выполни ${unit.id} по ${tasksPath}.`,
    "Commit: auto уже разрешён. Между шагами не спрашивай подтверждения.",
    "Прочитай только строки этого CU и указанные §. DoR проверь сам. Провал DoR — один вызов architect, затем код.",
    `Отметь чекбоксы этого CU в ${tasksPath} до коммита. Хеш после коммита не дописывай.`,
    "Команды запускай через Bash tool: allowlist в .claude/settings.json задан для Bash.",
    `Запиши в ${pathsFile} ровно те конкретные пути, которые войдут в индекс, включая файл задач. Без glob и без секретов.`,
    `Драйвер заранее вписал в ${pathsFile} все существующие пути из Files. Удали те, что ты не менял. cu-commit пропускает неизменённые пути и печатает их как unchanged.`,
    verifyCommand,
    `node scripts/cu-commit.mjs stage --paths-file ${pathsFile}`,
    reviewStep,
    "Если reviewer вернул blocker: поправь код, снова выполни stage с тем же файлом путей, затем один review только дельты.",
    `node scripts/cu-commit.mjs commit --paths-file ${pathsFile} --subject "${unit.subject}"`,
    "Сырой git add и git commit не вызывай. build:check не запускай: его выполняет pre-commit hook.",
    "Если менялись .cursor/rules/*.mdc, до stage выполни npm run rules:sync и добавь .claude/rules/ в список путей.",
  ].join("\n");
}

const FORBIDDEN_COMMIT_ARGS = new Set(["--amend", "--no-verify", "--force", "--push", "push"]);

export function parseCuCommitArgs(argv) {
  const forbidden = argv.filter(
    (arg) => FORBIDDEN_COMMIT_ARGS.has(arg) || arg.startsWith("--no-verify") || arg.startsWith("--amend"),
  );
  if (forbidden.length > 0) return { ok: false, reason: "forbidden", forbidden };
  const [mode, ...rest] = argv;
  if (mode !== "stage" && mode !== "commit") return { ok: false, reason: "mode" };
  let pathsFile = null;
  let subject = null;
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--paths-file") {
      pathsFile = rest[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--subject") {
      subject = rest[index + 1];
      index += 1;
      continue;
    }
    return { ok: false, reason: "unknown", arg };
  }
  if (!pathsFile) return { ok: false, reason: "paths-file" };
  if (mode === "commit" && !subject) return { ok: false, reason: "subject" };
  if (mode === "stage" && subject) return { ok: false, reason: "subject" };
  return { ok: true, mode, pathsFile, subject };
}

export function parseRunPhaseArgs(argv) {
  let phase = null;
  let harness = "print";
  let maxTurns = DEFAULT_MAX_TURNS;
  let model = DEFAULT_MODEL;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--harness") {
      harness = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--model") {
      model = argv[index + 1];
      if (!MODEL_PATTERN.test(model ?? "")) return { ok: false, reason: "model" };
      index += 1;
      continue;
    }
    if (arg === "--max-turns") {
      maxTurns = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) return { ok: false, reason: "unknown" };
    if (phase) return { ok: false, reason: "phase" };
    phase = arg;
  }
  if (!/^P\d{2}$/.test(phase ?? "")) return { ok: false, reason: "phase" };
  if (harness !== "print" && harness !== "claude") return { ok: false, reason: "harness" };
  if (!Number.isInteger(maxTurns) || maxTurns < 1) return { ok: false, reason: "max-turns" };
  return { ok: true, phase, harness, maxTurns, model };
}

/** Reads `claude -p --output-format json` stdout into one log line; null when it is not a result object. */
export function summarizeSessionResult(stdout) {
  let result;
  try {
    result = JSON.parse(String(stdout ?? "").trim());
  } catch {
    return null;
  }
  if (!result || typeof result !== "object" || result.type !== "result") return null;
  const usage = result.usage ?? {};
  const tokens = {
    input: usage.input_tokens ?? 0,
    output: usage.output_tokens ?? 0,
    cacheRead: usage.cache_read_input_tokens ?? 0,
    cacheWrite: usage.cache_creation_input_tokens ?? 0,
  };
  return {
    subtype: result.subtype ?? "unknown",
    isError: result.is_error === true || result.subtype !== "success",
    turns: result.num_turns ?? null,
    costUsd: typeof result.total_cost_usd === "number" ? result.total_cost_usd : null,
    tokens,
    text: typeof result.result === "string" ? result.result : "",
  };
}

/**
 * Keeps listed paths that git reports as changed. `changed` comes from
 * `git status --porcelain --untracked-files=all`; a listed directory is kept if anything under it changed.
 */
export function partitionChangedPaths(listed, changed) {
  const normalize = (filePath) => filePath.replace(/\\/g, "/").replace(/^\.\//, "");
  const changedSet = changed.map(normalize);
  const kept = [];
  const unchanged = [];
  for (const filePath of listed.map(normalize)) {
    const prefix = filePath.endsWith("/") ? filePath : `${filePath}/`;
    const isChanged = changedSet.some((item) => item === filePath || item.startsWith(prefix));
    (isChanged ? kept : unchanged).push(filePath);
  }
  return { kept, unchanged };
}
