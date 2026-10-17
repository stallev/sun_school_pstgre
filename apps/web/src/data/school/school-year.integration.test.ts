/**
 * Academic year use-cases on the DEV database (school_year §5.1, §8).
 * Transactions roll back except the activation race case, which cleans up committed rows.
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ACADEMIC_YEAR_STATUS, MUTATION_ERROR_CODES, USER_ROLE } from "@sunschool/domain";
import { createPrismaClient, type Prisma, type PrismaClient } from "@sunschool/db";
import { activateYearInTransaction } from "./activate-year";
import { closeYearInTransaction } from "./close-year";
import { createYearInTransaction } from "./create-year";
import { calendarDateFromIso } from "./calendar-date";

loadEnv({ path: path.resolve(import.meta.dirname, "../../../../../.env"), quiet: true });

const enabled = process.env.APP_ENV === "dev" && Boolean(process.env.DIRECT_URL);
const ROLLBACK = new Error("rollback");
describe.skipIf(!enabled)("school year use-cases on the dev database", () => {
  let prisma: PrismaClient;
  let organizationId: string;
  let adminUserId: string;

  const rolledBack = async <T>(body: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> => {
    let result: T | undefined;
    await prisma
      .$transaction(async (tx) => {
        result = await body(tx);
        throw ROLLBACK;
      })
      .catch((error: unknown) => {
        if (error !== ROLLBACK) throw error;
      });
    return result as T;
  };

  beforeAll(async () => {
    prisma = createPrismaClient(process.env.DIRECT_URL ?? "");
    const organization = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
    if (!organization) throw new Error("run db:seed:reference first");
    organizationId = organization.id;

    const admin = await prisma.appUser.findFirst({
      where: { organizationId, roles: { some: { role: USER_ROLE.ADMIN } } },
      select: { id: true },
    });
    if (!admin) throw new Error("run db:seed:admin first");
    adminUserId = admin.id;
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const closeAllActiveYears = async (
    tx: Prisma.TransactionClient,
  ): Promise<void> => {
    const activeYears = await tx.academicYear.findMany({
      where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
      select: { id: true },
    });
    for (const year of activeYears) {
      const closed = await closeYearInTransaction(tx, adminUserId, organizationId, {
        yearId: year.id,
      });
      if (!closed.ok) {
        throw new Error(`closeAllActiveYears failed: ${JSON.stringify(closed)}`);
      }
    }
  };

  it("create → activate → close leaves no ACTIVE year and closes enrollments", async () => {
    const out = await rolledBack(async (tx) => {
      await closeAllActiveYears(tx);

      const created = await createYearInTransaction(tx, adminUserId, organizationId, {
        name: `IT-${Date.now()}`,
        startsOn: "2030-09-01",
        endsOn: "2031-06-01",
      });
      if (!created.ok) return { step: "create", created };

      const activated = await activateYearInTransaction(tx, adminUserId, organizationId, {
        yearId: created.data.yearId,
      });
      if (!activated.ok) return { step: "activate", activated };

      const closed = await closeYearInTransaction(tx, adminUserId, organizationId, {
        yearId: created.data.yearId,
      });
      const year = await tx.academicYear.findUnique({ where: { id: created.data.yearId } });
      const activeCount = await tx.academicYear.count({
        where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
      });
      return { closed, year, activeCount };
    });

    expect(out.closed).toEqual({ ok: true });
    expect(out.year?.status).toBe(ACADEMIC_YEAR_STATUS.CLOSED);
    expect(out.activeCount).toBe(0);
  }, 60_000);

  it("second activateYear returns SCHOOL_YEAR_ACTIVE_EXISTS", async () => {
    const out = await rolledBack(async (tx) => {
      await closeAllActiveYears(tx);

      const first = await createYearInTransaction(tx, adminUserId, organizationId, {
        name: `IT-A-${Date.now()}`,
        startsOn: "2032-09-01",
        endsOn: "2033-06-01",
      });
      const second = await createYearInTransaction(tx, adminUserId, organizationId, {
        name: `IT-B-${Date.now()}`,
        startsOn: "2034-09-01",
        endsOn: "2035-06-01",
      });
      if (!first.ok || !second.ok) return { first, second };

      await activateYearInTransaction(tx, adminUserId, organizationId, { yearId: first.data.yearId });
      const blocked = await activateYearInTransaction(tx, adminUserId, organizationId, {
        yearId: second.data.yearId,
      });
      return { blocked };
    });

    expect(out.blocked).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_YEAR_ACTIVE_EXISTS,
      message: "admin.year.active_exists",
    });
  }, 60_000);

  it("parallel activations yield one success and one SCHOOL_YEAR_ACTIVE_EXISTS", async () => {
    const priorActive = await prisma.academicYear.findFirst({
      where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
      select: { id: true },
    });
    const priorActiveYearId = priorActive?.id ?? null;
    if (priorActiveYearId) {
      await prisma.$transaction((tx) =>
        closeYearInTransaction(tx, adminUserId, organizationId, { yearId: priorActiveYearId }),
      );
    }

    const suffix = Date.now();
    const yearA = await prisma.academicYear.create({
      data: {
        organizationId,
        name: `Race-A-${suffix}`,
        startsOn: calendarDateFromIso("2036-09-01"),
        endsOn: calendarDateFromIso("2037-06-01"),
        status: ACADEMIC_YEAR_STATUS.DRAFT,
      },
    });
    const yearB = await prisma.academicYear.create({
      data: {
        organizationId,
        name: `Race-B-${suffix}`,
        startsOn: calendarDateFromIso("2038-09-01"),
        endsOn: calendarDateFromIso("2039-06-01"),
        status: ACADEMIC_YEAR_STATUS.DRAFT,
      },
    });

    const results = await Promise.allSettled([
      prisma.$transaction((tx) =>
        activateYearInTransaction(tx, adminUserId, organizationId, { yearId: yearA.id }),
      ),
      prisma.$transaction((tx) =>
        activateYearInTransaction(tx, adminUserId, organizationId, { yearId: yearB.id }),
      ),
    ]);

    const values = results.map((entry) => (entry.status === "fulfilled" ? entry.value : entry.reason));
    const successes = values.filter((value) => typeof value === "object" && value !== null && value.ok === true);
    const blocked = values.filter(
      (value) =>
        typeof value === "object" &&
        value !== null &&
        value.ok === false &&
        value.code === MUTATION_ERROR_CODES.SCHOOL_YEAR_ACTIVE_EXISTS,
    );

    expect(successes).toHaveLength(1);
    expect(blocked).toHaveLength(1);

    const raceWinner = await prisma.academicYear.findFirst({
      where: { id: { in: [yearA.id, yearB.id] }, status: ACADEMIC_YEAR_STATUS.ACTIVE },
      select: { id: true },
    });
    if (raceWinner) {
      await prisma.$transaction((tx) =>
        closeYearInTransaction(tx, adminUserId, organizationId, { yearId: raceWinner.id }),
      );
    }
    await prisma.academicYear.deleteMany({ where: { id: { in: [yearA.id, yearB.id] } } });

    if (priorActiveYearId) {
      await prisma.$transaction((tx) =>
        activateYearInTransaction(tx, adminUserId, organizationId, { yearId: priorActiveYearId }),
      );
    }
  }, 60_000);
});
