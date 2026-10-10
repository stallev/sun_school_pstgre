/**
 * NIV book display names (as in docs/data/niv_src/Bible-niv/Books.json and per-book JSON `book`)
 * → short_title for bible_book.short_title (unique per edition).
 *
 * | sort | Books.json name      | short_title |
 * |-----:|----------------------|-------------|
 * |    1 | Genesis              | Gen         |
 * |    2 | Exodus               | Exod        |
 * |    3 | Leviticus            | Lev         |
 * |    4 | Numbers              | Num         |
 * |    5 | Deuteronomy          | Deut        |
 * |    6 | Joshua               | Josh        |
 * |    7 | Judges               | Judg        |
 * |    8 | Ruth                 | Ruth        |
 * |    9 | 1 Samuel             | 1Sam        |
 * |   10 | 2 Samuel             | 2Sam        |
 * |   11 | 1 Kings              | 1Kgs        |
 * |   12 | 2 Kings              | 2Kgs        |
 * |   13 | 1 Chronicles         | 1Chr        |
 * |   14 | 2 Chronicles         | 2Chr        |
 * |   15 | Ezra                 | Ezra        |
 * |   16 | Nehemiah             | Neh         |
 * |   17 | Esther               | Esth        |
 * |   18 | Job                  | Job         |
 * |   19 | Psalms               | Ps          |
 * |   20 | Proverbs             | Prov        |
 * |   21 | Ecclesiastes         | Eccl        |
 * |   22 | Song Of Solomon      | Song        |
 * |   23 | Isaiah               | Isa         |
 * |   24 | Jeremiah             | Jer         |
 * |   25 | Lamentations         | Lam         |
 * |   26 | Ezekiel              | Ezek        |
 * |   27 | Daniel               | Dan         |
 * |   28 | Hosea                | Hos         |
 * |   29 | Joel                 | Joel        |
 * |   30 | Amos                 | Amos        |
 * |   31 | Obadiah              | Obad        |
 * |   32 | Jonah                | Jon         |
 * |   33 | Micah                | Mic         |
 * |   34 | Nahum                | Nah         |
 * |   35 | Habakkuk             | Hab         |
 * |   36 | Zephaniah            | Zeph        |
 * |   37 | Haggai               | Hag         |
 * |   38 | Zechariah            | Zech        |
 * |   39 | Malachi              | Mal         |
 * |   40 | Matthew              | Matt        |
 * |   41 | Mark                 | Mark        |
 * |   42 | Luke                 | Luke        |
 * |   43 | John                 | John        |
 * |   44 | Acts                 | Acts        |
 * |   45 | Romans               | Rom         |
 * |   46 | 1 Corinthians        | 1Cor        |
 * |   47 | 2 Corinthians        | 2Cor        |
 * |   48 | Galatians            | Gal         |
 * |   49 | Ephesians            | Eph         |
 * |   50 | Philippians          | Phil        |
 * |   51 | Colossians           | Col         |
 * |   52 | 1 Thessalonians      | 1Thess      |
 * |   53 | 2 Thessalonians      | 2Thess      |
 * |   54 | 1 Timothy            | 1Tim        |
 * |   55 | 2 Timothy            | 2Tim        |
 * |   56 | Titus                | Titus       |
 * |   57 | Philemon             | Phlm        |
 * |   58 | Hebrews              | Heb         |
 * |   59 | James                | Jas         |
 * |   60 | 1 Peter              | 1Pet        |
 * |   61 | 2 Peter              | 2Pet        |
 * |   62 | 1 John               | 1John       |
 * |   63 | 2 John               | 2John       |
 * |   64 | 3 John               | 3John       |
 * |   65 | Jude                 | Jude        |
 * |   66 | Revelation           | Rev         |
 */
export const NIV_BOOK_SHORT_TITLES = {
  Genesis: "Gen",
  Exodus: "Exod",
  Leviticus: "Lev",
  Numbers: "Num",
  Deuteronomy: "Deut",
  Joshua: "Josh",
  Judges: "Judg",
  Ruth: "Ruth",
  "1 Samuel": "1Sam",
  "2 Samuel": "2Sam",
  "1 Kings": "1Kgs",
  "2 Kings": "2Kgs",
  "1 Chronicles": "1Chr",
  "2 Chronicles": "2Chr",
  Ezra: "Ezra",
  Nehemiah: "Neh",
  Esther: "Esth",
  Job: "Job",
  Psalms: "Ps",
  Proverbs: "Prov",
  Ecclesiastes: "Eccl",
  "Song Of Solomon": "Song",
  Isaiah: "Isa",
  Jeremiah: "Jer",
  Lamentations: "Lam",
  Ezekiel: "Ezek",
  Daniel: "Dan",
  Hosea: "Hos",
  Joel: "Joel",
  Amos: "Amos",
  Obadiah: "Obad",
  Jonah: "Jon",
  Micah: "Mic",
  Nahum: "Nah",
  Habakkuk: "Hab",
  Zephaniah: "Zeph",
  Haggai: "Hag",
  Zechariah: "Zech",
  Malachi: "Mal",
  Matthew: "Matt",
  Mark: "Mark",
  Luke: "Luke",
  John: "John",
  Acts: "Acts",
  Romans: "Rom",
  "1 Corinthians": "1Cor",
  "2 Corinthians": "2Cor",
  Galatians: "Gal",
  Ephesians: "Eph",
  Philippians: "Phil",
  Colossians: "Col",
  "1 Thessalonians": "1Thess",
  "2 Thessalonians": "2Thess",
  "1 Timothy": "1Tim",
  "2 Timothy": "2Tim",
  Titus: "Titus",
  Philemon: "Phlm",
  Hebrews: "Heb",
  James: "Jas",
  "1 Peter": "1Pet",
  "2 Peter": "2Pet",
  "1 John": "1John",
  "2 John": "2John",
  "3 John": "3John",
  Jude: "Jude",
  Revelation: "Rev",
};

/** Protestant canon: books 1–39 OT, 40–66 NT (matches RST sort_order split). */
export const NIV_OT_BOOK_COUNT = 39;

export function testamentForSortOrder(sortOrder) {
  return sortOrder <= NIV_OT_BOOK_COUNT ? "OT" : "NT";
}

export function shortTitleForBookName(bookName) {
  const short = NIV_BOOK_SHORT_TITLES[bookName];
  if (!short) {
    throw new Error(`Нет short_title для книги: ${JSON.stringify(bookName)}`);
  }
  return short;
}
