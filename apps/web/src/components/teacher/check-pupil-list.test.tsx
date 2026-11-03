import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CheckPupilList, type CheckPupilListItem } from "@/components/teacher/CheckPupilList";

const pupil = (pupilId: string, displayName: string, pointsTotal: number): CheckPupilListItem => ({
  pupilId,
  displayName,
  homeworkChecked: true,
  late: false,
  pointsTotal,
  verseScores: {},
  testScore: null,
  notebookScore: null,
});

const render = (activePupilId: string, leaders: string[]) =>
  renderToStaticMarkup(
    <CheckPupilList
      pupils={[pupil("a", "Анна", 25), pupil("b", "Борис", 12)]}
      activePupilId={activePupilId}
      lateLabel="позже"
      listLabel="Ученики"
      statusChecked="проверен"
      statusUnchecked="не проверен"
      statusPartial="частично"
      topScorerIds={new Set(leaders)}
      topScorerLabel="Лучший результат урока"
      onSelect={() => undefined}
    />,
  );

const itemFor = (html: string, name: string) =>
  html.split("<li>").find((chunk) => chunk.includes(name)) ?? "";

describe("CheckPupilList lesson leader (§5.2в)", () => {
  it("highlights the leader with gold fill, a text label and no one else", () => {
    const html = render("b", ["a"]);
    expect(itemFor(html, "Анна")).toContain("bg-gold-soft");
    expect(itemFor(html, "Анна")).toContain("Лучший результат урока");
    expect(itemFor(html, "Борис")).not.toContain("bg-gold-soft");
    expect(itemFor(html, "Борис")).not.toContain("Лучший результат урока");
  });

  it("keeps the active leader selected with the cobalt ring", () => {
    const html = render("a", ["a"]);
    expect(itemFor(html, "Анна")).toContain("bg-gold-soft");
    expect(itemFor(html, "Анна")).toContain("ring-cobalt-ink");
    expect(itemFor(html, "Анна")).toContain('aria-current="true"');
  });

  it("does not highlight anyone without leaders", () => {
    expect(render("a", [])).not.toContain("bg-gold-soft");
  });
});
