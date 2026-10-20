/**
 * Dev-only cleanup: delete one academic year together with its pupils.
 *
 * Usage (from repo root):
 *   npm run db:delete:year                       # dry run for the single ACTIVE year
 *   npm run db:delete:year -- --year "2026–2027" # dry run for a year by name or id
 *   npm run db:delete:year -- --confirm          # execute
 *   npm run db:delete:year -- --all-pupils       # pupils: every pupil of the organization, not only the year's
 *
 * Scope without `--all-pupils`: pupils with an enrollment in the year. Pupil data is erased across
 * all years (same order as `erase-child-data.ts`); groups, users and the audit trail stay
 * (`audit_log` is append-only; rows about the erased pupils are scrubbed through the privileged function).
 * Brick ledger rows are append-only too: they go through the privileged per-pupil function.
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { ACADEMIC_YEAR_STATUS, AUDIT_ACTION, AUDIT_ENTITY_TYPE, AUDIT_SOURCE } from "@sunschool/domain";
import { writeAudit } from "../audit/write-audit";
import { createPrismaClient } from "../client";
import { deleteBrickLedgerForPupilPrivileged } from "../deletion/delete-brick-ledger-for-pupil";
import { scrubAuditLogForPupilPrivileged } from "../deletion/scrub-audit-log-for-pupil";
import { assertDbEnvironment } from "../env-guard";
import type { Prisma, PrismaClient } from "../generated/prisma/client";

const repoRoot = path.resolve(import.meta.dirname, "../../../..");
loadEnv({ path: path.resolve(repoRoot, ".env"), quiet: true });
loadEnv({ quiet: true });

/** Shared with `seed:dev`: the two scripts never run at the same time. */
const DEV_FIXTURE_LOCK_KEY = "7340125511";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Tx = Prisma.TransactionClient;
type YearRow = { id: string; name: string; status: string; organizationId: string };

