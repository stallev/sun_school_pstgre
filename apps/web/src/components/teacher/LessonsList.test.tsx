import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const teacherDir = path.dirname(fileURLToPath(import.meta.url));

describe("LessonsList row (P27-T3 D-19)", () => {
  it("uses long month date and checked-state term hint on progress", () => {
    const listRow = fs.readFileSync(path.join(teacherDir, "LessonListRow.tsx"), "utf8");
    const formatDate = fs.readFileSync(
      path.join(teacherDir, "../../lib/lesson/format-lesson-display-date.ts"),
      "utf8",
    );
    expect(formatDate).toMatch(/formatLessonDisplayDate/);
    expect(listRow).toMatch(/CheckedStateProgressLabel/);
    expect(listRow).toMatch(/lessonDateShortLabel/);
  });
});

describe("BricksPageContent (P27-T3)", () => {
  it("passes brick column hints and drops summary rule paragraph", () => {
    const summary = fs.readFileSync(path.join(teacherDir, "BricksPageSummary.tsx"), "utf8");
    const content = fs.readFileSync(path.join(teacherDir, "BricksPageContent.server.tsx"), "utf8");
    const ledger = fs.readFileSync(path.join(teacherDir, "BricksLedgerPanel.tsx"), "utf8");
    expect(summary).not.toMatch(/summaryRule/);
    expect(content).toMatch(/bricks_collected/);
    expect(ledger).not.toMatch(/ledgerSelectPupil[\s\S]*ContentText/);
  });
});
