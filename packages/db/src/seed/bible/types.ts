import type { Prisma } from "../../generated/prisma/client";

export type SeedTx = Prisma.TransactionClient;

export type RstBookRow = {
  edition_code: string;
  title: string;
  short_title: string;
  testament: string;
  sort_order: number;
  chapters_count: number;
};

export type RstChapterRow = {
  edition_code: string;
  book_sort_order: number;
  chapter_number: number;
  verses_count: number;
};

export type RstVerseRow = {
  edition_code: string;
  book_sort_order: number;
  chapter_number: number;
  verse_number: number;
  text: string;
  verse_order: number;
};
