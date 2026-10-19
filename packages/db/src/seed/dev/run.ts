/**
 * CLI: `npm run db:seed:dev` (seed_data_spec set D). Dev only.
 * Prerequisites: `db:seed:reference`, `db:seed:teacher`, and no ACTIVE academic year
 * (`npm run db:delete:year -- --confirm` removes the current one).
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createPrismaClient } from "../../client";
import { seedDev } from "./index";

const repoRoot = path.resolve(process.cwd(), "../..");
loadEnv({ path: path.resolve(repoRoot, ".env"), quiet: true });
loadEnv({ quiet: true });

async function main(): Promise<void> {
  const appEnv = process.env.APP_ENV;
  if (appEnv !== "dev") {
    throw new Error(`db:seed:dev runs only when APP_ENV=dev (got "${appEnv ?? ""}")`);
  }
  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) throw new Error("DIRECT_URL is not set");

  console.log(`seed:dev → APP_ENV=${appEnv}, host=${new URL(connectionString).host}`);
  const prisma = createPrismaClient(connectionString);
  try {
    const report = await seedDev(prisma, appEnv);
    console.log(
      report.skipped
        ? "fixture already present — nothing changed"
        : `seeded: ${report.pupils} pupils, ${report.lessons} lessons, ${report.checks} checks, ${report.bricks} brick rows`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "seed:dev failed");
  process.exitCode = 1;
});
