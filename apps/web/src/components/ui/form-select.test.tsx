/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FormSelect } from "@/components/ui/form-select";

describe("FormSelect empty options (P14-CU6 N-path)", () => {
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

  it("disables the trigger and shows emptyHint when options.length === 0", () => {
    act(() => {
      root.render(
        <FormSelect name="gradeId" emptyHint="No groups available" options={[]} />,
      );
    });

    const trigger = container.querySelector('[data-slot="select-trigger"]') as HTMLButtonElement;
    const hidden = container.querySelector('input[type="hidden"][name="gradeId"]') as HTMLInputElement;

    expect(trigger?.disabled).toBe(true);
    expect(trigger?.textContent).toContain("No groups available");
    expect(hidden?.disabled).toBe(true);
  });

  it("uses placeholder as empty hint when emptyHint is omitted", () => {
    act(() => {
      root.render(
        <FormSelect
          name="gradeId"
          placeholder="Choose a group"
          options={[]}
        />,
      );
    });

    const trigger = container.querySelector('[data-slot="select-trigger"]') as HTMLButtonElement;
    expect(trigger?.textContent).toContain("Choose a group");
  });

  it("stays enabled when options are present", () => {
    act(() => {
      root.render(
        <FormSelect
          name="gradeId"
          defaultValue="g1"
          options={[{ value: "g1", label: "Group 1" }]}
        />,
      );
    });

    const trigger = container.querySelector('[data-slot="select-trigger"]') as HTMLButtonElement;
    expect(trigger?.disabled).toBe(false);
  });

  it("shows the option label, not the raw value, before the popup is opened", () => {
    act(() => {
      root.render(
        <FormSelect
          value="9d1f0c2e-0000-4000-8000-000000000001"
          options={[{ value: "9d1f0c2e-0000-4000-8000-000000000001", label: "2026–2027" }]}
        />,
      );
    });

    const trigger = container.querySelector('[data-slot="select-trigger"]') as HTMLButtonElement;
    expect(trigger?.textContent).toContain("2026–2027");
    expect(trigger?.textContent).not.toContain("9d1f0c2e");
  });
});
