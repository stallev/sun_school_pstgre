import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPrisma } from "@/lib/db.server";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { hasServerEnv } from "@/lib/env.server";

export type BibleBookListItem = {
  id: string;
  sortOrder: number;
  testament: string;
  titleRu: string;
  titleEn: string;
  shortRu: string;
  shortEn: string;
  chaptersCount: number;
};

export async function readBibleBooksFromDb(): Promise<BibleBookListItem[]> {
  const db = await getPrisma();
  const rows = await db.bibleBook.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      sortOrder: true,
      testament: true,
      titleRu: true,
      titleEn: true,
      shortRu: true,
      shortEn: true,
      chaptersCount: true,
    },
  });
  return rows;
}

async function readCachedBibleBooks(): Promise<BibleBookListItem[]> {
  "use cache";
  cacheTag(CACHE_TAGS.BIBLE_BOOKS);
  cacheLife("max");
  return readBibleBooksFromDb();
}

export async function listBooks(): Promise<BibleBookListItem[]> {
  if (!hasServerEnv()) return [];
  return readCachedBibleBooks();
}
