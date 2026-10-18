import "server-only";

import {
  DELETION_REQUEST_TYPE,
  buildDeletionPlan,
  type DeletionPlan,
} from "@sunschool/domain";
import {
  deleteBrickLedgerForPupilPrivileged,
  scrubAuditLogForPupilPrivileged,
  type Prisma,
} from "@sunschool/db";
import { gatherChildPlanInput } from "./preview-plan";

type Tx = Prisma.TransactionClient;

export type EraseChildDataResult = {
  plan: DeletionPlan;
};

/** Full pupil data erasure (deletion_requests_contract §6.2). Caller must hold `FOR UPDATE` on pupil. */
export async function eraseChildDataInTransaction(
  tx: Tx,
  pupilId: string,
): Promise<EraseChildDataResult> {
  const counts = await gatherChildPlanInput(tx, pupilId);
  const plan = buildDeletionPlan({ type: DELETION_REQUEST_TYPE.CHILD_DATA, counts });

  await tx.homeworkScoreEvent.deleteMany({ where: { check: { pupilId } } });
  await tx.homeworkVerseScore.deleteMany({ where: { check: { pupilId } } });
  await tx.achievementEvidence.deleteMany({ where: { check: { pupilId } } });
  await scrubAuditLogForPupilPrivileged(tx, pupilId);
  await tx.homeworkCheck.deleteMany({ where: { pupilId } });
  await deleteBrickLedgerForPupilPrivileged(tx, pupilId);
  await tx.achievementAward.deleteMany({ where: { pupilId } });
  await tx.penalty.deleteMany({ where: { pupilId } });
  await tx.recitationAttempt.deleteMany({ where: { pupilId } });
  await tx.voicePhotoConsent.deleteMany({ where: { pupilId } });
  await tx.enrollment.deleteMany({ where: { pupilId } });
  await tx.childDataConsent.deleteMany({ where: { pupilId } });
  await tx.pupil.delete({ where: { id: pupilId } });

  return { plan };
}
