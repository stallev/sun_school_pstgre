import "server-only";

import {
  REFUND_MUTATION_ERROR_CODES,
  REFUND_STATUS,
  requestRefundInputSchema,
  USER_ROLE,
  validateRequestRefund,
  type MutationResult,
  type RequestRefundInput,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import { getMessages } from "@/lib/messages/server";
import type { Messages } from "@/lib/messages/types";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type RequestRefundResult = MutationResult<{ refundRequestId: string }>;

function mapValidationError(
  code: (typeof REFUND_MUTATION_ERROR_CODES)[keyof typeof REFUND_MUTATION_ERROR_CODES],
  messages: Messages,
): RequestRefundResult {
  switch (code) {
    case REFUND_MUTATION_ERROR_CODES.AMOUNT_EXCEEDS_BOOKING:
      return {
        ok: false,
        code,
        message: messages.clientComplaint.errors.amountExceeds,
      };
    case REFUND_MUTATION_ERROR_CODES.DUPLICATE_PENDING:
      return {
        ok: false,
        code,
        message: messages.clientComplaint.errors.duplicateRefund,
      };
    case REFUND_MUTATION_ERROR_CODES.BOOKING_NOT_ELIGIBLE:
      return {
        ok: false,
        code,
        message: messages.clientComplaint.errors.notEligible,
      };
    default:
      return {
        ok: false,
        code: REFUND_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.clientComplaint.errors.validation,
      };
  }
}

export async function requestRefundMutation(
  input: RequestRefundInput,
): Promise<RequestRefundResult> {
  const messages = await getMessages();
  const parsed = requestRefundInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: REFUND_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.clientComplaint.errors.validation,
    };
  }

  const ctx = await getPolicySessionContext();
  if (!ctx || ctx.role !== USER_ROLE.CLIENT) {
    return {
      ok: false,
      code: REFUND_MUTATION_ERROR_CODES.UNAUTHORIZED,
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
      priceCents: true,
      currency: true,
    },
  });

  if (!booking) {
    return {
      ok: false,
      code: REFUND_MUTATION_ERROR_CODES.VALIDATION,
      message: messages.clientComplaint.errors.notEligible,
    };
  }

  const pendingRefund = await prisma.refundRequest.findFirst({
    where: {
      bookingId: booking.id,
      status: REFUND_STATUS.PENDING,
    },
    select: { id: true },
  });

  const validation = validateRequestRefund({
    bookingStatus: booking.status,
    clientId: booking.clientId,
    actorUserId: ctx.userId,
    bookingPriceCents: booking.priceCents,
    amountCents: parsed.data.amountCents,
    hasPendingRefund: pendingRefund !== null,
  });

  if (validation) {
    return mapValidationError(validation.code, messages);
  }

  const refund = await prisma.$transaction(async (tx) => {
    const created = await tx.refundRequest.create({
      data: {
        bookingId: booking.id,
        clientId: ctx.userId,
        amountCents: parsed.data.amountCents,
        currency: booking.currency,
        status: REFUND_STATUS.PENDING,
        reason: parsed.data.reason,
      },
      select: { id: true },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: ctx.userId,
        action: "refund.requested",
        targetType: "refund_request",
        targetId: created.id,
      },
    });

    return created;
  });

  return { ok: true, data: { refundRequestId: refund.id } };
}
