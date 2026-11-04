/** @vitest-environment happy-dom */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { LessonsGradeFilter } from "@/components/teacher/LessonsGradeFilter";

describe("LessonsGradeFilter", () => {
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

  it("renders grade filter labels from string props", () => {
    act(() => {
      root.render(
        <LessonsGradeFilter
          grades={[
            { gradeId: "g1", name: "5А" },
            { gradeId: "g2", name: "6Б" },
          ]}
          gradeId="g1"
          gradeFilterLabel="Класс"
          gradeFilterApply="Показать"
        />,
      );
    });

    expect(container.textContent).toContain("Класс");
    expect(container.textContent).toContain("Показать");
  });
});
