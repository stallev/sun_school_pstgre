import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LessonVersesAccordion } from "@/components/teacher/LessonVersesAccordion";

const verses = [
  { refLabel: "Еф. 4:32", text: "Будьте друг ко другу добры", hasMissing: false },
  { refLabel: "Мф. 5:3", text: null, hasMissing: true },
];

const render = (list: typeof verses) =>
  renderToStaticMarkup(
    <LessonVersesAccordion title="Стихи урока 3" verses={list} missingLabel="Текст недоступен" />,
  );

describe("LessonVersesAccordion", () => {
  it("renders collapsed by default with a one-line summary of references", () => {
    const html = render(verses);
    expect(html).toContain("<details");
    expect(html).not.toMatch(/<details(?:\s[^>]*)?\sopen[\s>=]/);
    expect(html).toContain("Стихи урока 3");
    expect(html).toContain("Еф. 4:32 · Мф. 5:3");
  });

  it("sticks under the shell header only while open", () => {
    const html = render(verses);
    expect(html).toContain("open:sticky");
    expect(html).toContain("open:top-14");
    const detailsClasses = (html.match(/<details class="([^"]*)"/)?.[1] ?? "").split(" ");
    expect(detailsClasses).not.toContain("sticky");
  });

  it("shows verse text, and the missing label when the translation has no text", () => {
    const html = render(verses);
    expect(html).toContain("Будьте друг ко другу добры");
    expect(html).toContain("Текст недоступен");
  });

  it("renders nothing without verses (review lesson, lesson without verses)", () => {
    expect(render([])).toBe("");
  });
});
