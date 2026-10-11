/**
 * CLI: `npm run seed:reference -w @sunschool/db` (root alias `db:seed:reference`).
 * seed_data_spec §4: explicit command, DIRECT (non-pooled) connection, APP_ENV validated before
 * any connection is opened.
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createPrismaClient } from "../../client";
import { DB_ENVIRONMENTS } from "../../env-guard";
import { seedReference } from "./index";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });
loadEnv();

async function main(): Promise<void> {
  const appEnv = process.env.APP_ENV;
  if (!appEnv || !(DB_ENVIRONMENTS as readonly string[]).includes(appEnv)) {
    throw new Error(`APP_ENV must be one of: ${DB_ENVIRONMENTS.join(", ")} (got "${appEnv ?? ""}")`);
  }
  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error("DIRECT_URL is not set");
  }
  // Log the host only — never the password (seed_data_spec §5).
  console.log(`seed:reference → APP_ENV=${appEnv}, host=${new URL(connectionString).host}`);

  const prisma = createPrismaClient(connectionString);
  try {
    const report = await seedReference(prisma, appEnv);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
