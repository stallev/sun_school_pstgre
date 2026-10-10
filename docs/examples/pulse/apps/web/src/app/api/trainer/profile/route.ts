import { NextResponse } from "next/server";

import {
  TRAINER_MUTATION_ERROR_CODES,
  updateTrainerProfileSchema,
} from "@pulse/domain";

import { updateTrainerProfile } from "@/data/trainer/update-trainer-profile.server";
import { getMessages } from "@/lib/messages/server";

import type { Messages } from "@/lib/messages/types";

function mapUpdateError(code: string, messages: Messages): string {
  switch (code) {
    case TRAINER_MUTATION_ERROR_CODES.VALIDATION:
      return messages.trainer.editProfile.errors.validation;
    case TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED:
      return messages.trainer.editProfile.errors.unauthorized;
    case TRAINER_MUTATION_ERROR_CODES.FORBIDDEN:
      return messages.trainer.editProfile.errors.forbidden;
    default:
      return messages.trainer.editProfile.errors.generic;
  }
}

export async function POST(request: Request) {
  const messages = await getMessages();
  const body = await request.json().catch(() => null);
  const parsed = updateTrainerProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.trainer.editProfile.errors.validation,
      },
      { status: 400 },
    );
  }

  const result = await updateTrainerProfile(parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { ...result, message: mapUpdateError(result.code, messages) },
      { status: result.code === TRAINER_MUTATION_ERROR_CODES.UNAUTHORIZED ? 401 : 400 },
    );
  }

  return NextResponse.json(result, { status: 200 });
}
