#!/usr/bin/env node
/**
 * Lab PageSpeed Insights via REST v5. See docs/guidelines/psi-lab-testing.md
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { suitePaths } from "./canon-paths.mjs";

const PSI_ENDPOINT =
  "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed";
const CATEGORIES = [
  "PERFORMANCE",
  "ACCESSIBILITY",
  "BEST_PRACTICES",
  "SEO",
];
const TIMEOUT_MS = 180_000;
const CONCURRENCY = 2;
const WARMUP_ATTEMPTS = 3;
const GREEN = 90;
const LOCALHOST_RE =
  /^(localhost|127\.0\.0\.1|\[::1\]|.+\.localhost)(?::\d+)?$/i;

const CATEGORY_KEYS = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
];

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) {
    return;
  }
  const text = readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const eq = line.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    if (Object.hasOwn(process.env, key)) {
      continue;
    }
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
if (!process.argv.includes("--no-dotenv")) {
  loadDotEnv(resolve(repoRoot, "apps/web/.env.local"));
}

function parseArgs(argv) {
  const options = {
    url: null,
    suite: false,
    strategy: "mobile",
    json: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--suite") {
      options.suite = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--no-dotenv") {
      // handled before parseArgs (skips apps/web/.env.local)
    } else if (arg === "--url" || arg === "--strategy") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      if (arg === "--url") {
        options.url = value;
      } else {
        options.strategy = value.toLowerCase();
      }
      i += 1;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown flag: ${arg}`);
    }
  }
  if (options.strategy !== "mobile" && options.strategy !== "desktop") {
    throw new Error("--strategy must be mobile or desktop");
  }
  return options;
}

function assertNotLocalhost(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error(`Invalid URL: ${urlString}`);
  }
  if (LOCALHOST_RE.test(parsed.hostname)) {
    throw new Error(
      `Refusing localhost / dev origin: ${parsed.hostname}. Lab PSI requires a deployed URL.`,
    );
  }
  return parsed;
}

function joinOriginPath(origin, path) {
  const base = origin.endsWith("/") ? origin : `${origin}/`;
  const relative = path.startsWith("/") ? path.slice(1) : path;
  return new URL(relative, base).href;
}

function resolveTargets(options) {
  if (options.suite) {
    const origin = process.env.PSI_ORIGIN?.trim();
    if (!origin) {
      throw new Error("PSI_ORIGIN is required for --suite");
    }
    assertNotLocalhost(origin);
    const paths = suitePaths();
    return paths.map((path) => ({
      path,
      href: joinOriginPath(origin, path),
    }));
  }

  const href = options.url?.trim() || process.env.PSI_ORIGIN?.trim();
  if (!href) {
    throw new Error("Pass --url or set PSI_ORIGIN");
  }
  const parsed = assertNotLocalhost(href);
  return [{ path: parsed.pathname || "/", href: parsed.href }];
}

function strategiesFor(options) {
  if (options.suite) {
    return ["MOBILE", "DESKTOP"];
  }
  return [options.strategy.toUpperCase()];
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function cacheHeaders(headers) {
  const names = [
    "x-vercel-cache",
    "age",
    "x-nextjs-prerender",
    "cf-cache-status",
    "x-cache",
    "cache-control",
  ];
  const picked = {};
  for (const name of names) {
    const value = headers.get(name);
    if (value) {
      picked[name] = value;
    }
  }
  return picked;
}

function isStale(headers) {
  const vercel = headers.get("x-vercel-cache")?.toUpperCase();
  return vercel === "STALE" || vercel === "BYPASS";
}

async function warmup(href) {
  let last = { status: 0, headers: {}, stale: true };
  for (let attempt = 1; attempt <= WARMUP_ATTEMPTS; attempt += 1) {
    const response = await fetchWithTimeout(href, {
      method: "GET",
      redirect: "follow",
    });
    last = {
      status: response.status,
      headers: cacheHeaders(response.headers),
      stale: isStale(response.headers),
    };
    await response.arrayBuffer();
    if (!last.stale) {
      break;
    }
  }
  return last;
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

function buildPsiUrl(pageUrl, strategy, apiKey) {
  const psiUrl = new URL(PSI_ENDPOINT);
  psiUrl.searchParams.set("url", pageUrl);
  psiUrl.searchParams.set("strategy", strategy);
  psiUrl.searchParams.set("key", apiKey);
  psiUrl.searchParams.set("locale", "en");
  for (const category of CATEGORIES) {
    psiUrl.searchParams.append("category", category);
  }
  return psiUrl;
}

function scoreOf(lighthouse, key) {
  const raw = lighthouse?.categories?.[key]?.score;
  if (typeof raw !== "number") {
    return null;
  }
  return Math.round(raw * 100);
}

function numericAudit(lighthouse, id) {
  const audit = lighthouse?.audits?.[id];
  const value = audit?.numericValue;
  if (typeof value !== "number") {
    return null;
  }
  return value;
}

function formatMs(value) {
  if (value == null) {
    return "—";
  }
  return `${Math.round(value)}ms`;
}

function formatCls(value) {
  if (value == null) {
    return "—";
  }
  return value.toFixed(3);
}

function stripSecrets(value) {
  if (value == null) {
    return value;
  }
  const serialized = JSON.stringify(value);
  const key = process.env.PAGE_SPEED_API_KEY;
  const cleaned = key ? serialized.split(key).join("[REDACTED]") : serialized;
  return JSON.parse(cleaned);
}

function failingAudits(lighthouse) {
  const skipModes = new Set(["notApplicable", "manual", "informative"]);
  const audits = lighthouse?.audits ?? {};
  const weighted = [];
  for (const category of Object.values(lighthouse?.categories ?? {})) {
    for (const ref of category.auditRefs ?? []) {
      if (!ref?.id || !(ref.weight > 0)) {
        continue;
      }
      const audit = audits[ref.id];
      if (!audit || skipModes.has(audit.scoreDisplayMode)) {
        continue;
      }
      if (typeof audit.score !== "number" || audit.score >= 1) {
        continue;
      }
      weighted.push({
        id: ref.id,
        title: audit.title ?? ref.id,
        category: category.id,
        weight: ref.weight,
        score: audit.score,
      });
    }
  }
  weighted.sort((a, b) => b.weight - a.weight);
  return weighted.slice(0, 12);
}

function parsePsiBody(body, href, strategy) {
  const lighthouse = body.lighthouseResult;
  if (lighthouse?.runtimeError) {
    return {
      href,
      strategy,
      runtimeError: lighthouse.runtimeError,
      scores: {},
      metrics: {},
      failing: [],
    };
  }
  return {
    href,
    strategy,
    scores: {
      performance: scoreOf(lighthouse, "performance"),
      accessibility: scoreOf(lighthouse, "accessibility"),
      "best-practices": scoreOf(lighthouse, "best-practices"),
      seo: scoreOf(lighthouse, "seo"),
    },
    metrics: {
      lcp: numericAudit(lighthouse, "largest-contentful-paint"),
      fcp: numericAudit(lighthouse, "first-contentful-paint"),
      si: numericAudit(lighthouse, "speed-index"),
      tti: numericAudit(lighthouse, "interactive"),
      tbt: numericAudit(lighthouse, "total-blocking-time"),
      cls: numericAudit(lighthouse, "cumulative-layout-shift"),
    },
    lcpElement:
      lighthouse?.audits?.["largest-contentful-paint-element"]?.displayValue ??
      null,
    failing: failingAudits(lighthouse),
  };
}

function shouldFlakeRetry(result) {
  if (result.runtimeError) {
    return false;
  }
  const perf = result.scores.performance;
  if (perf != null && perf < GREEN) {
    return true;
  }
  const { si, tti, lcp } = result.metrics;
  if (perf != null && perf < GREEN && si != null && tti != null && si > tti * 3) {
    return true;
  }
  if (perf != null && perf < GREEN && si != null && lcp != null && si > lcp * 3) {
    return true;
  }
  return false;
}

function belowGreen(result) {
  if (result.runtimeError) {
    return true;
  }
  return CATEGORY_KEYS.some((key) => {
    const score = result.scores[key];
    return score != null && score < GREEN;
  });
}

async function runPagespeed(pageUrl, strategy, apiKey) {
  let attempt = 0;
  let lastError;
  while (attempt < 4) {
    attempt += 1;
    try {
      const response = await fetchWithTimeout(
        buildPsiUrl(pageUrl, strategy, apiKey),
      );
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`PSI HTTP ${response.status}`);
        await sleep(2000 * attempt);
        continue;
      }
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`PSI HTTP ${response.status}: ${text.slice(0, 400)}`);
      }
      const body = await response.json();
      return parsePsiBody(body, pageUrl, strategy);
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`PSI timeout after ${TIMEOUT_MS}ms for ${pageUrl}`);
      }
      await sleep(2000 * attempt);
    }
  }
  throw lastError ?? new Error("PSI request failed");
}

async function mapPool(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current], current);
    }
  }
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

function printTable(rows) {
  const header = [
    "Path",
    "Warmup",
    "M Perf",
    "M A11y",
    "M BP",
    "M SEO",
    "D Perf",
    "D A11y",
    "D BP",
    "D SEO",
    "M LCP",
    "M FCP",
    "M CLS",
    "Flake",
  ];
  const lines = [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
  ];
  for (const row of rows) {
    lines.push(
      `| ${[
        row.path,
        row.warmup,
        row.mobile?.scores.performance ?? "—",
        row.mobile?.scores.accessibility ?? "—",
        row.mobile?.scores["best-practices"] ?? "—",
        row.mobile?.scores.seo ?? "—",
        row.desktop?.scores.performance ?? "—",
        row.desktop?.scores.accessibility ?? "—",
        row.desktop?.scores["best-practices"] ?? "—",
        row.desktop?.scores.seo ?? "—",
        formatMs(row.mobile?.metrics.lcp),
        formatMs(row.mobile?.metrics.fcp),
        formatCls(row.mobile?.metrics.cls),
        row.flake ? "yes" : "",
      ].join(" | ")} |`,
    );
  }
  console.log(lines.join("\n"));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const apiKey = process.env.PAGE_SPEED_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("PAGE_SPEED_API_KEY is required");
  }

  const targets = resolveTargets(options);
  const strategies = strategiesFor(options);

  console.error(`Warming ${targets.length} URL(s)…`);
  const warmupByHref = {};
  for (const target of targets) {
    warmupByHref[target.href] = await warmup(target.href);
    const cache = warmupByHref[target.href].headers["x-vercel-cache"] ?? "n/a";
    console.error(
      `  ${target.href} status=${warmupByHref[target.href].status} x-vercel-cache=${cache}`,
    );
  }

  const jobs = [];
  for (const target of targets) {
    for (const strategy of strategies) {
      jobs.push({ ...target, strategy });
    }
  }

  const labByKey = {};
  const flakeKeys = new Set();

  console.error(`Lab ${jobs.length} run(s), concurrency ${CONCURRENCY}…`);
  const firstPass = await mapPool(jobs, CONCURRENCY, async (job) => {
    const result = await runPagespeed(job.href, job.strategy, apiKey);
    return { job, result };
  });

  for (const { job, result } of firstPass) {
    const key = `${job.href}|${job.strategy}`;
    labByKey[key] = result;
    if (shouldFlakeRetry(result)) {
      flakeKeys.add(key);
    }
  }

  const flakeJobs = jobs.filter((job) =>
    flakeKeys.has(`${job.href}|${job.strategy}`),
  );
  if (flakeJobs.length > 0) {
    console.error(`Flake retry for ${flakeJobs.length} run(s)…`);
    const secondPass = await mapPool(flakeJobs, CONCURRENCY, async (job) => {
      const result = await runPagespeed(job.href, job.strategy, apiKey);
      return { job, result };
    });
    for (const { job, result } of secondPass) {
      labByKey[`${job.href}|${job.strategy}`] = result;
    }
  }

  const rows = targets.map((target) => {
    const mobile = labByKey[`${target.href}|MOBILE`];
    const desktop = labByKey[`${target.href}|DESKTOP`];
    const warmupInfo = warmupByHref[target.href];
    const cache = warmupInfo.headers["x-vercel-cache"] ?? String(warmupInfo.status);
    return {
      path: target.path,
      href: target.href,
      warmup: cache,
      mobile,
      desktop,
      flake:
        flakeKeys.has(`${target.href}|MOBILE`) ||
        flakeKeys.has(`${target.href}|DESKTOP`),
    };
  });

  if (options.json) {
    console.log(JSON.stringify(stripSecrets({ rows }), null, 2));
  } else {
    printTable(rows);
  }

  const failed = rows.some(
    (row) =>
      (row.mobile && belowGreen(row.mobile)) ||
      (row.desktop && belowGreen(row.desktop)),
  );
  if (failed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
