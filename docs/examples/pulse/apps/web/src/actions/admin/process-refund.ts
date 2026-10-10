"use server";

import {
  approveRefundInputSchema,
  REFUND_MUTATION_ERROR_CODES,
  rejectRefundInputSchema,
  type ApproveRefundInput,
  type MutationResult,
  type RejectRefundInput,
} from "@pulse/domain";

import {
  approveRefundMutation,
  rejectRefundMutation,
} from "@/data/admin/process-refund.server";
import { getMessages } from "@/lib/messages/server";


function mapRefundError(code: string, messages: Awaited<ReturnType<typeof getMessages>>): string {
  switch (code) {
    case REFUND_MUTATION_ERROR_CODES.ALREADY_PROCESSED:
      return messages.admin.refunds.alreadyProcessed;
    case REFUND_MUTATION_ERROR_CODES.VALIDATION:
      return messages.admin.refunds.adminCommentRequired;
    default:
      return messages.admin.errors.generic;
  }
}

export async function approveRefundAction(
  input: ApproveRefundInput,
): Promise<MutationResult<{ refundRequestId: string }>> {
  const messages = await getMessages();

  const parsed = approveRefundInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: REFUND_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.admin.errors.validation,
    };
  }

  const result = await approveRefundMutation(parsed.data);
  if (!result.ok) {
    return { ...result, message: mapRefundError(result.code, messages) };
  }

  return result;
}

export async function rejectRefundAction(
  input: RejectRefundInput,
): Promise<MutationResult<{ refundRequestId: string }>> {
  const messages = await getMessages();

  const parsed = rejectRefundInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: REFUND_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.admin.refunds.adminCommentRequired,
    };
  }

  const result = await rejectRefundMutation(parsed.data);
  if (!result.ok) {
    return { ...result, message: mapRefundError(result.code, messages) };
  }

  return result;
}
