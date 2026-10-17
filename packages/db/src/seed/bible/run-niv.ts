/**
 * CLI: `npm run seed:bible:niv -w @sunschool/db` (root alias `db:seed:bible:niv`).
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createPrismaClient } from "../../client";
import { DB_ENVIRONMENTS } from "../../env-guard";
import { seedBibleNiv } from "./load-niv";

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

  const confirmLicense = process.argv.includes("--confirm-license");
  console.log(`seed:bible:niv → APP_ENV=${appEnv}, host=${new URL(connectionString).host}`);

  const prisma = createPrismaClient(connectionString);
  try {
    const report = await seedBibleNiv(prisma, appEnv, { confirmLicense });
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
