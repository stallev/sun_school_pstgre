import { describe, expect, it } from "vitest";
import {
  shellGridClassName,
  shellViewContainerClassName,
} from "./shell-layout-classes";

describe("shellViewContainerClassName", () => {
  it("matches ADR-017 centered container padding", () => {
    expect(shellViewContainerClassName).toContain("max-w-[1600px]");
    expect(shellViewContainerClassName).toContain("mx-auto");
    expect(shellViewContainerClassName).toContain("px-4");
    expect(shellViewContainerClassName).toContain("sm:px-6");
    expect(shellViewContainerClassName).toContain("lg:px-8");
  });
});

describe("shellGridClassName", () => {
  it("centers the sidebar grid with the header shell box", () => {
    expect(shellGridClassName(false)).toContain("max-w-[1600px]");
    expect(shellGridClassName(false)).toContain("mx-auto");
  });
});
