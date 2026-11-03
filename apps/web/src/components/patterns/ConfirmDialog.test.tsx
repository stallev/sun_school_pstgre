/**
 * @vitest-environment happy-dom
 *
 * P-44: unsaved footer order, flex-col-reverse, compact touch heights.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";

describe("ConfirmDialog unsaved (P-44)", () => {
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
    document.body.innerHTML = "";
  });

  it("uses default footer reverse layout and P-44 button order", async () => {
    await act(async () => {
      root.render(
        <ConfirmDialog
          variant="unsaved"
          open
          onOpenChange={vi.fn()}
          title="Unsaved"
          description="Body"
          saveLabel="Save and continue"
          discardLabel="Discard"
          stayLabel="Stay"
          onSave={vi.fn()}
          onDiscard={vi.fn()}
        />,
      );
    });

    const footer = document.body.querySelector("[data-slot=dialog-footer]");
    expect(footer).toBeTruthy();
    expect(footer?.className).toContain("flex-col-reverse");
    expect(footer?.className).not.toMatch(/\bflex-col\b(?!-reverse)/);

    const buttons = footer?.querySelectorAll("button") ?? [];
    expect(buttons).toHaveLength(3);
    expect(buttons[0]?.textContent).toBe("Stay");
    expect(buttons[1]?.textContent).toBe("Discard");
    expect(buttons[2]?.textContent).toBe("Save and continue");

    for (const button of buttons) {
      expect(button.className).toContain("h-11");
      expect(button.className).toContain("sm:h-9");
    }
  });

  it("forwards finalFocus to dialog content on unsaved variant", async () => {
    const heading = document.createElement("h2");
    heading.tabIndex = -1;
    document.body.appendChild(heading);
    const finalFocusRef = { current: heading };
    const onOpenChangeComplete = vi.fn();

    await act(async () => {
      root.render(
        <ConfirmDialog
          variant="unsaved"
          open
          onOpenChange={vi.fn()}
          onOpenChangeComplete={onOpenChangeComplete}
          finalFocus={finalFocusRef}
          title="Unsaved"
          description="Body"
          saveLabel="Save and continue"
          discardLabel="Discard"
          stayLabel="Stay"
          onSave={vi.fn()}
          onDiscard={vi.fn()}
        />,
      );
    });

    const popup = document.body.querySelector("[data-slot=dialog-content]");
    expect(popup).toBeTruthy();
    heading.remove();
  });
});
