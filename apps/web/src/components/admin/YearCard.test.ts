import { describe, expect, it } from "vitest";
import { formatApprovalSubmitLabel, formatApprovalWaitingLabel } from "@/lib/messages/admin-messages";

describe("YearCard copy helpers", () => {
  it("uses submitted today label for zero waiting days", () => {
    expect(formatApprovalWaitingLabel("Подана сегодня", "Ожидает {count} дн.", 0)).toBe(
      "Подана сегодня",
    );
  });

  it("builds teacher approve label with group name", () => {
    const label = formatApprovalSubmitLabel(
      {
        approve: "Одобрить",
        approveAsTeacher: "Одобрить как учителя · {group}",
        approveAsAdmin: "Одобрить как администратора",
      },
      {
        adminSelected: false,
        teacherSelected: true,
        selectedGradeNames: ["Младшая"],
      },
    );
    expect(label).toBe("Одобрить как учителя · Младшая");
  });
});
