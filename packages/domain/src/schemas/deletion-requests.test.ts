import { describe, expect, it } from "vitest";
import {
  createChildDeletionRequestInputSchema,
  createDeletionRequestInputSchema,
  rejectDeletionRequestInputSchema,
} from "./deletion-requests";

const requestId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const pupilId = "88888888-8888-4888-8888-888888888888";

describe("rejectDeletionRequestInputSchema (deletion_requests §8)", () => {
  it("rejects empty reason", () => {
    const result = rejectDeletionRequestInputSchema.safeParse({ requestId, reason: "   " });
    expect(result.success).toBe(false);
  });
});

describe("createDeletionRequestInputSchema", () => {
  it("accepts optional reason", () => {
    expect(createDeletionRequestInputSchema.safeParse({}).success).toBe(true);
    expect(createDeletionRequestInputSchema.safeParse({ reason: "note" }).success).toBe(true);
  });
});

describe("createChildDeletionRequestInputSchema", () => {
  it("requires guardianNote and pupilId", () => {
    expect(createChildDeletionRequestInputSchema.safeParse({ pupilId, guardianNote: "guardian" }).success).toBe(
      true,
    );
    expect(createChildDeletionRequestInputSchema.safeParse({ pupilId, guardianNote: "" }).success).toBe(false);
  });
});
