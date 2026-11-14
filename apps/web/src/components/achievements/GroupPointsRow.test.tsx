/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GroupPointsCard } from "@/components/achievements/GroupPointsCard";
import { GroupPointsRow } from "@/components/achievements/GroupPointsRow";
import type { GroupPointsTableRowDto } from "@/data/achievements/load-group-points-page.server";
import type { GroupPointsMessages } from "@/lib/messages/group-points-messages";

const messages = {
  practiceReadOnly: "Practice read-only",
  placeholderInherit: "Inherit",
  differsLabel: "Custom",
  resetRow: "Reset",
  inactiveBadge: "Inactive",
  detailsShow: "How it is earned",
  detailsHide: "Hide description",
  noDescription: "No description yet",
  conditionSeries: "{length} in a row",
} as GroupPointsMessages;

const row: GroupPointsTableRowDto = {
  rowKey: "ach-1:1",
  achievementId: "ach-1",
  tier: 1,
  achievementName: "Achievement",
  tierLabel: "I",
  conditionLabel: "5",
  ruleType: "SERIES",
  tierLength: 5,
  description: null,
  isActive: true,
  globalPoints: 10,
  overridePoints: 4,
  isPenalty: false,
  readOnly: false,
};

describe("GroupPointsRow read-only group column", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders override points when teacher cannot edit (closed year)", async () => {
    await act(async () => {
      root.render(
        <table>
          <tbody>
            <GroupPointsRow
              row={row}
              draftValue=""
              canEdit={false}
              differs={false}
              messages={messages}
              onDraftChange={() => {}}
              onReset={() => {}}
            />
          </tbody>
        </table>,
      );
    });

    const cells = container.querySelectorAll("td");
    expect(cells[3]?.textContent).toBe("+10");
    expect(cells[4]?.textContent).toBe("+4");
  });

  const renderRow = (dto: GroupPointsTableRowDto) =>
    act(async () => {
      root.render(
        <table>
          <tbody>
            <GroupPointsRow
              row={dto}
              draftValue=""
              canEdit
              differs={false}
              messages={messages}
              onDraftChange={() => {}}
              onReset={() => {}}
            />
          </tbody>
        </table>,
      );
    });

  it("shows the inactive badge only for globally inactive achievements", async () => {
    await renderRow({ ...row, isActive: false });
    expect(container.textContent).toContain("Inactive");

    await renderRow(row);
    expect(container.textContent).not.toContain("Inactive");
  });

  it("renders the same read-only values in the card layout below lg", async () => {
    await act(async () => {
      root.render(
        <ul>
          <GroupPointsCard
            row={row}
            draftValue=""
            canEdit={false}
            differs={false}
            messages={messages}
            onDraftChange={() => {}}
            onReset={() => {}}
          />
        </ul>,
      );
    });

    expect(container.textContent).toContain("Achievement");
    expect(container.textContent).toContain("+10");
    expect(container.textContent).toContain("+4");
    expect(container.querySelector("table")).toBeNull();
  });

  it("expands the earning description on demand", async () => {
    await renderRow({ ...row, description: "Five lessons in a row" });
    expect(container.textContent).not.toContain("Five lessons in a row");

    const toggle = container.querySelector("button[aria-expanded]") as HTMLButtonElement;
    await act(async () => toggle.click());

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(container.textContent).toContain("Five lessons in a row");
    expect(container.textContent).toContain("5 in a row");
  });
});
