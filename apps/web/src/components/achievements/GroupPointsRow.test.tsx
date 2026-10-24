/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GroupPointsRow } from "@/components/achievements/GroupPointsRow";
import type { GroupPointsTableRowDto } from "@/data/achievements/load-group-points-page.server";
import type { GroupPointsMessages } from "@/lib/messages/group-points-messages";

const messages = {
  practiceReadOnly: "Practice read-only",
  placeholderInherit: "Inherit",
  differsLabel: "Custom",
  resetRow: "Reset",
} as GroupPointsMessages;

const row: GroupPointsTableRowDto = {
  rowKey: "ach-1:1",
  achievementId: "ach-1",
  tier: 1,
  achievementName: "Achievement",
  tierLabel: "I",
  conditionLabel: "5",
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
});
