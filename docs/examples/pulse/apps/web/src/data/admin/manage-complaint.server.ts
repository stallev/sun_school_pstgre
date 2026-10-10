import "server-only";

import {
  closeComplaintInputSchema,
  COMPLAINT_MUTATION_ERROR_CODES,
  COMPLAINT_STATUS,
  startComplaintReviewInputSchema,
  validateCloseComplaint,
  validateCloseComplaintInput,
  validateStartComplaintReview,
  type CloseComplaintInput,
  type MutationResult,
  type StartComplaintReviewInput,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import { assertCanManageComplaint, PolicyError } from "@pulse/policy-server";

import { getMessages } from "@/lib/messages/server";
import type { Messages } from "@/lib/messages/types";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

type ComplaintMutationResult = MutationResult<{ complaintId: string }>;

function mapPolicyError(error: PolicyError, messages: Messages): ComplaintMutationResult {
  if (error.code === "UNAUTHORIZED") {
    return {
      ok: false,
      code: COMPLAINT_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.admin.errors.unauthorized,
    };
  }

  return {
    ok: false,
    code: COMPLAINT_MUTATION_ERROR_CODES.FORBIDDEN,
    message: messages.admin.errors.forbidden,
  };
}

async function runStartComplaintReviewTransaction(
  actorUserId: string,
  complaintId: string,
  messages: Messages,
): Promise<ComplaintMutationResult> {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const complaint = await tx.complaint.findFirst({
      where: { id: complaintId },
      select: { status: true },
    });

    if (!complaint) {
      return {
        ok: false,
        code: COMPLAINT_MUTATION_ERROR_CODES.NOT_FOUND,
        message: messages.admin.errors.notFound,
      };
    }

    const validation = validateStartComplaintReview({ status: complaint.status });
    if (validation) {
      return {
        ok: false,
        code: COMPLAINT_MUTATION_ERROR_CODES.ALREADY_PROCESSED,
        message: messages.admin.complaints.alreadyProcessed,
      };
    }

    const updated = await tx.complaint.updateMany({
      where: { id: complaintId, status: COMPLAINT_STATUS.OPEN },
      data: { status: COMPLAINT_STATUS.IN_REVIEW },
    });

    if (updated.count === 0) {
      return {
        ok: false,
        code: COMPLAINT_MUTATION_ERROR_CODES.ALREADY_PROCESSED,
        message: messages.admin.complaints.alreadyProcessed,
      };
    }

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "complaint.review_started",
        targetType: "complaint",
        targetId: complaintId,
      },
    });

    return { ok: true, data: { complaintId } };
  });
}

async function runCloseComplaintTransaction(
  actorUserId: string,
  input: CloseComplaintInput,
  messages: Messages,
): Promise<ComplaintMutationResult> {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const complaint = await tx.complaint.findFirst({
      where: { id: input.complaintId },
      select: { status: true },
    });

    if (!complaint) {
      return {
        ok: false,
        code: COMPLAINT_MUTATION_ERROR_CODES.NOT_FOUND,
        message: messages.admin.errors.notFound,
      };
    }

    const validation = validateCloseComplaint({ status: complaint.status });
    if (validation) {
      return {
        ok: false,
        code: COMPLAINT_MUTATION_ERROR_CODES.ALREADY_PROCESSED,
        message: messages.admin.complaints.alreadyProcessed,
      };
    }

    const inputValidation = validateCloseComplaintInput({
      resolution: input.resolution,
      adminNotes: input.adminNotes,
    });
    if (inputValidation) {
      return {
        ok: false,
        code: COMPLAINT_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.admin.complaints.notesRequired,
      };
    }

    const updated = await tx.complaint.updateMany({
      where: {
        id: input.complaintId,
        status: { not: COMPLAINT_STATUS.CLOSED },
      },
      data: {
        status: COMPLAINT_STATUS.CLOSED,
        resolution: input.resolution,
        adminNotes: input.adminNotes?.trim() || null,
        resolvedAt: new Date(),
        resolvedById: actorUserId,
      },
    });

    if (updated.count === 0) {
      return {
        ok: false,
        code: COMPLAINT_MUTATION_ERROR_CODES.ALREADY_PROCESSED,
        message: messages.admin.complaints.alreadyProcessed,
      };
    }

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "complaint.closed",
        targetType: "complaint",
        targetId: input.complaintId,
        metadataJson: { resolution: input.resolution },
      },
    });

    return { ok: true, data: { complaintId: input.complaintId } };
  });
}

export async function startComplaintReviewMutation(
  input: StartComplaintReviewInput,
): Promise<ComplaintMutationResult> {
  const messages = await getMessages();
  const parsed = startComplaintReviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: COMPLAINT_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.admin.errors.validation,
    };
  }

  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return {
      ok: false,
      code: COMPLAINT_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.admin.errors.unauthorized,
    };
  }

  try {
    assertCanManageComplaint(ctx);
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error, messages);
    }

    throw error;
  }

  return runStartComplaintReviewTransaction(ctx.userId, parsed.data.complaintId, messages);
}

export async function closeComplaintMutation(
  input: CloseComplaintInput,
): Promise<ComplaintMutationResult> {
  const messages = await getMessages();
  const parsed = closeComplaintInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: COMPLAINT_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.admin.errors.validation,
    };
  }

  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return {
      ok: false,
      code: COMPLAINT_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.admin.errors.unauthorized,
    };
  }

  try {
    assertCanManageComplaint(ctx);
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error, messages);
    }

    throw error;
  }

  return runCloseComplaintTransaction(ctx.userId, parsed.data, messages);
}
