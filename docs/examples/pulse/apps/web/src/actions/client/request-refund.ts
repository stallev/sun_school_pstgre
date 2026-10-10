"use server";

import {
  REFUND_MUTATION_ERROR_CODES,
  requestRefundInputSchema,
  type MutationResult,
  type RequestRefundInput,
} from "@pulse/domain";

import { requestRefundMutation } from "@/data/client/request-refund.server";
import { getMessages } from "@/lib/messages/server";


export async function requestRefundAction(
  input: RequestRefundInput,
): Promise<MutationResult<{ refundRequestId: string }>> {
  const messages = await getMessages();

  const parsed = requestRefundInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: REFUND_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.clientComplaint.errors.validation,
    };
  }

  return requestRefundMutation(parsed.data);
}
