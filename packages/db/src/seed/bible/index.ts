import { readFile } from "node:fs/promises";
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE, AUDIT_SOURCE } from "@sunschool/domain";
import { writeAudit } from "../../audit/write-audit";
import { assertDbEnvironment } from "../../env-guard";
import type { PrismaClient } from "../../generated/prisma/client";
import { BIBLE_EXPECTED, BIBLE_SEED_LOCK_KEY, RST_TRANSLATION_CODE } from "./constants";
import { failLoad, finishLoad, startLoad } from "./load-lifecycle";
import { loadBooks } from "./load-books";
import { loadVerses } from "./load-verses";
import { RST_FILES } from "./paths";
import type { RstBookRow, RstChapterRow, RstVerseRow } from "./types";
import { BibleVerifyError, verifyTranslation } from "./verify";

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

export class BibleSeedBusyError extends Error {
  constructor() {
    super("Another seed:bible run holds the advisory lock — exiting without changing load status");
    this.name = "BibleSeedBusyError";
  }
}

export type BibleSeedReport = {
  translationCode: string;
  books: { upserted: number };
  verses: { verseRows: number; batches: number };
  verify: { books: number; chapters: number; verses: number };
};

/**
 * Loads the Synodal (RST) translation from JSON (bible_seed_contract §5.1, seed_data_spec §7).
 * One transaction for data; `failLoad` runs after rollback only if `startLoad` ran in that attempt.
 */
export async function seedBibleRst(prisma: PrismaClient, appEnv: string | undefined): Promise<BibleSeedReport> {
  await assertDbEnvironment(prisma, appEnv, { allowMarkerWrite: false });

  const translation = await prisma.bibleTranslation.findUnique({ where: { code: RST_TRANSLATION_CODE } });
  if (!translation) {
    throw new Error(`Missing bible_translation row for ${RST_TRANSLATION_CODE} — run db:seed:reference first`);
  }

  const [bookRows, chapterRows, verseRows] = await Promise.all([
    readJson<RstBookRow[]>(RST_FILES.books),
    readJson<RstChapterRow[]>(RST_FILES.chapters),
    readJson<RstVerseRow[]>(RST_FILES.verses),
  ]);

  if (verseRows.length !== BIBLE_EXPECTED.versesRst) {
    throw new Error(`RST verse file length ${verseRows.length} !== ${BIBLE_EXPECTED.versesRst}`);
  }

  let loadStartedInTransaction = false;
  try {
    return await prisma.$transaction(
      async (tx) => {
        // Non-blocking: a concurrent run exits without touching load status (contract §10).
        // Waiting on the lock could burn the transaction timeout and then overwrite the first run's READY via failLoad.
        const [{ locked }] = await tx.$queryRawUnsafe<[{ locked: boolean }]>(
          `SELECT pg_try_advisory_xact_lock(${BIBLE_SEED_LOCK_KEY}) AS locked`,
        );
        if (!locked) {
          throw new BibleSeedBusyError();
        }

        await startLoad(tx, translation.id, RST_TRANSLATION_CODE);
        loadStartedInTransaction = true;

        const books = await loadBooks(tx, bookRows);
        const bookRowsDb = await tx.bibleBook.findMany({ select: { id: true, sortOrder: true } });
        const bookIdBySortOrder = new Map(bookRowsDb.map((book) => [book.sortOrder, book.id]));

        const verses = await loadVerses(tx, translation.id, verseRows, bookIdBySortOrder);
        const verify = await verifyTranslation(tx, translation.id, chapterRows);

        await finishLoad(tx, translation.id, RST_TRANSLATION_CODE, verify);

        await writeAudit(tx, {
          actorUserId: null,
          source: AUDIT_SOURCE.SYSTEM,
          entityType: AUDIT_ENTITY_TYPE.SEED,
          entityId: "bible-rst",
          action: AUDIT_ACTION.SEED_RUN,
          newValue: { translationCode: RST_TRANSLATION_CODE, books, verses, verify },
        });

        return { translationCode: RST_TRANSLATION_CODE, books, verses, verify };
      },
      { maxWait: 20_000, timeout: 600_000 },
    );
  } catch (error) {
    if (loadStartedInTransaction) {
      const reason =
        error instanceof BibleVerifyError
          ? error.message
          : error instanceof Error
            ? error.message
            : String(error);
      await failLoad(prisma, translation.id, RST_TRANSLATION_CODE, reason);
    }
    throw error;
  }
}
