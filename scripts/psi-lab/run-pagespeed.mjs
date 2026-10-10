#!/usr/bin/env node
/**
 * Lab PageSpeed Insights via official REST v5 runPagespeed.
 * Canon: guidelines/psi-lab-testing.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANON_PATHS } from "./canon-paths.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PSI_ENDPOINT = "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed";
const CATEGORIES = ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"];
const CATEGORY_IDS = ["performance", "accessibility", "best-practices", "seo"];
const REQUEST_TIMEOUT_MS = 180_000;
const CONCURRENCY_DEFAULT = 2;
const WARMUP_ATTEMPTS = 3;
const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const GREEN = 90;

function loadEnvFile(filePath, target) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    target[key] = value;
  }
}

function loadEnv() {
  const merged = { ...process.env };
  loadEnvFile(path.join(rootDir, ".env"), merged);
  loadEnvFile(path.join(rootDir, ".env.local"), merged);
  return merged;
}

function parseArgs(argv) {
  const args = {
    url: null,
    origin: null,
    suite: false,
    strategy: null,
    json: null,
    concurrency: CONCURRENCY_DEFAULT,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === "--suite") {
      args.suite = true;
    } else if (token === "--url" && next) {
      args.url = next;
      i += 1;
    } else if (token === "--origin" && next) {
      args.origin = next;
      i += 1;
    } else if (token === "--strategy" && next) {
      args.strategy = next.toLowerCase();
      i += 1;
    } else if (token === "--json" && next) {
      args.json = next;
      i += 1;
    } else if (token === "--concurrency" && next) {
      args.concurrency = Math.min(3, Math.max(1, Number(next) || CONCURRENCY_DEFAULT));
      i += 1;
    } else if (token === "--help" || token === "-h") {
      args.help = true;
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
  npm run psi:lab -- --url https://example.com/path
  npm run psi:lab -- --suite --origin https://example.com

Options:
  --url <absolute>     Single page (default strategy: mobile)
  --suite              Canon paths × mobile × desktop
  --origin <url>       Base origin (or env PSI_ORIGIN)
  --strategy mobile|desktop|both
  --json <path>        Write sanitized JSON (no API key)
  --concurrency 2|3    Lab request pool (default 2)
`);
}

function isForbiddenHost(hostname) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host === "::1" ||
    host.endsWith(".localhost")
  );
}

function assertPublicUrl(raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`Invalid URL: ${raw}`);
  }
  if (isForbiddenHost(parsed.hostname)) {
    throw new Error(`Refusing localhost/dev origin: ${parsed.origin}`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Unsupported protocol: ${parsed.protocol}`);
  }
  return parsed;
}

function joinOriginPath(origin, pathname) {
  const base = new URL(origin);
  const pathPart = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(pathPart, base).href;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function mapPool(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function cacheHeaders(headers) {
  const names = ["x-vercel-cache", "age", "x-nextjs-prerender", "cf-cache-status", "x-cache"];
  const picked = {};
  for (const name of names) {
    const value = headers.get(name);
    if (value) {
      picked[name] = value;
    }
  }
  return picked;
}

function isStaleCache(headers) {
  const vercel = (headers.get("x-vercel-cache") ?? "").toUpperCase();
  const cf = (headers.get("cf-cache-status") ?? "").toUpperCase();
  const xcache = (headers.get("x-cache") ?? "").toUpperCase();
  return vercel === "STALE" || cf === "STALE" || xcache.includes("STALE");
}

async function warmupUrl(pageUrl) {
  const attempts = [];
  for (let i = 0; i < WARMUP_ATTEMPTS; i += 1) {
    const response = await fetch(pageUrl, { redirect: "follow" });
    const headers = cacheHeaders(response.headers);
    attempts.push({
      status: response.status,
      finalUrl: response.url,
      headers,
    });
    if (!isStaleCache(response.headers)) {
      break;
    }
  }
  return attempts;
}

function categoryScore(lighthouse, id) {
  const score = lighthouse?.categories?.[id]?.score;
  if (typeof score !== "number") {
    return null;
  }
  return Math.round(score * 100);
}

function auditMs(lighthouse, id) {
  const value = lighthouse?.audits?.[id]?.numericValue;
  return typeof value === "number" ? value : null;
}

function scoresFromLighthouse(lighthouse) {
  const scores = {};
  for (const id of CATEGORY_IDS) {
    scores[id] = categoryScore(lighthouse, id);
  }
  return {
    scores,
    lcpMs: auditMs(lighthouse, "largest-contentful-paint"),
    fcpMs: auditMs(lighthouse, "first-contentful-paint"),
    cls: lighthouse?.audits?.["cumulative-layout-shift"]?.numericValue ?? null,
    siMs: auditMs(lighthouse, "speed-index"),
    ttiMs: auditMs(lighthouse, "interactive"),
    tbtMs: auditMs(lighthouse, "total-blocking-time"),
    lcpElement: lighthouse?.audits?.["largest-contentful-paint-element"]?.displayValue ?? null,
    runtimeError: lighthouse?.runtimeError ?? null,
  };
}

function needsFlakeRetry(parsed) {
  if (parsed.runtimeError) {
    return true;
  }
  const perf = parsed.scores.performance;
  if (typeof perf === "number" && perf < GREEN) {
    return true;
  }
  if (
    typeof parsed.siMs === "number" &&
    typeof parsed.ttiMs === "number" &&
    parsed.siMs > parsed.ttiMs * 3 &&
    parsed.siMs > parsed.ttiMs + 4000 &&
    typeof perf === "number" &&
    perf < GREEN
  ) {
    return true;
  }
  return false;
}

function belowGreen(parsed) {
  if (parsed.runtimeError) {
    return true;
  }
  return CATEGORY_IDS.some((id) => {
    const score = parsed.scores[id];
    return typeof score !== "number" || score < GREEN;
  });
}

async function fetchWithRetry(url, { timeoutMs, maxAttempts = 4 }) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (RETRY_STATUS.has(response.status) && attempt < maxAttempts) {
        const backoff = Math.min(30_000, 2000 * 2 ** (attempt - 1));
        console.error(`HTTP ${response.status}; retry in ${backoff}ms (${attempt}/${maxAttempts})`);
        await sleep(backoff);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) {
        throw error;
      }
      const backoff = Math.min(30_000, 2000 * 2 ** (attempt - 1));
      console.error(`Request failed (${error instanceof Error ? error.message : error}); retry in ${backoff}ms`);
      await sleep(backoff);
    }
  }
  throw lastError;
}

function buildPsiUrl({ pageUrl, strategy, apiKey }) {
  const endpoint = new URL(PSI_ENDPOINT);
  endpoint.searchParams.set("url", pageUrl);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.set("key", apiKey);
  for (const category of CATEGORIES) {
    endpoint.searchParams.append("category", category);
  }
  return endpoint;
}

async function runPagespeed({ pageUrl, strategy, apiKey }) {
  const endpoint = buildPsiUrl({ pageUrl, strategy, apiKey });
  const response = await fetchWithRetry(endpoint, { timeoutMs: REQUEST_TIMEOUT_MS });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`runPagespeed HTTP ${response.status}: ${body.slice(0, 400)}`);
  }
  const json = await response.json();
  const lighthouse = json.lighthouseResult;
  const parsed = scoresFromLighthouse(lighthouse);
  return {
    requestedUrl: pageUrl,
    strategy,
    id: json.id ?? lighthouse?.finalUrl ?? pageUrl,
    hasCrux: Boolean(json.loadingExperience?.metrics || json.originLoadingExperience?.metrics),
    ...parsed,
  };
}

async function runJob({ pageUrl, strategy, apiKey }) {
  const warmup = await warmupUrl(pageUrl);
  const first = await runPagespeed({ pageUrl, strategy, apiKey });
  const flake = needsFlakeRetry(first);
  let second = null;
  if (flake) {
    console.error(`Flake retry: ${pageUrl} ${strategy}`);
    second = await runPagespeed({ pageUrl, strategy, apiKey });
  }
  const finalRun = second ?? first;
  return {
    pageUrl,
    strategy,
    warmup,
    runs: second ? [first, second] : [first],
    flake,
    final: finalRun,
    failed: belowGreen(finalRun),
  };
}

function fmtMs(ms) {
  if (typeof ms !== "number") {
    return "—";
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtScore(score) {
  return typeof score === "number" ? String(score) : "—";
}

function printMarkdown(jobs) {
  console.log("");
  console.log("| Path | Strat | Perf | A11y | BP | SEO | LCP | FCP | CLS | Flake |");
  console.log("|------|-------|------|------|----|-----|-----|-----|-----|-------|");
  for (const job of jobs) {
    const row = job.final;
    let pathLabel = job.pageUrl;
    try {
      pathLabel = new URL(job.pageUrl).pathname || "/";
    } catch {
      // keep absolute
    }
    console.log(
      `| ${pathLabel} | ${job.strategy.toLowerCase()} | ${fmtScore(row.scores.performance)} | ${fmtScore(row.scores.accessibility)} | ${fmtScore(row.scores["best-practices"])} | ${fmtScore(row.scores.seo)} | ${fmtMs(row.lcpMs)} | ${fmtMs(row.fcpMs)} | ${row.cls ?? "—"} | ${job.flake ? "yes" : "no"} |`,
    );
  }
  console.log("");
  for (const job of jobs) {
    const lastWarm = job.warmup[job.warmup.length - 1];
    console.log(
      `Warmup ${job.pageUrl}: status=${lastWarm?.status ?? "?"} headers=${JSON.stringify(lastWarm?.headers ?? {})}`,
    );
    if (job.final.runtimeError) {
      console.log(`runtimeError: ${JSON.stringify(job.final.runtimeError)}`);
    }
  }
}

function sanitizeJobs(jobs) {
  return jobs.map((job) => ({
    pageUrl: job.pageUrl,
    strategy: job.strategy,
    warmup: job.warmup,
    flake: job.flake,
    failed: job.failed,
    runs: job.runs.map((run) => ({
      requestedUrl: run.requestedUrl,
      strategy: run.strategy,
      id: run.id,
      hasCrux: run.hasCrux,
      scores: run.scores,
      lcpMs: run.lcpMs,
      fcpMs: run.fcpMs,
      cls: run.cls,
      siMs: run.siMs,
      ttiMs: run.ttiMs,
      tbtMs: run.tbtMs,
      lcpElement: run.lcpElement,
      runtimeError: run.runtimeError,
    })),
  }));
}

function resolveTargets(args, env) {
  const originRaw = args.origin ?? env.PSI_ORIGIN ?? "";
  if (args.suite) {
    if (!originRaw) {
      throw new Error("Suite requires --origin or PSI_ORIGIN");
    }
    const origin = assertPublicUrl(originRaw).origin;
    const strategies =
      args.strategy === "mobile"
        ? ["MOBILE"]
        : args.strategy === "desktop"
          ? ["DESKTOP"]
          : ["MOBILE", "DESKTOP"];
    const jobs = [];
    for (const pathname of CANON_PATHS) {
      const pageUrl = joinOriginPath(origin, pathname);
      assertPublicUrl(pageUrl);
      for (const strategy of strategies) {
        jobs.push({ pageUrl, strategy });
      }
    }
    return { origin, jobs };
  }

  if (!args.url && !originRaw) {
    throw new Error("Pass --url or --suite with --origin / PSI_ORIGIN");
  }
  const pageUrl = args.url
    ? assertPublicUrl(args.url).href
    : joinOriginPath(assertPublicUrl(originRaw).origin, "/");
  assertPublicUrl(pageUrl);
  const strategies =
    args.strategy === "both"
      ? ["MOBILE", "DESKTOP"]
      : args.strategy === "desktop"
        ? ["DESKTOP"]
        : ["MOBILE"];
  return {
    origin: new URL(pageUrl).origin,
    jobs: strategies.map((strategy) => ({ pageUrl, strategy })),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }
  const env = loadEnv();
  const apiKey = env.PAGE_SPEED_API_KEY;
  if (!apiKey) {
    throw new Error("Missing PAGE_SPEED_API_KEY (set in .env / .env.local)");
  }
  const { origin, jobs: specs } = resolveTargets(args, env);
  console.error(`Origin ${origin}; jobs ${specs.length}; concurrency ${args.concurrency}`);
  const jobs = await mapPool(specs, args.concurrency, (spec) =>
    runJob({ ...spec, apiKey }),
  );
  printMarkdown(jobs);
  if (args.json) {
    const outPath = path.isAbsolute(args.json) ? args.json : path.join(process.cwd(), args.json);
    fs.writeFileSync(outPath, `${JSON.stringify(sanitizeJobs(jobs), null, 2)}\n`, "utf8");
    console.error(`Wrote ${outPath}`);
  }
  const failed = jobs.filter((job) => job.failed);
  if (failed.length > 0) {
    console.error(`${failed.length} job(s) below green zone after retry`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
