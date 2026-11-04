/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";

describe("TermLabel (ADR-020)", () => {
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

  it("renders visible term before the hint trigger", async () => {
    await act(async () => {
      root.render(
        <TermLabel
          term={nonEmptyTerm("К выдаче")}
          hint="Сколько кирпичиков можно выдать."
          ariaLabel="Что значит «К выдаче»?"
        />,
      );
    });
    expect(container.textContent).toContain("К выдаче");
    expect(container.querySelector('button[aria-label="Что значит «К выдаче»?"]')).not.toBeNull();
  });

  it("rejects empty term at runtime", () => {
    expect(() => nonEmptyTerm("")).toThrow(/non-empty/i);
  });

  it("reason variant exposes aria-disabled and opens on click", async () => {
    await act(async () => {
      root.render(
        <TermLabel
          variant="reason"
          term={nonEmptyTerm("Недоступно")}
          hint="Нет прав на этот пункт."
          ariaLabel="Почему недоступно"
        />,
      );
    });
    const trigger = container.querySelector("button");
    expect(trigger?.getAttribute("aria-disabled")).toBe("true");
    await act(async () => {
      trigger?.click();
    });
    expect(document.body.textContent).toContain("Нет прав на этот пункт.");
  });
});
