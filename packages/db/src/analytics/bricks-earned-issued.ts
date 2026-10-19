import type { Prisma } from "../generated/prisma/client";

type Tx = Prisma.TransactionClient;

export async function loadBricksEarnedAndIssued(
  tx: Tx,
  pupilId: string,
  yearId: string,
): Promise<{ earned: number; issued: number }> {
  const [earnedRow, issuedRow] = await Promise.all([
    tx.homeworkCheck.aggregate({
      where: {
        pupilId,
        homeworkChecked: true,
        pointsTotal: { not: null },
        lesson: { academicYearId: yearId },
      },
      _sum: { pointsTotal: true },
    }),
    tx.brickLedger.aggregate({
      where: { pupilId, academicYearId: yearId },
      _sum: { quantity: true },
    }),
  ]);

  return {
    earned: earnedRow._sum.pointsTotal ?? 0,
    issued: issuedRow._sum.quantity ?? 0,
  };
}
