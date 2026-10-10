import { z } from "zod";

import { COMPLAINT_PRIORITIES } from "../types/complaint-priority";
import { COMPLAINT_RESOLUTIONS } from "../types/complaint-resolution";
import {
  complaintResolutionRequiresNotes,
  COMPLAINT_RESOLUTION_NOTES_MIN_LENGTH,
} from "../types/complaint-resolution";

export const fileComplaintInputSchema = z.object({
  bookingId: z.string().uuid(),
  category: z.string().trim().min(2).max(100),
  description: z.string().trim().min(20).max(2000),
});

export type FileComplaintInput = z.infer<typeof fileComplaintInputSchema>;

export const startComplaintReviewInputSchema = z.object({
  complaintId: z.string().uuid(),
});

export type StartComplaintReviewInput = z.infer<
  typeof startComplaintReviewInputSchema
>;

export const closeComplaintInputSchema = z
  .object({
    complaintId: z.string().uuid(),
    resolution: z.enum(COMPLAINT_RESOLUTIONS),
    adminNotes: z.string().trim().max(2000).optional(),
  })
  .superRefine((value, ctx) => {
    if (!complaintResolutionRequiresNotes(value.resolution)) {
      return;
    }

    const notes = value.adminNotes?.trim() ?? "";
    if (notes.length < COMPLAINT_RESOLUTION_NOTES_MIN_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adminNotes"],
        message: "Admin notes required for this resolution",
      });
    }
  });

export type CloseComplaintInput = z.infer<typeof closeComplaintInputSchema>;

export const updateComplaintPriorityInputSchema = z.object({
  complaintId: z.string().uuid(),
  priority: z.enum(COMPLAINT_PRIORITIES),
});

export type UpdateComplaintPriorityInput = z.infer<
  typeof updateComplaintPriorityInputSchema
>;