function readOption(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function resolveYear(db: Tx | PrismaClient): Promise<YearRow> {
  const selector = readOption("--year");
  const select = { id: true, name: true, status: true, organizationId: true } as const;
  if (!selector) {
    const active = await db.academicYear.findMany({ where: { status: ACADEMIC_YEAR_STATUS.ACTIVE }, select });
    if (active.length !== 1) {
      throw new Error(`Expected exactly one ACTIVE year, found ${active.length}; pass --year <id|name>`);
    }
    return active[0]!;
  }
  const rows = await db.academicYear.findMany({
    where: UUID_PATTERN.test(selector) ? { id: selector } : { name: selector },
    select,
  });
  if (rows.length !== 1) throw new Error(`Expected exactly one year for "${selector}", found ${rows.length}`);
  return rows[0]!;
}

async function resolvePupilIds(tx: Tx, year: YearRow): Promise<string[]> {
  const rows = process.argv.includes("--all-pupils")
    ? await tx.pupil.findMany({ where: { organizationId: year.organizationId }, select: { id: true } })
    : await tx.pupil.findMany({
        where: { enrollments: { some: { academicYearId: year.id } } },
        select: { id: true },
      });
  return rows.map((row) => row.id);
}

async function collectCounts(tx: Tx, year: YearRow, pupilIds: string[]): Promise<Record<string, number>> {
  const lessonWhere = { academicYearId: year.id };
  const checkWhere = { lesson: lessonWhere };
  return {
    pupils: pupilIds.length,
    "enrollments (year)": await tx.enrollment.count({ where: { academicYearId: year.id } }),
    lessons: await tx.lesson.count({ where: lessonWhere }),
    "homework checks (year)": await tx.homeworkCheck.count({ where: checkWhere }),
    "homework checks (pupils, all years)": await tx.homeworkCheck.count({ where: { pupilId: { in: pupilIds } } }),
    "brick ledger rows (year)": await tx.brickLedger.count({ where: { academicYearId: year.id } }),
    "brick ledger rows (pupils, all years)": await tx.brickLedger.count({ where: { pupilId: { in: pupilIds } } }),
    "grade settings": await tx.gradeSettings.count({ where: { academicYearId: year.id } }),
    "teacher assignments": await tx.teacherAssignment.count({ where: { academicYearId: year.id } }),
  };
}

/** Year bricks that belong to pupils outside the deletion scope cannot be removed (append-only). */
async function assertNoForeignBricks(tx: Tx, year: YearRow, pupilIds: string[]): Promise<void> {
  const foreign = await tx.brickLedger.count({
    where: { academicYearId: year.id, pupilId: { notIn: pupilIds } },
  });
  if (foreign > 0) {
    throw new Error(
      `${foreign} brick ledger rows of this year belong to pupils outside the scope; rerun with --all-pupils`,
    );
  }
}

async function erasePupils(tx: Tx, pupilIds: string[]): Promise<void> {
  const familyIds = (
    await tx.pupil.findMany({ where: { id: { in: pupilIds }, familyId: { not: null } }, select: { familyId: true } })
  ).flatMap((row) => (row.familyId ? [row.familyId] : []));

  await tx.homeworkScoreEvent.deleteMany({ where: { check: { pupilId: { in: pupilIds } } } });
  await tx.homeworkVerseScore.deleteMany({ where: { check: { pupilId: { in: pupilIds } } } });
  await tx.achievementEvidence.deleteMany({ where: { check: { pupilId: { in: pupilIds } } } });
  for (const pupilId of pupilIds) await scrubAuditLogForPupilPrivileged(tx, pupilId);
  await tx.homeworkCheck.deleteMany({ where: { pupilId: { in: pupilIds } } });
  for (const pupilId of pupilIds) await deleteBrickLedgerForPupilPrivileged(tx, pupilId);
  await tx.achievementAward.deleteMany({ where: { pupilId: { in: pupilIds } } });
  await tx.penalty.deleteMany({ where: { pupilId: { in: pupilIds } } });
  await tx.recitationAttempt.deleteMany({ where: { pupilId: { in: pupilIds } } });
  await tx.voicePhotoConsent.deleteMany({ where: { pupilId: { in: pupilIds } } });
  await tx.deletionRequest.deleteMany({ where: { subjectPupilId: { in: pupilIds } } });
  await tx.enrollment.deleteMany({ where: { pupilId: { in: pupilIds } } });
  await tx.childDataConsent.deleteMany({ where: { pupilId: { in: pupilIds } } });
  await tx.analyticsPupilYearSnapshot.deleteMany({ where: { pupilId: { in: pupilIds } } });
  await tx.pupil.deleteMany({ where: { id: { in: pupilIds } } });

  for (const familyId of new Set(familyIds)) {
    if ((await tx.pupil.count({ where: { familyId } })) > 0) continue;
    await tx.familyAdult.deleteMany({ where: { familyId } });
    await tx.family.delete({ where: { id: familyId } });
  }
}

async function eraseYear(tx: Tx, yearId: string): Promise<void> {
  const lessons = await tx.lesson.findMany({ where: { academicYearId: yearId }, select: { id: true } });
  const lessonIds = lessons.map((row) => row.id);

  await tx.homeworkScoreEvent.deleteMany({ where: { check: { lessonId: { in: lessonIds } } } });
  await tx.homeworkVerseScore.deleteMany({ where: { check: { lessonId: { in: lessonIds } } } });
  await tx.achievementEvidence.deleteMany({ where: { check: { lessonId: { in: lessonIds } } } });
  await tx.homeworkCheck.deleteMany({ where: { lessonId: { in: lessonIds } } });
  await tx.achievementAward.deleteMany({ where: { academicYearId: yearId } });
  await tx.penalty.deleteMany({ where: { lessonId: { in: lessonIds } } });
  await tx.recitationAttempt.deleteMany({ where: { lessonVerse: { lessonId: { in: lessonIds } } } });
  await tx.lessonGoldenVerse.deleteMany({ where: { lessonId: { in: lessonIds } } });
  await tx.gradeEvent.deleteMany({ where: { lessonId: { in: lessonIds } } });
  await tx.lesson.deleteMany({ where: { academicYearId: yearId } });
  await tx.enrollment.deleteMany({ where: { academicYearId: yearId } });
  await tx.teacherAssignment.deleteMany({ where: { academicYearId: yearId } });
  await tx.gradeAchievementPeriod.deleteMany({ where: { gradeSettings: { academicYearId: yearId } } });
  await tx.gradeSettings.deleteMany({ where: { academicYearId: yearId } });
  await tx.analyticsPupilYearSnapshot.deleteMany({ where: { academicYearId: yearId } });
  await tx.analyticsGroupYearSnapshot.deleteMany({ where: { academicYearId: yearId } });
  await tx.academicYear.delete({ where: { id: yearId } });
}

async function main(): Promise<void> {
  const appEnv = process.env.APP_ENV;
  if (appEnv !== "dev") {
    throw new Error(`Refusing to run: APP_ENV must be dev (got "${appEnv ?? ""}")`);
  }
  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) throw new Error("DIRECT_URL is not set");
  const confirm = process.argv.includes("--confirm");

  console.log(`delete-academic-year → APP_ENV=${appEnv}, host=${new URL(connectionString).host}`);
  const prisma = createPrismaClient(connectionString);
  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${DEV_FIXTURE_LOCK_KEY})`);
        await assertDbEnvironment(tx, appEnv, { allowMarkerWrite: false });

        const year = await resolveYear(tx);
        const pupilIds = await resolvePupilIds(tx, year);
        const counts = await collectCounts(tx, year, pupilIds);
        console.log(`Year "${year.name}" (${year.status}), id ${year.id}`);
        for (const [label, value] of Object.entries(counts)) console.log(`  ${label}: ${value}`);

        await assertNoForeignBricks(tx, year, pupilIds);
        if (!confirm) {
          console.log("Dry run: nothing deleted. Pass --confirm to execute.");
          return;
        }

        await erasePupils(tx, pupilIds);
        await eraseYear(tx, year.id);
        await writeAudit(tx, {
          actorUserId: null,
          source: AUDIT_SOURCE.SYSTEM,
          entityType: AUDIT_ENTITY_TYPE.SEED,
          entityId: year.id,
          action: AUDIT_ACTION.SEED_RUN,
          newValue: { script: "delete-academic-year", pupils: pupilIds.length },
        });
        console.log("Deleted.");
      },
      { maxWait: 20_000, timeout: 120_000 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
