/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BricksPageSummary } from "@/components/teacher/BricksPageSummary";

describe("BricksPageSummary (D-1)", () => {
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

  it("shows «К выдаче» before amount", () => {
    act(() => {
      root.render(
        <BricksPageSummary
          totalToIssue={1057}
          negativeBalanceCount={0}
          messages={
            {
              summaryRule: "rule",
              summaryToIssueAmount: ": {total}",
              summaryNegative: "neg {count}",
            } as Parameters<typeof BricksPageSummary>[0]["messages"]
          }
          toIssueGlossary={{ term: "К выдаче", hint: "Подсказка." }}
          termHintAriaLabel="Что значит «{term}»?"
        />,
      );
    });
    const text = container.textContent ?? "";
    expect(text.indexOf("К выдаче")).toBeLessThan(text.indexOf(": 1057"));
    expect(text).toContain(": 1057");
  });
});
