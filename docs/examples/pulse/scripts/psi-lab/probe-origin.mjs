import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) {
    return;
  }
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
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
loadDotEnv(resolve(repoRoot, "apps/web/.env.local"));

const origin = process.env.PSI_ORIGIN?.trim();
console.log(`HAS_KEY=${Boolean(process.env.PAGE_SPEED_API_KEY?.trim())}`);
console.log(`HAS_ORIGIN=${Boolean(origin)}`);
if (!origin) {
  process.exit(1);
}
const parsed = new URL(origin);
console.log(`ORIGIN_HOST=${parsed.host}`);

let trainerId = process.env.PSI_TRAINER_PROFILE_ID?.trim() ?? "";
if (!trainerId) {
  const response = await fetch(new URL("/trainers", origin), {
    redirect: "follow",
  });
  console.log(`TRAINERS_STATUS=${response.status}`);
  const html = await response.text();
  const match = html.match(
    /\/trainers\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  );
  trainerId = match?.[1] ?? "";
}
console.log(`TRAINER_ID=${trainerId}`);
