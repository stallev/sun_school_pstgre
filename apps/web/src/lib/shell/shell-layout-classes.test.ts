import { describe, expect, it } from "vitest";
import {
  shellGridClassName,
  shellViewContainerClassName,
} from "./shell-layout-classes";

describe("shellViewContainerClassName", () => {
  it("matches ADR-017 centered container padding", () => {
    expect(shellViewContainerClassName).toContain("max-w-[1600px]");
    expect(shellViewContainerClassName).toContain("mx-auto");
    expect(shellViewContainerClassName).toContain("px-page");
  });
});

describe("shellGridClassName", () => {
  it("centers the sidebar grid with the header shell box", () => {
    expect(shellGridClassName("expanded")).toContain("max-w-[1600px]");
    expect(shellGridClassName("expanded")).toContain("mx-auto");
  });
});
