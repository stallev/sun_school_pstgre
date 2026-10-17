/**
 * CLI: `npm run db:seed:teacher [-- --reset-password]` (ADR-003 v1.3, seed_data_spec §4).
 * Dev only. Reads TEACHER_EMAIL and TEACHER_PASSWORD from the environment, falling back to
 * `.local/dev-secrets.json` (git-ignored). The password, the hash and the email are never printed.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { adminSeedInputSchema } from "@sunschool/domain";
import { createPrismaClient } from "../../client";
import { seedTeacher } from "./index";

const repoRoot = path.resolve(process.cwd(), "../..");
loadEnv({ path: path.resolve(repoRoot, ".env"), quiet: true });
loadEnv({ quiet: true });

type Secrets = { TEACHER_EMAIL?: string; TEACHER_PASSWORD?: string };

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
  if (appEnv !== "dev") {
    throw new Error(`db:seed:teacher runs only when APP_ENV=dev (got "${appEnv ?? ""}")`);
  }
  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) throw new Error("DIRECT_URL is not set");

  const fromFile = readDevSecrets();
  const parsed = adminSeedInputSchema.safeParse({
    email: process.env.TEACHER_EMAIL ?? fromFile.TEACHER_EMAIL,
    password: process.env.TEACHER_PASSWORD ?? fromFile.TEACHER_PASSWORD,
  });
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "input")))];
    throw new Error(`Invalid or missing teacher credentials: ${fields.join(", ")} (password needs 12+ characters)`);
  }

  console.log(`seed:teacher → APP_ENV=${appEnv}, host=${new URL(connectionString).host}`);
  const prisma = createPrismaClient(connectionString);
  try {
    const report = await seedTeacher(prisma, appEnv, {
      ...parsed.data,
      resetPassword: process.argv.includes("--reset-password"),
    });
    console.log(
      report.created
        ? "teacher created"
        : report.passwordReset
          ? "teacher password reset"
          : "teacher already exists — nothing changed (use --reset-password to change the password)",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "seed:teacher failed");
  process.exitCode = 1;
});
