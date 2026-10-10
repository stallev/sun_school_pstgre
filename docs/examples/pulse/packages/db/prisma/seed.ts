import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client";
import {
  seedAdminSamples,
  seedBookings,
  seedReview,
  seedWishlist,
} from "./seed/bookings";
import { FIXTURE_USERS } from "./seed/fixtures";
import {
  seedScheduleExceptions,
  seedServices,
  seedWeeklySchedule,
} from "./seed/services";
import {
  getSpecializationMap,
  seedSpecializations,
} from "./seed/specializations";
import { seedTrainerProfiles, seedVerificationDocument } from "./seed/trainers";
import { seedUsers } from "./seed/users";

loadEnv({ path: resolve(process.cwd(), "../../apps/web/.env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

function assertDevSeedAllowed() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_SEED !== "true") {
    throw new Error("Refusing to run dev seed in production");
  }
}

async function main() {
  assertDevSeedAllowed();

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DIRECT_URL or DATABASE_URL is required for seed");
  }

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await seedSpecializations(prisma);
    const specializationMap = await getSpecializationMap(prisma);

    const users = await seedUsers(prisma);
    const trainers = await seedTrainerProfiles(prisma, users, specializationMap);
    const services = await seedServices(prisma, trainers);

    await seedWeeklySchedule(prisma, trainers);
    await seedScheduleExceptions(prisma, trainers);
    await seedBookings(prisma, users, trainers, services);
    await seedReview(prisma, users, trainers);
    await seedWishlist(prisma, users, trainers);
    await seedVerificationDocument(prisma, users, trainers);
    await seedAdminSamples(prisma, users, trainers);

    console.log("✓ Pulse dev seed complete — see seed_data_spec.md for credentials");
    console.log("Dev credentials — never use in production:");
    for (const fixture of Object.values(FIXTURE_USERS)) {
      console.log(`  ${fixture.email} / ${fixture.password} (${fixture.role})`);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
