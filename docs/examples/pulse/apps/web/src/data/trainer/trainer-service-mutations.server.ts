import "server-only";

import { revalidateTag, updateTag } from "next/cache";

import {
  TRAINER_SERVICE_MUTATION_ERROR_CODES,
  TRAINER_STATUS,
  createTrainerServiceSchema,
  updateTrainerServiceSchema,
  type CreateTrainerServiceInput,
  type MutationResult,
  type UpdateTrainerServiceInput,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import {
  assertCanMutateTrainerService,
  PolicyError,
} from "@pulse/policy-server";

import { CACHE_TAGS } from "@/lib/cache/tags";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

type ServiceMutationResult<T = { serviceId: string }> = MutationResult<T>;

function mapPolicyError<T = { serviceId: string }>(
  error: PolicyError,
): ServiceMutationResult<T> {
  if (error.code === "UNAUTHORIZED") {
    return { ok: false, code: TRAINER_SERVICE_MUTATION_ERROR_CODES.UNAUTHORIZED };
  }

  return { ok: false, code: TRAINER_SERVICE_MUTATION_ERROR_CODES.FORBIDDEN };
}

async function getOwnedServiceContext(serviceId: string) {
  return getPrisma().trainerService.findFirst({
    where: { id: serviceId },
    select: {
      id: true,
      trainerProfileId: true,
      isActive: true,
      trainerProfile: {
        select: { userId: true, status: true },
      },
    },
  });
}

function invalidateServiceCache(profileId: string, status: string): void {
  updateTag(CACHE_TAGS.trainer(profileId));

  if (status === TRAINER_STATUS.APPROVED) {
    updateTag(CACHE_TAGS.trainersCatalog);
  }
}

function revalidateServiceCache(profileId: string): void {
  revalidateTag(CACHE_TAGS.trainer(profileId), "max");
  revalidateTag(CACHE_TAGS.trainersCatalog, "max");
}

export async function createTrainerService(
  input: CreateTrainerServiceInput,
): Promise<ServiceMutationResult> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return { ok: false, code: TRAINER_SERVICE_MUTATION_ERROR_CODES.UNAUTHORIZED };
  }

  try {
    assertCanMutateTrainerService(ctx, { ownerUserId: ctx.userId });
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error);
    }

    throw error;
  }

  const parsed = createTrainerServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: TRAINER_SERVICE_MUTATION_ERROR_CODES.VALIDATION };
  }

  const profile = await getPrisma().trainerProfile.findUnique({
    where: { userId: ctx.userId },
    select: { id: true, status: true, services: { select: { sortOrder: true } } },
  });

  if (!profile) {
    return { ok: false, code: TRAINER_SERVICE_MUTATION_ERROR_CODES.VALIDATION };
  }

  const nextSortOrder =
    profile.services.reduce((max, service) => Math.max(max, service.sortOrder), -1) + 1;

  const service = await getPrisma().trainerService.create({
    data: {
      trainerProfileId: profile.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      durationMinutes: parsed.data.durationMinutes,
      priceCents: parsed.data.priceCents,
      sortOrder: nextSortOrder,
    },
    select: { id: true },
  });

  invalidateServiceCache(profile.id, profile.status);

  return { ok: true, data: { serviceId: service.id } };
}

export async function updateTrainerService(
  input: UpdateTrainerServiceInput,
): Promise<ServiceMutationResult> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return { ok: false, code: TRAINER_SERVICE_MUTATION_ERROR_CODES.UNAUTHORIZED };
  }

  const parsed = updateTrainerServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: TRAINER_SERVICE_MUTATION_ERROR_CODES.VALIDATION };
  }

  const existing = await getOwnedServiceContext(parsed.data.id);
  if (!existing) {
    return { ok: false, code: TRAINER_SERVICE_MUTATION_ERROR_CODES.NOT_FOUND };
  }

  try {
    assertCanMutateTrainerService(ctx, {
      ownerUserId: existing.trainerProfile.userId,
    });
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError(error);
    }

    throw error;
  }

  await getPrisma().trainerService.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      durationMinutes: parsed.data.durationMinutes,
      priceCents: parsed.data.priceCents,
    },
  });

  invalidateServiceCache(existing.trainerProfileId, existing.trainerProfile.status);

  return { ok: true, data: { serviceId: parsed.data.id } };
}

export async function deleteTrainerService(
  serviceId: string,
): Promise<ServiceMutationResult<Record<string, never>>> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return { ok: false, code: TRAINER_SERVICE_MUTATION_ERROR_CODES.UNAUTHORIZED };
  }

  const existing = await getOwnedServiceContext(serviceId);
  if (!existing) {
    return { ok: false, code: TRAINER_SERVICE_MUTATION_ERROR_CODES.NOT_FOUND };
  }

  try {
    assertCanMutateTrainerService(ctx, {
      ownerUserId: existing.trainerProfile.userId,
    });
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError<Record<string, never>>(error);
    }

    throw error;
  }

  const bookingCount = await getPrisma().booking.count({
    where: { trainerServiceId: serviceId },
  });

  if (bookingCount > 0) {
    return {
      ok: false,
      code: TRAINER_SERVICE_MUTATION_ERROR_CODES.SERVICE_HAS_BOOKINGS,
    };
  }

  await getPrisma().trainerService.delete({
    where: { id: serviceId },
  });

  invalidateServiceCache(existing.trainerProfileId, existing.trainerProfile.status);

  return { ok: true, data: {} };
}

export async function toggleTrainerServiceActive(
  serviceId: string,
): Promise<ServiceMutationResult<{ isActive: boolean }>> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return { ok: false, code: TRAINER_SERVICE_MUTATION_ERROR_CODES.UNAUTHORIZED };
  }

  const existing = await getOwnedServiceContext(serviceId);
  if (!existing) {
    return { ok: false, code: TRAINER_SERVICE_MUTATION_ERROR_CODES.NOT_FOUND };
  }

  try {
    assertCanMutateTrainerService(ctx, {
      ownerUserId: existing.trainerProfile.userId,
    });
  } catch (error) {
    if (error instanceof PolicyError) {
      return mapPolicyError<{ isActive: boolean }>(error);
    }

    throw error;
  }

  const updated = await getPrisma().trainerService.update({
    where: { id: serviceId },
    data: { isActive: !existing.isActive },
    select: { isActive: true },
  });

  revalidateServiceCache(existing.trainerProfileId);

  return { ok: true, data: { isActive: updated.isActive } };
}
