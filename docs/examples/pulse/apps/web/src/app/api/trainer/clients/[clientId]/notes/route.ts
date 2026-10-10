import { NextResponse } from "next/server";

import { SCHEDULE_MUTATION_ERROR_CODES } from "@pulse/domain";

import { upsertTrainerClientNoteMutation } from "@/data/trainer/upsert-trainer-client-note.server";
import { getMessages } from "@/lib/messages/server";


export async function POST(
  request: Request,
  context: { params: Promise<{ clientId: string }> },
) {
  const messages = await getMessages();
  const { clientId } = await context.params;
  const body = (await request.json()) as { notes?: string };
  const result = await upsertTrainerClientNoteMutation({
    clientId,
    notes: body.notes ?? "",
  });

  if (!result.ok) {
    const message =
      result.code === SCHEDULE_MUTATION_ERROR_CODES.UNAUTHORIZED
        ? messages.trainer.clients.errors.unauthorized
        : result.code === SCHEDULE_MUTATION_ERROR_CODES.FORBIDDEN
          ? messages.trainer.clients.errors.forbidden
          : messages.trainer.clients.errors.notesSave;

    return NextResponse.json(
      { ...result, message },
      {
        status:
          result.code === SCHEDULE_MUTATION_ERROR_CODES.UNAUTHORIZED ? 401 : 400,
      },
    );
  }

  return NextResponse.json(result, { status: 200 });
}
