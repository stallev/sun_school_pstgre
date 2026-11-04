/**
 * @vitest-environment happy-dom
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import commonEn from "@/lib/messages/en/common.json";
import commonRu from "@/lib/messages/ru/common.json";
import {
  GLOSSARY_TERM_KEYS,
  pickGlossaryMessages,
} from "@/lib/messages/pick-glossary-messages";
import { TermHint } from "@/components/ui/term-hint";

const uiDir = path.dirname(fileURLToPath(import.meta.url));

const MAX_GLOSSARY_HINT_LENGTH = 200;

describe("glossary dictionary (P25-T4)", () => {
  it("keeps ru/en hint strings within 200 characters", () => {
    for (const locale of [commonRu, commonEn] as const) {
      const glossary = pickGlossaryMessages(locale);
      for (const key of GLOSSARY_TERM_KEYS) {
        expect(glossary[key].hint.length).toBeLessThanOrEqual(MAX_GLOSSARY_HINT_LENGTH);
      }
    }
  });

  it("defines every glossary key in ru and en common.json", () => {
    for (const key of GLOSSARY_TERM_KEYS) {
      expect(commonRu.glossary?.[key]?.term).toBeTypeOf("string");
      expect(commonRu.glossary?.[key]?.hint).toBeTypeOf("string");
      expect(commonEn.glossary?.[key]?.term).toBeTypeOf("string");
      expect(commonEn.glossary?.[key]?.hint).toBeTypeOf("string");
    }
  });
});

describe("TermHint source (UX-03 D-17)", () => {
  it("uses Base UI popover, CircleHelp, touch padding and motion-reduce", () => {
    const source = fs.readFileSync(path.join(uiDir, "term-hint.tsx"), "utf8");
    expect(source).toContain("@base-ui/react/popover");
    expect(source).toContain("CircleHelp");
    expect(source).toContain("after:-inset-y-1");
    expect(source).toContain("motion-reduce:transition-none");
    expect(source).toContain("aria-expanded");
    expect(source).toContain("aria-controls");
  });

  it("extends touch hit area on width and height at every breakpoint (≥44px with size-9)", () => {
    const source = fs.readFileSync(path.join(uiDir, "term-hint.tsx"), "utf8");
    expect(source).toContain("after:-inset-x-1");
    expect(source).not.toContain("after:inset-x-0");
    expect(source).not.toContain("max-md:after:-inset-y-1");
  });
});

describe("TermHint interaction", () => {
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

  it("opens on click and closes on Escape", async () => {
    await act(async () => {
      root.render(<TermHint term="тест" hint="Подсказка для теста." />);
    });

    const trigger = container.querySelector("button");
    expect(trigger).not.toBeNull();
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(trigger?.getAttribute("aria-label")).toBe("тест");

    await act(async () => {
      trigger?.click();
    });
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    expect(document.body.textContent).toContain("Подсказка для теста.");

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps only one hint open when two sit side by side", async () => {
    await act(async () => {
      root.render(
        <div>
          <TermHint term="А" hint="Первая." />
          <TermHint term="Б" hint="Вторая." />
        </div>,
      );
    });

    const triggers = container.querySelectorAll("button");
    expect(triggers.length).toBe(2);

    await act(async () => {
      triggers[0]?.click();
    });
    expect(triggers[0]?.getAttribute("aria-expanded")).toBe("true");
    expect(triggers[1]?.getAttribute("aria-expanded")).toBe("false");

    await act(async () => {
      triggers[1]?.click();
    });
    expect(triggers[0]?.getAttribute("aria-expanded")).toBe("false");
    expect(triggers[1]?.getAttribute("aria-expanded")).toBe("true");
  });
});
