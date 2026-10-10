import { z } from "zod";

export const requestRefundInputSchema = z.object({
  bookingId: z.string().uuid(),
  amountCents: z.coerce.number().int().positive(),
  reason: z.string().trim().min(10).max(2000),
});

export type RequestRefundInput = z.infer<typeof requestRefundInputSchema>;

export const approveRefundInputSchema = z.object({
  refundRequestId: z.string().uuid(),
  adminComment: z.string().trim().max(2000).optional(),
});

export type ApproveRefundInput = z.infer<typeof approveRefundInputSchema>;

export const rejectRefundInputSchema = z.object({
  refundRequestId: z.string().uuid(),
  adminComment: z.string().trim().min(10).max(2000),
});

export type RejectRefundInput = z.infer<typeof rejectRefundInputSchema>;
