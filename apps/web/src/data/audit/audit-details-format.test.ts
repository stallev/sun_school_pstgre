import { describe, expect, it } from "vitest";
import adminRu from "@/lib/messages/ru/admin.json";
import {
  buildAuditChangeLines,
  collectAuditDetailIds,
  isHiddenAuditDetailField,
} from "./audit-details-format";

describe("audit-details-format", () => {
  it("hides unknown *Id fields from change lines (D-5)", () => {
    const lines = buildAuditChangeLines(
      adminRu as never,
      null,
      { pupilId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", gradeId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
      {
        pupilLabels: new Map([["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Борисов Тимофей"]]),
        lessonLabels: new Map(),
      },
    );
    expect(lines.some((line) => line.includes("aaaaaaaa"))).toBe(false);
    expect(lines.some((line) => line.includes("bbbbbbbb"))).toBe(false);
    expect(lines).toContain("Ученик: Борисов Тимофей");
  });

  it("hides unknown scalar fields without audit.details keys (D-5)", () => {
    const lines = buildAuditChangeLines(adminRu as never, null, { mystery_field: 1 });
    expect(lines).toEqual(["—"]);
  });

  it("resolves lessonId to lesson label", () => {
    const lines = buildAuditChangeLines(
      adminRu as never,
      null,
      { lessonId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
      {
        pupilLabels: new Map(),
        lessonLabels: new Map([["cccccccc-cccc-4ccc-8ccc-cccccccccccc", "Урок 5"]]),
      },
    );
    expect(lines).toEqual(["Урок 5"]);
  });

  it("collects pupil and lesson ids from values", () => {
    const ids = collectAuditDetailIds({ pupilId: "p1" }, { lessonId: "l1", quantity: 3 });
    expect([...ids.pupilIds]).toEqual(["p1"]);
    expect([...ids.lessonIds]).toEqual(["l1"]);
  });

  it("marks verify and other ids as hidden", () => {
    expect(isHiddenAuditDetailField("verify")).toBe(true);
    expect(isHiddenAuditDetailField("achievementId")).toBe(true);
    expect(isHiddenAuditDetailField("pupilId")).toBe(false);
  });
});
