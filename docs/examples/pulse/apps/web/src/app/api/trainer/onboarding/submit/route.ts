import { NextResponse } from "next/server";

import {
  submitTrainerApplicationSchema,
  TRAINER_MUTATION_ERROR_CODES,
} from "@pulse/domain";

import { submitTrainerApplication } from "@/data/trainer/submit-trainer-application.server";
import { getMessages } from "@/lib/messages/server";


export async function POST(request: Request) {
  const messages = await getMessages();
  const body = await request.json().catch(() => null);
  const parsed = submitTrainerApplicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: TRAINER_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.trainer.onboarding.errors.termsRequired,
      },
      { status: 400 },
    );
  }

  const result = await submitTrainerApplication(parsed.data);
  if (!result.ok) {
    const message =
      result.code === TRAINER_MUTATION_ERROR_CODES.APPLICATION_INCOMPLETE
        ? messages.trainer.onboarding.errors.incomplete
        : result.code === TRAINER_MUTATION_ERROR_CODES.ALREADY_APPROVED
          ? messages.trainer.onboarding.errors.alreadyApproved
          : result.code === TRAINER_MUTATION_ERROR_CODES.VALIDATION
            ? messages.trainer.onboarding.errors.termsRequired
            : messages.trainer.onboarding.errors.generic;

    return NextResponse.json({ ...result, message }, { status: 400 });
  }

  return NextResponse.json(result, { status: 200 });
}
