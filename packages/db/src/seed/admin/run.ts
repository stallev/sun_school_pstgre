/**
 * CLI: `npm run db:seed:admin [-- --reset-password]` (seed_data_spec §4, ADR-003 v1.1 §4.4).
 * Reads FIRST_ADMIN_EMAIL and ADMIN_PASSWORD from the environment; in dev falls back to
 * `.local/dev-secrets.json` (git-ignored). The password is never printed or logged.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { adminSeedInputSchema } from "@sunschool/domain";
import { createPrismaClient } from "../../client";
import { DB_ENVIRONMENTS } from "../../env-guard";
import { seedAdmin } from "./index";

const repoRoot = path.resolve(process.cwd(), "../..");
loadEnv({ path: path.resolve(repoRoot, ".env"), quiet: true });
loadEnv({ quiet: true });

type Secrets = { FIRST_ADMIN_EMAIL?: string; ADMIN_PASSWORD?: string };

function readDevSecrets(): Secrets {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path.resolve(repoRoot, ".local/dev-secrets.json"), "utf8"));
    return typeof parsed === "object" && parsed !== null ? (parsed as Secrets) : {};
  } catch {
    return {};
  }
}

async function main(): Promise<void> {
  const appEnv = process.env.APP_ENV;
  if (!appEnv || !(DB_ENVIRONMENTS as readonly string[]).includes(appEnv)) {
    throw new Error(`APP_ENV must be one of: ${DB_ENVIRONMENTS.join(", ")} (got "${appEnv ?? ""}")`);
  }
  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) throw new Error("DIRECT_URL is not set");

  const fromFile = appEnv === "dev" ? readDevSecrets() : {};
  const parsed = adminSeedInputSchema.safeParse({
    email: process.env.FIRST_ADMIN_EMAIL ?? fromFile.FIRST_ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD ?? fromFile.ADMIN_PASSWORD,
  });
  if (!parsed.success) {
    // Field names only — never the values.
    const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "input")))];
    throw new Error(`Invalid or missing admin credentials: ${fields.join(", ")} (password needs 12+ characters)`);
  }

  console.log(`seed:admin → APP_ENV=${appEnv}, host=${new URL(connectionString).host}`);
  const prisma = createPrismaClient(connectionString);
  try {
    const report = await seedAdmin(prisma, appEnv, {
      ...parsed.data,
      resetPassword: process.argv.includes("--reset-password"),
    });
    console.log(
      report.created
        ? "admin created"
        : report.passwordReset
          ? "admin password reset"
          : "admin already exists — nothing changed (use --reset-password to change the password)",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "seed:admin failed");
  process.exitCode = 1;
});
