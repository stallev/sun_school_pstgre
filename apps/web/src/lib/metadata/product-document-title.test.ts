import { describe, expect, it } from "vitest";

import {
  buildProductDocumentTitleTemplate,
  resolveShellRouteDocumentTitle,
} from "@/lib/metadata/product-document-title";
import { pickShellMessages } from "@/lib/messages/shell-messages";

describe("product document title", () => {
  it("builds a localized title template", () => {
    const title = buildProductDocumentTitleTemplate("Воскресная школа");
    expect(title).toEqual({
      default: "Воскресная школа",
      template: "%s — Воскресная школа",
    });
  });

  it("resolves shell routes from pathname", async () => {
    const common = (await import("@/lib/messages/ru/common.json")).default;
    const titles = pickShellMessages(common).screenTitles;
    expect(resolveShellRouteDocumentTitle("/today", common)).toBe(titles.today);
    expect(resolveShellRouteDocumentTitle("/analytics", common)).toBe(titles.analytics);
    expect(resolveShellRouteDocumentTitle("/unknown", common)).toBeNull();
  });
});
