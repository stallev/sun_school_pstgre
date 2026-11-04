import { describe, expect, it } from "vitest";

import { assertSerializableMessages } from "@/lib/messages/assert-serializable-messages";

describe("assertSerializableMessages", () => {
  it("throws when a function is nested in the slice", () => {
    expect(() =>
      assertSerializableMessages({ label: "ok", broken: () => "x" }),
    ).toThrow(/Non-serializable function at messages\.broken/);
  });

  it("accepts plain strings and nested objects", () => {
    expect(() =>
      assertSerializableMessages({ a: "1", b: { c: "2" }, list: ["3"] }),
    ).not.toThrow();
  });
});
