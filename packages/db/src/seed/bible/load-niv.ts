import { access, readFile } from "node:fs/promises";
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE, AUDIT_SOURCE } from "@sunschool/domain";
import { writeAudit } from "../../audit/write-audit";
import { assertDbEnvironment } from "../../env-guard";
import type { PrismaClient } from "../../generated/prisma/client";
import {
  buildVerseMap,
  loadVersification,
  planVerseMapRows,
  verifyVerseMapForTranslation,
} from "./build-verse-map";
import { BibleSeedBusyError } from "./index";
import {
  BIBLE_EXPECTED,
  BIBLE_SEED_LOCK_KEY,
  NIV_LICENSE,
  NIV_TRANSLATION_CODE,
} from "./constants";
import { failLoad, finishLoad, startLoad } from "./load-lifecycle";
import { loadBooks } from "./load-books";
import { loadVerses } from "./load-verses";
import { NIV_FILES, RST_FILES } from "./paths";
import type { RstBookRow, RstChapterRow, RstVerseRow } from "./types";
import { BibleVerifyError, verifyTranslation } from "./verify";

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

export class NivLicenseGuardError extends Error {
  constructor() {
    super("NIV seed in prod requires --confirm-license (ADR-009 §3.2)");
    this.name = "NivLicenseGuardError";
  }
}

export function assertNivSeedAllowed(appEnv: string | undefined, confirmLicense: boolean): void {
  if (appEnv === "prod" && !confirmLicense) {
    throw new NivLicenseGuardError();
  }
}

async function assertNivDataPresent(): Promise<void> {
  for (const file of Object.values(NIV_FILES)) {
    await access(file);
  }
}

export type BibleNivSeedReport = {
  translationCode: string;
  books: { upserted: number };
  verses: { verseRows: number; batches: number };
  verseMap: { upserted: number; incompleteChapters: string[] };
  verify: { books: number; chapters: number; verses: number };
};

/**
 * Loads NIV from local JSON (bible_seed_contract §5.1, §6; ADR-009 §3.2).
 */
export async function seedBibleNiv(
  prisma: PrismaClient,
  appEnv: string | undefined,
  options: { confirmLicense: boolean },
): Promise<BibleNivSeedReport> {
  assertNivSeedAllowed(appEnv, options.confirmLicense);
  await assertNivDataPresent();
  await assertDbEnvironment(prisma, appEnv, { allowMarkerWrite: false });

  const translation = await prisma.bibleTranslation.findUnique({ where: { code: NIV_TRANSLATION_CODE } });
  if (!translation) {
    throw new Error(`Missing bible_translation row for ${NIV_TRANSLATION_CODE} — run db:seed:reference first`);
  }

  const [bookRows, chapterRows, verseRows, versification] = await Promise.all([
    readJson<RstBookRow[]>(NIV_FILES.books),
    readJson<RstChapterRow[]>(NIV_FILES.chapters),
    readJson<RstVerseRow[]>(NIV_FILES.verses),
    loadVersification(),
  ]);

  if (verseRows.length !== BIBLE_EXPECTED.versesNiv) {
    throw new Error(`NIV verse file length ${verseRows.length} !== ${BIBLE_EXPECTED.versesNiv}`);
  }

  const rstChapterRows = await readJson<RstChapterRow[]>(RST_FILES.chapters);

  let loadStartedInTransaction = false;
  try {
    return await prisma.$transaction(
      async (tx) => {
        const [{ locked }] = await tx.$queryRawUnsafe<[{ locked: boolean }]>(
          `SELECT pg_try_advisory_xact_lock(${BIBLE_SEED_LOCK_KEY}) AS locked`,
        );
        if (!locked) {
          throw new BibleSeedBusyError();
        }

        await startLoad(tx, translation.id, NIV_TRANSLATION_CODE);
        loadStartedInTransaction = true;

        const books = await loadBooks(tx, bookRows);
        const bookRowsDb = await tx.bibleBook.findMany({ select: { id: true, sortOrder: true } });
        const bookIdBySortOrder = new Map(bookRowsDb.map((book) => [book.sortOrder, book.id]));

        const verses = await loadVerses(tx, translation.id, verseRows, bookIdBySortOrder);

        const { rows: plannedRows, incompleteChapters } = planVerseMapRows({
          nivVerses: verseRows,
          rstChapters: rstChapterRows,
          nivChapters: chapterRows,
          versification,
          bookIdBySortOrder,
        });

        if (incompleteChapters.length > 0) {
          throw new BibleVerifyError(
            `bible_verse_map incomplete for chapters: ${incompleteChapters.slice(0, 8).join(", ")}`,
          );
        }

        const verseMap = await buildVerseMap(tx, translation.id, plannedRows);
        await verifyVerseMapForTranslation(tx, translation.id, chapterRows, incompleteChapters);

        const verify = await verifyTranslation(
          tx,
          translation.id,
          chapterRows,
          BIBLE_EXPECTED.versesNiv,
        );

        await tx.bibleTranslation.update({
          where: { id: translation.id },
          data: { source: "Biblica NIV (local seed)", license: NIV_LICENSE },
        });

        await finishLoad(tx, translation.id, NIV_TRANSLATION_CODE, verify);

        await writeAudit(tx, {
          actorUserId: null,
          source: AUDIT_SOURCE.SYSTEM,
          entityType: AUDIT_ENTITY_TYPE.SEED,
          entityId: "bible-niv",
          action: AUDIT_ACTION.SEED_RUN,
          newValue: { translationCode: NIV_TRANSLATION_CODE, books, verses, verseMap, verify },
        });

        return {
          translationCode: NIV_TRANSLATION_CODE,
          books,
          verses,
          verseMap: { upserted: verseMap.upserted, incompleteChapters },
          verify,
        };
      },
      { maxWait: 20_000, timeout: 900_000 },
    );
  } catch (error) {
    if (loadStartedInTransaction) {
      const reason =
        error instanceof BibleVerifyError
          ? error.message
          : error instanceof Error
            ? error.message
            : String(error);
      await failLoad(prisma, translation.id, NIV_TRANSLATION_CODE, reason);
    }
    throw error;
  }
}
