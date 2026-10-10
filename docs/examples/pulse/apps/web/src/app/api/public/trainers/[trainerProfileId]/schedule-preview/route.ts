import { NextResponse } from "next/server";

import { getTrainerSchedulePreview } from "@/data/trainer/get-trainer-schedule-preview.server";

type RouteContext = {
  params: Promise<{ trainerProfileId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { trainerProfileId } = await context.params;
  const slotDurationMinutes = Number(
    new URL(request.url).searchParams.get("slotDurationMinutes") ?? "60",
  );

  if (!trainerProfileId?.trim() || !Number.isFinite(slotDurationMinutes)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const preview = await getTrainerSchedulePreview(
    trainerProfileId,
    slotDurationMinutes,
  );

  if (!preview) {
    return NextResponse.json({ preview: null });
  }

  return NextResponse.json({ preview });
}
