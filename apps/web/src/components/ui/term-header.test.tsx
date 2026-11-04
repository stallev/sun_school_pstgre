/**
 * @vitest-environment happy-dom
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TermHeader } from "@/components/ui/term-header";
import { nonEmptyTerm } from "@/components/ui/term-label";

const uiDir = path.dirname(fileURLToPath(import.meta.url));

describe("TermHeader source", () => {
  it("uses th scope col and TermHint side top", () => {
    const source = fs.readFileSync(path.join(uiDir, "term-header.tsx"), "utf8");
    expect(source).toContain('scope={scope}');
    expect(source).toContain('side="top"');
  });
});

describe("TermHeader render", () => {
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

  it("renders column header with visible term", async () => {
    await act(async () => {
      root.render(
        <table>
          <thead>
            <tr>
              <TermHeader
                term={nonEmptyTerm("Набрано")}
                hint="Баллы за урок."
                ariaLabel="Что значит «Набрано»?"
              />
            </tr>
          </thead>
        </table>,
      );
    });
    const header = container.querySelector("th[scope='col']");
    expect(header?.textContent).toContain("Набрано");
  });
});
