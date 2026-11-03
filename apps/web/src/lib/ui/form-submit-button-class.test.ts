import { describe, expect, it } from "vitest";
import { FORM_SUBMIT_BUTTON_CLASS } from "@/lib/ui/form-submit-button-class";

describe("FORM_SUBMIT_BUTTON_CLASS (P24-CU3)", () => {
  it("uses touch h-11 below md and compact h-9 on md+, w-full only below md", () => {
    expect(FORM_SUBMIT_BUTTON_CLASS).toContain("h-11");
    expect(FORM_SUBMIT_BUTTON_CLASS).toContain("md:h-9");
    expect(FORM_SUBMIT_BUTTON_CLASS).toContain("w-full");
    expect(FORM_SUBMIT_BUTTON_CLASS).toContain("md:w-auto");
    expect(FORM_SUBMIT_BUTTON_CLASS).not.toContain("h-12");
  });
});
