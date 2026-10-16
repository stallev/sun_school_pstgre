import { emptyCounts, type SeedCounts, type SeedTx } from "./types";

/**
 * The 66 books (seed_data_spec §6; database_schema_v1 §`bible_book`). `sortOrder` follows the
 * Russian Synodal canon order (the project's default translation); NIV chapters are joined to
 * the same row by `sortOrder` (bible_seed_contract). Tuple: ru title, en title, ru short, en short, chapters.
 */
type BookRow = readonly [string, string, string, string, number];

const OLD_TESTAMENT: readonly BookRow[] = [
  ["Бытие", "Genesis", "Быт", "Gen", 50],
  ["Исход", "Exodus", "Исх", "Exod", 40],
  ["Левит", "Leviticus", "Лев", "Lev", 27],
  ["Числа", "Numbers", "Чис", "Num", 36],
  ["Второзаконие", "Deuteronomy", "Втор", "Deut", 34],
  ["Иисус Навин", "Joshua", "Нав", "Josh", 24],
  ["Судьи", "Judges", "Суд", "Judg", 21],
  ["Руфь", "Ruth", "Руф", "Ruth", 4],
  ["1 Царств", "1 Samuel", "1Цар", "1Sam", 31],
  ["2 Царств", "2 Samuel", "2Цар", "2Sam", 24],
  ["3 Царств", "1 Kings", "3Цар", "1Kgs", 22],
  ["4 Царств", "2 Kings", "4Цар", "2Kgs", 25],
  ["1 Паралипоменон", "1 Chronicles", "1Пар", "1Chr", 29],
  ["2 Паралипоменон", "2 Chronicles", "2Пар", "2Chr", 36],
  ["Ездра", "Ezra", "Езд", "Ezra", 10],
  ["Неемия", "Nehemiah", "Неем", "Neh", 13],
  ["Есфирь", "Esther", "Есф", "Esth", 10],
  ["Иов", "Job", "Иов", "Job", 42],
  ["Псалтирь", "Psalms", "Пс", "Ps", 150],
  ["Притчи", "Proverbs", "Притч", "Prov", 31],
  ["Екклесиаст", "Ecclesiastes", "Еккл", "Eccl", 12],
  ["Песня Песней", "Song of Solomon", "Песн", "Song", 8],
  ["Исаия", "Isaiah", "Ис", "Isa", 66],
  ["Иеремия", "Jeremiah", "Иер", "Jer", 52],
  ["Плач Иеремии", "Lamentations", "Плач", "Lam", 5],
  ["Иезекииль", "Ezekiel", "Иез", "Ezek", 48],
  ["Даниил", "Daniel", "Дан", "Dan", 12],
  ["Осия", "Hosea", "Ос", "Hos", 14],
  ["Иоиль", "Joel", "Иоил", "Joel", 3],
  ["Амос", "Amos", "Ам", "Amos", 9],
  ["Авдий", "Obadiah", "Авд", "Obad", 1],
  ["Иона", "Jonah", "Иона", "Jonah", 4],
  ["Михей", "Micah", "Мих", "Mic", 7],
  ["Наум", "Nahum", "Наум", "Nah", 3],
  ["Аввакум", "Habakkuk", "Авв", "Hab", 3],
  ["Софония", "Zephaniah", "Соф", "Zeph", 3],
  ["Аггей", "Haggai", "Агг", "Hag", 2],
  ["Захария", "Zechariah", "Зах", "Zech", 14],
  ["Малахия", "Malachi", "Мал", "Mal", 4],
];

const NEW_TESTAMENT: readonly BookRow[] = [
  ["От Матфея", "Matthew", "Мф", "Matt", 28],
  ["От Марка", "Mark", "Мк", "Mark", 16],
  ["От Луки", "Luke", "Лк", "Luke", 24],
  ["От Иоанна", "John", "Ин", "John", 21],
  ["Деяния", "Acts", "Деян", "Acts", 28],
  ["Иакова", "James", "Иак", "Jas", 5],
  ["1 Петра", "1 Peter", "1Пет", "1Pet", 5],
  ["2 Петра", "2 Peter", "2Пет", "2Pet", 3],
  ["1 Иоанна", "1 John", "1Ин", "1John", 5],
  ["2 Иоанна", "2 John", "2Ин", "2John", 1],
  ["3 Иоанна", "3 John", "3Ин", "3John", 1],
  ["Иуды", "Jude", "Иуд", "Jude", 1],
  ["Римлянам", "Romans", "Рим", "Rom", 16],
  ["1 Коринфянам", "1 Corinthians", "1Кор", "1Cor", 16],
  ["2 Коринфянам", "2 Corinthians", "2Кор", "2Cor", 13],
  ["Галатам", "Galatians", "Гал", "Gal", 6],
  ["Ефесянам", "Ephesians", "Еф", "Eph", 6],
  ["Филиппийцам", "Philippians", "Флп", "Phil", 4],
  ["Колоссянам", "Colossians", "Кол", "Col", 4],
  ["1 Фессалоникийцам", "1 Thessalonians", "1Фес", "1Thess", 5],
  ["2 Фессалоникийцам", "2 Thessalonians", "2Фес", "2Thess", 3],
  ["1 Тимофею", "1 Timothy", "1Тим", "1Tim", 6],
  ["2 Тимофею", "2 Timothy", "2Тим", "2Tim", 4],
  ["Титу", "Titus", "Тит", "Titus", 3],
  ["Филимону", "Philemon", "Флм", "Phlm", 1],
  ["Евреям", "Hebrews", "Евр", "Heb", 13],
  ["Откровение", "Revelation", "Откр", "Rev", 22],
];

export type BibleBookSeed = {
  sortOrder: number;
  testament: "OT" | "NT";
  titleRu: string;
  titleEn: string;
  shortRu: string;
  shortEn: string;
  chaptersCount: number;
};

const toSeed = (rows: readonly BookRow[], testament: "OT" | "NT", offset: number): BibleBookSeed[] =>
  rows.map(([titleRu, titleEn, shortRu, shortEn, chaptersCount], index) => ({
    sortOrder: offset + index + 1,
    testament,
    titleRu,
    titleEn,
    shortRu,
    shortEn,
    chaptersCount,
  }));

export const BIBLE_BOOKS: readonly BibleBookSeed[] = [
  ...toSeed(OLD_TESTAMENT, "OT", 0),
  ...toSeed(NEW_TESTAMENT, "NT", OLD_TESTAMENT.length),
];

export async function ensureBibleBooks(tx: SeedTx): Promise<SeedCounts> {
  const counts = emptyCounts();
  for (const book of BIBLE_BOOKS) {
    const existing = await tx.bibleBook.findUnique({ where: { sortOrder: book.sortOrder } });
    if (!existing) {
      await tx.bibleBook.create({ data: book });
      counts.created += 1;
      continue;
    }
    const same =
      existing.testament === book.testament &&
      existing.titleRu === book.titleRu &&
      existing.titleEn === book.titleEn &&
      existing.shortRu === book.shortRu &&
      existing.shortEn === book.shortEn &&
      existing.chaptersCount === book.chaptersCount;
    if (!same) {
      await tx.bibleBook.update({ where: { sortOrder: book.sortOrder }, data: book });
      counts.updated += 1;
    }
  }
  return counts;
}
