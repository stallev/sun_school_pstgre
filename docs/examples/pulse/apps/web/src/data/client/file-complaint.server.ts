import "server-only";

import {
  COMPLAINT_MUTATION_ERROR_CODES,
  COMPLAINT_PRIORITY,
  COMPLAINT_STATUS,
  fileComplaintInputSchema,
  USER_ROLE,
  validateFileComplaint,
  type FileComplaintInput,
  type MutationResult,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import { PolicyError } from "@pulse/policy-server";

import { getMessages } from "@/lib/messages/server";
import type { Messages } from "@/lib/messages/types";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type FileComplaintResult = MutationResult<{ complaintId: string }>;

function mapValidationError(
  code: (typeof COMPLAINT_MUTATION_ERROR_CODES)[keyof typeof COMPLAINT_MUTATION_ERROR_CODES],
  messages: Messages,
): FileComplaintResult {
  switch (code) {
    case COMPLAINT_MUTATION_ERROR_CODES.DUPLICATE_OPEN:
      return {
        ok: false,
        code,
        message: messages.clientComplaint.errors.duplicate,
      };
    case COMPLAINT_MUTATION_ERROR_CODES.BOOKING_NOT_ELIGIBLE:
      return {
        ok: false,
        code,
        message: messages.clientComplaint.errors.notEligible,
      };
    case COMPLAINT_MUTATION_ERROR_CODES.FORBIDDEN:
      return {
        ok: false,
        code,
        message: messages.admin.errors.forbidden,
      };
    default:
      return {
        ok: false,
        code: COMPLAINT_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.clientComplaint.errors.validation,
      };
  }
}

export async function fileComplaintMutation(
  input: FileComplaintInput,
): Promise<FileComplaintResult> {
  const messages = await getMessages();
  const parsed = fileComplaintInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: COMPLAINT_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.clientComplaint.errors.validation,
    };
  }

  const ctx = await getPolicySessionContext();
  if (!ctx || ctx.role !== USER_ROLE.CLIENT) {
    return {
      ok: false,
      code: COMPLAINT_MUTATION_ERROR_CODES.UNAUTHORIZED,
      message: messages.admin.errors.unauthorized,
    };
  }

  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: { id: parsed.data.bookingId, clientId: ctx.userId },
    select: {
      id: true,
      status: true,
      clientId: true,
      trainerProfileId: true,
    },
  });

  if (!booking) {
    return {
      ok: false,
      code: COMPLAINT_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.clientComplaint.errors.notEligible,
    };
  }

  const openComplaint = await prisma.complaint.findFirst({
    where: {
      targetBookingId: booking.id,
      status: { in: [COMPLAINT_STATUS.OPEN, COMPLAINT_STATUS.IN_REVIEW] },
    },
    select: { id: true },
  });

  const validation = validateFileComplaint({
    bookingStatus: booking.status,
    clientId: booking.clientId,
    actorUserId: ctx.userId,
    hasOpenComplaint: openComplaint !== null,
  });

  if (validation) {
    return mapValidationError(validation.code, messages);
  }

  try {
    const complaint = await prisma.$transaction(async (tx) => {
      const created = await tx.complaint.create({
        data: {
          reporterId: ctx.userId,
          targetBookingId: booking.id,
          targetTrainerId: booking.trainerProfileId,
          status: COMPLAINT_STATUS.OPEN,
          priority: COMPLAINT_PRIORITY.MEDIUM,
          reason: `${parsed.data.category}: ${parsed.data.description}`,
        },
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: ctx.userId,
          action: "complaint.filed",
          targetType: "complaint",
          targetId: created.id,
        },
      });

      return created;
    });

    return { ok: true, data: { complaintId: complaint.id } };
  } catch (error) {
    if (error instanceof PolicyError) {
      return {
        ok: false,
        code: COMPLAINT_MUTATION_ERROR_CODES.FORBIDDEN,
        message: messages.admin.errors.forbidden,
      };
    }

    throw error;
  }
}
