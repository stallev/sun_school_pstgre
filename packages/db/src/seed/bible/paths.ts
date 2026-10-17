import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

/** RST JSON seeds (bible_seed_contract §4; in git). */
export const RST_DATA_DIR = path.resolve(moduleDir, "../../../../../docs/my_specs/Bible/data/RelSQLData");

export const RST_FILES = {
  books: path.join(RST_DATA_DIR, "bible_book_seed.json"),
  chapters: path.join(RST_DATA_DIR, "bible_chapter_seed.json"),
  verses: path.join(RST_DATA_DIR, "bible_verse_seed.json"),
} as const;
