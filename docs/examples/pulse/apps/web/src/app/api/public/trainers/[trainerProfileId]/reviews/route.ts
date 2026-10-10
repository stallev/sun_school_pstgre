import { NextResponse } from "next/server";

import { getTrainerReviews } from "@/data/trainer/get-trainer-reviews.server";

type RouteContext = {
  params: Promise<{ trainerProfileId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { trainerProfileId } = await context.params;

  if (!trainerProfileId?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const reviews = await getTrainerReviews(trainerProfileId);
  return NextResponse.json({ reviews });
}
