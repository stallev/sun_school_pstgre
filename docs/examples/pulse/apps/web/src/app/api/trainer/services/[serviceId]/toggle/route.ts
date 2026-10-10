import { NextResponse } from "next/server";

import { TRAINER_SERVICE_MUTATION_ERROR_CODES } from "@pulse/domain";

import { toggleTrainerServiceActive } from "@/data/trainer/trainer-service-mutations.server";
import { getMessages } from "@/lib/messages/server";


export async function POST(
  _request: Request,
  context: { params: Promise<{ serviceId: string }> },
) {
  const messages = await getMessages();
  const { serviceId } = await context.params;
  const result = await toggleTrainerServiceActive(serviceId);

  if (!result.ok) {
    const message =
      result.code === TRAINER_SERVICE_MUTATION_ERROR_CODES.NOT_FOUND
        ? messages.trainer.services.errors.notFound
        : result.code === TRAINER_SERVICE_MUTATION_ERROR_CODES.UNAUTHORIZED
          ? messages.trainer.services.errors.unauthorized
          : result.code === TRAINER_SERVICE_MUTATION_ERROR_CODES.FORBIDDEN
            ? messages.trainer.services.errors.forbidden
            : messages.trainer.services.toggleError;

    return NextResponse.json(
      { ...result, message },
      {
        status:
          result.code === TRAINER_SERVICE_MUTATION_ERROR_CODES.UNAUTHORIZED
            ? 401
            : 400,
      },
    );
  }

  return NextResponse.json(result, { status: 200 });
}
