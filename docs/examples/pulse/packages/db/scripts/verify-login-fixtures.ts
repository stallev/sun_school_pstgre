import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/client";
import { FIXTURE_USERS } from "../prisma/seed/fixtures";

loadEnv({ path: resolve(process.cwd(), "../../apps/web/.env.local") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  for (const fixture of Object.values(FIXTURE_USERS)) {
    const user = await prisma.user.findUnique({
      where: { email: fixture.email },
    });

    if (!user) {
      console.log(`${fixture.email}: NOT FOUND`);
      continue;
    }

    const hasHash = Boolean(user.passwordHash);
    const valid = hasHash
      ? await bcrypt.compare(fixture.password, user.passwordHash!)
      : false;

    console.log(
      `${fixture.email}: hash=${hasHash} valid=${valid} role=${user.role}`,
    );
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
