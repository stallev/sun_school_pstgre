/**
 * One-off dev cleanup: remove a test Telegram user matched by phone digits in `login_identity.phone`
 * (column must still exist — run with `--apply` before `prisma migrate deploy` drops it).
 *
 * Usage (from repo root):
 *   npx tsx packages/db/src/scripts/purge-dev-telegram-by-phone.ts <digits-only-phone> [--apply]
 *
 * Phone number is only passed on the command line, never stored in the repo.
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { LOGIN_PROVIDER, USER_ROLE } from "@sunschool/domain";
import { createPrismaClient } from "../client";
import { assertDbEnvironment } from "../env-guard";

const repoRoot = path.resolve(import.meta.dirname, "../../../..");
loadEnv({ path: path.resolve(repoRoot, ".env"), quiet: true });
loadEnv({ quiet: true });

type MatchRow = {
  identity_id: string;
  user_id: string;
  provider_account_id: string;
};

const digitsOnly = (value: string): string => value.replace(/\D/g, "");

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((arg) => arg !== "--apply");
  const apply = process.argv.includes("--apply");
  const phoneArg = args[0];
  if (!phoneArg) {
    throw new Error("Usage: purge-dev-telegram-by-phone.ts <phone-digits> [--apply]");
  }
  const phoneDigits = digitsOnly(phoneArg);
  if (phoneDigits.length < 8) {
    throw new Error("Phone argument must contain at least 8 digits");
  }

  const appEnv = process.env.APP_ENV;
  if (appEnv !== "dev") {
    throw new Error(`Refusing to run: APP_ENV must be dev (got "${appEnv ?? ""}")`);
  }

  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) throw new Error("DIRECT_URL is not set");

  const prisma = createPrismaClient(connectionString);
  await assertDbEnvironment(prisma, appEnv, { allowMarkerWrite: false });

  const rows = await prisma.$queryRaw<MatchRow[]>`
    SELECT li.id AS identity_id, li.user_id, li.provider_account_id
    FROM login_identity li
    WHERE li.provider::text = ${LOGIN_PROVIDER.TELEGRAM}
      AND regexp_replace(COALESCE(li.phone, ''), '[^0-9]', '', 'g') = ${phoneDigits}
  `;

  if (rows.length === 0) {
    console.log("No matching Telegram login_identity; nothing to do.");
    await prisma.$disconnect();
    return;
  }
  if (rows.length > 1) {
    throw new Error(`Expected exactly one login_identity for phone digits, found ${rows.length}`);
  }

  const { user_id: userId } = rows[0]!;

  const [adminRole, lessons, checks, assignments] = await Promise.all([
    prisma.userRoleAssignment.findFirst({ where: { userId, role: USER_ROLE.ADMIN } }),
    prisma.lesson.count({ where: { leadTeacherId: userId } }),
    prisma.homeworkCheck.count({ where: { checkedById: userId } }),
    prisma.teacherAssignment.count({ where: { userId } }),
  ]);

  if (adminRole || lessons > 0 || checks > 0 || assignments > 0) {
    throw new Error(
      "Refusing to delete: user has admin role, lessons, homework checks or teacher assignments",
    );
  }

  if (!apply) {
    console.log(`Dry run: would delete app_user ${userId} and related registration data. Pass --apply to execute.`);
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.accessRequest.deleteMany({ where: { userId } });
    await tx.privacyConsent.deleteMany({ where: { userId } });
    await tx.userRoleAssignment.deleteMany({ where: { userId } });
    await tx.loginIdentity.deleteMany({ where: { userId } });
    await tx.$executeRaw`DELETE FROM audit_log WHERE actor_user_id = ${userId}::uuid`;
    await tx.appUser.delete({ where: { id: userId } });
  });

  console.log(`Deleted app_user ${userId} and related rows.`);
  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
