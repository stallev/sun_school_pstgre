import { AUDIT_ACTION, AUDIT_ENTITY_TYPE } from "@sunschool/domain";
import { describe, expect, it, vi } from "vitest";
import adminRu from "@/lib/messages/ru/admin.json";
import { buildAuditChangeLines } from "./audit-details-format";
import { mapAuditRowsToDto } from "./map-audit-rows.server";

describe("buildAuditChangeLines", () => {
  it("formats scalar field changes with dictionary labels", () => {
    const lines = buildAuditChangeLines(
      adminRu as never,
      { present: false, notebookScore: 8 },
      { present: true, notebookScore: 9 },
    );
    expect(lines).toContain("Присутствие: да");
    expect(lines).toContain("Тетрадь: 9");
  });

  it("returns em dash line when values are empty objects", () => {
    const lines = buildAuditChangeLines(adminRu as never, {}, {});
    expect(lines).toEqual(["—"]);
  });

  it("hides unknown field codes from change lines", () => {
    const lines = buildAuditChangeLines(adminRu as never, null, { mystery_field: 1 });
    expect(lines).toEqual(["—"]);
  });
});

describe("mapAuditRowsToDto", () => {
  it("formats missing homework_check row as deleted pupil and lesson unspecified (D-7)", async () => {
    const entityId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const db = {
      homeworkCheck: { findMany: vi.fn().mockResolvedValue([]) },
      appUser: { findMany: vi.fn().mockResolvedValue([]) },
      pupil: { findMany: vi.fn().mockResolvedValue([]) },
      lesson: { findMany: vi.fn().mockResolvedValue([]) },
      grade: { findMany: vi.fn().mockResolvedValue([]) },
      achievement: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const entries = await mapAuditRowsToDto(
      db as never,
      [
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          occurredAt: new Date("2026-01-01T00:00:00.000Z"),
          actorUserId: null,
          source: "USER",
          entityType: AUDIT_ENTITY_TYPE.HOMEWORK_CHECK,
          entityId,
          action: AUDIT_ACTION.CHECK_CORRECTED,
          oldValue: null,
          newValue: { present: true },
          reason: null,
        },
      ],
      adminRu as never,
      { person: { deleted_user: "Удалён #{ordinal}" } } as never,
    );
    expect(entries[0]?.entityDisplay).toBe("Проверка ДЗ · Удалённый ученик · урок не указан");
    expect(db.homeworkCheck.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [entityId] } } }),
    );
  });
});
