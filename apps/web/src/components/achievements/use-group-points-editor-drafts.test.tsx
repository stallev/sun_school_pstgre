/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useGroupPointsEditorDrafts } from "@/components/achievements/use-group-points-editor-drafts";
import type {
  GroupPointsEditorData,
  GroupPointsTableRowDto,
} from "@/data/achievements/load-group-points-page.server";
import { collectGroupPointsSaveItems } from "@/lib/achievements/group-points-drafts";

const baseRow = (overridePoints: number | null): GroupPointsTableRowDto => ({
  rowKey: "ach-1:1",
  achievementId: "ach-1",
  tier: 1,
  achievementName: "Test",
  tierLabel: "I",
  conditionLabel: "5",
  globalPoints: 10,
  overridePoints,
  isPenalty: false,
  readOnly: false,
});

const editor = (rows: GroupPointsTableRowDto[]): GroupPointsEditorData => ({
  gradeId: "grade-1",
  gradeName: "Group",
  academicYearId: "year-1",
  yearName: "2025",
  yearClosed: false,
  canMutate: true,
  rows,
  copySourceGrades: [],
  yearOptions: [],
});

const DraftProbe = ({
  editorData,
  onDrafts,
}: {
  editorData: GroupPointsEditorData;
  onDrafts: (drafts: Record<string, string>) => void;
}) => {
  const { drafts } = useGroupPointsEditorDrafts(editorData);
  onDrafts(drafts);
  return null;
};

describe("useGroupPointsEditorDrafts", () => {
  let container: HTMLDivElement;
  let root: Root;
  let latestDrafts: Record<string, string> = {};

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    latestDrafts = {};
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("resets drafts when editor rows gain overrides after copy", async () => {
    const renderWithEditor = (rows: GroupPointsTableRowDto[]) =>
      act(async () => {
        root.render(
          <DraftProbe
            editorData={editor(rows)}
            onDrafts={(drafts) => {
              latestDrafts = drafts;
            }}
          />,
        );
      });

    await renderWithEditor([baseRow(null)]);
    expect(latestDrafts["ach-1:1"]).toBe("");

    await renderWithEditor([baseRow(6)]);
    expect(latestDrafts["ach-1:1"]).toBe("6");

    const save = collectGroupPointsSaveItems([baseRow(6)], latestDrafts, "err");
    expect(save.items).toEqual([]);
  });
});
