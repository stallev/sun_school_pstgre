"use server";

import {
  closeComplaintInputSchema,
  COMPLAINT_MUTATION_ERROR_CODES,
  startComplaintReviewInputSchema,
  type CloseComplaintInput,
  type MutationResult,
  type StartComplaintReviewInput,
} from "@pulse/domain";

import {
  closeComplaintMutation,
  startComplaintReviewMutation,
} from "@/data/admin/manage-complaint.server";
import { getMessages } from "@/lib/messages/server";


function mapComplaintError(code: string, messages: Awaited<ReturnType<typeof getMessages>>): string {
  switch (code) {
    case COMPLAINT_MUTATION_ERROR_CODES.ALREADY_PROCESSED:
      return messages.admin.complaints.alreadyProcessed;
    default:
      return messages.admin.errors.generic;
  }
}

export async function startComplaintReviewAction(
  input: StartComplaintReviewInput,
): Promise<MutationResult<{ complaintId: string }>> {
  const messages = await getMessages();

  const parsed = startComplaintReviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: COMPLAINT_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.admin.errors.validation,
    };
  }

  const result = await startComplaintReviewMutation(parsed.data);
  if (!result.ok) {
    return { ...result, message: mapComplaintError(result.code, messages) };
  }

  return result;
}

export async function closeComplaintAction(
  input: CloseComplaintInput,
): Promise<MutationResult<{ complaintId: string }>> {
  const messages = await getMessages();

  const parsed = closeComplaintInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: COMPLAINT_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.admin.errors.validation,
    };
  }

  const result = await closeComplaintMutation(parsed.data);
  if (!result.ok) {
    return { ...result, message: mapComplaintError(result.code, messages) };
  }

  return result;
}
