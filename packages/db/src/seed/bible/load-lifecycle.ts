import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  BIBLE_TRANSLATION_STATUS,
} from "@sunschool/domain";
import { writeAudit } from "../../audit/write-audit";
import type { PrismaClient } from "../../generated/prisma/client";
import type { SeedTx } from "./types";

export async function startLoad(tx: SeedTx, translationId: string, translationCode: string): Promise<void> {
  const row = await tx.bibleTranslation.findUniqueOrThrow({ where: { id: translationId } });
  if (
    row.status !== BIBLE_TRANSLATION_STATUS.NO_DATA &&
    row.status !== BIBLE_TRANSLATION_STATUS.READY
  ) {
    throw new Error(`Cannot start load: status=${row.status}`);
  }
  await tx.bibleTranslation.update({
    where: { id: translationId },
    data: { status: BIBLE_TRANSLATION_STATUS.LOADING },
  });
  await writeAudit(tx, {
    actorUserId: null,
    source: AUDIT_SOURCE.SYSTEM,
    entityType: AUDIT_ENTITY_TYPE.BIBLE_TRANSLATION,
    entityId: translationId,
    action: AUDIT_ACTION.BIBLE_LOAD_STARTED,
    newValue: { code: translationCode },
  });
}

export async function finishLoad(
  tx: SeedTx,
  translationId: string,
  translationCode: string,
  verify: unknown,
): Promise<void> {
  await tx.bibleTranslation.update({
    where: { id: translationId },
    data: { status: BIBLE_TRANSLATION_STATUS.READY },
  });
  await writeAudit(tx, {
    actorUserId: null,
    source: AUDIT_SOURCE.SYSTEM,
    entityType: AUDIT_ENTITY_TYPE.BIBLE_TRANSLATION,
    entityId: translationId,
    action: AUDIT_ACTION.BIBLE_LOAD_FINISHED,
    newValue: { code: translationCode, verify },
  });
}

export async function failLoad(
  prisma: PrismaClient,
  translationId: string,
  translationCode: string,
  reason: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.bibleTranslation.update({
      where: { id: translationId },
      data: { status: BIBLE_TRANSLATION_STATUS.NO_DATA },
    });
    await writeAudit(tx, {
      actorUserId: null,
      source: AUDIT_SOURCE.SYSTEM,
      entityType: AUDIT_ENTITY_TYPE.BIBLE_TRANSLATION,
      entityId: translationId,
      action: AUDIT_ACTION.BIBLE_LOAD_FAILED,
      newValue: { code: translationCode, reason },
    });
  });
}
