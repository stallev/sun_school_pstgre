/**
 * Live group metrics vs snapshot v1 on close (analytics_year_snapshots_contract §11).
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ACADEMIC_YEAR_STATUS, USER_ROLE } from "@sunschool/domain";
import { createPrismaClient, type Prisma, type PrismaClient } from "@sunschool/db";
import {
  computeGroupYearSnapshotMetrics,
} from "./compute-year-snapshots.server";
import { closeYearInTransaction } from "../../school/close-year";
import { activateYearInTransaction } from "../../school/activate-year";
import { createYearInTransaction } from "../../school/create-year";

loadEnv({ path: path.resolve(import.meta.dirname, "../../../../../.env"), quiet: true });

const enabled = process.env.APP_ENV === "dev" && Boolean(process.env.DIRECT_URL);
const ROLLBACK = new Error("rollback");

describe.skipIf(!enabled)("year snapshots on close", () => {
  let prisma: PrismaClient;
  let organizationId: string;
  let adminUserId: string;

  const rolledBack = async <T>(body: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> => {
    let result: T | undefined;
    await prisma
      .$transaction(
        async (tx) => {
          result = await body(tx);
          throw ROLLBACK;
        },
        { maxWait: 20_000, timeout: 60_000 },
      )
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

  it("persists group snapshot matching live metrics at close", async () => {
    const out = await rolledBack(async (tx) => {
      const created = await createYearInTransaction(tx, adminUserId, organizationId, {
        name: `SNAP-${Date.now()}`,
        startsOn: "2032-09-01",
        endsOn: "2033-06-01",
      });
      if (!created.ok) throw new Error(JSON.stringify(created));

      const activated = await activateYearInTransaction(tx, adminUserId, organizationId, {
        yearId: created.data.yearId,
      });
      if (!activated.ok) throw new Error(JSON.stringify(activated));

      const settings = await tx.gradeSettings.findFirst({
        where: { academicYearId: created.data.yearId },
        select: { gradeId: true },
      });
      if (!settings) return { skipped: true as const };

      const live = await computeGroupYearSnapshotMetrics(tx, settings.gradeId, created.data.yearId);

      const closed = await closeYearInTransaction(tx, adminUserId, organizationId, {
        yearId: created.data.yearId,
      });
      if (!closed.ok) throw new Error(JSON.stringify(closed));

      const snapshot = await tx.analyticsGroupYearSnapshot.findFirst({
        where: {
          gradeId: settings.gradeId,
          academicYearId: created.data.yearId,
          version: 1,
        },
      });

      const year = await tx.academicYear.findUnique({ where: { id: created.data.yearId } });
      return { live, snapshot, year };
    });

    if ("skipped" in out && out.skipped) return;

    expect(out.year?.status).toBe(ACADEMIC_YEAR_STATUS.CLOSED);
    expect(out.snapshot).not.toBeNull();
    expect(out.snapshot?.kids).toBe(out.live.kids);
    expect(out.snapshot?.lessons).toBe(out.live.lessons);
    expect(Number(out.snapshot?.attendance)).toBeCloseTo(out.live.attendance ?? 0, 5);
  });
});
