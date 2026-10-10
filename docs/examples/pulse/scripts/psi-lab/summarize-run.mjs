import { readFileSync } from "node:fs";

function readReport(filePath) {
  const buffer = readFileSync(filePath);
  const raw =
    buffer[0] === 0xff && buffer[1] === 0xfe
      ? buffer.toString("utf16le")
      : buffer.toString("utf8");
  const start = raw.indexOf("{");
  if (start < 0) {
    throw new Error(`No JSON object in ${filePath}`);
  }
  return JSON.parse(raw.slice(start));
}

const json = readReport(process.argv[2]);
const GREEN = 90;
const METRIC_IDS = new Set([
  "largest-contentful-paint",
  "first-contentful-paint",
  "speed-index",
  "interactive",
  "total-blocking-time",
  "cumulative-layout-shift",
  "max-potential-fid",
]);

for (const row of json.rows) {
  console.log(`\n## ${row.path} flake=${row.flake} warmup=${row.warmup}`);
  for (const strat of ["mobile", "desktop"]) {
    const result = row[strat];
    if (!result) {
      console.log(`${strat}: missing`);
      continue;
    }
    const scores = result.scores;
    const below = Object.entries(scores).filter(
      ([, value]) => value != null && value < GREEN,
    );
    const metrics = result.metrics ?? {};
    console.log(
      `${strat}: P=${scores.performance} A=${scores.accessibility} BP=${scores["best-practices"]} SEO=${scores.seo} LCP=${Math.round(metrics.lcp ?? 0)} FCP=${Math.round(metrics.fcp ?? 0)} SI=${Math.round(metrics.si ?? 0)} TTI=${Math.round(metrics.tti ?? 0)} TBT=${Math.round(metrics.tbt ?? 0)} CLS=${metrics.cls ?? ""}`,
    );
    if (result.runtimeError) {
      console.log(`  runtimeError ${JSON.stringify(result.runtimeError)}`);
    }
    if (below.length === 0) {
      continue;
    }
    const fails = (result.failing ?? []).filter(
      (item) => !METRIC_IDS.has(item.id),
    );
    console.log(`  below90: ${below.map(([key, value]) => `${key}:${value}`).join(", ")}`);
    console.log(
      `  audits: ${fails.map((item) => `${item.category}:${item.id}(w${item.weight})`).join("; ") || "(metrics only)"}`,
    );
  }
}
